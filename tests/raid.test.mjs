import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { pokemonSpecies, regions, raidLegendaryPoolFor, raidPoolFor } = await import(
  '../src/data/gameData.js'
)
const { pickRaidLegendary, resolveRoamer } = await import('../src/game/progression.js')

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
