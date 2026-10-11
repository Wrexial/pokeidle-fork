// Field Jobs UI: shown under each route-activity card on the location panel.
// Lets the player post a Pokemon to keep the activity running, then collect the
// money/items it banks and battle any wild Pokemon that wandered in.

import { jsx, jsxs } from 'react/jsx-runtime'
import { completedGenerations, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { createBattlePokemon } from '../game/combat.js'
import { JOB_ABILITY_BONUS, JOB_SLOTS, formatJobCycle, jobCycleMs, jobKey, jobReadyCount } from '../game/jobs.js'
import { ROUTE_ACTIVITIES, activityRewardName } from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { checkShinyOdds, shinyOddsForSpecies } from '../game/progression.js'

/**
 * The Pokemon that would take a new job: the first party member, else the first
 * boxed one.
 * @param {GameState} state
 * @returns {any | null}
 */
function defaultWorker(state) {
  return state.party?.[0] ?? state.box?.[0] ?? null
}

/**
 * @param {{ locationId: string, activityId: string }} props
 */
export function JobControls({ locationId, activityId }) {
  const { state, dispatch } = useGame(),
    key = jobKey(locationId, activityId),
    job = (state.jobs ?? {})[key] ?? null,
    activity = ROUTE_ACTIVITIES[activityId],
    slotsUsed = Object.keys(state.jobs ?? {}).length,
    slotsFull = slotsUsed >= JOB_SLOTS,
    worker = job ? [...(state.party ?? []), ...(state.box ?? [])].find((p) => p.id === job.pokemonId) : null,
    ready = job ? jobReadyCount(job) : 0,
    progress = job
      ? Math.min(1, job.progressMs / (job.cycleMs ?? jobCycleMs(worker?.level ?? 5, worker?.ability)))
      : 0,
    itemEntries = job ? Object.entries(job.items ?? {}).filter(([, quantity]) => quantity > 0) : [],
    encounters = job?.encounters ?? [],
    cycleMs = job ? (job.cycleMs ?? jobCycleMs(worker?.level ?? 5, worker?.ability)) : 0,
    abilityBonus =
      job && (JOB_ABILITY_BONUS[worker?.ability ?? ''] ?? 0) > 0
        ? `fast worker (${worker?.ability ?? 'ability'})`
        : null,
    hasLoot = (job?.money ?? 0) > 0 || itemEntries.length > 0

  if (!activity) return null

  function assign() {
    const candidate = defaultWorker(state)
    if (!candidate) return
    dispatch({
      type: 'ASSIGN_JOB',
      payload: { locationId, activityId, pokemonId: candidate.id },
    })
  }

  function unassign() {
    dispatch({ type: 'UNASSIGN_JOB', payload: { locationId, activityId } })
  }

  function collect() {
    dispatch({ type: 'COLLECT_JOB', payload: { locationId, activityId } })
  }

  function fightEncounter() {
    const encounter = encounters[0]
    if (!encounter) return
    const isShiny = checkShinyOdds(
      shinyOddsForSpecies(encounter.speciesKey, completedGenerations(state.pokedexCaught))
    )
    const enemy = createBattlePokemon(encounter.speciesKey, encounter.level, {
      isShiny,
      wild: true,
    })
    enemy.fromActivity = true
    dispatch({ type: 'TAKE_JOB_ENCOUNTER', payload: { locationId, activityId } })
    dispatch({ type: 'MARK_SEEN', payload: { speciesKey: encounter.speciesKey } })
    dispatch({ type: 'START_ENCOUNTER', payload: { enemy } })
  }

  if (!job)
    return jsxs('div', {
      className: 'job-controls',
      children: [
        jsx('span', {
          className: 'job-hint',
          children: slotsFull
            ? `All ${JOB_SLOTS} field jobs are busy.`
            : 'Post a Pokemon to keep this running while you are away.',
        }),
        jsx('button', {
          className: 'job-btn assign',
          disabled: slotsFull || !defaultWorker(state),
          onClick: assign,
          children: slotsFull ? 'JOBS FULL' : 'ASSIGN A POKEMON',
        }),
      ],
    })

  const workerName = worker?.name ?? pokemonSpecies[worker?.speciesKey ?? '']?.name ?? 'A Pokemon'

  return jsxs('div', {
    className: 'job-controls active',
    children: [
      jsxs('div', {
        className: 'job-head',
        children: [
          jsxs('span', {
            className: 'job-worker',
            children: ['AUTO \u00b7 ', workerName],
          }),
          jsx('button', {
            className: 'job-btn unassign',
            onClick: unassign,
            children: 'CALL BACK',
          }),
        ],
      }),
      jsx('div', {
        className: 'job-progress',
        title: `${Math.round(progress * 100)}% to the next find`,
        children: jsx('div', { className: 'job-progress-fill', style: { width: `${progress * 100}%` } }),
      }),
      jsx('span', {
        className: 'job-rate',
        children: [`A find every ~${formatJobCycle(cycleMs)}`, abilityBonus ? ` \u00b7 ${abilityBonus}` : ''],
      }),
      ready > 0
        ? jsxs('div', {
            className: 'job-ready',
            children: [
              hasLoot &&
                jsxs('div', {
                  className: 'job-ready-row',
                  children: [
                    jsxs('span', {
                      className: 'job-ready-items',
                      children: [
                        job.money > 0 ? `$${job.money.toLocaleString()}` : '',
                        job.money > 0 && itemEntries.length > 0 ? ' \u00b7 ' : '',
                        itemEntries
                          .map(([itemId, quantity]) => `${activityRewardName(itemId)} x${quantity}`)
                          .join(' \u00b7 '),
                      ],
                    }),
                    jsx('button', {
                      className: 'job-btn collect',
                      onClick: collect,
                      children: 'COLLECT',
                    }),
                  ],
                }),
              encounters.length > 0 &&
                jsxs('div', {
                  className: 'job-encounters',
                  children: [
                    jsx('span', {
                      className: 'job-encounters-label',
                      children: `${encounters.length} wild ${encounters.length === 1 ? 'Pokemon' : 'Pokemon'} waiting`,
                    }),
                    ...encounters.slice(0, 4).map((encounter, index) => {
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
                              onError: /** @param {{ target: HTMLImageElement }} event */ (
                                event
                              ) =>
                                (event.target.src = getPokemonSpriteFallbackUrl(species?.id ?? 0)),
                              alt: species?.name ?? encounter.speciesKey,
                            }),
                            index === 0 &&
                              jsx('button', {
                                className: 'job-btn fight',
                                onClick: fightEncounter,
                                children: 'FIGHT',
                              }),
                          ],
                        },
                        `${encounter.speciesKey}-${index}`
                      )
                    }),
                  ],
                }),
            ],
          })
        : jsx('span', {
            className: 'job-hint',
            children: 'Working\u2026 nothing banked yet.',
          }),
    ],
  })
}
