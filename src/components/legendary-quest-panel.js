// The multi-step Legendary Quest for a region, shown on its Raid Island.
// Completing the steps unlocks a direct challenge for the box legendary, which
// opens with a short pre-battle scene so the raid reads as a boss encounter.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { legendaryDialogue, legendaryQuestStatus } from '../game/legendary-quests.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

/**
 * The pre-battle scene for a legendary: its sprite, the quest title and the
 * lines read before the raid begins.
 * @param {{ regionId: string, quest: NonNullable<ReturnType<typeof legendaryQuestStatus>>, onClose: () => void }} props
 */
export function LegendaryIntroModal({ regionId, quest, onClose }) {
  const { state, dispatch } = useGame(),
    species = pokemonSpecies[quest.legendary],
    lines = legendaryDialogue(regionId)
  return jsx('div', {
    className: 'modal-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'modal legendary-intro-modal',
      onClick: /** @param {React.MouseEvent} mouseEvent */ (mouseEvent) =>
        mouseEvent.stopPropagation(),
      children: [
        jsx('div', {
          className: 'legendary-intro-head',
          children: [
            species &&
              jsx('img', {
                className: 'legendary-intro-sprite',
                src: getPokemonSpriteUrl(species.id),
                onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                  (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                alt: species.name,
              }),
            jsx('span', {
              className: 'legendary-intro-title',
              children: quest.name,
            }),
            jsx('span', {
              className: 'legendary-intro-target',
              children: `${species?.name ?? quest.legendary} \\u00b7 Lv.${quest.level}`,
            }),
          ],
        }),
        jsx('div', {
          className: 'legendary-intro-lines',
          children: lines.map((line, index) =>
            jsx(
              'p',
              {
                className: 'legendary-intro-line',
                children: line,
              },
              index
            )
          ),
        }),
        jsxs('div', {
          className: 'legendary-intro-actions',
          children: [
            jsx('button', {
              className: 'modal-close',
              onClick: onClose,
              children: 'BACK',
            }),
            jsx('button', {
              className: 'gym-fight-btn champion',
              onClick: () => {
                onClose()
                dispatch({
                  type: 'START_RAID',
                  payload: {
                    legendary: quest.legendary,
                    level: quest.level,
                    region: regionId,
                    location: quest.raidLocation,
                  },
                })
              },
              disabled: state.party.every((member) => member.currentHp <= 0),
              children: `CHALLENGE ${(species?.name ?? quest.legendary).toUpperCase()}`,
            }),
          ],
        }),
      ],
    }),
  })
}

/** @param {{ regionId: string }} props */
export function LegendaryQuestPanel({ regionId }) {
  const { state } = useGame(),
    quest = legendaryQuestStatus(state, regionId),
    [confirming, setConfirming] = React.useState(false)
  if (!quest) return null
  const species = pokemonSpecies[quest.legendary],
    // The challenge can be taken from the Raid Island even mid-session (it just
    // restarts the raid with the quest's box legendary).
    canChallenge =
      quest.ready &&
      !!quest.raidLocation &&
      state.phase !== 'healing' &&
      state.party.some((member) => member.currentHp > 0)
  return jsxs('div', {
    className: 'legendary-quest-panel',
    children: [
      jsxs('div', {
        className: 'legendary-quest-head',
        children: [
          species &&
            jsx('img', {
              className: 'legendary-quest-sprite',
              src: getPokemonSpriteUrl(species.id),
              onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
              alt: species.name,
            }),
          jsxs('div', {
            className: 'legendary-quest-info',
            children: [
              jsx('span', {
                className: 'legendary-quest-title',
                children: `Legendary Quest \u00b7 ${quest.name}`,
              }),
              jsx('span', {
                className: 'legendary-quest-target',
                children: species?.name ?? quest.legendary,
              }),
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'legendary-quest-steps',
        children: quest.steps.map((step) =>
          jsxs(
            'div',
            {
              className: `legendary-quest-step${step.done ? ' done' : ''}`,
              children: [
                jsx('span', { className: 'legendary-quest-step-label', children: step.label }),
                jsx('span', {
                  className: 'legendary-quest-step-progress',
                  children: step.done ? '\u2714' : `${step.progress}/${step.need}`,
                }),
              ],
            },
            step.id
          )
        ),
      }),
      quest.caught
        ? jsx('div', {
            className: 'legendary-quest-done',
            children: `${species?.name ?? quest.legendary} has been caught. Quest complete!`,
          })
        : jsx('button', {
            className: 'gym-fight-btn champion',
            style: { width: '100%' },
            disabled: !canChallenge,
            onClick: () => setConfirming(true),
            children: quest.ready
              ? `CHALLENGE ${(species?.name ?? quest.legendary).toUpperCase()}`
              : 'COMPLETE THE STEPS FIRST',
          }),
      confirming && jsx(LegendaryIntroModal, { regionId, quest, onClose: () => setConfirming(false) }),
    ],
  })
}
