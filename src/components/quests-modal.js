// The Dailies hub's Quests and Story sub-views: the daily quest list and the
// chained regional Professor's story, rendered inline by `daily-hub-modal.js`.

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

/**
 * The daily quest list (`view: 'daily'`) or the Professor's story
 * (`view: 'story'`). Rendered inline as the Dailies hub's two sub-views.
 * @param {{ view?: 'daily' | 'story' }} props
 */
export function QuestsModal({ view = 'daily' }) {
  const { state, dispatch } = useGame(),
    quests = state.quests?.list ?? [],
    story = professorStoryStatus(state)
  return jsx('div', {
    className: 'modal-content quests-content',
    children: view === 'story' ? renderStory(story, dispatch) : renderDaily(quests, dispatch),
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
        className: `section quest${complete ? ' complete' : ''}${quest.claimed ? ' claimed' : ''}`,
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
