// Split from a grouped component file.

import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { formatAwayDuration, formatReward } from '../game/progression.js'

/**
 * "While you were away" report shown once after returning to a saved game.
 * The reward itself is already applied by the save loader; this just reports it.
 */
export function OfflineProgressModal() {
  const { state, dispatch } = useGame(),
    report = state.offlineReport
  if (!report) return null
  const dismiss = () => dispatch({ type: 'CLEAR_OFFLINE_REPORT' })
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: dismiss,
    children: jsxs('div', {
      className: 'battle-info-modal offline-report-modal',
      onClick: /** @param {React.MouseEvent} mouseEvent */ (mouseEvent) =>
        mouseEvent.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'While You Were Away',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: dismiss,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content offline-report-content',
          children: [
            jsx('span', {
              className: 'offline-report-time',
              children: `You were away for ${formatAwayDuration(report.awayMs)}`,
            }),
            jsx('span', {
              className: 'offline-report-hint',
              children: 'Your Pokemon kept busy while you were gone.',
            }),
            jsx('div', {
              className: 'offline-report-reward',
              children: formatReward(report),
            }),
            report.jobs && report.jobs.length > 0
              ? jsxs('div', {
                  className: 'offline-report-jobs',
                  children: [
                    jsx('span', {
                      className: 'offline-report-jobs-title',
                      children: 'Field Jobs ran while you were away',
                    }),
                    report.jobs.map((job, index) => {
                      const reward = formatReward({ money: job.money, items: job.items })
                      return jsxs(
                        'div',
                        {
                          className: 'offline-report-job',
                          children: [
                            jsxs('span', {
                              className: 'offline-report-job-name',
                              children: [job.icon, ' ', job.title, ' \u00b7 ', job.location],
                            }),
                            jsx('span', {
                              className: 'offline-report-job-detail',
                              children: [
                                `${job.cycles} cycle${job.cycles === 1 ? '' : 's'}`,
                                job.encounters > 0
                                  ? ` \u00b7 ${job.encounters} Pokemon wandered in`
                                  : '',
                                reward ? ` \u00b7 ${reward}` : '',
                              ].join(''),
                            }),
                          ],
                        },
                        `${job.title}-${index}`
                      )
                    }),
                  ],
                })
              : null,
            report.systems && report.systems.length > 0
              ? jsxs('div', {
                  className: 'offline-report-jobs',
                  children: [
                    jsx('span', {
                      className: 'offline-report-jobs-title',
                      children: 'Kept running while you were away',
                    }),
                    report.systems.map((system, index) =>
                      jsx(
                        'div',
                        {
                          className: 'offline-report-job',
                          children: jsx('span', {
                            className: 'offline-report-job-name',
                            children: system.label,
                          }),
                        },
                        `${system.id}-${index}`
                      )
                    ),
                  ],
                })
              : null,
            jsx('button', {
              className: 'offline-report-btn',
              onClick: dismiss,
              children: 'Nice!',
            }),
          ],
        }),
      ],
    }),
  })
}
