// Split from src/data/constants.js — see tools/decompile/split-module.mjs

import { autoCatchBallOrder } from './items.js'

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
export const swarmBattleCount = 256
/** Shiny-odds multiplier for the species a swarm is boosting (4x as likely). */
export const swarmShinyMultiplier = 4
/** Best shiny odds a swarm can reach — never better than 1 in 256. */
export const swarmShinyOddsFloor = 256

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
/** How long a manual battle waits for the player before falling back to auto. */
export const manualInputTimeoutMs = 60_000
/** Money granted per hour away per level of your highest party Pokemon. */
export const offlineMoneyPerHourPerLevel = 40

/** Battles two daycare parents need to produce an egg. */
export const daycareEggBattles = 50

/** Money a Move Tutor charges per TM move taught. */
export const tutorMoveCost = 4000
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
    // Every ball the auto-catcher can throw is enabled out of the box; the
    // Master Ball is excluded (it has its own battle button).
    enabledBalls: [...autoCatchBallOrder],
  }

/**
 * Bump this when the save shape changes in a way the loader can't repair.
 * The storage key includes the version, so a build never reads a newer save it
 * doesn't understand, and an older save is treated as legacy (see
 * `src/game/context.js`): it's migrated if it loads cleanly, otherwise parked
 * under `SAVE_BACKUP_KEY` and ignored so it can't crash the game on every boot.
 * When bumping, add the previous `pokemon-idle-save-v<n>` to `LEGACY_SAVE_KEYS`
 * (and the previous per-slot keys, `-slot2` … `-slot3`, if slots should migrate).
 */
export const SAVE_VERSION = 2
/** Current storage key (versioned). */
export const SAVE_KEY = `pokemon-idle-save-v${SAVE_VERSION}`
/** Earlier storage keys, read once to migrate. */
export const LEGACY_SAVE_KEYS = ['pokemon-idle-save']
/** Where a save that fails to load is parked (never retried, never auto-deleted). */
export const SAVE_BACKUP_KEY = 'pi-save-backup'

/** How many independent save slots the game offers. */
export const SAVE_SLOT_COUNT = 3
/** Storage key holding the slot the game is currently playing (1-based). */
export const ACTIVE_SLOT_KEY = 'pokemon-idle-active-slot'

/**
 * Storage key for a save slot. Slot 1 keeps the original versioned key so
 * existing saves migrate in place; the other slots are suffixed.
 * @param {number} slot
 * @returns {string}
 */
export function saveSlotKey(slot) {
  return slot === 1 ? SAVE_KEY : `${SAVE_KEY}-slot${slot}`
}

/**
 * The active 1-based save slot, or 0 when none has been chosen yet.
 * @returns {number}
 */
export function getActiveSlot() {
  try {
    const slot = Number(localStorage.getItem(ACTIVE_SLOT_KEY))
    return Number.isInteger(slot) && slot >= 1 && slot <= SAVE_SLOT_COUNT ? slot : 0
  } catch {
    return 0
  }
}

/** @param {number} slot */
export function setActiveSlot(slot) {
  try {
    localStorage.setItem(ACTIVE_SLOT_KEY, String(slot))
  } catch {
    /* storage may be unavailable */
  }
}

/**
 * Remove a slot's save. Defaults to the active slot; the legacy keys are only
 * read for (and cleared with) slot 1.
 * @param {number} [slot]
 */
export function clearSave(slot = getActiveSlot() || 1) {
  const keys = [saveSlotKey(slot), ...(slot === 1 ? LEGACY_SAVE_KEYS : [])]
  for (const key of keys) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* storage may be unavailable */
    }
  }
}

export const shinyFullOddsChance = 4096

/** Shiny Charm rate with one completed generation (the original 2x charm). */
export const shinyWithCharmChance = 2048

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

/**
 * Chance a headbutted tree or rustled contest bush shakes out a second Pokemon.
 * You can only keep one, so the other flees \u2014 the "awwhh" moment.
 */
export const doubleSpawnChance = 0.2

/**
 * Exp. Share payout while active. The active Pokemon keeps this fraction of a
 * win's EXP, and every other non-fainted party member gains this fraction each.
 */
export const expShareActiveMultiplier = 0.5
export const expSharePartyMultiplier = 0.25

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

/**
 * The route that hosts each region's Daycare. The breeding state is global, so
 * a pair deposited in one region can be collected in another.
 * @type {Record<string, string>}
 */
export const DAYCARE_LOCATIONS = {
  kanto: 'route5',
  johto: 'johto-route-34',
  hoenn: 'hoenn-route-117',
  sinnoh: 'sinnoh-route-209',
  unova: 'unova-route-3',
  kalos: 'kalos-route-7',
  alola: 'alola-route-5',
  galar: 'galar-route-5',
  paldea: 'paldea-south-province-area-two',
}

/**
 * The region whose Battle Tower is the game's only one. Other regions are
 * planned to get their own minigames instead, so `towerFloor`/`towerBest` are
 * Hoenn-only and save repair consolidates any legacy per-region records here.
 */
export const BATTLE_TOWER_REGION = 'hoenn'
/** The Hoenn route that hosts the Battle Tower (its map POI / launch spot). */
export const BATTLE_TOWER_LOCATION = 'hoenn-route-111'
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
