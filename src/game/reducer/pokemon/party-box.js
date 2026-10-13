// Party and box ordering/swapping. Split from game/reducer/pokemon.js.

import { insertIntoBox, sortBoxMembers } from '../../pokemon.js'
import { loadActivePokemonFromParty, prepareNextBattle } from '../../progression.js'

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
 * Handle the `BANK_DEPOSIT` action: take a Pokemon out of the save's party or
 * box so the Pokemon Bank can hold it. The bank blob itself is written by
 * game/bank.js; this reducer only removes the individual from the save.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function bankDeposit(state, action) {
  const { pokemonId, source } = action.payload ?? {}
  if (source === 'party') {
    if (state.party.length <= 1) return state
    const index = state.party.findIndex((member) => member.id === pokemonId)
    if (index < 0) return state
    // Always leave at least one non-egg Pokemon able to battle.
    if (!state.party.some((member, memberIndex) => memberIndex !== index && !member.isEgg))
      return state
    const baseState = state.phase === 'battling' ? prepareNextBattle(state) : state,
      party = baseState.party.filter((member) => member.id !== pokemonId),
      activeId = baseState.playerPokemon?.id,
      newActiveIndex = activeId ? party.findIndex((member) => member.id === activeId) : 0
    return loadActivePokemonFromParty({
      ...baseState,
      party,
      activePlayerPokemonIndex: Math.max(0, newActiveIndex),
    })
  }
  if (!state.box.some((member) => member.id === pokemonId)) return state
  return {
    ...state,
    box: state.box.filter((member) => member.id !== pokemonId),
  }
}

/**
 * Handle the `BANK_WITHDRAW` action: add a repaired bank Pokemon to the box.
 * The individual is re-keyed to the destination save's id sequence so a bank
 * Pokemon can never collide with an existing individual in the new save.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function bankWithdraw(state, action) {
  const { pokemon } = action.payload ?? {}
  if (!pokemon || !pokemon.speciesKey) return state
  const id = String(state.nextPokemonId),
    nextPokemonId = state.nextPokemonId + 1
  return {
    ...state,
    box: insertIntoBox(state.box, { ...pokemon, id }, state.boxSort),
    nextPokemonId,
  }
}

/**
 * Handle the `SET_BOX_SORT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setBoxSort(state, action) {
  const boxSort = action.payload?.boxSort ?? state.boxSort
  return {
    ...state,
    boxSort,
    box: sortBoxMembers(state.box, boxSort),
  }
}
