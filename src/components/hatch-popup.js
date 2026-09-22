// Popup shown when a Daycare egg hatches, so a (possibly shiny) hatch isn't
// missed in the battle log. Shows its IVs, nature and stats up front — the
// numbers that decide whether to keep or release it — plus Keep / release.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { natureByKey, natureName } from '../data/natures.js'
import { useGame } from '../game/context.js'
import { genderForPokemon, genderSymbol, isFemalePokemon } from '../game/breeding.js'
import {
  getPokemonSpriteFallbackUrl,
  getPokemonSpriteUrl,
  IV_STAT_LABELS,
  IV_STAT_ORDER,
  judgeIVs,
  pokemonDisplayName,
} from '../game/pokemon.js'

export function HatchPopup() {
  const { state, dispatch } = useGame(),
    hatch = state.hatchResult
  if (!hatch) return null
  const species = pokemonSpecies[hatch.speciesKey]
  if (!species) return null
  const gender = genderForPokemon(hatch),
    genderClass =
      gender === 'male' ? 'gender-male' : gender === 'female' ? 'gender-female' : 'gender-none',
    nature = hatch.nature ? natureByKey[hatch.nature] : null,
    ivs = judgeIVs(hatch.ivs),
    /** @type {Record<string, string | number>} */
    statValues = {
      hp: `${hatch.currentHp}/${hatch.maxHp}`,
      attack: hatch.attack,
      defense: hatch.defense,
      spAttack: hatch.spAttack,
      spDefense: hatch.spDefense,
      speed: hatch.speed,
    }
  return jsx('div', {
    className: 'hatch-popup-overlay',
    children: jsxs('div', {
      className: `hatch-popup${hatch.isShiny ? ' shiny' : ''}`,
      children: [
        jsx('div', {
          className: 'hatch-popup-title',
          children: 'The Egg hatched!',
        }),
        jsx('img', {
          className: 'hatch-popup-sprite',
          src: getPokemonSpriteUrl(species.id, !1, hatch.isShiny, isFemalePokemon(hatch)),
          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
            (event.target.src = getPokemonSpriteFallbackUrl(
              species.id,
              !1,
              hatch.isShiny,
              isFemalePokemon(hatch)
            )),
          alt: hatch.name,
        }),
        jsxs('div', {
          className: 'hatch-popup-name',
          children: [
            hatch.isShiny &&
              jsx('span', {
                className: 'shiny-star',
                children: '★',
              }),
            pokemonDisplayName(hatch),
            jsx('span', {
              className: `pokemon-gender ${genderClass}`,
              children: genderSymbol(gender),
            }),
          ],
        }),
        jsxs('div', {
          className: 'hatch-popup-meta',
          children: [`Lv.${hatch.level}`, hatch.isShiny ? ' · Shiny!' : ''],
        }),
        nature &&
          jsxs('span', {
            className: 'stats-panel-nature',
            children: [
              jsx('span', {
                className: 'stats-panel-nature-name',
                children: natureName(hatch.nature),
              }),
              nature.increased !== nature.decreased
                ? jsxs('span', {
                    className: 'stats-panel-nature-effects',
                    children: [
                      jsxs('span', {
                        className: 'nature-stat nature-up',
                        children: ['▲', IV_STAT_LABELS[nature.increased] ?? nature.increased],
                      }),
                      jsxs('span', {
                        className: 'nature-stat nature-down',
                        children: ['▼', IV_STAT_LABELS[nature.decreased] ?? nature.decreased],
                      }),
                    ],
                  })
                : jsx('span', {
                    className: 'nature-stat nature-neutral',
                    children: 'Neutral',
                  }),
            ],
          }),
        jsxs('div', {
          className: 'stats-panel-ivs',
          children: [
            jsxs('span', {
              className: 'stats-panel-ivs-title',
              children: ['IVs · ', ivs.verdict, ' (', ivs.total, '/186)'],
            }),
            jsx('div', {
              className: 'stats-panel-iv-grid',
              children: IV_STAT_ORDER.map((statKey) => {
                const iv = ivs.perStat[statKey]
                return jsxs(
                  'span',
                  {
                    className: `iv-chip iv-${iv.label.toLowerCase().replace(/\s+/g, '-')}`,
                    title: `${iv.label} (${iv.value}/31)`,
                    children: [IV_STAT_LABELS[statKey], ' ', iv.value],
                  },
                  statKey
                )
              }),
            }),
          ],
        }),
        jsx('div', {
          className: 'hatch-popup-stats',
          children: IV_STAT_ORDER.map((statKey) =>
            jsxs(
              'span',
              {
                className: 'hatch-popup-stat',
                children: [
                  jsx('span', {
                    className: 'hatch-popup-stat-label',
                    children: IV_STAT_LABELS[statKey],
                  }),
                  jsx('span', {
                    className: 'hatch-popup-stat-value',
                    children: statValues[statKey],
                  }),
                ],
              },
              statKey
            )
          ),
        }),
        jsxs('div', {
          className: 'hatch-popup-buttons',
          children: [
            jsx('button', {
              className: 'hatch-popup-btn keep',
              onClick: () =>
                dispatch({
                  type: 'CLEAR_HATCH_RESULT',
                }),
              children: 'Keep',
            }),
            jsx('button', {
              className: 'hatch-popup-btn release',
              onClick: () =>
                dispatch({
                  type: 'RELEASE_HATCHLING',
                  payload: {
                    pokemonId: hatch.id,
                  },
                }),
              children: 'Quick Release',
            }),
          ],
        }),
      ],
    }),
  })
}
