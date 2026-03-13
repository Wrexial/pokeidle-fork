# Quick Start: Using Externalized Game Data

## Current Status

Your game data has been successfully extracted and is ready to be used:

```
/data/pokemon-species.json      ✅ 151 Pokémon with full stats
/data/evolution-data.json       ✅ 70 evolution chains
/data/move-learnsets.json       ✅ Move sets for all Pokémon
/data/trainer-classes.json      ✅ 18 trainer class mappings
```

## Files Created

| File | Purpose |
|------|---------|
| `assets/gameDataLoader.js` | ES6 module for loading data (for source code rebuild) |
| `assets/gameDataInjector.js` | Data injection script (for existing minified bundle) |
| `assets/dataIntegrationUtils.js` | Debugging and validation utilities |

## Implementation Options

### Option A: Using Existing Minified Bundle (Quick)

This approach works with your current app without rebuilding:

**Step 1:** Update `index.html` to load the data injector **before** the main app:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/pokeball.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pokémon Idle</title>
    <link rel="stylesheet" href="/assets/fonts.css">
    <link rel="stylesheet" href="/assets/style.css">
    <!-- Load data BEFORE the main app -->
    <script src="/assets/gameDataInjector.js"></script>
    <script type="module" src="/assets/index.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**Step 2:** In your bundled app code (if you can modify `assets/index.js`), add at the start:

```javascript
// Wait for game data to load before initializing the app
await window.gameDataReady;
console.log('✅ Game data is ready!');

// Access data via the injector:
const pikachu = window.gameDataInjector.getPokemonSpecies('pikachu');
const evolutions = window.gameDataInjector.getEvolutionData('pikachu');
const moves = window.gameDataInjector.getMoveLearnset('pikachu');
```

**Benefits:**
✅ No rebuild needed  
✅ Works with existing bundle  
✅ Can edit data without recompiling  
✅ Fast to implement

### Option B: Rebuilding from Source (Complete)

If you have access to the original source code:

**Step 1:** Import the loader in your main React component:

```javascript
import { loadGameData, getPokemonSpecies } from './assets/gameDataLoader.js'

function App() {
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    loadGameData().then(() => {
      setDataLoaded(true);
      console.log('✅ Game data loaded!');
    });
  }, []);

  if (!dataLoaded) {
    return <div>Loading game data...</div>;
  }

  // Your app code here
  // Access data via getPokemonSpecies(), getEvolutionData(), etc.
}
```

**Step 2:** Replace hardcoded data references:

Before:
```javascript
const stats = fe["pikachu"].baseStats;  // hardcoded object
```

After:
```javascript
const stats = getPokemonSpecies("pikachu").baseStats;  // from JSON
```

**Benefits:**
✅ Complete separation of data and code  
✅ Cleaner architecture  
✅ All data accessible via module imports  
✅ Full control over data loading

## Verify It Works

### Option A: Using Browser Console

1. Open your app in a browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Type:
```javascript
// Check if data loaded
window.gameDataDebug.status()

// List all Pokémon
window.gameDataDebug.listAllPokemon()

// Look up a specific Pokémon
window.gameDataDebug.lookupPokemon('pikachu')

// Find Pokémon by type
window.gameDataDebug.findByType('Electric')

// Validate all data
window.gameDataDebug.injectormple Debugging
```

### Option B: Using Development Server

1. Run `npm run dev`
2. Open the console
3. You should see message:
```
💾 Game Data Injector initialized
   Use window.gameDataDebug for debugging
✅ Game data loaded successfully
   📊 Loaded 151 Pokémon species
   🔄 Loaded 70 evolution chains
   🎯 Loaded 151 move learnsets
   👥 Loaded 18 trainer classes
```

## Data Format Reference

### Accessing Pokémon Data

```javascript
// Get a specific Pokémon's data
const pikachu = window.gameDataInjector.getPokemonSpecies('pikachu');

// Structure:
{
  id: 25,
  name: "Pikachu",
  types: ["Electric"],
  baseStats: {
    hp: 35,
    attack: 55,
    defense: 40,
    spAttack: 50,
    spDefense: 50,
    speed: 90
  },
  baseExpYield: 112,
  growthRate: "mediumFast"
}
```

### Accessing Evolution Data

```javascript
const evolutions = window.gameDataInjector.getEvolutionData('pikachu');

// Structure:
[
  {
    into: "raichu",
    level: 0,        // Can be 0 for item/special evolution
    item: "thunderStone"
  }
]
```

### Accessing Move Learnsets

```javascript
const moves = window.gameDataInjector.getMoveLearnset('pikachu');

// Structure: [[level, "moveName"], ...]
[
  [1, "thunderShock"],
  [1, "growl"],
  [6, "thunderWave"],
  ...
]
```

### Accessing Trainer Classes

```javascript
const trainers = window.gameDataInjector.getTrainerClasses();

// Structure: { trainerType: "spriteFilename", ... }
{
  "youngster": "youngster",
  "lass": "lass",
  "bugCatcher": "bugcatcher",
  ...
}
```

## Editing Game Data

All game data is now editable as JSON:

1. **To add/modify a Pokémon:** Edit `/data/pokemon-species.json`
2. **To add/modify evolutions:** Edit `/data/evolution-data.json`
3. **To add/modify moves:** Edit `/data/move-learnsets.json`
4. **To add/modify trainers:** Edit `/data/trainer-classes.json`

Changes are reflected immediately in development mode!

## Troubleshooting

### Issue: "Failed to load game data"

**Check the console for the exact error:**
```javascript
window.gameDataDebug.status()
```

**Most common causes:**
- `404` error: JSON files not found - verify they're in `/data/` directory
- `CORS` error: Server not serving JSON files properly - check server config
-`Syntax error`: JSON files are invalid - validate JSON formatting

**Fix: Validate JSON files**
```javascript
// Check if files exist and are valid
fetch('/data/pokemon-species.json').then(r => r.ok ? 'File found' : 'File not found')
```

### Issue: "Data is undefined"

Make sure data loading completed before accessing it:

```javascript
// Wait for data to be ready
await window.gameDataReady;

// Now safe to access
const species = window.gameDataInjector.getPokemonSpecies('pikachu');
```

### Issue: App Still Uses Old Hardcoded Data

Your bundled code still has hardcoded data objects. To fix:

1. **Option 1:** Replace references with injector calls:
```javascript
// Old: const stats = fe["pikachu"].baseStats;
// New:
const stats = window.gameDataInjector.getPokemonSpecies("pikachu").baseStats;
```

2. **Option 2:** Rebuild from source with the new gameDataLoader.js module

## Next Steps

1. **Choose your approach**: Option A (quick) or Option B (complete rebuild)
2. **Implement the integration** using the code samples above
3. **Verify it works** using the debugging commands
4. **Start editing data** as needed without rebuilding

For detailed information, see:
- [DATA_INTEGRATION.md](./DATA_INTEGRATION.md) - Comprehensive integration guide
- Console help: Type `window.gameDataDebug` and explore the available functions

Happy coding! 🎮
