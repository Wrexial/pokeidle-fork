// A summary of every Field Job (see game/jobs.js), so all the workers can be
// managed from one place instead of walking back to each activity card.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { completedGenerations, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { createBattlePokemon } from '../game/combat.js'
import {
  JOB_ABILITY_BONUS,
  formatJobCycle,
  jobCycleMs,
  jobLabel,
  jobReadyCount,
} from '../game/jobs.js'
import { activityRewardName } from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { checkShinyOdds, shinyOddsForSpecies } from '../game/progression.js'

/**
 * @param {{ onClose: () => void }} props
 */
export function FieldJobsModal({ onClose }) {
  const { state, dispatch } = useGame(),
    entries = Object.entries(state.jobs ?? {})

  function workerFor(/** @type {string} */ pokemonId) {
    return [...(state.party ?? []), ...(state.box ?? [])].find((member) => member.id === pokemonId)
  }

  function collect(/** @type {string} */ locationId, /** @type {string} */ activityId) {
    dispatch({ type: 'COLLECT_JOB', payload: { locationId, activityId } })
  }

  function callBack(/** @type {string} */ locationId, /** @type {string} */ activityId) {
    dispatch({ type: 'UNASSIGN_JOB', payload: { locationId, activityId } })
  }

  function collectAll() {
    for (const [, job] of entries)
      if (job.money > 0 || Object.keys(job.items ?? {}).length > 0)
        dispatch({
          type: 'COLLECT_JOB',
          payload: { locationId: job.locationId, activityId: job.activityId },
        })
  }

  function fight(
    /** @type {any} */ job,
    /** @type {{ speciesKey: string, level: number }} */ encounter
  ) {
    const isShiny = checkShinyOdds(
      shinyOddsForSpecies(encounter.speciesKey, completedGenerations(state.pokedexCaught))
    )
    const enemy = createBattlePokemon(encounter.speciesKey, encounter.level, {
      isShiny,
      wild: true,
    })
    enemy.fromActivity = true
    dispatch({
      type: 'TAKE_JOB_ENCOUNTER',
      payload: { locationId: job.locationId, activityId: job.activityId },
    })
    dispatch({ type: 'MARK_SEEN', payload: { speciesKey: encounter.speciesKey } })
    dispatch({ type: 'START_ENCOUNTER', payload: { enemy } })
    onClose()
  }

  const anyLoot = entries.some(([, job]) => job.money > 0 || Object.keys(job.items ?? {}).length > 0)

  return jsx('div', {
    className: 'field-jobs-overlay',
    onClick: (/** @type {React.MouseEvent<HTMLDivElement>} */ event) => {
      if (event.target === event.currentTarget) onClose()
    },
    children: jsxs('div', {
      className: 'field-jobs-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Field Jobs',
      children: [
        jsxs('div', {
          className: 'field-jobs-head',
          children: [
            jsx('span', { className: 'field-jobs-title', children: '\u2699\ufe0f Field Jobs' }),
            jsx('button', {
              className: 'job-btn',
              onClick: onClose,
              children: 'CLOSE',
            }),
          ],
        }),
        entries.length === 0
          ? jsx('p', {
              className: 'field-jobs-empty',
              children:
                'No jobs running. Post a Pokemon to a route activity from its card on the location panel.',
            })
          : jsxs('div', {
              className: 'field-jobs-list',
              children: entries.map(([key, job]) => {
                const label = jobLabel(job),
                  worker = workerFor(job.pokemonId),
                  cycleMs = job.cycleMs ?? jobCycleMs(worker?.level ?? 5, worker?.ability),
                  abilityBonus = (JOB_ABILITY_BONUS[worker?.ability ?? ''] ?? 0) > 0,
                  itemEntries = Object.entries(job.items ?? {}).filter(
                    ([, quantity]) => quantity > 0
                  ),
                  fights = job.encounters ?? []
                return jsxs(
                  'div',
                  {
                    className: 'section dark field-job',
                    children: [
                      jsxs('div', {
                        className: 'field-job-head',
                        children: [
                          jsxs('span', {
                            className: 'field-job-name',
                            children: [
                              `${label.icon} `,
                              label.title,
                              jsx('span', {
                                className: 'field-job-location',
                                children: ` \u00b7 ${label.location}`,
                              }),
                            ],
                          }),
                          jsx('button', {
                            className: 'job-btn unassign',
                            onClick: () => callBack(job.locationId, job.activityId),
                            children: 'CALL BACK',
                          }),
                        ],
                      }),
                      jsxs('span', {
                        className: 'field-job-worker',
                        children: [
                          `${worker?.name ?? pokemonSpecies[worker?.speciesKey ?? '']?.name ?? 'A Pokemon'} \u00b7 a find every ~${formatJobCycle(cycleMs)}`,
                          abilityBonus ? ' \u00b7 fast worker' : '',
                        ],
                      }),
                      jobReadyCount(job) === 0
                        ? jsx('span', { className: 'field-job-idle', children: 'Working\u2026' })
                        : jsxs('div', {
                            className: 'field-job-ready',
                            children: [
                              (job.money > 0 || itemEntries.length > 0) &&
                                jsxs('div', {
                                  className: 'job-ready-row',
                                  children: [
                                    jsxs('span', {
                                      className: 'job-ready-items',
                                      children: [
                                        job.money > 0 ? `$${job.money.toLocaleString()}` : '',
                                        job.money > 0 && itemEntries.length > 0 ? ' \u00b7 ' : '',
                                        itemEntries
                                          .map(
                                            ([itemId, quantity]) =>
                                              `${activityRewardName(itemId)} x${quantity}`
                                          )
                                          .join(' \u00b7 '),
                                      ],
                                    }),
                                    jsx('button', {
                                      className: 'job-btn collect',
                                      onClick: () => collect(job.locationId, job.activityId),
                                      children: 'COLLECT',
                                    }),
                                  ],
                                }),
                              fights.length > 0 &&
                                jsxs('div', {
                                  className: 'job-encounters',
                                  children: [
                                    jsx('span', {
                                      className: 'job-encounters-label',
                                      children: `${fights.length} waiting`,
                                    }),
                                    ...fights.slice(0, 4).map((encounter, index) => {
                                      const species = pokemonSpecies[encounter.speciesKey]
                                      return jsxs(
                                        'span',
                                        {
                                          className: 'job-encounter',
                                          title: `${species?.name ?? encounter.speciesKey} Lv.${encounter.level}`,
                                          children: [
                                            jsx('img', {
                                              className: 'job-encounter-sprite',
                                              src: getPokemonSpriteUrl(species?.id ?? 0),
                                              onError: (
                                                /** @type {{ target: HTMLImageElement }} */ event
                                              ) =>
                                                (event.target.src = getPokemonSpriteFallbackUrl(
                                                  species?.id ?? 0
                                                )),
                                              alt: species?.name ?? encounter.speciesKey,
                                            }),
                                            index === 0 &&
                                              jsx('button', {
                                                className: 'job-btn fight',
                                                onClick: () => fight(job, encounter),
                                                children: 'FIGHT',
                                              }),
                                          ],
                                        },
                                        `${key}-${index}`
                                      )
                                    }),
                                  ],
                                }),
                            ],
                          }),
                    ],
                  },
                  key
                )
              }),
            }),
        anyLoot &&
          jsx('button', {
            className: 'job-btn collect field-jobs-collect-all',
            onClick: collectAll,
            children: 'COLLECT ALL',
          }),
      ],
    }),
  })
}
