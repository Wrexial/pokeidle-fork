// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { championData, elite4Data, gymLeaderData, mapData, regions } from '../data/gameData.js'
import { BATTLE_TOWER_LOCATION, BATTLE_TOWER_REGION } from '../data/config.js'
import { useGame } from '../game/context.js'
import { PrestigePerks } from './prestige-perks.js'

/**
 * "Lv.12-16" for a team, or an empty string when it has no members.
 * @param {{ level: number }[] | undefined | null} team
 * @returns {string}
 */
function teamLevelRange(team) {
  const levels = (team ?? []).map((member) => member.level)
  return levels.length ? `Lv.${Math.min(...levels)}\u2013${Math.max(...levels)}` : ''
}

/** @param {{ onOpenShop: () => void }} props */
export function GymPanel({ onOpenShop }) {
  const { state, dispatch } = useGame(),
    [confirmingPrestige, setConfirmingPrestige] = React.useState(false),
    regionId = mapData[state.currentLocation]?.region ?? 'kanto',
    region = regions.find((candidate) => candidate.id === regionId),
    // Per-region league copy (Alola's trials / Z-Crystals, Galar's Champion
    // Cup). Falls back to the gym/Elite Four default for older saves/data.
    regionLeague = region?.league,
    badgeTrackLabel = regionLeague?.badgeTrack ?? 'Gym Leaders',
    eliteTrackLabel = regionLeague?.eliteTrack ?? 'Elite Four & Champion',
    regionGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === regionId),
    regionEliteFour = elite4Data.filter((member) => (member.region ?? 'kanto') === regionId),
    regionChampion = championData.find((champion) => (champion.region ?? 'kanto') === regionId),
    defeatedRegionGyms = regionGyms.filter((gym) => state.defeatedGyms.includes(gym.id)).length,
    allBadgesEarned = regionGyms.length > 0 && defeatedRegionGyms >= regionGyms.length,
    isLeagueRematch = state.defeatedChampions.includes(regionId),
    championLevelRange = teamLevelRange(
      isLeagueRematch && regionChampion?.rematchTeam?.length
        ? regionChampion.rematchTeam
        : regionChampion?.team
    ),
    // The Elite Four reset on each prestige, so they must be beaten again
    // before the region can be prestiged once more.
    allEliteFourBeaten =
      regionEliteFour.length > 0 &&
      regionEliteFour.every((member) => state.defeatedEliteFour.includes(member.id)),
    prestigeLevel = state.regionPrestige[regionId] ?? 0,
    isBusy =
      state.phase === 'evolving' ||
      state.phase === 'healing' ||
      state.phase === 'catching' ||
      state.phase === 'bugCatching' ||
      state.phase === 'safari' ||
      state.phase === 'academyQuiz' ||
      state.phase === 'mining' ||
      state.phase === 'gameCorner' ||
      state.phase === 'routeActivity' ||
      state.phase === 'wonderTrade'

  /**
   * Travel to a location from a gym/league shortcut. Mirrors the location
   * panel's travel rule: the place must be unlocked and not already here.
   * @param {string | undefined | null} locationId
   */
  function travelToLocation(locationId) {
    if (isBusy || !locationId) return
    if (!state.unlockedLocations.includes(locationId)) return
    if (state.currentLocation === locationId) return
    dispatch({ type: 'TRAVEL', payload: { locationId } })
  }

  const leagueLocation = region?.leagueLocationKey ? mapData[region.leagueLocationKey] : null,
    leagueLocationName = leagueLocation?.name ?? 'the Pokémon League',
    leagueOpen =
      !!region?.leagueLocationKey && state.unlockedLocations.includes(region.leagueLocationKey),
    atLeague = !!region?.leagueLocationKey && state.currentLocation === region.leagueLocationKey,
    leagueUnlocked = allBadgesEarned && atLeague

  return jsxs('div', {
    className: 'gym-panel',
    children: [
      jsx('div', {
        className: 'gym-section-title',
        style: { marginBottom: '4px' },
        children: `${region?.name ?? 'Kanto'} League`,
      }),
      jsx('div', {
        className: 'gym-badge-display',
        children: regionGyms.map((gymLeader) => {
          const earned = state.defeatedGyms.includes(gymLeader.id),
            levelRange = teamLevelRange(gymLeader.team)
          return jsx(
            'div',
            {
              className: `gym-badge-slot${earned ? ' earned' : ''}`,
              style: earned
                ? {
                    backgroundColor: gymLeader.badgeColor,
                  }
                : void 0,
              title: earned
                ? `${gymLeader.badgeName}${levelRange ? ` \u00b7 ${levelRange}` : ''}`
                : '???',
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
            children: badgeTrackLabel,
          }),
          regionGyms.map((leader, leaderIndex) => {
            const unlocked = state.unlockedLocations.includes(leader.locationKey),
              defeated = state.defeatedGyms.includes(leader.id),
              // Kanto reveals its gyms in badge order, and a leader can carry
              // its own `badgesRequired` for a town reached long before its
              // canonical turn (Alola's Hapu fights in Iki Town but is the
              // region's eighth trial). Generated regions level each gym to its
              // town, so any other unlocked gym is fair game there.
              requiredBadges = leader.badgesRequired ?? (regionId === 'kanto' ? leaderIndex : 0),
              revealed = unlocked && defeatedRegionGyms >= requiredBadges,
              atGym = state.currentLocation === leader.locationKey,
              canStart = revealed && atGym,
              mustTravel = revealed && !atGym,
              levelRange = teamLevelRange(
                allBadgesEarned && leader.rematchTeam?.length ? leader.rematchTeam : leader.team
              )
            return jsxs(
              'div',
              {
                className: `gym-row${revealed ? '' : ' locked'}${defeated ? ' defeated' : ''}`,
                children: [
                  jsxs('div', {
                    className: 'gym-row-info',
                    children: [
                      jsx('span', {
                        className: 'gym-leader-name',
                        children: revealed ? leader.name : '???',
                      }),
                      jsx('span', {
                        className: 'gym-badge-label',
                        children: revealed ? leader.badgeName : 'Locked',
                      }),
                      revealed && levelRange
                        ? jsx('span', {
                            className: 'gym-level-range',
                            title: 'Expected team level range',
                            children: levelRange,
                          })
                        : null,
                      revealed && allBadgesEarned && leader.rematchTeam?.length
                        ? jsx('span', {
                            className: 'gym-rematch-tag',
                            title: 'All badges earned — this leader fields a level 80 rematch team',
                            children: 'REMATCH',
                          })
                        : null,
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
                        ? jsx('span', {
                            className: 'gym-locked-label travel',
                            title: 'Challenge this leader from the location panel',
                            children: 'AT GYM',
                          })
                        : mustTravel
                          ? jsx('button', {
                              className: 'gym-locked-label travel clickable',
                              onClick: () => travelToLocation(leader.locationKey),
                              title: `Travel to ${mapData[leader.locationKey]?.name ?? 'the gym'}`,
                              children: `GO TO ${(mapData[leader.locationKey]?.name ?? 'TOWN').toUpperCase()}`,
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
      allBadgesEarned &&
        regionChampion &&
        jsxs('div', {
          className: 'gym-section',
          children: [
            jsxs('div', {
              className: 'gym-section-title',
              children: [
                eliteTrackLabel,
                isLeagueRematch
                  ? regionId === 'galar'
                    ? ' · Post-game Tournament'
                    : ' · Rematch Lv.90'
                  : '',
              ],
            }),
            leagueUnlocked
              ? jsx('div', {
                  className: 'gym-league-hint',
                  children: 'Challenge the Elite Four and Champion from the location panel.',
                })
              : leagueOpen
                ? jsx('button', {
                    className: 'gym-locked-label travel clickable',
                    onClick: () => travelToLocation(region?.leagueLocationKey),
                    title: `Travel to ${leagueLocationName}`,
                    children: `GO TO ${leagueLocationName.toUpperCase()}`,
                  })
                : jsx('div', {
                    className: 'gym-league-hint',
                    children: `${leagueLocationName} is not reachable yet`,
                  }),
            regionEliteFour.map((member) => {
              const defeated = state.defeatedEliteFour.includes(member.id),
                isActive =
                  state.bossBattle?.bossType === 'e4' && state.bossBattle?.bossId === member.id,
                levelRange = teamLevelRange(
                  isLeagueRematch && member.rematchTeam?.length ? member.rematchTeam : member.team
                )
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
                        levelRange
                          ? jsx('span', {
                              className: 'gym-level-range',
                              title: 'Expected team level range',
                              children: levelRange,
                            })
                          : null,
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
              className: `gym-row${state.defeatedChampions.includes(regionId) ? ' defeated' : ''}${state.bossBattle?.bossType === 'champion' ? ' active-gauntlet' : ''}`,
              children: [
                jsxs('div', {
                  className: 'gym-row-info',
                  children: [
                    jsx('span', {
                      className: 'gym-leader-name',
                      children: regionChampion.name,
                    }),
                    jsx('span', {
                      className: 'gym-badge-label',
                      children: regionChampion.title,
                    }),
                    championLevelRange
                      ? jsx('span', {
                          className: 'gym-level-range',
                          title: 'Expected team level range',
                          children: championLevelRange,
                        })
                      : null,
                  ],
                }),
                jsx('div', {
                  className: 'gym-row-status',
                  children:
                    state.defeatedChampions.includes(regionId) &&
                    jsx('span', {
                      className: 'gym-defeated-mark',
                      children: '✓',
                    }),
                }),
              ],
            }),
          ],
        }),
      regionId === BATTLE_TOWER_REGION &&
        state.unlockedLocations.includes(BATTLE_TOWER_LOCATION) &&
        state.currentLocation !== BATTLE_TOWER_LOCATION &&
        jsxs('div', {
          className: 'gym-section',
          children: [
            jsx('div', {
              className: 'gym-section-title',
              children: 'Battle Tower',
            }),
            jsx('div', {
              className: 'tower-hint',
              children: `Visit ${mapData[BATTLE_TOWER_LOCATION]?.name ?? 'Hoenn Route 111'} to climb the tower.`,
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
                  children: 'Kecleon Shop',
                }),
              ],
            }),
          ],
        }),
      isLeagueRematch &&
        jsxs('div', {
          className: 'gym-section prestige-section',
          children: [
            jsxs('div', {
              className: 'gym-section-title',
              children: ['Prestige', prestigeLevel > 0 ? ` · Level ${prestigeLevel}` : ''],
            }),
            jsx('div', {
              className: 'prestige-hint',
              children: !allEliteFourBeaten
                ? `Beat ${region?.name ?? 'the region'}\u2019s Elite Four again before its next prestige.`
                : confirmingPrestige
                  ? `Reset ${region?.name ?? 'this region'}\u2019s routes and badges? Your Pokemon, items, money and Pokedex are kept.`
                  : 'Replay this region from the start without losing your Pokemon. Each prestige earns Victory Tokens.',
            }),
            confirmingPrestige
              ? jsxs('div', {
                  className: 'prestige-actions',
                  children: [
                    jsx('button', {
                      className: 'gym-fight-btn champion',
                      onClick: () => {
                        dispatch({
                          type: 'PRESTIGE_REGION',
                          payload: {
                            regionId,
                          },
                        })
                        setConfirmingPrestige(false)
                      },
                      children: 'CONFIRM PRESTIGE',
                    }),
                    jsx('button', {
                      className: 'prestige-cancel-btn',
                      onClick: () => setConfirmingPrestige(false),
                      children: 'Cancel',
                    }),
                  ],
                })
              : jsx('button', {
                  className: 'gym-fight-btn champion',
                  style: {
                    width: '100%',
                  },
                  disabled: !allEliteFourBeaten,
                  onClick: () => setConfirmingPrestige(true),
                  children: allEliteFourBeaten
                    ? `PRESTIGE ${region?.name?.toUpperCase() ?? 'REGION'}`
                    : 'BEAT THE ELITE FOUR FIRST',
                }),
            jsx(PrestigePerks, {}),
          ],
        }),
    ],
  })
}
