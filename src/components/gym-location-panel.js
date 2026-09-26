// Gym leader challenge, shown in the location panel while standing at a gym's
// town. Moved out of the League tab so the fight launches from the location,
// like the Battle Tower and the other location minigames.

import { jsx, jsxs } from 'react/jsx-runtime'
import { gymLeaderData, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { buildTrainerTeam } from '../game/progression.js'

/**
 * "Lv.12-16" for a team, or an empty string when it has no members.
 * @param {{ level: number }[] | undefined | null} team
 * @returns {string}
 */
function teamLevelRange(team) {
  const levels = (team ?? []).map((member) => member.level)
  return levels.length ? `Lv.${Math.min(...levels)}\u2013${Math.max(...levels)}` : ''
}

export function GymLocationPanel() {
  const { state, dispatch } = useGame(),
    location = mapData[state.currentLocation],
    regionId = location?.region ?? 'kanto',
    regionGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === regionId),
    leaderIndex = regionGyms.findIndex((gym) => gym.locationKey === state.currentLocation)

  if (leaderIndex < 0) return null

  const leader = regionGyms[leaderIndex],
    defeated = state.defeatedGyms.includes(leader.id),
    defeatedRegionGyms = regionGyms.filter((gym) => state.defeatedGyms.includes(gym.id)).length,
    // Kanto's gyms sit in cities reached long before their canonical turn
    // (Giovanni's Viridian City is next to Pallet Town), so still reveal them in
    // badge order. Generated regions level each gym to its town, so any gym the
    // player can stand in is fair game there.
    revealed =
      state.unlockedLocations.includes(leader.locationKey) &&
      (regionId !== 'kanto' || defeatedRegionGyms >= leaderIndex),
    allBadgesEarned = regionGyms.length > 0 && defeatedRegionGyms >= regionGyms.length,
    isRematch = allBadgesEarned && !!leader.rematchTeam?.length,
    levelRange = teamLevelRange(isRematch ? leader.rematchTeam : leader.team),
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

  function startGymBattle() {
    if (!fightable) return
    if (state.phase === 'battling' || state.phase === 'victory' || state.phase === 'defeat')
      dispatch({ type: 'PHASE_IDLE' })
    dispatch({
      type: 'START_HEALING',
      payload: {
        pendingBossBattle: {
          bossId: leader.id,
          bossType: 'gym',
          trainerName: leader.name,
          trainerClass: 'ace',
          trainerTeam: buildTrainerTeam(isRematch ? leader.rematchTeam : leader.team),
          spriteKey: leader.spriteKey,
          region: regionId,
        },
      },
    })
  }

  if (!revealed)
    return jsxs('div', {
      className: 'location-tower',
      children: [
        jsx('div', {
          className: 'location-section-title',
          children: 'Gym Leader',
        }),
        jsx('div', {
          className: 'tower-hint',
          children: `This gym's challenge opens once you earn ${leaderIndex} badge${
            leaderIndex === 1 ? '' : 's'
          }.`,
        }),
      ],
    })

  return jsxs('div', {
    className: 'location-tower',
    children: [
      jsx('div', {
        className: 'location-section-title',
        children: isRematch ? 'Gym Leader \u00b7 Rematch' : 'Gym Leader',
      }),
      jsxs('div', {
        className: `gym-row${defeated ? ' defeated' : ''}`,
        children: [
          jsxs('div', {
            className: 'gym-row-info',
            children: [
              jsx('span', {
                className: 'gym-leader-name',
                children: leader.name,
              }),
              jsx('span', {
                className: 'gym-badge-label',
                children: leader.badgeName,
              }),
              levelRange
                ? jsx('span', {
                    className: 'gym-level-range',
                    title: 'Expected team level range',
                    children: levelRange,
                  })
                : null,
              isRematch
                ? jsx('span', {
                    className: 'gym-rematch-tag',
                    title: 'All badges earned \u2014 this leader fields a level 80 rematch team',
                    children: 'REMATCH',
                  })
                : null,
            ],
          }),
          jsxs('div', {
            className: 'gym-row-status',
            children: [
              defeated
                ? jsx('span', {
                    className: 'gym-defeated-mark',
                    children: '\u2713',
                  })
                : null,
              jsx('button', {
                className: 'gym-fight-btn',
                disabled: !fightable,
                onClick: startGymBattle,
                children: isRematch ? 'REMATCH' : 'FIGHT',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
