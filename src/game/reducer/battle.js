// Reducer handlers for battle actions. Split from game/reducer.js.

import { BATTLE_TOWER_REGION, RAID_COOLDOWN_MS, RAID_LEVEL_MAX, daycareEggBattles, expCandyDropChance, rareCandyDropChance, swarmSpawnChance, valuableDropChance, wildMasterBallChance } from '../../data/config.js'
import { dailyDropMultiplier } from '../../data/daily-events.js'
import { gymLeaderData, mapData, pokemonSpecies, regions } from '../../data/gameData.js'
import { activeItems, consumableItems } from '../../data/items.js'
import { canBreed } from '../breeding.js'
import { createVolatileState } from '../combat.js'
import { applyEntryHazards, emptyBattleHazards } from '../hazards.js'
import { calculatePokemonStats, calculateRequiredExperience, createPokemon, gainFriendship, insertIntoBox, isBattleReady, resolvePokemonMoves } from '../pokemon.js'
import { computeUnlockedLocations, prepareNextBattle, rollCandyDrop, rollValuableDrop, syncActivePokemonIntoParty, tickBattleCounters, tickPartyEggs, tickPokerus } from '../progression.js'
import { advanceQuests } from '../quests.js'
import { rollSwarm, settleUnlockTokens, withNotification } from '../reducer-helpers.js'

/**
 * Handle the `START_ENCOUNTER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startEncounter(state, action) {
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

/**
 * Handle the `EXECUTE_TURN` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function executeTurn(state, action) {
  return {
    ...state,
    battleTurn: (state.battleTurn ?? 0) + 1,
    pendingEvents: [...state.pendingEvents, ...action.payload.events],
  }
}

/**
 * Handle the `CONSUME_EVENT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function consumeEvent(state, action) {
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

/**
 * Handle the `APPLY_EXP` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function applyExp(state, action) {
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

/**
 * Handle the `APPLY_SHARED_EXP` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function applySharedExp(state, action) {
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

// Hidden debug cheat (Konami code): jump the active Pokemon straight to
// level 100 with recalculated stats, a full heal and its level-100 moves.
/**
 * Handle the `DEBUG_MAX_LEVEL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function debugMaxLevel(state, action) {
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

/**
 * Handle the `START_TRAINER_BATTLE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startTrainerBattle(state, action) {
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

/**
 * Handle the `START_BOSS_BATTLE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startBossBattle(state, action) {
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

/**
 * Handle the `SWITCH_PLAYER_POKEMON` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function switchPlayerPokemon(state, action) {
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

/**
 * Handle the `TRAINER_SEND_NEXT_POKEMON` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function trainerSendNextPokemon(state, action) {
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

/**
 * Handle the `TRAINER_BATTLE_END` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function trainerBattleEnd(state, action) {
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

/**
 * Handle the `BOSS_BATTLE_END` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function bossBattleEnd(state, action) {
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

/**
 * Handle the `UPDATE_VOLATILE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function updateVolatile(state, action) {
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

/**
 * Handle the `USE_EFFECT_ITEM` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function useEffectItem(state, action) {
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

/**
 * Handle the `USE_POKEBALL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function usePokeball(state, action) {
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

/**
 * Handle the `THROW_MASTER_BALL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function throwMasterBall(state, action) {
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

/**
 * Handle the `COMPLETE_MASTER_BALL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function completeMasterBall(state, action) {
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

/**
 * Handle the `START_RAID` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startRaid(state, action) {
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

/**
 * Handle the `END_RAID` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endRaid(state, action) {
  return {
    ...state,
    inRaid: !1,
    raidLegendary: null,
    raidRegion: null,
    raidLevel: 0,
    preRaidLocation: null,
  }
}

/**
 * Handle the `START_TOWER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startTower(state, action) {
  // Only Hoenn runs a Battle Tower.
  if (mapData[state.currentLocation]?.region !== BATTLE_TOWER_REGION) return state
  return {
    ...state,
    towerFloor: action.payload?.floor ?? 1,
  }
}
