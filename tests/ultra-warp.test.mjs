import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  ULTRA_WARP_COST,
  ULTRA_WARP_OBJECTS,
  ULTRA_WARP_TIERS,
  ULTRA_WARP_TIER_SCORES,
  rollWarpObject,
  rollWarpSpecies,
  ultraWarpDestinations,
  ultraWarpPrize,
  ultraWarpSpeciesForTier,
  warpFallMs,
  warpSpawnMs,
  warpTierForScore,
} = await import('../src/game/minigames/ultra-warp.js')
const { MINIGAME_INFO, MINIGAME_LOCATIONS, MINIGAME_START_ACTION, MINIGAME_TUTORIALS } =
  await import('../src/game/minigames.js')
const { mapData, pokemonSpecies, regions } = await import('../src/data/gameData.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

const alolaRaidPool = regions
  .find((region) => region.id === 'alola')
  .raidPool.map((entry) => entry.speciesKey)

test('the tunnel speeds up as the ride runs on', () => {
  assert.ok(warpFallMs(0) > warpFallMs(15_000))
  assert.ok(warpSpawnMs(0) > warpSpawnMs(15_000))
  assert.equal(warpSpawnMs(0), 460)
  assert.equal(warpSpawnMs(30_000), 270, 'clamped at the fastest gap')
  assert.equal(warpSpawnMs(99_999), 270, 'and stays clamped past the end')
})

test('the score tiers gate the wormholes', () => {
  assert.equal(warpTierForScore(0), 0)
  assert.equal(warpTierForScore(ULTRA_WARP_TIER_SCORES[0] - 1), 0)
  assert.equal(warpTierForScore(ULTRA_WARP_TIER_SCORES[0]), 1)
  assert.equal(warpTierForScore(ULTRA_WARP_TIER_SCORES[1] - 1), 1)
  assert.equal(warpTierForScore(ULTRA_WARP_TIER_SCORES[1]), 2)
  assert.equal(warpTierForScore(999), 2)
})

test('rollWarpObject only returns real tunnel objects', () => {
  const kinds = new Set(ULTRA_WARP_OBJECTS.map((object) => object.kind))
  for (let roll = 0; roll < 200; roll++) assert.ok(kinds.has(rollWarpObject().kind))
})

test('every Alola raid legendary has a wormhole tier', () => {
  const covered = new Set([0, 1, 2].flatMap((tier) => ultraWarpSpeciesForTier(tier)))
  for (const speciesKey of alolaRaidPool) assert.ok(covered.has(speciesKey), `${speciesKey} is reachable`)
  assert.equal(covered.size, alolaRaidPool.length, 'no extras from outside the raid pool')
  assert.ok(ULTRA_WARP_TIERS.every((tier) => tier.label && tier.species.length > 0))
})

test('rollWarpSpecies prefers species the player has not caught', () => {
  const first = ultraWarpSpeciesForTier(0)[0],
    pool = ultraWarpSpeciesForTier(0),
    // Caught everything except the first species, then roll with rng 0.
    caught = pool.filter((speciesKey) => speciesKey !== first)
  assert.equal(rollWarpSpecies(0, caught, () => 0), first)
  // Once every species is caught it still returns one of them.
  assert.ok(pool.includes(rollWarpSpecies(0, pool, () => 0)))
  assert.equal(rollWarpSpecies(99, []), null, 'an unknown tier yields nothing')
})

test('a ride offers one wormhole per tier reached', () => {
  const state = { pokedexCaught: [] },
    common = ultraWarpDestinations(state, 0, () => 0),
    legendary = ultraWarpDestinations(state, 2, () => 0)
  assert.equal(common.length, 1)
  assert.equal(common[0].tier, 0)
  assert.equal(legendary.length, 3, 'a perfect run reaches all three')
  assert.deepEqual(
    legendary.map((destination) => destination.tier),
    [0, 1, 2]
  )
  assert.ok(legendary.every((destination) => pokemonSpecies[destination.speciesKey]))
  assert.equal(legendary[2].level, 70)
})

test('the prize keeps the chosen legendary and scales with the score', () => {
  const destination = ultraWarpDestinations({ pokedexCaught: [] }, 2, () => 0)[2],
    small = ultraWarpPrize(5, destination),
    big = ultraWarpPrize(80, destination)
  assert.equal(small.pokemon.speciesKey, destination.speciesKey)
  assert.equal(big.pokemon.speciesKey, destination.speciesKey)
  assert.equal(big.pokemon.level, 70)
  assert.ok(big.money > small.money)
  assert.equal(small.label, destination.tierLabel)
})

test('the location, registry entry and reducer are wired up', () => {
  assert.equal(MINIGAME_LOCATIONS['alola-ultra-space'], 'ultraWarp')
  assert.equal(MINIGAME_START_ACTION.ultraWarp, 'START_ULTRA_WARP')
  assert.equal(MINIGAME_INFO.ultraWarp.cost, ULTRA_WARP_COST)
  assert.ok(MINIGAME_TUTORIALS.ultraWarp.length >= 2)
  const location = mapData['alola-ultra-space']
  assert.equal(location.type, 'facility')
  assert.equal(location.region, 'alola')
  assert.deepEqual(location.unlock.championDefeated, 'alola')
  assert.ok(location.connections.includes('alola-raid'))
  assert.ok(mapData['alola-raid'].connections.includes('alola-ultra-space'), 'the road is mutual')

  const base = { ...initialGameState, money: ULTRA_WARP_COST + 100, phase: 'idle' },
    started = gameReducer(base, { type: 'START_ULTRA_WARP' })
  assert.equal(started.phase, 'ultraWarp')
  assert.equal(started.money, 100)
  // Too poor: the start is refused (same state reference).
  const broke = { ...base, money: ULTRA_WARP_COST - 1 }
  assert.equal(gameReducer(broke, { type: 'START_ULTRA_WARP' }), broke)
  // Ending records the best score for `unlock.minScore` gates.
  const ended = gameReducer(started, {
    type: 'END_MINIGAME',
    payload: { minigame: 'ultraWarp', score: 42, completed: true },
  })
  assert.equal(ended.phase, 'idle')
  assert.deepEqual(ended.minigameRecords.ultraWarp, { best: 42, completed: true })
})
