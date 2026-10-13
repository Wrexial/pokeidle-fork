// Villain-team questline logic: the org table itself lives in
// src/data/villain-teams.js, while this module turns it into arc state, teams
// and stage metadata. Teams are built from the region's own generation so the
// grunts and admin read as real trainers, while the boss always fields the
// org's signature and its legendary ace.

import { baseRegions, pokemonSpecies, speciesKeysByGeneration } from '../data/gameData.js'
import { isFinalEvolution } from './progression/teams.js'
import {
  VILLAIN_ORGS,
  VILLAIN_STAGES,
  VILLAIN_TOTAL_STAGES,
  villainOrgFor,
} from '../data/villain-teams.js'

export { VILLAIN_ORGS, VILLAIN_STAGES, VILLAIN_TOTAL_STAGES, villainOrgFor }

/**
 * The level each arc stage fields, ramping from the first grunt to the boss.
 * It is flat across regions: a hideout is a late-game challenge wherever it
 * sits, so the arc tops out at the level cap rather than the region's curve.
 * @type {Record<string, number>}
 */
export const VILLAIN_STAGE_LEVELS = {
  'grunt-1': 75,
  'grunt-2': 80,
  'grunt-3': 85,
  admin: 90,
  boss: 100,
}

/**
 * What kind of trainer a stage is.
 * @param {string} stageId
 * @returns {'grunt' | 'admin' | 'boss'}
 */
export function villainStageKind(stageId) {
  if (stageId === 'admin') return 'admin'
  if (stageId === 'boss') return 'boss'
  return 'grunt'
}

/**
 * The region's generation index (region order == generation order), matching
 * the rival's pool.
 * @param {string} regionId
 * @returns {number}
 */
function generationForRegion(regionId) {
  const index = baseRegions.findIndex((region) => region.id === regionId)
  return index >= 0 ? index : 0
}

/**
 * The species a villain team can field: real, non-legendary species from the
 * region's generation, with the org's theme types sorted first so the grunts
 * read as an organisation. Admin and boss teams only field final evolutions.
 * @param {string} regionId
 * @param {string[]} types
 * @param {boolean} [finalOnly]
 * @returns {string[]}
 */
function villainSpeciesPool(regionId, types, finalOnly = false) {
  const speciesKeys = speciesKeysByGeneration[generationForRegion(regionId)] ?? [],
    /** @type {string[]} */ biased = [],
    /** @type {string[]} */ other = []
  for (const key of speciesKeys) {
    const species = pokemonSpecies[key]
    if (!species || species.id <= 0 || species.id > 1025 || species.legendary) continue
    if (finalOnly && !isFinalEvolution(key)) continue
    if (types.some((type) => species.types.includes(type))) biased.push(key)
    else other.push(key)
  }
  return [...biased, ...other]
}

/**
 * `count` distinct species from `pool` that are not already used.
 * @param {string[]} pool
 * @param {Set<string>} used
 * @param {number} count
 * @param {() => number} rng
 * @returns {string[]}
 */
function pickDistinct(pool, used, count, rng) {
  const picked = []
  for (let attempt = 0; attempt < 200 && picked.length < count && pool.length > 0; attempt++) {
    const key = pool[Math.floor(rng() * pool.length)]
    if (used.has(key)) continue
    used.add(key)
    picked.push(key)
  }
  return picked
}

/**
 * Build a villain trainer's team. The boss carries the org's signature Pokemon
 * and then its legendary ace; the admin carries its signature. Levels sit a
 * little above the region's badge gate so the hideout is a real step up.
 * @param {string} stageId
 * @param {string} regionId
 * @param {() => number} [rng]
 * @returns {{ speciesKey: string, level: number }[]}
 */
export function buildVillainTeam(stageId, regionId, rng = Math.random) {
  const org = VILLAIN_ORGS[regionId]
  if (!org) return []
  const kind = villainStageKind(stageId),
    level = VILLAIN_STAGE_LEVELS[stageId] ?? 75,
    pool = villainSpeciesPool(regionId, org.types, kind !== 'grunt'),
    used = new Set()
  /** @type {string[]} */
  let picks
  if (kind === 'boss') {
    used.add(org.boss.signature)
    used.add(org.boss.legendary)
    picks = [
      ...pickDistinct(pool, used, 3, rng),
      org.boss.signature,
      org.boss.legendary,
    ]
  } else if (kind === 'admin') {
    used.add(org.admin.signature)
    picks = [...pickDistinct(pool, used, 2, rng), org.admin.signature]
  } else {
    picks = pickDistinct(pool, used, 2, rng)
  }
  const size = picks.length
  return picks.map((speciesKey, index) => ({
    speciesKey,
    // The ace sits at the base level; the rest a level or two below, so the
    // team reads as a curve.
    level: Math.max(5, Math.min(100, level - (size - 1 - index))),
  }))
}

/**
 * The trainer's display name for a stage.
 * @param {VillainOrg} org
 * @param {string} stageId
 * @returns {string}
 */
export function villainStageName(org, stageId) {
  const kind = villainStageKind(stageId)
  return kind === 'admin' ? org.admin.name : kind === 'boss' ? org.boss.name : `${org.name} Grunt`
}

/**
 * A short label for the arc checklist ("Grunt 2", "Admin Plumeria", ...).
 * @param {VillainOrg} org
 * @param {string} stageId
 * @returns {string}
 */
export function villainStageLabel(org, stageId) {
  const kind = villainStageKind(stageId)
  if (kind === 'admin') return `Admin ${org.admin.name}`
  if (kind === 'boss') return `Boss ${org.boss.name}`
  return `Grunt ${Number(stageId.split('-')[1]) || 1}`
}

/**
 * The sprite key for a stage.
 * @param {VillainOrg} org
 * @param {string} stageId
 * @returns {string}
 */
export function villainStageSprite(org, stageId) {
  const kind = villainStageKind(stageId)
  if (kind === 'admin') return org.admin.spriteKey
  if (kind === 'boss') return org.boss.spriteKey
  return 'roughneck'
}

/**
 * The trainer class a stage uses (drives the cash payout; villains pay like an
 * Ace Trainer).
 * @param {VillainOrg} org
 * @param {string} stageId
 * @returns {string}
 */
export function villainStageClass(org, stageId) {
  return villainStageKind(stageId) === 'grunt' ? org.gruntClass : 'ace'
}

/**
 * The opening lines for a stage.
 * @param {VillainOrg} org
 * @param {string} stageId
 * @returns {string[]}
 */
export function villainStageLines(org, stageId) {
  const kind = villainStageKind(stageId)
  return kind === 'admin' ? org.adminLines : kind === 'boss' ? org.bossLines : org.gruntLines
}

/**
 * How many stages of a region's arc are done (0..VILLAIN_TOTAL_STAGES).
 * @param {{ villainProgress?: Record<string, number> }} state
 * @param {string} regionId
 * @returns {number}
 */
export function villainProgressFor(state, regionId) {
  const raw = state.villainProgress?.[regionId] ?? 0
  return Math.max(0, Math.min(VILLAIN_TOTAL_STAGES, Math.floor(raw)))
}

/**
 * The full status of a region's villain arc, or null.
 * @param {{ villainProgress?: Record<string, number> }} state
 * @param {string} regionId
 * @returns {{
 *   org: VillainOrg,
 *   region: string,
 *   progress: number,
 *   total: number,
 *   complete: boolean,
 *   nextStage: string | null,
 *   stages: { id: string, label: string, kind: string, done: boolean, current: boolean }[],
 * } | null}
 */
export function villainStatus(state, regionId) {
  const org = villainOrgFor(regionId)
  if (!org) return null
  const progress = villainProgressFor(state, regionId)
  return {
    org,
    region: regionId,
    progress,
    total: VILLAIN_TOTAL_STAGES,
    complete: progress >= VILLAIN_TOTAL_STAGES,
    nextStage: VILLAIN_STAGES[progress] ?? null,
    stages: VILLAIN_STAGES.map((id, index) => ({
      id,
      label: villainStageLabel(org, id),
      kind: villainStageKind(id),
      done: index < progress,
      current: index === progress,
    })),
  }
}

/**
 * The post-arc reward for a region's org, or null.
 * @param {string} regionId
 * @returns {VillainOrg['reward'] | null}
 */
export function villainRewardFor(regionId) {
  return VILLAIN_ORGS[regionId]?.reward ?? null
}
