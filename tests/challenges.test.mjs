import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolvePokemonEncounter } = await import('../src/game/progression.js')
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
    seen.add(encounter.speciesKey)
  }
  assert.ok(seen.size > 1, 'rolls more than one Grass species')
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
})
