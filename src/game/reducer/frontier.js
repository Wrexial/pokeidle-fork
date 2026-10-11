// Battle Frontier reducer handlers (#66). The panel starts a facility floor,
// which (for the Battle Factory) swaps in a rental party before the pre-battle
// heal, then the ordinary `START_HEALING` -> `COMPLETE_HEALING` path begins the
// boss battle. The end handler restores the real party and records the record.

import { buildRentalParty, frontierFacility } from '../battle-frontier.js'

/**
 * Handle the `START_FRONTIER` action: remember the chosen floor and, for the
 * Battle Factory, swap the party for a rental team (kept aside so it can be
 * restored when the battle ends).
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startFrontier(state, action) {
  const facility = frontierFacility(action.payload?.facilityId)
  if (!facility) return state
  const floor = Math.max(1, Math.floor(action.payload?.floor) || 1)
  let next = {
    ...state,
    frontierFloor: { ...(state.frontierFloor ?? {}), [facility.id]: floor },
  }
  if (facility.rule === 'rental') {
    // Never clobber an existing backup with the rental party (a stale swap
    // must not overwrite the real team).
    const rental = buildRentalParty(floor)
    next = {
      ...next,
      frontierRental: state.frontierRental ?? { facilityId: facility.id, party: state.party },
      party: rental,
      playerPokemon: rental[0] ?? state.playerPokemon,
      activePlayerPokemonIndex: 0,
    }
  }
  return next
}
