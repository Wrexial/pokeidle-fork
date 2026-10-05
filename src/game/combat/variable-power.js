// Variable-power moves. The extracted move table stores these with power 0 (or
// a placeholder), so the real base power is computed from the two battlers just
// before damage is rolled: weight (Heat Crash, Low Kick), speed (Electro Ball,
// Gyro Ball), HP (Flail, Eruption, Wring Out), boosts (Stored Power,
// Punishment) and friendship (Return, Frustration).

import { pokemonSpecies } from '../../data/gameData.js'

/**
 * Sum of a battler's positive stat stages.
 * @param {any} pokemon
 */
function positiveStages(pokemon) {
  return Object.values(pokemon.statStages ?? {}).reduce(
    (total, stage) => total + Math.max(0, stage || 0),
    0
  )
}

/**
 * Heat Crash / Heavy Slam: heavier user relative to the target is stronger.
 * @param {number} userWeight
 * @param {number} targetWeight
 */
function weightPower(userWeight, targetWeight) {
  if (userWeight <= 0 || targetWeight <= 0) return 40
  const ratio = targetWeight / userWeight
  if (ratio <= 0.2) return 120
  if (ratio <= 0.25) return 100
  if (ratio <= 1 / 3) return 80
  if (ratio <= 0.5) return 60
  return 40
}

/**
 * Low Kick / Grass Knot scale off the target's weight (kg).
 * @param {number} targetWeight
 */
function targetWeightPower(targetWeight) {
  if (targetWeight >= 200) return 120
  if (targetWeight >= 100) return 100
  if (targetWeight >= 50) return 80
  if (targetWeight >= 25) return 60
  if (targetWeight >= 10) return 40
  return 20
}

/**
 * Flail / Reversal: stronger the lower the user's remaining HP.
 * @param {number} currentHp
 * @param {number} maxHp
 */
function flailPower(currentHp, maxHp) {
  const p = Math.floor((48 * currentHp) / Math.max(1, maxHp))
  if (p <= 1) return 200
  if (p <= 4) return 150
  if (p <= 9) return 100
  if (p <= 16) return 80
  return 40
}

/** @param {string} speciesKey */
function weightOf(speciesKey) {
  return pokemonSpecies[speciesKey]?.weight ?? 0
}

/**
 * The effective base power of a variable-power move, or null when the move is
 * not variable.
 * @param {string} moveId
 * @param {any} attacker
 * @param {any} defender
 * @param {{ terrain?: { type: string } | null, movedFirst?: boolean }} [options]
 * @returns {number | null}
 */
export function variablePower(moveId, attacker, defender, options = {}) {
  const terrainType = options.terrain?.type ?? null,
    movedFirst = options.movedFirst
  switch (moveId) {
    case 'heatCrash':
    case 'heavySlam':
      return weightPower(weightOf(attacker.speciesKey), weightOf(defender.speciesKey))
    case 'lowKick':
    case 'grassKnot':
      return targetWeightPower(weightOf(defender.speciesKey))
    case 'electroBall': {
      const ratio = defender.speed / Math.max(1, attacker.speed)
      if (ratio <= 0.25) return 150
      if (ratio <= 1 / 3) return 120
      if (ratio <= 0.5) return 80
      if (ratio < 1) return 60
      return 40
    }
    case 'gyroBall':
      return Math.min(150, Math.floor((25 * defender.speed) / Math.max(1, attacker.speed)) + 1)
    case 'flail':
    case 'reversal':
      return flailPower(attacker.currentHp, attacker.maxHp)
    case 'eruption':
    case 'waterSpout':
    case 'dragonEnergy':
      return Math.max(1, Math.floor((150 * attacker.currentHp) / Math.max(1, attacker.maxHp)))
    case 'crushGrip':
    case 'wringOut':
      return Math.max(1, Math.floor((120 * defender.currentHp) / Math.max(1, defender.maxHp)))
    case 'return':
      return Math.max(1, Math.min(102, Math.floor((attacker.friendship ?? 70) / 2.5)))
    case 'frustration':
      return Math.max(
        1,
        Math.min(102, Math.floor((255 - (attacker.friendship ?? 70)) / 2.5))
      )
    case 'storedPower':
    case 'powerTrip':
      return 20 + 20 * positiveStages(attacker)
    case 'punishment':
      return Math.min(200, 60 + 20 * positiveStages(defender))
    // Conditionals: double power when the relevant condition holds.
    case 'facade':
      return attacker.status ? 140 : 70
    case 'hex':
      return defender.status ? 130 : 65
    case 'venoshock':
      return defender.status === 'poison' || defender.status === 'toxic' ? 130 : 65
    case 'brine':
      return defender.currentHp <= defender.maxHp / 2 ? 130 : 65
    case 'wakeUpSlap':
      return defender.status === 'sleep' ? 140 : 70
    case 'smellingSalts':
      return defender.status === 'paralysis' ? 140 : 70
    // Retaliate doubles when a party member has fainted.
    case 'retaliate':
      return (attacker.faintedAllies ?? 0) > 0 ? 140 : 70
    // Terrain-boosted moves.
    case 'mistyExplosion':
      return terrainType === 'misty' ? 150 : 100
    case 'expandingForce':
      return terrainType === 'psychic' ? 120 : 80
    case 'risingVoltage':
      return terrainType === 'electric' ? 140 : 70
    // Turn-order conditionals: double when the user moves first (Bolt Beak,
    // Fishious Rend) or when the foe has already moved (Payback, Avalanche,
    // Revenge).
    case 'boltBeak':
    case 'fishiousRend':
      return movedFirst === true ? 170 : 85
    case 'payback':
      return movedFirst === false ? 100 : 50
    case 'avalanche':
    case 'revenge':
      return movedFirst === false ? 120 : 60
    default:
      return null
  }
}

/**
 * Move ids the resolver above handles, for the UI / reference page.
 * @type {Set<string>}
 */
export const VARIABLE_POWER_MOVES = new Set([
  'heatCrash',
  'heavySlam',
  'lowKick',
  'grassKnot',
  'electroBall',
  'gyroBall',
  'flail',
  'reversal',
  'eruption',
  'waterSpout',
  'dragonEnergy',
  'crushGrip',
  'wringOut',
  'return',
  'frustration',
  'storedPower',
  'powerTrip',
  'punishment',
  'facade',
  'hex',
  'venoshock',
  'brine',
  'wakeUpSlap',
  'smellingSalts',
  'retaliate',
  'mistyExplosion',
  'expandingForce',
  'risingVoltage',
  'boltBeak',
  'fishiousRend',
  'payback',
  'avalanche',
  'revenge',
])

/**
 * Return `move` with its power filled in when it is a variable-power move.
 * @param {string} moveId
 * @param {any} attacker
 * @param {any} defender
 * @param {Move} move
 * @param {{ terrain?: { type: string } | null, movedFirst?: boolean }} [options]
 * @returns {Move}
 */
export function withVariablePower(moveId, attacker, defender, move, options = {}) {
  const power = variablePower(moveId, attacker, defender, options)
  return power == null ? move : { ...move, power }
}
