// Daycare deposit/withdraw and egg hatching. Split from game/reducer/pokemon.js.

import { breedShinyOdds, breedShinyParentOdds, daycareEggBattles } from '../../../data/config.js'
import { mapData } from '../../../data/gameData.js'
import { canBreed, eggHatchSteps, eggSpeciesKey, inheritBreedingTraits, masudaShinyOddsFor } from '../../breeding.js'
import { createEgg, insertIntoBox } from '../../pokemon.js'
import { checkShinyOdds } from '../../progression.js'
import { prestigeMultipliers } from '../../prestige.js'
import { withNotification } from '../../reducer-helpers.js'

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
    // The Masuda method (two parents from different regions) beats the plain
    // shiny-parent boost when it applies.
    masudaOdds = masudaShinyOddsFor(parents),
    shinyOdds = masudaOdds ?? (shinyParent ? breedShinyParentOdds : breedShinyOdds),
    // The Incubation prestige perk shortens the hatch.
    hatchSteps = Math.max(
      1,
      Math.round(eggHatchSteps(baseSpeciesKey) / prestigeMultipliers(state).hatch)
    ),
    egg = {
      ...createEgg(
        baseSpeciesKey,
        state.nextPokemonId,
        checkShinyOdds(shinyOdds),
        hatchSteps,
        inheritBreedingTraits(parents, baseSpeciesKey)
      ),
      // Eggs are native to the region their Daycare is in.
      originRegion: mapData[state.currentLocation]?.region ?? state.startRegion,
    },
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
