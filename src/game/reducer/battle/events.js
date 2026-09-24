// // Core battle pipeline: start an encounter, run a turn, consume its events. Split from game/reducer/battle.js.

import { daycareEggBattles, expCandyDropChance, rareCandyDropChance, swarmSpawnChance, valuableDropChance, wildMasterBallChance } from '../../../data/config.js'
import { dailyDropMultiplier } from '../../../data/daily-events.js'
import { mapData } from '../../../data/gameData.js'
import { consumableItems } from '../../../data/items.js'
import { canBreed } from '../../breeding.js'
import { tickCompanion } from '../../companion.js'
import { createVolatileState } from '../../combat.js'
import { tickGarden } from '../../garden.js'
import { tickPelago } from '../../pelago.js'
import { emptyBattleHazards } from '../../hazards.js'
import { gainFriendship, isBattleReady } from '../../pokemon.js'
import { computeUnlockedLocations, rollCandyDrop, rollValuableDrop, syncActivePokemonIntoParty, tickBattleCounters, tickPartyEggs, tickPokerus } from '../../progression.js'
import { advanceQuests } from '../../quests.js'
import { rollSwarm, withNotification } from '../../reducer-helpers.js'

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
  // Ignore a turn that was queued while `battling` but applied after the battle
  // already ended (e.g. a manual catch committed first). Replaying it would
  // append another faint event and make the loop run the victory handler again.
  if (state.phase !== 'battling' || !state.enemyPokemon) return state
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
    companion = state.companion,
    garden = state.garden,
    pelago = state.pelago,
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
      if (swarm) {
        // The notice names the area but not the Pokemon, so the swarm is a
        // reason to go and look rather than a spoiler in the battle log.
        const swarmArea = mapData[swarm.routeKey]?.name ?? swarm.routeKey
        swarmNotice = `A swarm spawned in the ${swarmArea} area!`
        dropNotifications.push({
          message: swarmNotice,
          tone: 'info',
          icon: '\u{1f41d}',
          dedupeKey: `swarm:${swarm.routeKey}`,
        })
      }
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
    // A pinned companion's care fades, and garden berries ripen.
    companion = tickCompanion(companion)
    garden = tickGarden(garden)
    // Poké Pelago's passive islands tick down their cycles.
    pelago = tickPelago(pelago)
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
    // Out-of-battle abilities: Pickup and Honey Gather can find something.
    const partyAbilities = new Set(
      [state.playerPokemon, ...state.party].filter(Boolean).map((member) => member?.ability)
    )
    if (partyAbilities.has('pickup') && Math.random() < dropChance(0.1)) {
      const foundId = rollValuableDrop(dropLevel)
      inventory = {
        ...inventory,
        [foundId]: (inventory[foundId] ?? 0) + 1,
      }
      secretNotices.push(`Your Pickup found a ${consumableItems[foundId].name}!`)
    }
    if (partyAbilities.has('honeyGather') && Math.random() < dropChance(0.2)) {
      inventory = {
        ...inventory,
        honey: (inventory.honey ?? 0) + 1,
      }
      secretNotices.push('Your Honey Gather found a Honey!')
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
    companion,
    garden,
    pelago,
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
