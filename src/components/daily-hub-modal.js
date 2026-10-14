// The Dailies hub: one battle-bar button for the daily event, Mystery Gift,
// quests & the Professor's story, the Pokewalker and Companion care. Each is an
// inline sub-view behind a sub-tab (the Trainer hub's bag-tab styling), with a
// claimable dot on any section that has something waiting.
//
// The top-bar button pulses off `hasClaimableDailies`, so a single icon in the
// battle bar stands in for the five it replaced.

import React from 'react'
import { createPortal } from 'react-dom'
import { jsx, jsxs } from 'react/jsx-runtime'
import { claimableMysteryGifts } from '../game/gifts.js'
import { hasClaimableProfessorStory, hasClaimableQuests } from '../game/quests.js'
import { POKEWALKER_MIN_COST } from '../game/pokewalker.js'
import { useGame } from '../game/context.js'
import { CompanionCarePanel } from './companion-panel.js'
import { DailyEventModal } from './daily-event-modal.js'
import { MysteryGiftModal } from './mystery-gift-modal.js'
import { PokewalkerPanel } from './pokewalker-panel.js'
import { QuestsModal } from './quests-modal.js'

/** @typedef {'event' | 'mystery' | 'quests' | 'pokewalker' | 'companion'} DailyHubTab */

/**
 * @typedef {{
 *   id: DailyHubTab,
 *   label: string,
 *   icon: string,
 *   claimable: boolean,
 * }} DailyHubTabDef
 */

/**
 * The hub's sections in display order, each flagged with whether it has
 * something to claim / spend. The Companion tab only appears once Poke Pelago
 * is unlocked, matching the old top-bar button.
 * @param {GameState} state
 * @returns {DailyHubTabDef[]}
 */
export function dailyHubTabs(state) {
  return [
    {
      id: 'event',
      label: 'Event',
      icon: '\u{1f381}',
      claimable: !!state.dailyEvent && !state.dailyEvent.claimed,
    },
    {
      id: 'mystery',
      label: 'Gifts',
      icon: '\u{1f39f}\ufe0f',
      claimable: claimableMysteryGifts(state).length > 0,
    },
    {
      id: 'quests',
      label: 'Quests',
      icon: '\u{1f4dc}',
      claimable: hasClaimableQuests(state.quests) || hasClaimableProfessorStory(state),
    },
    {
      id: 'pokewalker',
      label: 'Walker',
      icon: '\u{1f45f}',
      claimable: (state.pokewalker?.steps ?? 0) >= POKEWALKER_MIN_COST,
    },
    ...(state.unlockedLocations?.includes('alola-poke-pelago')
      ? [
          {
            id: /** @type {const} */ ('companion'),
            label: 'Companion',
            icon: '\u{1f43e}',
            claimable: !!state.companion?.id && state.wildBattlesWon > state.companion.careBattle,
          },
        ]
      : []),
  ]
}

/**
 * Whether any Dailies section has something waiting. Drives the top-bar pulse.
 * @param {GameState} state
 * @returns {boolean}
 */
export function hasClaimableDailies(state) {
  return dailyHubTabs(state).some((tabDef) => tabDef.claimable)
}

/** @param {{ onClose: () => void }} props */
export function DailyHubModal({ onClose }) {
  const { state } = useGame(),
    tabs = dailyHubTabs(state),
    [selectedTab, setSelectedTab] = React.useState(/** @type {DailyHubTab | null} */ (null)),
    // Landing on a waiting section means the pulse leads somewhere useful.
    activeTab =
      tabs.find((tabDef) => tabDef.id === selectedTab)?.id ??
      tabs.find((tabDef) => tabDef.claimable)?.id ??
      tabs[0].id
  return createPortal(
    jsx('div', {
      className: 'modal-overlay',
      onClick: onClose,
      children: jsxs('div', {
        className: 'modal daily-hub-modal',
        onClick: /** @param {React.MouseEvent} mouseEvent */ (mouseEvent) =>
          mouseEvent.stopPropagation(),
        children: [
          jsxs('div', {
            className: 'modal-header',
            children: [
              jsx('span', {
                className: 'modal-title',
                children: 'Dailies',
              }),
              jsx('button', {
                className: 'modal-close',
                onClick: onClose,
                children: 'X',
              }),
            ],
          }),
          jsx('div', {
            className: 'bag-tabs sub-tab-bar daily-hub-tabs',
            children: tabs.map((tabDef) =>
              jsxs(
                'button',
                {
                  className: `bag-tab${activeTab === tabDef.id ? ' active' : ''}`,
                  onClick: () => setSelectedTab(tabDef.id),
                  title: tabDef.claimable ? `${tabDef.label} \u2014 claimable` : tabDef.label,
                  children: [
                    jsx('span', { className: 'daily-hub-tab-icon', children: tabDef.icon }),
                    tabDef.label,
                    tabDef.claimable
                      ? jsx('span', { className: 'daily-hub-tab-dot', children: '\u25cf' })
                      : null,
                  ],
                },
                tabDef.id
              )
            ),
          }),
          activeTab === 'event' && jsx(DailyEventModal, { inline: true }),
          activeTab === 'mystery' && jsx(MysteryGiftModal, { inline: true }),
          activeTab === 'quests' && jsx(QuestsModal, { inline: true }),
          activeTab === 'pokewalker' &&
            jsx('div', {
              className: 'modal-content pokewalker-modal-content',
              children: jsx(PokewalkerPanel, {}),
            }),
          activeTab === 'companion' &&
            jsx('div', {
              className: 'modal-content companion-modal-content',
              children: jsx(CompanionCarePanel, {}),
            }),
        ],
      }),
    }),
    document.body
  )
}
