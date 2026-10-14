// Run Summary modal: a shareable recap of a run's high points — headline stats,
// a few record callouts and the recorded milestone timeline (see
// game/milestones.js). Rendered as an overlay from the top bar, or inline from
// the Backpack's Records tab, and exportable as a PNG.

import React from 'react'
import { createPortal } from 'react-dom'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import {
  MILESTONE_GROUPS,
  MILESTONE_KINDS,
  formatMilestoneAge,
  milestoneLabel,
  summarizeRun,
} from '../game/milestones.js'
import { exportRunSummaryPng } from '../game/run-summary-export.js'

/** @param {{ onClose?: () => void, inline?: boolean }} props */
export function RunSummaryModal({ onClose, inline = false }) {
  const { state } = useGame(),
    [exportStatus, setExportStatus] = React.useState(''),
    [group, setGroup] = React.useState('all'),
    summary = React.useMemo(() => summarizeRun(state), [state]),
    filtered =
      group === 'all'
        ? summary.milestones
        : summary.milestones.filter(
            /** @param {any} milestone */ milestone =>
              MILESTONE_KINDS[milestone.kind]?.group === group
          ),
    // Newest first reads best in a recap.
    timeline = [...filtered].reverse(),
    stats = [
      ['Dex', summary.stats.caught],
      ['Shinies', summary.stats.shinies],
      ['Badges', summary.stats.badges],
      ['Lv.100', summary.stats.level100],
      ['Battles', summary.stats.battles],
      ['Regions', summary.stats.regions],
    ]

  async function exportSummary() {
    setExportStatus('Rendering…')
    const ok = await exportRunSummaryPng(summary).catch(() => false)
    setExportStatus(ok ? 'Summary downloaded!' : 'Could not export the summary.')
  }

  /** @param {any} milestone */
  function renderMilestone(milestone) {
    const info = MILESTONE_KINDS[milestone.kind]
    return jsxs(
      'div',
      {
        className: `run-summary-event kind-${milestone.kind}`,
        children: [
          jsx('span', {
            className: 'run-summary-event-icon',
            children: info?.icon ?? '\u2022',
          }),
          jsxs('span', {
            className: 'run-summary-event-text',
            children: [
              jsx('span', {
                className: 'run-summary-event-label',
                children: milestoneLabel(milestone),
              }),
              milestone.detail
                ? jsx('span', {
                    className: 'run-summary-event-detail',
                    children: milestone.detail,
                  })
                : null,
            ],
          }),
          jsx('span', {
            className: 'run-summary-event-age',
            children: formatMilestoneAge(milestone),
          }),
        ],
      },
      milestone.id
    )
  }

  const content = jsxs('div', {
    className: inline ? 'records-inline run-summary-inline' : 'battle-info-modal run-summary-modal',
    ...(inline
      ? {}
      : { onClick: /** @param {React.MouseEvent} event */ event => event.stopPropagation() }),
    children: [
      jsxs('div', {
        className: 'battle-info-header',
        children: [
          jsx('span', { className: 'battle-info-title', children: 'Run Summary' }),
          onClose &&
            jsx('button', { className: 'battle-info-close', onClick: onClose, children: 'X' }),
        ],
      }),
      jsxs('div', {
        className: 'battle-info-content run-summary-content',
        children: [
          jsxs('div', {
            className: 'run-summary-identity',
            children: [
              jsx('span', { className: 'run-summary-name', children: summary.trainerName }),
              summary.title
                ? jsx('span', { className: 'run-summary-title', children: summary.title })
                : null,
              jsxs('span', {
                className: 'run-summary-region',
                children: [
                  summary.regionName,
                  summary.starterName ? ` \u00b7 Starter ${summary.starterName}` : '',
                ],
              }),
            ],
          }),
          jsx('div', {
            className: 'run-summary-stats',
            children: stats.map(([label, value]) =>
              jsxs(
                'div',
                {
                  className: 'run-summary-stat',
                  children: [
                    jsx('span', { className: 'run-summary-stat-value', children: value }),
                    jsx('span', { className: 'run-summary-stat-label', children: label }),
                  ],
                },
                label
              )
            ),
          }),
          jsxs('div', {
            className: 'run-summary-callouts',
            children: [
              summary.firstShiny
                ? jsxs('span', {
                    className: 'run-summary-callout',
                    children: ['\u{1f31f} First shiny: ', summary.firstShiny.name],
                  })
                : null,
              summary.firstLevel100
                ? jsxs('span', {
                    className: 'run-summary-callout',
                    children: ['\u{1f4af} First Lv.100: ', summary.firstLevel100.name],
                  })
                : null,
              summary.stats.champions > 0
                ? jsxs('span', {
                    className: 'run-summary-callout',
                    children: [
                      '\u{1f451} ',
                      `${summary.stats.champions} champion${summary.stats.champions === 1 ? '' : 's'} beaten`,
                    ],
                  })
                : null,
            ],
          }),
          jsxs('div', {
            className: 'run-summary-actions',
            children: [
              jsx('button', {
                className: 'settings-save-btn',
                onClick: exportSummary,
                children: '\u2b07 Export Summary (PNG)',
              }),
              exportStatus
                ? jsx('span', { className: 'trainer-card-export-status', children: exportStatus })
                : null,
            ],
          }),
          jsxs('div', {
            className: 'run-summary-timeline-head',
            children: [
              jsx('span', {
                className: 'section-title',
                children: `Milestones \u00b7 ${summary.milestones.length}`,
              }),
              jsx('div', {
                className: 'run-summary-filters',
                children: MILESTONE_GROUPS.map(entry =>
                  jsx(
                    'button',
                    {
                      className: `run-summary-filter${group === entry.id ? ' active' : ''}`,
                      onClick: () => setGroup(entry.id),
                      children: entry.label,
                    },
                    entry.id
                  )
                ),
              }),
            ],
          }),
          timeline.length > 0
            ? jsx('div', {
                className: 'run-summary-timeline',
                children: timeline.map(renderMilestone),
              })
            : jsx('p', {
                className: 'settings-hint run-summary-empty',
                children:
                  group === 'all'
                    ? 'No milestones yet — catch, battle and explore to fill this in.'
                    : 'Nothing in this category yet.',
              }),
        ],
      }),
    ],
  })

  if (inline) return content
  return createPortal(
    jsx('div', {
      className: 'battle-info-overlay',
      onClick: onClose,
      children: content,
    }),
    document.body
  )
}
