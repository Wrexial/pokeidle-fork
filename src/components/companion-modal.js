// Companion care modal: pin one party Pokemon, keep its care topped up, and
// earn a small EXP bonus while it is content.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import {
  COMPANION_CARE_ACTIONS,
  COMPANION_CONTENT_THRESHOLD,
  COMPANION_EXP_MULTIPLIER,
  COMPANION_FEED_COST,
  isCompanionContent,
} from '../game/companion.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, pokemonDisplayName } from '../game/pokemon.js'

/** @param {{ label: string, value: number }} props */
function CareBar({ label, value }) {
  const low = value < COMPANION_CONTENT_THRESHOLD
  return jsxs('div', {
    className: 'companion-bar-row',
    children: [
      jsx('span', { className: 'companion-bar-label', children: label }),
      jsx('div', {
        className: 'companion-bar',
        children: jsx('div', {
          className: `companion-bar-fill${low ? ' low' : ''}`,
          style: { width: `${Math.max(0, Math.min(100, value))}%` },
        }),
      }),
      jsx('span', { className: 'companion-bar-value', children: Math.round(value) }),
    ],
  })
}

/** @param {{ onClose: () => void }} props */
export function CompanionModal({ onClose }) {
  const { state, dispatch } = useGame(),
    companion = state.companion,
    member = [...state.party, ...state.box].find((candidate) => candidate.id === companion?.id),
    content = isCompanionContent(companion),
    canCare = !!companion?.id && state.wildBattlesWon > companion.careBattle,
    speciesId = member ? pokemonSpecies[member.speciesKey].id : 0
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', { className: 'battle-info-title', children: 'Companion' }),
            jsx('button', { className: 'battle-info-close', onClick: onClose, children: 'X' }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content companion-content',
          children: [
            member
              ? jsxs('div', {
                className: 'companion-card',
                children: [
                  jsxs('div', {
                    className: 'companion-portrait',
                    children: [
                      jsx('img', {
                        className: 'companion-sprite',
                        src: getPokemonSpriteUrl(speciesId, !1, member.isShiny),
                        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                          (event.target.src = getPokemonSpriteFallbackUrl(
                            speciesId,
                            !1,
                            member.isShiny
                          )),
                        alt: member.name,
                      }),
                      jsxs('span', {
                        className: 'companion-name',
                        children: [
                          member.isShiny && jsx('span', { className: 'shiny-star', children: '★' }),
                          pokemonDisplayName(member),
                        ],
                      }),
                      jsx('span', {
                        className: 'companion-level',
                        children: `Lv.${member.level}`,
                      }),
                    ],
                  }),
                  jsxs('div', {
                    className: 'companion-care',
                    children: [
                      jsx(CareBar, { label: 'Fullness', value: companion.fullness }),
                      jsx(CareBar, { label: 'Happiness', value: companion.happiness }),
                      jsx(CareBar, { label: 'Energy', value: companion.energy }),
                    ],
                  }),
                ],
              })
            : jsx('p', {
                className: 'daycare-hint',
                children:
                  'Pin one of your party Pokemon as a companion and keep it fed, happy and rested. Care fades as you win battles.',
              }),
            member &&
              jsx('div', {
                className: `companion-bonus${content ? ' active' : ''}`,
                children: content
                  ? `Content \u2014 +${Math.round((COMPANION_EXP_MULTIPLIER - 1) * 100)}% EXP while every care stat is ${COMPANION_CONTENT_THRESHOLD}+`
                  : `Get all three care stats to ${COMPANION_CONTENT_THRESHOLD}+ for +${Math.round((COMPANION_EXP_MULTIPLIER - 1) * 100)}% EXP`,
              }),
            member &&
              jsxs('div', {
                className: 'companion-actions',
                children: [
                  ...Object.entries(COMPANION_CARE_ACTIONS).map(([actionId, action]) => {
                    const price = action.cost > 0 ? ` ($${action.cost.toLocaleString()})` : ''
                    const disabled = !canCare || (action.cost > 0 && state.money < action.cost)
                    return jsx(
                      'button',
                      {
                        className: 'companion-action-btn',
                        disabled,
                        onClick: () =>
                          dispatch({ type: 'CARE_COMPANION', payload: { action: actionId } }),
                        children: jsxs('span', {
                          children: [action.icon, ' ', action.label, price],
                        }),
                      },
                      actionId
                    )
                  }),
                ],
              }),
            member &&
              jsx('p', {
                className: 'companion-cooldown',
                children: canCare
                  ? 'One care action per wild win.'
                  : 'Win a battle to care again.',
              }),
            jsxs('div', {
              className: 'companion-picker-title',
              children: [member ? 'Change companion' : 'Choose a companion'],
            }),
            jsx('div', {
              className: 'companion-picker',
              children:
                state.party.length > 0
                  ? state.party.map((candidate) =>
                      jsxs(
                        'button',
                        {
                          className: `companion-pick${candidate.id === companion?.id ? ' active' : ''}`,
                          onClick: () =>
                            dispatch({
                              type: 'SET_COMPANION',
                              payload: {
                                pokemonId: candidate.id === companion?.id ? null : candidate.id,
                              },
                            }),
                          children: [
                            jsx('img', {
                              className: 'companion-pick-sprite',
                              src: getPokemonSpriteUrl(
                                pokemonSpecies[candidate.speciesKey].id,
                                !1,
                                candidate.isShiny
                              ),
                              onError: /** @param {{ target: HTMLImageElement }} event */ (
                                event
                              ) =>
                                (event.target.src = getPokemonSpriteFallbackUrl(
                                  pokemonSpecies[candidate.speciesKey].id,
                                  !1,
                                  candidate.isShiny
                                )),
                              alt: candidate.name,
                            }),
                            jsxs('span', {
                              children: [
                                candidate.isShiny ? '★ ' : '',
                                pokemonDisplayName(candidate),
                              ],
                            }),
                          ],
                        },
                        candidate.id
                      )
                    )
                  : jsx('span', { className: 'daycare-hint', children: 'No party Pokemon.' }),
            }),
            member &&
              jsx('button', {
                className: 'companion-unpin',
                onClick: () => dispatch({ type: 'SET_COMPANION', payload: { pokemonId: null } }),
                children: 'Unpin companion',
              }),
          ],
        }),
      ],
    }),
  })
}
