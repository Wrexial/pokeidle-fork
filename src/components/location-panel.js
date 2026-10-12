// Split from a grouped component file.

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { BATTLE_TOWER_LOCATION } from '../data/config.js'
import { martShopItems } from '../data/items.js'
import { encounterData, gymLeaderData, mapData, pokemonSpecies, regions, raidPoolFor } from '../data/gameData.js'
import { areaInfoFor } from '../data/ui.js'
import { MINIGAME_AREAS, MINIGAME_INFO, MINIGAME_LOCATIONS, MINIGAME_START_ACTION, MINIGAME_TUTORIALS, ROUTE_ACTIVITIES, ROUTE_ACTIVITY_TUTORIALS, activityConditionLabel, activityConditionMatches, bestRodId, nextRod, rodForId, routeActivityIds } from '../game/minigames.js'
import { dayPhaseAt } from '../game/day-night.js'
import { effectiveWeatherAt } from '../game/weather.js'
import { masteryProgress } from '../game/route-mastery.js'
import { useGame } from '../game/context.js'
import { computeUnlockedLocations, frontierUnlocks, minigameRequirementMet, regionProgressionGoal, unlockBlockers } from '../game/progression.js'
import { servicePoisFor, cafeFor } from '../game/services.js'
import { MinigameCard } from './minigame-card.js'
import { JobControls } from './job-controls.js'
import { FieldJobsModal } from './field-jobs-modal.js'
import { GiftPanel } from './gift-panel.js'
import { FossilPanel } from './fossil-panel.js'
import { BattleTowerPanel } from './battle-tower-panel.js'
import { BattleFrontierPanel } from './battle-frontier-panel.js'
import { HuntBar } from './hunt-panel.js'
import { GymLocationPanel } from './gym-location-panel.js'
import { RivalPanel } from './rival-panel.js'
import { LegendaryQuestPanel } from './legendary-quest-panel.js'
import { LeagueLocationPanel } from './league-location-panel.js'
import { DaycarePanel } from './daycare-panel.js'
import { KurtPanel } from './kurt-panel.js'
import { RouteEncounterGrid } from './route-encounter-grid.js'
import { ShopPanel } from './shop-panel.js'
import { CafePanel } from './cafe-panel.js'

/** @param {{ onOpenCatchSettings: () => void, onOpenHunt?: () => void }} props */
export function LocationPanel({ onOpenCatchSettings, onOpenHunt }) {
  const { state, dispatch } = useGame(),
    // Which zone sub-area's wild table is expanded on the hub panel (only one
    // at a time, so a 10+ area zone stays readable).
    [expandedZoneArea, setExpandedZoneArea] = React.useState(
      /** @type {string | null} */ (null)
    ),
    // Whether the areas on the frontier that are still waiting on another
    // locked area are shown. They are tucked behind a toggle so they don't bury
    // the gates the player can actually work towards.
    [showBlockedGates, setShowBlockedGates] = React.useState(false),
    // The Field Jobs summary modal (see job-controls.js / field-jobs-modal.js).
    [showJobs, setShowJobs] = React.useState(false),
    unlockedNow = computeUnlockedLocations(state),
    unlockedNowSet = new Set(unlockedNow),
    location = mapData[state.currentLocation],
    jobCount = Object.keys(state.jobs ?? {}).length,
    // Every locked location on the current region's frontier (adjacent to
    // somewhere already unlocked), soonest first. Several can become available
    // at once — a town with two routes, a badge gate plus its neighbour — so
    // list them all instead of one "next" the game can leap past. Scoped to
    // the region the player is standing in: `unlockOrder` is generation-
    // prefixed, so a map-wide list let an earlier region crowd the current
    // one's gates (Sinnoh, Alola, Paldea) out of the panel.
    frontierGates = frontierUnlocks(unlockedNow, location?.region ?? 'kanto').map(
      (nextLocation) => ({ nextLocation, blockers: unlockBlockers(nextLocation, unlockedNowSet) })
    ),
    // A frontier area waits on another locked area (a route behind a route, a
    // zone sub-area behind its predecessor, ...) when it has blockers; those
    // are hidden until asked for, so the panel only headlines what the player
    // can do now.
    actionableGates = frontierGates.filter((entry) => entry.blockers.length === 0),
    blockedGates = frontierGates.filter((entry) => entry.blockers.length > 0),
    // If there is nothing actionable, the blocked areas are the whole story, so
    // show them without the extra click.
    blockedGatesExpanded = showBlockedGates || actionableGates.length === 0,
    // When nothing in the current region is on the frontier the region is
    // finished, so point at its Champion (or a banked Unlock Token) rather than
    // surfacing a locked region the player cannot reach yet (Kanto, if they
    // started elsewhere).
    regionGoal =
      frontierGates.length === 0
        ? regionProgressionGoal(state, location?.region ?? 'kanto')
        : null,
    routeKey = location?.routeKey,
    routeEncounters = routeKey ? encounterData[routeKey] : null,
    servicePois = servicePoisFor(location?.id),
    cafe = cafeFor(location?.id),
    // The "Next Unlocks" block is useful from a zone hub too, not just a
    // normal location, so it is built once and rendered by both branches.
    nextUnlocksSection = regionGoal
      ? jsxs('div', {
          className: 'location-next-unlock location-region-goal',
          children: [
            jsx('div', {
              className: 'location-section-title',
              children: 'Next Goal',
            }),
            jsxs('div', {
              className: `location-unlock-entry${
                regionGoal.locationId && isTravelable(regionGoal.locationId) ? ' clickable' : ''
              }`,
              onClick:
                regionGoal.locationId && isTravelable(regionGoal.locationId)
                  ? () => travelToTarget(regionGoal.locationId ?? '')
                  : void 0,
              title:
                regionGoal.locationId && isTravelable(regionGoal.locationId)
                  ? `Travel to ${mapData[regionGoal.locationId]?.name ?? regionGoal.locationId}`
                  : void 0,
              children: [
                jsx('div', {
                  className: 'location-unlock-name',
                  children: regionGoal.title,
                }),
                jsx('div', {
                  className: 'location-unlock-checklist',
                  children: jsx('div', {
                    className: 'location-unlock-check',
                    children: jsxs('div', {
                      className: 'location-unlock-check-row',
                      children: [
                        jsx('span', {
                          className: 'location-unlock-check-icon',
                          children: regionGoal.locationId ? '\u2192' : '\u{1f5dd}\ufe0f',
                        }),
                        jsx('span', {
                          className: 'location-unlock-check-label',
                          children: regionGoal.detail,
                        }),
                      ],
                    }),
                  }),
                }),
              ],
            }),
          ],
        })
      : frontierGates.length > 0
        ? jsxs('div', {
            className: 'location-next-unlock',
            children: [
              actionableGates.length > 0 &&
                jsx('div', {
                  className: 'location-section-title',
                  children: actionableGates.length > 1 ? 'Next Unlocks' : 'Next Unlock',
                }),
              actionableGates.map(({ nextLocation: nextLockedLocation }) => {
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
              blockedGates.length > 0 &&
                jsxs('div', {
                  className: 'location-unlock-blocked',
                  children: [
                    actionableGates.length > 0 &&
                      jsx('button', {
                        className: 'location-unlock-blocked-toggle',
                        onClick: () => setShowBlockedGates((shown) => !shown),
                        children: `${blockedGatesExpanded ? '\u25be Hide' : '\u25b8'} ${blockedGates.length} blocked area${
                          blockedGates.length === 1 ? '' : 's'
                        }`,
                      }),
                    blockedGatesExpanded &&
                      blockedGates.map(({ nextLocation: blockedLocation, blockers }) =>
                        jsxs(
                          'div',
                          {
                            className: 'location-unlock-entry blocked',
                            children: [
                              jsxs('div', {
                                className: 'location-unlock-name',
                                children: ['\u{1f512} ', blockedLocation.name],
                              }),
                              jsx('div', {
                                className: 'location-unlock-checklist',
                                children: jsx('div', {
                                  className: 'location-unlock-check blocked',
                                  children: jsxs('div', {
                                    className: 'location-unlock-check-row',
                                    children: [
                                      jsx('span', {
                                        className: 'location-unlock-check-icon',
                                        children: '\u2190',
                                      }),
                                      jsx('span', {
                                        className: 'location-unlock-check-label',
                                        children: `Waiting on ${blockers
                                          .map((id) => mapData[id]?.name ?? id)
                                          .join(', ')}`,
                                      }),
                                    ],
                                  }),
                                }),
                              }),
                            ],
                          },
                          blockedLocation.id
                        )
                      ),
                  ],
                }),
            ],
          })
        : null
  if (!location) return null

  // The minigame or route activity played from here. Fixed minigames live at a
  // single POI; route activities depend on the terrain (water, undergrowth).
  const fixedMinigameId = MINIGAME_LOCATIONS[location.id],
    fixedMinigame = fixedMinigameId ? MINIGAME_INFO[fixedMinigameId] : null,
    activityIds = routeActivityIds(location),
    mastery = masteryProgress(state, location.id),
    activityConditionContext = {
      time: /** @type {'day' | 'night'} */ (dayPhaseAt().isNight ? 'night' : 'day'),
      weather: effectiveWeatherAt(location, state.lingeringWeather) ?? null,
    },
    minigameBusy = [
      'evolving',
      'healing',
      'catching',
      'bugCatching',
      'safari',
      'academyQuiz',
      'mining',
      'gameCorner',
      'routeActivity',
      'wonderTrade',
    ].includes(state.phase),
    bestRod = rodForId(bestRodId(state.rods)),
    upcomingRod = nextRod(state.rods),
    // The fixed minigame card is shared by the normal panel and the zone-hub
    // panel, since some minigames (Galar's Rotom Rally, Paldea's Ogre Oustin'
    // and Tera Raid) are based at a zone hub.
    fixedMinigameCard =
      fixedMinigame &&
      jsx(MinigameCard, {
        icon: '⭐',
        title: fixedMinigame.title,
        hint: fixedMinigame.hint,
        steps: MINIGAME_TUTORIALS[fixedMinigameId],
        actionLabel:
          state.money < fixedMinigame.cost
            ? 'NOT ENOUGH MONEY'
            : fixedMinigame.cost > 0
              ? `${fixedMinigame.action} ($${fixedMinigame.cost.toLocaleString()})`
              : fixedMinigame.action,
        disabled: minigameBusy || state.money < fixedMinigame.cost,
        onStart: () => dispatch({ type: MINIGAME_START_ACTION[fixedMinigameId] }),
      })

  /**
   * Whether a location is somewhere the player can travel to right now.
   * @param {string | null | undefined} locationId
   * @returns {boolean}
   */
  function isTravelable(locationId) {
    return Boolean(
      locationId &&
        locationId !== state.currentLocation &&
        unlockedNowSet.has(locationId) &&
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
    if (unlockRule.badgesRequired) {
      const regionId = target.region ?? 'kanto',
        // Count only this region's badges, matching computeUnlockedLocations.
        regionBadgeCount = gymLeaderData.filter(
          (gym) => (gym.region ?? 'kanto') === regionId && state.defeatedGyms.includes(gym.id)
        ).length,
        // Alola awards Z-Crystals rather than badges; use the region's own noun.
        badgeNoun = regions.find((candidate) => candidate.id === regionId)?.league?.badgeName ?? 'Badge'
      requirements.push({
        label: `${badgeNoun}s`,
        current: regionBadgeCount,
        required: unlockRule.badgesRequired,
        met: regionBadgeCount >= unlockRule.badgesRequired,
        locationId: nextGymLocationId(regionId),
      })
    }
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
    if (unlockRule.minigame) {
      const record = state.minigameRecords?.[unlockRule.minigame],
        title = MINIGAME_INFO[unlockRule.minigame]?.title ?? unlockRule.minigame,
        met = minigameRequirementMet(state, unlockRule)
      requirements.push({
        label: unlockRule.minScore ? `${title} best score` : `Clear ${title}`,
        current: unlockRule.minScore ? (record?.best ?? 0) : met ? 1 : 0,
        required: unlockRule.minScore ?? 1,
        met,
        locationId: MINIGAME_AREAS[unlockRule.minigame] ?? null,
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
          jsx(LegendaryQuestPanel, { regionId: location.region ?? 'kanto' }),
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
  if (location.type === 'zone') {
    const activeSubArea = state.currentRoute,
      subAreas = (location.subAreas ?? []).map(
        /** @param {any} subArea */ (subArea) => ({
          ...subArea,
          unlocked: unlockedNowSet.has(subArea.id),
        })
      )
    return jsx('div', {
      className: 'location-panel-scroll',
      children: jsxs('div', {
        className: 'location-info zone-location-panel',
        children: [
          jsxs('div', {
            className: 'location-header',
            children: [
              jsx('span', {
                className: 'location-type-icon',
                children: '🗺️',
              }),
              jsxs('div', {
                children: [
                  jsx('div', {
                    className: 'location-name',
                    children: location.name,
                  }),
                  jsx('div', {
                    className: 'location-type-label',
                    children: 'Zone',
                  }),
                ],
              }),
            ],
          }),
          jsx('p', {
            className: 'location-description',
            children: location.description,
          }),
          jsx('div', {
            className: 'location-section-title',
            children: 'Areas',
          }),
          jsx('p', {
            className: 'settings-hint',
            children: 'Pick an area to travel there and battle the Pokemon that live in it.',
          }),
          jsx('div', {
            className: 'zone-area-list',
            children: subAreas.map(/** @param {any} subArea */ (subArea) => {
              // Show what a locked area still needs, so a sub-area is never an
              // unexplained "???" (Route 2 needs wins at Route 1 and a Lv. 11 team).
              const requirementText = subArea.unlocked
                  ? ''
                  : unlockRequirements(mapData[subArea.id])
                      .filter((requirement) => !requirement.met)
                      .map((requirement) =>
                        requirement.required > 1
                          ? `${requirement.current}/${requirement.required} ${requirement.label}`
                          : requirement.label
                      )
                      .join(' \u00b7 '),
                subAreaEncounters = encounterData[subArea.id]?.encounters,
                expanded = expandedZoneArea === subArea.id
              return jsx(
                'div',
                {
                  className: `zone-area${subArea.id === activeSubArea ? ' active' : ''}`,
                  children: [
                    jsx('button', {
                      className: `zone-area-btn${subArea.id === activeSubArea ? ' active' : ''}${subArea.unlocked ? '' : ' locked'}`,
                      onClick: subArea.unlocked ? () => travelToTarget(subArea.id) : void 0,
                      title: subArea.unlocked ? void 0 : requirementText || 'Not available yet',
                      children: [
                        jsx('span', {
                          className: 'zone-area-name',
                          children: subArea.unlocked ? subArea.name : '???',
                        }),
                        !subArea.unlocked && requirementText
                          ? jsx('span', {
                              className: 'zone-area-req',
                              children: requirementText,
                            })
                          : null,
                      ],
                    }),
                    // Each open area's wild table can be expanded on the hub, so
                    // its habitats can be compared without travelling into each
                    // one first. Only one opens at a time.
                    subArea.unlocked && subAreaEncounters?.length
                      ? jsx('button', {
                          type: 'button',
                          className: `zone-area-toggle${expanded ? ' open' : ''}`,
                          'aria-expanded': expanded,
                          onClick: () => setExpandedZoneArea(expanded ? null : subArea.id),
                          children: expanded ? '▾ Hide wild Pokemon' : '▸ Show wild Pokemon',
                        })
                      : null,
                    expanded && subArea.unlocked && subAreaEncounters?.length
                      ? jsx('div', {
                          className: 'zone-area-grid',
                          children: jsx(RouteEncounterGrid, {
                            routeKey: subArea.id,
                            encounters: subAreaEncounters,
                            onOpenCatchSettings: onOpenCatchSettings ?? (() => {}),
                          }),
                        })
                      : null,
                  ],
                },
                subArea.id
              )
            }),
          }),
          // A zone hub can host a fixed minigame (Galar's Wild Area, Paldea's
          // Kitakami and Area Zero), so offer it from the hub panel too.
          fixedMinigameCard &&
            jsxs('div', {
              className: 'location-minigames',
              children: [
                jsx('div', {
                  className: 'location-section-title',
                  children: 'Minigame',
                }),
                fixedMinigameCard,
              ],
            }),
          // A zone hub can host a gym / trial (Alola's Poni Island holds Mina
          // and Hapu), so offer the challenge from the hub panel too.
          jsx(GymLocationPanel, {}),
          nextUnlocksSection,
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
              children: areaInfoFor(location).icon,
            }),
            jsxs('div', {
              children: [
                jsx('div', {
                  className: 'location-name',
                  children: location.name,
                }),
                jsx('div', {
                  className: 'location-type-label',
                  children: location.hidden
                    ? `${areaInfoFor(location).label} · ${
                        mapData[location.zone]?.name ?? 'Zone'
                      }`
                    : areaInfoFor(location).label,
                }),
              ],
            }),
          ],
        }),
        jsx('p', {
          className: 'location-description',
          children: location.description,
        }),
        onOpenHunt && jsx(HuntBar, { onOpen: onOpenHunt }),
        jobCount > 0 &&
          jsx('button', {
            className: 'location-jobs-btn',
            onClick: () => setShowJobs(true),
            children: `\u2699\ufe0f Field Jobs (${jobCount})`,
          }),
        servicePois.length > 0 &&
          jsxs('div', {
            className: 'location-services',
            children: [
              jsx('span', {
                className: 'location-services-label',
                children: 'Services',
              }),
              ...servicePois.map((poi) =>
                jsx(
                  'span',
                  {
                    className: 'location-service-tag',
                    title: poi.hint,
                    children: `${poi.icon} ${poi.label}`,
                  },
                  poi.kind
                )
              ),
            ],
          }),
        location.hidden &&
          location.zone &&
          jsx('button', {
            className: 'zone-back-btn',
            onClick: () => travelToTarget(location.zone),
            children: `← ${mapData[location.zone]?.name ?? 'Zone'}`,
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
        jsx(GymLocationPanel, {}),
        jsx(RivalPanel, {}),
        jsx(LeagueLocationPanel, {}),
        jsx(DaycarePanel, {}),
        jsx(KurtPanel, {}),
        cafe && jsx(CafePanel, { cafe }),
        routeEncounters &&
          routeKey &&
          jsx(RouteEncounterGrid, {
            routeKey,
            encounters: routeEncounters.encounters,
            onOpenCatchSettings: onOpenCatchSettings ?? (() => {}),
          }),
        (fixedMinigame || activityIds.length > 0) &&
          jsxs('div', {
            className: 'location-minigames',
            children: [
              jsx('div', {
                className: 'location-section-title',
                children: fixedMinigame ? 'Minigame' : 'Activities',
              }),
              fixedMinigameCard,
              activityIds.length > 0 &&
                jsx('p', {
                  className: `route-mastery-hint${mastery.mastered ? ' mastered' : ''}`,
                  children: mastery.mastered
                    ? '\u2605 Route mastered \u2014 every activity here is a perfect hit or better.'
                    : `Mastery: ${mastery.done}/${mastery.total} activities at a perfect hit or better.`,
                }),
              activityIds.map((activityId) => {
                const activity = ROUTE_ACTIVITIES[activityId]
                if (!activity) return null
                return jsxs(
                  Fragment,
                  {
                    children: [
                      jsx(
                        MinigameCard,
                        {
                          icon: activity.icon,
                          title: activity.title,
                          types: activity.preferTypes,
                          steps: ROUTE_ACTIVITY_TUTORIALS[activityId],
                          conditionLabel: activityConditionLabel(activity),
                          conditionActive: activityConditionMatches(
                            activity,
                            activityConditionContext
                          ),
                          hint:
                            activity.id === 'fishing'
                              ? `${activity.hint} Current rod: ${bestRod.name}.${upcomingRod ? ` Open more regions to find the ${upcomingRod.name}.` : ''}`
                              : activity.hint,
                          actionLabel: activity.action,
                          disabled:
                            minigameBusy ||
                            (activity.mode === 'encounter' &&
                              !state.party.some((member) => member.currentHp > 0)),
                          onStart: () =>
                            dispatch({ type: 'START_ROUTE_ACTIVITY', payload: { activityId } }),
                        },
                        activityId
                      ),
                      jsx(JobControls, { locationId: location.id, activityId }),
                    ],
                  },
                  activityId
                )
              }),
            ],
          }),
        location.id === BATTLE_TOWER_LOCATION && jsx(BattleTowerPanel, {}),
        location.id === 'hoenn-battle-frontier' && jsx(BattleFrontierPanel, {}),
        location.id === 'cinnabarIsland' && jsx(FossilPanel, {}),
        jsx(GiftPanel, { locationId: location.id }),
        nextUnlocksSection,
        showJobs && jsx(FieldJobsModal, { onClose: () => setShowJobs(false) }),
      ],
    }),
  })
}
