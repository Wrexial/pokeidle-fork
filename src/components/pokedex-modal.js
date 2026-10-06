// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { STAT_DISPLAY_MAX, statBarColors } from '../data/ui.js'
import {
  GENERATION_DEX_RANGES,
  baseSpeciesKey,
  dexIdForSpecies,
  formLabelFor,
  formsByBase,
  isSpeciesRegistered,
  pokedexData,
  pokedexIndexes,
  pokemonSpecies,
} from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { useUi } from '../game/ui-context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { PokedexTile } from './pokedex-tile.js'

/** @param {{ onClose?: () => void, inline?: boolean }} props */
export function PokedexModal({ onClose, inline = false }) {
  const { state, dispatch } = useGame(),
    { pokedexSelected: selectedRaw, setPokedexSelected: setSelected, pokedexGen: gen, setPokedexGen: setGen } = useUi(),
    // The selected slot is always a national-dex base; its forms switch in the
    // detail panel without changing the selected tile.
    selected = selectedRaw ? baseSpeciesKey(selectedRaw) : null,
    caughtSet = new Set(state.pokedexCaught),
    seenSet = new Set([...state.pokedexSeen, ...state.pokedexCaught]),
    /** Species-level status for a dex slot (any of its forms counts). */
    getSlotStatus = /** @param {string} baseKey */ (baseKey) =>
      isSpeciesRegistered(caughtSet, baseKey)
        ? 'caught'
        : isSpeciesRegistered(seenSet, baseKey)
          ? 'seen'
          : 'unseen',
    /** Individual status for one species/form key. */
    getFormStatus = /** @param {string} speciesKey */ (speciesKey) =>
      caughtSet.has(speciesKey) ? 'caught' : seenSet.has(speciesKey) ? 'seen' : 'unseen',
    filteredIndexes = React.useMemo(
      () =>
        gen === 0
          ? pokedexIndexes
          : pokedexIndexes.filter(
              (entry) =>
                entry[1].id >= GENERATION_DEX_RANGES[gen - 1][0] &&
                entry[1].id <= GENERATION_DEX_RANGES[gen - 1][1]
            ),
      [gen]
    ),
    // The completion count excludes MissingNo. (id 0); the grid also hides it
    // entirely until the glitch is first seen.
    countedIndexes =
      gen === 0
        ? filteredIndexes.filter((entry) => entry[1].id > 0 && entry[1].id <= 1025)
        : filteredIndexes,
    caughtCount = countedIndexes.filter(([speciesKey]) => isSpeciesRegistered(caughtSet, speciesKey)).length,
    seenCount = countedIndexes.filter(([speciesKey]) => isSpeciesRegistered(seenSet, speciesKey)).length,
    totalEntries = countedIndexes.length,
    slotForms = selected ? formsByBase[selected] ?? [] : [],
    [formKey, setFormKey] = React.useState(/** @type {string | null} */ (null)),
    // Default to a form the player has actually registered when the base form
    // itself is still unseen, so selecting a caught regional form from the grid
    // opens on something they have.
    defaultKey = React.useCallback(
      /** @param {string | null} slot @returns {string | null} */
      (slot) => {
        if (!slot) return null
        if (caughtSet.has(slot) || seenSet.has(slot)) return null
        const forms = formsByBase[slot] ?? []
        const caughtForm = forms.find((key) => caughtSet.has(key))
        if (caughtForm) return caughtForm
        return forms.find((key) => seenSet.has(key)) ?? null
      },
      [state.pokedexCaught, state.pokedexSeen]
    ),
    activeKey = formKey && slotForms.includes(formKey) ? formKey : selected,
    activeSpecies = activeKey ? pokemonSpecies[activeKey] : null,
    activeStatus = activeKey ? getFormStatus(activeKey) : 'unseen',
    statRows = activeSpecies
      ? [
          { label: 'HP', key: 'hp', value: activeSpecies.baseStats.hp },
          { label: 'Atk', key: 'attack', value: activeSpecies.baseStats.attack },
          { label: 'Def', key: 'defense', value: activeSpecies.baseStats.defense },
          { label: 'SpA', key: 'spAttack', value: activeSpecies.baseStats.spAttack },
          { label: 'SpD', key: 'spDefense', value: activeSpecies.baseStats.spDefense },
          { label: 'Spd', key: 'speed', value: activeSpecies.baseStats.speed },
        ]
      : []

  // Reset the form view whenever the selected slot changes.
  React.useEffect(() => {
    setFormKey(null)
    const fallback = defaultKey(selected)
    if (fallback) setFormKey(fallback)
  }, [selected])

  const panel = jsxs('div', {
    className: inline ? 'pokedex-inline' : 'pokedex-modal',
    ...(inline
      ? {}
      : { onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation() }),
    children: [
        jsxs('div', {
          className: 'pokedex-modal-header',
          children: [
            jsx('span', {
              className: 'pokedex-modal-title',
              children: 'Pokedex',
            }),
            jsxs('span', {
              className: 'pokedex-modal-counts',
              children: [caughtCount, '/', totalEntries, ' caught · ', seenCount, '/', totalEntries, ' seen'],
            }),
            onClose &&
              jsx('button', {
                className: 'pokedex-modal-close',
                onClick: onClose,
                children: 'X',
              }),
          ],
        }),
        jsx('div', {
          className: 'pokedex-gen-tabs',
          children: [{ id: 0, label: 'All' }]
            .concat(Array.from({ length: 9 }, (_, i) => ({ id: i + 1, label: String(i + 1) })))
            .map((option) =>
              jsx(
                'button',
                {
                  className: `pokedex-gen-tab${gen === option.id ? ' active' : ''}`,
                  onClick: () => setGen(option.id),
                  children: option.label,
                },
                option.id
              )
            ),
        }),
        jsx('div', {
          className: 'pokedex-modal-grid-scroll',
          children: jsx('div', {
            className: 'pokedex-grid',
            children: filteredIndexes
              .filter(([speciesKey, species]) => species.id !== 0 || seenSet.has(speciesKey))
              .map(([speciesKey]) => {
              const status = getSlotStatus(speciesKey)
              return jsx(
                PokedexTile,
                {
                  speciesKey,
                  status,
                  rarity: 'common',
                  isSelected: selected === speciesKey,
                  onClick: () => setSelected(selected === speciesKey ? null : speciesKey),
                  isShinyCaught: isSpeciesRegistered(new Set(state.shinyCaught), speciesKey),
                  formCount: formsByBase[speciesKey]?.length ?? 0,
                },
                speciesKey
              )
            }),
          }),
        }),
        selected &&
          activeKey &&
          activeSpecies &&
          jsxs('div', {
            className: 'pokedex-modal-detail',
            children: [
              jsxs('div', {
                className: 'pokedex-detail-header',
                children: [
                  slotForms.length > 0
                    ? jsx('div', {
                        className: 'pokedex-form-tabs',
                        children: [
                          jsx('button', {
                            className: `pokedex-form-tab${activeKey === selected ? ' active' : ''}`,
                            onClick: () => setFormKey(null),
                            children: formLabelFor(selected) ?? 'Base',
                          }),
                          ...slotForms.map((formKey) =>
                            jsx(
                              'button',
                              {
                                className: `pokedex-form-tab${activeKey === formKey ? ' active' : ''}`,
                                onClick: () => setFormKey(formKey),
                                title: pokemonSpecies[formKey].name,
                                children: formLabelFor(formKey) ?? pokemonSpecies[formKey].name,
                              },
                              formKey
                            )
                          ),
                        ],
                      })
                    : null,
                  jsx('button', {
                    className: 'pokedex-detail-close',
                    onClick: () => setSelected(null),
                    title: 'Close',
                    'aria-label': 'Close Pokemon details',
                    children: 'X',
                  }),
                ],
              }),
              jsxs('div', {
                className: 'stats-panel-identity',
                children: [
                  jsx('img', {
                    className: `stats-panel-sprite ${activeStatus}`,
                    src: getPokemonSpriteUrl(activeSpecies.id),
                    onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(activeSpecies.id)),
                    alt: activeStatus === 'unseen' ? '???' : activeSpecies.name,
                  }),
                  jsxs('div', {
                    className: 'stats-panel-name-block',
                    children: [
                      jsx('span', {
                        className: 'stats-panel-name',
                        children: activeStatus === 'unseen' ? '???' : activeSpecies.name,
                      }),
                      jsxs('span', {
                        className: 'stats-panel-level',
                        children: ['#', String(dexIdForSpecies(activeKey)).padStart(3, '0')],
                      }),
                      jsx('div', {
                        className: 'stats-panel-types',
                        children:
                          activeStatus === 'unseen'
                            ? jsx('span', {
                                className: 'type-badge type-unknown',
                                children: '???',
                              })
                            : activeSpecies.types.map((type) =>
                                jsx(
                                  'span',
                                  {
                                    className: `type-badge type-${type.toLowerCase()}`,
                                    children: type,
                                  },
                                  type
                                )
                              ),
                      }),
                    ],
                  }),
                ],
              }),
              activeStatus !== 'unseen' &&
                pokedexData[activeKey] &&
                jsxs('div', {
                  className: 'pokedex-modal-routes',
                  children: [
                    jsx('span', {
                      className: 'pokedex-modal-routes-label',
                      children: 'Routes: ',
                    }),
                    pokedexData[activeKey].map((route, index) => {
                      const unlocked = state.unlockedLocations.includes(route.id)
                      return jsxs(
                        'span',
                        {
                          style: {
                            whiteSpace: 'nowrap',
                          },
                          children: [
                            jsx('button', {
                              className: `pokedex-route-link${unlocked ? '' : ' locked'}`,
                              disabled: !unlocked,
                              title: unlocked
                                ? `Travel to ${route.name}`
                                : `${route.name} \u2014 not unlocked yet`,
                              onClick: () =>
                                dispatch({ type: 'TRAVEL', payload: { locationId: route.id } }),
                              children: route.name,
                            }),
                            index < pokedexData[activeKey].length - 1 ? ', ' : '',
                          ],
                        },
                        route.id
                      )
                    }),
                  ],
                }),
              activeStatus !== 'unseen' &&
                jsx('div', {
                  className: 'stats-panel-grid',
                  children: statRows.map((statRow) => {
                    const statIndex = Math.min((statRow.value / STAT_DISPLAY_MAX) * 100, 100)
                    return jsxs(
                      'div',
                      {
                        className: 'stats-panel-stat-row',
                        children: [
                          jsx('span', {
                            className: 'stats-panel-stat-label',
                            children: statRow.label,
                          }),
                          jsx('div', {
                            className: 'stats-panel-stat-bar',
                            children: jsx('div', {
                              className: 'stats-panel-stat-fill',
                              style: {
                                width: `${statIndex}%`,
                                backgroundColor: statBarColors[statRow.key],
                              },
                            }),
                          }),
                          jsx('span', {
                            className: 'stats-panel-stat-value',
                            children: statRow.value,
                          }),
                        ],
                      },
                      statRow.key
                    )
                  }),
                }),
            ],
          }),
      ],
    })
  return inline
    ? panel
    : jsx('div', {
        className: 'pokedex-modal-overlay',
        onClick: onClose,
        children: panel,
      })
}
