// The battle top-bar menus: Info, Settings, the daily event, quests and
// Companion care.
//
// They are rendered by BattleScreen, outside BattleScene's phase switch. That
// matters because the phase scenes (healing, evolution, the minigames) replace
// the whole battle tree — if these menus lived inside it an automatic heal
// mid-session would close a menu the player already had open.

import React from 'react'
import { createPortal } from 'react-dom'
import { jsx, jsxs } from 'react/jsx-runtime'
import { shinyFullOddsChance } from '../data/config.js'
import { completedGenerations, speciesKeysByGeneration } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { shinyOddsForCompletedGenerations } from '../game/progression.js'
import { CompanionCarePanel } from './companion-panel.js'
import { DailyEventModal } from './daily-event-modal.js'
import { QuestsModal } from './quests-modal.js'
import { SettingsModal } from './settings-modal.js'

/**
 * @typedef {'info' | 'settings' | 'daily' | 'quests' | 'companion'} BattleMenuKey
 */

/** @param {{ menu: BattleMenuKey | null, onClose: () => void }} props */
export function BattleMenuModals({ menu, onClose }) {
  const { state } = useGame(),
    completedGenerationSet = React.useMemo(
      () => completedGenerations(state.pokedexCaught),
      [state.pokedexCaught]
    ),
    caughtSpeciesSet = React.useMemo(
      () => new Set(state.pokedexCaught),
      [state.pokedexCaught]
    ),
    shinyCharmOdds = shinyOddsForCompletedGenerations(
      completedGenerationSet.size,
      speciesKeysByGeneration.length
    )
  if (menu === 'settings') return createPortal(jsx(SettingsModal, { onClose }), document.body)
  if (menu === 'daily') return createPortal(jsx(DailyEventModal, { onClose }), document.body)
  if (menu === 'quests') return createPortal(jsx(QuestsModal, { onClose }), document.body)
  if (menu === 'companion')
    return createPortal(
      jsx('div', {
        className: 'battle-info-overlay',
        onClick: onClose,
        children: jsxs('div', {
          className: 'battle-info-modal companion-modal',
          onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
          children: [
            jsxs('div', {
              className: 'battle-info-header',
              children: [
                jsx('span', {
                  className: 'battle-info-title',
                  children: 'Companion',
                }),
                jsx('button', {
                  className: 'battle-info-close',
                  onClick: onClose,
                  children: 'X',
                }),
              ],
            }),
            jsx('div', {
              className: 'battle-info-content companion-modal-content',
              children: jsx(CompanionCarePanel, {}),
            }),
          ],
        }),
      }),
      document.body
    )
  if (menu === 'info')
    return createPortal(
      jsx('div', {
        className: 'battle-info-overlay',
        onClick: onClose,
        children: jsxs('div', {
          className: 'battle-info-modal',
          onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
          children: [
            jsxs('div', {
              className: 'battle-info-header',
              children: [
                jsx('span', {
                  className: 'battle-info-title',
                  children: 'Info',
                }),
                jsx('button', {
                  className: 'battle-info-close',
                  onClick: onClose,
                  children: 'X',
                }),
              ],
            }),
            jsxs('div', {
              className: 'battle-info-content',
              children: [
                jsxs('p', {
                  children: [
                    "Hello and welcome to Pokemon Idle! Please be aware that this game is still in the very early stages of development so I welcome any and all feedback. I apologize for the lack of detailed tutorial system but I just haven't had a chance. Feel free to join the ",
                    jsx('a', {
                      href: 'https://www.reddit.com/r/PkmnIdle/',
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      children: 'Pokemon Idle subreddit',
                    }),
                    ' to ask questions or find answers to questions others have asked.',
                  ],
                }),
                jsx('p', {
                  children: 'Head out to a route to begin your Pokemon adventure!',
                }),
                jsxs('div', {
                  className: 'info-shiny-stats',
                  children: [
                    jsxs('span', {
                      children: ['Shinies seen: ', state.shinySeen.length],
                    }),
                    jsxs('span', {
                      children: ['Shinies caught: ', state.shinyCaught.length],
                    }),
                    jsx('span', {
                      children:
                        completedGenerationSet.size > 0
                          ? `Shiny odds: 1/${shinyFullOddsChance}, or 1/${shinyCharmOdds} for a completed generation (${completedGenerationSet.size}/${speciesKeysByGeneration.length} charms)`
                          : `Shiny odds: 1/${shinyFullOddsChance} - complete a generation to unlock its Shiny Charm`,
                    }),
                    jsx('div', {
                      className: 'info-shiny-generations',
                      children: speciesKeysByGeneration.map((requiredSpecies, generationIndex) => {
                        const isComplete = completedGenerationSet.has(generationIndex),
                          caughtCount = requiredSpecies.filter((speciesKey) =>
                            caughtSpeciesSet.has(speciesKey)
                          ).length
                        return jsxs(
                          'span',
                          {
                            className: `info-shiny-gen${isComplete ? ' complete' : ''}`,
                            children: [
                              `Gen ${generationIndex + 1} `,
                              isComplete ? '✓ Shiny Charm' : `${caughtCount}/${requiredSpecies.length}`,
                            ],
                          },
                          generationIndex
                        )
                      }),
                    }),
                    jsx('span', {
                      className: 'info-shiny-hint',
                      children:
                        'Catch every Pokemon in a generation to unlock its Shiny Charm (2x shiny rate)',
                    }),
                  ],
                }),
                jsx('button', {
                  className: 'patch-notes-link-btn',
                  onClick: () => {
                    window.location.hash = 'patchnotes'
                  },
                  children: 'View Patch Notes',
                }),
              ],
            }),
          ],
        }),
      }),
      document.body
    )
  return null
}
