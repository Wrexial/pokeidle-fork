// Status conditions and volatile effects (confusion, infatuation, Leech Seed, contact abilities). Split from game/combat.js.

import { moveMakesContact } from '../../data/move-effects.js'
import { abilityAvoidsContact, abilityIgnoresPoisonImmunity, abilityOf, abilityPreventsStatDrop, abilityPreventsStatus } from '../abilities.js'
import { genderForPokemon } from '../breeding.js'
import { chance } from './damage.js'
import { heldCuresStatus } from '../held-items.js'
import { terrainPreventsStatus } from '../terrain.js'

/** Major status conditions that persist until cured and tick each turn. */
const MAJOR_STATUSES = new Set(['poison', 'toxic', 'burn', 'freeze', 'sleep', 'paralysis'])

/** Statuses Synchronize passes to the opponent that inflicted them. */
const SYNCHRONIZE_STATUSES = new Set(['poison', 'toxic', 'burn', 'paralysis'])

/** Abilities that ignore the target's ability (Mold Breaker family). */
const IGNORES_TARGET_ABILITY = new Set(['moldBreaker', 'teravolt', 'turboblaze'])

/**
 * Whether the target's Magic Bounce should reflect this status back at the
 * inflicter.
 * @param {BattlePokemon} target
 * @param {BattlePokemon | null} source
 * @param {boolean} fromMagicBounce
 */
function shouldBounceStatus(target, source, fromMagicBounce) {
  if (fromMagicBounce || !source || source === target) return false
  if (abilityOf(target) !== 'magicBounce') return false
  return !IGNORES_TARGET_ABILITY.has(abilityOf(source) ?? '')
}

/** Types that can't be afflicted by a given status. */

/** @type {Record<string, string[]>} */
export const STATUS_IMMUNE_TYPES = {
  burn: ['Fire'],
  freeze: ['Ice'],
  poison: ['Poison', 'Steel'],
  toxic: ['Poison', 'Steel'],
  paralysis: ['Electric'],
}

/**
 * Inflict a status condition on a Pokemon. Fails if the target already has a
 * major status or is immune to this one; `flinching` just sets the one-turn
 * flinch flag.
 * @param {BattlePokemon} target
 * @param {string} status
 * @param {any[]} events
 * @param {boolean} targetIsPlayer whether `target` is the player's Pokemon
 * @param {boolean} [deterministic]
 * @param {{ type: string } | null} [terrain]
 * @param {boolean} [sourceIsOpponent] Safeguard blocks these
 * @param {BattlePokemon | null} [source] the inflicting Pokemon (for Corrosion)
 * @param {boolean} [fromSynchronize] Don't chain Synchronize.
 * @param {boolean} [fromMagicBounce] Don't chain Magic Bounce.
 */
export function applyStatus(target, status, events, targetIsPlayer, deterministic = !1, terrain = null, sourceIsOpponent = !1, source = null, fromSynchronize = !1, fromMagicBounce = !1) {
  if (!target || target.currentHp <= 0) return
  const side = targetIsPlayer ? 'player' : 'enemy'
  if (status === 'flinching') {
    target.flinch = !0
    return
  }
  // Safeguard shields the holder's side from status inflicted by the opponent.
  if (sourceIsOpponent && (target.safeguardTurns ?? 0) > 0) return
  if (!MAJOR_STATUSES.has(status) || target.status) return
  if (abilityPreventsStatus(target, status)) return
  // Magic Bounce reflects the status back at whoever inflicted it.
  if (source && shouldBounceStatus(target, source, fromMagicBounce)) {
    applyStatus(source, status, events, !targetIsPlayer, deterministic, terrain, !0, target, !1, !0)
    events.push({
      type: 'status',
      message: `${target.name}'s Magic Bounce reflected the status!`,
      data: { target: targetIsPlayer ? 'player' : 'enemy' },
    })
    return
  }
  if (terrainPreventsStatus(terrain, target, status)) return
  if (
    !(
      source &&
      abilityIgnoresPoisonImmunity(source) &&
      (status === 'poison' || status === 'toxic')
    ) &&
    (STATUS_IMMUNE_TYPES[status] ?? []).some((type) => target.types.includes(type))
  )
    return
  target.status = status
  target.statusTurns =
    status === 'sleep'
      ? deterministic
        ? 2
        : Math.max(1, Math.ceil((1 + Math.floor(Math.random() * 3)) / (abilityOf(target) === 'earlyBird' ? 2 : 1)))
      : status === 'toxic'
        ? 1
        : 0
  events.push({
    type: 'status',
    message: `${target.name} was ${
      {
        poison: 'poisoned',
        toxic: 'badly poisoned',
        burn: 'burned',
        freeze: 'frozen',
        sleep: 'put to sleep',
        paralysis: 'paralyzed',
      }[status]
    }!`,
    data: {
      target: side,
    },
  })
  // Synchronize passes burn / poison / paralysis to the opponent that inflicted
  // it; the `fromSynchronize` guard stops the two holders bouncing it forever.
  if (
    !fromSynchronize &&
    source &&
    source !== target &&
    SYNCHRONIZE_STATUSES.has(status) &&
    abilityOf(target) === 'synchronize'
  )
    applyStatus(source, status, events, !targetIsPlayer, deterministic, terrain, !0, target, !0, !0)
  // A held Lum Berry cures the status immediately.
  if (heldCuresStatus(target)) {
    target.heldItemUsed = !0
    target.status = null
    target.statusTurns = 0
    events.push({
      type: 'status',
      message: `${target.name}'s Lum Berry cured it!`,
      data: {
        target: side,
      },
    })
  }
}

/**
 * Plant a Leech Seed on a target; it drains 1/8 max HP into the other side
 * each turn. Grass types are immune, and it doesn't stack.
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} targetIsPlayer
 */
export function applyLeechSeed(target, events, targetIsPlayer) {
  if (!target || target.currentHp <= 0 || target.leechSeeded) return
  if (target.types.includes('Grass')) return
  target.leechSeeded = !0
  events.push({
    type: 'status',
    message: `${target.name} was seeded!`,
    data: {
      target: targetIsPlayer ? 'player' : 'enemy',
    },
  })
}

/**
 * Confuse a Pokemon for 2-5 turns. Confusion is volatile, so it doesn't use
 * the major-status slot; an already-confused target is left alone.
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} targetIsPlayer
 * @param {boolean} [deterministic]
 */
export function applyConfusion(target, events, targetIsPlayer, deterministic = !1) {
  if (!target || target.currentHp <= 0 || (target.confusionTurns ?? 0) > 0) return
  if (abilityOf(target) === 'ownTempo') return
  target.confusionTurns = deterministic ? 3 : 2 + Math.floor(Math.random() * 4)
  events.push({
    type: 'status',
    message: `${target.name} became confused!`,
    data: {
      target: targetIsPlayer ? 'player' : 'enemy',
    },
  })
}

/**
 * A confused attacker may hurt itself instead of using its move. Returns true
 * when the turn is skipped (and pushes the event), and clears confusion when
 * it wears off.
 * @param {BattlePokemon} attacker
 * @param {any[]} events
 * @param {boolean} isPlayer
 * @param {boolean} [deterministic]
 * @returns {boolean}
 */
export function handleConfusion(attacker, events, isPlayer, deterministic = !1) {
  if ((attacker.confusionTurns ?? 0) <= 0) return !1
  const side = isPlayer ? 'player' : 'enemy'
  attacker.confusionTurns = (attacker.confusionTurns ?? 0) - 1
  if (attacker.confusionTurns <= 0) {
    attacker.confusionTurns = 0
    events.push({
      type: 'status',
      message: `${attacker.name} snapped out of its confusion!`,
      data: {
        target: side,
      },
    })
    return !1
  }
  if (chance(0.33, deterministic)) {
    const selfDamage = Math.max(1, Math.floor(attacker.maxHp / 8))
    attacker.currentHp = Math.max(0, attacker.currentHp - selfDamage)
    events.push({
      type: 'recoil',
      message: `${attacker.name} is confused and hurt itself! (${selfDamage} damage)`,
      data: {
        target: side,
        damage: selfDamage,
        hpAfter: attacker.currentHp,
        hpMax: attacker.maxHp,
      },
    })
    attacker.currentHp <= 0 &&
      events.push({
        type: 'faint',
        message: `${attacker.name} fainted!`,
        data: {
          target: side,
        },
      })
    return !0
  }
  return !1
}

/**
 * Apply the defender's contact ability to an attacker that just hit it with a
 * contact move (Static, Flame Body, Poison Point, Effect Spore, Cute Charm,
 * Rough Skin, Iron Barbs).
 * @param {BattlePokemon} defender
 * @param {BattlePokemon} attacker
 * @param {Move} moveDef
 * @param {any[]} events
 * @param {boolean} attackerIsPlayer
 * @param {boolean} deterministic
 * @param {{ type: string } | null} terrain
 */
export function applyContactAbility(defender, attacker, moveDef, events, attackerIsPlayer, deterministic, terrain) {
  // Long Reach keeps the attacker's moves from connecting physically.
  if (!moveMakesContact(moveDef) || abilityAvoidsContact(attacker)) return
  const ability = abilityOf(defender),
    roll = () => chance(0.3, deterministic)
  switch (ability) {
    case 'static':
      if (roll()) applyStatus(attacker, 'paralysis', events, attackerIsPlayer, deterministic, terrain, !0)
      break
    case 'flameBody':
      if (roll()) applyStatus(attacker, 'burn', events, attackerIsPlayer, deterministic, terrain, !0)
      break
    case 'poisonPoint':
      if (roll()) applyStatus(attacker, 'poison', events, attackerIsPlayer, deterministic, terrain, !0)
      break
    case 'effectSpore':
      if (roll()) {
        const pick = Math.random(),
          status = pick < 0.34 ? 'poison' : pick < 0.67 ? 'paralysis' : 'sleep'
        applyStatus(attacker, status, events, attackerIsPlayer, deterministic, terrain, !0)
      }
      break
    case 'cuteCharm':
      if (roll()) applyInfatuation(defender, attacker, events, attackerIsPlayer)
      break
    case 'roughSkin':
    case 'ironBarbs': {
      const contactDamage = Math.max(1, Math.floor(attacker.maxHp / 8))
      attacker.currentHp = Math.max(0, attacker.currentHp - contactDamage)
      events.push({
        type: 'recoil',
        message: `${attacker.name} was hurt by ${defender.name}'s ${
          ability === 'roughSkin' ? 'Rough Skin' : 'Iron Barbs'
        }! (${contactDamage} damage)`,
        data: {
          target: attackerIsPlayer ? 'player' : 'enemy',
          damage: contactDamage,
          hpAfter: attacker.currentHp,
          hpMax: attacker.maxHp,
        },
      })
      attacker.currentHp <= 0 &&
        events.push({
          type: 'faint',
          message: `${attacker.name} fainted!`,
          data: {
            target: attackerIsPlayer ? 'player' : 'enemy',
          },
        })
      break
    }
    case 'gooey':
    case 'tanglingHair': {
      const stages = attacker.statStages ?? (attacker.statStages = {}),
        current = stages.speed ?? 0,
        next = Math.max(-6, current - 1)
      if (next !== current && !abilityPreventsStatDrop(attacker, 'speed')) {
        stages.speed = next
        events.push({
          type: 'statChange',
          message: `${attacker.name}'s Speed fell!`,
          data: { target: attackerIsPlayer ? 'player' : 'enemy' },
        })
      }
      break
    }
    case 'stamina': {
      const stages = defender.statStages ?? (defender.statStages = {}),
        current = stages.defense ?? 0,
        next = Math.min(6, current + 1)
      if (next !== current) {
        stages.defense = next
        events.push({
          type: 'statChange',
          message: `${defender.name}'s Defense rose!`,
          data: { target: attackerIsPlayer ? 'enemy' : 'player' },
        })
      }
      break
    }
    case 'mummy': {
      const attackerAbility = abilityOf(attacker)
      if (attackerAbility && attackerAbility !== 'mummy') {
        attacker.abilityOverride = 'mummy'
        attacker.abilitySuppressed = !1
        events.push({
          type: 'status',
          message: `${attacker.name}'s ability was changed to Mummy!`,
          data: { target: attackerIsPlayer ? 'player' : 'enemy' },
        })
      }
      break
    }
  }
}

/**
 * Infatuate a target (Attract): only works between opposite, gendered Pokemon.
 * @param {BattlePokemon} source
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} targetIsPlayer
 */
export function applyInfatuation(source, target, events, targetIsPlayer) {
  if (!target || target.currentHp <= 0 || target.infatuated) return
  if (abilityOf(target) === 'oblivious' || abilityOf(target) === 'aromaVeil') return
  const sourceGender = genderForPokemon(source),
    targetGender = genderForPokemon(target)
  if (
    sourceGender === 'genderless' ||
    targetGender === 'genderless' ||
    sourceGender === targetGender
  )
    return
  target.infatuated = !0
  events.push({
    type: 'status',
    message: `${target.name} fell in love!`,
    data: {
      target: targetIsPlayer ? 'player' : 'enemy',
    },
  })
}

/**
 * An infatuated attacker may be too lovestruck to move.
 * @param {BattlePokemon} attacker
 * @param {any[]} events
 * @param {boolean} isPlayer
 * @param {boolean} [deterministic]
 * @returns {boolean}
 */
export function handleInfatuation(attacker, events, isPlayer, deterministic = !1) {
  if (!attacker.infatuated) return !1
  if (!chance(0.5, deterministic)) return !1
  events.push({
    type: 'status',
    message: `${attacker.name} is in love with the foe and can't move!`,
    data: {
      target: isPlayer ? 'player' : 'enemy',
    },
  })
  return !0
}

/**
 * A status condition that stops a Pokemon acting this turn. Returns true when
 * the attacker's turn is skipped (pushin an explanatory event).
 * @param {BattlePokemon} attacker
 * @param {any[]} events
 * @param {boolean} isPlayer
 * @param {boolean} [deterministic]
 * @returns {boolean}
 */
export function statusPreventsAction(attacker, events, isPlayer, deterministic = !1) {
  const side = isPlayer ? 'player' : 'enemy'
  if (attacker.status === 'sleep') {
    if ((attacker.statusTurns ?? 0) > 0) {
      attacker.statusTurns = (attacker.statusTurns ?? 0) - 1
      events.push({
        type: 'status',
        message: `${attacker.name} is fast asleep.`,
        data: {
          target: side,
        },
      })
      return !0
    }
    attacker.status = null
    events.push({
      type: 'status',
      message: `${attacker.name} woke up!`,
      data: {
        target: side,
      },
    })
  } else if (attacker.status === 'freeze') {
    if (!deterministic && Math.random() >= 0.2) {
      events.push({
        type: 'status',
        message: `${attacker.name} is frozen solid!`,
        data: {
          target: side,
        },
      })
      return !0
    }
    attacker.status = null
    events.push({
      type: 'status',
      message: `${attacker.name} thawed out!`,
      data: {
        target: side,
      },
    })
  } else if (attacker.status === 'paralysis' && chance(0.25, deterministic)) {
    events.push({
      type: 'status',
      message: `${attacker.name} is paralyzed! It can't move!`,
      data: {
        target: side,
      },
    })
    return !0
  }
  if (attacker.flinch && abilityOf(attacker) !== 'innerFocus') {
    attacker.flinch = !1
    // Steadfast rewards the flinch with a Speed boost.
    if (abilityOf(attacker) === 'steadfast') {
      const stages = attacker.statStages ?? (attacker.statStages = {}),
        current = stages.speed ?? 0,
        next = Math.min(6, current + 1)
      if (next !== current) {
        stages.speed = next
        events.push({
          type: 'statChange',
          message: `${attacker.name}'s Speed rose!`,
          data: { target: side },
        })
      }
    }
    events.push({
      type: 'status',
      message: `${attacker.name} flinched and couldn't move!`,
      data: {
        target: side,
      },
    })
    return !0
  }
  return !1
}
