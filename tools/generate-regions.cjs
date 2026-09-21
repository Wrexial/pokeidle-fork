#!/usr/bin/env node
/**
 * Build playable region content (gens 2-9) from the scraped real maps
 * (tools/region-maps.json, produced by scrape-region-maps.cjs).
 *
 * Uses the real route/town names, connections and layout, then adds:
 *  - wild encounters per route (that generation's species)
 *  - marts + trainers in towns
 *  - a per-region gym/Elite Four/Champion league
 *  - a per-region Raid Island with that generation's uncatchable Pokemon
 *
 * Idempotent: regenerates only the non-Kanto content. Run scrape-region-maps
 * first (or keep tools/region-maps.json committed).
 *
 * Usage: node tools/generate-regions.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 1) + '\n')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')

const GEN_RANGES = [
  [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
  [650, 721], [722, 809], [810, 905], [906, 1025],
]
const REGIONS = [
  { id: 'johto', name: 'Johto', gen: 2, entry: 'new-bark-town' },
  { id: 'hoenn', name: 'Hoenn', gen: 3, entry: 'littleroot-town' },
  { id: 'sinnoh', name: 'Sinnoh', gen: 4, entry: 'twinleaf-town' },
  { id: 'unova', name: 'Unova', gen: 5, entry: 'nuvema-town' },
  { id: 'kalos', name: 'Kalos', gen: 6, entry: 'vaniville-town' },
  { id: 'alola', name: 'Alola', gen: 7, entry: 'iki-town' },
  { id: 'galar', name: 'Galar', gen: 8, entry: 'postwick' },
  { id: 'paldea', name: 'Paldea', gen: 9, entry: 'los-platos' },
]
// Every region now runs its own 5-75 curve instead of sharing one linear
// 5-100 ramp: a region's starter begins at 5 and its routes, trainers, gyms and
// league climb to 75. Regions deliberately overlap afterwards, so progress
// within a region comes from route order; reusing a levelled team from an
// earlier region is a known, separate balance issue.
const LEVEL_MIN = 5
const LEVEL_MAX = 75
// The last wild zone sits two levels below the cap so its +2 window ends at 75.
const WILD_LEVEL_MAX = LEVEL_MAX - 2
const GYM_LEVEL_MIN = 12
const GYM_LEVEL_MAX = 64
const E4_LEVEL_MIN = 68
const CHAMPION_LEVEL = LEVEL_MAX - 5
// Post-game rematch rosters, used once the player has every badge in the region
// (gyms) or has beaten the region's Champion (Elite Four / Champion).
const GYM_REMATCH_LEVEL = 80
const E4_REMATCH_LEVEL = 90
const CHAMPION_REMATCH_LEVEL = 92
// `unlockOrder` is a stable sort key, not a sequence: it is each location's
// position in its region's route progression (its `rank`), offset by region so
// later regions sort later. Deriving it instead of counting means adding a zone
// never renumbers existing ones (and never touches other regions).
const REGION_PROGRESS_BASE = 100000
// Hand-measured layouts for regions where the scraped force-directed layout
// doesn't match the real geography. Coordinates are pixels on a reference map
// (Hoenn: the ORAS world map, 1600x1050; Johto: the GSC map, 822x529); the
// generator converts them to percentages and skips its collision-avoidance
// shifting so the nodes land exactly where the reference puts them.
const REGION_MAP_LAYOUTS = {
  hoenn: {
    width: 1600,
    height: 1050,
    positions: {
      'fallarbor-town': [207, 118],
      'fortree-city': [712, 118],
      'lilycove-city': [1122, 280],
      'mossdeep-city': [1415, 375],
      'sootopolis-city': [1240, 590],
      'ever-grande-city': [1532, 668],
      'rustboro-city': [48, 425],
      'verdanturf-town': [247, 452],
      'mauville-city': [497, 452],
      'lavaridge-town': [335, 347],
      'petalburg-city': [105, 680],
      'oldale-town': [270, 680],
      'slateport-city': [490, 760],
      'littleroot-town': [270, 795],
      'dewford-town': [160, 958],
      'pacifidlog-town': [1037, 727],
      'hoenn-route-101': [265, 727],
      'hoenn-route-102': [182, 672],
      'hoenn-route-103': [347, 612],
      'hoenn-route-104': [50, 595],
      'hoenn-route-105': [42, 792],
      'hoenn-route-106': [90, 890],
      'hoenn-route-107': [265, 952],
      'hoenn-route-108': [402, 952],
      'hoenn-route-109': [487, 897],
      'hoenn-route-110': [482, 585],
      'hoenn-route-111': [478, 262],
      'hoenn-route-112': [405, 340],
      'hoenn-route-113': [340, 118],
      'hoenn-route-114': [137, 178],
      'hoenn-route-115': [37, 298],
      'hoenn-route-116': [160, 390],
      'hoenn-route-117': [370, 452],
      'hoenn-route-118': [620, 450],
      'hoenn-route-119': [645, 262],
      'hoenn-route-120': [758, 200],
      'hoenn-route-121': [935, 285],
      'hoenn-route-122': [910, 375],
      'hoenn-route-123': [810, 465],
      'hoenn-route-124': [1255, 315],
      'hoenn-route-125': [1432, 315],
      'hoenn-route-126': [1265, 490],
      'hoenn-route-127': [1432, 490],
      'hoenn-route-128': [1432, 668],
      'hoenn-route-129': [1445, 725],
      'hoenn-route-130': [1305, 725],
      'hoenn-route-131': [1145, 725],
      'hoenn-route-132': [930, 725],
      'hoenn-route-133': [760, 722],
      'hoenn-route-134': [595, 722],
      league: [1540, 548],
      raid: [1300, 920],
    },
  },
  johto: {
    width: 822,
    height: 529,
    positions: {
      'new-bark-town': [625, 302],
      'cherrygrove-city': [510, 315],
      'violet-city': [430, 188],
      'azalea-town': [265, 460],
      'goldenrod-city': [315, 245],
      'ecruteak-city': [340, 98],
      'olivine-city': [152, 185],
      'cianwood-city': [50, 380],
      'mahogany-town': [538, 140],
      'blackthorn-city': [640, 78],
      'johto-route-29': [585, 325],
      'johto-route-30': [495, 245],
      'johto-route-31': [425, 233],
      'johto-route-32': [420, 365],
      'johto-route-33': [340, 448],
      'johto-route-34': [260, 345],
      'johto-route-35': [258, 192],
      'johto-route-36': [335, 157],
      'johto-route-37': [330, 128],
      'johto-route-38': [250, 92],
      'johto-route-39': [175, 115],
      'johto-sea-route-40': [40, 195],
      'johto-sea-route-41': [130, 330],
      'johto-route-42': [395, 95],
      'johto-route-43': [500, 67],
      'johto-route-44': [575, 82],
      'johto-route-45': [575, 165],
      'johto-route-46': [560, 255],
      // Route 47/48 are HGSS-only and off this GSC map; hang them west of
      // Cianwood, where they sit in HGSS.
      'johto-route-47': [25, 400],
      'johto-route-48': [15, 355],
      'bell-tower': [335, 58],
      'whirl-islands': [70, 262],
      'mt-silver': [700, 250],
      league: [770, 105],
      raid: [620, 480],
    },
  },
  sinnoh: {
    width: 863,
    height: 810,
    positions: {
      'canalave-city': [45, 470],
      'eterna-city': [280, 310],
      'pastoria-city': [505, 525],
      'sunyshore-city': [785, 470],
      'sinnoh-route-201': [125, 611],
      'sinnoh-route-202': [150, 539],
      'sinnoh-route-203': [210, 490],
      'sinnoh-route-204': [153, 455],
      'sinnoh-route-205': [218, 365],
      'sinnoh-route-206': [306, 288],
      'sinnoh-route-207': [288, 389],
      'sinnoh-route-208': [356, 412],
      'sinnoh-route-209': [465, 410],
      'sinnoh-route-210': [460, 344],
      'sinnoh-route-211': [331, 341],
      'sinnoh-route-212': [465, 480],
      'sinnoh-route-213': [528, 550],
      'sinnoh-route-214': [630, 326],
      'sinnoh-route-215': [545, 352],
      'sinnoh-route-216': [370, 341],
      'sinnoh-route-217': [304, 190],
      'sinnoh-route-218': [98, 480],
      'sinnoh-route-219': [170, 609],
      'sinnoh-route-221': [224, 665],
      'sinnoh-route-222': [648, 449],
      'sinnoh-route-224': [855, 481],
      'sinnoh-route-225': [555, 140],
      'sinnoh-route-227': [665, 80],
      'sinnoh-route-228': [690, 138],
      'sinnoh-route-229': [710, 185],
      'twinleaf-town': [100, 634],
      'celestic-town': [415, 302],
      'sinnoh-sea-route-220': [197, 637],
      'sinnoh-sea-route-223': [816, 475],
      'sinnoh-sea-route-226': [605, 112],
      'sinnoh-sea-route-230': [630, 185],
      'sandgem-town': [150, 588],
      'floaroma-town': [155, 420],
      'solaceon-town': [505, 385],
      'jubilife-city': [150, 490],
      'oreburgh-city': [270, 490],
      'hearthome-city': [425, 435],
      'veilstone-city': [630, 360],
      'snowpoint-city': [258, 38],
    },
  },
  unova: {
    width: 1300,
    height: 853,
    positions: {
      'nuvema-town': [1185, 790],
      'accumula-town': [1185, 700],
      'striaton-city': [1155, 590],
      'nacrene-city': [1025, 600],
      'castelia-city': [665, 700],
      'nimbasa-city': [665, 460],
      'driftveil-city': [370, 460],
      'mistralton-city': [205, 338],
      'icirrus-city': [370, 215],
      'opelucid-city': [665, 215],
      'unova-route-1': [1127, 745],
      'unova-route-2': [1170, 645],
      'unova-route-3': [1090, 595],
      'unova-route-4': [665, 580],
      'unova-route-5': [518, 460],
      'unova-route-6': [288, 399],
      'unova-route-7': [288, 277],
      'unova-route-8': [397, 195],
      'unova-route-9': [531, 205],
      'unova-route-10': [670, 218],
      'unova-route-11': [728, 218],
      'unova-route-12': [829, 216],
      'unova-route-13': [1048, 277],
      'unova-route-14': [1048, 399],
      'unova-route-15': [932, 479],
      'unova-route-16': [799, 470],
      'unova-route-17': [1244, 745],
      'unova-route-18': [1185, 745],
      'lacunosa-town': [960, 215],
      'undella-town': [1135, 338],
      'anville-town': [40, 150],
      'black-city': [960, 460],
      'route-gate': [665, 600],
      'aspertia-city': [65, 775],
      'virbank-city': [335, 640],
      'humilau-city': [1190, 180],
      'floccesy-town': [165, 640],
      'lentimas-town': [955, 338],
      'unova-route-19': [115, 708],
      'unova-route-20': [250, 640],
      'unova-route-21': [997, 244],
      'unova-route-22': [1090, 228],
      'unova-route-23': [1148, 228],
    },
  },
  kalos: {
    width: 1400,
    height: 927,
    positions: {
      'vaniville-town': [930, 715],
      'kalos-route-1': [908, 683],
      'aquacorde-town': [885, 650],
      'kalos-route-2': [866, 622],
      'kalos-route-3': [840, 561],
      'santalune-city': [815, 500],
      'kalos-route-4': [788, 421],
      'lumiose-city': [760, 342],
      'kalos-route-5': [693, 424],
      'camphrier-town': [625, 505],
      'kalos-route-6': [471, 489],
      'kalos-route-7': [414, 516],
      'cyllage-city': [230, 515],
      'kalos-route-8': [316, 563],
      'ambrette-town': [290, 665],
      'kalos-route-9': [282, 698],
      'kalos-route-10': [158, 483],
      'geosenge-town': [85, 450],
      'kalos-route-11': [125, 388],
      'shalour-city': [165, 325],
      'kalos-route-12': [355, 281],
      'coumarine-city': [545, 237],
      'kalos-route-13': [653, 290],
      'kalos-route-14': [723, 236],
      'laverre-city': [685, 130],
      'kalos-route-15': [858, 198],
      'dendemille-town': [1030, 265],
      'kalos-route-16': [809, 270],
      'kalos-route-17': [1113, 303],
      'anistar-city': [1195, 340],
      'kalos-route-18': [1250, 400],
      'couriway-town': [1305, 460],
      'kalos-route-19': [1253, 488],
      'snowbelle-city': [1200, 515],
      'kalos-route-20': [1138, 531],
      'kalos-route-21': [1201, 531],
      'kalos-route-22': [992, 515],
      'kiloude-city': [1320, 295],
    },
  },
  alola: {
    width: 1400,
    height: 997,
    positions: {
      'alola-route-1--hauoli-outskirts': [200, 122],
      'alola-route-1': [225, 243],
      'alola-route-3': [202, 185],
      'alola-route-2': [160, 232],
      'iki-town': [200, 205],
      'alola-route-4': [507, 337],
      'alola-route-5': [759, 337],
      'alola-route-6': [570, 337],
      'alola-route-7': [696, 337],
      'alola-route-8': [633, 337],
      'alola-route-9': [585, 419],
      'paniola-town': [665, 295],
      'heahea-city': [600, 378],
      'konikoni-city': [570, 460],
      'alola-route-10': [1155, 471],
      'alola-route-11': [1155, 534],
      'alola-route-13': [1155, 722],
      'alola-route-15': [1155, 785],
      'alola-route-16': [1058, 569],
      'alola-route-17': [960, 441],
      'alola-route-12': [1155, 597],
      'alola-route-14': [1155, 660],
      'po-town': [960, 475],
      'hauoli-city': [175, 280],
      'malie-city': [1155, 560],
    },
  },
  galar: {
    width: 750,
    height: 1909,
    positions: {
      'galar-route-1': [408, 1793],
      'galar-route-2': [348, 1503],
      'galar-route-3': [278, 1251],
      'galar-route-4': [223, 1185],
      'galar-route-5': [330, 1133],
      'galar-route-6': [285, 1018],
      'galar-route-7': [390, 872],
      'galar-route-8': [524, 798],
      'galar-route-9': [583, 859],
      'galar-route-10': [378, 618],
      'ballonlea': [170, 680],
      'circhester': [665, 730],
      'hammerlocke': [370, 900],
      'hulbury': [470, 1120],
      'motostoke': [280, 1275],
      'postwick': [400, 1855],
      'spikemuth': [685, 965],
      'stow-on-side': [205, 880],
      'turffield': [190, 1145],
      'wedgehurst': [415, 1730],
      'wyndon': [385, 335],
    },
  },
  paldea: {
    width: 1300,
    height: 1368,
    positions: {
      'cabo-poco': [635, 1245],
      'los-platos': [640, 1135],
      'mesagoza': [620, 965],
      'cortondo': [340, 985],
      'alfornada': [175, 1170],
      'artazon': [1020, 925],
      'levincia': [1130, 685],
      'zapapico': [855, 630],
      'cascarrafa': [390, 625],
      'porto-marinada': [130, 570],
      'medali': [505, 565],
      'montenevera': [670, 245],
      'paldea-south-province-area-one': [632, 1115],
      'paldea-south-province-area-two': [480, 975],
      'paldea-south-province-area-three': [820, 945],
      'paldea-south-province-area-four': [450, 1120],
      'paldea-south-province-area-five': [870, 1080],
      'paldea-south-province-area-six': [175, 1136],
      'paldea-east-province-area-one': [1054, 922],
      'paldea-east-province-area-two': [1130, 651],
      'paldea-east-province-area-three': [888, 636],
      'paldea-west-province-area-one': [390, 591],
      'paldea-west-province-area-two': [130, 536],
      'paldea-west-province-area-three': [472, 559],
      'paldea-north-province-area-one': [1000, 265],
      'paldea-north-province-area-two': [1080, 450],
      'paldea-north-province-area-three': [565, 95],
      'mossui-town': [90, 90],
    },
  },
}
// The route the league (and Raid Island) hang off. Defaults to the region's
// highest-numbered route, but that isn't always the pre-league one: Hoenn's
// Route 134 is a southern sea route west of Slateport, while the league sits at
// Ever Grande off Route 128.
const LEAGUE_ANCHOR = { hoenn: 'hoenn-route-128' }
// Spread index i of `count` evenly across [min, max] (inclusive).
const spread = (i, count, min, max) =>
  Math.round(min + (count <= 1 ? 0 : (i * (max - min)) / (count - 1)))
const TRAINER_CLASSES = ['youngster', 'lass', 'bugCatcher', 'hiker', 'camper', 'beauty', 'coolTrainer', 'psychic', 'scientist', 'ace', 'blackbelt', 'swimmer']
// Showdown trainer sprite keys are the leader's name slugified ("Crasher Wake"
// -> "crasherwake"). A few characters only have a generation-suffixed or
// alternate sprite. Kanto is hand-curated and keeps its own gen3 keys.
const TRAINER_SPRITE_OVERRIDES = { Clavell: 'clavell-s', Phoebe: 'phoebe-gen3', Drake: 'drake-gen3' }
const trainerSpriteKey = (name) =>
  TRAINER_SPRITE_OVERRIDES[name] ??
  name.toLowerCase().replace(/['.]/g, '').replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '')
const BADGE_COLORS = ['#a0a0a0', '#4878b0', '#c8a030', '#48a048', '#b83028', '#a060c0', '#e08040', '#40c0c0']
// Real badge names for the generated regions. Galar badges are named after
// their type, Paldea's aren't individually named in-game so they follow the
// same convention, and Alola's island trials award Z-Crystals rather than
// badges. Kanto's badges are hand-curated in gym-leader-data.json.
const BADGE_NAMES = {
  johto: ['Zephyr Badge', 'Hive Badge', 'Plain Badge', 'Fog Badge', 'Storm Badge', 'Mineral Badge', 'Glacier Badge', 'Rising Badge'],
  hoenn: ['Stone Badge', 'Knuckle Badge', 'Dynamo Badge', 'Heat Badge', 'Balance Badge', 'Feather Badge', 'Mind Badge', 'Rain Badge'],
  sinnoh: ['Coal Badge', 'Forest Badge', 'Cobble Badge', 'Fen Badge', 'Relic Badge', 'Mine Badge', 'Icicle Badge', 'Beacon Badge'],
  unova: ['Trio Badge', 'Basic Badge', 'Insect Badge', 'Bolt Badge', 'Quake Badge', 'Jet Badge', 'Freeze Badge', 'Legend Badge'],
  kalos: ['Bug Badge', 'Cliff Badge', 'Rumble Badge', 'Plant Badge', 'Voltage Badge', 'Fairy Badge', 'Psychic Badge', 'Iceberg Badge'],
  alola: ['Normalium Z', 'Waterium Z', 'Firium Z', 'Grassium Z', 'Electrium Z', 'Ghostium Z', 'Fairium Z', 'Groundium Z'],
  galar: ['Grass Badge', 'Water Badge', 'Fire Badge', 'Fighting Badge', 'Fairy Badge', 'Rock Badge', 'Dark Badge', 'Dragon Badge'],
  paldea: ['Bug Badge', 'Grass Badge', 'Electric Badge', 'Water Badge', 'Normal Badge', 'Ghost Badge', 'Psychic Badge', 'Ice Badge'],
}
// Badge colours follow the leader's type (Kanto's hand-curated badges already
// do: Boulder = Rock grey, Cascade = Water blue, ...).
const TYPE_COLORS = {
  Normal: '#a8a878',
  Fire: '#f08030',
  Water: '#6890f0',
  Electric: '#f8d030',
  Grass: '#78c850',
  Ice: '#98d8d8',
  Fighting: '#c03028',
  Poison: '#a040a0',
  Ground: '#e0c068',
  Flying: '#a890f0',
  Psychic: '#f85888',
  Bug: '#a8b820',
  Rock: '#b8a038',
  Ghost: '#705898',
  Dragon: '#7038f8',
  Dark: '#705848',
  Steel: '#b8b8d0',
  Fairy: '#ee99ac',
}
const GEN_STARTERS = {
  2: ['chikorita', 'cyndaquil', 'totodile'], 3: ['treecko', 'torchic', 'mudkip'],
  4: ['turtwig', 'chimchar', 'piplup'], 5: ['snivy', 'tepig', 'oshawott'],
  6: ['chespin', 'fennekin', 'froakie'], 7: ['rowlet', 'litten', 'popplio'],
  8: ['grookey', 'scorbunny', 'sobble'], 9: ['sprigatito', 'fuecoco', 'quaxly'],
}
const GYM_LEADERS = {
  johto: ['Falkner', 'Bugsy', 'Whitney', 'Morty', 'Chuck', 'Jasmine', 'Pryce', 'Clair'],
  hoenn: ['Roxanne', 'Brawly', 'Wattson', 'Flannery', 'Norman', 'Winona', 'Tate', 'Juan'],
  sinnoh: ['Roark', 'Gardenia', 'Maylene', 'Crasher Wake', 'Fantina', 'Byron', 'Candice', 'Volkner'],
  unova: ['Cilan', 'Lenora', 'Burgh', 'Elesa', 'Clay', 'Skyla', 'Brycen', 'Drayden'],
  kalos: ['Viola', 'Grant', 'Korrina', 'Ramos', 'Clemont', 'Valerie', 'Olympia', 'Wulfric'],
  alola: ['Ilima', 'Lana', 'Kiawe', 'Mallow', 'Sophocles', 'Acerola', 'Mina', 'Hapu'],
  galar: ['Milo', 'Nessa', 'Kabu', 'Bea', 'Opal', 'Gordie', 'Piers', 'Raihan'],
  paldea: ['Katy', 'Brassius', 'Iono', 'Kofu', 'Larry', 'Ryme', 'Tulip', 'Grusha'],
}
// The real town each leader sits in, in the same order as GYM_LEADERS (matched
// by display name against the region's scraped town nodes). This is why the
// zone lock is meaningful: e.g. Falkner is in Violet City, not the entry town.
// Alola has island trials rather than gyms (and no Poni town), so it keeps the
// spread-across-towns fallback.
const GYM_TOWNS = {
  johto: ['Violet City', 'Azalea Town', 'Goldenrod City', 'Ecruteak City', 'Cianwood City', 'Olivine City', 'Mahogany Town', 'Blackthorn City'],
  hoenn: ['Rustboro City', 'Dewford Town', 'Mauville City', 'Lavaridge Town', 'Petalburg City', 'Fortree City', 'Mossdeep City', 'Sootopolis City'],
  sinnoh: ['Oreburgh City', 'Eterna City', 'Veilstone City', 'Pastoria City', 'Hearthome City', 'Canalave City', 'Snowpoint City', 'Sunyshore City'],
  unova: ['Striaton City', 'Nacrene City', 'Castelia City', 'Nimbasa City', 'Driftveil City', 'Mistralton City', 'Icirrus City', 'Opelucid City'],
  kalos: ['Santalune City', 'Cyllage City', 'Shalour City', 'Coumarine City', 'Lumiose City', 'Laverre City', 'Anistar City', 'Snowbelle City'],
  galar: ['Turffield', 'Hulbury', 'Motostoke', 'Stow On Side', 'Ballonlea', 'Circhester', 'Spikemuth', 'Hammerlocke'],
  // Grusha's gym is on Glaseado Mountain (not a town); Zapapico is the closest.
  paldea: ['Cortondo', 'Artazon', 'Levincia', 'Cascarrafa', 'Medali', 'Montenevera', 'Alfornada', 'Zapapico'],
}
const ELITE_FOUR = {
  johto: ['Will', 'Koga', 'Bruno', 'Karen'], hoenn: ['Sidney', 'Phoebe', 'Glacia', 'Drake'],
  sinnoh: ['Aaron', 'Bertha', 'Flint', 'Lucian'], unova: ['Shauntal', 'Grimsley', 'Caitlin', 'Marshal'],
  kalos: ['Malva', 'Siebold', 'Wikstrom', 'Drasna'], alola: ['Hala', 'Olivia', 'Molayne', 'Kahili'],
  galar: ['Marnie', 'Hop', 'Bede', 'Raihan'], paldea: ['Rika', 'Poppy', 'Hassel', 'Clavell'],
}
const CHAMPIONS = { johto: 'Lance', hoenn: 'Steven', sinnoh: 'Cynthia', unova: 'Alder', kalos: 'Diantha', alola: 'Kukui', galar: 'Leon', paldea: 'Geeta' }

// Primary type(s) per leader, in the same order as GYM_LEADERS, so a generated
// gym team actually matches its gym instead of being an arbitrary slice of the
// region's species list.
const GYM_TYPES = {
  johto: [['Flying'], ['Bug'], ['Normal'], ['Ghost'], ['Fighting'], ['Steel'], ['Ice'], ['Dragon']],
  hoenn: [['Rock'], ['Fighting'], ['Electric'], ['Fire'], ['Normal'], ['Flying'], ['Psychic'], ['Water']],
  sinnoh: [['Rock'], ['Grass'], ['Fighting'], ['Water'], ['Ghost'], ['Steel'], ['Ice'], ['Electric']],
  unova: [['Grass'], ['Normal'], ['Bug'], ['Electric'], ['Ground'], ['Flying'], ['Ice'], ['Dragon']],
  kalos: [['Bug'], ['Rock'], ['Fighting'], ['Grass'], ['Electric'], ['Fairy'], ['Psychic'], ['Ice']],
  alola: [['Normal'], ['Water'], ['Fire'], ['Grass'], ['Electric'], ['Ghost'], ['Fairy'], ['Ground']],
  galar: [['Grass'], ['Water'], ['Fire'], ['Fighting'], ['Fairy'], ['Rock'], ['Dark'], ['Dragon']],
  paldea: [['Bug'], ['Grass'], ['Electric'], ['Water'], ['Normal'], ['Ghost'], ['Psychic'], ['Ice']],
}
const E4_TYPES = {
  johto: [['Psychic'], ['Poison'], ['Fighting'], ['Dark']],
  hoenn: [['Dark'], ['Ghost'], ['Ice'], ['Dragon']],
  sinnoh: [['Bug'], ['Ground'], ['Fire'], ['Psychic']],
  unova: [['Ghost'], ['Dark'], ['Psychic'], ['Fighting']],
  kalos: [['Fire'], ['Water'], ['Steel'], ['Dragon']],
  alola: [['Fighting'], ['Rock'], ['Steel'], ['Flying']],
  galar: [['Dark'], ['Fighting'], ['Fairy'], ['Dragon']],
  paldea: [['Ground'], ['Steel'], ['Dragon'], ['Normal']],
}
// Champions are mixed teams, except where the ace type is clear.
const CHAMPION_TYPES = {
  johto: ['Dragon'],
  hoenn: ['Steel'],
  sinnoh: ['Dragon'],
  unova: ['Bug'],
  kalos: ['Fairy'],
  alola: [],
  galar: ['Fire'],
  paldea: ['Rock'],
}
// Route trainers are themed by class so a Bug Catcher isn't fielding starters.
const TRAINER_CLASS_TYPES = {
  youngster: ['Normal'],
  lass: ['Normal', 'Fairy'],
  bugCatcher: ['Bug'],
  hiker: ['Rock', 'Ground'],
  camper: ['Normal', 'Grass'],
  beauty: ['Normal', 'Fairy'],
  coolTrainer: [],
  psychic: ['Psychic'],
  scientist: ['Electric'],
  ace: [],
  blackbelt: ['Fighting'],
  swimmer: ['Water'],
}
// Kanto keeps its hand-curated initial teams; these types only drive the
// post-game rematch rosters (see the Kanto rematch block near the end).
const KANTO_GYM_TYPES = {
  Brock: ['Rock'],
  Misty: ['Water'],
  'Lt. Surge': ['Electric'],
  Erika: ['Grass'],
  Koga: ['Poison'],
  Sabrina: ['Psychic'],
  Blaine: ['Fire'],
  Giovanni: ['Ground'],
}
const KANTO_E4_TYPES = {
  Lorelei: ['Ice'],
  Bruno: ['Fighting'],
  Agatha: ['Ghost'],
  Lance: ['Dragon'],
}

const regionMaps = JSON.parse(fs.readFileSync(path.join(__dirname, 'region-maps.json'), 'utf8'))
const realEncounters = fs.existsSync(path.join(__dirname, 'route-encounters.json'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, 'route-encounters.json'), 'utf8'))
  : {}
const species = read('pokemon-species.json')
const evolutionData = read('evolution-data.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))
const trainerData = read('trainer-data.json')

// --- clean previous generated content ---------------------------------------
const genRegionIds = new Set(REGIONS.map((r) => r.id))
const isGenerated = (id) => genRegionIds.has(String(id).split('-')[0])
for (const key of Object.keys(mapData)) if (isGenerated(key)) delete mapData[key]
for (const key of Object.keys(encounterData)) if (isGenerated(key)) delete encounterData[key]
for (const key of Object.keys(trainerData)) if (isGenerated(key)) delete trainerData[key]
for (const loc of Object.values(mapData)) if (!loc.region) loc.region = 'kanto'

const gymData = read('gym-leader-data.json').filter((g) => !isGenerated(g.id))
const e4Data = read('elite-4-data.json').filter((e) => !isGenerated(e.id))
const champRaw = read('champion-data.json')
const champData = (Array.isArray(champRaw) ? champRaw : [champRaw]).filter((c) => !isGenerated(c.id))
for (const g of gymData) g.region ||= 'kanto'
for (const e of e4Data) e.region ||= 'kanto'
for (const c of champData) c.region ||= 'kanto'

// --- helpers -----------------------------------------------------------------
const clampLevel = (n) => Math.max(2, Math.min(100, n))
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '')
const locId = (regionId, node) => (node.startsWith(regionId + '-') ? node : `${regionId}-${node}`)
// Real wild areas the scrape drops: PokéAPI files them outside the region's
// town/route set and the compass infobox gives no direction for them. Added
// here so the generated map is complete. `rank` forces their place in the
// route order when adjacency alone would sort them too early (Mt. Silver sits
// off the entry town but is Johto's endgame).
const EXTRA_MAP_AREAS = {
  johto: [
    {
      node: 'bell-tower',
      name: 'Bell Tower',
      x: 56,
      y: 16,
      connect: [['ecruteak-city', 'north']],
      species: ['gastly', 'haunter', 'gengar', 'misdreavus', 'rattata', 'raticate', 'zubat', 'golbat'],
    },
    {
      node: 'whirl-islands',
      name: 'Whirl Islands',
      x: 27,
      y: 58,
      connect: [['johto-sea-route-41', 'south']],
      species: ['krabby', 'kingler', 'horsea', 'seadra', 'tentacool', 'tentacruel', 'seel', 'dewgong'],
    },
    {
      node: 'mt-silver',
      name: 'Mt. Silver',
      x: 84,
      y: 80,
      connect: [['new-bark-town', 'east']],
      rank: 90,
      species: ['larvitar', 'pupitar', 'onix', 'golbat', 'golduck', 'sneasel', 'misdreavus', 'donphan'],
    },
  ],
}
const EXTRA_AREA_NODES = new Set(
  Object.values(EXTRA_MAP_AREAS).flat().map((area) => area.node)
)
// Extra areas carry their own encounter list (the generation slice would drag
// mythicals like Celebi in and change the region's raid pool).
const EXTRA_AREA_SPECIES = Object.fromEntries(
  Object.entries(EXTRA_MAP_AREAS).map(([regionName, areas]) => [
    regionName,
    Object.fromEntries(areas.map((area) => [area.node, area.species])),
  ])
)
const isRouteNode = (node) =>
  /route/.test(node) ||
  node.startsWith('auto-') ||
  /province-area/.test(node) ||
  EXTRA_AREA_NODES.has(node)
const isTownNode = (node) => !isRouteNode(node)

const byId = Object.entries(species)
  .filter(([, s]) => typeof s.id === 'number' && s.id > 0)
  .map(([key, s]) => ({ key, ...s }))
const speciesForGen = (gen) => {
  const [a, b] = GEN_RANGES[gen - 1]
  return byId.filter((s) => s.id >= a && s.id <= b).sort((x, y) => x.id - y.id)
}
// Trainer teams are drawn from every generation up to the region's own (a
// regional dex, not just its new species) so themed teams have enough members:
// Johto's Morty can field the Gastly line and Clair the Dratini line. Starter
// lines and legendaries/mythicals are left out.
const ALL_STARTERS = (() => {
  const lines = new Set()
  const addLine = (key) => {
    if (lines.has(key)) return
    lines.add(key)
    for (const evolution of evolutionData[key] ?? []) addLine(evolution.into)
  }
  for (const key of [
    ...Object.values(GEN_STARTERS).flat(),
    'bulbasaur',
    'charmander',
    'squirtle',
  ])
    addLine(key)
  return lines
})()
const teamPoolForGen = (gen) => {
  const maxId = GEN_RANGES[gen - 1][1]
  return byId.filter(
    (s) => s.id <= maxId && s.catchRate > 3 && !s.legendary && !ALL_STARTERS.has(s.key)
  )
}
const encounterWeight = (s, idx) => (idx < 3 ? 20 : idx < 8 ? 12 : 6)
// Post-game rematches pull from the whole national dex so a sparse type (Ghost,
// Dragon, Ice) still has six strong, on-theme members to choose from.
const REMATCH_TEAM_POOL = teamPoolForGen(9)
const totalBaseStats = (species) =>
  Object.values(species.baseStats ?? {}).reduce((sum, stat) => sum + stat, 0)
const isFinalEvolution = (speciesKey) => !evolutionData[speciesKey]?.length
/**
 * Pick a themed team from a species pool. `types` biases the pool to matching
 * Pokemon when there are enough of them (so a Flying gym fields birds and a Bug
 * Catcher fields bugs); otherwise it falls back to the whole pool. High-level
 * (rematch) teams prefer final evolutions, and mixed teams get one strong
 * Pokemon per type. Repeats are avoided until the pool is exhausted.
 */
const buildTeam = (list, types, size, baseLevel, step = 1, offset = 0) => {
  if (list.length === 0) return []
  const preferFinal = baseLevel >= 65,
    finalsOf = (pool) => (preferFinal ? pool.filter((species) => isFinalEvolution(species.key)) : pool),
    minimum = Math.min(size, 3)
  let pool = list
  if (types?.length) {
    const typed = list.filter((species) => species.types?.some((type) => types.includes(type)))
    if (typed.length >= minimum) {
      const typedFinals = finalsOf(typed)
      pool = typedFinals.length >= minimum ? typedFinals : typed
    }
  } else {
    // Mixed trainers: the strongest Pokemon of each primary type, so an Ace
    // Trainer or Champion fields a varied, fully-evolved team.
    const strong = finalsOf(list).slice().sort((a, b) => totalBaseStats(b) - totalBaseStats(a)),
      distinct = [],
      seenTypes = new Set()
    for (const species of strong) {
      const primaryType = species.types?.[0]
      if (primaryType && !seenTypes.has(primaryType)) {
        seenTypes.add(primaryType)
        distinct.push(species)
      }
    }
    pool = distinct.length >= size ? distinct : strong.length >= minimum ? strong : list
  }
  const team = [],
    used = new Set()
  for (let i = 0; i < size; i++) {
    let entry = pool[(offset + i) % pool.length]
    if (used.has(entry.key)) entry = pool.find((candidate) => !used.has(candidate.key)) ?? entry
    used.add(entry.key)
    team.push({ speciesKey: entry.key, level: clampLevel(baseLevel + i * step) })
  }
  return team
}

/**
 * Dynamic per-zone levelling: walk the region's routes in the order they
 * unlock and spread them evenly across the region's 5-75 band. Each zone gets a
 * tight window instead of one huge aggregate range, and because the order is
 * the player's progress order the curve always ramps smoothly (the scraped real
 * levels are too inconsistent between routes/versions to rank by).
 *
 * @param {string[]} orderedKeys route keys in progression order
 * @param {Record<string, { minLevel: number, maxLevel: number }[]>} entriesByKey
 */
function levelRoutes(orderedKeys, entriesByKey) {
  const keys = orderedKeys.filter((key) => entriesByKey[key]?.length)
  const span = WILD_LEVEL_MAX - LEVEL_MIN
  keys.forEach((key, i) => {
    const t = keys.length <= 1 ? 0 : i / (keys.length - 1)
    const zoneLevel = Math.max(2, Math.min(WILD_LEVEL_MAX, Math.round(LEVEL_MIN + t * span)))
    for (const entry of entriesByKey[key]) {
      entry.minLevel = zoneLevel
      entry.maxLevel = Math.max(zoneLevel, Math.min(LEVEL_MAX, zoneLevel + 2))
    }
  })
}

// --- generate ----------------------------------------------------------------
const regions = [{ id: 'kanto', name: 'Kanto', generation: 1, order: 1, entry: 'palletTown', startLevel: 5, raidPool: [], leagueLocationKey: 'indigoPlat' }]
// Raid pools can only be worked out once every region's routes exist (a raid
// species must be absent from *all* routes), so regions queue up here and are
// filled in by the raid scan lower down.
const pendingRaids = [{ regionObj: regions[0], all: speciesForGen(1) }]

for (const region of REGIONS) {
  const { id: regionId, name, gen, entry } = region
  const map = regionMaps[regionId]
  if (!map) {
    console.warn(`no scraped map for ${regionId}, skipping`)
    continue
  }
  const nodes = [...map.nodes]
  const display = map.display
  const positions = map.positions
  for (const area of EXTRA_MAP_AREAS[regionId] ?? []) {
    if (nodes.includes(area.node)) continue
    nodes.push(area.node)
    display[area.node] = area.name
    positions[area.node] = { x: area.x, y: area.y }
    for (const [target, dir] of area.connect) map.edges.push({ from: area.node, to: target, dir })
  }
  const adjacency = {}
  for (const n of nodes) adjacency[n] = new Set()
  for (const e of map.edges) {
    if (!adjacency[e.from] || !adjacency[e.to]) continue
    adjacency[e.from].add(e.to)
    adjacency[e.to].add(e.from)
  }

  // BFS from entry; attach any isolated nodes to their nearest reachable node
  const depth = {}
  const parent = {}
  const entryNode = nodes.includes(entry) ? entry : nodes[0]
  const queue = [entryNode]
  depth[entryNode] = 0
  while (queue.length) {
    const cur = queue.shift()
    for (const nb of adjacency[cur]) {
      if (depth[nb] === undefined) {
        depth[nb] = depth[cur] + 1
        parent[nb] = cur
        queue.push(nb)
      }
    }
  }
  for (const n of nodes) {
    if (depth[n] !== undefined) continue
    let best = null, bestD = Infinity
    for (const m of nodes) {
      if (depth[m] === undefined) continue
      const dx = (positions[n]?.x ?? 0) - (positions[m]?.x ?? 0)
      const dy = (positions[n]?.y ?? 0) - (positions[m]?.y ?? 0)
      const d = dx * dx + dy * dy
      if (d < bestD) { bestD = d; best = m }
    }
    if (best) {
      depth[n] = depth[best] + 1
      parent[n] = best
      adjacency[best].add(n)
      adjacency[n].add(best)
    } else {
      depth[n] = 0
    }
  }

  // --- progression order ----------------------------------------------------
  // BFS depth alone lets far areas open early (Route 46/45 reach Blackthorn
  // before Violet City; Hoenn's eastern sea routes hang off Slateport). Order
  // locations by their real route number instead, treat a town as sitting just
  // after its lowest-numbered route, and unlock each location from the closest
  // earlier-numbered neighbour. Progression then follows the actual route path.
  const routeNumber = (node) => {
    const match = String(display[node] ?? node).match(/route\s*(\d+)/i)
    return match ? Number(match[1]) : null
  }
  const rank = {}
  for (const node of nodes) {
    if (!isRouteNode(node)) continue
    const number = routeNumber(node)
    if (number !== null) rank[node] = number
  }
  for (const node of nodes) {
    if (rank[node] !== undefined) continue
    // No route number (e.g. Paldea's province areas): sort just after the
    // lowest-numbered route it touches, else fall back to BFS depth.
    let lowest = null
    for (const neighbour of adjacency[node]) {
      const neighbourRank = rank[neighbour]
      if (neighbourRank !== undefined && (lowest === null || neighbourRank < lowest))
        lowest = neighbourRank
    }
    rank[node] = lowest !== null ? lowest + 0.5 : 10000 + depth[node]
  }
  for (const area of EXTRA_MAP_AREAS[regionId] ?? [])
    if (area.rank != null) rank[area.node] = area.rank
  rank[entryNode] = -1
  // Stable per-region progress key (see REGION_PROGRESS_BASE).
  const progressKey = (node) => gen * REGION_PROGRESS_BASE + rank[node]
  const maxProgressKey = gen * REGION_PROGRESS_BASE + Math.max(...nodes.map((node) => rank[node]))
  const order = nodes
    .slice()
    .sort(
      (a, b) =>
        rank[a] - rank[b] || depth[a] - depth[b] || String(a).localeCompare(String(b))
    )
  // Build the unlock tree with Dijkstra from the entry: stepping to a
  // higher-numbered location is cheap, going backwards is heavily penalised.
  // The tree then follows the route order without dead-end detours (Route 6
  // hangs off Route 7) or the BFS shortcuts that opened Blackthorn early.
  const BACKWARD_PENALTY = 1e6
  const dist = { [entryNode]: 0 }
  const unlockParent = {}
  const settled = new Set()
  while (settled.size < nodes.length) {
    let current = null
    for (const node of nodes) {
      if (settled.has(node) || dist[node] === undefined) continue
      if (current === null || dist[node] < dist[current]) current = node
    }
    if (current === null) break
    settled.add(current)
    for (const neighbour of adjacency[current]) {
      const forward = rank[neighbour] >= rank[current]
      const next =
        dist[current] +
        Math.abs(rank[neighbour] - rank[current]) +
        (forward ? 0 : BACKWARD_PENALTY)
      if (dist[neighbour] === undefined || next < dist[neighbour]) {
        dist[neighbour] = next
        unlockParent[neighbour] = current
      }
    }
  }
  for (const node of nodes)
    if (node !== entryNode && !unlockParent[node]) unlockParent[node] = parent[node] ?? null

  const routeNodes = order.filter(isRouteNode)
  const townNodes = order.filter(isTownNode)
  const usedPos = []
  const placeAt = (x0, y0) => {
    let x = x0
    let y = y0
    let guard = 0
    while (guard++ < 200) {
      let ok = true
      for (const p of usedPos)
        if (Math.hypot(x - p.x, y - p.y) < 6) {
          ok = false
          break
        }
      if (ok) break
      x = x + 5 > 96 ? 4 : x + 5
      y = y + 4 > 96 ? 4 : y + 4
    }
    usedPos.push({ x, y })
    return { x, y }
  }
  const fixedLayout = REGION_MAP_LAYOUTS[regionId],
    // Fit the reference into the square world canvas without distorting it
    // (Galar's art is 0.39:1, so filling the square would stretch it 2.5x).
    layoutScale = fixedLayout ? 100 / Math.max(fixedLayout.width, fixedLayout.height) : 0,
    layoutOffsetX = fixedLayout ? (100 - fixedLayout.width * layoutScale) / 2 : 0,
    layoutOffsetY = fixedLayout ? (100 - fixedLayout.height * layoutScale) / 2 : 0,
    fixedPosition = (node) => {
      const [px, py] = fixedLayout?.positions?.[node] ?? []
      return px == null
        ? null
        : {
            x: +(px * layoutScale + layoutOffsetX).toFixed(2),
            y: +(py * layoutScale + layoutOffsetY).toFixed(2),
          }
    }
  const place = (node) =>
    fixedPosition(node) ?? placeAt(positions[node]?.x ?? 50, positions[node]?.y ?? 50)
  const base = LEVEL_MIN
  const starters = GEN_STARTERS[gen]
  const all = speciesForGen(gen)
  const wild = all.filter((s) => s.catchRate > 3 && !starters.includes(s.key))
  const teamPool = teamPoolForGen(gen)

  // Resolve each gym to its town up-front so gate placement, the badge/team
  // data below and the league requirement all agree.
  const gymTowns = townNodes.length ? townNodes : [entryNode]
  const gymPlacements = (GYM_LEADERS[regionId] ?? []).map((leaderName, i) => {
    const preferredTown = (GYM_TOWNS[regionId] ?? [])[i],
      preferredNode = preferredTown
        ? townNodes.find((node) => (display[node] ?? node) === preferredTown)
        : null
    return {
      id: `${regionId}-gym-${i + 1}`,
      index: i,
      leaderName,
      townNode: preferredNode ?? gymTowns[i % gymTowns.length],
    }
  })
  // Attach each gym's badge gate to the point in the route order where the
  // badge is actually needed. Gyms sit in their real cities, which are visited
  // in an order that can differ from the canonical gym order (Hoenn's Petalburg
  // holds gym 5 but is reached before Rustboro's gym 1), so a gate on the town
  // itself would arrive far too early and wall off the early game. Instead,
  // walk the gyms in badge order and place each gate after both its own town
  // and the previous gate: gym 5 ends up on the road past Lavaridge and the
  // player backtracks to Petalburg for it, while its canonical level (and the
  // jump that comes with it) is kept. A gym whose town sits too late in the
  // route order gets no gate and is only required at the league.
  //
  // The route order is by route number, not tree order, so a node listed after
  // a town can still be one of its ancestors (Sinnoh's Route 215 gates
  // Veilstone). Gating such a node would lock the town that holds the gym, so
  // skip ancestors while scanning forward.
  const nodePosition = new Map(order.map((node, position) => [node, position]))
  const isAncestorOf = (ancestor, node) => {
    let current = node
    while (current) {
      if (current === ancestor) return true
      if (current === entryNode) return false
      current = unlockParent[current] ?? parent[current] ?? null
    }
    return false
  }
  const gateGymByNode = {}
  let previousGate = -1
  for (const gym of gymPlacements) {
    const start = Math.max(
      previousGate + 1,
      (nodePosition.get(gym.townNode) ?? 0) + 1,
      1
    )
    for (let position = start; position < order.length; position++) {
      const candidate = order[position]
      if (candidate === gym.townNode || isAncestorOf(candidate, gym.townNode)) continue
      gateGymByNode[candidate] = gym.id
      previousGate = position
      break
    }
  }
  // A location that unlocks from a neighbour sitting before a badge gate can
  // slip past that badge (Johto's Route 36 opens from Violet City, skipping the
  // badges earned down the southern path). Make those locations require the gate
  // they bypass too, unless they are needed to reach that gate's own gym town.
  const gymTownById = Object.fromEntries(gymPlacements.map((gym) => [gym.id, gym.townNode]))
  const gatePositionByGym = {}
  for (const [node, gymId] of Object.entries(gateGymByNode))
    if (gatePositionByGym[gymId] === undefined) gatePositionByGym[gymId] = nodePosition.get(node)
  const propagatedGateByNode = {}
  let activeGate = null
  for (const node of order) {
    if (gateGymByNode[node]) activeGate = gateGymByNode[node]
    if (!activeGate || gateGymByNode[node]) continue
    const parentNode = unlockParent[node] ?? parent[node]
    if (!parentNode || parentNode === node) continue
    const parentPosition = nodePosition.get(parentNode)
    if (parentPosition === undefined || parentPosition >= gatePositionByGym[activeGate]) continue
    if (isAncestorOf(node, gymTownById[activeGate])) continue
    propagatedGateByNode[node] = activeGate
  }

  const regionObj = {
    id: regionId,
    name,
    generation: gen,
    order: gen,
    entry: locId(regionId, entryNode),
    startLevel: base,
  }
  regions.push(regionObj)

  // encounters: real per-route species when available, else a generation slice.
  // Levels here are placeholders; levelRoutes() re-bands them per zone below.
  const perRoute = 8
  const routeEncounter = {}
  routeNodes.forEach((node, i) => {
    const placeholder = clampLevel(base + Math.max(0, depth[node] - 1) * 2),
      extraSpecies = EXTRA_AREA_SPECIES[regionId]?.[node],
      real = realEncounters[regionId]?.[node]
    let encounters
    if (extraSpecies) {
      encounters = extraSpecies
        .filter((key) => species[key])
        .map((key, idx) => ({
          speciesKey: key,
          weight: encounterWeight(null, idx),
          minLevel: placeholder,
          maxLevel: placeholder,
        }))
    } else if (real && real.length) {
      encounters = real.map((e) => ({ ...e }))
    } else if (wild.length) {
      const start =
        routeNodes.length <= 1
          ? 0
          : Math.round((i * Math.max(0, wild.length - perRoute)) / (routeNodes.length - 1))
      encounters = wild
        .slice(start, start + perRoute)
        .map((s, idx) => ({
          speciesKey: s.key,
          weight: encounterWeight(s, idx),
          minLevel: placeholder,
          maxLevel: placeholder,
        }))
    } else {
      encounters = []
    }
    routeEncounter[node] = { name: display[node] ?? node, encounters }
  })

  // dynamic per-zone levelling across this region's routes, in unlock order
  const routeEntries = {}
  for (const node of routeNodes) routeEntries[locId(regionId, node)] = routeEncounter[node].encounters
  levelRoutes(
    routeNodes.map((node) => locId(regionId, node)),
    routeEntries
  )

  // starters are a rare find on the first route (added after levelling so they
  // don't skew the curve)
  const firstBucket = routeNodes.length ? routeEncounter[routeNodes[0]].encounters : null
  if (firstBucket) {
    const zoneLevel = firstBucket[0]?.minLevel ?? base
    for (const key of starters)
      if (species[key] && !firstBucket.some((e) => e.speciesKey === key))
        firstBucket.push({
          speciesKey: key,
          weight: 1,
          minLevel: zoneLevel,
          maxLevel: clampLevel(zoneLevel + 2),
        })
  }

  // The raid pool is filled in after the region loop (see the raid scan).

  // A route's wild level (or the nearest route's), so flavour gates can ask the
  // player to train up to roughly where the game already expects them.
  const regionSpan = WILD_LEVEL_MAX - LEVEL_MIN
  const zoneLevelFor = (node) => {
    const ownLevel = routeEncounter[node]?.encounters?.[0]?.minLevel
    if (ownLevel != null) return ownLevel
    for (const neighbour of adjacency[node]) {
      const neighbourLevel = routeEncounter[neighbour]?.encounters?.[0]?.minLevel
      if (neighbourLevel != null) return neighbourLevel
    }
    const progress = (nodePosition.get(node) ?? 0) / Math.max(1, order.length - 1)
    return clampLevel(Math.round(LEVEL_MIN + progress * regionSpan))
  }

  // map/town/route locations
  const prevRegionId = gen === 2 ? 'kanto' : REGIONS[gen - 3].id
  for (const node of order) {
    const id = locId(regionId, node)
    const isRoute = isRouteNode(node)
    const parent = node === entryNode ? null : (unlockParent[node] ?? null)
    let unlock
    if (node === entryNode) {
      unlock = { entry: true, previous: prevRegionId }
    } else if (!parent) {
      unlock = {}
    } else if (parent === entryNode) {
      // The first step out of the entry: a light catch goal gets the player
      // hunting rather than grinding the starting route.
      unlock = { requires: [locId(regionId, entryNode)], caughtCount: 2 }
    } else {
      const parentId = locId(regionId, parent),
        position = nodePosition.get(node) ?? 0,
        progress = position / Math.max(1, order.length - 1)
      // Rotate the gate flavour so progression isn't one repeated "win 15
      // battles" check: most gates stay battle-based with a varied count, while
      // some ask for Pokedex progress or a bit of training.
      switch (position % 4) {
        case 1:
          unlock = {
            battlesAtLocation: [{ locationId: parentId, count: 5 }],
            caughtCount: Math.max(3, Math.round(progress * 30)),
          }
          // The route-exclusive catch pass (below) may swap the easy global
          // `caughtCount` for a harder, route-specific `caughtOnRoute` when the
          // parent route has species found nowhere else.
          if (isRouteNode(parent)) unlock.routeCatchParent = parentId
          break
        case 3:
          unlock = {
            battlesAtLocation: [{ locationId: parentId, count: 5 }],
            partyLevel: Math.max(LEVEL_MIN, zoneLevelFor(node) - 2),
          }
          break
        default:
          unlock = {
            battlesAtLocation: [{ locationId: parentId, count: 10 + ((position * 7) % 11) }],
          }
          // A battle-only gate can also grow a route-exclusive catch check (see
          // the route-exclusive catch pass below).
          if (isRouteNode(parent)) unlock.routeCatchParent = parentId
      }
    }
    // The badge that gates the road onward, placed where it is needed (or the
    // badge this location would otherwise slip past).
    const gate = gateGymByNode[node] ?? propagatedGateByNode[node]
    if (gate) unlock.gymsRequired = [gate]
    if (isRoute) {
      encounterData[id] = routeEncounter[node]
      mapData[id] = {
        id,
        name: routeEncounter[node]?.name ?? node,
        type: 'route',
        region: regionId,
        description: `A route in the ${name} region.`,
        routeKey: id,
        connections: [...adjacency[node]].map((n) => locId(regionId, n)),
        unlock,
        unlockOrder: progressKey(node),
        position: place(node),
      }
    } else {
      mapData[id] = {
        id,
        name: display[node] ?? node,
        type: 'town',
        region: regionId,
        description: `A town in the ${name} region.`,
        connections: [...adjacency[node]].map((n) => locId(regionId, n)),
        unlock,
        unlockOrder: progressKey(node),
        position: place(node),
        mart: {
          name: `${name} Mart`,
          items: [
            { itemId: 'pokeball' }, { itemId: 'greatball' }, { itemId: 'ultraball' },
            { itemId: 'repel' }, { itemId: 'honey' },
          ],
        },
      }
      const pool = teamPool.length ? teamPool : wild
      // Town trainers follow the same 5-75 curve as the nearby routes.
      const townIndex = order.indexOf(node),
        townT = order.length <= 1 ? 0 : townIndex / (order.length - 1),
        townLevel = clampLevel(Math.round(LEVEL_MIN + townT * (WILD_LEVEL_MAX - LEVEL_MIN)))
      if (pool.length)
        trainerData[id] = [0, 1, 2].map((i) => {
          const trainerClass = TRAINER_CLASSES[(gen * 3 + i) % TRAINER_CLASSES.length]
          return {
            id: `${id}_t${i + 1}`,
            name: `${name} Trainer ${i + 1}`,
            trainerClass,
            team: buildTeam(
              pool,
              TRAINER_CLASS_TYPES[trainerClass],
              2,
              Math.min(townLevel + i, LEVEL_MAX - 1),
              1,
              i * 2
            ),
          }
        })
    }
  }

  // raid island
  const lastRoute = routeNodes[routeNodes.length - 1],
    finaleRoute = LEAGUE_ANCHOR[regionId] ?? lastRoute
  if (finaleRoute) {
    const raidId = `${regionId}-raid`
    const raidNodeName = `${name} Raid Island`
    // Bucket + pool are created by the raid scan once all routes are known.
    pendingRaids.push({ regionObj, all, raidId, raidNodeName })
    mapData[raidId] = {
      id: raidId,
      name: raidNodeName,
      type: 'raid',
      region: regionId,
      description: `A mysterious island where ${name}'s rarest Pokemon dwell.`,
      routeKey: raidId,
      connections: [locId(regionId, finaleRoute)],
      unlock: {
        battlesAtLocation: [{ locationId: locId(regionId, finaleRoute), count: 20 }],
      },
      unlockOrder: maxProgressKey + 1,
      position:
        fixedPosition('raid') ??
        placeAt(
          Math.min(94, (positions[finaleRoute]?.x ?? 50) + 8),
          Math.max(6, (positions[finaleRoute]?.y ?? 50) - 10)
        ),
    }
  }

  // Pokémon League: the Elite Four's zone. It hangs off the region's finale
  // route so the league challenge is gated behind reaching (and battling in)
  // the region's final area instead of being startable from anywhere.
  const leagueNode = finaleRoute ?? entryNode
  const leagueId = `${regionId}-league`
  mapData[leagueId] = {
    id: leagueId,
    name: `${name} Pokémon League`,
    type: 'town',
    region: regionId,
    description: `The ${name} Pokémon League.`,
    connections: [locId(regionId, leagueNode)],
    unlock: {
      battlesAtLocation: [{ locationId: locId(regionId, leagueNode), count: 20 }],
      // Every badge is required for the league, including any gym that got no
      // road gate (see gateGymByNode above).
      gymsRequired: gymPlacements.map((gym) => gym.id),
    },
    unlockOrder: maxProgressKey + 2,
    position:
      fixedPosition('league') ??
      placeAt(
        Math.min(94, (positions[leagueNode]?.x ?? 50) + 10),
        Math.max(6, (positions[leagueNode]?.y ?? 50) - 4)
      ),
  }
  regionObj.leagueLocationKey = leagueId

  // league: gyms spread across towns, then Elite Four + Champion
  const roster = teamPool.length ? teamPool : wild
  gymPlacements.forEach(({ id: gymId, leaderName, townNode, index }) => {
    gymData.push({
      id: gymId,
      name: leaderName,
      title: `${name} Gym Leader`,
      region: regionId,
      locationKey: locId(regionId, townNode),
      badgeName: BADGE_NAMES[regionId]?.[index] ?? `${name} Badge ${index + 1}`,
      badgeColor:
        TYPE_COLORS[GYM_TYPES[regionId]?.[index]?.[0]] ?? BADGE_COLORS[index % BADGE_COLORS.length],
      spriteKey: trainerSpriteKey(leaderName),
      team: buildTeam(
        roster,
        GYM_TYPES[regionId]?.[index],
        3,
        clampLevel(spread(index, gymPlacements.length, GYM_LEVEL_MIN, GYM_LEVEL_MAX)),
        1,
        index * 3
      ),
      rematchTeam: buildTeam(
        REMATCH_TEAM_POOL,
        GYM_TYPES[regionId]?.[index],
        6,
        GYM_REMATCH_LEVEL,
        1,
        index * 2
      ),
    })
  })
  const eliteFour = ELITE_FOUR[regionId] ?? []
  eliteFour.forEach((memberName, i) => {
    e4Data.push({
      id: `${regionId}-e4-${i + 1}`,
      name: memberName,
      title: `${name} Elite Four`,
      region: regionId,
      spriteKey: trainerSpriteKey(memberName),
      team: buildTeam(roster, E4_TYPES[regionId]?.[i], 5, clampLevel(E4_LEVEL_MIN + i), 1, i * 2),
      rematchTeam: buildTeam(REMATCH_TEAM_POOL, E4_TYPES[regionId]?.[i], 6, E4_REMATCH_LEVEL, 1, i),
    })
  })
  const championPool = CHAMPION_TYPES[regionId]?.length ? REMATCH_TEAM_POOL : roster
  champData.push({
    id: `${regionId}-champion`,
    name: CHAMPIONS[regionId],
    title: `${name} Champion`,
    region: regionId,
    spriteKey: trainerSpriteKey(CHAMPIONS[regionId]),
    team: buildTeam(roster, CHAMPION_TYPES[regionId], 6, clampLevel(CHAMPION_LEVEL), 1, gen),
    rematchTeam: buildTeam(championPool, CHAMPION_TYPES[regionId], 6, CHAMPION_REMATCH_LEVEL, 1, gen),
  })
}

// refresh Kanto wild encounters from the real data too (keeping the curated
// location names, and re-adding the Kanto starters as rare Safari Zone finds)
if (realEncounters.kanto) {
  let refreshed = 0
  for (const loc of Object.values(mapData)) {
    if ((loc.region ?? 'kanto') !== 'kanto' || !loc.routeKey) continue
    const real = realEncounters.kanto[loc.routeKey]
    if (real && real.length && encounterData[loc.routeKey]) {
      encounterData[loc.routeKey] = {
        name: encounterData[loc.routeKey].name,
        encounters: real.map((e) => ({ ...e })),
      }
      refreshed++
    }
  }
  // Kanto gets the same dynamic per-zone levelling as the other regions
  const kantoEntries = {}
  for (const loc of Object.values(mapData)) {
    if ((loc.region ?? 'kanto') !== 'kanto' || !loc.routeKey) continue
    if (encounterData[loc.routeKey]) kantoEntries[loc.routeKey] = encounterData[loc.routeKey].encounters
  }
  levelRoutes(
    Object.values(mapData)
      .filter((loc) => (loc.region ?? 'kanto') === 'kanto' && loc.routeKey)
      .sort((a, b) => (a.unlockOrder ?? 0) - (b.unlockOrder ?? 0))
      .map((loc) => loc.routeKey),
    kantoEntries
  )
  // re-add the Kanto starters as rare Safari Zone finds, at that zone's level
  const safariAfter = encounterData.safariZone
  if (safariAfter) {
    const zoneLevel = safariAfter.encounters[0]?.minLevel ?? 20
    for (const key of ['bulbasaur', 'charmander', 'squirtle'])
      if (species[key] && !safariAfter.encounters.some((e) => e.speciesKey === key))
        safariAfter.encounters.push({
          speciesKey: key,
          weight: 1,
          minLevel: zoneLevel,
          maxLevel: clampLevel(zoneLevel + 2),
        })
  }
  console.log('kanto buckets refreshed:', refreshed)
}

// --- route-exclusive catch gates ---------------------------------------------
// A share of the generated progress gates ask the player to catch Pokemon that
// spawn only on the route they just cleared — a route-specific, harder variant
// of the easy global `caughtCount`. "Exclusive" means the species turns up on
// no other wild route in any region (Raid Islands don't count); legendaries,
// starters and other nearly uncatchable finds are skipped. The pass marks the
// `caughtCount` and battle-only gates whose parent is a route and, once
// exclusivity is known, drops the global count in favour of `caughtOnRoute` (or
// simply adds it to a battle gate). Routes without exclusives keep their gate.
const ROUTE_CATCH_LIMIT = 3
// Ultra-rare finds (weight 1-2) stay out of the gate: asking for a ~1% spawn
// turns a flavour check into a chore. Route-exclusive species are the point, so
// a route whose only exclusives are that rare simply keeps its `caughtCount`.
const ROUTE_CATCH_MIN_WEIGHT = 3
/** @type {Record<string, Set<string>>} */
const routesBySpecies = {}
for (const [bucketKey, bucket] of Object.entries(encounterData)) {
  if (/-raid$/.test(bucketKey)) continue
  for (const encounter of bucket.encounters) {
    const routes =
      routesBySpecies[encounter.speciesKey] ?? (routesBySpecies[encounter.speciesKey] = new Set())
    routes.add(bucketKey)
  }
}
/** @type {Record<string, string[]>} */
const exclusiveSpeciesByRoute = {}
for (const [speciesKey, routes] of Object.entries(routesBySpecies)) {
  if (routes.size !== 1) continue
  const entry = species[speciesKey]
  if (!entry || entry.catchRate <= 3 || entry.legendary || ALL_STARTERS.has(speciesKey)) continue
  const [routeKey] = routes
  const wild = encounterData[routeKey]?.encounters?.find((e) => e.speciesKey === speciesKey)
  if (!wild || wild.weight < ROUTE_CATCH_MIN_WEIGHT) continue
  ;(exclusiveSpeciesByRoute[routeKey] ??= []).push(speciesKey)
}
for (const location of Object.values(mapData)) {
  const unlockRule = location.unlock
  if (!unlockRule?.routeCatchParent) continue
  const exclusives = exclusiveSpeciesByRoute[unlockRule.routeCatchParent]
  if (exclusives && exclusives.length > 0) {
    const speciesKeys = exclusives.slice(0, ROUTE_CATCH_LIMIT)
    delete unlockRule.caughtCount
    unlockRule.caughtOnRoute = { routeKey: unlockRule.routeCatchParent, species: speciesKeys, count: speciesKeys.length }
  }
  delete unlockRule.routeCatchParent
}

// --- Kanto rematch rosters ---------------------------------------------------
// Kanto's initial teams and gen3 sprites are hand-curated and kept as-is; only
// bolt on the post-game rematch rosters so a fully-badged player can re-fight
// them at the same levels as the generated regions.
for (const gym of gymData) {
  if ((gym.region ?? 'kanto') !== 'kanto') continue
  const types = KANTO_GYM_TYPES[gym.name]
  if (types) gym.rematchTeam = buildTeam(REMATCH_TEAM_POOL, types, 6, GYM_REMATCH_LEVEL, 1)
}
for (const member of e4Data) {
  if ((member.region ?? 'kanto') !== 'kanto') continue
  const types = KANTO_E4_TYPES[member.name]
  if (types) member.rematchTeam = buildTeam(REMATCH_TEAM_POOL, types, 6, E4_REMATCH_LEVEL, 1)
}
for (const champion of champData) {
  if ((champion.region ?? 'kanto') !== 'kanto') continue
  champion.rematchTeam = buildTeam(teamPoolForGen(1), [], 6, CHAMPION_REMATCH_LEVEL, 1)
}

// --- raid pools --------------------------------------------------------------
// A species belongs on a Raid Island only if it turns up on no region's wild
// routes and can't be reached by evolving something that does. Scan every
// route once, then give each region its own generation's leftovers.
const routable = new Set()
for (const [bucketKey, bucket] of Object.entries(encounterData)) {
  if (/-raid$/.test(bucketKey)) continue
  for (const encounter of bucket.encounters) routable.add(encounter.speciesKey)
}
let routableExpanded = true
while (routableExpanded) {
  routableExpanded = false
  for (const key of [...routable])
    for (const evolution of evolutionData[key] || [])
      if (!routable.has(evolution.into))
        (routable.add(evolution.into), (routableExpanded = true))
}
// Raids are the region's endgame, so they sit at the top of the 5-75 curve.
const raidLevel = (entry) => clampLevel(entry.catchRate <= 3 ? LEVEL_MAX : LEVEL_MAX - 5)
for (const pending of pendingRaids) {
  const { regionObj, all: regionSpecies, raidId, raidNodeName } = pending
  regionObj.raidPool = regionSpecies
    .filter((entry) => !routable.has(entry.key))
    .map((entry) => ({ speciesKey: entry.key, level: raidLevel(entry) }))
  if (raidId)
    encounterData[raidId] = {
      name: raidNodeName,
      encounters: regionObj.raidPool.map((entry) => ({
        speciesKey: entry.speciesKey,
        weight: 1,
        minLevel: entry.level,
        maxLevel: entry.level,
      })),
    }
}

// tidy the graph: make every connection mutual, and hang any isolated location
// (e.g. Kanto's Raid Island) off its nearest neighbour so it isn't floating
// on the map with no road.
for (const loc of Object.values(mapData)) {
  for (const id of [...loc.connections]) {
    const other = mapData[id]
    if (other && !other.connections.includes(loc.id)) other.connections.push(loc.id)
  }
}
for (const loc of Object.values(mapData)) {
  if (loc.connections.length) continue
  let best = null,
    bestD = Infinity
  for (const other of Object.values(mapData)) {
    if (other.id === loc.id || (other.region ?? 'kanto') !== (loc.region ?? 'kanto')) continue
    const dx = other.position.x - loc.position.x,
      dy = other.position.y - loc.position.y
    if (dx * dx + dy * dy < bestD) ((bestD = dx * dx + dy * dy), (best = other))
  }
  if (best) {
    loc.connections.push(best.id)
    best.connections.push(loc.id)
  }
}

// Region entry points are gated on the player's starting region: a start region
// is open immediately, and every other region opens by beating the previous
// region's Champion (cycling Kanto <- Paldea so nothing is unreachable).
if (mapData.palletTown) mapData.palletTown.unlock = { entry: true, previous: 'paldea' }
if (mapData.route1) mapData.route1.unlock = { requires: ['palletTown'] }

write('regions.json', regions)
writeRegionDir(path.join(DATA, 'map-data'), mapData)
writeRegionDir(
  path.join(DATA, 'encounter-data'),
  encounterData,
  (key) => mapData[key]?.region ?? 'kanto'
)
write('trainer-data.json', trainerData)
write('gym-leader-data.json', gymData)
write('elite-4-data.json', e4Data)
write('champion-data.json', champData)

console.log('regions:', regions.length)
console.log('locations:', Object.keys(mapData).length)
console.log('encounter buckets:', Object.keys(encounterData).length)
console.log('gyms:', gymData.length, '| elite4:', e4Data.length, '| champions:', champData.length)
