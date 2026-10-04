import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { ACHIEVEMENTS } = await import('../src/data/achievements.js')
const { formatReward } = await import('../src/game/progression.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { generateIVs } = await import('../src/game/pokemon.js')

test('formatReward renders tokens, money and items', () => {
  assert.equal(
    formatReward({ victoryTokens: 2, money: 1000, items: { masterball: 1 } }),
    '2 Victory Tokens \u00b7 $1,000 \u00b7 Master Ball \u00d71'
  )
  assert.equal(formatReward({ victoryTokens: 1 }), '1 Victory Token')
  assert.equal(formatReward({ items: { greatball: 10 } }), 'Great Ball \u00d710')
})

test('every achievement has a reward', () => {
  for (const achievement of ACHIEVEMENTS)
    assert.ok(
      achievement.reward &&
        (achievement.reward.money ||
          achievement.reward.victoryTokens ||
          Object.keys(achievement.reward.items ?? {}).length > 0),
      `${achievement.id} has no reward`
    )
})

test('CLAIM_ACHIEVEMENT_REWARDS pays an achieved milestone once', () => {
  const base = { ...initialGameState, wildBattlesWon: 1 },
    claimed = gameReducer(base, {
      type: 'CLAIM_ACHIEVEMENT_REWARDS',
      payload: { ids: ['firstBlood'] },
    })
  assert.equal(claimed.money, base.money + 500)
  assert.ok(claimed.rewardedAchievements.includes('firstBlood'))
  assert.ok(claimed.notifications.length >= 1)

  const again = gameReducer(claimed, {
    type: 'CLAIM_ACHIEVEMENT_REWARDS',
    payload: { ids: ['firstBlood'] },
  })
  assert.equal(again, claimed, 'a reward is only paid once')
})

test('CLAIM_ACHIEVEMENT_REWARDS grants tokens and items', () => {
  const base = { ...initialGameState, wildBattlesWon: 1000, inventory: {} },
    claimed = gameReducer(base, {
      type: 'CLAIM_ACHIEVEMENT_REWARDS',
      payload: { ids: ['trainer1000'] },
    })
  assert.equal(claimed.victoryTokens, base.victoryTokens + 2)
  assert.equal(claimed.inventory.greatball, 10)
})

test('CLAIM_ACHIEVEMENT_REWARDS ignores unmet achievements', () => {
  const base = { ...initialGameState, money: 0 },
    state = gameReducer(base, {
      type: 'CLAIM_ACHIEVEMENT_REWARDS',
      payload: { ids: ['rich'] },
    })
  assert.equal(state, base, 'an unmet milestone pays nothing')
})

test('repairSave drops unknown rewarded achievement ids', () => {
  const repaired = repairSave({
    version: 2,
    playerPokemon: { id: '1', speciesKey: 'bulbasaur', level: 5, ivs: generateIVs(), moves: ['tackle'], currentHp: 20, maxHp: 20 },
    party: [],
    box: [],
    nextPokemonId: 2,
    inventory: {},
    rewardedAchievements: ['firstBlood', 'notARealAchievement'],
  })
  assert.deepEqual(repaired.rewardedAchievements, ['firstBlood'])
})

test('ending a minigame records its phase result and score', () => {
  const base = { ...initialGameState, phase: 'musical', minigameRecords: {} },
    next = gameReducer(base, {
      type: 'END_MINIGAME',
      payload: { score: 123, completed: true },
    })
  assert.deepEqual(next.minigameRecords.musical, { best: 123, completed: true })
})

test('leaving the Safari Zone records the catches', () => {
  const base = { ...initialGameState, phase: 'safari', minigameRecords: {} },
    next = gameReducer(base, {
      type: 'END_SAFARI',
      payload: { score: 3, completed: true },
    })
  assert.deepEqual(next.minigameRecords.safari, { best: 3, completed: true })
})

test('a minigame left without completing is not counted as cleared', () => {
  const base = { ...initialGameState, phase: 'auctionHouse', minigameRecords: {} },
    next = gameReducer(base, {
      type: 'END_MINIGAME',
      payload: { completed: false },
    })
  assert.equal(next.minigameRecords.auctionHouse.completed, false)
  assert.equal(
    ACHIEVEMENTS.find((achievement) => achievement.id === 'minigameFirst').check(next),
    false
  )
})

test('clearing minigames unlocks the minigame milestones', () => {
  const minigameFirst = ACHIEVEMENTS.find((achievement) => achievement.id === 'minigameFirst'),
    minigameFive = ACHIEVEMENTS.find((achievement) => achievement.id === 'minigameFive')
  assert.equal(minigameFirst.check({ ...initialGameState }), false)
  const cleared = {
    ...initialGameState,
    minigameRecords: { memory: { best: 0, completed: true } },
  }
  assert.equal(minigameFirst.check(cleared), true)
  assert.equal(minigameFive.check(cleared), false)
})

test('TM milestones count the distinct TMs in the bag', async () => {
  const { TM_MOVE_IDS, tmItemId } = await import('../src/data/tms.js'),
    tmAll = ACHIEVEMENTS.find((achievement) => achievement.id === 'tmAll'),
    inventory = Object.fromEntries(TM_MOVE_IDS.map((moveId) => [tmItemId(moveId), 1]))
  assert.equal(tmAll.check({ ...initialGameState, inventory: {} }), false)
  assert.equal(tmAll.check({ ...initialGameState, inventory }), true)
})
