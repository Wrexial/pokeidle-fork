// A single save slot, shared by the boot slot picker and the Settings panel.

import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { TrainerCard } from './trainer-card.js'

/**
 * @param {{
 *   entry: SaveSlotSummary,
 *   active?: boolean,
 *   onPlay?: () => void,
 *   onNew?: () => void,
 *   onDelete?: () => void,
 * }} props
 */
export function SaveSlotCard({ entry, active, onPlay, onNew, onDelete }) {
  return jsxs('div', {
    className: `save-slot-card${entry.empty ? ' empty' : ''}${active ? ' active' : ''}`,
    children: [
      jsxs('div', {
        className: 'save-slot-head',
        children: [
          jsx('span', { className: 'save-slot-name', children: `Slot ${entry.slot}` }),
          active ? jsx('span', { className: 'save-slot-badge', children: 'ACTIVE' }) : null,
        ],
      }),
      entry.empty
        ? jsx('p', { className: 'save-slot-empty', children: 'Empty' })
        : entry.card
          ? jsxs(Fragment, {
              children: [
                jsx(TrainerCard, { card: entry.card, compact: true }),
                jsxs('div', {
                  className: 'save-slot-info',
                  children: [
                    jsx('div', {
                      className: `save-slot-mode${entry.challenges && entry.challenges.length > 0 ? ' challenge' : ''}`,
                      children:
                        entry.challenges && entry.challenges.length > 0
                          ? `Challenge: ${entry.challenges.join(' · ')}`
                          : 'Normal run',
                    }),
                    entry.savedAt
                      ? jsx('div', {
                          className: 'save-slot-date',
                          children: new Date(entry.savedAt).toLocaleString(),
                        })
                      : null,
                  ],
                }),
              ],
            })
          : jsxs('div', {
              className: 'save-slot-info',
              children: [
                jsxs('div', {
                  className: 'save-slot-region',
                  children: [entry.regionName ?? 'Unknown', ' · Lv.', entry.level ?? 1],
                }),
                jsx('div', {
                  className: `save-slot-mode${entry.challenges && entry.challenges.length > 0 ? ' challenge' : ''}`,
                  children:
                    entry.challenges && entry.challenges.length > 0
                      ? `Challenge: ${entry.challenges.join(' · ')}`
                      : 'Normal run',
                }),
                jsxs('div', {
                  children: [entry.dex ?? 0, ' caught · ', entry.badges ?? 0, ' badges'],
                }),
                entry.savedAt
                  ? jsx('div', {
                      className: 'save-slot-date',
                      children: new Date(entry.savedAt).toLocaleString(),
                    })
                  : null,
              ],
            }),
      jsxs('div', {
        className: 'save-slot-actions',
        children: [
          onPlay && !entry.empty && !active
            ? jsx('button', {
                className: 'settings-save-btn',
                onClick: onPlay,
                children: '▶ Play',
              })
            : null,
          onNew
            ? jsx('button', {
                className: 'settings-save-btn',
                onClick: onNew,
                children: entry.empty ? '＋ New Game' : '↺ New Game',
              })
            : null,
          onDelete && !entry.empty
            ? jsx('button', {
                className: 'settings-save-btn danger',
                onClick: onDelete,
                children: '🗑 Delete',
              })
            : null,
        ],
      }),
    ],
  })
}
