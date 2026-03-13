# Game Data Integration Guide

## Overview

The game data has been extracted into separate JSON files for easier maintenance and editing. This guide explains how to integrate them back into the application.

## Files

### Data Files (in `/data/` directory)
- `pokemon-species.json` - All 151 Pokémon with stats, types, and growth rates
- `evolution-data.json` - Evolution chains for 70 Pokémon
- `move-learnsets.json` - Move learnsets for all Pokémon
- `trainer-classes.json` - Trainer class to sprite mappings

### Integration File
- `assets/gameDataLoader.js` - Module to load and provide access to game data

## Integration Steps

### Option 1: Rebuild from Source (Recommended)

If you have access to the original source code:

1. **Install the data loader:**
   Already created in `assets/gameDataLoader.js`

2. **Update your main app entry point** to load data before rendering:
   ```javascript
   import { loadGameData } from './assets/gameDataLoader.js'
   
   // Load game data before rendering the app
   loadGameData().then(() => {
     ReactDOM.render(<App />, document.getElementById('root'))
   }).catch(error => {
     console.error('Failed to load game data:', error)
   })
   ```

3. **Replace hardcoded data references** with loader calls:
   ```javascript
   // Before (hardcoded):
   const species = pokemonSpecies[speciesKey]
   
   // After (from loader):
   const { pokemonSpecies } = getGameData()
   const species = pokemonSpecies[speciesKey]
   ```

### Option 2: Use with Current Bundle

To work with the existing minified bundle while using external data:

1. **Serve JSON files** via your web server
   - Place `/data/` files where they're accessible by the app
   - Vite development server will serve them automatically

2. **Create a data proxy script** that runs before the main app:
   ```html
   <!-- In index.html, before the app script -->
   <script>
     // Make external data available to the bundled app
     window.gameData = {
       loading: true,
       error: null
     };
     
     Promise.all([
       fetch('/data/pokemon-species.json').then(r => r.json()),
       fetch('/data/evolution-data.json').then(r => r.json()),
       fetch('/data/move-learnsets.json').then(r => r.json()),
       fetch('/data/trainer-classes.json').then(r => r.json())
     ])
     .then(([species, evolution, moves, trainers]) => {
       window.gameData.pokemonSpecies = species;
       window.gameData.evolutionData = evolution;
       window.gameData.moveLearnsets = moves;
       window.gameData.trainerClasses = trainers;
       window.gameData.loading = false;
       console.log('✅ Game data loaded');
     })
     .catch(err => {
       window.gameData.error = err;
       console.error('❌ Failed to load game data:', err);
     });
   </script>
   ```

3. **Update bundled code references** (if source available):
   - Replace `fe` with `window.gameData.pokemonSpecies`
   - Replace `Zo` with `window.gameData.evolutionData`
   - Replace `ys` with `window.gameData.moveLearnsets`
   - Replace `cg` with `window.gameData.trainerClasses`

## Benefits

✅ **Data Editing:** Edit JSON files directly without rebuilding
✅ **Maintainability:** Clear separation of data and logic
✅ **Extensibility:** Easy to add new Pokémon or modify stats
✅ **Documentation:** Self-documenting game data structure
✅ **Development:** Faster iteration during development

## Structure

### pokemon-species.json
```json
{
  "bulbasaur": {
    "id": 1,
    "name": "Bulbasaur",
    "types": ["Grass", "Poison"],
    "baseStats": {
      "hp": 45,
      "attack": 49,
      "defense": 49,
      "spAttack": 65,
      "spDefense": 65,
      "speed": 45
    },
    "baseExpYield": 64,
    "growthRate": "mediumSlow"
  },
  ...
}
```

### evolution-data.json
```json
{
  "bulbasaur": [
    {
      "into": "ivysaur",
      "level": 16
    }
  ],
  "ivysaur": [
    {
      "into": "venusaur",
      "level": 32
    }
  ],
  ...
}
```

### move-learnsets.json
```json
{
  "bulbasaur": [
    [1, "tackle"],
    [1, "growl"],
    [3, "vineWhip"],
    ...
  ],
  ...
}
```

### trainer-classes.json
```json
{
  "youngster": "youngster",
  "lass": "lass",
  "bugCatcher": "bugcatcher",
  ...
}
```

## Editing Data

To modify game data:

1. **Edit the JSON files** in `/data/` directory
2. **Restart the development server** (or it auto-refreshes)
3. **Game loads the new data** automatically

Example: Add new Pokémon or modify stats:
```json
// In pokemon-species.json
"mypokemon": {
  "id": 999,
  "name": "MyPokémon",
  "types": ["Electric"],
  "baseStats": {
    "hp": 50,
    "attack": 60,
    ...
  },
  ...
}
```

## Development Server

The Vite dev server automatically serves files from the root directory:
- `http://localhost:5173/` → root
- `http://localhost:5173/data/pokemon-species.json` → `/data/pokemon-species.json`

## Notes

⚠️ **Minified Bundle:** The current bundled code has minified variable names. For complete integration, original source code is needed.

⚠️ **Data Synchronization:** When implementing this, ensure all data structures remain in sync with what the app expects.

⚠️ **Performance:** Loading separate JSON files adds minimal overhead but requires network requests. Cache them appropriately.

## Next Steps

1. **If rebuilding:** Use the source code with Option 1
2. **If not rebuilding:** Implement Option 2 by adding a data proxy script to `index.html`
3. **Edit data:** Modify JSON files as needed, changes reflect on next load

See `gameDataLoader.js` for utility functions to access the data programmatically.
