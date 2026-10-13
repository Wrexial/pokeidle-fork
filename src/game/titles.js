// Trainer titles: the flourish printed under the player's name on the Trainer
// Card. Titles are cosmetic and purely derived — every achievement the player
// has earned contributes its own title, and a handful of collection-wide ribbon
// milestones contribute ribbon titles. Only the *selected* title is saved (see
// `trainerProfile.title`); the list is recomputed from the live state so it
// always tracks what the player has actually done.

import { ACHIEVEMENTS } from '../data/achievements.js'
import { RIBBONS } from './ribbons.js'

/**
 * @typedef {{ id: string, name: string, description: string, source: 'achievement' | 'ribbon' }} Title
 * @typedef {{
 *   ribbonCount: number,
 *   distinctRibbons: Set<string>,
 *   bestPokemonRibbons: number,
 *   has: (ribbonId: string) => boolean,
 * }} RibbonContext
 */

/**
 * Ribbon collection milestones that grant a title. `check` reads aggregate
 * per-collection ribbon stats (a title is player-wide, unlike a Pokemon's own
 * ribbons which stay on the individual).
 * @type {{ id: string, name: string, description: string, check: (context: RibbonContext) => boolean }[]}
 */
export const RIBBON_TITLES = [
  {
    id: 'ribbon:decorated',
    name: 'The Decorated',
    description: 'Earn any ribbon on one of your Pokemon.',
    check: (context) => context.ribbonCount >= 1,
  },
  {
    id: 'ribbon:collector',
    name: 'Ribbon Collector',
    description: 'Bank 25 ribbons across your collection.',
    check: (context) => context.ribbonCount >= 25,
  },
  {
    id: 'ribbon:specialist',
    name: 'Ribbon Specialist',
    description: 'Raise one Pokemon carrying six different ribbons.',
    check: (context) => context.bestPokemonRibbons >= 6,
  },
  {
    id: 'ribbon:leagueHero',
    name: 'League Hero',
    description: `Earn a ${RIBBONS.league.name}.`,
    check: (context) =>
      [...context.distinctRibbons].some(
        (id) => id === 'league' || id.startsWith('league-')
      ),
  },
  {
    id: 'ribbon:shiny',
    name: 'Sparkling Friend',
    description: `Earn a ${RIBBONS.shiny.name}.`,
    check: (context) => context.has('shiny'),
  },
  {
    id: 'ribbon:gauntlet',
    name: 'Gauntlet Breaker',
    description: `Earn a ${RIBBONS.gauntlet.name}.`,
    check: (context) => context.has('gauntlet'),
  },
  {
    id: 'ribbon:beloved',
    name: 'Beloved Trainer',
    description: `Earn a ${RIBBONS.bestFriends.name}.`,
    check: (context) => context.has('bestFriends'),
  },
  {
    id: 'ribbon:researcher',
    name: 'Field Researcher',
    description: `Earn a ${RIBBONS.research.name}.`,
    check: (context) => context.has('research'),
  },
  {
    id: 'ribbon:villain',
    name: 'Villain Vanquisher',
    description: 'Dismantle a region\u2019s villain organisation.',
    check: (context) =>
      [...context.distinctRibbons].some((id) => id.startsWith('villain-')),
  },
  {
    id: 'ribbon:towerTitan',
    name: 'Tower Titan',
    description: `Earn a ${RIBBONS.tower.name}.`,
    check: (context) => context.has('tower'),
  },
]

/** The title id an achievement contributes. @param {string} achievementId */
export function achievementTitleId(achievementId) {
  return `ach:${achievementId}`
}

/**
 * Look up a title definition by id without needing the live game state, so the
 * save-slot summary can label a stored title. Returns null for unknown ids.
 * @param {string | null | undefined} id
 * @returns {Title | null}
 */
export function titleById(id) {
  if (!id) return null
  if (id.startsWith('ach:')) {
    const achievement = ACHIEVEMENTS.find((entry) => achievementTitleId(entry.id) === id)
    return achievement
      ? {
          id,
          name: achievement.name,
          description: achievement.description,
          source: 'achievement',
        }
      : null
  }
  const ribbonTitle = RIBBON_TITLES.find((entry) => entry.id === id)
  return ribbonTitle
    ? {
        id,
        name: ribbonTitle.name,
        description: ribbonTitle.description,
        source: 'ribbon',
      }
    : null
}

/**
 * Every title the player can currently show: one per achieved achievement, plus
 * the ribbon-collection milestones. Ordered achievements first, then ribbons.
 * @param {GameState} state
 * @returns {Title[]}
 */
export function availableTitles(state) {
  /** @type {Title[]} */
  const titles = []
  for (const achievement of ACHIEVEMENTS)
    if (achievement.check(state))
      titles.push({
        id: achievementTitleId(achievement.id),
        name: achievement.name,
        description: achievement.description,
        source: 'achievement',
      })
  const owned = [...(state.party ?? []), ...(state.box ?? [])]
  const ribbonLists = owned.map((pokemon) => pokemon.ribbons ?? [])
  const distinctRibbons = new Set(ribbonLists.flat())
  const context = /** @type {RibbonContext} */ ({
    ribbonCount: ribbonLists.reduce((total, ribbons) => total + ribbons.length, 0),
    distinctRibbons,
    bestPokemonRibbons: ribbonLists.reduce(
      (best, ribbons) => Math.max(best, new Set(ribbons).size),
      0
    ),
    has: (/** @type {string} */ ribbonId) => distinctRibbons.has(ribbonId),
  })
  for (const ribbonTitle of RIBBON_TITLES)
    if (ribbonTitle.check(context))
      titles.push({
        id: ribbonTitle.id,
        name: ribbonTitle.name,
        description: ribbonTitle.description,
        source: 'ribbon',
      })
  return titles
}
