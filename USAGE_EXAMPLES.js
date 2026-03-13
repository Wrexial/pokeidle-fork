/**
 * Example: How to Use Externalized Game Data in Your App
 * 
 * This file shows practical examples of how to access the externalized
 * game data in your Pokémon Idle app.
 * 
 * Assuming you've added the gameDataInjector.js script to index.html
 */

// ============================================================================
// EXAMPLE 1: Access Pokémon Species Data
// ============================================================================

function getPokemonStats(speciesName) {
  // Get the Pokémon data from the injector
  const pokemon = window.gameDataInjector.getPokemonSpecies(speciesName);
  
  if (!pokemon) {
    console.warn(`Pokémon "${speciesName}" not found`);
    return null;
  }

  return {
    id: pokemon.id,
    name: pokemon.name,
    types: pokemon.types,
    stats: pokemon.baseStats,
    expYield: pokemon.baseExpYield
  };
}

// Usage:
// const stats = getPokemonStats('pikachu');
// console.log(stats.stats.hp); // 35


// ============================================================================
// EXAMPLE 2: Get Pokémon Evolutions
// ============================================================================

function getEvolutionChain(speciesName) {
  const evolutions = window.gameDataInjector.getEvolutionData(speciesName);
  
  if (!evolutions || evolutions.length === 0) {
    return null;
  }

  return evolutions.map(evo => ({
    evolvesInto: evo.into,
    level: evo.level,
    item: evo.item
  }));
}

// Usage:
// const chain = getEvolutionChain('bulbasaur');
// console.log(chain); // [{ evolvesInto: 'ivysaur', level: 16 }]


// ============================================================================
// EXAMPLE 3: Get Move Learnset
// ============================================================================

function getMovesByLevel(speciesName, level) {
  const moves = window.gameDataInjector.getMoveLearnset(speciesName);
  
  if (!moves) return [];

  // Get all moves learned at or before the specified level
  return moves
    .filter(([learnLevel]) => learnLevel <= level)
    .map(([_, moveName]) => moveName);
}

// Usage:
// const startingMoves = getMovesByLevel('pikachu', 1);
// console.log(startingMoves); // ['thunderShock', 'growl']


// ============================================================================
// EXAMPLE 4: Get Trainer Images
// ============================================================================

function getTrainerSpriteFilename(trainerType) {
  const trainers = window.gameDataInjector.getTrainerClasses();
  const filename = trainers[trainerType];
  
  if (!filename) {
    console.warn(`Trainer type "${trainerType}" not found`);
    return null;
  }

  return filename;
}

// Usage:
// const filename = getTrainerSpriteFilename('youngster');
// console.log(filename); // 'youngster'


// ============================================================================
// EXAMPLE 5: Filter Pokémon by Type
// ============================================================================

function getPokemonByType(typeName) {
  // This requires access to all species, so we get the full data
  const allPokemon = window.gameDataInjector.data?.pokemonSpecies || {};
  
  return Object.entries(allPokemon)
    .filter(([_, pokemon]) => pokemon.types.includes(typeName))
    .map(([key, pokemon]) => ({
      key,
      name: pokemon.name,
      types: pokemon.types
    }));
}

// Usage:
// const electric = getPokemonByType('Electric');
// electric.forEach(p => console.log(p.name));


// ============================================================================
// EXAMPLE 6: Wait for Data Before Using It
// ============================================================================

async function initializeApp() {
  // Wait for game data to load
  try {
    await window.gameDataReady;
    console.log('✅ Game data loaded, app ready!');
    
    // Now safe to use the data
    const pikachu = getPokemonStats('pikachu');
    console.log(pikachu);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to load game data:', error);
    // Show error message to user
    return false;
  }
}

// Usage in React component:
// useEffect(() => {
//   initializeApp().then(success => {
//     if (success) setAppReady(true);
//   });
// }, []);


// ============================================================================
// EXAMPLE 7: Calculate Pokémon Stats with IVs and Level
// ============================================================================

function calculatePokemonStats(speciesName, level, ivs = {}) {
  const pokemon = window.gameDataInjector.getPokemonSpecies(speciesName);
  
  if (!pokemon) return null;

  const calculateStat = (stat, baseValue) => {
    const iv = ivs[stat] || 0;
    
    if (stat === 'hp') {
      return Math.floor((2 * baseValue + iv + 10) * level / 100) + level + 5;
    } else {
      return Math.floor((2 * baseValue + iv + 5) * level / 100) + 5;
    }
  };

  const stats = pokemon.baseStats;
  
  return {
    hp: calculateStat('hp', stats.hp),
    attack: calculateStat('attack', stats.attack),
    defense: calculateStat('defense', stats.defense),
    spAttack: calculateStat('spAttack', stats.spAttack),
    spDefense: calculateStat('spDefense', stats.spDefense),
    speed: calculateStat('speed', stats.speed)
  };
}

// Usage:
// const stats = calculatePokemonStats('pikachu', 50);
// console.log(stats.hp); // Calculated HP at level 50


// ============================================================================
// EXAMPLE 8: Get Full Pokémon Information
// ============================================================================

function getFullPokemonInfo(speciesName) {
  const species = window.gameDataInjector.getPokemonSpecies(speciesName);
  const evolutions = window.gameDataInjector.getEvolutionData(speciesName);
  const moves = window.gameDataInjector.getMoveLearnset(speciesName);
  
  if (!species) return null;

  return {
    id: species.id,
    name: species.name,
    types: species.types,
    baseStats: species.baseStats,
    baseExpYield: species.baseExpYield,
    growthRate: species.growthRate,
    evolutions: evolutions || [],
    movepool: moves || []
  };
}

// Usage:
// const info = getFullPokemonInfo('pikachu');
// console.log(info);


// ============================================================================
// EXAMPLE 9: Validation and Error Handling
// ============================================================================

function safePokemonLookup(speciesName) {
  try {
    // Check if data is loaded
    if (!window.gameDataInjector) {
      console.error('Game data not initialized');
      return null;
    }

    // Get the Pokémon
    const pokemon = window.gameDataInjector.getPokemonSpecies(speciesName);
    
    if (!pokemon) {
      console.warn(`Pokémon "${speciesName}" not found in database`);
      return null;
    }

    // Validate required fields
    const required = ['id', 'name', 'types', 'baseStats'];
    for (const field of required) {
      if (!(field in pokemon)) {
        console.error(`Invalid Pokémon data: missing "${field}"`);
        return null;
      }
    }

    return pokemon;

  } catch (error) {
    console.error('Error looking up Pokémon:', error);
    return null;
  }
}

// Usage:
// const pokemon = safePokemonLookup('pikachu');
// if (pokemon) console.log(pokemon.name);


// ============================================================================
// EXAMPLE 10: Debugging with Console
// ============================================================================

/**
 * In your browser console, you can use these commands:
 * 
 * // Check if data is loaded
 * window.gameDataDebug.status()
 * 
 * // Get a specific Pokémon
 * window.gameDataDebug.lookupPokemon('pikachu')
 * 
 * // List all Pokémon
 * window.gameDataDebug.listAllPokemon()
 * 
 * // Find by type
 * window.gameDataDebug.findByType('Electric')
 * 
 * // Find evolutions
 * window.gameDataDebug.findEvolutionsOf('pikachu')
 * 
 * // Get all data
 * window.gameDataDebug.getAllData()
 */


// ============================================================================
// EXPORT THESE FUNCTIONS IF USING ES6 MODULES
// ============================================================================

export {
  getPokemonStats,
  getEvolutionChain,
  getMovesByLevel,
  getTrainerSpriteFilename,
  getPokemonByType,
  initializeApp,
  calculatePokemonStats,
  getFullPokemonInfo,
  safePokemonLookup
};
