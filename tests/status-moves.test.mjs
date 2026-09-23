import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn } = await import('../src/game/combat.js')
const { moveData } = await import('../src/data/gameData.js')

/**
 * @param {Record<string, any>} [overrides]
 * @returns {any}
 */
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

/** Run one turn with the player going first. @param {any} player @param {any} enemy */
const turn = (player, enemy) => resolveBattleTurn(player, enemy, false, false)

test('the new utility moves carry their effects', () => {
  assert.equal(moveData.focusEnergy.effect.type, 'focusEnergy')
  assert.equal(moveData.aquaRing.effect.type, 'aquaRing')
  assert.equal(moveData.wish.effect.type, 'wish')
  assert.equal(moveData.yawn.effect.type, 'yawn')
  assert.equal(moveData.topsyTurvy.effect.type, 'statInvert')
  assert.equal(moveData.painSplit.effect.type, 'painSplit')
})

test('Focus Energy raises the user critical-hit stage', () => {
  const player = battler({ name: 'Player', isPlayer: true, moves: ['focusEnergy'], speed: 200 }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  turn(player, enemy)
  assert.equal(player.focusEnergy, true)
})

test('Aqua Ring heals its holder each end of turn', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      currentHp: 100,
      maxHp: 400,
      aquaRing: true,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  turn(player, enemy)
  assert.equal(player.currentHp, 125, '1/16 of 400 HP')
})

test('Wish heals the user at the end of the next turn', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      currentHp: 100,
      maxHp: 400,
      wishTurns: 2,
      wishHeal: 200,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  turn(player, enemy)
  assert.equal(player.currentHp, 100, 'the wish has not landed yet')
  turn(player, enemy)
  assert.equal(player.currentHp, 300, 'the wish lands on the second turn')
})

test('Yawn puts its target to sleep after two turns', () => {
  const player = battler({ name: 'Player', isPlayer: true, moves: ['splash'], speed: 200 }),
    enemy = battler({ name: 'Foe', moves: ['splash'], yawnTurns: 2 })
  turn(player, enemy)
  assert.equal(enemy.status ?? null, null, 'still just drowsy')
  turn(player, enemy)
  assert.equal(enemy.status, 'sleep')
})

test('Topsy-Turvy reverses the target stat changes', () => {
  const player = battler({ name: 'Player', isPlayer: true, moves: ['topsyTurvy'], speed: 200 }),
    enemy = battler({ name: 'Foe', moves: ['splash'], statStages: { attack: 2, speed: -1 } })
  turn(player, enemy)
  assert.equal(enemy.statStages.attack, -2)
  assert.equal(enemy.statStages.speed, 1)
})

test('Pain Split averages both HP bars', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['painSplit'],
      speed: 200,
      currentHp: 100,
      maxHp: 400,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 400, maxHp: 400 })
  turn(player, enemy)
  assert.equal(player.currentHp, 250)
  assert.equal(enemy.currentHp, 250)
})
