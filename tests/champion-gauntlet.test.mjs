import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const {
  CHAMPION_GAUNTLET_COST,
  CHAMPION_GAUNTLET_POOL,
  CHAMPION_GAUNTLET_SIZE,
  buildGauntletBracket,
  gauntletPrize,
  gauntletTierLabel,
} = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

const { pokemonSpecies } = gameData

test('the gauntlet bracket is a full, ascending card of named trainers', () => {
  const bracket = buildGauntletBracket()
  assert.equal(bracket.length, CHAMPION_GAUNTLET_SIZE)
  assert.ok(CHAMPION_GAUNTLET_POOL >= CHAMPION_GAUNTLET_SIZE, 'the pool can fill a bracket')

  const ids = new Set()
  for (const entrant of bracket) {
    assert.ok(entrant.id && entrant.name, 'each entrant is named')
    assert.ok(entrant.team.length > 0, `${entrant.name} fields a team`)
    for (const member of entrant.team)
      assert.ok(pokemonSpecies[member.speciesKey], `${member.speciesKey} is real`)
    assert.ok(entrant.maxLevel >= 70, `${entrant.name} uses an endgame team`)
    ids.add(entrant.id)
  }
  assert.equal(ids.size, bracket.length, 'no trainer appears twice')

  // Gym leaders first, then Elite Four, then a Champion to close it out.
  const tiers = bracket.map((entrant) => entrant.tier)
  const order = { gym: 0, elite: 1, champion: 2 },
    sorted = tiers.every((tier, index) => index === 0 || order[tiers[index - 1]] <= order[tier])
  assert.ok(sorted, 'the bracket ascends gym -> elite -> champion')
  assert.equal(tiers[tiers.length - 1], 'champion', 'a Champion anchors the bracket')
  assert.ok(tiers.includes('gym') && tiers.includes('elite'))
})

test('the bracket varies between runs but stays valid', () => {
  // A deterministic RNG can still produce different brackets; both must be sound.
  const seeded = (/** @type {number} */ seed) => {
    let state = seed
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296
      return state / 4294967296
    }
  }
  const first = buildGauntletBracket(CHAMPION_GAUNTLET_SIZE, seeded(1)),
    second = buildGauntletBracket(CHAMPION_GAUNTLET_SIZE, seeded(2))
  for (const bracket of [first, second]) {
    assert.equal(bracket.length, CHAMPION_GAUNTLET_SIZE)
    assert.equal(new Set(bracket.map((entrant) => entrant.id)).size, CHAMPION_GAUNTLET_SIZE)
  }
  assert.notDeepEqual(
    first.map((entrant) => entrant.id),
    second.map((entrant) => entrant.id),
    'different seeds pick different gym leaders'
  )
})

test('the prize scales with how deep the run went', () => {
  const early = gauntletPrize(0),
    mid = gauntletPrize(4),
    late = gauntletPrize(6),
    clear = gauntletPrize(CHAMPION_GAUNTLET_SIZE)
  assert.ok(mid.money > early.money)
  assert.ok(late.money > mid.money)
  assert.ok(clear.money > late.money)
  assert.ok(clear.items.length >= 1, 'a full clear pays items')
  for (const prize of [early, mid, late, clear]) {
    assert.ok(prize.label)
    for (const item of prize.items) assert.ok(item.itemId && item.quantity > 0)
  }
  // The tiers are monotonic even past the top.
  assert.deepEqual(gauntletPrize(99), clear, 'over-clearing matches a full clear')
})

test('the tier labels read correctly', () => {
  assert.equal(gauntletTierLabel('gym'), 'Gym Leader')
  assert.equal(gauntletTierLabel('elite'), 'Elite Four')
  assert.equal(gauntletTierLabel('champion'), 'Champion')
})

test('START_CHAMPION_GAUNTLET enters the gauntlet phase and costs the fee', () => {
  const base = { ...initialGameState, phase: 'idle', money: CHAMPION_GAUNTLET_COST + 500 },
    started = gameReducer(base, { type: 'START_CHAMPION_GAUNTLET' })
  assert.equal(started.phase, 'championGauntlet')
  assert.equal(started.money, 500)

  const broke = gameReducer(
    { ...base, money: CHAMPION_GAUNTLET_COST - 1 },
    { type: 'START_CHAMPION_GAUNTLET' }
  )
  assert.equal(broke.phase, 'idle', 'cannot enter without the fee')
})
