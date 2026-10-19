// Progressive feature unlocks: the systems that used to all arrive with a
// fresh save now open on early milestones, so a new run starts with the core
// idle loop (catch, battle, explore) instead of a dozen half-empty panels.
//
// The gates are computed from run progress rather than stored, so a save needs
// no new field. They only use progress that cannot go backwards: badge tallies
// are boosted by a beaten Champion (a region can be prestiged back to zero
// badges after its Champion falls, but the feature should stay open), and every
// other gate is a lifetime battle count or a beaten Champion. `fallback` keeps
// a feature reachable on a save that already made use of it before the gate
// existed (an active hunt, a posted field job, a saved team preset, ...).

/**
 * @typedef {'dailyEvent' | 'quests' | 'professorStory' | 'mysteryGifts' |
 *   'pokewalker' | 'bank' | 'teamPresets' | 'secretBase' | 'focusHunt' |
 *   'sosChain' | 'fieldJobs'} FeatureUnlockId
 */

/**
 * @typedef {{
 *   label: string,
 *   icon: string,
 *   description: string,
 *   requirement: string,
 *   unlocked: (state: GameState) => boolean,
 *   fallback?: (state: GameState) => boolean,
 * }} FeatureUnlock
 */

/** Total battles won this save (wild + trainer). @param {GameState} state */
function totalBattles(state) {
  return (state.wildBattlesWon ?? 0) + (state.trainerBattlesWon ?? 0)
}

/**
 * Total badges earned. A beaten region Champion implies its badges were earned,
 * so replaying (prestiging) a region and clearing its badge list can't take an
 * unlocked feature away again.
 * @param {GameState} state
 */
function badgeProgress(state) {
  const champions = (state.defeatedChampions ?? []).length
  return Math.max((state.defeatedGyms ?? []).length, champions * 3)
}

/** How many regions have been won (their Champion beaten at least once). @param {GameState} state */
function regionsWon(state) {
  return (state.defeatedChampions ?? []).length
}

/** @type {Record<FeatureUnlockId, FeatureUnlock>} */
export const FEATURE_UNLOCKS = {
  dailyEvent: {
    label: 'Daily Event',
    icon: '\u{1f4c5}',
    description:
      'Every day brings a themed event with boosted spawns, shinies or drops. The Dailies button on the battle bar shows what is running.',
    requirement: 'your first Gym badge',
    unlocked: (state) => badgeProgress(state) >= 1,
  },
  quests: {
    label: 'Daily Quests',
    icon: '\u{1f4cb}',
    description:
      'A fresh set of goals each day, drawn from the things you already do. Clearing one pays cash, items and Victory Tokens.',
    requirement: 'your first Gym badge',
    unlocked: (state) => badgeProgress(state) >= 1,
  },
  pokewalker: {
    label: 'Pokewalker',
    icon: '\u{1f45f}',
    description:
      'Your Pokemon bank steps while you are away and spend them on rewards: warming eggs, finding items, or drawing the rarest wild on a route.',
    requirement: 'your first Gym badge',
    unlocked: (state) => badgeProgress(state) >= 1,
  },
  professorStory: {
    label: 'Story',
    icon: '\u{1f4d6}',
    description:
      'The Professor\u2019s story opens a chapter per region, each drawn from progress you already make. Finish one for a themed reward bundle.',
    requirement: '2 Gym badges',
    unlocked: (state) => badgeProgress(state) >= 2,
  },
  focusHunt: {
    label: 'Focus Hunt',
    icon: '\u{1f3af}',
    description:
      'Pick a species or a type and its wild encounters become much more common, with a live tally of sightings, catches and the routes it spawns on.',
    requirement: '2 Gym badges',
    unlocked: (state) => badgeProgress(state) >= 2,
    fallback: (state) => !!state.hunt,
  },
  sosChain: {
    label: 'SOS Chains',
    icon: '\u{1f517}',
    description:
      'Win wild battles in a row on one route to chain it, raising that route\u2019s hidden-ability chance and shiny odds the longer it runs.',
    requirement: '2 Gym badges',
    unlocked: (state) => badgeProgress(state) >= 2,
  },
  secretBase: {
    label: 'Secret Base',
    icon: '\u{1f3e0}',
    description:
      'Set up a base on any route and decorate it: placed furniture grants small passive bonuses and the base banks a daily yield.',
    requirement: '3 Gym badges',
    unlocked: (state) => badgeProgress(state) >= 3,
    fallback: (state) => !!state.secretBase?.locationId,
  },
  mysteryGifts: {
    label: 'Mystery Gifts',
    icon: '\u{1f381}',
    description:
      'A rotating Wonder Card distribution hands out Mythical Pokemon and bonus bundles. Every card you reach stays claimable.',
    requirement: '250 battles',
    unlocked: (state) => totalBattles(state) >= 250,
  },
  bank: {
    label: 'Pokemon Bank',
    icon: '\u{1f3e6}',
    description:
      'A shared storage of thirty Pokemon that outlives any single save, so individuals can move between your save slots.',
    requirement: 'a region Champion',
    unlocked: (state) => regionsWon(state) >= 1,
  },
  teamPresets: {
    label: 'Team Presets',
    icon: '\u{1f4be}',
    description:
      'Save up to eight parties and swap the whole team back in with one tap \u2014 handy for raid bosses and gym runs.',
    requirement: 'a region Champion',
    unlocked: (state) => regionsWon(state) >= 1,
    fallback: (state) => (state.teamPresets ?? []).length > 0,
  },
  fieldJobs: {
    label: 'Field Jobs',
    icon: '\u{1f9f0}',
    description:
      'Post a Pokemon to work a route while you are away. The job banks cash and items and is itemised in the next welcome-back report.',
    requirement: 'a region Champion',
    unlocked: (state) => regionsWon(state) >= 1,
    fallback: (state) => Object.keys(state.jobs ?? {}).length > 0,
  },
}

/**
 * Whether a feature is open on this save. `fallback` features stay reachable
 * when the save already has state for them.
 * @param {GameState} state
 * @param {FeatureUnlockId} featureId
 * @returns {boolean}
 */
export function isFeatureUnlocked(state, featureId) {
  const feature = FEATURE_UNLOCKS[featureId]
  return !!feature && (feature.unlocked(state) || (feature.fallback?.(state) ?? false))
}

/**
 * The requirement for display, e.g. "Unlocks after your first Gym badge".
 * @param {FeatureUnlockId} featureId
 * @returns {string}
 */
export function featureUnlockHint(featureId) {
  const feature = FEATURE_UNLOCKS[featureId]
  return feature ? `Unlocks after ${feature.requirement}` : ''
}

/**
 * Every unlocked feature id for the current state. Used by the unlock popup
 * to diff one state against the last.
 * @param {GameState} state
 * @returns {FeatureUnlockId[]}
 */
export function unlockedFeatureIds(state) {
  return /** @type {FeatureUnlockId[]} */ (
    Object.keys(FEATURE_UNLOCKS).filter((featureId) =>
      isFeatureUnlocked(state, /** @type {FeatureUnlockId} */ (featureId))
    )
  )
}

/**
 * The next system still to open, in unlock order, so the congratulations popup
 * can hint at what is coming. Systems that share a milestone (the first badge
 * opens three at once) are skipped, so the hint never names a peer of the one
 * that just opened. Returns null once everything is open.
 * @param {GameState} state
 * @param {string} [currentRequirement] the milestone the popup is celebrating
 * @returns {FeatureUnlockId | null}
 */
export function nextLockedFeatureId(state, currentRequirement = '') {
  for (const featureId of Object.keys(FEATURE_UNLOCKS)) {
    const id = /** @type {FeatureUnlockId} */ (featureId)
    if (isFeatureUnlocked(state, id)) continue
    if (FEATURE_UNLOCKS[id].requirement === currentRequirement) continue
    return id
  }
  return null
}
