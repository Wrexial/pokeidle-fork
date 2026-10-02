// Companion care panel, shown inside Poké Pelago. Split from the old
// standalone modal so Pelago can host it alongside the Berry Garden. The
// portrait is an interactive "buddy stage": the companion bobs on the mat, and
// tapping it (or using a care action) throws up a reaction.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  COMPANION_CARE_ACTIONS,
  COMPANION_CONTENT_THRESHOLD,
  COMPANION_EXP_MULTIPLIER,
  companionMood,
  isCompanionContent,
} from '../game/companion.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, pokemonDisplayName } from '../game/pokemon.js'

/** Emoji thrown up when the buddy is petted. */
const PET_HEARTS = ['\u{1F497}', '\u{1F495}', '\u{2728}', '\u{1F3B5}', '\u{1F496}']

/** The icon a care action throws up on the stage. @type {Record<string, string>} */
const CARE_FEEDBACK = {
  feed: '\u{1F356}',
  play: '\u{1F3BE}',
  pat: '\u{1F497}',
  brush: '\u{2728}',
  wash: '\u{1FAE7}',
  rest: '\u{1F4A4}',
}

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

export function CompanionCarePanel() {
  const { state, dispatch } = useGame(),
    companion = state.companion,
    member = [...state.party, ...state.box].find((candidate) => candidate.id === companion?.id),
    content = isCompanionContent(companion),
    canCare = !!companion?.id && state.wildBattlesWon > companion.careBattle,
    speciesId = member ? pokemonSpecies[member.speciesKey].id : 0,
    [hearts, setHearts] = React.useState(
      /** @type {{ id: number, x: number, emoji: string }[]} */ ([])
    ),
    [petting, setPetting] = React.useState(false),
    nextHeartId = React.useRef(1),
    mood = companionMood(companion)

  /** Throw a reaction up from the companion. @param {string} emoji */
  function spawnReaction(emoji) {
    const id = nextHeartId.current++
    setHearts((current) => [
      ...current,
      { id, x: 12 + Math.random() * 76, emoji },
    ])
  }

  /** @param {number} id */
  function clearReaction(id) {
    setHearts((current) => current.filter((heart) => heart.id !== id))
  }

  function petBuddy() {
    if (!member) return
    if (state.sfxEnabled) playSfx('tap')
    setPetting(true)
    spawnReaction(PET_HEARTS[Math.floor(Math.random() * PET_HEARTS.length)])
  }

  /** @param {string} actionId */
  function care(actionId) {
    if (state.sfxEnabled) playSfx('good')
    setPetting(true)
    spawnReaction(CARE_FEEDBACK[actionId] ?? '\u{1F497}')
    dispatch({ type: 'CARE_COMPANION', payload: { action: actionId } })
  }

  return jsxs('div', {
    className: 'companion-content',
    children: [
      member
        ? jsxs('div', {
            className: 'companion-card',
            children: [
              jsxs('div', {
                className: 'companion-portrait',
                'data-mood': content ? 'happy' : 'low',
                children: [
                  jsxs('button', {
                    className: 'companion-buddy',
                    onClick: petBuddy,
                    'aria-label': `Pet ${pokemonDisplayName(member)}`,
                    children: [
                      jsx('img', {
                        className: `companion-sprite${petting ? ' pet' : ''}`,
                        src: getPokemonSpriteUrl(speciesId, !1, member.isShiny),
                        onAnimationEnd: () => setPetting(false),
                        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                          (event.target.src = getPokemonSpriteFallbackUrl(
                            speciesId,
                            !1,
                            member.isShiny
                          )),
                        alt: member.name,
                      }),
                      hearts.map((heart) =>
                        jsx(
                          'span',
                          {
                            className: 'companion-heart',
                            style: { left: `${heart.x}%` },
                            onAnimationEnd: () => clearReaction(heart.id),
                            children: heart.emoji,
                          },
                          heart.id
                        )
                      ),
                    ],
                  }),
                  jsxs('span', {
                    className: 'companion-name',
                    children: [
                      member.isShiny && jsx('span', { className: 'shiny-star', children: '\u2605' }),
                      pokemonDisplayName(member),
                    ],
                  }),
                  jsx('span', {
                    className: 'companion-level',
                    children: `Lv.${member.level}`,
                  }),
                  mood &&
                    jsxs('span', {
                      className: 'companion-mood',
                      children: [mood.icon, ' ', mood.label],
                    }),
                ],
              }),
              jsxs('div', {
                className: 'companion-care',
                children: [
                  jsx(CareBar, { label: 'Fullness', value: companion.fullness }),
                  jsx(CareBar, { label: 'Happiness', value: companion.happiness }),
                  jsx(CareBar, { label: 'Energy', value: companion.energy }),
                  jsx(CareBar, { label: 'Cleanliness', value: companion.cleanliness }),
                ],
              }),
            ],
          })
        : jsx('p', {
            className: 'daycare-hint',
            children:
              'Choose a companion below and keep it fed, happy, rested and clean. Care fades as you win battles.',
          }),
      member &&
        jsxs('p', {
          className: 'companion-pet-hint',
          children: ['Tap your buddy to pet it \u2014 ', mood ? `${mood.label.toLowerCase()} right now.` : ''],
        }),
      member &&
        jsx('div', {
          className: `companion-bonus${content ? ' active' : ''}`,
          children: content
            ? `Content \u2014 +${Math.round((COMPANION_EXP_MULTIPLIER - 1) * 100)}% EXP while every care stat is ${COMPANION_CONTENT_THRESHOLD}+`
            : `Get all four care stats to ${COMPANION_CONTENT_THRESHOLD}+ for +${Math.round((COMPANION_EXP_MULTIPLIER - 1) * 100)}% EXP`,
        }),
      member &&
        jsx('div', {
          className: 'companion-actions',
          children: Object.entries(COMPANION_CARE_ACTIONS).map(([actionId, action]) => {
            const price = action.cost > 0 ? ` ($${action.cost.toLocaleString()})` : '',
              disabled = !canCare || (action.cost > 0 && state.money < action.cost)
            return jsx(
              'button',
              {
                className: 'companion-action-btn',
                disabled,
                onClick: () => care(actionId),
                children: jsxs('span', {
                  children: [action.icon, ' ', action.label, price],
                }),
              },
              actionId
            )
          }),
        }),
      member &&
        jsx('p', {
          className: 'companion-cooldown',
          children: canCare ? 'One care action per wild win.' : 'Win a battle to care again.',
        }),
      jsx('div', {
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
                        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                          (event.target.src = getPokemonSpriteFallbackUrl(
                            pokemonSpecies[candidate.speciesKey].id,
                            !1,
                            candidate.isShiny
                          )),
                        alt: candidate.name,
                      }),
                      jsxs('span', {
                        children: [candidate.isShiny ? '\u2605 ' : '', pokemonDisplayName(candidate)],
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
  })
}
