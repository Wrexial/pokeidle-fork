// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { BattleScreen } from './battle.js'
import { GymPanel, LocationPanel, TownMap } from './location.js'
import { BoxPanel, PartyBoxPanel, PartyPanel, StatsPanel } from './party.js'
import { CatchSettingsModal } from './settings.js'
import { BagPanel, RewardShopModal } from './shop.js'
import { MOBILE_TABS, SIDE_PANEL_TABS, evolutionItems, legendaryPool, starterSpecies } from '../data/constants.js'
import { encounterData, evolutionData, mapData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { calculatePokemonStats, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { checkShinyOdds } from '../game/progression.js'
import { useIsMobile } from '../hooks.js'

export function StarterSelect() {
  const { dispatch } = useGame()
  return jsxs('div', {
    className: 'starter-select',
    children: [
      jsx('h2', {
        className: 'starter-title',
        children: 'Choose Your Starter!',
      }),
      jsx('div', {
        className: 'starter-cards',
        children: starterSpecies.map((speciesKey) => {
          const species = pokemonSpecies[speciesKey],
            stats = calculatePokemonStats(species, 5, {
              hp: 15,
              attack: 15,
              defense: 15,
              spAttack: 15,
              spDefense: 15,
              speed: 15,
            })
          return jsxs(
            'div',
            {
              className: 'starter-card',
              onClick: () =>
                dispatch({
                  type: 'SELECT_STARTER',
                  payload: {
                    speciesKey,
                    isShiny: checkShinyOdds(),
                  },
                }),
              children: [
                jsx('img', {
                  src: getPokemonSpriteUrl(species.id),
                  onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                  alt: species.name,
                  className: 'starter-sprite',
                }),
                jsx('h3', {
                  children: species.name,
                }),
                jsx('div', {
                  className: 'starter-types',
                  children: species.types.map((type) =>
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
                jsxs('div', {
                  className: 'starter-stats',
                  children: [
                    jsxs('div', {
                      children: ['HP: ', stats.hp],
                    }),
                    jsxs('div', {
                      children: ['ATK: ', stats.attack],
                    }),
                    jsxs('div', {
                      children: ['DEF: ', stats.defense],
                    }),
                    jsxs('div', {
                      children: ['SP.A: ', stats.spAttack],
                    }),
                    jsxs('div', {
                      children: ['SP.D: ', stats.spDefense],
                    }),
                    jsxs('div', {
                      children: ['SPD: ', stats.speed],
                    }),
                  ],
                }),
                jsx('button', {
                  className: 'choose-btn',
                  children: 'Choose!',
                }),
              ],
            },
            speciesKey
          )
        }),
      }),
    ],
  })
}

function RightPanel() {
  const { state } = useGame(),
    [tab, setTab] = React.useState('location'),
    [showCatchSettings, setShowCatchSettings] = React.useState(!1),
    [showRewardShop, setShowRewardShop] = React.useState(!1),
    openCatchSettings = React.useCallback(() => setShowCatchSettings(!0), []),
    closeCatchSettings = React.useCallback(() => setShowCatchSettings(!1), []),
    openRewardShop = React.useCallback(() => setShowRewardShop(!0), []),
    closeRewardShop = React.useCallback(() => setShowRewardShop(!1), []),
    location = mapData[state.currentLocation],
    isRaid = location?.type === 'raid',
    routeKey = isRaid ? 'raidIsland' : location?.routeKey,
    raidEncounters = isRaid
      ? legendaryPool.map((encounter) => ({
          speciesKey: encounter.speciesKey,
          weight: 1,
          minLevel: encounter.level,
          maxLevel: encounter.level,
        }))
      : null,
    routeEncounters = routeKey && !isRaid ? encounterData[routeKey] : null,
    encounters = isRaid ? raidEncounters : routeEncounters?.encounters
  return jsxs('div', {
    className: 'side-panel right-panel',
    children: [
      jsx('div', {
        className: 'tab-bar',
        children: SIDE_PANEL_TABS.map((tabDef) =>
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
      jsx('div', {
        className: 'panel-content',
        children:
          tab === 'location'
            ? jsx(LocationPanel, {
                onOpenCatchSettings: openCatchSettings,
              })
            : tab === 'gym'
              ? jsx(GymPanel, {
                  onOpenShop: openRewardShop,
                })
              : null,
      }),
      jsx(BagPanel, {}),
      showCatchSettings &&
        encounters &&
        routeKey &&
        jsx(CatchSettingsModal, {
          routeKey,
          encounters,
          onClose: closeCatchSettings,
        }),
      showRewardShop &&
        jsx(RewardShopModal, {
          onClose: closeRewardShop,
        }),
    ],
  })
}

function MobileTabs() {
  const { state, dispatch } = useGame(),
    [tab, setTab] = React.useState('party'),
    [inspected, setInspected] = React.useState(null),
    [releaseConfirm, setReleaseConfirm] = React.useState(null),
    [boxInspected, setBoxInspected] = React.useState(null),
    [boxReleaseConfirm, setBoxReleaseConfirm] = React.useState(null),
    [locationTab, setLocationTab] = React.useState('location'),
    [showCatchSettings, setShowCatchSettings] = React.useState(!1),
    [showRewardShop, setShowRewardShop] = React.useState(!1),
    location = mapData[state.currentLocation],
    isRaid = location?.type === 'raid',
    routeKey = isRaid ? 'raidIsland' : location?.routeKey,
    raidEncounters = isRaid
      ? legendaryPool.map((encounter) => ({
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
      const evolutionChain = evolutionData[boxPokemon.speciesKey]
      if (evolutionChain)
        return {
          entries: evolutionChain.map((evolution) => {
            const targetSpecies = pokemonSpecies[evolution.into],
              levelMet = !evolution.level || boxPokemon.level >= evolution.level,
              itemOwned = !evolution.item || (state.inventory[evolution.item] ?? 0) > 0,
              canEvolve = levelMet && itemOwned,
              requirementParts = []
            if ((evolution.level && requirementParts.push(`Lv. ${evolution.level}`), evolution.item)) {
              const evolutionEntry = evolution.item in evolutionItems ? evolutionItems[evolution.item].name : evolution.item
              requirementParts.push(evolutionEntry)
            }
            return {
              targetName: targetSpecies?.name ?? evolution.into,
              canEvolve,
              requirementLabel: requirementParts.join(' + ') || 'Ready',
              targetKey: evolution.into,
              itemId: evolution.item,
            }
          }),
        }
    }, [boxPokemon, state.phase, state.inventory]),
    handleEvolve = React.useCallback(
      (evolutionEntry) => {
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
            jsxs('div', {
              className: 'mobile-location-wrapper',
              children: [
                jsxs('div', {
                  className: 'tab-bar',
                  children: [
                    jsx('button', {
                      className: `tab-btn${locationTab === 'location' ? ' active' : ''}`,
                      onClick: () => setLocationTab('location'),
                      children: 'Location',
                    }),
                    jsx('button', {
                      className: `tab-btn${locationTab === 'gym' ? ' active' : ''}`,
                      onClick: () => setLocationTab('gym'),
                      children: 'Gyms',
                    }),
                  ],
                }),
                jsx('div', {
                  className: 'panel-content',
                  children:
                    locationTab === 'location'
                      ? jsx(LocationPanel, {
                          onOpenCatchSettings: () => setShowCatchSettings(!0),
                        })
                      : jsx(GymPanel, {
                          onOpenShop: () => setShowRewardShop(!0),
                        }),
                }),
                jsx(BagPanel, {}),
              ],
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
      showRewardShop &&
        jsx(RewardShopModal, {
          onClose: () => setShowRewardShop(!1),
        }),
    ],
  })
}

export function GameLayout() {
  return useIsMobile()
    ? jsxs('div', {
        className: 'game-layout mobile',
        children: [jsx(BattleScreen, {}), jsx(MobileTabs, {})],
      })
    : jsxs('div', {
        className: 'game-layout',
        children: [
          jsx(PartyBoxPanel, {}),
          jsxs('div', {
            className: 'center-column',
            children: [jsx(BattleScreen, {}), jsx(TownMap, {})],
          }),
          jsx(RightPanel, {}),
        ],
      })
}
