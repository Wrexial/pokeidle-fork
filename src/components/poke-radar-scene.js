// Sinnoh's Poke Radar, played as a full-stage scene while the reducer is in the
// `pokeRadar` phase. Watch the grass light up, repeat the sequence, and bank a
// chain that boosts the shiny odds of a route's rarest species.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  POKE_RADAR_SIZE,
  POKE_RADAR_START_LENGTH,
  pickRadarTarget,
  pokeRadarPrize,
  radarChainPoints,
  radarFaces,
  radarSequence,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

const SHOW_MS = 420,
  GAP_MS = 180,
  LEAD_MS = 450,
  FLASH_MS = 160

export function PokeRadarScene() {
  const { state, dispatch } = useGame(),
    [target] = React.useState(() => pickRadarTarget(state)),
    [round, setRound] = React.useState(0),
    [sequence, setSequence] = React.useState(() => radarSequence(POKE_RADAR_START_LENGTH)),
    [phase, setPhase] = React.useState(
      /** @type {'showing' | 'input' | 'done'} */ ('showing')
    ),
    [highlight, setHighlight] = React.useState(-1),
    [flash, setFlash] = React.useState(-1),
    [inputIndex, setInputIndex] = React.useState(0),
    [message, setMessage] = React.useState('Watch closely\u2026'),
    [result, setResult] = React.useState(
      /** @type {{ label: string, chain: number, points: number } | null} */ (null)
    ),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof pokeRadarPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(!1),
    flashRef = React.useRef(/** @type {ReturnType<typeof setTimeout> | undefined} */ (undefined)),
    [faces] = React.useState(() => radarFaces(target?.routeKey ?? ''))

  // Play the sequence back, one patch at a time, after a short lead-in so the
  // first patch never flashes past before the player has looked. The player's
  // own tap feedback lives on a separate `flash` state so a lingering clear
  // timer can no longer cut the next sequence's first patch short.
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
    timers.push(setTimeout(play, LEAD_MS))
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [phase, sequence])

  React.useEffect(() => () => clearTimeout(flashRef.current), [])

  /** @param {number} index */
  function tap(index) {
    if (phase !== 'input') return
    if (sequence[inputIndex] !== index) {
      if (state.sfxEnabled) playSfx('miss')
      finish(round, 'The chain broke!')
      return
    }
    const next = inputIndex + 1
    setFlash(index)
    clearTimeout(flashRef.current)
    flashRef.current = setTimeout(() => setFlash(-1), FLASH_MS)
    if (next >= sequence.length) {
      if (state.sfxEnabled) playSfx('great')
      const nextRound = round + 1
      setRound(nextRound)
      setMessage(`Chain ${nextRound}! Get ready\u2026`)
      setInputIndex(0)
      setSequence(radarSequence(POKE_RADAR_START_LENGTH + nextRound))
      setPhase('showing')
    } else {
      if (state.sfxEnabled) playSfx('tap')
      setInputIndex(next)
    }
  }

  /** @param {number} chainRounds @param {string} [label] */
  function finish(chainRounds, label = 'You banked your chain.') {
    if (settledRef.current) return
    settledRef.current = !0
    setPrize(pokeRadarPrize(chainRounds))
    setResult({ label, chain: chainRounds, points: radarChainPoints(chainRounds) })
    setMessage(label)
    setPhase('done')
    if (target && chainRounds > 0)
      dispatch({
        type: 'UPDATE_SHINY_CHAIN',
        payload: { speciesKey: target.speciesKey, amount: radarChainPoints(chainRounds), radar: true },
      })
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { score: result?.chain ?? 0, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const species = target ? pokemonSpecies[target.speciesKey] : null,
    size = POKE_RADAR_SIZE * POKE_RADAR_SIZE,
    // Progress toward the next guaranteed shiny (5, 10, 15, ...) for the
    // currently chained species.
    chainTarget =
      state.shinyChain?.speciesKey === target?.speciesKey
        ? state.shinyChain.target ?? 5
        : 5,
    chainCount =
      state.shinyChain?.speciesKey === target?.speciesKey ? state.shinyChain.radar ?? 0 : 0

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
            children: [
              `Chain ${round}`,
              ' \u00b7 ',
              `Shiny ${Math.min(chainCount, chainTarget)}/${chainTarget}`,
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: phase === 'done'
          ? [jsx(MinigameRewardScreen, {
              prize,
              onCollect: leave,
              summary: jsx('span', {
                className: 'radar-target-chain',
                children: result
                  ? `Chain of ${result.chain} \u00b7 +${result.points} chain level${result.points === 1 ? '' : 's'}`
                  : '',
              }),
            })]
          : [
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
                  children: `+${result.points} chain level${result.points === 1 ? '' : 's'}`,
                }),
            ],
          }),
          jsx('div', {
            className: 'radar-grid',
            children: Array.from({ length: size }, (_, index) => {
              const faceKey = faces[index],
                faceSpecies = faceKey ? pokemonSpecies[faceKey] : null
              return jsx(
                'button',
                {
                  className: `radar-patch${
                    highlight === index || flash === index ? ' lit' : ''
                  }${phase === 'input' ? ' active' : ''}`,
                  disabled: phase !== 'input',
                  onClick: () => tap(index),
                  'aria-label': `Grass patch ${index + 1}`,
                  children: faceSpecies
                    ? jsx('img', {
                        className: 'radar-face',
                        src: getPokemonSpriteUrl(faceSpecies.id),
                        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                          (event.target.src = getPokemonSpriteFallbackUrl(faceSpecies.id)),
                        alt: '',
                        draggable: false,
                      })
                    : null,
                },
                index
              )
            }),
          }),
          jsx('div', {
            className: 'minigame-scene-log',
            children: message,
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          phase !== 'done' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: () => finish(round),
              children: round > 0 ? `BANK CHAIN (${round})` : 'LEAVE',
            }),
        ],
      }),
    ],
  })
}
