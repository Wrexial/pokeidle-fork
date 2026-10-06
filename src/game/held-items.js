// Held-item effects. Like abilities, the battle engine (src/game/combat.js)
// reads these pure lookups; the acquisition/equip UI lives elsewhere.
import { heldItems } from '../data/items.js'
import { abilityOf } from './abilities.js'

/**
 * Berries and type boosters a wild Pokemon can be found holding. Kept to
 * sensible wild finds — no Mega Stones or competitive items.
 */

/** Berries any Pokemon can sensibly hold. */
const WILD_BERRIES = ['sitrusBerry', 'lumBerry']

/** The type-boosting item that suits each type.
 * @type {Record<string, string>}
 */
const TYPE_BOOST_ITEM = {
  Normal: 'silkScarf',
  Fire: 'charcoal',
  Water: 'mysticWater',
  Electric: 'magnet',
  Grass: 'miracleSeed',
  Ice: 'neverMeltIce',
  Fighting: 'blackBelt',
  Poison: 'poisonBarb',
  Ground: 'softSand',
  Flying: 'sharpBeak',
  Psychic: 'twistedSpoon',
  Bug: 'silverPowder',
  Rock: 'hardStone',
  Ghost: 'spellTag',
  Dragon: 'dragonFang',
  Dark: 'blackGlasses',
  Steel: 'ironPlate',
  Fairy: 'pixiePlate',
}

const TYPE_BOOST_ITEMS = [...new Set(Object.values(TYPE_BOOST_ITEM))]

/**
 * Type-boosting item -> the type it stands in for. Multitype (Arceus) and RKS
 * System (Silvally) reuse these as their plates / memories rather than adding
 * a whole separate item set.
 * @type {Record<string, string>}
 */
const BOOST_ITEM_TYPE = Object.fromEntries(
  Object.entries(TYPE_BOOST_ITEM).map(([type, item]) => [item, type])
)

/**
 * The type a held type-boosting item stands in for, or null.
 * @param {string | null | undefined} itemId
 * @returns {string | null}
 */
export function heldItemBoostType(itemId) {
  return itemId ? (BOOST_ITEM_TYPE[itemId] ?? null) : null
}

/** @type {string[]} */
export const WILD_HELD_ITEMS = [...WILD_BERRIES, ...TYPE_BOOST_ITEMS]

/** The stronger competitive items only trainers hold. */
const TRAINER_ONLY_ITEMS = [
  'leftovers',
  'focusSash',
  'eviolite',
  'lifeOrb',
  'choiceBand',
  'choiceSpecs',
  'choiceScarf',
  'assaultVest',
]

/**
 * The type boosters that suit a Pokemon's types (empty for a typeless one).
 * @param {string[] | null | undefined} types
 * @returns {string[]}
 */
function typeBoosterItems(types) {
  return [...new Set((types ?? []).map((type) => TYPE_BOOST_ITEM[type]).filter(Boolean))]
}

/**
 * What a wild Pokemon of these types can hold: a berry or a booster of one of
 * its own types (so a Water type never turns up with Charcoal).
 * @param {string[] | null | undefined} types
 * @returns {string[]}
 */
function wildHeldItemPool(types) {
  return [...new Set([...WILD_BERRIES, ...typeBoosterItems(types)])]
}

/**
 * The wild pool plus the competitive items a trainer can hand out.
 * @param {string[] | null | undefined} types
 */
export function trainerHeldItemPool(types) {
  return [...new Set([...wildHeldItemPool(types), ...TRAINER_ONLY_ITEMS])]
}

const WILD_ITEM_KEYS = WILD_HELD_ITEMS.filter((key) => heldItems[key])

/**
 * Roll a random held item (or null) from `pool`.
 * @param {number} [chance]
 * @param {() => number} [rng]
 * @param {string[]} [pool]
 * @returns {string | null}
 */
export function rollHeldItem(chance = 0.05, rng = Math.random, pool = WILD_ITEM_KEYS) {
  const keys = pool.filter((key) => heldItems[key])
  return keys.length > 0 && rng() < chance ? keys[Math.floor(rng() * keys.length)] : null
}

/**
 * Roll a wild held item that suits the Pokemon's types.
 * @param {string[] | null | undefined} types
 * @param {number} [chance]
 * @param {() => number} [rng]
 * @returns {string | null}
 */
export function rollWildHeldItem(types, chance = 0.05, rng = Math.random) {
  return rollHeldItem(chance, rng, wildHeldItemPool(types))
}

/** @param {BattlePokemon} pokemon */
function heldItemOf(pokemon) {
  return pokemon?.heldItem ?? null
}

/** @param {BattlePokemon} pokemon */
function heldItemEffect(pokemon) {
  // Klutz ignores the holder's held item entirely, and Magic Room disables
  // every held item on the field.
  if (abilityOf(pokemon) === 'klutz') return null
  if ((pokemon?.magicRoomTurns ?? 0) > 0) return null
  const heldItem = heldItemOf(pokemon)
  return heldItem ? (heldItems[heldItem]?.effect ?? null) : null
}

/**
 * Multiplier a held item applies to one of the holder's stats.
 * @param {BattlePokemon} pokemon
 * @param {string} statKey
 * @param {boolean} [canEvolve] Whether the holder can still evolve (Eviolite).
 * @returns {number}
 */
export function heldStatMultiplier(pokemon, statKey, canEvolve = !1) {
  const effect = heldItemEffect(pokemon)
  if (!effect) return 1
  if (effect.type === 'statBoost') return effect.stat === statKey ? effect.multiplier : 1
  if (effect.type === 'eviolite' && canEvolve)
    return statKey === 'defense' || statKey === 'spDefense' ? 1.5 : 1
  return 1
}

/**
 * Whether the holder is locked into its first move by a Choice item.
 * @param {BattlePokemon} pokemon
 * @returns {boolean}
 */
export function heldChoiceItem(pokemon) {
  return heldItemEffect(pokemon)?.choice === true
}

/**
 * Damage multiplier for the attacker's held item (Life Orb, type boosters).
 * @param {BattlePokemon} pokemon
 * @param {Move} moveDef
 * @returns {number}
 */
export function heldDamageMultiplier(pokemon, moveDef) {
  const effect = heldItemEffect(pokemon)
  if (!effect) return 1
  if (effect.type === 'lifeOrb') return effect.multiplier
  if (effect.type === 'typeBoost' && effect.moveType === moveDef?.type) return 1.2
  return 1
}

/**
 * Focus Sash: survive a knockout from full HP with 1 HP (once per battle).
 * @param {BattlePokemon} pokemon
 * @param {number} hpBefore
 * @param {number} damage
 * @returns {number}
 */
export function heldSurvivesAtFullHp(pokemon, hpBefore, damage) {
  return heldItemEffect(pokemon)?.type === 'focusSash' && !pokemon.heldItemUsed && hpBefore >= pokemon.maxHp && damage >= hpBefore
    ? hpBefore - 1
    : damage
}

/** Leftovers healing at the end of a turn (0 when not held). @param {BattlePokemon} pokemon */
export function heldLeftoversHeal(pokemon) {
  return heldItemEffect(pokemon)?.type === 'leftovers' ? Math.max(1, Math.floor(pokemon.maxHp / 16)) : 0
}

/** Sitrus-style berry healing once below its threshold. @param {BattlePokemon} pokemon */
export function heldBerryHeal(pokemon) {
  const effect = heldItemEffect(pokemon),
    // Gluttony triggers the berry earlier (at half HP instead of the usual).
    threshold =
      abilityOf(pokemon) === 'gluttony' && effect ? Math.max(effect.threshold, 0.5) : effect?.threshold
  return effect?.type === 'berry' &&
    !pokemon.heldItemUsed &&
    pokemon.currentHp > 0 &&
    pokemon.currentHp <= pokemon.maxHp * threshold
    ? Math.max(1, Math.floor(pokemon.maxHp * effect.heal))
    : 0
}

/** Whether the holder's Lum Berry can cure it right now. @param {BattlePokemon} pokemon */
export function heldCuresStatus(pokemon) {
  return heldItemEffect(pokemon)?.type === 'lumBerry' && !pokemon.heldItemUsed
}

/** Life Orb recoil for a hit that dealt `damage`. @param {BattlePokemon} pokemon @param {number} damage */
export function heldLifeOrbRecoil(pokemon, damage) {
  const effect = heldItemEffect(pokemon)
  return effect?.type === 'lifeOrb' ? Math.max(1, Math.floor(pokemon.maxHp * effect.recoil)) : 0
}

/**
 * Extra turns the holder's Terrain Extender adds to a terrain it sets (0 when
 * not held). The base terrain lasts 5 turns, so this makes it 8.
 * @param {BattlePokemon} pokemon
 * @returns {number}
 */
export function heldTerrainExtenderTurns(pokemon) {
  return heldItemEffect(pokemon)?.type === 'terrainExtender' ? 3 : 0
}
