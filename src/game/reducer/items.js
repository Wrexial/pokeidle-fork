// Reducer handlers for items actions. Split from game/reducer.js.

import { encounterData, pokemonSpecies } from '../../data/gameData.js'
import { activeItems, consumableItems, heldItems, pokeBalls } from '../../data/items.js'
import { natureName, randomNature } from '../../data/natures.js'
import { MAX_FRIENDSHIP, calculatePokemonStats, calculateRequiredExperience, gainFriendship, getLevelUpResults } from '../pokemon.js'
import { isActiveEffectItem } from '../progression.js'

/**
 * Handle the `BUY_ITEM` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function buyItem(state, action) {
  const { itemId, quantity } = action.payload,
    ball = pokeBalls[itemId]
  if (ball && ball.buyPrice) {
    const cost = ball.buyPrice * quantity
    if (state.money < cost) return state
    const owned = state.inventory[itemId] ?? 0,
      // Buying balls earns free Premier Balls: one per full 10 bought.
      premierBonus = Math.floor(quantity / 10),
      inventory = {
        ...state.inventory,
        [itemId]: owned + quantity,
        ...(premierBonus > 0
          ? { premierball: (state.inventory.premierball ?? 0) + premierBonus }
          : {}),
      }
    return {
      ...state,
      money: state.money - cost,
      inventory,
      battleLog: [
        ...state.battleLog,
        `Bought ${quantity}x ${ball.name}!`,
        ...(premierBonus > 0
          ? [`Obtained ${premierBonus}x Premier Ball!`]
          : []),
      ].slice(-50),
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

/**
 * Handle the `SELL_ITEM` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function sellItem(state, action) {
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

/**
 * Handle the `CLEAR_HELD_ITEM` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function clearHeldItem(state, action) {
  const { pokemonId } = action.payload,
    partyIndex = state.party.findIndex(/** @param {Pokemon} member */ (member) => member.id === pokemonId),
    fromParty = partyIndex >= 0,
    boxIndex = fromParty
      ? -1
      : state.box.findIndex(/** @param {Pokemon} member */ (member) => member.id === pokemonId)
  if (!fromParty && boxIndex < 0) return state
  const member = fromParty ? state.party[partyIndex] : state.box[boxIndex]
  if (!member.heldItem) return state
  const updated = { ...member, heldItem: null },
    replace = /** @param {Pokemon} candidate */ (candidate) =>
      candidate.id === pokemonId ? updated : candidate
  return {
    ...state,
    party: fromParty ? state.party.map(replace) : state.party,
    box: fromParty ? state.box : state.box.map(replace),
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

/**
 * Handle the `USE_ITEM_ON_POKEMON` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function useItemOnPokemon(state, action) {
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
  let member = { ...state.party[memberIndex] },
    // Candies can be applied several at a time; everything else is one shot.
    consumed = 1
  const log = []
  if (item.friendship) {
    if ((member.friendship ?? 0) >= MAX_FRIENDSHIP) return state
    member.friendship = gainFriendship(member, item.friendship)
    log.push(`${member.name} loved the ${item.name}!`)
  } else if (item.natureMint) {
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
    const requested = Math.min(
        owned,
        Math.max(1, Math.floor(action.payload.quantity ?? 1))
      ),
      startLevel = member.level
    let used = 0
    // Apply one candy per loop so a big stack stops exactly at level 100 and
    // only the candies actually used are consumed.
    while (used < requested && member.level < 100) {
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
      }
      used++
    }
    if (used === 0) return state
    consumed = used
    if (member.level > startLevel)
      log.push(
        used > 1
          ? `${member.name} grew to level ${member.level} using ${used}x ${item.name}!`
          : `${member.name} grew to level ${member.level}!`
      )
    else log.push(`${member.name} gained EXP!`)
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
      [itemId]: owned - consumed,
    },
    battleLog: [...state.battleLog, ...log].slice(-50),
  }
}

/**
 * Handle the `BUY_REWARD_ITEM` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function buyRewardItem(state, action) {
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

/**
 * Handle the `SET_CATCH_RULE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setCatchRule(state, action) {
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

/**
 * Handle the `TOGGLE_ROUTE_CATCH_ALL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleRouteCatchAll(state, action) {
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

/**
 * Handle the `TOGGLE_AUTO_CATCH` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleAutoCatch(state, action) {
  return {
    ...state,
    autoCatch: !state.autoCatch,
  }
}

/**
 * Handle the `SET_ALWAYS_CATCH_SHINIES` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setAlwaysCatchShinies(state, action) {
  return {
    ...state,
    alwaysCatchShinies: action.payload.value,
  }
}
