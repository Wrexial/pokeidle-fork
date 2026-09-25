import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { variablePower, withVariablePower } = await import('../src/game/combat/variable-power.js')

/** @param {Record<string, any>} [overrides] */
const battler = (overrides = {}) => ({
  speciesKey: 'charizard',
  speed: 100,
  currentHp: 100,
  maxHp: 100,
  statStages: {},
  ...overrides,
})

test('weight drives Heat Crash and Low Kick', () => {
  // Snorlax (460 kg) vs Caterpie (2.9 kg).
  assert.equal(
    variablePower('heatCrash', battler({ speciesKey: 'snorlax' }), battler({ speciesKey: 'caterpie' })),
    120
  )
  assert.equal(
    variablePower('heavySlam', battler({ speciesKey: 'caterpie' }), battler({ speciesKey: 'snorlax' })),
    40
  )
  assert.equal(variablePower('lowKick', battler(), battler({ speciesKey: 'snorlax' })), 120)
  assert.equal(variablePower('grassKnot', battler(), battler({ speciesKey: 'caterpie' })), 20)
})

test('speed drives Electro Ball and Gyro Ball', () => {
  assert.equal(variablePower('electroBall', battler({ speed: 200 }), battler({ speed: 20 })), 150)
  assert.equal(variablePower('electroBall', battler({ speed: 20 }), battler({ speed: 200 })), 40)
  assert.equal(variablePower('gyroBall', battler({ speed: 50 }), battler({ speed: 150 })), 76)
})

test('HP scales Flail, Eruption, Wring Out and friends', () => {
  assert.equal(variablePower('flail', battler({ currentHp: 0 }), battler()), 200)
  assert.equal(variablePower('flail', battler({ currentHp: 100 }), battler()), 40)
  assert.equal(
    variablePower('eruption', battler({ currentHp: 50, maxHp: 100 }), battler()),
    75
  )
  assert.equal(
    variablePower('wringOut', battler(), battler({ currentHp: 0 })),
    1
  )
})

test('boosts and friendship drive Stored Power, Punishment, Return and Frustration', () => {
  assert.equal(
    variablePower('storedPower', battler({ statStages: { attack: 2, speed: 1 } }), battler()),
    80
  )
  assert.equal(variablePower('punishment', battler(), battler({ statStages: { attack: 2 } })), 100)
  assert.equal(variablePower('return', battler({ friendship: 255 }), battler()), 102)
  assert.equal(variablePower('frustration', battler({ friendship: 0 }), battler()), 102)
})

test('an ordinary move has no variable power', () => {
  assert.equal(variablePower('tackle', battler(), battler()), null)
  const normal = { power: 40 }
  assert.equal(withVariablePower('tackle', battler(), battler(), normal), normal)
  const variable = withVariablePower(
    'heatCrash',
    battler({ speciesKey: 'snorlax' }),
    battler({ speciesKey: 'caterpie' }),
    { power: 0, type: 'Fire' }
  )
  assert.equal(variable.power, 120)
})
