// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import { RAID_COOLDOWN_MS, activeItems, defaultCatchSettings, legendaryPool, pokeBalls } from '../data/constants.js'
import { encounterData, mapData, moveLearnsets, pokemonSpecies } from '../data/gameData.js'
import { createVolatileState } from './combat.js'
import { calculatePokemonStats, createPokemon } from './pokemon.js'
import { computeUnlockedLocations, isActiveEffectItem, loadActivePokemonFromParty, prepareNextBattle, syncActivePokemonIntoParty, tickBattleCounters } from './progression.js'

export const initialGameState = {
  phase: 'starterSelect',
  playerPokemon: null,
  enemyPokemon: null,
  currentRoute: 'route1',
  battleEvents: [],
  pendingEvents: [],
  currentEventIndex: 0,
  speed: 1,
  paused: !1,
  battleLog: [],
  levelUpNotification: null,
  wildBattlesWon: 0,
  trainerBattlesWon: 0,
  battlesWonByLocation: {},
  party: [],
  box: [],
  autoCatch: !0,
  nextPokemonId: 1,
  currentLocation: 'palletTown',
  unlockedLocations: ['palletTown', 'route1'],
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
  shinySeen: [],
  defeatedGyms: [],
  defeatedEliteFour: [],
  championDefeated: !1,
  victoryTokens: 0,
  autoProceed: !1,
  raidCooldownEnd: null,
  raidLegendary: null,
  inRaid: !1,
  raidLevel: 0,
  preRaidLocation: null,
  playerVolatile: null,
  activeEffects: [],
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SELECT_STARTER': {
      const starterPokemon = createPokemon(action.payload.speciesKey, 5, state.nextPokemonId, action.payload.isShiny),
        speciesKey = action.payload.speciesKey
      return {
        ...state,
        phase: 'idle',
        playerPokemon: starterPokemon,
        party: [starterPokemon],
        nextPokemonId: state.nextPokemonId + 1,
        battleLog: [`You chose ${starterPokemon.name}!`],
        pokedexSeen: state.pokedexSeen.includes(speciesKey)
          ? state.pokedexSeen
          : [...state.pokedexSeen, speciesKey],
        pokedexCaught: state.pokedexCaught.includes(speciesKey)
          ? state.pokedexCaught
          : [...state.pokedexCaught, speciesKey],
      }
    }
    case 'START_ENCOUNTER': {
      const firstAliveIndex = state.party.findIndex((member) => member.currentHp > 0),
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
        playerVolatile: createVolatileState(),
      }
    }
    case 'EXECUTE_TURN':
      return {
        ...state,
        pendingEvents: [...state.pendingEvents, ...action.payload.events],
      }
    case 'CONSUME_EVENT': {
      if (state.pendingEvents.length === 0) return state
      const [event, ...remainingEvents] = state.pendingEvents,
        battleLog = [...state.battleLog, event.message].slice(-50)
      let newPhase = state.phase
      ;(event.type === 'victory' && (newPhase = 'victory'),
        event.type === 'defeat' && (newPhase = 'defeat'),
        event.type === 'faint' &&
          (event.data?.target === 'enemy'
            ? (newPhase = 'victory')
            : event.data?.target === 'player' && (newPhase = 'defeat')))
      let playerPokemon = state.playerPokemon,
        enemyPokemon = state.enemyPokemon,
        wildBattlesWon = state.wildBattlesWon,
        battlesWonByLocation = state.battlesWonByLocation
      ;(event.type === 'damage' || event.type === 'recoil') &&
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
      let activeEffects = state.activeEffects
      if (
        event.type === 'faint' &&
        event.data?.target === 'enemy' &&
        !state.trainerBattle &&
        !state.bossBattle
      ) {
        wildBattlesWon++
        const locationWins = battlesWonByLocation[state.currentLocation] ?? 0
        ;((battlesWonByLocation = {
          ...battlesWonByLocation,
          [state.currentLocation]: locationWins + 1,
        }),
          (activeEffects = tickBattleCounters(activeEffects)))
      }
      const syncedState = syncActivePokemonIntoParty({
        ...state,
        phase: newPhase,
        pendingEvents: remainingEvents,
        battleEvents: [...state.battleEvents, event],
        battleLog,
        playerPokemon,
        enemyPokemon,
        wildBattlesWon,
        battlesWonByLocation,
        activeEffects,
      })
      if (
        event.type === 'victory' ||
        (event.type === 'faint' && event.data?.target === 'enemy')
      ) {
        const unlocked = computeUnlockedLocations(syncedState),
          newlyUnlocked = unlocked.filter((locationId) => !syncedState.unlockedLocations.includes(locationId))
        let log = syncedState.battleLog
        for (const locationId of newlyUnlocked) {
          const location = mapData[locationId]
          location && (log = [...log, `${location.name} is now accessible!`].slice(-50))
        }
        return {
          ...syncedState,
          unlockedLocations: unlocked,
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
        const hpGain = (action.payload.newStats.maxHp ?? updatedPokemon.maxHp) - updatedPokemon.maxHp
        ;((updatedPokemon = {
          ...updatedPokemon,
          level: action.payload.newLevel,
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
    case 'PHASE_IDLE': {
      const nextState = prepareNextBattle(state)
      return state.inRaid
        ? {
            ...nextState,
            raidLevel: Math.min(state.raidLevel + 1, 100),
          }
        : nextState
    }
    case 'ADD_LOG':
      return {
        ...state,
        battleLog: [...state.battleLog, action.payload.message].slice(-50),
      }
    case 'SET_MOVES': {
      if (!state.playerPokemon) return state
      const moves = action.payload.moves
      return moves.length < 1 || moves.length > 4 || new Set(moves).size !== moves.length
        ? state
        : syncActivePokemonIntoParty({
            ...state,
            playerPokemon: {
              ...state.playerPokemon,
              moves,
            },
          })
    }
    case 'CATCH_POKEMON': {
      const {
          speciesKey,
          level,
          pokeballUsed,
          isShiny,
        } = action.payload,
        catchLevel = state.inRaid ? 60 : level,
        newPokemon = createPokemon(speciesKey, catchLevel, state.nextPokemonId, isShiny),
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
            battleLog: [
              ...state.battleLog,
              `Caught ${species.name}! Added to party.`,
            ].slice(-50),
          }
        : {
            ...state,
            box: [...state.box, newPokemon],
            nextPokemonId: state.nextPokemonId + 1,
            inventory,
            battleLog: [...state.battleLog, `Caught ${species.name}! Sent to box.`].slice(
              -50
            ),
          }
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
        evolveMember = (member) => {
          if (member.id !== pokemonId) return member
          const newStats = calculatePokemonStats(toSpecies, member.level, member.ivs),
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
      return {
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
      }
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
        activePlayerPokemonIndex: 0,
        bossBattle: {
          bossId,
          bossType,
          trainerName,
          trainerClass,
          trainerTeam,
          currentTrainerPokemonIndex: 0,
          spriteKey,
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
      return nextPokemon
        ? {
            ...state,
            phase: 'battling',
            playerPokemon: nextPokemon,
            battleEvents: [],
            party,
            activePlayerPokemonIndex: newIndex,
            pendingEvents: [
              ...state.pendingEvents,
              {
                type: 'playerSwitch',
                message: `Go! ${nextPokemon.name}!`,
              },
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
      return {
        ...state,
        phase: 'battling',
        enemyPokemon: nextPokemon,
        battleEvents: [],
        trainerBattle: state.trainerBattle ? updatedBattle : null,
        bossBattle: state.bossBattle ? updatedBattle : null,
        pendingEvents: [
          ...state.pendingEvents,
          {
            type: 'trainerAppear',
            message: `${battle.trainerName} is about to send out ${nextPokemon.name}!`,
          },
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
        championDefeated = state.championDefeated,
        victoryTokens = state.victoryTokens
      const notifications = []
      if (won && state.bossBattle) {
        const { bossType, bossId } = state.bossBattle
        bossType === 'gym' && !defeatedGyms.includes(bossId)
          ? ((defeatedGyms = [...defeatedGyms, bossId]), (victoryTokens += 1), notifications.push('Earned a Victory Token!'))
          : bossType === 'e4' && !defeatedEliteFour.includes(bossId)
            ? (defeatedEliteFour = [...defeatedEliteFour, bossId])
            : bossType === 'champion' &&
              ((championDefeated = !0), (victoryTokens += 1), notifications.push('Earned a Victory Token!'))
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
            championDefeated,
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
            bossBattle: {
              bossId: nextBoss.bossId,
              bossType: nextBoss.bossType,
              trainerName: nextBoss.trainerName,
              trainerClass: nextBoss.trainerClass,
              trainerTeam: nextBoss.trainerTeam,
              currentTrainerPokemonIndex: 0,
              spriteKey: nextBoss.spriteKey,
            },
            bossQueue: remainingQueue,
          }
        return {
          ...stateWithNextBoss,
          unlockedLocations: computeUnlockedLocations(stateWithNextBoss),
        }
      }
      const finalState = {
        ...prepareNextBattle(state),
        money: newMoney,
        trainerBattlesWon,
        battlesWonByLocation,
        activeEffects,
        defeatedGyms,
        defeatedEliteFour,
        championDefeated,
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
      return {
        ...finalState,
        unlockedLocations: computeUnlockedLocations(finalState),
      }
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
      return state
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
        : {
            ...state,
            pokedexSeen: [...state.pokedexSeen, speciesKey],
          }
    }
    case 'MARK_CAUGHT': {
      const { speciesKey } = action.payload,
        pokedexSeen = state.pokedexSeen.includes(speciesKey) ? state.pokedexSeen : [...state.pokedexSeen, speciesKey],
        pokedexCaught = state.pokedexCaught.includes(speciesKey)
          ? state.pokedexCaught
          : [...state.pokedexCaught, speciesKey]
      return pokedexSeen === state.pokedexSeen && pokedexCaught === state.pokedexCaught
        ? state
        : {
            ...state,
            pokedexSeen,
            pokedexCaught,
          }
    }
    case 'MARK_SHINY_CAUGHT': {
      const { speciesKey } = action.payload
      return state.shinyCaught.includes(speciesKey)
        ? state
        : {
            ...state,
            shinyCaught: [...state.shinyCaught, speciesKey],
          }
    }
    case 'MARK_SHINY_SEEN': {
      const { speciesKey } = action.payload
      return state.shinySeen.includes(speciesKey)
        ? state
        : {
            ...state,
            shinySeen: [...state.shinySeen, speciesKey],
          }
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
      if (state.currentLocation === 'raidIsland') {
        const returnLocation = state.preRaidLocation || 'palletTown',
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
    case 'SORT_BOX': {
      const sortedBox = [...state.box].sort((left, right) => {
        const leftId = pokemonSpecies[left.speciesKey]?.id ?? 0,
          rightId = pokemonSpecies[right.speciesKey]?.id ?? 0
        return leftId !== rightId
          ? leftId - rightId
          : left.level !== right.level
            ? right.level - left.level
            : left.isShiny !== right.isShiny
              ? left.isShiny
                ? -1
                : 1
              : 0
      })
      return {
        ...state,
        box: sortedBox,
      }
    }
    case 'RELEASE_POKEMON': {
      const { pokemonId, source } = action.payload
      if (source === 'box')
        return {
          ...state,
          box: state.box.filter((member) => member.id !== pokemonId),
        }
      if (state.party.length <= 1) return state
      const baseState = state.phase === 'battling' ? prepareNextBattle(state) : state,
        newParty = baseState.party.filter((member) => member.id !== pokemonId),
        activeId = baseState.playerPokemon?.id
      let newActiveIndex = activeId ? newParty.findIndex((member) => member.id === activeId) : 0
      return (
        newActiveIndex < 0 && (newActiveIndex = 0),
        loadActivePokemonFromParty({
          ...baseState,
          party: newParty,
          activePlayerPokemonIndex: newActiveIndex,
        })
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
    case 'TOGGLE_AUTO_PROCEED':
      return {
        ...state,
        autoProceed: !state.autoProceed,
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
        raidLevel = legendaryPool.find((legendary) => legendary.speciesKey === action.payload.legendary)?.level ?? 60
      return {
        ...prepareNextBattle(state),
        raidCooldownEnd: Date.now() + RAID_COOLDOWN_MS,
        raidLegendary: action.payload.legendary,
        inRaid: !0,
        raidLevel,
        preRaidLocation: state.currentLocation,
        currentLocation: 'raidIsland',
        currentRoute: 'raidIsland',
        party: healedParty,
        playerPokemon,
        activePlayerPokemonIndex: 0,
        battleLog: [
          ...state.battleLog,
          'Arrived at Raid Island! A legendary Pokemon awaits...',
        ].slice(-50),
      }
    }
    case 'END_RAID':
      return {
        ...state,
        inRaid: !1,
        raidLegendary: null,
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
      const existingIndex = state.activeEffects.findIndex(
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
