// Split from a grouped component file.

import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { formatReward } from '../game/progression.js'
import { questLabel } from '../game/quests.js'

/** @param {{ onClose: () => void }} props */
export function QuestsModal({ onClose }) {
  const { state, dispatch } = useGame(),
    quests = state.quests?.list ?? []
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
              children: 'Daily Quests',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsx('div', {
          className: 'battle-info-content quests-content',
          children:
            quests.length > 0
              ? quests.map(/** @param {any} quest */ (quest) => {
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
                                  children: '✓ Claimed',
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
              : jsx('p', {
                  className: 'quests-empty',
                  children: 'No quests yet — check back shortly.',
                }),
        }),
      ],
    }),
  })
}
