// SOS chaining: a per-route run of consecutive wild wins that slowly tilts the
// hidden-ability and shiny odds, and pays a milestone reward when the route's
// record reaches a threshold. Deliberately separate from the Poke Radar
// minigame's `shinyChain` (a same-species DexNav cache), and kept pure so the
// reducer, the encounter roll and the tests can all share it.

/** Hidden-ability chance at chain 0 (the base `rollAbility` rate). */
export const SOS_BASE_HIDDEN_CHANCE = 0.1

/** How many chain wins add one hidden-ability step. */
export const SOS_HIDDEN_STEP = 10

/** Each hidden-ability step adds this much chance (10% -> 20% -> ...). */
export const SOS_HIDDEN_STEP_BONUS = 0.1

/**
 * At this chain the hidden ability is guaranteed. The chance also rises with
 * every step in between, so the roll is only ever a formality past here.
 */
export const SOS_HIDDEN_GUARANTEE = 40

/** How many chain wins add 1x to the shiny-odds multiplier (1x -> 2x ...). */
export const SOS_SHINY_STEP = 50

/** The highest shiny-odds multiplier an SOS chain reaches (4x). */
export const SOS_SHINY_MAX = 4

/**
 * Milestone rewards, paid once per route the first time its best chain passes
 * the threshold. Kept in ascending order.
 * @type {{ chain: number, itemId: string, amount: number, label: string }[]}
 */
export const SOS_REWARDS = [
  { chain: 10, itemId: 'rareCandy', amount: 1, label: 'Rare Candy' },
  { chain: 25, itemId: 'expCandyL', amount: 1, label: 'Exp. Candy L' },
  { chain: 50, itemId: 'rareCandy', amount: 2, label: '2 Rare Candies' },
]

/**
 * The hidden-ability chance for a chain count: the base 10% plus a step every
 * `SOS_HIDDEN_STEP` wins, guaranteed at `SOS_HIDDEN_GUARANTEE` and capped just
 * below certainty before that.
 * @param {number} [chainCount]
 * @returns {number}
 */
export function sosHiddenAbilityChance(chainCount = 0) {
  if (chainCount >= SOS_HIDDEN_GUARANTEE) return 1
  const steps = Math.floor(Math.max(0, chainCount) / SOS_HIDDEN_STEP)
  return Math.min(0.9, SOS_BASE_HIDDEN_CHANCE + steps * SOS_HIDDEN_STEP_BONUS)
}

/**
 * The shiny-odds multiplier for a chain count: 1x at no chain, +1x every
 * `SOS_SHINY_STEP` wins, capped at `SOS_SHINY_MAX`.
 * @param {number} [chainCount]
 * @returns {number}
 */
export function sosShinyMultiplier(chainCount = 0) {
  return Math.min(SOS_SHINY_MAX, 1 + Math.max(0, chainCount) / SOS_SHINY_STEP)
}

/**
 * The milestone rewards a chain just crossed between two counts. Called with
 * the route's previous best so each threshold only pays once per route.
 * @param {number} previousCount
 * @param {number} nextCount
 * @returns {typeof SOS_REWARDS}
 */
export function sosRewardsCrossed(previousCount, nextCount) {
  return SOS_REWARDS.filter(
    (reward) => previousCount < reward.chain && nextCount >= reward.chain
  )
}
