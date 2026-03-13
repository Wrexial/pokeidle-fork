/**
 * Data Integration Utilities
 * 
 * This file provides helper functions to integrate external game data
 * with the bundled application code.
 * 
 * Depending on your setup, use one of these approaches:
 * 1. Window Injection (for existing minified bundle)
 * 2. Direct Import (for source code with ES6 modules)
 * 3. Global Replacement (for modifying bundled code)
 */

// ============================================================================
// APPROACH 1: Window Injection (for existing minified bundle)
// ============================================================================

/**
 * Inject data loader into window object for existing bundle
 * Call this before the main app bundle loads
 */
export function setupWindowDataInjection() {
  if (typeof window !== 'undefined' && window.gameDataInjector?.waitForData) {
    return window.gameDataInjector.waitForData();
  }
}

/**
 * Usage in index.html:
 * 
 * <html>
 *   <head>
 *     ...
 *     <script src="/assets/gameDataInjector.js"></script>
 *     <script type="module" src="/assets/index.js"></script>
 *   </head>
 *   ...
 * </html>
 * 
 * Then in your bundled app JS (index.js):
 * 
 *   // Wait for data to load
 *   await window.gameDataReady;
 *   
 *   // Access data via injector
 *   const species = window.gameDataInjector.getPokemonSpecies('pikachu');
 *   const evolutions = window.gameDataInjector.getEvolutionData('pikachu');
 *   const moves = window.gameDataInjector.getMoveLearnset('pikachu');
 *   const trainers = window.gameDataInjector.getTrainerClasses();
 */

// ============================================================================
// APPROACH 2: Direct Import (for source code with modules)
// ============================================================================

/**
 * Usage in your React app or module:
 * 
 * import { loadGameData, getPokemonSpecies } from './assets/gameDataLoader.js'
 * 
 * // In your React component or app init:
 * useEffect(() => {
 *   loadGameData().then(data => {
 *     // Data is now available
 *     // Use helper functions to access it
 *     const pikachu = getPokemonSpecies('pikachu');
 *   });
 * }, []);
 */

// ============================================================================
// APPROACH 3: Global Replacement Pattern (for bundled code modification)
// ============================================================================

/**
 * If you have access to the bundled code and can edit variable references,
 * you can replace the hardcoded data objects with computed getters.
 * 
 * OLD CODE (minified variable):
 * ```
 * const baseStats = fe["pikachu"].baseStats;
 * ```
 * 
 * NEW CODE (using injected data):
 * ```
 * const baseStats = window.gameDataInjector.getPokemonSpecies("pikachu").baseStats;
 * ```
 * 
 * Variable name replacements:
 * - fe              → window.gameDataInjector.data.pokemonSpecies
 * - Zo              → window.gameDataInjector.data.evolutionData
 * - ys              → window.gameDataInjector.data.moveLearnsets
 * - cg              → window.gameDataInjector.data.trainerClasses
 */

// ============================================================================
// DEBUGGING HELPERS
// ============================================================================

export const DataIntegrationDebug = {
  /**
   * Check if data is loaded
   */
  checkStatus() {
    if (!window.gameDataDebug) {
      console.error('❌ Game data injector not loaded');
      return;
    }
    
    const status = window.gameDataDebug.status();
    console.table(status);
    
    if (!status.hasError) {
      const data = window.gameDataDebug.getAllData();
      console.log('Loaded data:', {
        pokemonCount: Object.keys(data.pokemonSpecies || {}).length,
        evolutionCount: Object.keys(data.evolutionData || {}).length,
        moveCount: Object.keys(data.moveLearnsets || {}).length,
        trainerCount: Object.keys(data.trainerClasses || {}).length
      });
    }
  },

  /**
   * Look up a specific Pokemon
   */
  lookupPokemon(name) {
    try {
      const species = window.gameDataDebug.getPokemon(name);
      const evolutions = window.gameDataDebug.getEvolutions(name);
      const moves = window.gameDataDebug.getMoves(name);
      
      return { species, evolutions, moves };
    } catch (err) {
      console.error(`Error looking up ${name}:`, err);
    }
  },

  /**
   * List all available Pokemon
   */
  listAllPokemon() {
    const data = window.gameDataDebug.getAllData();
    return Object.keys(data.pokemonSpecies || {});
  },

  /**
   * Find Pokemon by type
   */
  findByType(type) {
    const data = window.gameDataDebug.getAllData();
    const species = data.pokemonSpecies || {};
    
    return Object.entries(species)
      .filter(([_, pokemon]) => pokemon.types?.includes(type))
      .map(([name, pokemon]) => ({ name, types: pokemon.types }));
  },

  /**
   * Find Pokemon that evolve from a given species
   */
  findEvolutionsOf(speciesName) {
    const data = window.gameDataDebug.getAllData();
    const evolutions = data.evolutionData || {};
    const chain = evolutions[speciesName] || [];
    
    return chain.map(evo => ({
      into: evo.into,
      level: evo.level,
      item: evo.item
    }));
  }
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const DataValidation = {
  /**
   * Validate that all expected Pokemon have the required fields
   */
  validatePokemonSpecies() {
    const data = window.gameDataDebug?.getAllData();
    if (!data?.pokemonSpecies) return false;
    
    const required = ['id', 'name', 'types', 'baseStats', 'baseExpYield'];
    const species = data.pokemonSpecies;
    
    let valid = true;
    for (const [name, pokemon] of Object.entries(species)) {
      for (const field of required) {
        if (!(field in pokemon)) {
          console.warn(`❌ ${name} missing field: ${field}`);
          valid = false;
        }
      }
      
      // Validate baseStats has all 6 stats
      const stats = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];
      for (const stat of stats) {
        if (!(stat in pokemon.baseStats)) {
          console.warn(`❌ ${name} missing stat: ${stat}`);
          valid = false;
        }
      }
    }
    
    if (valid) console.log('✅ All Pokemon data is valid');
    return valid;
  },

  /**
   * Validate evolution data references real Pokemon
   */
  validateEvolutionData() {
    const data = window.gameDataDebug?.getAllData();
    if (!data?.evolutionData || !data?.pokemonSpecies) return false;
    
    const species = data.pokemonSpecies;
    const evolutions = data.evolutionData;
    
    let valid = true;
    for (const [name, chains] of Object.entries(evolutions)) {
      if (!(name in species)) {
        console.warn(`❌ Evolution from unknown species: ${name}`);
        valid = false;
      }
      
      for (const evolution of chains) {
        if (!(evolution.into in species)) {
          console.warn(`❌ Evolution into unknown species: ${evolution.into}`);
          valid = false;
        }
      }
    }
    
    if (valid) console.log('✅ All evolution data is valid');
    return valid;
  },

  /**
   * Validate move learnsets reference real Pokemon and moves
   */
  validateMoveLearnsets() {
    const data = window.gameDataDebug?.getAllData();
    if (!data?.moveLearnsets || !data?.pokemonSpecies) return false;
    
    const species = data.pokemonSpecies;
    const movesets = data.moveLearnsets;
    
    let valid = true;
    for (const [name, moves] of Object.entries(movesets)) {
      if (!(name in species)) {
        console.warn(`❌ Moveset for unknown species: ${name}`);
        valid = false;
      }
      
      for (const [level, moveName] of moves) {
        if (typeof level !== 'number' || typeof moveName !== 'string') {
          console.warn(`❌ Invalid moveset entry for ${name}: [${level}, ${moveName}]`);
          valid = false;
        }
      }
    }
    
    if (valid) console.log('✅ All move learnset data is valid');
    return valid;
  }
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const DataIntegration = {
  debug: DataIntegrationDebug,
  validate: DataValidation,
  
  /**
   * Wait for data to be ready
   */
  async waitForData() {
    return window.gameDataReady;
  },

  /**
   * Get all loaded data
   */
  getAllData() {
    return window.gameDataDebug?.getAllData() || {};
  },

  /**
   * Access specific data category
   */
  getPokemonSpecies(key) {
    return window.gameDataInjector?.getPokemonSpecies(key);
  },
  
  getEvolutionData(key) {
    return window.gameDataInjector?.getEvolutionData(key);
  },
  
  getMoveLearnset(key) {
    return window.gameDataInjector?.getMoveLearnset(key);
  },
  
  getTrainerClasses() {
    return window.gameDataInjector?.getTrainerClasses();
  }
};

// Console message for loaded module
if (typeof console !== 'undefined') {
  console.log('💾 Data Integration utilities loaded');
  console.log('   Use DataIntegrationDebug.checkStatus() to verify data loading');
}
