// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { MOBILE_TABS } from '../data/ui.js'
import { encounterData, raidPoolFor, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getEvolutionOptions } from '../game/breeding.js'
import { LocationPanel } from './location-panel.js'
import { TownMap } from './town-map.js'
import { BoxPanel } from './box-panel.js'
import { PartyPanel } from './party-panel.js'
import { StatsPanel } from './stats-panel.js'
import { CatchSettingsModal } from './catch-settings-modal.js'

export function MobileTabs() {
  const { state, dispatch } = useGame(),
    [tab, setTab] = React.useState('party'),
    [inspected, setInspected] = React.useState(/** @type {{ source: string, id: string } | null} */ (null)),
    [releaseConfirm, setReleaseConfirm] = React.useState(/** @type {string | null} */ (null)),
    [boxInspected, setBoxInspected] = React.useState(/** @type {{ source: string, id: string } | null} */ (null)),
    [boxReleaseConfirm, setBoxReleaseConfirm] = React.useState(/** @type {string | null} */ (null)),
    [showCatchSettings, setShowCatchSettings] = React.useState(!1),
    location = mapData[state.currentLocation],
    isRaid = location?.type === 'raid',
    routeKey = isRaid ? location?.id : location?.routeKey,
    raidEncounters = isRaid
      ? raidPoolFor(location?.region ?? 'kanto').map((encounter) => ({
          speciesKey: encounter.speciesKey,
          weight: 1,
          minLevel: encounter.level,
          maxLevel: encounter.level,
        }))
      : null,
    routeEncounters = routeKey && !isRaid ? encounterData[routeKey] : null,
    encounters = isRaid ? raidEncounters : routeEncounters?.encounters,
    boxPokemon = boxInspected ? (state.box.find((memberId) => memberId.id === boxInspected.id) ?? null) : null,
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
      return { entries: getEvolutionOptions(boxPokemon, state.inventory) }
    }, [boxPokemon, state.phase, state.inventory]),
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
                }),
              }),
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
    ],
  })
}
