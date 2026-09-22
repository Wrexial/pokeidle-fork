import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const { BUG_CONTEST_BALL, BUG_CONTEST_BUSHES, BUG_CONTEST_COST, BUG_CONTEST_POOL, BUG_CONTEST_RUSTLES, MINIGAME_BY_REGION, MINING_COST, SLOT_SPIN_COST, SLOT_SYMBOLS, bugCatchChance, bugFleeChance, bugStays, buildContestResults, contestScore, rewardItemName, rollContestBug, rollMiningReward, spinSlots, throwNetBall } = await import(
  '../src/game/minigames.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { consumableItems, evolutionItems } = await import('../src/data/items.js')

test('Sinnoh hosts the mining minigame and Johto the bug contest', () => {
  assert.equal(MINIGAME_BY_REGION.sinnoh, 'mining')
  assert.equal(MINIGAME_BY_REGION.johto, 'bugContest')
  assert.equal(MINIGAME_BY_REGION.kanto, 'gameCorner')
})

test('mining rewards are real items with a positive quantity', () => {
  for (let roll = 0; roll < 60; roll++) {
    const reward = rollMiningReward()
    assert.ok(
      consumableItems[reward.itemId] || evolutionItems[reward.itemId],
      `${reward.itemId} should be a real item`
    )
    assert.ok(reward.quantity >= 1)
    assert.equal(typeof rewardItemName(reward.itemId), 'string')
  }
})

test('PAY_MINIGAME_FEE charges the fee and refuses when broke', () => {
  const rich = gameReducer(
      { ...initialGameState, money: MINING_COST + 100 },
      { type: 'PAY_MINIGAME_FEE', payload: { amount: MINING_COST } }
    ),
    poor = gameReducer(
      { ...initialGameState, money: MINING_COST - 1 },
      { type: 'PAY_MINIGAME_FEE', payload: { amount: MINING_COST } }
    )
  assert.equal(rich.money, 100)
  assert.equal(poor.money, MINING_COST - 1)
})

test('CLAIM_MINIGAME_REWARD pays money and items', () => {
  const next = gameReducer(
    { ...initialGameState, inventory: {}, money: 0 },
    {
      type: 'CLAIM_MINIGAME_REWARD',
      payload: { money: 4000, items: [{ itemId: 'rareCandy', quantity: 1 }] },
    }
  )
  assert.equal(next.money, 4000)
  assert.equal(next.inventory.rareCandy, 1)
})

test('slot spins pay a real multiplier and stay near break-even', () => {
  for (let roll = 0; roll < 200; roll++) {
    const result = spinSlots()
    assert.equal(result.reels.length, 3)
    const match = result.reels.every((symbol) => symbol.id === result.reels[0].id)
    if (match) assert.equal(result.payout, result.reels[0].payout * SLOT_SPIN_COST)
    else assert.equal(result.payout, 0)
  }
  // Theoretical return: sum(weight^3 * payout) / totalWeight^3.
  const total = SLOT_SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0),
    expected =
      SLOT_SYMBOLS.reduce(
        (sum, symbol) => sum + symbol.weight ** 3 * symbol.payout,
        0
      ) /
      total ** 3
  assert.ok(expected > 0.7 && expected < 1.05, `return rate ${expected}`)
})
test('contest bugs roll a level, gender and flee chance', () => {
  assert.equal(BUG_CONTEST_BUSHES, 3)
  assert.ok(BUG_CONTEST_RUSTLES > 0)
  for (let roll = 0; roll < 50; roll++) {
    const bug = rollContestBug(40)
    assert.ok(bug.speciesKey)
    assert.ok(bug.level >= 5 && bug.level <= 75)
    assert.ok(['male', 'female', 'genderless'].includes(bug.gender))
    assert.ok(bug.fleeChance >= 0 && bug.fleeChance <= 1)
  }
})

test('rarer contest bugs are more skittish', () => {
  assert.ok(bugFleeChance('scyther') > bugFleeChance('caterpie'))
})

test('every Bug-type is contest-eligible, legendaries included', () => {
  const pool = new Set(BUG_CONTEST_POOL.map((entry) => entry.speciesKey))
  assert.ok(pool.has('caterpie'))
  assert.ok(pool.has('volcarona'), 'a non-Johto bug is eligible')
  assert.ok(pool.has('golisopod'))
  assert.ok(pool.has('genesect'), 'legendary bugs are eligible too')
  assert.ok(pool.has('pheromosa'))
  assert.ok(!pool.has('pikachu'), 'non-bugs are excluded')
})

test('raid islands no longer hand out any Bug-type', () => {
  const { pokemonSpecies, regions } = gameData
  for (const region of regions)
    for (const entry of region.raidPool ?? [])
      assert.ok(
        !(pokemonSpecies[entry.speciesKey].types ?? []).includes('Bug'),
        `${entry.speciesKey} in ${region.id} should be contest-only`
      )
})

test('contest results rank the player and fake rivals by score', () => {
  const playerBug = { speciesKey: 'volcarona', level: 50, gender: 'male', fleeChance: 0.1 },
    results = buildContestResults([playerBug], 50, 3)
  assert.ok(results.length >= 4, 'the player plus at least three rival bugs')
  assert.ok(results.some((entry) => entry.isPlayer), 'the player is on the board')
  assert.ok(results.some((entry) => !entry.isPlayer), 'the board includes fake rivals')
  for (let index = 1; index < results.length; index++)
    assert.ok(results[index - 1].score >= results[index].score, 'the board is sorted by score')
  assert.equal(contestScore('volcarona'), 550)
})

test('the contest supplies free Net Balls with a real catch chance', () => {
  assert.equal(BUG_CONTEST_BALL, 'netball')
  const chance = bugCatchChance('scyther')
  assert.ok(chance > 0 && chance < 1)
  assert.equal(typeof throwNetBall('caterpie'), 'boolean')
})

test('a failed throw may spook a bug into fleeing', () => {
  const original = Math.random
  try {
    Math.random = () => 0.99 // above every flee chance: the bug stays
    assert.equal(bugStays('caterpie'), true)
    assert.equal(bugStays('scyther'), true)
    Math.random = () => 0 // below every flee chance: the bug flees
    assert.equal(bugStays('caterpie'), false)
    assert.equal(bugStays('scyther'), false)
  } finally {
    Math.random = original
  }
})

test('START_BUG_CONTEST charges entry and enters the scene', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: BUG_CONTEST_COST + 50 },
      { type: 'START_BUG_CONTEST' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: BUG_CONTEST_COST - 1 },
      { type: 'START_BUG_CONTEST' }
    )
  assert.equal(started.phase, 'bugCatching')
  assert.equal(started.money, 50)
  assert.equal(broke.phase, 'idle')
  assert.equal(broke.money, BUG_CONTEST_COST - 1)
})

test('END_BUG_CONTEST returns to idle', () => {
  const next = gameReducer(
    { ...initialGameState, phase: 'bugCatching' },
    { type: 'END_BUG_CONTEST' }
  )
  assert.equal(next.phase, 'idle')
})

test('CATCH_POKEMON keeps a rolled gender', () => {
  const next = gameReducer(
    { ...initialGameState, party: [], nextPokemonId: 7 },
    {
      type: 'CATCH_POKEMON',
      payload: { speciesKey: 'scyther', level: 40, gender: 'female' },
    }
  )
  assert.equal(next.party[0].gender, 'female')
})

test('COLLECT_MINING adds the found rewards to the bag', () => {
  const next = gameReducer(
    { ...initialGameState, inventory: {} },
    {
      type: 'COLLECT_MINING',
      payload: {
        rewards: [
          { itemId: 'nugget', quantity: 2 },
          { itemId: 'fireStone', quantity: 1 },
        ],
      },
    }
  )
  assert.equal(next.inventory.nugget, 2)
  assert.equal(next.inventory.fireStone, 1)
})
