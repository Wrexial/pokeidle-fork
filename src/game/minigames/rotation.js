// Battle Tower rotation battles: each side fields a trio but only the active
// Pokemon fights. At the start of every round a side may rotate for free, then
// the two active Pokemon trade a single turn. Fainting rotates the next healthy
// member in; a side loses once all three are down. The per-turn resolve reuses
// the doubles round engine with one battler per side, so the move AI, speed
// order and residual pass all behave like a normal singles turn.

import { moveData, pokemonSpecies } from '../../data/gameData.js'
import { getTypeMultiplier } from '../combat/damage.js'
import { DOUBLES_POOL, runDoublesRound } from './doubles.js'

/** Money spent on a rotation run at the Battle Tower. */
export const ROTATION_COST = 750

/** Pokemon per side in a rotation battle. */
export const ROTATION_TEAM_SIZE = 3

/** Hard cap so a stall war can never hang the scene. */
export const ROTATION_MAX_ROUNDS = 80

/** @param {any} pokemon */
function alive(pokemon) {
  return !!pokemon && pokemon.currentHp > 0
}

/** The strongest non-legendary opponent species key (falls back to Magikarp). */
function poolPick() {
  const pool = DOUBLES_POOL.length > 0 ? DOUBLES_POOL : ['magikarp']
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * A trio of opponents for a rotation bout, scaled above the player's level.
 * @param {number} baseLevel
 * @param {number} [wave]
 * @returns {{ speciesKey: string, level: number, name: string }[]}
 */
export function rotationOpponents(baseLevel, wave = 1) {
  const level = Math.max(5, Math.min(100, Math.round(baseLevel + wave * 2)))
  return Array.from({ length: ROTATION_TEAM_SIZE }, () => poolPick()).map((speciesKey) => ({
    speciesKey,
    level,
    name: pokemonSpecies[speciesKey]?.name ?? speciesKey,
  }))
}

/**
 * The indices of a team's healthy members.
 * @param {any[]} team
 * @returns {number[]}
 */
export function healthyIndices(team) {
  return team.map((member, index) => (alive(member) ? index : -1)).filter((index) => index >= 0)
}

/**
 * Step the active index to the next healthy member (wrapping), or the current
 * index when nothing else is healthy.
 * @param {any[]} team
 * @param {number} activeIndex
 * @returns {number}
 */
export function nextHealthyIndex(team, activeIndex) {
  const healthy = healthyIndices(team)
  if (healthy.length === 0) return activeIndex
  const next = healthy.find((index) => index > activeIndex)
  return next ?? healthy[0]
}

/**
 * Score a candidate's best move against a foe: type effectiveness times the
 * move's power, so a super-effective attacker beats a bulky neutral one.
 * @param {any} attacker
 * @param {any} foe
 * @returns {number}
 */
function matchupScore(attacker, foe) {
  if (!alive(attacker) || !foe) return -1
  let best = 0
  for (const moveId of attacker.moves ?? []) {
    const move = moveData[moveId]
    if (!move || move.category === 'status') {
      best = Math.max(best, 1)
      continue
    }
    best = Math.max(best, (move.power ?? 0) * getTypeMultiplier(move.type, foe.types ?? []))
  }
  // Nudge toward a healthier body, so a bruised active steps aside.
  const hpRatio = attacker.maxHp > 0 ? attacker.currentHp / attacker.maxHp : 0
  return best * (0.5 + hpRatio)
}

/**
 * The best healthy index to have active against `foe`: the current one unless
 * another member has a clearly better matchup. Used by the AI (and as the
 * player's auto-rotate), so a run plays sensibly unattended.
 * @param {any[]} team
 * @param {number} activeIndex
 * @param {any} foe
 * @returns {number}
 */
export function chooseRotation(team, activeIndex, foe) {
  const healthy = healthyIndices(team)
  if (healthy.length <= 1) return healthy[0] ?? activeIndex
  let best = activeIndex,
    bestScore = matchupScore(team[activeIndex], foe)
  for (const index of healthy) {
    if (index === activeIndex) continue
    const score = matchupScore(team[index], foe)
    if (score > bestScore + 1) {
      best = index
      bestScore = score
    }
  }
  return best
}

/**
 * Resolve one rotation round: rotate each side to its chosen active, then trade
 * a single turn between them. Mutates the teams; returns the round's events and
 * a display log.
 * @param {any[]} allyTeam
 * @param {number} allyActive
 * @param {any[]} foeTeam
 * @param {number} foeActive
 * @param {{ weather?: any, terrain?: any, deterministic?: boolean }} [options]
 * @returns {{ events: any[], log: string[], allyActive: number, foeActive: number }}
 */
export function runRotationRound(allyTeam, allyActive, foeTeam, foeActive, options = {}) {
  const log = /** @type {string[]} */ ([]),
    // The AI rotates to its best matchup before the turn.
    nextFoeActive = alive(foeTeam[foeActive])
      ? chooseRotation(foeTeam, foeActive, allyTeam[allyActive])
      : nextHealthyIndex(foeTeam, foeActive),
    nextAllyActive = alive(allyTeam[allyActive])
      ? allyActive
      : nextHealthyIndex(allyTeam, allyActive)
  if (nextFoeActive !== foeActive) log.push(`${foeTeam[nextFoeActive].name} rotated in!`)
  if (nextAllyActive !== allyActive) log.push(`${allyTeam[nextAllyActive].name} rotated in!`)
  const result = runDoublesRound(
    [allyTeam[nextAllyActive]].filter(alive),
    [foeTeam[nextFoeActive]].filter(alive),
    options
  )
  log.push(...result.log)
  return { events: result.events, log, allyActive: nextAllyActive, foeActive: nextFoeActive }
}

/**
 * Resolve a whole rotation battle headlessly (used by tests and quickplay-style
 * checks). Mutates the teams.
 * @param {any[]} allyTeam
 * @param {any[]} foeTeam
 * @param {{ maxRounds?: number, deterministic?: boolean }} [options]
 * @returns {{ won: boolean, rounds: number, log: string[] }}
 */
export function simulateRotation(allyTeam, foeTeam, options = {}) {
  const maxRounds = options.maxRounds ?? ROTATION_MAX_ROUNDS,
    log = /** @type {string[]} */ ([])
  let rounds = 0,
    allyActive = nextHealthyIndex(allyTeam, -1),
    foeActive = nextHealthyIndex(foeTeam, -1)
  while (rounds < maxRounds && allyTeam.some(alive) && foeTeam.some(alive)) {
    rounds++
    const result = runRotationRound(allyTeam, allyActive, foeTeam, foeActive, options)
    allyActive = result.allyActive
    foeActive = result.foeActive
    log.push(...result.log)
    if (!alive(allyTeam[allyActive])) allyActive = nextHealthyIndex(allyTeam, allyActive)
    if (!alive(foeTeam[foeActive])) foeActive = nextHealthyIndex(foeTeam, foeActive)
  }
  return { won: foeTeam.every((foe) => !alive(foe)) && allyTeam.some(alive), rounds, log }
}

/**
 * Prize for the number of rotation bouts won.
 * @param {number} wins
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function rotationPrize(wins) {
  if (wins >= 10)
    return { money: 18000, items: [{ itemId: 'abilityCapsule', quantity: 1 }, { itemId: 'bottleCap', quantity: 1 }], label: 'Rotation legend!' }
  if (wins >= 6) return { money: 9000, items: [{ itemId: 'rareCandy', quantity: 2 }], label: 'Rotation star' }
  if (wins >= 3) return { money: 4500, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Found your rhythm' }
  if (wins >= 1) return { money: 1500, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'First bout won' }
  return { money: 300, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Knocked out early' }
}
