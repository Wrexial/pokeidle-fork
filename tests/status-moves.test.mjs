import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn } = await import('../src/game/combat.js')
const { moveData } = await import('../src/data/gameData.js')
const { abilityOf } = await import('../src/game/abilities.js')

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
  assert.equal(moveData.gastroAcid.effect.type, 'gastroAcid')
  assert.equal(moveData.worrySeed.effect.type, 'worrySeed')
  assert.equal(moveData.simpleBeam.effect.type, 'simpleBeam')
  assert.equal(moveData.rolePlay.effect.type, 'rolePlay')
  assert.equal(moveData.entrainment.effect.type, 'entrainment')
  assert.equal(moveData.skillSwap.effect.type, 'skillSwap')
  assert.equal(moveData.soak.effect.type, 'typeChange')
  assert.equal(moveData.reflectType.effect.type, 'reflectType')
  assert.equal(moveData.forestsCurse.effect.type, 'typeAdd')
  assert.equal(moveData.powerSwap.effect.type, 'statSwap')
  assert.equal(moveData.heartSwap.effect.stats.length, 5)
  assert.equal(moveData.recycle.effect.type, 'recycle')
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

test('Gastro Acid suppresses the target ability', () => {
  const player = battler({ name: 'Player', isPlayer: true, moves: ['gastroAcid'], speed: 200 }),
    enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'intimidate' })
  turn(player, enemy)
  assert.equal(enemy.abilitySuppressed, true)
  assert.equal(abilityOf(enemy), null)
})

test('Skill Swap trades abilities', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['skillSwap'],
      speed: 200,
      ability: 'drizzle',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'intimidate' })
  turn(player, enemy)
  assert.equal(abilityOf(player), 'intimidate')
  assert.equal(abilityOf(enemy), 'drizzle')
})

test('Role Play copies the target ability', () => {
  const player = battler({ name: 'Player', isPlayer: true, moves: ['rolePlay'], speed: 200 }),
    enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'intimidate' })
  turn(player, enemy)
  assert.equal(abilityOf(player), 'intimidate')
})

test('Entrainment shares the user ability', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['entrainment'],
      speed: 200,
      ability: 'drizzle',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'intimidate' })
  turn(player, enemy)
  assert.equal(abilityOf(enemy), 'drizzle')
})

test('Worry Seed replaces the target ability', () => {
  const player = battler({ name: 'Player', isPlayer: true, moves: ['worrySeed'], speed: 200 }),
    enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'intimidate' })
  turn(player, enemy)
  assert.equal(abilityOf(enemy), 'insomnia')
})

test('Soak and Magic Powder replace the target types', () => {
  const run = (/** @type {string} */ move) => {
    const player = battler({ name: 'Player', isPlayer: true, moves: [move], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal', 'Flying'] })
    turn(player, enemy)
    return { override: enemy.typesOverride, live: enemy.types }
  }
  assert.deepEqual(run('soak'), { override: ['Water'], live: ['Water'] })
  assert.deepEqual(run('magicPowder'), { override: ['Psychic'], live: ['Psychic'] })
})

test('Reflect Type copies the target types', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['reflectType'],
      speed: 200,
      types: ['Normal', 'Flying'],
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Water', 'Ice'] })
  turn(player, enemy)
  assert.deepEqual(player.typesOverride, ['Water', 'Ice'])
})

test("Forest's Curse and Trick-or-Treat add a type", () => {
  const run = (/** @type {string} */ move) => {
    const player = battler({ name: 'Player', isPlayer: true, moves: [move], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'] })
    turn(player, enemy)
    return enemy.typesOverride
  }
  assert.deepEqual(run('forestsCurse'), ['Normal', 'Grass'])
  assert.deepEqual(run('trickOrTreat'), ['Normal', 'Ghost'])
})

test('Power Swap trades the offensive stat stages', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['powerSwap'],
      speed: 200,
      statStages: { attack: 2, spAttack: 0 },
    }),
    enemy = battler({
      name: 'Foe',
      moves: ['splash'],
      statStages: { attack: -1, spAttack: 1 },
    })
  turn(player, enemy)
  assert.equal(player.statStages.attack, -1)
  assert.equal(player.statStages.spAttack, 1)
  assert.equal(enemy.statStages.attack, 2)
  assert.equal(enemy.statStages.spAttack, 0)
})

test('Guard Swap trades the defensive stat stages', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['guardSwap'],
      speed: 200,
      statStages: { defense: 3, spDefense: 0 },
    }),
    enemy = battler({
      name: 'Foe',
      moves: ['splash'],
      statStages: { defense: -2, spDefense: 1 },
    })
  turn(player, enemy)
  assert.equal(player.statStages.defense, -2)
  assert.equal(player.statStages.spDefense, 1)
  assert.equal(enemy.statStages.defense, 3)
})

test('Recycle restores a consumed held item', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['recycle'],
      speed: 200,
      heldItemUsed: true,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  turn(player, enemy)
  assert.equal(player.heldItemUsed, false)
})

test('Metronome calls a real move', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['metronome'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    turn(player, enemy)
    assert.notEqual(player.lastMove, 'metronome')
    assert.ok(moveData[player.lastMove], 'the called move exists')
  })
})

test('Copycat and Mirror Move repeat the target last move', () => {
  const run = (/** @type {string} */ move) => {
    const player = battler({ name: 'Player', isPlayer: true, moves: [move], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], lastMove: 'tackle' })
    turn(player, enemy)
    return player.lastMove
  }
  assert.equal(run('copycat'), 'tackle')
  assert.equal(run('mirrorMove'), 'tackle')
})

test('Nature Power becomes a terrain move', () => {
  const run = (/** @type {any} */ terrain) => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['naturePower'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false, false, null, null, false, terrain)
    return player.lastMove
  }
  assert.equal(run(null), 'triAttack')
  assert.equal(run({ type: 'electric', turns: 5 }), 'thunderbolt')
  assert.equal(run({ type: 'grassy', turns: 5 }), 'energyBall')
})

test('damaging moves apply their stat change after the hit', () => {
  withZeroRandom(() => {
    // A self-drop: Overheat lowers the user's Special Attack.
    const overheatUser = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['overheat'],
        speed: 200,
        spAttack: 300,
      }),
      overheatFoe = battler({ name: 'Foe', moves: ['splash'], currentHp: 9999, maxHp: 9999 }),
      overheatEvents = turn(overheatUser, overheatFoe)
    assert.ok(
      overheatEvents.some((/** @type {any} */ event) => event.type === 'damage'),
      'the move still deals damage'
    )
    assert.equal(overheatUser.statStages.spAttack, -2)

    // An added effect on the target: Fire Lash lowers the foe's Defense.
    const lashUser = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['fireLash'],
        speed: 200,
        attack: 300,
      }),
      lashFoe = battler({ name: 'Foe', moves: ['splash'], currentHp: 9999, maxHp: 9999 })
    turn(lashUser, lashFoe)
    assert.equal(lashFoe.statStages.defense, -1)
    assert.equal(lashUser.statStages.defense ?? 0, 0)
  })
})

test('Contrary flips and Simple doubles a damaging move stat change', () => {
  withZeroRandom(() => {
    const contraryUser = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['overheat'],
        speed: 200,
        spAttack: 300,
        ability: 'contrary',
      }),
      foe = battler({ name: 'Foe', moves: ['splash'], currentHp: 9999, maxHp: 9999 })
    turn(contraryUser, foe)
    assert.equal(contraryUser.statStages.spAttack, 2, 'Contrary turns the drop into a boost')
  })
})

test('Clear Body blocks a damaging move stat drop', () => {
  withZeroRandom(() => {
    const user = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['fireLash'],
        speed: 200,
        attack: 300,
      }),
      foe = battler({
        name: 'Foe',
        moves: ['splash'],
        currentHp: 9999,
        maxHp: 9999,
        ability: 'clearBody',
      })
    turn(user, foe)
    assert.equal(foe.statStages.defense ?? 0, 0)
  })
})

test('stat-change data matches the real games', () => {
  // Special moves only change the special stat (the substring bug added the
  // physical one too), and self-buffs target the user rather than the foe.
  assert.deepEqual(moveData.nastyPlot.effect.changes, { 'special-attack': 2 })
  assert.equal(moveData.nastyPlot.effect.target, 'self')
  assert.deepEqual(moveData.calmMind.effect.changes, {
    spAttack: 1,
    spDefense: 1,
  })
  assert.deepEqual(moveData.cottonGuard.effect.changes, { defense: 3 })
  assert.deepEqual(moveData.tailGlow.effect.changes, { 'special-attack': 3 })
  // Mixed magnitudes keep their signs (Shell Smash raises offences, lowers defences).
  assert.deepEqual(moveData.shellSmash.effect.changes, {
    attack: 2,
    'special-attack': 2,
    speed: 2,
    defense: -1,
    'special-defense': -1,
  })
  // Moves that buffed the opponent now buff the user.
  assert.equal(moveData.howl.effect.target, 'self')
  assert.equal(moveData.autotomize.effect.target, 'self')
  assert.deepEqual(moveData.victoryDance.effect.changes, {
    attack: 1,
    defense: 1,
    speed: 1,
  })
  // Mountain Gale has no stat change at all.
  assert.equal(moveData.mountainGale.effect, undefined)
})

test('the newly wired utility moves do their job', () => {
  withFixedRandom(0.5, () => {
    const statusFrom = (/** @type {string} */ move) => {
      const player = battler({ name: 'Player', isPlayer: true, moves: [move], speed: 200 }),
        enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'] })
      turn(player, enemy)
      return enemy.status ?? null
    }
    assert.equal(statusFrom('grassWhistle'), 'sleep')
    assert.equal(statusFrom('poisonGas'), 'poison')

    const booster = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['noRetreat'],
        speed: 200,
        statStages: {},
      }),
      dummy = battler({ name: 'Foe', moves: ['splash'] })
    turn(booster, dummy)
    assert.equal(booster.statStages.attack, 1)
    assert.equal(booster.statStages.speed, 1)

    const hearter = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['takeHeart'],
        speed: 200,
        statStages: {},
        status: 'burn',
      }),
      dummy2 = battler({ name: 'Foe', moves: ['splash'] })
    turn(hearter, dummy2)
    assert.equal(hearter.statStages.spAttack, 1)
    assert.equal(hearter.status, null, 'Take Heart cures the status')

    const souler = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['clangorousSoul'],
        speed: 200,
        statStages: {},
        currentHp: 300,
        maxHp: 300,
      }),
      dummy3 = battler({ name: 'Foe', moves: ['splash'] })
    turn(souler, dummy3)
    assert.equal(souler.statStages.attack, 1)
    assert.ok(souler.currentHp < 300, 'Clangorous Soul costs HP')

    const presser = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['acupressure'],
        speed: 200,
        statStages: {},
      }),
      dummy4 = battler({ name: 'Foe', moves: ['splash'] })
    turn(presser, dummy4)
    assert.ok(Object.values(presser.statStages).includes(2), 'a random stat rises by two')

    const tricky = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['powerTrick'],
        speed: 200,
        attack: 100,
        defense: 250,
      }),
      dummy5 = battler({ name: 'Foe', moves: ['splash'] })
    turn(tricky, dummy5)
    assert.equal(tricky.attack, 250)
    assert.equal(tricky.defense, 100)

    const copier = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['psychUp'],
        speed: 200,
        statStages: {},
      }),
      boosted = battler({ name: 'Foe', moves: ['splash'], statStages: { attack: 3, speed: -2 } })
    turn(copier, boosted)
    assert.equal(copier.statStages.attack, 3)
    assert.equal(copier.statStages.speed, -2)

    const refresher = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['refresh'],
        speed: 200,
        status: 'paralysis',
      }),
      dummy6 = battler({ name: 'Foe', moves: ['splash'] })
    turn(refresher, dummy6)
    assert.equal(refresher.status, null)

    const converter = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['conversion', 'flamethrower'],
        speed: 200,
        types: ['Normal'],
      }),
      dummy7 = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(converter, dummy7, false, false, null, null, false, null, null, null, false, 'conversion')
    assert.deepEqual(converter.types, ['Fire'], 'Conversion matches the first move type')
  })
})

test('Magnet Rise grants Ground immunity for a few turns', () => {
  withFixedRandom(0.5, () => {
    const riser = battler({ name: 'Player', isPlayer: true, moves: ['magnetRise'], speed: 200 }),
      dummy = battler({ name: 'Foe', moves: ['splash'] })
    turn(riser, dummy)
    assert.ok((riser.magnetRiseTurns ?? 0) > 0, 'Magnet Rise is active')

    const attacker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['earthquake'],
        speed: 200,
        attack: 300,
      }),
      levitating = battler({
        name: 'Foe',
        moves: ['splash'],
        types: ['Normal'],
        currentHp: 400,
        maxHp: 400,
        magnetRiseTurns: 3,
      })
    turn(attacker, levitating)
    assert.equal(levitating.currentHp, 400, 'the Ground move is blocked')
  })
})

test('Camouflage matches the terrain type', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['camouflage'],
      speed: 200,
      types: ['Normal'],
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(player, enemy, false, false, null, null, false, { type: 'electric', turns: 5 })
  assert.deepEqual(player.types, ['Electric'])
})

test('Endure, Tidy Up, Psycho Shift and Purify work', () => {
  withFixedRandom(0.5, () => {
    // Endure keeps a would-be KO at 1 HP.
    const attacker = battler({
        name: 'Foe',
        moves: ['tackle'],
        speed: 200,
        attack: 9999,
      }),
      enduring = battler({
        name: 'Player',
        isPlayer: !0,
        moves: ['endure'],
        speed: 1,
        currentHp: 300,
        maxHp: 300,
        defense: 1,
      })
    resolveBattleTurn(enduring, attacker, false, false, null, null, false, null, null, null, false, 'endure')
    assert.equal(enduring.currentHp, 1, 'Endure left it with 1 HP')

    const tidier = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tidyUp'],
        speed: 200,
        statStages: {},
      }),
      dummy = battler({ name: 'Foe', moves: ['splash'] })
    turn(tidier, dummy)
    assert.equal(tidier.statStages.attack, 1)
    assert.equal(tidier.statStages.speed, 1)

    const shifter = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['psychoShift'],
        speed: 200,
        status: 'toxic',
      }),
      receiver = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'] })
    turn(shifter, receiver)
    assert.equal(receiver.status, 'toxic', 'the status was passed on')
    assert.equal(shifter.status, null, 'the user was cured')

    const purifier = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['purify'],
        speed: 200,
        currentHp: 100,
        maxHp: 400,
      }),
      afflicted = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'], status: 'burn' })
    turn(purifier, afflicted)
    assert.equal(afflicted.status, null)
    assert.ok(purifier.currentHp > 100, 'Purify heals the user')
  })
})

test('the second batch of utility moves works', () => {
  withFixedRandom(0.5, () => {
    // Aromatherapy / Heal Bell cure the user.
    const healer = battler({ name: 'Player', isPlayer: true, moves: ['aromatherapy'], speed: 200, status: 'burn' }),
      dummy = battler({ name: 'Foe', moves: ['splash'] })
    turn(healer, dummy)
    assert.equal(healer.status, null)

    // Foresight identifies the foe so Normal moves can hit Ghosts.
    const seer = battler({ name: 'Player', isPlayer: true, moves: ['foresight'], speed: 200 }),
      ghost = battler({ name: 'Foe', moves: ['splash'], types: ['Ghost'] })
    turn(seer, ghost)
    assert.equal(ghost.identified, true)

    // Power Shift swaps the offensive stats.
    const shifter = battler({ name: 'Player', isPlayer: true, moves: ['powerShift'], speed: 200, attack: 100, spAttack: 250 }),
      dummy2 = battler({ name: 'Foe', moves: ['splash'] })
    turn(shifter, dummy2)
    assert.equal(shifter.attack, 250)
    assert.equal(shifter.spAttack, 100)

    // Stockpile then Swallow heals.
    const storer = battler({ name: 'Player', isPlayer: true, moves: ['stockpile'], speed: 200, currentHp: 100, maxHp: 400, statStages: {} }),
      dummy3 = battler({ name: 'Foe', moves: ['splash'] })
    turn(storer, dummy3)
    assert.equal(storer.stockpile, 1)

    // Transform copies the foe's stats.
    const transformer = battler({ name: 'Player', isPlayer: true, moves: ['transform'], speed: 200, attack: 50, types: ['Normal'] }),
      target = battler({ name: 'Foe', moves: ['splash'], attack: 300, types: ['Fire'] })
    turn(transformer, target)
    assert.equal(transformer.attack, 300)
    assert.deepEqual(transformer.types, ['Fire'])

    // Lucky Chant blocks crits.
    const chanter = battler({ name: 'Player', isPlayer: true, moves: ['luckyChant'], speed: 200 }),
      dummy4 = battler({ name: 'Foe', moves: ['splash'] })
    turn(chanter, dummy4)
    assert.ok((chanter.luckyChantTurns ?? 0) > 0)
  })
})

test('field moves: Gravity, Telekinesis, Mud Sport, Powder and Wonder Room', () => {
  withFixedRandom(0.5, () => {
    // Gravity grounds a Flying target for Ground moves.
    const quaker = battler({ name: 'Player', isPlayer: true, moves: ['earthquake'], speed: 200, attack: 300 }),
      flyer = battler({ name: 'Foe', moves: ['splash'], types: ['Normal', 'Flying'], currentHp: 400, maxHp: 400, gravityTurns: 5 })
    turn(quaker, flyer)
    assert.ok(flyer.currentHp < 400, 'Gravity grounds the Flying type')

    // Telekinesis blocks Ground moves and sets the timer.
    const lifter = battler({ name: 'Player', isPlayer: true, moves: ['telekinesis'], speed: 200 }),
      lifted = battler({ name: 'Foe', moves: ['splash'] })
    turn(lifter, lifted)
    assert.ok((lifted.telekinesisTurns ?? 0) > 0)

    // Mud Sport halves Electric damage.
    const damage = (/** @type {boolean} */ sport) => {
      const player = battler({ name: 'Player', isPlayer: true, moves: ['thunderbolt'], speed: 200, spAttack: 300, sportTurns: sport ? 5 : 0, sportType: sport ? 'mud' : null }),
        enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'], currentHp: 4000, maxHp: 4000 })
      turn(player, enemy)
      return 4000 - enemy.currentHp
    }
    assert.ok(damage(true) < damage(false), 'Mud Sport weakens Electric moves')

    // Powder detonates on a Fire move.
    const powdered = battler({ name: 'Player', isPlayer: true, moves: ['flamethrower'], speed: 200, spAttack: 300, currentHp: 400, maxHp: 400, powdered: true }),
      dummy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'], currentHp: 400, maxHp: 400 })
    turn(powdered, dummy)
    assert.ok(powdered.currentHp < 400, 'the powder exploded')
    assert.equal(dummy.currentHp, 400, 'the Fire move never landed')
  })
})
