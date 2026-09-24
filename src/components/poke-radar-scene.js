// Sinnoh's Poke Radar, played as a full-stage scene while the reducer is in the
// `pokeRadar` phase. Watch the grass light up, repeat the sequence, and bank a
// chain that boosts the shiny odds of a route's rarest species.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import {
  POKE_RADAR_SIZE,
  POKE_RADAR_START_LENGTH,
  pickRadarTarget,
  pokeRadarPrize,
  radarChainPoints,
  radarSequence,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

const SHOW_MS = 420,
  GAP_MS = 180

export function PokeRadarScene() {
  const { state, dispatch } = useGame(),
    [target] = React.useState(() => pickRadarTarget(state)),
    [round, setRound] = React.useState(0),
    [sequence, setSequence] = React.useState(() => radarSequence(POKE_RADAR_START_LENGTH)),
    [phase, setPhase] = React.useState(
      /** @type {'showing' | 'input' | 'done'} */ ('showing')
    ),
    [highlight, setHighlight] = React.useState(-1),
    [inputIndex, setInputIndex] = React.useState(0),
    [message, setMessage] = React.useState('Watch closely\u2026'),
    [result, setResult] = React.useState(
      /** @type {{ label: string, chain: number, points: number } | null} */ (null)
    ),
    settledRef = React.useRef(!1)

  // Play the sequence back, one patch at a time.
  React.useEffect(() => {
    if (phase !== 'showing') return
    const timers = /** @type {ReturnType<typeof setTimeout>[]} */ ([])
    let step = 0
    const play = () => {
      if (step >= sequence.length) {
        timers.push(
          setTimeout(() => {
            setHighlight(-1)
            setInputIndex(0)
            setMessage('Repeat the sequence!')
            setPhase('input')
          }, GAP_MS)
        )
        return
      }
      setHighlight(sequence[step])
      timers.push(
        setTimeout(() => {
          setHighlight(-1)
          timers.push(
            setTimeout(() => {
              step++
              play()
            }, GAP_MS)
          )
        }, SHOW_MS)
      )
    }
    play()
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [phase, sequence])

  /** @param {number} index */
  function tap(index) {
    if (phase !== 'input') return
    if (sequence[inputIndex] !== index) {
      finish(round, 'The chain broke!')
      return
    }
    const next = inputIndex + 1
    setHighlight(index)
    setTimeout(() => setHighlight(-1), 140)
    if (next >= sequence.length) {
      const nextRound = round + 1
      setRound(nextRound)
      setMessage(`Chain ${nextRound}! Get ready\u2026`)
      setInputIndex(0)
      setSequence(radarSequence(POKE_RADAR_START_LENGTH + nextRound))
      setPhase('showing')
    } else setInputIndex(next)
  }

  /** @param {number} chainRounds @param {string} [label] */
  function finish(chainRounds, label = 'You banked your chain.') {
    if (settledRef.current) return
    settledRef.current = !0
    const prize = pokeRadarPrize(chainRounds)
    setResult({ label, chain: chainRounds, points: radarChainPoints(chainRounds) })
    setMessage(label)
    setPhase('done')
    dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: prize })
    if (target && chainRounds > 0)
      dispatch({
        type: 'UPDATE_SHINY_CHAIN',
        payload: { speciesKey: target.speciesKey, amount: radarChainPoints(chainRounds) },
      })
  }

  function leave() {
    dispatch({ type: 'END_MINIGAME' })
  }

  const species = target ? pokemonSpecies[target.speciesKey] : null,
    size = POKE_RADAR_SIZE * POKE_RADAR_SIZE

  return jsxs('div', {
    className: 'minigame-scene radar-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Pok\u00e9 Radar' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [`Chain ${round}`, ' \u00b7 ', `Sequence ${sequence.length}`],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsxs('div', {
            className: 'radar-target',
            children: [
              species &&
                jsx('img', {
                  className: 'radar-target-sprite',
                  src: getPokemonSpriteUrl(species.id),
                  onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                    (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                  alt: species.name,
                }),
              jsx('span', {
                className: 'radar-target-label',
                children: target
                  ? `Chaining ${species?.name ?? target.speciesKey}`
                  : 'No route to chain',
              }),
              result &&
                jsx('span', {
                  className: 'radar-target-chain',
                  children: `+${result.points} chain points`,
                }),
            ],
          }),
          jsx('div', {
            className: 'radar-grid',
            children: Array.from({ length: size }, (_, index) =>
              jsx(
                'button',
                {
                  className: `radar-patch${highlight === index ? ' lit' : ''}${
                    phase === 'input' ? ' active' : ''
                  }`,
                  disabled: phase !== 'input',
                  onClick: () => tap(index),
                  'aria-label': `Grass patch ${index + 1}`,
                },
                index
              )
            ),
          }),
          jsx('div', {
            className: 'minigame-scene-log',
            children:
              phase === 'done' && result
                ? `${result.label} Banked a chain of ${result.chain}.`
                : message,
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          phase === 'done'
            ? jsx('button', {
                className: 'move-panel-btn confirm',
                onClick: leave,
                children: 'COLLECT & LEAVE',
              })
            : jsx('button', {
                className: 'move-panel-btn cancel',
                onClick: () => finish(round),
                children: round > 0 ? `BANK CHAIN (${round})` : 'LEAVE',
              }),
        ],
      }),
    ],
  })
}
