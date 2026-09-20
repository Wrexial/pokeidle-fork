/**
 * Game Data Injector
 * 
 * This script initializes the game data from external JSON files
 * and makes it available to the bundled application before it loads.
 * 
 * Usage: Include this script in index.html BEFORE loading the main app bundle:
 * <script src="/assets/gameDataInjector.js"></script>
 * <script type="module" src="/assets/index.js"></script>
 */

const dataFilesToLoad = [
    { key: 'pokemonSpecies', path: '/data/pokemon-species.json', label: 'Pokémon species' },
    { key: 'evolutionData', path: '/data/evolution-data.json', label: 'evolution chains' },
    { key: 'moveLearnsets', path: '/data/possible-learnsets.json', label: 'move learnsets' },//move-learnsets
    { key: 'trainerClasses', path: '/data/trainer-classes.json', label: 'trainer classes' },
    { key: 'moveData', path: '/data/possible-moves.json', label: 'move data' }, //move-data
    { key: 'mapData', path: '/data/map-data.json', label: 'map data' },
    { key: 'mapEncounterData', path: '/data/encounter-data.json', label: 'encounter data' },
    { key: 'trainerData', path: '/data/trainer-data.json', label: 'trainer data' },
    { key: 'gymLeaderData', path: '/data/gym-leader-data.json', label: 'gym leader data' },
    { key: 'elite4Data', path: '/data/elite-4-data.json', label: 'elite 4 data' },
    { key: 'championData', path: '/data/champion-data.json', label: 'champion data' },
    { key: 'regions', path: '/data/regions.json', label: 'regions' },
];

class GameDataInjector {
  constructor() {
    this.data = {};
    this.isLoading = true;
    this.error = null;
    
    // Expose to window for global access
    this.waitPromise = new Promise((resolve, reject) => {
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
    });
    window.gameDataInjector = {
      data: this.data,
      isLoading: () => this.isLoading,
      isError: () => this.error !== null,
      getError: () => this.error,
      getPokemonSpecies: (key) => this.data.pokemonSpecies?.[key],
      getEvolutionData: (key) => this.data.evolutionData?.[key],
      getMoveLearnset: (key) => this.data.moveLearnsets?.[key],
      getTrainerClasses: () => this.data.trainerClasses,
      waitForData: () => this.waitPromise
    };
  }

  async load() {
    try {
      console.log('📦 Loading game data...');
      
      const dataPromises = dataFilesToLoad.map(fileInfo =>
        fetch(fileInfo.path).then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText} for ${fileInfo.path}`);
          }
          return response.json();
        })
      );

      const loadedData = await Promise.all(dataPromises);

      this.data = dataFilesToLoad.reduce((acc, fileInfo, index) => {
        acc[fileInfo.key] = loadedData[index];
        return acc;
      }, {});

      window.gameDataInjector.data = this.data;

      console.log('✅ Game data loaded successfully');
      dataFilesToLoad.forEach(fileInfo => {
        const data = this.data[fileInfo.key];
        console.log(`   📦 Loaded ${Object.keys(data).length} ${fileInfo.label}`);
      });

      this.isLoading = false;
      this.resolvePromise(this.data);
      return this.data;

    } catch (error) {
      this.error = error;
      console.error('❌ Failed to load game data:', error.message);
      
      // Log detailed error info
      console.error('Error details:', {
        type: error.name,
        message: error.message,
        stack: error.stack
      });
      
      this.isLoading = false;
      this.rejectPromise(error);
      throw error;
    }
  }
}

// Create injector and start loading immediately
const injector = new GameDataInjector();
const dataLoadPromise = injector.load();

// Make promise available globally so app can wait for it
window.gameDataReady = dataLoadPromise;

// Also expose injector for debugging
window.gameDataDebug = {
  injector,
  getAllData: () => injector.data,
  getPokemon: (name) => injector.data.pokemonSpecies?.[name],
  getEvolutions: (name) => injector.data.evolutionData?.[name],
  getMoves: (name) => injector.data.moveLearnsets?.[name],
  getTrainers: () => injector.data.trainerClasses,
  status: () => ({
    loaded: !injector.isLoading,
    hasError: injector.error !== null,
    error: injector.error?.message
  })
};

console.log('💾 Game Data Injector initialized');
console.log('   Use window.gameDataDebug for debugging');
