/**
 * Game Data Loader
 * 
 * Loads all game data from JSON files instead of hardcoded values.
 * This allows data to be edited without re-bundling the application.
 */

let gameData = {
  pokemonSpecies: null,
  evolutionData: null,
  moveLearnsets: null,
  trainerClasses: null
};

/**
 * Load all game data from JSON files
 */
export async function loadGameData() {
  try {
    const [species, evolution, moves, trainers] = await Promise.all([
      fetch('/data/pokemon-species.json').then(r => r.json()),
      fetch('/data/evolution-data.json').then(r => r.json()),
      fetch('/data/move-learnsets.json').then(r => r.json()),
      fetch('/data/trainer-classes.json').then(r => r.json())
    ]);

    gameData.pokemonSpecies = species;
    gameData.evolutionData = evolution;
    gameData.moveLearnsets = moves;
    gameData.trainerClasses = trainers;

    console.log('✅ Game data loaded successfully');
    return gameData;
  } catch (error) {
    console.error('❌ Failed to load game data:', error);
    console.warn('⚠️ Game may not function properly without data files');
    throw error;
  }
}

/**
 * Get loaded game data
 */
export function getGameData() {
  return gameData;
}

/**
 * Get Pokemon species data by key
 */
export function getPokemonSpecies(speciesKey) {
  if (!gameData.pokemonSpecies) {
    console.warn('Pokemon data not loaded yet');
    return null;
  }
  return gameData.pokemonSpecies[speciesKey];
}

/**
 * Get evolution data for a species
 */
export function getEvolutionData(speciesKey) {
  if (!gameData.evolutionData) {
    console.warn('Evolution data not loaded yet');
    return null;
  }
  return gameData.evolutionData[speciesKey];
}

/**
 * Get move learnset for a species
 */
export function getMoveLearnset(speciesKey) {
  if (!gameData.moveLearnsets) {
    console.warn('Move data not loaded yet');
    return null;
  }
  return gameData.moveLearnsets[speciesKey];
}

/**
 * Get trainer class mapping
 */
export function getTrainerClasses() {
  if (!gameData.trainerClasses) {
    console.warn('Trainer data not loaded yet');
    return null;
  }
  return gameData.trainerClasses;
}
