// Split from the former assets/index.js.

import { applyMoveOverrides } from './move-effects.js'
import { withoutQuestLegendary } from './legendary-quests.js'
import { buildFormModel } from './pokemon-forms.js'
import { buildFormDexModel } from './form-dex.js'

async function startApp() {
  await window.gameDataReady

  const loadedGameData = window.gameDataInjector.data
  return loadedGameData
}

const loadedGameData = await startApp()

export let pokemonSpecies = /** @type {Record<string, Species>} */ (loadedGameData.pokemonSpecies)

/**
 * Form relationships, built once from the species table (see
 * `src/data/pokemon-forms.js`). Forms (Megas, regional variants, ...) map back
 * to their national-dex base so the Pokédex can group them under one slot.
 */
const formModel = buildFormModel(pokemonSpecies)

/** Form species key -> its national-dex base species key. */
export const formBaseMap = formModel.baseForKey

/** National-dex base key -> its form keys (the base itself is excluded). */
export const formsByBase = formModel.formsByBase

/** Form species key -> its display label (base species have no entry). */
export const formLabels = formModel.labelForKey

/**
 * The national-dex base species a key belongs to (a base maps to itself).
 * @param {string} speciesKey
 * @returns {string}
 */
export function baseSpeciesKey(speciesKey) {
  return formBaseMap[speciesKey] ?? speciesKey
}

/**
 * The display label for a form (e.g. "Alolan", "Mega X"), or null for a base.
 * @param {string} speciesKey
 * @returns {string | null}
 */
export function formLabelFor(speciesKey) {
  return formModel.labelForKey[speciesKey] ?? null
}

/**
 * The national-dex number a species key belongs to (forms share their base's).
 * @param {string} speciesKey
 * @returns {number}
 */
export function dexIdForSpecies(speciesKey) {
  const base = baseSpeciesKey(speciesKey)
  return pokemonSpecies[base]?.id ?? 0
}

/**
 * Whether a national-dex base is registered (caught or seen), counting any of
 * its forms.
 * @param {Set<string>} registered
 * @param {string} baseKey
 * @returns {boolean}
 */
export function isSpeciesRegistered(registered, baseKey) {
  if (registered.has(baseKey)) return true
  const forms = formsByBase[baseKey]
  return !!forms && forms.some((formKey) => registered.has(formKey))
}

/** Gender rate + egg groups per species (see tools/fetch-breeding-data.cjs). */
export let breedingData = /** @type {Record<string, BreedingData>} */ (
  loadedGameData.breedingData ?? {}
)

/** Normal + hidden abilities per species (see tools/fetch-abilities.cjs). */
export let abilityData = /** @type {Record<string, { abilities: string[], hidden: string | null }>} */ (
  loadedGameData.abilityData ?? {}
)

/** Animated sprite ids with no gif, per variant (see download_pokemon_sprites.cjs). */
export let animatedSprites = /** @type {{ front: number[], back: number[], shiny: number[], backShiny: number[] }} */ (
  loadedGameData.animatedSprites ?? { front: [], back: [], shiny: [], backShiny: [] }
)

/** Ids with a female sprite, per variant (see download_pokemon_sprites.cjs). */
export let genderedSprites = /** @type {{ front: number[], back: number[], shiny: number[], backShiny: number[], animatedFront: number[], animatedBack: number[], animatedShiny: number[], animatedBackShiny: number[] }} */ (
  loadedGameData.genderedSprites ?? {
    front: [],
    back: [],
    shiny: [],
    backShiny: [],
    animatedFront: [],
    animatedBack: [],
    animatedShiny: [],
    animatedBackShiny: [],
  }
)

export let evolutionData = /** @type {Record<string, Evolution[]>} */ (loadedGameData.evolutionData)

/** Item id -> its sprite filename under /sprites/items (see download-item-sprites.cjs). */
export let itemIcons = /** @type {Record<string, string>} */ (loadedGameData.itemIcons ?? {})

export let moveLearnsets = /** @type {Record<string, [number, string][]>} */ (
  loadedGameData.moveLearnsets
)

/** Machine (TM) learnable moves per species (see tools/fetch-tm-learnsets.cjs). */
export let tmLearnsets = /** @type {Record<string, string[]>} */ (
  loadedGameData.tmLearnsets ?? {}
)

/** Moves only obtainable by breeding, per species (see tools/fetch-egg-moves.cjs). */
export let eggMoves = /** @type {Record<string, string[]>} */ (
  loadedGameData.eggMoves ?? {}
)

export let mapData = /** @type {Record<string, MapLocation>} */ (loadedGameData.mapData)

export let encounterData = /** @type {Record<string, EncounterData>} */ (
  loadedGameData.mapEncounterData
)

export let moveData = /** @type {Record<string, Move>} */ (loadedGameData.moveData)

// Enrich the extracted move table with healing/multi-hit/crit/priority data the
// JSON doesn't carry (see src/data/move-effects.js).
applyMoveOverrides(moveData)

export let trainerClasses = /** @type {Record<string, string>} */ (loadedGameData.trainerClasses)

export let trainerData = /** @type {Record<string, any[]>} */ (loadedGameData.trainerData)

export let gymLeaderData = /** @type {any[]} */ (loadedGameData.gymLeaderData)

export let elite4Data = /** @type {any[]} */ (loadedGameData.elite4Data)

export let championData = /** @type {any[]} */ (loadedGameData.championData)

export let regions = /** @type {Region[]} */ (loadedGameData.regions || [])

/**
 * The regions that advance the Unlock Token, World Tour and per-generation
 * tracks. DLC expansions (`isDlc`) are post-game and open by beating their
 * parent region's Champion, so they are excluded from those counts.
 */
export let baseRegions = regions.filter((region) => !region.isDlc)

/**
 * The parent region id when `regionId` is a DLC expansion, else null.
 * @param {string} regionId
 * @returns {string | null}
 */
export function dlcParentRegion(regionId) {
  const region = regions.find((candidate) => candidate.id === regionId)
  return region?.isDlc ? region.parentRegion ?? null : null
}

/**
 * The Raid Island's displayed encounter table: its legendaries. The ordinary
 * finals the island used to carry now live on fitting region routes as wild
 * encounters, so the island stays legendary-only. Empty if the region is
 * unknown.
 * @param {string} regionId
 * @returns {{ speciesKey: string, level: number }[]}
 */
export function raidPoolFor(regionId) {
  const region = regions.find((candidate) => candidate.id === regionId)
  return region ? withoutQuestLegendary(regionId, [...(region.raidPool ?? [])]) : []
}

/**
 * The legendaries a region's Raid Island can headline a raid with.
 * @param {string} regionId
 * @returns {{ speciesKey: string, level: number }[]}
 */
export function raidLegendaryPoolFor(regionId) {
  const region = regions.find((region) => region.id === regionId)
  return region ? withoutQuestLegendary(regionId, region.raidPool ?? []) : []
}

/**
 * A form reversing to its base (e.g. Palafin-H -> Palafin) must not be recorded
 * as that base's pre-evolution, or breeding/learnset chains start from a form
 * instead of the real root. Regional-form evolutions (id > 1025 on both sides,
 * like a-rattata -> a-raticate) are real and kept.
 * @param {string} from
 * @param {string} into
 */
const isFormRevert = (from, into) =>
  Number(pokemonSpecies[from]?.id) > 1025 &&
  (evolutionData[into] ?? []).some((evolution) => evolution.into === from)

/** @type {Record<string, string>} */
export let preEvolutionMap = Object.fromEntries(
  Object.entries(evolutionData).flatMap(([speciesKey, evolutions]) =>
    evolutions
      .filter((evolution) => !isFormRevert(speciesKey, evolution.into))
      .map((evolution) => [evolution.into, speciesKey])
  )
)
// A transform between two forms (Galarian Darmanitan <-> Galarian Darmanitan-Z)
// drops both directions above, leaving one form with no predecessor; reattach it
// to its partner so breeding/learnset chains still reach the real base.
let formChainChanged = true
while (formChainChanged) {
  formChainChanged = false
  for (const [from, evolutions] of Object.entries(evolutionData)) {
    if (Number(pokemonSpecies[from]?.id) <= 1025) continue
    for (const evolution of evolutions) {
      if (Number(pokemonSpecies[evolution.into]?.id) <= 1025) continue
      if (!(evolutionData[evolution.into] ?? []).some((back) => back.into === from)) continue
      if (preEvolutionMap[from] === undefined && preEvolutionMap[evolution.into] !== undefined)
        (preEvolutionMap[from] = evolution.into), (formChainChanged = true)
      else if (preEvolutionMap[evolution.into] === undefined && preEvolutionMap[from] !== undefined)
        (preEvolutionMap[evolution.into] = from), (formChainChanged = true)
    }
  }
}

/** @type {Record<string, string[]>} */
/** Where each species can be found, as `{ id, name }` route entries. @type {Record<string, { id: string, name: string }[]>} */
export let pokedexData = {}

for (const [routeKey, location] of Object.entries(encounterData))
  for (const encounter of location.encounters) {
    const entries =
      pokedexData[encounter.speciesKey] ?? (pokedexData[encounter.speciesKey] = [])
    // Keep the location id so the Pokedex can travel to (or focus) the route.
    if (!entries.some((entry) => entry.id === routeKey))
      entries.push({ id: routeKey, name: mapData[routeKey]?.name ?? location.name })
  }

/**
 * Species that spawn on exactly one (non-raid) route, keyed by that route.
 * Used to badge the route-exclusive Pokemon in the Wild Pokemon grid.
 * @type {Record<string, Set<string>>}
 */
export const routeExclusiveSpecies = (() => {
  /** @type {Record<string, Set<string>>} */
  const routesBySpecies = {}
  for (const [routeKey, bucket] of Object.entries(encounterData)) {
    if (mapData[routeKey]?.type === 'raid') continue
    for (const encounter of bucket.encounters)
      (routesBySpecies[encounter.speciesKey] ??= new Set()).add(routeKey)
  }
  /** @type {Record<string, Set<string>>} */
  const exclusive = {}
  for (const [speciesKey, routes] of Object.entries(routesBySpecies)) {
    if (routes.size !== 1) continue
    const [routeKey] = routes
    ;(exclusive[routeKey] ??= new Set()).add(speciesKey)
  }
  return exclusive
})()

/**
 * National-dex range for each generation (Gen 1-9), in order. Shared by the
 * Pokedex tabs and the per-generation Shiny Charm.
 */
export const GENERATION_DEX_RANGES = [
  [1, 151],
  [152, 251],
  [252, 386],
  [387, 493],
  [494, 649],
  [650, 721],
  [722, 809],
  [810, 905],
  [906, 1025],
]

/** Species keys per generation, in national-dex order. */
export const speciesKeysByGeneration = GENERATION_DEX_RANGES.map(([lowId, highId]) =>
  Object.keys(pokemonSpecies).filter(
    (speciesKey) => pokemonSpecies[speciesKey].id >= lowId && pokemonSpecies[speciesKey].id <= highId
  )
)

/**
 * The living form-dex model: every species family, its collectible form and
 * gender targets, and the regional / generation groupings (see
 * `src/data/form-dex.js`).
 */
export const formDexModel = buildFormDexModel(
  pokemonSpecies,
  formsByBase,
  formLabels,
  new Set(genderedSprites.front ?? []),
  GENERATION_DEX_RANGES
)

/**
 * 0-based generation index for a national-dex id, or -1 for alternate forms
 * (ids above 1025) and placeholders.
 * @param {number} dexId
 * @returns {number}
 */
function generationIndexForDexId(dexId) {
  return GENERATION_DEX_RANGES.findIndex(([lowId, highId]) => dexId >= lowId && dexId <= highId)
}

/**
 * @param {string} speciesKey
 * @returns {number}
 */
function generationIndexForSpecies(speciesKey) {
  return generationIndexForDexId(dexIdForSpecies(speciesKey))
}

/**
 * Most recently computed result, keyed by the `pokedexCaught` array reference.
 * The reducer only ever replaces that array on a catch, so the whole-dex scan
 * is skipped on the idle loop's non-catch ticks (and on every component render
 * that reads the charm state).
 * @type {{ input: string[] | null, result: Set<number> }}
 */
let completedGenerationsCache = { input: null, result: new Set() }

/**
 * Generation indices whose entire national dex has been caught. The Shiny Charm
 * works per generation, so each collected generation boosts the odds for its
 * own species. Memoised on the `pokedexCaught` reference, which the immutable
 * reducer only replaces when a catch actually lands.
 * @param {string[]} pokedexCaught
 * @returns {Set<number>}
 */
export function completedGenerations(pokedexCaught) {
  if (completedGenerationsCache.input === pokedexCaught) return completedGenerationsCache.result
  const caught = new Set(pokedexCaught)
  /** @type {Set<number>} */
  const completed = new Set()
  speciesKeysByGeneration.forEach((speciesKeys, generationIndex) => {
    if (speciesKeys.length > 0 && speciesKeys.every((speciesKey) => isSpeciesRegistered(caught, speciesKey)))
      completed.add(generationIndex)
  })
  completedGenerationsCache = { input: pokedexCaught, result: completed }
  return completed
}

/**
 * Whether the Shiny Charm is active for `speciesKey` (its generation's dex is
 * complete).
 * @param {string} speciesKey
 * @param {Set<number>} completedGenerationSet
 * @returns {boolean}
 */
export function isSpeciesCharmed(speciesKey, completedGenerationSet) {
  const generationIndex = generationIndexForSpecies(speciesKey)
  return generationIndex >= 0 && completedGenerationSet.has(generationIndex)
}

/**
 * One entry per national-dex species (id 1-1025), in dex order, plus the
 * MissingNo. placeholder (id 0). Alternate forms (ids above 1025) are grouped
 * under their base entry via `formsByBase` rather than listed here.
 * @type {[string, Species][]}
 */
export let pokedexIndexes = Object.entries(pokemonSpecies)
  .filter(([, species]) => species.id === 0 || (species.id > 0 && species.id <= 1025))
  .sort((left, right) => left[1].id - right[1].id)

/** @type {string[]} */
export const mapAreas = Object.keys(mapData)
