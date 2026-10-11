// Field research for one species: its tasks, progress and earned points, plus
// the Research Shop where the points are spent. Shown in the Pokedex detail.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { consumableItems, evolutionItems, heldItems, pokeBalls } from '../data/items.js'
import { useGame } from '../game/context.js'
import { RESEARCH_SHOP, speciesResearch } from '../game/research.js'
import { ItemIcon } from './item-icon.js'

/** @param {string} itemId */
function itemName(itemId) {
  return (
    consumableItems[itemId]?.name ??
    evolutionItems[itemId]?.name ??
    heldItems[itemId]?.name ??
    pokeBalls[itemId]?.name ??
    itemId
  )
}

/**
 * @param {{ onClose: () => void }} props
 */
function ResearchShopModal({ onClose }) {
  const { state, dispatch } = useGame(),
    points = state.researchPoints ?? 0
  return jsx('div', {
    className: 'field-jobs-overlay',
    onClick: (/** @type {React.MouseEvent<HTMLDivElement>} */ event) => {
      if (event.target === event.currentTarget) onClose()
    },
    children: jsxs('div', {
      className: 'field-jobs-modal research-shop-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Research Shop',
      children: [
        jsxs('div', {
          className: 'field-jobs-head',
          children: [
            jsxs('span', {
              className: 'field-jobs-title',
              children: [`\u{1f52c} Research Shop \u00b7 `, `${points} RP`],
            }),
            jsx('button', { className: 'job-btn', onClick: onClose, children: 'CLOSE' }),
          ],
        }),
        jsxs('div', {
          className: 'research-shop-list',
          children: RESEARCH_SHOP.map((row) => {
            const owned = state.inventory[row.itemId] ?? 0,
              affordable = points >= row.cost
            return jsxs(
              'div',
              {
                className: 'research-shop-row',
                children: [
                  jsx(ItemIcon, { itemId: row.itemId }),
                  jsxs('span', {
                    className: 'research-shop-name',
                    children: [
                      itemName(row.itemId),
                      owned > 0
                        ? jsx('span', { className: 'research-shop-owned', children: ` (owned ${owned})` })
                        : null,
                    ],
                  }),
                  jsx('span', {
                    className: `research-shop-cost${affordable ? '' : ' short'}`,
                    children: `${row.cost} RP`,
                  }),
                  jsx('button', {
                    className: 'job-btn collect',
                    disabled: !affordable,
                    onClick: () =>
                      dispatch({ type: 'BUY_RESEARCH_ITEM', payload: { itemId: row.itemId } }),
                    children: 'BUY',
                  }),
                ],
              },
              row.itemId
            )
          }),
        }),
      ],
    }),
  })
}

/**
 * @param {{ speciesKey: string }} props
 */
export function ResearchPanel({ speciesKey }) {
  const { state } = useGame(),
    [shopOpen, setShopOpen] = React.useState(false),
    research = speciesResearch(state, speciesKey),
    points = state.researchPoints ?? 0
  return jsxs('div', {
    className: 'research-panel',
    children: [
      jsxs('div', {
        className: 'research-head',
        children: [
          jsx('span', { className: 'research-title', children: '\u{1f52c} Field research' }),
          jsxs('span', {
            className: `research-level${research.complete ? ' complete' : ''}`,
            children: [
              `Lv.${research.level}`,
              ' \u00b7 ',
              `${research.earned}/${research.max} RP`,
              research.complete ? ' \u00b7 COMPLETE' : '',
            ],
          }),
          jsxs('button', {
            className: 'job-btn collect',
            onClick: () => setShopOpen(true),
            children: [`SHOP \u00b7 ${points} RP`],
          }),
        ],
      }),
      jsx('ul', {
        className: 'research-tasks',
        children: research.tasks.map((task) =>
          jsxs(
            'li',
            {
              className: `research-task${task.done ? ' done' : ''}`,
              children: [
                jsx('span', { className: 'research-task-label', children: task.label }),
                jsxs('span', {
                  className: 'research-task-progress',
                  children: task.done
                    ? `\u2714 +${task.points} RP`
                    : `${task.progress}/${task.need} \u00b7 +${task.points} RP`,
                }),
              ],
            },
            task.id
          )
        ),
      }),
      shopOpen && jsx(ResearchShopModal, { onClose: () => setShopOpen(false) }),
    ],
  })
}
