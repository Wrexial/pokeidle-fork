// Villain-team questlines: one antagonist organisation per region, each with a
// hideout on the map and a short arc (three grunts, an admin and a boss whose
// team carries a legendary). The teams are built at runtime (see
// src/game/villain-teams.js) so the boss's legendary never leaks into the
// committed trainer JSON, and defeating the boss pays a one-off reward.
//
// Pure data: no imports, so both the game and the data tooling can read it.

/**
 * Every org, keyed by the region it menaces. The `VillainOrg` shape lives in
 * src/types.d.ts.
 * @type {Record<string, VillainOrg>}
 */
export const VILLAIN_ORGS = {
  kanto: {
    region: 'kanto',
    id: 'rocket',
    name: 'Team Rocket',
    tagline: 'Steal Pokemon for profit. Exploit Pokemon for profit.',
    hideout: {
      id: 'kanto-rocket-hideout',
      name: 'Rocket Hideout',
      parent: 'celadonCity',
      description:
        'Beneath the Game Corner, Team Rocket runs a smuggling operation out of a hidden basement.',
      badgeGate: 4,
    },
    gruntClass: 'roughneck',
    gruntLines: [
      'Hey! This is a restricted area, kid.',
      'The boss is not gonna like this\u2026',
    ],
    adminLines: ['You got past the grunts, but the operation is only getting started.'],
    bossLines: [
      'So you are the child causing all this trouble.',
      'Very well \u2014 let me show you what Team Rocket is really capable of.',
    ],
    win: 'Impossible\u2026 my organisation, undone by a child.',
    lose: 'Team Rocket does not lose to the likes of you.',
    admin: {
      name: 'Executive Ariana',
      title: 'Rocket Executive',
      spriteKey: 'beauty',
      signature: 'arbok',
    },
    boss: {
      name: 'Giovanni',
      title: 'Rocket Boss',
      spriteKey: 'giovanni',
      signature: 'persian',
      legendary: 'zapdos',
    },
    types: ['Poison', 'Dark'],
    reward: {
      money: 12000,
      victoryTokens: 2,
      items: { masterball: 1, rareCandy: 2, natureMint: 1 },
      ribbon: 'villain-kanto',
    },
  },
  johto: {
    region: 'johto',
    id: 'rocket',
    name: 'Team Rocket',
    tagline: 'The remnants of a defeated organisation, scheming in secret.',
    hideout: {
      id: 'johto-rocket-hideout',
      name: 'Rocket HQ',
      parent: 'johto-mahogany-town',
      description:
        'A souvenir shop hides the stairwell down to the revived Team Rocket headquarters.',
      badgeGate: 4,
    },
    gruntClass: 'roughneck',
    gruntLines: ['The boss said nobody gets in!', 'We are bringing Team Rocket back!'],
    adminLines: ['Our new leader has a vision far grander than Giovanni ever had.'],
    bossLines: [
      'The old Rocket was weak. This one will not be defeated so easily.',
      'Let me show you the strength we have gathered.',
    ],
    win: 'No\u2026 the revival fails here.',
    lose: 'Get out of our headquarters before I lose my patience.',
    admin: {
      name: 'Executive Proton',
      title: 'Rocket Executive',
      spriteKey: 'scientist',
      signature: 'golbat',
    },
    boss: {
      name: 'Executive Archer',
      title: 'Rocket Boss',
      spriteKey: 'giovanni',
      signature: 'houndoom',
      legendary: 'raikou',
    },
    types: ['Dark', 'Poison'],
    reward: {
      money: 13000,
      victoryTokens: 2,
      items: { masterball: 1, rareCandy: 2, bottleCap: 1 },
      ribbon: 'villain-johto',
    },
  },
  hoenn: {
    region: 'hoenn',
    id: 'aqua',
    name: 'Team Aqua',
    tagline: 'The sea is the cradle of all life. Expand it.',
    hideout: {
      id: 'hoenn-aqua-hideout',
      name: 'Aqua Hideout',
      parent: 'hoenn-lilycove-city',
      description:
        'A cavern off Lilycove hides Team Aqua watercraft and the sub that will flood the world.',
      badgeGate: 3,
    },
    gruntClass: 'swimmer',
    gruntLines: ['The sea will swallow this whole region!', 'Stand aside, land-dweller!'],
    adminLines: ['The team will not stop for one nosy trainer.'],
    bossLines: [
      'You have come to stop the tide itself.',
      'Let the open sea decide whose dream is stronger!',
    ],
    win: 'The water returns to its shores\u2026 what have I done?',
    lose: 'The sea is not finished with you yet.',
    admin: {
      name: 'Admin Matt',
      title: 'Aqua Admin',
      spriteKey: 'sailor',
      signature: 'sharpedo',
    },
    boss: {
      name: 'Archie',
      title: 'Aqua Boss',
      spriteKey: 'sailor',
      signature: 'wailord',
      legendary: 'latios',
    },
    types: ['Water', 'Dark'],
    reward: {
      money: 14000,
      victoryTokens: 2,
      items: { masterball: 1, rareCandy: 2, abilityCapsule: 1 },
      ribbon: 'villain-hoenn',
    },
  },
  sinnoh: {
    region: 'sinnoh',
    id: 'galactic',
    name: 'Team Galactic',
    tagline: 'Rebuild the universe in our image.',
    hideout: {
      id: 'sinnoh-galactic-hideout',
      name: 'Galactic HQ',
      parent: 'sinnoh-veilstone-city',
      description:
        'A tower of pale steel in Veilstone City, humming with the power of the lakes.',
      badgeGate: 3,
    },
    gruntClass: 'scientist',
    gruntLines: ['You are interfering with a perfect plan.', 'The new world has no place for you.'],
    adminLines: ['Commander Mars will grind you into dust beneath our ambitions.'],
    bossLines: [
      'The universe is a broken thing. I intend to remake it.',
      'Your spirit is strong\u2026 but useless against a god.',
    ],
    win: 'The new world slips away\u2026 just as it was within reach.',
    lose: 'Crawl back to the lakes. You cannot stop the new dawn.',
    admin: {
      name: 'Commander Mars',
      title: 'Galactic Commander',
      spriteKey: 'beauty',
      signature: 'purugly',
    },
    boss: {
      name: 'Cyrus',
      title: 'Galactic Boss',
      spriteKey: 'scientist',
      signature: 'honchkrow',
      legendary: 'heatran',
    },
    types: ['Poison', 'Dark'],
    reward: {
      money: 15000,
      victoryTokens: 2,
      items: { masterball: 1, rareCandy: 2, goldBottleCap: 1 },
      ribbon: 'villain-sinnoh',
    },
  },
  unova: {
    region: 'unova',
    id: 'plasma',
    name: 'Team Plasma',
    tagline: 'Pokemon should be freed from trainers. By force.',
    hideout: {
      id: 'unova-plasma-hideout',
      name: 'Plasma Base',
      parent: 'unova-castelia-city',
      description:
        'Below Castelia\'s streets, Team Plasma stockpiles the technology a new order will need.',
      badgeGate: 3,
    },
    gruntClass: 'roughneck',
    gruntLines: ['We fight for the freedom of Pokemon!', 'Do not stand in the way of liberation!'],
    adminLines: ['The sages have foreseen your defeat.'],
    bossLines: [
      'Pokemon are tools. The moment trainers accept that, the world will be mine.',
      'No child will take the future from me.',
    ],
    win: 'My perfect truth\u2026 shattered.',
    lose: 'Fool. You understand nothing of true power.',
    admin: {
      name: 'Sage Zinzolin',
      title: 'Plasma Sage',
      spriteKey: 'scientist',
      signature: 'cryogonal',
    },
    boss: {
      name: 'Ghetsis',
      title: 'Plasma Boss',
      spriteKey: 'scientist',
      signature: 'hydreigon',
      legendary: 'cobalion',
    },
    types: ['Electric', 'Dark'],
    reward: {
      money: 16000,
      victoryTokens: 2,
      items: { masterball: 1, rareCandy: 2, abilityPatch: 1 },
      ribbon: 'villain-unova',
    },
  },
  kalos: {
    region: 'kalos',
    id: 'flare',
    name: 'Team Flare',
    tagline: 'A beautiful world needs a smaller, richer population.',
    hideout: {
      id: 'kalos-flare-hideout',
      name: 'Flare Secret HQ',
      parent: 'kalos-lumiose-city',
      description:
        'A hidden entrance in Lumiose City leads to Team Flare\u2019s sun-coloured laboratory.',
      badgeGate: 4,
    },
    gruntClass: 'scientist',
    gruntLines: ['This world is far too ugly for you to save.', 'Team Flare will purify everything.'],
    adminLines: ['The ultimate weapon is already listening. You are far too late.'],
    bossLines: [
      'I want a beautiful world, and I will destroy everything to build it.',
      'Show me that your bond is worth preserving!',
    ],
    win: 'Perhaps the world is not so ugly after all\u2026',
    lose: 'Stay out of the beauty of my new world.',
    admin: {
      name: 'Admin Xerosic',
      title: 'Flare Scientist',
      spriteKey: 'scientist',
      signature: 'malamar',
    },
    boss: {
      name: 'Lysandre',
      title: 'Flare Boss',
      spriteKey: 'scientist',
      signature: 'pyroar',
      legendary: 'zygarde',
    },
    types: ['Fire', 'Dark'],
    reward: {
      money: 17000,
      victoryTokens: 2,
      items: { masterball: 1, rareCandy: 2, natureMint: 1 },
      ribbon: 'villain-kalos',
    },
  },
  alola: {
    region: 'alola',
    id: 'skull',
    name: 'Team Skull',
    tagline: 'Pokemon battles are a joke. Thievery is an art.',
    hideout: {
      id: 'alola-skull-hideout',
      name: 'Team Skull Base',
      parent: 'alola-po-town',
      description:
        'The rainy town of Po Town is walled off and crawling with Team Skull troublemakers.',
      badgeGate: 3,
    },
    gruntClass: 'roughneck',
    gruntLines: ['Yo, you lost? This is Skull turf!', 'You got a lotta nerve showin up here!'],
    adminLines: ['You want the boss? You gotta get through me first.'],
    bossLines: [
      'I do not lose. Not to you, not to anyone!',
      'Let me show you why they call me the boss of Team Skull!',
    ],
    win: 'Tch\u2026 you are something else. Skull stands down.',
    lose: 'Bow down. Team Skull owns this island.',
    admin: {
      name: 'Admin Plumeria',
      title: 'Skull Admin',
      spriteKey: 'biker',
      signature: 'salazzle',
    },
    boss: {
      name: 'Guzma',
      title: 'Skull Boss',
      spriteKey: 'roughneck',
      signature: 'golisopod',
      legendary: 'solgaleo',
    },
    types: ['Poison', 'Dark'],
    reward: {
      money: 18000,
      victoryTokens: 2,
      items: { masterball: 1, rareCandy: 3, expCandyXL: 1 },
      ribbon: 'villain-alola',
    },
  },
  galar: {
    region: 'galar',
    id: 'yell',
    name: 'Team Yell',
    tagline: 'Marnie\u2019s number-one fans, booing in unison.',
    hideout: {
      id: 'galar-yell-hideout',
      name: 'Yell Hideout',
      parent: 'galar-spikemuth',
      description:
        'Behind the shutters of Spikemuth, Team Yell keeps a loud, grimy headquarters.',
      badgeGate: 4,
    },
    gruntClass: 'roughneck',
    gruntLines: ['Oi! You are not gettin near our Marnie!', 'Boo! Get lost, challenger!'],
    adminLines: ['If you want to reach the boss, you will have to shout louder!'],
    bossLines: [
      'Spikemuth does not belong to the Chairman. It belongs to us.',
      'Let the crowd decide who is stronger!',
    ],
    win: 'You are the real deal\u2026 Go on, then.',
    lose: 'Not bad, but Spikemuth stays ours.',
    admin: {
      name: 'Piers',
      title: 'Yell Leader',
      spriteKey: 'piers',
      signature: 'toxtricity',
    },
    boss: {
      name: 'Marnie',
      title: 'Yell Boss',
      spriteKey: 'marnie',
      signature: 'morpeko',
      legendary: 'regieleki',
    },
    types: ['Dark', 'Fairy'],
    reward: {
      money: 19000,
      victoryTokens: 2,
      items: { masterball: 1, rareCandy: 3, goldBottleCap: 1 },
      ribbon: 'villain-galar',
    },
  },
  paldea: {
    region: 'paldea',
    id: 'star',
    name: 'Team Star',
    tagline: 'The rebels of Naranja Academy, engines roaring.',
    hideout: {
      id: 'paldea-star-hideout',
      name: 'Star Base',
      parent: 'paldea-mesagoza',
      description:
        'A hidden Team Star base on the edge of Mesagoza, fortified with a battle-hungry squad.',
      badgeGate: 4,
    },
    gruntClass: 'schoolkid',
    gruntLines: ['This base belongs to Team Star!', 'You will never reach the boss!'],
    adminLines: ['My squad trained for this. You will not make it past me.'],
    bossLines: [
      'You think one trainer can take down Team Star?',
      'Everyone \u2014 let us show this challenger what Star is made of!',
    ],
    win: 'Team Star disbands\u2026 but our spirit will live on.',
    lose: 'Team Star does not yield. Come back when you are ready.',
    admin: {
      name: 'Segin Squad Boss',
      title: 'Star Squad Boss',
      spriteKey: 'schoolkid',
      signature: 'revavroom',
    },
    boss: {
      name: 'Team Star Boss',
      title: 'Star Boss',
      spriteKey: 'veteran',
      signature: 'kingambit',
      legendary: 'chien-pao',
    },
    types: ['Dark', 'Fire'],
    reward: {
      money: 20000,
      victoryTokens: 2,
      items: { masterball: 1, rareCandy: 3, abilityPatch: 1 },
      ribbon: 'villain-paldea',
    },
  },
}

/** The arc's stages, in the order they must be beaten. */
export const VILLAIN_STAGES = ['grunt-1', 'grunt-2', 'grunt-3', 'admin', 'boss']

/** How many stages a full arc has. */
export const VILLAIN_TOTAL_STAGES = VILLAIN_STAGES.length

/**
 * The org menacing a region, or null.
 * @param {string | null | undefined} regionId
 * @returns {VillainOrg | null}
 */
export function villainOrgFor(regionId) {
  return (regionId && VILLAIN_ORGS[regionId]) || null
}
