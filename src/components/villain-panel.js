// The villain-team hideout panel: the org's short arc (three grunts, an admin
// and a boss whose team carries a legendary), shown while standing in the
// hideout. The fights reuse the boss-battle plumbing, and clearing the boss
// pays the arc's one-off reward.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { mapData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { buildTrainerTeam } from '../game/progression.js'
import {
  buildVillainTeam,
  villainStageClass,
  villainStageKind,
  villainStageLines,
  villainStageName,
  villainStageSprite,
  villainStatus,
} from '../game/villain-teams.js'
import { rewardItemName } from '../game/minigames/mining.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

/**
 * "Lv.30-34" for a team, or an empty string when it has no members.
 * @param {{ level: number }[] | undefined | null} team
 * @returns {string}
 */
function teamLevelRange(team) {
  const levels = (team ?? []).map((member) => member.level)
  return levels.length ? `Lv.${Math.min(...levels)}\u2013${Math.max(...levels)}` : ''
}

/** Busy phases during which a challenge can't start. */
const BUSY_PHASES = [
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
]

export function VillainPanel() {
  const { state, dispatch } = useGame(),
    location = mapData[state.currentLocation],
    regionId = location?.region ?? 'kanto',
    status = villainStatus(state, regionId),
    nextStage = status?.nextStage ?? null,
    // Build one team for the panel so the level range shown is the team fought.
    team = React.useMemo(
      () => (nextStage ? buildVillainTeam(nextStage, regionId) : []),
      [nextStage, regionId]
    )
  if (location?.type !== 'hideout' || !status) return null

  const { org, complete, progress, stages } = status,
    bossSpecies = pokemonSpecies[org.boss.legendary],
    adminSpecies = pokemonSpecies[org.admin.signature],
    nextKind = nextStage ? villainStageKind(nextStage) : null,
    nextName = nextStage ? villainStageName(org, nextStage) : '',
    levelRange = teamLevelRange(team),
    canFight = state.party.some((member) => member.currentHp > 0),
    fightable = canFight && !BUSY_PHASES.includes(state.phase)

  /** @param {string} stageId */
  function startVillainBattle(stageId) {
    if (!fightable) return
    if (state.phase === 'battling' || state.phase === 'victory' || state.phase === 'defeat')
      dispatch({ type: 'PHASE_IDLE' })
    dispatch({
      type: 'START_HEALING',
      payload: {
        pendingBossBattle: {
          bossId: `villain-${regionId}-${stageId}`,
          bossType: 'villain',
          trainerName: villainStageName(org, stageId),
          trainerClass: villainStageClass(org, stageId),
          trainerTeam: buildTrainerTeam(buildVillainTeam(stageId, regionId)),
          spriteKey: villainStageSprite(org, stageId),
          region: regionId,
          villainRegion: regionId,
          villainStage: stages.findIndex((stage) => stage.id === stageId),
          // Shown as the trainer's opening lines in the battle text box.
          dialogue: villainStageLines(org, stageId),
        },
      },
    })
  }

  const rewardBits = [
    `$${org.reward.money.toLocaleString()}`,
    ...Object.entries(org.reward.items ?? {}).map(
      ([itemId, quantity]) => `${rewardItemName(itemId)} x${quantity}`
    ),
    ...(org.reward.victoryTokens > 0
      ? [`${org.reward.victoryTokens} Victory Token${org.reward.victoryTokens > 1 ? 's' : ''}`]
      : []),
  ]

  return jsxs('div', {
    className: 'location-tower villain-panel',
    children: [
      jsxs('div', {
        className: 'villain-head',
        children: [
          bossSpecies &&
            jsx('img', {
              className: 'villain-boss-sprite',
              src: getPokemonSpriteUrl(bossSpecies.id),
              onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                (event.target.src = getPokemonSpriteFallbackUrl(bossSpecies.id)),
              alt: bossSpecies.name,
              title: `${bossSpecies.name} — the boss's legendary`,
            }),
          jsxs('div', {
            className: 'villain-head-text',
            children: [
              jsx('div', {
                className: 'location-section-title',
                children: org.name,
              }),
              jsx('div', {
                className: 'villain-tagline',
                children: org.tagline,
              }),
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'villain-progress',
        children: `${progress}/${stages.length} stages cleared`,
      }),
      jsx('div', {
        className: 'villain-stage-list',
        children: stages.map((stage) => {
          const isBoss = stage.kind === 'boss',
            isAdmin = stage.kind === 'admin'
          return jsxs(
            'div',
            {
              className: `gym-row villain-stage${stage.done ? ' defeated' : ''}${stage.current ? ' active-gauntlet' : ''}`,
              children: [
                jsxs('div', {
                  className: 'gym-row-info',
                  children: [
                    jsx('span', {
                      className: 'gym-leader-name',
                      children: stage.done ? stage.label : stage.current ? stage.label : '???',
                    }),
                    jsx('span', {
                      className: 'gym-badge-label',
                      children: isBoss ? 'Boss · Legendary' : isAdmin ? 'Admin' : 'Grunt',
                    }),
                    stage.current && levelRange
                      ? jsx('span', {
                          className: 'gym-level-range',
                          title: 'Expected team level range',
                          children: levelRange,
                        })
                      : null,
                    isBoss && stage.current && bossSpecies
                      ? jsx('span', {
                          className: 'gym-rematch-tag',
                          title: `The boss fields ${bossSpecies.name}`,
                          children: bossSpecies.name.toUpperCase(),
                        })
                      : null,
                  ],
                }),
                jsx('div', {
                  className: 'gym-row-status',
                  children: [
                    stage.done &&
                      jsx('span', {
                        className: 'gym-defeated-mark',
                        children: '✓',
                      }),
                    stage.current && !complete
                      ? jsx('button', {
                          className: 'gym-fight-btn',
                          disabled: !fightable,
                          onClick: () => startVillainBattle(stage.id),
                          children: 'FIGHT',
                        })
                      : null,
                  ],
                }),
              ],
            },
            stage.id
          )
        }),
      }),
      complete
        ? jsxs('div', {
            className: 'villain-done',
            children: [
              jsx('div', {
                className: 'villain-done-line',
                children: `${org.boss.name}: \u201c${org.win}\u201d`,
              }),
              jsx('div', {
                className: 'villain-reward',
                children: `Arc cleared \u2014 received ${rewardBits.join(' + ')}.`,
              }),
            ],
          })
        : jsx('div', {
            className: 'tower-hint',
            children:
              nextKind === 'boss'
                ? `${nextName} is waiting with a legendary on their team. Beating them dismantles ${org.name} for good.`
                : `Defeat ${nextName} to push deeper into the hideout. Clearing the arc earns ${org.name}'s reward: a Master Ball, cash and a party ribbon.`,
          }),
      adminSpecies && !complete && nextKind === 'admin'
        ? jsx('div', {
            className: 'tower-hint',
            children: `${org.admin.name}'s signature Pokemon is ${adminSpecies.name}.`,
          })
        : null,
    ],
  })
}
