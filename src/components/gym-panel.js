// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { championData, elite4Data, gymLeaderData, mapData, regions } from '../data/gameData.js'
import { BATTLE_TOWER_LOCATION, BATTLE_TOWER_REGION } from '../data/config.js'
import { useGame } from '../game/context.js'
import { buildTrainerTeam } from '../game/progression.js'

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
    // The Elite Four reset on each prestige, so they must be beaten again
    // before the region can be prestiged once more.
    allEliteFourBeaten =
      regionEliteFour.length > 0 &&
      regionEliteFour.every((member) => state.defeatedEliteFour.includes(member.id)),
    prestigeLevel = state.regionPrestige[regionId] ?? 0,
    canFight = state.party.some((member) => member.currentHp > 0),
    isBusy =
      state.phase === 'evolving' ||
      state.phase === 'healing' ||
      state.phase === 'catching' ||
      state.phase === 'bugCatching' ||
      state.phase === 'mining' ||
      state.phase === 'gameCorner' ||
      state.phase === 'routeActivity' ||
      state.phase === 'wonderTrade',
    fightable = canFight && !isBusy

  /** @param {any} leader */
  function startGymBattle(leader) {
    if (!fightable) return
    if (state.phase === 'battling' || state.phase === 'victory' || state.phase === 'defeat')
      dispatch({
        type: 'PHASE_IDLE',
      })
    dispatch({
      type: 'START_HEALING',
      payload: {
        pendingBossBattle: {
          bossId: leader.id,
          bossType: 'gym',
          trainerName: leader.name,
          trainerClass: 'ace',
          trainerTeam: buildTrainerTeam(
            allBadgesEarned && leader.rematchTeam?.length ? leader.rematchTeam : leader.team
          ),
          spriteKey: leader.spriteKey,
          region: regionId,
        },
      },
    })
  }

  function startEliteChallenge() {
    if (!fightable || !regionChampion) return
    if (state.phase === 'battling' || state.phase === 'victory' || state.phase === 'defeat')
      dispatch({
        type: 'PHASE_IDLE',
      })
    dispatch({
      type: 'RESET_ELITE_FOUR',
    })
    const leader = [
        ...regionEliteFour.map((member) => ({
          bossId: member.id,
          bossType: 'e4',
          trainerName: member.name,
          trainerClass: 'ace',
          trainerTeam: buildTrainerTeam(
            isLeagueRematch && member.rematchTeam?.length ? member.rematchTeam : member.team
          ),
          spriteKey: member.spriteKey,
          region: regionId,
        })),
        {
          bossId: regionChampion.id,
          bossType: 'champion',
          trainerName: regionChampion.name,
          trainerClass: 'ace',
          trainerTeam: buildTrainerTeam(
            isLeagueRematch && regionChampion.rematchTeam?.length
              ? regionChampion.rematchTeam
              : regionChampion.team
          ),
          spriteKey: regionChampion.spriteKey,
          region: regionId,
        },
      ],
      [firstFight, ...remainingFights] = leader
    dispatch({
      type: 'START_HEALING',
      payload: {
        pendingBossBattle: {
          ...firstFight,
          bossQueue: remainingFights,
        },
      },
    })
  }

  const leagueLocation = region?.leagueLocationKey ? mapData[region.leagueLocationKey] : null,
    leagueLocationName = leagueLocation?.name ?? 'the Pokémon League',
    leagueOpen =
      !!region?.leagueLocationKey && state.unlockedLocations.includes(region.leagueLocationKey),
    atLeague = !!region?.leagueLocationKey && state.currentLocation === region.leagueLocationKey,
    leagueUnlocked = allBadgesEarned && atLeague,
    inGauntlet =
      state.bossBattle &&
      (state.bossBattle.bossType === 'e4' || state.bossBattle.bossType === 'champion')

  return jsxs('div', {
    className: 'gym-panel',
    children: [
      jsxs('div', {
        className: 'gym-section-title',
        style: { marginBottom: '4px' },
        children: `${region?.name ?? 'Kanto'} League`,
      }),
      jsx('div', {
        className: 'gym-badge-display',
        children: regionGyms.map((gymLeader) => {
          const earned = state.defeatedGyms.includes(gymLeader.id)
          return jsx(
            'div',
            {
              className: `gym-badge-slot${earned ? ' earned' : ''}`,
              style: earned
                ? {
                    backgroundColor: gymLeader.badgeColor,
                  }
                : void 0,
              title: earned ? gymLeader.badgeName : '???',
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
              // Kanto's gyms sit in cities reached long before their canonical
              // turn (Giovanni's Viridian City is next to Pallet Town), so it
              // still reveals them in badge order. Generated regions level each
              // gym to its town, so any unlocked gym is fair game there.
              revealed = unlocked && (regionId !== 'kanto' || defeatedRegionGyms >= leaderIndex),
              atGym = state.currentLocation === leader.locationKey,
              canStart = revealed && atGym,
              mustTravel = revealed && !atGym
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
                        ? jsx('button', {
                            className: 'gym-fight-btn',
                            disabled: !fightable,
                            onClick: () => startGymBattle(leader),
                            children: 'FIGHT',
                          })
                        : mustTravel
                          ? jsx('span', {
                              className: 'gym-locked-label travel',
                              title: `Go to ${mapData[leader.locationKey]?.name ?? 'the gym'}`,
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
                isLeagueRematch ? ' · Rematch Lv.90' : '',
              ],
            }),
            leagueUnlocked
              ? jsx('button', {
                  className: 'gym-fight-btn champion',
                  disabled: !fightable || !!inGauntlet,
                  onClick: startEliteChallenge,
                  style: {
                    width: '100%',
                    marginBottom: '6px',
                  },
                  children: 'BEGIN CHALLENGE',
                })
              : jsx('div', {
                  className: 'gym-league-hint',
                  children: leagueOpen
                    ? `Travel to ${leagueLocationName} to challenge`
                    : `${leagueLocationName} is not reachable yet`,
                }),
            regionEliteFour.map((member) => {
              const defeated = state.defeatedEliteFour.includes(member.id),
                isActive =
                  state.bossBattle?.bossType === 'e4' && state.bossBattle?.bossId === member.id
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
                  children: 'Reward Shop',
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
          ],
        }),
    ],
  })
}
