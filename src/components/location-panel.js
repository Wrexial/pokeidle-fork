// Split from a grouped component file — see tools/decompile/split-components.mjs

import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { martShopItems } from '../data/items.js'
import { encounterData, mapData, pokemonSpecies, regions, raidPoolFor } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { RouteEncounterGrid } from './route-encounter-grid.js'
import { ShopPanel } from './shop-panel.js'

/** @param {{ onOpenCatchSettings: () => void }} props */
export function LocationPanel({ onOpenCatchSettings }) {
  const { state, dispatch } = useGame(),
    location = mapData[state.currentLocation],
    nextLockedLocation = Object.values(mapData)
      .filter((candidateLocation) => {
        if (state.unlockedLocations.includes(candidateLocation.id)) return !1
        const unlockRule = candidateLocation.unlock
        return (
          unlockRule.battlesAtLocation !== void 0 ||
          unlockRule.badgesRequired !== void 0 ||
          unlockRule.championDefeated ||
          unlockRule.requires !== void 0 ||
          unlockRule.entry !== void 0
        )
      })
      .sort((left, right) => left.unlockOrder - right.unlockOrder)[0],
    badgeCount = state.defeatedGyms.length,
    routeKey = location?.routeKey,
    routeEncounters = routeKey ? encounterData[routeKey] : null
  if (!location) return null
  if (location.type === 'raid') {
    const locationId = state.raidLegendary ? pokemonSpecies[state.raidLegendary] : null
    return jsx('div', {
      className: 'location-panel-scroll',
      children: jsxs('div', {
        className: 'location-info raid-location-panel',
        children: [
          jsxs('div', {
            className: 'location-header',
            children: [
              jsx('span', {
                className: 'location-type-icon',
                children: '⚔️',
              }),
              jsxs('div', {
                children: [
                  jsx('div', {
                    className: 'location-name',
                    children: location.name,
                  }),
                  jsx('div', {
                    className: 'location-type-label',
                    children: 'Legendary Raid',
                  }),
                ],
              }),
            ],
          }),
          jsx('p', {
            className: 'location-description',
            children: location.description,
          }),
          locationId &&
            jsxs('div', {
              className: 'raid-legendary-info',
              children: [
                jsx('img', {
                  src: `/sprites/pokemon/${locationId.id}.png`,
                  alt: locationId.name,
                  className: 'raid-legendary-sprite',
                }),
                jsx('div', {
                  className: 'raid-legendary-name',
                  children: locationId.name,
                }),
              ],
            }),
          jsx(RouteEncounterGrid, {
            routeKey: location.id,
            encounters: raidPoolFor(location.region ?? 'kanto').map((legendary) => ({
              speciesKey: legendary.speciesKey,
              weight: 1,
              minLevel: legendary.level,
              maxLevel: legendary.level,
            })),
            onOpenCatchSettings: onOpenCatchSettings ?? (() => {}),
            forceRarity: 'very_rare',
          }),
          jsx('button', {
            className: 'raid-leave-btn',
            onClick: () =>
              dispatch({
                type: 'TRAVEL',
                payload: {
                  locationId: state.preRaidLocation || 'palletTown',
                },
              }),
            children: 'Leave Raid',
          }),
        ],
      }),
    })
  }
  return jsx('div', {
    className: 'location-panel-scroll',
    children: jsxs('div', {
      className: 'location-info',
      children: [
        jsxs('div', {
          className: 'location-header',
          children: [
            jsx('span', {
              className: 'location-type-icon',
              children: location.type === 'town' ? '🏠' : '🌿',
            }),
            jsxs('div', {
              children: [
                jsx('div', {
                  className: 'location-name',
                  children: location.name,
                }),
                jsx('div', {
                  className: 'location-type-label',
                  children: location.type === 'town' ? 'Town' : 'Route',
                }),
              ],
            }),
          ],
        }),
        jsx('p', {
          className: 'location-description',
          children: location.description,
        }),
        location.type === 'town' &&
          jsxs(Fragment, {
            children: [
              jsx('div', {
                className: 'location-status',
                children: jsx('span', {
                  className: 'location-status-label',
                  children: 'Trainer battles',
                }),
              }),
              (martShopItems[state.currentLocation] || location.mart) &&
                jsx(ShopPanel, {
                  shopDef: martShopItems[state.currentLocation] || location.mart,
                }),
            ],
          }),
        routeEncounters &&
          routeKey &&
          jsx(RouteEncounterGrid, {
            routeKey,
            encounters: routeEncounters.encounters,
            onOpenCatchSettings: onOpenCatchSettings ?? (() => {}),
          }),
        nextLockedLocation &&
          (() => {
            const unlockRule = nextLockedLocation.unlock,
              requirements = []
            if (unlockRule.battlesAtLocation)
              for (const requirement of unlockRule.battlesAtLocation) {
                const locationName = mapData[requirement.locationId]?.name ?? requirement.locationId,
                  wonCount = state.battlesWonByLocation[requirement.locationId] ?? 0
                requirements.push({
                  label: `Battles at ${locationName}`,
                  current: wonCount,
                  required: requirement.count,
                  met: wonCount >= requirement.count,
                })
              }
            return (
              unlockRule.badgesRequired &&
                requirements.push({
                  label: 'Badges',
                  current: badgeCount,
                  required: unlockRule.badgesRequired,
                  met: badgeCount >= unlockRule.badgesRequired,
                }),
              unlockRule.championDefeated &&
                requirements.push({
                  label: 'Beat Kanto Champion',
                  current: state.defeatedChampions.includes('kanto') ? 1 : 0,
                  required: 1,
                  met: state.defeatedChampions.includes('kanto'),
                }),
              unlockRule.requires &&
                unlockRule.requires.forEach((requiredId) =>
                  requirements.push({
                    label: `Reach ${mapData[requiredId]?.name ?? requiredId}`,
                    current: state.unlockedLocations.includes(requiredId) ? 1 : 0,
                    required: 1,
                    met: state.unlockedLocations.includes(requiredId),
                  })
                ),
              unlockRule.entry &&
                requirements.push({
                  label: unlockRule.previous
                    ? `Beat the ${
                        regions.find((region) => region.id === unlockRule.previous)?.name ??
                        unlockRule.previous
                      } Champion`
                    : 'Start in this region',
                  current: unlockRule.previous && state.defeatedChampions.includes(unlockRule.previous) ? 1 : 0,
                  required: 1,
                  met: !unlockRule.previous || state.defeatedChampions.includes(unlockRule.previous),
                }),
              jsxs('div', {
                className: 'location-next-unlock',
                children: [
                  jsx('div', {
                    className: 'location-section-title',
                    children: 'Next Unlock',
                  }),
                  jsx('div', {
                    className: 'location-unlock-name',
                    children: nextLockedLocation.name,
                  }),
                  jsx('div', {
                    className: 'location-unlock-checklist',
                    children: requirements.map((requirement, index) =>
                      jsxs(
                        'div',
                        {
                          className: `location-unlock-check${requirement.met ? ' met' : ''}`,
                          children: [
                            jsx('span', {
                              className: 'location-unlock-check-icon',
                              children: requirement.met ? '✓' : '○',
                            }),
                            jsx('span', {
                              className: 'location-unlock-check-label',
                              children:
                                requirement.met || requirement.label === 'Beat Champion'
                                  ? requirement.label
                                  : `${requirement.current}/${requirement.required} ${requirement.label.toLowerCase()}`,
                            }),
                          ],
                        },
                        index
                      )
                    ),
                  }),
                ],
              })
            )
          })(),
      ],
    }),
  })
}
