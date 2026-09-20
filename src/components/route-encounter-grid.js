// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { getRarityFromRate } from '../game/catching.js'
import { useGame } from '../game/context.js'
import { PokeballIcon } from './pokeball-icon.js'
import { EncounterDetailPanel } from './encounter-detail-panel.js'
import { PokedexTile } from './pokedex-tile.js'

export function RouteEncounterGrid({
  routeKey,
  encounters,
  onOpenCatchSettings,
  forceRarity,
}) {
  const { state, dispatch } = useGame(),
    [selected, setSelected] = React.useState(/** @type {string | null} */ (null)),
    [applyingItem, setApplyingItem] = React.useState(/** @type {'repel' | 'honey' | null} */ (null)),
    repelCount = state.inventory.repel ?? 0,
    honeyCount = state.inventory.honey ?? 0,
    totalWeight = React.useMemo(() => encounters.reduce((accumulator, encounter) => accumulator + encounter.weight, 0), [encounters]),
    sortedEncounters = React.useMemo(() => [...encounters].sort((left, right) => right.weight - left.weight), [encounters]),
    activeEffectMap = React.useMemo(() => {
      const effectMap = {}
      for (const effect of state.activeEffects)
        (effect.type === 'repel' || effect.type === 'honey') &&
          effect.routeKey === routeKey &&
          effect.speciesKey &&
          (effectMap[effect.speciesKey] ||
            (effectMap[effect.speciesKey] = {
              repel: !1,
              honey: !1,
            }),
          (effectMap[effect.speciesKey][effect.type] = !0))
      return effectMap
    }, [state.activeEffects, routeKey]),
    getStatus = React.useCallback(
      (speciesKey) =>
        state.pokedexCaught.includes(speciesKey)
          ? 'caught'
          : state.pokedexSeen.includes(speciesKey)
            ? 'seen'
            : 'unseen',
      [state.pokedexSeen, state.pokedexCaught]
    ),
    handleTileClick = React.useCallback(
      (encounter) => {
        if (applyingItem) {
          if (getStatus(encounter) === 'unseen') return
          const weightedRate = state.inventory[applyingItem] ?? 0
          if (weightedRate <= 0) return
          ;(weightedRate <= 1 && setApplyingItem(null),
            dispatch({
              type: 'USE_EFFECT_ITEM',
              payload: {
                itemId: applyingItem,
                routeKey,
                speciesKey: encounter,
              },
            }))
          return
        }
        setSelected((weightedRate) => (weightedRate === encounter ? null : encounter))
      },
      [applyingItem, getStatus, state.inventory, dispatch, routeKey]
    ),
    closeDetail = React.useCallback(() => {
      setSelected(null)
    }, []),
    selectedEncounter = selected ? encounters.find((entry) => entry.speciesKey === selected) : null,
    rate = selectedEncounter && totalWeight > 0 ? (selectedEncounter.weight / totalWeight) * 100 : 0,
    rarity = forceRarity ?? (rate > 0 ? getRarityFromRate(rate) : 'common')
  return jsxs('div', {
    className: 'pokedex-grid-container',
    children: [
      jsxs('div', {
        className: 'pokedex-grid-header',
        children: [
          jsx('div', {
            className: 'location-section-title',
            children: 'Wild Pokemon',
          }),
          jsxs('div', {
            className: 'pokedex-header-actions',
            children: [
              jsx('button', {
                className: `effect-selector-btn repel-btn${applyingItem === 'repel' ? ' active-mode' : ''}${repelCount <= 0 ? ' disabled' : ''}`,
                onClick: () => {
                  ;(setApplyingItem((encounter) => (encounter === 'repel' ? null : 'repel')), setSelected(null))
                },
                disabled: repelCount <= 0 && applyingItem !== 'repel',
                title: 'Click then select a pokemon to apply Repel',
                children: applyingItem === 'repel' ? 'Applying...' : `Repel (${repelCount})`,
              }),
              jsx('button', {
                className: `effect-selector-btn honey-btn${applyingItem === 'honey' ? ' active-mode' : ''}${honeyCount <= 0 ? ' disabled' : ''}`,
                onClick: () => {
                  ;(setApplyingItem((encounter) => (encounter === 'honey' ? null : 'honey')), setSelected(null))
                },
                disabled: honeyCount <= 0 && applyingItem !== 'honey',
                title: 'Click then select a pokemon to apply Honey',
                children: applyingItem === 'honey' ? 'Applying...' : `Honey (${honeyCount})`,
              }),
              jsxs('button', {
                className: 'pokedex-settings-btn',
                onClick: onOpenCatchSettings,
                title: 'Catch Settings',
                children: [
                  jsx(PokeballIcon, {
                    ballId: 'pokeball',
                    size: 14,
                  }),
                  jsx('span', {
                    children: 'Catch',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      jsx('div', {
        className: `pokedex-grid${applyingItem ? ' selector-mode' : ''}`,
        children: sortedEncounters.map((encounter) => {
          const weightedRate = totalWeight > 0 ? (encounter.weight / totalWeight) * 100 : 0,
            tier = forceRarity ?? getRarityFromRate(weightedRate)
          return jsx(
            PokedexTile,
            {
              speciesKey: encounter.speciesKey,
              status: getStatus(encounter.speciesKey),
              rarity: tier,
              isSelected: selected === encounter.speciesKey,
              onClick: () => handleTileClick(encounter.speciesKey),
              isShinyCaught: state.shinyCaught.includes(encounter.speciesKey),
              activeEffect: activeEffectMap[encounter.speciesKey] ?? null,
              selectorMode: applyingItem,
            },
            encounter.speciesKey
          )
        }),
      }),
      selected &&
        selectedEncounter &&
        jsx(EncounterDetailPanel, {
          speciesKey: selected,
          encounter: selectedEncounter,
          rarity,
          rate,
          status: getStatus(selected),
          onClose: closeDetail,
          routeKey,
        }),
    ],
  })
}
