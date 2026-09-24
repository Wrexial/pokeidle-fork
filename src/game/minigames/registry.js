// Fixed minigame registry and panel metadata. Split from game/minigames.js.

import { BUG_CONTEST_COST, BUG_CONTEST_RUSTLES } from './bug-contest.js'
import { QUIZ_COST, QUIZ_LIVES, QUIZ_QUESTIONS } from './academy-quiz.js'
import { SAFARI_BALLS, SAFARI_COST } from './safari.js'
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
  'johto-route-35': 'bugContest',
  'sinnoh-eterna-city': 'mining',
  safariZone: 'safari',
  'paldea-mesagoza': 'academyQuiz',
  'unova-nimbasa-city': 'voltorbFlip',
  'kalos-lumiose-city': 'auctionHouse',
  'alola-poke-pelago': 'pokePelago',
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
    hint: `Explore the reserve with ${SAFARI_BALLS} free Safari Balls. Bait calms a Pokemon (but makes it harder to catch) and a Rock makes it easier to catch (but more likely to run). Entry is $${SAFARI_COST.toLocaleString()}.`,
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
  pokePelago: {
    title: 'Poké Pelago',
    cost: 0,
    action: 'VISIT POKÉ PELAGO',
    hint: 'Care for your companion, tend the Berry Garden, and staff the passive islands that gather resources while you battle.',
  },
}
