// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const GAME_VERSION = '0.17.0'

export const LAST_SEEN_VERSION_KEY = 'pokemon-idle-last-seen-version'

export const CHANGELOG = [
    {
      version: '0.17.0',
      subtitle: 'Fishing Rods',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'Fishing now uses rod tiers: the Old Rod only reaches the common Pokemon near the surface, the Good Rod reaches deeper mid-water species, and the Super Rod hooks the rarest in the deep with a level bonus',
            'You find a better rod each time you open another region \u2014 the Old Rod from the start, the Good Rod with a second region and the Super Rod with a third \u2014 and the fishing card and scene show the rod you are using and the next one to find',
          ],
        },
      ],
    },
    {
      version: '0.16.0',
      subtitle: 'Route Minigames',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'Two new route activities: go Fishing on water routes and areas, or forage for berries and supplies in forests and gardens. Land the timing bar on the sweet spot \u2014 a hooked Pokemon starts a normal wild battle from that route',
            'Minigames now launch from where you are standing: the Game Corner, Bug Catching Contest, Underground and route activities appear as cards in the location panel instead of the League tab',
          ],
        },
      ],
    },
    {
      version: '0.15.0',
      subtitle: 'Challenges & Save Slots',
      sections: [
        {
          heading: 'Challenges',
          items: [
            'New Monotype challenge: limit wild encounters to a single type. Pick it on the starter screen or in Settings \u2014 a route with no on-type Pokemon falls back to its normal table so a run can\u2019t soft-lock, and off-type roamers stay away',
          ],
        },
        {
          heading: 'Save Data',
          items: [
            'The game keeps up to three independent save slots. When more than one holds a save you choose which to continue at boot, and Settings \u2192 Save Slots can play, start a new game in, or delete any slot',
            'Share your save as plain text: copy a code from Settings and paste it on another device, alongside the existing file export and import',
          ],
        },
      ],
    },
    {
      version: '0.14.0',
      subtitle: 'Moves & Abilities',
      sections: [
        {
          heading: 'Moves',
          items: [
            'Weather and terrain now change moves: Weather Ball switches type and doubles its power, Thunder and Hurricane never miss in rain (Blizzard in snow), and the terrain synergy abilities work',
            'A large batch of status and utility moves is live: Focus Energy, Aqua Ring, Wish, Yawn, Topsy-Turvy, Pain Split, Safeguard, Mist, Encore, Disable, Perish Song, Tailwind, Trick Room, Destiny Bond, Ingrain, Laser Focus and Lock-On, plus Life Dew / Jungle Healing / Lunar Blessing',
            'Ability and type manipulation works: Gastro Acid, Worry Seed, Simple Beam, Role Play, Entrainment and Skill Swap; Soak, Magic Powder, Reflect Type and Forest\u2019s Curse / Trick-or-Treat; Power / Guard / Heart Swap; Recycle; and Metronome / Copycat / Mirror Move / Nature Power',
          ],
        },
        {
          heading: 'Abilities',
          items: [
            'The bulk of the ~300 abilities are now modelled \u2014 attacking and defensive modifiers, stat shaping, switch-in effects, field auras, contact reactions, recovery, speed / priority / accuracy, type-changing and ability suppression',
            'A mid-battle form-change subsystem is in (Stance Change, Zero to Hero, Power Construct, Schooling, Imposter, Battle Bond, Disguise, Ice Face and more), with its own sprites, alongside Pickup / Honey Gather / Ball Fetch out of battle',
          ],
        },
      ],
    },
    {
      version: '0.13.0',
      subtitle: 'Regions, DLC & Leagues',
      sections: [
        {
          heading: 'Regions',
          items: [
            'Zones group a map node into named areas: Galar\u2019s Wild Area, Alola\u2019s islands, Paldea\u2019s provinces and Area Zero each open an area picker with their own wild Pokemon',
            'Galar\u2019s Isle of Armor and Crown Tundra and Paldea\u2019s Kitakami and Terarium are post-game zones, and the 17 missing Gen 9 DLC species joined \u2014 shrinking the Galar, Paldea and Alola Raid Islands as those species found native routes',
          ],
        },
        {
          heading: 'League & Progression',
          items: [
            'Every region now describes its own league: Alola runs the island trials for Z-Crystals, Galar\u2019s endgame is the Champion Cup, and Paldea\u2019s gyms can be tackled in any order. The Gyms tab is now the League tab',
          ],
        },
        {
          heading: 'Town Map',
          items: [
            'The Town Map draws a generated terrain layer with bold land and water, zone markers and spread-out region layouts, battle backgrounds get a biome colour grade, and minigames are badged where they are played',
            'Seen, caught and shiny Pokemon show a Pokeball badge on battles, encounter lists and Pokedex tiles, and Raid Islands now headline a legendary with a separate capped tier of ordinary finals',
          ],
        },
      ],
    },
    {
      version: '0.12.0',
      subtitle: 'Minigames & Collection',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'Four location-based minigames: the Sinnoh Underground, Johto Bug Catching Contest, Kanto Game Corner slots and Hoenn Battle Tower. They unlock by reaching their place and play out on the main stage, pausing the rest of the game',
            'The Bug Contest ends on a top-3 podium with cash and candy prizes; the Game Corner is a 3\u00d73 Pokemon slot machine; the Battle Tower floors are fixed seeded puzzles with a next-floor preview, and a loss keeps you on the floor',
            'The Move Tutor teaches each Pokemon\u2019s real TM moves for $4,000, and Wonder Trade now plays a short main-stage animation',
          ],
        },
        {
          heading: 'Pokemon',
          items: [
            'Female Pokemon show their female artwork everywhere the species differs, and save reliability was fixed for speed, travel and standalone option changes',
          ],
        },
      ],
    },
    {
      version: '0.11.0',
      subtitle: 'Weather, Terrain & Held Items',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Weather and terrain are live: Rain / Sun / Sandstorm / Snow and Electric / Grassy / Misty / Psychic Terrain, set by their moves or abilities and shown in a battle badge',
            'Entry hazards (Stealth Rock, Spikes, Toxic Spikes, Sticky Web), Taunt and Substitute, Attract and Curse, a modern 1/24 critical-hit rate, Haze / Clear Smog, never-miss moves, and contact abilities like Static, Flame Body, Poison Point and Rough Skin',
            'The auto-battler and trainers heal when low, set up early and set hazards when they have them',
          ],
        },
        {
          heading: 'Items',
          items: [
            'Pokemon can hold items again: Leftovers, Life Orb, the Choice items, Assault Vest, Eviolite, Focus Sash, Sitrus and Lum Berries and the type boosters \u2014 with a Held Items bag tab. Wild and trainer Pokemon hold them too',
          ],
        },
        {
          heading: 'Battle Tower',
          items: [
            'Tower floors became deterministic puzzles: the roster is seeded from the floor, battles run without luck, and the panel previews the next floor',
          ],
        },
        {
          heading: 'Challenges',
          items: [
            'Added the Nuzlocke challenge toggle \u2014 fainted party Pokemon are released, and the last one is always spared',
          ],
        },
      ],
    },
    {
      version: '0.10.0',
      subtitle: 'Battle Depth & Collection',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Healing, multi-hit, Protect / Detect and high-crit moves now work, with corrected priorities and an auto-battler that heals and sets up',
            'Status conditions (paralysis, bad poison and confusion) and their moves, Reflect / Light Screen, accuracy and evasion stages, and Leech Seed',
            'Master Ball throwing is a manual, animated action shown only for legendaries or hard-to-catch species',
          ],
        },
        {
          heading: 'Pokemon',
          items: [
            'Every Pokemon has a real ability (with a hidden-ability roll) and a friendship value, and friendship evolutions now require friendship 160',
            'Eight situational Poke Balls (Quick, Timer, Repeat, Net, Dive, Dusk, Nest and Premier) with auto-catch picking the best one',
          ],
        },
        {
          heading: 'Daycare',
          items: [
            'Eggs inherit three of the parents\u2019 best IVs, a 50% chance of a parent\u2019s nature, and any moves the hatchling can learn; Honey and Repel lock in a DexNav hunt once a chain reaches 4',
          ],
        },
      ],
    },
    {
      version: '0.9.0',
      subtitle: 'Quality of Life & Idle Systems',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Natures (with a Nature Mint re-roll), the IV judge, nicknames, favourites, Pokerus, floating damage numbers with sprite shake, and a box search / filter / sort with a Release Dupes tool',
            'Eggs are collected and carried, hatch after wild wins with a detailed hatch popup, tick down together and never reveal what is inside',
            'Reversible form changes use their canonical, reusable items sold in the Reward Shop',
          ],
        },
        {
          heading: 'Idle & Daily',
          items: [
            'Offline progress and a \u201cWhile You Were Away\u201d report, Daily Events with a Daily Gift, Daily Quests, and one-off achievement rewards',
            'Optional browser notifications and a hidden-tab away summary, plus floating combat feedback that respects reduced motion',
          ],
        },
        {
          heading: 'Interface',
          items: [
            'Optional chiptune music and sound effects (off by default), with accessibility toggles for reduced motion, move type labels and larger text',
            'Town Map search and a swarm badge, a Dex-completion celebration, and the Randomizer and Level Scaling challenge modes',
            'Save export / import from Settings, and release rewards for money and candy',
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
