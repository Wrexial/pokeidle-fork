// Region league challenge, shown in the location panel while standing at the
// region's Pokemon League. Moved out of the League tab so the Elite Four and
// Champion are challenged from the league itself, like the gyms.

import { jsx, jsxs } from 'react/jsx-runtime'
import { championData, elite4Data, gymLeaderData, mapData, regions } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { buildTrainerTeam } from '../game/progression.js'

/**
 * "Lv.68-75" for a team, or an empty string when it has no members.
 * @param {{ level: number }[] | undefined | null} team
 * @returns {string}
 */
function teamLevelRange(team) {
  const levels = (team ?? []).map((member) => member.level)
  return levels.length ? `Lv.${Math.min(...levels)}\u2013${Math.max(...levels)}` : ''
}

export function LeagueLocationPanel() {
  const { state, dispatch } = useGame(),
    location = mapData[state.currentLocation],
    regionId = location?.region ?? 'kanto',
    region = regions.find((candidate) => candidate.id === regionId)

  if (!region?.leagueLocationKey || state.currentLocation !== region.leagueLocationKey) return null

  const regionGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === regionId),
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
    fightable = canFight && !isBusy,
    inGauntlet =
      state.bossBattle &&
      (state.bossBattle.bossType === 'e4' || state.bossBattle.bossType === 'champion')

  if (!regionChampion) return null

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

  if (!allBadgesEarned)
    return jsxs('div', {
      className: 'location-tower',
      children: [
        jsx('div', {
          className: 'section-title inverse',
          children: 'Pokemon League',
        }),
        jsx('div', {
          className: 'tower-hint',
          children: `Earn all ${regionGyms.length} badges to challenge the ${
            region?.name ?? 'region'
          } League.`,
        }),
      ],
    })

  return jsxs('div', {
    className: 'location-tower',
    children: [
      jsx('div', {
        className: 'section-title inverse',
        children: isLeagueRematch ? `Pokemon League \u00b7 Rematch ${championLevelRange}` : 'Pokemon League',
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
                    children: '\u2713',
                  }),
              }),
            ],
          },
          member.id
        )
      }),
      jsxs('div', {
        className: `gym-row${state.defeatedChampions.includes(regionId) ? ' defeated' : ''}${
          state.bossBattle?.bossType === 'champion' ? ' active-gauntlet' : ''
        }`,
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
                children: '\u2713',
              }),
          }),
        ],
      }),
      jsx('button', {
        className: 'gym-fight-btn champion',
        style: {
          width: '100%',
          marginTop: '4px',
        },
        disabled: !fightable || !!inGauntlet,
        onClick: startEliteChallenge,
        children: inGauntlet ? 'CHALLENGE IN PROGRESS' : 'BEGIN CHALLENGE',
      }),
    ],
  })
}
