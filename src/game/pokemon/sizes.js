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
 * The tooltip for a Pokemon's size chip, e.g. "L (180/255) — larger than
 * average." Adds an alpha callout when it applies.
 * @param {{ size?: number } | null | undefined} pokemon
 * @returns {string}
 */
export function sizeTooltip(pokemon) {
  const rating = sizeRating(pokemon?.size),
    hint = SIZE_RATING_HINTS[rating] ?? '',
    size = Number(pokemon?.size)
  const base = Number.isFinite(size) ? `${rating} (${size}/255) — ${hint}` : `${rating} — ${hint}`
  return isAlphaPokemon(pokemon) ? `${base} An alpha!` : base
}
