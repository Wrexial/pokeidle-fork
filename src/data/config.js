// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const evValue = 0

export let legendaryPool = [
    {
      speciesKey: 'articuno',
      level: 70,
    },
    {
      speciesKey: 'zapdos',
      level: 70,
    },
    {
      speciesKey: 'moltres',
      level: 70,
    },
    {
      speciesKey: 'mewtwo',
      level: 80,
    },
    {
      speciesKey: 'mew',
      level: 60,
    },
  ]

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

export const starterSpecies = ['bulbasaur', 'charmander', 'squirtle']

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
