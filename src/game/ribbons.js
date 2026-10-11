// Per-Pokemon ribbons: cosmetic awards for milestones and achievements, shown
// in the ribbon case on the stats panel. Like the games, a ribbon is permanent
// and travels with the individual.

import { MAX_FRIENDSHIP } from './pokemon/friendship.js'

/**
 * Every ribbon, keyed by id. `icon` is a short emoji used on the case chip.
 * @type {Record<string, { id: string, name: string, description: string, icon: string }>}
 */
export const RIBBONS = {
  effort: {
    id: 'effort',
    name: 'Effort Ribbon',
    description: 'Reached Lv. 100.',
    icon: '\u{1f396}',
  },
  bestFriends: {
    id: 'bestFriends',
    name: 'Best Friends Ribbon',
    description: 'Reached maximum friendship.',
    icon: '\u{1f496}',
  },
  gym: {
    id: 'gym',
    name: 'Gym Ribbon',
    description: 'Helped win a Gym battle.',
    icon: '\u{1f3c5}',
  },
  elite: {
    id: 'elite',
    name: 'Elite Ribbon',
    description: 'Helped beat an Elite Four member.',
    icon: '\u{1f3c5}',
  },
  league: {
    id: 'league',
    name: 'League Ribbon',
    description: 'Helped beat a Pokemon League Champion.',
    icon: '\u{1f451}',
  },
  tower: {
    id: 'tower',
    name: 'Tower Ribbon',
    description: 'Cleared a Battle Tower floor.',
    icon: '\u{1f5fc}',
  },
  contest: {
    id: 'contest',
    name: 'Contest Ribbon',
    description: 'Won a Pokemon Contest.',
    icon: '\u{1f4ab}',
  },
  gauntlet: {
    id: 'gauntlet',
    name: 'Gauntlet Ribbon',
    description: 'Cleared the Champions\u2019 Gauntlet.',
    icon: '\u{2694}',
  },
}

/**
 * Give a Pokemon a ribbon (idempotent). Returns the same reference when it
 * already has it, so a caller can cheaply skip.
 * @param {Pokemon} pokemon
 * @param {string} ribbonId
 * @returns {Pokemon}
 */
export function awardRibbon(pokemon, ribbonId) {
  if (!pokemon || !RIBBONS[ribbonId]) return pokemon
  const ribbons = pokemon.ribbons ?? []
  if (ribbons.includes(ribbonId)) return pokemon
  return { ...pokemon, ribbons: [...ribbons, ribbonId] }
}

/**
 * Give a ribbon to every party member, returning a new party array (or the
 * same one when nobody changed).
 * @param {Pokemon[]} party
 * @param {string} ribbonId
 * @returns {Pokemon[]}
 */
export function awardRibbonToParty(party, ribbonId) {
  if (!RIBBONS[ribbonId]) return party
  let changed = false
  const next = (party ?? []).map((member) => {
    const awarded = awardRibbon(member, ribbonId)
    if (awarded !== member) changed = true
    return awarded
  })
  return changed ? next : party
}

/**
 * Award the milestone ribbons a Pokemon qualifies for from its own state (Lv.
 * 100 and max friendship). Idempotent, so it is safe to call on every EXP gain.
 * @param {Pokemon} pokemon
 * @returns {Pokemon}
 */
export function syncMilestoneRibbons(pokemon) {
  if (!pokemon) return pokemon
  let next = pokemon
  if ((next.level ?? 0) >= 100) next = awardRibbon(next, 'effort')
  if ((next.friendship ?? 0) >= MAX_FRIENDSHIP) next = awardRibbon(next, 'bestFriends')
  return next
}

/**
 * The ribbon definitions a Pokemon owns, in the order they were awarded.
 * @param {{ ribbons?: string[] } | null | undefined} pokemon
 * @returns {{ id: string, name: string, description: string, icon: string }[]}
 */
export function pokemonRibbons(pokemon) {
  return (pokemon?.ribbons ?? []).map((id) => RIBBONS[id]).filter(Boolean)
}
