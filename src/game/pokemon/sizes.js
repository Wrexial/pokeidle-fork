// Per-individual Pokemon sizes, a Legends: Arceus-style flourish. Every
// Pokemon rolls a raw `size` (0-255, clustering around the middle), which maps
// to an XS-XL rating shown beside its IVs. The very largest specimens are
// alphas.

/** The size ratings, smallest to largest. */
export const SIZE_RATINGS = ['XS', 'S', 'M', 'L', 'XL']

/**
 * A short plain-English description for each rating, used in a tooltip.
 * @type {Record<string, string>}
 */
export const SIZE_RATING_HINTS = {
  XS: 'A tiny specimen, well below average.',
  S: 'A little smaller than average.',
  M: 'An average-sized specimen.',
  L: 'Larger than average.',
  XL: 'A huge specimen — the biggest around.',
}

/** A specimen at or above this raw size is an alpha. */
export const ALPHA_SIZE = 240

/** The extra EXP an alpha earns from every battle (a rare-specimen reward). */
export const ALPHA_EXP_MULTIPLIER = 1.2

/**
 * How far an individual's physical size can stray from its species' baseline:
 * a raw size of 0 reads as this fraction of the species' height, 255 as the max.
 */
export const SIZE_FACTOR_MIN = 0.75
export const SIZE_FACTOR_MAX = 1.25

/**
 * The factor a raw size maps to (0.75x .. 1.25x the species' baseline).
 * @param {number | undefined | null} size
 * @returns {number}
 */
export function sizeFactor(size) {
  const value = Number(size)
  if (!Number.isFinite(value)) return 1
  return SIZE_FACTOR_MIN + (Math.max(0, Math.min(255, value)) / 255) * (SIZE_FACTOR_MAX - SIZE_FACTOR_MIN)
}

/**
 * Roll a size for a Pokemon: a bell-ish value 0-255 clustering around the
 * middle, so the extremes (and alphas) are rare.
 * @param {() => number} [rng]
 * @returns {number}
 */
export function rollSize(rng = Math.random) {
  const average = (rng() + rng() + rng()) / 3
  return Math.max(0, Math.min(255, Math.round(average * 255)))
}

/**
 * The size rating for a raw size value. Anything missing or malformed reads as
 * average (M).
 * @param {number | undefined | null} size
 * @returns {'XS' | 'S' | 'M' | 'L' | 'XL'}
 */
export function sizeRating(size) {
  const value = Number(size)
  if (!Number.isFinite(value)) return 'M'
  if (value < 51) return 'XS'
  if (value < 103) return 'S'
  if (value < 154) return 'M'
  if (value < 205) return 'L'
  return 'XL'
}

/**
 * Whether a Pokemon is an alpha (the very largest specimens).
 * @param {{ size?: number } | null | undefined} pokemon
 * @returns {boolean}
 */
export function isAlphaPokemon(pokemon) {
  return Number.isFinite(pokemon?.size) && /** @type {number} */ (pokemon?.size) >= ALPHA_SIZE
}

/**
 * The EXP multiplier an individual earns: an alpha gains more from the same
 * battle, so the rare specimen is worth the effort.
 * @param {{ size?: number } | null | undefined} pokemon
 * @returns {number}
 */
export function alphaExpMultiplier(pokemon) {
  return isAlphaPokemon(pokemon) ? ALPHA_EXP_MULTIPLIER : 1
}

/**
 * The physical height (metres) of an individual: its species' baseline height
 * scaled by its rolled size, so a Wailord and a Diglett are measured on their
 * own scales. Returns null when the species' height is unknown.
 * @param {{ size?: number } | null | undefined} pokemon
 * @param {number | null | undefined} [speciesHeight] The species height in metres.
 * @returns {number | null}
 */
export function sizeHeight(pokemon, speciesHeight) {
  const base = Number(speciesHeight)
  if (!Number.isFinite(base) || base <= 0) return null
  return Math.round(base * sizeFactor(pokemon?.size) * 100) / 100
}

/**
 * Format a height in metres for the size chip, e.g. "0.4 m" or "14.5 m".
 * @param {number} metres
 * @returns {string}
 */
export function formatHeight(metres) {
  const rounded = Math.round(metres * 10) / 10
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} m`
}

/**
 * The tooltip for a Pokemon's size chip, e.g. "L (180/255) - larger than
 * average." Adds the physical height when the species' height is known, and an
 * alpha callout when it applies.
 * @param {{ size?: number } | null | undefined} pokemon
 * @param {number | null | undefined} [speciesHeight] The species height in metres.
 * @returns {string}
 */
export function sizeTooltip(pokemon, speciesHeight) {
  const rating = sizeRating(pokemon?.size),
    hint = SIZE_RATING_HINTS[rating] ?? '',
    size = Number(pokemon?.size),
    height = sizeHeight(pokemon, speciesHeight)
  const base = Number.isFinite(size) ? `${rating} (${size}/255) \u2014 ${hint}` : `${rating} \u2014 ${hint}`
  const withHeight = height != null ? `${base} Stands ${formatHeight(height)} tall.` : base
  return isAlphaPokemon(pokemon)
    ? `${withHeight} An alpha! (+${Math.round((ALPHA_EXP_MULTIPLIER - 1) * 100)}% EXP)`
    : withHeight
}
