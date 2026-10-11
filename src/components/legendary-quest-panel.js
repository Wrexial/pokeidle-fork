// The multi-step Legendary Quest for a region, shown on its Raid Island.
// Completing the steps unlocks a direct challenge for the box legendary.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { legendaryQuestStatus } from '../game/legendary-quests.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

/** @param {{ regionId: string }} props */
export function LegendaryQuestPanel({ regionId }) {
  const { state, dispatch } = useGame(),
    quest = legendaryQuestStatus(state, regionId)
  if (!quest) return null
  const species = pokemonSpecies[quest.legendary],
    canChallenge =
      quest.ready &&
      !!quest.raidLocation &&
      !state.inRaid &&
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
            onClick: () =>
              dispatch({
                type: 'START_RAID',
                payload: {
                  legendary: quest.legendary,
                  level: quest.level,
                  region: regionId,
                  location: quest.raidLocation,
                },
              }),
            children: quest.ready
              ? `CHALLENGE ${(species?.name ?? quest.legendary).toUpperCase()}`
              : 'COMPLETE THE STEPS FIRST',
          }),
    ],
  })
}
