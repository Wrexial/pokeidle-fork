// Split from src/data/constants.js — see tools/decompile/split-module.mjs

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
  ]

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
