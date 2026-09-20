// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const evValue = 0

export let RAID_COOLDOWN_MS = 1 * 1e3

export let defaultCatchSettings = {
    enabled: !0,
    mode: 'pokedex_new',
    levelThreshold: 1,
    enabledBalls: ['pokeball'],
  }

export const SAVE_KEY = 'pokemon-idle-save'

export const shinyFullOddsChance = 8192

export const shinyWithCharmChance = 4096

/** @type {Record<string, string[]>} */
export const regionalStarters = {
  kanto: ['bulbasaur', 'charmander', 'squirtle'],
  johto: ['chikorita', 'cyndaquil', 'totodile'],
  hoenn: ['treecko', 'torchic', 'mudkip'],
  sinnoh: ['turtwig', 'chimchar', 'piplup'],
  unova: ['snivy', 'tepig', 'oshawott'],
  kalos: ['chespin', 'fennekin', 'froakie'],
  alola: ['rowlet', 'litten', 'popplio'],
  galar: ['grookey', 'scorbunny', 'sobble'],
  paldea: ['sprigatito', 'fuecoco', 'quaxly'],
}

export const starterSpecies = regionalStarters.kanto

export const SAVE_KEY_ALT = 'pokemon-idle-save'

/** @type {Record<string, number>} */
export let trainerClassPayouts = {
  youngster: 16,
  lass: 16,
  bugCatcher: 12,
  hiker: 36,
  swimmer: 20,
  camper: 20,
  sailor: 24,
  gentleman: 56,
  channeler: 20,
  beauty: 56,
  coolTrainer: 36,
  psychic: 24,
  scientist: 48,
  tamer: 24,
  juggler: 28,
  superNerd: 20,
  ace: 36,
  blackbelt: 24,
}
