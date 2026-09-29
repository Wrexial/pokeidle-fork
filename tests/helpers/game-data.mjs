// Shared test helper: loads the real public/data JSON into the
// `window.gameDataInjector` shape that src/data/gameData.js awaits, so the game
// modules can be import()ed under Node.
//
// `installGameData()` MUST run before importing any src/game module, because
// src/data/gameData.js reads the globals during its own top-level evaluation.
// Use dynamic imports in tests:
//
//   import { installGameData } from './helpers/game-data.mjs'
//   installGameData()
//   const { gameReducer } = await import('../src/game/reducer.js')

export { installGameData } from '../../tools/lib/game-data.mjs'
