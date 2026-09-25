// Paldea's Picnic. Build a sandwich from a bottom and top slice of Bread with
// three fillings the player picks; the fillings' types decide which type of
// Pokemon the finished sandwich lures out. Time each drop so the stack doesn't
// topple, then a wild Pokemon of that type appears with tripled shiny odds.

import { encounterData, mapData, pokemonSpecies } from '../../data/gameData.js'

/** Money spent to set up the picnic. */
export const PICNIC_COST = 250

/** Fillings the player picks per sandwich. */
export const PICNIC_PICKS = 3

/** Time for the swinging piece to cross the plate once, in ms. */
export const PICNIC_SWING_MS = 1150

/** Beyond this offset (in half-plate units) the stack topples. */
export const PICNIC_TOPPLE_LIMIT = 0.42

/** The finished sandwich's shiny-odds multiplier. */
export const PICNIC_SHINY_MULTIPLIER = 3

/** The slices that bookend every sandwich and never change the type. */
export const PICNIC_BREAD = { id: 'bread', name: 'Bread', type: null, emoji: '\u{1f35e}' }

/**
 * Fillings, one per Pokemon type, so the pick determines what the sandwich
 * spawns. The emoji is shown on the pick button.
 * @type {{ id: string, name: string, type: string, emoji: string }[]}
 */
export const PICNIC_INGREDIENTS = [
  { id: 'lettuce', name: 'Lettuce', type: 'Grass', emoji: '\u{1f96c}' },
  { id: 'chiliPepper', name: 'Chili Pepper', type: 'Fire', emoji: '\u{1f336}\ufe0f' },
  { id: 'crabStick', name: 'Crab Stick', type: 'Water', emoji: '\u{1f980}' },
  { id: 'lemon', name: 'Lemon', type: 'Electric', emoji: '\u{1f34b}' },
  { id: 'egg', name: 'Egg', type: 'Normal', emoji: '\u{1f95a}' },
  { id: 'ham', name: 'Ham', type: 'Fighting', emoji: '\u{1f953}' },
  { id: 'mushroom', name: 'Mushroom', type: 'Poison', emoji: '\u{1f344}' },
  { id: 'potato', name: 'Potato', type: 'Ground', emoji: '\u{1f954}' },
  { id: 'rockSalt', name: 'Rock Salt', type: 'Rock', emoji: '\u{1f9c2}' },
  { id: 'honey', name: 'Honey', type: 'Bug', emoji: '\u{1f36f}' },
  { id: 'ghostPepper', name: 'Ghost Pepper', type: 'Ghost', emoji: '\u{1f47b}' },
  { id: 'cannedFood', name: 'Canned Food', type: 'Steel', emoji: '\u{1f96b}' },
  { id: 'mindMelon', name: 'Mind Melon', type: 'Psychic', emoji: '\u{1f348}' },
  { id: 'frozenPeas', name: 'Frozen Peas', type: 'Ice', emoji: '\u{1f9ca}' },
  { id: 'dragonFruit', name: 'Dragon Fruit', type: 'Dragon', emoji: '\u{1f409}' },
  { id: 'darkChocolate', name: 'Dark Chocolate', type: 'Dark', emoji: '\u{1f36b}' },
  { id: 'strawberry', name: 'Strawberry', type: 'Fairy', emoji: '\u{1f353}' },
  { id: 'popcorn', name: 'Popcorn', type: 'Flying', emoji: '\u{1f37f}' },
]

/**
 * Look up an ingredient (or the Bread) by id.
 * @param {string} id
 * @returns {{ id: string, name: string, type: string | null, emoji: string } | null}
 */
export function ingredientById(id) {
  if (id === PICNIC_BREAD.id) return PICNIC_BREAD
  return PICNIC_INGREDIENTS.find((ingredient) => ingredient.id === id) ?? null
}

/**
 * The type the picked fillings add up to: the most-picked type, with the
 * earliest pick breaking a tie. Bread carries no type and is ignored.
 * @param {string[]} pickedIds
 * @returns {string | null}
 */
export function sandwichType(pickedIds) {
  const counts = new Map(),
    order = []
  for (const id of pickedIds) {
    const type = ingredientById(id)?.type
    if (!type) continue
    if (!counts.has(type)) order.push(type)
    counts.set(type, (counts.get(type) ?? 0) + 1)
  }
  let best = null,
    bestCount = 0
  for (const type of order) {
    const count = counts.get(type) ?? 0
    if (count > bestCount) {
      best = type
      bestCount = count
    }
  }
  return best
}

/**
 * Score a dropped piece by how far it landed from the middle.
 * @param {number} offset -0.5 (left edge) through 0 (middle) to 0.5 (right edge)
 * @returns {{ grade: 'perfect' | 'good' | 'ok' | 'topple', points: number, topple: boolean }}
 */
export function picnicDropScore(offset) {
  const distance = Math.abs(offset)
  if (distance > PICNIC_TOPPLE_LIMIT) return { grade: 'topple', points: 0, topple: true }
  if (distance <= 0.08) return { grade: 'perfect', points: 100, topple: false }
  if (distance <= 0.2) return { grade: 'good', points: 60, topple: false }
  return { grade: 'ok', points: 30, topple: false }
}

/**
 * The wild species of a type that spawn in a region, deduplicated. Falls back
 * to the whole (base-form) dex when the region has none of that type.
 * @param {string} type
 * @param {string} region
 * @returns {string[]}
 */
export function picnicSpeciesPool(type, region) {
  const routeKeys = new Set(
    Object.values(mapData)
      .filter((location) => (location.region ?? 'kanto') === region)
      .map((location) => location.routeKey)
      .filter((routeKey) => typeof routeKey === 'string')
  )
  const pool = new Set()
  for (const routeKey of routeKeys)
    for (const entry of encounterData[routeKey]?.encounters ?? []) {
      const species = pokemonSpecies[entry.speciesKey]
      if (!species || species.legendary || !(species.types ?? []).includes(type)) continue
      pool.add(entry.speciesKey)
    }
  if (pool.size > 0) return [...pool]
  return Object.keys(pokemonSpecies).filter((key) => {
    const species = pokemonSpecies[key]
    return (
      !!species &&
      species.id > 0 &&
      species.id <= 1025 &&
      !species.legendary &&
      (species.types ?? []).includes(type)
    )
  })
}

/**
 * Pick the Pokemon a finished sandwich lures out: a wild species of the
 * requested type from the current region, at a level near the party.
 * @param {string} type
 * @param {string} region
 * @param {number} baseLevel
 * @param {() => number} [rng]
 * @returns {{ speciesKey: string, level: number } | null}
 */
export function rollPicnicEncounter(type, region, baseLevel, rng = Math.random) {
  const pool = picnicSpeciesPool(type, region)
  if (pool.length === 0) return null
  return {
    speciesKey: pool[Math.floor(rng() * pool.length)],
    level: Math.max(2, Math.round(baseLevel) + Math.floor(rng() * 3)),
  }
}
