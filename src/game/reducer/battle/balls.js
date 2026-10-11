// // Poké Ball use, the Master Ball sequence and its completion. Split from game/reducer/battle.js.

import { RAID_LEVEL_MAX } from '../../../data/config.js'
import { mapData, pokemonSpecies } from '../../../data/gameData.js'
import { ballOrder } from '../../../data/items.js'
import {
  attemptCatch,
  isCaveLocation,
  isNightTime,
  isWaterLocation,
  selectAutoCatchBall,
  selectBestBall,
} from '../../catching.js'
import { createPokemon, insertIntoBox, syncObtainedRibbons } from '../../pokemon.js'
import { isHoneyActive, prepareNextBattle } from '../../progression.js'
import { creditResearchLarge, isLargeSpecimen } from '../../research.js'
import { markCaught, markShinyCaught } from '../collection.js'
import { catchPokemon } from '../pokemon/management.js'
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
 * Handle the `ATTEMPT_CATCH` action. A manual ball throw at a wild Pokemon
 * that a route activity hooked or flushed out: it uses the configured
 * auto-catch ball, falling back to the best owned ball, and on success ends
 * the battle with the catch (keeping the wild's IVs / ability / held item).
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function attemptActivityCatch(state, action) {
  const enemy = state.enemyPokemon
  if (state.phase !== 'battling' || !enemy || enemy.noCatch || state.trainerBattle || state.bossBattle) return state
  // Don't let a manual throw resolve an enemy the current turn may have already
  // knocked out (its faint event is still queued). Ending the battle here would
  // let the loop's victory handler catch the same Pokemon a second time.
  if (state.pendingEvents.length > 0) return state
  const catchContext = {
      level: enemy.level,
      types: pokemonSpecies[enemy.speciesKey]?.types ?? [],
      alreadyCaught: state.pokedexCaught.includes(enemy.speciesKey),
      turn: state.battleTurn ?? 1,
      isWater: isWaterLocation(mapData[state.currentLocation]),
      isCave: isCaveLocation(mapData[state.currentLocation]),
      isNight: isNightTime(),
      honey: isHoneyActive(state.activeEffects, state.currentRoute, enemy.speciesKey),
    },
    ballId =
      selectAutoCatchBall(state, state.currentRoute, enemy.speciesKey, catchContext) ??
      selectBestBall(enemy.speciesKey, ballOrder, state.inventory, catchContext)
  if (!ballId)
    return {
      ...state,
      battleLog: [...state.battleLog, 'You have no Poke Balls to throw!'].slice(-50),
    }
  const name = pokemonSpecies[enemy.speciesKey]?.name ?? enemy.speciesKey
  if (!attemptCatch(enemy.speciesKey, ballId, catchContext))
    return {
      ...state,
      inventory: { ...state.inventory, [ballId]: (state.inventory[ballId] ?? 0) - 1 },
      battleLog: [...state.battleLog, `You threw a ball \u2014 ${name} broke free!`].slice(-50),
    }
  let next = catchPokemon(state, {
    type: 'CATCH_POKEMON',
    payload: {
      speciesKey: enemy.speciesKey,
      level: state.inRaid ? 60 : enemy.level,
      pokeballUsed: ballId,
      isShiny: enemy.isShiny,
      ivs: enemy.ivs,
      heldItem: enemy.heldItem,
      ability: enemy.ability,
    },
  })
  next = markCaught(next, { type: 'MARK_CAUGHT', payload: { speciesKey: enemy.speciesKey } })
  if (enemy.isShiny)
    next = markShinyCaught(next, {
      type: 'MARK_SHINY_CAUGHT',
      payload: { speciesKey: enemy.speciesKey },
    })
  next = prepareNextBattle(next)
  return withNotification(next, {
    message: `Gotcha! ${name} was caught!`,
    tone: 'success',
    icon: '\ud83d\udd34',
    dedupeKey: `activitycatch:${enemy.speciesKey}`,
  })
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
    state.enemyPokemon.noCatch ||
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
    caughtPokemon = syncObtainedRibbons(
      createPokemon(
        speciesKey,
        state.inRaid ? 60 : enemy.level,
        state.nextPokemonId,
        enemy.isShiny
      ),
      { isNewSpecies, isShiny: enemy.isShiny }
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
  // An XL catch counts toward the "large specimen" research task.
  if (isLargeSpecimen(caughtPokemon)) caughtState = creditResearchLarge(caughtState, speciesKey)
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
