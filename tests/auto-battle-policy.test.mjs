import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { chooseBestSwitch, chooseMoveForBattle, AI_SKILL } = await import('../src/game/combat.js')
const {
  DEFAULT_AUTO_BATTLE_POLICY,
  normalizeAutoBattlePolicy,
  chooseAutoHealItem,
} = await import('../src/game/auto-battle-policy.js')

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
    moves: ['tackle'],
    isPlayer: true,
    ...overrides,
  }
}

test('the policy defaults to the classic auto-battler and clamps bad input', () => {
  assert.deepEqual(DEFAULT_AUTO_BATTLE_POLICY, {
    preferStab: true,
    avoidContact: true,
    switchBelow: 0.25,
    itemBelow: 0,
  })
  // A partial policy fills the rest from the defaults.
  const partial = normalizeAutoBattlePolicy({ preferStab: false })
  assert.equal(partial.preferStab, false)
  assert.equal(partial.avoidContact, true)
  // Thresholds clamp into 0..1 and round to whole percents.
  const clamped = normalizeAutoBattlePolicy({ switchBelow: 4, itemBelow: -1 })
  assert.equal(clamped.switchBelow, 1)
  assert.equal(clamped.itemBelow, 0)
  // Non-objects and garbage fall back to the defaults rather than throwing.
  assert.deepEqual(normalizeAutoBattlePolicy(null), DEFAULT_AUTO_BATTLE_POLICY)
  assert.deepEqual(normalizeAutoBattlePolicy({ switchBelow: 'x' }), DEFAULT_AUTO_BATTLE_POLICY)
})

test('the item policy only heals when it is needed and affordable', () => {
  const hurt = { currentHp: 60, maxHp: 100 }
  // Off (0) or a full-HP Pokemon never drinks.
  assert.equal(chooseAutoHealItem({ potion: 3 }, hurt, 0), null)
  assert.equal(chooseAutoHealItem({ potion: 3 }, { currentHp: 100, maxHp: 100 }, 0.5), null)
  // Above the threshold it holds onto the item.
  assert.equal(chooseAutoHealItem({ potion: 3 }, { currentHp: 80, maxHp: 100 }, 0.5), null)
  // Below it, the smallest potion that clears the threshold wins.
  assert.equal(chooseAutoHealItem({ potion: 3, superPotion: 1 }, hurt, 0.7), 'potion')
  // A bigger potion is used when a small one can't clear the threshold.
  assert.equal(
    chooseAutoHealItem({ potion: 3, superPotion: 1 }, { currentHp: 10, maxHp: 100 }, 0.7),
    'superPotion'
  )
  // No healing item in stock (or only candy) is a no-op.
  assert.equal(chooseAutoHealItem({ pokeball: 5 }, hurt, 0.7), null)
  assert.equal(chooseAutoHealItem({}, hurt, 0.7), null)
})

test('prefer STAB tips a near-tie toward the same-type move', () => {
  // Water Gun (Water 40, STAB) vs Horn Attack (Normal 65). Its 1.5x STAB puts
  // Water Gun at 60, just under Horn Attack's 65 — the policy bonus flips it.
  const attacker = battler({ types: ['Water'], moves: ['waterGun', 'hornAttack'] }),
    defender = battler({ types: ['Normal'], isPlayer: false, ability: 'none' })
  assert.equal(chooseMoveForBattle(attacker, defender, null, AI_SKILL.smartest).moveId, 'hornAttack')
  assert.equal(
    chooseMoveForBattle(attacker, defender, null, AI_SKILL.smartest, false, { preferStab: true })
      .moveId,
    'waterGun'
  )
})

test('avoid contact steers away from a Rocky Helmet holder', () => {
  // Tackle (Normal 40, contact, STAB at 60) vs Ember (Fire 40, no contact).
  // Against a Rocky Helmet the contact penalty drops Tackle to 30, so the
  // policy takes Ember even though it is the weaker raw attack.
  const attacker = battler({ types: ['Normal'], moves: ['tackle', 'ember'] }),
    defender = battler({ types: ['Normal'], isPlayer: false, heldItem: 'rockyHelmet' })
  assert.equal(chooseMoveForBattle(attacker, defender, null, AI_SKILL.smartest).moveId, 'tackle')
  assert.equal(
    chooseMoveForBattle(attacker, defender, null, AI_SKILL.smartest, false, { avoidContact: true })
      .moveId,
    'ember'
  )
  // Rough Skin punishes contact the same way.
  assert.equal(
    chooseMoveForBattle(
      attacker,
      battler({ types: ['Normal'], isPlayer: false, ability: 'roughSkin' }),
      null,
      AI_SKILL.smartest,
      false,
      { avoidContact: true }
    ).moveId,
    'ember'
  )
})

test('a low-HP switch pivots even when the active Pokemon still wins the matchup', () => {
  const hurt = battler({
      speciesKey: 'venusaur',
      types: ['Grass', 'Poison'],
      moves: ['energyBall'],
      currentHp: 80,
      maxHp: 400,
    }),
    healthy = battler({
      speciesKey: 'charizard',
      types: ['Fire', 'Flying'],
      moves: ['ember'],
      currentHp: 400,
      maxHp: 400,
    }),
    foe = battler({
      speciesKey: 'blastoise',
      types: ['Water'],
      moves: ['waterGun'],
      isPlayer: false,
    })
  // Grass resists Water, so it would normally stay in.
  assert.equal(chooseBestSwitch(hurt, [hurt, healthy], foe, 0), -1)
  // Below the policy threshold it hands the field to the healthier teammate.
  assert.equal(chooseBestSwitch(hurt, [hurt, healthy], foe, 0, false, { switchBelow: 0.5 }), 1)
  // Nobody healthier: it stays in rather than ping-ponging.
  assert.equal(
    chooseBestSwitch(hurt, [hurt, battler({ currentHp: 40, maxHp: 400 })], foe, 0, false, {
      switchBelow: 0.5,
    }),
    -1
  )
})
