// Paldea's Ogre Oustin'. Split out of game/minigames.js. Berries tumble down the
// field and the basket has to be under them when they land. Golden berries are
// worth a fistful, while a rock costs you the catch. Fill the basket before the
// timer runs out.

/** Money spent to play. */
export const OGRE_OUSTIN_COST = 400

/** How long the round lasts. */
export const OGRE_OUSTIN_SECONDS = 30

/** The scene ticks this often. */
export const OGRE_OUSTIN_TICK_MS = 50

/** Columns the basket can stand in. */
export const OGRE_OUSTIN_LANES = 7

/** The most time a round can run. */
export const OGRE_OUSTIN_TIME_MS = OGRE_OUSTIN_SECONDS * 1000

/** A drop takes this long to reach the ground at the start of a round. */
export const OGRE_OUSTIN_FALL_MS = 2500

/** ...and this long once the round is at its busiest. */
export const OGRE_OUSTIN_MIN_FALL_MS = 1250

/** A drop spawns this often at the start of a round. */
export const OGRE_OUSTIN_SPAWN_MS = 640

/** ...and this often once the round is at its busiest. */
export const OGRE_OUSTIN_MIN_SPAWN_MS = 320

/**
 * What can tumble down: berries score, a golden berry scores a fistful, and a
 * rock costs you if you catch it.
 * @type {{ kind: string, weight: number, points: number }[]}
 */
export const OGRE_OUSTIN_TARGETS = [
  { kind: 'berry', weight: 8, points: 1 },
  { kind: 'gold', weight: 1, points: 5 },
  { kind: 'rock', weight: 4, points: -2 },
]

const OGRE_OUSTIN_TOTAL_WEIGHT = OGRE_OUSTIN_TARGETS.reduce((sum, target) => sum + target.weight, 0)

/**
 * Roll the next drop.
 * @returns {{ kind: string, weight: number, points: number }}
 */
export function rollOgreDrop() {
  let roll = Math.random() * OGRE_OUSTIN_TOTAL_WEIGHT
  for (const target of OGRE_OUSTIN_TARGETS) {
    roll -= target.weight
    if (roll <= 0) return target
  }
  return OGRE_OUSTIN_TARGETS[0]
}

/**
 * The fall time for a drop released `elapsedMs` into the round. Everything
 * speeds up as the round runs down.
 * @param {number} elapsedMs
 * @returns {number}
 */
export function ogreFallMs(elapsedMs) {
  const progress = Math.min(1, Math.max(0, elapsedMs / OGRE_OUSTIN_TIME_MS))
  return Math.round(OGRE_OUSTIN_FALL_MS - (OGRE_OUSTIN_FALL_MS - OGRE_OUSTIN_MIN_FALL_MS) * progress)
}

/**
 * The gap between drops `elapsedMs` into the round.
 * @param {number} elapsedMs
 * @returns {number}
 */
export function ogreSpawnMs(elapsedMs) {
  const progress = Math.min(1, Math.max(0, elapsedMs / OGRE_OUSTIN_TIME_MS))
  return Math.round(
    OGRE_OUSTIN_SPAWN_MS - (OGRE_OUSTIN_SPAWN_MS - OGRE_OUSTIN_MIN_SPAWN_MS) * progress
  )
}

/**
 * Prize for the berries in the basket.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function ogreOustinPrize(score) {
  if (score >= 30)
    return {
      money: 4200,
      items: [
        { itemId: 'expCandyL', quantity: 1 },
        { itemId: 'nugget', quantity: 1 },
      ],
      label: 'Ogre-sized haul!',
    }
  if (score >= 20)
    return {
      money: 2600,
      items: [{ itemId: 'expCandyM', quantity: 1 }],
      label: 'Great catch',
    }
  if (score >= 12)
    return { money: 1500, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Filled the basket' }
  if (score >= 5) return { money: 700, items: [], label: 'A few berries' }
  return { money: 250, items: [], label: 'Dropped them all' }
}
