import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { MINING_COST, MINIGAME_BY_REGION, rewardItemName, rollMiningReward } = await import(
  '../src/game/minigames.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { consumableItems, evolutionItems } = await import('../src/data/items.js')

test('Sinnoh hosts the mining minigame', () => {
  assert.equal(MINIGAME_BY_REGION.sinnoh, 'mining')
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

test('START_MINING charges the fee and refuses when broke', () => {
  const rich = gameReducer(
      { ...initialGameState, money: MINING_COST + 100 },
      { type: 'START_MINING' }
    ),
    poor = gameReducer(
      { ...initialGameState, money: MINING_COST - 1 },
      { type: 'START_MINING' }
    )
  assert.equal(rich.money, 100)
  assert.equal(poor.money, MINING_COST - 1)
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
