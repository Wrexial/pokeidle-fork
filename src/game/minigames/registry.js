// Fixed minigame registry and panel metadata. Split from game/minigames.js.

import { BUG_CONTEST_COST, BUG_CONTEST_RUSTLES } from './bug-contest.js'
import { QUIZ_COST, QUIZ_LIVES, QUIZ_QUESTIONS } from './academy-quiz.js'
import { SAFARI_BALLS, SAFARI_COST } from './safari.js'
import { CONTEST_COST, CONTEST_ROUNDS } from './contest.js'
import { POKEATHLON_COST, POKEATHLON_ATTEMPTS } from './pokeathlon.js'
import { POKE_RADAR_COST } from './poke-radar.js'
import { BATTLE_ROYAL_COST } from './battle-royal.js'
import { DOUBLES_COST } from './doubles.js'
import { DYNAMAX_ADVENTURES_COST, DYNAMAX_STAGES } from './dynamax-adventures.js'
import { LIGHTS_OUT_COST } from './lights-out.js'
import { CURRY_COST } from './curry.js'
import { POKESTAR_COST } from './pokestar.js'
import { MATCH3_COST, MATCH3_MOVES } from './match3.js'
import { MEMORY_COST, MEMORY_PAIRS } from './memory.js'
import { WHACK_COST, WHACK_DURATION_MS } from './whack.js'
import { MUSICAL_COST, MUSICAL_NOTES } from './musical.js'
import { PICNIC_COST, PICNIC_PICKS } from './picnic.js'
import { POKEBALL_FACTORY_COST, FACTORY_SIZE } from './pokeball-factory.js'
import { SLIDING_COST, SLIDING_SIZE } from './sliding-puzzle.js'
import { ICE_SLIDE_COST } from './ice-slide.js'
import { mapData } from '../../data/gameData.js'
import { VOLTORB_FLIP_COST } from './voltorb-flip.js'
import { BATTLE_TOWER_LOCATION } from '../../data/config.js'
import { SLOT_SPIN_COST } from './game-corner.js'
import { MINING_COST, MINING_DIGS } from './mining.js'

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

/**
 * The reducer phase a minigame runs in, keyed by minigame id. Most phases share
 * the id; the Bug-Catching Contest and Poke Pelago are the exceptions. Used to
 * attribute an `END_MINIGAME` (or `END_BUG_CONTEST` / `END_SAFARI`) to its game
 * without every scene passing the id itself.
 * @type {Record<string, string>}
 */
export const MINIGAME_PHASES = {
  gameCorner: 'gameCorner',
  bugContest: 'bugCatching',
  mining: 'mining',
  safari: 'safari',
  academyQuiz: 'academyQuiz',
  voltorbFlip: 'voltorbFlip',
  auctionHouse: 'auctionHouse',
  contest: 'contest',
  pokeathlon: 'pokeathlon',
  pokeRadar: 'pokeRadar',
  battleRoyal: 'battleRoyal',
  doubles: 'doubles',
  dynamaxAdventures: 'dynamaxAdventures',
  lightsOut: 'lightsOut',
  curry: 'curry',
  pokestar: 'pokestar',
  puzzleLeague: 'puzzleLeague',
  memory: 'memory',
  whack: 'whack',
  musical: 'musical',
  picnic: 'picnic',
  pokeballFactory: 'pokeballFactory',
  ruinsPuzzle: 'ruinsPuzzle',
  iceSlide: 'iceSlide',
  pokePelago: 'pelago',
}

/**
 * The minigame id a scene phase belongs to, or null for a non-minigame phase.
 * @param {string} phase
 * @returns {string | null}
 */
export function minigameIdForPhase(phase) {
  return MINIGAME_PHASES[phase] ?? null
}

/**
 * Each minigame's region, read from the home area's `region` field.
 * @type {Record<string, string>}
 */
export const MINIGAME_REGIONS = Object.fromEntries(
  Object.entries(MINIGAME_AREAS).map(([minigameId, locationId]) => [
    minigameId,
    mapData[locationId]?.region ?? 'kanto',
  ])
)

/**
 * The minigame id based at a location, or null.
 * @param {string} locationId
 * @returns {string | null}
 */
export function minigameForLocation(locationId) {
  return MINIGAME_LOCATIONS[locationId] ?? null
}

/**
 * Every minigame based in a region, in registry order.
 * @param {string} regionId
 * @returns {string[]}
 */
export function minigamesInRegion(regionId) {
  return Object.keys(MINIGAME_REGIONS).filter((minigameId) => MINIGAME_REGIONS[minigameId] === regionId)
}

/**
 * Location -> the action that launches its minigame.
 * @type {Record<string, string>}
 */
export const MINIGAME_START_ACTION = {
  gameCorner: 'START_GAME_CORNER',
  bugContest: 'START_BUG_CONTEST',
  mining: 'START_MINING',
  safari: 'START_SAFARI',
  academyQuiz: 'START_ACADEMY_QUIZ',
  voltorbFlip: 'START_VOLTORB_FLIP',
  auctionHouse: 'START_AUCTION_HOUSE',
  contest: 'START_CONTEST',
  pokeathlon: 'START_POKEATHLON',
  pokeRadar: 'START_POKE_RADAR',
  battleRoyal: 'START_BATTLE_ROYAL',
  doubles: 'START_DOUBLES',
  dynamaxAdventures: 'START_DYNAMAX_ADVENTURES',
  lightsOut: 'START_LIGHTS_OUT',
  curry: 'START_CURRY',
  pokestar: 'START_POKESTAR',
  puzzleLeague: 'START_PUZZLE_LEAGUE',
  memory: 'START_MEMORY',
  whack: 'START_WHACK',
  musical: 'START_MUSICAL',
  picnic: 'START_PICNIC',
  pokeballFactory: 'START_POKEBALL_FACTORY',
  ruinsPuzzle: 'START_RUINS_PUZZLE',
  iceSlide: 'START_ICE_SLIDE',
  pokePelago: 'START_PELAGO',
}

/**
 * Every location that hosts a fixed point of interest (the minigames plus
 * Hoenn's Battle Tower). Used by the Town Map to badge the node with a `+`.
 * @type {Set<string>}
 */
export const POI_LOCATIONS = new Set([...Object.keys(MINIGAME_LOCATIONS), BATTLE_TOWER_LOCATION])

/** @type {Record<string, { title: string, cost: number, action: string, hint: string }>} */
export const MINIGAME_INFO = {
  mining: {
    title: 'Sinnoh Underground',
    cost: MINING_COST,
    action: 'GO MINING',
    hint: `Dig for evolution stones, treasures and candies. Each run costs $${MINING_COST.toLocaleString()} and gives ${MINING_DIGS} digs.`,
  },
  bugContest: {
    title: 'Bug Catching Contest',
    cost: BUG_CONTEST_COST,
    action: 'ENTER CONTEST',
    hint: `Rustle the park bushes to scare out a bug, then throw a free Net Ball or let it go. You get ${BUG_CONTEST_RUSTLES} rustles \u2014 keep whatever you catch, but the rarer bugs may flee. Placing in the top three wins a cash and candy prize. Entry is $${BUG_CONTEST_COST.toLocaleString()}.`,
  },
  gameCorner: {
    title: 'Game Corner',
    cost: 0,
    action: 'ENTER GAME CORNER',
    hint: `Spin the 3\u00d73 Pok\u00e9mon slots \u2014 $${SLOT_SPIN_COST.toLocaleString()} a go. Match three along any of the 8 lines (3 rows, 3 columns, 2 diagonals); the rarer the Pok\u00e9mon, the bigger the payout.`,
  },
  safari: {
    title: 'Safari Zone',
    cost: SAFARI_COST,
    action: 'ENTER SAFARI ZONE',
    hint: `Explore the reserve with ${SAFARI_BALLS} free Safari Balls. It is split into four areas, each with its own Pokemon \u2014 the Center Area (Nidoran, Tauros, Kangaskhan), the river East Area (Dratini, Squirtle), the rocky North Area (Scyther, Pinsir, Charmander) and the thicketed West Area (Tangela, Bulbasaur, Exeggcute). Bait calms a Pokemon (but makes it harder to catch) and a Rock makes it easier to catch (but more likely to run). Safari finds roll shiny at twice the usual odds. Entry is $${SAFARI_COST.toLocaleString()}.`,
  },
  academyQuiz: {
    title: 'Academy Quiz',
    cost: QUIZ_COST,
    action: 'SIT THE QUIZ',
    hint: `Answer ${QUIZ_QUESTIONS} type-matchup questions against a 10-second clock. A wrong answer or a timeout costs one of your ${QUIZ_LIVES} lives; a good score earns money and candy. Entry is $${QUIZ_COST.toLocaleString()}.`,
  },
  voltorbFlip: {
    title: 'Voltorb Flip',
    cost: VOLTORB_FLIP_COST,
    action: 'PLAY VOLTORB FLIP',
    hint: `Flip tiles on a 5\u00d75 board for coins. Each row and column shows how many Voltorbs and how many points it hides \u2014 a Voltorb ends the run, but clearing every 2 and 3 banks the board and climbs a level. Entry is $${VOLTORB_FLIP_COST.toLocaleString()}.`,
  },
  auctionHouse: {
    title: 'Grand Auction House',
    cost: 0,
    action: 'ENTER AUCTION HOUSE',
    hint: 'Bid against hidden budgets for a lot of items. The appraiser gives a value range; rivals drop out at their own ceilings. Win the hammer and you pay what you bid \u2014 even if that is over the odds.',
  },
  contest: {
    title: 'Pok\u00e9mon Contest',
    cost: CONTEST_COST,
    action: 'ENTER CONTEST',
    hint: `Pick a move each round for ${CONTEST_ROUNDS} rounds. On-theme moves score best, chaining two different moves of the same type adds a combo, and repeating a move is penalised. Rank against the rivals at the end. Entry is $${CONTEST_COST.toLocaleString()}.`,
  },
  pokeathlon: {
    title: 'Pok\u00e9athlon',
    cost: POKEATHLON_COST,
    action: 'ENTER POK\u00c9ATHLON',
    hint: `Three events \u2014 mash the Sprint, time the Hurdles and throw at the moving target \u2014 each scored out of 100 (${POKEATHLON_ATTEMPTS} attempts in the last two). A medal pays money and candy. Entry is $${POKEATHLON_COST.toLocaleString()}.`,
  },
  pokeRadar: {
    title: 'Pok\u00e9 Radar',
    cost: POKE_RADAR_COST,
    action: 'CHAIN THE RADAR',
    hint: `Watch the grass light up, then tap the patches back in order. Every completed round lengthens the next sequence and builds a chain that boosts the shiny odds of a route's rarest species \u2014 a wrong tap breaks it. Entry is $${POKE_RADAR_COST.toLocaleString()}.`,
  },
  battleRoyal: {
    title: 'Battle Royal',
    cost: BATTLE_ROYAL_COST,
    action: 'ENTER BATTLE ROYAL',
    hint: `An endless wave gauntlet for your party. Each win heals the squad a little; the deeper you get, the bigger the purse. Entry is $${BATTLE_ROYAL_COST.toLocaleString()}.`,
  },
  doubles: {
    title: 'Battle Maison',
    cost: DOUBLES_COST,
    action: 'ENTER DOUBLES',
    hint: `Two of your Pokemon against two foes at once. Every battler picks its own target, spread moves hit both, and a fainted Pokemon is replaced from the bench until one side runs out. Entry is $${DOUBLES_COST.toLocaleString()}.`,
  },
  dynamaxAdventures: {
    title: 'Dynamax Adventures',
    cost: DYNAMAX_ADVENTURES_COST,
    action: 'ENTER MAX LAIR',
    hint: `Pick a path through ${DYNAMAX_STAGES} encounters, then face a legendary from Galar's raid pool. Win and you catch it; lose the party and you go home empty-handed. Entry is $${DYNAMAX_ADVENTURES_COST.toLocaleString()}.`,
  },
  lightsOut: {
    title: 'Lights Out',
    cost: LIGHTS_OUT_COST,
    action: 'START PUZZLE',
    hint: `Every tap toggles a tile and its four neighbours. Turn all 16 lights back on in as few taps as you can \u2014 a flawless solve pays best. Entry is $${LIGHTS_OUT_COST.toLocaleString()}.`,
  },
  curry: {
    title: 'Curry Cooking',
    cost: CURRY_COST,
    action: 'COOK A CURRY',
    hint: `Pick an ingredient to match the customer's flavour. After a 3-2-1 countdown, hold the fan to keep the campfire in the narrow sweet spot while it simmers. A great curry is worth money and a full-heal Curry. Entry is $${CURRY_COST.toLocaleString()}.`,
  },
  pokestar: {
    title: 'Pok\u00e9star Studios',
    cost: POKESTAR_COST,
    action: 'SHOOT A FILM',
    hint: 'The director calls each shot; pick the take that best matches the brief. Three shots, scored out of nine. Entry is $' + POKESTAR_COST.toLocaleString() + '.',
  },
  puzzleLeague: {
    title: 'Pok\u00e9mon Puzzle League',
    cost: MATCH3_COST,
    action: 'PLAY PUZZLE LEAGUE',
    hint: `Swap adjacent tiles to line up three or more and clear them; cleared tiles cascade for a bigger score. You get ${MATCH3_MOVES} swaps. Entry is $${MATCH3_COST.toLocaleString()}.`,
  },
  memory: {
    title: 'Pok\u00e9mon Memory',
    cost: MEMORY_COST,
    action: 'PLAY MEMORY',
    hint: `Flip two cards at a time to find all ${MEMORY_PAIRS} matching pairs. Fewer attempts scores better. Entry is $${MEMORY_COST.toLocaleString()}.`,
  },
  whack: {
    title: 'Whack-a-Diglett',
    cost: WHACK_COST,
    action: 'PLAY WHACK-A-DIGLETT',
    hint: `Tap each Diglett before it ducks back down \u2014 and leave the Zubat alone, it costs you a point. You have ${WHACK_DURATION_MS / 1000} seconds. Entry is $${WHACK_COST.toLocaleString()}.`,
  },
  musical: {
    title: 'Pok\u00e9mon Musical',
    cost: MUSICAL_COST,
    action: 'TAKE THE STAGE',
    hint: `Notes fall down four lanes \u2014 tap the matching arrow on the beat. Perfect timing scores the most; a routine is ${MUSICAL_NOTES} notes. Entry is $${MUSICAL_COST.toLocaleString()}.`,
  },
  picnic: {
    title: 'Picnic',
    cost: PICNIC_COST,
    action: 'START A PICNIC',
    hint: `Pick ${PICNIC_PICKS} fillings \u2014 the finished sandwich lures out a Pokemon of one of their types (picked at random) with tripled shiny odds. Drop each filling between a bottom and a top slice of Bread without toppling the stack. Entry is $${PICNIC_COST.toLocaleString()}.`,
  },
  pokeballFactory: {
    title: 'Pok\u00e9 Ball Factory',
    cost: POKEBALL_FACTORY_COST,
    action: 'START THE SHIFT',
    hint: `Tap the conveyor tiles to spin them a quarter-turn and link a line from the left inlet to the right outlet. The ${FACTORY_SIZE}\u00d7${FACTORY_SIZE} grid is scrambled every shift. Entry is $${POKEBALL_FACTORY_COST.toLocaleString()}.`,
  },
  ruinsPuzzle: {
    title: 'Ruins of Alph',
    cost: SLIDING_COST,
    action: 'SOLVE THE RUINS',
    hint: `Slide the stone tiles back into order against the single empty slot \u2014 tap a tile beside the gap to move it, or use the arrow keys. The ${SLIDING_SIZE}\u00d7${SLIDING_SIZE} picture is scrambled every visit, a quicker solve pays better, and every solve unearths the next Unown form you are missing. Entry is $${SLIDING_COST.toLocaleString()}.`,
  },
  iceSlide: {
    title: 'Snowpoint Temple',
    cost: ICE_SLIDE_COST,
    action: 'ENTER THE TEMPLE',
    hint: `Open the Strength chambers \u2014 shove each boulder onto its pressure plate to unseal the exit \u2014 then slide through a fresh run of ice rooms to reach the temple\u2019s heart; every visit rolls new rooms (higher Sinnoh prestige adds more), and the fewer moves the better. Entry is $${ICE_SLIDE_COST.toLocaleString()}.`,
  },
  pokePelago: {
    title: 'Poké Pelago',
    cost: 0,
    action: 'VISIT POKÉ PELAGO',
    hint: 'Care for your companion, tend the Berry Garden, and staff the passive islands that gather resources while you battle.',
  },
}

/**
 * The display title of the minigame based at a location, or null when the area
 * hosts none. Used by the Town Map node tooltip so the link is visible.
 * @param {string} locationId
 * @returns {string | null}
 */
export function minigameNameForLocation(locationId) {
  const minigameId = MINIGAME_LOCATIONS[locationId]
  return minigameId ? (MINIGAME_INFO[minigameId]?.title ?? null) : null
}
