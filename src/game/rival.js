// The recurring rival: a named trainer who turns up at badge milestones with a
// team that scales to your own, and remembers how many times you've beaten them.

import { baseRegions, pokemonSpecies, speciesKeysByGeneration } from '../data/gameData.js'

/** The rival's name per region. @type {Record<string, string>} */
export const RIVAL_NAMES = {
  kanto: 'Blue',
  johto: 'Silver',
  hoenn: 'Wally',
  sinnoh: 'Barry',
  unova: 'Hugh',
  kalos: 'Calem',
  alola: 'Hau',
  galar: 'Hop',
  paldea: 'Nemona',
}

/** Badge counts that trigger a rival challenge, in order (one per stage). */
export const RIVAL_MILESTONES = [2, 4, 6, 8]

/**
 * The Showdown trainer-sprite key for each rival (see download-trainer-sprites.cjs).
 * @type {Record<string, string>}
 */
export const RIVAL_SPRITE_KEYS = {
  kanto: 'blue',
  johto: 'silver',
  hoenn: 'wally',
  sinnoh: 'barry',
  unova: 'hugh',
  kalos: 'calem',
  alola: 'hau',
  galar: 'hop',
  paldea: 'nemona-masters',
}

/**
 * The trainer sprite key for a region's rival, falling back to a generic Ace
 * Trainer.
 * @param {string} regionId
 * @returns {string}
 */
export function rivalSpriteKey(regionId) {
  return /** @type {Record<string, string>} */ (RIVAL_SPRITE_KEYS)[regionId] ?? 'acetrainer'
}

/**
 * Pre/post-battle dialogue per rival: `intro` lines before, `win`/`lose` after.
 * @type {Record<string, { intro: string[], win: string, lose: string }>}
 */
export const RIVAL_DIALOGUE = {
  kanto: {
    intro: ['Smell ya later! I already caught more Pokemon than you.', 'Let me show you how a real trainer battles.'],
    win: 'Tch... you got me this time. I will be back stronger.',
    lose: 'Heh, knew it. Come back when you have actually trained.',
  },
  johto: {
    intro: ['A Pokemon is only as strong as its trainer.', 'Show me what your bond is worth.'],
    win: 'You and your Pokemon are in sync... I underestimated you.',
    lose: 'Weak. You need to treat your Pokemon with more care.',
  },
  hoenn: {
    intro: ['I have been training hard since we last met.', 'I want to see how far I have come \u2014 let us battle!'],
    win: 'You are amazing! I still have a long way to go.',
    lose: 'I did it... I really caught up to you.',
  },
  sinnoh: {
    intro: ['I am going to be the strongest trainer ever \u2014 no pressure!', 'FINE, let us settle this right now!'],
    win: 'Augh! You are always one step ahead of me.',
    lose: 'Yeah! I am getting stronger, you wait and see!',
  },
  unova: {
    intro: ['I have been thinking about what it means to be a trainer.', 'Let your Pokemon speak for you in this battle.'],
    win: 'You two really trust each other... that is what I want to have.',
    lose: 'Your Pokemon deserve better than that. Train harder.',
  },
  kalos: {
    intro: ['I have grown a lot since our first battle.', 'Let us make this one worth remembering!'],
    win: 'Incredible... you really are a step ahead of me.',
    lose: 'I win. Do not take it easy on me next time.',
  },
  alola: {
    intro: ['Hey, cousin! I have been itching for a rematch.', 'Let us have a battle that neither of us will forget!'],
    win: 'Whoa, you are really something! I am going to train even harder.',
    lose: 'Yeah! Another win for me \u2014 let us go again soon!',
  },
  galar: {
    intro: ['I am going to be the next Champion, you will see!', 'Let me test my team against yours right now!'],
    win: 'You are so strong... I have so much more to learn.',
    lose: 'Yes! I knew all that training would pay off!',
  },
  paldea: {
    intro: ['You are never getting away from our rivalry!', 'Let us battle \u2014 I want to see your team at full power!'],
    win: 'Wow, you are the best! I am going to catch up to you someday.',
    lose: 'Ha! Another win for me. Do not fall behind, okay?',
  },
}

/**
 * The pre/post-battle dialogue for a rival at a given stage.
 * @param {string} regionId
 * @param {number} stage
 * @returns {{ intro: string[], win: string, lose: string }}
 */
export function rivalDialogue(regionId, stage) {
  const entry = RIVAL_DIALOGUE[regionId] ?? RIVAL_DIALOGUE.kanto,
    // Every other stage swaps in the second intro line, so repeats feel fresh.
    intro =
      stage % 2 === 1 && entry.intro.length > 1 ? [entry.intro[1]] : entry.intro
  return { intro, win: entry.win, lose: entry.lose }
}

/** How many projects the queue can hold is elsewhere; the rival caps at the milestones. */

/**
 * The rival's name for a region.
 * @param {string} regionId
 * @returns {string}
 */
export function rivalName(regionId) {
  return RIVAL_NAMES[regionId] ?? 'Rival'
}

/**
 * How many times the player has beaten a region's rival.
 * @param {{ rivals?: Record<string, number> }} state
 * @param {string} regionId
 * @returns {number}
 */
export function rivalStage(state, regionId) {
  return state.rivals?.[regionId] ?? 0
}

/**
 * Whether a region's rival is waiting for a challenge: there is another
 * milestone to clear and the player has earned enough badges for it.
 * @param {{ rivals?: Record<string, number> }} state
 * @param {string} regionId
 * @param {number} badgeCount Badges earned in the region.
 * @returns {{ ready: boolean, stage: number, requiredBadges: number | null }}
 */
export function rivalChallenge(state, regionId, badgeCount) {
  const stage = rivalStage(state, regionId),
    requiredBadges = RIVAL_MILESTONES[stage] ?? null
  return { ready: requiredBadges != null && badgeCount >= requiredBadges, stage, requiredBadges }
}

/**
 * The region's generation index (region order == generation order).
 * @param {string} regionId
 * @returns {number}
 */
function generationForRegion(regionId) {
  const index = baseRegions.findIndex((region) => region.id === regionId)
  return index >= 0 ? index : 0
}

/**
 * The species a rival can field in a region: real, non-legendary species from
 * that region's generation.
 * @param {string} regionId
 * @returns {string[]}
 */
function rivalSpeciesPool(regionId) {
  const speciesKeys = speciesKeysByGeneration[generationForRegion(regionId)] ?? []
  return speciesKeys.filter((key) => {
    const species = pokemonSpecies[key]
    return species && species.id > 0 && species.id <= 1025 && !species.legendary
  })
}

/**
 * The level a rival's team is built from: the average level of the player's
 * party, so one over-levelled ace doesn't drag the whole fight up with it.
 * @param {{ level?: number }[] | null | undefined} party
 * @returns {number}
 */
export function rivalBenchmarkLevel(party) {
  const levels = (party ?? [])
    .map((member) => Number(member?.level))
    .filter((level) => Number.isFinite(level) && level > 0)
  if (levels.length === 0) return 5
  const average = levels.reduce((sum, level) => sum + level, 0) / levels.length
  return Math.max(5, Math.round(average))
}

/**
 * Build a rival's team: `2 + stage` distinct species from the region's
 * generation, all at a level a little above the player's party average so the
 * fight scales with them.
 * @param {string} regionId
 * @param {number} stage
 * @param {number} playerLevel The player's party average (see `rivalBenchmarkLevel`).
 * @param {() => number} [rng]
 * @returns {{ speciesKey: string, level: number }[]}
 */
export function buildRivalTeam(regionId, stage, playerLevel, rng = Math.random) {
  const pool = rivalSpeciesPool(regionId),
    size = Math.max(1, Math.min(5, 2 + stage)),
    level = Math.max(5, Math.min(100, Math.round(playerLevel || 5) + stage)),
    team = [],
    used = new Set()
  for (let attempt = 0; attempt < 200 && team.length < size && pool.length > 0; attempt++) {
    const key = pool[Math.floor(rng() * pool.length)]
    if (used.has(key)) continue
    used.add(key)
    // The later members (the rival's ace) sit at the base level; earlier ones
    // are a level or two below, so the team reads as a real curve.
    team.push({ speciesKey: key, level: Math.max(5, level - (size - 1 - team.length)) })
  }
  return team
}
