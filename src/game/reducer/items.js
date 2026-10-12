// Reducer handlers for items actions. Split from game/reducer.js.

import { abilityData, encounterData, moveData, pokemonSpecies } from '../../data/gameData.js'
import { activeItems, consumableItems, fossilItems, heldItems, pokeBalls } from '../../data/items.js'
import { canGigantamax } from '../../data/mega-evolution.js'
import { natureName, randomNature } from '../../data/natures.js'
import { EV_MAX_PER_STAT, EV_MAX_TOTAL, EV_VITAMIN_GAIN } from '../../data/config.js'
import { isPlantableBerry } from '../garden.js'
import { MAX_FRIENDSHIP, IV_STAT_ORDER, IV_STAT_LABELS, abilityDisplayName, applyMoveLearning, calculatePokemonStats, calculateRequiredExperience, createEmptyEvs, gainFriendship, getLevelUpResults, totalEvs } from '../pokemon.js'
import { getItemSellPrice, isActiveEffectItem } from '../progression.js'
import { queueKurtCraft, readyKurtCrafts } from '../kurt.js'
import { withNotification } from '../reducer-helpers.js'
import { creditResearchFeed } from '../research.js'
import { markCaught } from './collection.js'
import { catchPokemon } from './pokemon/management.js'

/** The only place a fossil can be revived. */
export const FOSSIL_REVIVE_LOCATION = 'cinnabarIsland'

/**
 * The party member's lowest IV stat, used by a Bottle Cap (ties keep the first).
 * @param {Pokemon} member
 * @returns {string}
 */
function lowestIvStat(member) {
  return IV_STAT_ORDER.reduce(
    (lowest, stat) => ((member.ivs?.[stat] ?? 0) < (member.ivs?.[lowest] ?? 0) ? stat : lowest),
    IV_STAT_ORDER[0]
  )
}

/**
 * Handle the `REVIVE_FOSSIL` action: consume a fossil at Cinnabar Island and
 * add the Pokemon it revives (one revive per fossil).
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function reviveFossil(state, action) {
  const itemId = action.payload?.itemId,
    fossil = fossilItems[itemId]
  if (!fossil || state.currentLocation !== FOSSIL_REVIVE_LOCATION) return state
  if ((state.inventory[itemId] ?? 0) <= 0) return state
  const species = pokemonSpecies[fossil.speciesKey]
  if (!species) return state
  let next = {
    ...state,
    inventory: { ...state.inventory, [itemId]: state.inventory[itemId] - 1 },
  }
  next = catchPokemon(next, {
    type: 'CATCH_POKEMON',
    payload: { speciesKey: fossil.speciesKey, level: fossil.level },
  })
  next = markCaught(next, {
    type: 'MARK_CAUGHT',
    payload: { speciesKey: fossil.speciesKey },
  })
  return withNotification(
    {
      ...next,
      battleLog: [
        ...next.battleLog,
        `Revived ${species.name} from the ${fossil.name}!`,
      ].slice(-50),
    },
    {
      message: `Revived ${species.name}!`,
      tone: 'success',
      icon: '\u{1f9b4}',
      dedupeKey: `fossil:${fossil.speciesKey}`,
    }
  )
}

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
 * Handle the `BUY_CAFE_ITEM` action: buy a drink from a cafe menu at the menu's
 * own price (the item's default `buyPrice` is usually null, so a normal mart
 * would not stock it).
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function buyCafeItem(state, action) {
  const { itemId, quantity = 1, price } = action.payload ?? {},
    item = consumableItems[itemId] ?? heldItems[itemId]
  if (!item || !Number.isFinite(price) || price <= 0) return state
  const count = Math.max(1, Math.floor(quantity)),
    cost = price * count
  if (state.money < cost) return state
  return {
    ...state,
    money: state.money - cost,
    inventory: {
      ...state.inventory,
      [itemId]: (state.inventory[itemId] ?? 0) + count,
    },
    battleLog: [...state.battleLog, `Bought ${count}x ${item.name} at the cafe!`].slice(-50),
  }
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
    sellPrice = getItemSellPrice(itemId),
    owned = state.inventory[itemId] ?? 0
  if (!item || sellPrice == null || owned <= 0) return state
  const sold = Math.min(quantity, owned),
    earned = sellPrice * sold
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
      // Using an item mid-battle costs the player's action for the turn.
      playerTurnSpent: state.phase === 'battling' ? !0 : state.playerTurnSpent,
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
      nextNature,
      member.evs
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
  } else if (item.grantsGmax) {
    if (member.gmax || !canGigantamax(member.speciesKey)) return state
    member = { ...member, gmax: true }
    log.push(`${member.name} gained the Gigantamax Factor!`)
  } else if (item.ivTraining) {
    const targets = item.ivTraining === 'all' ? IV_STAT_ORDER : [lowestIvStat(member)],
      nextIvs = { ...member.ivs }
    let changed = false
    for (const stat of targets)
      if ((nextIvs[stat] ?? 0) < 31) {
        nextIvs[stat] = 31
        changed = true
      }
    if (!changed) return state
    const newStats = calculatePokemonStats(
        pokemonSpecies[member.speciesKey],
        member.level,
        nextIvs,
        member.nature,
        member.evs
      ),
      hpGain = Math.max(0, newStats.hp - member.maxHp)
    member = {
      ...member,
      // Keep the pre-training IVs so breeding can't pass the boost down.
      naturalIvs: member.naturalIvs ?? { ...member.ivs },
      ivs: nextIvs,
      maxHp: newStats.hp,
      currentHp: Math.min(newStats.hp, member.currentHp + hpGain),
      attack: newStats.attack,
      defense: newStats.defense,
      spAttack: newStats.spAttack,
      spDefense: newStats.spDefense,
      speed: newStats.speed,
    }
    log.push(`${member.name} was hyper-trained!`)
  } else if (item.abilityChange) {
    const entry = abilityData[member.speciesKey],
      normals = entry?.abilities ?? [],
      hidden = entry?.hidden ?? null,
      currentIndex = normals.indexOf(member.ability ?? ''),
      // A Capsule cycles the normal abilities (from a hidden/unknown ability it
      // lands on the first normal one); a Patch toggles the hidden ability.
      candidate =
        item.abilityChange === 'capsule'
          ? normals.length < 2
            ? null
            : currentIndex === -1
              ? normals[0]
              : normals[(currentIndex + 1) % normals.length]
          : !hidden
            ? null
            : member.ability === hidden
              ? (normals[0] ?? null)
              : hidden,
      nextAbility = /** @type {string | null} */ (candidate)
    if (!nextAbility || nextAbility === member.ability) return state
    member.ability = nextAbility
    log.push(`${member.name}'s ability became ${abilityDisplayName(nextAbility)}!`)
  } else if (item.evvitamin) {
    // Vitamins are the only source of EVs. Each adds a flat amount to one
    // stat, capped per-stat and in total, and several can be fed at once.
    const stat = item.evvitamin,
      requested = Math.max(1, Math.floor(action.payload.quantity ?? 1)),
      evs = { ...createEmptyEvs(), ...(member.evs ?? {}) }
    // Feeding several at once tops the stat up to the per-stat cap (and stops
    // at the total cap), consuming only the vitamins actually used.
    let applies = 0
    while (applies < requested && applies < owned && evs[stat] < EV_MAX_PER_STAT) {
      const totalNow = totalEvs(evs)
      if (totalNow >= EV_MAX_TOTAL) break
      const gain = Math.min(EV_VITAMIN_GAIN, EV_MAX_PER_STAT - evs[stat], EV_MAX_TOTAL - totalNow)
      evs[stat] += gain
      applies++
    }
    if (applies <= 0) return state
    const newStats = calculatePokemonStats(
        pokemonSpecies[member.speciesKey],
        member.level,
        member.ivs,
        member.nature,
        evs
      ),
      hpGain = Math.max(0, newStats.hp - member.maxHp)
    member = {
      ...member,
      evs,
      maxHp: newStats.hp,
      currentHp: Math.min(newStats.hp, member.currentHp + hpGain),
      attack: newStats.attack,
      defense: newStats.defense,
      spAttack: newStats.spAttack,
      spDefense: newStats.spDefense,
      speed: newStats.speed,
    }
    consumed = applies
    log.push(
      applies > 1
        ? `${member.name} used ${applies}x ${item.name} \u2014 ${IV_STAT_LABELS[stat] ?? stat} EVs are now ${evs[stat]}/${EV_MAX_PER_STAT}.`
        : `${member.name}'s ${IV_STAT_LABELS[stat] ?? stat} EVs rose to ${evs[stat]}/${EV_MAX_PER_STAT}!`
    )
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
          newStats = calculatePokemonStats(
            species,
            lastLevelUp.newLevel,
            member.ivs,
            member.nature,
            member.evs
          ),
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
        const learning = applyMoveLearning(
          member.speciesKey,
          member.moves,
          levelUps.flatMap((levelUp) => levelUp.newMoves),
          member.eggMoves
        )
        member.moves = learning.moves
        for (const moveId of learning.learned)
          log.push(`${member.name} learned ${moveData[moveId]?.name ?? moveId}!`)
        for (const moveId of learning.forgotten)
          log.push(`${member.name} forgot ${moveData[moveId]?.name ?? moveId} to make room.`)
        for (const moveId of learning.pending)
          log.push(
            `${member.name} wants to learn ${moveData[moveId]?.name ?? moveId} — make room in Manage Moves.`
          )
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
  // Field research: feeding the species a berry is one of its research tasks
  // for the Pokemon that have no wild route to study (Legends: Arceus style).
  const fedState = isPlantableBerry(itemId)
    ? creditResearchFeed(state, member.speciesKey)
    : state
  return {
    ...fedState,
    party,
    playerPokemon:
      state.activePlayerPokemonIndex === memberIndex ? member : state.playerPokemon,
    inventory: {
      ...state.inventory,
      [itemId]: owned - consumed,
    },
    // Using an item mid-battle costs the player's action for the turn.
    playerTurnSpent: state.phase === 'battling' ? !0 : state.playerTurnSpent,
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
 * Handle the `SET_DEFAULT_CATCH_RULE` action: change the catch rule that
 * applies on every route the player has not customised, straight from Settings.
 * Only the fields present in the payload change, and unknown balls are dropped
 * so a stale UI can't enable a ball the auto-catcher can't throw.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setDefaultCatchRule(state, action) {
  const incoming = action.payload?.rule
  if (!incoming || typeof incoming !== 'object') return state
  const base = state.globalCatchDefaults
  return {
    ...state,
    globalCatchDefaults: {
      ...base,
      mode: typeof incoming.mode === 'string' ? incoming.mode : base.mode,
      levelThreshold:
        typeof incoming.levelThreshold === 'number' && incoming.levelThreshold > 0
          ? Math.min(100, Math.floor(incoming.levelThreshold))
          : base.levelThreshold,
      enabledBalls: (() => {
        if (!Array.isArray(incoming.enabledBalls)) return base.enabledBalls
        const valid = incoming.enabledBalls.filter(
          /** @param {string} ballId */ (ballId) => pokeBalls[ballId]
        )
        // Keep at least one ball enabled, or the auto-catcher has nothing to throw.
        return valid.length > 0 ? valid : base.enabledBalls
      })(),
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

/**
 * Handle the `CRAFT_APRICORN_BALL` action: hand Kurt (Azalea Town) an Apricorn,
 * which he carves over a few wild wins (see `collectKurtBalls`).
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function craftApricornBall(state, action) {
  const apricornId = action.payload?.apricornId,
    apricorn = consumableItems[apricornId],
    ballId = apricorn?.kurtBall,
    owned = state.inventory[apricornId] ?? 0
  if (!ballId || !pokeBalls[ballId] || owned <= 0) return state
  return withNotification(
    {
      ...state,
      inventory: {
        ...state.inventory,
        [apricornId]: owned - 1,
      },
      kurtCrafts: queueKurtCraft(state.kurtCrafts, apricornId),
      battleLog: [
        ...state.battleLog,
        `Kurt took the ${apricorn.name} \u2014 come back after a few battles.`,
      ].slice(-50),
    },
    {
      message: `Kurt started on your ${pokeBalls[ballId].name}.`,
      tone: 'info',
      icon: '\u{1f528}',
      dedupeKey: `kurtcraft:${apricornId}:${Date.now()}`,
    }
  )
}

/**
 * Handle the `COLLECT_KURT_BALLS` action: pick up every ball Kurt has finished.
 * @param {GameState} state
 * @returns {GameState}
 */
export function collectKurtBalls(state) {
  const ready = readyKurtCrafts(state.kurtCrafts)
  if (ready.length === 0) return state
  const inventory = { ...state.inventory }
  for (const craft of ready) inventory[craft.ballId] = (inventory[craft.ballId] ?? 0) + 1
  return withNotification(
    {
      ...state,
      inventory,
      kurtCrafts: (state.kurtCrafts ?? []).filter((craft) => craft.battlesRemaining > 0),
      battleLog: [
        ...state.battleLog,
        `Collected ${ready.length} ball${ready.length === 1 ? '' : 's'} from Kurt.`,
      ].slice(-50),
    },
    {
      message: `Kurt finished ${ready.length} ball${ready.length === 1 ? '' : 's'}!`,
      tone: 'success',
      icon: '\u{1f534}',
      dedupeKey: `kurtcollect:${Date.now()}`,
    }
  )
}
