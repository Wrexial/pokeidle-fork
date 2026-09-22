import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { BUG_CONTEST_COST, MINIGAME_BY_REGION, MINING_COST, SLOT_SPIN_COST, SLOT_SYMBOLS, bugContestPrize, rewardItemName, rollContestBug, rollMiningReward, spinSlots } = await import(
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
test('bug contest bugs and prizes are consistent', () => {
  const bug = rollContestBug()
  assert.ok(bug.speciesKey)
  assert.ok(bug.score > 0)
  const prize = bugContestPrize(bug.score)
  assert.ok(prize.money > 0)
  assert.ok(prize.items.length > 0)
  assert.ok(
    bugContestPrize(500).money >= BUG_CONTEST_COST,
    'the top prize at least pays back the entry fee'
  )
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
