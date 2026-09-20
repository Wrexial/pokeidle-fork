// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { RouteEncounterGrid } from './pokedex.js'
import { ShopPanel } from './shop.js'
import { legendaryPool, martShopItems } from '../data/constants.js'
import { championData, elite4Data, encounterData, gymLeaderData, mapAreas, mapData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { buildTrainerTeam, createRoads, formatCooldown } from '../game/progression.js'

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
          unlockRule.championDefeated
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
            routeKey: 'raidIsland',
            encounters: legendaryPool.map((legendary) => ({
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
              martShopItems[state.currentLocation] &&
                jsx(ShopPanel, {
                  shopDef: martShopItems[state.currentLocation],
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
                  label: 'Beat Champion',
                  current: state.championDefeated ? 1 : 0,
                  required: 1,
                  met: state.championDefeated,
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

export function GymPanel({ onOpenShop }) {
  const { state, dispatch } = useGame(),
    canFight = state.party.some((member) => member.currentHp > 0),
    isBusy = state.phase === 'evolving' || state.phase === 'healing',
    fightable = canFight && !isBusy,
    startGymBattle = (member, badgeId, index, badge) => {
      fightable &&
        ((state.phase === 'battling' ||
          state.phase === 'victory' ||
          state.phase === 'defeat') &&
          dispatch({
            type: 'PHASE_IDLE',
          }),
        dispatch({
          type: 'START_HEALING',
          payload: {
            pendingBossBattle: {
              bossId: member,
              bossType: 'gym',
              trainerName: badgeId,
              trainerClass: 'ace',
              trainerTeam: buildTrainerTeam(index),
              spriteKey: badge,
            },
          },
        }))
    },
    startEliteChallenge = () => {
      if (!fightable) return
      ;((state.phase === 'battling' ||
        state.phase === 'victory' ||
        state.phase === 'defeat') &&
        dispatch({
          type: 'PHASE_IDLE',
        }),
        dispatch({
          type: 'RESET_ELITE_FOUR',
        }))
      const leader = [
          ...elite4Data.map((team) => ({
            bossId: team.id,
            bossType: 'e4',
            trainerName: team.name,
            trainerClass: 'ace',
            trainerTeam: buildTrainerTeam(team.team),
            spriteKey: team.spriteKey,
          })),
          {
            bossId: championData.id,
            bossType: 'champion',
            trainerName: championData.name,
            trainerClass: 'ace',
            trainerTeam: buildTrainerTeam(championData.team),
            spriteKey: championData.spriteKey,
          },
        ],
        [defeatedElite, ...isActive] = leader
      dispatch({
        type: 'START_HEALING',
        payload: {
          pendingBossBattle: {
            ...defeatedElite,
            bossQueue: isActive,
          },
        },
      })
    },
    indigoUnlocked = state.unlockedLocations.includes('indigoPlat'),
    inGauntlet =
      state.bossBattle &&
      (state.bossBattle.bossType === 'e4' || state.bossBattle.bossType === 'champion')
  return jsxs('div', {
    className: 'gym-panel',
    children: [
      jsx('div', {
        className: 'gym-badge-display',
        children: gymLeaderData.map((gymLeader) => {
          const unlocked = state.defeatedGyms.includes(gymLeader.id)
          return jsx(
            'div',
            {
              className: `gym-badge-slot${unlocked ? ' earned' : ''}`,
              style: unlocked
                ? {
                    backgroundColor: gymLeader.badgeColor,
                  }
                : void 0,
              title: unlocked ? gymLeader.badgeName : '???',
            },
            gymLeader.id
          )
        }),
      }),
      jsxs('div', {
        className: 'gym-section',
        children: [
          jsx('div', {
            className: 'gym-section-title',
            children: 'Gym Leaders',
          }),
          gymLeaderData.map((leader, leaderIndex) => {
            const unlocked = state.unlockedLocations.includes(leader.locationKey),
              defeated = state.defeatedGyms.includes(leader.id),
              unlockedByOrder = state.defeatedGyms.length >= leaderIndex,
              canStart = unlocked && unlockedByOrder
            return jsxs(
              'div',
              {
                className: `gym-row${canStart ? '' : ' locked'}${defeated ? ' defeated' : ''}`,
                children: [
                  jsxs('div', {
                    className: 'gym-row-info',
                    children: [
                      jsx('span', {
                        className: 'gym-leader-name',
                        children: canStart ? leader.name : '???',
                      }),
                      jsx('span', {
                        className: 'gym-badge-label',
                        children: canStart ? leader.badgeName : 'Locked',
                      }),
                    ],
                  }),
                  jsxs('div', {
                    className: 'gym-row-status',
                    children: [
                      defeated &&
                        jsx('span', {
                          className: 'gym-defeated-mark',
                          children: '✓',
                        }),
                      canStart
                        ? jsx('button', {
                            className: 'gym-fight-btn',
                            disabled: !fightable,
                            onClick: () => startGymBattle(leader.id, leader.name, leader.team, leader.spriteKey),
                            children: 'FIGHT',
                          })
                        : jsx('span', {
                            className: 'gym-locked-label',
                            children: 'LOCKED',
                          }),
                    ],
                  }),
                ],
              },
              leader.id
            )
          }),
        ],
      }),
      indigoUnlocked &&
        jsxs('div', {
          className: 'gym-section',
          children: [
            jsx('div', {
              className: 'gym-section-title',
              children: 'Elite Four & Champion',
            }),
            jsx('button', {
              className: 'gym-fight-btn champion',
              disabled: !fightable || !!inGauntlet,
              onClick: startEliteChallenge,
              style: {
                width: '100%',
                marginBottom: '6px',
              },
              children: 'BEGIN CHALLENGE',
            }),
            elite4Data.map((member) => {
              const defeated = state.defeatedEliteFour.includes(member.id),
                isActive =
                  state.bossBattle?.bossType === 'e4' &&
                  state.bossBattle?.bossId === member.id
              return jsxs(
                'div',
                {
                  className: `gym-row${defeated ? ' defeated' : ''}${isActive ? ' active-gauntlet' : ''}`,
                  children: [
                    jsxs('div', {
                      className: 'gym-row-info',
                      children: [
                        jsx('span', {
                          className: 'gym-leader-name',
                          children: member.name,
                        }),
                        jsx('span', {
                          className: 'gym-badge-label',
                          children: member.title,
                        }),
                      ],
                    }),
                    jsx('div', {
                      className: 'gym-row-status',
                      children:
                        defeated &&
                        jsx('span', {
                          className: 'gym-defeated-mark',
                          children: '✓',
                        }),
                    }),
                  ],
                },
                member.id
              )
            }),
            jsxs('div', {
              className: `gym-row${state.championDefeated ? ' defeated' : ''}${state.bossBattle?.bossType === 'champion' ? ' active-gauntlet' : ''}`,
              children: [
                jsxs('div', {
                  className: 'gym-row-info',
                  children: [
                    jsx('span', {
                      className: 'gym-leader-name',
                      children: championData.name,
                    }),
                    jsx('span', {
                      className: 'gym-badge-label',
                      children: championData.title,
                    }),
                  ],
                }),
                jsx('div', {
                  className: 'gym-row-status',
                  children:
                    state.championDefeated &&
                    jsx('span', {
                      className: 'gym-defeated-mark',
                      children: '✓',
                    }),
                }),
              ],
            }),
          ],
        }),
      state.defeatedGyms.length > 0 &&
        jsxs('div', {
          className: 'gym-section',
          children: [
            jsx('div', {
              className: 'gym-section-title',
              children: 'Victory Tokens',
            }),
            jsxs('div', {
              className: 'victory-token-bar',
              children: [
                jsx('span', {
                  className: 'victory-token-count',
                  children: state.victoryTokens,
                }),
                jsx('button', {
                  className: 'reward-shop-open-btn',
                  onClick: onOpenShop,
                  children: 'Reward Shop',
                }),
              ],
            }),
          ],
        }),
    ],
  })
}

function MapNode({
  location,
  isCurrent,
  isUnlocked,
  isClickable,
  onClick,
  cooldownEnd,
}) {
  const [hovering, setHovering] = React.useState(!1),
    [, tick] = React.useState(0),
    isTown = location.type === 'town',
    isRaid = location.type === 'raid',
    locationName = isUnlocked ? location.name : '???',
    timeNow = Date.now(),
    raidOnCooldown = isRaid && cooldownEnd != null && timeNow < cooldownEnd
  React.useEffect(() => {
    if (!raidOnCooldown) return
    const intervalId = setInterval(() => tick((tickCount) => tickCount + 1), 1e3)
    return () => clearInterval(intervalId)
  }, [raidOnCooldown])
  const showLabel = isCurrent || hovering
  let className = 'map-node'
  return (
    isRaid ? (className += ' raid') : isTown ? (className += ' town') : (className += ' route'),
    raidOnCooldown && (className += ' cooldown'),
    isCurrent
      ? (className += ' current')
      : isClickable
        ? (className += ' clickable')
        : isUnlocked || (className += ' locked'),
    jsxs('div', {
      className,
      style: {
        left: `${location.position.x}%`,
        top: `${location.position.y}%`,
      },
      onClick: isClickable ? onClick : void 0,
      title: isUnlocked ? location.description : 'Unknown location',
      onMouseEnter: () => setHovering(!0),
      onMouseLeave: () => setHovering(!1),
      children: [
        jsx('div', {
          className: 'map-node-dot',
          children:
            isCurrent &&
            jsx('div', {
              className: 'map-node-blink',
            }),
        }),
        showLabel &&
          jsx('span', {
            className: 'map-node-label',
            children: locationName,
          }),
        raidOnCooldown &&
          cooldownEnd &&
          jsx('span', {
            className: 'raid-cooldown-timer',
            children: formatCooldown(cooldownEnd - Date.now()),
          }),
      ],
    })
  )
}

export function TownMap() {
  const { state, dispatch } = useGame(),
    { currentLocation, unlockedLocations } = state,
    currentLocationData = mapData[currentLocation]
  function travelTo(location) {
    if (location === 'raidIsland') {
      if (state.raidCooldownEnd && Date.now() < state.raidCooldownEnd) return
      const legendary = legendaryPool[Math.floor(Math.random() * legendaryPool.length)]
      dispatch({
        type: 'START_RAID',
        payload: {
          legendary: legendary.speciesKey,
        },
      })
      return
    }
    dispatch({
      type: 'TRAVEL',
      payload: {
        locationId: location,
      },
    })
  }
  const roads = [],
    roadSet = new Set()
  for (const location of Object.values(mapData))
    for (const connectionId of location.connections) {
      const roadKey = [location.id, connectionId].sort().join('-')
      roadSet.has(roadKey) ||
        (roadSet.add(roadKey),
        roads.push({
          from: location.id,
          to: connectionId,
        }))
    }
  return jsxs('div', {
    className: 'town-map',
    children: [
      jsxs('div', {
        className: 'town-map-header',
        children: [
          jsx('span', {
            className: 'town-map-title',
            children: 'TOWN MAP',
          }),
          jsx('span', {
            className: 'town-map-location-name',
            children: currentLocationData?.name ?? '',
          }),
          jsxs('span', {
            className: 'town-map-battles',
            children: [state.wildBattlesWon, 'W ', state.trainerBattlesWon, 'T'],
          }),
        ],
      }),
      jsxs('div', {
        className: 'town-map-canvas',
        children: [
          jsxs('svg', {
            className: 'town-map-svg',
            children: [
              roads.map(({ from: fromId, to: toId }) => {
                const roadClass = `map-road-border${unlockedLocations.includes(fromId) && unlockedLocations.includes(toId) ? ' unlocked' : ' locked'}`
                return createRoads(fromId, toId).map((segment, segmentIndex) =>
                  jsx(
                    'line',
                    {
                      x1: `${segment.x1}%`,
                      y1: `${segment.y1}%`,
                      x2: `${segment.x2}%`,
                      y2: `${segment.y2}%`,
                      className: roadClass,
                    },
                    `border-${fromId}-${toId}-${segmentIndex}`
                  )
                )
              }),
              roads.map(({ from: fromId, to: toId }) => {
                const roadClass = `map-road-fill${unlockedLocations.includes(fromId) && unlockedLocations.includes(toId) ? ' unlocked' : ' locked'}`
                return createRoads(fromId, toId).map((segment, segmentIndex) =>
                  jsx(
                    'line',
                    {
                      x1: `${segment.x1}%`,
                      y1: `${segment.y1}%`,
                      x2: `${segment.x2}%`,
                      y2: `${segment.y2}%`,
                      className: roadClass,
                    },
                    `fill-${fromId}-${toId}-${segmentIndex}`
                  )
                )
              }),
            ],
          }),
          mapAreas.map((locationId) => {
            const location = mapData[locationId],
              isUnlocked = unlockedLocations.includes(locationId)
            if (location.type === 'raid' && !isUnlocked) return null
            const isCurrent = locationId === currentLocation,
              onCooldown =
                location.type === 'raid' &&
                state.raidCooldownEnd != null &&
                Date.now() < state.raidCooldownEnd,
              isClickable = isUnlocked && !isCurrent && !onCooldown
            return jsx(
              MapNode,
              {
                location,
                isCurrent,
                isUnlocked,
                isClickable,
                onClick: () => travelTo(locationId),
                cooldownEnd: location.type === 'raid' ? state.raidCooldownEnd : void 0,
              },
              locationId
            )
          }),
        ],
      }),
    ],
  })
}
