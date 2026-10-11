import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  HUNT_ENCOUNTER_MULTIPLIER,
  advanceHuntEncounter,
  createHunt,
  formatHuntDuration,
  huntLabel,
  huntMatchesSpecies,
  huntProgress,
  isKnownType,
  isValidHuntTarget,
  recordHuntCatch,
  routesForHunt,
} = await import('../src/game/hunt.js')
const { resolvePokemonEncounter } = await import('../src/game/progression.js')
const { rollActivityEncounter } = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { createBattlePokemon } = await import('../src/game/combat.js')

/** Run `fn` with `Math.random` pinned to a constant, then restore it. */
function withRandom(/** @type {number} */ value, /** @type {() => any} */ fn) {
  const original = Math.random
  Math.random = () => value
  try {
    return fn()
  } finally {
    Math.random = original
  }
}

test('hunt targets validate against the species data', () => {
  assert.equal(isValidHuntTarget('species', 'pidgey'), true)
  assert.equal(isValidHuntTarget('species', 'notapokemon'), false)
  assert.equal(isValidHuntTarget('type', 'Water'), true)
  assert.equal(isValidHuntTarget('type', 'Nonsense'), false)
  assert.equal(isKnownType('Fire'), true)
  assert.equal(isValidHuntTarget('species', ''), false)
})

test('huntMatchesSpecies handles species and type targets', () => {
  const speciesHunt = createHunt('species', 'pidgey'),
    typeHunt = createHunt('type', 'Water')
  assert.equal(huntMatchesSpecies(speciesHunt, 'pidgey'), true)
  assert.equal(huntMatchesSpecies(speciesHunt, 'rattata'), false)
  assert.equal(huntMatchesSpecies(typeHunt, 'squirtle'), true)
  assert.equal(huntMatchesSpecies(typeHunt, 'charmander'), false)
  assert.equal(huntMatchesSpecies(null, 'pidgey'), false)
  assert.equal(huntMatchesSpecies(speciesHunt, ''), false)
})

test('advanceHuntEncounter counts matches and upgrades the best quality', () => {
  const base = createHunt('species', 'pidgey', 1000)
  assert.equal(advanceHuntEncounter(base, 'rattata'), base, 'a non-target is a no-op')
  const first = advanceHuntEncounter(base, 'pidgey', 'perfect')
  assert.equal(first.encounters, 1)
  assert.equal(first.bestQuality, 'perfect')
  // A lower quality does not downgrade the record.
  const second = advanceHuntEncounter(first, 'pidgey', 'hit')
  assert.equal(second.encounters, 2)
  assert.equal(second.bestQuality, 'perfect')
  // A higher one does.
  const third = advanceHuntEncounter(second, 'pidgey', 'ultra')
  assert.equal(third.bestQuality, 'ultra')
  assert.equal(advanceHuntEncounter(null, 'pidgey'), null)
})

test('recordHuntCatch counts target catches only', () => {
  const hunt = createHunt('type', 'Water')
  assert.equal(recordHuntCatch(hunt, 'charmander'), hunt)
  assert.equal(recordHuntCatch(hunt, 'magikarp').catches, 1)
  assert.equal(recordHuntCatch(null, 'magikarp'), null)
})

test('huntLabel and huntProgress read the hunt', () => {
  assert.equal(huntLabel(createHunt('species', 'pidgey')), 'Pidgey')
  assert.equal(huntLabel(createHunt('type', 'Water')), 'Water-type')
  const hunt = { ...createHunt('species', 'pidgey', 1000), encounters: 5, catches: 2 },
    progress = huntProgress(hunt, 1000 + 3 * 60_000)
  assert.equal(progress.encounters, 5)
  assert.equal(progress.catches, 2)
  assert.equal(progress.elapsedMs, 3 * 60_000)
  assert.equal(formatHuntDuration(3 * 60_000), '3m')
  assert.equal(formatHuntDuration(2 * 3_600_000 + 15 * 60_000), '2h 15m')
})

test('a focus hunt makes the target far more likely on a route', () => {
  const encounters = [
      { speciesKey: 'pidgey', weight: 1, minLevel: 2, maxLevel: 4 },
      { speciesKey: 'rattata', weight: 1, minLevel: 2, maxLevel: 4 },
      { speciesKey: 'caterpie', weight: 1, minLevel: 2, maxLevel: 4 },
    ],
    data = { encounters },
    focus = createHunt('species', 'caterpie')
  // With the roll pinned at 0.5/3 the plain table picks Rattata...
  assert.equal(
    withRandom(0.5, () => resolvePokemonEncounter(data, [], new Set(), null)).speciesKey,
    'rattata'
  )
  // ...but focusing Caterpie (3x weight) reaches it at the same roll.
  assert.equal(
    withRandom(0.5, () => resolvePokemonEncounter(data, [], new Set(), null, 1, false, 0, null, null, focus))
      .speciesKey,
    'caterpie'
  )
  assert.ok(HUNT_ENCOUNTER_MULTIPLIER > 1)
})

test('a focus hunt boosts activity encounters too', () => {
  const focus = createHunt('species', 'pidgey'),
    countPidgey = (/** @type {import('../src/game/hunt.js').Hunt | null} */ hunt) => {
      const original = Math.random
      let seen = 0
      try {
        let seed = 12345
        Math.random = () => {
          seed = (seed * 1103515245 + 12345) % 2147483648
          return seed / 2147483648
        }
        for (let roll = 0; roll < 600; roll++) {
          const encounter = rollActivityEncounter('headbutt', 'route1', false, undefined, null, hunt)
          if (encounter?.speciesKey === 'pidgey') seen += 1
        }
      } finally {
        Math.random = original
      }
      return seen
    }
  // The identical rng sequence yields more Pidgeys when it is the focus.
  assert.ok(countPidgey(focus) > countPidgey(null), 'focusing Pidgey makes it more common')
})

test('routesForHunt finds the routes a target lives on', () => {
  const routes = routesForHunt({ mode: 'species', target: 'pidgey' })
  assert.ok(routes.length > 0, 'Pidgey turns up somewhere')
  assert.ok(routes.every((route) => route.locationId && route.name))
  assert.deepEqual(routesForHunt(null), [])
})

test('the reducer starts, clears and advances a hunt', () => {
  const starter = createPokemon('bulbasaur', 20, 'own'),
    base = {
      ...initialGameState,
      phase: 'idle',
      party: [starter],
      playerPokemon: starter,
      currentLocation: 'route1',
      currentRoute: 'route1',
    },
    set = gameReducer(base, { type: 'SET_HUNT', payload: { mode: 'species', target: 'pidgey' } })
  assert.equal(set.hunt.mode, 'species')
  assert.equal(set.hunt.target, 'pidgey')
  // An invalid target is refused.
  assert.equal(
    gameReducer(base, { type: 'SET_HUNT', payload: { mode: 'species', target: 'nope' } }),
    base
  )
  // A matching encounter advances the hunt.
  const encountered = gameReducer(set, {
    type: 'START_ENCOUNTER',
    payload: { enemy: createBattlePokemon('pidgey', 5, { wild: true }) },
  })
  assert.equal(encountered.hunt.encounters, 1)
  // A non-matching one does not.
  const other = gameReducer(set, {
    type: 'START_ENCOUNTER',
    payload: { enemy: createBattlePokemon('rattata', 5, { wild: true }) },
  })
  assert.equal(other.hunt.encounters, 0)
  // A catch advances the catch counter.
  const caught = gameReducer(set, { type: 'MARK_CAUGHT', payload: { speciesKey: 'pidgey' } })
  assert.equal(caught.hunt.catches, 1)
  // Clearing removes it.
  assert.equal(gameReducer(set, { type: 'CLEAR_HUNT' }).hunt, null)
  assert.equal(gameReducer(base, { type: 'CLEAR_HUNT' }), base)
})

test('repairSave sanitises a hunt', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    repaired = repairSave(
      serializeSave({
        ...base,
        hunt: {
          mode: 'species',
          target: 'pidgey',
          startedAt: 1234,
          encounters: 12.9,
          catches: -4,
          bestQuality: 'nonsense',
        },
      })
    )
  assert.equal(repaired.hunt.target, 'pidgey')
  assert.equal(repaired.hunt.encounters, 12)
  assert.equal(repaired.hunt.catches, 0)
  assert.equal(repaired.hunt.bestQuality, null)
  assert.equal(repaired.hunt.startedAt, 1234)
  // A bad target / mode drops the hunt entirely.
  assert.equal(
    repairSave(serializeSave({ ...base, hunt: { mode: 'species', target: 'nope' } })).hunt,
    null
  )
  assert.equal(
    repairSave(
      serializeSave({
        ...base,
        hunt: { mode: 'type', target: 'Water', startedAt: 1, encounters: 1, catches: 0 },
      })
    ).hunt.target,
    'Water'
  )
})
