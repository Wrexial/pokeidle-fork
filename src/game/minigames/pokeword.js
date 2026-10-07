// Unova's Trainer School. Split out of game/minigames.js. A silhouette appears
// with the letters of its name jumbled; tap (or type) them back into order
// before the round's clock runs out.

import { pokemonSpecies } from '../../data/gameData.js'

/** Money spent to sit the class. */
export const POKEWORD_COST = 300

/** Words to spell in one run. */
export const POKEWORD_ROUNDS = 8

/** Seconds allowed per word. */
export const POKEWORD_SECONDS = 15

/** The per-word clock in milliseconds. */
export const POKEWORD_TIME_MS = POKEWORD_SECONDS * 1000

/**
 * Species with short, plain names (no spaces, dots or hyphens) so they scramble
 * into a clean anagram.
 * @type {string[]}
 */
export const POKEWORD_POOL = [
  'pikachu',
  'eevee',
  'bulbasaur',
  'charmander',
  'squirtle',
  'jigglypuff',
  'meowth',
  'psyduck',
  'growlithe',
  'machop',
  'geodude',
  'slowpoke',
  'magnemite',
  'doduo',
  'seel',
  'grimer',
  'shellder',
  'gastly',
  'onix',
  'drowzee',
  'krabby',
  'voltorb',
  'cubone',
  'lickitung',
  'rhyhorn',
  'chansey',
  'tangela',
  'kangaskhan',
  'horsea',
  'goldeen',
  'staryu',
  'scyther',
  'electabuzz',
  'magmar',
  'pinsir',
  'tauros',
  'magikarp',
  'lapras',
  'ditto',
  'vaporeon',
  'jolteon',
  'flareon',
  'snorlax',
  'dratini',
  'chikorita',
  'cyndaquil',
  'totodile',
  'pichu',
  'togepi',
  'mareep',
  'wooper',
  'espeon',
  'umbreon',
  'murkrow',
  'slowking',
  'wobbuffet',
  'girafarig',
  'pineco',
  'dunsparce',
  'gligar',
  'steelix',
  'snubbull',
  'qwilfish',
  'shuckle',
  'heracross',
  'teddiursa',
  'swinub',
  'corsola',
  'remoraid',
  'delibird',
  'skarmory',
  'houndour',
  'phanpy',
  'stantler',
  'smeargle',
  'tyrogue',
  'smoochum',
  'elekid',
  'magby',
  'miltank',
  'blissey',
  'larvitar',
]

/**
 * The letters of a name, uppercased and shuffled (never left in order).
 * @param {string} name
 * @returns {string[]}
 */
export function scrambleLetters(name) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '').split('')
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let index = letters.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1))
      ;[letters[index], letters[swap]] = [letters[swap], letters[index]]
    }
    if (letters.join('') !== name.toUpperCase().replace(/[^A-Z]/g, '')) break
  }
  return letters
}

/**
 * A random challenge: the species, its display name and the scrambled letters.
 * @param {string[]} [pool]
 * @returns {{ speciesKey: string, name: string, letters: string[] }}
 */
export function rollPokewordChallenge(pool = POKEWORD_POOL) {
  const speciesKey = pool[Math.floor(Math.random() * pool.length)],
    name = pokemonSpecies[speciesKey]?.name ?? speciesKey
  return { speciesKey, name, letters: scrambleLetters(name) }
}

/**
 * Whether a guess spells the target name (letters only, case-insensitive).
 * @param {string} guess
 * @param {string} name
 * @returns {boolean}
 */
export function pokewordMatches(guess, name) {
  return guess.toUpperCase().replace(/[^A-Z]/g, '') === name.toUpperCase().replace(/[^A-Z]/g, '')
}

/**
 * Prize for the words spelled.
 * @param {number} cleared
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function pokewordPrize(cleared) {
  if (cleared >= POKEWORD_ROUNDS)
    return {
      money: 4000,
      items: [
        { itemId: 'expCandyL', quantity: 1 },
        { itemId: 'nugget', quantity: 1 },
      ],
      label: 'Name rater!',
    }
  if (cleared >= 6)
    return { money: 2500, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Sharp speller' }
  if (cleared >= 4)
    return { money: 1400, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Good memory' }
  if (cleared >= 2) return { money: 700, items: [], label: 'Getting there' }
  return { money: 250, items: [], label: 'Scrambled' }
}
