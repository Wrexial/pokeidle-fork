// Johto Bug Catching Contest minigame. Push-your-luck: each search shows a bug
// (rarer = higher score); keep the one you like, or search again. The prize is
// claimed with CLAIM_MINIGAME_REWARD.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import {
  BUG_CONTEST_SEARCHES,
  bugContestPrize,
  rewardItemName,
  rollContestBug,
} from '../game/minigames.js'
import { getPokemonSpriteUrl } from '../game/pokemon.js'

/** @param {number} score */
function rarityLabel(score) {
  if (score >= 480) return 'A once-in-a-lifetime catch!'
  if (score >= 400) return 'What a specimen!'
  if (score >= 300) return 'A solid catch.'
  return 'It is a small one.'
}

/** @param {{ onClose: () => void }} props */
export function BugContestModal({ onClose }) {
  const { dispatch } = useGame(),
    [bug, setBug] = React.useState(rollContestBug),
    [searchesLeft, setSearchesLeft] = React.useState(BUG_CONTEST_SEARCHES),
    [result, setResult] = React.useState(
      () => /** @type {{ money: number, items: { itemId: string, quantity: number }[], label: string } | null} */ (null)
    ),
    species = pokemonSpecies[bug.speciesKey]
  function searchAgain() {
    if (searchesLeft <= 0 || result) return
    setBug(rollContestBug())
    setSearchesLeft(searchesLeft - 1)
  }
  function catchIt() {
    if (result) return
    setResult(bugContestPrize(bug.score))
  }
  function collect() {
    if (!result) return
    dispatch({
      type: 'CLAIM_MINIGAME_REWARD',
      payload: {
        money: result.money,
        items: result.items,
      },
    })
    onClose()
  }
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal mining-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Bug Catching Contest',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content',
          children: result
            ? [
                jsx('div', {
                  className: 'bug-contest-result',
                  children: [
                    jsx('span', {
                      className: 'bug-contest-place',
                      children: result.label,
                    }),
                    jsxs('span', {
                      className: 'bug-contest-outcome',
                      children: [
                        `${species.name} scored ${bug.score}. Prize: $${result.money.toLocaleString()}`,
                        ...result.items.map(
                          (item) => ` + ${rewardItemName(item.itemId)} x${item.quantity}`
                        ),
                      ],
                    }),
                  ],
                }),
                jsx('button', {
                  className: 'stats-panel-trade-btn',
                  onClick: collect,
                  children: 'COLLECT PRIZE',
                }),
              ]
            : [
                jsxs('div', {
                  className: 'bug-contest-bug',
                  children: [
                    jsx('img', {
                      className: 'bug-contest-sprite',
                      src: getPokemonSpriteUrl(species.id),
                      alt: species.name,
                    }),
                    jsxs('div', {
                      className: 'bug-contest-info',
                      children: [
                        jsx('span', {
                          className: 'bug-contest-name',
                          children: species.name,
                        }),
                        jsx('span', {
                          className: 'bug-contest-score',
                          children: `Score ${bug.score} \\u00b7 ${rarityLabel(bug.score)}`,
                        }),
                      ],
                    }),
                  ],
                }),
                jsxs('div', {
                  className: 'mining-hint',
                  children: [
                    searchesLeft,
                    ' search',
                    searchesLeft === 1 ? '' : 'es',
                    ' left. Keep this one, or look for something better?',
                  ],
                }),
                jsxs('div', {
                  className: 'bug-contest-buttons',
                  children: [
                    jsx('button', {
                      className: `move-panel-btn cancel${searchesLeft <= 0 ? ' disabled' : ''}`,
                      disabled: searchesLeft <= 0,
                      onClick: searchAgain,
                      children: 'SEARCH AGAIN',
                    }),
                    jsx('button', {
                      className: 'move-panel-btn confirm',
                      onClick: catchIt,
                      children: 'KEEP IT',
                    }),
                  ],
                }),
              ],
        }),
      ],
    }),
  })
}
