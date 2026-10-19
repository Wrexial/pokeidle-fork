// The Dailies hub: one battle-bar button for the daily event, quests, the
// Professor's story, Companion care, Mystery Gift and the Pokewalker. Each is
// an inline sub-view behind a sub-tab (the Trainer hub's bag-tab styling), with
// a claimable dot on any section that has something waiting.
//
// The top-bar button pulses off `dailyHubStatus`, so a single icon in the
// battle bar stands in for the five it replaced. The button only appears once
// one section is open (`dailyHubStatus`), and a locked section shows what
// milestone opens it (see game/feature-unlocks.js).

import React from 'react'
import { createPortal } from 'react-dom'
import { jsx, jsxs } from 'react/jsx-runtime'
import { featureUnlockHint, isFeatureUnlocked } from '../game/feature-unlocks.js'
import { claimableMysteryGifts } from '../game/gifts.js'
import { hasClaimableProfessorStory, hasClaimableQuests } from '../game/quests.js'
import { POKEWALKER_MIN_COST } from '../game/pokewalker.js'
import { useGame } from '../game/context.js'
import { CompanionCarePanel } from './companion-panel.js'
import { DailyEventModal } from './daily-event-modal.js'
import { MysteryGiftModal } from './mystery-gift-modal.js'
import { PokewalkerPanel } from './pokewalker-panel.js'
import { QuestsModal } from './quests-modal.js'

/** @typedef {'event' | 'quests' | 'story' | 'companion' | 'mystery' | 'pokewalker'} DailyHubTab */

/**
 * @typedef {{
 *   id: DailyHubTab,
 *   label: string,
 *   icon: string,
 *   claimable: boolean,
 *   locked: boolean,
 *   hint: string,
 * }} DailyHubTabDef
 */

/**
 * The hub's sections in display order, each flagged with whether it has
 * something to claim / spend and whether its feature has unlocked yet. The
 * Companion tab only appears once Poke Pelago is unlocked, matching the old
 * top-bar button.
 * @param {GameState} state
 * @returns {DailyHubTabDef[]}
 */
export function dailyHubTabs(state) {
  /**
   * @param {import('../game/feature-unlocks.js').FeatureUnlockId} featureId
   * @param {boolean} claimable
   */
  const section = (featureId, claimable) => {
    const locked = !isFeatureUnlocked(state, featureId)
    return {
      locked,
      hint: locked ? featureUnlockHint(featureId) : '',
      claimable: !locked && claimable,
    }
  }
  return [
    {
      id: 'event',
      label: 'Event',
      icon: '\u{1f381}',
      ...section('dailyEvent', !!state.dailyEvent && !state.dailyEvent.claimed),
    },
    {
      id: 'quests',
      label: 'Quests',
      icon: '\u{1f4dc}',
      ...section('quests', hasClaimableQuests(state.quests)),
    },
    {
      id: 'story',
      label: 'Story',
      icon: '\u{1f4d6}',
      ...section('professorStory', hasClaimableProfessorStory(state)),
    },
    ...(state.unlockedLocations?.includes('alola-poke-pelago')
      ? [
          {
            id: /** @type {const} */ ('companion'),
            label: 'Companion',
            icon: '\u{1f43e}',
            locked: false,
            hint: '',
            claimable: !!state.companion?.id && state.wildBattlesWon > state.companion.careBattle,
          },
        ]
      : []),
    {
      id: 'mystery',
      label: 'Gifts',
      icon: '\u{1f39f}\ufe0f',
      ...section('mysteryGifts', claimableMysteryGifts(state).length > 0),
    },
    {
      id: 'pokewalker',
      label: 'Walker',
      icon: '\u{1f45f}',
      ...section('pokewalker', (state.pokewalker?.steps ?? 0) >= POKEWALKER_MIN_COST),
    },
  ]
}
/**
 * Whether any Dailies section is open yet, and whether an open section has
 * something waiting. Drives the top-bar button and its pulse, so a brand-new
 * save doesn't open an empty hub and a locked section never pulses.
 * @param {GameState} state
 * @returns {{ available: boolean, claimable: boolean }}
 */
export function dailyHubStatus(state) {
  const tabs = dailyHubTabs(state)
  return {
    available: tabs.some((tabDef) => !tabDef.locked),
    claimable: tabs.some((tabDef) => !tabDef.locked && tabDef.claimable),
  }
}

/** @param {{ onClose: () => void }} props */
export function DailyHubModal({ onClose }) {
  const { state } = useGame(),
    tabs = dailyHubTabs(state),
    [selectedTab, setSelectedTab] = React.useState(/** @type {DailyHubTab | null} */ (null)),
    // Landing on a waiting section means the pulse leads somewhere useful;
    // otherwise stay off the locked sections until the player picks one.
    activeTab =
      tabs.find((tabDef) => tabDef.id === selectedTab)?.id ??
      tabs.find((tabDef) => !tabDef.locked && tabDef.claimable)?.id ??
      tabs.find((tabDef) => !tabDef.locked)?.id ??
      tabs[0].id,
    activeTabDef = tabs.find((tabDef) => tabDef.id === activeTab) ?? tabs[0]
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
                  className: `bag-tab${activeTab === tabDef.id ? ' active' : ''}${tabDef.locked ? ' locked' : ''}`,
                  onClick: () => setSelectedTab(tabDef.id),
                  title: tabDef.locked
                    ? `${tabDef.label} \u2014 ${tabDef.hint}`
                    : tabDef.claimable
                      ? `${tabDef.label} \u2014 claimable`
                      : tabDef.label,
                  children: [
                    jsx('span', { className: 'daily-hub-tab-icon', children: tabDef.icon }),
                    tabDef.label,
                    tabDef.locked
                      ? jsx('span', { className: 'daily-hub-tab-lock', children: '\u{1f512}' })
                      : tabDef.claimable
                        ? jsx('span', { className: 'daily-hub-tab-dot', children: '\u25cf' })
                        : null,
                  ],
                },
                tabDef.id
              )
            ),
          }),
          activeTabDef.locked
            ? jsxs('div', {
                className: 'modal-content daily-hub-locked',
                children: [
                  jsx('span', { className: 'daily-hub-locked-icon', children: '\u{1f512}' }),
                  jsx('span', {
                    className: 'daily-hub-locked-title',
                    children: `${activeTabDef.label} is locked`,
                  }),
                  jsx('span', {
                    className: 'daily-hub-locked-hint',
                    children: activeTabDef.hint,
                  }),
                ],
              })
            : null,
          !activeTabDef.locked && activeTab === 'event' && jsx(DailyEventModal, { inline: true }),
          !activeTabDef.locked && activeTab === 'quests' && jsx(QuestsModal, { view: 'daily' }),
          !activeTabDef.locked && activeTab === 'story' && jsx(QuestsModal, { view: 'story' }),
          !activeTabDef.locked &&
            activeTab === 'companion' &&
            jsx('div', {
              className: 'modal-content companion-modal-content',
              children: jsx(CompanionCarePanel, {}),
            }),
          !activeTabDef.locked && activeTab === 'mystery' && jsx(MysteryGiftModal, { inline: true }),
          !activeTabDef.locked &&
            activeTab === 'pokewalker' &&
            jsx('div', {
              className: 'modal-content pokewalker-modal-content',
              children: jsx(PokewalkerPanel, {}),
            }),
        ],
      }),
    }),
    document.body
  )
}
