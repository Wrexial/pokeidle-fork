// Per-Pokemon ribbons: cosmetic awards for milestones and achievements, shown
// in the ribbon case on the stats panel. Like the games, a ribbon is permanent
// and travels with the individual.

import { regions } from '../data/gameData.js'
import { VILLAIN_ORGS } from '../data/villain-teams.js'
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
  rival: {
    id: 'rival',
    name: 'Rival Ribbon',
    description: 'Beat the rival at every milestone.',
    icon: '\u{1f91d}',
  },
  shiny: {
    id: 'shiny',
    name: 'Shiny Ribbon',
    description: 'A rare shiny individual.',
    icon: '\u2728',
  },
  firstCatch: {
    id: 'firstCatch',
    name: 'Discovery Ribbon',
    description: 'The first of its species registered in the Pok\u00e9dex.',
    icon: '\u{1f4d6}',
  },
  research: {
    id: 'research',
    name: 'Research Ribbon',
    description: 'Completed this species\u2019 field research.',
    icon: '\u{1f52c}',
  },
  professor: {
    id: 'professor',
    name: 'Professor\u2019s Ribbon',
    description: 'Completed the Professor\u2019s Story chain.',
    icon: '\u{1f393}',
  },
  gmax: {
    id: 'gmax',
    name: 'Gigantamax Ribbon',
    description: 'Helped fell a rotating Gigantamax raid boss.',
    icon: '\u{1f48e}',
  },
}

// One League Ribbon per region, so beating Kanto's Champion reads differently
// from beating Paldea's.
for (const region of regions)
  RIBBONS[`league-${region.id}`] = {
    id: `league-${region.id}`,
    name: `${region.name} League Ribbon`,
    description: `Helped beat the ${region.name} Champion.`,
    icon: '\u{1f451}',
  }

// One ribbon per region's villain arc, earned by dismantling its organisation.
for (const [regionId, org] of Object.entries(VILLAIN_ORGS))
  RIBBONS[org.reward.ribbon] = {
    id: org.reward.ribbon,
    name: `${org.name} Ribbon`,
    description: `Dismantled ${org.name} in the ${regionId} hideout.`,
    icon: '\u{1f3f4}',
  }

/**
 * Award the ribbons a Pokemon earns the moment it is obtained: a shiny is
 * always marked, and the first individual of a species earns the Discovery
 * Ribbon. Idempotent.
 * @param {Pokemon} pokemon
 * @param {{ isNewSpecies?: boolean, isShiny?: boolean }} options
 * @returns {Pokemon}
 */
export function syncObtainedRibbons(pokemon, { isNewSpecies = !1, isShiny = !1 } = {}) {
  if (!pokemon) return pokemon
  let next = pokemon
  if (isShiny) next = awardRibbon(next, 'shiny')
  if (isNewSpecies) next = awardRibbon(next, 'firstCatch')
  return next
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
