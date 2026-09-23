// Battle math entry point. The implementation lives in game/combat/: type
// chart and damage (damage), status/volatile effects (status, volatile),
// move choice (ai) and turn resolution (turn). Re-exported here so callers
// keep importing from game/combat.js.

export { createVolatileState, volatileStateFromBattle, getStatStage, clampStatStage, getStatLabel } from './combat/volatile.js'
export { getTypeEffectiveness, getTypeMultiplier, statStageMultiplier, calculateDamage, estimateMoveDamage } from './combat/damage.js'
export { chooseBestMove, chooseMoveForBattle, chooseRandomMove } from './combat/ai.js'
export { createBattlePokemon, applyBattleForm, changeBattleForm, battleSpecies } from './combat/setup.js'
export { resolveBattleTurn } from './combat/turn.js'
