// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const evValue = 0

/** Victory Tokens awarded each time a region is prestiged (map progress reset). */
export const prestigeTokenReward = 3

/** Odds that a Cinnabar Island battle is a MissingNo. encounter (1 in 1000). */
export const missingnoEncounterChance = 1 / 1000

/** Shiny odds for a Pokemon received through Wonder Trade (1 in 512). */
export const wonderTradeShinyOdds = 512

export let RAID_COOLDOWN_MS = 1 * 1e3

export let defaultCatchSettings = {
    enabled: !0,
    mode: 'pokedex_new',
    levelThreshold: 1,
    enabledBalls: ['pokeball'],
  }

/**
 * Bump this when the save shape changes in a way the loader can't repair.
 * The storage key includes the version, so a build never reads a newer save it
 * doesn't understand, and an older save is treated as legacy (see
 * `src/game/context.js`): it's migrated if it loads cleanly, otherwise parked
 * under `SAVE_BACKUP_KEY` and ignored so it can't crash the game on every boot.
 * When bumping, add the previous `pokemon-idle-save-v<n>` to `LEGACY_SAVE_KEYS`.
 */
export const SAVE_VERSION = 2
/** Current storage key (versioned). */
export const SAVE_KEY = `pokemon-idle-save-v${SAVE_VERSION}`
/** Earlier storage keys, read once to migrate. */
export const LEGACY_SAVE_KEYS = ['pokemon-idle-save']
/** Where a save that fails to load is parked (never retried, never auto-deleted). */
export const SAVE_BACKUP_KEY = 'pi-save-backup'
/** All keys the game treats as a live save (the quarantine backup is kept). */
export const SAVE_KEYS = [SAVE_KEY, ...LEGACY_SAVE_KEYS]

/** Remove every live save; the quarantine backup is intentionally preserved. */
export function clearSave() {
  for (const key of SAVE_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* storage may be unavailable */
    }
  }
}

export const shinyFullOddsChance = 8192

/** Shiny Charm rate with one completed generation (the original 2x charm). */
export const shinyWithCharmChance = 4096

/** Best Shiny Charm rate, reached once every generation's Pokedex is complete. */
export const shinyCharmMinOddsChance = 256

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
