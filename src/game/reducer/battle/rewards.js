// // EXP application (including shared EXP) and the debug level-up cheat. Split from game/reducer/battle.js.

import { moveData, pokemonSpecies } from '../../../data/gameData.js'
import { applyMoveLearning, calculatePokemonStats, calculateRequiredExperience, gainFriendship, resolvePokemonMoves, syncMilestoneRibbons } from '../../pokemon.js'
import { syncActivePokemonIntoParty } from '../../progression.js'

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
      currentHp:
        updatedPokemon.currentHp > 0
          ? Math.min(
              updatedPokemon.currentHp + hpGain,
              action.payload.newStats.maxHp ?? updatedPokemon.maxHp
            )
          : 0,
      attack: action.payload.newStats.attack ?? updatedPokemon.attack,
      defense: action.payload.newStats.defense ?? updatedPokemon.defense,
      spAttack: action.payload.newStats.spAttack ?? updatedPokemon.spAttack,
      spDefense: action.payload.newStats.spDefense ?? updatedPokemon.spDefense,
      speed: action.payload.newStats.speed ?? updatedPokemon.speed,
    }),
      battleLog.push(`${updatedPokemon.name} grew to level ${updatedPokemon.level}!`))
  }
  if (action.payload.newMoves && action.payload.newMoves.length > 0) {
    const { moves, learned, forgotten, pending } = applyMoveLearning(
      updatedPokemon.speciesKey,
      updatedPokemon.moves,
      action.payload.newMoves,
      updatedPokemon.eggMoves
    )
    updatedPokemon = {
      ...updatedPokemon,
      moves,
    }
    for (const moveId of learned)
      battleLog.push(`${updatedPokemon.name} learned ${moveData[moveId]?.name ?? moveId}!`)
    for (const moveId of forgotten)
      battleLog.push(
        `${updatedPokemon.name} forgot ${moveData[moveId]?.name ?? moveId} to make room.`
      )
    for (const moveId of pending)
      battleLog.push(
        `${updatedPokemon.name} wants to learn ${moveData[moveId]?.name ?? moveId} — make room in Manage Moves.`
      )
  }
  // Award the milestone ribbons a level-up or friendship gain may have earned.
  updatedPokemon = syncMilestoneRibbons(updatedPokemon)
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
    // Prefer the id so a Nuzlocke release earlier in the same tick can't shift
    // the target onto the wrong party slot.
    const partyIndex = entry.pokemonId
      ? party.findIndex((member) => member.id === entry.pokemonId)
      : entry.partyIndex
    if (partyIndex < 0 || partyIndex >= party.length) continue
    let member = {
      ...party[partyIndex],
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
        // A fainted Pokemon stays fainted: level-up HP is a top-up, not a revive.
        currentHp:
          member.currentHp > 0
            ? Math.min(member.currentHp + hpGain, entry.newStats.maxHp ?? member.maxHp)
            : 0,
        attack: entry.newStats.attack ?? member.attack,
        defense: entry.newStats.defense ?? member.defense,
        spAttack: entry.newStats.spAttack ?? member.spAttack,
        spDefense: entry.newStats.spDefense ?? member.spDefense,
        speed: entry.newStats.speed ?? member.speed,
      }),
        battleLog.push(`${member.name} grew to level ${member.level}!`))
    }
    if (entry.newMoves && entry.newMoves.length > 0) {
      const { moves, learned, forgotten, pending } = applyMoveLearning(
        member.speciesKey,
        member.moves,
        entry.newMoves,
        member.eggMoves
      )
      member = {
        ...member,
        moves,
      }
      for (const moveId of learned)
        battleLog.push(`${member.name} learned ${moveData[moveId]?.name ?? moveId}!`)
      for (const moveId of forgotten)
        battleLog.push(`${member.name} forgot ${moveData[moveId]?.name ?? moveId} to make room.`)
      for (const moveId of pending)
        battleLog.push(
          `${member.name} wants to learn ${moveData[moveId]?.name ?? moveId} — make room in Manage Moves.`
        )
    }
    party[partyIndex] = syncMilestoneRibbons(member)
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
    stats = calculatePokemonStats(species, maxLevel, pokemon.ivs, pokemon.nature, pokemon.evs),
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
