// TM acquisition logic. TMs are not bought; they are found. This module picks
// which (unowned) TM a given source hands out: a wild win matching the foe's
// type, a gym of its theme type, a themed minigame, or an achievement's fixed
// gift. Keeping the "pick an unowned move" helper in one place means a TM is
// only ever granted once, and every source degrades to nothing once its pool is
// exhausted.

import { TM_MOVE_IDS, TM_MOVES_BY_TYPE, tmItemId } from '../data/tms.js'
import { pokemonSpecies } from '../data/gameData.js'

/**
 * Pick a random machine move the player does not own yet, drawn from `types`
 * (or every type when `types` is null/empty). Returns null when there is
 * nothing left to find, so callers can silently skip the reward.
 * @param {string[] | null | undefined} types
 * @param {Record<string, number>} inventory
 * @param {() => number} [rng]
 * @returns {string | null}
 */
export function rollUnownedTm(types, inventory, rng = Math.random) {
  const typeList = (types ?? []).filter((type) => TM_MOVES_BY_TYPE[type]?.length > 0),
    pool = typeList.length
      ? [...new Set(typeList.flatMap((type) => TM_MOVES_BY_TYPE[type]))]
      : TM_MOVE_IDS,
    candidates = pool.filter((moveId) => (inventory[tmItemId(moveId)] ?? 0) <= 0)
  return candidates.length > 0 ? candidates[Math.floor(rng() * candidates.length)] : null
}

/**
 * The theme type of a gym leader, inferred from the most common primary type on
 * its team (the generated teams are type-themed, so their aces agree). Used to
 * hand out a type-appropriate TM on a first win.
 * @param {{ team?: { speciesKey: string }[] } | null | undefined} gym
 * @returns {string | null}
 */
export function gymTmType(gym) {
  /** @type {Record<string, number>} */
  const counts = {}
  for (const member of gym?.team ?? []) {
    const type = pokemonSpecies[member.speciesKey]?.types?.[0]
    if (type) counts[type] = (counts[type] ?? 0) + 1
  }
  const best = Object.entries(counts).sort((left, right) => right[1] - left[1])[0]
  return best ? best[0] : null
}

/**
 * TM type pool per minigame phase. `null` means "any type", `undefined` (absent
 * from the map) means the minigame never hands out a TM. `auctionHouse`,
 * `pelago` and `wonderTrade` are deliberately excluded.
 * @type {Record<string, string[] | null>}
 */
export const MINIGAME_TM_TYPES = {
  bugCatching: ['Bug'],
  mining: ['Rock', 'Ground', 'Steel'],
  voltorbFlip: ['Electric'],
  gameCorner: ['Normal', 'Psychic'],
  pokeathlon: ['Fighting', 'Normal'],
  pokeRadar: ['Normal'],
  dynamaxAdventures: ['Dragon', 'Fairy', 'Psychic'],
  academyQuiz: null,
  contest: null,
  safari: null,
  battleRoyal: null,
  championGauntlet: null,
  lightsOut: null,
  curry: null,
  pokestar: null,
  puzzleLeague: null,
  memory: null,
  whack: null,
  musical: null,
  picnic: null,
  pokeballFactory: null,
  ruinsPuzzle: null,
  iceSlide: null,
  mantineSurf: ['Water', 'Flying'],
  rotomRally: ['Electric'],
  ogreOustin: ['Grass'],
  typeFusion: null,
  unownPicross: null,
  pokeshot: ['Flying'],
  teraRaid: null,
  pokeword: null,
  berryBlender: ['Grass'],
}

/** TM type pool per route activity (only the loot activity pays out here).
 * @type {Record<string, string[]>}
 */
export const ROUTE_ACTIVITY_TM_TYPES = {
  forage: ['Grass'],
  fishing: ['Water'],
  diving: ['Water'],
  rockSmash: ['Rock', 'Ground'],
  headbutt: ['Normal', 'Flying'],
}

/**
 * The TM type pool for a minigame claim, or `undefined` when this phase can't
 * hand one out. A route activity reads its activity id from state instead.
 * @param {string} phase
 * @param {string | null | undefined} routeActivityId
 * @returns {string[] | null | undefined}
 */
export function minigameTmTypes(phase, routeActivityId) {
  if (phase === 'routeActivity')
    return ROUTE_ACTIVITY_TM_TYPES[routeActivityId ?? ''] ?? null
  return MINIGAME_TM_TYPES[phase]
}
