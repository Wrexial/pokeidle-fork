// Daily quests: three short objectives rolled per calendar day, drawn from the
// routes and species the player can currently reach. Progress is advanced by
// `advanceQuests` from the reducer; rewards are claimed with CLAIM_QUEST.
//
// Unlike achievements (always-on milestones, recomputed on render), quests are
// active goals with explicit progress that expire at midnight.

import { encounterData, mapData, pokemonSpecies } from '../data/gameData.js'

const QUESTS_PER_DAY = 3

/**
 * @typedef {Object} Quest
 * @property {string} id
 * @property {string} kind
 * @property {Record<string, any>} params
 * @property {number} goal
 * @property {number} progress
 * @property {{ money?: number, victoryTokens?: number, items?: Record<string, number> }} reward
 * @property {boolean} claimed
 */

/**
 * @typedef {Object} QuestState
 * @property {string} date
 * @property {Quest[]} list
 */

/** @param {any[]} list @param {() => number} random */
function pick(list, random) {
  return list[Math.floor(random() * list.length)]
}

/** @param {number} min @param {number} max @param {() => number} random */
function randInt(min, max, random) {
  return min + Math.floor(random() * (max - min + 1))
}

/**
 * @param {string} kind
 * @param {Record<string, any>} params
 * @param {number} goal
 * @param {Quest['reward']} reward
 * @returns {Quest}
 */
function makeQuest(kind, params, goal, reward) {
  const key = params.type ?? params.speciesKey ?? params.locationId ?? ''
  return {
    id: `${kind}:${key}`,
    kind,
    params,
    goal,
    progress: 0,
    reward,
    claimed: false,
  }
}

/**
 * Roll today's quests from the routes/species the player can reach.
 * @param {GameState} state
 * @param {string} [dateKey]
 * @param {() => number} [random]
 * @returns {QuestState}
 */
export function rollQuests(state, dateKey = '', random = Math.random) {
  const routes = state.unlockedLocations.filter((id) => mapData[id]?.type === 'route'),
    speciesPool = new Set(),
    typePool = new Set()
  for (const routeId of routes)
    for (const encounter of encounterData[routeId]?.encounters ?? []) {
      const species = pokemonSpecies[encounter.speciesKey]
      if (!species) continue
      speciesPool.add(encounter.speciesKey)
      for (const type of species.types) typePool.add(type)
    }
  const speciesKeys = [...speciesPool],
    types = [...typePool],
    /** @type {(() => Quest)[]} */
    builders = [
      () => {
        const goal = randInt(10, 25, random)
        return makeQuest('wildBattles', {}, goal, { money: goal * 40 })
      },
      () => makeQuest('catchShiny', {}, 1, { victoryTokens: 1 }),
    ]
  if (routes.length > 0)
    builders.push(() => {
      const goal = randInt(4, 10, random)
      return makeQuest('routeBattles', { locationId: pick(routes, random) }, goal, {
        money: goal * 60,
      })
    })
  if (types.length > 0)
    builders.push(() => {
      const type = pick(types, random),
        goal = randInt(2, 4, random)
      return makeQuest('catchType', { type }, goal, { money: goal * 150 })
    })
  if (speciesKeys.length > 0)
    builders.push(() => {
      const speciesKey = pick(speciesKeys, random),
        goal = randInt(1, 3, random)
      return makeQuest('catchSpecies', { speciesKey }, goal, {
        money: goal * 220,
        items: { expCandyS: 1 },
      })
    })

  const pool = [...builders],
    chosen = []
  while (chosen.length < Math.min(QUESTS_PER_DAY, pool.length))
    chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
  return { date: dateKey, list: chosen.map((build) => build()) }
}

/**
 * Human-readable objective text for a quest.
 * @param {Quest} quest
 */
export function questLabel(quest) {
  switch (quest.kind) {
    case 'wildBattles':
      return `Win ${quest.goal} wild battles`
    case 'routeBattles':
      return `Win ${quest.goal} battles at ${mapData[quest.params.locationId]?.name ?? 'a route'}`
    case 'catchType':
      return `Catch ${quest.goal} ${quest.params.type}-type Pokemon`
    case 'catchSpecies':
      return `Catch ${quest.goal} ${pokemonSpecies[quest.params.speciesKey]?.name ?? quest.params.speciesKey}`
    case 'catchShiny':
      return 'Catch a shiny Pokemon'
    default:
      return 'Quest'
  }
}

/**
 * Whether an event counts toward a quest.
 * @param {Quest} quest
 * @param {{ kind: string, locationId?: string, speciesKey?: string, isShiny?: boolean }} event
 */
function questMatches(quest, event) {
  switch (quest.kind) {
    case 'wildBattles':
      return event.kind === 'wild'
    case 'routeBattles':
      return event.kind === 'wild' && event.locationId === quest.params.locationId
    case 'catchType':
      return (
        event.kind === 'catch' &&
        (pokemonSpecies[event.speciesKey ?? '']?.types ?? []).includes(quest.params.type)
      )
    case 'catchSpecies':
      return event.kind === 'catch' && event.speciesKey === quest.params.speciesKey
    case 'catchShiny':
      return event.kind === 'catch' && event.isShiny === true
    default:
      return false
  }
}

/**
 * Advance the quest list by one event. Returns the same object when nothing
 * matched so the reducer can cheaply avoid a state change.
 * @param {QuestState | null | undefined} quests
 * @param {{ kind: string, locationId?: string, speciesKey?: string, isShiny?: boolean }} event
 * @returns {QuestState | null | undefined}
 */
export function advanceQuests(quests, event) {
  if (!quests?.list?.length) return quests
  let changed = false
  const list = quests.list.map(/** @param {Quest} quest */ (quest) => {
    if (quest.progress >= quest.goal || !questMatches(quest, event)) return quest
    changed = true
    return { ...quest, progress: Math.min(quest.goal, quest.progress + 1) }
  })
  return changed ? { ...quests, list } : quests
}

/** @param {QuestState | null | undefined} quests */
export function hasClaimableQuests(quests) {
  return !!quests?.list?.some((quest) => !quest.claimed && quest.progress >= quest.goal)
}
