// In-battle Gigantamax. A Pokemon that ate the Max Mushroom carries the
// Gigantamax Factor (`pokemon.gmax`), and transforms as the battle starts. Like
// Mega Evolution, the change lives on `playerVolatile.formKey`, so the battle
// loop rebuilds the active Pokemon into its G-Max forme and it reverts when the
// battle ends.

import { pokemonSpecies } from '../../../data/gameData.js'
import { gmaxEvolveReady, gmaxFormFor, megaAbility } from '../../../data/mega-evolution.js'
import { createVolatileState } from '../../combat.js'

/**
 * Handle the `GMAX_EVOLVE` action. Only a Pokemon with the Gigantamax Factor
 * that can still transform this battle is allowed.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function gmaxEvolve(state, action) {
  if (state.phase !== 'battling' || !gmaxEvolveReady(state)) return state
  const pokemon = state.playerPokemon
  if (!pokemon) return state
  const formKey = gmaxFormFor(pokemon.speciesKey)
  if (!formKey) return state
  const form = pokemonSpecies[formKey],
    volatile = state.playerVolatile ?? createVolatileState(),
    ability = megaAbility(formKey)
  return {
    ...state,
    playerVolatile: {
      ...volatile,
      formKey,
      abilityOverride: ability ?? volatile.abilityOverride ?? null,
    },
    battleLog: [
      ...state.battleLog,
      `${pokemon.name} Gigantamaxed into ${form?.name ?? formKey}!`,
    ].slice(-50),
  }
}
