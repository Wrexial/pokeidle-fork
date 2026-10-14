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
  mapData,
  pokedexData,
  pokedexIndexes,
  pokemonSpecies,
  raidPoolFor,
} from '../data/gameData.js'
import { pickRaidLegendary, raidProgressFor } from '../game/progression.js'
import { legendaryQuestStatus } from '../game/legendary-quests.js'
import { pokedexSourceLabels } from '../game/pokedex-sources.js'
import { speciesMatchingSearch } from '../game/species-search.js'
import { useGame } from '../game/context.js'
import { useUi } from '../game/ui-context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { PokedexTile } from './pokedex-tile.js'
import { FormDexPanel } from './form-dex-panel.js'
import { ResearchPanel } from './research-panel.js'
import { LegendaryIntroModal } from './legendary-quest-panel.js'

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
    [query, setQuery] = React.useState(''),
    [searchOpen, setSearchOpen] = React.useState(!1),
    // 'grid' is the national-dex grid + detail; 'forms' is the Living Dex view.
    [view, setView] = React.useState('grid'),
    // A ready Legendary Quest opened from the raid link: show its boss scene
    // instead of starting the raid under the player's feet.
    [raidQuest, setRaidQuest] = React.useState(
      /** @type {{ regionId: string, quest: NonNullable<ReturnType<typeof legendaryQuestStatus>> } | null} */ (
        null
      )
    ),
    gridIndexes = React.useMemo(() => {
      const matches = speciesMatchingSearch(query)
      if (!matches) return filteredIndexes
      // A slot matches when its base species or any of its forms is in a
      // matching family, so searching "Bulbasaur" keeps Ivysaur and Venusaur.
      return filteredIndexes.filter(([speciesKey]) => {
        if (matches.has(speciesKey)) return true
        const forms = formsByBase[speciesKey] ?? []
        return forms.some((formKey) => matches.has(formKey))
      })
    }, [filteredIndexes, query]),
    // MissingNo. stays hidden until it has been seen.
    pokedexTiles = gridIndexes.filter(
      ([speciesKey, species]) => species.id !== 0 || seenSet.has(speciesKey)
    ),
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
    sourceLabels = activeKey ? pokedexSourceLabels(activeKey) : [],
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
          className: 'bag-tabs pokedex-gen-tabs',
          children: [
            ...[{ id: 0, label: 'All' }]
              .concat(Array.from({ length: 9 }, (_, i) => ({ id: i + 1, label: String(i + 1) })))
              .map((option) =>
                jsx(
                  'button',
                  {
                    className: `bag-tab parchment${gen === option.id ? ' active' : ''}`,
                    onClick: () => setGen(option.id),
                    children: option.label,
                  },
                  option.id
                )
              ),
            jsx(
              'button',
              {
                className: `bag-tab parchment pokedex-search-toggle${view === 'forms' ? ' active' : ''}`,
                onClick: () => setView(view === 'forms' ? 'grid' : 'forms'),
                title: 'Living Dex form completion',
                'aria-label': 'Living Dex form completion',
                children: 'Forms',
              },
              'pokedex-forms-toggle'
            ),
            jsx(
              'button',
              {
                className: `bag-tab parchment pokedex-search-toggle${searchOpen ? ' active' : ''}`,
                onClick: () => {
                  // Collapsing clears the query so the grid isn't left filtered
                  // with the control hidden.
                  if (searchOpen) setQuery('')
                  setSearchOpen(!searchOpen)
                },
                title: searchOpen ? 'Hide search' : 'Search by name',
                'aria-label': searchOpen ? 'Hide search' : 'Search by name',
                children: searchOpen ? 'Hide' : 'Search',
              },
              'pokedex-search-toggle'
            ),
          ],
        }),
        searchOpen &&
          jsx('div', {
            className: 'pokedex-search',
            children: jsx('input', {
              className: 'pokedex-search-input',
              type: 'search',
              placeholder: 'Search name\u2026',
              value: query,
              onChange: /** @param {React.ChangeEvent<HTMLInputElement>} event */ (event) =>
                setQuery(event.target.value),
            }),
          }),
        view === 'forms'
          ? jsx(FormDexPanel, {
              onSelectSpecies: /** @param {string} speciesKey */ (speciesKey) => {
                setSelected(speciesKey)
                setView('grid')
              },
            })
          : jsx('div', {
              className: 'pokedex-modal-grid-scroll',
              children: jsx('div', {
                className: 'pokedex-grid',
                children: [
                  ...pokedexTiles.map(([speciesKey]) => {
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
                  pokedexTiles.length === 0 &&
                    jsx('span', {
                      className: 'pokedex-grid-empty',
                      children: 'No Pokemon match your search.',
                    }),
                ],
              }),
            }),
        view !== 'forms' &&
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
                        className: 'bag-tabs pokedex-form-tabs',
                        children: [
                          jsx('button', {
                            className: `bag-tab parchment${activeKey === selected ? ' active' : ''}`,
                            onClick: () => setFormKey(null),
                            children: formLabelFor(selected) ?? 'Base',
                          }),
                          ...slotForms.map((formKey) =>
                            jsx(
                              'button',
                              {
                                className: `bag-tab parchment${activeKey === formKey ? ' active' : ''}`,
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
                      children: 'Found: ',
                    }),
                    pokedexData[activeKey].map((route, index) => {
                      const location = mapData[route.id],
                        isRaid = location?.type === 'raid',
                        unlocked = state.unlockedLocations.includes(route.id),
                        raidCoolingDown =
                          isRaid &&
                          state.raidCooldownEnd != null &&
                          Date.now() < state.raidCooldownEnd,
                        canUse = unlocked && !raidCoolingDown
                      return jsxs(
                        'span',
                        {
                          style: {
                            whiteSpace: 'nowrap',
                          },
                          children: [
                            jsx('button', {
                              className: `pokedex-route-link${unlocked ? '' : ' locked'}${isRaid ? ' raid' : ''}`,
                              disabled: !canUse,
                              title: !unlocked
                                ? `${route.name} \u2014 not unlocked yet`
                                : raidCoolingDown
                                  ? `${route.name} \u2014 the raid is recharging`
                                  : isRaid
                                    ? `Start a raid at ${route.name}`
                                    : `Travel to ${route.name}`,
                              onClick: () => {
                                // A Raid Island isn't a route: start the raid
                                // (for the species shown, when it is on the
                                // roster) instead of travelling there.
                                if (isRaid) {
                                  const region = location.region ?? 'kanto',
                                    quest = legendaryQuestStatus(state, region),
                                    // The box legendary is quest-only: its raid
                                    // starts once the quest is ready, never
                                    // from the weighted random roll. The
                                    // challenge opens its boss scene first.
                                    questReady =
                                      quest?.ready && quest.legendary === activeKey
                                  if (questReady && quest) {
                                    setRaidQuest({ regionId: region, quest })
                                    return
                                  }
                                  const pool = raidPoolFor(region, state),
                                    target =
                                      pool.find((entry) => entry.speciesKey === activeKey) ??
                                      pickRaidLegendary(
                                        pool,
                                        state.pokedexSeen,
                                        state.pokedexCaught,
                                        raidProgressFor(state, region)
                                      )
                                  if (!target) return
                                  dispatch({
                                    type: 'START_RAID',
                                    payload: {
                                      legendary: target.speciesKey,
                                      level: target.level,
                                      region,
                                      location: route.id,
                                    },
                                  })
                                  return
                                }
                                dispatch({ type: 'TRAVEL', payload: { locationId: route.id } })
                              },
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
                sourceLabels.length > 0 &&
                jsxs('div', {
                  className: 'pokedex-modal-sources',
                  children: [
                    jsx('span', {
                      className: 'pokedex-modal-routes-label',
                      children: 'Source: ',
                    }),
                    sourceLabels.join(' \u00b7 '),
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
              activeStatus !== 'unseen' && jsx(ResearchPanel, { speciesKey: activeKey }),
            ],
          }),
        raidQuest &&
          jsx(LegendaryIntroModal, {
            regionId: raidQuest.regionId,
            quest: raidQuest.quest,
            onClose: () => setRaidQuest(null),
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
