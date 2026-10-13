// The box legendary each region's Legendary Quest hunts. Kept in a data module
// (not game/legendary-quests.js) so the Raid Island pool accessors in
// gameData.js can exclude it without an import cycle — the quest legendary is
// meant to be earned through the quest, never rolled at random.

import { VILLAIN_ORGS, VILLAIN_TOTAL_STAGES } from './villain-teams.js'

/**
 * @typedef {{ legendary: string, name: string }} LegendaryQuest
 * @type {Record<string, LegendaryQuest>}
 */
export const LEGENDARY_QUESTS = {
  kanto: { legendary: 'mewtwo', name: 'The Psychic Cat' },
  johto: { legendary: 'lugia', name: 'The Diving Pokemon' },
  hoenn: { legendary: 'rayquaza', name: 'The Sky High Pokemon' },
  sinnoh: { legendary: 'giratina', name: 'The Renegade' },
  unova: { legendary: 'kyurem', name: 'The Boundary Pokemon' },
  kalos: { legendary: 'xerneas', name: 'The Life Pokemon' },
  alola: { legendary: 'necrozma', name: 'The Prism Pokemon' },
  galar: { legendary: 'eternatus', name: 'The Eternity Pokemon' },
  paldea: { legendary: 'terapagos', name: 'The Tera Pokemon' },
}

/** Region id -> its quest legendary's species key. @type {Record<string, string>} */
export const QUEST_LEGENDARY_BY_REGION = Object.fromEntries(
  Object.entries(LEGENDARY_QUESTS).map(([regionId, quest]) => [regionId, quest.legendary])
)

/**
 * Whether `speciesKey` is the region's quest-exclusive box legendary (the one
 * that must be earned through the Legendary Quest, not rolled at random).
 * @param {string | null | undefined} regionId
 * @param {string | null | undefined} speciesKey
 * @returns {boolean}
 */
export function isQuestLegendary(regionId, speciesKey) {
  return !!regionId && !!speciesKey && QUEST_LEGENDARY_BY_REGION[regionId] === speciesKey
}

/**
 * `entries` without the region's quest legendary, so the random Raid Island
 * pool never hands it out for free.
 * @template T
 * @param {string | null | undefined} regionId
 * @param {T[]} entries
 * @param {(entry: T) => string | undefined} [keyOf]
 * @returns {T[]}
 */
export function withoutQuestLegendary(regionId, entries, keyOf) {
  const exclude = regionId ? QUEST_LEGENDARY_BY_REGION[regionId] : null
  if (!exclude) return entries
  const getKey = keyOf ?? ((/** @type {T} */ entry) => /** @type {any} */ (entry)?.speciesKey)
  return entries.filter((entry) => getKey(entry) !== exclude)
}

/**
 * Region id -> the species its villain org's boss carries as a legendary ace.
 * @type {Record<string, string>}
 */
export const VILLAIN_LEGENDARY_BY_REGION = Object.fromEntries(
  Object.entries(VILLAIN_ORGS).map(([regionId, org]) => [regionId, org.boss.legendary])
)

/**
 * Whether a region's villain-org legendary is still locked away. The boss's ace
 * is withheld from the random legendary pools (Raid Island, roamer, Ultra Warp,
 * Dynamax) until the region's arc is fully cleared, so it can never be caught
 * out from under its owner. The arc's own boss battle is unaffected.
 * @param {string | null | undefined} regionId
 * @param {{ villainProgress?: Record<string, number> } | null | undefined} state
 * @returns {boolean}
 */
export function isVillainLegendaryLocked(regionId, state) {
  if (!regionId || !VILLAIN_LEGENDARY_BY_REGION[regionId]) return false
  const progress = state?.villainProgress?.[regionId] ?? 0
  return progress < VILLAIN_TOTAL_STAGES
}

/**
 * `entries` without every legendary that is earned rather than rolled: the
 * region's quest box legendary (always) and its villain boss's legendary (until
 * the arc is cleared). The full roster keeps both, so a caller can still locate
 * them for the quest or the raid display.
 * @template T
 * @param {string | null | undefined} regionId
 * @param {{ villainProgress?: Record<string, number> } | null | undefined} state
 * @param {T[]} entries
 * @param {(entry: T) => string | undefined} [keyOf]
 * @returns {T[]}
 */
export function withoutLockedLegendary(regionId, state, entries, keyOf) {
  const getKey = keyOf ?? ((/** @type {T} */ entry) => /** @type {any} */ (entry)?.speciesKey)
  /** @type {Set<string>} */
  const locked = new Set()
  const quest = regionId ? QUEST_LEGENDARY_BY_REGION[regionId] : null
  if (quest) locked.add(quest)
  const villain = regionId ? VILLAIN_LEGENDARY_BY_REGION[regionId] : null
  if (villain && isVillainLegendaryLocked(regionId, state)) locked.add(villain)
  return locked.size === 0 ? entries : entries.filter((entry) => !locked.has(getKey(entry)))
}
