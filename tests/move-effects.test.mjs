import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { AI_SKILL, calculateDamage, chooseMoveForBattle, resolveBattleTurn } = await import('../src/game/combat.js')
const { moveData } = await import('../src/data/gameData.js')
const { genderForPokemon } = await import('../src/game/breeding.js')
const { describeMove, moveTooltip } = await import('../src/game/move-info.js')
const { abilityTooltip } = await import('../src/data/ability-info.js')

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

/** @param {() => void} body */
function withZeroRandom(body) {
  const originalRandom = Math.random
  try {
    Math.random = () => 0
    body()
  } finally {
    Math.random = originalRandom
  }
}

test('move overrides enrich the loaded move table', () => {
  assert.deepEqual(moveData.bulletSeed.multiHit, [2, 5])
  assert.equal(moveData.slash.critStage, 1)
  assert.equal(moveData.wickedBlow.critStage, 3)
  assert.equal(moveData.recover.effect.type, 'heal')
  assert.equal(moveData.rest.effect.percentage, 100)
  assert.equal(moveData.rest.effect.status, 'sleep')
  assert.equal(moveData.protect.protect, true)
  assert.equal(moveData.protect.priority, 4)
  assert.equal(moveData.extremeSpeed.priority, 2)
  assert.equal(moveData.gMaxDrumSolo.category, 'physical')
  assert.equal(moveData.gMaxHydrosnipe.category, 'special')
  assert.deepEqual(moveData.calmMind.effect.changes, { spAttack: 1, spDefense: 1 })
})

test('a healing move restores HP when the auto-battler is low', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['recover'],
      currentHp: 20,
      maxHp: 400,
      speed: 200,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] }),
    events = resolveBattleTurn(player, enemy, false)
  assert.ok(
    events.some((/** @type {any} */ event) => event.type === 'heal'),
    'a heal event should fire'
  )
  assert.ok(player.currentHp > 20, 'the battler should recover HP')
})

test('Rest heals fully and puts its user to sleep', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['rest'],
      currentHp: 20,
      maxHp: 400,
      speed: 200,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] }),
    events = resolveBattleTurn(player, enemy, false)
  assert.equal(player.currentHp, 400)
  assert.equal(player.status, 'sleep')
  assert.ok(events.some((/** @type {any} */ event) => event.type === 'heal'))
})

test('multi-hit moves strike more than once', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['bulletSeed'],
        speed: 200,
        attack: 400,
      }),
      enemy = battler({ name: 'Foe', currentHp: 9999, maxHp: 9999, defense: 500 }),
      events = resolveBattleTurn(player, enemy, false),
      damageEvent = events.find((/** @type {any} */ event) => event.type === 'damage')
    assert.ok(damageEvent, 'the move should deal damage')
    assert.match(damageEvent.message, /2 hits/)
  })
})

test('a maxed crit stage always lands a critical hit', () => {
  withZeroRandom(() => {
    const result = calculateDamage(
      50,
      200,
      100,
      moveData.wickedBlow,
      ['Dark'],
      ['Normal'],
      0,
      0,
      3
    )
    assert.equal(result.isCrit, true)
  })
})

test('Protect blocks the opponent for the turn', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['protect'],
        speed: 1,
        currentHp: 400,
      }),
      enemy = battler({ name: 'Foe', moves: ['tackle'], speed: 200 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(
      events.some((/** @type {any} */ event) => event.type === 'protect'),
      'Protect should fire'
    )
    assert.ok(
      !events.some(
        (/** @type {any} */ event) => event.type === 'damage' && event.data?.target === 'player'
      ),
      'the opponent should not damage the protected battler'
    )
  })
})

test('Calm Mind raises special stats, not attack and defense', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['calmMind'],
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.statStages.spAttack, 1)
    assert.equal(player.statStages.spDefense, 1)
    assert.equal(player.statStages.attack ?? 0, 0)
    assert.equal(player.statStages.defense ?? 0, 0)
  })
})

test('paralysis and toxic moves carry their status', () => {
  assert.equal(moveData.thunderWave.effect.status, 'paralysis')
  assert.equal(moveData.toxic.effect.status, 'toxic')
  assert.equal(moveData.confuseRay.effect.type, 'confusion')
  assert.equal(moveData.nuzzle.effect.status, 'paralysis')
})

/** @param {number} value */
function withFixedRandom(value, /** @type {() => void} */ body) {
  const originalRandom = Math.random
  try {
    Math.random = () => value
    body()
  } finally {
    Math.random = originalRandom
  }
}

test('Thunder Wave paralyzes, but not an Electric type', () => {
  withFixedRandom(0.5, () => {
    const attacker = battler({ name: 'Player', isPlayer: true, moves: ['thunderWave'], speed: 200 }),
      normalFoe = battler({
        name: 'Foe',
        moves: ['splash'],
        types: ['Normal'],
        currentHp: 9999,
        maxHp: 9999,
      }),
      electricFoe = battler({
        name: 'Zap',
        moves: ['splash'],
        types: ['Electric'],
        currentHp: 9999,
        maxHp: 9999,
      })
    const firstEvents = resolveBattleTurn(attacker, normalFoe, false)
    assert.ok(firstEvents.some((/** @type {any} */ event) => event.type === 'status'))
    assert.equal(normalFoe.status, 'paralysis')
    const electricEvents = resolveBattleTurn(attacker, electricFoe, false)
    assert.ok(
      !electricEvents.some(
        (/** @type {any} */ event) =>
          event.type === 'status' && event.message.includes('paralyzed')
      )
    )
    assert.ok(!electricFoe.status, 'Electric types cannot be paralysed')
  })
})

test('badly poisoned damage escalates each turn', () => {
  withFixedRandom(0.99, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        status: 'toxic',
        statusTurns: 1,
        currentHp: 160,
        maxHp: 160,
        moves: ['splash'],
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 9999, maxHp: 9999 }),
      events = resolveBattleTurn(player, enemy, false),
      toxicEvent = events.find(
        (/** @type {any} */ event) => event.type === 'damage' && event.message.includes('toxic')
      )
    assert.ok(toxicEvent, 'toxic should tick')
    assert.equal(toxicEvent.data.damage, 10, '1/16 of 160')
    assert.equal(player.statusTurns, 2)
  })
})

test('paralysis halves speed for turn order', () => {
  withFixedRandom(0.9, () => {
    const player = battler({
        name: 'Slow',
        isPlayer: true,
        status: 'paralysis',
        speed: 100,
        moves: ['tackle'],
        attack: 200,
      }),
      enemy = battler({ name: 'Foe', speed: 60, moves: ['splash'] }),
      events = resolveBattleTurn(player, enemy, false),
      firstAttack = events.find((/** @type {any} */ event) => event.type === 'attack')
    assert.match(firstAttack.message, /^Foe/, 'the un-halved foe should move first')
  })
})

test('confusion can make a battler hurt itself', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        confusionTurns: 2,
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 9999, maxHp: 9999 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(
      events.some(
        (/** @type {any} */ event) => event.type === 'recoil' && event.message.includes('confused')
      )
    )
    assert.equal(player.confusionTurns, 1)
  })
})

test('screens carry their override data', () => {
  assert.equal(moveData.reflect.screen, 'reflect')
  assert.equal(moveData.lightScreen.screen, 'lightScreen')
  assert.equal(moveData.auroraVeil.screen, 'both')
})

test('Reflect halves physical damage and wears off', () => {
  withFixedRandom(0.5, () => {
    const damageWith = (/** @type {any} */ screens) => {
        const player = battler({
            name: 'Player',
            isPlayer: true,
            moves: ['tackle'],
            speed: 200,
            attack: 200,
          }),
          enemy = battler({
            name: 'Foe',
            moves: ['splash'],
            currentHp: 9999,
            maxHp: 9999,
            defense: 100,
            screens,
          }),
          events = resolveBattleTurn(player, enemy, false)
        return events.find(
          (/** @type {any} */ event) => event.type === 'damage' && event.data?.target === 'enemy'
        )
      },
      without = damageWith(undefined),
      withScreen = damageWith({ reflect: 5, lightScreen: 0 })
    assert.equal(withScreen.data.damage, Math.max(1, Math.floor(without.data.damage / 2)))
  })
})

test('self-destruct moves faint the user', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['explosion'],
        speed: 200,
        currentHp: 300,
        maxHp: 300,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 5000, maxHp: 5000 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.equal(player.currentHp, 0, 'the user faints')
    assert.ok(
      events.some((event) => event.type === 'faint' && event.data?.target === 'player'),
      'a faint event is reported'
    )

    // Memento is a status move that faints its user after the stat drop.
    const mementoUser = battler({
        name: 'M',
        isPlayer: true,
        moves: ['memento'],
        speed: 200,
        currentHp: 300,
        maxHp: 300,
      }),
      foe = battler({ name: 'F', moves: ['splash'], currentHp: 5000, maxHp: 5000 }),
      mementoEvents = resolveBattleTurn(mementoUser, foe, false)
    assert.equal(mementoUser.currentHp, 0, 'Memento faints the user')
    assert.ok(
      mementoEvents.some((event) => event.type === 'faint' && event.data?.target === 'player')
    )
  })
})

test('two-turn moves charge on the first turn and strike on the second', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['solarBeam'],
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 5000, maxHp: 5000 }),
      first = resolveBattleTurn(player, enemy, false)
    assert.ok(
      first.some((event) => /absorbed light/.test(event.message ?? '')),
      'charges on the first turn'
    )
    assert.equal(player.chargingMove, 'solarBeam')
    assert.ok(
      !first.some((event) => event.type === 'damage'),
      'no damage on the charge turn'
    )
    const hpBefore = enemy.currentHp,
      second = resolveBattleTurn(player, enemy, false)
    assert.ok(second.some((event) => event.type === 'damage'), 'strikes on the second turn')
    assert.ok(enemy.currentHp < hpBefore)
    assert.equal(player.chargingMove, null)
  })
})

test('a semi-invulnerable charge turn dodges most attacks', () => {
  withFixedRandom(0.5, () => {
    const flyer = battler({ name: 'Flyer', isPlayer: true, moves: ['fly'], speed: 300 }),
      foe = battler({ name: 'Foe', moves: ['tackle'], speed: 10 }),
      events = resolveBattleTurn(flyer, foe, false)
    assert.equal(flyer.semiInvulnerable, 'air')
    assert.ok(
      events.some((event) => event.type === 'miss'),
      'the foe misses the airborne target'
    )
  })
})

test('move tooltips describe the effect alongside the core stats', () => {
  const ember = moveTooltip('ember', moveData.ember)
  assert.match(ember, /Fire/)
  assert.match(ember, /Special/)
  assert.match(ember, /burn/i)
  // A plain damaging move still gets a stat line (and no invented effect).
  assert.match(moveTooltip('tackle', moveData.tackle), /Physical/)
  assert.equal(describeMove({ key: 'tackle', ...moveData.tackle }), null)
  // Never-miss moves read as such rather than a silly 101%.
  assert.match(moveTooltip('swift', moveData.swift), /never misses/)
})

test('ability tooltips fall back for unimplemented abilities', () => {
  assert.match(abilityTooltip('intimidate'), /Attack/i)
  assert.equal(abilityTooltip(null), null)
  assert.equal(abilityTooltip('definitelyNotAnAbility'), 'No battle effect implemented yet.')
})

test('accuracy and evasion stages change the hit chance', () => {
  withFixedRandom(0.99, () => {
    const base = calculateDamage(50, 100, 100, moveData.tackle, ['Normal'], ['Normal']),
      loweredAccuracy = calculateDamage(
        50,
        100,
        100,
        moveData.tackle,
        ['Normal'],
        ['Normal'],
        0,
        0,
        0,
        !1,
        -6
      ),
      raisedEvasion = calculateDamage(
        50,
        100,
        100,
        moveData.tackle,
        ['Normal'],
        ['Normal'],
        0,
        0,
        0,
        !1,
        0,
        6
      )
    assert.notEqual(base.effectivenessLabel, 'miss')
    assert.equal(loweredAccuracy.effectivenessLabel, 'miss')
    assert.equal(raisedEvasion.effectivenessLabel, 'miss')
  })
})

test('always-hit moves ignore accuracy and evasion stages', () => {
  // Accuracy above 100 is the data's "never misses" marker (Swift, Aerial Ace,
  // the G-Max moves, ...). Even at -6 accuracy / +6 evasion they must land.
  assert.ok(moveData.swift.accuracy > 100, 'Swift is stored as an always-hit move')
  withFixedRandom(0.99, () => {
    const alwaysHit = calculateDamage(
        50,
        100,
        100,
        moveData.swift,
        ['Normal'],
        ['Normal'],
        0,
        0,
        0,
        !1,
        -6,
        6
      ),
      normal = calculateDamage(
        50,
        100,
        100,
        moveData.tackle,
        ['Normal'],
        ['Normal'],
        0,
        0,
        0,
        !1,
        -6,
        6
      )
    assert.notEqual(alwaysHit.effectivenessLabel, 'miss')
    assert.ok(alwaysHit.damage > 0, 'the always-hit move still deals damage')
    assert.equal(normal.effectivenessLabel, 'miss', 'a 100-accuracy move can still miss')
  })
})

test('Leech Seed drains the target into its planter', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['leechSeed'],
        currentHp: 200,
        maxHp: 400,
        speed: 200,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        currentHp: 400,
        maxHp: 400,
        types: ['Normal'],
      }),
      events = resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.leechSeeded, true)
    assert.equal(enemy.currentHp, 350, 'the seeded foe loses 1/8 max HP')
    assert.equal(player.currentHp, 250, 'the planter is healed by the drain')
    assert.ok(events.some((/** @type {any} */ event) => event.message.includes('Leech Seed')))
  })
})

test('Grass types are immune to Leech Seed', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['leechSeed'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Grass'] })
    resolveBattleTurn(player, enemy, false)
    assert.ok(!enemy.leechSeeded)
  })
})

test('the utility overrides are applied', () => {
  assert.equal(moveData.leechSeed.effect.type, 'leechSeed')
  assert.equal(moveData.snowscape.effect.type, 'weather')
  assert.equal(moveData.snowscape.effect.weather, 'snow')
  assert.equal(moveData.rainDance.effect.weather, 'rain')
  assert.equal(moveData.taunt.effect.type, 'taunt')
  assert.equal(moveData.substitute.effect.type, 'substitute')
})

test('Taunt blocks status moves', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        speed: 200,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['recover'],
        currentHp: 100,
        maxHp: 400,
        tauntTurns: 2,
      }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(
      events.some((/** @type {any} */ event) => event.message?.includes('after the Taunt'))
    )
    assert.equal(enemy.currentHp, 100, 'the healing move was blocked')
  })
})

test('Taunt is set for three turns', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['taunt'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.tauntTurns, 2, 'set for 3, then ticked down')
  })
})

test('Substitute costs HP and then absorbs hits', () => {
  withFixedRandom(0.5, () => {
    const maker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['substitute'],
        currentHp: 400,
        maxHp: 400,
        speed: 200,
      }),
      idleFoe = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(maker, idleFoe, false)
    assert.equal(maker.substituteHp, 100, 'a quarter of max HP')
    assert.equal(maker.currentHp, 300, 'the substitute cost a quarter of max HP')

    const attacker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        attack: 200,
        speed: 200,
      }),
      shielded = battler({ name: 'Foe', moves: ['splash'], currentHp: 400, maxHp: 400, substituteHp: 100 })
    resolveBattleTurn(attacker, shielded, false)
    assert.equal(shielded.currentHp, 400, 'the substitute took the damage')
    assert.ok(shielded.substituteHp < 100)
  })
})

test('attract and curse carry their overrides', () => {
  assert.equal(moveData.attract.effect.type, 'infatuation')
  assert.equal(moveData.curse.effect.type, 'curse')
})

/** Find an id that makes a species read as the wanted gender. */
function findGenderId(/** @type {string} */ speciesKey, /** @type {string} */ gender) {
  for (let id = 1; id <= 5000; id++)
    if (genderForPokemon({ speciesKey, id: String(id) }) === gender) return String(id)
  throw new Error('no id')
}

test('Attract infatuates an opposite-gender target', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        speciesKey: 'pidgey',
        id: findGenderId('pidgey', 'male'),
        moves: ['attract'],
        speed: 200,
      }),
      enemy = battler({
        name: 'Foe',
        speciesKey: 'pidgey',
        id: findGenderId('pidgey', 'female'),
        moves: ['splash'],
      })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.infatuated, true)
  })
})

test('Ghost-type Curse costs HP and drains the target', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        speciesKey: 'gengar',
        types: ['Ghost', 'Poison'],
        moves: ['curse'],
        currentHp: 400,
        maxHp: 400,
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 400, maxHp: 400, types: ['Normal'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.currentHp, 200, 'paid half its HP')
    assert.equal(enemy.cursed, true)
    assert.equal(enemy.currentHp, 300, 'took a quarter from the curse')
  })
})

test('non-Ghost Curse raises Attack/Defense and lowers Speed', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
      name: 'Player',
      isPlayer: true,
      speciesKey: 'pidgey',
      types: ['Normal', 'Flying'],
      moves: ['curse'],
      speed: 200,
    })
    resolveBattleTurn(player, battler({ name: 'Foe', moves: ['splash'] }), false)
    assert.equal(player.statStages.attack, 1)
    assert.equal(player.statStages.defense, 1)
    assert.equal(player.statStages.speed, -1)
  })
})

test('the AI stops setting up once it is boosted', () => {
  withFixedRandom(0.1, () => {
    const attacker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['swordsDance', 'tackle'],
        attack: 200,
        statStages: { attack: 2 },
      }),
      defender = battler({ name: 'Foe' }),
      chosen = chooseMoveForBattle(attacker, defender)
    assert.equal(chosen.moveId, 'tackle')
  })
})

test('AI skill tiers change how a battler plays', () => {
  const attacker = battler({
      name: 'Foe',
      moves: ['tackle', 'flamethrower', 'swordsDance'],
      attack: 80,
      spAttack: 220,
      statStages: {},
    }),
    defender = battler({ name: 'Player', types: ['Grass'] })
  // dumb throws out a random attacking move, never the best one
  withFixedRandom(0, () =>
    assert.equal(chooseMoveForBattle(attacker, defender, null, AI_SKILL.dumb).moveId, 'tackle')
  )
  // with the setup roll missed, smart just attacks with its best move
  withFixedRandom(0.99, () =>
    assert.equal(
      chooseMoveForBattle(attacker, defender, null, AI_SKILL.smart).moveId,
      'flamethrower'
    )
  )
  // smartest never gambles: it sets up first
  withFixedRandom(0.99, () =>
    assert.equal(
      chooseMoveForBattle(attacker, defender, null, AI_SKILL.smartest).moveId,
      'swordsDance'
    )
  )
})

test('the AI only avoids a nullified move after it has failed once', () => {
  withFixedRandom(0.1, () => {
    const attacker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['ember', 'waterGun'],
        attack: 200,
        spAttack: 200,
      }),
      defender = battler({ ability: 'flashFire', types: ['Normal'] })
    // It is not told the ability up front, so it still leads with Ember.
    assert.equal(chooseMoveForBattle(attacker, defender).moveId, 'ember')
    // Once that failure is on record, Water Gun is the next best.
    attacker.nullifiedMoves = { [defender.speciesKey]: ['ember'] }
    assert.equal(chooseMoveForBattle(attacker, defender).moveId, 'waterGun')
  })
})

test('a move an ability absorbs is remembered only after it fails', () => {
  withFixedRandom(0.1, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['ember', 'waterGun'],
        attack: 200,
        spAttack: 200,
      }),
      enemy = battler({ ability: 'flashFire', types: ['Normal'] })
    assert.equal(player.nullifiedMoves, undefined, 'no memory before the move fails')
    resolveBattleTurn(player, enemy, false)
    assert.deepEqual(player.nullifiedMoves?.[enemy.speciesKey], ['ember'])
  })
})

test('Mold Breaker means a move is never remembered as nullified', () => {
  withFixedRandom(0.1, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        ability: 'moldBreaker',
        moves: ['earthquake', 'tackle'],
        attack: 200,
      }),
      enemy = battler({ ability: 'levitate', types: ['Normal'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.nullifiedMoves?.[enemy.speciesKey], undefined)
  })
})

test('Aurora Veil raises both screens', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['auroraVeil'],
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.screens.reflect, 4, 'screens tick down at the end of the turn')
    assert.equal(player.screens.lightScreen, 4)
  })
})

test('Haze resets both sides’ stat changes', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['haze'],
        speed: 200,
        statStages: { attack: 2 },
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], statStages: { defense: 1 } })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.statStages.attack, 0)
    assert.equal(enemy.statStages.defense, 0)
  })
})

test('Clear Smog resets only the target', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['clearSmog'],
        speed: 200,
        spAttack: 300,
        statStages: { attack: 2 },
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        currentHp: 9999,
        maxHp: 9999,
        spDefense: 200,
        statStages: { spAttack: 2 },
      })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.statStages.spAttack, 0)
    assert.equal(player.statStages.attack, 2, 'the user keeps its boosts')
  })
})

test('Static paralyzes an attacker that makes contact', () => {
  withFixedRandom(0.1, () => {
    const attacker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        attack: 200,
        speed: 200,
      }),
      defender = battler({
        name: 'Foe',
        ability: 'static',
        moves: ['splash'],
        currentHp: 9999,
        maxHp: 9999,
        defense: 200,
      })
    resolveBattleTurn(attacker, defender, false)
    assert.equal(attacker.status, 'paralysis')
  })
})

test('Rough Skin hurts a contact attacker, but not a non-contact move', () => {
  withFixedRandom(0.5, () => {
    const make = (/** @type {string} */ moveId) => {
      const attacker = battler({
          name: 'Player',
          isPlayer: true,
          moves: [moveId],
          attack: 200,
          speed: 200,
          currentHp: 400,
          maxHp: 400,
        }),
        defender = battler({
          name: 'Foe',
          ability: 'roughSkin',
          moves: ['splash'],
          currentHp: 9999,
          maxHp: 9999,
          defense: 200,
        })
      resolveBattleTurn(attacker, defender, false)
      return attacker.currentHp
    }
    assert.equal(make('tackle'), 350, 'contact takes 1/8 recoil')
    assert.equal(make('earthquake'), 400, 'Earthquake makes no contact')
  })
})
