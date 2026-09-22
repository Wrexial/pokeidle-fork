// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const evValue = 0

/** Victory Tokens awarded each time a region is prestiged (map progress reset). */
export const prestigeTokenReward = 3

/** Odds that a Cinnabar Island battle is a MissingNo. encounter (1 in 1000). */
export const missingnoEncounterChance = 1 / 1000

/** Shiny odds for a Pokemon received through Wonder Trade (1 in 512). */
export const wonderTradeShinyOdds = 512

/** Chance per wild win that a new swarm appears on a random unlocked route. */
export const swarmSpawnChance = 0.01
/** How many wild battles an active swarm lasts. */
export const swarmBattleCount = 50

/** Chance per wild encounter that a region's roaming legendary appears. */
export const roamerEncounterChance = 1 / 1500
/** Chance per turn that a fighting roamer flees. */
export const roamerFleeChance = 0.2

/** Spell chance that a Vermilion City battle is the "Mew under the truck". */
export const mewUnderTruckChance = 1 / 10000
/** Hidden chance a wild win turns up a Master Ball. */
export const wildMasterBallChance = 1 / 50000

/** Very rare chance a wild win infects the party with Pokerus (1 in 10,000). */
export const pokerusChance = 1 / 10000
/** How many wild battles Pokerus lasts before it cures. */
export const pokerusDurationBattles = 150

/** Offline progress: minimum time away to award anything, and the cap. */
export const offlineMinMs = 60_000
export const offlineCapMs = 8 * 3_600_000
/** Money granted per hour away per level of your highest party Pokemon. */
export const offlineMoneyPerHourPerLevel = 40

/** Battles two daycare parents need to produce an egg. */
export const daycareEggBattles = 50
/** Shiny odds for a bred egg (1 in 4096), improved if a parent is shiny. */
export const breedShinyOdds = 4096
export const breedShinyParentOdds = 512

export let RAID_COOLDOWN_MS = 1 * 1e3
/** Raid legendary levels ramp from the pool level (70/75) up to this cap. */
export const RAID_LEVEL_MAX = 100

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

/** Victory Tokens awarded for completing a generation's national dex. */
export const dexRewardVictoryTokens = 3

/** Chance a wild win drops a sellable treasure. */
export const valuableDropChance = 0.03

/** Chance a wild win drops an Exp. Candy (tier scales with the foe's level). */
export const expCandyDropChance = 0.012

/** Chance a wild win drops the much rarer Rare Candy. */
export const rareCandyDropChance = 0.0015

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
