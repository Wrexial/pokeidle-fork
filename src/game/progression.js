// Split from src/game/logic.js — see tools/decompile/split-logic.mjs

import { shinyCharmMinOddsChance, shinyFullOddsChance, shinyWithCharmChance } from '../data/config.js'
import { activeItems, evolutionItems, pokeBalls } from '../data/items.js'
import { GENERATION_DEX_RANGES, encounterData, isSpeciesCharmed, mapData, moveData, pokemonSpecies } from '../data/gameData.js'
import { calculateExpYield, calculatePokemonStats, getLevelUpResults, getPerfectIVs, resolvePokemonMoves } from './pokemon.js'

/**
 * @param {GameState} state
 * @param {string} routeKey
 * @param {string} speciesKey
 * @returns {CatchRule}
 */
export function getCatchRule(state, routeKey, speciesKey) {
  return state.catchSettings[routeKey]?.[speciesKey] ?? state.globalCatchDefaults
}

/**
 * @param {string} itemId
 * @returns {string}
 */
export function getItemCategory(itemId) {
  return itemId in pokeBalls ? 'pokeballs' : 'items'
}

/**
 * @param {string} itemId
 * @returns {boolean}
 */
export function isActiveEffectItem(itemId) {
  return itemId in activeItems
}

/**
 * @param {string} itemId
 * @returns {{ name: string, description: string }}
 */
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

/**
 * @param {GameState} state
 * @returns {string[]}
 */
export function computeUnlockedLocations(state) {
  const unlocked = new Set(state.unlockedLocations),
    badgeCount = state.defeatedGyms.length,
    caughtSpecies = new Set(state.pokedexCaught),
    caughtCount = state.pokedexCaught.length,
    highestPartyLevel = state.party.reduce((max, member) => Math.max(max, member.level), 0)
  let changed = true
  while (changed) {
    changed = false
    for (const [locationId, location] of Object.entries(mapData)) {
      if (unlocked.has(locationId)) continue
      const unlockRule = location.unlock
      const blocked =
        (unlockRule.battlesAtLocation &&
          unlockRule.battlesAtLocation.some(
            (requiredBattles) => (state.battlesWonByLocation[requiredBattles.locationId] ?? 0) < requiredBattles.count
          )) ||
        (unlockRule.caughtCount && caughtCount < unlockRule.caughtCount) ||
        (unlockRule.caughtOnRoute &&
          unlockRule.caughtOnRoute.species.filter((speciesKey) => caughtSpecies.has(speciesKey)).length <
            unlockRule.caughtOnRoute.count) ||
        (unlockRule.partyLevel && highestPartyLevel < unlockRule.partyLevel) ||
        (unlockRule.badgesRequired && badgeCount < unlockRule.badgesRequired) ||
        (unlockRule.gymsRequired &&
          unlockRule.gymsRequired.some((gymId) => !state.defeatedGyms.includes(gymId))) ||
        (unlockRule.championDefeated &&
          !state.defeatedChampions.includes(
            unlockRule.championDefeated === true ? 'kanto' : unlockRule.championDefeated
          )) ||
        (unlockRule.requires && unlockRule.requires.some((id) => !unlocked.has(id))) ||
        (unlockRule.entry &&
          !(
            state.startRegion === (location.region ?? 'kanto') ||
            (unlockRule.previous && state.defeatedChampions.includes(unlockRule.previous))
          ))
      if (!blocked) {
        unlocked.add(locationId)
        changed = true
      }
    }
  }
  return Array.from(unlocked)
}

/**
 * @param {GameState} state
 * @returns {number}
 */
export function getActivePartyIndex(state) {
  return state.activePlayerPokemonIndex
}

/**
 * @param {GameState} state
 * @returns {GameState}
 */
export function syncActivePokemonIntoParty(state) {
  if (!state.playerPokemon || state.party.length === 0) return state
  const activeIndex = getActivePartyIndex(state),
    activePokemon = state.playerPokemon,
    party = [...state.party]
  if (activeIndex >= 0 && activeIndex < party.length && party[activeIndex].id === activePokemon.id)
    return (
      (party[activeIndex] = activePokemon),
      {
        ...state,
        party,
      }
    )
  const existingIndex = party.findIndex((member) => member.id === activePokemon.id)
  return existingIndex >= 0
    ? ((party[existingIndex] = activePokemon),
      {
        ...state,
        party,
        activePlayerPokemonIndex: existingIndex,
      })
    : state
}

/**
 * @param {GameState} state
 * @returns {GameState}
 */
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

/** @returns {Partial<GameState>} */
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

/**
 * @param {GameState} state
 * @returns {GameState}
 */
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

/**
 * @param {ActiveEffect[]} effects
 * @returns {ActiveEffect[]}
 */
export function tickBattleCounters(effects) {
  return effects
    .map((effect) => ({
      ...effect,
      battlesRemaining: effect.battlesRemaining - 1,
    }))
    .filter((effect) => effect.battlesRemaining > 0)
}

/**
 * @param {number} [odds]
 * @returns {boolean}
 */
export function checkShinyOdds(odds = shinyFullOddsChance) {
  return Math.floor(Math.random() * odds) === 0
}

/**
 * Shiny odds once `completedGenerationCount` generations are complete. The
 * first completed generation gives the 2x charm rate, and each further one
 * keeps improving it until every generation is done.
 * @param {number} completedGenerationCount
 * @param {number} totalGenerations
 * @returns {number}
 */
export function shinyOddsForCompletedGenerations(completedGenerationCount, totalGenerations) {
  if (completedGenerationCount <= 0) return shinyFullOddsChance
  const progress = totalGenerations > 1 ? (completedGenerationCount - 1) / (totalGenerations - 1) : 1,
    ratio = Math.pow(shinyCharmMinOddsChance / shinyWithCharmChance, progress)
  return Math.max(shinyCharmMinOddsChance, Math.round(shinyWithCharmChance * ratio))
}

/**
 * Shiny odds for `speciesKey`: full odds unless its own generation's dex is
 * complete, otherwise the rate scaled by how many generations are done.
 * @param {string} speciesKey
 * @param {Set<number>} completedGenerationSet
 * @returns {number}
 */
export function shinyOddsForSpecies(speciesKey, completedGenerationSet) {
  return isSpeciesCharmed(speciesKey, completedGenerationSet)
    ? shinyOddsForCompletedGenerations(completedGenerationSet.size, GENERATION_DEX_RANGES.length)
    : shinyFullOddsChance
}

/**
 * @param {ActiveEffect[]} activeEffects
 * @param {string} routeKey
 * @returns {{ speciesKey: string, multiplier: number }[]}
 */
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

/**
 * @param {EncounterData} encounterData
 * @param {{ speciesKey: string, multiplier: number }[]} modifiers
 * @param {Set<number>} completedGenerationSet
 * @returns {{ species: Species, speciesKey: string, level: number, isShiny: boolean }}
 */
export function resolvePokemonEncounter(encounterData, modifiers, completedGenerationSet) {
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
        isShiny: checkShinyOdds(shinyOddsForSpecies(encounter.speciesKey, completedGenerationSet)),
      }
    }
  const fallback = weightedEncounters[weightedEncounters.length - 1]
  return {
    species: pokemonSpecies[fallback.speciesKey],
    speciesKey: fallback.speciesKey,
    level: fallback.minLevel,
    isShiny: checkShinyOdds(shinyOddsForSpecies(fallback.speciesKey, completedGenerationSet)),
  }
}

/**
 * @param {(action: GameAction) => void} dispatch
 * @param {Pokemon} playerPokemon
 * @param {BattlePokemon} enemyPokemon
 * @param {number} multiplier
 * @param {boolean} [hasExpShare]
 * @param {Pokemon[]} [party]
 * @param {number} [activeIndex]
 * @returns {void}
 */
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

/**
 * @param {any[]} team
 * @returns {BattlePokemon[]}
 */
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

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatCooldown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1e3)),
    minutes = Math.floor(totalSeconds / 60),
    seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * @param {string} fromId
 * @param {string} toId
 * @returns {{ x1: number, y1: number, x2: number, y2: number }[]}
 */
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
