// Sprite URL helpers (Pokemon, eggs and trainers). Split from game/pokemon.js.

import { animatedSprites, genderedSprites, trainerClasses } from '../../data/gameData.js'
import { ANIMATED_ONLY_SEASONAL_FORMS, currentSeason, SEASONAL_FORM_IDS } from '../seasons.js'
import { isOnline } from '../network.js'
import { getSpriteStyle } from '../settings.js'

/**
 * Swap the sprite id for a species whose form follows the season (Deerling,
 * Sawsbuck, Burmy, Wormadam, Cherrim). Returns the id unchanged otherwise. The
 * seasonal art is committed beside the base art as `<id>-<suffix>`; the static
 * set has no seasonal shiny fronts and Wormadam's seasonal art is animated
 * only, so those keep the base artwork.
 * @param {number | string} spriteId
 * @param {{ animated?: boolean, isShiny?: boolean, season?: 'spring' | 'summer' | 'autumn' | 'winter' }} [options]
 * @returns {number | string}
 */
export function seasonalSpriteId(spriteId, options = {}) {
  const id = Number(spriteId),
    suffix = SEASONAL_FORM_IDS[id]?.[options.season ?? currentSeason()]
  if (!suffix) return spriteId
  if (!options.animated && (options.isShiny || ANIMATED_ONLY_SEASONAL_FORMS.has(id)))
    return spriteId
  return `${spriteId}-${suffix}`
}

/**
 * Animated sprite directory. It is a merged set: the official Gen V
 * Black/White gifs for national dex ids 1-649, and Pokemon Showdown's
 * animated sprites for every later species/form (PokeAPI has no Gen 6+
 * animation). Anything missing here falls back to the static png — the
 * manifest from download_pokemon_sprites.cjs lets us skip the 404 request.
 * `isFemale` only takes effect for the ids listed in genderedSprites (the
 * species that actually have a female variant); everything else stays male.
 * @param {number | string} spriteId
 * @param {boolean} [isBack]
 * @param {boolean} [isShiny]
 * @param {boolean} [isFemale]
 */
export function getPokemonSpriteUrl(spriteId, isBack = !1, isShiny = !1, isFemale = !1) {
  // The player's sprite-style preference can force the static png set, and the
  // animated set is not part of the offline download, so offline play uses the
  // static art too (no 404s for uncached gifs).
  if (getSpriteStyle() === 'static' || !isOnline())
    return getPokemonSpriteFallbackUrl(spriteId, isBack, isShiny, isFemale)
  const key = Number(spriteId),
    missing = isShiny
      ? isBack
        ? animatedSprites.backShiny
        : animatedSprites.shiny
      : isBack
        ? animatedSprites.back
        : animatedSprites.front,
    femaleAnimated = isShiny
      ? isBack
        ? genderedSprites.animatedBackShiny
        : genderedSprites.animatedShiny
      : isBack
        ? genderedSprites.animatedBack
        : genderedSprites.animatedFront,
    femaleStatic = isShiny
      ? isBack
        ? genderedSprites.backShiny
        : genderedSprites.shiny
      : isBack
        ? genderedSprites.back
        : genderedSprites.front,
    useFemale = isFemale && femaleAnimated.includes(key)
  // Some species (Gen 6+) only have a static female sprite; prefer the right
  // gender over the animation rather than showing the male gif.
  if (isFemale && !useFemale && femaleStatic.includes(key))
    return getPokemonSpriteFallbackUrl(spriteId, isBack, isShiny, true)
  if (!Number.isFinite(key) || key === 0 || missing.includes(key))
    return getPokemonSpriteFallbackUrl(spriteId, isBack, isShiny, isFemale)
  const baseUrl = '/sprites/pokemon/versions/generation-v/black-white/animated',
    seasonalId = seasonalSpriteId(spriteId, { animated: true, isShiny })
  return `${baseUrl}/${isBack ? 'back/' : ''}${isShiny ? 'shiny/' : ''}${
    useFemale ? 'female/' : ''
  }${seasonalId}.gif`
}

/**
 * @param {number | string} spriteId
 * @param {boolean} [isBack]
 * @param {boolean} [isShiny]
 * @param {boolean} [isFemale]
 */
export function getPokemonSpriteFallbackUrl(spriteId, isBack = !1, isShiny = !1, isFemale = !1) {
  const key = Number(spriteId),
    female = isShiny
      ? isBack
        ? genderedSprites.backShiny
        : genderedSprites.shiny
      : isBack
        ? genderedSprites.back
        : genderedSprites.front,
    useFemale = isFemale && female.includes(key),
    baseUrl = '/sprites/pokemon',
    seasonalId = seasonalSpriteId(spriteId, { isShiny })
  return `${baseUrl}/${isBack ? 'back/' : ''}${isShiny ? 'shiny/' : ''}${
    useFemale ? 'female/' : ''
  }${seasonalId}.png`
}

/**
 * The generic egg sprite. Every egg (any species, shiny or not) uses the same
 * image so the sprite never reveals what is inside.
 * @returns {string}
 */
export function getEggSpriteUrl() {
  return '/sprites/pokemon/egg.png'
}

/** @param {string} trainerClass */
export function getTrainerSpriteUrl(trainerClass) {
  return `/sprites/trainers/${trainerClasses[trainerClass]}.png`
}

/** @param {string} spriteKey */
export function getBossTrainerSpriteUrl(spriteKey) {
  return spriteKey ? `/sprites/trainers/${spriteKey}.png` : '/sprites/trainers/acetrainer.png'
}
