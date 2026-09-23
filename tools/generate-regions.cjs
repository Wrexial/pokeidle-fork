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
// Item evolutions have no level requirement; treat them as evolving around here
// when judging whether a trainer should already have evolved a Pokemon.
const ITEM_EVOLUTION_LEVEL = 45
// Open-world Paldea areas list 50-84 species each, which dilutes every spawn to
// a few percent and makes adjacent areas feel identical. Keep the most common
// species and move the rest to Paldea's Raid Island.
const PALDEA_ENCOUNTER_CAP = 15
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
    // Hand-laid as four separate islands around a central league so the
    // generated terrain reads as distinct landmasses instead of one merged
    // blob: Melemele north-west, Akala north-east, Poni south-west and
    // Ula'ula south-east, with the Pokemon League (and the Raid Island off
    // Poni) in the middle of the ocean between them. Coordinates are in the
    // 0-100 world space (width/height 100 keep the scale at 1:1).
    width: 100,
    height: 100,
    positions: {
      // Melemele Island (north-west)
      'alola-route-1--hauoli-outskirts': [16, 12],
      'alola-route-1': [22, 18],
      'alola-route-3': [16, 26],
      'alola-route-2': [28, 22],
      'iki-town': [24, 30],
      'hauoli-city': [30, 16],
      // Akala Island (north-east)
      'alola-route-4': [68, 18],
      'alola-route-6': [74, 14],
      'alola-route-8': [78, 20],
      'alola-route-7': [84, 18],
      'alola-route-5': [88, 26],
      'paniola-town': [72, 26],
      // Ula'ula Island (south-east)
      'alola-route-9': [64, 66],
      'alola-route-10': [72, 64],
      'alola-route-11': [78, 68],
      'alola-route-12': [74, 76],
      'alola-route-13': [66, 82],
      'alola-route-14': [68, 72],
      'alola-route-15': [78, 84],
      'heahea-city': [70, 60],
      'konikoni-city': [64, 78],
      'malie-city': [84, 74],
      // Poni Island (south-west)
      'alola-route-16': [20, 70],
      'alola-route-17': [26, 78],
      'po-town': [30, 74],
      // In the middle of the four islands.
      league: [52, 52],
      raid: [8, 90],
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
// Display names for the generated route trainers, so battles read
// "Youngster Joey" instead of "Route 2 Trainer 1".
const TRAINER_CLASS_LABELS = {
  youngster: 'Youngster',
  lass: 'Lass',
  bugCatcher: 'Bug Catcher',
  hiker: 'Hiker',
  camper: 'Camper',
  beauty: 'Beauty',
  coolTrainer: 'Cooltrainer',
  psychic: 'Psychic',
  scientist: 'Scientist',
  ace: 'Ace Trainer',
  blackbelt: 'Blackbelt',
  swimmer: 'Swimmer',
}
const TRAINER_NAMES = [
  'Joey', 'Mikey', 'Sarah', 'Alex', 'Tara', 'Ben', 'Kira', 'Leo', 'Maya', 'Nate',
  'Olivia', 'Paul', 'Rosa', 'Sam', 'Tina', 'Victor', 'Wendy', 'Xander', 'Yuki', 'Zoe',
  'Aaron', 'Bianca', 'Caleb', 'Dana', 'Eli', 'Fiona', 'Gavin', 'Hana', 'Ivan', 'Jade',
  'Kai', 'Lena', 'Marco', 'Nina', 'Owen', 'Pia', 'Quinn', 'Rex', 'Sofia', 'Theo',
  'Uma', 'Vera', 'Wade', 'Xena', 'Yara', 'Zane', 'Aya', 'Bruno', 'Cleo', 'Dev',
]
// Showdown trainer sprite keys are the leader's name slugified ("Crasher Wake"
// -> "crasherwake"). A few characters only have a generation-suffixed or
// alternate sprite. Kanto is hand-curated and keeps its own gen3 keys.
const TRAINER_SPRITE_OVERRIDES = { Phoebe: 'phoebe-gen3', Drake: 'drake-gen3' }
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
  // Alola isn't a town-per-trial map: Melemele's two sit in Iki Town / Hauoli
  // City, the Akala trio plus Olivia around Heahea/Paniola/Konikoni, Ula'ula's
  // around Malie City and Po Town. Poni Island has no scraped town, so Mina and
  // Hapu reuse Iki Town / Hauoli City rather than both landing on Iki Town.
  alola: ['Hauoli City', 'Konikoni City', 'Paniola Town', 'Heahea City', 'Malie City', 'Po Town', 'Hauoli City', 'Iki Town'],
}
const ELITE_FOUR = {
  johto: ['Will', 'Koga', 'Bruno', 'Karen'], hoenn: ['Sidney', 'Phoebe', 'Glacia', 'Drake'],
  sinnoh: ['Aaron', 'Bertha', 'Flint', 'Lucian'], unova: ['Shauntal', 'Grimsley', 'Caitlin', 'Marshal'],
  kalos: ['Malva', 'Siebold', 'Wikstrom', 'Drasna'], alola: ['Hala', 'Olivia', 'Molayne', 'Kahili'],
  galar: ['Marnie', 'Hop', 'Bede', 'Raihan'], paldea: ['Rika', 'Poppy', 'Larry', 'Hassel'],
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
  paldea: [['Ground'], ['Steel'], ['Flying'], ['Dragon']],
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
// Per-region league structure. Regions map 1:1 to a generation, but their
// league isn't always "8 gyms in canonical order, then an Elite Four". These
// fields are written into `regions.json` (as the region's `league` block) so
// the UI can describe the region correctly:
//   badgeOrder: 'ordered' lays a badge gate on the route tree in badge order;
//               'free' (Paldea) lets the gyms be challenged in any order and
//               gates the league on a badge count instead.
//   badgeTitle: the default name for a badge holder (or `badgeTitles` per
//               index, e.g. Alola's captains vs. its island kahuna).
//   badgeTrack: the badge track's section heading in the gym panel.
//   badgeName:  the singular noun for a badge (Badge / Z-Crystal).
//   eliteTitle: what each endgame member is called.
//   eliteTrack: the endgame section heading (Elite Four & Champion / Champion Cup).
const DEFAULT_LEAGUE = {
  badgeOrder: 'ordered',
  badgeTitle: 'Gym Leader',
  badgeTrack: 'Gym Leaders',
  badgeName: 'Badge',
  gymNoun: 'Gym',
  eliteTitle: 'Elite Four',
  eliteTrack: 'Elite Four & Champion',
}
const LEAGUES = {
  johto: DEFAULT_LEAGUE,
  hoenn: DEFAULT_LEAGUE,
  sinnoh: DEFAULT_LEAGUE,
  unova: DEFAULT_LEAGUE,
  kalos: DEFAULT_LEAGUE,
  alola: {
    ...DEFAULT_LEAGUE,
    // Alola has 7 island trials + 4 grand trials, not gyms. The scraped map has
    // no Poni town, so the 7 trial captains + Hapu's grand trial are mapped to
    // the region's 8 badge slots (the grand trial last). The copy calls the
    // track "Island Trials" and the rewards Z-Crystals. See TODO #40.
    badgeTitles: [
      'Trial Captain',
      'Trial Captain',
      'Trial Captain',
      'Trial Captain',
      'Trial Captain',
      'Trial Captain',
      'Trial Captain',
      'Island Kahuna',
    ],
    badgeTitle: 'Trial Captain',
    badgeTrack: 'Island Trials',
    badgeName: 'Z-Crystal',
    gymNoun: 'Trial',
  },
  galar: {
    ...DEFAULT_LEAGUE,
    // Galar has 8 gyms but no Elite Four: the endgame is the Champion Cup, so
    // the four "Elite Four" entries are its semifinal opponents.
    eliteTitle: 'Champion Cup',
    eliteTrack: 'Champion Cup',
  },
  paldea: {
    ...DEFAULT_LEAGUE,
    // Paldea's 8 gyms can be challenged in any order, so the generator lays no
    // ordered badge gates and the league is gated on a badge count instead.
    badgeOrder: 'free',
  },
}
// Only these fields are written to `regions.json`; the titles live on the
// generated gym/Elite members themselves.
const leagueFor = (regionId) => {
  const league = LEAGUES[regionId] ?? DEFAULT_LEAGUE
  return {
    badgeOrder: league.badgeOrder,
    badgeTrack: league.badgeTrack,
    badgeName: league.badgeName,
    eliteTrack: league.eliteTrack,
  }
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
const breedingData = read('breeding-data.json')
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
// Battle-only forms (Gigantamax, marked `form`) are stored as level-100
// evolutions but a species that only "evolves" into one of those is still a
// final evolution. Megas predate this flag and are left as-is so league/team
// generation doesn't shift.
const isFinalEvolution = (speciesKey) =>
  !(evolutionData[speciesKey] || []).some((evolution) => !evolution.form)
// Raids only want genuinely final stages: base/middle stages are now obtainable
// by breeding a caught final form, so handing them out is a worse reward. This
// is stricter than `isFinalEvolution`, which counts Megas (unflagged battle
// forms) as real evolutions and would drop Mega-only finals such as Aerodactyl
// or Metagross — the sole source of their line. Ignore evolutions into
// alternate/battle forms (id > 1025, or `form`), and treat a small evolution
// cycle (e.g. the Armorouge <-> Ceruledge version-counterpart entries) as final
// so the line always keeps at least one raid member.
const realEvolutions = (speciesKey) =>
  (evolutionData[speciesKey] || []).filter(
    (evolution) =>
      !evolution.form &&
      species[evolution.into] &&
      species[evolution.into].id <= 1025
  )
const canReachByEvolution = (from, target, seen = new Set()) => {
  if (from === target) return true
  if (seen.has(from)) return false
  seen.add(from)
  return realEvolutions(from).some((evolution) =>
    canReachByEvolution(evolution.into, target, seen)
  )
}
const isRaidFinalEvolution = (speciesKey) =>
  !realEvolutions(speciesKey).some(
    (evolution) => !canReachByEvolution(evolution.into, speciesKey)
  )
const isFormRevert = (from, into) =>
  species[from] && species[from].id > 1025 &&
  (evolutionData[into] ?? []).some((evolution) => evolution.into === from)
const preEvolutionMap = Object.fromEntries(
  Object.entries(evolutionData).flatMap(([from, evolutions]) =>
    evolutions
      .filter((evolution) => !isFormRevert(from, evolution.into))
      .map((evolution) => [evolution.into, from])
  )
)
// Reattach form <-> form transforms (Galarian Darmanitan <-> its Zen form) whose
// both directions were dropped above, so breed chains still reach the base.
const linkFormChains = (map) => {
  let changed = true
  while (changed) {
    changed = false
    for (const [from, evolutions] of Object.entries(evolutionData)) {
      if (!species[from] || species[from].id <= 1025) continue
      for (const evolution of evolutions) {
        const into = evolution.into
        if (!species[into] || species[into].id <= 1025) continue
        if (!(evolutionData[into] ?? []).some((back) => back.into === from)) continue
        if (map[from] === undefined && map[into] !== undefined) (map[from] = into), (changed = true)
        else if (map[into] === undefined && map[from] !== undefined) (map[into] = from), (changed = true)
      }
    }
  }
  return map
}
linkFormChains(preEvolutionMap)
// Mirrors `getPreEvolutionChain` (`src/game/pokemon.js`) so we know exactly what
// the game's Daycare would hatch from a given Pokemon.
const breedChainRoot = (speciesKey) => {
  const seen = new Set([speciesKey])
  let current = speciesKey
  for (let next = preEvolutionMap[current]; next && !seen.has(next); next = preEvolutionMap[current]) {
    current = next
    seen.add(current)
  }
  return current
}
// Legendary/undiscovered lines can't breed down, and alternate/battle forms are
// kept whole, so only breedable base/middle stages are candidates for removal.
const staysInRaidPool = (entry) =>
  entry.legendary ||
  entry.id > 1025 ||
  breedingData[entry.key]?.undiscovered ||
  isRaidFinalEvolution(entry.key)
// A Raid Island only hands out the stages left after breeding a caught final
// form: breeding yields the chain root, which can then evolve forward, so drop
// any stage reachable that way. If a chain is cyclic (Palafin-H <-> Palafin)
// breeding gives the wrong root, so keep the stage rather than orphan it.
const raidPoolSpecies = (entries, breedReachable) =>
  entries.filter((entry) => staysInRaidPool(entry) || !breedReachable.has(entry.key))
/**
 * Pick a battle background for a route from its name, falling back to its
 * dominant wild type. Generated regions have no hand-authored mapping, so
 * without this every non-Kanto route fought on grassland.
 */
const ROUTE_BACKGROUND_RULES = [
  [/cave|cavern|tunnel|mine|ruins|catacomb|grotto|depths|underground|well|sewer/i, 'cave'],
  [
    /\bmt\b|mt\.|mount|peak|summit|highland|volcano|crater|ridge|cliff|gorge|canyon|desert|wasteland|quarry|spire/i,
    'mountain',
  ],
  [
    /sea|ocean|water|beach|shore|bay|harbor|harbour|port|island|marine|coast|river|lake|pond|fall|rapid|strait|channel|dock|marsh|swamp|fen|wetland/i,
    'beach',
  ],
]
const routeBackground = (routeName, encounters) => {
  for (const [pattern, background] of ROUTE_BACKGROUND_RULES)
    if (pattern.test(routeName)) return `/backgrounds/${background}.png`
  const typeWeights = {}
  let totalWeight = 0
  for (const encounter of encounters) {
    totalWeight += encounter.weight
    for (const type of species[encounter.speciesKey]?.types ?? [])
      typeWeights[type] = (typeWeights[type] ?? 0) + encounter.weight
  }
  const dominant = Object.entries(typeWeights).sort((left, right) => right[1] - left[1])[0]?.[0]
  // Only an overwhelmingly aquatic table counts as a beach/sea route; most
  // routes have some fishing and would otherwise all look like beaches.
  if (totalWeight > 0 && (typeWeights.Water ?? 0) / totalWeight >= 0.8)
    return '/backgrounds/beach.png'
  if (dominant === 'Ice' || dominant === 'Rock' || dominant === 'Ground' || dominant === 'Steel')
    return '/backgrounds/mountain.png'
  if (dominant === 'Ghost' || dominant === 'Dark') return '/backgrounds/cave.png'
  return '/backgrounds/grassland.png'
}
/**
 * Pick a themed team from a species pool. `types` biases the pool to matching
 * Pokemon when there are enough of them (so a Flying gym fields birds and a Bug
 * Catcher fields bugs); otherwise it falls back to the whole pool. Within that
 * theme, species that would long since have evolved are dropped (a Lv.55
 * trainer shouldn't field a Pidgey) and very weak final forms (Ditto) are
 * avoided at high levels — but never at the cost of the theme, so a Dragon gym
 * still fields dragons. High-level (rematch) teams prefer final evolutions, and
 * mixed teams get one strong Pokemon per type. Repeats are avoided until the
 * pool is exhausted.
 */
const buildTeam = (list, types, size, baseLevel, step = 1, offset = 0) => {
  if (list.length === 0) return []
  const minimum = Math.min(size, 3)
  // Prefer levelled-appropriate, non-weak species, but never shrink a pool
  // below `minimum` (so a sparse type keeps its members).
  const refined = (pool) => {
    const mature = pool.filter((species) => {
      // Item and friendship evolutions have no level gate, so give them a
      // nominal one for team building (a Lv.60 trainer shouldn't still field a
      // Vulpix or a Pichu).
      const levels = (evolutionData[species.key] || [])
        .map((evolution) => evolution.level ?? (evolution.item || evolution.friendship ? ITEM_EVOLUTION_LEVEL : null))
        .filter(Boolean)
      return levels.length === 0 || Math.min(...levels) > baseLevel
    })
    let result = mature.length >= minimum ? mature : pool
    if (baseLevel >= 55) {
      const strong = result.filter((species) => totalBaseStats(species) >= 380)
      if (strong.length >= minimum) result = strong
    }
    return result
  }
  const preferFinal = baseLevel >= 65,
    finalsOf = (pool) => (preferFinal ? pool.filter((species) => isFinalEvolution(species.key)) : pool)
  let pool
  if (types?.length) {
    const typed = list.filter((species) => species.types?.some((type) => types.includes(type)))
    if (typed.length >= minimum) {
      const typedFinals = finalsOf(typed)
      pool = refined(typedFinals.length >= minimum ? typedFinals : typed)
    } else pool = refined(list)
  } else {
    // Mixed trainers: the strongest Pokemon of each primary type, so an Ace
    // Trainer or Champion fields a varied, fully-evolved team.
    const candidates = refined(list),
      strong = finalsOf(candidates)
        .slice()
        .sort((a, b) => totalBaseStats(b) - totalBaseStats(a)),
      distinct = [],
      seenTypes = new Set()
    for (const species of strong) {
      const primaryType = species.types?.[0]
      if (primaryType && !seenTypes.has(primaryType)) {
        seenTypes.add(primaryType)
        distinct.push(species)
      }
    }
    pool = distinct.length >= size ? distinct : strong.length >= minimum ? strong : candidates
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
const regions = [{ id: 'kanto', name: 'Kanto', generation: 1, order: 1, entry: 'palletTown', startLevel: 5, raidPool: [], leagueLocationKey: 'indigoPlat', league: leagueFor('kanto') }]
// Raid pools can only be worked out once every region's routes exist (a raid
// species must be absent from *all* routes), so regions queue up here and are
// filled in by the raid scan lower down.
const pendingRaids = [
  { regionObj: regions[0], all: speciesForGen(1), raidId: 'raidIsland', raidNodeName: 'Raid Island' },
]
// Species trimmed off Paldea's oversized province areas; the raid scan gives
// them back to Paldea's Raid Island so they stay obtainable.
const paldeaDroppedSpecies = new Set()

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
  const leagueConfig = LEAGUES[regionId] ?? DEFAULT_LEAGUE
  // Paldea challenges its gyms in any order, so no badge is laid on the route
  // tree; the league itself is gated on a badge count instead (see below).
  const freeBadgeOrder = leagueConfig.badgeOrder === 'free'
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
  // Town progression (used for mart stock) is measured across towns only, so
  // the first town doesn't sit at 10% of the region just because routes
  // outnumber it.
  const townOrder = order.filter((node) => !isRouteNode(node))
  const townPosition = new Map(townOrder.map((node, position) => [node, position]))
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
  const propagatedGateByNode = {}
  if (!freeBadgeOrder) {
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
  }

  const regionObj = {
    id: regionId,
    name,
    generation: gen,
    order: gen,
    entry: locId(regionId, entryNode),
    startLevel: base,
    league: leagueFor(regionId),
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
    if (regionId === 'paldea' && encounters.length > PALDEA_ENCOUNTER_CAP) {
      encounters = encounters.slice().sort((a, b) => b.weight - a.weight)
      for (const encounter of encounters.slice(PALDEA_ENCOUNTER_CAP))
        paldeaDroppedSpecies.add(encounter.speciesKey)
      encounters = encounters.slice(0, PALDEA_ENCOUNTER_CAP)
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
  for (const node of order) {
    const id = locId(regionId, node)
    const isRoute = isRouteNode(node)
    const parent = node === entryNode ? null : (unlockParent[node] ?? null)
    let unlock
    if (node === entryNode) {
      // Region entry towns open when the player spends an Unlock Token on the
      // region (or starts there); there is no fixed region chain.
      unlock = { entry: true }
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
      const encounters = routeEncounter[node].encounters ?? [],
        typeWeights = {}
      for (const encounter of encounters)
        for (const type of species[encounter.speciesKey]?.types ?? [])
          typeWeights[type] = (typeWeights[type] ?? 0) + encounter.weight
      const topTypes = Object.entries(typeWeights)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 2)
        .map(([type]) => type)
      mapData[id] = {
        id,
        name: routeEncounter[node]?.name ?? node,
        type: 'route',
        region: regionId,
        description: encounters.length
          ? `A route in the ${name} region where ${topTypes.join(' and ')} Pokemon roam around Lv. ${Math.min(
              ...encounters.map((encounter) => encounter.minLevel)
            )}-${Math.max(...encounters.map((encounter) => encounter.maxLevel))}.`
          : `A route in the ${name} region.`,
        routeKey: id,
        background: routeBackground(routeEncounter[node]?.name ?? node, encounters),
        connections: [...adjacency[node]].map((n) => locId(regionId, n)),
        unlock,
        unlockOrder: progressKey(node),
        position: place(node),
      }
    } else {
      const townIndex = nodePosition.get(node) ?? 0,
        townT = order.length <= 1 ? 0 : townIndex / (order.length - 1),
        townLevel = clampLevel(Math.round(LEVEL_MIN + townT * (WILD_LEVEL_MAX - LEVEL_MIN))),
        // Mart progression is spread across the region's towns, not all nodes.
        martIndex = townPosition.get(node) ?? 0,
        martT = townOrder.length <= 1 ? 0 : martIndex / (townOrder.length - 1)
      const gymHere = gymPlacements.find((gym) => gym.townNode === node),
        gymType = gymHere ? (GYM_TYPES[regionId]?.[gymHere.index] ?? [])[0] : null
      mapData[id] = {
        id,
        name: display[node] ?? node,
        type: 'town',
        region: regionId,
        description: gymHere
          ? `A town in the ${name} region, home to ${gymHere.leaderName}'s ${
              gymType ? `${gymType} ` : ''
            }${leagueConfig.gymNoun}.`
          : `A town in the ${name} region.`,
        connections: [...adjacency[node]].map((n) => locId(regionId, n)),
        unlock,
        unlockOrder: progressKey(node),
        position: place(node),
        // Marts open up gradually like Kanto's hand-curated ones: the first
        // towns sell only Poke Balls, then Great Balls, then Ultra Balls and
        // Repel, then Honey. The wild-battle gates are global, so a region
        // reached later already has them unlocked.
        mart: {
          name: `${name} Mart`,
          items:
            martT < 0.25
              ? [{ itemId: 'pokeball' }]
              : martT < 0.5
                ? [
                    { itemId: 'pokeball' },
                    { itemId: 'greatball', unlockWildBattlesWon: 50 },
                  ]
                : martT < 0.75
                  ? [
                      { itemId: 'pokeball' },
                      { itemId: 'greatball' },
                      { itemId: 'ultraball', unlockWildBattlesWon: 150 },
                      { itemId: 'repel' },
                    ]
                  : [
                      { itemId: 'pokeball' },
                      { itemId: 'greatball' },
                      { itemId: 'ultraball' },
                      { itemId: 'repel' },
                      { itemId: 'honey' },
                    ],
        },
      }
      const pool = teamPool.length ? teamPool : wild
      if (pool.length)
        trainerData[id] = [0, 1, 2].map((i) => {
          // Vary the class by town (not just by region) so every town in a
          // region isn't fielding the same three trainers.
          const trainerClass =
              TRAINER_CLASSES[(townIndex + i * 4 + gen) % TRAINER_CLASSES.length],
            // Teams grow along the region's curve: one or two early, three or
            // four later, with the last trainer as the town's ace.
            baseSize = 1 + Math.floor(townT * 3),
            teamSize = Math.min(4, baseSize + (i === 2 ? 1 : 0))
          return {
            id: `${id}_t${i + 1}`,
            name: `${TRAINER_CLASS_LABELS[trainerClass] ?? trainerClass} ${
              TRAINER_NAMES[(townIndex * 3 + i) % TRAINER_NAMES.length]
            }`,
            trainerClass,
            team: buildTeam(
              pool,
              TRAINER_CLASS_TYPES[trainerClass],
              teamSize,
              // The last team member sits at baseLevel + teamSize - 1, so leave
              // room below LEVEL_MAX instead of overflowing to 77.
              Math.min(townLevel + i, LEVEL_MAX - (teamSize - 1)),
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
      background: '/backgrounds/cave.png',
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
      // road gate (see gateGymByNode above). An any-order region can't name the
      // badges in sequence, so it gates on the count instead.
      ...(freeBadgeOrder
        ? { badgesRequired: gymPlacements.length }
        : { gymsRequired: gymPlacements.map((gym) => gym.id) }),
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
      title: `${name} ${leagueConfig.badgeTitles?.[index] ?? leagueConfig.badgeTitle}`,
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
      title: `${name} ${leagueConfig.eliteTitle}`,
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
    if ((loc.region ?? 'kanto') !== 'kanto' || !loc.routeKey || loc.type === 'raid') continue
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
    if ((loc.region ?? 'kanto') !== 'kanto' || !loc.routeKey || loc.type === 'raid') continue
    if (encounterData[loc.routeKey]) kantoEntries[loc.routeKey] = encounterData[loc.routeKey].encounters
  }
  levelRoutes(
    Object.values(mapData)
      .filter((loc) => (loc.region ?? 'kanto') === 'kanto' && loc.routeKey && loc.type !== 'raid')
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

// --- zones -------------------------------------------------------------------
// A zone groups several route-like sub-areas behind one map node. The hub is
// `type: 'zone'` and lists its sub-areas; each sub-area is a hidden route with
// its own encounter bucket, unlocked once the hub is. The existing
// TRAVEL/encounter plumbing carries them (see `location-panel.js`), and the
// sub-area species count as native wilds for the raid-pool scan below.
const ZONES = {
  galar: [
    {
      node: 'wild-area',
      name: 'Wild Area',
      position: { x: 50, y: 58 },
      connections: ['galar-route-5', 'galar-route-6'],
      subAreas: [
        {
          node: 'wild-area-rolling-fields',
          name: 'Rolling Fields',
          position: { x: 52, y: 61 },
          species: ['wooloo', 'rookidee', 'skwovet', 'nickit', 'gossifleur', 'yamper', 'blipbug', 'chewtle'],
        },
        {
          node: 'wild-area-dappled-grove',
          name: 'Dappled Grove',
          position: { x: 47, y: 56 },
          species: ['gossifleur', 'blipbug', 'applin', 'silicobra', 'toxel', 'snom', 'milcery', 'rolycoly'],
        },
        {
          node: 'wild-area-giants-mirror',
          name: "Giant's Mirror",
          position: { x: 53, y: 55 },
          species: ['hatenna', 'impidimp', 'sinistea', 'falinks', 'clobbopus', 'pincurchin', 'stonjourner', 'cufant'],
        },
      ],
    },
    {
      // Sword/Shield Expansion Pass. Post-game, so it carries an explicit
      // level and a Champion gate instead of a neighbour-level band.
      node: 'isle-of-armor',
      name: 'Isle of Armor',
      position: { x: 69, y: 60 },
      background: '/backgrounds/beach.png',
      connections: ['galar-hulbury'],
      level: 72,
      unlock: { championDefeated: 'galar' },
      subAreas: [
        {
          node: 'isle-of-armor-fields-of-honor',
          name: 'Fields of Honor',
          position: { x: 69, y: 62 },
          species: ['g-slowpoke', 'g-mr. mime', 'gossifleur', 'blipbug', 'skwovet', 'chewtle'],
        },
        {
          node: 'isle-of-armor-soothing-wetlands',
          name: 'Soothing Wetlands',
          position: { x: 71, y: 59 },
          species: ['g-slowpoke', 'chewtle', 'gossifleur', 'toxel', 'pincurchin', 'clobbopus'],
        },
        {
          node: 'isle-of-armor-brawlers-cave',
          name: "Brawlers' Cave",
          position: { x: 70, y: 57 },
          species: ["g-farfetch'd", 'clobbopus', 'falinks', 'rolycoly', 'g-meowth', 'g-darumaka'],
        },
      ],
    },
    {
      node: 'crown-tundra',
      name: 'Crown Tundra',
      position: { x: 60, y: 12 },
      background: '/backgrounds/mountain.png',
      connections: ['galar-wyndon'],
      level: 75,
      unlock: { championDefeated: 'galar' },
      subAreas: [
        {
          node: 'crown-tundra-snowslide-slope',
          name: 'Snowslide Slope',
          position: { x: 59, y: 10 },
          species: ['h-sneasel', 'snom', 'g-stunfisk', 'cufant', 'h-qwilfish', 'stonjourner'],
        },
        {
          node: 'crown-tundra-frigid-sea',
          name: 'Frigid Sea',
          position: { x: 62, y: 13 },
          species: ['basculin-w', 'h-qwilfish', 'arrokuda', 'chewtle', 'g-corsola', 'pincurchin'],
        },
        {
          node: 'crown-tundra-giants-bed',
          name: "Giant's Bed",
          position: { x: 58, y: 14 },
          species: ['h-sneasel', 'cufant', 'stonjourner', 'snom', 'morpeko', 'rolycoly'],
        },
      ],
    },
  ],
  paldea: [
    {
      // Scarlet/Violet DLC, post-game. Kitakami hangs off the already-scraped
      // (but otherwise empty) Mossui Town.
      node: 'kitakami',
      name: 'Kitakami',
      position: { x: 7, y: 4 },
      background: '/backgrounds/grassland.png',
      connections: ['paldea-mossui-town'],
      level: 72,
      unlock: { championDefeated: 'paldea' },
      subAreas: [
        {
          node: 'kitakami-revelers-road',
          name: "Reveler's Road",
          position: { x: 6, y: 3 },
          species: ['poltchageist', 'dipplin', 'applin', 'nymble', 'tarountula', 'fidough'],
        },
        {
          node: 'kitakami-apple-hills',
          name: 'Apple Hills',
          position: { x: 9, y: 3 },
          species: ['applin', 'dipplin', 'smoliv', 'nymble', 'tadbulb', 'tarountula'],
        },
        {
          node: 'kitakami-oni-mountain',
          name: 'Oni Mountain',
          position: { x: 5, y: 6 },
          species: ['poltchageist', 'charcadet', 'nacli', 'frigibax', 'tadbulb', 'smoliv'],
        },
      ],
    },
    {
      // Blueberry Academy's Terarium (Indigo Disk).
      node: 'terarium',
      name: 'Terarium',
      position: { x: 96, y: 20 },
      background: '/backgrounds/grassland.png',
      connections: ['paldea-league'],
      level: 78,
      unlock: { championDefeated: 'paldea' },
      subAreas: [
        {
          node: 'terarium-savanna-biome',
          name: 'Savanna Biome',
          position: { x: 95, y: 22 },
          species: ['frigibax', 'cetoddle', 'pawmi', 'nacli', 'tatsugiri', 'veluza'],
        },
        {
          node: 'terarium-coastal-biome',
          name: 'Coastal Biome',
          position: { x: 97, y: 19 },
          species: ['veluza', 'dondozo', 'tatsugiri', 'wiglett', 'finizen', 'cetoddle'],
        },
        {
          node: 'terarium-polar-biome',
          name: 'Polar Biome',
          position: { x: 97, y: 23 },
          species: ['cetoddle', 'frigibax', 'nacli', 'pawmi', 'dondozo', 'veluza'],
        },
      ],
    },
    {
      // The Great Crater, post-game. Holds the paradox Pokemon (and Glimmet),
      // which otherwise had no wild route.
      node: 'area-zero',
      name: 'Area Zero',
      position: { x: 53, y: 61 },
      background: '/backgrounds/cave.png',
      connections: ['paldea-mesagoza'],
      level: 68,
      unlock: { championDefeated: 'paldea' },
      subAreas: [
        {
          node: 'area-zero-gate',
          name: 'Zero Gate',
          position: { x: 52, y: 62 },
          species: ['glimmet', 'glimmora'],
        },
        {
          node: 'area-zero-station-two',
          name: 'Research Station 2',
          position: { x: 54, y: 60 },
          species: ['great tusk', 'iron treads', 'scream tail', 'iron bundle'],
        },
        {
          node: 'area-zero-station-four',
          name: 'Research Station 4',
          position: { x: 51, y: 59 },
          species: [
            'brute bonnet',
            'iron hands',
            'flutter mane',
            'iron jugulis',
            'sandy shocks',
            'iron moth',
            'iron thorns',
          ],
        },
        {
          node: 'area-zero-depths',
          name: 'Area Zero Depths',
          position: { x: 55, y: 63 },
          species: [
            'roaring moon',
            'iron valiant',
            'walkingWake',
            'ironLeaves',
            'gougingFire',
            'ragingBolt',
            'ironBoulder',
            'ironCrown',
          ],
        },
      ],
    },
  ],
}
for (const [regionId, zones] of Object.entries(ZONES)) {
  const region = regions.find((candidate) => candidate.id === regionId)
  if (!region) continue
  for (const zone of zones) {
    const hubId = locId(regionId, zone.node)
    if (mapData[hubId]) continue
    const neighbourLevel = zone.connections
      .map((id) => mapData[id]?.routeKey && encounterData[mapData[id].routeKey]?.encounters?.[0]?.minLevel)
      .find((level) => typeof level === 'number')
    const zoneLevel = clampLevel(zone.level ?? neighbourLevel ?? region.startLevel ?? 5),
      anchor = mapData[zone.connections[0]]?.unlockOrder ?? 0,
      subAreaIds = []
    for (const subArea of zone.subAreas) {
      const subAreaId = locId(regionId, subArea.node),
        encounters = subArea.species
          .filter((key) => species[key])
          .map((key, index) => ({
            speciesKey: key,
            weight: encounterWeight(null, index),
            minLevel: zoneLevel,
            maxLevel: clampLevel(zoneLevel + 2),
          }))
      encounterData[subAreaId] = { name: subArea.name, encounters }
      mapData[subAreaId] = {
        id: subAreaId,
        name: subArea.name,
        type: 'route',
        region: regionId,
        description: `A sub-area of the ${zone.name}.`,
        routeKey: subAreaId,
        background: routeBackground(subArea.name, encounters),
        connections: [hubId],
        hidden: true,
        zone: hubId,
        unlock: { requires: [hubId] },
        unlockOrder: anchor + 0.5 + subAreaIds.length * 0.001,
        position: subArea.position,
      }
      subAreaIds.push(subAreaId)
    }
    mapData[hubId] = {
      id: hubId,
      name: zone.name,
      type: 'zone',
      region: regionId,
      description: `The ${zone.name} is a wide-open stretch with several distinct habitats.`,
      routeKey: subAreaIds[0],
      background: zone.background ?? '/backgrounds/grassland.png',
      connections: [...zone.connections, ...subAreaIds],
      subAreas: subAreaIds.map((id) => ({ id, name: mapData[id].name })),
      unlock: zone.unlock ?? { battlesAtLocation: [{ locationId: zone.connections[0], count: 3 }] },
      unlockOrder: anchor + 0.4,
      position: zone.position,
    }
    for (const id of zone.connections)
      if (mapData[id] && !mapData[id].connections.includes(hubId)) mapData[id].connections.push(hubId)
  }
}

// --- extra wild areas ---------------------------------------------------------
// Single wild areas the scrapers only keep as towns/routes. Like zones they are
// appended after the region loop with an explicit level band (the average of
// the routes they connect to), so adding one never re-levels the region.
const POST_AREAS = {
  alola: [
    {
      node: 'poke-pelago',
      name: 'Poké Pelago',
      type: 'facility',
      position: { x: 14, y: 10 },
      connects: ['alola-hauoli-city'],
      description: 'Four small islands where your Pokemon relax, train and grow berries.',
      background: '/backgrounds/beach.png',
      // No wild encounters: Pelago is a facility, not a route.
      species: [],
    },
  ],
  galar: [
    {
      node: 'slumbering-weald',
      name: 'Slumbering Weald',
      position: { x: 46, y: 93 },
      connects: ['galar-route-1'],
      species: [
        'g-zigzagoon', 'g-yamask', 'h-zorua', 'blipbug', 'rookidee', 'skwovet', 'gossifleur', 'nickit',
      ],
    },
    {
      node: 'galar-mine',
      name: 'Galar Mine',
      position: { x: 43.5, y: 63.5 },
      connects: ['galar-route-3', 'galar-route-4'],
      species: [
        'g-meowth', 'g-corsola', 'g-darumaka', 'rolycoly', 'cufant', 'silicobra', 'toxel', 'g-stunfisk',
      ],
    },
    {
      node: 'glimwood-tangle',
      name: 'Glimwood Tangle',
      position: { x: 37.5, y: 40.5 },
      connects: ['galar-stow-on-side', 'galar-ballonlea'],
      gate: 'galar-route-6',
      species: [
        'g-ponyta', "g-farfetch'd", 'h-growlithe', 'impidimp', 'hatenna', 'sinistea', 'milcery', 'h-voltorb',
      ],
    },
  ],
}
for (const [regionId, areas] of Object.entries(POST_AREAS)) {
  const region = regions.find((candidate) => candidate.id === regionId)
  if (!region) continue
  for (const area of areas) {
    const id = locId(regionId, area.node)
    if (mapData[id]) continue
    const levels = [...area.connects, ...(area.gate ? [area.gate] : [])]
        .map((node) => mapData[node]?.routeKey && encounterData[mapData[node].routeKey]?.encounters?.[0]?.minLevel)
        .filter((level) => typeof level === 'number'),
      level = clampLevel(
        levels.length ? Math.round(levels.reduce((sum, value) => sum + value, 0) / levels.length) : (region.startLevel ?? 5)
      ),
      encounters = area.species
        .filter((key) => species[key])
        .map((key, index) => ({
          speciesKey: key,
          weight: encounterWeight(null, index),
          minLevel: level,
          maxLevel: clampLevel(level + 2),
        })),
      anchor = Math.min(...area.connects.map((node) => mapData[node]?.unlockOrder ?? 0))
    if (encounters.length > 0) encounterData[id] = { name: area.name, encounters }
    mapData[id] = {
      id,
      name: area.name,
      type: area.type ?? 'route',
      region: regionId,
      description: area.description ?? `A wild area in the ${region.name} region.`,
      routeKey: id,
      background: area.background ?? routeBackground(area.name, encounters),
      connections: [...area.connects],
      unlock: { battlesAtLocation: [{ locationId: area.gate ?? area.connects[0], count: 5 }] },
      unlockOrder: anchor + 0.25,
      position: area.position,
    }
    for (const node of area.connects)
      if (mapData[node] && !mapData[node].connections.includes(id)) mapData[node].connections.push(id)
  }
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
  if (mapData[bucketKey]?.type === 'raid') continue
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

// --- Alolan forms & missing natives ------------------------------------------
// PokeAPI's encounter tables use base species and drop several natives, so
// regional forms (Alola) and ordinary wilds (Alola, Paldea) never landed on a
// route and ended up raid-only. Port them onto routes here, after the
// catch-gate pass so no route's catch rule changes.
const REGION_ROUTE_ADDS = {
  alola: {
    'alola-route-1': ['a-rattata', 'a-meowth', 'a-diglett', 'a-grimer'],
    'alola-route-1--hauoli-outskirts': ['a-meowth', 'a-diglett'],
    'alola-route-2': ['a-meowth', 'a-grimer', 'a-geodude'],
    'alola-route-3': ['a-sandshrew', 'a-vulpix', 'a-geodude'],
    'alola-route-4': ['crabrawler'],
    'alola-route-5': ['comfey'],
    'alola-route-6': ['wishiwashi'],
    'alola-route-7': ['minior'],
    'alola-route-8': ['turtonator', 'drampa'],
    'alola-route-9': ['sandygast'],
    'alola-route-10': ['jangmo-o'],
  },
  paldea: {
    'paldea-south-province-area-one': ['tandemaus', 'flamigo'],
    'paldea-south-province-area-two': ['shroodle', 'bombirdier'],
    'paldea-south-province-area-three': ['toedscool', 'cyclizar'],
    'paldea-south-province-area-four': ['tinkatink', 'orthworm'],
    'paldea-south-province-area-five': ['varoom', 'oranguru'],
    'paldea-south-province-area-six': ['greavard', 'passimian'],
    'paldea-west-province-area-one': ['capsakid', 'sableye'],
    'paldea-west-province-area-two': ['bramblin', 'rotom'],
    'paldea-west-province-area-three': ['mimikyu'],
    'paldea-east-province-area-one': ['petilil'],
    'paldea-east-province-area-two': ['p-wooper'],
    'paldea-east-province-area-three': ['gimmighoul'],
    'paldea-north-province-area-one': ['p-tauros', 'p-tauros-b', 'p-tauros-a'],
  },
}
// A Kantonian base an Alolan form supersedes is dropped, not duplicated.
const REPLACED_BASES = { 'alola-route-1': 'rattata' }
for (const adds of Object.values(REGION_ROUTE_ADDS)) {
  for (const [locationId, speciesKeys] of Object.entries(adds)) {
    const bucket = encounterData[locationId]
    if (!bucket) continue
    const level = bucket.encounters[0]?.minLevel ?? 5,
      maxLevel = bucket.encounters[0]?.maxLevel ?? clampLevel(level + 2),
      replaced = REPLACED_BASES[locationId]
    if (replaced)
      bucket.encounters = bucket.encounters.filter((entry) => entry.speciesKey !== replaced)
    for (const key of speciesKeys)
      if (species[key] && !bucket.encounters.some((entry) => entry.speciesKey === key))
        bucket.encounters.push({ speciesKey: key, weight: 12, minLevel: level, maxLevel })
  }
}

// --- group existing routes into zones ----------------------------------------
// Alola's islands and Paldea's provinces read badly as long chains of single
// route nodes, so wrap each group behind one `type: 'zone'` hub; the routes
// become hidden sub-areas (their own unlock rules still gate them) reachable
// from the hub's picker. The hub itself takes the first area's unlock rule and
// sits at the group's bounding-box centre.
const GROUP_ZONES = {
  alola: [
    {
      node: 'melemele-island',
      name: 'Melemele Island',
      areas: ['alola-route-1', 'alola-route-1--hauoli-outskirts', 'alola-route-2', 'alola-route-3'],
    },
    {
      node: 'akala-island',
      name: 'Akala Island',
      areas: ['alola-route-4', 'alola-route-5', 'alola-route-6', 'alola-route-7', 'alola-route-8'],
    },
    {
      node: 'ulaula-island',
      name: "Ula'ula Island",
      areas: ['alola-route-9', 'alola-route-10', 'alola-route-11', 'alola-route-12', 'alola-route-13', 'alola-route-14', 'alola-route-15'],
    },
    {
      node: 'poni-island',
      name: 'Poni Island',
      areas: ['alola-route-16', 'alola-route-17'],
    },
  ],
  paldea: [
    {
      node: 'south-province',
      name: 'South Province',
      areas: ['paldea-south-province-area-one', 'paldea-south-province-area-two', 'paldea-south-province-area-three', 'paldea-south-province-area-four', 'paldea-south-province-area-five', 'paldea-south-province-area-six'],
    },
    {
      node: 'west-province',
      name: 'West Province',
      areas: ['paldea-west-province-area-one', 'paldea-west-province-area-two', 'paldea-west-province-area-three'],
    },
    {
      node: 'east-province',
      name: 'East Province',
      areas: ['paldea-east-province-area-one', 'paldea-east-province-area-two', 'paldea-east-province-area-three'],
    },
    {
      node: 'north-province',
      name: 'North Province',
      areas: ['paldea-north-province-area-one', 'paldea-north-province-area-two', 'paldea-north-province-area-three'],
    },
  ],
}
// Hubs created by GROUP_ZONES sit at their own areas' centroid; the settle
// pass below must not pull them toward remote hub-to-hub links.
const groupedHubIds = new Set()
for (const [regionId, groups] of Object.entries(GROUP_ZONES)) {
  // Group adjacency, from the areas' connections before anything is hidden, so
  // two groups whose areas touched get a hub-to-hub link even though the areas
  // are detached during the loop.
  const groupIndexByArea = new Map()
  groups.forEach((group, index) => group.areas.forEach((id) => groupIndexByArea.set(id, index)))
  const linkedGroups = groups.map(() => new Set())
  groups.forEach((group, index) => {
    for (const id of group.areas)
      for (const connection of mapData[id]?.connections ?? []) {
        const other = groupIndexByArea.get(connection)
        if (other !== undefined && other !== index) linkedGroups[index].add(other)
      }
  })
  groups.forEach((group, index) => {
    const areas = group.areas.filter((id) => mapData[id] && !mapData[id].hidden)
    if (areas.length < 2) return
    const hubId = locId(regionId, group.node)
    if (mapData[hubId]) return
    // Every external neighbour, so the areas can be detached from all of them.
    const external = new Set()
    for (const id of areas)
      for (const connection of mapData[id].connections)
        if (!areas.includes(connection)) external.add(connection)
    const xs = areas.map((id) => mapData[id].position.x),
      ys = areas.map((id) => mapData[id].position.y),
      first = mapData[areas[0]],
      hubPosition = {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
      }
    // The hub only needs the first area's entry point(s) plus the groups it is
    // adjacent to: carrying every area's neighbour turns the map into a web.
    const entryConnections = new Set()
    const parents = [
      ...(first.unlock?.requires ?? []),
      ...(first.unlock?.battlesAtLocation ?? []).map((rule) => rule.locationId),
      ...(first.unlock?.caughtOnRoute ? [first.unlock.caughtOnRoute.routeKey] : []),
    ]
    for (const id of parents) {
      const resolved = mapData[id]?.hidden ? mapData[id].zone : id
      if (resolved && resolved !== hubId && !areas.includes(resolved)) entryConnections.add(resolved)
    }
    for (const linked of linkedGroups[index]) entryConnections.add(locId(regionId, groups[linked].node))
    for (const id of external) if (mapData[id]?.type === 'zone') entryConnections.add(id)
    if (entryConnections.size === 0 && external.size > 0) {
      const nearest = [...external]
        .filter((id) => mapData[id])
        .sort(
          (left, right) =>
            Math.hypot(mapData[left].position.x - hubPosition.x, mapData[left].position.y - hubPosition.y) -
            Math.hypot(mapData[right].position.x - hubPosition.x, mapData[right].position.y - hubPosition.y)
        )[0]
      if (nearest) entryConnections.add(nearest)
    }
    for (const id of areas) {
      mapData[id].hidden = true
      mapData[id].zone = hubId
      mapData[id].connections = [hubId]
    }
    mapData[hubId] = {
      id: hubId,
      name: group.name,
      type: 'zone',
      region: regionId,
      description: `${group.name} is made up of several areas, each with its own Pokemon.`,
      routeKey: areas[0],
      background: first.background ?? '/backgrounds/grassland.png',
      connections: [...entryConnections, ...areas],
      subAreas: areas.map((id) => ({ id, name: mapData[id].name })),
      unlock: JSON.parse(JSON.stringify(first.unlock)),
      unlockOrder: Math.min(...areas.map((id) => mapData[id].unlockOrder)) - 0.5,
      position: hubPosition,
    }
    groupedHubIds.add(hubId)
    for (const connection of external) {
      if (!mapData[connection]) continue
      mapData[connection].connections = mapData[connection].connections.filter(
        (id) => !areas.includes(id)
      )
      if (entryConnections.has(connection) && !mapData[connection].connections.includes(hubId))
        mapData[connection].connections.push(hubId)
    }
  })
}

// --- raid pools --------------------------------------------------------------
// A species belongs on a Raid Island only if it turns up on no region's wild
// routes and can't be reached by evolving something that does. Scan every
// route once, then give each region its own generation's leftovers.
const routable = new Set()
for (const [bucketKey, bucket] of Object.entries(encounterData)) {
  if (mapData[bucketKey]?.type === 'raid') continue
  for (const encounter of bucket.encounters) routable.add(encounter.speciesKey)
}
// The Bug Catching Contest hands out every non-legendary Bug-type, so those
// species are obtainable without a Raid Island \u2014 and so is anything they
// evolve into. Legendary bugs are exempt: they keep their Raid Island slot as
// well as appearing in the contest. Seed them here so the rest drop out of
// every region's raid pool.
for (const [key, entry] of Object.entries(species))
  if (
    entry.id > 0 &&
    entry.id <= 1025 &&
    !entry.legendary &&
    (entry.types ?? []).includes('Bug')
  )
    routable.add(key)
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
// Alternate forms that no route offers and no evolution reaches still belong to
// a region: regional/paradox forms to the region they debuted in, and Hisuian
// forms to Galar (which already hosts the other Hisui leftovers — Sneasler,
// Overqwil — because its generation introduced them). Megas/Gigantamax are
// level-100 evolutions, so they are already routable and not listed here.
const FORM_RAID_REGION = (key) => {
  if (key.startsWith('a-')) return 'alola'
  if (key.startsWith('g-') || key.startsWith('h-')) return 'galar'
  if (key === 'basculin-w' || key === 'basculegion-f' || key === 'indeedee-f') return 'galar'
  if (key.startsWith('p-tauros') || key === 'p-wooper') return 'paldea'
  return null
}
const leftoverFormsFor = (regionId) =>
  Object.entries(species)
    .filter(
      ([key, entry]) =>
        entry.id > 1025 && !routable.has(key) && FORM_RAID_REGION(key) === regionId
    )
    .map(([key, entry]) => ({ key, ...entry }))
// Paldea's trimmed area species only turn up there, so its Raid Island takes
// any that no longer appear on a route (deduped below against the Gen 9 pool).
const paldeaExtrasFor = (regionId) =>
  regionId === 'paldea'
    ? [...paldeaDroppedSpecies]
        .filter((key) => !routable.has(key) && species[key])
        .map((key) => ({ key, ...species[key] }))
    : []
const raidCandidates = (pending) => {
  const { regionObj, all: regionSpecies } = pending,
    poolByKey = new Map()
  for (const entry of [
    ...regionSpecies.filter(
      (entry) => !routable.has(entry.key) && !paldeaDroppedSpecies.has(entry.key)
    ),
    ...leftoverFormsFor(regionObj.id),
    ...paldeaExtrasFor(regionObj.id),
  ])
    if (!poolByKey.has(entry.key)) poolByKey.set(entry.key, entry)
  return [...poolByKey.values()]
}
// Species the player can end up breeding: everything route-caught plus every
// final kept on any Raid Island. Breeding one yields its chain root, so any
// stage produced that way is safe to leave off the Raid Islands.
const globalBreedRoots = new Set()
const addBreedRoot = (key) => {
  const data = breedingData[key]
  if (data && !data.undiscovered) globalBreedRoots.add(breedChainRoot(key))
}
for (const key of routable) addBreedRoot(key)
for (const pending of pendingRaids)
  for (const entry of raidCandidates(pending)) if (staysInRaidPool(entry)) addBreedRoot(entry.key)
const breedReachable = new Set(globalBreedRoots)
let breedGrew = true
while (breedGrew) {
  breedGrew = false
  for (const key of [...breedReachable])
    for (const evolution of evolutionData[key] ?? [])
      if (!breedReachable.has(evolution.into))
        (breedReachable.add(evolution.into), (breedGrew = true))
}

// The legendary pool is every legendary/mythical with no other source, and is
// kept in full. Ordinary finals (fossils, regional forms, one-off lines) are a
// distinct lower tier: they still live on the island's wild table, but never
// headline a raid. The cap is a safety rail — the route/breeding scan already
// keeps the ordinary sets around a dozen.
const RAID_ORDINARY_CAP = 15
for (const pending of pendingRaids) {
  const { regionObj, raidId, raidNodeName } = pending,
    pool = raidPoolSpecies(raidCandidates(pending), breedReachable),
    legendaryPool = pool.filter((entry) => entry.legendary),
    ordinaryPool = pool.filter((entry) => !entry.legendary).slice(0, RAID_ORDINARY_CAP),
    toEntry = (entry) => ({ speciesKey: entry.key, level: raidLevel(entry) })
  regionObj.raidPool = legendaryPool.map(toEntry)
  regionObj.raidOrdinaryPool = ordinaryPool.map(toEntry)
  // The island's wild table carries both tiers, in legendary-first order, so
  // nothing is orphaned and idling on the island can surface the ordinary set.
  const islandPool = [...legendaryPool, ...ordinaryPool]
  if (raidId)
    encounterData[raidId] = {
      name: raidNodeName,
      encounters: islandPool.map((entry) => ({
        speciesKey: entry.key,
        weight: 1,
        minLevel: raidLevel(entry),
        maxLevel: raidLevel(entry),
      })),
    }
}

// De-overlap hand-measured layouts: reference maps put adjacent towns and
// routes (Route 10 beside Opelucid City) very close, and those fixed positions
// bypass the collision pass. Relax any pair closer than MAP_MIN_DIST apart,
// nudging both symmetrically and keeping them on-canvas.
const MAP_MIN_DIST = 3
for (const region of regions) {
  const locations = Object.values(mapData).filter(
    (location) => (location.region ?? 'kanto') === region.id
  )
  for (let pass = 0; pass < 500; pass++) {
    let moved = false
    for (let i = 0; i < locations.length; i++)
      for (let j = i + 1; j < locations.length; j++) {
        const a = locations[i].position,
          b = locations[j].position
        let dx = b.x - a.x,
          dy = b.y - a.y,
          distance = Math.hypot(dx, dy)
        if (distance >= MAP_MIN_DIST) continue
        if (distance < 1e-6) ((dx = 0.1), (dy = 0.1), (distance = Math.hypot(dx, dy)))
        const push = (MAP_MIN_DIST - distance) / 2 + 0.01,
          ux = (dx / distance) * push,
          uy = (dy / distance) * push
        a.x = Math.max(2, Math.min(98, a.x - ux))
        a.y = Math.max(2, Math.min(98, a.y - uy))
        b.x = Math.max(2, Math.min(98, b.x + ux))
        b.y = Math.max(2, Math.min(98, b.y + uy))
        moved = true
      }
    if (!moved) break
  }
}

// Make `unlockOrder` a genuine ordering key: two locations can share a rank
// (two towns whose lowest-numbered route is the same), so nudge the collisions
// apart by a tiny, deterministic fraction.
for (const region of regions) {
  const groups = new Map()
  for (const location of Object.values(mapData))
    if ((location.region ?? 'kanto') === region.id) {
      const group = groups.get(location.unlockOrder) ?? []
      group.push(location)
      groups.set(location.unlockOrder, group)
    }
  for (const [order, group] of groups) {
    if (group.length < 2) continue
    group
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .forEach((location, index) => {
        location.unlockOrder = Number((order + (index + 1) * 1e-4).toFixed(6))
      })
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

// Zones hide their sub-area routes. Any road that ended up pointing at a hidden
// sub-area (the league/raid island are stitched on after the grouping pass)
// should point at that sub-area's zone hub instead, or it floats unconnected.
const hiddenAreas = Object.values(mapData).filter((location) => location.hidden)
for (const area of hiddenAreas) area.connections = [area.zone]
const visibleLocations = Object.values(mapData).filter((location) => !location.hidden)
for (const location of visibleLocations)
  location.connections = [
    ...new Set(
      location.connections.map((id) => (mapData[id]?.hidden ? mapData[id].zone : id))
    ),
  ].filter((id) => id !== location.id)
// A zone hub keeps a link to each sub-area, and the remapped links are mutual.
for (const location of visibleLocations) {
  for (const subArea of location.subAreas ?? [])
    if (!location.connections.includes(subArea.id)) location.connections.push(subArea.id)
  for (const id of [...location.connections]) {
    const other = mapData[id]
    if (other && !other.connections.includes(location.id)) other.connections.push(location.id)
  }
}

// Added zone hubs and injected wild areas are placed at hand-picked or
// centroid coordinates that can land on top of a measured town/route. Settle
// only those nodes: a spring pulls each toward its visible neighbours' centre
// (so roads stay local) and a repulsion pushes it clear of every other node.
const addedAreaIds = new Set()
for (const [regionId, areas] of Object.entries(POST_AREAS))
  for (const area of areas) addedAreaIds.add(locId(regionId, area.node))
const MOVABLE_MIN_DISTANCE = 8,
  clampPosition = (value) => Math.max(2, Math.min(98, value))
for (let iteration = 0; iteration < 120; iteration++) {
  for (const location of visibleLocations) {
    if (location.type !== 'zone' && !addedAreaIds.has(location.id)) continue
    // Keep a hub's roads short by pulling it toward its local neighbours —
    // but not a hand-grouped island hub, which sits at its own areas' centre.
    if (!groupedHubIds.has(location.id)) {
      const neighbours = location.connections
        .map((id) => mapData[id])
        .filter((other) => other && !other.hidden && other !== location)
      if (neighbours.length) {
        const averageX = neighbours.reduce((sum, other) => sum + other.position.x, 0) / neighbours.length,
          averageY = neighbours.reduce((sum, other) => sum + other.position.y, 0) / neighbours.length
        location.position.x += (averageX - location.position.x) * 0.1
        location.position.y += (averageY - location.position.y) * 0.1
      }
    }
    for (const other of visibleLocations) {
      // Regions are separate maps that happen to share the 0-100 coordinate
      // space, so only settle against nodes in the same region.
      if (other === location || (other.region ?? 'kanto') !== (location.region ?? 'kanto'))
        continue
      const dx = location.position.x - other.position.x,
        dy = location.position.y - other.position.y,
        distance = Math.hypot(dx, dy) || 0.001
      if (distance >= MOVABLE_MIN_DISTANCE) continue
      const push = (MOVABLE_MIN_DISTANCE - distance) * 0.5
      location.position.x += (dx / distance) * push
      location.position.y += (dy / distance) * push
    }
    location.position.x = clampPosition(location.position.x)
    location.position.y = clampPosition(location.position.y)
  }
}

// Some hand-measured layouts pack towns/routes so tightly that labels and roads
// stack (Sinnoh's south-west, Kalos and Unova). Symmetrically push apart any
// visible pair closer than the threshold — both nodes move, so the shape stays
// roughly in place. Regions that are already spaced out are left untouched.
const RELAX_MIN_DISTANCE = 6.5
for (const region of regions) {
  const nodes = visibleLocations.filter((location) => (location.region ?? 'kanto') === region.id)
  for (let iteration = 0; iteration < 150; iteration++) {
    let moved = false
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i],
          b = nodes[j],
          dx = b.position.x - a.position.x,
          dy = b.position.y - a.position.y,
          distance = Math.hypot(dx, dy)
        if (distance >= RELAX_MIN_DISTANCE || distance === 0) continue
        const push = (RELAX_MIN_DISTANCE - distance) / 2 + 0.01,
          unitX = dx / distance,
          unitY = dy / distance
        a.position.x = clampPosition(a.position.x - unitX * push)
        a.position.y = clampPosition(a.position.y - unitY * push)
        b.position.x = clampPosition(b.position.x + unitX * push)
        b.position.y = clampPosition(b.position.y + unitY * push)
        moved = true
      }
    if (!moved) break
  }
}

// Region entry points unlock when the player spends an Unlock Token earned by
// beating a region's Champion (see the Pokedex/Town Map). A starting region is
// open immediately.
if (mapData.palletTown) mapData.palletTown.unlock = { entry: true }
if (mapData.route1) mapData.route1.unlock = { requires: ['palletTown'] }
// Kanto's hand-curated Raid Island predates the generated ones and had no
// routeKey (nor an encounter bucket), unlike every other region. Wire it up so
// `encounterData[state.currentRoute]` resolves while raiding.
if (mapData.raidIsland) mapData.raidIsland.routeKey = 'raidIsland'

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
