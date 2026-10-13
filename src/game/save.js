// Save persistence: reading, repairing and writing the versioned localStorage
// save. Split out of context.js so the provider is just React wiring and this
// repair logic stays testable on its own.

import { BATTLE_TOWER_REGION, EV_MAX_PER_STAT, EV_MAX_TOTAL, LEGACY_SAVE_KEYS, MAX_TEAM_PRESETS, SAVE_BACKUP_KEY, SAVE_SLOT_COUNT, SAVE_VERSION, getActiveSlot, regionalStarters, saveSlotKey, setActiveSlot } from '../data/config.js'
import { dailyEventByKey, todayKey } from '../data/daily-events.js'
import { activeItems, autoCatchBallOrder, consumableItems, pokeBalls } from '../data/items.js'
import { elite4Data, encounterData, formDexModel, gymLeaderData, mapData, moveData, pokemonSpecies, preEvolutionMap, regions, speciesKeysByGeneration } from '../data/gameData.js'
import { ROUTE_ACTIVITIES } from './minigames/route-activities.js'
import { BREEDING_GOALS, MAX_BREEDING_PROJECTS } from './breeding-projects.js'
import { RIVAL_MILESTONES } from './rival.js'
import { VILLAIN_TOTAL_STAGES } from './villain-teams.js'
import { PRESTIGE_PERKS } from './prestige.js'
import { FRONTIER_FACILITIES } from './battle-frontier.js'
import { isValidHuntTarget } from './hunt.js'
import { BASE_FRIENDSHIP, generateIVs, calculatePokemonStats, createEmptyEvs, EV_STAT_ORDER, resolvePokemonMoves, rollAbility, rollMark, rollSize, RIBBONS } from './pokemon.js'
import { outfitById } from '../data/outfits.js'
import { titleById } from './titles.js'
import { BADGE_CASE_MAX, sanitizeTrainerProfile } from './trainer-profile.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { natureByKey, randomNature } from '../data/natures.js'
import { isTerminalForm } from '../data/mega-evolution.js'
import { POKEMON_TYPES } from '../data/moves.js'
import { genderForPokemon } from './breeding.js'
import { COMPANION_MAX_CARE, createCompanionCare } from './companion.js'
import { GARDEN_BERRIES, createGarden } from './garden.js'
import { GAME_CORNER_PRIZE_GOAL } from './minigames/game-corner.js'
import { PELAGO_MAX_READY, PELAGO_SLOTS, createPelago } from './pelago.js'
import { SECRET_BASE_GRID, SECRET_BASE_YIELD_WIN_CAP, createSecretBase, decorationById } from './secret-base.js'
import { RODS, rodsForRegionCount, routeActivityIds } from './minigames.js'
import { JOB_MAX_READY, accrueJobs, jobCycleMs, jobKey, summarizeJobAccrual } from './jobs.js'
import { RESEARCH_MAX_POINTS } from './research.js'
import { GIFTS, STATIC_ENCOUNTERS } from './gifts.js'
import { simulateOfflineCatches } from './offline-catch.js'
import { accruePokewalker, createPokewalker } from './pokewalker.js'
import { initialGameState } from './reducer.js'
import { SHINY_CHAIN_FIRST_TARGET, computeOfflineReward, entryRoutePath, simulateOfflineWildWins } from './progression.js'

const FALLBACK_CATCH_RULE = {
  enabled: true,
  mode: 'always',
  levelThreshold: 1,
  enabledBalls: [...autoCatchBallOrder],
}

/**
 * Normalise a catch rule from an old save: drop unknown balls, guarantee an
 * `enabledBalls` array (older saves stored a single `pokeball` string).
 * @param {any} rule
 */
function sanitizeCatchRule(rule) {
  const source = rule && typeof rule === 'object' ? rule : {}
  const { pokeball, ...rest } = source
  const enabledBalls = (Array.isArray(source.enabledBalls)
    ? source.enabledBalls
    : [pokeball || 'pokeball']
  ).filter(/** @param {string} ballId */ (ballId) => pokeBalls[ballId])
  return {
    ...rest,
    enabled: source.enabled !== false,
    mode: typeof source.mode === 'string' ? source.mode : 'pokedex_new',
    levelThreshold: typeof source.levelThreshold === 'number' ? source.levelThreshold : 1,
    enabledBalls: enabledBalls.length > 0 ? enabledBalls : [...autoCatchBallOrder],
  }
}

/**
 * Park a save the loader couldn't handle under the backup key so it isn't
 * retried (and doesn't crash the game) on every reload.
 * @param {{ key: string, json: string }} raw
 */
function quarantineSave(raw) {
  try {
    localStorage.setItem(SAVE_BACKUP_KEY, raw.json)
    localStorage.removeItem(raw.key)
  } catch {
    /* storage may be unavailable */
  }
}

/**
 * Read a slot's save, falling back once to a legacy key for slot 1 so an
 * older single-save install can be migrated in place.
 * @param {number} slot
 * @returns {{ key: string, json: string, legacy: boolean } | null}
 */
function readRawSave(slot) {
  try {
    const key = saveSlotKey(slot),
      current = localStorage.getItem(key)
    if (current) return { key, json: current, legacy: false }
    if (slot === 1) {
      for (const legacyKey of LEGACY_SAVE_KEYS) {
        const json = localStorage.getItem(legacyKey)
        if (json) return { key: legacyKey, json, legacy: true }
      }
    }
  } catch {
    /* storage may be unavailable */
  }
  return null
}

/**
 * Whether a slot (or, for slot 1, a legacy key) holds a save.
 * @param {number} slot
 * @returns {boolean}
 */
function slotHasSave(slot) {
  try {
    if (localStorage.getItem(saveSlotKey(slot))) return true
    return slot === 1 && LEGACY_SAVE_KEYS.some((key) => localStorage.getItem(key))
  } catch {
    return false
  }
}

/** 1-based numbers of every slot that holds a save. */
function occupiedSlots() {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => index + 1).filter(slotHasSave)
}

/**
 * Whether the player must choose a slot before the game can load: no slot has
 * been picked yet and more than one slot holds a save. A single save migrates
 * straight in, and a brand-new player starts in slot 1.
 * @returns {boolean}
 */
export function needsSlotChoice() {
  return getActiveSlot() === 0 && occupiedSlots().length > 1
}

/**
 * The slot to load at boot, or null when the player should pick one
 * (see `needsSlotChoice`).
 * @returns {number | null}
 */
export function resolveBootSlot() {
  const active = getActiveSlot()
  if (active) return active
  const occupied = occupiedSlots()
  return occupied.length > 1 ? null : (occupied[0] ?? 1)
}

/**
 * Turn a parsed save into a playable state, dropping anything that references
 * content which no longer exists. Returns null if there's nothing salvageable.
 * @param {any} saved
 * @returns {GameState | null}
 */
export function repairSave(saved) {
  if (!saved.playerPokemon) return null
  // A Battle Factory rental sets the real party aside while the battle runs. A
  // save loaded mid-rental restores the real team and drops the marker (the
  // battle can be restarted), so a rental can never overwrite the party.
  if (
    saved.frontierRental &&
    Array.isArray(saved.frontierRental.party) &&
    saved.frontierRental.party.length > 0
  )
    saved = { ...saved, party: saved.frontierRental.party, frontierRental: null }
  let nextId = saved.nextPokemonId || 1
  const playerPokemon = { ...saved.playerPokemon }
  if (playerPokemon.isShiny === void 0) playerPokemon.isShiny = false
  if (!playerPokemon.id) playerPokemon.id = String(nextId++)

  /** @param {any} pokemon */
  const withId = (pokemon) => {
    const normalized = pokemon.isShiny === void 0 ? { ...pokemon, isShiny: false } : pokemon
    return normalized.id ? normalized : { ...normalized, id: String(nextId++) }
  }
  let party = /** @type {any[]} */ (Array.isArray(saved.party) ? saved.party : [])
  party = party.length === 0 ? [playerPokemon] : party.map(withId)
  let box = /** @type {any[]} */ (Array.isArray(saved.box) ? saved.box : []).map(withId)

  playerPokemon.ivs || (playerPokemon.ivs = generateIVs())
  // Older saves predate per-individual sizes, so roll one in.
  if (playerPokemon.size === void 0) playerPokemon.size = rollSize()
  if (playerPokemon.mark === void 0) playerPokemon.mark = rollMark() ?? null
  const knownRegionIds = new Set(regions.map((region) => region.id))
  /**
   * Clamp a stored EV block: 0-252 per stat, 510 in total (trimming the
   * largest stats first if a save somehow exceeds the budget).
   * @param {any} raw
   * @returns {Record<string, number>}
   */
  const sanitizeEvs = (raw) => {
    const source = raw && typeof raw === 'object' ? raw : {},
      evs = createEmptyEvs()
    for (const stat of EV_STAT_ORDER)
      evs[stat] = Math.max(0, Math.min(EV_MAX_PER_STAT, Math.floor(Number(source[stat]) || 0)))
    while (EV_STAT_ORDER.reduce((sum, stat) => sum + evs[stat], 0) > EV_MAX_TOTAL) {
      const largest = EV_STAT_ORDER.reduce((a, b) => (evs[b] > evs[a] ? b : a), EV_STAT_ORDER[0])
      if (evs[largest] <= 0) break
      evs[largest] -= 1
    }
    return evs
  }
  /**
   * Fill in the per-individual fields an old save may lack and drop unknown
   * ribbon ids. Returns the same reference when nothing changed.
   * @param {any} pokemon
   */
  const withDerivedPokemonFields = (pokemon) => {
    const ribbons = Array.isArray(pokemon.ribbons)
        ? pokemon.ribbons.filter((/** @type {string} */ id) => RIBBONS[id])
        : null,
      needsRibbonFix = ribbons && ribbons.length !== pokemon.ribbons.length,
      evs = sanitizeEvs(pokemon.evs),
      needsEvFix = JSON.stringify(evs) !== JSON.stringify(pokemon.evs),
      // Drop an origin region that no longer exists.
      badOrigin = pokemon.originRegion != null && !knownRegionIds.has(pokemon.originRegion)
    if (
      pokemon.ivs &&
      pokemon.size !== void 0 &&
      pokemon.mark !== void 0 &&
      !needsRibbonFix &&
      !needsEvFix &&
      !badOrigin
    )
      return pokemon
    return {
      ...pokemon,
      ...(pokemon.ivs ? {} : { ivs: generateIVs() }),
      ...(pokemon.size === void 0 ? { size: rollSize() } : {}),
      ...(pokemon.mark === void 0 ? { mark: rollMark() ?? null } : {}),
      ...(needsRibbonFix ? { ribbons } : {}),
      ...(needsEvFix ? { evs } : {}),
      ...(badOrigin ? { originRegion: void 0 } : {}),
    }
  }
  party = party.map(withDerivedPokemonFields)
  box = box.map(withDerivedPokemonFields)

  // If the save's core Pokemon reference species that no longer exist, start
  // fresh instead of crashing during render.
  if (!playerPokemon.speciesKey || !pokemonSpecies[playerPokemon.speciesKey]) return null
  party = party.filter((pokemon) => pokemon?.speciesKey && pokemonSpecies[pokemon.speciesKey])
  box = box.filter((pokemon) => pokemon?.speciesKey && pokemonSpecies[pokemon.speciesKey])
  if (party.length === 0) party = [playerPokemon]

  // Mega / Primal / Gigantamax are temporary battle forms. A save that stored
  // one (an old level-100 G-Max evolution, or a leaked battle form) is cleaned
  // up by reverting the Pokemon to its base species and re-deriving its data.
  /** @param {any} pokemon */
  const revertTerminalForm = (pokemon) => {
    if (!isTerminalForm(pokemon.speciesKey)) return pokemon
    let base = pokemon.speciesKey,
      guard = 0
    while (isTerminalForm(base) && preEvolutionMap[base] && guard++ < 10)
      base = preEvolutionMap[base]
    const species = pokemonSpecies[base]
    if (!species) return pokemon
    const level = pokemon.level || 1,
      nature = pokemon.nature && natureByKey[pokemon.nature] ? pokemon.nature : randomNature(),
      stats = calculatePokemonStats(species, level, pokemon.ivs, nature, pokemon.evs)
    return {
      ...pokemon,
      speciesKey: base,
      name: species.name,
      types: species.types,
      nature,
      maxHp: stats.hp,
      currentHp: Math.min(pokemon.currentHp ?? stats.hp, stats.hp),
      attack: stats.attack,
      defense: stats.defense,
      spAttack: stats.spAttack,
      spDefense: stats.spDefense,
      speed: stats.speed,
      moves: resolvePokemonMoves(base, level),
      ability: void 0,
    }
  }
  party = party.map(revertTerminalForm)
  box = box.map(revertTerminalForm)

  // Movesets change over time; drop moves that no longer exist and make sure
  // every Pokemon still has at least one usable move.
  /** @param {any} pokemon */
  const repairMoves = (pokemon) => {
    const moves = (Array.isArray(pokemon.moves) ? pokemon.moves : []).filter(
      /** @param {string} moveId */ (moveId) => moveData[moveId]
    )
    return {
      ...pokemon,
      moves: moves.length > 0 ? moves : resolvePokemonMoves(pokemon.speciesKey, pokemon.level || 1),
    }
  }
  party = party.map(repairMoves)
  box = box.map(repairMoves)

  // Egg moves are per-individual; drop any that no longer exist in the move data.
  /** @param {any} pokemon */
  const repairEggMoves = (pokemon) =>
    Array.isArray(pokemon.eggMoves)
      ? {
          ...pokemon,
          eggMoves: [
            ...new Set(
              pokemon.eggMoves.filter((/** @type {string} */ moveId) => moveData[moveId])
            ),
          ],
        }
      : pokemon
  party = party.map(repairEggMoves)
  box = box.map(repairEggMoves)

  // Older saves predate natures. Roll one for any Pokemon missing it and
  // recompute the stored stats so they reflect the new nature (HP is never
  // changed by a nature, so maxHp is stable aside from rounding).
  /** @param {any} pokemon */
  const withNature = (pokemon) => {
    if (pokemon.nature && natureByKey[pokemon.nature]) return pokemon
    const nature = randomNature(),
      species = pokemonSpecies[pokemon.speciesKey],
      stats = calculatePokemonStats(species, pokemon.level || 1, pokemon.ivs, nature, pokemon.evs)
    return {
      ...pokemon,
      nature,
      maxHp: stats.hp,
      currentHp: Math.min(pokemon.currentHp ?? stats.hp, stats.hp),
      attack: stats.attack,
      defense: stats.defense,
      spAttack: stats.spAttack,
      spDefense: stats.spDefense,
      speed: stats.speed,
    }
  }
  party = party.map(withNature)
  box = box.map(withNature)

  // Older saves predate friendship; default it to a freshly-caught Pokemon's.
  /** @param {any} pokemon */
  const withFriendship = (pokemon) =>
    typeof pokemon.friendship === 'number' ? pokemon : { ...pokemon, friendship: BASE_FRIENDSHIP }
  party = party.map(withFriendship)
  box = box.map(withFriendship)

  // Older saves predate abilities; roll one for any Pokemon missing it.
  /** @param {any} pokemon */
  const withAbility = (pokemon) =>
    pokemon.ability ? pokemon : { ...pokemon, ability: rollAbility(pokemon.speciesKey) }
  party = party.map(withAbility)
  box = box.map(withAbility)

  // A corrupted or stale save can carry a `currentHp` above `maxHp` (which
  // sticks the HP bar at full and leaves the Pokemon almost unkillable, and
  // survives every battle because it is only ever written back on damage) or a
  // leftover `statStages` from a switch-in hazard, which is battle-only state
  // that must not persist. Clamp the HP and drop the battle stages.
  /** @param {any} pokemon */
  const withSafeHp = (pokemon) => {
    const maxHp = Math.max(1, Math.floor(Number(pokemon.maxHp) || 0)),
      rawHp = Number(pokemon.currentHp),
      { statStages, ...rest } = pokemon
    return {
      ...rest,
      maxHp,
      currentHp: Math.max(0, Math.min(Number.isFinite(rawHp) ? rawHp : maxHp, maxHp)),
    }
  }
  party = party.map(withSafeHp)
  box = box.map(withSafeHp)

  /** @type {Record<string, Record<string, CatchRule>>} */
  const catchSettings = {}
  for (const [speciesKey, rules] of Object.entries(saved.catchSettings || {})) {
    if (!pokemonSpecies[speciesKey] || !rules || typeof rules !== 'object') continue
    /** @type {Record<string, CatchRule>} */
    const cleaned = {}
    for (const [ballId, rule] of Object.entries(/** @type {Record<string, any>} */ (rules))) {
      if (!pokeBalls[ballId]) continue
      cleaned[ballId] = /** @type {CatchRule} */ (sanitizeCatchRule(rule))
    }
    if (Object.keys(cleaned).length > 0) catchSettings[speciesKey] = cleaned
  }

  let seen = Array.isArray(saved.pokedexSeen) ? saved.pokedexSeen : [],
    caught = Array.isArray(saved.pokedexCaught) ? saved.pokedexCaught : []
  if (!saved.pokedexSeen || !saved.pokedexCaught) {
    const speciesSet = new Set()
    for (const pokemon of [...party, ...box]) speciesSet.add(pokemon.speciesKey)
    caught = Array.from(speciesSet)
    seen = [...caught]
  }
  const caughtSet = new Set(
    caught.filter(/** @param {string} speciesKey */ (speciesKey) => pokemonSpecies[speciesKey])
  )
  for (const speciesKey of [...caughtSet]) {
    // `preEvolutionMap` can be cyclic (special forms evolve into each other),
    // so stop when we reach a species already in the set.
    for (let preEvolution = preEvolutionMap[speciesKey]; preEvolution && !caughtSet.has(preEvolution); preEvolution = preEvolutionMap[preEvolution]) {
      caughtSet.add(preEvolution)
    }
  }
  const seenSet = new Set(
    [...seen, ...caughtSet].filter(
      /** @param {string} speciesKey */ (speciesKey) => pokemonSpecies[speciesKey]
    )
  )
  const shinySeen = (Array.isArray(saved.shinySeen) ? saved.shinySeen : []).filter(
    /** @param {string} speciesKey */ (speciesKey) => pokemonSpecies[speciesKey]
  )
  const shinyCaught = (Array.isArray(saved.shinyCaught) ? saved.shinyCaught : []).filter(
    /** @param {string} speciesKey */ (speciesKey) => pokemonSpecies[speciesKey]
  )
  const shinyChain =
    saved.shinyChain &&
    typeof saved.shinyChain === 'object' &&
    typeof saved.shinyChain.count === 'number' &&
    saved.shinyChain.count > 0 &&
    pokemonSpecies[saved.shinyChain.speciesKey]
      ? {
          speciesKey: saved.shinyChain.speciesKey,
          count: saved.shinyChain.count,
          // Older saves predate the radar-only counter, so their combined chain
          // count must not be read as banked radar levels (that would hand out
          // a guaranteed shiny on load).
          radar:
            typeof saved.shinyChain.radar === 'number' && saved.shinyChain.radar > 0
              ? saved.shinyChain.radar
              : 0,
          target:
            typeof saved.shinyChain.target === 'number' && saved.shinyChain.target > 0
              ? saved.shinyChain.target
              : SHINY_CHAIN_FIRST_TARGET,
        }
      : initialGameState.shinyChain
  // The SOS chain is a consecutive-win streak on one route. A stale route key
  // (a removed area) drops back to an empty chain rather than blocking the load.
  const sosChain =
    saved.sosChain &&
    typeof saved.sosChain === 'object' &&
    typeof saved.sosChain.count === 'number' &&
    saved.sosChain.count > 0 &&
    typeof saved.sosChain.routeKey === 'string' &&
    mapData[saved.sosChain.routeKey]
      ? { routeKey: saved.sosChain.routeKey, count: Math.floor(saved.sosChain.count) }
      : initialGameState.sosChain
  const sosBestChains = Object.fromEntries(
    Object.entries(
      saved.sosBestChains && typeof saved.sosBestChains === 'object'
        ? saved.sosBestChains
        : {}
    ).filter(
      ([routeKey, best]) =>
        mapData[routeKey] && typeof best === 'number' && best > 0
    )
  )
  const swarm =
    saved.swarm &&
    typeof saved.swarm === 'object' &&
    mapData[saved.swarm.routeKey] &&
    encounterData[saved.swarm.routeKey]?.encounters?.some(
      /** @param {{ speciesKey: string }} encounter */ (encounter) =>
        encounter.speciesKey === saved.swarm.speciesKey
    ) &&
    typeof saved.swarm.battlesRemaining === 'number' &&
    saved.swarm.battlesRemaining > 0
      ? {
          routeKey: saved.swarm.routeKey,
          speciesKey: saved.swarm.speciesKey,
          battlesRemaining: saved.swarm.battlesRemaining,
        }
      : null
  const pokerus =
    saved.pokerus &&
    typeof saved.pokerus === 'object' &&
    typeof saved.pokerus.battlesRemaining === 'number' &&
    saved.pokerus.battlesRemaining > 0
      ? { battlesRemaining: saved.pokerus.battlesRemaining }
      : null
  const quests =
    saved.quests &&
    typeof saved.quests === 'object' &&
    typeof saved.quests.date === 'string' &&
    Array.isArray(saved.quests.list)
      ? {
          date: saved.quests.date,
          list: saved.quests.list
            .filter(
              /** @param {any} quest */ (quest) =>
                quest &&
                typeof quest === 'object' &&
                typeof quest.id === 'string' &&
                typeof quest.kind === 'string' &&
                typeof quest.goal === 'number' &&
                typeof quest.progress === 'number' &&
                (!quest.params?.locationId || mapData[quest.params.locationId]) &&
                (!quest.params?.speciesKey || pokemonSpecies[quest.params.speciesKey])
            )
            .map(
              /** @param {any} quest */ (quest) => ({
                id: quest.id,
                kind: quest.kind,
                params: quest.params ?? {},
                goal: quest.goal,
                progress: Math.max(0, Math.min(quest.progress, quest.goal)),
                reward: quest.reward ?? {},
                claimed: !!quest.claimed,
              })
            ),
        }
      : null
  const daycareParents = /** @type {Pokemon[]} */ (
      Array.isArray(saved.daycare?.parents) ? saved.daycare.parents : []
    )
      .filter(/** @param {any} parent */ (parent) => parent && pokemonSpecies[parent.speciesKey])
      .map(withNature)
      .map(withFriendship)
      .map(withAbility),
    daycare = {
      parents: daycareParents.slice(0, 2),
      progress: typeof saved.daycare?.progress === 'number' ? saved.daycare.progress : 0,
    },
    // Breeding tracker + project queue: clamp the counters and drop projects
    // that name a missing species or an unknown goal.
    breeding = (() => {
      const raw = saved.breeding && typeof saved.breeding === 'object' ? saved.breeding : {},
        goals = new Set(BREEDING_GOALS.map((entry) => entry.value)),
        projects = (Array.isArray(raw.projects) ? raw.projects : [])
          .filter(
            (/** @type {any} */ project) =>
              project && pokemonSpecies[project.speciesKey] && goals.has(project.goal)
          )
          .slice(-MAX_BREEDING_PROJECTS)
          .map((/** @type {any} */ project, /** @type {number} */ index) => ({
            id: typeof project.id === 'string' && project.id ? project.id : `bp-${index}`,
            speciesKey: project.speciesKey,
            goal: project.goal,
            ...(project.goal === 'nature' && typeof project.nature === 'string'
              ? { nature: project.nature }
              : {}),
            hatches: Math.max(0, Math.floor(Number(project.hatches) || 0)),
          }))
      return {
        eggsHatched: Math.max(0, Math.floor(Number(raw.eggsHatched) || 0)),
        shinyEggsHatched: Math.max(0, Math.floor(Number(raw.shinyEggsHatched) || 0)),
        eggsSinceShiny: Math.max(0, Math.floor(Number(raw.eggsSinceShiny) || 0)),
        projects,
      }
    })()

  // Companion care: keep the pinned Pokemon only if it still exists, and clamp
  // the care stats. Garden plots are rebuilt to the current plot count.
  const companionIds = new Set([...party, ...box].map((pokemon) => pokemon.id)),
    savedCompanion =
      saved.companion && typeof saved.companion === 'object' ? saved.companion : null,
    clampCare = /** @param {any} value */ (value) =>
      Math.max(0, Math.min(COMPANION_MAX_CARE, typeof value === 'number' ? value : COMPANION_MAX_CARE)),
    companion =
      savedCompanion?.id && companionIds.has(savedCompanion.id)
        ? {
            id: savedCompanion.id,
            fullness: clampCare(savedCompanion.fullness),
            happiness: clampCare(savedCompanion.happiness),
            energy: clampCare(savedCompanion.energy),
            cleanliness: clampCare(savedCompanion.cleanliness),
            careBattle:
              typeof savedCompanion.careBattle === 'number' ? savedCompanion.careBattle : -1,
          }
        : createCompanionCare(null, 0),
    savedPlots = Array.isArray(saved.garden?.plots) ? saved.garden.plots : [],
    garden = createGarden()
  garden.plots = garden.plots.map((_, index) => {
    const plot = savedPlots[index]
    if (!plot || !GARDEN_BERRIES[plot.berryId]) return null
    const remaining = Number(plot.battlesRemaining)
    return {
      berryId: plot.berryId,
      battlesRemaining: Number.isFinite(remaining) ? Math.max(0, Math.floor(remaining)) : 0,
    }
  })

  // Kurt's pending Apricorn carvings: keep only real Apricorns.
  const kurtCrafts = (Array.isArray(saved.kurtCrafts) ? saved.kurtCrafts : [])
    .map((/** @type {any} */ craft) => {
      const apricorn = consumableItems[craft?.apricornId]
      if (!apricorn?.kurtBall) return null
      const remaining = Number(craft.battlesRemaining)
      return {
        apricornId: craft.apricornId,
        ballId: apricorn.kurtBall,
        battlesRemaining: Number.isFinite(remaining) ? Math.max(0, Math.floor(remaining)) : 0,
      }
    })
    .filter(Boolean)
    .slice(0, 30)

  // Poké Pelago islands: keep only assignments whose Pokemon still exist.
  const pelago = createPelago(),
    savedPelago = saved.pelago && typeof saved.pelago === 'object' ? saved.pelago : {}
  for (const islandId of Object.keys(pelago)) {
    const savedIsland = savedPelago[islandId]
    if (!savedIsland || typeof savedIsland !== 'object') continue
    pelago[islandId] = {
      assigned: Array.isArray(savedIsland.assigned)
        ? savedIsland.assigned.filter((/** @type {string} */ id) => companionIds.has(id)).slice(0, PELAGO_SLOTS)
        : [],
      progress:
        typeof savedIsland.progress === 'number'
          ? Math.max(0, Math.floor(savedIsland.progress))
          : 0,
      ready: Number.isInteger(savedIsland.ready)
        ? Math.max(0, Math.min(PELAGO_MAX_READY, savedIsland.ready))
        : 0,
    }
  }

  // The Secret Base: keep the placement grid sane and drop unknown
  // decorations and out-of-bounds cells.
  const secretBase = (() => {
      const base = createSecretBase(),
        raw = saved.secretBase && typeof saved.secretBase === 'object' ? saved.secretBase : null
      if (!raw) return base
      if (typeof raw.locationId === 'string' && mapData[raw.locationId]?.type === 'route')
        base.locationId = raw.locationId
      const seen = new Set()
      const placements = Array.isArray(raw.placements) ? raw.placements : []
      for (const placement of placements) {
        if (!placement || !decorationById(placement.decorationId)) continue
        const x = Math.floor(Number(placement.x)),
          y = Math.floor(Number(placement.y))
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue
        if (x < 0 || y < 0 || x >= SECRET_BASE_GRID.width || y >= SECRET_BASE_GRID.height) continue
        const key = `${x}:${y}`
        if (seen.has(key)) continue
        // A unique (milestone) decoration cannot be duplicated across cells.
        const decoration = decorationById(placement.decorationId)
        if (decoration?.milestone && base.placements.some((entry) => entry.decorationId === placement.decorationId))
          continue
        seen.add(key)
        base.placements.push({ decorationId: placement.decorationId, x, y })
      }
      const inventory = /** @type {Record<string, number>} */ ({})
      if (raw.inventory && typeof raw.inventory === 'object')
        for (const [decorationId, count] of Object.entries(raw.inventory)) {
          const decoration = decorationById(decorationId)
          if (!decoration || !Number.isFinite(count) || count <= 0) continue
          // Milestone trophies are unique; don't let a corrupt count stack them.
          inventory[decorationId] = decoration.milestone ? 1 : Math.min(99, Math.floor(Number(count)))
        }
      base.inventory = inventory
      base.lastYieldDate = typeof raw.lastYieldDate === 'string' ? raw.lastYieldDate : ''
      base.yieldProgress = Number.isFinite(raw.yieldProgress)
        ? Math.max(0, Math.min(SECRET_BASE_YIELD_WIN_CAP, Math.floor(raw.yieldProgress)))
        : 0
      base.totalYield = Number.isFinite(raw.totalYield)
        ? Math.max(0, Math.floor(raw.totalYield))
        : 0
      return base
    })()

  // Field Jobs: keep only jobs for a real activity whose worker still exists.
  const jobs = /** @type {Record<string, any>} */ ({}),
    savedJobs = saved.jobs && typeof saved.jobs === 'object' ? saved.jobs : {}
  for (const rawJob of Object.values(savedJobs)) {
    if (!rawJob || typeof rawJob !== 'object') continue
    if (!rawJob.locationId || !rawJob.activityId || !companionIds.has(rawJob.pokemonId)) continue
    const location = mapData[rawJob.locationId]
    if (!location || !routeActivityIds(location).includes(rawJob.activityId)) continue
    const worker = [...party, ...box].find((member) => member.id === rawJob.pokemonId),
      cycleMs = jobCycleMs(worker?.level ?? 5, worker?.ability)
    const items = /** @type {Record<string, number>} */ ({})
    if (rawJob.items && typeof rawJob.items === 'object')
      for (const [itemId, quantity] of Object.entries(rawJob.items))
        if (Number.isFinite(quantity) && quantity > 0) items[itemId] = Math.floor(quantity)
    const encounters = Array.isArray(rawJob.encounters)
      ? rawJob.encounters
          .filter((/** @type {any} */ entry) => entry && pokemonSpecies[entry.speciesKey])
          .slice(0, JOB_MAX_READY)
          .map((/** @type {any} */ entry) => ({
            speciesKey: entry.speciesKey,
            level: Math.max(1, Math.min(100, Math.floor(Number(entry.level) || 5))),
          }))
      : []
    jobs[jobKey(rawJob.locationId, rawJob.activityId)] = {
      locationId: rawJob.locationId,
      activityId: rawJob.activityId,
      pokemonId: rawJob.pokemonId,
      progressMs: Math.max(0, Math.min(cycleMs - 1, Math.floor(Number(rawJob.progressMs) || 0))),
      cycleMs,
      money: Math.max(0, Math.floor(Number(rawJob.money) || 0)),
      items,
      encounters,
      cycles: Math.max(0, Math.floor(Number(rawJob.cycles) || 0)),
    }
  }

  // Field research: keep only real species and sane counters.
  /**
   * Sanitise a per-species research counter map.
   * @param {any} raw
   * @returns {Record<string, number>}
   */
  const sanitizeResearchCounters = (raw) => {
    /** @type {Record<string, number>} */
    const counters = {}
    const source = raw && typeof raw === 'object' ? raw : {}
    for (const [speciesKey, count] of Object.entries(source))
      if (pokemonSpecies[speciesKey] && Number.isFinite(count) && count > 0)
        counters[speciesKey] = Math.min(1_000_000, Math.floor(/** @type {number} */ (count)))
    return counters
  }
  const researchDefeated = sanitizeResearchCounters(saved.researchDefeated),
    researchFed = sanitizeResearchCounters(saved.researchFed),
    researchMoves = sanitizeResearchCounters(saved.researchMoves),
    researchLarge = sanitizeResearchCounters(saved.researchLarge),
    researchSuperEffective = sanitizeResearchCounters(saved.researchSuperEffective),
    // Move ids a species has been seen using (for the signature-move task).
    researchMoveIds = Object.fromEntries(
      Object.entries(
        saved.researchMoveIds && typeof saved.researchMoveIds === 'object'
          ? saved.researchMoveIds
          : {}
      )
        .filter(([speciesKey]) => pokemonSpecies[speciesKey])
        .map(([speciesKey, moveIds]) => [
          speciesKey,
          [...new Set((Array.isArray(moveIds) ? moveIds : []).filter((moveId) => moveData[moveId]))],
        ])
        .filter(([, moveIds]) => moveIds.length > 0)
    )
  const researchClaimed = /** @type {Record<string, number>} */ ({}),
    savedClaimed =
      saved.researchClaimed && typeof saved.researchClaimed === 'object' ? saved.researchClaimed : {}
  for (const [speciesKey, points] of Object.entries(savedClaimed))
    if (pokemonSpecies[speciesKey] && Number.isFinite(points) && points > 0)
      researchClaimed[speciesKey] = Math.min(RESEARCH_MAX_POINTS, Math.floor(points))
  // Species whose one-time research completion reward was already granted.
  const researchRewarded = Object.fromEntries(
    Object.entries(
      saved.researchRewarded && typeof saved.researchRewarded === 'object'
        ? saved.researchRewarded
        : {}
    ).filter(([speciesKey, rewarded]) => pokemonSpecies[speciesKey] && rewarded === true)
  )
  // Ancient Relics recovered per region (for the legendary quests).
  const relics = /** @type {Record<string, number>} */ ({})
  for (const [regionId, count] of Object.entries(
    saved.relics && typeof saved.relics === 'object' ? saved.relics : {}
  ))
    if (regions.some((region) => region.id === regionId) && Number.isFinite(count) && count > 0)
      relics[regionId] = Math.min(1_000_000, Math.floor(/** @type {number} */ (count)))

  // Repair save data that references content which no longer exists (regions,
  // routes and locations have been rebuilt several times), so an old save can't
  // put the game loop into an unknown location and crash.
  const regionPrefix = (/** @type {any} */ id) => {
      const prefix = String(id ?? '').split('-')[0]
      return regions.some((region) => region.id === prefix) ? prefix : null
    },
    savedLocation = saved.currentLocation && mapData[saved.currentLocation] ? saved.currentLocation : null,
    // infer the region from any region-prefixed id the save still has
    // ("johto-town" -> "johto") so an old regional save lands back in it
    inferredRegion =
      regionPrefix(saved.currentLocation) ||
      (Array.isArray(saved.unlockedLocations)
        ? saved.unlockedLocations.map(regionPrefix).find(Boolean)
        : null) ||
      regionPrefix(saved.currentRoute),
    fallbackRegion =
      (saved.startRegion && regions.some((region) => region.id === saved.startRegion)
        ? saved.startRegion
        : null) ??
      (savedLocation ? mapData[savedLocation].region : null) ??
      inferredRegion ??
      'kanto',
    entryId = regions.find((region) => region.id === fallbackRegion)?.entry,
    safeLocation = savedLocation || entryId || 'palletTown',
    entryPath = entryRoutePath(entryId),
    savedRoute =
      saved.currentRoute && encounterData[saved.currentRoute] ? saved.currentRoute : null,
    // A saved route from another region (an Alola save seeded with Kanto's
    // route1, say) is dropped in favour of this region's first route.
    sameRegionRoute = /** @param {string} routeKey */ (routeKey) =>
      !safeLocation || !mapData[routeKey] || mapData[routeKey].region === mapData[safeLocation]?.region,
    safeRoute =
      (savedRoute && sameRegionRoute(savedRoute) ? savedRoute : null) ??
      mapData[safeLocation]?.routeKey ??
      entryPath.route ??
      savedRoute ??
      'route1'
  let safeUnlocked = /** @type {string[]} */ (
    Array.isArray(saved.unlockedLocations) ? saved.unlockedLocations : []
  ).filter((id) => mapData[id])
  for (const id of [entryId, safeLocation, ...entryPath.path])
    if (id && mapData[id]) safeUnlocked.push(id)
  safeUnlocked = [...new Set(safeUnlocked)]
  if (safeUnlocked.length === 0) safeUnlocked = ['palletTown', 'route1']
  // Rebuild the set of open regions from whichever entry towns are reachable,
  // so saves from the old fixed-chain era keep their access.
  const unlockedRegions = [
    ...new Set([
      fallbackRegion,
      ...regions
        .filter((region) => !region.isDlc && region.entry && safeUnlocked.includes(region.entry))
        .map((region) => region.id),
    ]),
  ]
  // Fishing rods are re-derived from how many regions are open, so an older
  // save (or one from before rods existed) never ends up without one.
  const savedRods = Array.isArray(saved.rods)
      ? saved.rods.filter(/** @param {string} id */ (id) => RODS.some((rod) => rod.id === id))
      : [],
    rods = [...new Set([...savedRods, ...rodsForRegionCount(unlockedRegions.length)])]

  const gymIds = new Set(gymLeaderData.map((gym) => gym.id)),
    eliteIds = new Set(elite4Data.map((member) => member.id)),
    regionIds = new Set(regions.map((region) => region.id)),
    achievementIds = new Set(ACHIEVEMENTS.map((achievement) => achievement.id)),
    defeatedGyms = (Array.isArray(saved.defeatedGyms) ? saved.defeatedGyms : []).filter(
      /** @param {string} id */ (id) => gymIds.has(id)
    ),
    defeatedEliteFour = (Array.isArray(saved.defeatedEliteFour) ? saved.defeatedEliteFour : []).filter(
      /** @param {string} id */ (id) => eliteIds.has(id)
    ),
    savedChampions = Array.isArray(saved.defeatedChampions)
      ? saved.defeatedChampions
      : saved.championDefeated
        ? ['kanto']
        : [],
    defeatedChampions = [
      ...new Set(savedChampions.filter(/** @param {string} id */ (id) => regionIds.has(id))),
    ],
    // Prestige perks: keep known perk ids, clamped to each perk's max rank.
    prestigePerks = Object.fromEntries(
      Object.entries(
        saved.prestigePerks && typeof saved.prestigePerks === 'object' ? saved.prestigePerks : {}
      )
        .filter(
          ([perkId, rank]) =>
            PRESTIGE_PERKS.some((perk) => perk.id === perkId) &&
            typeof rank === 'number' &&
            rank > 0
        )
        .map(([perkId, rank]) => {
          const perk = PRESTIGE_PERKS.find((entry) => entry.id === perkId)
          return [perkId, Math.min(perk?.maxRank ?? 0, Math.floor(/** @type {number} */ (rank)))]
        })
    ),
    prestigePoints = Math.max(0, Math.floor(Number(saved.prestigePoints) || 0)),
    // Focus hunt: keep only a valid target and sane counters.
    hunt = (() => {
      const raw = saved.hunt && typeof saved.hunt === 'object' ? saved.hunt : null,
        mode = /** @type {'species' | 'type'} */ (raw?.mode === 'type' ? 'type' : 'species')
      if (!raw || !isValidHuntTarget(mode, raw.target)) return null
      const bestQuality = ['hit', 'perfect', 'ultra'].includes(raw.bestQuality)
        ? raw.bestQuality
        : null
      return {
        mode,
        target: raw.target,
        startedAt: Number.isFinite(raw.startedAt) ? raw.startedAt : Date.now(),
        encounters: Math.max(0, Math.floor(Number(raw.encounters) || 0)),
        catches: Math.max(0, Math.floor(Number(raw.catches) || 0)),
        bestQuality,
      }
    })(),
    // Rival wins per region, clamped to the number of milestones.
    rivals = Object.fromEntries(
      Object.entries(saved.rivals && typeof saved.rivals === 'object' ? saved.rivals : {})
        .filter(
          ([regionId, stage]) =>
            regionIds.has(regionId) && typeof stage === 'number' && stage > 0
        )
        .map(([regionId, stage]) => [
          regionId,
          Math.min(RIVAL_MILESTONES.length, Math.floor(/** @type {number} */ (stage))),
        ])
    ),
    // Villain-arc progress per region, clamped to the arc's stage count.
    villainProgress = Object.fromEntries(
      Object.entries(
        saved.villainProgress && typeof saved.villainProgress === 'object'
          ? saved.villainProgress
          : {}
      )
        .filter(
          ([regionId, stage]) =>
            regionIds.has(regionId) && typeof stage === 'number' && stage > 0
        )
        .map(([regionId, stage]) => [
          regionId,
          Math.min(VILLAIN_TOTAL_STAGES, Math.floor(/** @type {number} */ (stage))),
        ])
    ),
    activeEffects = (Array.isArray(saved.activeEffects) ? saved.activeEffects : []).filter(
      /** @param {any} effect */ (effect) => effect && typeof effect === 'object' && effect.type in activeItems
    ),
    // Pokewalker steps: clamp to non-negative integers so a corrupt save can't
    // bank a negative balance (which would make every spend fail).
    pokewalker = (() => {
      const walker = createPokewalker(),
        raw = saved.pokewalker && typeof saved.pokewalker === 'object' ? saved.pokewalker : {}
      walker.steps = Math.max(0, Math.floor(Number(raw.steps) || 0))
      walker.dailySteps = Math.max(0, Math.floor(Number(raw.dailySteps) || 0))
      walker.dailyDate = typeof raw.dailyDate === 'string' ? raw.dailyDate : ''
      walker.totalSteps = Math.max(0, Math.floor(Number(raw.totalSteps) || 0))
      return walker
    })(),
    dailyEvent =
      saved.dailyEvent &&
      typeof saved.dailyEvent === 'object' &&
      dailyEventByKey[saved.dailyEvent.kind] &&
      saved.dailyEvent.date === todayKey()
        ? {
            date: saved.dailyEvent.date,
            kind: saved.dailyEvent.kind,
            claimed: !!saved.dailyEvent.claimed,
          }
        : null,
    rewardedGenerations = (
      Array.isArray(saved.rewardedGenerations) ? saved.rewardedGenerations : []
    ).filter(
      /** @param {any} index */ (index) =>
        Number.isInteger(index) && index >= 0 && index < speciesKeysByGeneration.length
    ),
    familyBases = new Set(formDexModel.families.map((family) => family.base)),
    regionalSetIds = new Set(formDexModel.regionalSets.map((set) => set.id)),
    formDexGenders = (() => {
      /** @type {Record<string, string[]>} */
      const genders = {}
      const source =
        saved.formDexGenders && typeof saved.formDexGenders === 'object' ? saved.formDexGenders : {}
      for (const [speciesKey, rawGenders] of Object.entries(source)) {
        if (!pokemonSpecies[speciesKey]) continue
        const valid = (Array.isArray(rawGenders) ? rawGenders : []).filter(
          (/** @type {any} */ gender) => gender === 'male' || gender === 'female'
        )
        if (valid.length > 0) genders[speciesKey] = [...new Set(valid)]
      }
      // Seed from the current team/box so a save made before gender tracking
      // still credits the visual genders it already owns.
      for (const member of [...party, ...box]) {
        if (!member?.speciesKey) continue
        const gender = genderForPokemon(member)
        if (gender !== 'male' && gender !== 'female') continue
        genders[member.speciesKey] = [...new Set([...(genders[member.speciesKey] ?? []), gender])]
      }
      return genders
    })(),
    rewardedFamilies = (Array.isArray(saved.rewardedFamilies) ? saved.rewardedFamilies : []).filter(
      /** @param {any} base */ (base) => familyBases.has(base)
    ),
    rewardedRegionalSets = (
      Array.isArray(saved.rewardedRegionalSets) ? saved.rewardedRegionalSets : []
    ).filter(/** @param {any} id */ (id) => regionalSetIds.has(id)),
    rewardedFormGenerations = (
      Array.isArray(saved.rewardedFormGenerations) ? saved.rewardedFormGenerations : []
    ).filter(
      /** @param {any} index */ (index) =>
        Number.isInteger(index) && index >= 0 && index < speciesKeysByGeneration.length
    ),
    rewardedAchievements = (
      Array.isArray(saved.rewardedAchievements) ? saved.rewardedAchievements : []
    ).filter(/** @param {any} id */ (id) => achievementIds.has(id)),
    // The Battle Tower is Hoenn-only now. Consolidate any legacy per-region
    // record into Hoenn's, and drop a run that was started elsewhere.
    saveTowerRegion = mapData[safeLocation]?.region ?? fallbackRegion,
    consolidatedTowerBest = Math.max(
      0,
      ...Object.values(saved.towerBest ?? {}).filter(
        (/** @type {any} */ floor) => typeof floor === 'number'
      )
    ),
    repairedTowerBest = /** @type {Record<string, number>} */ (
      consolidatedTowerBest > 0 ? { [BATTLE_TOWER_REGION]: consolidatedTowerBest } : {}
    ),
    repairedTowerFloor =
      typeof saved.towerFloor === 'number' &&
      saved.towerFloor > 0 &&
      saveTowerRegion === BATTLE_TOWER_REGION
        ? saved.towerFloor
        : 0,
    // Battle Frontier records: keep only known facilities and sane floors.
    frontierIds = new Set(FRONTIER_FACILITIES.map((facility) => facility.id)),
    sanitizeFrontierFloors = /** @param {any} raw */ (raw) =>
      Object.fromEntries(
        Object.entries(raw && typeof raw === 'object' ? raw : {})
          .filter(
            ([id, floor]) =>
              frontierIds.has(id) && typeof floor === 'number' && floor > 0
          )
          .map(([id, floor]) => [id, Math.floor(/** @type {number} */ (floor))])
      ),
    repairedFrontierFloor = sanitizeFrontierFloors(saved.frontierFloor),
    repairedFrontierBest = sanitizeFrontierFloors(saved.frontierBest),
    // Best minigame results (for `unlock.minigame` gates); keep only well-formed
    // entries so a corrupt save can't wedge the route graph.
    minigameRecords = Object.fromEntries(
      Object.entries(saved.minigameRecords ?? {})
        .filter(
          ([id, record]) =>
            typeof id === 'string' && record && typeof record === 'object'
        )
        .map(([id, record]) => [
          id,
          {
            best:
              typeof record.best === 'number' && record.best > 0 ? Math.floor(record.best) : 0,
            completed: !!record.completed,
          },
        ])
    ),
    // Route activity mastery: keep known locations/activities and ranks 1-3.
    routeMastery = Object.fromEntries(
      Object.entries(saved.routeMastery ?? {})
        .filter(([locationId]) => mapData[locationId])
        .map(([locationId, activities]) => [
          locationId,
          Object.fromEntries(
            Object.entries(activities && typeof activities === 'object' ? activities : {})
              .filter(
                ([activityId, rank]) =>
                  ROUTE_ACTIVITIES[activityId] && typeof rank === 'number' && rank > 0
              )
              .map(([activityId, rank]) => [activityId, Math.min(3, Math.floor(rank))])
          ),
        ])
    ),
    masteredRoutes = (Array.isArray(saved.masteredRoutes) ? saved.masteredRoutes : []).filter(
      /** @param {string} locationId */ (locationId) => !!mapData[locationId]
    ),
    // Trainer Card profile: sanitise it against the Pokemon that actually exist
    // and the real gym badges so a stale save can't pin a released Pokemon or a
    // badge from a removed gym.
    trainerProfile = sanitizeTrainerProfile(saved.trainerProfile, {
      pokemonIds: new Set([...party, ...box].map((member) => member.id)),
      gymIds: new Set(defeatedGyms),
    })

  return {
    ...initialGameState,
    phase: saved.nuzlockeGameOver ? 'gameOver' : 'idle',
    startRegion: fallbackRegion,
    starterSpeciesKey:
      typeof saved.starterSpeciesKey === 'string'
        ? saved.starterSpeciesKey
        : (Array.isArray(saved.pokedexCaught)
            ? saved.pokedexCaught.find(/** @param {string} key */ (key) =>
                (regionalStarters[fallbackRegion] ?? []).includes(key)
              )
            : null) ?? null,
    playerPokemon: party[0] || playerPokemon,
    currentRoute: safeRoute,
    speed: saved.speed || initialGameState.speed,
    wildBattlesWon: saved.wildBattlesWon ?? saved.battlesWon ?? 0,
    trainerBattlesWon: saved.trainerBattlesWon ?? 0,
    battlesWonByLocation: saved.battlesWonByLocation ?? {},
    party,
    box,
    boxSort: typeof saved.boxSort === 'string' ? saved.boxSort : initialGameState.boxSort,
    // Saved party presets: keep well-formed entries only, and drop one that
    // somehow grew past the cap (or past a six-Pokemon party).
    teamPresets: (Array.isArray(saved.teamPresets) ? saved.teamPresets : [])
      .filter(
        (/** @type {any} */ preset) =>
          preset && typeof preset === 'object' && Array.isArray(preset.members)
      )
      .slice(-MAX_TEAM_PRESETS)
      .map((/** @type {any} */ preset, /** @type {number} */ index) => ({
        id: typeof preset.id === 'string' && preset.id ? preset.id : `team-${index}`,
        name:
          typeof preset.name === 'string' && preset.name.trim()
            ? preset.name.trim().slice(0, 24)
            : `Team ${index + 1}`,
        members: preset.members
          .filter((/** @type {any} */ memberId) => typeof memberId === 'string')
          .slice(0, 6),
      })),
    trainerProfile,
    autoCatch: saved.autoCatch ?? true,
    nextPokemonId: nextId,
    currentLocation: safeLocation,
    unlockedLocations: safeUnlocked,
    unlockedRegions,
    battleLog: ['Game loaded!'],
    evolutionState: null,
    catchSettings,
    globalCatchDefaults: sanitizeCatchRule(saved.globalCatchDefaults ?? FALLBACK_CATCH_RULE),
    money: saved.money ?? 3e3,
    inventory: saved.inventory ?? { pokeball: 20 },
    rods,
    trainerBattle: null,
    bossBattle: null,
    bossQueue: [],
    activePlayerPokemonIndex: 0,
    healingState: null,
    pendingBossBattle: null,
    pokedexSeen: [...seenSet],
    pokedexCaught: [...caughtSet],
    shinyCaught,
    shinyChain,
    sosChain,
    sosBestChains,
    swarm,
    pokerus,
    quests,
    daycare,
    breeding,
    companion,
    gameCornerProgress: Math.max(
      0,
      Math.floor(Number(saved.gameCornerProgress) || 0) % GAME_CORNER_PRIZE_GOAL
    ),
    garden,
    kurtCrafts,
    pelago,
    secretBase,
    jobs,
    pokewalker,
    researchDefeated,
    researchFed,
    researchMoves,
    researchLarge,
    researchSuperEffective,
    researchMoveIds,
    researchClaimed,
    researchRewarded,
    researchPoints: Math.max(0, Math.floor(Number(saved.researchPoints) || 0)),
    relics,
    shinySeen,
    alwaysCatchShinies: saved.alwaysCatchShinies ?? true,
    defeatedGyms,
    defeatedEliteFour,
    defeatedChampions,
    rivals,
    villainProgress,
    rewardedGenerations,
    rewardedFamilies,
    rewardedRegionalSets,
    rewardedFormGenerations,
    formDexGenders,
    rewardedAchievements,
    claimedGifts: (Array.isArray(saved.claimedGifts) ? saved.claimedGifts : []).filter(
      (/** @type {string} */ id) =>
        GIFTS.some((gift) => gift.id === id) || STATIC_ENCOUNTERS.some((entry) => entry.id === id)
    ),
    regionPrestige: Object.fromEntries(
      Object.entries(saved.regionPrestige ?? {}).filter(
        ([regionId, level]) => regionIds.has(regionId) && typeof level === 'number' && level > 0
      )
    ),
    prestigePoints,
    prestigePerks,
    hunt,
    // A lingering battle weather, if its route still exists.
    lingeringWeather:
      saved.lingeringWeather &&
      typeof saved.lingeringWeather === 'object' &&
      mapData[saved.lingeringWeather.locationId] &&
      typeof saved.lingeringWeather.type === 'string'
        ? {
            locationId: saved.lingeringWeather.locationId,
            type: saved.lingeringWeather.type,
            setAt: Number.isFinite(saved.lingeringWeather.setAt)
              ? saved.lingeringWeather.setAt
              : Date.now(),
          }
        : null,
    towerFloor: repairedTowerFloor,
    towerBest: repairedTowerBest,
    frontierFloor: repairedFrontierFloor,
    frontierBest: repairedFrontierBest,
    frontierRental: null,
    minigameRecords,
    routeMastery,
    masteredRoutes,
    victoryTokens: saved.victoryTokens ?? 0,
    autoProceed: saved.autoProceed ?? false,
    autoHeal: !!saved.autoHeal,
    // Hordes default on; a save only turns them off by saying so.
    hordeEncounters: saved.hordeEncounters !== false,
    // Damage numbers and shiny sparkles are on unless a save explicitly turned
    // them off (an older save has neither field).
    showDamageNumbers: saved.showDamageNumbers !== !1,
    showShinySparkles: saved.showShinySparkles !== !1,
    battleStyle:
      saved.battleStyle === 'set' || saved.battleStyle === 'training'
        ? saved.battleStyle
        : 'switch',
    battleMode: saved.battleMode === 'manual' ? 'manual' : 'auto',
    browserNotifications: !!saved.browserNotifications,
    notifyShiny: saved.notifyShiny !== !1,
    notifyRare: saved.notifyRare !== !1,
    notifyEgg: saved.notifyEgg !== !1,
    reducedMotion: !!saved.reducedMotion,
    colourblindTypes: !!saved.colourblindTypes,
    largeText: !!saved.largeText,
    martCollapsed: !!saved.martCollapsed,
    musicEnabled: !!saved.musicEnabled,
    // SFX default on for saves that predate the setting.
    sfxEnabled: saved.sfxEnabled === void 0 ? true : !!saved.sfxEnabled,
    challengeRandomizer: !!saved.challengeRandomizer,
    challengeLevelScale: !!saved.challengeLevelScale,
    challengeNuzlocke: !!saved.challengeNuzlocke,
    challengeRestrictCatches: !!saved.challengeRestrictCatches,
    challengeCatchRoutes: Array.isArray(saved.challengeCatchRoutes)
      ? saved.challengeCatchRoutes.filter((/** @type {any} */ key) => typeof key === 'string')
      : [],
    challengeMonotype: POKEMON_TYPES.includes(saved.challengeMonotype)
      ? saved.challengeMonotype
      : null,
    nuzlockeGameOver: !!saved.nuzlockeGameOver,
    raidCooldownEnd: saved.raidCooldownEnd ?? null,
    raidLegendary: saved.inRaid ? (saved.raidLegendary ?? null) : null,
    raidRegion: saved.inRaid ? (saved.raidRegion ?? 'kanto') : null,
    inRaid: saved.inRaid ?? false,
    raidLevel: saved.inRaid ? (saved.raidLevel ?? 0) : 0,
    preRaidLocation: saved.inRaid ? (saved.preRaidLocation ?? null) : null,
    dailyEvent,
    activeEffects,
    ...(saved.inRaid
      ? {
          currentLocation: saved.currentLocation || 'raidIsland',
        }
      : {}),
  }
}

/**
 * Load a save if there is one we can trust: the versioned save must carry the
 * current version, and a legacy save is migrated only if it repairs cleanly.
 * Anything else is quarantined and the game starts fresh.
 * @param {number} [slot]
 * @returns {GameState | null}
 */
export function loadSavedState(slot = getActiveSlot() || 1) {
  const raw = readRawSave(slot)
  if (!raw) return null
  let saved
  try {
    saved = JSON.parse(raw.json)
  } catch {
    quarantineSave(raw)
    return null
  }
  if (!saved || typeof saved !== 'object') {
    quarantineSave(raw)
    return null
  }
  // The versioned key always carries a version; a mismatch is a save from a
  // different build, which we don't try to guess at.
  if (!raw.legacy && saved.version !== SAVE_VERSION) {
    quarantineSave(raw)
    return null
  }
  let repaired = null
  try {
    repaired = repairSave(saved)
  } catch {
    repaired = null
  }
  if (!repaired) {
    quarantineSave(raw)
    return null
  }
  // Grant offline progress for the time the game was closed (one-off, not saved
  // back into the save, so it isn't re-awarded on the next load). Field Jobs
  // also bank for the away window (self-capped by JOB_MAX_READY).
  const awayMs = typeof saved.savedAt === 'number' ? Date.now() - saved.savedAt : 0,
    accruedJobs = accrueJobs(repaired.jobs ?? {}, awayMs),
    jobReport = summarizeJobAccrual(repaired.jobs ?? {}, accruedJobs),
    // Pokewalker steps bank from the same away window (capped per day).
    stepAccrual = accruePokewalker(repaired.pokewalker, awayMs),
    withSteps =
      stepAccrual.gained <= 0 && stepAccrual.pokewalker === repaired.pokewalker
        ? repaired
        : { ...repaired, pokewalker: stepAccrual.pokewalker },
    withJobs = accruedJobs === repaired.jobs ? withSteps : { ...withSteps, jobs: accruedJobs },
    offlineReward = computeOfflineReward(withJobs, awayMs)
  if (!offlineReward) return withJobs
  const inventory = { ...withJobs.inventory }
  for (const [itemId, quantity] of Object.entries(offlineReward.items))
    inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  const rewarded = { ...withJobs, inventory }
  // Replay the per-wild-win systems across the away window so Pelago, the
  // garden, Kurt's crafts and the Day-Care keep advancing while the tab is shut.
  const simulation = simulateOfflineWildWins(rewarded, offlineReward.awayMs)
  // Replay the away window's wild encounters on the current route, auto-catching
  // by the player's own rules (and spending their balls), so the report can name
  // what was caught.
  const catches = simulateOfflineCatches(rewarded, offlineReward.awayMs)
  return {
    ...rewarded,
    ...(simulation
      ? {
          pelago: simulation.pelago,
          garden: simulation.garden,
          kurtCrafts: simulation.kurtCrafts,
          daycare: simulation.daycare,
          secretBase: simulation.secretBase,
        }
      : {}),
    ...(catches
      ? {
          inventory: catches.inventory,
          pokedexSeen: catches.pokedexSeen,
          pokedexCaught: catches.pokedexCaught,
        }
      : {}),
    money: rewarded.money + offlineReward.money,
    offlineReport: {
      ...offlineReward,
      steps: stepAccrual.gained,
      jobs: jobReport,
      systems: simulation?.summary ?? [],
      caught: catches?.caught ?? [],
      ballsUsed: catches?.ballsUsed ?? {},
    },
  }
}
/**
 * The state fields that make up a save. `serializeSave` writes exactly these
 * (plus the version/timestamp envelope) and the provider autosaves when any of
 * them changes, so a new field only has to be declared in one place.
 *
 * Player preferences are deliberately not here: they live in their own
 * localStorage key (see `settings.js`) so they survive a save reset and are
 * shared across slots. The loader still reads them from older saves once, for
 * migration.
 * @type {string[]}
 */
export const SAVED_STATE_KEYS = [
  'playerPokemon',
  'startRegion',
  'starterSpeciesKey',
  'currentRoute',
  'wildBattlesWon',
  'trainerBattlesWon',
  'battlesWonByLocation',
  'party',
  'box',
  'boxSort',
  'teamPresets',
  'trainerProfile',
  'nextPokemonId',
  'currentLocation',
  'unlockedLocations',
  'unlockedRegions',
  'catchSettings',
  'money',
  'inventory',
  'rods',
  'pokedexSeen',
  'pokedexCaught',
  'shinyCaught',
  'shinyChain',
  'sosChain',
  'sosBestChains',
  'swarm',
  'pokerus',
  'quests',
  'daycare',
  'breeding',
  'companion',
  'gameCornerProgress',
  'garden',
  'kurtCrafts',
  'pelago',
  'secretBase',
  'jobs',
  'pokewalker',
  'researchDefeated',
  'researchFed',
  'researchMoves',
  'researchLarge',
  'researchSuperEffective',
  'researchMoveIds',
  'researchClaimed',
  'researchRewarded',
  'researchPoints',
  'relics',
  'shinySeen',
  'defeatedGyms',
  'defeatedEliteFour',
  'defeatedChampions',
  'rivals',
  'villainProgress',
  'rewardedGenerations',
  'rewardedFamilies',
  'rewardedRegionalSets',
  'rewardedFormGenerations',
  'formDexGenders',
  'rewardedAchievements',
  'claimedGifts',
  'regionPrestige',
  'prestigePoints',
  'prestigePerks',
  'hunt',
  'lingeringWeather',
  'minigameRecords',
  'routeMastery',
  'masteredRoutes',
  'towerFloor',
  'towerBest',
  'frontierFloor',
  'frontierBest',
  'frontierRental',
  'victoryTokens',
  'challengeRandomizer',
  'challengeLevelScale',
  'challengeNuzlocke',
  'challengeRestrictCatches',
  'challengeCatchRoutes',
  'challengeMonotype',
  'nuzlockeGameOver',
  'raidCooldownEnd',
  'raidLegendary',
  'raidRegion',
  'inRaid',
  'raidLevel',
  'preRaidLocation',
  'dailyEvent',
  'activeEffects',
]

/**
 * Build the serialisable save blob for the current state. The field list is
 * shared with `SAVED_STATE_KEYS` so the autosave and the manual export can
 * never drift from the save shape.
 * @param {GameState} state
 * @returns {Record<string, any>}
 */
export function serializeSave(state) {
  /** @type {Record<string, any>} */
  const save = { version: SAVE_VERSION, savedAt: Date.now() }
  for (const key of SAVED_STATE_KEYS) save[key] = state[key]
  return save
}

/**
 * Write the current state to storage and clear the migrated legacy keys. Never
 * throws: storage may be unavailable or full. Returns whether the write
 * landed, so a two-step operation (the Pokemon Bank) can roll back safely.
 * @param {GameState} state
 * @param {number} [slot]
 * @returns {boolean}
 */
export function persistSave(state, slot = getActiveSlot() || 1) {
  try {
    localStorage.setItem(saveSlotKey(slot), JSON.stringify(serializeSave(state)))
    setActiveSlot(slot)
    // Migration finished: the legacy key is no longer needed.
    if (slot === 1) for (const key of LEGACY_SAVE_KEYS) localStorage.removeItem(key)
    return true
  } catch {
    /* storage may be unavailable / full */
    return false
  }
}

/** Set while a slot switch, delete or import is in flight. */
let autosaveSuspended = false

/**
 * Stop the background autosave while the player switches, deletes or imports a
 * slot. Without this the idle loop keeps ticking and an autosave can land after
 * the active slot changed (or after a slot was cleared), writing the running
 * session over the save the player just picked. Cleared by the reload that
 * always follows.
 */
export function suspendAutosave() {
  autosaveSuspended = true
}

/** Allow autosaves again (used by tests). */
export function resumeAutosave() {
  autosaveSuspended = false
}

/** @returns {boolean} */
export function isAutosaveSuspended() {
  return autosaveSuspended
}

/**
 * The background autosave: write the current state to its slot unless a slot
 * operation is in flight. Returns whether a write happened.
 * @param {GameState} state
 * @returns {boolean}
 */
export function autosaveSave(state) {
  if (autosaveSuspended) return false
  persistSave(state)
  return true
}

/**
 * Write an imported save blob as-is, stamping the current version so the loader
 * accepts it. Returns false when storage rejects the write.
 * @param {Record<string, any>} save
 * @param {number} [slot]
 * @returns {boolean}
 */
export function writeImportedSave(save, slot = getActiveSlot() || 1) {
  try {
    localStorage.setItem(saveSlotKey(slot), JSON.stringify({ ...save, version: SAVE_VERSION }))
    setActiveSlot(slot)
    return true
  } catch {
    return false
  }
}

/**
 * Build the mini Trainer Card a save slot shows, reading only the raw stored
 * blob (no full repair). Returns null when the save predates the profile.
 * @param {any} saved
 * @returns {TrainerCardData | null}
 */
function slotTrainerCard(saved) {
  try {
    const party = Array.isArray(saved.party) ? saved.party : [],
      box = Array.isArray(saved.box) ? saved.box : [],
      pokemonIds = new Set(
        [...party, ...box].map((/** @type {any} */ member) => member?.id).filter(Boolean)
      ),
      gymIds = new Set(gymLeaderData.map((gym) => gym.id)),
      profile = sanitizeTrainerProfile(saved.trainerProfile, { pokemonIds, gymIds })
    if (!saved.trainerProfile) return null
    const favourite = profile.favouritePokemonId
        ? [...party, ...box].find(
            (/** @type {any} */ member) => member?.id === profile.favouritePokemonId
          )
        : null,
      species = favourite?.speciesKey ? pokemonSpecies[favourite.speciesKey] : null,
      regionId = typeof saved.startRegion === 'string' ? saved.startRegion : 'kanto',
      region = regions.find((entry) => entry.id === regionId),
      earned = new Set(Array.isArray(saved.defeatedGyms) ? saved.defeatedGyms : []),
      badgeCase = gymLeaderData
        .filter((gym) => (gym.region ?? 'kanto') === regionId && earned.has(gym.id))
        .slice(0, BADGE_CASE_MAX)
    return {
      name: profile.name,
      title: titleById(profile.title)?.name ?? null,
      outfit: outfitById(profile.outfit),
      favourite:
        favourite && species
          ? {
              speciesKey: favourite.speciesKey,
              name: favourite.nickname || species.name || favourite.speciesKey,
              speciesName: species.name ?? favourite.speciesKey,
              spriteId: species.id,
              level: favourite.level ?? 1,
              isShiny: !!favourite.isShiny,
            }
          : null,
      regionName: region?.name ?? regionId,
      level: saved.playerPokemon?.level ?? 1,
      dex: Array.isArray(saved.pokedexCaught) ? saved.pokedexCaught.length : 0,
      badges: badgeCase.map((gym) => ({
        id: gym.id,
        name: gym.badgeName,
        color: gym.badgeColor,
      })),
      totalBadges: earned.size,
      regionId,
    }
  } catch {
    return null
  }
}

/**
 * Summarise one slot for the picker/Settings without repairing it. Reads the
 * raw JSON, so it is cheap and never throws.
 * @param {number} slot
 * @returns {SaveSlotSummary & { slot: number }}
 */
function summarizeSlot(slot) {
  const raw = readRawSave(slot)
  if (!raw) return { slot, empty: true }
  try {
    const saved = JSON.parse(raw.json)
    if (!saved || typeof saved !== 'object') return { slot, empty: false }
    const regionId = typeof saved.startRegion === 'string' ? saved.startRegion : 'kanto',
      challenges = []
    if (saved.challengeRandomizer) challenges.push('Randomizer')
    if (saved.challengeLevelScale) challenges.push('Level Scaling')
    if (saved.challengeNuzlocke) challenges.push('Nuzlocke')
    if (saved.challengeRestrictCatches) challenges.push('One Catch per Route')
    if (typeof saved.challengeMonotype === 'string' && saved.challengeMonotype)
      challenges.push(`${saved.challengeMonotype} Monotype`)
    return {
      slot,
      empty: false,
      regionId,
      regionName: regions.find((region) => region.id === regionId)?.name ?? regionId,
      level: saved.playerPokemon?.level ?? 1,
      dex: Array.isArray(saved.pokedexCaught) ? saved.pokedexCaught.length : 0,
      badges: Array.isArray(saved.defeatedGyms) ? saved.defeatedGyms.length : 0,
      savedAt: typeof saved.savedAt === 'number' ? saved.savedAt : 0,
      challenges,
      card: slotTrainerCard(saved) ?? undefined,
    }
  } catch {
    return { slot, empty: false }
  }
}

/**
 * Summarise every save slot, in order, for the boot picker and Settings.
 * @returns {(SaveSlotSummary & { slot: number })[]}
 */
export function listSaveSlots() {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => summarizeSlot(index + 1))
}

/**
 * Encode a save blob as a URL-safe base64 share code so it can be pasted to
 * another device. UTF-8 (names, nicknames) is handled explicitly rather than
 * relying on `btoa`'s Latin-1 input.
 * @param {Record<string, any>} save
 * @returns {string}
 */
export function encodeShareCode(save) {
  const bytes = new TextEncoder().encode(JSON.stringify(save))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a share code produced by `encodeShareCode`. Returns null when the
 * code is missing, malformed or not valid JSON.
 * @param {string} code
 * @returns {Record<string, any> | null}
 */
export function decodeShareCode(code) {
  try {
    const normalized = String(code).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/'),
      padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4),
      binary = atob(padded),
      bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}
