// Wonder Trade and its completion. Split from game/reducer/pokemon.js.

import { wonderTradeShinyOdds } from '../../../data/config.js'
import { pokemonSpecies } from '../../../data/gameData.js'
import { createPokemon } from '../../pokemon.js'
import { checkShinyOdds, loadActivePokemonFromParty, prepareNextBattle } from '../../progression.js'

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
