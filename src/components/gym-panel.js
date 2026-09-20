// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { championData, elite4Data, gymLeaderData, mapData, regions } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { buildTrainerTeam } from '../game/progression.js'

/** @param {{ onOpenShop: () => void }} props */
export function GymPanel({ onOpenShop }) {
  const { state, dispatch } = useGame(),
    regionId = mapData[state.currentLocation]?.region ?? 'kanto',
    region = regions.find((candidate) => candidate.id === regionId),
    regionGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === regionId),
    regionEliteFour = elite4Data.filter((member) => (member.region ?? 'kanto') === regionId),
    regionChampion = championData.find((champion) => (champion.region ?? 'kanto') === regionId),
    defeatedRegionGyms = regionGyms.filter((gym) => state.defeatedGyms.includes(gym.id)).length,
    canFight = state.party.some((member) => member.currentHp > 0),
    isBusy = state.phase === 'evolving' || state.phase === 'healing',
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
          trainerTeam: buildTrainerTeam(leader.team),
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
          trainerTeam: buildTrainerTeam(member.team),
          spriteKey: member.spriteKey,
          region: regionId,
        })),
        {
          bossId: regionChampion.id,
          bossType: 'champion',
          trainerName: regionChampion.name,
          trainerClass: 'ace',
          trainerTeam: buildTrainerTeam(regionChampion.team),
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

  const gymsDefeated = regionGyms.length > 0 && defeatedRegionGyms >= regionGyms.length,
    leagueLocation = region?.leagueLocationKey ? mapData[region.leagueLocationKey] : null,
    leagueLocationName = leagueLocation?.name ?? 'the Pokémon League',
    leagueOpen =
      !!region?.leagueLocationKey && state.unlockedLocations.includes(region.leagueLocationKey),
    atLeague = !!region?.leagueLocationKey && state.currentLocation === region.leagueLocationKey,
    leagueUnlocked = gymsDefeated && atLeague,
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
            children: 'Gym Leaders',
          }),
          regionGyms.map((leader, leaderIndex) => {
            const unlocked = state.unlockedLocations.includes(leader.locationKey),
              defeated = state.defeatedGyms.includes(leader.id),
              unlockedByOrder = defeatedRegionGyms >= leaderIndex,
              revealed = unlocked && unlockedByOrder,
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
      gymsDefeated &&
        regionChampion &&
        jsxs('div', {
          className: 'gym-section',
          children: [
            jsx('div', {
              className: 'gym-section-title',
              children: 'Elite Four & Champion',
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
