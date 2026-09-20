// Split from src/game/logic.js — see tools/decompile/split-logic.mjs

import { shinyFullOddsChance, shinyWithCharmChance } from '../data/config.js'
import { activeItems, evolutionItems, pokeBalls } from '../data/items.js'
import { encounterData, mapData, moveData, pokemonSpecies } from '../data/gameData.js'
import { calculateExpYield, calculatePokemonStats, getLevelUpResults, getPerfectIVs, resolvePokemonMoves } from './pokemon.js'

export function getCatchRule(state, routeKey, speciesKey) {
  return state.catchSettings[routeKey]?.[speciesKey] ?? state.globalCatchDefaults
}

export function getItemCategory(itemId) {
  return itemId in pokeBalls ? 'pokeballs' : 'items'
}

export function isActiveEffectItem(itemId) {
  return itemId in activeItems
}

export function getItemInfo(itemId) {
  if (itemId in pokeBalls) {
    const item = pokeBalls[itemId]
    return {
      name: item.name,
      description: item.description,
    }
  }
  if (itemId in evolutionItems) {
    const item = evolutionItems[itemId]
    return {
      name: item.name,
      description: item.description,
    }
  }
  if (itemId in activeItems) {
    const item = activeItems[itemId]
    return {
      name: item.name,
      description: item.description,
    }
  }
  return {
    name: itemId,
    description: '',
  }
}

export function computeUnlockedLocations(state) {
  const unlocked = new Set(state.unlockedLocations),
    badgeCount = state.defeatedGyms.length
  for (const [locationId, location] of Object.entries(mapData)) {
    if (unlocked.has(locationId)) continue
    const unlockRule = location.unlock
    ;(unlockRule.battlesAtLocation &&
      unlockRule.battlesAtLocation.some(
        (requiredBattles) => (state.battlesWonByLocation[requiredBattles.locationId] ?? 0) < requiredBattles.count
      )) ||
      (unlockRule.badgesRequired && badgeCount < unlockRule.badgesRequired) ||
      (unlockRule.championDefeated && !state.championDefeated) ||
      unlocked.add(locationId)
  }
  return Array.from(unlocked)
}

export function getActivePartyIndex(state) {
  return state.activePlayerPokemonIndex
}

export function syncActivePokemonIntoParty(state) {
  if (!state.playerPokemon || state.party.length === 0) return state
  const activeIndex = getActivePartyIndex(state),
    party = [...state.party]
  if (activeIndex >= 0 && activeIndex < party.length && party[activeIndex].id === state.playerPokemon.id)
    return (
      (party[activeIndex] = state.playerPokemon),
      {
        ...state,
        party,
      }
    )
  const existingIndex = party.findIndex((member) => member.id === state.playerPokemon.id)
  return existingIndex >= 0
    ? ((party[existingIndex] = state.playerPokemon),
      {
        ...state,
        party,
        activePlayerPokemonIndex: existingIndex,
      })
    : state
}

export function loadActivePokemonFromParty(state) {
  if (state.party.length === 0) return state
  const activeIndex = getActivePartyIndex(state)
  return activeIndex >= 0 && activeIndex < state.party.length
    ? {
        ...state,
        playerPokemon: state.party[activeIndex],
      }
    : {
        ...state,
        playerPokemon: state.party[0],
        activePlayerPokemonIndex: 0,
      }
}

export function createIdleBattleState() {
  return {
    phase: 'idle',
    enemyPokemon: null,
    battleEvents: [],
    pendingEvents: [],
    currentEventIndex: 0,
    trainerBattle: null,
    bossBattle: null,
    bossQueue: [],
    activePlayerPokemonIndex: 0,
    playerVolatile: null,
  }
}

export function prepareNextBattle(state) {
  const synced = syncActivePokemonIntoParty(state),
    firstAliveIndex = synced.party.findIndex((member) => member.currentHp > 0),
    nextIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0
  return {
    ...synced,
    ...createIdleBattleState(),
    activePlayerPokemonIndex: nextIndex,
    playerPokemon: synced.party[nextIndex] || synced.playerPokemon,
  }
}

export function tickBattleCounters(effects) {
  return effects
    .map((effect) => ({
      ...effect,
      battlesRemaining: effect.battlesRemaining - 1,
    }))
    .filter((effect) => effect.battlesRemaining > 0)
}

export function checkShinyOdds(isDexComplete = !1) {
  const odds = isDexComplete ? shinyWithCharmChance : shinyFullOddsChance
  return Math.floor(Math.random() * odds) === 0
}

export function resolveActiveModifiers(activeEffects, routeKey) {
  const modifiers = []
  for (const effect of activeEffects)
    effect.type === 'repel' && effect.routeKey === routeKey && effect.speciesKey
      ? modifiers.push({
          speciesKey: effect.speciesKey,
          multiplier: 0.5,
        })
      : effect.type === 'honey' &&
        effect.routeKey === routeKey &&
        effect.speciesKey &&
        modifiers.push({
          speciesKey: effect.speciesKey,
          multiplier: 2,
        })
  return modifiers
}

export function resolvePokemonEncounter(encounterData, modifiers, isDexComplete = !1) {
  const weightedEncounters = encounterData.encounters.map((encounter) => {
      const modifier = modifiers?.find((candidate) => candidate.speciesKey === encounter.speciesKey)
      return modifier
        ? {
            ...encounter,
            weight: encounter.weight * modifier.multiplier,
          }
        : encounter
    }),
    totalWeight = weightedEncounters.reduce((accumulator, encounter) => accumulator + encounter.weight, 0)
  let roll = Math.random() * totalWeight
  for (const encounter of weightedEncounters)
    if (((roll -= encounter.weight), roll <= 0)) {
      const level =
        encounter.minLevel + Math.floor(Math.random() * (encounter.maxLevel - encounter.minLevel + 1))
      return {
        species: pokemonSpecies[encounter.speciesKey],
        speciesKey: encounter.speciesKey,
        level,
        isShiny: checkShinyOdds(isDexComplete),
      }
    }
  const fallback = weightedEncounters[weightedEncounters.length - 1]
  return {
    species: pokemonSpecies[fallback.speciesKey],
    speciesKey: fallback.speciesKey,
    level: fallback.minLevel,
    isShiny: checkShinyOdds(isDexComplete),
  }
}

export function awardExperience(dispatch, playerPokemon, enemyPokemon, multiplier, hasExpShare = !1, party = [], activeIndex = 0) {
  const enemySpecies = pokemonSpecies[enemyPokemon.speciesKey],
    baseExp = calculateExpYield(enemySpecies, enemyPokemon.level),
    gainedExp = Math.floor(baseExp * multiplier),
    finalExp = hasExpShare ? Math.floor(gainedExp * 0.5) : gainedExp,
    playerSpecies = pokemonSpecies[playerPokemon.speciesKey],
    newTotalExp = playerPokemon.totalExp + finalExp,
    levelUps = getLevelUpResults(playerPokemon.speciesKey, playerSpecies.growthRate, playerPokemon.level, newTotalExp)
  if (levelUps.length > 0) {
    const lastLevelUp = levelUps[levelUps.length - 1],
      newStats = calculatePokemonStats(playerSpecies, lastLevelUp.newLevel, playerPokemon.ivs),
      newMoves = levelUps.flatMap((moveId) => moveId.newMoves)
    ;(newMoves.forEach((moveId) => {
      const moveDef = moveData[moveId]
      moveDef &&
        dispatch({
          type: 'ADD_LOG',
          payload: {
            message: `${playerPokemon.name} learned ${moveDef.name}!`,
          },
        })
    }),
      dispatch({
        type: 'APPLY_EXP',
        payload: {
          expGained: finalExp,
          newLevel: lastLevelUp.newLevel,
          newMoves,
          newStats: {
            maxHp: newStats.hp,
            attack: newStats.attack,
            defense: newStats.defense,
            spAttack: newStats.spAttack,
            spDefense: newStats.spDefense,
            speed: newStats.speed,
          },
        },
      }))
  } else
    dispatch({
      type: 'APPLY_EXP',
      payload: {
        expGained: finalExp,
      },
    })
  if (hasExpShare && party.length > 1) {
    const sharedExp = Math.floor(gainedExp * 0.05)
    if (sharedExp > 0) {
      const sharedResults = []
      for (let memberIndex = 0; memberIndex < party.length; memberIndex++) {
        if (memberIndex === activeIndex) continue
        const member = party[memberIndex]
        if (member.currentHp <= 0) continue
        const memberSpecies = pokemonSpecies[member.speciesKey],
          memberTotalExp = member.totalExp + sharedExp,
          memberLevelUps = getLevelUpResults(member.speciesKey, memberSpecies.growthRate, member.level, memberTotalExp)
        if (memberLevelUps.length > 0) {
          const lastLevelUp = memberLevelUps[memberLevelUps.length - 1],
            memberStats = calculatePokemonStats(memberSpecies, lastLevelUp.newLevel, member.ivs),
            memberNewMoves = memberLevelUps.flatMap((moveId) => moveId.newMoves)
          ;(memberNewMoves.forEach((moveId) => {
            const moveDef = moveData[moveId]
            moveDef &&
              dispatch({
                type: 'ADD_LOG',
                payload: {
                  message: `${member.name} learned ${moveDef.name}!`,
                },
              })
          }),
            sharedResults.push({
              partyIndex: memberIndex,
              expGained: sharedExp,
              newLevel: lastLevelUp.newLevel,
              newMoves: memberNewMoves,
              newStats: {
                maxHp: memberStats.hp,
                attack: memberStats.attack,
                defense: memberStats.defense,
                spAttack: memberStats.spAttack,
                spDefense: memberStats.spDefense,
                speed: memberStats.speed,
              },
            }))
        } else
          sharedResults.push({
            partyIndex: memberIndex,
            expGained: sharedExp,
          })
      }
      sharedResults.length > 0 &&
        dispatch({
          type: 'APPLY_SHARED_EXP',
          payload: {
            partyExp: sharedResults,
          },
        })
    }
  }
}

export function buildTrainerTeam(team) {
  return team.map((member) => {
    const species = pokemonSpecies[member.speciesKey],
      stats = calculatePokemonStats(species, member.level, getPerfectIVs()),
      moves = resolvePokemonMoves(member.speciesKey, member.level)
    return {
      speciesKey: member.speciesKey,
      name: species.name,
      types: species.types,
      level: member.level,
      currentHp: stats.hp,
      maxHp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      spAttack: stats.spAttack,
      spDefense: stats.spDefense,
      speed: stats.speed,
      moves,
      isPlayer: !1,
      isShiny: checkShinyOdds(),
    }
  })
}

export function formatCooldown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1e3)),
    minutes = Math.floor(totalSeconds / 60),
    seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function createRoads(fromId, toId) {
  const fromLocation = mapData[fromId],
    toLocation = mapData[toId],
    deltaX = Math.abs(toLocation.position.x - fromLocation.position.x),
    deltaY = Math.abs(toLocation.position.y - fromLocation.position.y)
  return deltaX >= deltaY
    ? [
        {
          x1: fromLocation.position.x,
          y1: fromLocation.position.y,
          x2: toLocation.position.x,
          y2: fromLocation.position.y,
        },
        {
          x1: toLocation.position.x,
          y1: fromLocation.position.y,
          x2: toLocation.position.x,
          y2: toLocation.position.y,
        },
      ]
    : [
        {
          x1: fromLocation.position.x,
          y1: fromLocation.position.y,
          x2: fromLocation.position.x,
          y2: toLocation.position.y,
        },
        {
          x1: fromLocation.position.x,
          y1: toLocation.position.y,
          x2: toLocation.position.x,
          y2: toLocation.position.y,
        },
      ]
}
