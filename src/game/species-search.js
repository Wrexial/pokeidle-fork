// Name search for the Box and Pokedex. Matching is fuzzy (substring or
// subsequence, ignoring case and punctuation) and expands across a species'
// evolution family, so searching "Bulbasaur" also brings up Ivysaur and
// Venusaur.

import { evolutionData, pokemonSpecies, preEvolutionMap } from '../data/gameData.js'

/**
 * Lowercase a name and drop everything that isn't a letter or digit, so
 * "Mr. Mime" and "mrmime" compare equal.
 * @param {string} text
 * @returns {string}
 */
export function normalizeSearchName(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Whether a normalized query matches a name: as a plain substring, or (for
 * queries of three or more characters) as an in-order subsequence so a
 * half-remembered or mistyped name still matches.
 * @param {string} name
 * @param {string} normalizedNeedle
 * @returns {boolean}
 */
export function fuzzyNameMatch(name, normalizedNeedle) {
  const haystack = normalizeSearchName(name)
  if (!normalizedNeedle) return true
  if (haystack.includes(normalizedNeedle)) return true
  if (normalizedNeedle.length < 3) return false
  let index = 0
  for (const char of haystack) {
    if (char === normalizedNeedle[index]) index += 1
    if (index === normalizedNeedle.length) return true
  }
  return false
}

/** @type {Map<string, Set<string>>} */
const familyCache = new Map()

/**
 * Every species in a Pokemon's evolution family: its pre-evolutions, itself and
 * its evolved forms (including Mega / Gigantamax branches). Stops on the cycles
 * the reversible form transforms create.
 * @param {string} speciesKey
 * @returns {Set<string>}
 */
export function evolutionFamily(speciesKey) {
  const cached = familyCache.get(speciesKey)
  if (cached) return cached
  const seen = new Set([speciesKey])
  let root = speciesKey
  for (let next = preEvolutionMap[root]; next && !seen.has(next); next = preEvolutionMap[root]) {
    root = next
    seen.add(root)
  }
  const family = new Set()
  const queue = [root]
  while (queue.length > 0) {
    const current = queue.pop()
    if (current === undefined || family.has(current)) continue
    family.add(current)
    for (const evolution of evolutionData[current] ?? [])
      if (!family.has(evolution.into)) queue.push(evolution.into)
  }
  for (const key of family) familyCache.set(key, family)
  return family
}

/** @type {Map<string, Set<string>>} */
const searchCache = new Map()

/**
 * The species keys to show for a search query: every family that contains a
 * name match. Returns null for an empty query, meaning "no name filtering".
 * @param {string} query
 * @returns {Set<string> | null}
 */
export function speciesMatchingSearch(query) {
  const needle = normalizeSearchName(query)
  if (!needle) return null
  const cached = searchCache.get(needle)
  if (cached) return cached
  const matches = new Set()
  for (const [speciesKey, species] of Object.entries(pokemonSpecies))
    if (fuzzyNameMatch(species.name, needle))
      for (const key of evolutionFamily(speciesKey)) matches.add(key)
  searchCache.set(needle, matches)
  return matches
}
