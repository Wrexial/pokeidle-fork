// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { regions } from '../data/gameData.js'
import { formatReward } from '../game/progression.js'
import { professorStoryStatus, questLabel } from '../game/quests.js'

/**
 * The reward text for a story chapter, with the chain's charm called out (it
 * is a passive, not an item, so `formatReward` alone would omit it).
 * @param {any} chapter
 */
function chapterRewardLabel(chapter) {
  const parts = formatReward(chapter.reward ?? {})
  return chapter.reward?.charm ? `${parts ? `${parts} \u00b7 ` : ''}${chapter.reward.charm}` : parts
}

/** @param {{ onClose: () => void }} props */
export function QuestsModal({ onClose }) {
  const { state, dispatch } = useGame(),
    quests = state.quests?.list ?? [],
    story = professorStoryStatus(state),
    [tab, setTab] = React.useState(/** @type {'daily' | 'story'} */ ('daily'))
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal quests-modal',
      onClick: /** @param {React.MouseEvent} mouseEvent */ (mouseEvent) =>
        mouseEvent.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: tab === 'daily' ? 'Daily Quests' : "Professor's Story",
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'quests-tabs',
          children: [
            jsx('button', {
              className: `quests-tab${tab === 'daily' ? ' active' : ''}`,
              onClick: () => setTab('daily'),
              children: 'Daily',
            }),
            jsx('button', {
              className: `quests-tab${tab === 'story' ? ' active' : ''}`,
              onClick: () => setTab('story'),
              children: 'Story',
            }),
            story.chapters.some(
              /** @param {any} chapter */ (chapter) => chapter.claimable
            )
              ? jsx('span', { className: 'quests-tab-dot', title: 'Claimable reward', children: '\u25cf' })
              : null,
          ],
        }),
        jsx('div', {
          className: 'battle-info-content quests-content',
          children: tab === 'story' ? renderStory(story, dispatch) : renderDaily(quests, dispatch),
        }),
      ],
    }),
  })
}

/**
 * The daily quest list.
 * @param {any[]} quests
 * @param {any} dispatch
 */
function renderDaily(quests, dispatch) {
  if (quests.length === 0)
    return jsx('p', {
      className: 'quests-empty',
      children: 'No quests yet \u2014 check back shortly.',
    })
  return quests.map(/** @param {any} quest */ (quest) => {
    const complete = quest.progress >= quest.goal
    return jsxs(
      'div',
      {
        className: `quest${complete ? ' complete' : ''}${quest.claimed ? ' claimed' : ''}`,
        children: [
          jsxs('div', {
            className: 'quest-head',
            children: [
              jsx('span', {
                className: 'quest-label',
                children: questLabel(quest),
              }),
              jsx('span', {
                className: 'quest-reward',
                children: formatReward(quest.reward),
              }),
            ],
          }),
          jsx('div', {
            className: 'quest-bar',
            children: jsx('div', {
              className: 'quest-fill',
              style: {
                width: `${Math.min(100, (quest.progress / quest.goal) * 100)}%`,
              },
            }),
          }),
          jsxs('div', {
            className: 'quest-foot',
            children: [
              jsx('span', {
                className: 'quest-progress',
                children: `${quest.progress} / ${quest.goal}`,
              }),
              quest.claimed
                ? jsx('span', {
                    className: 'quest-claimed',
                    children: '\u2713 Claimed',
                  })
                : complete
                  ? jsx('button', {
                      className: 'quest-claim-btn',
                      onClick: () =>
                        dispatch({
                          type: 'CLAIM_QUEST',
                          payload: { questId: quest.id },
                        }),
                      children: 'Claim',
                    })
                  : null,
            ],
          }),
        ],
      },
      quest.id
    )
  })
}

/**
 * The chained regional storyline: claimed chapters as a compact record, the
 * active chapter expanded with its derived steps, and the rest locked.
 * @param {ReturnType<typeof professorStoryStatus>} story
 * @param {any} dispatch
 */
function renderStory(story, dispatch) {
  return [
    jsxs(
      'div',
      {
        className: 'story-progress',
        children: [
          jsx('span', {
            className: 'story-progress-label',
            children: `Chapter ${Math.min(story.claimedCount + 1, story.chapterCount)} of ${story.chapterCount}`,
          }),
          story.catchBonus > 0
            ? jsx('span', {
                className: 'story-charm',
                children: `Catching Charm +${Math.round(story.catchBonus * 100)}%`,
              })
            : null,
        ],
      },
      'story-progress'
    ),
    ...story.chapters.map(/** @param {any} chapter */ (chapter) => {
      if (chapter.claimed)
        return jsxs(
          'div',
          {
            className: 'story-chapter done',
            children: [
              jsxs('div', {
                className: 'story-chapter-head',
                children: [
                  jsx('span', { className: 'story-chapter-title', children: chapter.title }),
                  jsx('span', { className: 'story-chapter-check', children: '\u2713' }),
                ],
              }),
              jsx('span', {
                className: 'story-chapter-reward',
                children: chapterRewardLabel(chapter),
              }),
            ],
          },
          chapter.id
        )
      if (!chapter.unlocked) {
        const regionName = chapter.region
          ? regions.find(/** @param {any} region */ (region) => region.id === chapter.region)?.name
          : null
        return jsxs(
          'div',
          {
            className: 'story-chapter locked',
            children: [
              jsx('span', { className: 'story-chapter-title', children: '???' }),
              jsx('span', {
                className: 'story-chapter-professor',
                children: regionName
                  ? `Locked \u00b7 Open ${regionName} to begin`
                  : `Locked \u00b7 ${chapter.professor}`,
              }),
            ],
          },
          chapter.id
        )
      }
      return jsxs(
        'div',
        {
          className: `story-chapter active${chapter.done ? ' complete' : ''}`,
          children: [
            jsxs('div', {
              className: 'story-chapter-head',
              children: [
                jsx('span', { className: 'story-chapter-title', children: chapter.title }),
                jsx('span', {
                  className: 'story-chapter-professor',
                  children: chapter.professor,
                }),
              ],
            }),
            jsx('p', { className: 'story-chapter-intro', children: chapter.intro }),
            ...chapter.steps.map(/** @param {any} step */ (step) =>
              jsxs(
                'div',
                {
                  className: `story-step${step.done ? ' done' : ''}`,
                  children: [
                    jsx('span', { className: 'story-step-label', children: step.label }),
                    jsx('span', {
                      className: 'story-step-progress',
                      children: `${step.progress} / ${step.need}`,
                    }),
                  ],
                },
                step.id
              )
            ),
            jsxs('div', {
              className: 'story-chapter-foot',
              children: [
                jsx('span', {
                  className: 'story-chapter-reward',
                  children: chapterRewardLabel(chapter),
                }),
                chapter.done
                  ? jsx('button', {
                      className: 'quest-claim-btn',
                      onClick: () =>
                        dispatch({
                          type: 'CLAIM_STORY_CHAPTER',
                          payload: { chapterId: chapter.id },
                        }),
                      children: 'Claim',
                    })
                  : null,
              ],
            }),
          ],
        },
        chapter.id
      )
    }),
  ]
}
