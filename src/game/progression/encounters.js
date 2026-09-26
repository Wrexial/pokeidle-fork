// // Encounter generation: shiny odds, active effects, swarms/roamers and species rolls. Split from game/progression.js.

import { roamerEncounterChance, shinyCharmMinOddsChance, shinyFullOddsChance, shinyWithCharmChance } from '../../data/config.js'
import { GENERATION_DEX_RANGES, evolutionData, isSpeciesCharmed, pokemonSpecies, regions } from '../../data/gameData.js'
import { challengeEligibleSpecies, speciesHasType } from '../pokemon.js'

/** Cached fixpoint of the minimum level each species can exist at. @type {Map<string, number> | null} */
let speciesLevelFloors = null

/**
 * The lowest level a species can legitimately exist at: 1 for a base form, or
 * its evolution gate for an evolved form (a fixpoint over the evolution graph).
 * Mirrors tools/lib/evolution-levels.cjs so a low-level route never rolls a
 * fully evolved Pokemon. Computed once and cached.
 * @returns {Map<string, number>}
 */
function evolutionFloors() {
  if (speciesLevelFloors) return speciesLevelFloors
  const floors = new Map(),
    idOf = (/** @type {string} */ key) => Number(pokemonSpecies[key]?.id ?? 0)
  for (const key of Object.keys(pokemonSpecies)) floors.set(key, 1)
  for (let pass = 0; pass < 25; pass++) {
    let changed = false
    for (const [from, evolutions] of Object.entries(evolutionData)) {
      // Only real base-species level evolutions matter here; form changes and
      // their reverts would otherwise pull a base form's floor up.
      if (!Array.isArray(evolutions) || idOf(from) > 1025) continue
      for (const evolution of evolutions) {
        const into = evolution?.into
        if (!into || !floors.has(into) || evolution.form || idOf(into) > 1025) continue
        const base = floors.get(from) ?? 1,
          next = evolution.level ? Math.max(base, evolution.level) : base
        if (next > (floors.get(into) ?? 1)) {
          floors.set(into, next)
          changed = true
        }
      }
    }
    if (!changed) break
  }
  speciesLevelFloors = floors
  return floors
}

/**
 * The lowest level `speciesKey` could legitimately be encountered at.
 * @param {string} speciesKey
 * @returns {number}
 */
export function minLevelForSpecies(speciesKey) {
  return evolutionFloors().get(speciesKey) ?? 1
}

/**
 * @param {GameState} state
 * @param {string} routeKey
 * @param {string} speciesKey
 * @returns {CatchRule}
 */
export function getCatchRule(state, routeKey, speciesKey) {
  return state.catchSettings[routeKey]?.[speciesKey] ?? state.globalCatchDefaults
}

/**
 * @param {number} [odds]
 * @param {() => number} [rng]
 * @returns {boolean}
 */
export function checkShinyOdds(odds = shinyFullOddsChance, rng = Math.random) {
  return Math.floor(rng() * odds) === 0
}

/**
 * Shiny odds once `completedGenerationCount` generations are complete. The
 * first completed generation gives the 2x charm rate, and each further one
 * keeps improving it until every generation is done.
 * @param {number} completedGenerationCount
 * @param {number} totalGenerations
 * @returns {number}
 */
export function shinyOddsForCompletedGenerations(completedGenerationCount, totalGenerations) {
  if (completedGenerationCount <= 0) return shinyFullOddsChance
  const progress = totalGenerations > 1 ? (completedGenerationCount - 1) / (totalGenerations - 1) : 1,
    ratio = Math.pow(shinyCharmMinOddsChance / shinyWithCharmChance, progress)
  return Math.max(shinyCharmMinOddsChance, Math.round(shinyWithCharmChance * ratio))
}

/**
 * Shiny odds for `speciesKey`: full odds unless its own generation's dex is
 * complete, otherwise the rate scaled by how many generations are done.
 * @param {string} speciesKey
 * @param {Set<number>} completedGenerationSet
 * @returns {number}
 */
export function shinyOddsForSpecies(speciesKey, completedGenerationSet) {
  return isSpeciesCharmed(speciesKey, completedGenerationSet)
    ? shinyOddsForCompletedGenerations(completedGenerationSet.size, GENERATION_DEX_RANGES.length)
    : shinyFullOddsChance
}

/** Chain length at which Honey locks a hunt and Repel suppresses the route. */
export const HONEY_CHAIN_THRESHOLD = 4

/** Weight multiplier Honey applies once a hunt is locked in. */
const HONEY_LOCK_MULTIPLIER = 25

/** Weight kept for every other species while a chain is protected by Repel. */
const SUPPRESSED_WEIGHT = 0.02

/**
 * Apply Honey/Repel modifiers to a route's encounter table. While a Repel is
 * suppressing a locked-in hunt, every species except the hunted one (and any
 * Honey-boosted species) is weighted down to almost nothing, so the chain
 * can't be broken by a random encounter. Shared with the route UI so the
 * displayed odds match the real roll.
 * @param {EncounterEntry[]} encounters
 * @param {{ speciesKey: string, multiplier: number, kind?: string, suppressOthers?: boolean }[] | undefined} modifiers
 * @param {{ speciesKey: string | null, count: number } | undefined | null} [shinyChain]
 * @returns {EncounterEntry[]}
 */
export function applyEncounterModifiers(encounters, modifiers, shinyChain) {
  const suppressOthers = !!modifiers?.some((modifier) => modifier.suppressOthers),
    protectedSpecies = new Set(
      (modifiers ?? [])
        .filter((modifier) => modifier.kind === 'honey')
        .map((modifier) => modifier.speciesKey)
    )
  if (shinyChain?.speciesKey) protectedSpecies.add(shinyChain.speciesKey)
  return encounters.map((encounter) => {
    const modifier = modifiers?.find((candidate) => candidate.speciesKey === encounter.speciesKey)
    let weight = encounter.weight
    if (suppressOthers && !protectedSpecies.has(encounter.speciesKey)) weight *= SUPPRESSED_WEIGHT
    if (modifier) weight *= modifier.multiplier
    return weight === encounter.weight ? encounter : { ...encounter, weight }
  })
}

/**
 * @param {ActiveEffect[]} activeEffects
 * @param {string} routeKey
 * @param {{ speciesKey: string | null, count: number } | undefined | null} [shinyChain]
 * @returns {{ speciesKey: string, multiplier: number, kind: 'honey' | 'repel', suppressOthers?: boolean }[]}
 */
export function resolveActiveModifiers(activeEffects, routeKey, shinyChain) {
  /** @type {{ speciesKey: string, multiplier: number, kind: 'honey' | 'repel', suppressOthers?: boolean }[]} */
  const modifiers = []
  // Once a hunt is locked in (4+ of the same species in a row), Honey and
  // Repel stop being little nudges and actually protect the chain.
  const locking = !!shinyChain && shinyChain.count >= HONEY_CHAIN_THRESHOLD
  for (const effect of activeEffects) {
    if (effect.routeKey !== routeKey || !effect.speciesKey) continue
    if (effect.type === 'repel')
      modifiers.push(
        locking
          ? { speciesKey: effect.speciesKey, multiplier: 1, kind: 'repel', suppressOthers: true }
          : { speciesKey: effect.speciesKey, multiplier: 0.5, kind: 'repel' }
      )
    else if (effect.type === 'honey')
      modifiers.push({
        speciesKey: effect.speciesKey,
        multiplier:
          locking && shinyChain?.speciesKey === effect.speciesKey ? HONEY_LOCK_MULTIPLIER : 2,
        kind: 'honey',
      })
  }
  return modifiers
}

/** How many same-species encounters double the shiny odds. */
const SHINY_CHAIN_STEP = 40

/**
 * Shiny-odds divisor from a DexNav-style chain: 1x at no chain, up to 4x at
 * 120+ consecutive encounters of the same species.
 * @param {string} speciesKey
 * @param {{ speciesKey: string | null, count: number } | undefined | null} chain
 * @returns {number}
 */
export function shinyChainMultiplier(speciesKey, chain) {
  if (!chain || chain.speciesKey !== speciesKey) return 1
  return Math.min(4, 1 + chain.count / SHINY_CHAIN_STEP)
}

/**
 * Pick a raid legendary from a region's pool, preferring species the player has
 * not seen yet, then ones they have not caught, and finally the whole pool — so
 * a seen/caught species is never impossible to raid again (shiny hunting).
 * @param {{ speciesKey: string, level: number }[]} pool
 * @param {string[]} pokedexSeen
 * @param {string[]} pokedexCaught
 * @returns {{ speciesKey: string, level: number } | null}
 */
export function pickRaidLegendary(pool, pokedexSeen, pokedexCaught) {
  if (pool.length === 0) return null
  const seen = new Set(pokedexSeen),
    caught = new Set(pokedexCaught),
    unseen = pool.filter((entry) => !seen.has(entry.speciesKey)),
    uncaught = pool.filter((entry) => !caught.has(entry.speciesKey)),
    candidates = unseen.length > 0 ? unseen : uncaught.length > 0 ? uncaught : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Roll a region's roaming legendary: one of its uncaught Raid Island
 * legendaries. Returns null most of the time (or when they are all caught).
 * @param {string} regionId
 * @param {string[]} pokedexSeen
 * @param {string[]} pokedexCaught
 * @param {Set<number>} completedGenerationSet
 * @param {number} [shinyBonus] Multiplier on shiny odds from a daily event.
 * @param {string | null} [monotype] Monotype challenge: only this type may appear.
 * @returns {{ species: Species, speciesKey: string, level: number, isShiny: boolean, isRoamer: boolean } | null}
 */
export function resolveRoamer(regionId, pokedexSeen, pokedexCaught, completedGenerationSet, shinyBonus = 1, monotype = null) {
  const region = regions.find((candidate) => candidate.id === regionId),
    candidates = (region?.raidPool ?? []).filter(
      (entry) =>
        pokemonSpecies[entry.speciesKey]?.legendary &&
        !pokedexCaught.includes(entry.speciesKey) &&
        (!monotype || speciesHasType(entry.speciesKey, monotype))
    )
  if (candidates.length === 0 || Math.random() >= roamerEncounterChance) return null
  const entry = pickRaidLegendary(candidates, pokedexSeen, pokedexCaught)
  if (!entry) return null
  return {
    species: pokemonSpecies[entry.speciesKey],
    speciesKey: entry.speciesKey,
    level: entry.level,
    isShiny: checkShinyOdds(
      Math.max(
        1,
        Math.round(shinyOddsForSpecies(entry.speciesKey, completedGenerationSet) / shinyBonus)
      )
    ),
    isRoamer: !0,
  }
}

/** Species eligible for Randomizer encounters (national dex, no legendaries). */
const RANDOMIZER_SPECIES = challengeEligibleSpecies

/**
 * A Randomizer wild encounter: any eligible species at the route's level band.
 * @param {EncounterData} encounterData
 * @param {Set<number>} completedGenerationSet
 * @param {number} shinyBonus
 * @param {number} levelOverride
 * @param {string | null} [monotype] Monotype challenge: only this type may appear.
 */
function resolveRandomEncounter(encounterData, completedGenerationSet, shinyBonus, levelOverride, monotype = null, plausible = !1) {
  const minLevel = Math.min(...encounterData.encounters.map((encounter) => encounter.minLevel)),
    maxLevel = Math.max(...encounterData.encounters.map((encounter) => encounter.maxLevel)),
    level = levelOverride || minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1)),
    typePool = monotype
      ? RANDOMIZER_SPECIES.filter((speciesKey) => speciesHasType(speciesKey, monotype))
      : RANDOMIZER_SPECIES,
    // When filling a route that has none of the chosen type, only roll forms
    // that could actually exist at the level we just rolled (no Charizard at
    // Lv. 5).
    monotypePool =
      plausible && monotype
        ? typePool.filter((speciesKey) => minLevelForSpecies(speciesKey) <= level)
        : typePool,
    pool =
      monotypePool.length > 0
        ? monotypePool
        : typePool.length > 0
          ? typePool
          : RANDOMIZER_SPECIES,
    speciesKey =
      pool[Math.floor(Math.random() * pool.length)] ?? encounterData.encounters[0].speciesKey
  return {
    species: pokemonSpecies[speciesKey],
    speciesKey,
    level,
    isShiny: checkShinyOdds(
      Math.max(1, Math.round(shinyOddsForSpecies(speciesKey, completedGenerationSet) / shinyBonus))
    ),
  }
}

/**
 * Shiny odds for a rolled encounter. A per-entry boost (a swarm makes its
 * species 4x as likely) stacks with the shiny chain and the daily bonus, but
 * the result is never better than the entry's floor (1 in 256 during a swarm).
 * @param {EncounterEntry} encounter
 * @param {Set<number>} completedGenerationSet
 * @param {number} chainMultiplier
 * @param {number} shinyBonus
 * @returns {number}
 */
function shinyOddsForEncounter(encounter, completedGenerationSet, chainMultiplier, shinyBonus) {
  const multiplier = (encounter.shinyMultiplier ?? 1) * chainMultiplier * shinyBonus,
    floor = encounter.shinyOddsFloor ?? 1
  return Math.max(
    floor,
    Math.round(shinyOddsForSpecies(encounter.speciesKey, completedGenerationSet) / multiplier)
  )
}

/**
 * @param {EncounterData} encounterData
 * @param {{ speciesKey: string, multiplier: number }[]} modifiers
 * @param {Set<number>} completedGenerationSet
 * @param {{ speciesKey: string | null, count: number } | undefined} [shinyChain]
 * @param {number} [shinyBonus] Multiplier on shiny odds from a daily event.
 * @param {boolean} [randomize] Randomizer challenge: pick any species.
 * @param {number} [levelOverride] Level-scaling challenge: force this level.
 * @param {string | null} [monotype] Monotype challenge: only this type may appear.
 * @returns {{ species: Species, speciesKey: string, level: number, isShiny: boolean, isRoamer?: boolean }}
 */
export function resolvePokemonEncounter(encounterData, modifiers, completedGenerationSet, shinyChain, shinyBonus = 1, randomize = !1, levelOverride = 0, monotype = null) {
  if (randomize)
    return resolveRandomEncounter(encounterData, completedGenerationSet, shinyBonus, levelOverride, monotype)
  const weightedEncounters = applyEncounterModifiers(
      encounterData.encounters,
      modifiers,
      shinyChain
    ),
    // Monotype challenge: only roll species that carry the chosen type.
    monotypePool = monotype
      ? weightedEncounters.filter((encounter) => speciesHasType(encounter.speciesKey, monotype))
      : weightedEncounters
  // If the route has none of the chosen type, roll a random Pokemon of that
  // type at the route's level band instead of leaking other types into the
  // pool (which would break the challenge).
  if (monotype && monotypePool.length === 0)
    return resolveRandomEncounter(
      encounterData,
      completedGenerationSet,
      shinyBonus,
      levelOverride,
      monotype,
      !0
    )
  const pool = monotypePool.length > 0 ? monotypePool : weightedEncounters,
    totalWeight = pool.reduce((accumulator, encounter) => accumulator + encounter.weight, 0)
  let roll = Math.random() * totalWeight
  for (const encounter of pool)
    if (((roll -= encounter.weight), roll <= 0)) {
      const level =
        levelOverride ||
        encounter.minLevel + Math.floor(Math.random() * (encounter.maxLevel - encounter.minLevel + 1))
      const chainMultiplier = shinyChainMultiplier(encounter.speciesKey, shinyChain)
      return {
        species: pokemonSpecies[encounter.speciesKey],
        speciesKey: encounter.speciesKey,
        level,
        isShiny: checkShinyOdds(
          shinyOddsForEncounter(encounter, completedGenerationSet, chainMultiplier, shinyBonus)
        ),
      }
    }
  const fallback = pool[pool.length - 1]
  return {
    species: pokemonSpecies[fallback.speciesKey],
    speciesKey: fallback.speciesKey,
    level: levelOverride || fallback.minLevel,
    isShiny: checkShinyOdds(
      shinyOddsForEncounter(
        fallback,
        completedGenerationSet,
        shinyChainMultiplier(fallback.speciesKey, shinyChain),
        shinyBonus
      )
    ),
  }
}
