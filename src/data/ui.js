// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const SPEED_OPTIONS = [1, 2, 5, 25]

/** @type {Record<string, string>} */
export let locationImages = {
    route1: '/backgrounds/grassland.png',
    route2: '/backgrounds/grassland.png',
    route4: '/backgrounds/grassland.png',
    route5: '/backgrounds/grassland.png',
    route6: '/backgrounds/grassland.png',
    route7: '/backgrounds/grassland.png',
    route8: '/backgrounds/grassland.png',
    route9: '/backgrounds/grassland.png',
    route11: '/backgrounds/grassland.png',
    route12: '/backgrounds/grassland.png',
    route13: '/backgrounds/grassland.png',
    route14: '/backgrounds/grassland.png',
    route15: '/backgrounds/grassland.png',
    route16: '/backgrounds/grassland.png',
    route17: '/backgrounds/grassland.png',
    route18: '/backgrounds/grassland.png',
    route22: '/backgrounds/grassland.png',
    route24: '/backgrounds/grassland.png',
    route25: '/backgrounds/grassland.png',
    safariZone: '/backgrounds/grassland.png',
    viridianForest: '/backgrounds/grassland.png',
    route3: '/backgrounds/mountain.png',
    route10: '/backgrounds/mountain.png',
    route23: '/backgrounds/mountain.png',
    mtMoon: '/backgrounds/cave.png',
    rockTunnel: '/backgrounds/cave.png',
    diglettsCave: '/backgrounds/cave.png',
    victoryRoad: '/backgrounds/cave.png',
    ceruleanCave: '/backgrounds/cave.png',
    pokemonTower: '/backgrounds/cave.png',
    pokemonMansion: '/backgrounds/cave.png',
    powerPlant: '/backgrounds/cave.png',
    route19: '/backgrounds/beach.png',
    route20: '/backgrounds/beach.png',
    route21: '/backgrounds/beach.png',
    seafoamIslands: '/backgrounds/cave.png',
  }

export const BATTLE_LOG_MIN_HEIGHT = 30

export const MOBILE_BREAKPOINT = 768

export const DESIGN_WIDTH = 560

/** @type {Record<string, string>} */
export const statBarColors = {
    hp: '#60a040',
    attack: '#c86828',
    defense: '#c8a828',
    spAttack: '#5878c8',
    spDefense: '#60a040',
    speed: '#d04870',
  }

export let STAT_DISPLAY_MAX = 200

export const BOX_PAGE_SIZE = 30

/** @type {{ source: 'party' | 'box', fromIndex: number, pokemonId: string | null, target: 'party' | 'box' | null, targetIndex: number | null, position: 'above' | 'below' | null, droppedOnBoxContainer: boolean }} */
export const initialDragState = {
  source: 'party',
  fromIndex: -1,
  pokemonId: null,
  target: null,
  targetIndex: null,
  position: null,
  droppedOnBoxContainer: !1,
}

/** @type {Record<string, string>} */
export const rarities = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    very_rare: 'Very Rare',
    ultra_rare: 'Ultra Rare',
  }

/** @type {Record<string, { top: string, bottom: string, ring: string, dot: string }>} */
export const pokeballColors = {
    pokeball: {
      top: '#c83030',
      bottom: '#e8dcc0',
      ring: '#e8dcc0',
      dot: '#2a1808',
    },
    greatball: {
      top: '#3060c8',
      bottom: '#e8dcc0',
      ring: '#e8dcc0',
      dot: '#2a1808',
    },
    ultraball: {
      top: '#c8a828',
      bottom: '#e8dcc0',
      ring: '#e8dcc0',
      dot: '#2a1808',
    },
    premierball: {
      top: '#e8e8e8',
      bottom: '#e8dcc0',
      ring: '#c83030',
      dot: '#2a1808',
    },
    quickball: {
      top: '#f0d020',
      bottom: '#e8dcc0',
      ring: '#3060c8',
      dot: '#2a1808',
    },
    timerball: {
      top: '#e07020',
      bottom: '#e8dcc0',
      ring: '#2a1808',
      dot: '#2a1808',
    },
    repeatball: {
      top: '#e04040',
      bottom: '#e8dcc0',
      ring: '#f0d020',
      dot: '#2a1808',
    },
    netball: {
      top: '#30b0d0',
      bottom: '#e8dcc0',
      ring: '#2a1808',
      dot: '#2a1808',
    },
    diveball: {
      top: '#3060c8',
      bottom: '#e8dcc0',
      ring: '#30b0d0',
      dot: '#2a1808',
    },
    nestball: {
      top: '#60b040',
      bottom: '#e8dcc0',
      ring: '#e8dcc0',
      dot: '#2a1808',
    },
    duskball: {
      top: '#2a5a3a',
      bottom: '#e8dcc0',
      ring: '#8a20a0',
      dot: '#f0d060',
    },
    masterball: {
      top: '#7030a0',
      bottom: '#e8dcc0',
      ring: '#e8dcc0',
      dot: '#f0d060',
    },
  }

export const CATCH_MODE_OPTIONS = [
    {
      value: 'always',
      label: 'Always catch',
    },
    {
      value: 'shiny_only',
      label: 'Only if shiny',
    },
    {
      value: 'level_threshold',
      label: 'Above level:',
    },
    {
      value: 'pokedex_new',
      label: 'Not caught yet',
      hint: 'Stops once the species is registered in the Pokedex.',
    },
    {
      value: 'living_dex',
      label: 'Not owned (living)',
      hint: 'Keeps catching until one is in the party or box — for a living dex.',
    },
  ]

/** Box sort modes, in cycle order. */
export const BOX_SORT_OPTIONS = [
    { value: 'dex', label: 'Dex' },
    { value: 'level_desc', label: 'Lv \u2193' },
    { value: 'level_asc', label: 'Lv \u2191' },
    { value: 'name', label: 'A-Z' },
    { value: 'shiny', label: '\u2605' },
    { value: 'newest', label: 'New' },
  ]

export const SIDE_PANEL_TABS = [
  {
    id: 'location',
    label: 'Location',
  },
  {
    id: 'gym',
    label: 'Gyms',
  },
]

export const MOBILE_TABS = [
  {
    id: 'map',
    label: 'Map',
  },
  {
    id: 'party',
    label: 'Party',
  },
  {
    id: 'box',
    label: 'Box',
  },
  {
    id: 'location',
    label: 'Location',
  },
]
