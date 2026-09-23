import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const {
  RODS,
  bestRodId,
  fishingExclusiveFor,
  nextRod,
  rodForId,
  rodsForRegionCount,
  rollActivityEncounter,
  rollFishingExclusive,
  routeActivityIds,
} = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/save.js')
const { generateIVs } = await import('../src/game/pokemon.js')

const { mapData, pokemonSpecies, mapEncounterData, regions } = gameData

/** A water route whose table has at least three Water species to gate (one of
 * which becomes the fishing exclusive, leaving at least two for the rods). */
const waterRoute = Object.values(mapData).find((location) => {
  if (!routeActivityIds(location).includes('fishing')) return false
  const water = (mapEncounterData[location.routeKey]?.encounters ?? []).filter((entry) =>
    pokemonSpecies[entry.speciesKey].types.includes('Water')
  )
  return water.length >= 3
})

test('there are three rod tiers that get better as regions open', () => {
  assert.equal(RODS.length, 3)
  for (let index = 1; index < RODS.length; index++) {
    assert.ok(RODS[index].tier > RODS[index - 1].tier)
    assert.ok(RODS[index].rarity >= RODS[index - 1].rarity)
    assert.ok(RODS[index].levelBonus >= RODS[index - 1].levelBonus)
    assert.ok(RODS[index].regionsRequired > RODS[index - 1].regionsRequired)
  }
  assert.deepEqual(rodsForRegionCount(1), ['oldRod'])
  assert.deepEqual(rodsForRegionCount(2), ['oldRod', 'goodRod'])
  assert.deepEqual(rodsForRegionCount(3), ['oldRod', 'goodRod', 'superRod'])
  assert.equal(rodForId('superRod').name, 'Super Rod')
  assert.equal(rodForId('missing'), RODS[0], 'an unknown rod falls back to the Old Rod')
})

test('bestRodId and nextRod track the rod collection', () => {
  assert.equal(bestRodId([]), 'oldRod')
  assert.equal(bestRodId(undefined), 'oldRod')
  assert.equal(bestRodId(['oldRod']), 'oldRod')
  assert.equal(bestRodId(['goodRod', 'oldRod']), 'goodRod')
  assert.equal(bestRodId(['superRod', 'oldRod']), 'superRod')
  assert.equal(nextRod(['oldRod']).id, 'goodRod')
  assert.equal(nextRod(['oldRod', 'goodRod']).id, 'superRod')
  assert.equal(nextRod(['oldRod', 'goodRod', 'superRod']), null)
})

test('the Old Rod only reaches the common half of a route, the Super Rod all of it', () => {
  const table = mapEncounterData[waterRoute.routeKey].encounters,
    exclusive = fishingExclusiveFor(waterRoute.routeKey),
    water = table
      .filter((entry) => pokemonSpecies[entry.speciesKey].types.includes('Water'))
      .filter((entry) => entry.speciesKey !== exclusive)
      .sort((left, right) => right.weight - left.weight),
    rarest = water[water.length - 1].speciesKey,
    totalWeight = water.reduce((sum, entry) => sum + entry.weight, 0),
    routeMinLevel = Math.min(...water.map((entry) => entry.minLevel)),
    oldPool = water.slice(
      0,
      Math.max(1, Math.ceil(water.length * rodForId('oldRod').rarity))
    ),
    oldTotalWeight = oldPool.reduce((sum, entry) => sum + entry.weight, 0),
    original = Math.random
  try {
    // The exclusive species is never reachable by an ordinary cast.
    for (let roll = 0; roll < 10; roll++)
      assert.notEqual(
        rollActivityEncounter('fishing', waterRoute.routeKey, false, 'superRod').speciesKey,
        exclusive,
        'the exclusive species is not reachable by a rod'
      )

    // Aim at the very last reachable entry: the Old Rod's shallowest pool must
    // stop short of the rarest non-exclusive species.
    Math.random = () => (oldTotalWeight - 0.5) / oldTotalWeight
    for (let roll = 0; roll < 10; roll++) {
      const encounter = rollActivityEncounter('fishing', waterRoute.routeKey, false, 'oldRod')
      assert.notEqual(encounter.speciesKey, rarest, 'the Old Rod cannot reach the rarest species')
      assert.ok(encounter.level >= routeMinLevel)
    }

    // The Super Rod's full pool reaches the rarest reachable species...
    Math.random = () => (totalWeight - 0.5) / totalWeight
    const deep = rollActivityEncounter('fishing', waterRoute.routeKey, false, 'superRod')
    assert.equal(deep.speciesKey, rarest)
    assert.ok(deep.level >= routeMinLevel + 4, 'the Super Rod adds its level bonus')

    // ...while the exclusive only comes from a perfect cast.
    assert.equal(rollFishingExclusive(waterRoute.routeKey).speciesKey, exclusive)
  } finally {
    Math.random = original
  }
})

test('UNLOCK_REGION hands out the next rod', () => {
  const johto = regions.find((region) => region.id === 'johto'),
    base = {
      ...initialGameState,
      phase: 'idle',
      startRegion: 'kanto',
      unlockedRegions: ['kanto'],
      unlockedLocations: ['palletTown', 'route1'],
      defeatedChampions: ['kanto'],
      money: 0,
    },
    unlocked = gameReducer(base, {
      type: 'UNLOCK_REGION',
      payload: { regionId: 'johto' },
    })
  assert.ok(unlocked.unlockedRegions.includes('johto'))
  assert.deepEqual(unlocked.rods, ['oldRod', 'goodRod'])
  assert.ok(
    unlocked.notifications.some((entry) => entry.message.includes('Good Rod')),
    'a rod unlock is announced'
  )
})

test('repairSave back-fills rods from the opened regions', () => {
  const save = {
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
      startRegion: 'kanto',
      unlockedLocations: [
        'palletTown',
        'route1',
        ...regions.filter((region) => ['kanto', 'johto', 'hoenn'].includes(region.id)).map((region) => region.entry),
      ],
    },
    repaired = repairSave(save)
  assert.deepEqual(repaired.rods, ['oldRod', 'goodRod', 'superRod'])
  assert.ok(
    repairSave({ ...save, rods: ['oldRod', 'bogusRod'] }).rods.includes('oldRod'),
    'unknown rod ids are dropped'
  )
})
