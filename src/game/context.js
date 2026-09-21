// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { jsx } from 'react/jsx-runtime'
import { LEGACY_SAVE_KEYS, SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION } from '../data/config.js'
import { activeItems, pokeBalls } from '../data/items.js'
import {
  elite4Data,
  encounterData,
  gymLeaderData,
  mapData,
  moveData,
  pokemonSpecies,
  preEvolutionMap,
  regions,
} from '../data/gameData.js'
import { generateIVs, resolvePokemonMoves } from './pokemon.js'
import { gameReducer, initialGameState } from './reducer.js'

/** @type {React.Context<{ state: GameState, dispatch: (action: GameAction) => void } | null>} */
const GameContext = React.createContext(
  /** @type {{ state: GameState, dispatch: (action: GameAction) => void } | null} */ (null)
)

const FALLBACK_CATCH_RULE = {
  enabled: true,
  mode: 'always',
  levelThreshold: 1,
  enabledBalls: ['pokeball'],
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
    enabledBalls: enabledBalls.length > 0 ? enabledBalls : ['pokeball'],
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
 * Read the current versioned save, falling back once to a legacy key so an
 * older save can be migrated.
 * @returns {{ key: string, json: string, legacy: boolean } | null}
 */
function readRawSave() {
  try {
    const current = localStorage.getItem(SAVE_KEY)
    if (current) return { key: SAVE_KEY, json: current, legacy: false }
    for (const key of LEGACY_SAVE_KEYS) {
      const json = localStorage.getItem(key)
      if (json) return { key, json, legacy: true }
    }
  } catch {
    /* storage may be unavailable */
  }
  return null
}

/**
 * Turn a parsed save into a playable state, dropping anything that references
 * content which no longer exists. Returns null if there's nothing salvageable.
 * @param {any} saved
 * @returns {GameState | null}
 */
function repairSave(saved) {
  if (!saved.playerPokemon) return null
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
  party = party.map((pokemon) => (pokemon.ivs ? pokemon : { ...pokemon, ivs: generateIVs() }))
  box = box.map((pokemon) => (pokemon.ivs ? pokemon : { ...pokemon, ivs: generateIVs() }))

  // If the save's core Pokemon reference species that no longer exist, start
  // fresh instead of crashing during render.
  if (!playerPokemon.speciesKey || !pokemonSpecies[playerPokemon.speciesKey]) return null
  party = party.filter((pokemon) => pokemon?.speciesKey && pokemonSpecies[pokemon.speciesKey])
  box = box.filter((pokemon) => pokemon?.speciesKey && pokemonSpecies[pokemon.speciesKey])
  if (party.length === 0) party = [playerPokemon]

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
      ? { speciesKey: saved.shinyChain.speciesKey, count: saved.shinyChain.count }
      : initialGameState.shinyChain
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
  const daycareParents = /** @type {Pokemon[]} */ (
      Array.isArray(saved.daycare?.parents) ? saved.daycare.parents : []
    ).filter(/** @param {any} parent */ (parent) => parent && pokemonSpecies[parent.speciesKey]),
    daycare = {
      parents: daycareParents.slice(0, 2),
      progress: typeof saved.daycare?.progress === 'number' ? saved.daycare.progress : 0,
    }

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
    entryRoute = entryId
      ? mapData[entryId]?.connections.find((id) => mapData[id]?.type === 'route')
      : null,
    safeRoute =
      (saved.currentRoute && encounterData[saved.currentRoute] ? saved.currentRoute : null) ??
      mapData[safeLocation]?.routeKey ??
      entryRoute ??
      'route1'
  let safeUnlocked = /** @type {string[]} */ (
    Array.isArray(saved.unlockedLocations) ? saved.unlockedLocations : []
  ).filter((id) => mapData[id])
  for (const id of [entryId, safeLocation]) if (id && mapData[id]) safeUnlocked.push(id)
  if (entryRoute) safeUnlocked.push(entryRoute)
  safeUnlocked = [...new Set(safeUnlocked)]
  if (safeUnlocked.length === 0) safeUnlocked = ['palletTown', 'route1']
  // Rebuild the set of open regions from whichever entry towns are reachable,
  // so saves from the old fixed-chain era keep their access.
  const unlockedRegions = [
    ...new Set([
      fallbackRegion,
      ...regions
        .filter((region) => region.entry && safeUnlocked.includes(region.entry))
        .map((region) => region.id),
    ]),
  ]

  const gymIds = new Set(gymLeaderData.map((gym) => gym.id)),
    eliteIds = new Set(elite4Data.map((member) => member.id)),
    regionIds = new Set(regions.map((region) => region.id)),
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
    defeatedChampions = savedChampions.filter(/** @param {string} id */ (id) => regionIds.has(id)),
    activeEffects = (Array.isArray(saved.activeEffects) ? saved.activeEffects : []).filter(
      /** @param {any} effect */ (effect) => effect && typeof effect === 'object' && effect.type in activeItems
    )

  return {
    ...initialGameState,
    phase: 'idle',
    startRegion: fallbackRegion,
    playerPokemon: party[0] || playerPokemon,
    currentRoute: safeRoute,
    speed: saved.speed || initialGameState.speed,
    wildBattlesWon: saved.wildBattlesWon ?? saved.battlesWon ?? 0,
    trainerBattlesWon: saved.trainerBattlesWon ?? 0,
    battlesWonByLocation: saved.battlesWonByLocation ?? {},
    party,
    box,
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
    swarm,
    daycare,
    shinySeen,
    alwaysCatchShinies: saved.alwaysCatchShinies ?? true,
    defeatedGyms,
    defeatedEliteFour,
    defeatedChampions,
    regionPrestige: Object.fromEntries(
      Object.entries(saved.regionPrestige ?? {}).filter(
        ([regionId, level]) => regionIds.has(regionId) && typeof level === 'number' && level > 0
      )
    ),
    towerFloor: typeof saved.towerFloor === 'number' && saved.towerFloor > 0 ? saved.towerFloor : 0,
    towerBest: Object.fromEntries(
      Object.entries(saved.towerBest ?? {}).filter(
        ([regionId, floor]) => regionIds.has(regionId) && typeof floor === 'number' && floor > 0
      )
    ),
    victoryTokens: saved.victoryTokens ?? 0,
    autoProceed: saved.autoProceed ?? false,
    raidCooldownEnd: saved.raidCooldownEnd ?? null,
    raidLegendary: saved.inRaid ? (saved.raidLegendary ?? null) : null,
    raidRegion: saved.inRaid ? (saved.raidRegion ?? 'kanto') : null,
    inRaid: saved.inRaid ?? false,
    raidLevel: saved.inRaid ? (saved.raidLevel ?? 0) : 0,
    preRaidLocation: saved.inRaid ? (saved.preRaidLocation ?? null) : null,
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
 * @returns {GameState | null}
 */
function loadSavedState() {
  const raw = readRawSave()
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
  return repaired
}

/** @param {{ children: any }} props */
export function GameProvider({ children }) {
  const [state, dispatch] = React.useReducer(
    gameReducer,
    initialGameState,
    /** @returns {GameState} */ () => loadSavedState() ?? initialGameState
  )
  return (
    React.useEffect(() => {
      if (state.playerPokemon && (state.phase === 'idle' || state.phase === 'victory')) {
        const saveData = {
          version: SAVE_VERSION,
          playerPokemon: state.playerPokemon,
          startRegion: state.startRegion,
          currentRoute: state.currentRoute,
          speed: state.speed,
          wildBattlesWon: state.wildBattlesWon,
          trainerBattlesWon: state.trainerBattlesWon,
          battlesWonByLocation: state.battlesWonByLocation,
          party: state.party,
          box: state.box,
          autoCatch: state.autoCatch,
          nextPokemonId: state.nextPokemonId,
          currentLocation: state.currentLocation,
          unlockedLocations: state.unlockedLocations,
          unlockedRegions: state.unlockedRegions,
          catchSettings: state.catchSettings,
          globalCatchDefaults: state.globalCatchDefaults,
          alwaysCatchShinies: state.alwaysCatchShinies,
          money: state.money,
          inventory: state.inventory,
          pokedexSeen: state.pokedexSeen,
          pokedexCaught: state.pokedexCaught,
          shinyCaught: state.shinyCaught,
          shinyChain: state.shinyChain,
          swarm: state.swarm,
          daycare: state.daycare,
          shinySeen: state.shinySeen,
          defeatedGyms: state.defeatedGyms,
          defeatedEliteFour: state.defeatedEliteFour,
          defeatedChampions: state.defeatedChampions,
          regionPrestige: state.regionPrestige,
          towerFloor: state.towerFloor,
          towerBest: state.towerBest,
          victoryTokens: state.victoryTokens,
          autoProceed: state.autoProceed,
          raidCooldownEnd: state.raidCooldownEnd,
          raidLegendary: state.raidLegendary,
          raidRegion: state.raidRegion,
          inRaid: state.inRaid,
          raidLevel: state.raidLevel,
          preRaidLocation: state.preRaidLocation,
          activeEffects: state.activeEffects,
        }
        try {
          localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
          // Migration finished: the legacy key is no longer needed.
          for (const key of LEGACY_SAVE_KEYS) localStorage.removeItem(key)
        } catch {
          /* storage may be unavailable / full */
        }
      }
    }, [
      state.phase,
      state.playerPokemon?.level,
      state.playerPokemon?.totalExp,
      state.party.length,
      state.box.length,
      state.catchSettings,
      state.money,
      state.inventory,
      state.pokedexSeen.length,
      state.pokedexCaught.length,
      state.shinyCaught.length,
      state.shinySeen.length,
      state.alwaysCatchShinies,
      state.defeatedGyms.length,
      state.defeatedEliteFour.length,
      state.defeatedChampions.length,
      state.unlockedRegions.length,
      state.regionPrestige,
      state.towerFloor,
      state.towerBest,
      state.victoryTokens,
      state.autoProceed,
      state.raidCooldownEnd,
      state.activeEffects,
    ]),
    jsx(GameContext.Provider, {
      value: {
        state,
        dispatch,
      },
      children,
    })
  )
}

/** @returns {{ state: GameState, dispatch: (action: GameAction) => void }} */
export function useGame() {
  const context = React.useContext(GameContext)
  if (!context) throw new Error('useGame must be used within GameProvider')
  return context
}

// Exposed for the save-repair checks (no test runner in the repo).
export { loadSavedState, repairSave }
