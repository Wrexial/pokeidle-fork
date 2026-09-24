// Kalos's Grand Auction House. Split out of game/minigames.js. Bid against
// hidden NPC budgets for a lot of items: the appraiser gives a value range, the
// NPCs drop out at their own ceilings, and whatever the hammer falls on is what
// you pay. Bid too high and you still pay for it.

/** Lots the house can put on the block. `value` is the fair price to compare a
 * bid against; the item bundle is what the winner takes home. */
export const AUCTION_LOTS = [
  {
    id: 'stoneCrate',
    name: 'Evolution Stone Crate',
    blurb: 'Four stones from a retiring trainer.',
    value: 12000,
    items: [
      { itemId: 'fireStone', quantity: 1 },
      { itemId: 'waterStone', quantity: 1 },
      { itemId: 'leafStone', quantity: 1 },
      { itemId: 'thunderStone', quantity: 1 },
    ],
  },
  {
    id: 'battleCache',
    name: 'Battle Cache',
    blurb: 'A competitive trainer\u2019s spare gear.',
    value: 14000,
    items: [
      { itemId: 'leftovers', quantity: 1 },
      { itemId: 'focusSash', quantity: 1 },
      { itemId: 'sitrusBerry', quantity: 3 },
    ],
  },
  {
    id: 'choiceSet',
    name: 'Choice Trio',
    blurb: 'Band, Specs and Scarf as one lot.',
    value: 18000,
    items: [
      { itemId: 'choiceBand', quantity: 1 },
      { itemId: 'choiceSpecs', quantity: 1 },
      { itemId: 'choiceScarf', quantity: 1 },
    ],
  },
  {
    id: 'candyJar',
    name: 'Candy Jar',
    blurb: 'Levelling supplies by the handful.',
    value: 10000,
    items: [
      { itemId: 'rareCandy', quantity: 2 },
      { itemId: 'expCandyL', quantity: 3 },
    ],
  },
  {
    id: 'tradeWorkshop',
    name: 'Trade Workshop',
    blurb: 'Link Cables and a Moon Stone.',
    value: 9000,
    items: [
      { itemId: 'linkCable', quantity: 2 },
      { itemId: 'moonStone', quantity: 1 },
    ],
  },
  {
    id: 'treasureChest',
    name: 'Treasure Chest',
    blurb: 'Trinkets the mart will buy back.',
    value: 11000,
    items: [
      { itemId: 'nugget', quantity: 3 },
      { itemId: 'starPiece', quantity: 1 },
      { itemId: 'bigPearl', quantity: 1 },
    ],
  },
  {
    id: 'boosterBundle',
    name: 'Booster Bundle',
    blurb: 'A trio of type-boosting held items.',
    value: 8000,
    items: [
      { itemId: 'mysticWater', quantity: 1 },
      { itemId: 'charcoal', quantity: 1 },
      { itemId: 'magnet', quantity: 1 },
    ],
  },
  {
    id: 'megaCache',
    name: 'Sealed Mega Cache',
    blurb: 'A Mega Stone from a retired champion.',
    value: 16000,
    items: [
      { itemId: 'megaStone', quantity: 1 },
      { itemId: 'rareCandy', quantity: 1 },
    ],
  },
]

/** The rival bidders and how aggressively they push a lot's value. */
export const AUCTION_NPCS = [
  { name: 'Collector Bram', aggression: 0.75, spread: 0.7 },
  { name: 'Lady Odette', aggression: 0.9, spread: 0.95 },
  { name: 'Mr. Backlot', aggression: 0.6, spread: 0.55 },
]

/** Round a money amount to the nearest $100.
 * @param {number} amount
 */
function toHundreds(amount) {
  return Math.max(100, Math.round(amount / 100) * 100)
}

/** Pick a lot for the next sale.
 * @returns {typeof AUCTION_LOTS[number]}
 */
export function rollAuctionLot() {
  return AUCTION_LOTS[Math.floor(Math.random() * AUCTION_LOTS.length)]
}

/** The appraiser's public estimate of a lot, as a low/high money range.
 * @param {typeof AUCTION_LOTS[number]} lot
 */
export function auctionAppraisal(lot) {
  return {
    low: toHundreds(lot.value * 0.7),
    high: toHundreds(lot.value * 1.3),
  }
}

/** The per-bid raise for a lot.
 * @param {typeof AUCTION_LOTS[number]} lot
 */
export function auctionRaise(lot) {
  return toHundreds(lot.value * 0.06)
}

/**
 * Open the bidding on a lot. NPC ceilings stay hidden from the player.
 * @param {typeof AUCTION_LOTS[number]} lot
 * @param {() => number} [random]
 * @returns {{
 *   lot: typeof AUCTION_LOTS[number], price: number, raise: number,
 *   highest: 'player' | string | null, won: boolean,
 *   bidders: { name: string, maxBid: number, active: boolean }[],
 * }}
 */
export function createAuction(lot, random = Math.random) {
  return {
    lot,
    price: toHundreds(lot.value * 0.3),
    raise: auctionRaise(lot),
    highest: null,
    won: false,
    bidders: AUCTION_NPCS.map((npc) => ({
      name: npc.name,
      maxBid: toHundreds(lot.value * (npc.spread + (random() - 0.5) * npc.aggression)),
      active: true,
    })),
  }
}

/** Can the player raise the bid (in turn, not already won, and affordable)?
 * @param {ReturnType<typeof createAuction>} auction
 * @param {number} money
 */
export function canAuctionBid(auction, money) {
  return (
    !auction.won &&
    auction.highest !== 'player' &&
    money >= auction.price + auction.raise
  )
}

/**
 * The player raises once; the most stubborn rival may answer. Returns the new
 * auction, with `won` set when every rival has dropped out.
 * @param {ReturnType<typeof createAuction>} auction
 * @returns {ReturnType<typeof createAuction>}
 */
export function placeAuctionBid(auction) {
  if (auction.won || auction.highest === 'player') return auction
  const playerPrice = auction.price + auction.raise,
    challenger = auction.bidders.find((bidder) => bidder.active && bidder.maxBid >= playerPrice)
  if (!challenger)
    return {
      ...auction,
      price: playerPrice,
      highest: 'player',
      won: true,
      bidders: auction.bidders.map((bidder) => ({ ...bidder, active: false })),
    }
  return {
    ...auction,
    price: playerPrice + auction.raise,
    highest: challenger.name,
    bidders: auction.bidders.map((bidder) =>
      bidder.active && bidder.maxBid < playerPrice ? { ...bidder, active: false } : bidder
    ),
  }
}
