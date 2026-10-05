import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { TM_MOVE_IDS, TM_MOVES_BY_TYPE, getTmInfo, isTmItem, tmItemId, tmMoveType, tmNumber } = await import(
  '../src/data/tms.js'
)
const { gymTmType, minigameTmTypes, rollUnownedTm } = await import('../src/game/tms.js')
const { getItemCategory, getItemInfo } = await import('../src/game/progression.js')
const { ACHIEVEMENTS } = await import('../src/data/achievements.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

test('the TM catalogue covers every machine move group', () => {
  assert.ok(TM_MOVE_IDS.length > 200, 'a broad TM set')
  for (const type of ['Fire', 'Water', 'Electric', 'Normal']) {
    assert.ok(TM_MOVES_BY_TYPE[type]?.length > 0, `${type} has TMs`)
  }
  const moveId = TM_MOVES_BY_TYPE.Fire[0],
    itemId = tmItemId(moveId)
  assert.equal(isTmItem(itemId), true)
  assert.equal(isTmItem('potion'), false)
  assert.equal(tmMoveType(itemId), 'Fire')
  assert.match(getTmInfo(itemId).name, /^TM\d+ /)
  assert.equal(getItemCategory(itemId), 'tms')
  assert.equal(getItemInfo(itemId).name, getTmInfo(itemId).name)
})

test('every TM has a unique catalogue number shown in its name', () => {
  const numbers = TM_MOVE_IDS.map((moveId) => tmNumber(moveId))
  assert.equal(new Set(numbers).size, TM_MOVE_IDS.length, 'numbers are unique')
  for (const moveId of TM_MOVE_IDS) {
    const itemId = tmItemId(moveId),
      number = tmNumber(itemId)
    assert.ok(number >= 1, `${moveId} has a number`)
    assert.equal(tmNumber(tmItemId(moveId)), number, 'item id and move id agree')
    assert.match(getTmInfo(itemId).name, new RegExp(`^TM${number} `))
  }
})

test('rollUnownedTm never repeats an owned TM and collapses when exhausted', () => {
  const moveId = 'protect',
    empty = rollUnownedTm(['Normal'], {}, () => 0)
  assert.ok(empty, 'an unowned Normal TM is available')
  assert.equal(isTmItem(tmItemId(empty)), true)
  // Own a whole type and that type yields nothing.
  const inventory = Object.fromEntries(
    (TM_MOVES_BY_TYPE.Fire ?? []).map((id) => [tmItemId(id), 1])
  )
  assert.equal(rollUnownedTm(['Fire'], inventory), null)
})

test('a gym awards TMs of its theme type', () => {
  assert.equal(gymTmType({ team: [{ speciesKey: 'geodude' }, { speciesKey: 'onix' }] }), 'Rock')
  assert.equal(gymTmType({ team: [{ speciesKey: 'staryu' }, { speciesKey: 'starmie' }] }), 'Water')
  assert.equal(gymTmType(null), null)
})

test('minigame TM pools are themed and excluded where they should be', () => {
  assert.deepEqual(minigameTmTypes('bugCatching', null), ['Bug'])
  assert.equal(minigameTmTypes('academyQuiz', null), null)
  assert.equal(minigameTmTypes('auctionHouse', null), undefined)
  assert.deepEqual(minigameTmTypes('routeActivity', 'forage'), ['Grass'])
})

test('CLAIM_ACHIEVEMENT_REWARDS hands over a TM item', () => {
  const badge = ACHIEVEMENTS.find((achievement) => achievement.id === 'badgeFirst'),
    tmId = Object.keys(badge.reward.items).find((id) => isTmItem(id))
  assert.ok(tmId, 'First Badge is backed by a TM')
  const next = gameReducer(
    { ...initialGameState, inventory: {}, defeatedGyms: ['brock'] },
    { type: 'CLAIM_ACHIEVEMENT_REWARDS', payload: { ids: ['badgeFirst'] } }
  )
  assert.equal(next.inventory[tmId], 1)
})
