import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { pokemonSpecies, regions, raidLegendaryPoolFor, raidPoolFor, gymLeaderData } = await import(
  '../src/data/gameData.js'
)
const { pickRaidLegendary, raidLegendaryWeight, raidProgressFor, resolveRoamer } = await import(
  '../src/game/progression.js'
)
const { LEGENDARY_QUESTS } = await import('../src/data/legendary-quests.js')
const { VILLAIN_ORGS } = await import('../src/data/villain-teams.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

/** @param {Record<string, any>} [overrides] */
function baseState(overrides = {}) {
  return {
    ...initialGameState,
    startRegion: 'kanto',
    unlockedRegions: ['kanto'],
    unlockedLocations: ['palletTown', 'route1'],
    currentLocation: 'palletTown',
    currentRoute: 'route1',
    ...overrides,
  }
}

test('every region keeps a legendary-only Raid Island', () => {
  for (const region of regions) {
    // A DLC subregion (the Sevii Islands) shares its parent's single raid.
    if (region.isDlc) {
      assert.equal(region.raidPool?.length ?? 0, 0, `${region.id} has no raid of its own`)
      continue
    }
    const legendary = region.raidPool ?? []
    assert.ok(legendary.length > 0, `${region.id} keeps its legendaries`)
    for (const entry of legendary)
      assert.equal(
        pokemonSpecies[entry.speciesKey]?.legendary,
        true,
        `${region.id} lists non-legendary ${entry.speciesKey} in raidPool`
      )
    const keys = legendary.map((entry) => entry.speciesKey)
    assert.equal(new Set(keys).size, keys.length, `${region.id} lists a species twice`)
    // The region's box legendary is earned through its Legendary Quest and its
    // villain boss's legendary is locked until the arc is cleared, so the random
    // pool accessors leave both out.
    const questLegendary = LEGENDARY_QUESTS[region.id]?.legendary,
      villainLegendary = VILLAIN_ORGS[region.id]?.boss.legendary,
      randomPool = legendary.filter(
        (entry) =>
          entry.speciesKey !== questLegendary && entry.speciesKey !== villainLegendary
      )
    assert.deepEqual(raidPoolFor(region.id), randomPool)
    assert.deepEqual(raidLegendaryPoolFor(region.id), randomPool)
    if (questLegendary)
      assert.ok(
        !randomPool.some((entry) => entry.speciesKey === questLegendary),
        `${region.id} keeps ${questLegendary} quest-exclusive`
      )
    if (villainLegendary)
      assert.ok(
        !randomPool.some((entry) => entry.speciesKey === villainLegendary),
        `${region.id} keeps ${villainLegendary} locked behind its villain arc`
      )
    // Clearing the arc unlocks the boss's legendary again.
    if (villainLegendary) {
      const unlocked = raidLegendaryPoolFor(region.id, { villainProgress: { [region.id]: 5 } })
      assert.ok(
        unlocked.some((entry) => entry.speciesKey === villainLegendary),
        `${region.id} releases ${villainLegendary} once the arc is cleared`
      )
    }
  }
})

test('a raid boss is always a legendary', () => {
  for (const region of regions) {
    if (region.isDlc) continue
    const picked = pickRaidLegendary(raidLegendaryPoolFor(region.id), [], [])
    assert.ok(picked, `${region.id} can pick a raid boss`)
    assert.equal(pokemonSpecies[picked.speciesKey]?.legendary, true)
  }
})

test('raid progress scales from badges, the Champion and prestige', () => {
  const kantoGyms = gymLeaderData
    .filter((gym) => (gym.region ?? 'kanto') === 'kanto')
    .map((gym) => gym.id)
    .slice(0, 4)
  assert.equal(raidProgressFor(baseState({ defeatedGyms: kantoGyms }), 'kanto'), 4)
  assert.equal(
    raidProgressFor(baseState({ defeatedGyms: kantoGyms, defeatedChampions: ['kanto'] }), 'kanto'),
    7
  )
  assert.equal(
    raidProgressFor(
      baseState({ defeatedChampions: ['kanto'], regionPrestige: { kanto: 1 } }),
      'kanto'
    ),
    6
  )
})

test('the raid legendary weight leans minor early and box late', () => {
  // Phione is a minor legendary (480 BST); Arceus is a box legendary (720).
  const minor = { speciesKey: 'phione' },
    box = { speciesKey: 'arceus' }
  assert.ok(raidLegendaryWeight(minor, 0) > raidLegendaryWeight(box, 0))
  assert.ok(raidLegendaryWeight(box, 12) > raidLegendaryWeight(minor, 12))

  // With a mid roll, a fresh island hands out the minor form and a finished
  // one the box legendary.
  const originalRandom = Math.random
  try {
    Math.random = () => 0.5
    const pool = [
      { speciesKey: 'arceus', level: 75 },
      { speciesKey: 'phione', level: 70 },
    ]
    assert.equal(pickRaidLegendary(pool, [], [], 0)?.speciesKey, 'phione')
    assert.equal(pickRaidLegendary(pool, [], [], 12)?.speciesKey, 'arceus')
  } finally {
    Math.random = originalRandom
  }
})

test('roamers only roll legendaries', () => {
  const originalRandom = Math.random
  try {
    Math.random = () => 0
    for (const region of regions) {
      if (region.isDlc) continue
      const roamer = resolveRoamer(region.id, [], [], new Set())
      assert.ok(roamer, `${region.id} can roll a roamer`)
      assert.equal(pokemonSpecies[roamer.speciesKey]?.legendary, true)
    }
  } finally {
    Math.random = originalRandom
  }
})

test('Monotype roamers stay on-type and off-type ones never appear', () => {
  const originalRandom = Math.random
  try {
    Math.random = () => 0
    const ice = resolveRoamer('kanto', [], [], new Set(), 1, 'Ice')
    assert.ok(ice, 'Kanto has an Ice legendary to roam')
    assert.ok(pokemonSpecies[ice.speciesKey].types.includes('Ice'))
    // No Kanto legendary is Fairy, so none may roam while Fairy is chosen.
    assert.equal(resolveRoamer('kanto', [], [], new Set(), 1, 'Fairy'), null)
  } finally {
    Math.random = originalRandom
  }
})

test('starting a raid from a Raid Island keeps the original pre-raid location', () => {
  const first = gameReducer(baseState(), {
    type: 'START_RAID',
    payload: { legendary: 'articuno', level: 70, region: 'kanto', location: 'raidIsland' },
  })
  assert.equal(first.currentLocation, 'raidIsland')
  assert.equal(first.preRaidLocation, 'palletTown')

  // Jump straight to a second raid while still on the first island.
  const second = gameReducer(first, {
    type: 'START_RAID',
    payload: { legendary: 'zapdos', level: 70, region: 'johto', location: 'johto-raid' },
  })
  assert.equal(second.currentLocation, 'johto-raid')
  assert.equal(second.raidLegendary, 'zapdos')
  assert.equal(
    second.preRaidLocation,
    'palletTown',
    'the original pre-raid location is preserved, not the first island'
  )
})

test('leaving a raid returns to the pre-raid location and clears the raid state', () => {
  const started = gameReducer(baseState(), {
    type: 'START_RAID',
    payload: { legendary: 'articuno', level: 70, region: 'kanto', location: 'raidIsland' },
  })
  const left = gameReducer(started, {
    type: 'TRAVEL',
    payload: { locationId: started.preRaidLocation },
  })
  assert.equal(left.currentLocation, 'palletTown')
  assert.equal(left.inRaid, false)
  assert.equal(left.raidLegendary, null)
  assert.equal(left.raidRegion, null)
  assert.equal(left.preRaidLocation, null)
})
