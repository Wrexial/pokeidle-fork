// Hoenn's Pokemon Contest. Split out of game/minigames.js. A move-appeal game:
// each contest has a theme and you pick a move per round. On-theme moves score
// more, chaining two different moves of the same type adds a combo bonus, and
// repeating a move is penalised. Rivals score in the background and the board
// is ranked at the end.

import { moveData } from '../../data/gameData.js'

/** Money spent to enter a contest. */
export const CONTEST_COST = 600

/** Rounds (moves) per contest. */
export const CONTEST_ROUNDS = 4

/** The contest categories and the move types that appeal in each. */
export const CONTEST_THEMES = [
  { id: 'cool', label: 'Cool', types: ['Fire', 'Dragon', 'Fighting', 'Flying'] },
  { id: 'beauty', label: 'Beauty', types: ['Water', 'Ice', 'Fairy', 'Grass'] },
  { id: 'cute', label: 'Cute', types: ['Normal', 'Fairy', 'Electric', 'Grass'] },
  { id: 'clever', label: 'Clever', types: ['Psychic', 'Poison', 'Ghost', 'Dark'] },
  { id: 'tough', label: 'Tough', types: ['Rock', 'Ground', 'Steel', 'Fighting'] },
]

/** Fake rivals for the results board. */
export const CONTEST_RIVALS = ['Lass Annika', 'Beauty Chaz', 'Ace Trainer Milo', 'Baker Rina']

/** Pick a theme for the next contest. */
export function rollContestTheme() {
  return CONTEST_THEMES[Math.floor(Math.random() * CONTEST_THEMES.length)]
}

/** @param {string} themeId */
export function contestTheme(themeId) {
  return CONTEST_THEMES.find((theme) => theme.id === themeId) ?? CONTEST_THEMES[0]
}

/** A move's base appeal from its power (status moves get the minimum).
 * @param {string} moveId
 */
export function moveBaseAppeal(moveId) {
  const move = moveData[moveId]
  if (!move || move.category === 'status') return 1
  if (move.power >= 100) return 4
  if (move.power >= 70) return 3
  if (move.power >= 40) return 2
  return 1
}

/**
 * The appeal a move earns this round.
 * @param {string} moveId
 * @param {string} themeId
 * @param {{ moveId: string, type: string | null } | null} [lastMove]
 * @returns {{ appeal: number, type: string | null, onTheme: boolean, combo: boolean, repeated: boolean }}
 */
export function contestAppeal(moveId, themeId, lastMove = null) {
  const move = moveData[moveId],
    theme = contestTheme(themeId),
    type = move?.type ?? null,
    onTheme = type !== null && theme.types.includes(type),
    repeated = lastMove?.moveId === moveId,
    combo =
      !repeated &&
      lastMove !== null &&
      lastMove.type !== null &&
      lastMove.type === type &&
      lastMove.moveId !== moveId,
    appeal = repeated ? 1 : moveBaseAppeal(moveId) + (onTheme ? 2 : 0) + (combo ? 2 : 0)
  return { appeal, type, onTheme, combo, repeated }
}

/**
 * One rival's score for a round. Better-titled rivals score a little higher.
 * @param {number} [skill] 0-2 difficulty tier.
 * @returns {number}
 */
export function rollContestRivalRound(skill = 1) {
  return 2 + Math.round(Math.random() * 3) + skill
}

/**
 * Rank the player against the rivals' final scores.
 * @param {number} playerScore
 * @param {{ name: string, score: number }[]} rivals
 * @returns {{ owner: string, isPlayer: boolean, score: number }[]}
 */
export function contestPlacement(playerScore, rivals) {
  return [
    { owner: 'You', isPlayer: true, score: playerScore },
    ...rivals.map((rival) => ({ owner: rival.name, isPlayer: false, score: rival.score })),
  ].sort((left, right) => right.score - left.score || Number(right.isPlayer) - Number(left.isPlayer))
}

/**
 * The player's finishing rank (1-based), or null if they did not place.
 * @param {{ isPlayer: boolean }[]} results
 * @returns {number | null}
 */
export function contestRank(results) {
  const index = results.findIndex((entry) => entry.isPlayer)
  return index >= 0 ? index + 1 : null
}

/**
 * Prize for the player's finishing rank.
 * @param {number | null} rank
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function contestPrize(rank) {
  if (rank === 1)
    return { money: 5000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Contest winner!' }
  if (rank === 2)
    return { money: 2500, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Runner-up' }
  if (rank === 3)
    return { money: 1200, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Third place' }
  return { money: 400, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Nice try' }
}
