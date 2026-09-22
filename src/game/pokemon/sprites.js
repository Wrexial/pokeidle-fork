// Sprite URL helpers (Pokemon, eggs and trainers). Split from game/pokemon.js.

import { animatedSprites, genderedSprites, trainerClasses } from '../../data/gameData.js'

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
  const baseUrl = '/sprites/pokemon/versions/generation-v/black-white/animated'
  return `${baseUrl}/${isBack ? 'back/' : ''}${isShiny ? 'shiny/' : ''}${
    useFemale ? 'female/' : ''
  }${spriteId}.gif`
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
    baseUrl = '/sprites/pokemon'
  return `${baseUrl}/${isBack ? 'back/' : ''}${isShiny ? 'shiny/' : ''}${
    useFemale ? 'female/' : ''
  }${spriteId}.png`
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
