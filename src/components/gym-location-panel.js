// Gym leader challenge, shown in the location panel while standing at a gym's
// town. Moved out of the League tab so the fight launches from the location,
// like the Battle Tower and the other location minigames.

import { jsx, jsxs } from 'react/jsx-runtime'
import { gymLeaderData, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { buildTrainerTeam } from '../game/progression.js'

/**
 * @typedef {Object} GymLeader
 * @property {string} id
 * @property {string} name
 * @property {string} badgeName
 * @property {string} spriteKey
 * @property {string} locationKey
 * @property {number} [badgesRequired]
 * @property {{ level: number }[]} team
 * @property {{ level: number }[]} [rematchTeam]
 */

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
    // A town can host more than one leader (Alola's Hau'oli City holds both
    // Ilima and Mina), so keep every leader standing here together with its
    // badge-order index (used by Kanto's reveal rule).
    locationGyms = regionGyms
      .map((gym, leaderIndex) => ({ gym, leaderIndex }))
      .filter(({ gym }) => gym.locationKey === state.currentLocation)

  if (!locationGyms.length) return null

  const defeatedRegionGyms = regionGyms.filter((gym) => state.defeatedGyms.includes(gym.id)).length,
    allBadgesEarned = regionGyms.length > 0 && defeatedRegionGyms >= regionGyms.length,
    anyRematch = locationGyms.some(({ gym }) => allBadgesEarned && !!gym.rematchTeam?.length),
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

  /**
   * @param {GymLeader} leader
   * @param {boolean} isRematch
   */
  function startGymBattle(leader, isRematch) {
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
          trainerTeam: buildTrainerTeam(
            isRematch && leader.rematchTeam ? leader.rematchTeam : leader.team
          ),
          spriteKey: leader.spriteKey,
          region: regionId,
        },
      },
    })
  }

  return jsxs('div', {
    className: 'location-tower',
    children: [
      jsx('div', {
        className: 'location-section-title',
        children: anyRematch ? 'Gym Leader \u00b7 Rematch' : 'Gym Leader',
      }),
      ...locationGyms.map(({ gym: leader, leaderIndex }) => {
        // Kanto still reveals its gyms in badge order, and a leader can carry
        // its own `badgesRequired` for a gym sitting in a town reached long
        // before its canonical turn (Alola's Hapu fights in the entry town of
        // Iki Town but is the region's eighth trial). Generated regions level
        // each gym to its town, so any other unlocked gym is fair game.
        const requiredBadges =
            leader.badgesRequired ?? (regionId === 'kanto' ? leaderIndex : 0),
          revealed =
            state.unlockedLocations.includes(leader.locationKey) &&
            defeatedRegionGyms >= requiredBadges
        if (!revealed)
          return jsx(
            'div',
            {
              className: 'tower-hint',
              children: `This gym's challenge opens once you earn ${requiredBadges} badge${
                requiredBadges === 1 ? '' : 's'
              }.`,
            },
            leader.id
          )
        const defeated = state.defeatedGyms.includes(leader.id),
          isRematch = allBadgesEarned && !!leader.rematchTeam?.length,
          levelRange = teamLevelRange(isRematch ? leader.rematchTeam : leader.team)
        return jsxs(
          'div',
          {
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
                    onClick: () => startGymBattle(leader, isRematch),
                    children: isRematch ? 'REMATCH' : 'FIGHT',
                  }),
                ],
              }),
            ],
          },
          leader.id
        )
      }),
    ],
  })
}
