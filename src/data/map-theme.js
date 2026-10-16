// Per-region Town Map themes (TODO #99). Each region gets its own sea, coast,
// land base and accent palette so the maps read as distinct places instead of
// one recoloured template. The individual location blobs still take their
// colour from their biome (`biomeForLocation`); the theme only grades the
// ocean, the coastline, the land base and the UI accents.
//
// `ocean`/`oceanDeep`/`oceanShallow` feed the sea gradient and the deep-water
// blob; `land`/`landDeep` tint the blurred landmass wash that ties a region's
// patches into one landmass; `shore` is the beach rim; `accent`/`accentBright`
// colour the region watermark and the framed canvas edge; `ink` is the
// watermark/label ink; `haze` is the vignette that darkens the map edge.

/** @typedef {{ id: string, name: string, ocean: string, oceanDeep: string, oceanShallow: string, shore: string, land: string, landDeep: string, accent: string, accentBright: string, ink: string, haze: string }} MapTheme */

/** @type {Record<string, MapTheme>} */
export const MAP_THEMES = {
  kanto: {
    id: 'kanto',
    name: 'Kanto',
    ocean: '#2c6fb0',
    oceanDeep: '#17497c',
    oceanShallow: '#63a9d6',
    shore: '#ead6a0',
    land: '#8fbf6a',
    landDeep: '#5a9448',
    accent: '#d8453a',
    accentBright: '#f5c542',
    ink: '#3a2810',
    haze: '#d9c69a',
  },
  johto: {
    id: 'johto',
    name: 'Johto',
    ocean: '#2f7fa0',
    oceanDeep: '#1b5075',
    oceanShallow: '#6fb6c9',
    shore: '#e7d29a',
    land: '#c2a24e',
    landDeep: '#7d7a3a',
    accent: '#c8792f',
    accentBright: '#f0c04a',
    ink: '#3a2a12',
    haze: '#d8c48f',
  },
  hoenn: {
    id: 'hoenn',
    name: 'Hoenn',
    ocean: '#17a3b0',
    oceanDeep: '#0f6f8f',
    oceanShallow: '#6fdcd6',
    shore: '#f0dfa6',
    land: '#69b95e',
    landDeep: '#2f8a56',
    accent: '#e8613c',
    accentBright: '#ffd24a',
    ink: '#123a30',
    haze: '#cfe6c6',
  },
  sinnoh: {
    id: 'sinnoh',
    name: 'Sinnoh',
    ocean: '#4a719e',
    oceanDeep: '#2a4a72',
    oceanShallow: '#9dc0dc',
    shore: '#dde6ea',
    land: '#9fb7a8',
    landDeep: '#617d84',
    accent: '#7a9fd0',
    accentBright: '#d8ecff',
    ink: '#22303e',
    haze: '#cdd9df',
  },
  unova: {
    id: 'unova',
    name: 'Unova',
    ocean: '#3f6d7a',
    oceanDeep: '#263a4a',
    oceanShallow: '#8bb6b8',
    shore: '#d8cfa8',
    land: '#8a9a63',
    landDeep: '#5c6d47',
    accent: '#3f9a8f',
    accentBright: '#e0c060',
    ink: '#28302a',
    haze: '#cfd0b8',
  },
  kalos: {
    id: 'kalos',
    name: 'Kalos',
    ocean: '#3f77b6',
    oceanDeep: '#1d3f6e',
    oceanShallow: '#8fc0e6',
    shore: '#ecdcb0',
    land: '#7fbf72',
    landDeep: '#4c6f9a',
    accent: '#c9a6e0',
    accentBright: '#ffd76a',
    ink: '#2e2440',
    haze: '#e0d2ec',
  },
  alola: {
    id: 'alola',
    name: 'Alola',
    ocean: '#18a2c4',
    oceanDeep: '#0d5f86',
    oceanShallow: '#7fe6e0',
    shore: '#f6e2a6',
    land: '#6ec464',
    landDeep: '#2f9560',
    accent: '#f2703f',
    accentBright: '#ffd23f',
    ink: '#0f3a44',
    haze: '#ffe0b0',
  },
  galar: {
    id: 'galar',
    name: 'Galar',
    ocean: '#46567a',
    oceanDeep: '#2a3350',
    oceanShallow: '#8f9cc0',
    shore: '#d6c9a8',
    land: '#7f8f6a',
    landDeep: '#4c5a44',
    accent: '#e0559a',
    accentBright: '#ffd75e',
    ink: '#2a2438',
    haze: '#c8c2d8',
  },
  paldea: {
    id: 'paldea',
    name: 'Paldea',
    ocean: '#3f86b8',
    oceanDeep: '#1f5480',
    oceanShallow: '#8fc8e0',
    shore: '#f0dca8',
    land: '#b0b45e',
    landDeep: '#6f8a4a',
    accent: '#8f5fc0',
    accentBright: '#f2c14e',
    ink: '#33301e',
    haze: '#e6dcb8',
  },
}

/** The palette a region without its own entry falls back to. */
export const DEFAULT_MAP_THEME = MAP_THEMES.kanto

/**
 * The theme for a region id (its parent when it is a DLC subregion), or the
 * default palette for an unknown region.
 * @param {string | undefined | null} regionId
 * @param {string | undefined | null} [parentRegion]
 * @returns {MapTheme}
 */
export function mapThemeFor(regionId, parentRegion) {
  return (
    MAP_THEMES[regionId ?? ''] ??
    (parentRegion ? MAP_THEMES[parentRegion] : undefined) ??
    DEFAULT_MAP_THEME
  )
}
