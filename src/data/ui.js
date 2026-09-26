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

// Vertical room the battle log is guaranteed before the scene is scaled to fit
// (the log collapses below `BATTLE_LOG_MIN_HEIGHT` content height).
export const BATTLE_LOG_RESERVE = 60

export const MOBILE_BREAKPOINT = 1000

// A viewport shorter than this (landscape phones, short desktop windows) uses
// the stacked/tabbed layout even when it is wide enough for three columns,
// because the centre column cannot fit the battle scene and town map.
export const MOBILE_HEIGHT_BREAKPOINT = 600

export const DESIGN_WIDTH = 560

export const DESIGN_HEIGHT = 480

/**
 * Three-letter battle status abbreviations shown on the info nameplates.
 * @type {Record<string, string>}
 */
const statusLabels = {
  poison: 'PSN',
  toxic: 'TOX',
  burn: 'BRN',
  freeze: 'FRZ',
  sleep: 'SLP',
  paralysis: 'PAR',
  flinching: 'FLN',
}

/**
 * The three-letter label for a battle status, falling back to the first three
 * letters so an unmapped status can never widen the nameplate.
 * @param {string} status
 * @returns {string}
 */
export function statusLabel(status) {
  return statusLabels[status] ?? status.slice(0, 3).toUpperCase()
}

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
    safariball: {
      top: '#4a9a3a',
      bottom: '#e8dcc0',
      ring: '#2a1808',
      dot: '#f0d060',
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

/**
 * Pokedex status ball palettes: grey for a species merely seen, the normal
 * red ball for one caught, and gold for one caught as a shiny.
 * @type {Record<'seen' | 'caught' | 'shiny', { top: string, bottom: string, ring: string, dot: string }>}
 */
export const dexBallColors = {
  seen: {
    top: '#6c6c6c',
    bottom: '#bdbdbd',
    ring: '#8a8a8a',
    dot: '#2a1808',
  },
  caught: {
    top: '#c83030',
    bottom: '#e8dcc0',
    ring: '#e8dcc0',
    dot: '#2a1808',
  },
  shiny: {
    top: '#e8b020',
    bottom: '#fff2c0',
    ring: '#f0d060',
    dot: '#8a6010',
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
    id: 'backpack',
    label: 'Backpack',
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
  {
    id: 'backpack',
    label: 'Backpack',
  },
]

/**
 * Per-biome colour grades applied over the battle background image, so the four
 * base scenes (grassland, beach, mountain, cave) read as forest, autumn, desert,
 * swamp, volcanic, tundra and so on. `none` keeps the image untouched.
 * @type {Record<string, string>}
 */
export const BIOME_FILTERS = {
  grassland: 'none',
  forest: 'hue-rotate(-18deg) saturate(1.3) brightness(.9)',
  autumn: 'hue-rotate(28deg) saturate(1.4) brightness(.95)',
  desert: 'sepia(.55) hue-rotate(-18deg) saturate(1.25) brightness(1.08)',
  swamp: 'hue-rotate(55deg) saturate(.75) brightness(.72)',
  volcanic: 'sepia(.35) hue-rotate(-38deg) saturate(1.6) brightness(.82)',
  tundra: 'hue-rotate(175deg) saturate(.85) brightness(1.12)',
  coast: 'hue-rotate(8deg) saturate(1.15)',
  cave: 'brightness(.82) saturate(.9)',
  ruins: 'sepia(.5) brightness(.85)',
  mountain: 'saturate(.95) brightness(.95)',
  town: 'none',
}

/**
 * Pick a biome tint for a location from its name, falling back to its
 * background image. Purely visual — the battle background image is unchanged.
 * @param {MapLocation | undefined} location
 * @returns {string}
 */
export function biomeForLocation(location) {
  const name = location?.name ?? ''
  if (/forest|woods|grove|tangle|jungle/i.test(name)) return 'forest'
  if (/autumn|fall/i.test(name)) return 'autumn'
  if (/desert|sand|dune|wasteland/i.test(name)) return 'desert'
  if (/swamp|marsh|fen|bog|moor|wetland/i.test(name)) return 'swamp'
  if (/volcan|ember|blaze|magma|cinder/i.test(name)) return 'volcanic'
  if (/snow|ice|frost|glacier|tundra/i.test(name)) return 'tundra'
  if (/ruins|tower|temple|shrine|catacomb/i.test(name)) return 'ruins'
  if (/cave|cavern|tunnel|mine|grotto|depths|underground|well|sewer/i.test(name)) return 'cave'
  if (/sea|ocean|beach|shore|bay|harbor|harbour|port|island|marine|coast|river|lake|pond|fall|rapid|strait|channel|dock/i.test(name))
    return 'coast'
  if (/\bmt\b|mt\.|mount|peak|summit|highland|ridge|cliff|gorge|canyon|quarry|spire/i.test(name))
    return 'mountain'
  const background = (location?.background ?? '').match(/\/([a-z_]+)\.png/)?.[1]
  if (!background) return 'grassland'
  return { beach: 'coast', town_port: 'town' }[background] ?? background
}
