// Ability effects. Most abilities are pure stat/damage modifiers looked up by
// the battle engine (src/game/combat.js); the few that need to push events
// (Intimidate, absorb heals) are handled there using the helpers below.
//
// Only a first, high-impact set is modelled — the full 299 abilities from
// PokeAPI fall through to no effect until they are added here.

import { moveMakesContact } from '../data/move-effects.js'

/** @param {BattlePokemon} pokemon */
export function abilityOf(pokemon) {
  if (!pokemon) return null
  // Gastro Acid suppresses the ability; Skill Swap / Role Play / Entrainment /
  // Worry Seed / Simple Beam replace it.
  if (pokemon.abilitySuppressed) return null
  return pokemon.abilityOverride ?? pokemon.ability ?? null
}

// Move-name families used by ability damage modifiers (Iron Fist, Strong Jaw,
// Mega Launcher, Sharpness, Punk Rock, Soundproof).
const PUNCH_MOVE = /punch|hammer arm|sky uppercut|meteor mash|double iron bash/i
const BITE_MOVE = /fang|bite|crunch|jaw/i
const PULSE_MOVE = /pulse|aura sphere/i
const SLICING_MOVE = /slash|blade|sword|scissor|psycho cut|fury cutter|cut/i
const SOUND_MOVE =
  /boomburst|buzz|voice|overdrive|snarl|snore|uproar|sing|perish song|round|metal sound|whistle|clanging|torch song|alluring voice/i

/** Abilities whose holder is immune to Ground moves. */
const GROUND_IMMUNE_ABILITIES = new Set(['levitate'])

/** Abilities that absorb a move type (the holder is immune and heals). */
const TYPE_ABSORB_ABILITIES = /** @type {Record<string, string>} */ ({
  waterAbsorb: 'Water',
  drySkin: 'Water',
  voltAbsorb: 'Electric',
  lightningRod: 'Electric',
  motorDrive: 'Electric',
  flashFire: 'Fire',
  wellBakedBody: 'Fire',
  sapSipper: 'Grass',
  stormDrain: 'Water',
  earthEater: 'Ground',
})

/** Abilities that double the holder's Attack. */
const HUGE_POWER_ABILITIES = new Set(['hugePower', 'purePower'])

/** Abilities that block a major status condition. */
const STATUS_IMMUNE_ABILITIES = /** @type {Record<string, string>} */ ({
  immunity: 'poison',
  limber: 'paralysis',
  waterVeil: 'burn',
  insomnia: 'sleep',
  vitalSpirit: 'sleep',
  sweetVeil: 'sleep',
  magmaArmor: 'freeze',
  pastelVeil: 'poison',
  purifyingSalt: 'all',
})

/** -ate abilities: Normal moves become this type (and hit 20% harder). */
const ATE_ABILITIES = /** @type {Record<string, string>} */ ({
  pixilate: 'Fairy',
  refrigerate: 'Ice',
  aerilate: 'Flying',
  galvanize: 'Electric',
  dragonize: 'Dragon',
})

/**
 * Rewrite the move type from an ability: Normalize forces Normal, the -ate
 * abilities convert Normal moves (with a 20% power boost), and Liquid Voice
 * makes sound moves Water.
 * @param {BattlePokemon} attacker
 * @param {Move} moveDef
 * @returns {Move}
 */
export function abilityChangesMoveType(attacker, moveDef) {
  const ability = abilityOf(attacker)
  if (!ability || !moveDef) return moveDef
  if (ability === 'normalize' && moveDef.type !== 'Normal') return { ...moveDef, type: 'Normal' }
  const ateType = ATE_ABILITIES[ability]
  if (ateType && moveDef.type === 'Normal')
    return { ...moveDef, type: ateType, power: (moveDef.power ?? 0) * 1.2 }
  if (ability === 'liquidVoice' && SOUND_MOVE.test(moveDef.name ?? ''))
    return { ...moveDef, type: 'Water' }
  return moveDef
}

/**
 * HP-threshold ability reactions: Berserk and Anger Shell trigger when a hit
 * drops the holder from above half HP to at or below it.
 * @param {BattlePokemon} defender
 * @param {number} hpBefore
 * @returns {Record<string, number> | null}
 */
export function onHpThresholdBoost(defender, hpBefore) {
  const ability = abilityOf(defender)
  if (!ability || defender.currentHp <= 0) return null
  if (!(hpBefore > defender.maxHp / 2 && defender.currentHp <= defender.maxHp / 2)) return null
  if (ability === 'berserk') return { spAttack: 1 }
  if (ability === 'angerShell') return { spAttack: 1, speed: 1, defense: -1, spDefense: -1 }
  return null
}

/**
 * Field-wide aura multiplier from any active Pokemon: Dark Aura / Fairy Aura
 * boost their type by 1.33x, and Aura Break flips them into a 0.75x drop.
 * @param {BattlePokemon} player
 * @param {BattlePokemon} enemy
 * @param {Move} moveDef
 * @returns {number}
 */
export function fieldAuraMultiplier(player, enemy, moveDef) {
  if (!moveDef) return 1
  const dark = moveDef.type === 'Dark',
    fairy = moveDef.type === 'Fairy'
  if (!dark && !fairy) return 1
  const abilities = [abilityOf(player), abilityOf(enemy)]
  if (abilities.includes('auraBreak')) return 0.75
  if (dark && abilities.includes('darkAura')) return 1.33
  if (fairy && abilities.includes('fairyAura')) return 1.33
  return 1
}

/**
 * Stat-stage changes a defender's ability grants when it is hit (Justified,
 * Steam Engine, Thermal Exchange, Water Compaction, Weak Armor, Anger Point).
 * @param {BattlePokemon} defender
 * @param {Move} moveDef
 * @param {boolean} isCrit
 * @returns {Record<string, number> | null}
 */
export function onHitStatBoost(defender, moveDef, isCrit = false) {
  const ability = abilityOf(defender)
  if (!ability || !moveDef) return null
  if (ability === 'angerPoint' && isCrit) return { attack: 6 }
  if (ability === 'justified' && moveDef.type === 'Dark') return { attack: 1 }
  if (ability === 'thermalExchange' && moveDef.type === 'Fire') return { attack: 1 }
  if (ability === 'waterCompaction' && moveDef.type === 'Water') return { defense: 2 }
  if (ability === 'steamEngine' && (moveDef.type === 'Water' || moveDef.type === 'Fire'))
    return { speed: 6 }
  if (ability === 'weakArmor' && moveDef.category === 'physical') return { speed: 2, defense: -1 }
  return null
}

/**
 * Whether an ability makes the holder immune to a move of this type (Ground
 * immunity or a type-absorbing ability).
 * @param {BattlePokemon} defender
 * @param {string} moveType
 * @returns {boolean}
 */
export function abilityAbsorbsType(defender, moveType) {
  const ability = abilityOf(defender)
  if (!ability) return false
  if (moveType === 'Ground' && GROUND_IMMUNE_ABILITIES.has(ability)) return true
  return TYPE_ABSORB_ABILITIES[ability] === moveType
}

/**
 * Whether an ability absorbs a move type and heals the holder (Water Absorb,
 * Volt Absorb, Flash Fire, ...).
 * @param {BattlePokemon} defender
 * @param {string} moveType
 * @returns {boolean}
 */
export function abilityHealsFromType(defender, moveType) {
  return TYPE_ABSORB_ABILITIES[abilityOf(defender) ?? ''] === moveType
}

/**
 * Attack multiplier from an ability (Huge Power / Pure Power, Guts, Hustle,
 * Gorilla Tactics, Toxic Boost, Flare Boost).
 * @param {BattlePokemon} attacker
 * @param {Move} [moveDef]
 * @returns {number}
 */
export function abilityAttackMultiplier(attacker, moveDef) {
  const ability = abilityOf(attacker)
  if (!ability) return 1
  if (HUGE_POWER_ABILITIES.has(ability)) return 2
  if (ability === 'guts' && attacker.status) return 1.5
  if (ability === 'hustle') return 1.5
  if (ability === 'gorillaTactics') return 1.5
  if (ability === 'toxicBoost' && attacker.status && moveDef?.category === 'physical') return 1.5
  if (ability === 'flareBoost' && attacker.status && moveDef?.category === 'special') return 1.5
  return 1
}

/**
 * Damage multiplier for the attacker's own ability: the pinch abilities (boost
 * their type below a third HP), type specialists, Adaptability, Technician,
 * contact/move-family boosts, Reckless, Sheer Force, Sand Force and Solar Power.
 * @param {BattlePokemon} attacker
 * @param {Move} moveDef
 * @param {{ type: string } | null} [weather]
 * @returns {number}
 */
export function abilityDamageDealtMultiplier(attacker, moveDef, weather = null) {
  const ability = abilityOf(attacker)
  if (!ability || !moveDef) return 1
  const name = moveDef.name ?? ''
  // Pinch abilities boost their own type below a third HP.
  const pinchTypes = /** @type {Record<string, string>} */ ({
    overgrow: 'Grass',
    blaze: 'Fire',
    torrent: 'Water',
    swarm: 'Bug',
  })
  if (pinchTypes[ability] === moveDef.type && attacker.currentHp <= attacker.maxHp / 3) return 1.5
  // Type specialists.
  const typeBoost = /** @type {Record<string, string>} */ ({
    dragonsMaw: 'Dragon',
    steelworker: 'Steel',
    transistor: 'Electric',
    rockyPayload: 'Rock',
  })
  if (typeBoost[ability] === moveDef.type) return 1.5
  if (ability === 'waterBubble' && moveDef.type === 'Water') return 2
  if (ability === 'adaptability' && attacker.types?.includes(moveDef.type)) return 4 / 3
  if (ability === 'technician' && (moveDef.power ?? 0) > 0 && moveDef.power <= 60) return 1.5
  if (ability === 'toughClaws' && moveMakesContact(moveDef)) return 1.3
  if (ability === 'ironFist' && PUNCH_MOVE.test(name)) return 1.2
  if (ability === 'strongJaw' && BITE_MOVE.test(name)) return 1.5
  if (ability === 'megaLauncher' && PULSE_MOVE.test(name)) return 1.5
  if (ability === 'sharpness' && SLICING_MOVE.test(name)) return 1.5
  if (ability === 'reckless' && moveDef.effect?.type === 'recoil') return 1.2
  if (ability === 'sheerForce' && moveDef.effect) return 1.3
  if (ability === 'punkRock' && SOUND_MOVE.test(name)) return 1.3
  if (
    ability === 'sandForce' &&
    weather?.type === 'sandstorm' &&
    ['Rock', 'Ground', 'Steel'].includes(moveDef.type)
  )
    return 1.3
  if (ability === 'solarPower' && weather?.type === 'sun' && moveDef.category === 'special') return 1.5
  return 1
}

/**
 * Effectiveness-based attacker multipliers: Tinted Lens doubles not-very-
 * effective hits, Neuroforce boosts super-effective ones.
 * @param {BattlePokemon} attacker
 * @param {number} effectiveness
 * @returns {number}
 */
export function abilityEffectivenessMultiplier(attacker, effectiveness) {
  const ability = abilityOf(attacker)
  if (ability === 'tintedLens' && effectiveness > 0 && effectiveness < 1) return 2
  if (ability === 'neuroforce' && effectiveness > 1) return 1.25
  return 1
}

/**
 * Damage multiplier from the defender's ability (Thick Fat, Multiscale / Shadow
 * Shield at full HP, Fluffy, Heatproof, Water Bubble, Ice Scales, Purifying
 * Salt, Punk Rock, Fur Coat, Dry Skin and Marvel Scale).
 * @param {BattlePokemon} defender
 * @param {Move} moveDef
 * @returns {number}
 */
export function abilityDamageTakenMultiplier(defender, moveDef) {
  const ability = abilityOf(defender)
  if (!ability || !moveDef) return 1
  const name = moveDef.name ?? '',
    contact = moveMakesContact(moveDef)
  if (ability === 'thickFat' && (moveDef.type === 'Fire' || moveDef.type === 'Ice')) return 0.5
  if ((ability === 'multiscale' || ability === 'shadowShield') && defender.currentHp >= defender.maxHp)
    return 0.5
  if (ability === 'fluffy') {
    if (moveDef.type === 'Fire') return 2
    if (contact) return 0.5
  }
  if (ability === 'heatproof' && moveDef.type === 'Fire') return 0.5
  if (ability === 'waterBubble' && moveDef.type === 'Fire') return 0.5
  if (ability === 'iceScales' && moveDef.category === 'special') return 0.5
  if (ability === 'purifyingSalt' && moveDef.type === 'Ghost') return 0.5
  if (ability === 'punkRock' && SOUND_MOVE.test(name)) return 0.5
  if (ability === 'furCoat' && moveDef.category === 'physical') return 0.5
  if (ability === 'drySkin' && moveDef.type === 'Fire') return 1.25
  if (ability === 'marvelScale' && defender.status && moveDef.category === 'physical') return 2 / 3
  return 1
}

/** Abilities that halve damage from a super-effective hit. @param {BattlePokemon} defender */
export function abilityHalvesSuperEffective(defender) {
  const ability = abilityOf(defender)
  return ability === 'filter' || ability === 'solidRock' || ability === 'prismArmor'
}

/**
 * Whether an ability blocks a status condition.
 * @param {BattlePokemon} target
 * @param {string} status
 * @returns {boolean}
 */
export function abilityPreventsStatus(target, status) {
  const blocked = STATUS_IMMUNE_ABILITIES[abilityOf(target) ?? ''],
    // Badly poisoned still counts as poison for Immunity / Pastel Veil.
    normalized = status === 'toxic' ? 'poison' : status
  return blocked === normalized || blocked === 'all'
}

/**
 * Whether an ability blocks a stat drop (Clear Body, White Smoke, Hyper
 * Cutter, Big Pecks, Keen Eye).
 * @param {BattlePokemon} target
 * @param {string} statKey
 * @returns {boolean}
 */
export function abilityPreventsStatDrop(target, statKey) {
  const blocked = /** @type {Record<string, string[]>} */ ({
    clearBody: ['all'],
    whiteSmoke: ['all'],
    mirrorArmor: ['all'],
    fullMetalBody: ['all'],
    hyperCutter: ['attack'],
    bigPecks: ['defense'],
    keenEye: ['accuracy'],
  })[abilityOf(target) ?? '']
  return !!blocked && (blocked.includes('all') || blocked.includes(statKey))
}

/**
 * Sturdy: survive a hit that would KO the holder from full HP with 1 HP.
 * @param {BattlePokemon} defender
 * @param {number} hpBefore
 * @param {number} damage
 * @returns {number} The damage to actually apply.
 */
export function abilitySurvivesAtFullHp(defender, hpBefore, damage) {
  return abilityOf(defender) === 'sturdy' && hpBefore >= defender.maxHp && damage >= hpBefore
    ? hpBefore - 1
    : damage
}

/**
 * Whether an ability makes the holder immune to indirect (residual) damage and
 * status side-effects.
 * @param {BattlePokemon} pokemon
 * @returns {boolean}
 */
export function abilityIgnoresIndirectDamage(pokemon) {
  return abilityOf(pokemon) === 'magicGuard'
}

/**
 * Whether an ability prevents a non-super-effective damaging move from landing
 * (Wonder Guard).
 * @param {BattlePokemon} defender
 * @param {number} effectiveness
 * @returns {boolean}
 */
export function abilityBlocksNonSuperEffective(defender, effectiveness) {
  return abilityOf(defender) === 'wonderGuard' && effectiveness <= 1
}
