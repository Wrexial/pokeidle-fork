// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { championData, elite4Data, gymLeaderData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { buildTrainerTeam } from '../game/progression.js'

/** @param {{ onOpenShop: () => void }} props */
export function GymPanel({ onOpenShop }) {
  const { state, dispatch } = useGame(),
    canFight = state.party.some((member) => member.currentHp > 0),
    isBusy = state.phase === 'evolving' || state.phase === 'healing',
    fightable = canFight && !isBusy,
    startGymBattle = /** @param {string} member @param {string} badgeId @param {any[]} index @param {string} badge */ (member, badgeId, index, badge) => {
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
