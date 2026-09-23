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

/** Run `body` with Math.random pinned to 0 (picks the first move, no crits). @param {() => void} body */
function withZeroRandom(body) {
  const originalRandom = Math.random
  try {
    Math.random = () => 0
    body()
  } finally {
    Math.random = originalRandom
  }
}

/** Run `body` with Math.random pinned to `value`. @param {number} value @param {() => void} body */
function withFixedRandom(value, body) {
  const originalRandom = Math.random
  try {
    Math.random = () => value
    body()
  } finally {
    Math.random = originalRandom
  }
}

test('the new utility moves carry their effects', () => {
  assert.equal(moveData.focusEnergy.effect.type, 'focusEnergy')
  assert.equal(moveData.aquaRing.effect.type, 'aquaRing')
  assert.equal(moveData.wish.effect.type, 'wish')
  assert.equal(moveData.yawn.effect.type, 'yawn')
  assert.equal(moveData.topsyTurvy.effect.type, 'statInvert')
  assert.equal(moveData.painSplit.effect.type, 'painSplit')
  assert.equal(moveData.safeguard.effect.type, 'safeguard')
  assert.equal(moveData.mist.effect.type, 'mist')
  assert.equal(moveData.encore.effect.type, 'encore')
  assert.equal(moveData.disable.effect.type, 'disable')
  assert.equal(moveData.perishSong.effect.type, 'perishSong')
  assert.equal(moveData.tailwind.effect.type, 'tailwind')
  assert.equal(moveData.trickRoom.effect.type, 'trickRoom')
  assert.equal(moveData.trickRoom.priority, -7)
  assert.equal(moveData.destinyBond.effect.type, 'destinyBond')
  assert.equal(moveData.ingrain.effect.type, 'ingrain')
  assert.equal(moveData.laserFocus.effect.type, 'laserFocus')
  assert.equal(moveData.lockOn.effect.type, 'lockOn')
  assert.equal(moveData.mindReader.effect.type, 'lockOn')
  assert.equal(moveData.lifeDew.effect.type, 'heal')
  assert.equal(moveData.lunarBlessing.effect.statusCure, true)
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

test('Safeguard blocks status inflicted by the opponent', () => {
  const statusWith = (/** @type {number} */ safeguardTurns) => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        speed: 80,
        safeguardTurns,
      }),
      enemy = battler({ name: 'Foe', moves: ['spore'], speed: 200 })
    withZeroRandom(() => turn(player, enemy))
    return player.status ?? null
  }
  assert.equal(statusWith(5), null, 'Safeguard blocks Spore')
  assert.equal(statusWith(0), 'sleep', 'Spore lands without Safeguard')
})

test('Mist blocks opponent stat drops', () => {
  const attackWith = (/** @type {number} */ mistTurns) => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        speed: 80,
        mistTurns,
        statStages: { attack: 0 },
      }),
      enemy = battler({ name: 'Foe', moves: ['growl'], speed: 200 })
    withZeroRandom(() => turn(player, enemy))
    return player.statStages.attack
  }
  assert.equal(attackWith(5), 0, 'Mist blocks Growl')
  assert.equal(attackWith(0), -1, 'Growl lands without Mist')
})

test('Encore locks the target into its last move', () => {
  withZeroRandom(() => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['encore'], speed: 200 }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash', 'tackle'],
        speed: 80,
        lastMove: 'tackle',
      })
    turn(player, enemy)
    assert.equal(enemy.encoreMove, 'tackle')
    assert.equal(enemy.encoreTurns, 2, 'set for 3 turns, then ticked down')
    turn(player, enemy)
    assert.equal(enemy.lastMove, 'tackle', 'the encore forced Tackle on the next turn')
  })
})

test('Disable blocks the target last move', () => {
  withZeroRandom(() => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['disable'], speed: 200 }),
      enemy = battler({
        name: 'Foe',
        moves: ['tackle', 'splash'],
        speed: 80,
        lastMove: 'tackle',
      })
    turn(player, enemy)
    assert.equal(enemy.disabledMove, 'tackle')
    assert.equal(enemy.disableTurns, 3, 'set for 4 turns, then ticked down')
    turn(player, enemy)
    assert.equal(enemy.lastMove, 'splash', 'Disable forced the other move')
  })
})

test('Perish Song faints both sides after three turns', () => {
  withZeroRandom(() => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['perishSong'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], speed: 80 })
    turn(player, enemy)
    assert.equal(player.perishTurns, 2)
    assert.equal(enemy.perishTurns, 2)
    turn(player, enemy)
    turn(player, enemy)
    assert.equal(player.currentHp, 0)
    assert.equal(enemy.currentHp, 0)
  })
})

test('Tailwind doubles the holder side Speed for turn order', () => {
  withZeroRandom(() => {
    const firstAttacker = (/** @type {number} */ tailwindTurns) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['tackle'],
          speed: 50,
          tailwindTurns,
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'], speed: 80 })
      return turn(player, enemy).find((/** @type {any} */ event) => event.type === 'attack').message
    }
    assert.match(firstAttacker(0), /^Foe/, 'the faster Foe moves first normally')
    assert.match(firstAttacker(4), /^Player/, 'Tailwind makes the player move first')
  })
})

test('Trick Room makes the slower Pokemon move first', () => {
  withZeroRandom(() => {
    const firstAttacker = (/** @type {number} */ trickRoomTurns) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['tackle'],
          speed: 200,
          trickRoomTurns,
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'], speed: 50 })
      return turn(player, enemy).find((/** @type {any} */ event) => event.type === 'attack').message
    }
    assert.match(firstAttacker(0), /^Player/, 'the faster player moves first normally')
    assert.match(firstAttacker(5), /^Foe/, 'Trick Room makes the slower Foe move first')
  })
})

test('Destiny Bond drags down the attacker that lands the KO', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        speed: 50,
        currentHp: 10,
        maxHp: 400,
        destinyBondTurns: 2,
      }),
      enemy = battler({ name: 'Foe', moves: ['tackle'], speed: 200, attack: 300 })
    turn(player, enemy)
    assert.equal(player.currentHp, 0, 'the holder faints')
    assert.equal(enemy.currentHp, 0, 'and takes the attacker with it')
  })
})

test('Ingrain heals its holder each end of turn', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      currentHp: 100,
      maxHp: 400,
      ingrained: true,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  turn(player, enemy)
  assert.equal(player.currentHp, 125, '1/16 of 400 HP')
})

test('Laser Focus guarantees a critical hit on the next move', () => {
  withFixedRandom(0.99, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        laserFocus: true,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    const events = turn(player, enemy)
    assert.ok(
      events.some((/** @type {any} */ event) => event.type === 'critical'),
      'the hit is a critical'
    )
    assert.equal(player.laserFocus, false, 'and is consumed')
  })
})

test('Lock-On makes the next move land', () => {
  withFixedRandom(0.99, () => {
    const make = (/** @type {number} */ lockOnTurns) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['thunder'],
          speed: 200,
          lockOnTurns,
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'] })
      const events = turn(player, enemy)
      return events.some((/** @type {any} */ event) => event.message?.includes('missed'))
    }
    assert.equal(make(0), true, 'Thunder misses on a bad roll')
    assert.equal(make(2), false, 'Lock-On makes it land')
  })
})

test('Life Dew heals a quarter of the user HP', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['lifeDew'],
      speed: 200,
      currentHp: 100,
      maxHp: 400,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  turn(player, enemy)
  assert.equal(player.currentHp, 200)
})

test('Jungle Healing heals and cures status', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['jungleHealing'],
      speed: 200,
      currentHp: 100,
      maxHp: 400,
      status: 'burn',
      statusTurns: 0,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  turn(player, enemy)
  assert.equal(player.currentHp, 200)
  assert.equal(player.status, null)
})
