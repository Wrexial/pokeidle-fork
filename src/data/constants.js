// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

export const evValue = 0

export let legendaryPool = [
    {
      speciesKey: 'articuno',
      level: 70,
    },
    {
      speciesKey: 'zapdos',
      level: 70,
    },
    {
      speciesKey: 'moltres',
      level: 70,
    },
    {
      speciesKey: 'mewtwo',
      level: 80,
    },
    {
      speciesKey: 'mew',
      level: 60,
    },
  ]

export let RAID_COOLDOWN_MS = 1 * 1e3

export let defaultCatchSettings = {
    enabled: !0,
    mode: 'pokedex_new',
    levelThreshold: 1,
    enabledBalls: ['pokeball'],
  }

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

export const SAVE_KEY = 'pokemon-idle-save'

export const shinyFullOddsChance = 8192

export const shinyWithCharmChance = 4096

export const starterSpecies = ['bulbasaur', 'charmander', 'squirtle']

export const SPEED_OPTIONS = [1, 2, 5, 25]

export let moveCategoryIcons = {
  physical: '✴',
  special: '◎',
  status: '☯',
}

export const SAVE_KEY_ALT = 'pokemon-idle-save'

export let trainerClassPayouts = {
  youngster: 16,
  lass: 16,
  bugCatcher: 12,
  hiker: 36,
  swimmer: 20,
  camper: 20,
  sailor: 24,
  gentleman: 56,
  channeler: 20,
  beauty: 56,
  coolTrainer: 36,
  psychic: 24,
  scientist: 48,
  tamer: 24,
  juggler: 28,
  superNerd: 20,
  ace: 36,
  blackbelt: 24,
}

export let moveIcons = {
    physical: '✴',
    special: '◎',
    status: '☯',
  }

export let locationImages = {
    route1: '/backgrounds/grassland.png',
    route2: '/backgrounds/grassland.png',
    route4: '/backgrounds/grassland.png',
    route5: '/backgrounds/grassland.png',
    route6: '/backgrounds/grassland.png',
    route7: '/backgrounds/grassland.png',
    route8: '/backgrounds/grassland.png',
    route9: '/backgrounds/grassland.png',
    route11: '/backgrounds/grassland.png',
    route12: '/backgrounds/grassland.png',
    route13: '/backgrounds/grassland.png',
    route14: '/backgrounds/grassland.png',
    route15: '/backgrounds/grassland.png',
    route16: '/backgrounds/grassland.png',
    route17: '/backgrounds/grassland.png',
    route18: '/backgrounds/grassland.png',
    route22: '/backgrounds/grassland.png',
    route24: '/backgrounds/grassland.png',
    route25: '/backgrounds/grassland.png',
    safariZone: '/backgrounds/grassland.png',
    viridianForest: '/backgrounds/grassland.png',
    route3: '/backgrounds/mountain.png',
    route10: '/backgrounds/mountain.png',
    route23: '/backgrounds/mountain.png',
    mtMoon: '/backgrounds/cave.png',
    rockTunnel: '/backgrounds/cave.png',
    diglettsCave: '/backgrounds/cave.png',
    victoryRoad: '/backgrounds/cave.png',
    ceruleanCave: '/backgrounds/cave.png',
    pokemonTower: '/backgrounds/cave.png',
    pokemonMansion: '/backgrounds/cave.png',
    powerPlant: '/backgrounds/cave.png',
    route19: '/backgrounds/beach.png',
    route20: '/backgrounds/beach.png',
    route21: '/backgrounds/beach.png',
    seafoamIslands: '/backgrounds/cave.png',
    trainingArea: '/backgrounds/cave.png',
  }

export const BATTLE_LOG_MIN_HEIGHT = 30

export const typechart = {
  Normal: {
    Rock: 0.5,
    Ghost: 0,
    Steel: 0.5,
  },
  Fire: {
    Fire: 0.5,
    Water: 0.5,
    Grass: 2,
    Ice: 2,
    Bug: 2,
    Rock: 0.5,
    Dragon: 0.5,
    Steel: 2,
  },
  Water: {
    Fire: 2,
    Water: 0.5,
    Grass: 0.5,
    Ground: 2,
    Rock: 2,
    Dragon: 0.5,
  },
  Electric: {
    Water: 2,
    Electric: 0.5,
    Grass: 0.5,
    Ground: 0,
    Flying: 2,
    Dragon: 0.5,
  },
  Grass: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Rock: 2,
    Dragon: 0.5,
    Steel: 0.5,
  },
  Ice: {
    Fire: 0.5,
    Water: 0.5,
    Grass: 2,
    Ice: 0.5,
    Ground: 2,
    Flying: 2,
    Dragon: 2,
    Steel: 0.5,
  },
  Fighting: {
    Normal: 2,
    Ice: 2,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Rock: 2,
    Ghost: 0,
    Dark: 2,
    Steel: 2,
    Fairy: 0.5,
  },
  Poison: {
    Grass: 2,
    Poison: 0.5,
    Ground: 0.5,
    Rock: 0.5,
    Ghost: 0.5,
    Steel: 0,
    Fairy: 2,
  },
  Ground: {
    Fire: 2,
    Electric: 2,
    Grass: 0.5,
    Poison: 2,
    Flying: 0,
    Bug: 0.5,
    Rock: 2,
    Steel: 2,
  },
  Flying: {
    Electric: 0.5,
    Grass: 2,
    Fighting: 2,
    Bug: 2,
    Rock: 0.5,
    Steel: 0.5,
  },
  Psychic: {
    Fighting: 2,
    Poison: 2,
    Psychic: 0.5,
    Dark: 0,
    Steel: 0.5,
  },
  Bug: {
    Fire: 0.5,
    Grass: 2,
    Fighting: 0.5,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 2,
    Ghost: 0.5,
    Dark: 2,
    Steel: 0.5,
    Fairy: 0.5,
  },
  Rock: {
    Fire: 2,
    Ice: 2,
    Fighting: 0.5,
    Ground: 0.5,
    Flying: 2,
    Bug: 2,
    Steel: 0.5,
  },
  Ghost: {
    Normal: 0,
    Psychic: 2,
    Ghost: 2,
    Dark: 0.5,
  },
  Dragon: {
    Dragon: 2,
    Steel: 0.5,
    Fairy: 0,
  },
  Dark: {
    Fighting: 0.5,
    Psychic: 2,
    Ghost: 2,
    Dark: 0.5,
    Fairy: 0.5,
  },
  Steel: {
    Fire: 0.5,
    Water: 0.5,
    Electric: 0.5,
    Ice: 2,
    Rock: 2,
    Steel: 0.5,
    Fairy: 2,
  },
  Fairy: {
    Fire: 0.5,
    Poison: 0.5,
    Dragon: 2,
    Dark: 2,
    Steel: 0.5,
  },
}

export const MOBILE_BREAKPOINT = 768

export const DESIGN_WIDTH = 560

export const categoryIcons = {
    physical: '✴',
    special: '◎',
    status: '☯',
  }

export const statBarColors = {
    hp: '#60a040',
    attack: '#c86828',
    defense: '#c8a828',
    spAttack: '#5878c8',
    spDefense: '#60a040',
    speed: '#d04870',
  }

export let statBarColorsPokedex = {
    hp: '#60a040',
    attack: '#c86828',
    defense: '#c8a828',
    spAttack: '#5878c8',
    spDefense: '#60a040',
    speed: '#d04870',
  }

export let STAT_DISPLAY_MAX = 200

export const BOX_PAGE_SIZE = 30

export const initialDragState = {
  source: 'party',
  fromIndex: -1,
  pokemonId: null,
  target: null,
  targetIndex: null,
  position: null,
  droppedOnBoxContainer: !1,
}

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

export const rarities = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    very_rare: 'Very Rare',
    ultra_rare: 'Ultra Rare',
  }

export const statColours = {
    hp: '#60a040',
    attack: '#c86828',
    defense: '#c8a828',
    spAttack: '#5878c8',
    spDefense: '#60a040',
    speed: '#d04870',
  }

export const pokeballColors = {
    pokeball: {
      top: '#c83030',
      bottom: '#e8dcc0',
      ring: '#e8dcc0',
      dot: '#2a1808',
    },
    greatball: {
      top: '#3060c8',
      bottom: '#e8dcc0',
      ring: '#e8dcc0',
      dot: '#2a1808',
    },
    ultraball: {
      top: '#c8a828',
      bottom: '#e8dcc0',
      ring: '#e8dcc0',
      dot: '#2a1808',
    },
    masterball: {
      top: '#7030a0',
      bottom: '#e8dcc0',
      ring: '#e8dcc0',
      dot: '#f0d060',
    },
  }

export const CATCH_MODE_OPTIONS = [
    {
      value: 'always',
      label: 'Always catch',
    },
    {
      value: 'shiny_only',
      label: 'Only if shiny',
    },
    {
      value: 'level_threshold',
      label: 'Above level:',
    },
    {
      value: 'pokedex_new',
      label: 'Not caught yet',
    },
  ]

export const SIDE_PANEL_TABS = [
  {
    id: 'location',
    label: 'Location',
  },
  {
    id: 'gym',
    label: 'Gyms',
  },
]

export const MOBILE_TABS = [
  {
    id: 'map',
    label: 'Map',
  },
  {
    id: 'party',
    label: 'Party',
  },
  {
    id: 'box',
    label: 'Box',
  },
  {
    id: 'location',
    label: 'Location',
  },
]

export const GAME_VERSION = '0.4.0'

export const LAST_SEEN_VERSION_KEY = 'pokemon-idle-last-seen-version'

export const CHANGELOG = [
    {
      version: '0.4.0',
      subtitle: 'Repel & Honey, Exp. Share, Mobile Layout & QoL',
      sections: [
        {
          heading: 'Repel & Honey Items',
          items: [
            'New consumable items: Repel (halves encounter weight) and Honey (doubles encounter weight) for a specific Pokemon on a route, lasting 500 battles',
            'Buy them from any Poke Mart for $2,000 each',
            'Apply from the detail panel by clicking a Pokemon tile, or use the new selector mode buttons in the Wild Pokemon header to batch-apply by clicking tiles directly',
            'Active effects show as blue "R" and yellow "H" badges on encounter tiles',
            'Active effect durations are displayed in the battle log and detail panel',
            'Re-using on the same species extends the duration instead of stacking',
          ],
        },
        {
          heading: 'Exp. Share',
          items: [
            'New item available in the Reward Shop for 2 Victory Tokens',
            'When active, the battling Pokemon receives 50% EXP and all non-fainted party members receive 5% EXP each',
            'Lasts 1000 battles — activate from your Bag',
            'Party members can level up and learn moves from shared EXP',
          ],
        },
        {
          heading: 'Mobile Layout',
          items: [
            'Completely new responsive layout for screens under 768px',
            'Tabbed navigation: Battle, Location, Party, Box, and Map tabs',
            'Battle scene scales to fit the screen width',
            'Battle log auto-hides when space is too tight',
          ],
        },
        {
          heading: 'Shiny Charm',
          items: [
            'Complete the Pokedex (catch all 151 Pokemon) to unlock the Shiny Charm',
            'Doubles shiny encounter odds from 1/8192 to 1/4096',
            'Applies to wild encounters and raid legendaries',
            'Check your shiny stats and charm status in the ? info menu',
          ],
        },
        {
          heading: 'New Content',
          items: [
            'Starters (Bulbasaur, Charmander, Squirtle) can now be found as ultra-rare encounters in the Safari Zone',
            'Omanyte and Kabuto now evolve into Omastar and Kabutops at level 40',
            'Added "Ultra Rare" rarity tier for the rarest encounters',
          ],
        },
        {
          heading: 'Quality of Life',
          items: [
            'Default catch mode changed from "Always" to "Pokedex New" for less ball waste',
            'Route 6/Vermilion unlock order swapped with Route 7/Celadon for better progression flow',
            'Safari Zone encounter weights rebalanced for smoother distribution',
            "Duplicate move learning is now prevented — Pokemon won't re-learn moves they already know",
            "Move manage panel now validates the active Pokemon hasn't changed mid-edit",
            'Bag panel shows active effect status and lets you use Exp. Share directly',
            'Town map no longer shows a redundant tooltip for the current location',
          ],
        },
      ],
    },
    {
      version: '0.3.0',
      subtitle: 'Legendary Raids, Move Effects & Battle Balance',
      sections: [
        {
          heading: 'IV Assignment',
          items: [
            'Previously all Pokemon would have full 15 IVs, now they will be randomly assigned just like in the games',
          ],
        },
        {
          heading: 'Legendary Raid System',
          items: [
            'Legendary Pokemon (Articuno, Zapdos, Moltres, Mewtwo, Mew) have been removed from wild encounters',
            'New Raid Island location unlocks after defeating the Champion',
            'Click Raid Island to heal your party and fight a random legendary repeatedly until you wipe or leave',
            "Legendaries will grow stronger as you beat them, you'll need a strong team to have the best odds of catching them",
            'Normal catch logic applies during raids — use your default ball settings',
            '10-minute cooldown between raids, persists across refreshes',
          ],
        },
        {
          heading: 'Move Secondary Effects',
          items: [
            'Recoil moves (Take Down, Submission) now deal damage back to the user',
            'Hyper Beam now requires a recharge turn after use',
            'Self-Destruct causes the user to faint after dealing damage',
            'Multi-turn moves (Outrage, Petal Dance) lock the user in for 2–3 turns, then cause confusion self-damage',
            'High Jump Kick now damages the user on a miss',
          ],
        },
        {
          heading: 'Stat Stage Moves',
          items: [
            'Status moves now actually work! Swords Dance, Amnesia, Barrier, Harden, Sharpen, and Defense Curl boost your stats in battle',
            "Growl, Leer, and Tail Whip lower the opponent's stats",
            'Stat changes range from -6 to +6 and reset each battle',
          ],
        },
        {
          heading: 'Smarter AI',
          items: [
            "Your Pokemon now considers move drawbacks when picking attacks — it won't blindly spam Hyper Beam over Flamethrower",
            'Trainer Pokemon also weigh drawbacks when choosing moves',
            'Stat stages are factored into move selection for both sides',
          ],
        },
      ],
    },
    {
      version: '0.2.0',
      subtitle: 'Gym Leaders, Elite Four, Evolution Items & More',
      sections: [
        {
          heading: 'Gym Leaders, Elite Four & Champion',
          items: [
            'All 8 Kanto gym leaders are now in the game! Defeat them in order to earn badges and progress',
            'Each gym leader has their classic team from the original games',
            'After earning all 8 badges, take on the Elite Four gauntlet — Lorelei, Bruno, Agatha, and Lance back-to-back',
            'Defeat all four to face Champion Blue and his full team of 6',
          ],
        },
        {
          heading: 'Victory Tokens & Reward Shop',
          items: [
            'Earn Victory Tokens by defeating gym leaders for the first time (1 token per gym) and completing the Elite Four gauntlet (1 token per champion defeat)',
            'Spend tokens in the new Reward Shop (accessible from the Gyms tab) on evolution items:',
            'Fire Stone, Water Stone, Thunder Stone, Leaf Stone — 1 token each',
            'Moon Stone, Link Cable — 2 tokens each',
          ],
        },
        {
          heading: 'Evolution Items & Item-Based Evolution',
          items: [
            'Pokemon that evolve by stone or trade can now be evolved using these items from the stats panel',
            'Pokemon with multiple evolution options (e.g. Eevee) show all options side by side',
          ],
        },
        {
          heading: 'Route & Location Progression Overhaul',
          items: [
            'Unlock criteria reworked: routes now unlock based on battles fought at specific locations and badges earned, instead of a flat total battle count',
          ],
        },
        {
          heading: 'Auto-Proceed',
          items: [
            'New toggle button (▶▶) next to the settings gear in the battle scene',
            'When enabled, automatically travels to newly unlocked locations so you can idle hands-free',
          ],
        },
        {
          heading: 'Quality of Life',
          items: [
            'Evolution button is now always visible and shows requirements, faded when not met',
            'Evolution items now work from the box, not just the party',
            'Fixed stretched sprites in the box, party info screen, and catch settings menu',
            'Trainer name display no longer blocks buttons during trainer battles',
            'Trainer/boss sprites are larger during battle intros',
            'Battle win tracking split into wild battles vs trainer battles, tracked per location',
          ],
        },
      ],
    },
  ]
