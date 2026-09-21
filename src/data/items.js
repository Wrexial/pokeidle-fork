// Split from src/data/constants.js — see tools/decompile/split-module.mjs

/** @type {Record<string, ActiveItem>} */
export const activeItems = {
    expShare: {
      id: 'expShare',
      name: 'Exp. Share',
      description:
        'Shares 5% EXP with each non-fainted party member for 1000 battles. Active Pokemon gets 50%.',
      duration: 1e3,
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
    masterball: {
      id: 'masterball',
      name: 'Master Ball',
      description: 'The best ball that catches any Pokemon without fail.',
      buyPrice: null,
      ballModifier: 255,
    },
  }

export const ballOrder = ['pokeball', 'greatball', 'ultraball', 'masterball']

export const bagCategories = [
    {
      id: 'pokeballs',
      label: 'Poke Balls',
    },
    {
      id: 'items',
      label: 'Items',
    },
  ]

/** @type {Record<string, { id: string, name: string, description: string }>} */
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
