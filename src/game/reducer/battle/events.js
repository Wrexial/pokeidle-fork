// // Core battle pipeline: start an encounter, run a turn, consume its events. Split from game/reducer/battle.js.

import { apricornDropChance, daycareEggBattles, expCandyDropChance, rareCandyDropChance, swarmSpawnChance, valuableDropChance, wildMasterBallChance, wildTmDropChance } from '../../../data/config.js'
import { dailyDropMultiplier } from '../../../data/daily-events.js'
import { mapData } from '../../../data/gameData.js'
import { APRICORN_IDS, consumableItems } from '../../../data/items.js'
import { getTmInfo, tmItemId } from '../../../data/tms.js'
import { canBreed } from '../../breeding.js'
import { advanceBreeding, breedingGoalLabel } from '../../breeding-projects.js'
import { abilityOf } from '../../abilities.js'
import { tickCompanion } from '../../companion.js'
import { createVolatileState } from '../../combat.js'
import { fieldWeatherFor } from '../../weather.js'
import { tickGarden } from '../../garden.js'
import { tickPelago } from '../../pelago.js'
import { advanceHuntEncounter } from '../../hunt.js'
import { applyResearchRibbon, creditResearchDefeat, creditResearchLarge, creditResearchMove, creditResearchSuperEffective, isLargeSpecimen } from '../../research.js'
import { emptyBattleHazards } from '../../hazards.js'
import { gainFriendship, isBattleReady, syncObtainedRibbons } from '../../pokemon.js'
import { prestigeMultipliers } from '../../prestige.js'
import { advanceShinyTarget, computeUnlockedLocations, rollCandyDrop, rollValuableDrop, syncActivePokemonIntoParty, tickBattleCounters, tickPartyEggs, tickPokerus } from '../../progression.js'
import { advanceQuests } from '../../quests.js'
import { rollSwarm, recordSeenPokemon, withNotification } from '../../reducer-helpers.js'
import { rollUnownedTm } from '../../tms.js'
import { resolveRevive, resolveSwitchRequest } from './switch.js'

/**
 * Handle the `START_ENCOUNTER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startEncounter(state, action) {
  const firstAliveIndex = state.party.findIndex((member) => isBattleReady(member)),
    activeIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0,
    activePokemon = state.party[activeIndex] || state.playerPokemon,
    enemy = action.payload.enemy,
    // A wild Illusion user hides as the player's last party member until it is
    // hit (the disguise is purely visual).
    disguise =
      enemy?.ability === 'illusion'
        ? [...(state.party ?? [])].reverse().find((member) => member && !member.isEgg)
        : null
  if (disguise) enemy.disguisedAs = { speciesKey: disguise.speciesKey, name: disguise.name }
  const shownName = disguise?.name ?? enemy?.name,
    // A focus hunt counts this sighting (and the activity hit quality that
    // produced it, when a route activity did).
    huntedHunt = advanceHuntEncounter(state.hunt, enemy?.speciesKey, action.payload?.activityQuality)
  return recordSeenPokemon(
    {
      ...state,
      ...(huntedHunt === state.hunt ? {} : { hunt: huntedHunt }),
      phase: 'battling',
      enemyPokemon: enemy,
      playerPokemon: activePokemon,
      activePlayerPokemonIndex: activeIndex,
      battleParticipants: activePokemon?.id ? [activePokemon.id] : [],
      playerTurnSpent: !1,
      enemyTurnSpent: !1,
      battleEvents: [],
      pendingEvents: [
        {
          type: 'encounter',
          message: enemy.isShiny
            ? `A shiny wild ${shownName} appeared!`
            : `Wild ${shownName} appeared!`,
        },
      ],
      currentEventIndex: 0,
      battleTurn: 0,
      weather: fieldWeatherFor(mapData[state.currentLocation]),
      battleHazards: emptyBattleHazards(),
      terrain: null,
      playerVolatile: createVolatileState(),
    },
    enemy
  )
}

/**
 * Handle the `FLEE` action: try to run from a wild battle. Run Away always
 * succeeds; otherwise the odds scale with the player's Speed against the foe's.
 * A failed attempt spends the turn, so the foe still attacks.
 * @param {GameState} state
 * @returns {GameState}
 */
export function fleeBattle(state) {
  if (state.phase !== 'battling' || state.trainerBattle || state.bossBattle) return state
  const player = state.playerPokemon,
    foe = state.enemyPokemon
  if (!player || !foe) return state
  const runAway = abilityOf(player) === 'runAway',
    speed = player.speed ?? 0,
    foeSpeed = Math.max(1, foe.speed ?? 1),
    success = runAway || Math.random() < Math.min(0.95, 0.25 + (speed / foeSpeed) * 0.5)
  if (success)
    return {
      ...state,
      phase: 'idle',
      enemyPokemon: null,
      pendingEvents: [
        ...state.pendingEvents,
        {
          type: 'flee',
          message: runAway
            ? `${player.name} fled with Run Away!`
            : 'Got away safely!',
        },
      ],
    }
  return {
    ...state,
    playerTurnSpent: !0,
    pendingEvents: [...state.pendingEvents, { type: 'status', message: "Couldn't get away!" }],
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
    playerTurnSpent: !1,
    enemyTurnSpent: !1,
    // The manual choice has been spent on this turn.
    pendingPlayerMove: null,
    pendingEvents: [...state.pendingEvents, ...action.payload.events],
  }
}

/**
 * Handle the `CHOOSE_PLAYER_MOVE` action: store the move the player picked for
 * the next manual turn. Ignored unless a manual battle is in progress and the
 * move is actually in the active Pokemon's moveset.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function choosePlayerMove(state, action) {
  const moveId = action.payload?.moveId
  if (
    state.phase !== 'battling' ||
    state.battleMode !== 'manual' ||
    !moveId ||
    !state.playerPokemon?.moves?.includes(moveId)
  )
    return state
  return {
    ...state,
    pendingPlayerMove: moveId,
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
  const [event, ...remainingEvents] = state.pendingEvents
  // Switch requests (pivoting / forced / emergency switches) and Revival
  // Blessing resolve as soon as their event is reached, with the turn's damage
  // already applied.
  if (event.type === 'switchRequest') return resolveSwitchRequest(state, event, remainingEvents)
  if (event.type === 'revive') return resolveRevive(state, event, remainingEvents)
  const battleLog = event.message
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
  ;(event.type === 'damage' || event.type === 'recoil' || event.type === 'heal' || event.type === 'faint') &&
    event.data &&
    // A faint always drops the battler to 0. A self-destruct (Explosion,
    // Memento, ...) sets the user's HP directly with no damage event to carry
    // it, so the faint event itself has to sync it back.
    (event.data.target === 'player' && playerPokemon
      ? (playerPokemon = {
          ...playerPokemon,
          currentHp:
            event.type === 'faint' ? 0 : (event.data.hpAfter ?? playerPokemon.currentHp),
        })
      : event.data.target === 'enemy' &&
        enemyPokemon &&
        (enemyPokemon = {
          ...enemyPokemon,
          currentHp:
            event.type === 'faint' ? 0 : (event.data.hpAfter ?? enemyPokemon.currentHp),
          // A damaging hit breaks a wild Illusion disguise.
          ...(event.type === 'damage' && enemyPokemon.disguisedAs
            ? { disguisedAs: null }
            : {}),
        }))
  let activeEffects = state.activeEffects,
    swarm = state.swarm,
    pokerus = state.pokerus,
    quests = state.quests,
    daycare = state.daycare,
    companion = state.companion,
    garden = state.garden,
    pelago = state.pelago,
    shinyChain = state.shinyChain,
    researchDefeated = state.researchDefeated,
    researchMoves = state.researchMoves,
    researchSuperEffective = state.researchSuperEffective,
    researchMoveIds = state.researchMoveIds,
    researchClaimed = state.researchClaimed,
    researchPoints = state.researchPoints,
    party = state.party,
    hatchedEgg = /** @type {Pokemon[]} */ ([]),
    inventory = state.inventory,
    secretNotices = [],
    dropNotifications = [],
    swarmNotice = null
  // Healing Wish / Lunar Dance heal the next Pokemon sent out: at the moment
  // the user faints, that is the first battle-ready party member that is not
  // the active one.
  if (event.type === 'healingWish' && event.data?.target === 'player') {
    const activeId = state.playerPokemon?.id
    let healedOne = false
    party = party.map((member) => {
      if (healedOne || member.id === activeId || member.isEgg || (member.currentHp ?? 0) <= 0)
        return member
      healedOne = true
      return { ...member, currentHp: member.maxHp, status: null, statusTurns: 0 }
    })
    if (healedOne) secretNotices.push('The healing wish restored the next Pokemon!')
  }
  // Mimic / Sketch copy the foe's last move into the active party member's
  // moveset, replacing Mimic / Sketch itself.
  if (event.type === 'learnMove' && event.data?.target === 'player' && event.data.moveId) {
    const replace = event.data.replace,
      learned = event.data.moveId,
      updatedMoves = (playerPokemon?.moves ?? []).map((id) => (id === replace ? learned : id))
    if (playerPokemon) playerPokemon = { ...playerPokemon, moves: updatedMoves }
    party = party.map((member, index) =>
      index === state.activePlayerPokemonIndex ? { ...member, moves: updatedMoves } : member
    )
  }
  // Field research: a move used by either battler records the move id for its
  // species' signature-move task, and the player's moves also climb the
  // non-wild move-count ladder.
  if (event.type === 'attack' && event.data?.moveId) {
    const userSpecies =
        event.data.target === 'enemy'
          ? state.playerPokemon?.speciesKey
          : state.enemyPokemon?.speciesKey,
      moveResearched = creditResearchMove(
        { ...state, researchMoves, researchMoveIds },
        userSpecies,
        event.data.moveId
      )
    researchMoves = moveResearched.researchMoves
    researchMoveIds = moveResearched.researchMoveIds
    researchClaimed = moveResearched.researchClaimed
    researchPoints = moveResearched.researchPoints
  }
  if (
    event.type === 'faint' &&
    event.data?.target === 'enemy' &&
    !state.trainerBattle &&
    !state.bossBattle
  ) {
    wildBattlesWon++
    // Field research: count the defeat and credit any newly-earned points.
    let researched = creditResearchDefeat(
      { ...state, researchDefeated },
      state.enemyPokemon?.speciesKey
    )
    // A super-effective KO credits both the defeated species and the attacker
    // that landed it (the wild and non-wild super-effective tasks).
    if ((event.data?.effectiveness ?? 0) > 1) {
      researched = creditResearchSuperEffective(researched, state.enemyPokemon?.speciesKey)
      researched = creditResearchSuperEffective(researched, state.playerPokemon?.speciesKey)
    }
    researchDefeated = researched.researchDefeated
    researchSuperEffective = researched.researchSuperEffective
    researchClaimed = researched.researchClaimed
    researchPoints = researched.researchPoints
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
    // A pinned companion's care fades if it took part in the battle, and garden
    // berries ripen.
    const companionId = companion?.id
    companion = tickCompanion(
      companion,
      !!companionId && (state.battleParticipants ?? []).includes(companionId),
      wildBattlesWon
    )
    garden = tickGarden(garden)
    // Winning against a chained shiny resolves the radar chain.
    shinyChain = advanceShinyTarget(shinyChain, state.enemyPokemon)
    // Poké Pelago's passive islands tick down their cycles.
    pelago = tickPelago(pelago)
    // Daily quests track wild wins (and route-specific ones).
    quests = advanceQuests(quests, { kind: 'wild', locationId: state.currentLocation })
    // Daily "Harvest Day" doubles the chance of every wild item drop.
    // Out-of-battle abilities. Illuminate lights up extra item drops, and
    // Pickup / Honey Gather can find something of their own.
    const partyAbilities = new Set(
      [state.playerPokemon, ...state.party].filter(Boolean).map((member) => member?.ability)
    )
    const dropBonus =
        dailyDropMultiplier(state.dailyEvent) *
        (partyAbilities.has('illuminate') ? 1.5 : 1) *
        prestigeMultipliers(state).drops,
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
    // Apricorns grow on Johto's routes and feed Kurt's ball crafting.
    if (
      mapData[state.currentLocation]?.region === 'johto' &&
      Math.random() < dropChance(apricornDropChance)
    ) {
      const apricornId = APRICORN_IDS[Math.floor(Math.random() * APRICORN_IDS.length)]
      inventory = { ...inventory, [apricornId]: (inventory[apricornId] ?? 0) + 1 }
      secretNotices.push(`You found a ${consumableItems[apricornId].name}!`)
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
    // Pickup and Honey Gather find their own extras.
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
    // TMs are found, not bought: a rare type-appropriate drop from the foe
    // (only while there is still an unowned TM matching its type).
    if (Math.random() < dropChance(wildTmDropChance)) {
      const tmMove = rollUnownedTm(enemyPokemon?.types, inventory)
      if (tmMove) {
        const tmId = tmItemId(tmMove),
          tmName = getTmInfo(tmId).name
        inventory = {
          ...inventory,
          [tmId]: (inventory[tmId] ?? 0) + 1,
        }
        secretNotices.push(`You found a ${tmName}!`)
      }
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
    researchDefeated,
    researchMoves,
    researchSuperEffective,
    researchMoveIds,
    researchClaimed,
    researchPoints,
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
    shinyChain,
    garden,
    pelago,
    inventory,
  })
  // A species whose field research just completed earns the Research Ribbon.
  syncedState = applyResearchRibbon(syncedState, state.enemyPokemon?.speciesKey)
  for (const dropNotification of dropNotifications)
    syncedState = withNotification(syncedState, dropNotification)
  if (hatchedEgg.length > 0) {
    for (const hatched of hatchedEgg) {
      const hatchKey = hatched.speciesKey,
        // A brand-new species earns the Discovery Ribbon, and a shiny hatch
        // earns the Shiny Ribbon.
        hatchIsNew = !syncedState.pokedexCaught.includes(hatchKey),
        ribbonedHatch = syncObtainedRibbons(hatched, {
          isNewSpecies: hatchIsNew,
          isShiny: hatched.isShiny,
        }),
        // Breeding tracker + project queue: count the hatch and complete the
        // front project when it matches.
        breedingResult = advanceBreeding(syncedState.breeding, hatched)
      syncedState = withNotification(
        {
          ...syncedState,
          party: syncedState.party.map((member) =>
            member.id === hatched.id ? ribbonedHatch : member
          ),
          breeding: breedingResult.breeding,
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
          kind: 'egg',
          icon: '\ud83d\udc23',
          dedupeKey: `hatch:${hatched.id}`,
        }
      )
      if (breedingResult.completed)
        syncedState = withNotification(syncedState, {
          message: `Breeding project complete: ${hatched.name} (${breedingGoalLabel(breedingResult.completed)})!`,
          tone: 'shiny',
          icon: '\u{1f3c6}',
          dedupeKey: `breedingproject:${breedingResult.completed.id}`,
        })
      // An XL hatch counts toward the "large specimen" research task.
      if (isLargeSpecimen(ribbonedHatch))
        syncedState = creditResearchLarge(syncedState, hatchKey)
      syncedState = applyResearchRibbon(syncedState, hatchKey)
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
        locationId,
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
