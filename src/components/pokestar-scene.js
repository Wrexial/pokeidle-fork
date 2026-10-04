// Unova's Pokestar Studios, played as a full-stage scene while the reducer is in
// the `pokestar` phase. The director gives a brief for each shot; pick the take
// that matches it. Three shots, scored out of three each.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { pickPokestarShots, pokestarPrize } from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function PokestarScene() {
  const { state, dispatch } = useGame(),
    [shots] = React.useState(() => pickPokestarShots()),
    [index, setIndex] = React.useState(0),
    [score, setScore] = React.useState(0),
    [chosen, setChosen] = React.useState(/** @type {any} */ (null)),
    [phase, setPhase] = React.useState(
      /** @type {'choose' | 'reveal' | 'done'} */ ('choose')
    ),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof pokestarPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch)

  const shot = shots[index],
    isLast = index + 1 >= shots.length

  /** @param {any} take */
  function choose(take) {
    if (phase !== 'choose') return
    if (state.sfxEnabled) playSfx(take.score >= 3 ? 'great' : take.score >= 2 ? 'good' : 'miss')
    setChosen(take)
    setScore((value) => value + take.score)
    setPhase('reveal')
  }

  function next() {
    if (isLast) {
      setPrize(pokestarPrize(score))
      setPhase('done')
      return
    }
    setIndex((value) => value + 1)
    setChosen(null)
    setPhase('choose')
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { score, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene pokestar-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Pok\u00e9star Studios' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children:
              phase === 'done'
                ? (prize?.label ?? '')
                : `Shot ${Math.min(index + 1, shots.length)}/${shots.length} \u00b7 ${score} pts`,
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          phase !== 'done' &&
            jsx('div', {
              className: 'pokestar-brief',
              children: shot ? shot.brief : '',
            }),
          phase === 'done'
            ? jsx(MinigameRewardScreen, {
                prize,
                onCollect: leave,
                summary: jsx('span', {
                  className: 'pokestar-summary-score',
                  children: `${score} / ${shots.length * 3} points`,
                }),
              })
            : jsx('div', {
                className: 'pokestar-takes',
                children: shot.takes.map((take) =>
                  jsx(
                    'button',
                    {
                      className: `pokestar-take${
                        phase === 'reveal'
                          ? take.score >= 3
                            ? ' best'
                            : take === chosen
                              ? ' chosen'
                              : ''
                          : ''
                      }`,
                      disabled: phase !== 'choose',
                      onClick: () => choose(take),
                      children: [
                        jsx('span', {
                          className: 'pokestar-take-label',
                          children: take.label,
                        }),
                        phase === 'reveal' &&
                          jsx('span', {
                            className: 'pokestar-take-score',
                            children: `${take.score}/3`,
                          }),
                      ],
                    },
                    take.label
                  )
                ),
              }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          phase !== 'done' &&
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: leave,
              children: 'LEAVE',
            }),
          phase === 'reveal' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: next,
              children: isLast ? 'WRAP' : 'NEXT SHOT',
            }),
        ],
      }),
    ],
  })
}
