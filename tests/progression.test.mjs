import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { computeUnlockedLocations, getRegionUnlockTokens, checkShinyOdds, shinyChainMultiplier } =
  await import('../src/game/progression.js')
const { initialGameState } = await import('../src/game/reducer.js')
const { gymLeaderData } = await import('../src/data/gameData.js')

/** @param {Record<string, any>} [overrides] */
function baseState(overrides = {}) {
  return {
    ...initialGameState,
    startRegion: 'kanto',
    unlockedRegions: ['kanto'],
    unlockedLocations: ['palletTown'],
    currentLocation: 'palletTown',
    ...overrides,
  }
}

test('getRegionUnlockTokens counts Champions minus opened regions', () => {
  assert.equal(
    getRegionUnlockTokens(
      baseState({ defeatedChampions: ['kanto'], unlockedRegions: ['kanto'] })
    ),
    1
  )
  assert.equal(
    getRegionUnlockTokens(
      baseState({ defeatedChampions: ['kanto'], unlockedRegions: ['kanto', 'johto'] })
    ),
    0
  )
  assert.equal(
    getRegionUnlockTokens(
      baseState({ defeatedChampions: ['kanto', 'johto'], unlockedRegions: ['kanto'] })
    ),
    2
  )
  assert.equal(getRegionUnlockTokens(baseState({ defeatedChampions: [], unlockedRegions: [] })), 0)
})

test('the entry town opens its first route', () => {
  const unlocked = computeUnlockedLocations(baseState())
  assert.ok(unlocked.includes('palletTown'))
  assert.ok(unlocked.includes('route1'), 'route1 should unlock from Pallet Town')
})

test('badge gates open with the right badges and re-lock after prestige', () => {
  // route23 needs 6 Kanto badges plus battles on route22 / in Fuchsia City.
  const kantoGyms = gymLeaderData
      .filter((/** @type {any} */ gym) => (gym.region ?? 'kanto') === 'kanto')
      .map((/** @type {any} */ gym) => gym.id),
    battles = { battlesWonByLocation: { route22: 25, fuchsiaCity: 13 } }
  assert.ok(!computeUnlockedLocations(baseState(battles)).includes('route23'))

  const sixBadges = { ...battles, defeatedGyms: kantoGyms.slice(0, 6) }
  assert.ok(
    computeUnlockedLocations(baseState(sixBadges)).includes('route23'),
    'route23 should open with 6 badges and the battles done'
  )

  // Prestiging Kanto clears its badges, so the gate re-locks even though other
  // regions are complete (badge counts are per-region).
  const prestiged = {
    ...battles,
    defeatedGyms: [],
    defeatedChampions: ['johto'],
    unlockedRegions: ['kanto', 'johto'],
  }
  assert.ok(
    !computeUnlockedLocations(baseState(prestiged)).includes('route23'),
    'prestiging Kanto should re-lock route23'
  )
})

test('checkShinyOdds hits on a zero roll and misses otherwise', () => {
  const originalRandom = Math.random
  try {
    Math.random = () => 0
    assert.equal(checkShinyOdds(8192), true)
    assert.equal(checkShinyOdds(1), true)
    Math.random = () => 0.9999999
    assert.equal(checkShinyOdds(8192), false)
  } finally {
    Math.random = originalRandom
  }
})

test('shiny chain multiplier only applies to the chained species and is capped', () => {
  assert.equal(shinyChainMultiplier('pidgey', { speciesKey: 'rattata', count: 120 }), 1)
  assert.equal(shinyChainMultiplier('pidgey', { speciesKey: 'pidgey', count: 0 }), 1)
  const small = shinyChainMultiplier('pidgey', { speciesKey: 'pidgey', count: 10 }),
    large = shinyChainMultiplier('pidgey', { speciesKey: 'pidgey', count: 120 })
  assert.ok(large > small && large > 1)
  assert.ok(large <= 4)
})
