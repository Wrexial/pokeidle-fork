import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const data = installGameData()

const { abilityAttackMultiplier, abilityChangesMoveType, abilityDamageDealtMultiplier, abilityDamageTakenMultiplier, abilityEffectivenessMultiplier, abilityPreventsStatus, fieldAuraMultiplier, onHitStatBoost, rivalryDamageMultiplier, ruinDefenseMultiplier, ruinOffenseMultiplier } = await import('../src/game/abilities.js')
const { heldLeftoversHeal } = await import('../src/game/held-items.js')
const { calculateDamage, resolveBattleTurn } = await import('../src/game/combat.js')
const { abilityDisplayName, rollAbility } = await import('../src/game/pokemon.js')
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

/** @param {number} value @param {() => void} body */
function withFixedRandom(value, body) {
  const originalRandom = Math.random
  try {
    Math.random = () => value
    body()
  } finally {
    Math.random = originalRandom
  }
}

test('ability data loads for every species and rolls a real ability', () => {
  assert.equal(data.abilityData.bulbasaur.abilities[0], 'overgrow')
  assert.ok(['runAway', 'adaptability', 'anticipation'].includes(rollAbility('eevee')))
  assert.ok(['overgrow', 'chlorophyll'].includes(rollAbility('bulbasaur')))
})

test('abilityDisplayName prettifies a camelCase key', () => {
  assert.equal(abilityDisplayName('waterAbsorb'), 'Water Absorb')
  assert.equal(abilityDisplayName('hugePower'), 'Huge Power')
})

test('Levitate blocks Ground moves without healing', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['earthquake'], speed: 200 }),
      enemy = battler({ name: 'Foe', ability: 'levitate', currentHp: 400, maxHp: 400, types: ['Normal'] }),
      events = resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.currentHp, 400, 'the Ground move should be blocked')
    assert.ok(
      !events.some(
        (/** @type {any} */ event) => event.type === 'damage' && event.data?.target === 'enemy'
      )
    )
  })
})

test('Water Absorb heals instead of taking damage', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['waterGun'], speed: 200 }),
      enemy = battler({
        name: 'Foe',
        ability: 'waterAbsorb',
        currentHp: 200,
        maxHp: 400,
        types: ['Normal'],
      }),
      events = resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.currentHp, 300, 'the holder heals a quarter of its max HP')
    assert.ok(events.some((/** @type {any} */ event) => event.type === 'heal'))
  })
})

test('Thick Fat halves Fire damage', () => {
  withFixedRandom(0.5, () => {
    const damage = (/** @type {string | undefined} */ ability) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['ember'],
          speed: 200,
          spAttack: 300,
        }),
        enemy = battler({
          name: 'Foe',
          ability,
          currentHp: 9999,
          maxHp: 9999,
          types: ['Normal'],
        }),
        events = resolveBattleTurn(player, enemy, false)
      return events.find(
        (/** @type {any} */ event) => event.type === 'damage' && event.data?.target === 'enemy'
      ).data.damage
    }
    assert.equal(damage('thickFat'), Math.max(1, Math.floor(damage(undefined) / 2)))
  })
})

test('Sturdy survives a full-HP knockout with 1 HP', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['hyperBeam'],
        speed: 200,
        attack: 9999,
        spAttack: 9999,
      }),
      enemy = battler({ name: 'Foe', ability: 'sturdy', currentHp: 300, maxHp: 300, defense: 1 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.currentHp, 1)
    assert.ok(!events.some((/** @type {any} */ event) => event.type === 'faint' && event.data?.target === 'enemy'))
  })
})

test('Intimidate lowers the opponent once on entry', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, ability: 'intimidate', speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false, true)
    assert.equal(enemy.statStages.attack, -1)
  })
})

test('an ability can block a status condition', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['thunderWave'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'limber', types: ['Normal'] })
    resolveBattleTurn(player, enemy, false)
    assert.ok(!enemy.status)
    assert.equal(abilityPreventsStatus({ ability: 'limber' }, 'paralysis'), true)
  })
})

test('Guts raises Attack while statused', () => {
  assert.equal(abilityAttackMultiplier({ ability: 'guts' }), 1)
  assert.equal(abilityAttackMultiplier({ ability: 'guts', status: 'burn' }), 1.5)
  assert.equal(abilityAttackMultiplier({ ability: 'hugePower' }), 2)
})

test('crit abilities modify the critical-hit system', () => {
  withFixedRandom(0.5, () => {
    const base = calculateDamage(
        50,
        200,
        100,
        moveData.tackle,
        ['Normal'],
        ['Normal'],
        0,
        0,
        3
      ),
      immune = calculateDamage(
        50,
        200,
        100,
        moveData.tackle,
        ['Normal'],
        ['Normal'],
        0,
        0,
        3,
        !1,
        0,
        0,
        !1,
        2,
        !0
      ),
      sniper = calculateDamage(
        50,
        200,
        100,
        moveData.tackle,
        ['Normal'],
        ['Normal'],
        0,
        0,
        3,
        !1,
        0,
        0,
        !1,
        2.25
      )
    assert.equal(base.isCrit, true)
    assert.equal(immune.isCrit, false, 'Battle Armor / Shell Armor block crits')
    assert.ok(sniper.damage > base.damage, 'Sniper hits harder on a crit')
  })
})

test('type-specialist and move-family abilities boost the right moves', () => {
  assert.equal(abilityDamageDealtMultiplier(battler({ ability: 'dragonsMaw' }), moveData.dragonClaw), 1.5)
  assert.equal(abilityDamageDealtMultiplier(battler({ ability: 'transistor' }), moveData.thunderbolt), 1.5)
  assert.equal(abilityDamageDealtMultiplier(battler({ ability: 'technician' }), moveData.tackle), 1.5)
  assert.equal(abilityDamageDealtMultiplier(battler({ ability: 'technician' }), moveData.flamethrower), 1)
  assert.equal(abilityDamageDealtMultiplier(battler({ ability: 'ironFist' }), moveData.firePunch), 1.2)
  assert.equal(abilityDamageDealtMultiplier(battler({ ability: 'strongJaw' }), moveData.crunch), 1.5)
  assert.equal(abilityDamageDealtMultiplier(battler({ ability: 'sharpness' }), moveData.nightSlash), 1.5)
  assert.equal(abilityDamageDealtMultiplier(battler({ ability: 'toughClaws' }), moveData.tackle), 1.3)
  assert.equal(
    abilityDamageDealtMultiplier(battler({ ability: 'sandForce' }), moveData.earthquake, { type: 'sandstorm' }),
    1.3
  )
})

test('defensive abilities halve the right hits', () => {
  const withAbility = (ability, extra = {}) => battler({ ability, ...extra })
  assert.equal(abilityDamageTakenMultiplier(withAbility('fluffy'), moveData.tackle), 0.5)
  assert.equal(abilityDamageTakenMultiplier(withAbility('fluffy'), moveData.flamethrower), 2)
  assert.equal(abilityDamageTakenMultiplier(withAbility('iceScales'), moveData.flamethrower), 0.5)
  assert.equal(abilityDamageTakenMultiplier(withAbility('furCoat'), moveData.tackle), 0.5)
  assert.equal(abilityDamageTakenMultiplier(withAbility('heatproof'), moveData.flamethrower), 0.5)
  assert.equal(abilityDamageTakenMultiplier(withAbility('purifyingSalt'), moveData.shadowBall), 0.5)
  assert.equal(
    abilityDamageTakenMultiplier(withAbility('marvelScale', { status: 'burn' }), moveData.tackle),
    2 / 3
  )
})

test('Tinted Lens and Neuroforce scale effectiveness', () => {
  assert.equal(abilityEffectivenessMultiplier(battler({ ability: 'tintedLens' }), 0.5), 2)
  assert.equal(abilityEffectivenessMultiplier(battler({ ability: 'tintedLens' }), 2), 1)
  assert.equal(abilityEffectivenessMultiplier(battler({ ability: 'neuroforce' }), 2), 1.25)
  assert.equal(abilityEffectivenessMultiplier(battler({ ability: 'neuroforce' }), 0.5), 1)
})

test('attack abilities boost the right moves', () => {
  assert.equal(abilityAttackMultiplier(battler({ ability: 'hustle' })), 1.5)
  assert.equal(abilityAttackMultiplier(battler({ ability: 'gorillaTactics' })), 1.5)
  assert.equal(
    abilityAttackMultiplier(battler({ ability: 'toxicBoost', status: 'poison' }), moveData.tackle),
    1.5
  )
  assert.equal(
    abilityAttackMultiplier(battler({ ability: 'toxicBoost', status: 'poison' }), moveData.flamethrower),
    1,
    'Toxic Boost only boosts physical moves'
  )
  assert.equal(
    abilityAttackMultiplier(battler({ ability: 'flareBoost', status: 'burn' }), moveData.flamethrower),
    1.5
  )
})

test('Earth Eater absorbs Ground moves and heals', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['earthquake'], speed: 200 }),
      enemy = battler({
        name: 'Foe',
        ability: 'earthEater',
        currentHp: 200,
        maxHp: 400,
        types: ['Normal'],
      })
    resolveBattleTurn(player, enemy, false)
    assert.ok(enemy.currentHp > 200, 'the Ground move heals the holder')
  })
})

test('gooey lowers the attacker speed on contact', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        statStages: { speed: 0 },
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'gooey' })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.statStages.speed, -1)
  })
})

test('Stamina raises Defense and Mummy replaces the attacker ability', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['tackle'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'stamina' })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.statStages.defense, 1)
  })
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        ability: 'blaze',
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'mummy' })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.abilityOverride, 'mummy')
  })
})

test('Pastel Veil blocks poison', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['toxic'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'pastelVeil', types: ['Normal'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.status ?? null, null)
  })
})

test('entry abilities raise a stat on switch in', () => {
  withFixedRandom(0.5, () => {
    const stagesFor = (/** @type {string} */ ability) => {
      const player = battler({ name: 'Player', isPlayer: true, moves: ['splash'], speed: 200, ability }),
        enemy = battler({ name: 'Foe', moves: ['splash'] })
      resolveBattleTurn(player, enemy, false, !0)
      return player.statStages
    }
    assert.equal(stagesFor('intrepidSword').attack, 1)
    assert.equal(stagesFor('dauntlessShield').defense, 1)
    assert.equal(stagesFor('download').attack, 1)
  })
})

test('Poison Heal heals instead of taking poison damage', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'poisonHeal',
      status: 'poison',
      currentHp: 200,
      maxHp: 400,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(player, enemy, false)
  assert.equal(player.currentHp, 250, 'heals 1/8 max HP')
})

test('Bad Dreams hurts a sleeping opponent', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'badDreams',
    }),
    enemy = battler({
      name: 'Foe',
      moves: ['splash'],
      status: 'sleep',
      statusTurns: 3,
      currentHp: 400,
      maxHp: 400,
    })
  resolveBattleTurn(player, enemy, false)
  assert.equal(enemy.currentHp, 350, 'chips 1/8 max HP')
})

test('Hydration cures status in the rain', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'hydration',
      status: 'burn',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(player, enemy, false, false, { type: 'rain', turns: 5 })
  assert.equal(player.status, null)
})

test('Contrary flips and Simple doubles stat changes', () => {
  const stagesFor = (/** @type {string} */ ability) => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['growl'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability, statStages: {} })
    resolveBattleTurn(player, enemy, false)
    return enemy.statStages
  }
  assert.equal(stagesFor('contrary').attack, 1, 'a drop becomes a raise')
  assert.equal(stagesFor('simple').attack, -2, 'a drop is doubled')
})

test('Defiant and Competitive punish stat drops', () => {
  const stagesFor = (/** @type {string} */ ability) => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['growl'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability, statStages: {} })
    resolveBattleTurn(player, enemy, false)
    return enemy.statStages
  }
  assert.equal(stagesFor('defiant').attack, 1, '-1 then +2')
  assert.equal(stagesFor('competitive').spAttack, 2)
})

test('Unaware ignores the opponent stat stages', () => {
  withFixedRandom(0.9, () => {
    const damageAgainst = (/** @type {any} */ defenderAbility) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['tackle'],
          speed: 200,
          attack: 200,
          statStages: { attack: 4 },
        }),
        enemy = battler({
          name: 'Foe',
          moves: ['splash'],
          ability: defenderAbility,
          statStages: { defense: 0 },
          currentHp: 2000,
          maxHp: 2000,
        })
      resolveBattleTurn(player, enemy, false)
      return 2000 - enemy.currentHp
    }
    assert.ok(damageAgainst('unaware') < damageAgainst(undefined), 'the attack stages are ignored')
  })
})

test('Moxie and Beast Boost reward a KO', () => {
  const stagesAfterKo = (/** @type {string} */ ability) => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 400,
        ability,
        statStages: {},
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 1, maxHp: 100 })
    resolveBattleTurn(player, enemy, false)
    return player.statStages
  }
  assert.equal(stagesAfterKo('moxie').attack, 1)
  assert.equal(stagesAfterKo('beastBoost').attack, 1, 'Beast Boost raises the highest stat')
})

test('field auras boost Dark and Fairy moves', () => {
  assert.equal(fieldAuraMultiplier(battler({ ability: 'darkAura' }), battler({}), moveData.crunch), 1.33)
  assert.equal(
    fieldAuraMultiplier(battler({}), battler({ ability: 'fairyAura' }), moveData.moonblast),
    1.33
  )
  assert.equal(fieldAuraMultiplier(battler({ ability: 'darkAura' }), battler({}), moveData.tackle), 1)
  assert.equal(
    fieldAuraMultiplier(battler({ ability: 'darkAura' }), battler({ ability: 'auraBreak' }), moveData.crunch),
    0.75
  )
})

test('on-hit abilities grant stat boosts', () => {
  assert.deepEqual(onHitStatBoost(battler({ ability: 'justified' }), moveData.crunch), { attack: 1 })
  assert.deepEqual(onHitStatBoost(battler({ ability: 'steamEngine' }), moveData.waterGun), { speed: 6 })
  assert.deepEqual(onHitStatBoost(battler({ ability: 'waterCompaction' }), moveData.waterGun), {
    defense: 2,
  })
  assert.deepEqual(onHitStatBoost(battler({ ability: 'weakArmor' }), moveData.tackle), {
    speed: 2,
    defense: -1,
  })
  assert.deepEqual(onHitStatBoost(battler({ ability: 'angerPoint' }), moveData.tackle, true), {
    attack: 6,
  })
  assert.equal(onHitStatBoost(battler({ ability: 'justified' }), moveData.tackle), null)
})

test('Trace copies the opponent ability on entry', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        speed: 200,
        ability: 'trace',
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'intimidate' })
    resolveBattleTurn(player, enemy, false, !0)
    assert.equal(player.abilityOverride, 'intimidate')
  })
})

test('Soul-Heart boosts Sp. Atk after a KO', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['tackle'],
      speed: 200,
      attack: 400,
      ability: 'soulHeart',
      statStages: {},
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 1, maxHp: 100 })
  resolveBattleTurn(player, enemy, false)
  assert.equal(player.statStages.spAttack, 1)
})

test('Berserk and Anger Shell trigger when HP drops below half', () => {
  withFixedRandom(0.5, () => {
    const run = (/** @type {string} */ ability) => {
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
          ability,
          currentHp: 60,
          maxHp: 60,
          statStages: {},
        })
      resolveBattleTurn(player, enemy, false)
      return { hp: enemy.currentHp, stages: enemy.statStages }
    }
    const berserk = run('berserk')
    assert.ok(berserk.hp > 0 && berserk.hp <= 30, 'dropped below half HP')
    assert.equal(berserk.stages.spAttack, 1)
    const angerShell = run('angerShell')
    assert.equal(angerShell.stages.spAttack, 1)
    assert.equal(angerShell.stages.speed, 1)
    assert.equal(angerShell.stages.defense, -1)
  })
})

test('Moody raises one stat and lowers another', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'moody',
      statStages: {},
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(player, enemy, false, false, null, null, true)
  assert.equal(player.statStages.attack, 2)
  assert.equal(player.statStages.spAttack, -1)
})

test('Good as Gold blocks status moves', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['toxic'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'goodAsGold', types: ['Normal'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.status ?? null, null)
  })
})

test('Infiltrator ignores screens', () => {
  withFixedRandom(0.5, () => {
    const damageWith = (/** @type {any} */ attackerAbility) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['tackle'],
          speed: 200,
          attack: 300,
          ability: attackerAbility,
        }),
        enemy = battler({
          name: 'Foe',
          moves: ['splash'],
          currentHp: 2000,
          maxHp: 2000,
          screens: { reflect: 5, lightScreen: 0 },
        })
      resolveBattleTurn(player, enemy, false)
      return 2000 - enemy.currentHp
    }
    assert.ok(damageWith('infiltrator') > damageWith(undefined), 'the screen is ignored')
  })
})

test('type-changing abilities rewrite the move type', () => {
  assert.equal(abilityChangesMoveType(battler({ ability: 'pixilate' }), moveData.tackle).type, 'Fairy')
  assert.equal(abilityChangesMoveType(battler({ ability: 'refrigerate' }), moveData.tackle).type, 'Ice')
  assert.equal(
    abilityChangesMoveType(battler({ ability: 'pixilate' }), moveData.flamethrower).type,
    'Fire',
    'non-Normal moves are unchanged'
  )
  assert.equal(abilityChangesMoveType(battler({ ability: 'normalize' }), moveData.flamethrower).type, 'Normal')
  assert.equal(abilityChangesMoveType(battler({ ability: 'liquidVoice' }), moveData.hyperVoice).type, 'Water')
})

test('Protean changes the user type to the move type', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['flamethrower'],
      speed: 200,
      ability: 'protean',
      types: ['Normal'],
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(player, enemy, false)
  assert.deepEqual(player.types, ['Fire'])
  assert.deepEqual(player.typesOverride, ['Fire'])
})

test('Disguise absorbs the first hit', () => {
  withFixedRandom(0.5, () => {
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
        ability: 'disguise',
        currentHp: 400,
        maxHp: 400,
      })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.currentHp, 400, 'the first hit is absorbed')
    assert.equal(enemy.disguiseBroken, true)
  })
})

test('Ice Face absorbs the first physical hit but not a special one', () => {
  withFixedRandom(0.5, () => {
    const result = (/** @type {string} */ move, extra = {}) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: [move],
          speed: 200,
          ...extra,
        }),
        enemy = battler({
          name: 'Foe',
          moves: ['splash'],
          ability: 'iceFace',
          currentHp: 400,
          maxHp: 400,
        })
      resolveBattleTurn(player, enemy, false)
      return { hp: enemy.currentHp, max: enemy.maxHp }
    }
    const physical = result('tackle', { attack: 200 })
    assert.equal(physical.hp, physical.max, 'the physical hit is absorbed')
    const special = result('flamethrower', { spAttack: 200 })
    assert.ok(special.hp < special.max, 'a special hit gets through')
  })
})

test('Ruin abilities weaken the right stats', () => {
  assert.equal(ruinOffenseMultiplier(battler({ ability: 'tabletsOfRuin' }), 'physical'), 0.75)
  assert.equal(ruinOffenseMultiplier(battler({ ability: 'beadsOfRuin' }), 'special'), 0.75)
  assert.equal(ruinOffenseMultiplier(battler({ ability: 'beadsOfRuin' }), 'physical'), 1)
  assert.equal(ruinDefenseMultiplier(battler({ ability: 'swordOfRuin' }), 'physical'), 0.75)
  assert.equal(ruinDefenseMultiplier(battler({ ability: 'vesselOfRuin' }), 'special'), 0.75)
  assert.equal(ruinDefenseMultiplier(battler({ ability: 'vesselOfRuin' }), 'physical'), 1)
})

test('Neutralizing Gas suppresses the other ability', () => {
  withFixedRandom(0.5, () => {
    const withoutGas = () => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['earthquake'],
          speed: 200,
          attack: 200,
        }),
        enemy = battler({
          name: 'Foe',
          moves: ['splash'],
          ability: 'levitate',
          currentHp: 400,
          maxHp: 400,
          types: ['Normal'],
        })
      resolveBattleTurn(player, enemy, false)
      return enemy.currentHp
    }
    assert.equal(withoutGas(), 400, 'Levitate blocks Earthquake')

    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['earthquake'],
        speed: 200,
        attack: 200,
        ability: 'neutralizingGas',
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        ability: 'levitate',
        currentHp: 400,
        maxHp: 400,
        types: ['Normal'],
      })
    resolveBattleTurn(player, enemy, false)
    assert.ok(enemy.currentHp < 400, 'Neutralizing Gas suppresses Levitate')
    assert.equal(enemy.abilitySuppressed, false, 'the suppression does not persist')
  })
})

test('Trick swaps held items', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['trick'],
      speed: 200,
      heldItem: 'leftovers',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], heldItem: 'sitrusBerry' })
  resolveBattleTurn(player, enemy, false)
  assert.equal(player.heldItem, 'sitrusBerry')
  assert.equal(enemy.heldItem, 'leftovers')
  assert.equal(player.heldItemOverridden, true)
})

test('Corrosive Gas removes the target held item', () => {
  const player = battler({ name: 'Player', isPlayer: true, moves: ['corrosiveGas'], speed: 200 }),
    enemy = battler({ name: 'Foe', moves: ['splash'], heldItem: 'sitrusBerry' })
  resolveBattleTurn(player, enemy, false)
  assert.equal(enemy.heldItem, null)
  assert.equal(enemy.heldItemOverridden, true)
})

test('Magician steals the target item on hit', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['tackle'],
      speed: 200,
      attack: 200,
      ability: 'magician',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], heldItem: 'sitrusBerry', currentHp: 400, maxHp: 400 })
  resolveBattleTurn(player, enemy, false)
  assert.equal(player.heldItem, 'sitrusBerry')
  assert.equal(enemy.heldItem, null)
})

test('Pickpocket steals on contact', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['tackle'],
      speed: 200,
      attack: 200,
      heldItem: 'leftovers',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'pickpocket', currentHp: 400, maxHp: 400 })
  resolveBattleTurn(player, enemy, false)
  assert.equal(enemy.heldItem, 'leftovers')
  assert.equal(player.heldItem, null)
})

test('Stance Change swaps Aegislash between Blade and Shield', () => {
  const withFixedRandomBody = () => {
    const attacker = battler({
        name: 'Aegislash',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        ability: 'stanceChange',
        speciesKey: 'aegislash',
        types: ['Steel', 'Ghost'],
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 400, maxHp: 400 })
    resolveBattleTurn(attacker, enemy, false)
    assert.equal(attacker.speciesKey, 'aegislash-b', 'an attack switches to Blade')

    const shielder = battler({
        name: 'Aegislash',
        isPlayer: true,
        moves: ['kingsShield'],
        speed: 200,
        ability: 'stanceChange',
        speciesKey: 'aegislash-b',
        types: ['Steel', 'Ghost'],
      }),
      enemy2 = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(shielder, enemy2, false)
    assert.equal(shielder.speciesKey, 'aegislash', "King's Shield switches to Shield")
  }
  withFixedRandom(0.5, withFixedRandomBody)
})

test('Zero to Hero and Schooling transform on entry', () => {
  const palafin = battler({
      name: 'Palafin',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'zeroToHero',
      speciesKey: 'palafin',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(palafin, enemy, false, !0)
  assert.equal(palafin.speciesKey, 'palafin-h')

  const wishiwashi = battler({
      name: 'Wishiwashi',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      level: 25,
      ability: 'schooling',
      speciesKey: 'wishiwashi',
      currentHp: 400,
      maxHp: 400,
    }),
    enemy2 = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(wishiwashi, enemy2, false, !0)
  assert.equal(wishiwashi.speciesKey, 'wishiwashi-s')
})

test('Power Construct transforms Zygarde below half HP', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 300,
      }),
      enemy = battler({
        name: 'Zygarde',
        moves: ['splash'],
        ability: 'powerConstruct',
        speciesKey: 'zygarde',
        currentHp: 120,
        maxHp: 200,
        types: ['Dragon', 'Ground'],
      })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.speciesKey, 'zygarde-c')
  })
})

test('Imposter copies the foe stats and types', () => {
  const player = battler({
      name: 'Ditto',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'imposter',
      speciesKey: 'ditto',
      types: ['Normal'],
      attack: 48,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Fire'], attack: 200, defense: 150 })
  resolveBattleTurn(player, enemy, false, !0)
  assert.deepEqual(player.types, ['Fire'])
  assert.equal(player.attack, 200)
})

test('Battle Bond transforms Greninja after a KO', () => {
  const player = battler({
      name: 'Greninja',
      isPlayer: true,
      moves: ['tackle'],
      speed: 200,
      attack: 400,
      ability: 'battleBond',
      speciesKey: 'greninja',
      types: ['Water', 'Dark'],
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 1, maxHp: 100 })
  resolveBattleTurn(player, enemy, false)
  assert.equal(player.speciesKey, 'ash-greninja')
})

test('reaction abilities: Rattled, Merciless, Defeatist, Skill Link, Aftermath', () => {
  assert.deepEqual(onHitStatBoost(battler({ ability: 'rattled' }), moveData.crunch), { speed: 1 })

  withFixedRandom(0.5, () => {
    // Merciless always crits a statused foe.
    const merciless = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 200,
        ability: 'merciless',
      }),
      poisoned = battler({ name: 'Foe', moves: ['splash'], status: 'poison', currentHp: 400, maxHp: 400 })
    assert.ok(
      resolveBattleTurn(merciless, poisoned, false).some(
        (/** @type {any} */ event) => event.type === 'critical'
      )
    )

    // Defeatist halves offence below half HP.
    const damage = (/** @type {any} */ ability) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['tackle'],
          speed: 200,
          attack: 200,
          ability,
          currentHp: 100,
          maxHp: 400,
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 2000, maxHp: 2000 })
      resolveBattleTurn(player, enemy, false)
      return 2000 - enemy.currentHp
    }
    assert.ok(damage('defeatist') < damage(undefined), 'Defeatist halves the damage')

    // Skill Link always lands the maximum number of hits.
    const linker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['bulletSeed'],
        speed: 200,
        attack: 200,
        ability: 'skillLink',
      }),
      dummy = battler({ name: 'Foe', moves: ['splash'], currentHp: 400, maxHp: 400 })
    assert.ok(
      resolveBattleTurn(linker, dummy, false).some((/** @type {any} */ event) =>
        event.message?.includes('(5 hits)')
      )
    )

    // Aftermath punishes a contact KO.
    const attacker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 400,
        currentHp: 400,
        maxHp: 400,
      }),
      bombshell = battler({
        name: 'Foe',
        moves: ['splash'],
        ability: 'aftermath',
        currentHp: 1,
        maxHp: 100,
      })
    resolveBattleTurn(attacker, bombshell, false)
    assert.ok(attacker.currentHp < 400, 'Aftermath damaged the attacker')
  })
})

test('Poison Touch, Scrappy, Own Tempo and Corrosion work', () => {
  withFixedRandom(0.1, () => {
    const toucher = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 200,
        ability: 'poisonTouch',
      }),
      target = battler({ name: 'Foe', moves: ['splash'], currentHp: 400, maxHp: 400, types: ['Normal'] })
    resolveBattleTurn(toucher, target, false)
    assert.equal(target.status, 'poison')
  })

  withFixedRandom(0.5, () => {
    const normalDamage = () => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['tackle'],
          speed: 200,
          attack: 200,
        }),
        ghost = battler({ name: 'Foe', moves: ['splash'], types: ['Ghost'], currentHp: 400, maxHp: 400 })
      resolveBattleTurn(player, ghost, false)
      return ghost.currentHp
    }
    assert.equal(normalDamage(), 400, 'Normal cannot hit Ghost')

    const scrappy = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 200,
        ability: 'scrappy',
      }),
      ghost = battler({ name: 'Foe', moves: ['splash'], types: ['Ghost'], currentHp: 400, maxHp: 400 })
    resolveBattleTurn(scrappy, ghost, false)
    assert.ok(ghost.currentHp < 400, 'Scrappy lets Normal hit Ghost')

    const confusing = battler({ name: 'Player', isPlayer: true, moves: ['confuseRay'], speed: 200 }),
      ownTempo = battler({ name: 'Foe', moves: ['splash'], ability: 'ownTempo' })
    resolveBattleTurn(confusing, ownTempo, false)
    assert.equal(ownTempo.confusionTurns ?? 0, 0)

    const corrodor = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['toxic'],
        speed: 200,
        ability: 'corrosion',
      }),
      steel = battler({ name: 'Foe', moves: ['splash'], types: ['Steel'] })
    resolveBattleTurn(corrodor, steel, false)
    assert.equal(steel.status, 'toxic')
  })
})

test('priority abilities change the turn order', () => {
  withFixedRandom(0.9, () => {
    const firstAttacker = (/** @type {string} */ move, ability) => {
      const player = battler({ name: 'Player', isPlayer: true, moves: [move], speed: 40, ability }),
        enemy = battler({ name: 'Foe', moves: ['tackle'], speed: 200 })
      return resolveBattleTurn(player, enemy, false).find(
        (/** @type {any} */ event) => event.type === 'attack'
      ).message
    }
    assert.match(firstAttacker('growl', undefined), /^Foe/, 'the faster foe moves first normally')
    assert.match(firstAttacker('growl', 'prankster'), /^Player/, 'Prankster gives a status move priority')
    assert.match(
      firstAttacker('gust', 'galeWings'),
      /^Player/,
      'Gale Wings gives a Flying move priority at full HP'
    )
  })
})

test('Compound Eyes sharpens accuracy', () => {
  withFixedRandom(0.8, () => {
    const missed = (/** @type {any} */ ability) => {
      const player = battler({ name: 'Player', isPlayer: true, moves: ['thunder'], speed: 200, ability }),
        enemy = battler({ name: 'Foe', moves: ['splash'] })
      return resolveBattleTurn(player, enemy, false).some(
        (/** @type {any} */ event) => event.message?.includes('missed')
      )
    }
    assert.equal(missed(undefined), true, 'Thunder misses on an 80 roll')
    assert.equal(missed('compoundEyes'), false, 'Compound Eyes makes it land')
  })
})

test('Truant loafs every other turn', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['tackle'], speed: 200, ability: 'truant' }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 2000, maxHp: 2000 })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.truantSkip, true, 'acted on the first turn')
    const second = resolveBattleTurn(player, enemy, false)
    assert.ok(second.some((/** @type {any} */ event) => event.message?.includes('loafing')))
    assert.equal(player.truantSkip, false)
  })
})

test('Slow Start halves Attack until it wears off', () => {
  withFixedRandom(0.5, () => {
    const damage = (/** @type {any} */ ability) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['tackle'],
          speed: 200,
          attack: 200,
          ability,
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 2000, maxHp: 2000 })
      resolveBattleTurn(player, enemy, false, !0)
      return 2000 - enemy.currentHp
    }
    assert.ok(damage('slowStart') < damage(undefined), 'Slow Start halves the damage')
  })
})

test('Klutz ignores the held item', () => {
  assert.equal(heldLeftoversHeal(battler({ heldItem: 'leftovers' })) > 0, true)
  assert.equal(heldLeftoversHeal(battler({ heldItem: 'leftovers', ability: 'klutz' })), 0)
})

test('Zen Mode transforms Darmanitan below half HP', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 300,
      }),
      enemy = battler({
        name: 'Darmanitan',
        moves: ['splash'],
        ability: 'zenMode',
        speciesKey: 'darmanitan',
        currentHp: 120,
        maxHp: 200,
      })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.speciesKey, 'darmanitan-z')
  })
})

test('Forecast and Mimicry change the holder type', () => {
  const castform = battler({
      name: 'Castform',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'forecast',
      speciesKey: 'castform',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(castform, enemy, false, false, { type: 'rain', turns: 5 })
  assert.deepEqual(castform.types, ['Water'])

  const stunfisk = battler({
      name: 'Stunfisk',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'mimicry',
      speciesKey: 'g-stunfisk',
    }),
    enemy2 = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(stunfisk, enemy2, false, false, null, null, false, { type: 'electric', turns: 5 })
  assert.deepEqual(stunfisk.types, ['Electric'])
})

test('Rock Head ignores recoil', () => {
  withFixedRandom(0.5, () => {
    const hpAfter = (/** @type {any} */ ability) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['doubleEdge'],
          speed: 200,
          attack: 200,
          ability,
          currentHp: 400,
          maxHp: 400,
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 2000, maxHp: 2000 })
      resolveBattleTurn(player, enemy, false)
      return player.currentHp
    }
    assert.equal(hpAfter('rockHead'), 400, 'no recoil with Rock Head')
    assert.ok(hpAfter(undefined) < 400, 'Double-Edge recoils otherwise')
  })
})

test('Liquid Ooze turns drain into damage', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['absorb'],
        speed: 200,
        spAttack: 200,
        currentHp: 200,
        maxHp: 400,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        ability: 'liquidOoze',
        currentHp: 400,
        maxHp: 400,
        types: ['Normal'],
      })
    resolveBattleTurn(player, enemy, false)
    assert.ok(player.currentHp < 200, 'the drain hurt the attacker')
  })
})

test('Bulletproof and Soundproof block their move families', () => {
  withFixedRandom(0.5, () => {
    const hpAfter = (/** @type {string} */ ability, /** @type {string} */ move) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: [move],
          speed: 200,
          spAttack: 200,
        }),
        enemy = battler({
          name: 'Foe',
          moves: ['splash'],
          ability,
          currentHp: 400,
          maxHp: 400,
          types: ['Normal'],
        })
      resolveBattleTurn(player, enemy, false)
      return enemy.currentHp
    }
    assert.equal(hpAfter('bulletproof', 'shadowBall'), 400)
    assert.equal(hpAfter('soundproof', 'hyperVoice'), 400)
  })
})

test('Guard Dog boosts Attack from Intimidate', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['splash'], speed: 200, ability: 'intimidate' }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'guardDog', statStages: {} })
    resolveBattleTurn(player, enemy, false, !0)
    assert.equal(enemy.statStages.attack, 1)
  })
})

test('Early Bird shortens sleep', () => {
  withFixedRandom(0.9, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['spore'], speed: 200 }),
      early = battler({ name: 'Foe', moves: ['splash'], ability: 'earlyBird', types: ['Normal'] }),
      normal = battler({ name: 'Foe2', moves: ['splash'], types: ['Normal'] })
    resolveBattleTurn(player, early, false)
    resolveBattleTurn(player, normal, false)
    assert.ok(early.statusTurns < normal.statusTurns)
  })
})

test('Screen Cleaner removes screens on entry', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'screenCleaner',
      screens: { reflect: 5, lightScreen: 5 },
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], screens: { reflect: 5, lightScreen: 5 } })
  resolveBattleTurn(player, enemy, false, !0)
  assert.equal(enemy.screens.reflect, 0)
  assert.equal(player.screens.reflect, 0)
})

test('Comatose blocks status and Color Change matches the hit type', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['toxic'], speed: 200 }),
      comatose = battler({ name: 'Foe', moves: ['splash'], ability: 'comatose', types: ['Normal'] })
    resolveBattleTurn(player, comatose, false)
    assert.equal(comatose.status ?? null, null)

    const attacker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['flamethrower'],
        speed: 200,
        spAttack: 200,
      }),
      changer = battler({
        name: 'Foe',
        moves: ['splash'],
        ability: 'colorChange',
        currentHp: 400,
        maxHp: 400,
        types: ['Normal'],
      })
    resolveBattleTurn(attacker, changer, false)
    assert.deepEqual(changer.types, ['Fire'])
  })
})

test('Air Lock suppresses the weather', () => {
  withFixedRandom(0.5, () => {
    const damage = (/** @type {any} */ ability) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['flamethrower'],
          speed: 200,
          spAttack: 200,
          ability,
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 2000, maxHp: 2000 })
      resolveBattleTurn(player, enemy, false, false, { type: 'sun', turns: 5 })
      return 2000 - enemy.currentHp
    }
    assert.ok(damage('airLock') < damage(undefined), 'Air Lock negates the sun boost')
  })
})

test('Mold Breaker ignores the target ability', () => {
  withFixedRandom(0.5, () => {
    const hpAfter = (/** @type {any} */ ability) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['earthquake'],
          speed: 200,
          attack: 200,
          ability,
        }),
        enemy = battler({
          name: 'Foe',
          moves: ['splash'],
          ability: 'levitate',
          currentHp: 400,
          maxHp: 400,
          types: ['Normal'],
        })
      resolveBattleTurn(player, enemy, false)
      return enemy.currentHp
    }
    assert.equal(hpAfter(undefined), 400, 'Levitate blocks Earthquake')
    assert.ok(hpAfter('moldBreaker') < 400, 'Mold Breaker ignores Levitate')
  })
})

test('Opportunist copies a foe self-boost', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['swordsDance'],
        speed: 200,
        statStages: {},
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'opportunist', statStages: {} })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.statStages.attack, 2)
    assert.equal(enemy.statStages.attack, 2, 'Opportunist copied the boost')
  })
})

test('Parental Bond adds a second hit', () => {
  withFixedRandom(0.5, () => {
    const damage = (/** @type {any} */ ability) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['tackle'],
          speed: 200,
          attack: 200,
          ability,
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 2000, maxHp: 2000 })
      resolveBattleTurn(player, enemy, false)
      return 2000 - enemy.currentHp
    }
    assert.ok(damage('parentalBond') > damage(undefined))
  })
})

test('Orichalcum Pulse sets the sun and Hunger Switch flips its form flag', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        speed: 200,
        ability: 'orichalcumPulse',
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] }),
      events = resolveBattleTurn(player, enemy, false, !0),
      weather = [...events].reverse().find(
        (/** @type {any} */ event) => event.type === 'weather' && event.data && 'weather' in event.data
      )
    assert.equal(weather.data.weather.type, 'sun')

    const morpeko = battler({
        name: 'Morpeko',
        isPlayer: true,
        moves: ['splash'],
        speed: 200,
        ability: 'hungerSwitch',
      }),
      enemy2 = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(morpeko, enemy2, false)
    assert.equal(morpeko.hangry, true)
  })
})

test('Shields Down, Forecast and Hunger Switch swap the form species', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 300,
      }),
      minior = battler({
        name: 'Minior',
        moves: ['splash'],
        ability: 'shieldsDown',
        speciesKey: 'minior',
        currentHp: 80,
        maxHp: 100,
        types: ['Rock', 'Flying'],
      })
    resolveBattleTurn(player, minior, false, !0)
    assert.equal(minior.speciesKey, 'minior-core', 'Shields Down drops to Core below half')
  })

  const castform = battler({
      name: 'Castform',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'forecast',
      speciesKey: 'castform',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(castform, enemy, false, false, { type: 'rain', turns: 5 })
  assert.equal(castform.speciesKey, 'castform-rainy')
  assert.deepEqual(castform.types, ['Water'])

  const morpeko = battler({
      name: 'Morpeko',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      ability: 'hungerSwitch',
      speciesKey: 'morpeko',
    }),
    enemy2 = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(morpeko, enemy2, false)
  assert.equal(morpeko.speciesKey, 'morpeko-hangry')
})

test('Ice Face switches Eiscue to its Noice form', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 200,
      }),
      eiscue = battler({
        name: 'Eiscue',
        moves: ['splash'],
        ability: 'iceFace',
        speciesKey: 'eiscue',
        currentHp: 400,
        maxHp: 400,
        types: ['Ice'],
      })
    resolveBattleTurn(player, eiscue, false)
    assert.equal(eiscue.speciesKey, 'eiscue-noice')
  })
})

test('Rivalry boosts the same gender and lowers the opposite', () => {
  const rival = (/** @type {string} */ gender) => battler({ ability: 'rivalry', gender })
  assert.equal(rivalryDamageMultiplier(rival('male'), battler({ gender: 'male' })), 1.25)
  assert.equal(rivalryDamageMultiplier(rival('male'), battler({ gender: 'female' })), 0.75)
  assert.equal(rivalryDamageMultiplier(rival('female'), battler({ gender: 'female' })), 1.25)
  assert.equal(rivalryDamageMultiplier(rival('male'), battler({ gender: 'genderless' })), 1)
  assert.equal(
    rivalryDamageMultiplier(
      battler({ ability: 'overgrow', gender: 'male' }),
      battler({ gender: 'female' })
    ),
    1
  )
})

test('Synchronize passes the status back to the opponent', () => {
  withFixedRandom(0.5, () => {
    const attacker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['thunderWave'],
        speed: 200,
        gender: 'male',
      }),
      enemy = battler({
        name: 'Foe',
        ability: 'synchronize',
        moves: ['splash'],
        gender: 'female',
        types: ['Normal'],
        currentHp: 9999,
        maxHp: 9999,
      })
    resolveBattleTurn(attacker, enemy, false)
    assert.equal(enemy.status, 'paralysis', 'the target is paralyzed')
    assert.equal(attacker.status, 'paralysis', 'and so is the attacker')
  })
})

test('Magic Bounce reflects a status move back at its user', () => {
  withFixedRandom(0.5, () => {
    const attacker = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['thunderWave'],
        speed: 200,
        gender: 'male',
      }),
      enemy = battler({
        name: 'Foe',
        ability: 'magicBounce',
        moves: ['splash'],
        gender: 'female',
        types: ['Normal'],
        currentHp: 9999,
        maxHp: 9999,
      }),
      events = resolveBattleTurn(attacker, enemy, false)
    assert.equal(enemy.status ?? null, null, 'the bouncer is unaffected')
    assert.equal(attacker.status, 'paralysis', 'the status is reflected')
    assert.ok(events.some((/** @type {any} */ event) => /Magic Bounce/.test(event.message ?? '')))
  })
})
