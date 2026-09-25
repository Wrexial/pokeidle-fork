// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const GAME_VERSION = '0.18.0'

export const LAST_SEEN_VERSION_KEY = 'pokemon-idle-last-seen-version'

export const CHANGELOG = [
    {
      version: '0.18.0',
      subtitle: 'Hunting Rewards',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'Fishing, Rock Smash, Headbutt, Diving and foraging now show what you found before the battle \u2014 the Pokemon, its level and its bonuses \u2014 with a BATTLE or LET IT GO choice',
            'Activity encounters are now worth chasing: they spawn a few levels above the route, have boosted shiny odds, and can carry a held item (guaranteed on an ultra hit). Better hit quality improves all three',
            'Caught wild Pokemon now keep the IVs, ability and held item of the one you actually battled',
            'A minigame battle now offers an ATTEMPT CATCH button: throw your configured ball at the find (falling back to your best ball) instead of waiting for the auto-catcher',
            'Every minigame now ends on a reward screen that itemises what you won \u2014 money and each item by name \u2014 before you collect it, instead of tucking the prize into a line of text',
            'The minigames are livelier: Voltorb tiles flip, memory cards turn over, lights glow and pulse, targets pop, markers flicker, and the reward panel bursts in',
            'Headbutt no longer plays like Diving: hold one of three trees to charge a bar, then release in the green/yellow/cyan sweet spot to shake a Pokemon loose',
            'Headbutt and the Bug Catching Contest can now shake out two Pokemon at once. You can only engage one \u2014 pick your target and the other slips away with an \u201cawwhh\u201d',
            'Voltorb Flip: clicking a Voltorb now actually explodes \u2014 a burst on the tile, a board shake and a new explosion sound effect',
            'Fishing no longer hides a route-exclusive catch behind a perfect cast: the rarest Water species is back in the normal wild table and can be found while exploring, and a perfect cast instead just boosts the shiny odds and level',
            'The Town Map no longer badges fishing spots with a rod icon now that route activities live in the location panel',
          ],
        },
        {
          heading: 'Battles',
          items: [
            'Variable-power moves now work: Heat Crash and Heavy Slam scale with how much heavier the user is, Low Kick and Grass Knot with the target\u2019s weight, Electro Ball and Gyro Ball with the speed gap, Flail / Reversal / Eruption / Water Spout / Dragon Energy with HP, Crush Grip and Wring Out with the target\u2019s HP, Stored Power / Power Trip / Punishment with stat boosts, and Return / Frustration with friendship',
            'In-battle Mega Evolution: give a Mega-capable Pokemon the new held Mega Stone (from the Reward Shop, Kalos marts or the Auction House) and it transforms for the rest of the battle \u2014 taking the physical X forme or the special Y forme \u2014 with the forme\u2019s stats, typing and ability, then reverting afterwards',
            'The same Mega Stone now triggers Primal Reversion: Primal Groudon and Kyogre transform in battle with Desolate Land and Primordial Sea',
            'Mega Evolution is no longer offered as a level-100 evolution \u2014 the Mega Stone is the way to Mega Evolve, so a Lv.100 Pokemon no longer shows a redundant evolve option',
            'Mega Evolution no longer raises a notification toast; the battle log and the transformed sprite still show it',
            'The battle screen\u2019s MOVES button is gone \u2014 manage moves from a Pokemon\u2019s summary instead (the Manage button in its stats panel)',
            'Moves that never miss (Swift, Aerial Ace, Aura Sphere, the G-Max moves and the rest) now truly cannot miss: they ignore accuracy and evasion stages instead of having their accuracy lowered by them, and their accuracy reads as an em dash rather than "101%"',
            'Battle status effects always show a three-letter tag now \u2014 including TOX for badly poisoned and PAR for paralysis \u2014 and the info nameplate reserves the tag\u2019s space so it never jumps or resizes when a status lands or wears off',
            'Moves and abilities now have hover tooltips: hover a move (battle bar, Move Manager or a Pokémon\u2019s summary) for its type, category, power, accuracy and a plain-English effect, and hover an ability for what it does',
          ],
        },
        {
          heading: 'People & Places',
          items: [
            'One-off NPC gifts and static encounters: towns and routes now offer a gift (an item pack, an Eevee, a regional starter, a Riolu, ...) or a fixed wild battle (a Snorlax blocking the road, a wiggling Sudowoodo, a honey-tree Munchlax, ...), each claimable once per save and listed in the location panel with any badge gate spelled out',
            'A town\u2019s Poke Mart can now be collapsed from its header, and it stays collapsed on your next visit, so a long shop list no longer pushes the area\u2019s encounters and activities off-screen',
            'Marts now stock different shelves: each region\u2019s situational balls and held items are split between its towns instead of every mart listing the whole regional set',
            'Premier Balls are no longer sold \u2014 you get one free for every 10 balls you buy',
            'Swarms last 256 wild battles and their species has 4x shiny odds (never better than 1 in 256). They still announce themselves with a toast that names the area but not the Pokemon, so it stays a surprise until you arrive',
            'The Bag, Poke Mart, Reward Shop and Auction House now show a proper item sprite next to every item instead of a blank square',
          ],
        },
        {
          heading: 'Guides',
          items: [
            'New Battle Reference page (/reference.html): a searchable breakdown of every move, ability and held item, showing what each one does in this engine and which are still inert. It is generated from the game data, so it stays in step with the engine',
            'The player guide now covers the Companion, Berry Garden and Poke Pelago, the full line-up of minigames and route activities, and gifts and static encounters, and its ability / move coverage notes are refreshed for the current engine',
          ],
        },
        {
          heading: 'Progression',
          items: [
            'High-level wild areas no longer open before the region expects them: routes whose wilds jump far above the area that unlocks them (Paldea\u2019s province areas, Alola\u2019s late island routes, several end-game routes) now also require a party level closer to their wilds, so you cannot wander into Lv.70+ Pokemon with a starter team',
            'Every region\u2019s opening route now starts at Lv. 3-5 instead of Lv. 5-7 (Galar\u2019s opening route and the Slumbering Weald included), so a fresh starter has room to find its feet before the region\u2019s curve starts climbing',
            'The Exp. Share is rebalanced: over 500 battles the active Pokemon gains 50% EXP and every other non-fainted party member gains 25% (it used to give the rest only 5%, but lasted 1000 battles)',
          ],
        },
        {
          heading: 'Fixes',
          items: [
            'Wild Pokemon can no longer be caught twice from one battle: the idle loop now waits for a turn / catch to commit before acting again, so a fast battle speed can not replay the same victory and duplicate the catch',
            'A queued turn can no longer resolve after the battle has already ended, and the ATTEMPT CATCH button is disabled while a turn is still resolving',
            'The Settings and Pok\u00e9 Pelago modals are no longer clipped: the centre column no longer traps fixed-position overlays (Daily Quests and the Daily Event benefit too)',
            'Layout pass on crowded controls: the Box header no longer overlaps its pager with the Pokedex / Records / Daycare buttons, and toolbar / tab / save-button rows wrap instead of colliding',
            'Alola and Paldea are playable again: starting in one (or opening it with an Unlock Token) now unlocks the entry island/province hub and its first area, instead of stranding the player because the hub asked for a Pokedex count they had no route to reach',
            'The Town Map no longer renders blank when you stand on a hidden zone sub-area (starting in Alola or Paldea): the camera focuses the entry island/province hub instead of empty space between nodes, so the map stays navigable',
            'Alola\u2019s Route 2 no longer asks for wins on the later, still-locked Route 3: it now opens from Route 1, so the island\u2019s early progression and the \u201cNext Unlocks\u201d list point somewhere you can actually reach',
            'The gym tab\u2019s "GO TO <town>" hint is now a button: click it to travel straight to that leader\u2019s town',
            'Candies can be applied in bulk: choose 1, 10 or All in the bag and use them in one go. A stack stops at Lv.100 and only spends the candies it actually needed',
            'Mossdeep City\u2019s Gym leaders are now correctly named Tate & Liza (they were shown as just "Tate")',
            'Self-Destruct, Explosion, Misty Explosion and Memento now actually faint their user once they resolve',
            'Two-turn moves now take two turns: Solar Beam, Solar Blade, Razor Wind, Sky Attack, Skull Bash, Freeze Shock, Ice Burn, Geomancy, Meteor Beam and Electro Shot charge on the first turn and strike on the next, while Fly, Bounce, Dig, Dive, Phantom Force and Shadow Force go semi-invulnerable while charging and can only be hit by Earthquake / Surf / Gust and the like',
            'The Pokemon summary\u2019s header is tidier: the name and level share a row, with nature, ability, held item and friendship in a chip strip beneath the types. A nature\u2019s stat effect now lives in its hover tooltip instead of inline arrows, colour-coded with the raised stat in green and the lowered one in red',
            'Catch Settings now start with every ball enabled (the Master Ball keeps its own battle button), so the auto-catcher uses your best available ball instead of only Poke Balls',
          ],
        },
      ],
    },
    {
      version: '0.17.0',
      subtitle: 'Companion, Garden & Pok\u00e9 Pelago',
      sections: [
        {
          heading: 'Idle Life',
          items: [
            'New Companion: pin one of your party Pokemon (the paw button in the top bar) and keep it fed, happy and rested. Care fades as you win battles, one care action is allowed per win, and a content companion grants +15% EXP',
            'New Berry Garden (the sprout button): plant Oran, Sitrus or Lum Berries in four plots, let them ripen over wild wins, and harvest a crop back into the bag',
            'Blend three Berries into a Poffin, which raises a party Pokemon\u2019s friendship by 30 when used',
            'Oran Berries are sold at every Mart so the garden is easy to start',
            'Pok\u00e9 Pelago is here: a new island off Alola (Hau\u2019oli City) that you visit from the Town Map. Companion care and the Berry Garden move there from the top bar and share one hub',
            'Companion care gained a Cleanliness stat and Pat, Brush and Wash actions, so there is more to do between battles. The +15% EXP bonus now needs all four care stats at 50+',
            'Three passive islands \u2014 the Bean Farm, Training Isle and Isle Caves \u2014 can be staffed with boxed Pokemon. They gather Poke Beans, EXP and items while you battle, banking rewards to collect when you return',
          ],
        },
      ],
    },
    {
      version: '0.16.0',
      subtitle: 'Minigames & Battle Items',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'Two new route activities: go Fishing on water routes and areas, or forage for berries and supplies in forests and gardens. Land the timing bar on the sweet spot \u2014 a hooked Pokemon starts a normal wild battle from that route',
            'Minigames now launch from where you are standing: the Game Corner, Bug Catching Contest, Underground and route activities appear as cards in the location panel instead of the League tab',
            'Fishing now uses rod tiers: the Old Rod only reaches the common Pokemon near the surface, the Good Rod reaches deeper mid-water species, and the Super Rod hooks the rarest in the deep with a level bonus',
            'You find a better rod each time you open another region \u2014 the Old Rod from the start, the Good Rod with a second region and the Super Rod with a third \u2014 and the fishing card and scene show the rod you are using and the next one to find',
            'Fishing is limited to 30 hand-picked water-rich routes (about three per region, marked with a rod on the Town Map), and a cast only ever hooks a Water Pokemon \u2014 a route with none has nothing to catch',
            'Every fishing route now guards an exclusive Water Pokemon. Hit the tiny centre of the cast bar \u2014 a fourth, smallest zone \u2014 to hook it. It is pulled out of the route\u2019s normal wild table and marked with a fishing rod in the Wild Pokemon list',
            'Berry Foraging now plays as an expanding ring you time on the target instead of a left-to-right bar, so it no longer looks like fishing',
            'A successful search can now flush a Grass Pokemon out of the bush (more likely on a perfect search) and start a normal wild battle',
            'Fishing and foraging are easier to time: the marker sweeps slower (about 1.6s a pass) and the hit / perfect / centre zones are much wider, so the sweet spot is a bigger target',
            'Kanto\u2019s Safari Zone is now playable: pay $500 for 30 free Safari Balls and roam the reserve. Bait calms a Pokemon but makes it harder to catch, while a Rock makes it easier to catch but far more likely to bolt \u2014 so the rare catches are a gamble',
            'Three new route activities join Fishing and Foraging: Rock Smash on cave routes finds Rock and Ground Pokemon, Headbutt on grassy routes finds Normal and Flying Pokemon, and Diving on water routes reaches the deeper Water Pokemon that fishing cannot',
            'Each activity has its own look \u2014 a swinging pickaxe, a marker bobbing up a tree trunk, and a descending depth gauge \u2014 so the timing game never looks the same twice',
            'Paldea\u2019s Mesagoza Academy now runs the Academy Quiz: answer 10 type-matchup questions against a 10-second clock with 3 lives. Most ask which type is super-effective; some ask about immunities. A good score pays money and candy, and a perfect run earns a Rare Candy',
            'Unova\u2019s Nimbasa City hosts Voltorb Flip: a 5\u00d75 deduction board where every row and column advertises how many Voltorbs and how many points it hides. Flip the 2s and 3s to bank coins, clear a board to climb a level, and a single Voltorb ends the run',
            'Kalos\u2019s Lumiose City opens the Grand Auction House: bid against hidden rival budgets for a lot of items. The appraiser gives a value range and the rivals drop out at their own ceilings, but win the hammer and you pay whatever you bid \u2014 even over the odds',
            'Hoenn\u2019s Lilycove City runs the Pok\u00e9mon Contest: pick a move each round for four rounds, matching the contest theme and chaining two different moves of the same type for a combo while avoiding repeats, then rank against the rivals',
            'Johto\u2019s Ecruteak City hosts the Pok\u00e9athlon: three events \u2014 mash the Sprint, time the Hurdle and hit the moving Target \u2014 scored together for a gold, silver or bronze medal',
            'Sinnoh\u2019s Sandgem Town raises the Pok\u00e9 Radar: watch the grass light up, repeat the sequence and build a chain that boosts the shiny odds of a route\u2019s rarest species, with a wrong tap breaking it',
            'Alola\u2019s Heahea City hosts the Battle Royal: an endless wave gauntlet for your party that heals a little between wins, with the purse growing the deeper you get',
            'Galar\u2019s Max Lair (Hammerlocke) offers Dynamax Adventures: pick a path through three encounters, then face a legendary from Galar\u2019s raid pool \u2014 beat it to add it to your team',
            'Hoenn\u2019s Mauville City adds Lights Out: every tap toggles a tile and its four neighbours, and turning all 16 lights back on in a flawless few taps pays best',
            'Galar\u2019s Motostoke lets you cook a Curry: match the customer\u2019s flavour, then hold the fan to keep the campfire in the sweet spot while it simmers \u2014 a great curry is worth money and a full-heal Curry',
            'Unova\u2019s Virbank City runs Pok\u00e9star Studios: the director calls three shots and you pick the take that best matches each brief',
            'Johto\u2019s Goldenrod City adds the Pok\u00e9mon Puzzle League: swap adjacent tiles to line up three or more, clear them in cascades and score as much as you can in 12 swaps',
            'Hoenn\u2019s Slateport City adds Pok\u00e9mon Memory: flip cards two at a time to find all eight matching pairs, with fewer flips scoring better',
            'Kanto\u2019s Vermilion City adds Whack-a-Diglett: tap each Diglett before it ducks back down and leave the Zubat alone across a 20-second round',
            'Every minigame is now explicitly tied to its map area: the Town Map tooltip for a point of interest names the minigame based there',
          ],
        },
        {
          heading: 'Items',
          items: [
            'Held battle items are actually purchasable now: marts listed Leftovers, the Choice items, the type boosters and the rest, but the shop had no row for them, so they could never be bought',
            'Marts no longer all sell the same shelves: only the basics are common to every region, while each region has its own situational Poke Ball and handful of held battle items (the Underground still drops them all)',
            'The Sinnoh Underground now digs up those battle items too \u2014 type boosters, Choice Band / Specs / Scarf, Leftovers, Life Orb, Assault Vest, Eviolite, Focus Sash and Sitrus / Lum Berries \u2014 giving every held item a second source',
          ],
        },
        {
          heading: 'Fixes',
          items: [
            'The trainer name banner no longer overlaps the top-bar buttons during trainer battles',
          ],
        },
        {
          heading: 'Quality of Life',
          items: [
            'The Battle Tower now launches from Hoenn Route 111 itself: its opponent preview and FIGHT FLOOR button appear in the location panel, and the League tab simply points you there',
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
