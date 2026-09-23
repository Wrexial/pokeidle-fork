// Battle reducer handlers. The implementation lives in game/reducer/battle/:
// events, rewards, trainer, boss, balls, effects and raid. Re-exported here so
// game/reducer.js keeps importing the handlers from one place.

export { startEncounter, executeTurn, consumeEvent } from './battle/events.js'
export { applyExp, applySharedExp, debugMaxLevel } from './battle/rewards.js'
export { startTrainerBattle, switchPlayerPokemon, trainerSendNextPokemon, trainerBattleEnd } from './battle/trainer.js'
export { startBossBattle, bossBattleEnd } from './battle/boss.js'
export { usePokeball, throwMasterBall, completeMasterBall, attemptActivityCatch } from './battle/balls.js'
export { updateVolatile, useEffectItem } from './battle/effects.js'
export { startRaid, endRaid, startTower } from './battle/raid.js'
