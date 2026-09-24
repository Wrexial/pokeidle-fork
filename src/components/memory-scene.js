// Hoenn's Pokemon Memory, played as a full-stage scene while the reducer is in
// the `memory` phase. Flip two cards at a time to find matching pairs.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { createMemoryDeck, memoryPrize } from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function MemoryScene() {
  const { state, dispatch } = useGame(),
    [cards, setCards] = React.useState(() =>
      createMemoryDeck().map((speciesKey, id) => ({ id, speciesKey, flipped: false, matched: false }))
    ),
    [first, setFirst] = React.useState(-1),
    [moves, setMoves] = React.useState(0),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof memoryPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    lockRef = React.useRef(false)

  /** @param {number} index */
  function flip(index) {
    if (lockRef.current || prize || index < 0) return
    const card = cards[index]
    if (!card || card.flipped || card.matched) return
    if (first === -1) {
      setCards((current) =>
        current.map((entry, i) => (i === index ? { ...entry, flipped: true } : entry))
      )
      setFirst(index)
      return
    }
    const firstIndex = first,
      firstCard = cards[firstIndex]
    setCards((current) =>
      current.map((entry, i) => (i === index ? { ...entry, flipped: true } : entry))
    )
    const attempts = moves + 1
    setMoves(attempts)
    if (firstCard.speciesKey === card.speciesKey) {
      setCards((current) =>
        current.map((entry, i) =>
          i === firstIndex || i === index
            ? { ...entry, matched: true, flipped: true }
            : entry
        )
      )
      setFirst(-1)
      const matchedCount = cards.filter((entry) => entry.matched).length + 2
      if (matchedCount >= cards.length) setPrize(memoryPrize(attempts))
      return
    }
    lockRef.current = true
    setTimeout(() => {
      setCards((current) =>
        current.map((entry, i) =>
          i === firstIndex || i === index ? { ...entry, flipped: false } : entry
        )
      )
      setFirst(-1)
      lockRef.current = false
    }, 700)
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME' },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene memory-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Pok\u00e9mon Memory' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Pairs ${cards.filter((entry) => entry.matched).length / 2}/${cards.length / 2}`,
              ' \u00b7 ',
              `Flips ${moves}`,
            ],
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
                className: 'memory-solved',
                children: `All pairs cleared in ${moves} flips`,
              }),
            })
          : jsx('div', {
          className: 'memory-grid',
          children: cards.map((card, index) => {
            const species = pokemonSpecies[card.speciesKey],
              faceUp = card.flipped || card.matched
            return jsx(
              'button',
              {
                className: `memory-card${faceUp ? ' up' : ''}${card.matched ? ' matched' : ''}`,
                onClick: () => flip(index),
                'aria-label': faceUp ? (species?.name ?? card.speciesKey) : 'Face-down card',
                children: faceUp
                  ? jsx('img', {
                      className: 'memory-sprite',
                      src: getPokemonSpriteUrl(species?.id ?? 0),
                      onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                        (event.target.src = getPokemonSpriteFallbackUrl(species?.id ?? 0)),
                      alt: species?.name ?? card.speciesKey,
                    })
                  : jsx('span', { className: 'memory-back', children: '?' }),
              },
              card.id
            )
          }),
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
