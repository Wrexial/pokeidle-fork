import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  MINIGAME_LOCATIONS,
  POI_LOCATIONS,
  QUIZ_COST,
  QUIZ_LIVES,
  QUIZ_OPTIONS,
  QUIZ_QUESTIONS,
  generateQuizQuestion,
  quizPrize,
} = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { typechart } = await import('../src/data/moves.js')

test('the Academy Quiz is a registered POI minigame', () => {
  assert.equal(MINIGAME_LOCATIONS['paldea-mesagoza'], 'academyQuiz')
  assert.ok(POI_LOCATIONS.has('paldea-mesagoza'))
})

test('quiz questions are valid type matchups with unique options', () => {
  for (let roll = 0; roll < 200; roll++) {
    const question = generateQuizQuestion(),
      multiplier = (attacker) => typechart[attacker]?.[question.defender] ?? 1,
      expected = question.kind === 'immune' ? 0 : 2
    assert.equal(question.options.length, QUIZ_OPTIONS)
    assert.equal(new Set(question.options).size, QUIZ_OPTIONS, 'options are unique')
    assert.ok(question.options.includes(question.correct), 'the answer is offered')
    assert.equal(multiplier(question.correct), expected, 'the answer is correct')
    for (const option of question.options)
      if (option !== question.correct)
        assert.notEqual(multiplier(option), expected, 'distractors are not also correct')
  }
})

test('quiz prizes scale with the score', () => {
  const perfect = quizPrize(QUIZ_QUESTIONS),
    good = quizPrize(8),
    pass = quizPrize(5),
    fail = quizPrize(1)
  assert.ok(perfect.money > good.money && good.money > pass.money && pass.money > fail.money)
  assert.ok(perfect.items.length > 0 && fail.items.length > 0)
  assert.equal(perfect.label, 'Perfect score!')
})

test('START_ACADEMY_QUIZ charges entry and enters the scene', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: QUIZ_COST + 50 },
      { type: 'START_ACADEMY_QUIZ' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: QUIZ_COST - 1 },
      { type: 'START_ACADEMY_QUIZ' }
    )
  assert.equal(started.phase, 'academyQuiz')
  assert.equal(started.money, 50)
  assert.equal(broke.phase, 'idle')
  assert.equal(broke.money, QUIZ_COST - 1)
})

test('END_MINIGAME closes the Academy Quiz', () => {
  assert.equal(
    gameReducer({ ...initialGameState, phase: 'academyQuiz' }, { type: 'END_MINIGAME' }).phase,
    'idle'
  )
  assert.equal(QUIZ_LIVES, 3)
})
