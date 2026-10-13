// Pokemon Bank: move individuals between save slots through a shared,
// slot-independent storage blob. Opened from the Box header and Settings.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { BANK_CAPACITY } from '../data/config.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { depositToBank, readBank, withdrawFromBank } from '../game/bank.js'
import { getEggSpriteUrl, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, pokemonDisplayName } from '../game/pokemon.js'
import { isFemalePokemon } from '../game/breeding.js'

/**
 * The front sprite for a depositable / banked Pokemon (eggs use the egg art).
 * @param {any} pokemon
 * @returns {string}
 */
function spriteFor(pokemon) {
  if (pokemon.isEgg) return getEggSpriteUrl()
  const species = pokemonSpecies[pokemon.speciesKey]
  return getPokemonSpriteUrl(species?.id, false, pokemon.isShiny, isFemalePokemon(pokemon))
}

/**
 * @param {any} pokemon
 * @returns {string}
 */
function fallbackSpriteFor(pokemon) {
  if (pokemon.isEgg) return getEggSpriteUrl()
  const species = pokemonSpecies[pokemon.speciesKey]
  return getPokemonSpriteFallbackUrl(species?.id, false, pokemon.isShiny, isFemalePokemon(pokemon))
}

/** @param {{ onClose: () => void }} props */
export function BankModal({ onClose }) {
  const { state, dispatch } = useGame()
  const [bank, setBank] = React.useState(() => readBank())
  const [mode, setMode] = React.useState('deposit')
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')

  const depositable = React.useMemo(
    () =>
      /** @type {{ pokemon: Pokemon, source: 'party' | 'box' }[]} */ ([
        ...state.party.map((pokemon) => ({ pokemon, source: 'party' })),
        ...state.box.map((pokemon) => ({ pokemon, source: 'box' })),
      ]),
    [state.party, state.box]
  )

  /**
   * Whether a Pokemon can leave the save: the party must keep at least one
   * non-egg member behind so the run can always continue.
   * @param {Pokemon} pokemon
   * @param {'party' | 'box'} source
   * @returns {boolean}
   */
  function canDeposit(pokemon, source) {
    if (source !== 'party') return true
    if (state.party.length <= 1) return false
    return state.party.some((member) => member !== pokemon && !member.isEgg)
  }

  /**
   * @param {any} pokemon
   * @param {'party' | 'box'} source
   */
  function deposit(pokemon, source) {
    const result = depositToBank(state, pokemon.id, source)
    if ('error' in result) {
      setError(result.error)
      return
    }
    dispatch({ type: 'BANK_DEPOSIT', payload: { pokemonId: pokemon.id, source } })
    setBank(result.bank)
    setError('')
    setNotice(`${pokemonDisplayName(pokemon)} was deposited.`)
  }

  /** @param {BankEntry} entry */
  function withdraw(entry) {
    const result = withdrawFromBank(state, entry.tag)
    if ('error' in result) {
      setError(result.error)
      return
    }
    dispatch({ type: 'BANK_WITHDRAW', payload: { pokemon: result.pokemon } })
    setBank(result.bank)
    setError('')
    setNotice(`${pokemonDisplayName(entry.pokemon)} was withdrawn to this save.`)
  }

  return jsx('div', {
    className: 'catch-modal-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'catch-modal bank-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'catch-modal-header',
          children: [
            jsx('span', { className: 'catch-modal-title', children: 'Pokemon Bank' }),
            jsx('button', { className: 'catch-modal-close', onClick: onClose, children: 'X' }),
          ],
        }),
        jsx('p', {
          className: 'bank-hint',
          children:
            'Deposit Pokemon here, switch to another save slot from Settings, then withdraw them into that save. The bank is shared by every slot.',
        }),
        jsxs('div', {
          className: 'bank-capacity-row',
          children: [
            jsx('span', {
              className: 'bank-capacity',
              children: `Stored: ${bank.entries.length} / ${BANK_CAPACITY}`,
            }),
            jsxs('div', {
              className: 'bank-tabs',
              children: [
                jsx('button', {
                  className: `bank-tab${mode === 'deposit' ? ' active' : ''}`,
                  onClick: () => {
                    ;(setMode('deposit'), setError(''), setNotice(''))
                  },
                  children: `Deposit (${depositable.length})`,
                }),
                jsx('button', {
                  className: `bank-tab${mode === 'withdraw' ? ' active' : ''}`,
                  onClick: () => {
                    ;(setMode('withdraw'), setError(''), setNotice(''))
                  },
                  children: `Withdraw (${bank.entries.length})`,
                }),
              ],
            }),
          ],
        }),
        error
          ? jsx('p', { className: 'bank-message bank-message-error', children: error })
          : notice
            ? jsx('p', { className: 'bank-message', children: notice })
            : null,
        mode === 'deposit'
          ? jsx('div', {
              className: 'bank-list',
              children:
                depositable.length === 0
                  ? jsx('p', {
                      className: 'bank-empty',
                      children: 'No Pokemon available to deposit.',
                    })
                  : depositable.map(({ pokemon, source }) =>
                      jsxs(
                        'div',
                        {
                          className: 'bank-row',
                          children: [
                            jsx('img', {
                              className: 'bank-sprite',
                              src: spriteFor(pokemon),
                              onError: /** @param {{ target: HTMLImageElement }} event */ (
                                event
                              ) => (event.target.src = fallbackSpriteFor(pokemon)),
                              alt: pokemon.isEgg ? 'Egg' : pokemon.name,
                            }),
                            jsxs('div', {
                              className: 'bank-row-info',
                              children: [
                                jsx('span', {
                                  className: 'bank-row-name',
                                  children: pokemon.isEgg ? 'Egg' : pokemonDisplayName(pokemon),
                                }),
                                jsxs('span', {
                                  className: 'bank-row-meta',
                                  children: [
                                    pokemon.isEgg ? 'Egg' : `Lv.${pokemon.level}`,
                                    ' \u00b7 ',
                                    source === 'party' ? 'Party' : 'Box',
                                  ],
                                }),
                              ],
                            }),
                            jsx('button', {
                              className: 'bank-action',
                              disabled: !canDeposit(pokemon, source),
                              title: canDeposit(pokemon, source)
                                ? 'Move this Pokemon into the bank'
                                : 'Your last battler must stay in the party',
                              onClick: () => deposit(pokemon, source),
                              children: 'Deposit',
                            }),
                          ],
                        },
                        `${source}-${pokemon.id}`
                      )
                    ),
            })
          : jsx('div', {
              className: 'bank-list',
              children:
                bank.entries.length === 0
                  ? jsx('p', {
                      className: 'bank-empty',
                      children: 'The bank is empty. Deposit a Pokemon first.',
                    })
                  : bank.entries.map((entry) =>
                      jsxs(
                        'div',
                        {
                          className: 'bank-row',
                          children: [
                            jsx('img', {
                              className: 'bank-sprite',
                              src: spriteFor(entry.pokemon),
                              onError: /** @param {{ target: HTMLImageElement }} event */ (
                                event
                              ) => (event.target.src = fallbackSpriteFor(entry.pokemon)),
                              alt: entry.pokemon.isEgg ? 'Egg' : entry.pokemon.name,
                            }),
                            jsxs('div', {
                              className: 'bank-row-info',
                              children: [
                                jsx('span', {
                                  className: 'bank-row-name',
                                  children: entry.pokemon.isEgg
                                    ? 'Egg'
                                    : pokemonDisplayName(entry.pokemon),
                                }),
                                jsxs('span', {
                                  className: 'bank-row-meta',
                                  children: [
                                    entry.pokemon.isEgg ? 'Egg' : `Lv.${entry.pokemon.level}`,
                                    ' \u00b7 ',
                                    `from Slot ${entry.sourceSlot || '?'}`,
                                  ],
                                }),
                              ],
                            }),
                            jsx('button', {
                              className: 'bank-action',
                              onClick: () => withdraw(entry),
                              children: 'Withdraw',
                            }),
                          ],
                        },
                        entry.tag
                      )
                    ),
            }),
      ],
    }),
  })
}
