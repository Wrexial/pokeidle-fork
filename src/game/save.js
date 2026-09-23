// Save persistence: reading, repairing and writing the versioned localStorage
// save. Split out of context.js so the provider is just React wiring and this
// repair logic stays testable on its own.

import { BATTLE_TOWER_REGION, LEGACY_SAVE_KEYS, SAVE_BACKUP_KEY, SAVE_SLOT_COUNT, SAVE_VERSION, getActiveSlot, saveSlotKey, setActiveSlot } from '../data/config.js'
import { dailyEventByKey, todayKey } from '../data/daily-events.js'
import { activeItems, pokeBalls } from '../data/items.js'
import { elite4Data, encounterData, gymLeaderData, mapData, moveData, pokemonSpecies, preEvolutionMap, regions, speciesKeysByGeneration } from '../data/gameData.js'
import { BASE_FRIENDSHIP, generateIVs, calculatePokemonStats, resolvePokemonMoves, rollAbility } from './pokemon.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { natureByKey, randomNature } from '../data/natures.js'
import { POKEMON_TYPES } from '../data/moves.js'
import { RODS, rodsForRegionCount } from './minigames.js'
import { initialGameState } from './reducer.js'
import { computeOfflineReward } from './progression.js'

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

  // Older saves predate natures. Roll one for any Pokemon missing it and
  // recompute the stored stats so they reflect the new nature (HP is never
  // changed by a nature, so maxHp is stable aside from rounding).
  /** @param {any} pokemon */
  const withNature = (pokemon) => {
    if (pokemon.nature && natureByKey[pokemon.nature]) return pokemon
    const nature = randomNature(),
      species = pokemonSpecies[pokemon.speciesKey],
      stats = calculatePokemonStats(species, pokemon.level || 1, pokemon.ivs, nature)
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
    activeEffects = (Array.isArray(saved.activeEffects) ? saved.activeEffects : []).filter(
      /** @param {any} effect */ (effect) => effect && typeof effect === 'object' && effect.type in activeItems
    ),
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
        : 0

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
    boxSort: typeof saved.boxSort === 'string' ? saved.boxSort : initialGameState.boxSort,
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
    swarm,
    pokerus,
    quests,
    daycare,
    shinySeen,
    alwaysCatchShinies: saved.alwaysCatchShinies ?? true,
    defeatedGyms,
    defeatedEliteFour,
    defeatedChampions,
    rewardedGenerations,
    rewardedAchievements,
    regionPrestige: Object.fromEntries(
      Object.entries(saved.regionPrestige ?? {}).filter(
        ([regionId, level]) => regionIds.has(regionId) && typeof level === 'number' && level > 0
      )
    ),
    towerFloor: repairedTowerFloor,
    towerBest: repairedTowerBest,
    victoryTokens: saved.victoryTokens ?? 0,
    autoProceed: saved.autoProceed ?? false,
    browserNotifications: !!saved.browserNotifications,
    reducedMotion: !!saved.reducedMotion,
    colourblindTypes: !!saved.colourblindTypes,
    largeText: !!saved.largeText,
    musicEnabled: !!saved.musicEnabled,
    // SFX default on for saves that predate the setting.
    sfxEnabled: saved.sfxEnabled === void 0 ? true : !!saved.sfxEnabled,
    challengeRandomizer: !!saved.challengeRandomizer,
    challengeLevelScale: !!saved.challengeLevelScale,
    challengeNuzlocke: !!saved.challengeNuzlocke,
    challengeMonotype: POKEMON_TYPES.includes(saved.challengeMonotype)
      ? saved.challengeMonotype
      : null,
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
  // back into the save, so it isn't re-awarded on the next load).
  const offlineReward = computeOfflineReward(
    repaired,
    typeof saved.savedAt === 'number' ? Date.now() - saved.savedAt : 0
  )
  if (!offlineReward) return repaired
  const inventory = { ...repaired.inventory }
  for (const [itemId, quantity] of Object.entries(offlineReward.items))
    inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  return {
    ...repaired,
    money: repaired.money + offlineReward.money,
    inventory,
    offlineReport: offlineReward,
  }
}
/**
 * The state fields that make up a save. `serializeSave` writes exactly these
 * (plus the version/timestamp envelope) and the provider autosaves when any of
 * them changes, so a new field only has to be declared in one place.
 * @type {string[]}
 */
export const SAVED_STATE_KEYS = [
  'playerPokemon',
  'startRegion',
  'currentRoute',
  'speed',
  'wildBattlesWon',
  'trainerBattlesWon',
  'battlesWonByLocation',
  'party',
  'box',
  'boxSort',
  'autoCatch',
  'nextPokemonId',
  'currentLocation',
  'unlockedLocations',
  'unlockedRegions',
  'catchSettings',
  'globalCatchDefaults',
  'alwaysCatchShinies',
  'money',
  'inventory',
  'rods',
  'pokedexSeen',
  'pokedexCaught',
  'shinyCaught',
  'shinyChain',
  'swarm',
  'pokerus',
  'quests',
  'daycare',
  'shinySeen',
  'defeatedGyms',
  'defeatedEliteFour',
  'defeatedChampions',
  'rewardedGenerations',
  'rewardedAchievements',
  'regionPrestige',
  'towerFloor',
  'towerBest',
  'victoryTokens',
  'autoProceed',
  'browserNotifications',
  'reducedMotion',
  'colourblindTypes',
  'largeText',
  'musicEnabled',
  'sfxEnabled',
  'challengeRandomizer',
  'challengeLevelScale',
  'challengeNuzlocke',
  'challengeMonotype',
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
 * throws: storage may be unavailable or full.
 * @param {GameState} state
 * @param {number} [slot]
 */
export function persistSave(state, slot = getActiveSlot() || 1) {
  try {
    localStorage.setItem(saveSlotKey(slot), JSON.stringify(serializeSave(state)))
    setActiveSlot(slot)
    // Migration finished: the legacy key is no longer needed.
    if (slot === 1) for (const key of LEGACY_SAVE_KEYS) localStorage.removeItem(key)
  } catch {
    /* storage may be unavailable / full */
  }
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
    const regionId = typeof saved.startRegion === 'string' ? saved.startRegion : 'kanto'
    return {
      slot,
      empty: false,
      regionId,
      regionName: regions.find((region) => region.id === regionId)?.name ?? regionId,
      level: saved.playerPokemon?.level ?? 1,
      dex: Array.isArray(saved.pokedexCaught) ? saved.pokedexCaught.length : 0,
      badges: Array.isArray(saved.defeatedGyms) ? saved.defeatedGyms.length : 0,
      savedAt: typeof saved.savedAt === 'number' ? saved.savedAt : 0,
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
