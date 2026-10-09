// // Encounter generation: shiny odds, active effects, swarms/roamers and species rolls. Split from game/progression.js.

import { roamerEncounterChance, shinyCharmMinOddsChance, shinyFullOddsChance, shinyWithCharmChance } from '../../data/config.js'
import { GENERATION_DEX_RANGES, evolutionData, gymLeaderData, isSpeciesCharmed, pokemonSpecies, regions } from '../../data/gameData.js'
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

/**
 * Whether Honey is currently boosting a species on a route (making it more
 * common and easier to catch).
 * @param {ActiveEffect[]} activeEffects
 * @param {string} routeKey
 * @param {string} speciesKey
 * @returns {boolean}
 */
export function isHoneyActive(activeEffects, routeKey, speciesKey) {
  return activeEffects.some(
    (effect) =>
      effect.type === 'honey' && effect.routeKey === routeKey && effect.speciesKey === speciesKey
  )
}

/** How many same-species encounters add 1x to the shiny-odds multiplier. */
const SHINY_CHAIN_STEP = 40

/** The first guaranteed-shiny radar chain level, and how much it grows. */
export const SHINY_CHAIN_FIRST_TARGET = 5
export const SHINY_CHAIN_TARGET_STEP = 5

/**
 * Shiny-odds divisor from a DexNav-style chain: 1x at no chain, rising by 1x
 * every `SHINY_CHAIN_STEP` consecutive encounters of the species and capped at
 * 4x (1x / 2x / 3x / 4x at 0 / 40 / 80 / 120 encounters).
 * @param {string} speciesKey
 * @param {{ speciesKey: string | null, count: number } | undefined | null} chain
 * @returns {number}
 */
export function shinyChainMultiplier(speciesKey, chain) {
  if (!chain || chain.speciesKey !== speciesKey) return 1
  return Math.min(4, 1 + chain.count / SHINY_CHAIN_STEP)
}

/**
 * Whether the Poke Radar has banked enough chain levels on `speciesKey` to
 * guarantee the next encounter is shiny. Only radar levels count toward the
 * guarantee, so an ordinary run of wild encounters never forces a shiny.
 * @param {string} speciesKey
 * @param {{ speciesKey: string | null, radar?: number, target?: number } | undefined | null} chain
 * @returns {boolean}
 */
function shinyChainGuaranteed(speciesKey, chain) {
  return (
    !!chain &&
    chain.speciesKey === speciesKey &&
    (chain.radar ?? 0) >= (chain.target ?? SHINY_CHAIN_FIRST_TARGET)
  )
}

/**
 * A chained shiny has been resolved (caught or defeated): clear the chain and,
 * when it was the radar's guaranteed shiny, raise the next target by 5.
 * Returns the chain with the target otherwise unchanged.
 * @param {{ speciesKey: string | null, count: number, radar?: number, target?: number } | undefined | null} chain
 * @param {{ speciesKey?: string, isShiny?: boolean } | null | undefined} enemy
 * @returns {{ speciesKey: string | null, count: number, radar: number, target: number }}
 */
export function advanceShinyTarget(chain, enemy) {
  const target = chain?.target ?? SHINY_CHAIN_FIRST_TARGET,
    radar = chain?.radar ?? 0
  if (!enemy?.isShiny || !chain?.speciesKey || enemy.speciesKey !== chain.speciesKey)
    return {
      speciesKey: chain?.speciesKey ?? null,
      count: chain?.count ?? 0,
      radar,
      target,
    }
  return {
    ...chain,
    count: 0,
    radar: 0,
    target: radar >= target ? target + SHINY_CHAIN_TARGET_STEP : target,
  }
}

/**
 * Narrow a route's encounter table to the entries available in the current
 * day/night phase, falling back to the whole table when the phase would be
 * empty (so a fully time-gated route still spawns something).
 * @template {{ time?: 'day' | 'night' }} T
 * @param {T[]} encounters
 * @param {boolean} isNight
 * @returns {T[]}
 */
export function encountersForPhase(encounters, isNight) {
  const phase = isNight ? 'night' : 'day',
    filtered = encounters.filter((encounter) => !encounter.time || encounter.time === phase)
  return filtered.length > 0 ? filtered : encounters
}

/**
 * A 0-12 progress score for a region's Raid Island: its badges (0-8), a bonus
 * for beating its Champion, and region prestige. Drives the legendary weight,
 * so a fresh island leans toward the minor legendaries.
 * @param {GameState} state
 * @param {string} regionId
 * @returns {number}
 */
export function raidProgressFor(state, regionId) {
  const gymIds = gymLeaderData
      .filter((gym) => (gym.region ?? 'kanto') === regionId)
      .map((gym) => gym.id),
    badges = gymIds.filter((id) => state.defeatedGyms.includes(id)).length,
    champion = state.defeatedChampions.includes(regionId) ? 3 : 0,
    prestige = Math.min(3, state.regionPrestige?.[regionId] ?? 0) * 3
  return Math.min(12, badges + champion + prestige)
}

/** Highest Raid Island progress score (see raidProgressFor). */
const RAID_PROGRESS_MAX = 12

/**
 * Base-stat bands for raid legendaries: 0 = minor, 1 = major, 2 = box/cover.
 * @param {string} speciesKey
 * @returns {number}
 */
function raidTier(speciesKey) {
  const base = pokemonSpecies[speciesKey]?.baseStats
  if (!base) return 0
  const total =
    base.hp + base.attack + base.defense + base.spAttack + base.spDefense + base.speed
  return total >= 670 ? 2 : total >= 580 ? 1 : 0
}

/**
 * Pick weight for a raid legendary: minor forms are favoured at low progress,
 * box legendaries once the region (and its prestige) is done.
 * @param {{ speciesKey: string }} entry
 * @param {number} progress 0-12 (see raidProgressFor)
 * @returns {number}
 */
export function raidLegendaryWeight(entry, progress) {
  const tier = raidTier(entry.speciesKey),
    remaining = Math.max(0, RAID_PROGRESS_MAX - Math.min(RAID_PROGRESS_MAX, progress))
  return 1 + (2 - tier) * remaining + tier * progress
}

/**
 * Pick a raid legendary from a region's pool, preferring species the player has
 * not seen yet, then ones they have not caught, and finally the whole pool — so
 * a seen/caught species is never impossible to raid again (shiny hunting).
 * Within the candidates, a progress-weighted roll biases a fresh island toward
 * minor legendaries and a finished one toward the box legendaries.
 * @param {{ speciesKey: string, level: number }[]} pool
 * @param {string[]} pokedexSeen
 * @param {string[]} pokedexCaught
 * @param {number} [progress]
 * @returns {{ speciesKey: string, level: number } | null}
 */
export function pickRaidLegendary(pool, pokedexSeen, pokedexCaught, progress = 0) {
  if (pool.length === 0) return null
  const seen = new Set(pokedexSeen),
    caught = new Set(pokedexCaught),
    unseen = pool.filter((entry) => !seen.has(entry.speciesKey)),
    uncaught = pool.filter((entry) => !caught.has(entry.speciesKey)),
    candidates = unseen.length > 0 ? unseen : uncaught.length > 0 ? uncaught : pool,
    weights = candidates.map((entry) => raidLegendaryWeight(entry, progress)),
    total = weights.reduce((sum, weight) => sum + weight, 0)
  let roll = Math.random() * total
  for (let index = 0; index < candidates.length; index++) {
    roll -= weights[index]
    if (roll < 0) return candidates[index]
  }
  return candidates[candidates.length - 1]
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
 * @param {number} [progress] Raid progress, for the legendary weighting.
 * @returns {{ species: Species, speciesKey: string, level: number, isShiny: boolean, isRoamer: boolean } | null}
 */
export function resolveRoamer(regionId, pokedexSeen, pokedexCaught, completedGenerationSet, shinyBonus = 1, monotype = null, progress = 0) {
  const region = regions.find((candidate) => candidate.id === regionId),
    candidates = (region?.raidPool ?? []).filter(
      (entry) =>
        pokemonSpecies[entry.speciesKey]?.legendary &&
        !pokedexCaught.includes(entry.speciesKey) &&
        (!monotype || speciesHasType(entry.speciesKey, monotype))
    )
  if (candidates.length === 0 || Math.random() >= roamerEncounterChance) return null
  const entry = pickRaidLegendary(candidates, pokedexSeen, pokedexCaught, progress)
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
 * Lead abilities that make a type twice as common in wild encounters
 * (Static / Lightning Rod -> Electric, Magnet Pull -> Steel, Storm Drain ->
 * Water).
 * @type {Record<string, string>}
 */
export const ENCOUNTER_TYPE_ABILITY = {
  static: 'Electric',
  lightningRod: 'Electric',
  magnetPull: 'Steel',
  stormDrain: 'Water',
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
 * @param {string | null} [biasType] A lead ability's type: those species are
 *   twice as likely (Static / Magnet Pull / ...).
 * @returns {{ species: Species, speciesKey: string, level: number, isShiny: boolean, isRoamer?: boolean }}
 */
export function resolvePokemonEncounter(encounterData, modifiers, completedGenerationSet, shinyChain, shinyBonus = 1, randomize = !1, levelOverride = 0, monotype = null, biasType = null) {
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
  const basePool = monotypePool.length > 0 ? monotypePool : weightedEncounters,
    // A lead ability can make one type twice as common on the route.
    pool = biasType
      ? basePool.map((encounter) =>
          speciesHasType(encounter.speciesKey, biasType)
            ? { ...encounter, weight: encounter.weight * 2 }
            : encounter
        )
      : basePool,
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
        isShiny:
          shinyChainGuaranteed(encounter.speciesKey, shinyChain) ||
          checkShinyOdds(
            shinyOddsForEncounter(encounter, completedGenerationSet, chainMultiplier, shinyBonus)
          ),
      }
    }
  const fallback = pool[pool.length - 1]
  return {
    species: pokemonSpecies[fallback.speciesKey],
    speciesKey: fallback.speciesKey,
    level: levelOverride || fallback.minLevel,
    isShiny:
      shinyChainGuaranteed(fallback.speciesKey, shinyChain) ||
      checkShinyOdds(
        shinyOddsForEncounter(
          fallback,
          completedGenerationSet,
          shinyChainMultiplier(fallback.speciesKey, shinyChain),
          shinyBonus
        )
      ),
  }
}
