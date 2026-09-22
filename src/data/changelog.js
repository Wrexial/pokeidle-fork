// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const GAME_VERSION = '0.9.7'

export const LAST_SEEN_VERSION_KEY = 'pokemon-idle-last-seen-version'

export const CHANGELOG = [
    {
      version: '0.9.7',
      subtitle: 'Release Rewards',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Releasing a Pokemon now pays out money and an Exp. Candy for its level tier \u2014 bigger candies for higher levels, and double candy plus more money for a shiny',
            'The release confirmation previews what you\u2019ll receive, and quick-releasing a hatchling pays out too',
          ],
        },
      ],
    },
    {
      version: '0.9.6',
      subtitle: 'Town Map QoL',
      sections: [
        {
          heading: 'Town Map',
          items: [
            'A search box finds any unlocked location by name and jumps the map to it \u2014 ordinary locations are travelled to as well',
            'The route with an active swarm now shows a pulsing bee badge; hovering it names the species and the battles remaining',
          ],
        },
      ],
    },
    {
      version: '0.9.5',
      subtitle: 'Achievement Rewards',
      sections: [
        {
          heading: 'Achievements',
          items: [
            'Every achievement now pays a one-off reward \u2014 money, Victory Tokens and occasionally a Master Ball \u2014 granted automatically when it unlocks (existing saves get theirs on load)',
            'The Records panel shows each achievement\u2019s reward and marks the ones already claimed',
          ],
        },
      ],
    },
    {
      version: '0.9.4',
      subtitle: 'Daily Events',
      sections: [
        {
          heading: 'Daily Events',
          items: [
            'A Daily Event now rotates each real-world day, shown from the gift button in the battle top bar \u2014 Harvest Day (double wild item drops), Fortune Day (double trainer prizes), Training Day (double battle EXP) or Lucky Day (double wild shiny odds)',
            'A one-off Daily Gift of money and items can be claimed each day; it resets at local midnight and is announced with a toast',
          ],
        },
      ],
    },
    {
      version: '0.9.3',
      subtitle: 'Natures',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Every Pokemon now has one of the 25 natures \u2014 it raises one stat by 10% and lowers another (HP is never affected) \u2014 and its nature is shown on the stats panel',
            'A Nature Mint in the Reward Shop re-rolls a party Pokemon\u2019s nature and recalculates its stats',
          ],
        },
      ],
    },
    {
      version: '0.9.2',
      subtitle: 'Master Ball Moment',
      sections: [
        {
          heading: 'Battles',
          items: [
            'A Master Ball button appears in wild battles and raids whenever you own one; throwing it plays a throw/flash/wobble/click animation and always catches',
            'The Master Ball is no longer spent automatically \u2014 auto-catch and the always-catch-shinies rule skip it, and it is only used from the button',
          ],
        },
      ],
    },
    {
      version: '0.9.1',
      subtitle: 'Save Backups & Box Order',
      sections: [
        {
          heading: 'Save Data',
          items: [
            'Export your save to a JSON file and import a backup from Settings \u2014 importing replaces your current progress',
          ],
        },
        {
          heading: 'Fixes',
          items: [
            'With the box sorted by New, a freshly caught or hatched Pokemon now appears at the front instead of the end',
          ],
        },
      ],
    },
    {
      version: '0.9.0',
      subtitle: 'Dex Rewards & Battle Clarity',
      sections: [
        {
          heading: 'Notifications',
          items: [
            'A toast queue now surfaces important moments without watching the battle log: first sighting, new Pokedex entry, repeats, shinies, evolutions, badges, Champions, region and route unlocks, dex rewards, raids, achievements and rare item finds',
            'Toasts stack in the corner, auto-dismiss, dedupe repeats and cap at four at once so idle events cannot spam the screen',
          ],
        },
        {
          heading: 'Bag & Economy',
          items: [
            'Potions, Super/Hyper/Max Potions, Revives and Max Revives can be bought at every mart and used on a party Pokemon in or out of battle',
            'Rare Candy (one level) and Exp. Candy S/M/L/XL (flat EXP) now drop from wild battles, scaling with the foe\u2019s level',
            'Treasures \u2014 Stardust, Pearls, Nuggets, Star Pieces and more \u2014 drop from wild battles and can be sold from a new Valuables bag tab',
            'New Medicine, Candies and Valuables bag tabs keep consumables and treasure separate from Key items',
          ],
        },
        {
          heading: 'Pokedex',
          items: [
            'Completing a generation\u2019s national dex now pays a one-off reward: 3 Victory Tokens and a Master Ball',
            'The Records panel gained a Dex Rewards section showing each generation\u2019s progress',
          ],
        },
        {
          heading: 'Battles',
          items: [
            'A wild Pokemon you have already caught now shows a check mark beside its name',
          ],
        },
        {
          heading: 'Town Map',
          items: [
            'The Region Unlock Token banner no longer appears once every region is open',
            'Any leftover Region Unlock Tokens are converted to Victory Tokens once all regions are open',
          ],
        },
        {
          heading: 'Fixes',
          items: [
            'Beating a region Champion again no longer counts as a new region, so it cannot grant duplicate Unlock Tokens or credit the World Tour achievement twice',
          ],
        },
      ],
    },
    {
      version: '0.8.1',
      subtitle: 'Battle Tower Scaling & Sprite Polish',
      sections: [
        {
          heading: 'Battle Tower',
          items: [
            'Deeper Tower floors now keep getting harder: past floor 25 the trainers\u2019 stats rise by 3% per floor instead of plateauing at level 100',
          ],
        },
        {
          heading: 'Polish',
          items: [
            'Added animated sprites for several Gen 9 Paradox and legendary forms (Iron Hands, Iron Moth, Iron Thorns, Iron Valiant, Miraidon)',
            'Sprites with no animation now use their static image directly instead of requesting a missing file first',
          ],
        },
        {
          heading: 'Fixes',
          items: [
            'Route unlock order keys are now unique per region',
          ],
        },
      ],
    },
    {
      version: '0.8.0',
      subtitle: 'Battles, Breeding & Beyond',
      sections: [
        {
          heading: 'Wonder Trade',
          items: [
            'Spend a Link Cable from a Pokemon\u2019s stats panel to trade it for a random Pokemon of the same level',
            'Wonder Trade Pokemon have a boosted 1 in 512 chance of being shiny',
          ],
        },
        {
          heading: 'Battle Status',
          items: [
            'Moves can now poison, burn, freeze, sleep and flinch their target \u2014 poison and burn deal damage every turn, burn halves physical attack, and sleep/freeze stop the Pokemon acting',
            'Drain moves (Absorb, Giga Drain, ...) heal the user for part of the damage dealt',
            'Status conditions show as a badge beside each Pokemon\u2019s HP bar in battle',
          ],
        },
        {
          heading: 'Daycare',
          items: [
            'Deposit two Pokemon from their stats panel into the Daycare; they produce an Egg after 50 battles',
            'Breeding respects gender and egg groups \u2014 the parents must be opposite genders and share an egg group; Ditto can breed with anything, while genderless and Undiscovered Pokemon need a Ditto (or cannot breed at all)',
            'Eggs hatch into the mother\u2019s base form at level 1 with 1 in 4,096 shiny odds \u2014 improved to 1 in 512 if a parent is shiny',
          ],
        },
        {
          heading: 'Roaming Legendaries',
          items: [
            'A region\u2019s uncaught legends can now show up as a rare roamer on any of its routes',
            'A roamer may flee each turn \u2014 catch it fast, and once caught it leaves the roaming pool',
          ],
        },
        {
          heading: 'Swarms',
          items: [
            'Occasionally a swarm breaks out on a random unlocked route, making one of its rarer species very common for 50 battles',
            'The route\u2019s Wild Pokemon header shows the active swarm and its remaining battles',
          ],
        },
        {
          heading: 'Achievements',
          items: [
            'A set of 21 medals now tracks your milestones \u2014 battles, Pokedex, shinies, badges, Champions, prestige and the Battle Tower',
            'They appear at the top of the Records panel with your earned/unearned count',
          ],
        },
        {
          heading: 'Shiny Chain',
          items: [
            'Consecutive encounters of the same species build a shiny chain that improves its shiny odds \u2014 up to 4x at 120 in a row',
            'The chained species shows a \u2726 badge on its encounter tile',
          ],
        },
        {
          heading: 'Battle Tower',
          items: [
            'Once a region\u2019s Champion is beaten, its Gyms tab offers an endless Battle Tower: steadily stronger trainers, your team healed between floors, for Victory Tokens that scale with depth',
            'A loss ends the run; your best floor per region is tracked and shown in the Records panel',
          ],
        },
        {
          heading: 'Records',
          items: [
            'A Records panel in the Box summarises your journey: battles won, Pokedex and shiny progress, badges, Victory Tokens, and per-region completion and prestige levels',
          ],
        },
      ],
    },
    {
      version: '0.7.0',
      subtitle: 'Region Unlocks, Prestige & Evolution Items',
      sections: [
        {
          heading: 'Region Unlocks',
          items: [
            'Beating a region\u2019s Champion now earns an Unlock Token \u2014 spend it from the Town Map to open any region you like, instead of following a fixed order',
            'Locked region tabs glow while you have a token; click one to open it',
          ],
        },
        {
          heading: 'Region Prestige',
          items: [
            'Once you finish a region, the Gyms tab offers a Prestige button that replays its routes and badges without losing your Pokemon, items, money or Pokedex',
            'Prestige level is tracked per region and each reset awards Victory Tokens',
            'Prestige requires the region\u2019s Elite Four to be beaten again, and re-locks its badge gates',
          ],
        },
        {
          heading: 'Evolution Items',
          items: [
            'The Reward Shop now stocks working evolution items: Sun, Dusk, Shiny, Dawn, Ice and Oval Stones, plus Link Cable, King\u2019s Rock, Metal Coat, Protector, Electirizer, Magmarizer, Razor Claw, Razor Fang, Reaper Cloth, Deep Sea Tooth/Scale, Upgrade, Dubious Disc, Sachet, Whipped Dream, Sweet/Tart Apple, Cracked Pot and the Galar/armor items',
            'Pokemon that normally evolve by trade \u2014 Kadabra, Machoke, Graveler, Haunter, Boldore, Gurdurr, Phantump, Pumpkaboo and more \u2014 now evolve with a Link Cable',
            'Stone evolutions (Pikachu, Eevee, Vulpix, Growlithe, Gloom, Clefairy, Kirlia and many others) use their stone instead of levelling up',
          ],
        },
        {
          heading: 'Catch Goals',
          items: [
            'Route-exclusive catch goals now name the species they want, and the Wild Pokemon grid flags which tiles are exclusive to that route',
          ],
        },
        {
          heading: 'Secrets',
          items: [
            'Cinnabar Island has a 1 in 1,000 chance of a MissingNo. encounter instead of a trainer battle',
          ],
        },
        {
          heading: 'Fixes',
          items: [
            'Badge requirements count only their own region\u2019s badges, so prestiging a region properly re-locks its gates',
          ],
        },
      ],
    },
    {
      version: '0.6.0',
      subtitle: 'Balance Pass — Encounters, Forms & Trainers',
      sections: [
        {
          heading: 'Catch Goals',
          items: [
            'Some routes now ask you to catch Pokemon that spawn only there, a harder, route-specific cousin of the old "catch X Pokemon" goal',
            'Legendaries, starters and ultra-rare finds are left out so the goal stays fair',
          ],
        },
        {
          heading: 'Cleaner Encounters',
          items: [
            'Route tables no longer include radio/Poke Radar/dual-slot crossovers, in-game trades, fossil items, swarms or headbutt/honey-tree species',
            'Static legendaries moved off regular routes and onto the Raid Islands',
            'The Kanto Raid Island now works like every other region\u2019s',
            'Paldea\u2019s open-world areas were trimmed to their most common species, with the rest moved to its Raid Island',
          ],
        },
        {
          heading: 'Complete Pokedex',
          items: [
            'Every species can now be obtained \u2014 including Mega, Gigantamax, regional and paradox forms',
            'Mega and Gigantamax forms are level-100 evolutions; regional forms live on their region\u2019s Raid Island',
            'Every Pokemon now has a move set (forms and a few species used to enter battle with no moves)',
            'The Pokedex "All" tab counts only the national dex, so completion is now reachable',
          ],
        },
        {
          heading: 'Trainers, Gyms & Items',
          items: [
            'Route trainers and gym leaders no longer field unevolved Pokemon far past their evolution level',
            'Generated trainers now have names like "Bug Catcher Joey" instead of "Route 2 Trainer 1"',
            'Poke Marts open up gradually \u2014 Ultra Balls and Repel are no longer sold in the first town',
          ],
        },
        {
          heading: 'Presentation',
          items: [
            'Routes use biome battle backgrounds (caves, seas, mountains) instead of grassland everywhere',
            'Routes and towns have descriptive text, gym towns name their leader, and hand-measured maps no longer overlap',
          ],
        },
      ],
    },
    {
      version: '0.5.0',
      subtitle: 'Regional Expansion — Generations 2-9',
      sections: [
        {
          heading: 'New Regions',
          items: [
            'Eight new regions are now reachable: Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar and Paldea',
            'Your chosen region is open from the start; every other region unlocks after you beat the previous region\u2019s Elite Four and Champion',
            'Within a region, routes unlock as you win battles on the previous route',
            'Every region reproduces its real map — actual towns and routes with their genuine connections — plus a Raid Island and gyms',
          ],
        },
        {
          heading: 'Regional Leagues',
          items: [
            'Each region has its own 8 gym leaders, Elite Four and Champion',
            'Gym badges gate the road onward \u2014 a route that needs a badge stays shut until you beat that leader (backtracking to them if you passed their town early), and the league demands all eight badges',
            'Badges, gym order and the league challenge are all per-region',
            "Beating a region's Champion is what opens up the next region",
          ],
        },
        {
          heading: 'Legendary Raids',
          items: [
            "Each region has a Raid Island holding that generation's Pokemon you can't catch anywhere in the region",
          ],
        },
        {
          heading: 'Regional Starters',
          items: [
            "Pick a starter from any of the nine regions \u2014 your choice determines where your journey begins",
            "Each region's three starter Pokemon can also be found as rare encounters on its first route",
          ],
        },
        {
          heading: 'Town Map',
          items: [
            'The Town Map now has region tabs — switch between regions to view their routes',
            'Locked regions are greyed out until you reach them',
          ],
        },
        {
          heading: 'Route Pacing',
          items: [
            'Wild Pokemon now scale dynamically per zone \u2014 each route sits in a tight level band based on how far into the region it is',
            'Every region runs its own 5-75 curve, so wilds, trainers, gyms, the Elite Four and the Champion all ramp together within each region',
          ],
        },
        {
          heading: 'Expanded Pokedex & Encounters',
          items: [
            'Over 700 species are obtainable as wild encounters across all nine generations',
            'Routes now spawn their real wild Pokemon (authentic per-route encounter tables), not arbitrary picks',
            'The Shiny Charm now unlocks once you complete the wild Pokedex (previously a fixed 151)',
          ],
        },
      ],
    },
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
