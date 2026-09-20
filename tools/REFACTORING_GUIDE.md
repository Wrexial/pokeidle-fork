> **Status: done (differently).** The monolith has been split into ES modules
> under `src/` (see `AGENTS.md` → "Source layout") using
> `tools/decompile/split-modules.mjs`. This document is kept as historical
> design context; the actual target structure differs from the sketch below.

# Pokemon Idle Refactoring Guide

## Overview
The monolithic `assets/index.js` (26,761 lines) has been backed up as `assets/index.js.backup` and is being split into a modular structure for better maintainability.

## Directory Structure

```
src/
├── data/            # Game data definitions
│   ├── pokemon.js   # Pokemon species, stats, evolutions
│   ├── locations.js # Routes, cities, encounters
│   ├── items.js     # Items, moves, abilities
│   └── trainers.js  # Trainer/gym leader data
├── game/            # Game state & logic
│   ├── reducer.js   # State management & actions
│   ├── constants.js # Game constants (speeds, etc)
│   └── storage.js   # Save/load functionality
├── components/      # React components
│   ├── BattleScene.js
│   ├── EvolutionScene.js
│   ├── HealingScene.js
│   ├── PartyPanel.js
│   ├── BoxPanel.js
│   ├── PokedexPanel.js
│   ├── ShopPanel.js
│   ├── SettingsPanel.js
│   └── App.jsx      # Main app component
├── utils/           # Helper functions
│   ├── pokemon.js   # Pokemon calculations (stats, exp)
│   ├── battle.js    # Battle logic (damage, moves)
│   ├── encounter.js # Encounter/catch logic
│   └── moves.js     # Move data and AI
└── main.jsx         # Vite entry point
```

## Extraction Priority

### Phase 1: Data Files (Completed)
- [x] Create pokemon.js structure
- [ ] Extract full Pokemon data (~2500 lines)
- [ ] Extract evolution chains
- [ ] Extract Pokemon base stats mapping
- [ ] Create locations.js with route/city data
- [ ] Create items.js with items and basic moves
- [ ] Create trainers.js with gym leader data

### Phase 2: Utility Functions
- [ ] Extract Pokemon utility functions (calculateStats, calculateExp, etc.)
- [ ] Extract battle functions (calculateDamage, typeEffectiveness, etc.)
- [ ] Extract encounter/catch logic
- [ ] Extract move selection/AI functions
- [ ] Extract save/load functions

### Phase 3: Redux-like Reducer
- [ ] Complete game reducer export
- [ ] Extract all action case handlers
- [ ] Export game context provider
- [ ] Create custom hooks for dispatching actions

### Phase 4: React Components
- [ ] Split battle scene component
- [ ] Split evolution animation component
- [ ] Split healing animation component
- [ ] Split party/box panels
- [ ] Split pokedex panel
- [ ] Split shop panel
- [ ] Split settings panel
- [ ] Create main App component

### Phase 5: Build & Testing
- [ ] Create main.jsx entry point
- [ ] Update vite.config.js if needed
- [ ] Update index.html to reference new entry point
- [ ] Test Vite build process
- [ ] Verify all functionality works

## Key Sections to Extract from assets/index.js

### Data Objects
- `const fe = { ... }` (line ~12446) - Pokemon species data
- `const Zo = { ... }` (line ~15002) - Evolution chains
- `const Xe = { ... }` (line ~15249) - Locations/routes
- `const nt = { ... }` (line ~19632) - Moves
- `const Gn = { ... }` (line ~17800) - Items
- `const yf = [...]` (line ~21921) - Gym leaders
- `const Hh = { ... }` (line ~17881) - Initial game state

### Function Groups
- Pokemon calculations: `Kh`, `Ul`, `la`, `Un`, `Mf`, `fs`, `Dh`
- Battle logic: `gg`, `vg`, `xf`, `bg`, `Sf`, `xg`, `Sg`, `kg`
- Encounter logic: `qn`, `Xh`, `Vh`
- Game reducer: `Yh` (main reducer function - massive!)
- Save/load: `Oh`, `Vl`

### React Components (Start with simplest)
- Speed controls: `tg` (line ~19604)
- Evolution scene: `ng` (line ~21020)
- Healing scene: `lg` (line ~21084)
- Battle scene: `vf` (line ~22228)
- Main app: `Ng` (line ~23376)
- Party panel: `qf` (around line ~24000)
- Pokedex: `bg` (around line ~24500)
- Settings: `sg` (around line ~21170)

## Tips for Extraction

1. **Dependencies**: Check function/data dependencies before extracting
2. **Variable Names**: The code is minified - variable names like `fe`, `nt`, `Xe` are cryptic. Rename them during extraction
3. **React**: Extract React.createElement to JSX syntax for readability
4. **Constants**: Move magic numbers to constants files
5. **Test incrementally**: Test each module after extraction

## Current Status

- ✅ Backup created: `assets/index.js.backup`
- ✅ Directory structure created
- ⏳ Data extraction in progress
- ⏳ Utility functions pending
- ⏳ Reducer functions pending
- ⏳ Component extraction pending
- ⏳ Main entry point pending

## Build Configuration Update Needed

Update `vite.config.js` entry point when ready:
```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      input: 'src/main.jsx'
    }
  }
})
```

Update `index.html` to point to new entry:
```html
<script type="module" src="/src/main.jsx"></script>
```
