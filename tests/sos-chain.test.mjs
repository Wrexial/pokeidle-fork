import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { rollAbility } = await import('../src/game/pokemon.js')
const { resolvePokemonEncounter } = await import('../src/game/progression.js')
const {
  SOS_HIDDEN_GUARANTEE,
  SOS_SHINY_MAX,
  sosHiddenAbilityChance,
  sosRewardsCrossed,
  sosShinyMultiplier,
} = await import('../src/game/sos-chain.js')

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

/** Advance the SOS chain `times` on a route against one species. */
function advance(state, routeKey, speciesKey, times = 1) {
  let next = state
  for (let index = 0; index < times; index++)
    next = gameReducer(next, {
      type: 'ADVANCE_SOS_CHAIN',
      payload: { routeKey, speciesKey },
    })
  return next
}

test('the hidden-ability chance rises a step every ten wins and is guaranteed late', () => {
  assert.equal(sosHiddenAbilityChance(0), 0.1)
  assert.equal(sosHiddenAbilityChance(9), 0.1)
  assert.ok(Math.abs(sosHiddenAbilityChance(10) - 0.2) < 1e-9)
  assert.ok(Math.abs(sosHiddenAbilityChance(20) - 0.3) < 1e-9)
  assert.equal(sosHiddenAbilityChance(SOS_HIDDEN_GUARANTEE), 1)
})

test('the shiny multiplier rises every fifty wins and caps at four', () => {
  assert.equal(sosShinyMultiplier(0), 1)
  assert.equal(sosShinyMultiplier(50), 2)
  assert.equal(sosShinyMultiplier(100), 3)
  assert.equal(sosShinyMultiplier(150), SOS_SHINY_MAX)
  assert.equal(sosShinyMultiplier(1000), SOS_SHINY_MAX)
})

test('milestone rewards are crossed once per threshold', () => {
  assert.deepEqual(
    sosRewardsCrossed(0, 9).map((reward) => reward.chain),
    []
  )
  assert.deepEqual(
    sosRewardsCrossed(9, 10).map((reward) => reward.chain),
    [10]
  )
  assert.deepEqual(
    sosRewardsCrossed(10, 30).map((reward) => reward.chain),
    [25]
  )
})

test('rollAbility honours the hidden-ability chance it is given', () => {
  assert.equal(rollAbility('eevee', () => 0.1, 0.1), 'runAway')
  assert.equal(rollAbility('eevee', () => 0.5, 0.9), 'anticipation')
})

test('an SOS chain lowers the wild shiny odds', () => {
  const bucket = {
      name: 'Test Route',
      encounters: [{ speciesKey: 'pidgey', weight: 100, minLevel: 2, maxLevel: 2 }],
    },
    // 1/4096 is shiny at 1/1024 odds but not at full 1/4096 odds.
    roll = 1 / 4096
  const plain = withRandom(roll, () =>
      resolvePokemonEncounter(bucket, [], new Set(), undefined, 1, false, 0, null, null, null, 0)
    ),
    chained = withRandom(roll, () =>
      resolvePokemonEncounter(bucket, [], new Set(), undefined, 1, false, 0, null, null, null, 150)
    )
  assert.equal(plain.isShiny, false)
  assert.equal(chained.isShiny, true)
})

test('ADVANCE_SOS_CHAIN extends a same-species streak and a different route restarts it', () => {
  const one = advance(initialGameState, 'route1', 'pidgey')
  assert.deepEqual(one.sosChain, { routeKey: 'route1', speciesKey: 'pidgey', count: 1 })
  assert.equal(one.sosBestChains.route1, 1)
  const two = advance(one, 'route1', 'pidgey')
  assert.equal(two.sosChain.count, 2)
  assert.equal(two.sosBestChains.route1, 2)
  const switched = advance(two, 'route2', 'pidgey')
  assert.deepEqual(switched.sosChain, { routeKey: 'route2', speciesKey: 'pidgey', count: 1 })
  assert.equal(switched.sosBestChains.route1, 2, 'the old route keeps its record')
})

test('a different species on the same route starts a new chain', () => {
  const chained = advance(initialGameState, 'route1', 'pidgey', 4)
  assert.equal(chained.sosChain.count, 4)
  const broken = advance(chained, 'route1', 'rattata')
  assert.deepEqual(broken.sosChain, { routeKey: 'route1', speciesKey: 'rattata', count: 1 })
  assert.equal(broken.sosBestChains.route1, 4, 'the route keeps its best same-species chain')
  // Returning to the original species does not resume the old streak.
  const resumed = advance(broken, 'route1', 'pidgey')
  assert.equal(resumed.sosChain.count, 1)
  assert.equal(resumed.sosBestChains.route1, 4)
})

test('RESET_SOS_CHAIN breaks the streak but keeps the route record and species', () => {
  const chained = advance(initialGameState, 'route1', 'pidgey', 5),
    reset = gameReducer(chained, { type: 'RESET_SOS_CHAIN' })
  assert.equal(reset.sosChain.count, 0)
  assert.equal(reset.sosChain.routeKey, 'route1')
  assert.equal(reset.sosChain.speciesKey, 'pidgey')
  assert.equal(reset.sosBestChains.route1, 5)
})

test('reaching a milestone pays its reward once per route, not per species', () => {
  const ten = advance(initialGameState, 'route1', 'pidgey', 10)
  assert.equal(ten.inventory.rareCandy, 1)
  assert.equal(ten.sosBestChains.route1, 10)
  // Resetting and climbing back to ten does not pay the 10-chain reward again.
  const again = advance(gameReducer(ten, { type: 'RESET_SOS_CHAIN' }), 'route1', 'pidgey', 10)
  assert.equal(again.inventory.rareCandy, 1)
  // Chaining a second species to the same depth does not re-pay it either.
  const otherSpecies = advance(again, 'route1', 'rattata', 10)
  assert.equal(otherSpecies.inventory.rareCandy, 1)
  // Pushing past the next threshold pays that one.
  const twentyFive = advance(otherSpecies, 'route1', 'rattata', 15)
  assert.equal(twentyFive.inventory.expCandyL, 1)
})

test('TRAVEL to another area breaks the chain', () => {
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    chained = advance(started, 'route1', 'pidgey', 3),
    traveled = gameReducer(chained, {
      type: 'TRAVEL',
      payload: { locationId: 'palletTown' },
    })
  assert.equal(chained.sosChain.count, 3)
  assert.equal(traveled.sosChain.count, 0)
  assert.equal(traveled.sosBestChains.route1, 3)
})
