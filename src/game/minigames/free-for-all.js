// Battle Tower free-for-all: four trainers (the player and three rivals) each
// field a small team and everyone can hit everyone. Each round every surviving
// active Pokemon picks a target and a move, actions resolve in speed order, and
// the last trainer with a healthy Pokemon left wins the bout. The per-action
// resolve reuses the singles engine, so damage, status and abilities all behave
// normally; it just targets across more than two sides.

import { moveData, pokemonSpecies } from '../../data/gameData.js'
import { AI_SKILL, chooseMoveForBattle } from '../combat/ai.js'
import { getTypeMultiplier } from '../combat/damage.js'
import { applyEndOfTurn } from '../combat/end-of-turn.js'
import { resolveBattleTurn } from '../combat/turn.js'
import { SPREAD_MOVES } from './doubles.js'
import { createOpponent } from './gauntlet.js'

/** Money spent on a free-for-all run at the Battle Tower. */
export const FFA_COST = 1000

/** Trainers in a free-for-all (the player plus three rivals). */
export const FFA_PARTICIPANTS = 4

/** Pokemon each trainer fields. */
export const FFA_TEAM_SIZE = 3

/** Hard cap so a stall war can never hang the scene. */
export const FFA_MAX_ROUNDS = 60

/** Rival trainers are drawn from the strongest non-legendary species. */
export const FFA_POOL = Object.entries(pokemonSpecies)
  .filter(
    ([, species]) =>
      species.id > 0 &&
      species.id <= 1025 &&
      !species.legendary &&
      Object.values(species.baseStats ?? {}).reduce((sum, value) => sum + value, 0) >= 500
  )
  .map(([speciesKey]) => speciesKey)

/** A placeholder foe for the end-of-turn pass when a trainer has no one to pair. */
const EMPTY_FOE = /** @type {any} */ ({ currentHp: 0, maxHp: 1, statStages: {}, isPlayer: false })

/** The rival trainer names. */
const RIVAL_NAMES = ['Rival Rei', 'Rival Akari', 'Rival Volo']

/** @param {any} pokemon */
function monAlive(pokemon) {
  return !!pokemon && pokemon.currentHp > 0
}

/** @param {any} participant */
export function activeMon(participant) {
  return participant.team[participant.active] ?? null
}

/** @param {any} participant */
export function ownerAlive(participant) {
  return participant.team.some(monAlive)
}

/** @param {any} participant */
function activeAlive(participant) {
  return monAlive(activeMon(participant))
}

/**
 * Point a trainer at its first healthy Pokemon (a fainted active steps aside).
 * @param {any} participant
 */
export function advanceActive(participant) {
  if (activeAlive(participant)) return
  const next = participant.team.findIndex(monAlive)
  if (next >= 0) participant.active = next
}

/** The strongest non-legendary species key (falls back to Magikarp). */
function poolPick() {
  const pool = FFA_POOL.length > 0 ? FFA_POOL : ['magikarp']
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * The three rival trainers for a bout, each with a fresh team.
 * @param {number} baseLevel
 * @param {number} [wave]
 * @returns {{ id: string, name: string, isPlayer: boolean, active: number, team: any[] }[]}
 */
export function ffaRivals(baseLevel, wave = 1) {
  const level = Math.max(5, Math.min(100, Math.round(baseLevel + wave * 2)))
  return RIVAL_NAMES.map((name, rivalIndex) => ({
    id: `rival-${rivalIndex}`,
    name,
    isPlayer: false,
    active: 0,
    team: Array.from({ length: FFA_TEAM_SIZE }, () =>
      createOpponent(poolPick(), level)
    ),
  }))
}

/**
 * The action a participant takes: the opponent whose active Pokemon its best
 * move hurts most, weighted to prefer finishing a weakened target.
 * @param {any} participant
 * @param {any[]} participants
 * @returns {{ target: any, moveId: string } | null}
 */
function chooseAction(participant, participants) {
  const attacker = activeMon(participant),
    foes = participants.filter((other) => other !== participant && activeAlive(other))
  if (foes.length === 0) return null
  let best = null
  for (const foe of foes) {
    const target = activeMon(foe),
      { moveId } = chooseMoveForBattle(attacker, target, null, AI_SKILL.smart),
      move = moveData[moveId]
    if (!move) continue
    const power =
        move.category === 'status'
          ? 1
          : (move.power ?? 0) * getTypeMultiplier(move.type, target.types ?? []),
      hpRatio = target.maxHp > 0 ? target.currentHp / target.maxHp : 1,
      score = power * (1.6 - hpRatio)
    if (!best || score > best.score) best = { target: foe, moveId, score }
  }
  return best ? { target: best.target, moveId: best.moveId } : null
}

/**
 * Resolve one trainer's action against a target using the singles engine.
 * @param {any} attacker
 * @param {any} target
 * @param {string} moveId
 * @param {{ weather?: any, terrain?: any, deterministic?: boolean }} options
 * @param {any[]} events
 */
function resolveAction(attacker, target, moveId, options, events) {
  attacker.lockedMove = moveId
  const result = resolveBattleTurn(
    target,
    attacker,
    false,
    false,
    options.weather ?? null,
    null,
    options.deterministic ?? false,
    options.terrain ?? null,
    AI_SKILL.smart,
    AI_SKILL.smart,
    true,
    null,
    false,
    true
  )
  attacker.lockedMove = null
  events.push(...result)
}

/**
 * One free-for-all round: every surviving active Pokemon acts once, in priority
 * then speed order, then the residual pass runs once for everyone. Mutates the
 * participants; returns the round's events and a display log.
 * @param {any[]} participants
 * @param {{ weather?: any, terrain?: any, deterministic?: boolean }} [options]
 * @returns {{ events: any[], log: string[] }}
 */
export function runFreeForAllRound(participants, options = {}) {
  const events = /** @type {any[]} */ ([]),
    log = /** @type {string[]} */ ([])
  for (const participant of participants) advanceActive(participant)
  const actions = []
  for (const participant of participants) {
    if (!activeAlive(participant)) continue
    const choice = chooseAction(participant, participants)
    if (choice) actions.push({ participant, target: choice.target, moveId: choice.moveId })
  }
  actions.sort(
    (a, b) =>
      (moveData[b.moveId]?.priority ?? 0) - (moveData[a.moveId]?.priority ?? 0) ||
      (activeMon(b.participant).speed ?? 0) - (activeMon(a.participant).speed ?? 0)
  )
  for (const { participant, target: chosenTarget, moveId } of actions) {
    const attacker = activeMon(participant)
    if (!monAlive(attacker)) continue
    // Re-pick a target if the one chosen at the start of the round has fallen.
    const target =
      chosenTarget && activeAlive(chosenTarget)
        ? chosenTarget
        : participants.find((other) => other !== participant && activeAlive(other))
    if (!target) break
    const targetMon = activeMon(target),
      move = moveData[moveId]
    if (!move) continue
    log.push(`${attacker.name} used ${move.name}!`)
    resolveAction(attacker, targetMon, moveId, options, events)
    // Spread moves hit every other active participant, not just the target.
    if (SPREAD_MOVES.has(moveId) && move.category !== 'status')
      for (const other of participants) {
        if (other === participant || !activeAlive(other)) continue
        const otherMon = activeMon(other)
        if (otherMon === targetMon || !monAlive(otherMon)) continue
        resolveAction(attacker, otherMon, moveId, options, events)
      }
  }
  // Residual damage once for every surviving active Pokemon.
  for (const participant of participants) {
    const mon = activeMon(participant)
    if (monAlive(mon))
      applyEndOfTurn(
        mon,
        EMPTY_FOE,
        events,
        options.weather,
        options.terrain,
        options.deterministic ?? false
      )
  }
  for (const participant of participants) advanceActive(participant)
  return { events, log }
}

/**
 * How many trainers still have a healthy Pokemon.
 * @param {any[]} participants
 * @returns {number}
 */
export function survivors(participants) {
  return participants.filter(ownerAlive).length
}

/**
 * Resolve a whole free-for-all headlessly (tests / quickplay-style checks).
 * Mutates the participants.
 * @param {any[]} participants
 * @param {{ maxRounds?: number, deterministic?: boolean }} [options]
 * @returns {{ won: boolean, rounds: number, log: string[] }}
 */
export function simulateFreeForAll(participants, options = {}) {
  const maxRounds = options.maxRounds ?? FFA_MAX_ROUNDS,
    log = /** @type {string[]} */ ([])
  let rounds = 0
  while (rounds < maxRounds && survivors(participants) > 1) {
    rounds++
    log.push(...runFreeForAllRound(participants, options).log)
  }
  return { won: !!participants[0] && ownerAlive(participants[0]) && survivors(participants) === 1, rounds, log }
}

/**
 * Prize for the number of free-for-alls won.
 * @param {number} wins
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function ffaPrize(wins) {
  if (wins >= 10)
    return { money: 20000, items: [{ itemId: 'abilityPatch', quantity: 1 }, { itemId: 'goldBottleCap', quantity: 1 }], label: 'Free-for-all legend!' }
  if (wins >= 6) return { money: 10000, items: [{ itemId: 'rareCandy', quantity: 2 }], label: 'Last one standing' }
  if (wins >= 3) return { money: 5000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Held your ground' }
  if (wins >= 1) return { money: 1800, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Won a melee' }
  return { money: 400, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Pile-up victim' }
}
