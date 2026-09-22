// // Poké Ball use, the Master Ball sequence and its completion. Split from game/reducer/battle.js.

import { RAID_LEVEL_MAX } from '../../../data/config.js'
import { pokemonSpecies } from '../../../data/gameData.js'
import { createPokemon, insertIntoBox } from '../../pokemon.js'
import { prepareNextBattle } from '../../progression.js'
import { withNotification } from '../../reducer-helpers.js'

/**
 * Handle the `USE_POKEBALL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function usePokeball(state, action) {
  const { pokeballId } = action.payload,
    owned = state.inventory[pokeballId] ?? 0
  return owned <= 0
    ? state
    : {
        ...state,
        inventory: {
          ...state.inventory,
          [pokeballId]: owned - 1,
        },
      }
}

/**
 * Handle the `THROW_MASTER_BALL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function throwMasterBall(state, action) {
  // Only a live wild encounter (raids included) can be hit, and only when
  // the battle has settled enough to throw. Trainer and boss teams are not
  // catch rewards, so they are excluded.
  if (
    state.phase !== 'battling' ||
    !state.enemyPokemon ||
    state.trainerBattle ||
    state.bossBattle ||
    (state.inventory.masterball ?? 0) <= 0
  )
    return state
  const targetName =
    pokemonSpecies[state.enemyPokemon.speciesKey]?.name ?? 'the wild Pokemon'
  return {
    ...state,
    phase: 'catching',
    // Drop any pending turn events: the catch ends the battle immediately,
    // so stale damage/animation events must not play over the scene.
    pendingEvents: [],
    battleEvents: [],
    inventory: {
      ...state.inventory,
      masterball: state.inventory.masterball - 1,
    },
    battleLog: [
      ...state.battleLog,
      `You threw a Master Ball at ${targetName}!`,
    ].slice(-50),
  }
}

/**
 * Handle the `COMPLETE_MASTER_BALL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function completeMasterBall(state, action) {
  if (state.phase !== 'catching' || !state.enemyPokemon) return state
  const enemy = state.enemyPokemon,
    speciesKey = enemy.speciesKey,
    speciesName = pokemonSpecies[speciesKey]?.name ?? speciesKey,
    isNewSpecies = !state.pokedexCaught.includes(speciesKey),
    caughtPokemon = createPokemon(
      speciesKey,
      state.inRaid ? 60 : enemy.level,
      state.nextPokemonId,
      enemy.isShiny
    )
  let caughtState = /** @type {GameState} */ ({
    ...state,
    nextPokemonId: state.nextPokemonId + 1,
    pokedexSeen: state.pokedexSeen.includes(speciesKey)
      ? state.pokedexSeen
      : [...state.pokedexSeen, speciesKey],
    pokedexCaught: state.pokedexCaught.includes(speciesKey)
      ? state.pokedexCaught
      : [...state.pokedexCaught, speciesKey],
    shinySeen:
      enemy.isShiny && !state.shinySeen.includes(speciesKey)
        ? [...state.shinySeen, speciesKey]
        : state.shinySeen,
    shinyCaught:
      enemy.isShiny && !state.shinyCaught.includes(speciesKey)
        ? [...state.shinyCaught, speciesKey]
        : state.shinyCaught,
    battleLog: [...state.battleLog, `Gotcha! ${speciesName} was caught!`].slice(-50),
  })
  caughtState =
    state.party.length < 6
      ? { ...caughtState, party: [...state.party, caughtPokemon] }
      : { ...caughtState, box: insertIntoBox(state.box, caughtPokemon, state.boxSort) }
  caughtState = prepareNextBattle(caughtState)
  if (state.inRaid)
    caughtState = {
      ...caughtState,
      raidLevel: Math.min(caughtState.raidLevel + 1, RAID_LEVEL_MAX),
    }
  caughtState = withNotification(caughtState, {
    message: isNewSpecies
      ? `${speciesName} was registered in the Pok\u00e9dex!`
      : `${speciesName} was caught again.`,
    tone: isNewSpecies ? 'success' : 'info',
    icon: isNewSpecies ? '\ud83d\udcd5' : '\ud83d\udd34',
    dedupeKey: isNewSpecies ? `caught:${speciesKey}` : `repeat:${speciesKey}`,
    ...(isNewSpecies ? {} : { cooldown: 15000 }),
  })
  if (enemy.isShiny)
    caughtState = withNotification(caughtState, {
      message: `Shiny ${speciesName} was caught!`,
      tone: 'shiny',
      icon: '\ud83c\udf1f',
      dedupeKey: `shinycaught:${speciesKey}`,
    })
  return caughtState
}
