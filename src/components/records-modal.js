// Records modal — a read-only summary of the player's journey, opened from the Box.

import { jsx, jsxs } from 'react/jsx-runtime'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { formatReward } from '../game/progression.js'
import { completedGenerations, gymLeaderData, pokedexIndexes, regions, speciesKeysByGeneration } from '../data/gameData.js'
import { useGame } from '../game/context.js'

/** @param {{ onClose?: () => void, inline?: boolean }} props */
export function RecordsModal({ onClose, inline = false }) {
  const { state } = useGame(),
    rewardedAchievements = new Set(state.rewardedAchievements ?? []),
    achieved = ACHIEVEMENTS.filter((achievement) => achievement.check(state)),
    nationalDex = pokedexIndexes.filter((entry) => entry[1].id > 0 && entry[1].id <= 1025),
    caughtCount = nationalDex.filter(([speciesKey]) => state.pokedexCaught.includes(speciesKey)).length,
    seenCount = nationalDex.filter(([speciesKey]) => state.pokedexSeen.includes(speciesKey)).length,
    percent = nationalDex.length ? Math.floor((caughtCount / nationalDex.length) * 100) : 0,
    completedGenerationSet = completedGenerations(state.pokedexCaught),
    sections = [
      {
        title: 'Battles',
        rows: [
          ['Wild battles won', state.wildBattlesWon],
          ['Trainer battles won', state.trainerBattlesWon],
          ['Total battles', state.wildBattlesWon + state.trainerBattlesWon],
        ],
      },
      {
        title: 'Pokedex',
        rows: [
          ['Species caught', `${caughtCount} / ${nationalDex.length} (${percent}%)`],
          ['Species seen', `${seenCount} / ${nationalDex.length}`],
        ],
      },
      {
        title: 'Dex Rewards',
        rows: [
          [
            'Generations completed',
            `${completedGenerationSet.size} / ${speciesKeysByGeneration.length}`,
          ],
          ...speciesKeysByGeneration.map((speciesKeys, generationIndex) => [
            `Gen ${generationIndex + 1}`,
            completedGenerationSet.has(generationIndex)
              ? '★ Complete'
              : `${speciesKeys.filter((speciesKey) => state.pokedexCaught.includes(speciesKey)).length} / ${speciesKeys.length}`,
          ]),
        ],
      },
      {
        title: 'Shinies',
        rows: [
          ['Shiny forms seen', state.shinySeen.length],
          ['Shiny forms caught', state.shinyCaught.length],
        ],
      },
      {
        title: 'League',
        rows: [
          ['Gym badges', state.defeatedGyms.length],
          ['Elite Four beaten', state.defeatedEliteFour.length],
          ['Champions beaten', state.defeatedChampions.length],
          ['Victory Tokens', state.victoryTokens],
        ],
      },
      {
        title: 'Collection',
        rows: [
          ['In party', state.party.length],
          ['In box', state.box.length],
        ],
      },
    ]
  const panel = jsxs('div', {
    className: inline ? 'records-inline' : 'battle-info-modal',
    ...(inline
      ? {}
      : { onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation() }),
    children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Records',
            }),
            onClose &&
              jsx('button', {
                className: 'battle-info-close',
                onClick: onClose,
                children: 'X',
              }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content',
          children: [
            jsxs('div', {
              className: 'records-section',
              children: [
                jsxs('div', {
                  className: 'records-section-title',
                  children: ['Achievements', ` · ${achieved.length}/${ACHIEVEMENTS.length}`],
                }),
                jsx('div', {
                  className: 'achievement-grid',
                  children: ACHIEVEMENTS.map((achievement) => {
                    const isMet = achievement.check(state),
                      claimed = rewardedAchievements.has(achievement.id)
                    return jsxs(
                      'div',
                      {
                        className: `achievement${isMet ? ' achieved' : ''}`,
                        children: [
                          jsx('span', {
                            className: 'achievement-icon',
                            children: isMet ? '\u{1f3c5}' : '\u00b7',
                          }),
                          jsxs('span', {
                            className: 'achievement-text',
                            children: [
                              jsx('span', {
                                className: 'achievement-name',
                                children: achievement.name,
                              }),
                              jsx('span', {
                                className: 'achievement-desc',
                                children: achievement.description,
                              }),
                              jsx('span', {
                                className: `achievement-reward${claimed ? ' claimed' : ''}`,
                                children: `${claimed ? '\u2605 Claimed' : 'Reward'}: ${formatReward(
                                  achievement.reward
                                )}`,
                              }),
                            ],
                          }),
                        ],
                      },
                      achievement.id
                    )
                  }),
                }),
              ],
            }),
            sections.map((section) =>
              jsxs(
                'div',
                {
                  className: 'records-section',
                  children: [
                    jsx('div', {
                      className: 'records-section-title',
                      children: section.title,
                    }),
                    section.rows.map(([label, value]) =>
                      jsxs(
                        'div',
                        {
                          className: 'records-row',
                          children: [
                            jsx('span', {
                              className: 'records-label',
                              children: label,
                            }),
                            jsx('span', {
                              className: 'records-value',
                              children: value,
                            }),
                          ],
                        },
                        String(label)
                      )
                    ),
                  ],
                },
                section.title
              )
            ),
            jsxs('div', {
              className: 'records-section',
              children: [
                jsx('div', {
                  className: 'records-section-title',
                  children: 'Regions',
                }),
                regions
                  .slice()
                  .sort((left, right) => left.order - right.order)
                  .map((region) => {
                    const badges = gymLeaderData.filter(
                        (gym) =>
                          (gym.region ?? 'kanto') === region.id && state.defeatedGyms.includes(gym.id)
                      ).length,
                      badgeTotal = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === region.id).length,
                      badgeNoun = region.league?.badgeName ?? 'Badge',
                      beaten = state.defeatedChampions.includes(region.id),
                      prestige = state.regionPrestige[region.id] ?? 0,
                      towerBest = state.towerBest[region.id] ?? 0
                    return jsxs(
                      'div',
                      {
                        className: 'records-row',
                        children: [
                          jsx('span', {
                            className: 'records-label',
                            children: region.name,
                          }),
                          jsx('span', {
                            className: 'records-value',
                            children: `${badges}/${badgeTotal} ${badgeNoun.toLowerCase()}s${
                              beaten ? ' · Champion ★' : ''
                            }${prestige ? ` · Prestige ${prestige}` : ''}${
                              towerBest ? ` · Tower ${towerBest}` : ''
                            }`,
                          }),
                        ],
                      },
                      region.id
                    )
                  }),
              ],
            }),
          ],
        }),
      ],
    })
  return inline
    ? panel
    : jsx('div', {
        className: 'battle-info-overlay',
        onClick: onClose,
        children: panel,
      })
}
