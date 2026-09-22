// Reducer handlers for pokemon actions. Split from game/reducer.js.

import { breedShinyOdds, breedShinyParentOdds, daycareEggBattles, tutorMoveCost, wonderTradeShinyOdds } from '../../data/config.js'
import { moveLearnsets, pokemonSpecies } from '../../data/gameData.js'
import { evolutionItems } from '../../data/items.js'
import { canBreed, eggHatchSteps, eggSpeciesKey, genderForPokemon, inheritBreedingTraits } from '../breeding.js'
import { calculatePokemonStats, createEgg, createPokemon, insertIntoBox, isTutorMove, judgeIVs, nextBoxSortMode, sortBoxMembers } from '../pokemon.js'
import { checkShinyOdds, formatReward, loadActivePokemonFromParty, prepareNextBattle, releaseReward } from '../progression.js'
import { advanceQuests } from '../quests.js'
import { withNotification } from '../reducer-helpers.js'

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
    } = action.payload,
    catchLevel = state.inRaid ? 60 : level,
    rolledPokemon = createPokemon(speciesKey, catchLevel, state.nextPokemonId, isShiny),
    newPokemon = gender ? { ...rolledPokemon, gender } : rolledPokemon,
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
        quests: advanceQuests(state.quests, { kind: 'catch', speciesKey, isShiny }),
        battleLog: [
          ...state.battleLog,
          `Caught ${species.name}! Added to party.`,
        ].slice(-50),
      }
    : {
        ...state,
        box: insertIntoBox(state.box, newPokemon, state.boxSort),
        nextPokemonId: state.nextPokemonId + 1,
        inventory,
        quests: advanceQuests(state.quests, { kind: 'catch', speciesKey, isShiny }),
        battleLog: [...state.battleLog, `Caught ${species.name}! Sent to box.`].slice(
          -50
        ),
      }
}

/**
 * Handle the `REORDER_PARTY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function reorderParty(state, action) {
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

/**
 * Handle the `SWAP_PARTY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function swapParty(state, action) {
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

/**
 * Handle the `PARTY_TO_BOX` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function partyToBox(state, action) {
  if (state.party.length <= 1) return state
  const { partyIndex } = action.payload
  if (partyIndex < 0 || partyIndex >= state.party.length) return state
  if (!state.party.some((member, index) => index !== partyIndex && !member.isEgg))
    return state
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

/**
 * Handle the `BOX_TO_PARTY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function boxToParty(state, action) {
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

/**
 * Handle the `SWAP_PARTY_BOX` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function swapPartyBox(state, action) {
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

/**
 * Handle the `START_EVOLUTION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startEvolution(state, action) {
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
    // Form-change items are reusable; every other evolution item is consumed.
    if (!evolutionItems[consumeItem]?.reusable)
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
      isFemale: evolvingPokemon ? genderForPokemon(evolvingPokemon) === 'female' : !1,
    },
    battleLog: [...state.battleLog, `What? ${fromSpecies.name} is evolving!`].slice(-50),
  }
}

/**
 * Handle the `EVOLUTION_STEP` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function evolutionStep(state, action) {
  return state.evolutionState
    ? {
        ...state,
        evolutionState: {
          ...state.evolutionState,
          step: action.payload.step,
        },
      }
    : state
}

/**
 * Handle the `COMPLETE_EVOLUTION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function completeEvolution(state, action) {
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
    evolveMember = /** @param {Pokemon} member */ (member) => {
      if (member.id !== pokemonId) return member
      const newStats = calculatePokemonStats(toSpecies, member.level, member.ivs, member.nature),
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
  return withNotification(
    {
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
    },
    {
      message: `${fromSpecies.name} evolved into ${toSpecies.name}!`,
      tone: 'success',
      icon: '⭐',
      dedupeKey: `evolve:${pokemonId}:${toSpeciesKey}`,
    }
  )
}

/**
 * Handle the `REORDER_BOX` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function reorderBox(state, action) {
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

/**
 * Handle the `SET_BOX_SORT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setBoxSort(state, action) {
  const boxSort = action.payload?.boxSort ?? nextBoxSortMode(state.boxSort)
  return {
    ...state,
    boxSort,
    box: sortBoxMembers(state.box, boxSort),
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

/**
 * Handle the `WONDER_TRADE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function wonderTrade(state, action) {
  // Spend a Link Cable to swap a Pokemon for a random one of the same level.
  const { pokemonId } = action.payload,
    linkCables = state.inventory.linkCable ?? 0
  if (linkCables <= 0) return state
  const inBox = state.box.some((member) => member.id === pokemonId),
    inParty = state.party.some((member) => member.id === pokemonId)
  if (!inBox && !inParty) return state
  if (inParty && state.party.length <= 1) return state
  if (
    inParty &&
    !state.party.some((member) => member.id !== pokemonId && !member.isEgg)
  )
    return state
  const tradedPokemon = inBox
    ? state.box.find((member) => member.id === pokemonId)
    : state.party.find((member) => member.id === pokemonId)
  if (!tradedPokemon) return state
  if (tradedPokemon.favourite) return state
  const candidates = Object.keys(pokemonSpecies).filter((key) => pokemonSpecies[key].id > 0),
    receivedSpeciesKey = candidates[Math.floor(Math.random() * candidates.length)],
    // Undocumented perk: trading a shiny guarantees a shiny back.
    receivedIsShiny = tradedPokemon.isShiny || checkShinyOdds(wonderTradeShinyOdds),
    receivedPokemon = createPokemon(
      receivedSpeciesKey,
      tradedPokemon.level,
      state.nextPokemonId,
      receivedIsShiny
    )
  // Remove the traded Pokemon (mirroring RELEASE_POKEMON).
  let baseState
  if (inBox)
    baseState = {
      ...state,
      box: state.box.filter((member) => member.id !== pokemonId),
    }
  else {
    const releasedState = state.phase === 'battling' ? prepareNextBattle(state) : state,
      newParty = releasedState.party.filter((member) => member.id !== pokemonId),
      activeId = releasedState.playerPokemon?.id
    let newActiveIndex = activeId ? newParty.findIndex((member) => member.id === activeId) : 0
    if (newActiveIndex < 0) newActiveIndex = 0
    baseState = loadActivePokemonFromParty({
      ...releasedState,
      party: newParty,
      activePlayerPokemonIndex: newActiveIndex,
    })
  }
  return {
    ...baseState,
    box: [...baseState.box, receivedPokemon],
    nextPokemonId: state.nextPokemonId + 1,
    inventory: {
      ...state.inventory,
      linkCable: linkCables - 1,
    },
    pokedexSeen: state.pokedexSeen.includes(receivedSpeciesKey)
      ? state.pokedexSeen
      : [...state.pokedexSeen, receivedSpeciesKey],
    pokedexCaught: state.pokedexCaught.includes(receivedSpeciesKey)
      ? state.pokedexCaught
      : [...state.pokedexCaught, receivedSpeciesKey],
    shinySeen:
      receivedIsShiny && !state.shinySeen.includes(receivedSpeciesKey)
        ? [...state.shinySeen, receivedSpeciesKey]
        : state.shinySeen,
    shinyCaught:
      receivedIsShiny && !state.shinyCaught.includes(receivedSpeciesKey)
        ? [...state.shinyCaught, receivedSpeciesKey]
        : state.shinyCaught,
    battleLog: [
      ...state.battleLog,
      `Wonder Trade: ${tradedPokemon.name} was traded for ${receivedPokemon.name}${
        receivedIsShiny ? ' \u2726 shiny!' : ''
      }!`,
    ].slice(-50),
    // Hand the phase to the Wonder Trade animation, which returns to
    // whatever phase the trade interrupted once it finishes.
    phase: 'wonderTrade',
    wonderTradeState: {
      sentPokemon: tradedPokemon,
      receivedPokemon,
      receivedSpeciesKey,
      receivedIsShiny,
      returnPhase: baseState.phase || 'idle',
    },
  }
}

/**
 * Handle the `COMPLETE_WONDER_TRADE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function completeWonderTrade(state, action) {
  if (state.phase !== 'wonderTrade' || !state.wonderTradeState) return state
  return {
    ...state,
    phase: state.wonderTradeState.returnPhase || 'idle',
    wonderTradeState: null,
  }
}

/**
 * Handle the `DEPOSIT_DAYCARE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function depositDaycare(state, action) {
  const { pokemonId } = action.payload
  if (state.daycare.parents.length >= 2) return state
  const deposited = state.box.find((member) => member.id === pokemonId)
  if (!deposited || state.daycare.parents.some((parent) => parent.id === pokemonId)) return state
  return {
    ...state,
    box: state.box.filter((member) => member.id !== pokemonId),
    daycare: {
      ...state.daycare,
      parents: [...state.daycare.parents, deposited],
    },
  }
}

/**
 * Handle the `WITHDRAW_DAYCARE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function withdrawDaycare(state, action) {
  const { pokemonId } = action.payload,
    parent = state.daycare.parents.find((member) => member.id === pokemonId)
  if (!parent) return state
  return {
    ...state,
    box: insertIntoBox(state.box, parent, state.boxSort),
    daycare: {
      ...state.daycare,
      parents: state.daycare.parents.filter((member) => member.id !== pokemonId),
    },
  }
}

/**
 * Handle the `HATCH_DAYCARE_EGG` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function hatchDaycareEgg(state, action) {
  const { parents, progress } = state.daycare
  if (parents.length < 2 || progress < daycareEggBattles) return state
  if (!canBreed(parents)) return state
  const baseSpeciesKey = eggSpeciesKey(parents)
  if (!baseSpeciesKey) return state
  const shinyParent = parents.some((parent) => parent.isShiny),
    egg = createEgg(
      baseSpeciesKey,
      state.nextPokemonId,
      checkShinyOdds(shinyParent ? breedShinyParentOdds : breedShinyOdds),
      eggHatchSteps(baseSpeciesKey),
      inheritBreedingTraits(parents, baseSpeciesKey)
    ),
    toParty = state.party.length < 6
  return withNotification(
    {
      ...state,
      ...(toParty
        ? { party: [...state.party, egg] }
        : { box: insertIntoBox(state.box, egg, state.boxSort) }),
      nextPokemonId: state.nextPokemonId + 1,
      daycare: { ...state.daycare, progress: 0 },
      battleLog: [
        ...state.battleLog,
        toParty
          ? 'The Daycare found an Egg! It joined your party \u2014 battle to hatch it.'
          : 'The Daycare found an Egg! It was sent to your box.',
      ].slice(-50),
    },
    {
      message: toParty
        ? 'The Daycare found an Egg! Carry it in your party to hatch it.'
        : 'The Daycare found an Egg! It was sent to your box.',
      tone: 'success',
      icon: '\ud83e\udd5a',
      dedupeKey: `egg:${state.nextPokemonId}`,
    }
  )
}
