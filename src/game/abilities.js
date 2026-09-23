// Ability effects. Most abilities are pure stat/damage modifiers looked up by
// the battle engine (src/game/combat.js); the few that need to push events
// (Intimidate, absorb heals) are handled there using the helpers below.
//
// Only a first, high-impact set is modelled — the full 299 abilities from
// PokeAPI fall through to no effect until they are added here.

/** @param {BattlePokemon} pokemon */
export function abilityOf(pokemon) {
  if (!pokemon) return null
  // Gastro Acid suppresses the ability; Skill Swap / Role Play / Entrainment /
  // Worry Seed / Simple Beam replace it.
  if (pokemon.abilitySuppressed) return null
  return pokemon.abilityOverride ?? pokemon.ability ?? null
}

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
})

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
 * Attack multiplier from an ability (Huge Power / Pure Power, Guts).
 * @param {BattlePokemon} attacker
 * @returns {number}
 */
export function abilityAttackMultiplier(attacker) {
  const ability = abilityOf(attacker)
  if (!ability) return 1
  if (HUGE_POWER_ABILITIES.has(ability)) return 2
  if (ability === 'guts' && attacker.status) return 1.5
  return 1
}

/**
 * Damage multiplier for the attacker's own ability (the starter pinch
 * abilities boost their type below a third HP).
 * @param {BattlePokemon} attacker
 * @param {Move} moveDef
 * @returns {number}
 */
export function abilityDamageDealtMultiplier(attacker, moveDef) {
  const pinchTypes = /** @type {Record<string, string>} */ ({
      overgrow: 'Grass',
      blaze: 'Fire',
      torrent: 'Water',
      swarm: 'Bug',
    }),
    ability = abilityOf(attacker)
  if (!ability || !moveDef) return 1
  return pinchTypes[ability] === moveDef.type && attacker.currentHp <= attacker.maxHp / 3 ? 1.5 : 1
}

/**
 * Damage multiplier from the defender's ability (Thick Fat, Multiscale).
 * @param {BattlePokemon} defender
 * @param {Move} moveDef
 * @returns {number}
 */
export function abilityDamageTakenMultiplier(defender, moveDef) {
  const ability = abilityOf(defender)
  if (!ability) return 1
  if (ability === 'thickFat' && (moveDef.type === 'Fire' || moveDef.type === 'Ice')) return 0.5
  if ((ability === 'multiscale' || ability === 'shadowShield') && defender.currentHp >= defender.maxHp)
    return 0.5
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
  return STATUS_IMMUNE_ABILITIES[abilityOf(target) ?? ''] === status
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
