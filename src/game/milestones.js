// Run milestones: a capped, chronological timeline of a run's high points
// (a starter, new species, shinies, badges, league wins and a first level 100).
//
// Events are recorded by diffing consecutive reducer states in `gameReducer`,
// so every acquisition path feeds the same timeline no matter where it happens
// (wild catch, hatch, evolution, gift, Wonder Trade, boss battle). The Run
// Summary modal and its PNG export read the result.

import { elite4Data, gymLeaderData, mapData, pokemonSpecies, regions } from '../data/gameData.js'
import { titleById } from './titles.js'

/** Most milestones the timeline keeps; older entries fall off the front so the
 * save stays small while a full run's recent story is preserved. */
export const MILESTONE_CAP = 200

/**
 * Presentation metadata per milestone kind. `group` buckets the timeline for
 * the summary's filter chips.
 * @type {Record<string, { icon: string, label: string, group: string }>}
 */
export const MILESTONE_KINDS = {
  starter: { icon: '\u{1f392}', label: 'Starter chosen', group: 'journey' },
  catch: { icon: '\u{1f534}', label: 'New species', group: 'catches' },
  legendary: { icon: '\u{1f320}', label: 'Legendary caught', group: 'catches' },
  shiny: { icon: '\u2728', label: 'Shiny caught', group: 'shinies' },
  badge: { icon: '\u{1f3c5}', label: 'Badge earned', group: 'league' },
  elite4: { icon: '\u2694', label: 'Elite Four beaten', group: 'league' },
  champion: { icon: '\u{1f451}', label: 'Champion defeated', group: 'league' },
  region: { icon: '\u{1f5fa}', label: 'Region unlocked', group: 'journey' },
  level100: { icon: '\u{1f4af}', label: 'Reached level 100', group: 'training' },
}

/** The timeline groups the summary can filter by. */
export const MILESTONE_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'catches', label: 'Catches' },
  { id: 'shinies', label: 'Shinies' },
  { id: 'league', label: 'League' },
  { id: 'training', label: 'Training' },
  { id: 'journey', label: 'Journey' },
]

/**
 * @typedef {{
 *   id: string,
 *   kind: string,
 *   at: number,
 *   key: string,
 *   name: string,
 *   detail?: string,
 *   backfilled?: boolean,
 * }} Milestone
 */

/** @param {string} speciesKey */
function speciesName(speciesKey) {
  return pokemonSpecies[speciesKey]?.name ?? speciesKey
}

/**
 * Trim a timeline to the cap, dropping the oldest ordinary catches first so
 * badges, shinies and league wins survive a long run's catch flood.
 * @param {Milestone[]} entries
 * @returns {Milestone[]}
 */
function capMilestones(entries) {
  if (entries.length <= MILESTONE_CAP) return entries
  let overflow = entries.length - MILESTONE_CAP
  const kept = []
  for (const entry of entries) {
    if (overflow > 0 && entry.kind === 'catch') {
      overflow -= 1
      continue
    }
    kept.push(entry)
  }
  return kept.slice(-MILESTONE_CAP)
}

/** @param {string | undefined} regionId */
function regionName(regionId) {
  return regions.find((region) => region.id === regionId)?.name ?? regionId ?? 'Kanto'
}

/**
 * A newly registered species. Legendaries and mythicals get their own kind so
 * the summary can call them out.
 * @param {string} speciesKey
 * @param {number} at
 * @returns {Milestone}
 */
function catchMilestone(speciesKey, at) {
  const legendary = !!pokemonSpecies[speciesKey]?.legendary
  return {
    id: `${legendary ? 'legendary' : 'catch'}:${speciesKey}`,
    kind: legendary ? 'legendary' : 'catch',
    at,
    key: speciesKey,
    name: speciesName(speciesKey),
  }
}

/**
 * Build the gym badge milestone for a gym id.
 * @param {string} gymId
 * @param {number} at
 * @returns {Milestone}
 */
function badgeMilestone(gymId, at) {
  const gym = gymLeaderData.find((entry) => entry.id === gymId)
  return {
    id: `badge:${gymId}`,
    kind: 'badge',
    at,
    key: gymId,
    name: gym?.badgeName ?? 'Badge',
    detail: gym ? `${gym.name}${gym.title ? ` \u00b7 ${gym.title}` : ''}` : undefined,
  }
}

/**
 * Append any milestone the transition from `prevState` to `nextState` created.
 * Recording is diff-based, so a milestone is only emitted the first time its
 * underlying slice grows; a duplicate id already in the timeline is skipped.
 * Returns `nextState` untouched when nothing new happened.
 * @param {GameState} prevState
 * @param {GameState} nextState
 * @returns {GameState}
 */
export function recordMilestones(prevState, nextState) {
  if (!nextState || nextState === prevState) return nextState
  const existing = new Set((nextState.milestones ?? []).map(entry => entry.id)),
    at = Date.now(),
    /** @type {Milestone[]} */
    candidates = []
  /**
   * @param {Milestone | null} milestone
   */
  const push = milestone => {
    if (!milestone || existing.has(milestone.id)) return
    existing.add(milestone.id)
    candidates.push(milestone)
  }

  // New species / shinies registered since the previous state.
  const prevCaught = new Set(prevState.pokedexCaught ?? [])
  for (const speciesKey of nextState.pokedexCaught ?? [])
    if (!prevCaught.has(speciesKey)) push(catchMilestone(speciesKey, at))
  const prevShiny = new Set(prevState.shinyCaught ?? [])
  for (const speciesKey of nextState.shinyCaught ?? [])
    if (!prevShiny.has(speciesKey))
      push({
        id: `shiny:${speciesKey}`,
        kind: 'shiny',
        at,
        key: speciesKey,
        name: speciesName(speciesKey),
      })

  // Gym badges, Elite Four and Champions.
  pushNew(prevState.defeatedGyms, nextState.defeatedGyms, gymId =>
    push(badgeMilestone(gymId, at))
  )
  pushNew(prevState.defeatedEliteFour, nextState.defeatedEliteFour, memberId =>
    push({
      id: `elite4:${memberId}`,
      kind: 'elite4',
      at,
      key: memberId,
      name: elite4Data.find(entry => entry.id === memberId)?.name ?? memberId,
    })
  )
  pushNew(prevState.defeatedChampions, nextState.defeatedChampions, regionId =>
    push({
      id: `champion:${regionId}`,
      kind: 'champion',
      at,
      key: regionId,
      name: regionName(regionId),
      detail: 'Champion defeated',
    })
  )

  // Regions opened with an Unlock Token (and the starting region).
  pushNew(prevState.unlockedRegions, nextState.unlockedRegions, regionId =>
    push({
      id: `region:${regionId}`,
      kind: 'region',
      at,
      key: regionId,
      name: regionName(regionId),
    })
  )

  // The starter picked at SELECT_STARTER.
  if (!prevState.starterSpeciesKey && nextState.starterSpeciesKey)
    push({
      id: `starter:${nextState.startRegion ?? 'kanto'}`,
      kind: 'starter',
      at,
      key: nextState.startRegion ?? 'kanto',
      name: speciesName(nextState.starterSpeciesKey),
    })

  // The first time a Pokemon reaches level 100. Only re-scan when the party or
  // box actually changed, so the common reducer tick stays cheap.
  if (nextState.party !== prevState.party || nextState.box !== prevState.box)
    for (const pokemon of [...(nextState.party ?? []), ...(nextState.box ?? [])]) {
      if ((pokemon.level ?? 0) < 100) continue
      push({
        id: `level100:${pokemon.id}`,
        kind: 'level100',
        at,
        key: pokemon.id,
        name: pokemon.nickname ?? pokemon.name ?? speciesName(pokemon.speciesKey),
        detail: 'Lv.100',
      })
    }

  if (candidates.length === 0) return nextState
  return {
    ...nextState,
    milestones: capMilestones([...(nextState.milestones ?? []), ...candidates]),
  }
}

/**
 * Run `record` for each entry that appeared in `next` but not `prev`.
 * @template T
 * @param {T[] | undefined} prev
 * @param {T[] | undefined} next
 * @param {(entry: T) => void} record
 */
function pushNew(prev, next, record) {
  const before = new Set(prev ?? [])
  for (const entry of next ?? []) if (!before.has(entry)) record(entry)
}

/**
 * Make a stored timeline safe to use: keep known kinds with a usable id and
 * clamp it to the cap.
 * @param {any} raw
 * @returns {Milestone[]}
 */
export function sanitizeMilestones(raw) {
  if (!Array.isArray(raw)) return []
  return capMilestones(
    raw
      .filter(
        entry =>
          entry &&
          typeof entry === 'object' &&
          typeof entry.kind === 'string' &&
          !!MILESTONE_KINDS[entry.kind]
      )
      .map(entry => ({
        id:
          typeof entry.id === 'string' && entry.id
            ? entry.id
            : `${entry.kind}:${typeof entry.key === 'string' ? entry.key : 'unknown'}`,
        kind: entry.kind,
        at: Number.isFinite(entry.at) ? entry.at : Date.now(),
        key: typeof entry.key === 'string' ? entry.key : '',
        name: typeof entry.name === 'string' ? entry.name : '',
        ...(typeof entry.detail === 'string' ? { detail: entry.detail } : {}),
        ...(entry.backfilled ? { backfilled: true } : {}),
      }))
  )
}

/**
 * Build a timeline for a save that predates milestone recording, from the
 * notable progress already in its state. Every entry is tagged `backfilled`
 * (all sharing one timestamp) so the UI can mark it as "earlier". Catches are
 * left out — there could be a thousand of them and they would drown the
 * timeline — but shinies, legendaries, badges and league wins are all kept.
 * @param {{
 *   starterSpeciesKey?: string | null,
 *   startRegion?: string,
 *   unlockedRegions?: string[],
 *   pokedexCaught?: string[],
 *   shinyCaught?: string[],
 *   defeatedGyms?: string[],
 *   defeatedEliteFour?: string[],
 *   defeatedChampions?: string[],
 *   party?: Pokemon[],
 *   box?: Pokemon[],
 * }} state
 * @returns {Milestone[]}
 */
export function backfillMilestones(state) {
  const at = Date.now(),
    existing = new Set(),
    /** @type {Milestone[]} */
    timeline = []
  /** @param {Milestone} milestone */
  const add = milestone => {
    if (existing.has(milestone.id)) return
    existing.add(milestone.id)
    timeline.push({ ...milestone, backfilled: true })
  }
  if (state.starterSpeciesKey)
    add({
      id: `starter:${state.startRegion ?? 'kanto'}`,
      kind: 'starter',
      at,
      key: state.startRegion ?? 'kanto',
      name: speciesName(state.starterSpeciesKey),
    })
  for (const regionId of state.unlockedRegions ?? [])
    add({
      id: `region:${regionId}`,
      kind: 'region',
      at,
      key: regionId,
      name: regionName(regionId),
    })
  for (const gymId of state.defeatedGyms ?? []) add(badgeMilestone(gymId, at))
  for (const memberId of state.defeatedEliteFour ?? [])
    add({
      id: `elite4:${memberId}`,
      kind: 'elite4',
      at,
      key: memberId,
      name: elite4Data.find(entry => entry.id === memberId)?.name ?? memberId,
    })
  for (const regionId of state.defeatedChampions ?? [])
    add({
      id: `champion:${regionId}`,
      kind: 'champion',
      at,
      key: regionId,
      name: regionName(regionId),
      detail: 'Champion defeated',
    })
  for (const speciesKey of state.pokedexCaught ?? [])
    if (pokemonSpecies[speciesKey]?.legendary) add(catchMilestone(speciesKey, at))
  for (const speciesKey of state.shinyCaught ?? [])
    add({
      id: `shiny:${speciesKey}`,
      kind: 'shiny',
      at,
      key: speciesKey,
      name: speciesName(speciesKey),
    })
  for (const pokemon of [...(state.party ?? []), ...(state.box ?? [])]) {
    if ((pokemon.level ?? 0) < 100) continue
    add({
      id: `level100:${pokemon.id}`,
      kind: 'level100',
      at,
      key: pokemon.id,
      name: pokemon.nickname ?? pokemon.name ?? speciesName(pokemon.speciesKey),
      detail: 'Lv.100',
    })
  }
  return capMilestones(timeline)
}

/**
 * The card-ready recap the summary modal and its PNG export both render, built
 * from the live state so it always reflects the current save.
 * @param {GameState} state
 * @returns {{
 *   trainerName: string,
 *   title: string | null,
 *   regionName: string,
 *   starterName: string | null,
 *   stats: { caught: number, shinies: number, badges: number, champions: number, level100: number, battles: number, regions: number },
 *   firstShiny: Milestone | null,
 *   firstLevel100: Milestone | null,
 *   latest: Milestone | null,
 *   milestones: Milestone[],
 * }}
 */
export function summarizeRun(state) {
  const milestones = state.milestones ?? [],
    pokemon = [...(state.party ?? []), ...(state.box ?? [])],
    regionId = mapData[state.currentLocation]?.region ?? state.startRegion ?? 'kanto',
    firstOf = /** @param {string} kind */ kind =>
      milestones.find(entry => entry.kind === kind) ?? null
  return {
    trainerName: state.trainerProfile?.name ?? 'Trainer',
    title: titleById(state.trainerProfile?.title)?.name ?? null,
    regionName: regionName(regionId),
    starterName: state.starterSpeciesKey ? speciesName(state.starterSpeciesKey) : null,
    stats: {
      caught: (state.pokedexCaught ?? []).length,
      shinies: (state.shinyCaught ?? []).length,
      badges: (state.defeatedGyms ?? []).length,
      champions: (state.defeatedChampions ?? []).length,
      level100: pokemon.filter(member => (member.level ?? 0) >= 100).length,
      battles: (state.wildBattlesWon ?? 0) + (state.trainerBattlesWon ?? 0),
      regions: (state.unlockedRegions ?? []).length,
    },
    firstShiny: firstOf('shiny'),
    firstLevel100: firstOf('level100'),
    latest: milestones[milestones.length - 1] ?? null,
    milestones,
  }
}

/**
 * The one-line label for a milestone ("Badge earned: Boulder Badge").
 * @param {Milestone} milestone
 */
export function milestoneLabel(milestone) {
  const info = MILESTONE_KINDS[milestone.kind]
  return `${info ? info.label : 'Milestone'}: ${milestone.name}`
}

/**
 * A short, human "when" label for a timeline entry ("just now", "3h ago",
 * "2d ago"). Backfilled entries all read "earlier".
 * @param {Milestone} milestone
 * @param {number} [now]
 */
export function formatMilestoneAge(milestone, now = Date.now()) {
  if (milestone.backfilled) return 'earlier'
  const elapsed = Math.max(0, now - (milestone.at ?? now)),
    minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
