import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { advanceQuests, hasClaimableQuests, questLabel, rollQuests } = await import(
  '../src/game/quests.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { generateIVs } = await import('../src/game/pokemon.js')

/** Deterministic LCG so quest rolls are repeatable in tests. */
function seeded(seed) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const quest = (/** @type {Record<string, any>} */ overrides) => ({
  id: 'wildBattles:',
  kind: 'wildBattles',
  params: {},
  goal: 5,
  progress: 0,
  reward: {},
  claimed: false,
  ...overrides,
})

test('rollQuests returns three valid quests for the day', () => {
  const rolled = rollQuests(initialGameState, '2024-06-15', seeded(7))
  assert.equal(rolled.date, '2024-06-15')
  assert.equal(rolled.list.length, 3)
  for (const entry of rolled.list) {
    assert.ok(entry.id && entry.kind)
    assert.ok(entry.goal > 0)
    assert.equal(entry.progress, 0)
    assert.equal(entry.claimed, false)
  }
})

test('questLabel describes each quest kind', () => {
  assert.match(questLabel(quest({ goal: 8 })), /Win 8 wild battles/)
  assert.match(
    questLabel(quest({ kind: 'catchSpecies', params: { speciesKey: 'pidgey' }, goal: 2 })),
    /Catch 2 Pidgey/
  )
  assert.match(questLabel(quest({ kind: 'catchShiny' })), /shiny/)
})

test('advanceQuests only counts matching events and caps at the goal', () => {
  const quests = {
      date: '2024-06-15',
      list: [
        quest({ progress: 4 }),
        quest({ id: 'catchSpecies:pidgey', kind: 'catchSpecies', params: { speciesKey: 'pidgey' }, goal: 2 }),
      ],
    },
    after = advanceQuests(quests, { kind: 'wild', locationId: 'route1' })
  assert.equal(after.list[0].progress, 5)
  assert.equal(after.list[1].progress, 0)
  assert.equal(advanceQuests(quests, { kind: 'catch', speciesKey: 'rattata' }), quests)
  assert.equal(
    advanceQuests(quests, { kind: 'wild' }).list[0].progress,
    5
  )
})

test('hasClaimableQuests flags completed, unclaimed quests', () => {
  assert.equal(hasClaimableQuests({ list: [quest({ progress: 5 })] }), true)
  assert.equal(hasClaimableQuests({ list: [quest({ progress: 4 })] }), false)
  assert.equal(hasClaimableQuests({ list: [quest({ progress: 5, claimed: true })] }), false)
})

test('REFRESH_QUESTS rolls once per day', () => {
  const rolled = gameReducer(initialGameState, {
    type: 'REFRESH_QUESTS',
    payload: { today: '2024-06-15' },
  })
  assert.equal(rolled.quests.date, '2024-06-15')
  assert.equal(rolled.quests.list.length, 3)
  assert.equal(
    gameReducer(rolled, { type: 'REFRESH_QUESTS', payload: { today: '2024-06-15' } }),
    rolled
  )
  assert.equal(
    gameReducer(rolled, { type: 'REFRESH_QUESTS', payload: { today: '2024-06-16' } }).quests.date,
    '2024-06-16'
  )
})

test('CLAIM_QUEST pays the reward exactly once', () => {
  const rolled = gameReducer(initialGameState, {
      type: 'REFRESH_QUESTS',
      payload: { today: '2024-06-15' },
    }),
    target = rolled.quests.list[0],
    completed = {
      ...rolled,
      quests: {
        ...rolled.quests,
        list: rolled.quests.list.map((/** @type {any} */ entry) =>
          entry.id === target.id ? { ...entry, progress: entry.goal } : entry
        ),
      },
    },
    claimed = gameReducer(completed, { type: 'CLAIM_QUEST', payload: { questId: target.id } })
  assert.ok(claimed.quests.list.find((/** @type {any} */ entry) => entry.id === target.id).claimed)
  assert.equal(claimed.money, completed.money + (target.reward.money ?? 0))
  assert.equal(
    claimed.victoryTokens,
    completed.victoryTokens + (target.reward.victoryTokens ?? 0)
  )
  assert.equal(
    gameReducer(claimed, { type: 'CLAIM_QUEST', payload: { questId: target.id } }),
    claimed
  )
})

test('CLAIM_QUEST ignores an unfinished quest', () => {
  const rolled = gameReducer(initialGameState, {
      type: 'REFRESH_QUESTS',
      payload: { today: '2024-06-15' },
    }),
    target = rolled.quests.list[0]
  assert.equal(
    gameReducer(rolled, { type: 'CLAIM_QUEST', payload: { questId: target.id } }),
    rolled
  )
})

test('repairSave drops quests that reference unknown locations', () => {
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
      quests: {
        date: '2024-06-15',
        list: [
          quest({ id: 'wildBattles:' }),
          quest({ id: 'routeBattles:nowhere', kind: 'routeBattles', params: { locationId: 'nowhere' } }),
        ],
      },
    },
    repaired = repairSave(save)
  assert.equal(repaired.quests.date, '2024-06-15')
  assert.equal(repaired.quests.list.length, 1)
  assert.equal(repaired.quests.list[0].id, 'wildBattles:')
})
