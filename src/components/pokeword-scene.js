// Unova's Trainer School, played as a full-stage scene while the reducer is in
// the `pokeword` phase. A silhouette appears with its name's letters jumbled;
// tap or type them back into order before each word's clock runs out.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  POKEWORD_ROUNDS,
  POKEWORD_TIME_MS,
  pokewordMatches,
  pokewordPrize,
  rollPokewordChallenge,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function PokewordScene() {
  const { state, dispatch } = useGame(),
    [challenge, setChallenge] = React.useState(rollPokewordChallenge),
    [selected, setSelected] = React.useState(/** @type {number[]} */ ([])),
    [round, setRound] = React.useState(1),
    [cleared, setCleared] = React.useState(0),
    [flash, setFlash] = React.useState(''),
    [timeLeft, setTimeLeft] = React.useState(POKEWORD_TIME_MS),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof pokewordPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    lockRef = React.useRef(false),
    roundStartRef = React.useRef(Date.now())

  /** Finish the current word and move on (success) or time out. @param {boolean} success */
  function advance(success) {
    if (lockRef.current || prize) return
    lockRef.current = true
    if (state.sfxEnabled) playSfx(success ? 'good' : 'miss')
    const nextCleared = cleared + (success ? 1 : 0)
    setCleared(nextCleared)
    setFlash(success ? 'NICE!' : 'TIME!')
    if (round >= POKEWORD_ROUNDS) setPrize(pokewordPrize(nextCleared))
    else {
      setRound(round + 1)
      setChallenge(rollPokewordChallenge())
      setSelected([])
    }
  }

  React.useEffect(() => {
    if (prize) return
    lockRef.current = false
    roundStartRef.current = Date.now()
    setTimeLeft(POKEWORD_TIME_MS)
    const id = setInterval(() => {
      const remaining = Math.max(0, POKEWORD_TIME_MS - (Date.now() - roundStartRef.current))
      setTimeLeft(remaining)
      if (remaining <= 0) advance(false)
    }, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, prize])

  /** @param {number} index */
  function pick(index) {
    if (prize || lockRef.current || selected.includes(index)) return
    const next = [...selected, index]
    setSelected(next)
    if (state.sfxEnabled) playSfx('tap')
    const guess = next.map((position) => challenge.letters[position]).join('')
    if (guess.length === challenge.letters.length) {
      if (pokewordMatches(guess, challenge.name)) advance(true)
      else {
        if (state.sfxEnabled) playSfx('miss')
        setFlash('MISS')
        setSelected([])
      }
    }
  }

  function undo() {
    if (prize || lockRef.current || selected.length === 0) return
    if (state.sfxEnabled) playSfx('tap')
    setSelected(selected.slice(0, -1))
  }

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      if (prize) return
      if (event.code === 'Backspace') {
        event.preventDefault()
        undo()
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        return
      }
      const key = event.key?.toUpperCase()
      if (!key || key.length !== 1 || key < 'A' || key > 'Z') return
      const index = challenge.letters.findIndex(
        (letter, position) => letter === key && !selected.includes(position)
      )
      if (index >= 0) pick(index)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, selected, prize])

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'pokeword', score: cleared, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const species = pokemonSpecies[challenge.speciesKey],
    slots = Array.from({ length: challenge.letters.length }, (_, index) => selected[index])

  return jsxs('div', {
    className: 'minigame-scene pokeword-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Trainer School' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: prize
              ? (prize.label ?? '')
              : `Word ${round}/${POKEWORD_ROUNDS} \u00b7 ${cleared} right \u00b7 ${(timeLeft / 1000).toFixed(1)}s${
                  flash ? ` \u00b7 ${flash}` : ''
                }`,
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children: prize
          ? jsx(MinigameRewardScreen, {
              prize,
              onCollect: leave,
              summary: jsx('span', {
                className: 'pokeword-score-line',
                children: `${cleared}/${POKEWORD_ROUNDS} spelled`,
              }),
            })
          : jsxs('div', {
              className: 'pokeword-play',
              children: [
                species &&
                  jsx('img', {
                    className: 'pokeword-silhouette',
                    src: getPokemonSpriteUrl(species.id),
                    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                      (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                    alt: 'Who is it?',
                  }),
                jsx('div', {
                  className: 'pokeword-slots',
                  children: slots.map((position, index) =>
                    jsx(
                      'span',
                      {
                        className: `pokeword-slot${position != null ? ' filled' : ''}`,
                        children: position != null ? challenge.letters[position] : '',
                      },
                      index
                    )
                  ),
                }),
                jsx('div', {
                  className: 'pokeword-letters',
                  children: challenge.letters.map((letter, index) =>
                    jsx(
                      'button',
                      {
                        className: `pokeword-letter${selected.includes(index) ? ' used' : ''}`,
                        disabled: selected.includes(index),
                        onClick: () => pick(index),
                        children: letter,
                      },
                      `${letter}-${index}`
                    )
                  ),
                }),
                jsxs('div', {
                  className: 'pokeword-controls',
                  children: [
                    jsx('button', {
                      className: 'move-panel-btn',
                      onClick: undo,
                      children: 'UNDO',
                    }),
                    jsx('button', {
                      className: 'move-panel-btn',
                      onClick: () => setSelected([]),
                      children: 'CLEAR',
                    }),
                  ],
                }),
                jsx('div', {
                  className: 'pokeword-hint',
                  children: 'Spell the silhouette \u2014 tap the letters, or just type the name.',
                }),
              ],
            }),
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          !prize &&
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: leave,
              children: 'LEAVE',
            }),
        ],
      }),
    ],
  })
}
