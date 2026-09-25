import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { awardExperience, computeUnlockedLocations, getRegionUnlockTokens, checkShinyOdds, shinyChainMultiplier, entryRoutePath } =
  await import('../src/game/progression.js')
const { initialGameState } = await import('../src/game/reducer.js')
const { encounterData, gymLeaderData, mapData, pokemonSpecies, regions } = await import('../src/data/gameData.js')
const { calculateExpYield, createPokemon } = await import('../src/game/pokemon.js')

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

test('every region opens on a gentle Lv. 3-5 first route', () => {
  for (const region of [...regions].sort((a, b) => a.order - b.order)) {
    const { route } = entryRoutePath(region.entry),
      location = route ? mapData[route] : null,
      entries = location?.routeKey ? (encounterData[location.routeKey]?.encounters ?? []) : []
    assert.ok(entries.length > 0, `${region.id} has a first route with wilds`)
    assert.equal(
      Math.min(...entries.map((entry) => entry.minLevel)),
      3,
      `${region.id}'s first route starts at Lv. 3`
    )
    assert.ok(
      Math.max(...entries.map((entry) => entry.maxLevel)) <= 5,
      `${region.id}'s first route stays at Lv. 5 or below`
    )
  }
})

test('Alola route 2 unlocks from an earlier route, not the locked route 3', () => {
  const route2 = mapData['alola-route-2'],
    refs = (route2.unlock.battlesAtLocation ?? []).map((rule) => rule.locationId)
  assert.ok(refs.length > 0, 'route 2 has a battle gate')
  for (const ref of refs)
    assert.ok(
      mapData[ref].unlockOrder < route2.unlockOrder,
      `${ref} must unlock before route 2 (${route2.unlockOrder})`
    )
})

test('Exp. Share gives the active 50% and each other member 25%', () => {
  const active = createPokemon('charmander', 50, 'a'),
    ally = createPokemon('pidgey', 10, 'b'),
    enemy = { speciesKey: 'rattata', level: 20 },
    expected = calculateExpYield(pokemonSpecies.rattata, 20)
  const withShare = []
  awardExperience(
    (action) => withShare.push(action),
    active,
    enemy,
    1,
    true,
    [active, ally],
    0
  )
  const applied = withShare.find((action) => action.type === 'APPLY_EXP'),
    shared = withShare.find((action) => action.type === 'APPLY_SHARED_EXP')
  assert.equal(
    applied.payload.expGained,
    Math.floor(expected * 0.5),
    'the active takes half while the item is active'
  )
  assert.equal(
    shared.payload.partyExp[0].expGained,
    Math.floor(expected * 0.25),
    'each other member gains a quarter'
  )

  const withoutShare = []
  awardExperience(
    (action) => withoutShare.push(action),
    active,
    enemy,
    1,
    false,
    [active, ally],
    0
  )
  assert.equal(withoutShare.find((action) => action.type === 'APPLY_EXP').payload.expGained, expected)
  assert.ok(
    !withoutShare.some((action) => action.type === 'APPLY_SHARED_EXP'),
    'no shared EXP without the item'
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
