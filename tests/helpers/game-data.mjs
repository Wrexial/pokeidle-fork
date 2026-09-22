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

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** @param {string} relativePath */
function readJSON(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8'))
}

/**
 * Merge the split per-region files back into the single object the injector
 * builds (mirrors `assets/gameDataInjector.js`).
 * @param {string} dir
 * @param {string[]} regionIds
 */
function mergeRegionDir(dir, regionIds) {
  return regionIds.reduce((acc, regionId) => {
    Object.assign(acc, readJSON(`${dir}/${regionId}.json`))
    return acc
  }, /** @type {Record<string, any>} */ ({}))
}

/**
 * Install the game data globals and return the loaded data.
 * @returns {Record<string, any>}
 */
export function installGameData() {
  const regions = readJSON('public/data/regions.json'),
    regionIds = regions.map((/** @type {{ id: string }} */ region) => region.id),
    data = {
      pokemonSpecies: readJSON('public/data/pokemon-species.json'),
      breedingData: readJSON('public/data/breeding-data.json'),
      abilityData: readJSON('public/data/ability-data.json'),
      animatedSprites: readJSON('public/data/animated-sprites.json'),
      genderedSprites: readJSON('public/data/gendered-sprites.json'),
      evolutionData: readJSON('public/data/evolution-data.json'),
      moveLearnsets: readJSON('public/data/possible-learnsets.json'),
      tmLearnsets: readJSON('public/data/tm-learnsets.json'),
      trainerClasses: readJSON('public/data/trainer-classes.json'),
      moveData: readJSON('public/data/possible-moves.json'),
      mapData: mergeRegionDir('public/data/map-data', regionIds),
      mapEncounterData: mergeRegionDir('public/data/encounter-data', regionIds),
      trainerData: readJSON('public/data/trainer-data.json'),
      gymLeaderData: readJSON('public/data/gym-leader-data.json'),
      elite4Data: readJSON('public/data/elite-4-data.json'),
      championData: readJSON('public/data/champion-data.json'),
      regions,
    }
  globalThis.window = {
    gameDataInjector: { data },
    gameDataReady: Promise.resolve(data),
  }
  return data
}
