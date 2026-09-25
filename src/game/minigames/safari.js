// Kanto Safari Zone. Split from game/minigames.js. Unlike the other minigames
// the Safari is about managing a fleeing Pokemon with a limited number of free
// Safari Balls: Bait calms it (but makes it harder to catch) and a Rock makes
// it easier to catch (but more likely to bolt).

import { breedingData, encounterData, pokemonSpecies } from '../../data/gameData.js'

/** Money spent to enter the Safari Zone. */
export const SAFARI_COST = 500

/** Safari Balls the player gets per visit. */
export const SAFARI_BALLS = 30

/** The free ball used during a Safari run. */
export const SAFARI_BALL = 'safariball'

/** The encounter bucket the Safari pulls from (its own route table). */
export const SAFARI_ROUTE_KEY = 'safariZone'

/** How many turns Bait / a Rock keeps affecting the active Pokemon. */
export const SAFARI_EFFECT_TURNS = 3

/** Safari finds roll shiny at this many times the usual odds. */
export const SAFARI_SHINY_MULTIPLIER = 2

/** Catch-rate multiplier a Safari Ball applies. */
const SAFARI_BALL_MULTIPLIER = 1.5

/** Level band for the Safari Zone's wilds (from its encounter bucket). */
const SAFARI_LEVEL_RANGE = (() => {
  const table = encounterData[SAFARI_ROUTE_KEY]?.encounters ?? [],
    min = Math.min(...table.map((entry) => entry.minLevel)),
    max = Math.max(...table.map((entry) => entry.maxLevel))
  return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : { min: 54, max: 56 }
})()

/**
 * The Safari Zone is split into four subsections. Each carries its own weighted
 * distribution, and the rare species are spread across them, so a hunter can
 * pick the area that has what they are after instead of rolling one flat pool.
 * @type {{ id: string, name: string, description: string, rares: string[], pool: { speciesKey: string, weight: number }[] }[]}
 */
export const SAFARI_AREAS = [
  {
    id: 'center',
    name: 'Center Area',
    description: 'Open plains in the middle of the reserve. Nidoran herds roam here.',
    rares: ['tauros', 'kangaskhan', 'chansey'],
    pool: [
      { speciesKey: 'nidoranF', weight: 16 },
      { speciesKey: 'nidoranM', weight: 16 },
      { speciesKey: 'nidorino', weight: 8 },
      { speciesKey: 'nidorina', weight: 8 },
      { speciesKey: 'doduo', weight: 16 },
      { speciesKey: 'rhyhorn', weight: 12 },
      { speciesKey: 'exeggcute', weight: 8 },
      { speciesKey: 'paras', weight: 6 },
      { speciesKey: 'venonat', weight: 6 },
      { speciesKey: 'tauros', weight: 3 },
      { speciesKey: 'kangaskhan', weight: 3 },
      { speciesKey: 'chansey', weight: 2 },
    ],
  },
  {
    id: 'east',
    name: 'East Area',
    description: 'The river delta. Water Pokemon and Dratini live in the shallows.',
    rares: ['dratini', 'dragonair', 'squirtle'],
    pool: [
      { speciesKey: 'magikarp', weight: 30 },
      { speciesKey: 'psyduck', weight: 24 },
      { speciesKey: 'slowpoke', weight: 24 },
      { speciesKey: 'goldeen', weight: 20 },
      { speciesKey: 'krabby', weight: 12 },
      { speciesKey: 'poliwag', weight: 12 },
      { speciesKey: 'seaking', weight: 8 },
      { speciesKey: 'dratini', weight: 6 },
      { speciesKey: 'squirtle', weight: 2 },
      { speciesKey: 'dragonair', weight: 1 },
    ],
  },
  {
    id: 'north',
    name: 'North Area',
    description: 'Rocky highlands. Scyther and Pinsir duel on the cliffs.',
    rares: ['scyther', 'pinsir', 'charmander'],
    pool: [
      { speciesKey: 'rhyhorn', weight: 14 },
      { speciesKey: 'cubone', weight: 12 },
      { speciesKey: 'parasect', weight: 3 },
      { speciesKey: 'venomoth', weight: 3 },
      { speciesKey: 'scyther', weight: 3 },
      { speciesKey: 'pinsir', weight: 3 },
      { speciesKey: 'marowak', weight: 2 },
      { speciesKey: 'tauros', weight: 2 },
      { speciesKey: 'kangaskhan', weight: 2 },
      { speciesKey: 'chansey', weight: 1 },
      { speciesKey: 'charmander', weight: 2 },
    ],
  },
  {
    id: 'west',
    name: 'West Area',
    description: 'Dense thickets. Tangela and Exeggcute thrive under the canopy.',
    rares: ['tangela', 'bulbasaur', 'exeggcute'],
    pool: [
      { speciesKey: 'exeggcute', weight: 16 },
      { speciesKey: 'paras', weight: 12 },
      { speciesKey: 'venonat', weight: 12 },
      { speciesKey: 'doduo', weight: 12 },
      { speciesKey: 'nidorina', weight: 6 },
      { speciesKey: 'nidorino', weight: 6 },
      { speciesKey: 'tangela', weight: 4 },
      { speciesKey: 'bulbasaur', weight: 3 },
      { speciesKey: 'chansey', weight: 1 },
    ],
  },
]

/**
 * Look up a Safari subsection, falling back to the first.
 * @param {string} areaId
 * @returns {typeof SAFARI_AREAS[number]}
 */
export function safariAreaById(areaId) {
  return SAFARI_AREAS.find((area) => area.id === areaId) ?? SAFARI_AREAS[0]
}

/** @param {string} speciesKey @returns {'male' | 'female' | 'genderless'} */
function rollGender(speciesKey) {
  const data = breedingData[speciesKey]
  if (!data || data.genderRate === -1) return 'genderless'
  if (data.genderRate === 0) return 'male'
  if (data.genderRate === 8) return 'female'
  return Math.random() < data.genderRate / 8 ? 'female' : 'male'
}

/**
 * Roll a wild Pokemon hiding in a Safari subsection.
 * @param {string} [areaId]
 * @returns {{ speciesKey: string, level: number, gender: 'male' | 'female' | 'genderless', areaId: string }}
 */
export function rollSafariPokemon(areaId = SAFARI_AREAS[0].id) {
  const area = safariAreaById(areaId),
    pool = area.pool,
    total = pool.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * total,
    chosen = pool[pool.length - 1]
  for (const entry of pool) {
    roll -= entry.weight
    if (roll <= 0) {
      chosen = entry
      break
    }
  }
  const { min, max } = SAFARI_LEVEL_RANGE
  return {
    speciesKey: chosen.speciesKey,
    level: min + Math.floor(Math.random() * (max - min + 1)),
    gender: rollGender(chosen.speciesKey),
    areaId: area.id,
  }
}

/**
 * Chance a Safari Ball catches a Pokemon, with Bait / Rock modifiers.
 * @param {string} speciesKey
 * @param {{ baited?: number, rocked?: number }} [modifiers]
 * @returns {number}
 */
export function safariCatchChance(speciesKey, modifiers = {}) {
  const catchRate = pokemonSpecies[speciesKey]?.catchRate ?? 255
  let chance = Math.min(1, (catchRate * SAFARI_BALL_MULTIPLIER) / 255)
  if (modifiers.baited) chance *= 0.75
  if (modifiers.rocked) chance *= 1.5
  return Math.min(1, chance)
}

/**
 * Chance the Pokemon flees this turn, with Bait / Rock modifiers. Rarer
 * Pokemon are more skittish.
 * @param {string} speciesKey
 * @param {{ baited?: number, rocked?: number }} [modifiers]
 * @returns {number}
 */
export function safariFleeChance(speciesKey, modifiers = {}) {
  const catchRate = pokemonSpecies[speciesKey]?.catchRate ?? 255
  let chance = Math.max(0.05, Math.min(0.5, ((255 - catchRate) / 255) * 0.6))
  if (modifiers.baited) chance *= 0.5
  if (modifiers.rocked) chance *= 1.7
  return Math.min(0.95, chance)
}

/**
 * Apply a Bait or Rock action to the active modifiers.
 * @param {{ baited?: number, rocked?: number }} modifiers
 * @param {'bait' | 'rock'} action
 * @returns {{ baited: number, rocked: number }}
 */
export function applySafariAction(modifiers, action) {
  if (action === 'bait') return { baited: SAFARI_EFFECT_TURNS, rocked: 0 }
  if (action === 'rock') return { baited: 0, rocked: SAFARI_EFFECT_TURNS }
  return { baited: modifiers.baited ?? 0, rocked: modifiers.rocked ?? 0 }
}

/**
 * Age Bait / Rock by one turn.
 * @param {{ baited?: number, rocked?: number }} modifiers
 * @returns {{ baited?: number, rocked?: number }}
 */
export function tickSafariEffects(modifiers) {
  const baited = Math.max(0, (modifiers.baited ?? 0) - 1),
    rocked = Math.max(0, (modifiers.rocked ?? 0) - 1)
  return baited || rocked ? { baited, rocked } : {}
}

/**
 * Throw a Safari Ball at the active Pokemon.
 * @param {string} speciesKey
 * @param {{ baited?: number, rocked?: number }} [modifiers]
 * @returns {boolean} Whether it was caught.
 */
export function safariThrowsBall(speciesKey, modifiers = {}) {
  return Math.random() < safariCatchChance(speciesKey, modifiers)
}

/**
 * Whether the active Pokemon bolts this turn.
 * @param {string} speciesKey
 * @param {{ baited?: number, rocked?: number }} [modifiers]
 * @returns {boolean}
 */
export function safariFlees(speciesKey, modifiers = {}) {
  return Math.random() < safariFleeChance(speciesKey, modifiers)
}
