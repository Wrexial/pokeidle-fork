// Paldea's Academy Quiz. Split from game/minigames.js. A timed type-matchup
// quiz: answer before the clock runs out, and a wrong answer (or a timeout)
// costs a life. Mostly about super-effective coverage, with the odd immunity.

import { POKEMON_TYPES, typechart } from '../../data/moves.js'

/** Money spent to sit the quiz. */
export const QUIZ_COST = 500

/** How many questions a full quiz asks. */
export const QUIZ_QUESTIONS = 10

/** Seconds allowed per question. */
export const QUIZ_SECONDS = 10

/** Wrong answers (or timeouts) allowed before the quiz ends. */
export const QUIZ_LIVES = 3

/** Choices offered per question. */
export const QUIZ_OPTIONS = 4

/** @param {string[]} list @returns {string[]} */
function shuffled(list) {
  const copy = [...list]
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

/**
 * @typedef {{
 *   kind: 'super' | 'immune', defender: string, correct: string,
 *   options: string[], prompt: string,
 * }} QuizQuestion
 */

/**
 * Build a type-matchup question. Most ask for a super-effective type; some ask
 * for an immunity. Distractors are types that are *not* a valid answer.
 * @returns {QuizQuestion}
 */
export function generateQuizQuestion() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const defender = POKEMON_TYPES[Math.floor(Math.random() * POKEMON_TYPES.length)],
      superEffective = POKEMON_TYPES.filter(
        (attacker) => (typechart[attacker]?.[defender] ?? 1) === 2
      ),
      immune = POKEMON_TYPES.filter((attacker) => (typechart[attacker]?.[defender] ?? 1) === 0),
      useImmune = immune.length > 0 && Math.random() < 0.25,
      answers = useImmune ? immune : superEffective
    if (answers.length === 0) continue
    const correct = answers[Math.floor(Math.random() * answers.length)],
      distractors = shuffled(POKEMON_TYPES.filter((type) => !answers.includes(type))).slice(
        0,
        QUIZ_OPTIONS - 1
      )
    return {
      kind: useImmune ? 'immune' : 'super',
      defender,
      correct,
      options: shuffled([correct, ...distractors]),
      prompt: useImmune
        ? `Which type has no effect on ${defender}-types?`
        : `Which type is super-effective against ${defender}-types?`,
    }
  }
  // Fallback in the unlikely event every random pick had no answer.
  return {
    kind: 'immune',
    defender: 'Ghost',
    correct: 'Normal',
    options: shuffled(['Normal', 'Fighting', 'Psychic', 'Dark']),
    prompt: 'Which type has no effect on Ghost-types?',
  }
}

/**
 * Prize for a finished quiz.
 * @param {number} score
 * @param {number} [total]
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function quizPrize(score, total = QUIZ_QUESTIONS) {
  const ratio = total > 0 ? score / total : 0
  if (score >= total)
    return { money: 4000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Perfect score!' }
  if (ratio >= 0.8)
    return { money: 2500, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Top of the class' }
  if (ratio >= 0.5)
    return { money: 1200, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Passed the exam' }
  return { money: 400, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'See me after class' }
}
