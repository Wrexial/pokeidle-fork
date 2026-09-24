// In-battle Mega Evolution. Sets the volatile form so the battle loop rebuilds
// the active Pokemon into its Mega forme with the forme's stats, types and
// ability. The change is battle-only and reverts when the battle ends.

import { pokemonSpecies } from '../../../data/gameData.js'
import { chooseMegaForm, megaAbility, megaEvolveReady } from '../../../data/mega-evolution.js'
import { createVolatileState } from '../../combat.js'
import { withNotification } from '../../reducer-helpers.js'

/**
 * Handle the `MEGA_EVOLVE` action. Only a Mega Stone holder that can still
 * transform this battle is allowed.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function megaEvolve(state, action) {
  if (state.phase !== 'battling' || !megaEvolveReady(state)) return state
  const pokemon = state.playerPokemon
  if (!pokemon) return state
  const formKey = chooseMegaForm(pokemon.speciesKey, pokemon)
  if (!formKey) return state
  const form = pokemonSpecies[formKey],
    volatile = state.playerVolatile ?? createVolatileState(),
    ability = megaAbility(formKey)
  return withNotification(
    {
      ...state,
      playerVolatile: {
        ...volatile,
        formKey,
        abilityOverride: ability ?? volatile.abilityOverride ?? null,
      },
      battleLog: [
        ...state.battleLog,
        `${pokemon.name} Mega Evolved into ${form?.name ?? formKey}!`,
      ].slice(-50),
    },
    {
      message: `${pokemon.name} Mega Evolved!`,
      tone: 'shiny',
      icon: '\u2728',
      dedupeKey: `mega:${pokemon.id}`,
      cooldown: 15000,
    }
  )
}
