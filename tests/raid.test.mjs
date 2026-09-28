import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { pokemonSpecies, regions, raidLegendaryPoolFor, raidPoolFor } = await import(
  '../src/data/gameData.js'
)
const { pickRaidLegendary, resolveRoamer } = await import('../src/game/progression.js')
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

test('each region splits its Raid Island into a legendary and an ordinary tier', () => {
  for (const region of regions) {
    const legendary = region.raidPool ?? [],
      ordinary = region.raidOrdinaryPool ?? []
    assert.ok(legendary.length > 0, `${region.id} keeps its legendaries`)
    for (const entry of legendary)
      assert.equal(
        pokemonSpecies[entry.speciesKey]?.legendary,
        true,
        `${region.id} lists non-legendary ${entry.speciesKey} in raidPool`
      )
    for (const entry of ordinary)
      assert.notEqual(
        pokemonSpecies[entry.speciesKey]?.legendary,
        true,
        `${region.id} lists legendary ${entry.speciesKey} in raidOrdinaryPool`
      )
    assert.ok(
      ordinary.length <= 15,
      `${region.id} has ${ordinary.length} ordinary raid Pokemon`
    )
    const keys = [...legendary, ...ordinary].map((entry) => entry.speciesKey)
    assert.equal(new Set(keys).size, keys.length, `${region.id} lists a species twice`)
    // The display/wild helper returns both tiers, legendaries first.
    assert.deepEqual(raidPoolFor(region.id), [...legendary, ...ordinary])
    assert.deepEqual(raidLegendaryPoolFor(region.id), legendary)
  }
})

test('a raid boss is always a legendary', () => {
  for (const region of regions) {
    const picked = pickRaidLegendary(raidLegendaryPoolFor(region.id), [], [])
    assert.ok(picked, `${region.id} can pick a raid boss`)
    assert.equal(pokemonSpecies[picked.speciesKey]?.legendary, true)
  }
})

test('roamers only roll legendaries', () => {
  const originalRandom = Math.random
  try {
    Math.random = () => 0
    for (const region of regions) {
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
