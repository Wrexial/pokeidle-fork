// Kalos's Grand Auction House. Split out of game/minigames.js. Bid against
// hidden NPC budgets for a lot: the appraiser gives a value range, the NPCs
// drop out at their own ceilings, and whatever the hammer falls on is what you
// pay. Bid too high and you still pay for it.
//
// The house is now the game's main source of battle held items, so most lots
// are held-item bundles; a few utility lots (stones, candies, treasure) keep
// the block varied.

/** Lots the house can put on the block. `value` is the fair price to compare a
 * bid against; the item bundle is what the winner takes home. `kind: 'held'`
 * lots are weighted up in `rollAuctionLot` since held items are the draw. */
export const AUCTION_LOTS = [
  {
    id: 'battleCache',
    kind: 'held',
    name: 'Battle Cache',
    blurb: "A competitive trainer's spare gear.",
    value: 12000,
    items: [
      { itemId: 'leftovers', quantity: 1 },
      { itemId: 'focusSash', quantity: 1 },
      { itemId: 'sitrusBerry', quantity: 3 },
    ],
  },
  {
    id: 'choiceSet',
    kind: 'held',
    name: 'Choice Trio',
    blurb: 'Band, Specs and Scarf as one lot.',
    value: 14000,
    items: [
      { itemId: 'choiceBand', quantity: 1 },
      { itemId: 'choiceSpecs', quantity: 1 },
      { itemId: 'choiceScarf', quantity: 1 },
    ],
  },
  {
    id: 'defensiveKit',
    kind: 'held',
    name: 'Defensive Kit',
    blurb: 'Bulk for a wall: Assault Vest and Eviolite.',
    value: 9000,
    items: [
      { itemId: 'assaultVest', quantity: 1 },
      { itemId: 'eviolite', quantity: 1 },
    ],
  },
  {
    id: 'glassCannon',
    kind: 'held',
    name: 'Glass Cannon Set',
    blurb: 'Life Orb and a spare Focus Sash for the brave.',
    value: 9000,
    items: [
      { itemId: 'lifeOrb', quantity: 1 },
      { itemId: 'focusSash', quantity: 1 },
    ],
  },
  {
    id: 'berryBasket',
    kind: 'held',
    name: 'Berry Basket',
    blurb: 'A bundle of Sitrus and Lum Berries.',
    value: 8000,
    items: [
      { itemId: 'sitrusBerry', quantity: 3 },
      { itemId: 'lumBerry', quantity: 3 },
    ],
  },
  {
    id: 'boosterFireWater',
    kind: 'held',
    name: 'Elemental Booster Set',
    blurb: 'Fire, Water, Grass, Electric and Ice boosters.',
    value: 10000,
    items: [
      { itemId: 'charcoal', quantity: 1 },
      { itemId: 'mysticWater', quantity: 1 },
      { itemId: 'miracleSeed', quantity: 1 },
      { itemId: 'magnet', quantity: 1 },
      { itemId: 'neverMeltIce', quantity: 1 },
    ],
  },
  {
    id: 'boosterFighting',
    kind: 'held',
    name: 'Brawler Booster Set',
    blurb: 'Fighting, Poison, Ground, Flying and Psychic boosters.',
    value: 10000,
    items: [
      { itemId: 'blackBelt', quantity: 1 },
      { itemId: 'poisonBarb', quantity: 1 },
      { itemId: 'softSand', quantity: 1 },
      { itemId: 'sharpBeak', quantity: 1 },
      { itemId: 'twistedSpoon', quantity: 1 },
    ],
  },
  {
    id: 'boosterRare',
    kind: 'held',
    name: 'Rare Booster Set',
    blurb: 'Bug, Rock, Ghost, Dragon and Dark boosters.',
    value: 10000,
    items: [
      { itemId: 'silverPowder', quantity: 1 },
      { itemId: 'hardStone', quantity: 1 },
      { itemId: 'spellTag', quantity: 1 },
      { itemId: 'dragonFang', quantity: 1 },
      { itemId: 'blackGlasses', quantity: 1 },
    ],
  },
  {
    id: 'boosterPixie',
    kind: 'held',
    name: 'Pixie Booster Set',
    blurb: 'Normal, Steel and Fairy boosters.',
    value: 7000,
    items: [
      { itemId: 'silkScarf', quantity: 1 },
      { itemId: 'ironPlate', quantity: 1 },
      { itemId: 'pixiePlate', quantity: 1 },
    ],
  },
  {
    id: 'megaCache',
    kind: 'held',
    name: 'Sealed Mega Cache',
    blurb: 'A Mega Stone from a retired champion.',
    value: 16000,
    items: [
      { itemId: 'megaStone', quantity: 1 },
      { itemId: 'rareCandy', quantity: 1 },
    ],
  },
  {
    id: 'stoneCrate',
    kind: 'utility',
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
    id: 'candyJar',
    kind: 'utility',
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
    kind: 'utility',
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
    kind: 'utility',
    name: 'Treasure Chest',
    blurb: 'Trinkets the mart will buy back.',
    value: 11000,
    items: [
      { itemId: 'nugget', quantity: 3 },
      { itemId: 'starPiece', quantity: 1 },
      { itemId: 'bigPearl', quantity: 1 },
    ],
  },
]

/** The rival bidders and how aggressively they push a lot's value. */
export const AUCTION_NPCS = [
  { name: 'Collector Bram', aggression: 0.75, spread: 0.7 },
  { name: 'Lady Odette', aggression: 0.9, spread: 0.95 },
  { name: 'Mr. Backlot', aggression: 0.6, spread: 0.55 },
]

/** Raise multipliers the player can bid with: the base raise, double or a big
 * jump. A bigger jump can blow past a rival's ceiling in one go (winning the
 * lot), but you pay the higher price when it does not scare them off. */
export const AUCTION_BID_STEPS = [1, 2, 4]

/** Round a money amount to the nearest $100.
 * @param {number} amount
 */
function toHundreds(amount) {
  return Math.max(100, Math.round(amount / 100) * 100)
}

/** Pick a lot for the next sale. Held-item lots are weighted so the house is a
 * reliable place to gear up, not a lottery of trinkets.
 * @param {() => number} [random]
 * @returns {typeof AUCTION_LOTS[number]}
 */
export function rollAuctionLot(random = Math.random) {
  const weighted = AUCTION_LOTS.flatMap((lot) =>
    lot.kind === 'held' ? [lot, lot, lot] : [lot]
  )
  return weighted[Math.floor(random() * weighted.length)]
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

/** The price the player would pay to raise the bid at a given step.
 * @param {ReturnType<typeof createAuction>} auction
 * @param {number} [step] Index into `AUCTION_BID_STEPS` (or a raw multiplier).
 */
export function auctionBidPrice(auction, step = 0) {
  const multiplier = AUCTION_BID_STEPS[step] ?? 1
  return auction.price + auction.raise * multiplier
}

/** Can the player raise the bid (in turn, not already won, and affordable)?
 * @param {ReturnType<typeof createAuction>} auction
 * @param {number} money
 * @param {number} [step]
 */
export function canAuctionBid(auction, money, step = 0) {
  return (
    !auction.won &&
    auction.highest !== 'player' &&
    money >= auctionBidPrice(auction, step)
  )
}

/**
 * The player raises to `auctionBidPrice(auction, step)`; the most stubborn rival
 * may answer. Returns the new auction, with `won` set when every rival has
 * dropped out and a `message` describing the reaction.
 * @param {ReturnType<typeof createAuction>} auction
 * @param {number} [step]
 * @returns {ReturnType<typeof createAuction> & { message: string }}
 */
export function placeAuctionBid(auction, step = 0) {
  if (auction.won || auction.highest === 'player') return { ...auction, message: '' }
  const playerPrice = auctionBidPrice(auction, step),
    active = auction.bidders.filter((bidder) => bidder.active),
    contenders = active.filter((bidder) => bidder.maxBid >= playerPrice)
  if (contenders.length === 0)
    return {
      ...auction,
      price: playerPrice,
      highest: 'player',
      won: true,
      bidders: auction.bidders.map((bidder) => ({ ...bidder, active: false })),
      message: `Hammer down \u2014 sold to you for $${playerPrice.toLocaleString()}!`,
    }
  // The deepest-pocketed rival answers; the rest give up once they can't match.
  const challenger = contenders.reduce(
      (best, bidder) => (bidder.maxBid > best.maxBid ? bidder : best),
      contenders[0]
    ),
    counter = playerPrice + auction.raise,
    dropped = active.filter((bidder) => bidder !== challenger && bidder.maxBid < counter)
  return {
    ...auction,
    price: counter,
    highest: challenger.name,
    bidders: auction.bidders.map((bidder) =>
      bidder.active && bidder !== challenger && bidder.maxBid < counter
        ? { ...bidder, active: false }
        : bidder
    ),
    message:
      `${challenger.name} counters at $${counter.toLocaleString()}!` +
      (dropped.length > 0
        ? ` ${dropped.map((bidder) => bidder.name).join(' and ')} drop${
            dropped.length > 1 ? '' : 's'
          } out.`
        : ''),
  }
}
