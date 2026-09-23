// Fishing rod tiers. Each rod unlocks a deeper slice of a route's water
// encounter table, and better rods are found as more regions are opened.

/**
 * @type {{ id: string, name: string, tier: number, regionsRequired: number, rarity: number, levelBonus: number, hint: string }[]}
 */
export const RODS = [
  {
    id: 'oldRod',
    name: 'Old Rod',
    tier: 1,
    regionsRequired: 1,
    rarity: 0.5,
    levelBonus: 0,
    hint: 'Catches the common Pokemon near the surface.',
  },
  {
    id: 'goodRod',
    name: 'Good Rod',
    tier: 2,
    regionsRequired: 2,
    rarity: 0.8,
    levelBonus: 2,
    hint: 'Reaches deeper, mid-water Pokemon.',
  },
  {
    id: 'superRod',
    name: 'Super Rod',
    tier: 3,
    regionsRequired: 3,
    rarity: 1,
    levelBonus: 4,
    hint: 'Reels in the rarest Pokemon in the deep.',
  },
]

/** The rod every run starts with. */
export const DEFAULT_ROD = RODS[0].id

/**
 * @param {string} rodId
 * @returns {(typeof RODS)[number]}
 */
export function rodForId(rodId) {
  return RODS.find((rod) => rod.id === rodId) ?? RODS[0]
}

/**
 * The best rod the player owns, or the Old Rod when they own none.
 * @param {string[] | undefined | null} owned
 * @returns {string}
 */
export function bestRodId(owned) {
  if (!Array.isArray(owned) || owned.length === 0) return DEFAULT_ROD
  return owned.reduce(
    (best, rodId) => (rodForId(rodId).tier > rodForId(best).tier ? rodId : best),
    DEFAULT_ROD
  )
}

/**
 * The rod the player should own after opening `regionCount` regions.
 * @param {number} regionCount
 * @returns {string[]}
 */
export function rodsForRegionCount(regionCount) {
  return RODS.filter((rod) => rod.regionsRequired <= regionCount).map((rod) => rod.id)
}

/**
 * The next rod still to be found, or null once every rod is owned.
 * @param {string[] | undefined | null} owned
 * @returns {(typeof RODS)[number] | null}
 */
export function nextRod(owned) {
  const bestTier = rodForId(bestRodId(owned)).tier
  return RODS.find((rod) => rod.tier === bestTier + 1) ?? null
}
