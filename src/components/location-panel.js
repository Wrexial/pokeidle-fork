// Split from a grouped component file — see tools/decompile/split-components.mjs

import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { martShopItems } from '../data/items.js'
import { encounterData, gymLeaderData, mapData, pokemonSpecies, regions, raidPoolFor } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { computeUnlockedLocations } from '../game/progression.js'
import { RouteEncounterGrid } from './route-encounter-grid.js'
import { ShopPanel } from './shop-panel.js'

/** How many upcoming unlocks the panel lists at once. When the current
 * region is fully unlocked the "frontier" is empty, and falling back to every
 * locked location on the map (hundreds) would lock up the main thread. */
const NEXT_UNLOCK_LIMIT = 5

/** @param {{ onOpenCatchSettings: () => void }} props */
export function LocationPanel({ onOpenCatchSettings }) {
  const { state, dispatch } = useGame(),
    unlockedNow = computeUnlockedLocations(state),
    location = mapData[state.currentLocation],
    // Every locked location on the player's frontier (adjacent to somewhere
    // already unlocked). Several can become available at once — a town with two
    // routes, a badge gate plus its neighbour — so list them all instead of one
    // "next" the game can leap past.
    frontierLockedLocations = (() => {
      const unlockedSet = new Set(unlockedNow)
      const candidates = Object.values(mapData).filter((candidateLocation) => {
        if (unlockedSet.has(candidateLocation.id)) return false
        const unlockRule = candidateLocation.unlock
        return (
          unlockRule.battlesAtLocation !== void 0 ||
          unlockRule.badgesRequired !== void 0 ||
          unlockRule.gymsRequired !== void 0 ||
          unlockRule.championDefeated ||
          unlockRule.requires !== void 0 ||
          unlockRule.entry !== void 0
        )
      })
      const frontier = candidates.filter((candidateLocation) =>
        candidateLocation.connections.some((connectionId) => unlockedSet.has(connectionId))
      )
      const upcoming = frontier.length ? frontier : candidates
      return upcoming
        .sort((left, right) => left.unlockOrder - right.unlockOrder)
        .slice(0, NEXT_UNLOCK_LIMIT)
    })(),
    badgeCount = state.defeatedGyms.length,
    routeKey = location?.routeKey,
    routeEncounters = routeKey ? encounterData[routeKey] : null
  if (!location) return null

  /**
   * Whether a location is somewhere the player can travel to right now.
   * @param {string | null | undefined} locationId
   * @returns {boolean}
   */
  function isTravelable(locationId) {
    return Boolean(
      locationId &&
        locationId !== state.currentLocation &&
        state.unlockedLocations.includes(locationId) &&
        mapData[locationId]?.type !== 'raid'
    )
  }

  /** @param {string} locationId */
  function travelToTarget(locationId) {
    if (isTravelable(locationId))
      dispatch({
        type: 'TRAVEL',
        payload: {
          locationId,
        },
      })
  }

  /**
   * The next gym of a region the player still has to beat — where a
   * `badgesRequired` unlock sends them.
   * @param {string} regionId
   * @returns {string | null}
   */
  function nextGymLocationId(regionId) {
    const nextGym = gymLeaderData.find(
      (gym) =>
        (gym.region ?? 'kanto') === regionId &&
        !state.defeatedGyms.includes(gym.id) &&
        gym.locationKey &&
        mapData[gym.locationKey]
    )
    return nextGym?.locationKey ?? null
  }

  /**
   * @param {MapLocation} target
   * @returns {{ label: string, detail?: string, current: number, required: number, met: boolean, locationId?: string | null }[]}
   */
  function unlockRequirements(target) {
    const unlockRule = target.unlock || {},
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
          locationId: requirement.locationId,
        })
      }
    if (unlockRule.badgesRequired)
      requirements.push({
        label: 'Badges',
        current: badgeCount,
        required: unlockRule.badgesRequired,
        met: badgeCount >= unlockRule.badgesRequired,
        locationId: nextGymLocationId(target.region ?? 'kanto'),
      })
    if (unlockRule.caughtCount)
      requirements.push({
        label: 'Pokemon caught',
        current: state.pokedexCaught.length,
        required: unlockRule.caughtCount,
        met: state.pokedexCaught.length >= unlockRule.caughtCount,
      })
    if (unlockRule.caughtOnRoute) {
      const requiredSpecies = unlockRule.caughtOnRoute.species,
        routeName = mapData[unlockRule.caughtOnRoute.routeKey]?.name ?? 'this route',
        caughtSet = new Set(
          requiredSpecies.filter((speciesKey) => state.pokedexCaught.includes(speciesKey))
        ),
        caughtHere = caughtSet.size,
        // Name the species so the player knows exactly what to hunt; the ✓
        // marks the ones already caught.
        detail = requiredSpecies
          .map(
            (speciesKey) =>
              `${caughtSet.has(speciesKey) ? '✓ ' : ''}${pokemonSpecies[speciesKey]?.name ?? speciesKey}`
          )
          .join(', ')
      requirements.push({
        label: `${routeName} ${unlockRule.caughtOnRoute.count === 1 ? 'exclusive' : 'exclusives'} caught`,
        detail,
        current: caughtHere,
        required: unlockRule.caughtOnRoute.count,
        met: caughtHere >= unlockRule.caughtOnRoute.count,
        locationId: unlockRule.caughtOnRoute.routeKey,
      })
    }
    if (unlockRule.partyLevel) {
      const highestLevel = state.party.reduce((max, member) => Math.max(max, member.level), 0)
      requirements.push({
        label: 'Team level',
        current: highestLevel,
        required: unlockRule.partyLevel,
        met: highestLevel >= unlockRule.partyLevel,
      })
    }
    if (unlockRule.gymsRequired)
      for (const gymId of unlockRule.gymsRequired) {
        const gym = gymLeaderData.find((candidate) => candidate.id === gymId),
          beaten = state.defeatedGyms.includes(gymId)
        requirements.push({
          label: `Beat ${gym?.name ?? gymId}`,
          current: beaten ? 1 : 0,
          required: 1,
          met: beaten,
          locationId: gym?.locationKey ?? null,
        })
      }
    if (unlockRule.championDefeated) {
      const requiredRegion =
        unlockRule.championDefeated === true ? 'kanto' : unlockRule.championDefeated
      requirements.push({
        label: `Beat the ${
          regions.find((region) => region.id === requiredRegion)?.name ?? requiredRegion
        } Champion`,
        current: state.defeatedChampions.includes(requiredRegion) ? 1 : 0,
        required: 1,
        met: state.defeatedChampions.includes(requiredRegion),
        locationId: regions.find((region) => region.id === requiredRegion)?.leagueLocationKey ?? null,
      })
    }
    if (unlockRule.requires)
      unlockRule.requires.forEach((requiredId) =>
        requirements.push({
          label: `Reach ${mapData[requiredId]?.name ?? requiredId}`,
          current: state.unlockedLocations.includes(requiredId) ? 1 : 0,
          required: 1,
          met: state.unlockedLocations.includes(requiredId),
          locationId: requiredId,
        })
      )
    if (unlockRule.entry) {
      const entryRegionId = target.region ?? 'kanto',
        isStartRegion = state.startRegion === entryRegionId,
        regionOpen = state.unlockedRegions.includes(entryRegionId)
      requirements.push({
        label: isStartRegion
          ? 'Start in this region'
          : `Open ${
              regions.find((region) => region.id === entryRegionId)?.name ?? entryRegionId
            } with an Unlock Token`,
        current: regionOpen ? 1 : 0,
        required: 1,
        met: isStartRegion || regionOpen,
        locationId: null,
      })
    }
    return requirements
  }
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
        frontierLockedLocations.length > 0 &&
          jsxs('div', {
            className: 'location-next-unlock',
            children: [
              jsx('div', {
                className: 'location-section-title',
                children:
                  frontierLockedLocations.length > 1 ? 'Next Unlocks' : 'Next Unlock',
              }),
              frontierLockedLocations.map((nextLockedLocation) => {
                const requirements = unlockRequirements(nextLockedLocation),
                  primaryRequirement = requirements.find(
                    (requirement) => !requirement.met && isTravelable(requirement.locationId)
                  ),
                  primaryTarget = primaryRequirement?.locationId ?? null
                return jsxs(
                  'div',
                  {
                    className: `location-unlock-entry${primaryTarget ? ' clickable' : ''}`,
                    onClick: primaryTarget ? () => travelToTarget(primaryTarget) : void 0,
                    title: primaryTarget
                      ? `Travel to ${mapData[primaryTarget]?.name ?? primaryTarget}`
                      : void 0,
                    children: [
                      jsx('div', {
                        className: 'location-unlock-name',
                        children: nextLockedLocation.name,
                      }),
                      jsx('div', {
                        className: 'location-unlock-checklist',
                        children: requirements.map((requirement, index) => {
                          const targetLocationId =
                            !requirement.met && isTravelable(requirement.locationId)
                              ? /** @type {string} */ (requirement.locationId)
                              : null
                          return jsxs(
                            'div',
                            {
                              className: `location-unlock-check${requirement.met ? ' met' : ''}${targetLocationId ? ' clickable' : ''}`,
                              onClick: targetLocationId
                                ? /** @param {{ stopPropagation: () => void }} event */ (event) => {
                                    event.stopPropagation()
                                    travelToTarget(targetLocationId)
                                  }
                                : void 0,
                              title: targetLocationId
                                ? `Travel to ${mapData[targetLocationId]?.name ?? targetLocationId}`
                                : void 0,
                              children: [
                                jsxs('div', {
                                  className: 'location-unlock-check-row',
                                  children: [
                                    jsx('span', {
                                      className: 'location-unlock-check-icon',
                                      children: requirement.met ? '✓' : targetLocationId ? '→' : '○',
                                    }),
                                    jsx('span', {
                                      className: 'location-unlock-check-label',
                                      children: requirement.met
                                        ? requirement.label
                                        : requirement.required > 1
                                          ? `${requirement.current}/${requirement.required} ${requirement.label.toLowerCase()}`
                                          : requirement.label,
                                    }),
                                  ],
                                }),
                                requirement.detail &&
                                  jsx('div', {
                                    className: 'location-unlock-check-detail',
                                    children: requirement.detail,
                                  }),
                              ],
                            },
                            index
                          )
                        }),
                      }),
                    ],
                  },
                  nextLockedLocation.id
                )
              }),
            ],
          }),
      ],
    }),
  })
}
