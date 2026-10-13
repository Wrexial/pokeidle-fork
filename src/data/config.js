// Split from src/data/constants.js.

import { autoCatchBallOrder } from './items.js'

/**
 * Effort Values: raised only by vitamins (never by battles), each point worth
 * a quarter of a stat point at level 100. A vitamin adds `EV_VITAMIN_GAIN`
 * EVs to one stat, up to `EV_MAX_PER_STAT`, with a total cap of
 * `EV_MAX_TOTAL` across every stat.
 */
export const EV_VITAMIN_GAIN = 10
export const EV_MAX_PER_STAT = 252
export const EV_MAX_TOTAL = 510

/** Victory Tokens awarded each time a region is prestiged (map progress reset). */
export const prestigeTokenReward = 3

/** How many saved team presets a save keeps (oldest is dropped past this). */
export const MAX_TEAM_PRESETS = 8

/** Odds that a Cinnabar Island battle is a MissingNo. encounter (1 in 1000). */
export const missingnoEncounterChance = 1 / 1000

/** Shiny odds for a Pokemon received through Wonder Trade (1 in 512). */
export const wonderTradeShinyOdds = 512

/** Chance per wild win that a new swarm appears on a random unlocked route. */
export const swarmSpawnChance = 0.01
/**
 * Chance a swarm roll becomes a Hisui space-time distortion instead, once any
 * Hisui area is unlocked (it spawns on a Hisui route and is themed as one).
 */
export const spaceTimeDistortionChance = 0.25
/** How many wild battles an active swarm lasts. */
export const swarmBattleCount = 256
/** Shiny-odds multiplier for the species a swarm is boosting (4x as likely). */
export const swarmShinyMultiplier = 4
/** Best shiny odds a swarm can reach — never better than 1 in 256. */
export const swarmShinyOddsFloor = 256

/** Chance per wild encounter that it becomes a horde (a pack of one species). */
export const hordeEncounterChance = 0.04
/** A horde packs this many of its species (inclusive). */
export const HORDE_SIZE_MIN = 3
export const HORDE_SIZE_MAX = 5
/** Hard cap on horde rounds, so a stall war can never hang the idle loop. */
export const HORDE_MAX_ROUNDS = 40
/** Cap on extra drop rolls a cleared horde pays, keeping it idle-friendly. */
export const HORDE_DROP_ROLLS_CAP = 3

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
/**
 * Wild wins the offline catch-up assumes per hour away, so the per-win systems
 * (Pelago, garden, Kurt's crafts, the Day-Care) keep advancing while the tab is
 * closed. Kept conservative — an idle player wins far more than this.
 */
export const offlineBattlesPerHour = 240
/** How long a manual battle waits for the player before falling back to auto. */
export const manualInputTimeoutMs = 60_000
/** Money granted per hour away per level of your highest party Pokemon. */
export const offlineMoneyPerHourPerLevel = 40

/**
 * Pokewalker: steps accrue from real time away (and slowly while idle), are
 * capped per day, and buy small quality-of-life rewards.
 */
export const pokewalkerStepsPerHour = 900
export const pokewalkerDailyCap = 9000
export const pokewalkerEggCost = 400
export const pokewalkerItemCost = 250
export const pokewalkerRevealCost = 600
/** Wild battles a Rare Radar reveal draws its target out for. */
export const pokewalkerRevealBattles = 100
/** Egg steps a Pokewalker spend removes from every party egg. */
export const pokewalkerEggSteps = 512
/** Day-Care battles a Pokewalker spend adds toward the next egg. */
export const pokewalkerEggDaycareProgress = 10

/** Battles two daycare parents need to produce an egg. */
export const daycareEggBattles = 50

/** Chance a wild win yields a TM matching the defeated foe's type. */
export const wildTmDropChance = 1 / 200
/** Chance a themed minigame or route activity hands out an unowned TM. */
export const minigameTmChance = 0.18
/** TMs a gym leader awards when the player first earns its badge. */
export const gymTmRewardCount = 2
/** Small fee a reusable TM charges each time it is taught to a Pokemon. */
export const tmTeachCost = 500
/** Shiny odds for a bred egg (1 in 4096), improved if a parent is shiny. */
export const breedShinyOdds = 4096
export const breedShinyParentOdds = 512
/**
 * Masuda method: shiny odds for an egg whose two parents come from different
 * regions (a "foreign" parent, e.g. from a Wonder Trade).
 */
export const masudaShinyOdds = 683

export let RAID_COOLDOWN_MS = 1 * 1e3
/** Raid legendary levels ramp from the pool level (70/75) up to this cap. */
export const RAID_LEVEL_MAX = 100

/**
 * Out-of-combat "field moves": a party Pokemon that knows the move can apply
 * the listed active-effect item's benefit to a wild species on the current
 * route without spending the item, on a real-time cooldown (see the
 * `USE_FIELD_MOVE` action). Sweet Scent stands in for Honey.
 * @type {Record<string, { name: string, effectType: string, cooldownMs: number }>}
 */
export const fieldMoves = {
  sweetScent: {
    name: 'Sweet Scent',
    effectType: 'honey',
    cooldownMs: 5 * 60 * 1000,
  },
}

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
 * Pokemon Bank: a slot-independent localStorage stash for moving individuals
 * between saves. It lives outside every save blob so a deposited Pokemon is
 * moved out of its slot, and it has its own capacity.
 */
export const BANK_KEY = 'pokemon-idle-bank'
export const BANK_VERSION = 1
export const BANK_CAPACITY = 30

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
 * Key the inline boot guard (index.html) copies every save into before it
 * clears them and reloads. `clearSave` drops it too, so an intentional reset
 * never leaves a stale backup behind for the next boot to resurrect.
 */
export const BOOT_BACKUP_KEY = 'pi-save-boot-backup'

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
  // An explicit reset also forgets the boot-guard backup.
  try {
    localStorage.removeItem(BOOT_BACKUP_KEY)
  } catch {
    /* storage may be unavailable */
  }
}

export const shinyFullOddsChance = 4096

/** Shiny Charm rate with one completed generation (the original 2x charm). */
export const shinyWithCharmChance = 2048

/** Best Shiny Charm rate, reached once every generation's Pokedex is complete. */
export const shinyCharmMinOddsChance = 256

/** Victory Tokens awarded for completing a generation's national dex. */
export const dexRewardVictoryTokens = 3

/**
 * Living form-dex rewards. A family pays money scaled by how many forms and
 * gender variants it asks for; a whole regional set and a whole generation pay
 * a bigger bundle. Every level is paid once (see `rewardedFamilies` /
 * `rewardedRegionalSets` / `rewardedFormGenerations`).
 */
export const formDexFamilyBaseMoney = 400
export const formDexFamilyVariantMoney = 200
export const formDexRegionalReward = { money: 5000, victoryTokens: 3, items: { masterball: 1 } }
export const formDexGenerationReward = { money: 10000, victoryTokens: 5, items: { masterball: 1 } }

/** Chance a wild win drops a sellable treasure. */
export const valuableDropChance = 0.03

/** Chance a wild win drops an Exp. Candy (tier scales with the foe's level). */
export const expCandyDropChance = 0.012

/** Chance a wild win drops the much rarer Rare Candy. */
export const rareCandyDropChance = 0.0015

/** Chance a wild win on a Johto route turns up an Apricorn for Kurt. */
export const apricornDropChance = 0.12

/** Chance a wild win on a wild route turns up an Ancient Relic (quest item). */
export const relicDropChance = 0.08

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
  fisherman: 24,
  picnicker: 20,
  birdKeeper: 24,
  burglar: 40,
  guitarist: 32,
  cowgirl: 28,
  cyclist: 24,
  lady: 60,
  pilot: 44,
  skier: 32,
  waiter: 28,
  richBoy: 60,
  worker: 36,
  idol: 48,
  policeman: 44,
  aromaLady: 32,
  chef: 36,
  dancer: 36,
  gambler: 36,
  nurse: 40,
  biker: 32,
  schoolkid: 20,
  roughneck: 28,
  parasolLady: 36,
  musician: 32,
  preschooler: 16,
  artist: 36,
  backpacker: 28,
  pokemonRanger: 44,
  doctor: 44,
  veteran: 48,
  medium: 32,
}
