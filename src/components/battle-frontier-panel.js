// Battle Frontier panel (#66), shown while standing on the Frontier grounds.
// Three rule-variant facilities built on the Battle Tower's deterministic floor
// puzzle: the Factory (rental team), the Arena (inverse type chart) and the
// Palace (no held items).

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import {
  FRONTIER_FACILITIES,
  buildRentalParty,
  frontierBossBattle,
} from '../game/battle-frontier.js'
import { isBattleReady } from '../game/pokemon.js'

/** Phases during which a Frontier run cannot be started. */
const FRONTIER_BUSY_PHASES = [
  'evolving',
  'healing',
  'catching',
  'bugCatching',
  'safari',
  'academyQuiz',
  'mining',
  'gameCorner',
  'routeActivity',
  'wonderTrade',
]

export function BattleFrontierPanel() {
  const { state, dispatch } = useGame(),
    isBusy = FRONTIER_BUSY_PHASES.includes(state.phase),
    hasFighter = state.party.some((member) => isBattleReady(member)),
    // The floor/team previews are deterministic, so only rebuild them when the
    // records change (the location panel re-renders on every idle tick).
    facilities = React.useMemo(
      () =>
        FRONTIER_FACILITIES.map((facility) => {
          const best = state.frontierBest?.[facility.id] ?? 0,
            nextFloor = Math.max(state.frontierFloor?.[facility.id] ?? 0, best + 1)
          return {
            facility,
            best,
            nextFloor,
            opponent: frontierBossBattle(facility.id, nextFloor).trainerTeam,
            rental: facility.rule === 'rental' ? buildRentalParty(nextFloor) : null,
          }
        }),
      [state.frontierBest, state.frontierFloor]
    )

  /** @param {{ id: string, name: string, rule: string }} facility @param {number} floor */
  function startFloor(facility, floor) {
    if (isBusy) return
    if (state.phase === 'battling' || state.phase === 'victory' || state.phase === 'defeat')
      dispatch({ type: 'PHASE_IDLE' })
    dispatch({
      type: 'START_FRONTIER',
      payload: { facilityId: facility.id, floor },
    })
    dispatch({
      type: 'START_HEALING',
      payload: { pendingBossBattle: frontierBossBattle(facility.id, floor) },
    })
  }

  return jsxs('div', {
    className: 'location-frontier',
    children: [
      jsxs('div', {
        className: 'location-section-title',
        children: ['Battle Frontier'],
      }),
      jsx('div', {
        className: 'frontier-hint',
        children:
          'Three rule-variant facilities beside the Tower, each a single deterministic puzzle floor: win to climb, lose and retry the same floor. Every ten floors pay a Victory Token.',
      }),
      jsx('div', {
        className: 'frontier-facility-list',
        children: facilities.map(({ facility, best, nextFloor, opponent, rental }) => {
          const canFight = !isBusy && (facility.rule === 'rental' || hasFighter)
          return jsxs(
            'div',
            {
              className: `frontier-facility frontier-${facility.id}`,
              children: [
                jsxs('div', {
                  className: 'frontier-facility-head',
                  children: [
                    jsx('span', {
                      className: 'frontier-facility-icon',
                      children: facility.icon,
                    }),
                    jsxs('div', {
                      className: 'frontier-facility-title',
                      children: [
                        jsx('span', {
                          className: 'frontier-facility-name',
                          children: facility.name,
                        }),
                        jsx('span', {
                          className: 'frontier-facility-tagline',
                          children: facility.tagline,
                        }),
                      ],
                    }),
                    best > 0 &&
                      jsx('span', {
                        className: 'frontier-facility-best',
                        children: `Best ${best}`,
                      }),
                  ],
                }),
                jsx('p', {
                  className: 'frontier-facility-hint',
                  children: facility.hint,
                }),
                jsxs('div', {
                  className: 'frontier-facility-preview',
                  children: [
                    jsx('span', {
                      className: 'frontier-preview-title',
                      children: `Floor ${nextFloor} opponent:`,
                    }),
                    jsx('div', {
                      className: 'frontier-preview-list',
                      children: opponent.map((member) =>
                        jsxs(
                          'span',
                          {
                            className: 'frontier-preview-member',
                            children: [
                              member.name,
                              jsx('span', {
                                className: 'frontier-preview-level',
                                children: ` Lv.${member.level}`,
                              }),
                            ],
                          },
                          member.speciesKey
                        )
                      ),
                    }),
                  ],
                }),
                rental &&
                  jsxs('div', {
                    className: 'frontier-facility-preview frontier-rental-preview',
                    children: [
                      jsx('span', {
                        className: 'frontier-preview-title',
                        children: 'Your rental team:',
                      }),
                      jsx('div', {
                        className: 'frontier-preview-list rental',
                        children: rental.map((member) =>
                          jsxs(
                            'span',
                            {
                              className: 'frontier-preview-member rental',
                              children: [
                                member.name,
                                jsx('span', {
                                  className: 'frontier-preview-level',
                                  children: ` Lv.${member.level}`,
                                }),
                              ],
                            },
                            member.id
                          )
                        ),
                      }),
                    ],
                  }),
                jsx('button', {
                  className: 'gym-fight-btn champion frontier-fight-btn',
                  disabled: !canFight,
                  onClick: () => startFloor(facility, nextFloor),
                  children:
                    facility.rule !== 'rental' && !hasFighter
                      ? 'NO BATTLE-READY POKEMON'
                      : nextFloor > 1
                        ? `FIGHT FLOOR ${nextFloor}`
                        : `ENTER ${facility.name.toUpperCase()}`,
                }),
              ],
            },
            facility.id
          )
        })
      }),
    ],
  })
}
