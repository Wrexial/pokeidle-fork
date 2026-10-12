import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  FFA_COST,
  FFA_PARTICIPANTS,
  FFA_TEAM_SIZE,
  activeMon,
  advanceActive,
  ffaPrize,
  ffaRivals,
  ownerAlive,
  runFreeForAllRound,
  simulateFreeForAll,
  survivors,
} = await import('../src/game/minigames/free-for-all.js')
const { initialGameState, gameReducer } = await import('../src/game/reducer.js')
const { pokemonSpecies } = await import('../src/data/gameData.js')

/** @param {Record<string, any>} [overrides] */
function battler(overrides = {}) {
  return {
    speciesKey: 'pidgey',
    name: 'Pidgey',
    types: ['Normal', 'Flying'],
    level: 50,
    currentHp: 400,
    maxHp: 400,
    attack: 150,
    defense: 120,
    spAttack: 150,
    spDefense: 120,
    speed: 80,
    moves: ['splash'],
    isPlayer: false,
    ...overrides,
  }
}

/** @param {string} id @param {any[]} team @param {boolean} [isPlayer] */
function participant(id, team, isPlayer = false) {
  return { id, name: id, isPlayer, active: 0, team }
}

test('ffaRivals fields three trainers with full teams', () => {
  const rivals = ffaRivals(60, 2)
  assert.equal(rivals.length, FFA_PARTICIPANTS - 1)
  for (const rival of rivals) {
    assert.equal(rival.team.length, FFA_TEAM_SIZE)
    assert.equal(rival.isPlayer, false)
    for (const mon of rival.team) {
      assert.ok(pokemonSpecies[mon.speciesKey], `${mon.speciesKey} is a real species`)
      assert.ok(mon.level >= 60 && mon.level <= 100)
    }
  }
})

test('activeMon, ownerAlive and advanceActive track the healthy body', () => {
  const fainted = battler({ name: 'Down', currentHp: 0 }),
    healthy = battler({ name: 'Up' }),
    p = participant('A', [fainted, healthy])
  assert.equal(activeMon(p), fainted)
  assert.equal(ownerAlive(p), true)
  advanceActive(p)
  assert.equal(activeMon(p), healthy, 'it steps to the healthy member')
  // A fully-fainted team reports as out and keeps its active slot.
  const out = participant('B', [battler({ currentHp: 0 }), battler({ currentHp: 0 })])
  advanceActive(out)
  assert.equal(ownerAlive(out), false)
})

test('a free-for-all round resolves actions and damages a participant', () => {
  const you = participant(
      'You',
      [battler({ name: 'You', isPlayer: true, moves: ['thunderbolt'], spAttack: 300, speed: 200, types: ['Electric'] })],
      true
    ),
    a = participant('A', [battler({ name: 'A', types: ['Water'], spDefense: 40, currentHp: 300, maxHp: 300, speed: 1 })]),
    b = participant('B', [battler({ name: 'B', types: ['Water'], spDefense: 40, currentHp: 300, maxHp: 300, speed: 1 })]),
    result = runFreeForAllRound([you, a, b], { deterministic: true })
  assert.ok(result.events.length > 0, 'the round produced events')
  assert.ok(survivors([you, a, b]) >= 1)
  assert.ok(
    [a, b].some((p) => activeMon(p).currentHp < 300) || !ownerAlive(a) || !ownerAlive(b),
    'a rival took damage'
  )
})

test('simulateFreeForAll runs to a single winner', () => {
  const you = participant(
      'You',
      [
        battler({ name: 'You', isPlayer: true, moves: ['thunderbolt'], spAttack: 999, speed: 400, types: ['Electric'] }),
      ],
      true
    ),
    a = participant('A', [battler({ name: 'A', types: ['Water'], spDefense: 1, currentHp: 50, maxHp: 50, speed: 1 })]),
    b = participant('B', [battler({ name: 'B', types: ['Water'], spDefense: 1, currentHp: 50, maxHp: 50, speed: 1 })]),
    c = participant('C', [battler({ name: 'C', types: ['Water'], spDefense: 1, currentHp: 50, maxHp: 50, speed: 1 })]),
    result = simulateFreeForAll([you, a, b, c], { deterministic: true, maxRounds: 30 })
  assert.equal(result.won, true, 'the player outlasts the field')
  assert.equal(survivors([you, a, b, c]), 1)
  assert.ok(result.rounds >= 1)
})

test('spread moves hit more than one opponent in a round', () => {
  const you = participant(
      'You',
      [battler({ name: 'You', isPlayer: true, moves: ['earthquake'], attack: 400, speed: 300, types: ['Ground'] })],
      true
    ),
    a = participant('A', [battler({ name: 'A', types: ['Fire'], defense: 20, currentHp: 400, maxHp: 400, speed: 1 })]),
    b = participant('B', [battler({ name: 'B', types: ['Electric'], defense: 20, currentHp: 400, maxHp: 400, speed: 1 })]),
    c = participant('C', [battler({ name: 'C', types: ['Rock'], defense: 20, currentHp: 400, maxHp: 400, speed: 1 })])
  runFreeForAllRound([you, a, b, c], { deterministic: true })
  assert.ok(activeMon(a).currentHp < 400, 'the first foe is hit')
  assert.ok(
    activeMon(b).currentHp < 400 || activeMon(c).currentHp < 400,
    'a second foe is hit by the spread move'
  )
})

test('START_FREE_FOR_ALL charges the Tower and END_MINIGAME records the run', () => {
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    entered = gameReducer(
      { ...started, money: FFA_COST },
      { type: 'START_FREE_FOR_ALL' }
    )
  assert.equal(entered.phase, 'freeForAll')
  assert.equal(entered.money, 0, 'the entry fee is paid')
  const broke = gameReducer(
    { ...started, money: FFA_COST - 1 },
    { type: 'START_FREE_FOR_ALL' }
  )
  assert.equal(broke.phase, 'idle', 'a free-for-all needs the fee')
  const ended = gameReducer(entered, {
    type: 'END_MINIGAME',
    payload: { minigame: 'freeForAll', score: 2, completed: true },
  })
  assert.equal(ended.phase, 'idle')
  assert.equal(ended.minigameRecords.freeForAll.best, 2)
  assert.equal(ended.minigameRecords.freeForAll.completed, true)
})

test('ffaPrize scales with the bouts won', () => {
  assert.ok(ffaPrize(5).money > ffaPrize(1).money)
  assert.equal(typeof ffaPrize(0).label, 'string')
})
