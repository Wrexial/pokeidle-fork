// Split from src/data/constants.js — see tools/decompile/split-module.mjs

/** @type {Record<string, ActiveItem>} */
export const activeItems = {
    expShare: {
      id: 'expShare',
      name: 'Exp. Share',
      description:
        'For 500 battles, the active Pokemon gains 50% EXP and every other non-fainted party member gains 25% of the win\u2019s EXP.',
      duration: 500,
      buyPrice: null,
    },
    repel: {
      id: 'repel',
      name: 'Repel',
      description:
        "Halves a wild Pokemon's encounter weight on the current route for 500 battles.",
      duration: 500,
      buyPrice: 2e3,
    },
    honey: {
      id: 'honey',
      name: 'Honey',
      description:
        "Doubles a wild Pokemon's encounter weight on the current route for 500 battles.",
      duration: 500,
      buyPrice: 2e3,
    },
  }

/** @type {Record<string, PokeBall>} */
export const pokeBalls = {
    pokeball: {
      id: 'pokeball',
      name: 'Poke Ball',
      description: 'A standard ball for catching Pokemon.',
      buyPrice: 200,
      ballModifier: 1,
    },
    greatball: {
      id: 'greatball',
      name: 'Great Ball',
      description: 'A high-performance ball with a better catch rate.',
      buyPrice: 600,
      ballModifier: 1.5,
    },
    ultraball: {
      id: 'ultraball',
      name: 'Ultra Ball',
      description: 'An ultra-performance ball with an even better catch rate.',
      buyPrice: 1200,
      ballModifier: 2,
    },
    // Situational balls: `ballModifier` is the fallback, `getBallModifier`
    // (src/game/catching.js) bumps it when the situation matches.
    quickball: {
      id: 'quickball',
      name: 'Quick Ball',
      description: 'A x5 catch rate if thrown on the first turn of a battle.',
      buyPrice: 1000,
      ballModifier: 1,
    },
    timerball: {
      id: 'timerball',
      name: 'Timer Ball',
      description: 'Gets better the longer the battle has lasted (up to x4).',
      buyPrice: 1000,
      ballModifier: 1,
    },
    repeatball: {
      id: 'repeatball',
      name: 'Repeat Ball',
      description: 'A x3.5 catch rate on a species already in your Pokedex.',
      buyPrice: 1000,
      ballModifier: 1,
    },
    netball: {
      id: 'netball',
      name: 'Net Ball',
      description: 'A x3.5 catch rate on Water- and Bug-type Pokemon.',
      buyPrice: 1000,
      ballModifier: 1,
    },
    diveball: {
      id: 'diveball',
      name: 'Dive Ball',
      description: 'A x3.5 catch rate on water routes.',
      buyPrice: 1000,
      ballModifier: 1,
    },
    duskball: {
      id: 'duskball',
      name: 'Dusk Ball',
      description: 'A x3 catch rate in caves or at night.',
      buyPrice: 1000,
      ballModifier: 1,
    },
    nestball: {
      id: 'nestball',
      name: 'Nest Ball',
      description: 'Catches lower-level Pokemon more easily.',
      buyPrice: 1000,
      ballModifier: 1,
    },
    premierball: {
      id: 'premierball',
      name: 'Premier Ball',
      description: 'A commemorative ball with a standard catch rate. Not for sale \u2014 one comes free with every 10 balls you buy.',
      buyPrice: null,
      ballModifier: 1,
    },
    safariball: {
      id: 'safariball',
      name: 'Safari Ball',
      description: 'A special ball used only in the Safari Zone.',
      buyPrice: null,
      ballModifier: 1.5,
    },
    masterball: {
      id: 'masterball',
      name: 'Master Ball',
      description: 'The best ball that catches any Pokemon without fail.',
      buyPrice: null,
      ballModifier: 255,
    },
  }

export const ballOrder = [
  'pokeball',
  'premierball',
  'greatball',
  'quickball',
  'timerball',
  'repeatball',
  'netball',
  'diveball',
  'nestball',
  'duskball',
  'ultraball',
  'masterball',
]

/**
 * Balls the catch rule may auto-throw, in preference order. The Master Ball is
 * thrown from its own battle button (never by the auto-catcher), so it is left
 * out. This is the default "all balls enabled" set.
 */
export const autoCatchBallOrder = ballOrder.filter((ballId) => ballId !== 'masterball')

/**
 * Held items. `effect` is read by the battle engine (src/game/held-items.js):
 * `leftovers`, `lifeOrb`, `statBoost`, `eviolite`, `focusSash`, `berry`,
 * `lumBerry` and `typeBoost`.
 * @type {Record<string, HeldItem>}
 */
export const heldItems = {
  leftovers: {
    id: 'leftovers',
    name: 'Leftovers',
    description: 'Restores 1/16 of the holder\u2019s max HP at the end of each turn.',
    buyPrice: 4000,
    sellPrice: 2000,
    effect: { type: 'leftovers' },
  },
  lifeOrb: {
    id: 'lifeOrb',
    name: 'Life Orb',
    description: 'Boosts damage by 30%, but costs the holder 10% of its max HP each hit.',
    buyPrice: 5000,
    sellPrice: 2500,
    effect: { type: 'lifeOrb', multiplier: 1.3, recoil: 0.1 },
  },
  choiceBand: {
    id: 'choiceBand',
    name: 'Choice Band',
    description: 'Boosts Attack by 50%.',
    buyPrice: 4000,
    sellPrice: 2000,
    effect: { type: 'statBoost', stat: 'attack', multiplier: 1.5 },
  },
  choiceSpecs: {
    id: 'choiceSpecs',
    name: 'Choice Specs',
    description: 'Boosts Sp. Atk by 50%.',
    buyPrice: 4000,
    sellPrice: 2000,
    effect: { type: 'statBoost', stat: 'spAttack', multiplier: 1.5 },
  },
  choiceScarf: {
    id: 'choiceScarf',
    name: 'Choice Scarf',
    description: 'Boosts Speed by 50%.',
    buyPrice: 4000,
    sellPrice: 2000,
    effect: { type: 'statBoost', stat: 'speed', multiplier: 1.5 },
  },
  assaultVest: {
    id: 'assaultVest',
    name: 'Assault Vest',
    description: 'Boosts Sp. Def by 50%.',
    buyPrice: 4000,
    sellPrice: 2000,
    effect: { type: 'statBoost', stat: 'spDefense', multiplier: 1.5 },
  },
  eviolite: {
    id: 'eviolite',
    name: 'Eviolite',
    description: 'Boosts Defense and Sp. Def by 50% on Pokemon that can still evolve.',
    buyPrice: 4000,
    sellPrice: 2000,
    effect: { type: 'eviolite' },
  },
  focusSash: {
    id: 'focusSash',
    name: 'Focus Sash',
    description: 'Survives one hit that would KO the holder from full HP with 1 HP.',
    buyPrice: 3000,
    sellPrice: 1500,
    effect: { type: 'focusSash' },
  },
  sitrusBerry: {
    id: 'sitrusBerry',
    name: 'Sitrus Berry',
    description: 'Restores 25% max HP once when the holder drops below half HP.',
    buyPrice: 1500,
    sellPrice: 750,
    effect: { type: 'berry', heal: 0.25, threshold: 0.5 },
  },
  lumBerry: {
    id: 'lumBerry',
    name: 'Lum Berry',
    description: 'Cures one status condition when the holder is afflicted.',
    buyPrice: 1500,
    sellPrice: 750,
    effect: { type: 'lumBerry' },
  },
  // --- type boosters (+20% to their type) ---
  silkScarf: { id: 'silkScarf', name: 'Silk Scarf', description: 'Powers up Normal-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Normal' } },
  charcoal: { id: 'charcoal', name: 'Charcoal', description: 'Powers up Fire-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Fire' } },
  mysticWater: { id: 'mysticWater', name: 'Mystic Water', description: 'Powers up Water-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Water' } },
  magnet: { id: 'magnet', name: 'Magnet', description: 'Powers up Electric-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Electric' } },
  miracleSeed: { id: 'miracleSeed', name: 'Miracle Seed', description: 'Powers up Grass-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Grass' } },
  neverMeltIce: { id: 'neverMeltIce', name: 'Never-Melt Ice', description: 'Powers up Ice-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Ice' } },
  blackBelt: { id: 'blackBelt', name: 'Black Belt', description: 'Powers up Fighting-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Fighting' } },
  poisonBarb: { id: 'poisonBarb', name: 'Poison Barb', description: 'Powers up Poison-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Poison' } },
  softSand: { id: 'softSand', name: 'Soft Sand', description: 'Powers up Ground-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Ground' } },
  sharpBeak: { id: 'sharpBeak', name: 'Sharp Beak', description: 'Powers up Flying-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Flying' } },
  twistedSpoon: { id: 'twistedSpoon', name: 'Twisted Spoon', description: 'Powers up Psychic-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Psychic' } },
  silverPowder: { id: 'silverPowder', name: 'Silver Powder', description: 'Powers up Bug-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Bug' } },
  hardStone: { id: 'hardStone', name: 'Hard Stone', description: 'Powers up Rock-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Rock' } },
  spellTag: { id: 'spellTag', name: 'Spell Tag', description: 'Powers up Ghost-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Ghost' } },
  dragonFang: { id: 'dragonFang', name: 'Dragon Fang', description: 'Powers up Dragon-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Dragon' } },
  blackGlasses: { id: 'blackGlasses', name: 'Black Glasses', description: 'Powers up Dark-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Dark' } },
  ironPlate: { id: 'ironPlate', name: 'Iron Plate', description: 'Powers up Steel-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Steel' } },
  pixiePlate: { id: 'pixiePlate', name: 'Pixie Plate', description: 'Powers up Fairy-type moves.', buyPrice: 2000, sellPrice: 1000, effect: { type: 'typeBoost', moveType: 'Fairy' } },
  megaStone: {
    id: 'megaStone',
    name: 'Mega Stone',
    description:
      'Held by a Pokemon that can Mega Evolve, it transforms for the rest of the battle \u2014 the physical X forme for attackers, the special Y forme otherwise.',
    buyPrice: null,
    sellPrice: 2500,
    effect: { type: 'megaEvolve' },
  },
}

/**
 * Medicine, candy and treasure. `category` doubles as the bag tab id;
 * medicine and candy carry a use effect, valuables only a `sellPrice`.
 * @type {Record<string, ConsumableItem>}
 */
export const consumableItems = {
    potion: {
      id: 'potion',
      name: 'Potion',
      description: 'Restores 20 HP to a party Pokemon.',
      category: 'medicine',
      buyPrice: 300,
      sellPrice: 150,
      heal: 20,
    },
    oranBerry: {
      id: 'oranBerry',
      name: 'Oran Berry',
      description: 'Restores 10 HP to a party Pokemon. Can also be planted in the Berry Garden.',
      category: 'medicine',
      buyPrice: 100,
      sellPrice: 50,
      heal: 10,
    },
    pokebean: {
      id: 'pokebean',
      name: 'Poke Bean',
      description: 'A sweet bean grown on Poke Pelago. Restores 20 HP to a party Pokemon.',
      category: 'medicine',
      buyPrice: null,
      sellPrice: 100,
      heal: 20,
    },
    poffin: {
      id: 'poffin',
      name: 'Poffin',
      description:
        'A sweet blend of Berries. Raises a party Pokemon\u2019s friendship by 30.',
      category: 'medicine',
      buyPrice: null,
      sellPrice: 300,
      friendship: 30,
    },
    curry: {
      id: 'curry',
      name: 'Curry',
      description: 'A hearty campfire curry. Restores a party Pokemon to full HP.',
      category: 'medicine',
      buyPrice: null,
      sellPrice: 400,
      heal: 999,
    },
    superPotion: {
      id: 'superPotion',
      name: 'Super Potion',
      description: 'Restores 60 HP to a party Pokemon.',
      category: 'medicine',
      buyPrice: 700,
      sellPrice: 350,
      heal: 60,
    },
    hyperPotion: {
      id: 'hyperPotion',
      name: 'Hyper Potion',
      description: 'Restores 200 HP to a party Pokemon.',
      category: 'medicine',
      buyPrice: 1500,
      sellPrice: 750,
      heal: 200,
    },
    maxPotion: {
      id: 'maxPotion',
      name: 'Max Potion',
      description: 'Fully restores a party Pokemon\u2019s HP.',
      category: 'medicine',
      buyPrice: 2500,
      sellPrice: 1250,
      full: true,
    },
    revive: {
      id: 'revive',
      name: 'Revive',
      description: 'Revives a fainted party Pokemon with half its HP.',
      category: 'medicine',
      buyPrice: 1500,
      sellPrice: 750,
      revive: true,
    },
    maxRevive: {
      id: 'maxRevive',
      name: 'Max Revive',
      description: 'Revives a fainted party Pokemon with full HP.',
      category: 'medicine',
      buyPrice: 4000,
      sellPrice: 2000,
      revive: true,
      full: true,
    },
    expCandyS: {
      id: 'expCandyS',
      name: 'Exp. Candy S',
      description: 'Gives a party Pokemon 1,000 EXP.',
      category: 'candy',
      buyPrice: null,
      sellPrice: null,
      exp: 1000,
    },
    expCandyM: {
      id: 'expCandyM',
      name: 'Exp. Candy M',
      description: 'Gives a party Pokemon 3,000 EXP.',
      category: 'candy',
      buyPrice: null,
      sellPrice: null,
      exp: 3000,
    },
    expCandyL: {
      id: 'expCandyL',
      name: 'Exp. Candy L',
      description: 'Gives a party Pokemon 10,000 EXP.',
      category: 'candy',
      buyPrice: null,
      sellPrice: null,
      exp: 10000,
    },
    expCandyXL: {
      id: 'expCandyXL',
      name: 'Exp. Candy XL',
      description: 'Gives a party Pokemon 30,000 EXP.',
      category: 'candy',
      buyPrice: null,
      sellPrice: null,
      exp: 30000,
    },
    rareCandy: {
      id: 'rareCandy',
      name: 'Rare Candy',
      description: 'Raises a party Pokemon by one level (up to Lv.100).',
      category: 'candy',
      buyPrice: null,
      sellPrice: null,
      levelUp: 1,
    },
    stardust: {
      id: 'stardust',
      name: 'Stardust',
      description: 'A pretty red sand. Sell it at a mart.',
      category: 'valuables',
      buyPrice: null,
      sellPrice: 1000,
    },
    pearl: {
      id: 'pearl',
      name: 'Pearl',
      description: 'A lustrous pearl. Sell it at a mart.',
      category: 'valuables',
      buyPrice: null,
      sellPrice: 1400,
    },
    bigPearl: {
      id: 'bigPearl',
      name: 'Big Pearl',
      description: 'A large, valuable pearl. Sell it at a mart.',
      category: 'valuables',
      buyPrice: null,
      sellPrice: 4000,
    },
    nugget: {
      id: 'nugget',
      name: 'Nugget',
      description: 'A chunk of pure gold. Sell it at a mart.',
      category: 'valuables',
      buyPrice: null,
      sellPrice: 5000,
    },
    starPiece: {
      id: 'starPiece',
      name: 'Star Piece',
      description: 'A shard of a red jewel. Sell it at a mart.',
      category: 'valuables',
      buyPrice: null,
      sellPrice: 6000,
    },
    bigNugget: {
      id: 'bigNugget',
      name: 'Big Nugget',
      description: 'A big, impressive nugget of gold. Sell it at a mart.',
      category: 'valuables',
      buyPrice: null,
      sellPrice: 10000,
    },
    cometShard: {
      id: 'cometShard',
      name: 'Comet Shard',
      description: 'A shard of a comet. Sell it at a mart.',
      category: 'valuables',
      buyPrice: null,
      sellPrice: 12000,
    },
    natureMint: {
      id: 'natureMint',
      name: 'Nature Mint',
      description: "Re-rolls a party Pokemon's nature and recalculates its stats.",
      category: 'medicine',
      buyPrice: null,
      sellPrice: null,
      natureMint: true,
    },
  }

/**
 * Weighted treasure drops, common to rare. Higher-level battles bias the roll
 * toward the rarer entries (see `rollValuableDrop`).
 * @type {{ itemId: string, weight: number }[]}
 */
export const valuableDropTable = [
    { itemId: 'stardust', weight: 30 },
    { itemId: 'pearl', weight: 24 },
    { itemId: 'nugget', weight: 16 },
    { itemId: 'bigPearl', weight: 10 },
    { itemId: 'starPiece', weight: 8 },
    { itemId: 'bigNugget', weight: 5 },
    { itemId: 'cometShard', weight: 2 },
  ]

/**
 * Basics every region's marts stock, revealed as the player wins wild battles.
 * The advanced stock (situational balls and held battle items) lives in
 * `regionalMartItems` below, so marts don't all sell the same shelves.
 */
export const coreMartItems = [
  { itemId: 'potion' },
  { itemId: 'oranBerry' },
  { itemId: 'superPotion', unlockWildBattlesWon: 40 },
  { itemId: 'hyperPotion', unlockWildBattlesWon: 120 },
  { itemId: 'revive', unlockWildBattlesWon: 80 },
  { itemId: 'maxPotion', unlockWildBattlesWon: 300 },
  { itemId: 'maxRevive', unlockWildBattlesWon: 400 },
]

/**
 * Advanced stock split by region: a situational Poké Ball and a handful of held
 * battle items each, so every region's marts have their own flavour. The
 * Sinnoh Underground is the universal fallback if a region is never opened.
 * @type {Record<string, { itemId: string, unlockWildBattlesWon?: number }[]>}
 */
export const regionalMartItems = {
  kanto: [
    { itemId: 'quickball', unlockWildBattlesWon: 75 },
    { itemId: 'silkScarf', unlockWildBattlesWon: 60 },
    { itemId: 'charcoal', unlockWildBattlesWon: 60 },
    { itemId: 'mysticWater', unlockWildBattlesWon: 60 },
  ],
  johto: [
    { itemId: 'repeatball', unlockWildBattlesWon: 75 },
    { itemId: 'magnet', unlockWildBattlesWon: 60 },
    { itemId: 'miracleSeed', unlockWildBattlesWon: 60 },
    { itemId: 'neverMeltIce', unlockWildBattlesWon: 80 },
  ],
  hoenn: [
    { itemId: 'netball', unlockWildBattlesWon: 100 },
    { itemId: 'blackBelt', unlockWildBattlesWon: 80 },
    { itemId: 'poisonBarb', unlockWildBattlesWon: 80 },
    { itemId: 'softSand', unlockWildBattlesWon: 80 },
  ],
  sinnoh: [
    { itemId: 'nestball', unlockWildBattlesWon: 100 },
    { itemId: 'sharpBeak', unlockWildBattlesWon: 80 },
    { itemId: 'twistedSpoon', unlockWildBattlesWon: 100 },
    { itemId: 'silverPowder', unlockWildBattlesWon: 100 },
  ],
  unova: [
    { itemId: 'diveball', unlockWildBattlesWon: 150 },
    { itemId: 'hardStone', unlockWildBattlesWon: 100 },
    { itemId: 'spellTag', unlockWildBattlesWon: 100 },
    { itemId: 'dragonFang', unlockWildBattlesWon: 150 },
  ],
  kalos: [
    { itemId: 'timerball', unlockWildBattlesWon: 150 },
    { itemId: 'blackGlasses', unlockWildBattlesWon: 150 },
    { itemId: 'ironPlate', unlockWildBattlesWon: 150 },
    { itemId: 'pixiePlate', unlockWildBattlesWon: 150 },
    { itemId: 'megaStone', unlockWildBattlesWon: 250 },
  ],
  alola: [
    { itemId: 'duskball', unlockWildBattlesWon: 200 },
    { itemId: 'sitrusBerry', unlockWildBattlesWon: 60 },
    { itemId: 'lumBerry', unlockWildBattlesWon: 100 },
    { itemId: 'eviolite', unlockWildBattlesWon: 200 },
  ],
  galar: [
    { itemId: 'focusSash', unlockWildBattlesWon: 150 },
    { itemId: 'assaultVest', unlockWildBattlesWon: 300 },
    { itemId: 'choiceBand', unlockWildBattlesWon: 300 },
    { itemId: 'choiceSpecs', unlockWildBattlesWon: 300 },
  ],
  paldea: [
    { itemId: 'choiceScarf', unlockWildBattlesWon: 300 },
    { itemId: 'leftovers', unlockWildBattlesWon: 250 },
    { itemId: 'lifeOrb', unlockWildBattlesWon: 400 },
  ],
}

export const bagCategories = [
    {
      id: 'pokeballs',
      label: 'Poke Balls',
    },
    {
      id: 'medicine',
      label: 'Medicine',
    },
    {
      id: 'candy',
      label: 'Candies',
    },
    {
      id: 'items',
      label: 'Items',
    },
    {
      id: 'held',
      label: 'Held Items',
    },
    {
      id: 'valuables',
      label: 'Valuables',
    },
  ]

/** @type {Record<string, { id: string, name: string, description: string, reusable?: boolean }>} */
export const evolutionItems = {
    thunderStone: {
      id: 'thunderStone',
      name: 'Thunder Stone',
      description: 'Evolves certain Electric-type Pokemon.',
    },
    fireStone: {
      id: 'fireStone',
      name: 'Fire Stone',
      description: 'Evolves certain Fire-type Pokemon.',
    },
    waterStone: {
      id: 'waterStone',
      name: 'Water Stone',
      description: 'Evolves certain Water-type Pokemon.',
    },
    leafStone: {
      id: 'leafStone',
      name: 'Leaf Stone',
      description: 'Evolves certain Grass-type Pokemon.',
    },
    moonStone: {
      id: 'moonStone',
      name: 'Moon Stone',
      description: 'Evolves certain Pokemon.',
    },
    linkCable: {
      id: 'linkCable',
      name: 'Link Cable',
      description: 'Evolves Pokemon that normally evolve by trading.',
    },
    sunStone: {
      id: 'sunStone',
      name: 'Sun Stone',
      description: 'Evolves certain Grass-type Pokemon.',
    },
    duskStone: {
      id: 'duskStone',
      name: 'Dusk Stone',
      description: 'Evolves certain Dark- and Ghost-type Pokemon.',
    },
    shinyStone: {
      id: 'shinyStone',
      name: 'Shiny Stone',
      description: 'Evolves certain Grass- and Fairy-type Pokemon.',
    },
    dawnStone: {
      id: 'dawnStone',
      name: 'Dawn Stone',
      description: 'Evolves certain male or female Pokemon.',
    },
    iceStone: {
      id: 'iceStone',
      name: 'Ice Stone',
      description: 'Evolves certain Ice-type Pokemon.',
    },
    ovalStone: {
      id: 'ovalStone',
      name: 'Oval Stone',
      description: 'Evolves certain baby Pokemon.',
    },
    kingsRock: {
      id: 'kingsRock',
      name: "King's Rock",
      description: 'Evolves certain Pokemon that normally evolve by trade.',
    },
    metalCoat: {
      id: 'metalCoat',
      name: 'Metal Coat',
      description: 'Evolves certain Steel-type Pokemon that normally evolve by trade.',
    },
    dragonScale: {
      id: 'dragonScale',
      name: 'Dragon Scale',
      description: 'Evolves Seadra, which normally evolves by trade.',
    },
    upgrade: {
      id: 'upgrade',
      name: 'Upgrade',
      description: 'Evolves Porygon, which normally evolves by trade.',
    },
    dubiousDisc: {
      id: 'dubiousDisc',
      name: 'Dubious Disc',
      description: 'Evolves Porygon2, which normally evolves by trade.',
    },
    protector: {
      id: 'protector',
      name: 'Protector',
      description: 'Evolves Rhydon, which normally evolves by trading with it.',
    },
    electirizer: {
      id: 'electirizer',
      name: 'Electirizer',
      description: 'Evolves Electabuzz, which normally evolves by trading with it.',
    },
    magmarizer: {
      id: 'magmarizer',
      name: 'Magmarizer',
      description: 'Evolves Magmar, which normally evolves by trading with it.',
    },
    razorClaw: {
      id: 'razorClaw',
      name: 'Razor Claw',
      description: 'Evolves certain Pokemon that normally evolve while holding it.',
    },
    razorFang: {
      id: 'razorFang',
      name: 'Razor Fang',
      description: 'Evolves Gligar, which normally evolves by holding it.',
    },
    reaperCloth: {
      id: 'reaperCloth',
      name: 'Reaper Cloth',
      description: 'Evolves Dusclops, which normally evolves by trading with it.',
    },
    deepSeaTooth: {
      id: 'deepSeaTooth',
      name: 'Deep Sea Tooth',
      description: 'Evolves Clamperl into Huntail.',
    },
    deepSeaScale: {
      id: 'deepSeaScale',
      name: 'Deep Sea Scale',
      description: 'Evolves Clamperl into Gorebyss.',
    },
    sachet: {
      id: 'sachet',
      name: 'Sachet',
      description: 'Evolves Spritzee, which normally evolves by trade.',
    },
    whippedDream: {
      id: 'whippedDream',
      name: 'Whipped Dream',
      description: 'Evolves Swirlix, which normally evolves by trade.',
    },
    sweetApple: {
      id: 'sweetApple',
      name: 'Sweet Apple',
      description: 'Evolves Applin into Appletun.',
    },
    tartApple: {
      id: 'tartApple',
      name: 'Tart Apple',
      description: 'Evolves Applin into Flapple.',
    },
    crackedPot: {
      id: 'crackedPot',
      name: 'Cracked Pot',
      description: 'Evolves Sinistea into Polteageist.',
    },
    strawberrySweet: {
      id: 'strawberrySweet',
      name: 'Strawberry Sweet',
      description: 'Evolves Milcery into Alcremie.',
    },
    galaricaCuff: {
      id: 'galaricaCuff',
      name: 'Galarica Cuff',
      description: 'Evolves Galarian Slowpoke into Galarian Slowbro.',
    },
    galaricaWreath: {
      id: 'galaricaWreath',
      name: 'Galarica Wreath',
      description: 'Evolves Galarian Slowpoke into Galarian Slowking.',
    },
    auspiciousArmor: {
      id: 'auspiciousArmor',
      name: 'Auspicious Armor',
      description: 'Evolves Charcadet into Armarouge.',
    },
    maliciousArmor: {
      id: 'maliciousArmor',
      name: 'Malicious Armor',
      description: 'Evolves Charcadet into Ceruledge.',
    },
    // Reusable form-change items (not consumed when used).
    rotomCatalog: {
      id: 'rotomCatalog',
      name: 'Rotom Catalog',
      description: 'Changes Rotom between its appliance forms.',
      reusable: !0,
    },
    griseousOrb: {
      id: 'griseousOrb',
      name: 'Griseous Orb',
      description: 'Changes Giratina between its Altered and Origin Formes.',
      reusable: !0,
    },
    gracidea: {
      id: 'gracidea',
      name: 'Gracidea',
      description: 'Changes Shaymin between its Land and Sky Formes.',
      reusable: !0,
    },
    meteorite: {
      id: 'meteorite',
      name: 'Meteorite',
      description: 'Changes Deoxys between its Formes.',
      reusable: !0,
    },
    revealGlass: {
      id: 'revealGlass',
      name: 'Reveal Glass',
      description: 'Switches the Forces of Nature between their Incarnate and Therian Formes.',
      reusable: !0,
    },
    dnaSplicers: {
      id: 'dnaSplicers',
      name: 'DNA Splicers',
      description: 'Changes Kyurem between its base, Black and White Formes.',
      reusable: !0,
    },
    zygardeCube: {
      id: 'zygardeCube',
      name: 'Zygarde Cube',
      description: 'Changes Zygarde between its forms.',
      reusable: !0,
    },
    prisonBottle: {
      id: 'prisonBottle',
      name: 'Prison Bottle',
      description: 'Changes Hoopa between its Confined and Unbound forms.',
      reusable: !0,
    },
    nSolarizer: {
      id: 'nSolarizer',
      name: 'N-Solarizer',
      description: 'Changes Necrozma into Dusk Mane Necrozma.',
      reusable: !0,
    },
    nLunarizer: {
      id: 'nLunarizer',
      name: 'N-Lunarizer',
      description: 'Changes Necrozma into Dawn Wings Necrozma.',
      reusable: !0,
    },
    ultranecroziumZ: {
      id: 'ultranecroziumZ',
      name: 'Ultranecrozium Z',
      description: 'Changes Necrozma into Ultra Necrozma.',
      reusable: !0,
    },
    rustedSword: {
      id: 'rustedSword',
      name: 'Rusted Sword',
      description: 'Changes Zacian between its Hero and Crowned Formes.',
      reusable: !0,
    },
    rustedShield: {
      id: 'rustedShield',
      name: 'Rusted Shield',
      description: 'Changes Zamazenta between its Hero and Crowned Formes.',
      reusable: !0,
    },
    reinsOfUnity: {
      id: 'reinsOfUnity',
      name: 'Reins of Unity',
      description: 'Changes Calyrex between its base and rider forms.',
      reusable: !0,
    },
  }

export const tokenShopItems = [
    {
      itemId: 'expShare',
      tokenCost: 2,
    },
    {
      itemId: 'fireStone',
      tokenCost: 1,
    },
    {
      itemId: 'waterStone',
      tokenCost: 1,
    },
    {
      itemId: 'thunderStone',
      tokenCost: 1,
    },
    {
      itemId: 'leafStone',
      tokenCost: 1,
    },
    {
      itemId: 'moonStone',
      tokenCost: 2,
    },
    {
      itemId: 'linkCable',
      tokenCost: 2,
    },
    {
      itemId: 'sunStone',
      tokenCost: 2,
    },
    {
      itemId: 'duskStone',
      tokenCost: 2,
    },
    {
      itemId: 'shinyStone',
      tokenCost: 2,
    },
    {
      itemId: 'dawnStone',
      tokenCost: 2,
    },
    {
      itemId: 'iceStone',
      tokenCost: 2,
    },
    {
      itemId: 'ovalStone',
      tokenCost: 2,
    },
    {
      itemId: 'kingsRock',
      tokenCost: 2,
    },
    {
      itemId: 'metalCoat',
      tokenCost: 2,
    },
    {
      itemId: 'dragonScale',
      tokenCost: 2,
    },
    {
      itemId: 'upgrade',
      tokenCost: 2,
    },
    {
      itemId: 'dubiousDisc',
      tokenCost: 3,
    },
    {
      itemId: 'protector',
      tokenCost: 2,
    },
    {
      itemId: 'electirizer',
      tokenCost: 2,
    },
    {
      itemId: 'magmarizer',
      tokenCost: 2,
    },
    {
      itemId: 'razorClaw',
      tokenCost: 2,
    },
    {
      itemId: 'razorFang',
      tokenCost: 2,
    },
    {
      itemId: 'reaperCloth',
      tokenCost: 2,
    },
    {
      itemId: 'deepSeaTooth',
      tokenCost: 2,
    },
    {
      itemId: 'deepSeaScale',
      tokenCost: 2,
    },
    {
      itemId: 'sachet',
      tokenCost: 2,
    },
    {
      itemId: 'whippedDream',
      tokenCost: 2,
    },
    {
      itemId: 'sweetApple',
      tokenCost: 2,
    },
    {
      itemId: 'tartApple',
      tokenCost: 2,
    },
    {
      itemId: 'crackedPot',
      tokenCost: 2,
    },
    {
      itemId: 'strawberrySweet',
      tokenCost: 2,
    },
    {
      itemId: 'galaricaCuff',
      tokenCost: 2,
    },
    {
      itemId: 'galaricaWreath',
      tokenCost: 2,
    },
    {
      itemId: 'auspiciousArmor',
      tokenCost: 2,
    },
    {
      itemId: 'maliciousArmor',
      tokenCost: 2,
    },
    {
      itemId: 'natureMint',
      tokenCost: 2,
    },
    { itemId: 'rotomCatalog', tokenCost: 2 },
    { itemId: 'griseousOrb', tokenCost: 3 },
    { itemId: 'gracidea', tokenCost: 3 },
    { itemId: 'meteorite', tokenCost: 3 },
    { itemId: 'revealGlass', tokenCost: 3 },
    { itemId: 'dnaSplicers', tokenCost: 4 },
    { itemId: 'zygardeCube', tokenCost: 4 },
    { itemId: 'prisonBottle', tokenCost: 3 },
    { itemId: 'nSolarizer', tokenCost: 4 },
    { itemId: 'nLunarizer', tokenCost: 4 },
    { itemId: 'ultranecroziumZ', tokenCost: 4 },
    { itemId: 'rustedSword', tokenCost: 4 },
    { itemId: 'rustedShield', tokenCost: 4 },
    { itemId: 'reinsOfUnity', tokenCost: 4 },
    { itemId: 'megaStone', tokenCost: 5 },
  ]

/** @type {Record<string, { name: string, items: { itemId: string, unlockWildBattlesWon?: number }[] }>} */
export const martShopItems = {
    viridianCity: {
      name: 'Viridian Mart',
      items: [
        {
          itemId: 'pokeball',
        },
      ],
    },
    pewterCity: {
      name: 'Pewter Mart',
      items: [
        {
          itemId: 'pokeball',
        },
        {
          itemId: 'greatball',
          unlockWildBattlesWon: 50,
        },
      ],
    },
    ceruleanCity: {
      name: 'Cerulean Mart',
      items: [
        {
          itemId: 'pokeball',
        },
        {
          itemId: 'greatball',
        },
        {
          itemId: 'ultraball',
          unlockWildBattlesWon: 150,
        },
        {
          itemId: 'repel',
        },
        {
          itemId: 'honey',
        },
      ],
    },
    vermilionCity: {
      name: 'Vermilion Mart',
      items: [
        {
          itemId: 'pokeball',
        },
        {
          itemId: 'greatball',
        },
        {
          itemId: 'ultraball',
        },
        {
          itemId: 'repel',
        },
        {
          itemId: 'honey',
        },
      ],
    },
    lavenderTown: {
      name: 'Lavender Mart',
      items: [
        {
          itemId: 'pokeball',
        },
        {
          itemId: 'greatball',
        },
        {
          itemId: 'ultraball',
        },
        {
          itemId: 'repel',
        },
        {
          itemId: 'honey',
        },
      ],
    },
    celadonCity: {
      name: 'Celadon Dept. Store',
      items: [
        {
          itemId: 'pokeball',
        },
        {
          itemId: 'greatball',
        },
        {
          itemId: 'ultraball',
        },
        {
          itemId: 'repel',
        },
        {
          itemId: 'honey',
        },
      ],
    },
    saffronCity: {
      name: 'Saffron Mart',
      items: [
        {
          itemId: 'pokeball',
        },
        {
          itemId: 'greatball',
        },
        {
          itemId: 'ultraball',
        },
        {
          itemId: 'repel',
        },
        {
          itemId: 'honey',
        },
      ],
    },
    fuchsiaCity: {
      name: 'Fuchsia Mart',
      items: [
        {
          itemId: 'pokeball',
        },
        {
          itemId: 'greatball',
        },
        {
          itemId: 'ultraball',
        },
        {
          itemId: 'repel',
        },
        {
          itemId: 'honey',
        },
      ],
    },
    cinnabarIsland: {
      name: 'Cinnabar Mart',
      items: [
        {
          itemId: 'pokeball',
        },
        {
          itemId: 'greatball',
        },
        {
          itemId: 'ultraball',
        },
        {
          itemId: 'repel',
        },
        {
          itemId: 'honey',
        },
      ],
    },
    indigoPlat: {
      name: 'Indigo Plateau Mart',
      items: [
        {
          itemId: 'pokeball',
        },
        {
          itemId: 'greatball',
        },
        {
          itemId: 'ultraball',
        },
        {
          itemId: 'repel',
        },
        {
          itemId: 'honey',
        },
      ],
    },
  }
