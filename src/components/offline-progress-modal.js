// Split from a grouped component file — see tools/decompile/split-components.mjs

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
