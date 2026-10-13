// The Secret Base: pick a route, decorate it with furniture, plushies and
// milestone trophies, and every placed item grants a small passive bonus plus
// a daily yield you collect after idling. It follows the Pelago / Garden
// pattern — everything advances on wild wins, never on a real-time timer.

import { todayKey } from '../data/daily-events.js'
import { pokemonSpecies } from '../data/gameData.js'

/** The placement grid: cells are addressed by `x` (column) and `y` (row). */
export const SECRET_BASE_GRID = { width: 6, height: 4 }

/** Cost to move an already-established base to another route. */
export const SECRET_BASE_RELOCATE_COST = 1000

/** Money the base itself banks each day, before decorations. */
export const SECRET_BASE_DAILY_BASE = 250

/** Money banked per wild win while a base is set up. */
export const SECRET_BASE_YIELD_PER_WIN = 8

/** Wild wins that count toward a single day's yield before it stops growing. */
export const SECRET_BASE_YIELD_WIN_CAP = 400

/** Most a single passive bonus can reach, as a fraction (0.3 = +30%). */
export const SECRET_BASE_BONUS_CAP = 0.3

/** The passive bonus stats a decoration (or the whole base) can provide. */
export const SECRET_BASE_BONUS_KEYS =
  /** @type {('exp' | 'money' | 'catch' | 'shiny')[]} */ ([
    'exp',
    'money',
    'catch',
    'shiny',
  ])

/**
 * The decoration catalogue. Furniture and plushies are bought with money;
 * trophies are milestone rewards claimed once their milestone is met.
 * @type {SecretBaseDecoration[]}
 */
export const SECRET_BASE_DECORATIONS = [
  // Furniture
  {
    id: 'pottedPlant',
    name: 'Potted Plant',
    category: 'furniture',
    icon: '\u{1FAB4}',
    cost: 1200,
    bonus: { catch: 0.01 },
  },
  {
    id: 'woodenDesk',
    name: 'Wooden Desk',
    category: 'furniture',
    icon: '\u{1FA91}',
    cost: 1800,
    bonus: { exp: 0.01 },
  },
  {
    id: 'comfyChair',
    name: 'Comfy Chair',
    category: 'furniture',
    icon: '\u{1F6CB}\uFE0F',
    cost: 2200,
    bonus: { money: 0.01 },
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    category: 'furniture',
    icon: '\u{1F4DA}',
    cost: 3000,
    bonus: { exp: 0.02 },
  },
  {
    id: 'campStove',
    name: 'Camp Stove',
    category: 'furniture',
    icon: '\u{1F525}',
    cost: 3600,
    bonus: { catch: 0.02 },
  },
  {
    id: 'television',
    name: 'Television',
    category: 'furniture',
    icon: '\u{1F4FA}',
    cost: 4200,
    bonus: { money: 0.02 },
  },
  {
    id: 'workbench',
    name: 'Workbench',
    category: 'furniture',
    icon: '\u{1F9F0}',
    cost: 5500,
    bonus: { money: 0.03 },
  },
  {
    id: 'bunkBed',
    name: 'Bunk Bed',
    category: 'furniture',
    icon: '\u{1F6CF}\uFE0F',
    cost: 6500,
    bonus: { exp: 0.03 },
  },
  // Plushies
  {
    id: 'pikachuPlush',
    name: 'Pikachu Plush',
    category: 'plushie',
    icon: '\u{1F9F8}',
    cost: 4000,
    bonus: { exp: 0.02 },
  },
  {
    id: 'eeveePlush',
    name: 'Eevee Plush',
    category: 'plushie',
    icon: '\u{1F43E}',
    cost: 5000,
    bonus: { catch: 0.02 },
  },
  {
    id: 'jigglypuffPlush',
    name: 'Jigglypuff Plush',
    category: 'plushie',
    icon: '\u{1F3A4}',
    cost: 5000,
    bonus: { money: 0.02 },
  },
  {
    id: 'snorlaxPlush',
    name: 'Snorlax Plush',
    category: 'plushie',
    icon: '\u{1F634}',
    cost: 7000,
    bonus: { exp: 0.03 },
  },
  {
    id: 'gengarPlush',
    name: 'Gengar Plush',
    category: 'plushie',
    icon: '\u{1F47B}',
    cost: 8000,
    bonus: { shiny: 0.02 },
  },
  {
    id: 'dragonitePlush',
    name: 'Dragonite Plush',
    category: 'plushie',
    icon: '\u{1F409}',
    cost: 9000,
    bonus: { money: 0.03 },
    yield: { money: 50 },
  },
  // Trophies (milestone rewards)
  {
    id: 'firstBadgeTrophy',
    name: 'First Badge Trophy',
    category: 'trophy',
    icon: '\u{1F3C5}',
    cost: 0,
    bonus: { exp: 0.03 },
    milestone: { type: 'badges', value: 1 },
    yield: { money: 150 },
  },
  {
    id: 'championCup',
    name: "Champion's Cup",
    category: 'trophy',
    icon: '\u{1F3C6}',
    cost: 0,
    bonus: { money: 0.05 },
    milestone: { type: 'champions', value: 1 },
    yield: { money: 400, items: { rareCandy: 1 } },
  },
  {
    id: 'researcherTrophy',
    name: 'Researcher Trophy',
    category: 'trophy',
    icon: '\u{1F52C}',
    cost: 0,
    bonus: { exp: 0.05 },
    milestone: { type: 'dex', value: 100 },
    yield: { money: 250 },
  },
  {
    id: 'shinyTrophy',
    name: 'Shiny Hunter Trophy',
    category: 'trophy',
    icon: '\u2728',
    cost: 0,
    bonus: { shiny: 0.05 },
    milestone: { type: 'shinies', value: 1 },
    yield: { money: 200 },
  },
  {
    id: 'towerTrophy',
    name: 'Tower Conqueror Trophy',
    category: 'trophy',
    icon: '\u{1F5FC}',
    cost: 0,
    bonus: { money: 0.04 },
    milestone: { type: 'tower', value: 20 },
    yield: { money: 300 },
  },
  {
    id: 'legendTrophy',
    name: 'Legend Catcher Trophy',
    category: 'trophy',
    icon: '\u{1F409}',
    cost: 0,
    bonus: { catch: 0.05 },
    milestone: { type: 'legendaries', value: 3 },
    yield: { money: 300, items: { ultraball: 1 } },
  },
  {
    id: 'worldTourTrophy',
    name: 'World Tour Trophy',
    category: 'trophy',
    icon: '\u{1F30D}',
    cost: 0,
    bonus: { exp: 0.04, money: 0.04 },
    milestone: { type: 'regions', value: 3 },
    yield: { money: 500 },
  },
]

/** Look up a decoration by id. @param {string} id */
export function decorationById(id) {
  return SECRET_BASE_DECORATIONS.find((decoration) => decoration.id === id) ?? null
}

/** A fresh, unplaced Secret Base. @returns {SecretBase} */
export function createSecretBase() {
  return {
    locationId: null,
    placements: [],
    inventory: {},
    lastYieldDate: '',
    yieldProgress: 0,
    totalYield: 0,
  }
}

/**
 * The milestone counters a trophy can be gated on.
 * @param {GameState} state
 * @returns {Record<string, number>}
 */
export function secretBaseMilestones(state) {
  const legendaryCount = (state.pokedexCaught ?? []).filter(
    (/** @type {string} */ speciesKey) => pokemonSpecies[speciesKey]?.legendary
  ).length,
    tower = Math.max(0, ...Object.values(state.towerBest ?? {}).map((floor) => Number(floor) || 0)),
    prestige = Object.values(state.regionPrestige ?? {}).reduce(
      (sum, level) => sum + (Number(level) || 0),
      0
    )
  return {
    badges: (state.defeatedGyms ?? []).length,
    champions: (state.defeatedChampions ?? []).length,
    dex: (state.pokedexCaught ?? []).length,
    shinies: (state.shinyCaught ?? []).length,
    tower,
    legendaries: legendaryCount,
    prestige,
    regions: (state.unlockedRegions ?? []).length,
  }
}

/**
 * Whether a decoration is unlocked for the player (furniture and plushies are
 * always available; a trophy needs its milestone).
 * @param {SecretBaseDecoration} decoration
 * @param {GameState} state
 * @returns {boolean}
 */
export function decorationUnlocked(decoration, state) {
  if (!decoration.milestone) return true
  return (secretBaseMilestones(state)[decoration.milestone.type] ?? 0) >= decoration.milestone.value
}

/** How many of a decoration are owned (placed plus in storage). @param {SecretBase} base @param {string} decorationId */
export function ownedDecorationCount(base, decorationId) {
  const placed = base.placements.filter((placement) => placement.decorationId === decorationId).length
  return (base.inventory[decorationId] ?? 0) + placed
}

/**
 * The sum of every placed decoration's passive bonuses, capped per stat.
 * @param {SecretBase | undefined} base
 * @returns {{ exp: number, money: number, catch: number, shiny: number }}
 */
export function secretBaseBonuses(base) {
  /** @type {{ exp: number, money: number, catch: number, shiny: number }} */
  const totals = { exp: 0, money: 0, catch: 0, shiny: 0 }
  if (!base?.placements?.length) return totals
  for (const placement of base.placements) {
    const decoration = decorationById(placement.decorationId)
    if (!decoration) continue
    for (const key of SECRET_BASE_BONUS_KEYS)
      totals[key] += decoration.bonus[key] ?? 0
  }
  for (const key of SECRET_BASE_BONUS_KEYS)
    totals[key] = Math.min(SECRET_BASE_BONUS_CAP, totals[key])
  return totals
}

/** Whether a grid cell is inside the grid and empty. @param {SecretBase} base @param {number} x @param {number} y */
export function canPlaceAt(base, x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return false
  if (x < 0 || y < 0 || x >= SECRET_BASE_GRID.width || y >= SECRET_BASE_GRID.height) return false
  return !base.placements.some((placement) => placement.x === x && placement.y === y)
}

/**
 * Place one owned decoration on an empty cell. Returns null when the move is
 * not legal.
 * @param {SecretBase} base
 * @param {string} decorationId
 * @param {number} x
 * @param {number} y
 * @returns {SecretBase | null}
 */
export function placeDecoration(base, decorationId, x, y) {
  if (!decorationById(decorationId)) return null
  if ((base.inventory[decorationId] ?? 0) <= 0) return null
  if (!canPlaceAt(base, x, y)) return null
  const inventory = { ...base.inventory, [decorationId]: base.inventory[decorationId] - 1 }
  if (inventory[decorationId] <= 0) delete inventory[decorationId]
  return {
    ...base,
    inventory,
    placements: [...base.placements, { decorationId, x, y }],
  }
}

/**
 * Lift a placed decoration back into storage.
 * @param {SecretBase} base
 * @param {number} x
 * @param {number} y
 * @returns {SecretBase | null}
 */
export function removeDecoration(base, x, y) {
  const placement = base.placements.find((entry) => entry.x === x && entry.y === y)
  if (!placement) return null
  return {
    ...base,
    placements: base.placements.filter((entry) => !(entry.x === x && entry.y === y)),
    inventory: {
      ...base.inventory,
      [placement.decorationId]: (base.inventory[placement.decorationId] ?? 0) + 1,
    },
  }
}

/**
 * Advance the base by one wild win, banking a little more of the day's yield.
 * @param {SecretBase | undefined} base
 * @returns {SecretBase | undefined}
 */
export function tickSecretBase(base) {
  if (!base || !base.locationId) return base
  if (base.yieldProgress >= SECRET_BASE_YIELD_WIN_CAP) return base
  return { ...base, yieldProgress: base.yieldProgress + 1 }
}

/** Whether the day's yield is ready to collect. @param {SecretBase | undefined} base @param {string} [dateKey] */
export function isSecretBaseYieldReady(base, dateKey = todayKey()) {
  return !!base?.locationId && base.lastYieldDate !== dateKey
}

/**
 * The day's yield: a base amount plus what the decorations and the wild wins
 * since the last collection have banked.
 * @param {SecretBase | undefined} base
 * @returns {{ money: number, items: { itemId: string, quantity: number }[] }}
 */
export function secretBaseDailyYield(base) {
  if (!base?.locationId) return { money: 0, items: [] }
  let money = SECRET_BASE_DAILY_BASE
  /** @type {Map<string, number>} */
  const items = new Map()
  for (const placement of base.placements) {
    const decoration = decorationById(placement.decorationId)
    money += decoration?.yield?.money ?? 0
    for (const [itemId, quantity] of Object.entries(decoration?.yield?.items ?? {}))
      items.set(itemId, (items.get(itemId) ?? 0) + quantity)
  }
  money += Math.min(base.yieldProgress, SECRET_BASE_YIELD_WIN_CAP) * SECRET_BASE_YIELD_PER_WIN
  return { money, items: [...items].map(([itemId, quantity]) => ({ itemId, quantity })) }
}
