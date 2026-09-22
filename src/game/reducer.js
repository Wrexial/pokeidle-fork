// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import { BATTLE_TOWER_REGION, RAID_COOLDOWN_MS, RAID_LEVEL_MAX, breedShinyOdds, breedShinyParentOdds, daycareEggBattles, defaultCatchSettings, dexRewardVictoryTokens, expCandyDropChance, prestigeTokenReward, rareCandyDropChance, swarmBattleCount, swarmSpawnChance, tutorMoveCost, valuableDropChance, wildMasterBallChance, wonderTradeShinyOdds } from '../data/config.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { activeItems, consumableItems, evolutionItems, heldItems, pokeBalls } from '../data/items.js'
import { dailyDropMultiplier, dailyEventByKey, rollDailyEvent, todayKey } from '../data/daily-events.js'
import { natureName, randomNature } from '../data/natures.js'
import { elite4Data, encounterData, gymLeaderData, mapData, moveLearnsets, pokemonSpecies, regions } from '../data/gameData.js'
import { createVolatileState } from './combat.js'
import { calculatePokemonStats, calculateRequiredExperience, createEgg, createPokemon, gainFriendship, getLevelUpResults, insertIntoBox, isBattleReady, isTutorMove, judgeIVs, nextBoxSortMode, resolvePokemonMoves, sortBoxMembers } from './pokemon.js'
import { canBreed, eggHatchSteps, eggSpeciesKey, inheritBreedingTraits } from './breeding.js'
import { advanceQuests, questLabel, rollQuests } from './quests.js'
import { buildTrainerTeam, checkShinyOdds, computeUnlockedLocations, createIdleBattleState, formatReward, getRegionUnlockTokens, isActiveEffectItem, loadActivePokemonFromParty, prepareNextBattle, releaseReward, rollCandyDrop, rollValuableDrop, syncActivePokemonIntoParty, tickBattleCounters, tickPartyEggs, tickPokerus } from './progression.js'
import { BUG_CONTEST_COST, MINING_COST } from './minigames.js'
import { applyEntryHazards, emptyBattleHazards } from './hazards.js'

/** @type {GameState} */
export const initialGameState = {
  phase: 'starterSelect',
  startRegion: 'kanto',
  playerPokemon: null,
  enemyPokemon: null,
  currentRoute: 'route1',
  battleEvents: [],
  pendingEvents: [],
  currentEventIndex: 0,
  /** Turns the current battle has lasted (see CatchContext). */
  battleTurn: 0,
  /** Active field weather for the current battle, or null. */
  weather: null,
  /** Active field terrain for the current battle, or null. */
  terrain: null,
  /** Entry hazards for the current battle, one bucket per side. */
  battleHazards: emptyBattleHazards(),
  speed: 1,
  paused: !1,
  battleLog: [],
  levelUpNotification: null,
  /** Transient toast queue (see NotificationStack). */
  notifications: [],
  /** Monotonic id source for toast keys. */
  nextNotificationId: 1,
  wildBattlesWon: 0,
  trainerBattlesWon: 0,
  battlesWonByLocation: {},
  party: [],
  box: [],
  /** Chosen box sort mode (see BOX_SORT_OPTIONS). */
  boxSort: 'dex',
  /** Newly hatched Pokemon shown in the hatch popup (null when dismissed). */
  hatchResult: null,
  autoCatch: !0,
  nextPokemonId: 1,
  currentLocation: 'palletTown',
  unlockedLocations: ['palletTown', 'route1'],
  unlockedRegions: [],
  evolutionState: null,
  catchSettings: {},
  globalCatchDefaults: defaultCatchSettings,
  money: 3e3,
  inventory: {
    pokeball: 20,
  },
  trainerBattle: null,
  bossBattle: null,
  bossQueue: [],
  activePlayerPokemonIndex: 0,
  healingState: null,
  pendingBossBattle: null,
  alwaysCatchShinies: !0,
  pokedexSeen: [],
  pokedexCaught: [],
  shinyCaught: [],
  /** Active swarm: a route temporarily overrun by one species. */
  swarm: null,
  /** Pokerus: a rare, party-wide 2x EXP boost with a battle countdown. */
  pokerus: null,
  /** Today's daily quests, or null before they are rolled. */
  quests: null,
  /** A pending region-dex-completion celebration (phase `dexComplete`). */
  dexCelebration: null,
  /** A one-off offline-progress report shown on return (never saved). */
  offlineReport: null,
  /** Today's rotating event + whether its gift was claimed (see src/data/daily-events.js). */
  dailyEvent: null,
  /** Daycare: up to two deposited parents breeding eggs. */
  daycare: { parents: [], progress: 0 },
  /** Consecutive encounters of one species, boosting shiny odds (DexNav). */
  shinyChain: { speciesKey: null, count: 0 },
  shinySeen: [],
  defeatedGyms: [],
  defeatedEliteFour: [],
  defeatedChampions: [],
  /** Generation indices (0-based) whose dex-completion reward has been paid. */
  rewardedGenerations: [],
  /** Achievement ids whose one-off reward has been paid. */
  rewardedAchievements: [],
  regionPrestige: {},
  /** Next Battle Tower floor to attempt (0 = not in a run). Hoenn only. */
  towerFloor: 0,
  /** Best Tower floor cleared per region (only Hoenn is used). */
  towerBest: {},
  victoryTokens: 0,
  autoProceed: !1,
  /** Whether key events raise a browser notification while the tab is hidden. */
  browserNotifications: !1,
  /** Force reduced-motion animations off, regardless of the OS setting. */
  reducedMotion: !1,
  /** Add type labels to moves so type is not conveyed by colour alone. */
  colourblindTypes: !1,
  /** Uniformly scale the UI up for readability. */
  largeText: !1,
  /** Background music (off by default; the AudioContext starts on first use). */
  musicEnabled: !1,
  /** Sound effects for notable events (on by default). */
  sfxEnabled: !0,
  /** Challenge: wild encounters roll a random species. */
  challengeRandomizer: !1,
  /** Challenge: wild encounter levels match your active Pokemon. */
  challengeLevelScale: !1,
  /** Challenge: a fainted party Pokemon is released permanently. */
  challengeNuzlocke: !1,
  raidCooldownEnd: null,
  raidLegendary: null,
  raidRegion: null,
  inRaid: !1,
  raidLevel: 0,
  preRaidLocation: null,
  playerVolatile: null,
  activeEffects: [],
}

/**
 * Once every region is open, leftover Region Unlock Tokens have nothing left
 * to spend on, so convert them to Victory Tokens. Only called when a new
 * Champion is beaten or the last region is opened, so a given surplus is
 * settled exactly once.
 * @param {GameState} state
 * @returns {GameState}
 */
function settleUnlockTokens(state) {
  if ((state.unlockedRegions ?? []).length < regions.length) return state
  const leftover = getRegionUnlockTokens(state)
  if (leftover <= 0) return state
  return {
    ...state,
    victoryTokens: state.victoryTokens + leftover,
    battleLog: [
      ...state.battleLog,
      `${leftover} leftover Region Unlock Token${leftover > 1 ? 's' : ''} converted to Victory Token${leftover > 1 ? 's' : ''}.`,
    ].slice(-50),
  }
}

/** Most toasts shown at once; older ones drop off the top. */
const NOTIFICATION_CAP = 4
/** Repeat events with the same dedupe key are dropped inside this window. */
const NOTIFICATION_COOLDOWN_MS = 6000

/**
 * Add a toast to the queue, collapsing repeats (same `dedupeKey`) inside the
 * cooldown so idle events can't spam the screen.
 * @param {GameState} state
 * @param {{ message: string, tone?: string, icon?: string | null, dedupeKey?: string, cooldown?: number }} notification
 * @returns {GameState}
 */
function withNotification(state, notification) {
  const now = Date.now(),
    dedupeKey = notification.dedupeKey ?? notification.message,
    cooldown = notification.cooldown ?? NOTIFICATION_COOLDOWN_MS,
    active = state.notifications.filter(
      (entry) => now - entry.createdAt <= NOTIFICATION_COOLDOWN_MS
    )
  if (active.some((entry) => entry.dedupeKey === dedupeKey && now - entry.createdAt <= cooldown))
    return {
      ...state,
      notifications: active,
    }
  const nextId = state.nextNotificationId ?? 1
  return {
    ...state,
    notifications: [
      ...active,
      {
        id: nextId,
        message: notification.message,
        tone: notification.tone ?? 'info',
        icon: notification.icon ?? null,
        dedupeKey,
        createdAt: now,
      },
    ].slice(-NOTIFICATION_CAP),
    nextNotificationId: nextId + 1,
  }
}

/**
 * Pick a random unlocked route and one of its rarer species for a new swarm.
 * @param {GameState} state
 * @returns {{ routeKey: string, speciesKey: string, battlesRemaining: number } | null}
 */
function rollSwarm(state) {
  const routes = state.unlockedLocations.filter(
    (id) => mapData[id]?.type === 'route' && encounterData[id]?.encounters?.length
  )
  if (routes.length === 0) return null
  const routeKey = routes[Math.floor(Math.random() * routes.length)],
    encounters = encounterData[routeKey].encounters,
    rarest = [...encounters].sort((left, right) => left.weight - right.weight)[0]
  return rarest
    ? { routeKey, speciesKey: rarest.speciesKey, battlesRemaining: swarmBattleCount }
    : null
}

/**
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function gameReducer(state, action) {
  switch (action.type) {
    case 'SELECT_STARTER': {
      const regionId = action.payload.region ?? 'kanto',
        region = regions.find((candidate) => candidate.id === regionId),
        entryTown = region?.entry,
        firstRoute =
          entryTown && mapData[entryTown]
            ? mapData[entryTown].connections.find((id) => mapData[id]?.type === 'route')
            : null,
        starterLevel = region?.startLevel ?? 5,
        starterPokemon = createPokemon(
          action.payload.speciesKey,
          starterLevel,
          state.nextPokemonId,
          action.payload.isShiny
        ),
        speciesKey = action.payload.speciesKey
      return {
        ...state,
        phase: 'idle',
        startRegion: regionId,
        playerPokemon: starterPokemon,
        party: [starterPokemon],
        nextPokemonId: state.nextPokemonId + 1,
        currentLocation: firstRoute ?? entryTown ?? state.currentLocation,
        currentRoute: firstRoute ?? state.currentRoute,
        unlockedRegions: [regionId],
        unlockedLocations: entryTown
          ? [...new Set([entryTown, ...(firstRoute ? [firstRoute] : [])])]
          : state.unlockedLocations,
        battleLog: [
          `You began your journey in ${region?.name ?? 'Kanto'} with ${starterPokemon.name}!`,
        ],
        pokedexSeen: state.pokedexSeen.includes(speciesKey)
          ? state.pokedexSeen
          : [...state.pokedexSeen, speciesKey],
        pokedexCaught: state.pokedexCaught.includes(speciesKey)
          ? state.pokedexCaught
          : [...state.pokedexCaught, speciesKey],
      }
    }
    case 'UNLOCK_REGION': {
      const regionId = action.payload.regionId,
        region = regions.find((candidate) => candidate.id === regionId)
      if (!region || state.unlockedRegions.includes(regionId)) return state
      if (getRegionUnlockTokens(state) <= 0) return state
      const entryId = region.entry,
        firstRoute =
          entryId && mapData[entryId]
            ? mapData[entryId].connections.find(
                /** @param {string} id */ (id) => mapData[id]?.type === 'route'
              ) ?? null
            : null,
        unlockedState = {
          ...state,
          unlockedRegions: [...state.unlockedRegions, regionId],
          unlockedLocations: [
            ...new Set([
              ...state.unlockedLocations,
              ...(entryId ? [entryId] : []),
              ...(firstRoute ? [firstRoute] : []),
            ]),
          ],
        }
      return withNotification(
        settleUnlockTokens({
          ...unlockedState,
          unlockedLocations: computeUnlockedLocations(unlockedState),
          battleLog: [...state.battleLog, `${region.name} unlocked!`].slice(-50),
        }),
        {
          message: `A new region opened: ${region.name}!`,
          tone: 'success',
          icon: '🗺️',
          dedupeKey: `region:${regionId}`,
        }
      )
    }
    case 'START_ENCOUNTER': {
      const firstAliveIndex = state.party.findIndex((member) => isBattleReady(member)),
        activeIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0
      return {
        ...state,
        phase: 'battling',
        enemyPokemon: action.payload.enemy,
        playerPokemon: state.party[activeIndex] || state.playerPokemon,
        activePlayerPokemonIndex: activeIndex,
        battleEvents: [],
        pendingEvents: [
          {
            type: 'encounter',
            message: action.payload.enemy.isShiny
              ? `A shiny wild ${action.payload.enemy.name} appeared!`
              : `Wild ${action.payload.enemy.name} appeared!`,
          },
        ],
        currentEventIndex: 0,
        battleTurn: 0,
        weather: null,
        battleHazards: emptyBattleHazards(),
        terrain: null,
        playerVolatile: createVolatileState(),
      }
    }
    case 'EXECUTE_TURN':
      return {
        ...state,
        battleTurn: (state.battleTurn ?? 0) + 1,
        pendingEvents: [...state.pendingEvents, ...action.payload.events],
      }
    case 'CONSUME_EVENT': {
      if (state.pendingEvents.length === 0) return state
      const [event, ...remainingEvents] = state.pendingEvents,
        battleLog = event.message
          ? [...state.battleLog, event.message].slice(-50)
          : state.battleLog
      let newPhase = state.phase
      ;(event.type === 'victory' && (newPhase = 'victory'),
        event.type === 'defeat' && (newPhase = 'defeat'),
        event.type === 'flee' && (newPhase = 'idle'),
        event.type === 'faint' &&
          (event.data?.target === 'enemy'
            ? (newPhase = 'victory')
            : event.data?.target === 'player' && (newPhase = 'defeat')))
      let playerPokemon = state.playerPokemon,
        enemyPokemon = state.enemyPokemon,
        wildBattlesWon = state.wildBattlesWon,
        battlesWonByLocation = state.battlesWonByLocation,
        weather = state.weather,
        battleHazards = state.battleHazards,
        terrain = state.terrain
      event.type === 'weather' &&
        event.data &&
        (weather = event.data.weather ?? weather)
      event.type === 'hazards' &&
        event.data &&
        (battleHazards = event.data.hazards ?? battleHazards)
      event.type === 'terrain' &&
        event.data &&
        (terrain = event.data.terrain ?? terrain)
      event.type === 'flee' && (enemyPokemon = null)
      ;(event.type === 'damage' || event.type === 'recoil' || event.type === 'heal') &&
        event.data &&
        (event.data.target === 'player' && playerPokemon
          ? (playerPokemon = {
              ...playerPokemon,
              currentHp: event.data.hpAfter ?? playerPokemon.currentHp,
            })
          : event.data.target === 'enemy' &&
            enemyPokemon &&
            (enemyPokemon = {
              ...enemyPokemon,
              currentHp: event.data.hpAfter ?? enemyPokemon.currentHp,
            }))
      let activeEffects = state.activeEffects,
        swarm = state.swarm,
        pokerus = state.pokerus,
        quests = state.quests,
        daycare = state.daycare,
        party = state.party,
        hatchedEgg = /** @type {Pokemon[]} */ ([]),
        inventory = state.inventory,
        secretNotices = [],
        dropNotifications = [],
        swarmNotice = null
      if (
        event.type === 'faint' &&
        event.data?.target === 'enemy' &&
        !state.trainerBattle &&
        !state.bossBattle
      ) {
        wildBattlesWon++
        // Battling together builds friendship (and can unlock friendship evolutions).
        playerPokemon &&
          (playerPokemon = {
            ...playerPokemon,
            friendship: gainFriendship(playerPokemon, 2),
          })
        const locationWins = battlesWonByLocation[state.currentLocation] ?? 0
        ;((battlesWonByLocation = {
          ...battlesWonByLocation,
          [state.currentLocation]: locationWins + 1,
        }),
          (activeEffects = tickBattleCounters(activeEffects)))
        // Advance an active swarm, or occasionally start a new one.
        if (swarm)
          swarm =
            swarm.battlesRemaining <= 1
              ? null
              : { ...swarm, battlesRemaining: swarm.battlesRemaining - 1 }
        else if (Math.random() < swarmSpawnChance) {
          swarm = rollSwarm(state)
          if (swarm)
            swarmNotice = `A swarm of ${
              pokemonSpecies[swarm.speciesKey]?.name ?? swarm.speciesKey
            } appeared on ${mapData[swarm.routeKey]?.name ?? swarm.routeKey}!`
        }
        // Daycare parents make progress toward an egg.
        if (
          daycare.parents.length === 2 &&
          canBreed(daycare.parents) &&
          daycare.progress < daycareEggBattles
        )
          daycare = { ...daycare, progress: daycare.progress + 1 }
        // Eggs carried in the party hatch after enough wild wins.
        const eggTick = tickPartyEggs(party)
        party = eggTick.party
        hatchedEgg = eggTick.hatched
        // Pokerus is caught very rarely on a wild win, and doubles EXP for a
        // while before it cures.
        const pokerusResult = tickPokerus(pokerus)
        pokerus = pokerusResult.pokerus
        pokerusResult.infected &&
          secretNotices.push('Your Pokemon caught Pokerus! EXP gain is doubled for a while.')
        pokerusResult.cured && secretNotices.push('Your Pokemon recovered from Pokerus.')
        // Daily quests track wild wins (and route-specific ones).
        quests = advanceQuests(quests, { kind: 'wild', locationId: state.currentLocation })
        // Daily "Harvest Day" doubles the chance of every wild item drop.
        const dropBonus = dailyDropMultiplier(state.dailyEvent),
          dropChance = /** @param {number} chance */ (chance) => Math.min(1, chance * dropBonus)
        // A very rare Master Ball find.
        if (Math.random() < dropChance(wildMasterBallChance)) {
          inventory = {
            ...inventory,
            masterball: (inventory.masterball ?? 0) + 1,
          }
          secretNotices.push('You found a Master Ball!')
          dropNotifications.push({
            message: 'You found a Master Ball!',
            tone: 'shiny',
            icon: '🌐',
            dedupeKey: 'drop:masterball',
          })
        }
        // Treasure and candy finds, scaled by the foe's level.
        const dropLevel = enemyPokemon?.level ?? 1
        if (Math.random() < dropChance(valuableDropChance)) {
          const valuableId = rollValuableDrop(dropLevel)
          inventory = {
            ...inventory,
            [valuableId]: (inventory[valuableId] ?? 0) + 1,
          }
          secretNotices.push(`You found a ${consumableItems[valuableId].name}!`)
        }
        const candyId = Math.random() < dropChance(rareCandyDropChance) ? 'rareCandy' : null
        if (candyId || Math.random() < dropChance(expCandyDropChance)) {
          const foundCandyId = candyId ?? rollCandyDrop(dropLevel)
          inventory = {
            ...inventory,
            [foundCandyId]: (inventory[foundCandyId] ?? 0) + 1,
          }
          secretNotices.push(`You found a ${consumableItems[foundCandyId].name}!`)
          if (candyId)
            dropNotifications.push({
              message: 'You found a Rare Candy!',
              tone: 'success',
              icon: '🍬',
              dedupeKey: 'drop:rareCandy',
            })
        }
      }
      let syncedState = syncActivePokemonIntoParty({
        ...state,
        phase: newPhase,
        pendingEvents: remainingEvents,
        battleEvents: [...state.battleEvents, event],
        battleLog:
          swarmNotice || secretNotices.length
            ? [...battleLog, ...[swarmNotice, ...secretNotices].filter(Boolean)].slice(-50)
            : battleLog,
        playerPokemon,
        enemyPokemon,
        wildBattlesWon,
        battlesWonByLocation,
        weather,
        battleHazards,
        terrain,
        activeEffects,
        swarm,
        pokerus,
        quests,
        party,
        daycare,
        inventory,
      })
      for (const dropNotification of dropNotifications)
        syncedState = withNotification(syncedState, dropNotification)
      if (hatchedEgg.length > 0) {
        for (const hatched of hatchedEgg) {
          const hatchKey = hatched.speciesKey
          syncedState = withNotification(
            {
              ...syncedState,
              pokedexSeen: syncedState.pokedexSeen.includes(hatchKey)
                ? syncedState.pokedexSeen
                : [...syncedState.pokedexSeen, hatchKey],
              pokedexCaught: syncedState.pokedexCaught.includes(hatchKey)
                ? syncedState.pokedexCaught
                : [...syncedState.pokedexCaught, hatchKey],
              shinySeen:
                hatched.isShiny && !syncedState.shinySeen.includes(hatchKey)
                  ? [...syncedState.shinySeen, hatchKey]
                  : syncedState.shinySeen,
              shinyCaught:
                hatched.isShiny && !syncedState.shinyCaught.includes(hatchKey)
                  ? [...syncedState.shinyCaught, hatchKey]
                  : syncedState.shinyCaught,
              battleLog: [
                ...syncedState.battleLog,
                `Your Egg hatched into ${hatched.name}${hatched.isShiny ? ' \u2726 shiny!' : ''}!`,
              ].slice(-50),
            },
            {
              message: `Your Egg hatched into ${hatched.name}!`,
              tone: hatched.isShiny ? 'shiny' : 'success',
              icon: '\ud83d\udc23',
              dedupeKey: `hatch:${hatched.id}`,
            }
          )
        }
        syncedState = { ...syncedState, hatchResult: hatchedEgg[hatchedEgg.length - 1] }
      }
      if (
        event.type === 'victory' ||
        (event.type === 'faint' && event.data?.target === 'enemy')
      ) {
        const unlocked = computeUnlockedLocations(syncedState),
          newlyUnlocked = unlocked.filter((locationId) => !syncedState.unlockedLocations.includes(locationId))
        let log = syncedState.battleLog,
          result = {
            ...syncedState,
            unlockedLocations: unlocked,
          }
        for (const locationId of newlyUnlocked) {
          const location = mapData[locationId]
          if (!location) continue
          log = [...log, `${location.name} is now accessible!`].slice(-50)
          result = withNotification(result, {
            message: `${location.name} is now accessible!`,
            tone: 'info',
            icon: '🚩',
            dedupeKey: `unlock:${locationId}`,
          })
        }
        return {
          ...result,
          battleLog: log,
        }
      }
      return syncedState
    }
    case 'APPLY_EXP': {
      if (!state.playerPokemon) return state
      const newTotalExp = state.playerPokemon.totalExp + action.payload.expGained
      let updatedPokemon = {
        ...state.playerPokemon,
        totalExp: newTotalExp,
      }
      const battleLog = [...state.battleLog, `${updatedPokemon.name} gained ${action.payload.expGained} EXP!`]
      if (action.payload.newLevel && action.payload.newStats) {
        const hpGain = (action.payload.newStats.maxHp ?? updatedPokemon.maxHp) - updatedPokemon.maxHp,
          levelsGained = Math.max(1, action.payload.newLevel - updatedPokemon.level)
        ;((updatedPokemon = {
          ...updatedPokemon,
          level: action.payload.newLevel,
          friendship: gainFriendship(updatedPokemon, levelsGained * 8),
          maxHp: action.payload.newStats.maxHp ?? updatedPokemon.maxHp,
          currentHp: Math.min(
            updatedPokemon.currentHp + hpGain,
            action.payload.newStats.maxHp ?? updatedPokemon.maxHp
          ),
          attack: action.payload.newStats.attack ?? updatedPokemon.attack,
          defense: action.payload.newStats.defense ?? updatedPokemon.defense,
          spAttack: action.payload.newStats.spAttack ?? updatedPokemon.spAttack,
          spDefense: action.payload.newStats.spDefense ?? updatedPokemon.spDefense,
          speed: action.payload.newStats.speed ?? updatedPokemon.speed,
        }),
          battleLog.push(`${updatedPokemon.name} grew to level ${updatedPokemon.level}!`))
      }
      if (action.payload.newMoves && action.payload.newMoves.length > 0) {
        let newMoves = [...updatedPokemon.moves]
        for (const moveId of action.payload.newMoves)
          newMoves.includes(moveId) ||
            (newMoves.length >= 4 ? (newMoves = [...newMoves.slice(1), moveId]) : (newMoves = [...newMoves, moveId]),
            battleLog.push(`${updatedPokemon.name} learned ${moveId}!`))
        updatedPokemon = {
          ...updatedPokemon,
          moves: newMoves,
        }
      }
      return syncActivePokemonIntoParty({
        ...state,
        playerPokemon: updatedPokemon,
        battleLog: battleLog.slice(-50),
        levelUpNotification: action.payload.newLevel
          ? `Level ${action.payload.newLevel}!`
          : null,
      })
    }
    // Hidden debug cheat (Konami code): jump the active Pokemon straight to
    // level 100 with recalculated stats, a full heal and its level-100 moves.
    case 'DEBUG_MAX_LEVEL': {
      const pokemon = state.playerPokemon,
        species = pokemon ? pokemonSpecies[pokemon.speciesKey] : null
      if (!pokemon || !species) return state
      const maxLevel = 100,
        stats = calculatePokemonStats(species, maxLevel, pokemon.ivs, pokemon.nature),
        maxedMoves = resolvePokemonMoves(pokemon.speciesKey, maxLevel),
        maxedPokemon = {
          ...pokemon,
          level: maxLevel,
          totalExp: calculateRequiredExperience(maxLevel, species.growthRate),
          currentHp: stats.hp,
          maxHp: stats.hp,
          attack: stats.attack,
          defense: stats.defense,
          spAttack: stats.spAttack,
          spDefense: stats.spDefense,
          speed: stats.speed,
          moves: maxedMoves.length > 0 ? maxedMoves : pokemon.moves,
        }
      return syncActivePokemonIntoParty({
        ...state,
        playerPokemon: maxedPokemon,
        levelUpNotification: `Level ${maxLevel}!`,
        battleLog: [
          ...state.battleLog,
          `${maxedPokemon.name} was maxed to level ${maxLevel}!`,
        ].slice(-50),
      })
    }
    case 'HEAL':
      return state.playerPokemon
        ? syncActivePokemonIntoParty({
            ...state,
            playerPokemon: {
              ...state.playerPokemon,
              currentHp: state.playerPokemon.maxHp,
            },
            battleLog: [
              ...state.battleLog,
              `${state.playerPokemon.name} was healed to full HP!`,
            ].slice(-50),
          })
        : state
    case 'SET_SPEED':
      return {
        ...state,
        speed: action.payload.speed,
      }
    case 'TOGGLE_PAUSE':
      return {
        ...state,
        paused: !state.paused,
      }
    case 'CLEAR_LEVEL_UP':
      return {
        ...state,
        levelUpNotification: null,
      }
    case 'PUSH_NOTIFICATION':
      return withNotification(state, action.payload)
    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload.id
        ),
      }
    case 'CLEAR_HATCH_RESULT':
      return {
        ...state,
        hatchResult: null,
      }
    case 'RELEASE_DUPLICATES': {
      /** A favourite or shiny is never auto-released. */
      const protectedMember = /** @param {any} member */ (member) =>
          member.favourite || member.isShiny,
        /** @type {Map<string, any[]>} */
        bySpecies = new Map()
      for (const member of state.box) {
        const list = bySpecies.get(member.speciesKey) ?? []
        list.push(member)
        bySpecies.set(member.speciesKey, list)
      }
      /** @type {any[]} */
      const toRelease = []
      for (const members of bySpecies.values()) {
        const candidates = members.filter((member) => !protectedMember(member))
        if (candidates.length === 0) continue
        if (members.some((member) => protectedMember(member))) {
          // A protected copy already exists, so every plain duplicate goes.
          toRelease.push(...candidates)
        } else {
          // Otherwise keep the best (highest IV total, then level).
          const sorted = [...candidates].sort(
            (left, right) =>
              judgeIVs(right.ivs).total - judgeIVs(left.ivs).total || right.level - left.level
          )
          toRelease.push(...sorted.slice(1))
        }
      }
      if (toRelease.length === 0) return state
      const releaseIds = new Set(toRelease.map((member) => member.id))
      let money = state.money
      const inventory = { ...state.inventory },
        rewardItems = /** @type {Record<string, number>} */ ({})
      for (const member of toRelease) {
        const reward = releaseReward(member)
        money += reward.money
        for (const [itemId, quantity] of Object.entries(reward.items)) {
          inventory[itemId] = (inventory[itemId] ?? 0) + quantity
          rewardItems[itemId] = (rewardItems[itemId] ?? 0) + quantity
        }
      }
      const rewardText = formatReward({ money: money - state.money, items: rewardItems })
      return withNotification(
        {
          ...state,
          box: state.box.filter((member) => !releaseIds.has(member.id)),
          money,
          inventory,
          battleLog: [
            ...state.battleLog,
            `Released ${toRelease.length} duplicate Pokemon and received ${rewardText}.`,
          ].slice(-50),
        },
        {
          message: `Released ${toRelease.length} duplicate${toRelease.length === 1 ? '' : 's'}: +${rewardText}`,
          tone: 'info',
          icon: '🎁',
          dedupeKey: `duplicates:${Date.now()}`,
        }
      )
    }
    case 'RELEASE_HATCHLING': {
      const { pokemonId } = action.payload,
        inParty = state.party.some((member) => member.id === pokemonId),
        hatchling =
          state.hatchResult?.id === pokemonId
            ? state.hatchResult
            : state.party.find((member) => member.id === pokemonId) ??
              state.box.find((member) => member.id === pokemonId),
        reward = hatchling ? releaseReward(hatchling) : { money: 0, items: {} },
        inventory = { ...state.inventory }
      for (const [itemId, quantity] of Object.entries(reward.items))
        inventory[itemId] = (inventory[itemId] ?? 0) + quantity
      const newParty = inParty
          ? state.party.filter((member) => member.id !== pokemonId)
          : state.party,
        activeId = state.playerPokemon?.id,
        activeIndex = activeId ? newParty.findIndex((member) => member.id === activeId) : 0
      const releasedState = loadActivePokemonFromParty({
        ...state,
        party: newParty,
        box: state.box.filter((member) => member.id !== pokemonId),
        hatchResult: state.hatchResult?.id === pokemonId ? null : state.hatchResult,
        money: state.money + reward.money,
        inventory,
        activePlayerPokemonIndex: Math.max(0, activeIndex),
        battleLog: [...state.battleLog, 'The newly hatched Pokemon was released.'].slice(-50),
      })
      return hatchling
        ? withNotification(releasedState, {
            message: `Released the hatchling: +${formatReward(reward)}`,
            tone: 'info',
            icon: '🎁',
            dedupeKey: `release:${pokemonId}`,
            cooldown: 5000,
          })
        : releasedState
    }
    case 'PHASE_IDLE': {
      const nextState = prepareNextBattle(state)
      return state.inRaid
        ? {
            ...nextState,
            raidLevel: Math.min(state.raidLevel + 1, RAID_LEVEL_MAX),
          }
        : nextState
    }
    case 'ADD_LOG':
      return {
        ...state,
        battleLog: [...state.battleLog, action.payload.message].slice(-50),
      }
    case 'SET_MOVES': {
      const { pokemonId, moves } = action.payload
      if (
        !Array.isArray(moves) ||
        moves.length < 1 ||
        moves.length > 4 ||
        new Set(moves).size !== moves.length
      )
        return state
      // `pokemonId` targets a specific party/box member (the panel can be open
      // while the active Pokemon changes). Fall back to the active one for any
      // legacy callers that don't pass an id.
      const targetId = pokemonId ?? state.playerPokemon?.id
      if (!targetId) return state
      const updateMoves = /** @param {Pokemon} member */ (member) =>
        member.id === targetId ? { ...member, moves } : member,
        target =
          state.party.find((member) => member.id === targetId) ??
          state.box.find((member) => member.id === targetId)
      if (!target) return state
      // Move Tutor TM moves cost money when they're newly taught.
      const knownMoves = new Set(target.moves ?? []),
        tutorMoves = moves.filter(
          (moveId) => !knownMoves.has(moveId) && isTutorMove(target.speciesKey, moveId)
        ),
        tutorCost = tutorMoves.length * tutorMoveCost
      if (tutorCost > state.money) return state
      const playerPokemon =
        state.playerPokemon && state.playerPokemon.id === targetId
          ? { ...state.playerPokemon, moves }
          : state.playerPokemon
      return {
        ...state,
        money: state.money - tutorCost,
        battleLog: tutorCost
          ? [
              ...state.battleLog,
              `Taught ${tutorMoves.length} move${tutorMoves.length > 1 ? 's' : ''} for $${tutorCost.toLocaleString()}.`,
            ].slice(-50)
          : state.battleLog,
        party: state.party.map(updateMoves),
        box: state.box.map(updateMoves),
        playerPokemon,
      }
    }
    case 'TOGGLE_FAVOURITE': {
      const { pokemonId } = action.payload,
        toggle = /** @param {any} member */ (member) =>
          member.id === pokemonId ? { ...member, favourite: !member.favourite } : member,
        player = state.playerPokemon
      if (
        !state.party.some((member) => member.id === pokemonId) &&
        !state.box.some((member) => member.id === pokemonId)
      )
        return state
      return {
        ...state,
        party: state.party.map(toggle),
        box: state.box.map(toggle),
        playerPokemon:
          player && player.id === pokemonId
            ? { ...player, favourite: !player.favourite }
            : player,
      }
    }
    case 'SET_NICKNAME': {
      const { pokemonId, nickname } = action.payload,
        cleaned = typeof nickname === 'string' ? nickname.trim().slice(0, 12) : '',
        rename = /** @param {any} member */ (member) =>
          member.id === pokemonId ? { ...member, nickname: cleaned || void 0 } : member
      if (
        !state.party.some((member) => member.id === pokemonId) &&
        !state.box.some((member) => member.id === pokemonId)
      )
        return state
      const player = state.playerPokemon
      return {
        ...state,
        party: state.party.map(rename),
        box: state.box.map(rename),
        playerPokemon:
          player && player.id === pokemonId
            ? { ...player, nickname: cleaned || void 0 }
            : player,
      }
    }
    case 'CATCH_POKEMON': {
      const {
          speciesKey,
          level,
          pokeballUsed,
          isShiny,
          gender,
        } = action.payload,
        catchLevel = state.inRaid ? 60 : level,
        rolledPokemon = createPokemon(speciesKey, catchLevel, state.nextPokemonId, isShiny),
        newPokemon = gender ? { ...rolledPokemon, gender } : rolledPokemon,
        species = pokemonSpecies[speciesKey]
      let inventory = state.inventory
      if (pokeballUsed) {
        const ownedCount = inventory[pokeballUsed] ?? 0
        ownedCount > 0 &&
          (inventory = {
            ...inventory,
            [pokeballUsed]: ownedCount - 1,
          })
      }
      return state.party.length < 6
        ? {
            ...state,
            party: [...state.party, newPokemon],
            nextPokemonId: state.nextPokemonId + 1,
            inventory,
            quests: advanceQuests(state.quests, { kind: 'catch', speciesKey, isShiny }),
            battleLog: [
              ...state.battleLog,
              `Caught ${species.name}! Added to party.`,
            ].slice(-50),
          }
        : {
            ...state,
            box: insertIntoBox(state.box, newPokemon, state.boxSort),
            nextPokemonId: state.nextPokemonId + 1,
            inventory,
            quests: advanceQuests(state.quests, { kind: 'catch', speciesKey, isShiny }),
            battleLog: [...state.battleLog, `Caught ${species.name}! Sent to box.`].slice(
              -50
            ),
          }
    }
    case 'THROW_MASTER_BALL': {
      // Only a live wild encounter (raids included) can be hit, and only when
      // the battle has settled enough to throw. Trainer and boss teams are not
      // catch rewards, so they are excluded.
      if (
        state.phase !== 'battling' ||
        !state.enemyPokemon ||
        state.trainerBattle ||
        state.bossBattle ||
        (state.inventory.masterball ?? 0) <= 0
      )
        return state
      const targetName =
        pokemonSpecies[state.enemyPokemon.speciesKey]?.name ?? 'the wild Pokemon'
      return {
        ...state,
        phase: 'catching',
        // Drop any pending turn events: the catch ends the battle immediately,
        // so stale damage/animation events must not play over the scene.
        pendingEvents: [],
        battleEvents: [],
        inventory: {
          ...state.inventory,
          masterball: state.inventory.masterball - 1,
        },
        battleLog: [
          ...state.battleLog,
          `You threw a Master Ball at ${targetName}!`,
        ].slice(-50),
      }
    }
    case 'COMPLETE_MASTER_BALL': {
      if (state.phase !== 'catching' || !state.enemyPokemon) return state
      const enemy = state.enemyPokemon,
        speciesKey = enemy.speciesKey,
        speciesName = pokemonSpecies[speciesKey]?.name ?? speciesKey,
        isNewSpecies = !state.pokedexCaught.includes(speciesKey),
        caughtPokemon = createPokemon(
          speciesKey,
          state.inRaid ? 60 : enemy.level,
          state.nextPokemonId,
          enemy.isShiny
        )
      let caughtState = /** @type {GameState} */ ({
        ...state,
        nextPokemonId: state.nextPokemonId + 1,
        pokedexSeen: state.pokedexSeen.includes(speciesKey)
          ? state.pokedexSeen
          : [...state.pokedexSeen, speciesKey],
        pokedexCaught: state.pokedexCaught.includes(speciesKey)
          ? state.pokedexCaught
          : [...state.pokedexCaught, speciesKey],
        shinySeen:
          enemy.isShiny && !state.shinySeen.includes(speciesKey)
            ? [...state.shinySeen, speciesKey]
            : state.shinySeen,
        shinyCaught:
          enemy.isShiny && !state.shinyCaught.includes(speciesKey)
            ? [...state.shinyCaught, speciesKey]
            : state.shinyCaught,
        battleLog: [...state.battleLog, `Gotcha! ${speciesName} was caught!`].slice(-50),
      })
      caughtState =
        state.party.length < 6
          ? { ...caughtState, party: [...state.party, caughtPokemon] }
          : { ...caughtState, box: insertIntoBox(state.box, caughtPokemon, state.boxSort) }
      caughtState = prepareNextBattle(caughtState)
      if (state.inRaid)
        caughtState = {
          ...caughtState,
          raidLevel: Math.min(caughtState.raidLevel + 1, RAID_LEVEL_MAX),
        }
      caughtState = withNotification(caughtState, {
        message: isNewSpecies
          ? `${speciesName} was registered in the Pok\u00e9dex!`
          : `${speciesName} was caught again.`,
        tone: isNewSpecies ? 'success' : 'info',
        icon: isNewSpecies ? '\ud83d\udcd5' : '\ud83d\udd34',
        dedupeKey: isNewSpecies ? `caught:${speciesKey}` : `repeat:${speciesKey}`,
        ...(isNewSpecies ? {} : { cooldown: 15000 }),
      })
      if (enemy.isShiny)
        caughtState = withNotification(caughtState, {
          message: `Shiny ${speciesName} was caught!`,
          tone: 'shiny',
          icon: '\ud83c\udf1f',
          dedupeKey: `shinycaught:${speciesKey}`,
        })
      return caughtState
    }
    case 'TOGGLE_AUTO_CATCH':
      return {
        ...state,
        autoCatch: !state.autoCatch,
      }
    case 'REORDER_PARTY': {
      const { pokemonId, toIndex } = action.payload
      if (toIndex < 0 || toIndex >= state.party.length) return state
      const fromIndex = state.party.findIndex((member) => member.id === pokemonId)
      if (fromIndex < 0 || fromIndex === toIndex) return state
      const baseState = state.phase === 'battling' ? prepareNextBattle(state) : state,
        activeId = baseState.playerPokemon?.id,
        party = [...baseState.party],
        [moved] = party.splice(fromIndex, 1)
      party.splice(toIndex, 0, moved)
      const newActiveIndex = activeId ? party.findIndex((member) => member.id === activeId) : 0
      return loadActivePokemonFromParty({
        ...baseState,
        party,
        activePlayerPokemonIndex: Math.max(0, newActiveIndex),
      })
    }
    case 'SWAP_PARTY': {
      const { indexA, indexB } = action.payload
      if (indexA < 0 || indexA >= state.party.length || indexB < 0 || indexB >= state.party.length) return state
      const baseState = state.phase === 'battling' ? prepareNextBattle(state) : state,
        activeId = baseState.playerPokemon?.id,
        party = [...baseState.party]
      ;[party[indexA], party[indexB]] = [party[indexB], party[indexA]]
      const newActiveIndex = activeId ? party.findIndex((member) => member.id === activeId) : 0
      return loadActivePokemonFromParty({
        ...baseState,
        party,
        activePlayerPokemonIndex: Math.max(0, newActiveIndex),
      })
    }
    case 'PARTY_TO_BOX': {
      if (state.party.length <= 1) return state
      const { partyIndex } = action.payload
      if (partyIndex < 0 || partyIndex >= state.party.length) return state
      if (!state.party.some((member, index) => index !== partyIndex && !member.isEgg))
        return state
      const baseState = state.phase === 'battling' ? prepareNextBattle(state) : state,
        removed = baseState.party[partyIndex],
        newParty = baseState.party.filter((member, index) => index !== partyIndex),
        activeId = baseState.playerPokemon?.id,
        newActiveIndex = activeId ? newParty.findIndex((member) => member.id === activeId) : 0
      return loadActivePokemonFromParty({
        ...baseState,
        party: newParty,
        box: [...baseState.box, removed],
        activePlayerPokemonIndex: Math.max(0, newActiveIndex),
      })
    }
    case 'BOX_TO_PARTY': {
      if (state.party.length >= 6) return state
      const { boxIndex } = action.payload
      if (boxIndex < 0 || boxIndex >= state.box.length) return state
      const pokemon = state.box[boxIndex],
        newBox = state.box.filter((member, index) => index !== boxIndex)
      return {
        ...state,
        party: [...state.party, pokemon],
        box: newBox,
      }
    }
    case 'SWAP_PARTY_BOX': {
      const { partyIndex, boxIndex } = action.payload
      if (partyIndex < 0 || partyIndex >= state.party.length || boxIndex < 0 || boxIndex >= state.box.length) return state
      const baseState = state.phase === 'battling' ? prepareNextBattle(state) : state,
        party = [...baseState.party],
        box = [...baseState.box]
      ;[party[partyIndex], box[boxIndex]] = [box[boxIndex], party[partyIndex]]
      const activeId = baseState.playerPokemon?.id,
        newActiveIndex = activeId ? party.findIndex((member) => member.id === activeId) : 0
      return loadActivePokemonFromParty({
        ...baseState,
        party,
        box,
        activePlayerPokemonIndex: Math.max(0, newActiveIndex),
      })
    }
    case 'TRAVEL': {
      const { locationId } = action.payload
      if (!state.unlockedLocations.includes(locationId) || locationId === state.currentLocation) return state
      const location = mapData[locationId],
        routeKey = location.routeKey || state.currentRoute,
        unlocked = computeUnlockedLocations(state)
      return {
        ...prepareNextBattle(state),
        currentLocation: locationId,
        currentRoute: routeKey,
        unlockedLocations: unlocked,
        battleLog: [...state.battleLog, `Traveled to ${location.name}!`].slice(-50),
        inRaid: !1,
        raidLegendary: null,
        raidLevel: 0,
        preRaidLocation: null,
      }
    }
    case 'START_EVOLUTION': {
      const {
          pokemonId,
          fromSpeciesKey,
          toSpeciesKey,
          consumeItem,
        } = action.payload,
        fromSpecies = pokemonSpecies[fromSpeciesKey],
        evolvingPokemon = state.party.find((member) => member.id === pokemonId) || state.box.find((member) => member.id === pokemonId)
      let inventory = state.inventory
      if (consumeItem) {
        const ownedItemCount = state.inventory[consumeItem] ?? 0
        if (ownedItemCount <= 0) return state
        // Form-change items are reusable; every other evolution item is consumed.
        if (!evolutionItems[consumeItem]?.reusable)
          inventory = {
            ...state.inventory,
            [consumeItem]: ownedItemCount - 1,
          }
      }
      return {
        ...prepareNextBattle(state),
        phase: 'evolving',
        inventory,
        evolutionState: {
          pokemonId,
          fromSpeciesKey,
          toSpeciesKey,
          step: 'flash',
          isShiny: evolvingPokemon?.isShiny ?? !1,
        },
        battleLog: [...state.battleLog, `What? ${fromSpecies.name} is evolving!`].slice(-50),
      }
    }
    case 'EVOLUTION_STEP':
      return state.evolutionState
        ? {
            ...state,
            evolutionState: {
              ...state.evolutionState,
              step: action.payload.step,
            },
          }
        : state
    case 'COMPLETE_EVOLUTION': {
      if (!state.evolutionState)
        return {
          ...state,
          phase: 'idle',
          evolutionState: null,
        }
      const {
          pokemonId,
          fromSpeciesKey,
          toSpeciesKey,
        } = state.evolutionState,
        toSpecies = pokemonSpecies[toSpeciesKey],
        fromSpecies = pokemonSpecies[fromSpeciesKey],
        evolveMember = /** @param {Pokemon} member */ (member) => {
          if (member.id !== pokemonId) return member
          const newStats = calculatePokemonStats(toSpecies, member.level, member.ivs, member.nature),
            hpGain = newStats.hp - member.maxHp,
            newMoveIds = (moveLearnsets[toSpeciesKey] || [])
              .filter(([moveId]) => moveId <= member.level)
              .map(([, moveId]) => moveId)
              .filter((moveId) => !member.moves.includes(moveId))
          let moves = [...member.moves]
          for (const moveId of newMoveIds)
            moves.length >= 4 ? (moves = [...moves.slice(1), moveId]) : (moves = [...moves, moveId])
          return {
            ...member,
            speciesKey: toSpeciesKey,
            name: toSpecies.name,
            maxHp: newStats.hp,
            currentHp: Math.min(member.currentHp + Math.max(0, hpGain), newStats.hp),
            attack: newStats.attack,
            defense: newStats.defense,
            spAttack: newStats.spAttack,
            spDefense: newStats.spDefense,
            speed: newStats.speed,
            moves,
          }
        },
        party = state.party.map(evolveMember),
        box = state.box.map(evolveMember),
        playerPokemon = state.playerPokemon ? evolveMember(state.playerPokemon) : state.playerPokemon,
        pokedexSeen = state.pokedexSeen.includes(toSpeciesKey) ? state.pokedexSeen : [...state.pokedexSeen, toSpeciesKey],
        pokedexCaught = state.pokedexCaught.includes(toSpeciesKey)
          ? state.pokedexCaught
          : [...state.pokedexCaught, toSpeciesKey]
      return withNotification(
        {
          ...state,
          phase: 'idle',
          evolutionState: null,
          playerPokemon,
          party,
          box,
          pokedexSeen,
          pokedexCaught,
          battleLog: [
            ...state.battleLog,
            `Congratulations! ${fromSpecies.name} evolved into ${toSpecies.name}!`,
          ].slice(-50),
        },
        {
          message: `${fromSpecies.name} evolved into ${toSpecies.name}!`,
          tone: 'success',
          icon: '⭐',
          dedupeKey: `evolve:${pokemonId}:${toSpeciesKey}`,
        }
      )
    }
    case 'SET_CATCH_RULE': {
      const { routeKey, speciesKey, rule } = action.payload,
        routeSettings = state.catchSettings[routeKey] || {}
      return {
        ...state,
        catchSettings: {
          ...state.catchSettings,
          [routeKey]: {
            ...routeSettings,
            [speciesKey]: rule,
          },
        },
        globalCatchDefaults: {
          ...state.globalCatchDefaults,
          mode: rule.mode,
          levelThreshold: rule.levelThreshold,
          enabledBalls: rule.enabledBalls,
        },
      }
    }
    case 'TOGGLE_ROUTE_CATCH_ALL': {
      const { routeKey, enabled } = action.payload,
        routeEncounters = encounterData[routeKey]
      if (!routeEncounters) return state
      const settings = {
        ...(state.catchSettings[routeKey] || {}),
      }
      for (const encounter of routeEncounters.encounters) {
        const baseRule = settings[encounter.speciesKey] || state.globalCatchDefaults
        settings[encounter.speciesKey] = {
          ...baseRule,
          enabled,
        }
      }
      return {
        ...state,
        catchSettings: {
          ...state.catchSettings,
          [routeKey]: settings,
        },
      }
    }
    case 'START_TRAINER_BATTLE': {
      const {
          trainerId,
          trainerName,
          trainerClass,
          trainerTeam,
        } = action.payload,
        firstPokemon = trainerTeam[0]
      return {
        ...state,
        phase: 'battling',
        enemyPokemon: firstPokemon,
        battleEvents: [],
        pendingEvents: [
          {
            type: 'trainerAppear',
            message: `${trainerName} wants to battle!`,
          },
          {
            type: 'trainerSendOut',
            message: `${trainerName} sent out ${firstPokemon.name}!`,
          },
        ],
        currentEventIndex: 0,
        battleTurn: 0,
        weather: null,
        battleHazards: emptyBattleHazards(),
        terrain: null,
        activePlayerPokemonIndex: 0,
        trainerBattle: {
          trainerId,
          trainerName,
          trainerClass,
          trainerTeam,
          currentTrainerPokemonIndex: 0,
        },
        playerVolatile: createVolatileState(),
      }
    }
    case 'START_BOSS_BATTLE': {
      const {
          bossId,
          bossType,
          trainerName,
          trainerClass,
          trainerTeam,
          bossQueue,
          spriteKey,
          region,
        } = action.payload,
        firstPokemon = trainerTeam[0]
      return {
        ...state,
        phase: 'battling',
        enemyPokemon: firstPokemon,
        battleEvents: [],
        pendingEvents: [
          {
            type: 'trainerAppear',
            message: `${trainerName} wants to battle!`,
          },
          {
            type: 'trainerSendOut',
            message: `${trainerName} sent out ${firstPokemon.name}!`,
          },
        ],
        currentEventIndex: 0,
        battleTurn: 0,
        weather: null,
        battleHazards: emptyBattleHazards(),
        terrain: null,
        activePlayerPokemonIndex: 0,
        bossBattle: {
          bossId,
          bossType,
          trainerName,
          trainerClass,
          trainerTeam,
          currentTrainerPokemonIndex: 0,
          spriteKey,
          region,
        },
        bossQueue: bossQueue ?? [],
        playerVolatile: createVolatileState(),
      }
    }
    case 'SWITCH_PLAYER_POKEMON': {
      const { newPokemonIndex: newIndex } = action.payload,
        party = [...state.party],
        oldIndex = state.activePlayerPokemonIndex
      state.playerPokemon &&
        party[oldIndex] &&
        (party[oldIndex] = {
          ...party[oldIndex],
          currentHp: state.playerPokemon.currentHp,
        })
      const nextPokemon = party[newIndex]
      if (!nextPokemon) return state
      const entry = applyEntryHazards(state.battleHazards?.player, nextPokemon),
        switchedIn =
          entry.damage > 0 || entry.status || entry.speedStage
            ? {
                ...nextPokemon,
                // Hazards can't KO on switch-in in this implementation.
                currentHp: Math.max(1, nextPokemon.currentHp - entry.damage),
                ...(entry.status ? { status: entry.status } : {}),
                ...(entry.speedStage
                  ? { statStages: { ...(nextPokemon.statStages ?? {}), speed: entry.speedStage } }
                  : {}),
              }
            : nextPokemon
      party[newIndex] = switchedIn
      return nextPokemon
        ? {
            ...state,
            phase: 'battling',
            playerPokemon: switchedIn,
            battleEvents: [],
            party,
            activePlayerPokemonIndex: newIndex,
            pendingEvents: [
              ...state.pendingEvents,
              {
                type: 'playerSwitch',
                message: `Go! ${nextPokemon.name}!`,
              },
              ...(entry.damage > 0
                ? [
                    {
                      type: 'hazard',
                      message: `${nextPokemon.name} was hurt by the entry hazards!`,
                    },
                  ]
                : []),
            ],
            playerVolatile: createVolatileState(),
          }
        : state
    }
    case 'TRAINER_SEND_NEXT_POKEMON': {
      const { newPokemonIndex: newIndex } = action.payload,
        battle = state.bossBattle ?? state.trainerBattle
      if (!battle) return state
      const nextPokemon = battle.trainerTeam[newIndex]
      if (!nextPokemon) return state
      const team = [...battle.trainerTeam],
        oldIndex = battle.currentTrainerPokemonIndex
      state.enemyPokemon &&
        (team[oldIndex] = {
          ...team[oldIndex],
          currentHp: state.enemyPokemon.currentHp,
        })
      const updatedBattle = {
        ...battle,
        trainerTeam: team,
        currentTrainerPokemonIndex: newIndex,
      }
      const enemyEntry = applyEntryHazards(state.battleHazards?.enemy, nextPokemon),
        switchedInEnemy =
          enemyEntry.damage > 0 || enemyEntry.status || enemyEntry.speedStage
            ? {
                ...nextPokemon,
                // Hazards can't KO on switch-in in this implementation.
                currentHp: Math.max(1, nextPokemon.currentHp - enemyEntry.damage),
                ...(enemyEntry.status ? { status: enemyEntry.status } : {}),
                ...(enemyEntry.speedStage
                  ? { statStages: { ...(nextPokemon.statStages ?? {}), speed: enemyEntry.speedStage } }
                  : {}),
              }
            : nextPokemon
      return {
        ...state,
        phase: 'battling',
        enemyPokemon: switchedInEnemy,
        battleEvents: [],
        trainerBattle: state.trainerBattle ? updatedBattle : null,
        bossBattle: state.bossBattle ? updatedBattle : null,
        pendingEvents: [
          ...state.pendingEvents,
          {
            type: 'trainerAppear',
            message: `${battle.trainerName} is about to send out ${nextPokemon.name}!`,
          },
          ...(enemyEntry.damage > 0
            ? [
                {
                  type: 'hazard',
                  message: `${nextPokemon.name} was hurt by the entry hazards!`,
                },
              ]
            : []),
          {
            type: 'trainerSendOut',
            message: `${battle.trainerName} sent out ${nextPokemon.name}!`,
          },
        ],
      }
    }
    case 'TRAINER_BATTLE_END': {
      const { won, moneyDelta } = action.payload,
        newMoney = Math.max(0, state.money + moneyDelta),
        eventType = won ? 'moneyGain' : 'moneyLoss',
        message = won ? `Got $${moneyDelta} for winning!` : `Lost $${Math.abs(moneyDelta)}...`,
        trainerBattlesWon = won ? state.trainerBattlesWon + 1 : state.trainerBattlesWon,
        locationWins = state.battlesWonByLocation[state.currentLocation] ?? 0,
        battlesWonByLocation = won
          ? {
              ...state.battlesWonByLocation,
              [state.currentLocation]: locationWins + 1,
            }
          : state.battlesWonByLocation,
        activeEffects = won ? tickBattleCounters(state.activeEffects) : state.activeEffects,
        nextState = {
          ...prepareNextBattle(state),
          money: newMoney,
          trainerBattlesWon,
          battlesWonByLocation,
          activeEffects,
          pendingEvents: [
            {
              type: eventType,
              message,
            },
          ],
        }
      return {
        ...nextState,
        unlockedLocations: computeUnlockedLocations(nextState),
      }
    }
    case 'BOSS_BATTLE_END': {
      // Battle Tower floors are a puzzle, not an endless auto-climb: clearing
      // one returns to the panel so the next floor can be chosen deliberately,
      // and a loss keeps you on that floor instead of sending you back to
      // floor 1. It lives in Hoenn only, so its record is always credited
      // there.
      if (state.bossBattle?.bossType === 'tower') {
        const { won: towerWon, moneyDelta: towerMoneyDelta } = action.payload,
          regionId = BATTLE_TOWER_REGION,
          floor = state.towerFloor,
          best = state.towerBest[regionId] ?? 0,
          reward = Math.floor(floor / 10)
        return {
          ...prepareNextBattle(state),
          money: Math.max(0, state.money + towerMoneyDelta),
          trainerBattlesWon: towerWon ? state.trainerBattlesWon + 1 : state.trainerBattlesWon,
          victoryTokens: towerWon ? state.victoryTokens + reward : state.victoryTokens,
          towerFloor: towerWon ? floor + 1 : Math.max(1, floor),
          towerBest: {
            ...state.towerBest,
            [regionId]: Math.max(best, towerWon ? floor : floor - 1),
          },
          battleLog: [
            ...state.battleLog,
            towerWon
              ? `Tower floor ${floor} cleared!${
                  reward > 0
                    ? ` Earned ${reward} Victory Token${reward > 1 ? 's' : ''}.`
                    : ''
                }`
              : `Tower floor ${floor} failed \u2014 your team can try again.`,
          ].slice(-50),
        }
      }
      const { won, moneyDelta } = action.payload,
        newMoney = Math.max(0, state.money + moneyDelta),
        eventType = won ? 'moneyGain' : 'moneyLoss',
        message = won ? `Got $${moneyDelta} for winning!` : `Lost $${Math.abs(moneyDelta)}...`,
        trainerBattlesWon = won ? state.trainerBattlesWon + 1 : state.trainerBattlesWon,
        locationWins = state.battlesWonByLocation[state.currentLocation] ?? 0,
        battlesWonByLocation = won
          ? {
              ...state.battlesWonByLocation,
              [state.currentLocation]: locationWins + 1,
            }
          : state.battlesWonByLocation,
        activeEffects = won ? tickBattleCounters(state.activeEffects) : state.activeEffects
      let defeatedGyms = state.defeatedGyms,
        defeatedEliteFour = state.defeatedEliteFour,
        defeatedChampions = state.defeatedChampions,
        victoryTokens = state.victoryTokens,
        championJustDefeated = false
      const notifications = [],
        toastNotifications = []
      if (won && state.bossBattle) {
        const { bossType, bossId } = /** @type {{ bossType: string, bossId: string }} */ (
          state.bossBattle
        )
        bossType === 'gym' && !defeatedGyms.includes(bossId)
          ? ((defeatedGyms = [...defeatedGyms, bossId]),
            (victoryTokens += 1),
            notifications.push('Earned a Victory Token!'),
            toastNotifications.push({
              message: `${gymLeaderData.find((gym) => gym.id === bossId)?.badgeName ?? 'Badge'} earned!`,
              tone: 'success',
              icon: '🏅',
              dedupeKey: `gym:${bossId}`,
            }))
          : bossType === 'e4' && !defeatedEliteFour.includes(bossId)
            ? ((defeatedEliteFour = [...defeatedEliteFour, bossId]),
              toastNotifications.push({
                message: 'Elite Four member defeated!',
                tone: 'success',
                icon: '🏅',
                dedupeKey: `e4:${bossId}`,
              }))
            : bossType === 'champion' &&
              (() => {
                const championRegion = state.bossBattle.region ?? 'kanto'
                // A rematch replays the Champion for its teams, but only the
                // first win credits the region (and thus an Unlock Token).
                defeatedChampions.includes(championRegion) ||
                  ((defeatedChampions = [...defeatedChampions, championRegion]),
                  (championJustDefeated = true),
                  toastNotifications.push({
                    message: `${regions.find((region) => region.id === championRegion)?.name ?? championRegion} Champion defeated!`,
                    tone: 'shiny',
                    icon: '👑',
                    dedupeKey: `champion:${championRegion}`,
                  }))
                ;((victoryTokens += 1), notifications.push('Earned a Victory Token!'))
              })()
      }
      if (won && state.bossQueue.length > 0) {
        const [nextBoss, ...remainingQueue] = state.bossQueue,
          firstPokemon = nextBoss.trainerTeam[0],
          stateWithNextBoss = {
            ...syncActivePokemonIntoParty(state),
            money: newMoney,
            trainerBattlesWon,
            battlesWonByLocation,
            activeEffects,
            defeatedGyms,
            defeatedEliteFour,
            defeatedChampions,
            victoryTokens,
            phase: 'battling',
            enemyPokemon: firstPokemon,
            battleEvents: [],
            pendingEvents: [
              {
                type: eventType,
                message,
              },
              ...notifications.map((notification) => ({
                type: 'moneyGain',
                message: notification,
              })),
              {
                type: 'trainerAppear',
                message: `${nextBoss.trainerName} wants to battle!`,
              },
              {
                type: 'trainerSendOut',
                message: `${nextBoss.trainerName} sent out ${firstPokemon.name}!`,
              },
            ],
            currentEventIndex: 0,
            battleTurn: 0,
            weather: null,
            battleHazards: emptyBattleHazards(),
            terrain: null,
            bossBattle: {
              bossId: nextBoss.bossId,
              bossType: nextBoss.bossType,
              trainerName: nextBoss.trainerName,
              trainerClass: nextBoss.trainerClass,
              trainerTeam: nextBoss.trainerTeam,
              currentTrainerPokemonIndex: 0,
              spriteKey: nextBoss.spriteKey,
              region: nextBoss.region,
            },
            bossQueue: remainingQueue,
          }
        let result = /** @type {GameState} */ ({
          ...stateWithNextBoss,
          unlockedLocations: computeUnlockedLocations(stateWithNextBoss),
        })
        if (championJustDefeated) result = settleUnlockTokens(result)
        for (const toastNotification of toastNotifications)
          result = withNotification(result, toastNotification)
        return result
      }
      const finalState = {
        ...prepareNextBattle(state),
        money: newMoney,
        trainerBattlesWon,
        battlesWonByLocation,
        activeEffects,
        defeatedGyms,
        defeatedEliteFour,
        defeatedChampions,
        victoryTokens,
        pendingEvents: [
          {
            type: eventType,
            message,
          },
          ...notifications.map((notification) => ({
            type: 'moneyGain',
            message: notification,
          })),
        ],
      }
      let finalResult = /** @type {GameState} */ ({
        ...finalState,
        unlockedLocations: computeUnlockedLocations(finalState),
      })
      if (championJustDefeated) finalResult = settleUnlockTokens(finalResult)
      for (const toastNotification of toastNotifications)
        finalResult = withNotification(finalResult, toastNotification)
      return finalResult
    }
    case 'HEAL_PARTY': {
      const healedParty = state.party.map((member) => ({
          ...member,
          currentHp: member.maxHp,
        })),
        playerPokemon = healedParty[0] || state.playerPokemon
      return {
        ...state,
        party: healedParty,
        playerPokemon,
        battleLog: [...state.battleLog, 'Your Pokemon were healed!'].slice(-50),
      }
    }
    case 'BUY_ITEM': {
      const { itemId, quantity } = action.payload,
        ball = pokeBalls[itemId]
      if (ball && ball.buyPrice) {
        const cost = ball.buyPrice * quantity
        if (state.money < cost) return state
        const owned = state.inventory[itemId] ?? 0
        return {
          ...state,
          money: state.money - cost,
          inventory: {
            ...state.inventory,
            [itemId]: owned + quantity,
          },
          battleLog: [...state.battleLog, `Bought ${quantity}x ${ball.name}!`].slice(-50),
        }
      }
      if (isActiveEffectItem(itemId)) {
        const item = activeItems[itemId]
        if (!item.buyPrice) return state
        const cost = item.buyPrice * quantity
        if (state.money < cost) return state
        const owned = state.inventory[itemId] ?? 0
        return {
          ...state,
          money: state.money - cost,
          inventory: {
            ...state.inventory,
            [itemId]: owned + quantity,
          },
          battleLog: [...state.battleLog, `Bought ${quantity}x ${item.name}!`].slice(-50),
        }
      }
      const consumable = consumableItems[itemId]
      if (consumable && consumable.buyPrice) {
        const cost = consumable.buyPrice * quantity
        if (state.money < cost) return state
        const owned = state.inventory[itemId] ?? 0
        return {
          ...state,
          money: state.money - cost,
          inventory: {
            ...state.inventory,
            [itemId]: owned + quantity,
          },
          battleLog: [...state.battleLog, `Bought ${quantity}x ${consumable.name}!`].slice(-50),
        }
      }
      const heldItem = heldItems[itemId]
      if (heldItem && heldItem.buyPrice) {
        const cost = heldItem.buyPrice * quantity
        if (state.money < cost) return state
        const owned = state.inventory[itemId] ?? 0
        return {
          ...state,
          money: state.money - cost,
          inventory: {
            ...state.inventory,
            [itemId]: owned + quantity,
          },
          battleLog: [...state.battleLog, `Bought ${quantity}x ${heldItem.name}!`].slice(-50),
        }
      }
      return state
    }
    case 'SELL_ITEM': {
      const { itemId, quantity = 1 } = action.payload,
        item = consumableItems[itemId] ?? heldItems[itemId],
        owned = state.inventory[itemId] ?? 0
      if (!item || !item.sellPrice || owned <= 0) return state
      const sold = Math.min(quantity, owned),
        earned = item.sellPrice * sold
      return {
        ...state,
        money: state.money + earned,
        inventory: {
          ...state.inventory,
          [itemId]: owned - sold,
        },
        battleLog: [
          ...state.battleLog,
          `Sold ${sold}x ${item.name} for $${earned.toLocaleString()}!`,
        ].slice(-50),
      }
    }
    case 'CLEAR_HELD_ITEM': {
      const { pokemonId } = action.payload,
        memberIndex = state.party.findIndex(/** @param {Pokemon} member */ (member) => member.id === pokemonId)
      if (memberIndex < 0) return state
      const member = state.party[memberIndex]
      if (!member.heldItem) return state
      const party = [...state.party]
      party[memberIndex] = { ...member, heldItem: null }
      return {
        ...state,
        party,
        inventory: {
          ...state.inventory,
          [member.heldItem]: (state.inventory[member.heldItem] ?? 0) + 1,
        },
        battleLog: [
          ...state.battleLog,
          `${member.name} put away its ${heldItems[member.heldItem]?.name ?? member.heldItem}.`,
        ].slice(-50),
      }
    }
    case 'USE_ITEM_ON_POKEMON': {
      const { itemId, pokemonId } = action.payload,
        item = consumableItems[itemId],
        heldItem = heldItems[itemId],
        owned = state.inventory[itemId] ?? 0,
        memberIndex = state.party.findIndex(/** @param {Pokemon} member */ (member) => member.id === pokemonId)
      if ((!item && !heldItem) || owned <= 0 || item?.category === 'valuables' || memberIndex < 0)
        return state
      // Held items are equipped (returning whatever was held); consumables are used.
      if (heldItem) {
        const member = state.party[memberIndex],
          previous = member.heldItem,
          party = [...state.party]
        party[memberIndex] = { ...member, heldItem: itemId }
        return {
          ...state,
          party,
          inventory: {
            ...state.inventory,
            [itemId]: owned - 1,
            ...(previous ? { [previous]: (state.inventory[previous] ?? 0) + 1 } : {}),
          },
          battleLog: [...state.battleLog, `${member.name} is now holding ${heldItem.name}!`].slice(-50),
        }
      }
      let member = { ...state.party[memberIndex] }
      const log = []
      if (item.natureMint) {
        // Re-roll to a different nature so the mint always does something, then
        // recompute the nature-affected stats (HP is never modified).
        const previousNature = member.nature
        let nextNature = randomNature()
        while (nextNature === previousNature) nextNature = randomNature()
        const newStats = calculatePokemonStats(
          pokemonSpecies[member.speciesKey],
          member.level,
          member.ivs,
          nextNature
        )
        member = {
          ...member,
          nature: nextNature,
          attack: newStats.attack,
          defense: newStats.defense,
          spAttack: newStats.spAttack,
          spDefense: newStats.spDefense,
          speed: newStats.speed,
        }
        log.push(`${member.name}'s nature became ${natureName(nextNature)}!`)
      } else if (item.category === 'medicine') {
        if (item.revive) {
          if (member.currentHp > 0) return state
          member.currentHp = item.full ? member.maxHp : Math.floor(member.maxHp / 2)
          log.push(`${item.name} revived ${member.name}!`)
        } else {
          if (member.currentHp <= 0 || member.currentHp >= member.maxHp) return state
          const healedHp = item.full
            ? member.maxHp
            : Math.min(member.maxHp, member.currentHp + (item.heal ?? 0))
          log.push(
            `${item.name} restored ${healedHp - member.currentHp} HP to ${member.name}!`
          )
          member.currentHp = healedHp
        }
      } else if (item.category === 'candy') {
        if (member.level >= 100) return state
        const species = pokemonSpecies[member.speciesKey],
          newTotalExp = item.levelUp
            ? calculateRequiredExperience(
                Math.min(100, member.level + item.levelUp),
                species.growthRate
              )
            : member.totalExp + (item.exp ?? 0),
          levelUps = getLevelUpResults(
            member.speciesKey,
            species.growthRate,
            member.level,
            newTotalExp
          )
        member.totalExp = newTotalExp
        if (levelUps.length > 0) {
          const lastLevelUp = levelUps[levelUps.length - 1],
            newStats = calculatePokemonStats(species, lastLevelUp.newLevel, member.ivs, member.nature),
            hpGain = newStats.hp - member.maxHp
          member = {
            ...member,
            level: lastLevelUp.newLevel,
            maxHp: newStats.hp,
            currentHp: Math.min(member.currentHp + Math.max(0, hpGain), newStats.hp),
            attack: newStats.attack,
            defense: newStats.defense,
            spAttack: newStats.spAttack,
            spDefense: newStats.spDefense,
            speed: newStats.speed,
          }
          let moves = [...member.moves]
          for (const moveId of levelUps.flatMap((levelUp) => levelUp.newMoves))
            moves.includes(moveId) ||
              (moves = moves.length >= 4 ? [...moves.slice(1), moveId] : [...moves, moveId])
          member.moves = moves
          log.push(`${member.name} grew to level ${member.level}!`)
        } else log.push(`${member.name} gained ${item.exp ?? 0} EXP!`)
      }
      const party = [...state.party]
      party[memberIndex] = member
      return {
        ...state,
        party,
        playerPokemon:
          state.activePlayerPokemonIndex === memberIndex ? member : state.playerPokemon,
        inventory: {
          ...state.inventory,
          [itemId]: owned - 1,
        },
        battleLog: [...state.battleLog, ...log].slice(-50),
      }
    }
    case 'USE_POKEBALL': {
      const { pokeballId } = action.payload,
        owned = state.inventory[pokeballId] ?? 0
      return owned <= 0
        ? state
        : {
            ...state,
            inventory: {
              ...state.inventory,
              [pokeballId]: owned - 1,
            },
          }
    }
    case 'MARK_SEEN': {
      const { speciesKey } = action.payload
      return state.pokedexSeen.includes(speciesKey)
        ? state
        : withNotification(
            {
              ...state,
              pokedexSeen: [...state.pokedexSeen, speciesKey],
            },
            {
              message: `You found a wild ${pokemonSpecies[speciesKey]?.name ?? speciesKey}!`,
              tone: 'info',
              icon: '👀',
              dedupeKey: `seen:${speciesKey}`,
            }
          )
    }
    case 'MARK_CAUGHT': {
      const { speciesKey } = action.payload,
        isNewSpecies = !state.pokedexCaught.includes(speciesKey),
        speciesName = pokemonSpecies[speciesKey]?.name ?? speciesKey,
        pokedexSeen = state.pokedexSeen.includes(speciesKey)
          ? state.pokedexSeen
          : [...state.pokedexSeen, speciesKey],
        pokedexCaught = isNewSpecies ? [...state.pokedexCaught, speciesKey] : state.pokedexCaught,
        nextState =
          pokedexSeen === state.pokedexSeen && pokedexCaught === state.pokedexCaught
            ? state
            : {
                ...state,
                pokedexSeen,
                pokedexCaught,
              }
      return withNotification(
        nextState,
        isNewSpecies
          ? {
              message: `${speciesName} was registered in the Pokédex!`,
              tone: 'success',
              icon: '📕',
              dedupeKey: `caught:${speciesKey}`,
            }
          : {
              message: `${speciesName} was caught again.`,
              tone: 'info',
              icon: '🔴',
              dedupeKey: `repeat:${speciesKey}`,
              cooldown: 15000,
            }
      )
    }
    case 'MARK_SHINY_CAUGHT': {
      const { speciesKey } = action.payload
      return state.shinyCaught.includes(speciesKey)
        ? state
        : withNotification(
            {
              ...state,
              shinyCaught: [...state.shinyCaught, speciesKey],
            },
            {
              message: `Shiny ${pokemonSpecies[speciesKey]?.name ?? speciesKey} was caught!`,
              tone: 'shiny',
              icon: '🌟',
              dedupeKey: `shinycaught:${speciesKey}`,
            }
          )
    }
    case 'CLAIM_DEX_REWARDS': {
      const generations = /** @type {number[]} */ (
          Array.isArray(action.payload?.generations) ? action.payload.generations : []
        ),
        newlyCompleted = generations.filter(
          (generationIndex) =>
            Number.isInteger(generationIndex) &&
            !state.rewardedGenerations.includes(generationIndex)
        )
      if (newlyCompleted.length === 0) return state
      let claimedState = /** @type {GameState} */ ({
        ...state,
        rewardedGenerations: [...state.rewardedGenerations, ...newlyCompleted],
        victoryTokens: state.victoryTokens + newlyCompleted.length * dexRewardVictoryTokens,
        inventory: {
          ...state.inventory,
          masterball: (state.inventory.masterball ?? 0) + newlyCompleted.length,
        },
        battleLog: [
          ...state.battleLog,
          ...newlyCompleted.map(
            (generationIndex) =>
              `Generation ${generationIndex + 1} dex complete! Earned ${dexRewardVictoryTokens} Victory Tokens and a Master Ball.`
          ),
        ].slice(-50),
      })
      for (const generationIndex of newlyCompleted)
        claimedState = withNotification(claimedState, {
          message: `Generation ${generationIndex + 1} dex complete! +${dexRewardVictoryTokens} Victory Tokens, +1 Master Ball`,
          tone: 'shiny',
          icon: '🏆',
          dedupeKey: `dexreward:${generationIndex}`,
        })
      return claimedState
    }
    case 'CLAIM_ACHIEVEMENT_REWARDS': {
      const requestedIds = Array.isArray(action.payload?.ids) ? action.payload.ids : [],
        rewarded = new Set(state.rewardedAchievements ?? []),
        newlyRewarded = requestedIds.filter((/** @type {string} */ id) => {
          const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === id)
          return achievement && !rewarded.has(id) && achievement.check(state)
        })
      if (newlyRewarded.length === 0) return state
      let money = state.money,
        victoryTokens = state.victoryTokens
      const inventory = { ...state.inventory }
      for (const id of newlyRewarded) {
        const reward = /** @type {any} */ (
          ACHIEVEMENTS.find((achievement) => achievement.id === id)
        ).reward
        money += reward.money ?? 0
        victoryTokens += reward.victoryTokens ?? 0
        for (const [itemId, quantity] of Object.entries(reward.items ?? {}))
          inventory[itemId] = (inventory[itemId] ?? 0) + quantity
      }
      let claimedState = {
        ...state,
        money,
        victoryTokens,
        inventory,
        rewardedAchievements: [...(state.rewardedAchievements ?? []), ...newlyRewarded],
      }
      for (const id of newlyRewarded) {
        const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === id)
        if (!achievement) continue
        claimedState = withNotification(claimedState, {
          message: `Achievement: ${achievement.name} (+${formatReward(achievement.reward)})`,
          tone: 'success',
          icon: '🏆',
          dedupeKey: `achievement:${id}`,
        })
      }
      return claimedState
    }
    case 'REFRESH_QUESTS': {
      const today = action.payload?.today ?? todayKey()
      if (state.quests?.date === today) return state
      return withNotification(
        { ...state, quests: rollQuests(state, today) },
        {
          message: 'New daily quests are available!',
          tone: 'info',
          icon: '📜',
          dedupeKey: `quests:${today}`,
        }
      )
    }
    case 'CLAIM_QUEST': {
      const { questId } = action.payload,
        quest = state.quests?.list?.find(
          /** @param {any} candidate */ (candidate) => candidate.id === questId
        )
      if (!quest || quest.claimed || quest.progress < quest.goal) return state
      const reward = quest.reward ?? {},
        inventory = { ...state.inventory }
      for (const [itemId, quantity] of Object.entries(reward.items ?? {}))
        inventory[itemId] = (inventory[itemId] ?? 0) + quantity
      return withNotification(
        {
          ...state,
          money: state.money + (reward.money ?? 0),
          victoryTokens: state.victoryTokens + (reward.victoryTokens ?? 0),
          inventory,
          quests: {
            ...state.quests,
            list: state.quests.list.map(
              /** @param {any} candidate */ (candidate) =>
                candidate.id === questId ? { ...candidate, claimed: true } : candidate
            ),
          },
          battleLog: [...state.battleLog, `Quest complete: ${questLabel(quest)}!`].slice(-50),
        },
        {
          message: `Quest reward: ${formatReward(reward)}`,
          tone: 'success',
          icon: '📜',
          dedupeKey: `quest:${questId}`,
        }
      )
    }
    case 'START_DEX_CELEBRATION': {
      if (state.phase === 'dexComplete') return state
      const generation = action.payload?.generation
      if (!Number.isInteger(generation)) return state
      return {
        ...state,
        phase: 'dexComplete',
        dexCelebration: { generation },
        pendingEvents: [],
        battleEvents: [],
      }
    }
    case 'COMPLETE_DEX_CELEBRATION':
      return state.phase !== 'dexComplete'
        ? state
        : { ...prepareNextBattle(state), dexCelebration: null }
    case 'CLEAR_OFFLINE_REPORT':
      return {
        ...state,
        offlineReport: null,
      }
    case 'REFRESH_DAILY_EVENT': {
      const today = action.payload?.today ?? todayKey()
      if (state.dailyEvent?.date === today) return state
      const dailyEvent = rollDailyEvent(today),
        event = dailyEventByKey[dailyEvent.kind]
      return withNotification(
        {
          ...state,
          dailyEvent,
        },
        {
          message: `${event.name}: ${event.description}`,
          tone: 'info',
          icon: event.icon,
          dedupeKey: `daily:${today}`,
        }
      )
    }
    case 'CLAIM_DAILY_GIFT': {
      const dailyEvent = state.dailyEvent,
        event = dailyEvent ? dailyEventByKey[dailyEvent.kind] : null
      if (!event || !dailyEvent || dailyEvent.claimed) return state
      const inventory = { ...state.inventory }
      for (const [itemId, quantity] of Object.entries(event.gift.items))
        inventory[itemId] = (inventory[itemId] ?? 0) + quantity
      const giftMoney = event.gift.money
      return withNotification(
        {
          ...state,
          money: state.money + giftMoney,
          inventory,
          dailyEvent: { ...dailyEvent, claimed: true },
          battleLog: [
            ...state.battleLog,
            `Claimed the ${event.name} gift: $${giftMoney.toLocaleString()} and items!`,
          ].slice(-50),
        },
        {
          message: `${event.name} gift claimed!`,
          tone: 'success',
          icon: '🎁',
          dedupeKey: `dailygift:${dailyEvent.date}`,
        }
      )
    }
    case 'UPDATE_SHINY_CHAIN': {
      const { speciesKey } = action.payload
      return {
        ...state,
        shinyChain:
          state.shinyChain.speciesKey === speciesKey
            ? { speciesKey, count: state.shinyChain.count + 1 }
            : { speciesKey, count: 1 },
      }
    }
    case 'MARK_SHINY_SEEN': {
      const { speciesKey } = action.payload
      return state.shinySeen.includes(speciesKey)
        ? state
        : withNotification(
            {
              ...state,
              shinySeen: [...state.shinySeen, speciesKey],
            },
            {
              message: `A shiny ${pokemonSpecies[speciesKey]?.name ?? speciesKey} appeared!`,
              tone: 'shiny',
              icon: '✨',
              dedupeKey: `shinyseen:${speciesKey}`,
            }
          )
    }
    case 'START_HEALING':
      return {
        ...prepareNextBattle(state),
        phase: 'healing',
        healingState: {
          step: 'place',
        },
        pendingBossBattle: action.payload?.pendingBossBattle ?? null,
      }
    case 'START_TOWER':
      // Only Hoenn runs a Battle Tower.
      if (mapData[state.currentLocation]?.region !== BATTLE_TOWER_REGION) return state
      return {
        ...state,
        towerFloor: action.payload?.floor ?? 1,
      }
    case 'HEALING_STEP':
      return state.phase !== 'healing' || !state.healingState
        ? state
        : {
            ...state,
            healingState: {
              ...state.healingState,
              step: action.payload.step,
            },
          }
    case 'COMPLETE_HEALING': {
      if (state.phase !== 'healing' || !state.healingState) return state
      const healedParty = state.party.map((member) => ({
          ...member,
          currentHp: member.maxHp,
        })),
        playerPokemon = healedParty[0] || state.playerPokemon
      if (state.pendingBossBattle) {
        const bossBattle = state.pendingBossBattle,
          firstPokemon = bossBattle.trainerTeam[0]
        return {
          ...state,
          party: healedParty,
          playerPokemon,
          activePlayerPokemonIndex: 0,
          healingState: null,
          pendingBossBattle: null,
          phase: 'battling',
          enemyPokemon: firstPokemon,
          battleEvents: [],
          pendingEvents: [
            {
              type: 'trainerAppear',
              message: `${bossBattle.trainerName} wants to battle!`,
            },
            {
              type: 'trainerSendOut',
              message: `${bossBattle.trainerName} sent out ${firstPokemon.name}!`,
            },
          ],
          currentEventIndex: 0,
          battleTurn: 0,
          weather: null,
          battleHazards: emptyBattleHazards(),
          terrain: null,
          bossBattle: {
            bossId: bossBattle.bossId,
            bossType: bossBattle.bossType,
            trainerName: bossBattle.trainerName,
            trainerClass: bossBattle.trainerClass,
            trainerTeam: bossBattle.trainerTeam,
            currentTrainerPokemonIndex: 0,
            spriteKey: bossBattle.spriteKey,
          },
          bossQueue: bossBattle.bossQueue ?? [],
          battleLog: [...state.battleLog, 'Your Pokemon were healed!'].slice(-50),
        }
      }
      if (state.inRaid || mapData[state.currentLocation]?.type === 'raid') {
        const raidRegionEntry = regions.find((region) => region.id === state.raidRegion)?.entry,
          returnLocation = state.preRaidLocation || raidRegionEntry || 'palletTown',
          routeKey = mapData[returnLocation]?.routeKey || 'route1',
          locationName = mapData[returnLocation]?.name || 'Pallet Town'
        return {
          ...state,
          phase: 'idle',
          party: healedParty,
          playerPokemon,
          activePlayerPokemonIndex: 0,
          healingState: null,
          pendingBossBattle: null,
          currentLocation: returnLocation,
          currentRoute: routeKey,
          inRaid: !1,
          raidLegendary: null,
          raidRegion: null,
          raidLevel: 0,
          preRaidLocation: null,
          battleLog: [
            ...state.battleLog,
            'Your Pokemon were healed!',
            `You returned to ${locationName}.`,
          ].slice(-50),
        }
      }
      return {
        ...state,
        phase: 'idle',
        party: healedParty,
        playerPokemon,
        activePlayerPokemonIndex: 0,
        healingState: null,
        pendingBossBattle: null,
        battleLog: [...state.battleLog, 'Your Pokemon were healed!'].slice(-50),
      }
    }
    case 'REORDER_BOX': {
      const { pokemonId, toIndex } = action.payload,
        fromIndex = state.box.findIndex((member) => member.id === pokemonId)
      if (fromIndex < 0 || fromIndex === toIndex) return state
      const clampedIndex = Math.max(0, Math.min(toIndex, state.box.length - 1)),
        box = [...state.box],
        [moved] = box.splice(fromIndex, 1)
      return (
        box.splice(clampedIndex, 0, moved),
        {
          ...state,
          box,
        }
      )
    }
    case 'SET_BOX_SORT': {
      const boxSort = action.payload?.boxSort ?? nextBoxSortMode(state.boxSort)
      return {
        ...state,
        boxSort,
        box: sortBoxMembers(state.box, boxSort),
      }
    }
    case 'RELEASE_POKEMON': {
      const { pokemonId, source } = action.payload
      if (source === 'box' && !state.box.some((member) => member.id === pokemonId)) return state
      if (source !== 'box' && (state.party.length <= 1 || !state.party.some((member) => member.id === pokemonId)))
        return state
      // Never leave the party with no Pokemon that can actually fight (e.g. all eggs).
      if (
        source !== 'box' &&
        !state.party.some((member) => member.id !== pokemonId && !member.isEgg)
      )
        return state
      const released =
        source === 'box'
          ? state.box.find((member) => member.id === pokemonId)
          : state.party.find((member) => member.id === pokemonId)
      if (!released || released.favourite) return state
      const reward = releaseReward(released),
        inventory = { ...state.inventory }
      for (const [itemId, quantity] of Object.entries(reward.items))
        inventory[itemId] = (inventory[itemId] ?? 0) + quantity
      const applyReward = /** @param {GameState} nextState */ (nextState) =>
        withNotification(
          {
            ...nextState,
            money: state.money + reward.money,
            inventory,
            battleLog: [
              ...state.battleLog,
              `Released ${released.name} and received ${formatReward(reward)}.`,
            ].slice(-50),
          },
          {
            message: `Released ${released.name}: +${formatReward(reward)}`,
            tone: 'info',
            icon: '🎁',
            dedupeKey: `release:${pokemonId}`,
            cooldown: 5000,
          }
        )
      if (source === 'box')
        return applyReward({
          ...state,
          box: state.box.filter((member) => member.id !== pokemonId),
        })
      const baseState = state.phase === 'battling' ? prepareNextBattle(state) : state,
        newParty = baseState.party.filter((member) => member.id !== pokemonId),
        activeId = baseState.playerPokemon?.id
      let newActiveIndex = activeId ? newParty.findIndex((member) => member.id === activeId) : 0
      newActiveIndex < 0 && (newActiveIndex = 0)
      return applyReward(
        loadActivePokemonFromParty({
          ...baseState,
          party: newParty,
          activePlayerPokemonIndex: newActiveIndex,
        })
      )
    }
    case 'WONDER_TRADE': {
      // Spend a Link Cable to swap a Pokemon for a random one of the same level.
      const { pokemonId } = action.payload,
        linkCables = state.inventory.linkCable ?? 0
      if (linkCables <= 0) return state
      const inBox = state.box.some((member) => member.id === pokemonId),
        inParty = state.party.some((member) => member.id === pokemonId)
      if (!inBox && !inParty) return state
      if (inParty && state.party.length <= 1) return state
      if (
        inParty &&
        !state.party.some((member) => member.id !== pokemonId && !member.isEgg)
      )
        return state
      const tradedPokemon = inBox
        ? state.box.find((member) => member.id === pokemonId)
        : state.party.find((member) => member.id === pokemonId)
      if (!tradedPokemon) return state
      if (tradedPokemon.favourite) return state
      const candidates = Object.keys(pokemonSpecies).filter((key) => pokemonSpecies[key].id > 0),
        receivedSpeciesKey = candidates[Math.floor(Math.random() * candidates.length)],
        // Undocumented perk: trading a shiny guarantees a shiny back.
        receivedIsShiny = tradedPokemon.isShiny || checkShinyOdds(wonderTradeShinyOdds),
        receivedPokemon = createPokemon(
          receivedSpeciesKey,
          tradedPokemon.level,
          state.nextPokemonId,
          receivedIsShiny
        )
      // Remove the traded Pokemon (mirroring RELEASE_POKEMON).
      let baseState
      if (inBox)
        baseState = {
          ...state,
          box: state.box.filter((member) => member.id !== pokemonId),
        }
      else {
        const releasedState = state.phase === 'battling' ? prepareNextBattle(state) : state,
          newParty = releasedState.party.filter((member) => member.id !== pokemonId),
          activeId = releasedState.playerPokemon?.id
        let newActiveIndex = activeId ? newParty.findIndex((member) => member.id === activeId) : 0
        if (newActiveIndex < 0) newActiveIndex = 0
        baseState = loadActivePokemonFromParty({
          ...releasedState,
          party: newParty,
          activePlayerPokemonIndex: newActiveIndex,
        })
      }
      return {
        ...baseState,
        box: [...baseState.box, receivedPokemon],
        nextPokemonId: state.nextPokemonId + 1,
        inventory: {
          ...state.inventory,
          linkCable: linkCables - 1,
        },
        pokedexSeen: state.pokedexSeen.includes(receivedSpeciesKey)
          ? state.pokedexSeen
          : [...state.pokedexSeen, receivedSpeciesKey],
        pokedexCaught: state.pokedexCaught.includes(receivedSpeciesKey)
          ? state.pokedexCaught
          : [...state.pokedexCaught, receivedSpeciesKey],
        shinySeen:
          receivedIsShiny && !state.shinySeen.includes(receivedSpeciesKey)
            ? [...state.shinySeen, receivedSpeciesKey]
            : state.shinySeen,
        shinyCaught:
          receivedIsShiny && !state.shinyCaught.includes(receivedSpeciesKey)
            ? [...state.shinyCaught, receivedSpeciesKey]
            : state.shinyCaught,
        battleLog: [
          ...state.battleLog,
          `Wonder Trade: ${tradedPokemon.name} was traded for ${receivedPokemon.name}${
            receivedIsShiny ? ' \u2726 shiny!' : ''
          }!`,
        ].slice(-50),
      }
    }
    case 'DEPOSIT_DAYCARE': {
      const { pokemonId } = action.payload
      if (state.daycare.parents.length >= 2) return state
      const deposited = state.box.find((member) => member.id === pokemonId)
      if (!deposited || state.daycare.parents.some((parent) => parent.id === pokemonId)) return state
      return {
        ...state,
        box: state.box.filter((member) => member.id !== pokemonId),
        daycare: {
          ...state.daycare,
          parents: [...state.daycare.parents, deposited],
        },
      }
    }
    case 'WITHDRAW_DAYCARE': {
      const { pokemonId } = action.payload,
        parent = state.daycare.parents.find((member) => member.id === pokemonId)
      if (!parent) return state
      return {
        ...state,
        box: insertIntoBox(state.box, parent, state.boxSort),
        daycare: {
          ...state.daycare,
          parents: state.daycare.parents.filter((member) => member.id !== pokemonId),
        },
      }
    }
    case 'HATCH_DAYCARE_EGG': {
      const { parents, progress } = state.daycare
      if (parents.length < 2 || progress < daycareEggBattles) return state
      if (!canBreed(parents)) return state
      const baseSpeciesKey = eggSpeciesKey(parents)
      if (!baseSpeciesKey) return state
      const shinyParent = parents.some((parent) => parent.isShiny),
        egg = createEgg(
          baseSpeciesKey,
          state.nextPokemonId,
          checkShinyOdds(shinyParent ? breedShinyParentOdds : breedShinyOdds),
          eggHatchSteps(baseSpeciesKey),
          inheritBreedingTraits(parents, baseSpeciesKey)
        ),
        toParty = state.party.length < 6
      return withNotification(
        {
          ...state,
          ...(toParty
            ? { party: [...state.party, egg] }
            : { box: insertIntoBox(state.box, egg, state.boxSort) }),
          nextPokemonId: state.nextPokemonId + 1,
          daycare: { ...state.daycare, progress: 0 },
          battleLog: [
            ...state.battleLog,
            toParty
              ? 'The Daycare found an Egg! It joined your party \u2014 battle to hatch it.'
              : 'The Daycare found an Egg! It was sent to your box.',
          ].slice(-50),
        },
        {
          message: toParty
            ? 'The Daycare found an Egg! Carry it in your party to hatch it.'
            : 'The Daycare found an Egg! It was sent to your box.',
          tone: 'success',
          icon: '\ud83e\udd5a',
          dedupeKey: `egg:${state.nextPokemonId}`,
        }
      )
    }
    case 'SET_ALWAYS_CATCH_SHINIES':
      return {
        ...state,
        alwaysCatchShinies: action.payload.value,
      }
    case 'RESET_ELITE_FOUR':
      return {
        ...state,
        defeatedEliteFour: [],
      }
    case 'PRESTIGE_REGION': {
      // Replay a finished region: re-lock its routes, clear its battle counts and
      // badges, and drop the player back at its first route. Party, box, items,
      // money and the Pokedex are untouched. Only the region's Champion defeat is
      // kept, so the next region doesn't lock and the region can be prestiged
      // again later.
      const regionId = action.payload.regionId,
        region = regions.find((candidate) => candidate.id === regionId),
        regionEliteFourIds = new Set(
          elite4Data
            .filter((member) => (member.region ?? 'kanto') === regionId)
            .map((member) => member.id)
        )
      if (!region || !state.defeatedChampions.includes(regionId)) return state
      // Prestige only once the region's Elite Four are currently beaten. They
      // reset on each prestige, so you have to clear them again before the next
      // one (the Champion stays defeated so the region is never re-locked).
      if (![...regionEliteFourIds].every((id) => state.defeatedEliteFour.includes(id)))
        return state
      const regionLocationIds = new Set(
          Object.values(mapData)
            .filter((location) => (location.region ?? 'kanto') === regionId)
            .map((location) => location.id)
        ),
        entryId = region.entry,
        firstRoute =
          entryId && mapData[entryId]
            ? mapData[entryId].connections.find(
                /** @param {string} id */ (id) => mapData[id]?.type === 'route'
              ) ?? null
            : null,
        // Keep the entry and first route unlocked; computeUnlockedLocations
        // rebuilds the rest from the region's (now cleared) gates.
        keepUnlocked = /** @param {string} id */ (id) =>
          !regionLocationIds.has(id) || id === entryId || id === firstRoute,
        regionGymIds = new Set(
          gymLeaderData
            .filter((gym) => (gym.region ?? 'kanto') === regionId)
            .map((gym) => gym.id)
        ),
        prestigeLevel = (state.regionPrestige[regionId] ?? 0) + 1,
        prestigedState = {
          ...state,
          unlockedLocations: state.unlockedLocations.filter(keepUnlocked),
          battlesWonByLocation: Object.fromEntries(
            Object.entries(state.battlesWonByLocation).filter(
              ([locationId]) => !regionLocationIds.has(locationId)
            )
          ),
          defeatedGyms: state.defeatedGyms.filter((id) => !regionGymIds.has(id)),
          defeatedEliteFour: state.defeatedEliteFour.filter((id) => !regionEliteFourIds.has(id)),
          regionPrestige: {
            ...state.regionPrestige,
            [regionId]: prestigeLevel,
          },
          victoryTokens: state.victoryTokens + prestigeTokenReward,
          currentLocation: firstRoute ?? entryId ?? state.currentLocation,
          currentRoute: firstRoute ?? state.currentRoute,
          phase: 'idle',
          battleEvents: [],
          pendingEvents: [],
          currentEventIndex: 0,
          battleTurn: 0,
          weather: null,
          battleHazards: emptyBattleHazards(),
          terrain: null,
          enemyPokemon: null,
          playerPokemon: state.party.find((member) => isBattleReady(member)) ?? state.party[0] ?? state.playerPokemon,
          activePlayerPokemonIndex: 0,
          trainerBattle: null,
          bossBattle: null,
          bossQueue: [],
          pendingBossBattle: null,
          healingState: null,
          evolutionState: null,
          inRaid: !1,
          raidLegendary: null,
          raidRegion: null,
          raidLevel: 0,
          preRaidLocation: null,
          raidCooldownEnd: null,
          battleLog: [
            ...state.battleLog,
            `${region.name} prestiged to level ${prestigeLevel}! Its map progress has been reset.`,
            `Earned ${prestigeTokenReward} Victory Tokens!`,
          ].slice(-50),
        }
      return {
        ...prestigedState,
        unlockedLocations: computeUnlockedLocations(prestigedState),
      }
    }
    case 'TOGGLE_AUTO_PROCEED':
      return {
        ...state,
        autoProceed: !state.autoProceed,
      }
    case 'TOGGLE_BROWSER_NOTIFICATIONS':
      return {
        ...state,
        browserNotifications: !state.browserNotifications,
      }
    case 'TOGGLE_REDUCED_MOTION':
      return {
        ...state,
        reducedMotion: !state.reducedMotion,
      }
    case 'TOGGLE_COLOURBLIND_TYPES':
      return {
        ...state,
        colourblindTypes: !state.colourblindTypes,
      }
    case 'TOGGLE_LARGE_TEXT':
      return {
        ...state,
        largeText: !state.largeText,
      }
    case 'TOGGLE_MUSIC':
      return {
        ...state,
        musicEnabled: !state.musicEnabled,
      }
    case 'TOGGLE_SFX':
      return {
        ...state,
        sfxEnabled: !state.sfxEnabled,
      }
    case 'TOGGLE_CHALLENGE_RANDOMIZER':
      return {
        ...state,
        challengeRandomizer: !state.challengeRandomizer,
      }
    case 'TOGGLE_CHALLENGE_LEVEL_SCALE':
      return {
        ...state,
        challengeLevelScale: !state.challengeLevelScale,
      }
    case 'TOGGLE_CHALLENGE_NUZLOCKE':
      return {
        ...state,
        challengeNuzlocke: !state.challengeNuzlocke,
      }
    case 'START_BUG_CONTEST': {
      if (state.phase !== 'idle' && state.phase !== 'victory') return state
      if (state.money < BUG_CONTEST_COST) return state
      return {
        ...state,
        ...createIdleBattleState(),
        phase: 'bugCatching',
        money: state.money - BUG_CONTEST_COST,
        battleLog: [...state.battleLog, 'You entered the Bug Catching Contest!'].slice(-50),
      }
    }
    case 'END_BUG_CONTEST':
      return state.phase === 'bugCatching' ? { ...state, ...createIdleBattleState() } : state
    case 'START_MINING': {
      if (state.phase !== 'idle' && state.phase !== 'victory') return state
      if (state.money < MINING_COST) return state
      return {
        ...state,
        ...createIdleBattleState(),
        phase: 'mining',
        money: state.money - MINING_COST,
        battleLog: [...state.battleLog, 'You headed down into the Underground.'].slice(-50),
      }
    }
    case 'START_GAME_CORNER': {
      if (state.phase !== 'idle' && state.phase !== 'victory') return state
      return {
        ...state,
        ...createIdleBattleState(),
        phase: 'gameCorner',
        battleLog: [...state.battleLog, 'You stepped up to the Game Corner slots.'].slice(-50),
      }
    }
    case 'END_MINIGAME':
      return state.phase === 'mining' || state.phase === 'gameCorner'
        ? { ...state, ...createIdleBattleState() }
        : state
    case 'PAY_MINIGAME_FEE': {
      const amount = action.payload?.amount ?? 0
      if (amount <= 0 || state.money < amount) return state
      return {
        ...state,
        money: state.money - amount,
      }
    }
    case 'CLAIM_MINIGAME_REWARD': {
      const { money = 0, items = [] } = action.payload ?? {},
        inventory = { ...state.inventory }
      for (const item of items)
        if (item?.itemId && item.quantity > 0)
          inventory[item.itemId] = (inventory[item.itemId] ?? 0) + item.quantity
      return {
        ...state,
        money: state.money + money,
        inventory,
        battleLog: [...state.battleLog, 'Minigame reward claimed.'].slice(-50),
      }
    }
    case 'COLLECT_MINING': {
      const rewards = Array.isArray(action.payload?.rewards) ? action.payload.rewards : []
      if (rewards.length === 0) return state
      const inventory = { ...state.inventory }
      for (const reward of rewards)
        if (reward?.itemId && reward.quantity > 0)
          inventory[reward.itemId] = (inventory[reward.itemId] ?? 0) + reward.quantity
      return {
        ...state,
        inventory,
        battleLog: [...state.battleLog, 'Collected the Underground finds.'].slice(-50),
      }
    }
    case 'BUY_REWARD_ITEM': {
      const { itemId, cost } = action.payload
      if (state.victoryTokens < cost) return state
      const owned = state.inventory[itemId] ?? 0
      return {
        ...state,
        victoryTokens: state.victoryTokens - cost,
        inventory: {
          ...state.inventory,
          [itemId]: owned + 1,
        },
      }
    }
    case 'START_RAID': {
      const healedParty = state.party.map((member) => ({
          ...member,
          currentHp: member.maxHp,
        })),
        playerPokemon = healedParty[0] || state.playerPokemon,
        raidLevel = action.payload.level ?? 60,
        raidLocation = action.payload.location ?? 'raidIsland'
      return withNotification(
        {
          ...prepareNextBattle(state),
          raidCooldownEnd: Date.now() + RAID_COOLDOWN_MS,
          raidLegendary: action.payload.legendary,
          raidRegion: action.payload.region ?? 'kanto',
          inRaid: !0,
          raidLevel,
          preRaidLocation: state.currentLocation,
          currentLocation: raidLocation,
          currentRoute: raidLocation,
          party: healedParty,
          playerPokemon,
          activePlayerPokemonIndex: 0,
          battleLog: [
            ...state.battleLog,
            `Arrived at ${mapData[raidLocation]?.name ?? 'Raid Island'}! A legendary Pokemon awaits...`,
          ].slice(-50),
        },
        {
          message: `Raid: ${pokemonSpecies[action.payload.legendary]?.name ?? 'a legendary Pokemon'} awaits!`,
          tone: 'warn',
          icon: '⚡',
          dedupeKey: `raid:${action.payload.legendary}`,
        }
      )
    }
    case 'END_RAID':
      return {
        ...state,
        inRaid: !1,
        raidLegendary: null,
        raidRegion: null,
        raidLevel: 0,
        preRaidLocation: null,
      }
    case 'UPDATE_VOLATILE': {
      const { player: playerVolatile, enemy: enemyVolatile } = action.payload
      let enemyPokemon = state.enemyPokemon
      return (
        enemyPokemon &&
          (enemyPokemon = {
            ...enemyPokemon,
            statStages: enemyVolatile.statStages,
            mustRecharge: enemyVolatile.mustRecharge,
            lockedMove: enemyVolatile.lockedMove,
            lockTurnsRemaining: enemyVolatile.lockTurnsRemaining,
            status: enemyVolatile.status,
            statusTurns: enemyVolatile.statusTurns,
            flinch: enemyVolatile.flinch,
            confusionTurns: enemyVolatile.confusionTurns ?? 0,
            leechSeeded: enemyVolatile.leechSeeded ?? !1,
            heldItemUsed: enemyVolatile.heldItemUsed ?? !1,
            tauntTurns: enemyVolatile.tauntTurns ?? 0,
            substituteHp: enemyVolatile.substituteHp ?? 0,
            infatuated: enemyVolatile.infatuated ?? !1,
            cursed: enemyVolatile.cursed ?? !1,
            screens: enemyVolatile.screens ?? { reflect: 0, lightScreen: 0 },
          }),
        {
          ...state,
          playerVolatile,
          enemyPokemon,
        }
      )
    }
    case 'USE_EFFECT_ITEM': {
      const { itemId, routeKey, speciesKey } = action.payload,
        owned = state.inventory[itemId] ?? 0
      if (owned <= 0) return state
      const item = activeItems[itemId]
      if (!item) return state
      const existingIndex = /** @type {ActiveEffect[]} */ (state.activeEffects).findIndex(
        (existingEffect) => existingEffect.type === itemId && existingEffect.routeKey === routeKey && existingEffect.speciesKey === speciesKey
      )
      let activeEffects
      if (existingIndex >= 0)
        ((activeEffects = [...state.activeEffects]),
          (activeEffects[existingIndex] = {
            ...activeEffects[existingIndex],
            battlesRemaining: activeEffects[existingIndex].battlesRemaining + item.duration,
          }))
      else {
        const newEffect = {
          type: itemId,
          battlesRemaining: item.duration,
          routeKey,
          speciesKey,
        }
        activeEffects = [...state.activeEffects, newEffect]
      }
      return {
        ...state,
        inventory: {
          ...state.inventory,
          [itemId]: owned - 1,
        },
        activeEffects,
        battleLog: [...state.battleLog, `Used ${item.name}!`].slice(-50),
      }
    }
    case 'APPLY_SHARED_EXP': {
      const { partyExp } = action.payload
      if (partyExp.length === 0) return state
      const party = [...state.party],
        battleLog = []
      for (const entry of partyExp) {
        if (entry.partyIndex < 0 || entry.partyIndex >= party.length) continue
        let member = {
          ...party[entry.partyIndex],
        }
        if (
          ((member.totalExp = member.totalExp + entry.expGained),
          battleLog.push(`${member.name} gained ${entry.expGained} EXP!`),
          entry.newLevel && entry.newStats)
        ) {
          const hpGain = (entry.newStats.maxHp ?? member.maxHp) - member.maxHp
          ;((member = {
            ...member,
            level: entry.newLevel,
            maxHp: entry.newStats.maxHp ?? member.maxHp,
            currentHp: Math.min(member.currentHp + hpGain, entry.newStats.maxHp ?? member.maxHp),
            attack: entry.newStats.attack ?? member.attack,
            defense: entry.newStats.defense ?? member.defense,
            spAttack: entry.newStats.spAttack ?? member.spAttack,
            spDefense: entry.newStats.spDefense ?? member.spDefense,
            speed: entry.newStats.speed ?? member.speed,
          }),
            battleLog.push(`${member.name} grew to level ${member.level}!`))
        }
        if (entry.newMoves && entry.newMoves.length > 0) {
          let moves = [...member.moves]
          for (const moveId of entry.newMoves)
            moves.includes(moveId) ||
              (moves.length >= 4 ? (moves = [...moves.slice(1), moveId]) : (moves = [...moves, moveId]))
          member = {
            ...member,
            moves,
          }
        }
        party[entry.partyIndex] = member
      }
      const activeIndex = state.activePlayerPokemonIndex,
        playerPokemon = party[activeIndex] || state.playerPokemon
      return {
        ...state,
        party,
        playerPokemon,
        battleLog: [...state.battleLog, ...battleLog].slice(-50),
      }
    }
    case 'LOAD_SAVE':
      return {
        ...state,
        ...action.payload.state,
      }
    default:
      return state
  }
}
