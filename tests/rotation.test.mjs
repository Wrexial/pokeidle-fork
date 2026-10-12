import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  ROTATION_COST,
  ROTATION_TEAM_SIZE,
  chooseRotation,
  healthyIndices,
  nextHealthyIndex,
  rotationOpponents,
  rotationPrize,
  runRotationRound,
  simulateRotation,
} = await import('../src/game/minigames/rotation.js')
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

test('rotationOpponents rolls a trio of real species', () => {
  const trio = rotationOpponents(55, 2)
  assert.equal(trio.length, ROTATION_TEAM_SIZE)
  for (const opponent of trio) {
    assert.ok(pokemonSpecies[opponent.speciesKey], `${opponent.speciesKey} is a real species`)
    assert.ok(opponent.level >= 55 && opponent.level <= 100)
  }
})

test('healthyIndices and nextHealthyIndex skip fainted members', () => {
  const team = [
    battler({ name: 'A' }),
    battler({ name: 'B', currentHp: 0 }),
    battler({ name: 'C' }),
  ]
  assert.deepEqual(healthyIndices(team), [0, 2])
  assert.equal(nextHealthyIndex(team, 0), 2)
  assert.equal(nextHealthyIndex(team, 2), 0, 'it wraps around')
  assert.equal(nextHealthyIndex(team, -1), 0)
  assert.equal(nextHealthyIndex([battler({ currentHp: 0 })], 0), 0, 'stays put when all are down')
})

test('chooseRotation steps to the better type matchup', () => {
  const fire = battler({ name: 'Fire', types: ['Fire'], moves: ['ember'] }),
    water = battler({ name: 'Water', types: ['Water'], moves: ['waterGun'] }),
    foe = battler({ name: 'Foe', types: ['Fire'] }),
    team = [fire, water]
  assert.equal(chooseRotation(team, 0, foe), 1, 'the Water body answers a Fire foe')
  // A single healthy member has nowhere to go.
  assert.equal(chooseRotation([fire], 0, foe), 0)
  assert.equal(chooseRotation(team, 1, battler({ types: ['Water'] })), 1, 'a worse swap is ignored')
})

test('a rotation round resolves the active pair and trades damage', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      types: ['Electric'],
      moves: ['thunderbolt'],
      spAttack: 300,
      speed: 200,
    }),
    partner = battler({ name: 'Partner', isPlayer: true, moves: ['splash'], speed: 5 }),
    foe = battler({ name: 'Foe', types: ['Water'], spDefense: 60, currentHp: 300, maxHp: 300, speed: 1 }),
    result = runRotationRound([ally, partner], 0, [foe], 0, { deterministic: true })
  assert.ok(result.events.length > 0, 'the round produced events')
  assert.ok(foe.currentHp < 300, 'the active foe took damage')
  assert.equal(typeof result.allyActive, 'number')
  assert.equal(typeof result.foeActive, 'number')
})

test('simulateRotation runs to a winner', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      types: ['Electric'],
      moves: ['thunderbolt'],
      spAttack: 500,
      speed: 300,
    }),
    foe = battler({ name: 'Foe', types: ['Water'], spDefense: 1, currentHp: 200, maxHp: 200, speed: 1 }),
    result = simulateRotation([ally], [foe], { deterministic: true, maxRounds: 20 })
  assert.equal(result.won, true)
  assert.ok(result.rounds >= 1)
})

test('START_ROTATION charges the Tower and END_MINIGAME records the run', () => {
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    entered = gameReducer(
      { ...started, money: ROTATION_COST },
      { type: 'START_ROTATION' }
    )
  assert.equal(entered.phase, 'rotation')
  assert.equal(entered.money, 0, 'the entry fee is paid')
  const broke = gameReducer(
    { ...started, money: ROTATION_COST - 1 },
    { type: 'START_ROTATION' }
  )
  assert.equal(broke.phase, 'idle', 'a rotation run needs the fee')
  const ended = gameReducer(entered, {
    type: 'END_MINIGAME',
    payload: { minigame: 'rotation', score: 4, completed: true },
  })
  assert.equal(ended.phase, 'idle')
  assert.equal(ended.minigameRecords.rotation.best, 4)
  assert.equal(ended.minigameRecords.rotation.completed, true)
})

test('rotationPrize scales with the bouts won', () => {
  assert.ok(rotationPrize(4).money > rotationPrize(1).money)
  assert.equal(typeof rotationPrize(0).label, 'string')
})
