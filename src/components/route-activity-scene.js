// Route-attached minigames (fishing, foraging): a full-stage timing game in
// the `routeActivity` phase. Encounter activities start a normal wild battle so
// they run through the usual catch flow; loot activities pay items and money.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { completedGenerations, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { createBattlePokemon } from '../game/combat.js'
import {
  ACTIVITY_ATTEMPTS,
  ACTIVITY_HIT_ZONE,
  ACTIVITY_PERFECT_ZONE,
  ACTIVITY_SWEEP_MS,
  ROUTE_ACTIVITIES,
  activityRewardName,
  rollActivityEncounter,
  rollActivityLoot,
} from '../game/minigames.js'
import { checkShinyOdds, shinyOddsForSpecies } from '../game/progression.js'

export function RouteActivityScene() {
  const { state, dispatch } = useGame(),
    activityId = state.routeActivity,
    activity = activityId ? ROUTE_ACTIVITIES[activityId] : null,
    routeKey = mapData[state.currentLocation]?.routeKey ?? state.currentRoute,
    [attemptsLeft, setAttemptsLeft] = React.useState(ACTIVITY_ATTEMPTS),
    [position, setPosition] = React.useState(0.5),
    [stage, setStage] = React.useState(/** @type {'aiming' | 'result' | 'done'} */ ('aiming')),
    [message, setMessage] = React.useState(''),
    [found, setFound] = React.useState(/** @type {{ itemId: string, quantity: number }[]} */ ([]))

  // Sweep the marker back and forth while the player is aiming.
  React.useEffect(() => {
    if (stage !== 'aiming') return
    let frame = 0
    const start = performance.now()
    const loop = /** @param {number} now */ (now) => {
      const progress = ((now - start) % ACTIVITY_SWEEP_MS) / ACTIVITY_SWEEP_MS
      setPosition((Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [stage])

  if (!activity) return null

  function leave() {
    dispatch({ type: 'END_ROUTE_ACTIVITY' })
  }

  function stop() {
    if (!activity || stage !== 'aiming') return
    const distance = Math.abs(position - 0.5),
      perfect = distance <= ACTIVITY_PERFECT_ZONE,
      hit = distance <= ACTIVITY_HIT_ZONE,
      nextAttempts = attemptsLeft - 1
    setAttemptsLeft(nextAttempts)
    if (!hit) {
      setMessage(
        activity.mode === 'encounter' ? 'The Pokemon got away...' : 'You found nothing.'
      )
      setStage(nextAttempts <= 0 ? 'done' : 'result')
      return
    }
    if (activity.mode === 'encounter') {
      const encounter = rollActivityEncounter(activity.id, routeKey, perfect)
      if (!encounter) {
        setMessage('Nothing is biting here.')
        setStage(nextAttempts <= 0 ? 'done' : 'result')
        return
      }
      // A hooked Pokemon runs through the normal wild-battle flow.
      const completedGenerationSet = completedGenerations(state.pokedexCaught)
      ;(dispatch({
        type: 'START_ENCOUNTER',
        payload: {
          enemy: createBattlePokemon(encounter.speciesKey, encounter.level, {
            isShiny: checkShinyOdds(
              Math.max(1, shinyOddsForSpecies(encounter.speciesKey, completedGenerationSet))
            ),
            wild: true,
          }),
        },
      }),
        dispatch({ type: 'MARK_SEEN', payload: { speciesKey: encounter.speciesKey } }))
      return
    }
    const reward = rollActivityLoot(perfect),
      money = perfect ? 200 + Math.floor(Math.random() * 201) : 80 + Math.floor(Math.random() * 121)
    setFound((current) => [...current, reward])
    setMessage(
      `${perfect ? 'A great find! ' : ''}You gathered ${activityRewardName(reward.itemId)} x${reward.quantity}.`
    )
    dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: { money, items: [reward] } })
    setStage(nextAttempts <= 0 ? 'done' : 'result')
  }

  const hitWidth = ACTIVITY_HIT_ZONE * 200,
    perfectWidth = ACTIVITY_PERFECT_ZONE * 200
  return jsxs('div', {
    className: `minigame-scene route-activity-scene activity-${activity.id}`,
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsxs('span', {
            className: 'minigame-scene-title',
            children: [`${activity.icon} `, activity.title],
          }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `${attemptsLeft} / ${ACTIVITY_ATTEMPTS} tries`,
              ' \u00b7 ',
              `$${state.money.toLocaleString()}`,
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsx('div', { className: 'activity-hint', children: activity.hint }),
          jsxs('div', {
            className: `activity-bar${stage === 'aiming' ? '' : ' locked'}`,
            children: [
              jsx('div', {
                className: 'activity-zone activity-zone-hit',
                style: { left: `${50 - hitWidth / 2}%`, width: `${hitWidth}%` },
              }),
              jsx('div', {
                className: 'activity-zone activity-zone-perfect',
                style: { left: `${50 - perfectWidth / 2}%`, width: `${perfectWidth}%` },
              }),
              jsx('div', {
                className: 'activity-marker',
                style: { left: `${position * 100}%` },
              }),
            ],
          }),
          message && jsx('div', { className: 'activity-message', children: message }),
          activity.mode === 'loot' &&
            found.length > 0 &&
            jsx('div', {
              className: 'activity-found',
              children: `Found: ${found
                .map((entry) => `${activityRewardName(entry.itemId)} x${entry.quantity}`)
                .join('  \u00b7  ')}`,
            }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-footer',
        children:
          stage === 'aiming'
            ? jsxs('div', {
                className: 'activity-actions',
                children: [
                  jsx('button', {
                    className: 'move-panel-btn confirm',
                    onClick: stop,
                    children: activity.action,
                  }),
                  jsx('button', {
                    className: 'move-panel-btn',
                    onClick: leave,
                    children: 'LEAVE',
                  }),
                ],
              })
            : jsxs('div', {
                className: 'activity-actions',
                children: [
                  stage === 'done'
                    ? jsx('button', {
                        className: 'move-panel-btn confirm',
                        onClick: leave,
                        children: 'LEAVE',
                      })
                    : jsx('button', {
                        className: 'move-panel-btn confirm',
                        onClick: () => setStage('aiming'),
                        children: 'TRY AGAIN',
                      }),
                ],
              }),
      }),
    ],
  })
}
