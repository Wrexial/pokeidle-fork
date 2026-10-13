// Daily quests: three short objectives rolled per calendar day, drawn from the
// routes and species the player can currently reach. Progress is advanced by
// `advanceQuests` from the reducer; rewards are claimed with CLAIM_QUEST.
//
// Unlike achievements (always-on milestones, recomputed on render), quests are
// active goals with explicit progress that expire at midnight.

import {
  encounterData,
  gymLeaderData,
  isSpeciesRegistered,
  mapData,
  pokemonSpecies,
  regions,
  speciesKeysByGeneration,
} from '../data/gameData.js'
import { QUEST_LEGENDARY_BY_REGION } from '../data/legendary-quests.js'
import { PROFESSOR_STORY } from '../data/professor-story.js'

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
  if (routes.length > 0)
    builders.push(() => {
      const goal = randInt(3, 6, random)
      return makeQuest('activityPerfects', {}, goal, { money: goal * 120 })
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
    case 'routeBattles': {
      // Route names repeat across regions (almost every region has a Route 1),
      // so name the region too or the objective is ambiguous.
      const location = mapData[quest.params.locationId],
        regionName = location
          ? regions.find((region) => region.id === (location.region ?? 'kanto'))?.name
          : null
      return `Win ${quest.goal} battles at ${location?.name ?? 'a route'}${
        regionName ? ` (${regionName})` : ''
      }`
    }
    case 'activityPerfects':
      return `Land ${quest.goal} clean hits in route activities`
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
 * @param {{ kind: string, locationId?: string, speciesKey?: string, isShiny?: boolean, quality?: string }} event
 */
function questMatches(quest, event) {
  switch (quest.kind) {
    case 'wildBattles':
      return event.kind === 'wild'
    case 'activityPerfects':
      // A "clean hit" is a perfect or ultra activity hit (not a plain hit).
      return (
        event.kind === 'activity' &&
        (event.quality === 'perfect' || event.quality === 'ultra')
      )
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
 * @param {{ kind: string, locationId?: string, speciesKey?: string, isShiny?: boolean, quality?: string }} event
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

// ---------------------------------------------------------------------------
// The Professor's Story: a chained regional storyline beyond the daily quests.
// Each chapter's steps are derived from progress the player already makes, so
// only the claimed chapters need to live in the save (see data/professor-story).
// ---------------------------------------------------------------------------

/**
 * A chapter's regional dex is that region's generation (the region list runs in
 * generation order), so Kanto maps to Gen 1, Paldea to Gen 9.
 * @param {string | null | undefined} regionId
 * @returns {string[]}
 */
function regionSpeciesKeys(regionId) {
  const generationIndex = regions.findIndex((region) => region.id === regionId)
  return generationIndex >= 0 ? speciesKeysByGeneration[generationIndex] ?? [] : []
}

/** A region's gyms, in badge order. @param {string | null | undefined} regionId */
function regionGyms(regionId) {
  return gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === regionId)
}

/**
 * Resolve one chapter step against the live game state.
 * @param {GameState} state
 * @param {import('../data/professor-story.js').ProfessorChapter} chapter
 * @param {import('../data/professor-story.js').ProfessorStep} step
 * @param {{ registered: Set<string>, chaptersClaimed: number, chapterCount: number, legendariesCaught: number }} context
 */
function professorStepStatus(state, chapter, step, context) {
  const registered = context.registered,
    regionalSpecies = regionSpeciesKeys(chapter.region)
  /** @type {number} */
  let progress = 0,
    need = step.need
  switch (step.kind) {
    case 'dex':
      progress = regionalSpecies.filter((speciesKey) =>
        isSpeciesRegistered(registered, speciesKey)
      ).length
      break
    case 'research': {
      const rewarded = state.researchRewarded ?? {}
      progress = regionalSpecies.filter((speciesKey) => rewarded[speciesKey]).length
      break
    }
    case 'badges': {
      const gyms = regionGyms(chapter.region)
      need = step.need ?? gyms.length
      progress = gyms.filter((gym) => state.defeatedGyms.includes(gym.id)).length
      break
    }
    case 'champion':
      progress = chapter.region && state.defeatedChampions.includes(chapter.region) ? 1 : 0
      break
    case 'legendary': {
      const legendary = chapter.region ? QUEST_LEGENDARY_BY_REGION[chapter.region] : null
      progress = legendary && isSpeciesRegistered(registered, legendary) ? 1 : 0
      break
    }
    case 'relics':
      progress = (chapter.region && state.relics?.[chapter.region]) || 0
      break
    case 'wildBattles':
      progress = state.wildBattlesWon ?? 0
      break
    case 'chapters':
      need = context.chapterCount
      progress = context.chaptersClaimed
      break
    case 'dexNational':
      progress = registered.size
      break
    case 'totalBadges':
      need = step.need ?? gymLeaderData.length
      progress = state.defeatedGyms.length
      break
    case 'legendaries':
      progress = context.legendariesCaught
      break
  }
  return {
    id: step.id,
    kind: step.kind,
    label: step.label,
    need,
    progress: Math.min(progress, need),
    done: progress >= need,
  }
}

/**
 * The Professor's Story chain resolved against the live state: every chapter,
 * its derived step progress, and which chapter is currently active.
 * @param {GameState} state
 */
export function professorStoryStatus(state) {
  const claimed = new Set(
      Array.isArray(state.professorStory?.claimed) ? state.professorStory.claimed : []
    ),
    registered = new Set(state.pokedexCaught),
    chapterCount = PROFESSOR_STORY.filter((chapter) => chapter.region).length,
    legendariesCaught = Object.values(QUEST_LEGENDARY_BY_REGION).filter((speciesKey) =>
      isSpeciesRegistered(registered, speciesKey)
    ).length,
    chaptersClaimed = PROFESSOR_STORY.filter(
      (chapter) => chapter.region && claimed.has(chapter.id)
    ).length,
    context = { registered, chaptersClaimed, chapterCount, legendariesCaught },
    chapters = PROFESSOR_STORY.map((chapter, index) => {
      const previous = index > 0 ? PROFESSOR_STORY[index - 1] : null,
        unlocked = !previous || claimed.has(previous.id),
        steps = chapter.steps.map((step) => professorStepStatus(state, chapter, step, context)),
        done = steps.length > 0 && steps.every((step) => step.done),
        isClaimed = claimed.has(chapter.id)
      return {
        ...chapter,
        index,
        unlocked,
        steps,
        done,
        claimed: isClaimed,
        claimable: unlocked && !isClaimed && done,
      }
    })
  return {
    chapters,
    current: chapters.find((chapter) => !chapter.claimed) ?? null,
    chapterCount: chapters.length,
    claimedCount: chapters.filter((chapter) => chapter.claimed).length,
    catchBonus: chapters.reduce(
      (sum, chapter) => sum + (chapter.claimed ? (chapter.reward.catchBonus ?? 0) : 0),
      0
    ),
  }
}

/** Whether any chapter's reward is ready to claim. @param {GameState} state */
export function hasClaimableProfessorStory(state) {
  return professorStoryStatus(state).chapters.some((chapter) => chapter.claimable)
}

/**
 * The passive catch-rate bonus the chain's charm has earned. Cheaper than
 * `professorStoryStatus`, since the encounter loop calls it every battle.
 * @param {GameState} state
 * @returns {number}
 */
export function professorStoryCatchBonus(state) {
  const claimed = new Set(
    Array.isArray(state.professorStory?.claimed) ? state.professorStory.claimed : []
  )
  return PROFESSOR_STORY.reduce(
    (sum, chapter) => sum + (claimed.has(chapter.id) ? (chapter.reward.catchBonus ?? 0) : 0),
    0
  )
}
