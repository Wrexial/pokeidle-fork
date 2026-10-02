import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { awardExperience, computeUnlockedLocations, getRegionUnlockTokens, regionProgressionGoal, checkShinyOdds, shinyChainMultiplier, shinyOddsForCompletedGenerations, shinyOddsForSpecies, entryRoutePath, minigameRequirementMet } =
  await import('../src/game/progression.js')
const { initialGameState, gameReducer } = await import('../src/game/reducer.js')
const { encounterData, gymLeaderData, mapData, pokemonSpecies, regions } = await import('../src/data/gameData.js')
const { DAYCARE_LOCATIONS } = await import('../src/data/config.js')
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

test('minigame gates unlock a route once the record is met', () => {
  const kantoGyms = gymLeaderData
    .filter((gym) => (gym.region ?? 'kanto') === 'kanto')
    .map((gym) => gym.id)
    .slice(0, 4)
  const ready = baseState({
    defeatedGyms: kantoGyms,
    battlesWonByLocation: { pokemonTower: 15, lavenderTown: 8 },
  })
  assert.ok(!computeUnlockedLocations(ready).includes('route11'), 'the minigame gate holds')
  assert.ok(
    computeUnlockedLocations({
      ...ready,
      minigameRecords: { whack: { best: 15, completed: true } },
    }).includes('route11'),
    'clearing the gate opens the route'
  )
  // The helper covers both the score and the completion-flag shapes.
  assert.equal(minigameRequirementMet(ready, { minigame: 'whack', minScore: 15 }), false)
  assert.equal(
    minigameRequirementMet(
      baseState({ minigameRecords: { bugContest: { best: 0, completed: true } } }),
      { minigame: 'bugContest' }
    ),
    true
  )
})

test('END_MINIGAME records the best minigame score', () => {
  const first = gameReducer(
    { ...initialGameState, phase: 'whack' },
    { type: 'END_MINIGAME', payload: { minigame: 'whack', score: 20 } }
  )
  assert.deepEqual(first.minigameRecords.whack, { best: 20, completed: true })
  const lower = gameReducer(
    { ...first, phase: 'whack' },
    { type: 'END_MINIGAME', payload: { minigame: 'whack', score: 5 } }
  )
  assert.equal(lower.minigameRecords.whack.best, 20, 'a lower run keeps the best')
})

test('a finished region points at its Champion, then a banked token', () => {
  const kanto = regions.find((region) => region.id === 'kanto')
  // Region complete, Champion unbeaten: send the player to the league.
  const beforeChampion = regionProgressionGoal(
    baseState({ defeatedChampions: [], unlockedRegions: ['kanto'] }),
    'kanto'
  )
  assert.match(beforeChampion.title, /Kanto Champion/)
  assert.equal(beforeChampion.locationId, kanto.leagueLocationKey)

  // Champion beaten, token unspent: tell them to spend it.
  const withToken = regionProgressionGoal(
    baseState({ defeatedChampions: ['kanto'], unlockedRegions: ['kanto'] }),
    'kanto'
  )
  assert.match(withToken.title, /1 Region Unlock Token/)
  assert.equal(withToken.locationId, null)

  // Token spent on Johto, whose Champion is still unbeaten.
  const spent = regionProgressionGoal(
    baseState({
      startRegion: 'johto',
      defeatedChampions: ['kanto'],
      unlockedRegions: ['kanto', 'johto'],
    }),
    'johto'
  )
  assert.match(spent.title, /Johto Champion/)

  // Every region open: nothing left to unlock.
  const allOpen = regionProgressionGoal(
    baseState({
      defeatedChampions: regions.map((region) => region.id),
      unlockedRegions: regions.map((region) => region.id),
    }),
    'kanto'
  )
  assert.match(allOpen.title, /Every region is open/)
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

test('a fainted participant earns no EXP and does not dilute the survivors', () => {
  const fainted = { ...createPokemon('charmander', 50, 'a'), currentHp: 0 },
    active = createPokemon('pidgey', 10, 'b'),
    enemy = { speciesKey: 'rattata', level: 20 },
    expected = calculateExpYield(pokemonSpecies.rattata, 20)
  const actions = []
  awardExperience(
    (action) => actions.push(action),
    active,
    enemy,
    1,
    false,
    [fainted, active],
    1,
    1,
    [fainted.id, active.id]
  )
  assert.equal(
    actions.find((action) => action.type === 'APPLY_EXP').payload.expGained,
    expected,
    'the survivor takes the whole share, not a split with the fainted Pokemon'
  )
  assert.ok(
    !actions.some(
      (action) =>
        action.type === 'APPLY_SHARED_EXP' &&
        action.payload.partyExp.some((entry) => entry.pokemonId === fainted.id)
    ),
    'the fainted participant gets no shared EXP entry'
  )
})

test('a double knockout awards no EXP to the fainted active Pokemon', () => {
  const active = { ...createPokemon('charmander', 50, 'a'), currentHp: 0 },
    enemy = { speciesKey: 'rattata', level: 20 }
  const actions = []
  awardExperience(
    (action) => actions.push(action),
    active,
    enemy,
    1,
    false,
    [active],
    0,
    1,
    [active.id]
  )
  assert.ok(
    !actions.some((action) => action.type === 'APPLY_EXP'),
    'no EXP is applied to a Pokemon that fainted to win'
  )
})

test('a fainted party member does not revive when shared EXP levels it', () => {
  const fainted = { ...createPokemon('charmander', 20, 'a'), currentHp: 0 },
    healthy = createPokemon('charmander', 20, 'b')
  // Only bump maxHp so the level-up HP top-up is isolated.
  const newStatsFor =
    /** @param {any} member */ (member) => ({
      maxHp: member.maxHp + 5,
      attack: member.attack + 1,
      defense: member.defense,
      spAttack: member.spAttack,
      spDefense: member.spDefense,
      speed: member.speed,
    })
  const next = gameReducer(
    baseState({ party: [fainted, healthy], activePlayerPokemonIndex: 1, playerPokemon: healthy }),
    {
      type: 'APPLY_SHARED_EXP',
      payload: {
        partyExp: [
          { pokemonId: fainted.id, partyIndex: 0, expGained: 10, newLevel: 21, newStats: newStatsFor(fainted) },
          { pokemonId: healthy.id, partyIndex: 1, expGained: 10, newLevel: 21, newStats: newStatsFor(healthy) },
        ],
      },
    }
  )
  assert.equal(next.party[0].currentHp, 0, 'the fainted member stays fainted')
  assert.equal(next.party[0].level, 21, 'it still levels up')
  assert.equal(
    next.party[1].currentHp,
    healthy.currentHp + 5,
    'the healthy member is topped up by the HP gain'
  )
})

test('checkShinyOdds hits on a zero roll and misses otherwise', () => {
  const originalRandom = Math.random
  try {
    Math.random = () => 0
    assert.equal(checkShinyOdds(4096), true)
    assert.equal(checkShinyOdds(1), true)
    Math.random = () => 0.9999999
    assert.equal(checkShinyOdds(4096), false)
  } finally {
    Math.random = originalRandom
  }
})

test('the Shiny Charm curve runs from full odds to 1 in 256', () => {
  assert.equal(shinyOddsForCompletedGenerations(0, 9), 4096)
  assert.equal(shinyOddsForCompletedGenerations(1, 9), 2048)
  assert.equal(shinyOddsForCompletedGenerations(9, 9), 256)
  for (let completed = 1; completed <= 9; completed++)
    assert.ok(
      shinyOddsForCompletedGenerations(completed, 9) <
        shinyOddsForCompletedGenerations(completed - 1, 9),
      'each completed generation improves the odds'
    )
})

test('the Shiny Charm only applies to a completed generation', () => {
  assert.equal(shinyOddsForSpecies('bulbasaur', new Set()), 4096)
  assert.equal(shinyOddsForSpecies('bulbasaur', new Set([0])), 2048)
  assert.equal(
    shinyOddsForSpecies('chikorita', new Set([0])),
    4096,
    'a Gen 2 species is not charmed by a completed Gen 1'
  )
})

test('shiny chain multiplier rises linearly and caps at 4x', () => {
  assert.equal(shinyChainMultiplier('pidgey', null), 1)
  assert.equal(shinyChainMultiplier('pidgey', { speciesKey: 'rattata', count: 120 }), 1)
  assert.equal(shinyChainMultiplier('pidgey', { speciesKey: 'pidgey', count: 0 }), 1)
  // +1x every 40 consecutive encounters, capped at 4x at 120.
  assert.equal(shinyChainMultiplier('pidgey', { speciesKey: 'pidgey', count: 40 }), 2)
  assert.equal(shinyChainMultiplier('pidgey', { speciesKey: 'pidgey', count: 80 }), 3)
  assert.equal(shinyChainMultiplier('pidgey', { speciesKey: 'pidgey', count: 120 }), 4)
  assert.equal(shinyChainMultiplier('pidgey', { speciesKey: 'pidgey', count: 200 }), 4)
})

test('every region has a Daycare on one of its real routes', () => {
  for (const region of regions) {
    const locationId = DAYCARE_LOCATIONS[region.id]
    assert.ok(locationId, `${region.id} has a Daycare route`)
    const location = mapData[locationId]
    assert.ok(location, `${region.id} Daycare ${locationId} exists`)
    assert.equal(location.region, region.id, `${locationId} sits in ${region.id}`)
    assert.equal(location.type, 'route', `${locationId} is a route`)
  }
})

test('completedGenerations is memoised per pokedexCaught array and recomputed for a new array', async () => {
  const { completedGenerations, speciesKeysByGeneration } = await import('../src/data/gameData.js')
  const empty = []
  const first = completedGenerations(empty)
  assert.equal(first, completedGenerations(empty), 'the same array returns the cached Set')
  assert.equal(first.has(0), false, 'an empty dex completes nothing')
  // Gen 1 complete: a brand-new array must not reuse the empty cache.
  const genOne = [...speciesKeysByGeneration[0]]
  const completed = completedGenerations(genOne)
  assert.notEqual(completed, first)
  assert.ok(completed.has(0), 'the completed generation is reported')
  assert.equal(completed.has(1), false)
})
