// // Party/box sync and the battle-to-battle transition helpers. Split from game/progression.js.

import { pokerusChance, pokerusDurationBattles } from '../../data/config.js'
import { emptyBattleHazards } from '../hazards.js'
import { isBattleReady, resolvePokemonMoves } from '../pokemon.js'

/**
 * @param {GameState} state
 * @returns {number}
 */
export function getActivePartyIndex(state) {
  return state.activePlayerPokemonIndex
}

/**
 * @param {GameState} state
 * @returns {GameState}
 */
export function syncActivePokemonIntoParty(state) {
  if (!state.playerPokemon || state.party.length === 0) return state
  const activeIndex = getActivePartyIndex(state),
    activePokemon = state.playerPokemon,
    party = [...state.party]
  if (activeIndex >= 0 && activeIndex < party.length && party[activeIndex].id === activePokemon.id)
    return (
      (party[activeIndex] = activePokemon),
      {
        ...state,
        party,
      }
    )
  const existingIndex = party.findIndex((member) => member.id === activePokemon.id)
  return existingIndex >= 0
    ? ((party[existingIndex] = activePokemon),
      {
        ...state,
        party,
        activePlayerPokemonIndex: existingIndex,
      })
    : state
}

/**
 * @param {GameState} state
 * @returns {GameState}
 */
export function loadActivePokemonFromParty(state) {
  if (state.party.length === 0) return state
  const activeIndex = getActivePartyIndex(state)
  return activeIndex >= 0 && activeIndex < state.party.length
    ? {
        ...state,
        playerPokemon: state.party[activeIndex],
      }
    : {
        ...state,
        playerPokemon: state.party[0],
        activePlayerPokemonIndex: 0,
      }
}

/** @returns {Partial<GameState>} */
export function createIdleBattleState() {
  return {
    phase: 'idle',
    enemyPokemon: null,
    battleEvents: [],
    pendingEvents: [],
    currentEventIndex: 0,
    battleTurn: 0,
    weather: null,
    terrain: null,
    battleHazards: emptyBattleHazards(),
    trainerBattle: null,
    bossBattle: null,
    bossQueue: [],
    activePlayerPokemonIndex: 0,
    playerVolatile: null,
    battleParticipants: [],
    playerTurnSpent: !1,
    enemyTurnSpent: !1,
  }
}

/**
 * Nuzlocke: release any party Pokemon that fainted. Never releases the last
 * fighter, so a full wipe can't leave the player with nothing.
 * @param {GameState} state
 * @returns {GameState}
 */
export function releaseFaintedParty(state) {
  if (!state.challengeNuzlocke) return state
  const fainted = state.party.filter(
      (member) => !member.isEgg && (member.currentHp ?? 0) <= 0
    ),
    survivors = state.party.filter((member) => member.isEgg || (member.currentHp ?? 0) > 0)
  if (fainted.length === 0 || survivors.length === 0) return state
  const lostIds = new Set(fainted.map((member) => member.id)),
    party = state.party.filter((member) => !lostIds.has(member.id)),
    // Keep pointing at the same Pokemon after the removals.
    activeId = state.playerPokemon?.id,
    found = activeId ? party.findIndex((member) => member.id === activeId) : -1,
    activePlayerPokemonIndex =
      found >= 0
        ? found
        : Math.min(state.activePlayerPokemonIndex, Math.max(0, party.length - 1))
  return {
    ...state,
    party,
    activePlayerPokemonIndex,
    playerPokemon: party[activePlayerPokemonIndex] ?? state.playerPokemon,
    battleLog: [
      ...state.battleLog,
      ...fainted.map((member) => `Nuzlocke: ${member.name} fainted and was released.`),
    ].slice(-50),
  }
}

/**
 * @param {GameState} state
 * @returns {GameState}
 */
export function prepareNextBattle(state) {
  const released = releaseFaintedParty(syncActivePokemonIntoParty(state)),
    firstAliveIndex = released.party.findIndex((member) => isBattleReady(member)),
    nextIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0
  return {
    ...released,
    ...createIdleBattleState(),
    activePlayerPokemonIndex: nextIndex,
    playerPokemon: released.party[nextIndex] || released.playerPokemon,
  }
}

/**
 * @param {ActiveEffect[]} effects
 * @returns {ActiveEffect[]}
 */
export function tickBattleCounters(effects) {
  return effects
    .map((effect) => ({
      ...effect,
      battlesRemaining: effect.battlesRemaining - 1,
    }))
    .filter((effect) => effect.battlesRemaining > 0)
}

/**
 * Advance every egg in a party by one won wild battle. Only eggs carried in the
 * party progress; all of them tick together and any that reach zero hatch.
 * @param {Pokemon[]} party
 * @returns {{ party: Pokemon[], hatched: Pokemon[] }}
 */
export function tickPartyEggs(party) {
  let /** @type {Pokemon[]} */ hatched = [],
    changed = false
  const nextParty = party.map((member) => {
    if (!member.isEgg) return member
    changed = true
    const remaining = (member.eggStepsRemaining ?? 1) - 1
    if (remaining > 0) return { ...member, eggStepsRemaining: remaining }
    const hatchedMember = {
      ...member,
      isEgg: false,
      eggStepsRemaining: 0,
      moves: resolvePokemonMoves(member.speciesKey, member.level || 1),
    }
    hatched.push(hatchedMember)
    return hatchedMember
  })
  return { party: changed ? nextParty : party, hatched }
}

/**
 * Advance the Pokerus over one won wild battle: infect very rarely when
 * healthy, count down while infected, and cure at zero. Kept pure (apart from
 * the rarity roll) so the reducer and the tests can share it.
 * @param {{ battlesRemaining: number } | null | undefined} pokerus
 * @returns {{ pokerus: { battlesRemaining: number } | null, infected: boolean, cured: boolean }}
 */
export function tickPokerus(pokerus) {
  if (pokerus) {
    const battlesRemaining = pokerus.battlesRemaining - 1
    return battlesRemaining > 0
      ? { pokerus: { battlesRemaining }, infected: false, cured: false }
      : { pokerus: null, infected: false, cured: true }
  }
  return Math.random() < pokerusChance
    ? { pokerus: { battlesRemaining: pokerusDurationBattles }, infected: true, cured: false }
    : { pokerus: null, infected: false, cured: false }
}

/** EXP multiplier while the party has Pokerus (2x), otherwise 1x. */

/** @param {{ battlesRemaining: number } | null | undefined} pokerus */
export function pokerusExpMultiplier(pokerus) {
  return pokerus ? 2 : 1
}
