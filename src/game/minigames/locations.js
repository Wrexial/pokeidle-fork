// Fixed minigame location constants. Split from registry.js so modules lower in
// the import graph (progression/unlocks.js) can map a `minigame` gate to its
// home area without pulling in the minigame implementations — registry.js
// imports them, and bug-contest.js reaches back to progression.js, which would
// otherwise form a cycle.

/**
 * Locations that host a fixed minigame. Unlike the route activities in
 * `route-activities.js`, these are unique points of interest.
 * @type {Record<string, string>}
 */
export const MINIGAME_LOCATIONS = {
  celadonCity: 'gameCorner',
  'johto-national-park': 'bugContest',
  'sinnoh-eterna-city': 'mining',
  safariZone: 'safari',
  'paldea-mesagoza': 'academyQuiz',
  'unova-nimbasa-city': 'voltorbFlip',
  'kalos-lumiose-city': 'auctionHouse',
  'hoenn-lilycove-city': 'contest',
  'johto-ecruteak-city': 'pokeathlon',
  'sinnoh-sandgem-town': 'pokeRadar',
  'alola-heahea-city': 'battleRoyal',
  'kalos-kiloude-city': 'doubles',
  'galar-hammerlocke': 'dynamaxAdventures',
  'hoenn-mauville-city': 'lightsOut',
  'galar-motostoke': 'curry',
  'unova-virbank-city': 'pokestar',
  'johto-goldenrod-city': 'puzzleLeague',
  'hoenn-slateport-city': 'memory',
  vermilionCity: 'whack',
  'unova-castelia-city': 'musical',
  'paldea-cortondo': 'picnic',
  'kalos-laverre-city': 'pokeballFactory',
  'johto-violet-city': 'ruinsPuzzle',
  'sinnoh-snowpoint-city': 'iceSlide',
  'alola-poke-pelago': 'pokePelago',
  'alola-hauoli-city': 'mantineSurf',
  'galar-wild-area': 'rotomRally',
  'paldea-kitakami': 'ogreOustin',
  'unova-nacrene-city': 'typeFusion',
  'sinnoh-solaceon-ruins': 'unownPicross',
  'kalos-parfum-palace': 'pokeshot',
  'paldea-area-zero': 'teraRaid',
  'unova-aspertia-city': 'pokeword',
  'sinnoh-hearthome-city': 'berryBlender',
}

/**
 * The reverse of `MINIGAME_LOCATIONS`: each minigame's home area. Together with
 * `MINIGAME_REGIONS` this is the authoritative minigame -> area link, derived
 * from the map data so it can never drift from the area's own region.
 * @type {Record<string, string>}
 */
export const MINIGAME_AREAS = Object.fromEntries(
  Object.entries(MINIGAME_LOCATIONS).map(([locationId, minigameId]) => [minigameId, locationId])
)

/**
 * Every fixed minigame id, in registry order.
 * @type {string[]}
 */
export const MINIGAME_IDS = [...new Set(Object.values(MINIGAME_LOCATIONS))]
