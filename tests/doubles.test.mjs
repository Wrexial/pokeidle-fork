import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  DOUBLES_MAX_ROUNDS,
  SPREAD_MOVES,
  doublesOpponents,
  doublesPrize,
  runDoublesRound,
  simulateDoubles,
} = await import('../src/game/minigames/doubles.js')
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

test('doublesOpponents rolls a pair at the party level', () => {
  const pair = doublesOpponents(50, 2)
  assert.equal(pair.length, 2)
  for (const opponent of pair) {
    assert.ok(pokemonSpecies[opponent.speciesKey], `${opponent.speciesKey} is a real species`)
    assert.ok(opponent.level >= 50 && opponent.level <= 100)
    assert.equal(typeof opponent.name, 'string')
  }
})

test('a doubles round resolves every action and damages the foe', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['thunderbolt'],
      spAttack: 300,
      speed: 200,
      types: ['Electric'],
    }),
    partner = battler({ name: 'Partner', isPlayer: true, moves: ['splash'], speed: 10 }),
    foeX = battler({ name: 'FoeX', types: ['Water'], spDefense: 60, currentHp: 300, maxHp: 300 }),
    foeY = battler({ name: 'FoeY', types: ['Water'], spDefense: 60, currentHp: 300, maxHp: 300 })
  runDoublesRound([ally, partner], [foeX, foeY], { deterministic: true })
  assert.ok(
    foeX.currentHp < 300 || foeY.currentHp < 300,
    'the Electric move damages a Water foe'
  )
})

test('spread moves hit both foes', () => {
  assert.ok(SPREAD_MOVES.has('earthquake'))
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['earthquake'],
      attack: 400,
      speed: 200,
      types: ['Ground'],
    }),
    partner = battler({ name: 'Partner', isPlayer: true, moves: ['splash'], speed: 10 }),
    foeX = battler({ name: 'FoeX', types: ['Normal'], defense: 60, currentHp: 300, maxHp: 300 }),
    foeY = battler({ name: 'FoeY', types: ['Normal'], defense: 60, currentHp: 300, maxHp: 300 })
  runDoublesRound([ally, partner], [foeX, foeY], { deterministic: true })
  assert.ok(foeX.currentHp < 300, 'the first foe is hit')
  assert.ok(foeY.currentHp < 300, 'the second foe is hit too')
})

test('simulateDoubles resolves a whole bout', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['thunderbolt'],
      spAttack: 500,
      speed: 300,
      types: ['Electric'],
    }),
    partner = battler({ name: 'Partner', isPlayer: true, moves: ['splash'], speed: 10 }),
    foeX = battler({ name: 'FoeX', types: ['Water'], currentHp: 50, maxHp: 50, spDefense: 1 }),
    foeY = battler({ name: 'FoeY', types: ['Water'], currentHp: 50, maxHp: 50, spDefense: 1 })
  const outcome = simulateDoubles([ally, partner], [foeX, foeY], { deterministic: true })
  assert.equal(outcome.won, true)
  assert.ok(outcome.rounds >= 1 && outcome.rounds < DOUBLES_MAX_ROUNDS)
  assert.ok(outcome.log.length > 0)
})

test('double-battle prizes scale with bouts won', () => {
  assert.equal(doublesPrize(0).label, 'Knocked out early')
  assert.ok(doublesPrize(10).money > doublesPrize(2).money)
  assert.ok(doublesPrize(4).items.length > 0)
})

test('a doubles heal restores the wounded partner', () => {
  const healer = battler({
      name: 'Healer',
      isPlayer: true,
      moves: ['recover'],
      currentHp: 100,
      maxHp: 400,
      speed: 200,
    }),
    partner = battler({
      name: 'Partner',
      isPlayer: true,
      moves: ['splash'],
      currentHp: 50,
      maxHp: 400,
      speed: 10,
    }),
    foeX = battler({ name: 'FoeX', moves: ['splash'] }),
    foeY = battler({ name: 'FoeY', moves: ['splash'] })
  runDoublesRound([healer, partner], [foeX, foeY], { deterministic: true })
  assert.ok(partner.currentHp > 50, 'the most wounded ally is healed')
})
