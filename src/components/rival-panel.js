// The recurring rival challenge, offered in a town once you've earned the
// badges its milestone asks for. Fight them for a scaling cash reward.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { gymLeaderData, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { buildTrainerTeam } from '../game/progression.js'
import { buildRivalTeam, rivalChallenge, rivalName } from '../game/rival.js'

export function RivalPanel() {
  const { state, dispatch } = useGame(),
    location = mapData[state.currentLocation],
    regionId = location?.region ?? 'kanto',
    regionGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === regionId),
    badgeCount = regionGyms.filter((gym) => state.defeatedGyms.includes(gym.id)).length,
    { ready, stage, requiredBadges } = rivalChallenge(state, regionId, badgeCount),
    playerLevel = Math.max(5, ...state.party.map((member) => member.level)),
    // Build one team for the panel so the level range shown is the team fought.
    team = React.useMemo(
      () => (ready ? buildRivalTeam(regionId, stage, playerLevel) : []),
      [regionId, stage, playerLevel, ready]
    )
  if (!ready || location?.type !== 'town') return null

  const name = rivalName(regionId),
    levels = team.map((member) => member.level),
    levelRange = levels.length ? `Lv.${Math.min(...levels)}\u2013${Math.max(...levels)}` : '',
    canFight = state.party.some((member) => member.currentHp > 0),
    isBusy = [
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
    fightable = canFight && !isBusy

  function startRivalBattle() {
    if (!fightable || team.length === 0) return
    if (state.phase === 'battling' || state.phase === 'victory' || state.phase === 'defeat')
      dispatch({ type: 'PHASE_IDLE' })
    dispatch({
      type: 'START_HEALING',
      payload: {
        pendingBossBattle: {
          bossId: `rival-${regionId}-${stage}`,
          bossType: 'rival',
          trainerName: name,
          trainerClass: 'ace',
          trainerTeam: buildTrainerTeam(team),
          spriteKey: 'acetrainer',
          region: regionId,
        },
      },
    })
  }

  return jsxs('div', {
    className: 'location-tower rival-panel',
    children: [
      jsx('div', {
        className: 'location-section-title',
        children: 'Rival',
      }),
      jsxs('div', {
        className: 'gym-row',
        children: [
          jsxs('div', {
            className: 'gym-row-info',
            children: [
              jsx('span', { className: 'gym-leader-name', children: name }),
              jsx('span', {
                className: 'gym-badge-label',
                children: `Challenge ${stage + 1}`,
              }),
              levelRange
                ? jsx('span', {
                    className: 'gym-level-range',
                    title: 'The rival\u2019s team scales with your party',
                    children: levelRange,
                  })
                : null,
            ],
          }),
          jsxs('div', {
            className: 'gym-row-status',
            children: [
              jsx('button', {
                className: 'gym-fight-btn',
                disabled: !fightable,
                onClick: startRivalBattle,
                children: 'FIGHT',
              }),
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'tower-hint',
        children: `${name} turns up every other badge (next at ${requiredBadges}). Beating them pays a scaling cash bonus and a Rare Candy.`,
      }),
    ],
  })
}
