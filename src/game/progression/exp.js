// // Experience awards shared by wild, trainer and Battle Tower battles. Split from game/progression.js.

import { pokemonSpecies } from '../../data/gameData.js'
import { expShareActiveMultiplier, expSharePartyMultiplier } from '../../data/config.js'
import { alphaExpMultiplier, calculateExpYield, calculatePokemonStats, getLevelUpResults, isBattleReady } from '../pokemon.js'

/**
 * Build an `APPLY_SHARED_EXP` entry for a party member. The reducer logs the
 * moves actually learned once it applies the entry.
 * @param {number} partyIndex
 * @param {Pokemon} member
 * @param {number} expGained
 * @returns {{ partyIndex: number, pokemonId: string, expGained: number, newLevel?: number, newMoves?: string[], newStats?: { maxHp: number, attack: number, defense: number, spAttack: number, spDefense: number, speed: number } }}
 */
function buildSharedExpEntry(partyIndex, member, expGained) {
  // An alpha earns a little more EXP from the same battle.
  const awardedExp = Math.floor(expGained * alphaExpMultiplier(member)),
    memberSpecies = pokemonSpecies[member.speciesKey],
    memberTotalExp = member.totalExp + awardedExp,
    memberLevelUps = getLevelUpResults(
      member.speciesKey,
      memberSpecies.growthRate,
      member.level,
      memberTotalExp
    )
  if (memberLevelUps.length === 0)
    return { partyIndex, pokemonId: member.id, expGained: awardedExp }
  const lastLevelUp = memberLevelUps[memberLevelUps.length - 1],
    memberStats = calculatePokemonStats(
      memberSpecies,
      lastLevelUp.newLevel,
      member.ivs,
      member.nature
    ),
    memberNewMoves = memberLevelUps.flatMap((entry) => entry.newMoves)
  return {
    partyIndex,
    pokemonId: member.id,
    expGained: awardedExp,
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
 * @param {number} [bonusMultiplier] Extra EXP multiplier (e.g. a daily event).
 * @param {string[] | null} [participantIds] Ids of every party member that
 *   fought in the battle. They all share its EXP; defaults to just the victor.
 *   Fainted (and egg) members are skipped — they earn nothing and don't dilute
 *   the survivors' share.
 * @returns {void}
 */
export function awardExperience(dispatch, playerPokemon, enemyPokemon, multiplier, hasExpShare = !1, party = [], activeIndex = 0, bonusMultiplier = 1, participantIds = null) {
  const enemySpecies = pokemonSpecies[enemyPokemon.speciesKey],
    baseExp = calculateExpYield(enemySpecies, enemyPokemon.level),
    gainedExp = Math.floor(baseExp * multiplier * bonusMultiplier)
  // Every Pokemon that took part in the battle and is still standing shares
  // its EXP.
  const participantIndices = [],
    seenIndices = new Set()
  for (const id of participantIds ?? [])
    if (id && !seenIndices.has(id)) {
      const index = party.findIndex((member) => member.id === id)
      // A fainted (or still-an-egg) Pokemon earns no EXP even if it fought
      // earlier in the battle. Excluding it here also stops it from diluting
      // the survivors' share.
      if (index >= 0 && isBattleReady(party[index])) {
        seenIndices.add(id)
        participantIndices.push(index)
      }
    }
  // The victor always shares in the win, even if the battle state lost track
  // of it, but only while it is still standing. A double knockout (the active
  // Pokemon fainted to take the foe down) therefore earns nothing.
  const activeCanEarnExp = (playerPokemon.currentHp ?? 0) > 0 && !playerPokemon.isEgg
  if (activeCanEarnExp && !participantIndices.includes(activeIndex))
    participantIndices.push(activeIndex)
  const shareCount = Math.max(1, participantIndices.length),
    perParticipant = Math.floor(gainedExp / shareCount)
  let remainder = gainedExp - perParticipant * shareCount
  /** @type {Map<number, number>} */
  const participantExp = new Map()
  for (const index of participantIndices) {
    const share = perParticipant + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder--
    participantExp.set(index, hasExpShare ? Math.floor(share * expShareActiveMultiplier) : share)
  }
  const finalExp = activeCanEarnExp
      ? Math.floor(
          (participantExp.get(activeIndex) ?? gainedExp) * alphaExpMultiplier(playerPokemon)
        )
      : 0,
    playerSpecies = pokemonSpecies[playerPokemon.speciesKey],
    newTotalExp = playerPokemon.totalExp + finalExp,
    levelUps = getLevelUpResults(playerPokemon.speciesKey, playerSpecies.growthRate, playerPokemon.level, newTotalExp)
  if (finalExp > 0 && levelUps.length > 0) {
    const lastLevelUp = levelUps[levelUps.length - 1],
      newStats = calculatePokemonStats(playerSpecies, lastLevelUp.newLevel, playerPokemon.ivs, playerPokemon.nature),
      newMoves = levelUps.flatMap((moveId) => moveId.newMoves)
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
    })
  } else if (finalExp > 0)
    dispatch({
      type: 'APPLY_EXP',
      payload: {
        expGained: finalExp,
      },
    })

  // The other participants get their share, and (with Exp Share on) every
  // remaining battle-ready party member gets the usual cut.
  const sharedResults = []
  for (const index of participantIndices) {
    if (index === activeIndex) continue
    const member = party[index]
    if (!member) continue
    const expGained = participantExp.get(index) ?? 0
    expGained > 0 && sharedResults.push(buildSharedExpEntry(index, member, expGained))
  }
  if (hasExpShare && party.length > 1) {
    const sharedExp = Math.floor(gainedExp * expSharePartyMultiplier)
    if (sharedExp > 0)
      for (let memberIndex = 0; memberIndex < party.length; memberIndex++) {
        if (participantExp.has(memberIndex)) continue
        const member = party[memberIndex]
        if (!isBattleReady(member)) continue
        sharedResults.push(buildSharedExpEntry(memberIndex, member, sharedExp))
      }
  }
  sharedResults.length > 0 &&
    dispatch({
      type: 'APPLY_SHARED_EXP',
      payload: {
        partyExp: sharedResults,
      },
    })
}
