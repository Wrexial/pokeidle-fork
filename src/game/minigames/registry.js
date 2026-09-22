// Region-to-minigame registry and panel metadata. Split from game/minigames.js.

import { BUG_CONTEST_COST, BUG_CONTEST_RUSTLES } from './bug-contest.js'
import { SLOT_SPIN_COST } from './game-corner.js'
import { MINING_COST, MINING_DIGS } from './mining.js'

/** @type {Record<string, string>} */
export const MINIGAME_BY_REGION = {
  kanto: 'gameCorner',
  johto: 'bugContest',
  sinnoh: 'mining',
}

/**
 * Region -> the location that must be unlocked before that region's minigame
 * becomes available (Hoenn's Battle Tower included).
 * @type {Record<string, string>}
 */
export const MINIGAME_UNLOCK_LOCATION = {
  kanto: 'celadonCity',
  johto: 'johto-route-35',
  hoenn: 'hoenn-route-111',
  sinnoh: 'sinnoh-eterna-city',
}

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
}
