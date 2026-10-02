// Rolls one Snowpoint Temple run. Every visit draws its Strength chambers from
// the hand-designed pool and its ice rooms from the hand-designed pool plus a
// handful of freshly generated fair rooms, so no two runs play the same. The
// par is summed over just the drawn rooms, so the score stays fair whatever
// the roll.

import { generateIceRoom } from './ice-generator.js'
import { ICE_SLIDE_ROOMS, parseIceLevel } from './ice-slide.js'
import { STRENGTH_ROOMS, parseStrengthLevel } from './strength.js'

/** @typedef {ReturnType<typeof parseStrengthLevel>} StrengthLevel */
/** @typedef {ReturnType<typeof parseIceLevel>} IceLevel */
/** @typedef {{ mode: 'strength', level: StrengthLevel }} StrengthStage */
/** @typedef {{ mode: 'ice', room: IceLevel }} IceStage */
/** @typedef {StrengthStage | IceStage} IceTempleStage */

/** Strength chambers a run fields by default. */
export const ICE_TEMPLE_STRENGTH_STAGES = 2

/** Ice rooms a run fields at prestige 0. */
export const ICE_TEMPLE_ICE_STAGES = 4

/** Extra ice rooms added per region prestige level. */
export const ICE_TEMPLE_PRESTIGE_STEP = 1

/** Most extra ice rooms prestige can add. */
export const ICE_TEMPLE_PRESTIGE_MAX = 3

/** Freshly generated rooms added to the ice pool each run. */
export const ICE_GENERATED_ROOMS = 6

/**
 * Run size for a region prestige level: prestige 0 is the base line, and each
 * level (a region cleared again) adds another ice room, capped.
 * @param {number} [prestige]
 * @returns {{ strengthStages: number, iceStages: number }}
 */
export function iceTempleRunSize(prestige = 0) {
  const bonus = Math.max(
    0,
    Math.min(Math.floor(prestige) * ICE_TEMPLE_PRESTIGE_STEP, ICE_TEMPLE_PRESTIGE_MAX)
  )
  return { strengthStages: ICE_TEMPLE_STRENGTH_STAGES, iceStages: ICE_TEMPLE_ICE_STAGES + bonus }
}

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
 * The ice rooms a run can draw from: the hand-designed pool plus a handful of
 * freshly generated fair rooms, de-duplicated.
 * @param {() => number} [random]
 * @returns {IceLevel[]}
 */
export function buildIceTempleRoomPool(random = Math.random) {
  const pool = [...ICE_SLIDE_ROOMS]
  const seen = new Set(pool.map((room) => room.rows.join('\n')))
  for (let index = 0; index < ICE_GENERATED_ROOMS; index++) {
    const room = generateIceRoom(random)
    if (!room) continue
    const key = room.rows.join('\n')
    if (seen.has(key)) continue
    seen.add(key)
    pool.push(room)
  }
  return pool
}

/**
 * Build one temple run: the Strength gates first, then the ice rooms.
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
    iceRooms = pickIceTempleRooms(
      buildIceTempleRoomPool(random),
      options.iceStages ?? ICE_TEMPLE_ICE_STAGES,
      random
    )
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
