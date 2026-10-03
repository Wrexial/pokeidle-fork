// Shared battle/town-map biome classifier for the data pipeline. Kept in
// tools/ (CommonJS) so the `apply-biomes.cjs` data pass can use it; the runtime
// mirror lives in `biomeForLocation` (src/data/ui.js), which prefers the
// committed `biome` field this writes.
//
// The classifier reads a location's name first (a "Viridian Forest" or
// "Snowpoint Temple" is obvious), then falls back to its wild table: routes
// whose encounters are mostly Water read as coast, and the remaining land types
// pick forest / swamp / desert / volcano / tundra / ruins / mountain / cave.
// A small curated table pins the iconic routes the types alone get wrong
// (Hoenn's sea routes, Sinnoh's Stark Mountain, Paldea's Area Zero).

/** Name keyword -> biome, most specific first. */
const NAME_RULES = [
  [/volcan|magma|lava|cinder|ember|blaze/i, 'volcanic'],
  [/snow|ice|frost|glacier|tundra|blizzard/i, 'tundra'],
  [/desert|sand|dune|wasteland|badlands/i, 'desert'],
  [/swamp|marsh|fen|bog|moor|wetland/i, 'swamp'],
  [/ruins|tower|temple|shrine|catacomb|pyre/i, 'ruins'],
  [/forest|tangle|thicket|jungle|weald/i, 'forest'],
  // Grove/wood only standalone, so Cianwood and Cherrygrove don't match.
  [/\bgrove\b|\bwoods?\b/i, 'forest'],
  [/cave|cavern|tunnel|mine|grotto|depths|underground|well|sewer/i, 'cave'],
  [
    /sea|ocean|beach|shore|bay|harbor|harbour|port|island|marine|coast|river|lake|pond|waterfall|falls|rapid|strait|channel|dock/i,
    'coast',
  ],
  [/\bmt\b|mt\.|mount|peak|summit|highland|ridge|cliff|gorge|canyon|quarry|spire/i, 'mountain'],
]

/**
 * Iconic routes the type table alone gets wrong, keyed by location id. Keep
 * this list small and verified: a bad entry here is visible everywhere.
 * @type {Record<string, string>}
 */
const BIOME_OVERRIDES = {
  // Hoenn's sea lanes and the Johto/Unova sea routes.
  ...Object.fromEntries([105, 106, 107, 108, 109, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134].map((n) => [`hoenn-route-${n}`, 'coast'])),
  'johto-sea-route-40': 'coast',
  'johto-sea-route-41': 'coast',
  'unova-route-17': 'coast',
  'unova-route-18': 'coast',
  'kalos-route-8': 'coast',
  // Real deserts.
  'hoenn-route-111': 'desert',
  'unova-route-4': 'desert',
  'sinnoh-route-228': 'desert',
  'kalos-route-13': 'desert',
  // Volcanic slopes.
  'hoenn-route-112': 'volcanic', // Jagged Pass, below Mt. Chimney
  'sinnoh-route-227': 'volcanic', // Stark Mountain
  // Snowfields.
  'sinnoh-route-216': 'tundra',
  'sinnoh-route-217': 'tundra',
  'galar-route-8': 'tundra',
  'galar-route-10': 'tundra',
  'paldea-terarium-polar-biome': 'tundra',
  // Woods the route number hides.
  'hoenn-route-104': 'forest', // Petalburg Woods
  'hoenn-route-116': 'forest',
  'hoenn-route-117': 'forest',
  'hoenn-route-119': 'forest', // the rain-soaked forest route
  'galar-slumbering-weald': 'forest',
  // Kitakami is the autumn-foliage DLC.
  'paldea-kitakami': 'autumn',
  'paldea-kitakami-apple-hills': 'autumn',
  'paldea-kitakami-revelers-road': 'autumn',
  // The Terarium and the Isle of Armor mix habitats the type table over-reads
  // as polar.
  'paldea-terarium': 'grassland',
  'paldea-terarium-savanna-biome': 'grassland',
  'galar-isle-of-armor': 'grassland',
  'galar-isle-of-armor-fields-of-honor': 'grassland',
  // Area Zero's crystalline bowls and research stations.
  'paldea-area-zero': 'ruins',
  'paldea-area-zero-gate': 'ruins',
  'paldea-area-zero-station-two': 'ruins',
  'paldea-area-zero-station-four': 'ruins',
  'paldea-area-zero-depths': 'cave',
  // Kanto keeps hand-curated backgrounds (locationImages in src/data/ui.js);
  // mirror the ones the type table would misread.
  route14: 'grassland',
  route15: 'grassland',
  victoryRoad: 'cave',
  mtMoon: 'cave',
  safariZone: 'grassland',
  seafoamIslands: 'cave',
  pokemonMansion: 'cave',
  powerPlant: 'cave',
}

const BACKGROUND_BIOME = {
  beach: 'coast',
  mountain: 'mountain',
  cave: 'cave',
  grassland: 'grassland',
  town: 'grassland',
  town_port: 'coast',
}

/**
 * Sum the encounter weights per type for a wild table.
 * @param {any[]} encounters
 * @param {Record<string, { types?: string[] }>} species
 * @returns {{ weights: Record<string, number>, total: number }}
 */
function typeWeights(encounters, species) {
  const weights = {}
  let total = 0
  for (const encounter of encounters ?? []) {
    total += encounter.weight
    for (const type of species[encounter.speciesKey]?.types ?? [])
      weights[type] = (weights[type] ?? 0) + encounter.weight
  }
  return { weights, total }
}

/**
 * Classify a location's biome. Pure — mirrors the committed `biome` field.
 * @param {{ id?: string, name?: string, background?: string }} location
 * @param {any[]} [encounters]
 * @param {Record<string, { types?: string[] }>} species
 * @returns {string}
 */
function deriveBiome(location, encounters, species) {
  if (location?.id && BIOME_OVERRIDES[location.id]) return BIOME_OVERRIDES[location.id]
  const name = location?.name ?? ''
  for (const [pattern, biome] of NAME_RULES) if (pattern.test(name)) return biome
  const { weights, total } = typeWeights(encounters, species)
  if (total > 0) {
    const water = (weights.Water ?? 0) / total
    if (water >= 0.5) return 'coast'
    // Most routes carry a fishing table; drop the Water signal and read the
    // land types so a desert route with a pond isn't misread as coastal.
    delete weights.Water
    const landTotal = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    if (landTotal > 0) {
      /** @param {string} type */
      const ratio = (type) => (weights[type] ?? 0) / landTotal
      if (ratio('Ice') >= 0.25) return 'tundra'
      if (ratio('Fire') >= 0.25) return 'volcanic'
      if (ratio('Ground') >= 0.4 || (ratio('Ground') + ratio('Rock') >= 0.6 && ratio('Ground') >= ratio('Rock')))
        return 'desert'
      if (ratio('Grass') + ratio('Bug') >= 0.45) return 'forest'
      if (ratio('Poison') + ratio('Dark') >= 0.5) return 'swamp'
      if (ratio('Ghost') + ratio('Psychic') >= 0.45) return 'ruins'
      if (ratio('Rock') + ratio('Steel') + ratio('Fighting') >= 0.5) return 'mountain'
      if (ratio('Grass') + ratio('Bug') >= 0.32) return 'forest'
    }
  }
  const background = (location?.background ?? '').match(/\/([a-z_]+)\./)?.[1]
  return BACKGROUND_BIOME[background] ?? 'grassland'
}

module.exports = { deriveBiome, BIOME_OVERRIDES, NAME_RULES }
