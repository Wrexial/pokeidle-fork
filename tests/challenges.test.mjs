import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolvePokemonEncounter, minLevelForSpecies, ENCOUNTER_TYPE_ABILITY } = await import('../src/game/progression.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { generateIVs } = await import('../src/game/pokemon.js')
const { encounterData, pokemonSpecies } = await import('../src/data/gameData.js')

test('challenge-mode toggles flip their flags', () => {
  const random = gameReducer(initialGameState, { type: 'TOGGLE_CHALLENGE_RANDOMIZER' })
  assert.equal(random.challengeRandomizer, true)
  assert.equal(
    gameReducer(random, { type: 'TOGGLE_CHALLENGE_RANDOMIZER' }).challengeRandomizer,
    false
  )

  const scaled = gameReducer(initialGameState, { type: 'TOGGLE_CHALLENGE_LEVEL_SCALE' })
  assert.equal(scaled.challengeLevelScale, true)
  assert.equal(
    gameReducer(scaled, { type: 'TOGGLE_CHALLENGE_LEVEL_SCALE' }).challengeLevelScale,
    false
  )
})

test('Randomizer rolls a non-legendary species from the dex', () => {
  const route = encounterData.route1,
    encounter = resolvePokemonEncounter(route, [], new Set(), undefined, 1, true, 0)
  assert.ok(pokemonSpecies[encounter.speciesKey], 'should pick a real species')
  assert.ok(!pokemonSpecies[encounter.speciesKey].legendary, 'should not pick a legendary')
  assert.ok(encounter.level >= 1)
})

test('level scaling overrides the encounter level', () => {
  const route = encounterData.route1,
    scaled = resolvePokemonEncounter(route, [], new Set(), undefined, 1, false, 42)
  assert.equal(scaled.level, 42)
})

test('SET_CHALLENGE_MONOTYPE accepts a real type and rejects anything else', () => {
  const water = gameReducer(initialGameState, {
    type: 'SET_CHALLENGE_MONOTYPE',
    payload: { monotype: 'Water' },
  })
  assert.equal(water.challengeMonotype, 'Water')
  assert.equal(
    gameReducer(water, { type: 'SET_CHALLENGE_MONOTYPE', payload: { monotype: 'Nonsense' } })
      .challengeMonotype,
    null
  )
  assert.equal(
    gameReducer(water, { type: 'SET_CHALLENGE_MONOTYPE', payload: { monotype: null } })
      .challengeMonotype,
    null
  )
})

test('starting a run records a valid starter-screen monotype', () => {
  const started = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'squirtle', monotype: 'Water' },
  })
  assert.equal(started.challengeMonotype, 'Water')
  const invalid = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'squirtle', monotype: 'Bogus' },
  })
  assert.equal(invalid.challengeMonotype, null)
})

test('Monotype confines wild encounters to the chosen type', () => {
  /** @type {EncounterData} */
  const data = {
    name: 'test',
    encounters: [
      { speciesKey: 'charmander', weight: 1, minLevel: 5, maxLevel: 5 },
      { speciesKey: 'squirtle', weight: 1, minLevel: 5, maxLevel: 5 },
    ],
  }
  for (let i = 0; i < 50; i++) {
    const fire = resolvePokemonEncounter(data, [], new Set(), undefined, 1, false, 0, 'Fire')
    assert.equal(fire.speciesKey, 'charmander')
  }
  assert.equal(
    resolvePokemonEncounter(data, [], new Set(), undefined, 1, false, 0, 'Water').speciesKey,
    'squirtle'
  )
})

test('Monotype rolls a random on-type Pokemon when the route has none', () => {
  /** @type {EncounterData} */
  const data = {
    name: 'test',
    encounters: [
      { speciesKey: 'charmander', weight: 1, minLevel: 5, maxLevel: 5 },
      { speciesKey: 'squirtle', weight: 1, minLevel: 5, maxLevel: 5 },
    ],
  }
  const seen = new Set()
  for (let i = 0; i < 200; i++) {
    const encounter = resolvePokemonEncounter(data, [], new Set(), undefined, 1, false, 0, 'Grass')
    assert.ok(
      pokemonSpecies[encounter.speciesKey].types.includes('Grass'),
      `${encounter.speciesKey} should be Grass-type`
    )
    assert.equal(encounter.level, 5, 'keeps the route\u2019s level band')
    assert.ok(
      minLevelForSpecies(encounter.speciesKey) <= 5,
      `${encounter.speciesKey} could exist at Lv. 5`
    )
    seen.add(encounter.speciesKey)
  }
  assert.ok(seen.size > 1, 'rolls more than one Grass species')
})

test('minLevelForSpecies floors evolved forms at their evolution gate', () => {
  assert.equal(minLevelForSpecies('charmander'), 1)
  assert.ok(minLevelForSpecies('charmeleon') >= 16, 'Charmeleon needs its evolution level')
  assert.ok(minLevelForSpecies('charizard') >= 36, 'Charizard needs the full chain')
})

test('Monotype fallbacks never sit below their form\u2019s floor, even on a wide band', () => {
  /** @type {EncounterData} */
  const data = {
    name: 'test',
    encounters: [{ speciesKey: 'squirtle', weight: 1, minLevel: 30, maxLevel: 40 }],
  }
  for (let i = 0; i < 200; i++) {
    const encounter = resolvePokemonEncounter(data, [], new Set(), undefined, 1, false, 0, 'Fire')
    assert.ok(pokemonSpecies[encounter.speciesKey].types.includes('Fire'))
    assert.ok(
      minLevelForSpecies(encounter.speciesKey) <= encounter.level,
      `${encounter.speciesKey} (floor ${minLevelForSpecies(encounter.speciesKey)}) at Lv. ${encounter.level}`
    )
  }
})

test('Monotype constrains Randomizer rolls too', () => {
  /** @type {EncounterData} */
  const data = {
    name: 'test',
    encounters: [{ speciesKey: 'charmander', weight: 1, minLevel: 5, maxLevel: 5 }],
  }
  for (let i = 0; i < 50; i++) {
    const encounter = resolvePokemonEncounter(data, [], new Set(), undefined, 1, true, 0, 'Water')
    assert.ok(pokemonSpecies[encounter.speciesKey].types.includes('Water'))
  }
})

test('Monotype falls back to any species when its type has no Randomizer entry', () => {
  /** @type {EncounterData} */
  const data = {
    name: 'test',
    encounters: [{ speciesKey: 'charmander', weight: 1, minLevel: 5, maxLevel: 5 }],
  }
  const encounter = resolvePokemonEncounter(data, [], new Set(), undefined, 1, true, 0, 'Stellar')
  assert.ok(pokemonSpecies[encounter.speciesKey])
})

test('repairSave defaults the challenge flags off and keeps them on', () => {
  const save = (/** @type {Record<string, any>} */ overrides) => ({
      version: 2,
      playerPokemon: {
        id: '1',
        speciesKey: 'bulbasaur',
        level: 5,
        ivs: generateIVs(),
        moves: ['tackle'],
        currentHp: 20,
        maxHp: 20,
      },
      party: [],
      box: [],
      nextPokemonId: 2,
      inventory: {},
      ...overrides,
    }),
    defaults = repairSave(save({})),
    enabled = repairSave(save({ challengeRandomizer: true, challengeLevelScale: true }))
  assert.equal(defaults.challengeRandomizer, false)
  assert.equal(defaults.challengeLevelScale, false)
  assert.equal(enabled.challengeRandomizer, true)
  assert.equal(enabled.challengeLevelScale, true)
  assert.equal(defaults.challengeMonotype, null)
  assert.equal(repairSave(save({ challengeMonotype: 'Fire' })).challengeMonotype, 'Fire')
  assert.equal(repairSave(save({ challengeMonotype: 'Bogus' })).challengeMonotype, null)
  assert.equal(defaults.challengeRestrictCatches, false)
  assert.deepEqual(defaults.challengeCatchRoutes, [])
  const restricted = repairSave(
    save({ challengeRestrictCatches: true, challengeCatchRoutes: ['route1', 42, 'route2'] })
  )
  assert.equal(restricted.challengeRestrictCatches, true)
  assert.deepEqual(restricted.challengeCatchRoutes, ['route1', 'route2'])
})

test('Restrict Catches remembers the first wild on each route', () => {
  let state = gameReducer(initialGameState, { type: 'TOGGLE_CHALLENGE_RESTRICT_CATCHES' })
  assert.equal(state.challengeRestrictCatches, true)
  assert.deepEqual(state.challengeCatchRoutes, [])
  state = gameReducer(state, { type: 'MARK_CATCH_ROUTE', payload: { routeKey: 'route1' } })
  state = gameReducer(state, { type: 'MARK_CATCH_ROUTE', payload: { routeKey: 'route1' } })
  assert.deepEqual(state.challengeCatchRoutes, ['route1'], 'a route is only recorded once')
})

test('Nuzlocke releases a fainted party member straight away', () => {
  /** @param {string} id @param {number} currentHp @returns {any} */
  const mon = (id, currentHp) => ({
      id,
      speciesKey: 'bulbasaur',
      name: `Mon ${id}`,
      types: ['Grass'],
      level: 10,
      currentHp,
      maxHp: 20,
      moves: ['tackle'],
    }),
    base = gameReducer(initialGameState, { type: 'TOGGLE_CHALLENGE_NUZLOCKE' }),
    party = [mon('1', 0), mon('2', 10), mon('3', 10)],
    state = { ...base, party, playerPokemon: { ...party[1] }, activePlayerPokemonIndex: 1 },
    released = gameReducer(state, { type: 'RELEASE_FAINTED' })
  assert.equal(released.party.length, 2, 'the fainted Pokemon is removed')
  assert.ok(!released.party.some((member) => member.id === '1'))
  assert.equal(released.playerPokemon.id, '2', 'the healthy active Pokemon stays active')
  assert.equal(released.activePlayerPokemonIndex, 0)

  // The last fighter is spared so a wipe cannot end the run.
  const lastStand = {
    ...released,
    party: [mon('2', 0)],
    playerPokemon: mon('2', 0),
    activePlayerPokemonIndex: 0,
  }
  assert.equal(gameReducer(lastStand, { type: 'RELEASE_FAINTED' }).party.length, 1)

  // Off by default: nothing is released.
  const off = {
    ...initialGameState,
    party,
    playerPokemon: { ...party[0] },
    activePlayerPokemonIndex: 0,
  }
  assert.equal(gameReducer(off, { type: 'RELEASE_FAINTED' }).party.length, party.length)
})

test('a lead ability can bias wild encounters toward a type', () => {
  const data = {
    encounters: [
      { speciesKey: 'pikachu', weight: 1, minLevel: 5, maxLevel: 5 },
      { speciesKey: 'rattata', weight: 1, minLevel: 5, maxLevel: 5 },
    ],
  }
  const roll = (/** @type {number} */ value, /** @type {string | null} */ biasType) => {
    const original = Math.random
    Math.random = () => value
    try {
      return resolvePokemonEncounter(data, [], new Set(), undefined, 1, false, 0, null, biasType)
        .speciesKey
    } finally {
      Math.random = original
    }
  }
  assert.equal(roll(0.6, null), 'rattata', 'no bias picks the second entry')
  assert.equal(roll(0.6, 'Electric'), 'pikachu', 'an Electric bias makes Pikachu commoner')
  assert.equal(ENCOUNTER_TYPE_ABILITY.static, 'Electric')
})
