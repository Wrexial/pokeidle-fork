// Rolls one Snowpoint Temple run. Every visit draws its Strength chambers and
// ice rooms at random from the shared pools, so no two runs are the same. The
// par is summed over just the chosen rooms, so the score stays fair whatever
// the roll.

import { ICE_SLIDE_ROOMS, parseIceLevel } from './ice-slide.js'
import { STRENGTH_ROOMS, parseStrengthLevel } from './strength.js'

/** @typedef {ReturnType<typeof parseStrengthLevel>} StrengthLevel */
/** @typedef {ReturnType<typeof parseIceLevel>} IceLevel */
/** @typedef {{ mode: 'strength', level: StrengthLevel }} StrengthStage */
/** @typedef {{ mode: 'ice', room: IceLevel }} IceStage */
/** @typedef {StrengthStage | IceStage} IceTempleStage */

/** Strength chambers a run fields by default. */
export const ICE_TEMPLE_STRENGTH_STAGES = 2

/** Ice rooms a run fields by default. */
export const ICE_TEMPLE_ICE_STAGES = 4

/**
 * Pick `count` distinct entries from `pool`, in a random order. Counts are
 * clamped to the pool, and at least one entry is always returned so a run
 * still has a stage to play.
 * @template T
 * @param {T[]} pool
 * @param {number} count
 * @param {() => number} [random]
 * @returns {T[]}
 */
export function pickIceTempleRooms(pool, count, random = Math.random) {
  const indices = pool.map((_, index) => index)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
    .slice(0, Math.max(1, Math.min(count, pool.length)))
    .map((index) => pool[index])
}

/**
 * Build one temple run: the Strength gates first, then the ice rooms, each
 * drawn at random from its pool.
 * @param {() => number} [random]
 * @param {{ strengthStages?: number, iceStages?: number }} [options]
 * @returns {{ stages: IceTempleStage[], strengthRooms: StrengthLevel[], iceRooms: IceLevel[], par: number }}
 */
export function buildIceTempleStages(random = Math.random, options = {}) {
  const strengthRooms = pickIceTempleRooms(
      STRENGTH_ROOMS,
      options.strengthStages ?? ICE_TEMPLE_STRENGTH_STAGES,
      random
    ),
    iceRooms = pickIceTempleRooms(ICE_SLIDE_ROOMS, options.iceStages ?? ICE_TEMPLE_ICE_STAGES, random)
  /** @type {IceTempleStage[]} */
  const stages = [
    ...strengthRooms.map((level) => /** @type {IceTempleStage} */ ({ mode: 'strength', level })),
    ...iceRooms.map((room) => /** @type {IceTempleStage} */ ({ mode: 'ice', room })),
  ]
  const par = stages.reduce(
    (sum, stage) => sum + (stage.mode === 'strength' ? stage.level.par : stage.room.par),
    0
  )
  return { stages, strengthRooms, iceRooms, par }
}
