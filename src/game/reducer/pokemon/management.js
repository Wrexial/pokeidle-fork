// Catching, nicknaming, moves, favourites and releasing. Split from game/reducer/pokemon.js.

import { tutorMoveCost } from '../../../data/config.js'
import { pokemonSpecies } from '../../../data/gameData.js'
import { createPokemon, insertIntoBox, isTutorMove, judgeIVs } from '../../pokemon.js'
import { formatReward, loadActivePokemonFromParty, prepareNextBattle, releaseReward } from '../../progression.js'
import { advanceQuests } from '../../quests.js'
import { withNotification } from '../../reducer-helpers.js'

/**
 * Handle the `RELEASE_DUPLICATES` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function releaseDuplicates(state, action) {
  /** A favourite or shiny is never auto-released. */
  const protectedMember = /** @param {any} member */ (member) =>
      member.favourite || member.isShiny,
    /** @type {Map<string, any[]>} */
    bySpecies = new Map()
  for (const member of state.box) {
    const list = bySpecies.get(member.speciesKey) ?? []
    list.push(member)
    bySpecies.set(member.speciesKey, list)
  }
  /** @type {any[]} */
  const toRelease = []
  for (const members of bySpecies.values()) {
    const candidates = members.filter((member) => !protectedMember(member))
    if (candidates.length === 0) continue
    if (members.some((member) => protectedMember(member))) {
      // A protected copy already exists, so every plain duplicate goes.
      toRelease.push(...candidates)
    } else {
      // Otherwise keep the best (highest IV total, then level).
      const sorted = [...candidates].sort(
        (left, right) =>
          judgeIVs(right.ivs).total - judgeIVs(left.ivs).total || right.level - left.level
      )
      toRelease.push(...sorted.slice(1))
    }
  }
  if (toRelease.length === 0) return state
  const releaseIds = new Set(toRelease.map((member) => member.id))
  let money = state.money
  const inventory = { ...state.inventory },
    rewardItems = /** @type {Record<string, number>} */ ({})
  for (const member of toRelease) {
    const reward = releaseReward(member)
    money += reward.money
    for (const [itemId, quantity] of Object.entries(reward.items)) {
      inventory[itemId] = (inventory[itemId] ?? 0) + quantity
      rewardItems[itemId] = (rewardItems[itemId] ?? 0) + quantity
    }
  }
  const rewardText = formatReward({ money: money - state.money, items: rewardItems })
  return withNotification(
    {
      ...state,
      box: state.box.filter((member) => !releaseIds.has(member.id)),
      money,
      inventory,
      battleLog: [
        ...state.battleLog,
        `Released ${toRelease.length} duplicate Pokemon and received ${rewardText}.`,
      ].slice(-50),
    },
    {
      message: `Released ${toRelease.length} duplicate${toRelease.length === 1 ? '' : 's'}: +${rewardText}`,
      tone: 'info',
      icon: '🎁',
      dedupeKey: `duplicates:${Date.now()}`,
    }
  )
}

/**
 * Handle the `RELEASE_HATCHLING` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function releaseHatchling(state, action) {
  const { pokemonId } = action.payload,
    inParty = state.party.some((member) => member.id === pokemonId),
    hatchling =
      state.hatchResult?.id === pokemonId
        ? state.hatchResult
        : state.party.find((member) => member.id === pokemonId) ??
          state.box.find((member) => member.id === pokemonId),
    reward = hatchling ? releaseReward(hatchling) : { money: 0, items: {} },
    inventory = { ...state.inventory }
  for (const [itemId, quantity] of Object.entries(reward.items))
    inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  const newParty = inParty
      ? state.party.filter((member) => member.id !== pokemonId)
      : state.party,
    activeId = state.playerPokemon?.id,
    activeIndex = activeId ? newParty.findIndex((member) => member.id === activeId) : 0
  const releasedState = loadActivePokemonFromParty({
    ...state,
    party: newParty,
    box: state.box.filter((member) => member.id !== pokemonId),
    hatchResult: state.hatchResult?.id === pokemonId ? null : state.hatchResult,
    money: state.money + reward.money,
    inventory,
    activePlayerPokemonIndex: Math.max(0, activeIndex),
    battleLog: [...state.battleLog, 'The newly hatched Pokemon was released.'].slice(-50),
  })
  return hatchling
    ? withNotification(releasedState, {
        message: `Released the hatchling: +${formatReward(reward)}`,
        tone: 'info',
        icon: '🎁',
        dedupeKey: `release:${pokemonId}`,
        cooldown: 5000,
      })
    : releasedState
}

/**
 * Handle the `CLEAR_HATCH_RESULT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function clearHatchResult(state, action) {
  return {
    ...state,
    hatchResult: null,
  }
}

/**
 * Handle the `SET_MOVES` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setMoves(state, action) {
  const { pokemonId, moves } = action.payload
  if (
    !Array.isArray(moves) ||
    moves.length < 1 ||
    moves.length > 4 ||
    new Set(moves).size !== moves.length
  )
    return state
  // `pokemonId` targets a specific party/box member (the panel can be open
  // while the active Pokemon changes). Fall back to the active one for any
  // legacy callers that don't pass an id.
  const targetId = pokemonId ?? state.playerPokemon?.id
  if (!targetId) return state
  const updateMoves = /** @param {Pokemon} member */ (member) =>
    member.id === targetId ? { ...member, moves } : member,
    target =
      state.party.find((member) => member.id === targetId) ??
      state.box.find((member) => member.id === targetId)
  if (!target) return state
  // Move Tutor TM moves cost money when they're newly taught.
  const knownMoves = new Set(target.moves ?? []),
    tutorMoves = moves.filter(
      (moveId) => !knownMoves.has(moveId) && isTutorMove(target.speciesKey, moveId)
    ),
    tutorCost = tutorMoves.length * tutorMoveCost
  if (tutorCost > state.money) return state
  const playerPokemon =
    state.playerPokemon && state.playerPokemon.id === targetId
      ? { ...state.playerPokemon, moves }
      : state.playerPokemon
  return {
    ...state,
    money: state.money - tutorCost,
    battleLog: tutorCost
      ? [
          ...state.battleLog,
          `Taught ${tutorMoves.length} move${tutorMoves.length > 1 ? 's' : ''} for $${tutorCost.toLocaleString()}.`,
        ].slice(-50)
      : state.battleLog,
    party: state.party.map(updateMoves),
    box: state.box.map(updateMoves),
    playerPokemon,
  }
}

/**
 * Handle the `TOGGLE_FAVOURITE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleFavourite(state, action) {
  const { pokemonId } = action.payload,
    toggle = /** @param {any} member */ (member) =>
      member.id === pokemonId ? { ...member, favourite: !member.favourite } : member,
    player = state.playerPokemon
  if (
    !state.party.some((member) => member.id === pokemonId) &&
    !state.box.some((member) => member.id === pokemonId)
  )
    return state
  return {
    ...state,
    party: state.party.map(toggle),
    box: state.box.map(toggle),
    playerPokemon:
      player && player.id === pokemonId
        ? { ...player, favourite: !player.favourite }
        : player,
  }
}

/**
 * Handle the `SET_NICKNAME` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setNickname(state, action) {
  const { pokemonId, nickname } = action.payload,
    cleaned = typeof nickname === 'string' ? nickname.trim().slice(0, 12) : '',
    rename = /** @param {any} member */ (member) =>
      member.id === pokemonId ? { ...member, nickname: cleaned || void 0 } : member
  if (
    !state.party.some((member) => member.id === pokemonId) &&
    !state.box.some((member) => member.id === pokemonId)
  )
    return state
  const player = state.playerPokemon
  return {
    ...state,
    party: state.party.map(rename),
    box: state.box.map(rename),
    playerPokemon:
      player && player.id === pokemonId
        ? { ...player, nickname: cleaned || void 0 }
        : player,
  }
}

/**
 * Handle the `CATCH_POKEMON` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function catchPokemon(state, action) {
  const {
      speciesKey,
      level,
      pokeballUsed,
      isShiny,
      gender,
      ivs,
      heldItem,
      ability,
    } = action.payload,
    catchLevel = state.inRaid ? 60 : level,
    // Keep the wild Pokemon's IVs when the caller passes them, so a caught
    // Pokemon is the one you actually battled.
    rolledPokemon = createPokemon(
      speciesKey,
      catchLevel,
      state.nextPokemonId,
      isShiny,
      ivs ? { ivs } : undefined
    ),
    species = pokemonSpecies[speciesKey]
  let newPokemon = gender ? { ...rolledPokemon, gender } : rolledPokemon
  if (heldItem) newPokemon = { ...newPokemon, heldItem }
  if (ability) newPokemon = { ...newPokemon, ability }
  let inventory = state.inventory
  if (pokeballUsed) {
    const ownedCount = inventory[pokeballUsed] ?? 0
    ownedCount > 0 &&
      (inventory = {
        ...inventory,
        [pokeballUsed]: ownedCount - 1,
      })
  }
  // Catching a static overworld Pokemon (Snorlax, Sudowoodo, ...) claims it so
  // it never respawns. Fainting or fleeing leaves it available to retry.
  const staticId = state.enemyPokemon?.staticId,
    claimedGifts =
      staticId && !(state.claimedGifts ?? []).includes(staticId)
        ? [...(state.claimedGifts ?? []), staticId]
        : state.claimedGifts
  return state.party.length < 6
    ? {
        ...state,
        party: [...state.party, newPokemon],
        claimedGifts,
        nextPokemonId: state.nextPokemonId + 1,
        inventory,
        quests: advanceQuests(state.quests, { kind: 'catch', speciesKey, isShiny }),
        battleLog: [
          ...state.battleLog,
          `Caught ${species.name}! Added to party.`,
        ].slice(-50),
      }
    : {
        ...state,
        box: insertIntoBox(state.box, newPokemon, state.boxSort),
        claimedGifts,
        nextPokemonId: state.nextPokemonId + 1,
        inventory,
        quests: advanceQuests(state.quests, { kind: 'catch', speciesKey, isShiny }),
        battleLog: [...state.battleLog, `Caught ${species.name}! Sent to box.`].slice(
          -50
        ),
      }
}

/**
 * Handle the `RELEASE_POKEMON` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function releasePokemon(state, action) {
  const { pokemonId, source } = action.payload
  if (source === 'box' && !state.box.some((member) => member.id === pokemonId)) return state
  if (source !== 'box' && (state.party.length <= 1 || !state.party.some((member) => member.id === pokemonId)))
    return state
  // Never leave the party with no Pokemon that can actually fight (e.g. all eggs).
  if (
    source !== 'box' &&
    !state.party.some((member) => member.id !== pokemonId && !member.isEgg)
  )
    return state
  const released =
    source === 'box'
      ? state.box.find((member) => member.id === pokemonId)
      : state.party.find((member) => member.id === pokemonId)
  if (!released || released.favourite) return state
  const reward = releaseReward(released),
    inventory = { ...state.inventory }
  for (const [itemId, quantity] of Object.entries(reward.items))
    inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  const applyReward = /** @param {GameState} nextState */ (nextState) =>
    withNotification(
      {
        ...nextState,
        money: state.money + reward.money,
        inventory,
        battleLog: [
          ...state.battleLog,
          `Released ${released.name} and received ${formatReward(reward)}.`,
        ].slice(-50),
      },
      {
        message: `Released ${released.name}: +${formatReward(reward)}`,
        tone: 'info',
        icon: '🎁',
        dedupeKey: `release:${pokemonId}`,
        cooldown: 5000,
      }
    )
  if (source === 'box')
    return applyReward({
      ...state,
      box: state.box.filter((member) => member.id !== pokemonId),
    })
  const baseState = state.phase === 'battling' ? prepareNextBattle(state) : state,
    newParty = baseState.party.filter((member) => member.id !== pokemonId),
    activeId = baseState.playerPokemon?.id
  let newActiveIndex = activeId ? newParty.findIndex((member) => member.id === activeId) : 0
  newActiveIndex < 0 && (newActiveIndex = 0)
  return applyReward(
    loadActivePokemonFromParty({
      ...baseState,
      party: newParty,
      activePlayerPokemonIndex: newActiveIndex,
    })
  )
}
