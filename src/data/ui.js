// Split from src/data/constants.js.

export const SPEED_OPTIONS = [1, 2, 5, 25]

/** @type {Record<string, string>} */
export let locationImages = {
    route1: '/backgrounds/grassland.webp',
    route2: '/backgrounds/grassland.webp',
    route4: '/backgrounds/grassland.webp',
    route5: '/backgrounds/grassland.webp',
    route6: '/backgrounds/grassland.webp',
    route7: '/backgrounds/grassland.webp',
    route8: '/backgrounds/grassland.webp',
    route9: '/backgrounds/grassland.webp',
    route11: '/backgrounds/grassland.webp',
    route12: '/backgrounds/grassland.webp',
    route13: '/backgrounds/grassland.webp',
    route14: '/backgrounds/grassland.webp',
    route15: '/backgrounds/grassland.webp',
    route16: '/backgrounds/grassland.webp',
    route17: '/backgrounds/grassland.webp',
    route18: '/backgrounds/grassland.webp',
    route22: '/backgrounds/grassland.webp',
    route24: '/backgrounds/grassland.webp',
    route25: '/backgrounds/grassland.webp',
    safariZone: '/backgrounds/grassland.webp',
    viridianForest: '/backgrounds/grassland.webp',
    route3: '/backgrounds/mountain.webp',
    route10: '/backgrounds/mountain.webp',
    route23: '/backgrounds/mountain.webp',
    mtMoon: '/backgrounds/cave.webp',
    rockTunnel: '/backgrounds/cave.webp',
    diglettsCave: '/backgrounds/cave.webp',
    victoryRoad: '/backgrounds/cave.webp',
    ceruleanCave: '/backgrounds/cave.webp',
    pokemonTower: '/backgrounds/cave.webp',
    pokemonMansion: '/backgrounds/cave.webp',
    powerPlant: '/backgrounds/cave.webp',
    route19: '/backgrounds/beach.webp',
    route20: '/backgrounds/beach.webp',
    route21: '/backgrounds/beach.webp',
    seafoamIslands: '/backgrounds/cave.webp',
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
    levelball: {
      top: '#e07020',
      bottom: '#e8dcc0',
      ring: '#2a1808',
      dot: '#f0d060',
    },
    lureball: {
      top: '#3060c8',
      bottom: '#e8dcc0',
      ring: '#30b0d0',
      dot: '#2a1808',
    },
    friendball: {
      top: '#4a9a3a',
      bottom: '#e8dcc0',
      ring: '#f0d060',
      dot: '#2a1808',
    },
    heavyball: {
      top: '#5a6a7a',
      bottom: '#c8b890',
      ring: '#2a1808',
      dot: '#2a1808',
    },
    loveball: {
      top: '#e060a0',
      bottom: '#e8dcc0',
      ring: '#f0d060',
      dot: '#2a1808',
    },
    fastball: {
      top: '#f0d020',
      bottom: '#e8dcc0',
      ring: '#e04040',
      dot: '#2a1808',
    },
    moonball: {
      top: '#3a3a7a',
      bottom: '#e8dcc0',
      ring: '#f0d060',
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

/**
 * Box sort: the field to sort by (`Sort` button) and the direction (`Mode`
 * button). A stored mode is `"<field>_<dir>"`; older saves that only stored a
 * field (`dex`, `name`, ...) are read with that field's default direction.
 */
export const BOX_SORT_FIELDS = [
  { value: 'dex', label: 'Dex', defaultDirection: 'asc' },
  { value: 'level', label: 'Lv', defaultDirection: 'desc' },
  { value: 'iv', label: 'IVs', defaultDirection: 'desc' },
  { value: 'name', label: 'A-Z', defaultDirection: 'asc' },
  { value: 'shiny', label: '\u2605', defaultDirection: 'desc' },
  { value: 'newest', label: 'New', defaultDirection: 'desc' },
  { value: 'mark', label: 'Mark', defaultDirection: 'desc' },
]

export const BOX_SORT_DIRECTIONS = [
  { value: 'desc', label: '\u2193', title: 'Descending' },
  { value: 'asc', label: '\u2191', title: 'Ascending' },
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
  {
    id: 'log',
    label: 'Log',
  },
]

/**
 * Per-biome colour grades applied over the battle background image, so the four
 * base scenes (grassland, beach, mountain, cave) read as forest, autumn, desert,
 * swamp, volcanic, tundra and so on. `none` keeps the image untouched. A biome
 * with dedicated art in `BIOME_SCENE_IMAGES` skips its grade entirely.
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
 * Dedicated painted battle scenes, by biome. A biome with an entry here uses
 * that image untouched instead of a base scene plus its colour grade, so
 * dropping `public/backgrounds/<file>` in and adding the line is all it takes —
 * see `biomeBackgroundFor`. The base scenes (grassland, beach, mountain, cave,
 * town) are already dedicated art, so only the tinted biomes are listed here.
 * @type {Record<string, string>}
 */
export const BIOME_SCENE_IMAGES = {
  forest: '/backgrounds/forest.webp',
  autumn: '/backgrounds/autumn.webp',
  desert: '/backgrounds/desert.webp',
  swamp: '/backgrounds/swamp.webp',
  volcanic: '/backgrounds/volcano.webp',
  tundra: '/backgrounds/tundra.webp',
  ruins: '/backgrounds/ruins.webp',
}

/**
 * The dedicated scene for a location's biome, or null when it should fall back
 * to its base scene plus the biome tint. `scenes` is injectable so the installed
 * art set can be swapped (and tested) without touching the module constant.
 * @param {MapLocation | undefined | null} location
 * @param {Record<string, string>} [scenes]
 * @returns {{ image: string, biome: string } | null}
 */
export function biomeBackgroundFor(location, scenes = BIOME_SCENE_IMAGES) {
  const biome = biomeForLocation(location ?? void 0),
    image = scenes[biome]
  return image ? { image, biome } : null
}

/**
 * Extra filter layered over the biome tint for the current day/night phase
 * (see src/game/day-night.js). Purely visual.
 * @type {Record<string, string>}
 */
export const DAY_NIGHT_FILTERS = {
  dawn: 'sepia(.18) saturate(1.08) brightness(1.02)',
  day: 'none',
  dusk: 'sepia(.3) hue-rotate(-12deg) saturate(1.1) brightness(.86)',
  night: 'saturate(.8) brightness(.68) hue-rotate(-10deg)',
}

/**
 * Pick a biome tint for a location. The committed `biome` field wins (see
 * tools/apply-biomes.cjs); otherwise it falls back to the name, then the
 * location's base background image. Purely visual — the battle background image
 * is unchanged.
 * @param {MapLocation | undefined} location
 * @returns {string}
 */
export function biomeForLocation(location) {
  const declared = location?.biome
  if (declared && declared in BIOME_FILTERS) return declared
  const name = location?.name ?? ''
  if (/volcan|magma|lava|cinder|ember|blaze/i.test(name)) return 'volcanic'
  if (/snow|ice|frost|glacier|tundra|blizzard/i.test(name)) return 'tundra'
  if (/desert|sand|dune|wasteland|badlands/i.test(name)) return 'desert'
  if (/swamp|marsh|fen|bog|moor|wetland/i.test(name)) return 'swamp'
  if (/ruins|tower|temple|shrine|catacomb/i.test(name)) return 'ruins'
  if (/forest|tangle|thicket|jungle|weald/i.test(name)) return 'forest'
  // Grove/wood only standalone, so Cianwood and Cherrygrove don't match.
  if (/\bgrove\b|\bwoods?\b/i.test(name)) return 'forest'
  if (/autumn/i.test(name)) return 'autumn'
  if (/cave|cavern|tunnel|mine|grotto|depths|underground|well|sewer/i.test(name)) return 'cave'
  if (/sea|ocean|beach|shore|bay|harbor|harbour|port|island|marine|coast|river|lake|pond|waterfall|falls|rapid|strait|channel|dock/i.test(name))
    return 'coast'
  if (/\bmt\b|mt\.|mount|peak|summit|highland|ridge|cliff|gorge|canyon|quarry|spire/i.test(name))
    return 'mountain'
  const background = (location?.background ?? '').match(/\/([a-z_]+)\.(?:png|jpe?g|webp)/)?.[1]
  if (!background) return 'grassland'
  return { beach: 'coast', town_port: 'town' }[background] ?? background
}

/**
 * Player-facing kind labels for the special (non-terrain) location types.
 * @type {Record<string, { label: string, icon: string }>}
 */
export const AREA_INFO = {
  town: { label: 'Town', icon: '🏠' },
  hideout: { label: 'Hideout', icon: '🏴' },
  facility: { label: 'Facility', icon: '🏝️' },
  zone: { label: 'Zone', icon: '🗺️' },
  raid: { label: 'Legendary Raid', icon: '⚔️' },
}

// Terrain label + icon per biome, so a cave or forest reads as one instead of
// every wild location being a generic "Route".
/** @type {Record<string, { label: string, icon: string }>} */
const BIOME_AREA_INFO = {
  grassland: { label: 'Route', icon: '🌿' },
  forest: { label: 'Forest', icon: '🌲' },
  autumn: { label: 'Forest', icon: '🍂' },
  cave: { label: 'Cave', icon: '🕳️' },
  coast: { label: 'Sea Route', icon: '🌊' },
  mountain: { label: 'Mountain', icon: '⛰️' },
  desert: { label: 'Desert', icon: '🏜️' },
  volcanic: { label: 'Volcanic', icon: '🌋' },
  tundra: { label: 'Tundra', icon: '❄️' },
  swamp: { label: 'Swamp', icon: '🥾' },
  ruins: { label: 'Ruins', icon: '🏛️' },
  town: { label: 'Town', icon: '🏠' },
}

/**
 * The label and icon shown under a location's name in the panel. Special types
 * (town / zone / facility / raid) win, then the terrain from the committed
 * `biome` (falling back to the name / background heuristics).
 * @param {MapLocation | undefined | null} location
 * @returns {{ label: string, icon: string }}
 */
export function areaInfoFor(location) {
  if (!location) return BIOME_AREA_INFO.grassland
  const special = AREA_INFO[location.type]
  if (special) return special
  return BIOME_AREA_INFO[biomeForLocation(location)] ?? BIOME_AREA_INFO.grassland
}
