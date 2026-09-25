// Evolution start, step and completion. Split from game/reducer/pokemon.js.

import { moveLearnsets, pokemonSpecies } from '../../../data/gameData.js'
import { evolutionItems } from '../../../data/items.js'
import { genderForPokemon } from '../../breeding.js'
import { calculatePokemonStats } from '../../pokemon.js'
import { prepareNextBattle } from '../../progression.js'
import { withNotification } from '../../reducer-helpers.js'

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
      isForm,
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
      isForm: !!isForm,
      isShiny: evolvingPokemon?.isShiny ?? !1,
      isFemale: evolvingPokemon ? genderForPokemon(evolvingPokemon) === 'female' : !1,
    },
    battleLog: [
      ...state.battleLog,
      isForm
        ? `What? ${fromSpecies.name} is changing form!`
        : `What? ${fromSpecies.name} is evolving!`,
    ].slice(-50),
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
      isForm,
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
        isForm
          ? `${fromSpecies.name} changed into ${toSpecies.name}!`
          : `Congratulations! ${fromSpecies.name} evolved into ${toSpecies.name}!`,
      ].slice(-50),
    },
    {
      message: isForm
        ? `${fromSpecies.name} changed into ${toSpecies.name}!`
        : `${fromSpecies.name} evolved into ${toSpecies.name}!`,
      tone: 'success',
      icon: isForm ? '\ud83d\udd04' : '\u2b50',
      dedupeKey: `evolve:${pokemonId}:${toSpeciesKey}`,
    }
  )
}
