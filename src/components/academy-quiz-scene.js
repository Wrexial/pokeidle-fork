// Paldea's Academy Quiz, played as a full-stage scene while the reducer is in
// the `academyQuiz` phase. Answer type-matchup questions against the clock; a
// wrong answer or a timeout costs a life.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import {
  QUIZ_LIVES,
  QUIZ_QUESTIONS,
  QUIZ_SECONDS,
  generateQuizQuestion,
  quizPrize,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function AcademyQuizScene() {
  const { state, dispatch } = useGame(),
    [question, setQuestion] = React.useState(() => generateQuizQuestion()),
    [index, setIndex] = React.useState(0),
    [score, setScore] = React.useState(0),
    [lives, setLives] = React.useState(QUIZ_LIVES),
    [selected, setSelected] = React.useState(/** @type {string | null} */ (null)),
    [phase, setPhase] = React.useState(
      /** @type {'question' | 'reveal' | 'done'} */ ('question')
    ),
    [timeLeft, setTimeLeft] = React.useState(QUIZ_SECONDS),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof quizPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch)

  // Count down the current question; a timeout is treated as a wrong answer.
  React.useEffect(() => {
    if (phase !== 'question') return
    setTimeLeft(QUIZ_SECONDS)
    const deadline = Date.now() + QUIZ_SECONDS * 1000,
      tick = setInterval(
        () => setTimeLeft(Math.max(0, (deadline - Date.now()) / 1000)),
        100
      ),
      timeout = setTimeout(() => answer(null), QUIZ_SECONDS * 1000)
    return () => {
      clearInterval(tick)
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question])

  /** @param {string | null} choice */
  function answer(choice) {
    if (phase !== 'question') return
    const correct = choice === question.correct
    setSelected(choice)
    setPhase('reveal')
    if (correct) setScore((value) => value + 1)
    else setLives((value) => value - 1)
  }

  function advance() {
    if (lives <= 0 || index + 1 >= QUIZ_QUESTIONS) {
      setPrize(quizPrize(score, QUIZ_QUESTIONS))
      setPhase('done')
      return
    }
    setIndex((value) => value + 1)
    setQuestion(generateQuizQuestion())
    setSelected(null)
    setPhase('question')
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME' },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const correct = selected === question.correct,
    timedOut = selected === null && phase !== 'question'

  return jsxs('div', {
    className: 'academy-scene',
    children: [
      jsx('div', { className: 'academy-bg' }),
      jsxs('div', {
        className: 'academy-topbar',
        children: [
          jsx('span', { className: 'academy-heading', children: 'Academy Quiz' }),
          jsxs('span', {
            className: 'academy-tally',
            children: [
              `Question ${Math.min(index + 1, QUIZ_QUESTIONS)}/${QUIZ_QUESTIONS}`,
              ' \u00b7 ',
              `Score ${score}`,
              ' \u00b7 ',
              `Lives ${'\u2665'.repeat(Math.max(0, lives))}${'\u2661'.repeat(Math.max(0, QUIZ_LIVES - lives))}`,
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'academy-field',
        children:
          phase === 'done'
            ? jsx(MinigameRewardScreen, {
                prize,
                onCollect: leave,
                summary: jsx('span', {
                  className: 'academy-summary-score',
                  children: `${score} / ${QUIZ_QUESTIONS} correct`,
                }),
              })
            : jsxs('div', {
                className: 'academy-question',
                children: [
                  jsx('div', {
                    className: 'academy-timer',
                    children: jsx('div', {
                      className: 'academy-timer-fill',
                      style: { width: `${(timeLeft / QUIZ_SECONDS) * 100}%` },
                    }),
                  }),
                  jsx('span', { className: 'academy-prompt', children: question.prompt }),
                  jsx('div', {
                    className: 'academy-options',
                    children: question.options.map((option) =>
                      jsx(
                        'button',
                        {
                          className: `academy-option${
                            phase === 'reveal' && option === question.correct ? ' correct' : ''
                          }${
                            phase === 'reveal' && option === selected && !correct ? ' wrong' : ''
                          }`,
                          disabled: phase !== 'question',
                          onClick: () => answer(option),
                          children: jsx('span', {
                            className: `type-badge type-${option.toLowerCase()}`,
                            children: option,
                          }),
                        },
                        option
                      )
                    ),
                  }),
                ],
              }),
      }),
      jsxs('div', {
        className: 'academy-lower',
        children: [
          jsx('div', {
            className: 'academy-text',
            children:
              phase === 'done'
                ? 'The bell rings for the end of class.'
                : phase === 'reveal'
                  ? timedOut
                    ? `Time\u2019s up! The answer was ${question.correct}.`
                    : correct
                      ? 'Correct!'
                      : `Not quite \u2014 the answer was ${question.correct}.`
                  : 'Select your answer before the clock runs out.',
          }),
          jsx('div', {
            className: 'academy-actions',
            children:
              phase === 'reveal'
                ? jsx('button', {
                    className: 'move-panel-btn confirm',
                    onClick: advance,
                    children:
                      lives <= 0 || index + 1 >= QUIZ_QUESTIONS ? 'FINISH' : 'NEXT QUESTION',
                  })
                : null,
          }),
        ],
      }),
    ],
  })
}
