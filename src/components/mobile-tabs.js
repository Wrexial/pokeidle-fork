// Split from a grouped component file.

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { MOBILE_TABS, biomeForLocation } from '../data/ui.js'
import { encounterData, raidPoolFor, mapData } from '../data/gameData.js'
import { effectiveWeatherAt } from '../game/weather.js'
import { useGame } from '../game/context.js'
import { useUi } from '../game/ui-context.js'
import { getEvolutionOptions } from '../game/breeding.js'
import { LocationPanel } from './location-panel.js'
import { TownMap } from './town-map.js'
import { BoxPanel } from './box-panel.js'
import { PartyPanel } from './party-panel.js'
import { StatsPanel } from './stats-panel.js'
import { CatchSettingsModal } from './catch-settings-modal.js'
import { HuntModal } from './hunt-panel.js'
import { BackpackPanel } from './backpack-panel.js'
import { BattleLog } from './battle-log.js'

export function MobileTabs() {
  const { state, dispatch } = useGame(),
    { mapRequest } = useUi(),
    [tab, setTab] = React.useState('party'),
    [inspected, setInspected] = React.useState(/** @type {{ source: string, id: string } | null} */ (null)),
    [releaseConfirm, setReleaseConfirm] = React.useState(/** @type {string | null} */ (null)),
    [boxInspected, setBoxInspected] = React.useState(/** @type {{ source: string, id: string } | null} */ (null)),
    [boxReleaseConfirm, setBoxReleaseConfirm] = React.useState(/** @type {string | null} */ (null)),
    [showCatchSettings, setShowCatchSettings] = React.useState(!1),
    [showHunt, setShowHunt] = React.useState(!1),
    location = mapData[state.currentLocation],
    isRaid = location?.type === 'raid',
    routeKey = isRaid ? location?.id : location?.routeKey,
    raidEncounters = isRaid
      ? raidPoolFor(location?.region ?? 'kanto', state).map((encounter) => ({
          speciesKey: encounter.speciesKey,
          weight: 1,
          minLevel: encounter.level,
          maxLevel: encounter.level,
        }))
      : null,
    routeEncounters = routeKey && !isRaid ? encounterData[routeKey] : null,
    encounters = isRaid ? raidEncounters : routeEncounters?.encounters,
    boxPokemon = boxInspected ? (state.box.find((memberId) => memberId.id === boxInspected.id) ?? null) : null,
    boxIndex = boxPokemon ? state.box.findIndex((member) => member.id === boxPokemon.id) : -1,
    // Touch layouts have no drag-and-drop, so the inspected panel carries
    // explicit up/down reorder controls for the Box.
    reorderBox = React.useCallback(
      /** @param {number} toIndex */ (toIndex) => {
        if (!boxPokemon) return
        dispatch({
          type: 'REORDER_BOX',
          payload: {
            pokemonId: boxPokemon.id,
            toIndex,
          },
        })
      },
      [boxPokemon, dispatch]
    ),
    moveBoxToParty = React.useCallback(() => {
      if (!boxInspected) return
      const boxIndex = state.box.findIndex((member) => member.id === boxInspected.id)
      boxIndex < 0 ||
        (dispatch({
          type: 'BOX_TO_PARTY',
          payload: {
            boxIndex,
          },
        }),
        setBoxInspected(null),
        setBoxReleaseConfirm(null))
    }, [boxInspected, state.box, dispatch]),
    evolutionInfo = React.useMemo(() => {
      if (!boxPokemon || state.phase === 'evolving') return
      // Field evolutions (Moss Rock, Magnetic Field, rain, ...) are checked
      // against the location the player is standing at right now.
      return {
        entries: getEvolutionOptions(boxPokemon, state.inventory, {
          locationId: location?.id ?? state.currentLocation,
          locationName: location?.name ?? '',
          biome: biomeForLocation(location),
          weather: effectiveWeatherAt(location, state.lingeringWeather),
        }),
      }
    }, [
      boxPokemon,
      state.phase,
      state.inventory,
      location,
      state.currentLocation,
      state.lingeringWeather,
    ]),
    handleEvolve = React.useCallback(
      /** @param {any} evolutionEntry */ (evolutionEntry) => {
        if (!boxPokemon || !evolutionInfo) return
        const evolution = evolutionInfo.entries[evolutionEntry]
        evolution.canEvolve &&
          (dispatch({
            type: 'START_EVOLUTION',
            payload: {
              pokemonId: boxPokemon.id,
              fromSpeciesKey: boxPokemon.speciesKey,
              toSpeciesKey: evolution.targetKey,
              consumeItem: evolution.itemId,
              isForm: evolution.isForm,
            },
          }),
          setBoxInspected(null))
      },
      [boxPokemon, evolutionInfo, dispatch]
    ),
    requestRelease = React.useCallback(() => {
      boxPokemon && setBoxReleaseConfirm(boxPokemon.id)
    }, [boxPokemon]),
    confirmRelease = React.useCallback(() => {
      boxReleaseConfirm &&
        (dispatch({
          type: 'RELEASE_POKEMON',
          payload: {
            pokemonId: boxReleaseConfirm,
            source: 'box',
          },
        }),
        setBoxInspected(null),
        setBoxReleaseConfirm(null))
    }, [boxReleaseConfirm, dispatch]),
    releaseTarget = boxReleaseConfirm ? (state.box.find((locationId) => locationId.id === boxReleaseConfirm) ?? null) : null
  // The unlock popup raises a map request when a Champion win pays out an
  // Unlock Token; on phones the map is a tab, so swap to it.
  React.useEffect(() => {
    if (mapRequest > 0) setTab('map')
  }, [mapRequest])
  return jsxs('div', {
    className: 'mobile-tabs',
    children: [
      jsx('div', {
        className: 'tab-bar mobile-tab-bar',
        children: MOBILE_TABS.map((tabDef) =>
          jsx(
            'button',
            {
              className: `tab-btn${tab === tabDef.id ? ' active' : ''}`,
              onClick: () => setTab(tabDef.id),
              children: tabDef.label,
            },
            tabDef.id
          )
        ),
      }),
      jsxs('div', {
        className: 'mobile-tab-content',
        children: [
          tab === 'map' && jsx(TownMap, {}),
          tab === 'party' &&
            jsx('div', {
              className: 'mobile-party-wrapper',
              children: jsx(PartyPanel, {
                inspected,
                setInspected,
                releaseConfirm,
                setReleaseConfirm,
              }),
            }),
          tab === 'box' &&
            jsxs('div', {
              className: 'mobile-box-wrapper',
              children: [
                jsx(BoxPanel, {
                  inspected: boxInspected,
                  setInspected: setBoxInspected,
                  setReleaseConfirm: setBoxReleaseConfirm,
                }),
                boxInspected &&
                  boxPokemon &&
                  jsxs(Fragment, {
                    children: [
                      jsx(StatsPanel, {
                        pokemon: boxPokemon,
                        source: 'box',
                        partyLength: state.party.length,
                        onAction: moveBoxToParty,
                        onClose: () => {
                          ;(setBoxInspected(null), setBoxReleaseConfirm(null))
                        },
                        evolutionInfo,
                        onEvolve: handleEvolve,
                        onRelease: requestRelease,
                        canRelease: !boxReleaseConfirm,
                        reorder:
                          boxIndex >= 0
                            ? {
                                index: boxIndex,
                                length: state.box.length,
                                onMove: reorderBox,
                              }
                            : null,
                      }),
                      boxReleaseConfirm &&
                        releaseTarget &&
                        jsxs('div', {
                          className: 'release-confirm',
                          children: [
                            jsxs('span', {
                              children: ['Release ', releaseTarget.name, '?'],
                            }),
                            jsxs('div', {
                              className: 'release-confirm-buttons',
                              children: [
                                jsx('button', {
                                  className: 'release-confirm-yes',
                                  onClick: confirmRelease,
                                  children: 'Yes',
                                }),
                                jsx('button', {
                                  className: 'release-confirm-no',
                                  onClick: () => setBoxReleaseConfirm(null),
                                  children: 'No',
                                }),
                              ],
                            }),
                          ],
                        }),
                    ],
                  }),
              ],
            }),
          tab === 'location' &&
            jsx('div', {
              className: 'mobile-location-wrapper',
              children: jsx('div', {
                className: 'panel-content',
                children: jsx(LocationPanel, {
                  onOpenCatchSettings: () => setShowCatchSettings(!0),
                  onOpenHunt: () => setShowHunt(!0),
                }),
              }),
            }),
          tab === 'backpack' &&
            jsx('div', {
              className: 'mobile-backpack-wrapper',
              children: jsx(BackpackPanel, {}),
            }),
          tab === 'log' &&
            jsx('div', {
              className: 'mobile-log-wrapper',
              children: jsx(BattleLog, {}),
            }),
        ],
      }),
      showCatchSettings &&
        encounters &&
        routeKey &&
        jsx(CatchSettingsModal, {
          routeKey,
          encounters,
          onClose: () => setShowCatchSettings(!1),
        }),
      showHunt && jsx(HuntModal, { onClose: () => setShowHunt(!1) }),
    ],
  })
}
