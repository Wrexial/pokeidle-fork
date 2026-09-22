import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  DAILY_EVENTS,
  dailyEventByKey,
  dailyDropMultiplier,
  dailyExpMultiplier,
  dailyPrizeMultiplier,
  dailyShinyMultiplier,
  rollDailyEvent,
  todayKey,
} = await import('../src/data/daily-events.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { awardExperience } = await import('../src/game/progression.js')
const { calculateExpYield, createPokemon, generateIVs } = await import('../src/game/pokemon.js')
const { pokemonSpecies } = await import('../src/data/gameData.js')

test('todayKey formats the local date as YYYY-MM-DD', () => {
  assert.equal(todayKey(new Date(2024, 5, 15)), '2024-06-15')
  assert.equal(todayKey(new Date(2024, 11, 3)), '2024-12-03')
})

test('rollDailyEvent is deterministic and picks a real event', () => {
  const first = rollDailyEvent('2024-06-15'),
    second = rollDailyEvent('2024-06-15')
  assert.deepEqual(first, second)
  assert.equal(first.date, '2024-06-15')
  assert.equal(first.claimed, false)
  assert.ok(dailyEventByKey[first.kind], 'kind should map to a real event')
})

test('daily multipliers only fire for their own event', () => {
  assert.equal(dailyExpMultiplier({ kind: 'training' }), 2)
  assert.equal(dailyPrizeMultiplier({ kind: 'fortune' }), 2)
  assert.equal(dailyDropMultiplier({ kind: 'harvest' }), 2)
  assert.equal(dailyShinyMultiplier({ kind: 'lucky' }), 2)
  for (const event of DAILY_EVENTS) {
    const other = DAILY_EVENTS.find((candidate) => candidate.key !== event.key)
    assert.equal(dailyExpMultiplier({ kind: other.key }), 1)
  }
  assert.equal(dailyExpMultiplier(null), 1)
  assert.equal(dailyExpMultiplier(undefined), 1)
})

test('REFRESH_DAILY_EVENT rolls once per day and notifies', () => {
  const today = '2024-06-15',
    first = gameReducer(initialGameState, {
      type: 'REFRESH_DAILY_EVENT',
      payload: { today },
    })
  assert.equal(first.dailyEvent.date, today)
  assert.ok(dailyEventByKey[first.dailyEvent.kind])
  assert.ok(first.notifications.length >= 1, 'a toast should announce the event')

  const again = gameReducer(first, { type: 'REFRESH_DAILY_EVENT', payload: { today } })
  assert.equal(again, first, 'the same day should not re-roll or re-notify')

  const tomorrow = gameReducer(again, {
    type: 'REFRESH_DAILY_EVENT',
    payload: { today: '2024-06-16' },
  })
  assert.equal(tomorrow.dailyEvent.date, '2024-06-16')
  assert.equal(tomorrow.dailyEvent.claimed, false)
})

test('CLAIM_DAILY_GIFT grants the gift once', () => {
  const rolled = gameReducer(initialGameState, {
      type: 'REFRESH_DAILY_EVENT',
      payload: { today: '2024-06-15' },
    }),
    event = dailyEventByKey[rolled.dailyEvent.kind],
    claimed = gameReducer(rolled, { type: 'CLAIM_DAILY_GIFT' })
  assert.equal(claimed.dailyEvent.claimed, true)
  assert.equal(claimed.money, rolled.money + event.gift.money)
  for (const [itemId, quantity] of Object.entries(event.gift.items))
    assert.equal(claimed.inventory[itemId], (rolled.inventory[itemId] ?? 0) + quantity)

  const twice = gameReducer(claimed, { type: 'CLAIM_DAILY_GIFT' })
  assert.equal(twice, claimed, 'claiming again should do nothing')
})

test('the training event doubles awarded EXP', () => {
  const player = createPokemon('bulbasaur', 50, 1),
    enemy = createPokemon('pidgey', 50, 2),
    base = calculateExpYield(pokemonSpecies.pidgey, 50),
    collect = /** @param {number} bonus */ (bonus) => {
      const calls = []
      awardExperience(/** @type {any} */ ((action) => calls.push(action)), player, enemy, 1, false, [player], 0, bonus)
      return calls.find((action) => action.type === 'APPLY_EXP').payload.expGained
    }
  assert.equal(collect(1), base)
  assert.equal(collect(2), Math.floor(base * 2))
})

test('repairSave keeps today\u2019s event but drops a stale one', () => {
  const save = (/** @type {any} */ dailyEvent) => ({
      version: 2,
      playerPokemon: { id: '1', speciesKey: 'bulbasaur', level: 5, ivs: generateIVs(), moves: ['tackle'], currentHp: 20, maxHp: 20 },
      party: [],
      box: [],
      nextPokemonId: 2,
      inventory: {},
      dailyEvent,
    }),
    today = todayKey()
  assert.deepEqual(
    repairSave(save({ date: today, kind: 'fortune', claimed: true })).dailyEvent,
    { date: today, kind: 'fortune', claimed: true }
  )
  assert.equal(
    repairSave(save({ date: '2000-01-01', kind: 'fortune', claimed: false })).dailyEvent,
    null
  )
  assert.equal(repairSave(save({ date: today, kind: 'nonsense', claimed: false })).dailyEvent, null)
})
