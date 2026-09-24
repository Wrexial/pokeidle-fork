// Shared "run a real battle headlessly" helper for the combat minigames (the
// Battle Royal and Dynamax Adventures). It builds BattlePokemon objects out of
// the player's party and loops `resolveBattleTurn` until one side faints, so a
// minigame can resolve a full fight without the main battle scene.

import { pokemonSpecies } from '../../data/gameData.js'
import { createBattlePokemon, resolveBattleTurn } from '../combat.js'

/** Hard cap so a healing / stall war can never hang a scene. */
export const GAUNTLET_MAX_TURNS = 80

/**
 * Turn a saved party Pokemon into the BattlePokemon shape `resolveBattleTurn`
 * mutates. HP carries over so a gauntlet can chain fights.
 * @param {any} pokemon
 * @param {{ isPlayer?: boolean }} [options]
 * @returns {any}
 */
export function toBattlePokemon(pokemon, options = {}) {
  return {
    speciesKey: pokemon.speciesKey,
    name: pokemon.name ?? pokemonSpecies[pokemon.speciesKey]?.name ?? pokemon.speciesKey,
    types: pokemon.types ?? pokemonSpecies[pokemon.speciesKey]?.types ?? [],
    level: pokemon.level,
    currentHp: pokemon.currentHp,
    maxHp: pokemon.maxHp,
    attack: pokemon.attack,
    defense: pokemon.defense,
    spAttack: pokemon.spAttack,
    spDefense: pokemon.spDefense,
    speed: pokemon.speed,
    moves: pokemon.moves,
    ability: pokemon.ability,
    heldItem: pokemon.heldItem ?? null,
    ivs: pokemon.ivs,
    nature: pokemon.nature,
    isShiny: pokemon.isShiny ?? false,
    formKey: null,
    statStages: {},
    isPlayer: options.isPlayer ?? false,
  }
}

/**
 * A fresh opponent for a gauntlet wave.
 * @param {string} speciesKey
 * @param {number} level
 * @param {{ perfectIvs?: boolean, isShiny?: boolean }} [options]
 * @returns {any}
 */
export function createOpponent(speciesKey, level, options = {}) {
  return createBattlePokemon(speciesKey, level, {
    wild: !0,
    perfectIvs: options.perfectIvs ?? !0,
    isShiny: options.isShiny ?? !1,
  })
}

/**
 * Resolve a single battle to the finish. Mutates both battlers (HP / status)
 * and returns the outcome plus a short log of the events that mattered.
 * @param {any} player
 * @param {any} enemy
 * @param {{
 *   maxTurns?: number, weather?: any, hazards?: any, terrain?: any,
 *   deterministic?: boolean,
 * }} [options]
 * @returns {{ won: boolean, turns: number, playerFainted: boolean, enemyFainted: boolean }}
 */
export function simulateBattle(player, enemy, options = {}) {
  const maxTurns = options.maxTurns ?? GAUNTLET_MAX_TURNS
  let turns = 0,
    playerFainted = !1,
    enemyFainted = !1
  while (turns < maxTurns && !playerFainted && !enemyFainted) {
    const events = resolveBattleTurn(
      player,
      enemy,
      !1,
      turns === 0,
      options.weather ?? null,
      options.hazards ?? null,
      options.deterministic ?? !1,
      options.terrain ?? null
    )
    turns++
    for (const event of events)
      if (event.type === 'faint' && event.data?.target === 'player') playerFainted = !0
      else if (event.type === 'faint' && event.data?.target === 'enemy') enemyFainted = !0
    if (player.currentHp <= 0) playerFainted = !0
    if (enemy.currentHp <= 0) enemyFainted = !0
  }
  return { won: enemyFainted && !playerFainted, turns, playerFainted, enemyFainted }
}
