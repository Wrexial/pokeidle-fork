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

class GameDataInjector {
  constructor() {
    this.data = {};
    this.isLoading = true;
    this.error = null;
    
    // Expose to window for global access
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
      
      // Load all data files in parallel
      const [pokemonSpecies, evolutionData, moveLearnsets, trainerClasses, moveData] = await Promise.all([
        fetch('/data/pokemon-species.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          return r.json();
        }),
        fetch('/data/evolution-data.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          return r.json();
        }),
        fetch('/data/move-learnsets.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          return r.json();
        }),
        fetch('/data/trainer-classes.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          return r.json();
        }),
        fetch('/data/move-data.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          return r.json();
        })
      ]);

      // Store data
      this.data = {
        pokemonSpecies,
        evolutionData,
        moveLearnsets,
        trainerClasses,
        moveData,
      };

      window.gameDataInjector.data = this.data;

      console.log('✅ Game data loaded successfully');
      console.log(`   📊 Loaded ${Object.keys(pokemonSpecies).length} Pokémon species`);
      console.log(`   🔄 Loaded ${Object.keys(evolutionData).length} evolution chains`);
      console.log(`   🎯 Loaded ${Object.keys(moveLearnsets).length} move learnsets`);
      console.log(`   👥 Loaded ${Object.keys(trainerClasses).length} trainer classes`);
      console.log(`   🎯 Loaded ${Object.keys(moveData).length} move data`);

      this.isLoading = false;
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
