// // Experience awards shared by wild, trainer and Battle Tower battles. Split from game/progression.js.

import { moveData, pokemonSpecies } from '../../data/gameData.js'
import { expShareActiveMultiplier, expSharePartyMultiplier } from '../../data/config.js'
import { calculateExpYield, calculatePokemonStats, getLevelUpResults, isBattleReady } from '../pokemon.js'

/**
 * @param {(action: GameAction) => void} dispatch
 * @param {Pokemon} playerPokemon
 * @param {BattlePokemon} enemyPokemon
 * @param {number} multiplier
 * @param {boolean} [hasExpShare]
 * @param {Pokemon[]} [party]
 * @param {number} [activeIndex]
 * @param {number} [bonusMultiplier] Extra EXP multiplier (e.g. a daily event).
 * @returns {void}
 */
export function awardExperience(dispatch, playerPokemon, enemyPokemon, multiplier, hasExpShare = !1, party = [], activeIndex = 0, bonusMultiplier = 1) {
  const enemySpecies = pokemonSpecies[enemyPokemon.speciesKey],
    baseExp = calculateExpYield(enemySpecies, enemyPokemon.level),
    gainedExp = Math.floor(baseExp * multiplier * bonusMultiplier),
    finalExp = hasExpShare
      ? Math.floor(gainedExp * expShareActiveMultiplier)
      : gainedExp,
    playerSpecies = pokemonSpecies[playerPokemon.speciesKey],
    newTotalExp = playerPokemon.totalExp + finalExp,
    levelUps = getLevelUpResults(playerPokemon.speciesKey, playerSpecies.growthRate, playerPokemon.level, newTotalExp)
  if (levelUps.length > 0) {
    const lastLevelUp = levelUps[levelUps.length - 1],
      newStats = calculatePokemonStats(playerSpecies, lastLevelUp.newLevel, playerPokemon.ivs, playerPokemon.nature),
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
    const sharedExp = Math.floor(gainedExp * expSharePartyMultiplier)
    if (sharedExp > 0) {
      const sharedResults = []
      for (let memberIndex = 0; memberIndex < party.length; memberIndex++) {
        if (memberIndex === activeIndex) continue
        const member = party[memberIndex]
        if (!isBattleReady(member)) continue
        const memberSpecies = pokemonSpecies[member.speciesKey],
          memberTotalExp = member.totalExp + sharedExp,
          memberLevelUps = getLevelUpResults(member.speciesKey, memberSpecies.growthRate, member.level, memberTotalExp)
        if (memberLevelUps.length > 0) {
          const lastLevelUp = memberLevelUps[memberLevelUps.length - 1],
            memberStats = calculatePokemonStats(memberSpecies, lastLevelUp.newLevel, member.ivs, member.nature),
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
