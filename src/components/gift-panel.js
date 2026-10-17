// The "People & Places" section of the location panel: one-off NPC gifts and
// static overworld encounters at the current location.

import { jsx, jsxs } from 'react/jsx-runtime'
import { Icon } from './icon.js'
import { pokemonSpecies } from '../data/gameData.js'
import { regionalStarters } from '../data/config.js'
import { useGame } from '../game/context.js'
import { giftRewardLabel, locationEntries } from '../game/gifts.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

/** @param {{ speciesKey: string, alt: string }} props */
function EntrySprite({ speciesKey, alt }) {
  const id = pokemonSpecies[speciesKey]?.id ?? 0
  return jsx('img', {
    className: 'location-gift-sprite',
    src: getPokemonSpriteUrl(id),
    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
      (event.target.src = getPokemonSpriteFallbackUrl(id)),
    alt,
  })
}

/** @param {{ requirements: { label: string, current: number, required: number, met: boolean }[] }} props */
function RequirementList({ requirements }) {
  if (requirements.length === 0) return null
  return jsx('div', {
    className: 'location-gift-requirements',
    children: requirements.map((requirement) =>
      jsxs(
        'span',
        {
          className: `location-gift-requirement${requirement.met ? ' met' : ''}`,
          children: [
            requirement.met ? jsx(Icon, { name: 'check' }) : jsx(Icon, { name: 'circle' }),
            requirement.required > 1
              ? `${requirement.current}/${requirement.required} ${requirement.label.toLowerCase()}`
              : requirement.label,
          ],
        },
        requirement.label
      )
    ),
  })
}

/** @param {{ locationId: string }} props */
export function GiftPanel({ locationId }) {
  const { state, dispatch } = useGame(),
    { gifts, statics } = locationEntries(state, locationId)
  if (gifts.length === 0 && statics.length === 0) return null
  const hasAliveParty = state.party.some((member) => member.currentHp > 0)
  return jsxs('div', {
    className: 'location-gifts',
    children: [
      jsx('div', { className: 'section-title inverse', children: 'People & Places' }),
      gifts.map((gift) => {
        const reward = giftRewardLabel(gift),
          giftSpecies = gift.pokemon ?? gift.egg
        return jsxs(
          'div',
          {
            className: `location-gift-card${gift.claimed ? ' claimed' : ''}`,
            children: [
              jsxs('div', {
                className: 'location-gift-main',
                children: [
                  gift.randomStarter
                    ? jsx('div', {
                        className: 'location-gift-starters',
                        children: (regionalStarters[gift.randomStarter] ?? []).map((speciesKey) =>
                          jsx(
                            EntrySprite,
                            {
                              speciesKey,
                              alt: pokemonSpecies[speciesKey]?.name ?? speciesKey,
                            },
                            speciesKey
                          )
                        ),
                      })
                    : giftSpecies &&
                      jsx(EntrySprite, {
                        speciesKey: giftSpecies.speciesKey,
                        alt:
                          pokemonSpecies[giftSpecies.speciesKey]?.name ?? giftSpecies.speciesKey,
                      }),
                  jsxs('div', {
                    className: 'location-gift-text',
                    children: [
                      jsx('div', { className: 'location-gift-name', children: gift.name }),
                      jsx('div', {
                        className: 'location-gift-description',
                        children: gift.description,
                      }),
                      jsx('div', { className: 'location-gift-reward', children: `Gift: ${reward}` }),
                      !gift.claimed && jsx(RequirementList, { requirements: gift.requirements }),
                    ],
                  }),
                ],
              }),
              jsx('button', {
                className: 'location-gift-action',
                disabled: gift.claimed || !gift.met,
                onClick: () => dispatch({ type: 'CLAIM_GIFT', payload: { giftId: gift.id } }),
                children: gift.claimed ? 'RECEIVED' : gift.met ? 'RECEIVE' : 'LOCKED',
              }),
            ],
          },
          gift.id
        )
      }),
      statics.map((entry) =>
        jsxs(
          'div',
          {
            className: `location-gift-card${entry.claimed ? ' claimed' : ''}`,
            children: [
              jsxs('div', {
                className: 'location-gift-main',
                children: [
                  jsx(EntrySprite, {
                    speciesKey: entry.speciesKey,
                    alt: pokemonSpecies[entry.speciesKey]?.name ?? entry.speciesKey,
                  }),
                  jsxs('div', {
                    className: 'location-gift-text',
                    children: [
                      jsx('div', { className: 'location-gift-name', children: entry.name }),
                      jsx('div', {
                        className: 'location-gift-description',
                        children: entry.note,
                      }),
                      jsxs('div', {
                        className: 'location-gift-reward',
                        children: [
                          'Wild ',
                          pokemonSpecies[entry.speciesKey]?.name ?? entry.speciesKey,
                          ` \u00b7 Lv.${entry.level}`,
                        ],
                      }),
                      !entry.claimed && jsx(RequirementList, { requirements: entry.requirements }),
                    ],
                  }),
                ],
              }),
              jsx('button', {
                className: 'location-gift-action',
                disabled: entry.claimed || !entry.met || !hasAliveParty,
                onClick: () =>
                  dispatch({ type: 'START_STATIC_ENCOUNTER', payload: { staticId: entry.id } }),
                children: entry.claimed
                  ? 'CAUGHT'
                  : !entry.met
                    ? 'LOCKED'
                    : !hasAliveParty
                      ? 'NO PARTY'
                      : 'ENCOUNTER',
              }),
            ],
          },
          entry.id
        )
      ),
    ],
  })
}
