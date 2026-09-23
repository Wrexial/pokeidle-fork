// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const GAME_VERSION = '0.39.0'

export const LAST_SEEN_VERSION_KEY = 'pokemon-idle-last-seen-version'

export const CHANGELOG = [
    {
      version: '0.39.0',
      subtitle: 'More Abilities',
      sections: [
        {
          heading: 'Abilities',
          items: [
            'A large batch of attacking abilities is now modelled: type specialists (Dragon\u2019s Maw, Steelworker, Transistor, Rocky Payload, Water Bubble, Adaptability), power boosts (Technician, Tough Claws, Iron Fist, Strong Jaw, Mega Launcher, Sharpness, Reckless, Sheer Force, Punk Rock, Sand Force, Solar Power, Tinted Lens, Neuroforce) and stat boosts (Hustle, Gorilla Tactics, Toxic Boost, Flare Boost)',
            'Defensive abilities now halve or amplify the right hits: Fluffy, Heatproof, Ice Scales, Fur Coat, Purifying Salt, Dry Skin and Marvel Scale join the existing Thick Fat / Multiscale / Filter set',
            'Switch-in and support abilities: Intrepid Sword, Dauntless Shield, Download, Gooey / Tangling Hair, Stamina, Mummy, Earth Eater, Pastel Veil and Mirror Armor / Full Metal Body',
            'Recovery and speed abilities: Poison Heal, Bad Dreams, Hydration, and Quick Feet / Unburden / Surge Surfer / Protosynthesis / Quark Drive for turn order',
            'Stat-shaping abilities: Contrary flips stat changes and Simple doubles them, Defiant and Competitive punish a drop, Unaware ignores the foe\u2019s stat stages, and Moxie / Chilling Neigh / Grim Neigh / Beast Boost reward a KO with a stat boost',
            'Field auras and reactions: Dark Aura and Fairy Aura boost their type (Aura Break reverses them), Trace copies the foe\u2019s ability on switch-in, and Justified / Steam Engine / Thermal Exchange / Water Compaction / Weak Armor / Anger Point reward the holder for being hit',
            'More reactions: Berserk and Anger Shell fire when a hit drops the holder below half HP, Moody shuffles stats each turn, Harvest restores a berry, Ripen doubles a berry\u2019s healing, Infiltrator ignores screens, Unseen Fist hits through Protect, and Good as Gold blocks status moves',
            'The extreme weathers are in: Desolate Land sets extremely harsh sunlight that negates Water moves, Primordial Sea sets a heavy downpour that negates Fire moves, and Delta Stream\u2019s strong winds cancel Flying-type weaknesses',
            'Type-changing abilities: Protean and Libero change the user\u2019s type to the move it is about to use, Normalize forces Normal, Liquid Voice makes sound moves Water, and the -ate family (Pixilate, Refrigerate, Aerilate, Galvanize, Dragonize) turns Normal moves into their type with a 20% boost',
            'Disguise and Ice Face absorb the first hit (Ice Face reforms in snow or hail)',
            'Global stat pressure: the Ruin quartet (Tablets of Ruin weakens physical offence, Beads of Ruin special offence, Sword of Ruin physical defence, Vessel of Ruin special defence) and Neutralizing Gas, which suppresses every other Pokemon\u2019s ability while its holder is on the field',
            'Held-item manipulation works: Trick / Switcheroo swap items, Bestow gives one away, Corrosive Gas destroys the foe\u2019s, and the Magician / Pickpocket abilities steal one on the hit or on contact',
            'A mid-battle form-change subsystem is in: Stance Change (Aegislash Blade/Shield), Zero to Hero (Palafin), Power Construct (Zygarde Complete), Schooling (Wishiwashi), Imposter (copy the foe\u2019s stats and types) and Battle Bond (Ash-Greninja). The battle sprite follows the new form, and forms revert when the Pokemon switches out',
            'More ability hooks: Rattled, Merciless (always crits a statused foe), No Guard accuracy, Defeatist, Skill Link, Serene Grace, Aftermath, Poison Touch, Scrappy (Normal/Fighting hit Ghosts), Inner Focus / Own Tempo / Oblivious (flinch / confusion / infatuation immunity), Corrosion (poisons Steel and Poison types) and Cheek Pouch',
            'Fixed a battle bug where an immune hit (a Normal move into a Ghost) could still deal 1 damage',
          ],
        },
      ],
    },
    {
      version: '0.38.12',
      subtitle: 'Type, Stat & Call Moves',
      sections: [
        {
          heading: 'Battle',
          items: [
            'Type-changing moves now work: Soak and Magic Powder replace the target\u2019s type, Reflect Type copies the foe\u2019s, and Forest\u2019s Curse / Trick-or-Treat add one \u2014 the new type drives damage, STAB and status immunity',
            'Power Swap, Guard Swap and Heart Swap trade stat changes between the battlers, and Recycle restores a consumed held item',
            'Metronome, Copycat, Mirror Move and Nature Power now call a real move (Nature Power changes with the terrain)',
          ],
        },
      ],
    },
    {
      version: '0.38.11',
      subtitle: 'Ability Swaps',
      sections: [
        {
          heading: 'Battle',
          items: [
            'Gastro Acid now suppresses the target\u2019s ability, while Worry Seed and Simple Beam replace it, Role Play copies the foe\u2019s, Entrainment shares the user\u2019s and Skill Swap trades them',
            'Ability-dependent effects (weather/terrain abilities, stat boosts) now respect a suppressed or swapped ability',
          ],
        },
      ],
    },
    {
      version: '0.38.10',
      subtitle: 'Focus & Recovery',
      sections: [
        {
          heading: 'Battle',
          items: [
            'Ingrain now heals the user a little each turn, Laser Focus guarantees the next hit is a critical, and Lock-On (and Mind Reader) make the next hit land',
            'Life Dew, Jungle Healing and Lunar Blessing now heal the user (the last two also cure status)',
          ],
        },
      ],
    },
    {
      version: '0.38.9',
      subtitle: 'Tailwind & Trick Room',
      sections: [
        {
          heading: 'Battle',
          items: [
            'Tailwind now doubles your side\u2019s Speed for four turns, so it wins the turn-order race',
            'Trick Room now reverses the speed order for five turns (and goes last), making the slower battler move first',
            'Destiny Bond takes whoever knocks the user out down with them',
          ],
        },
      ],
    },
    {
      version: '0.38.8',
      subtitle: 'Locks & Protection',
      sections: [
        {
          heading: 'Battle',
          items: [
            'Five more status moves now work: Safeguard (blocks status conditions from the opponent), Mist (blocks stat drops, including Intimidate), Encore (locks the target into its last move for three turns), Disable (blocks the target\u2019s last move) and Perish Song (both battlers faint after three turns)',
          ],
        },
      ],
    },
    {
      version: '0.38.7',
      subtitle: 'More Status Moves',
      sections: [
        {
          heading: 'Battle',
          items: [
            'Six more status moves now do something: Focus Energy (two extra critical-hit stages for the rest of the battle), Aqua Ring (heals the holder each turn), Wish (heals half the user\u2019s HP at the end of the next turn), Yawn (puts the target to sleep at the end of the next turn), Topsy-Turvy (reverses the target\u2019s stat changes) and Pain Split (averages both HP bars)',
          ],
        },
      ],
    },
    {
      version: '0.38.6',
      subtitle: 'Weather & Terrain',
      sections: [
        {
          heading: 'Battle',
          items: [
            'Weather Ball now changes type with the weather (Water in rain, Fire in sun, Rock in a sandstorm, Ice in snow) and doubles its power, and Thunder and Hurricane never miss in rain while Blizzard never misses in snow or hail',
            'Terrain synergy abilities now work: Grass Pelt raises Defense on Grassy Terrain, and Hadron Engine (which now sets Electric Terrain on entry) and Quark Drive boost offence on Electric Terrain',
          ],
        },
      ],
    },
    {
      version: '0.38.5',
      subtitle: 'Raid Islands',
      sections: [
        {
          heading: 'Raids',
          items: [
            'Raid Islands now headline a legendary every time: each region splits its pool into its legendaries and a separate, lower tier of ordinary finals (fossils, regional forms and one-off lines), so a Simisage or a fossil can no longer turn up as the island\u2019s \u201clegendary\u201d raid boss',
            'The ordinary finals still roam the island\u2019s wild table \u2014 each region\u2019s set is capped at 15 \u2014 while raid bosses and overworld roamers are drawn from the legendaries only',
          ],
        },
      ],
    },
    {
      version: '0.38.4',
      subtitle: 'Caught Indicators',
      sections: [
        {
          heading: 'Quality of Life',
          items: [
            'Wild Pokemon you have already registered now show a Pokeball badge in battle instead of a plain tick: grey for seen-only, red for caught, and gold for a shiny you have caught',
            'The same ball appears on route encounter lists and Pokedex tiles (replacing the old shiny star), so seen, caught and shiny-caught read at a glance; it stays hidden for trainer battles',
          ],
        },
      ],
    },
    {
      version: '0.38.3',
      subtitle: 'Alola Islands',
      sections: [
        {
          heading: 'Town Map',
          items: [
            "Alola is now laid out as its four separate islands \u2014 Melemele in the north-west, Akala in the north-east, Ula'ula in the south-east and Poni in the south-west \u2014 with the Pokemon League on a small plateau in the middle of the ocean between them, instead of one merged landmass",
            'Each region now settles its own map independently, so changing one region no longer nudges another region\u2019s towns and zones (Galar\u2019s and Paldea\u2019s hub positions shifted slightly to match)',
          ],
        },
      ],
    },
    {
      version: '0.38.2',
      subtitle: 'Map Terrain',
      sections: [
        {
          heading: 'Town Map',
          items: [
            "The Town Map's generated terrain is much bolder now: saturated land colours over a strong blue ocean, so you can tell at a glance where the water is, with a sandy coastline around every landmass",
            "Beaches, ports and island areas now read as land (grassy) instead of pale blue, so coastal towns no longer blend into the sea",
          ],
        },
      ],
    },
    {
      version: '0.38.1',
      subtitle: 'Quest Routes',
      sections: [
        {
          heading: 'Fixes',
          items: [
            "Daily Quest route objectives now name the region \u2014 \"Win 5 battles at Route 1 (Kanto)\" \u2014 so the same-named routes across regions are no longer ambiguous",
          ],
        },
      ],
    },
    {
      version: '0.38.0',
      subtitle: 'League Structures',
      sections: [
        {
          heading: 'League & Progression',
          items: [
            "Every region now describes its own league instead of assuming 8 gyms in order: Alola runs the island trials (Ilima through Hapu's grand trial) for Z-Crystals, Galar's endgame is billed as the Champion Cup, and Paldea's gyms can be tackled in any order",
            "Paldea's Pokemon League opens once you have all eight badges rather than demanding them in a fixed sequence, and its routes now gate on battles and catches instead of ordered badges",
            "Alola's trial captains are placed across the islands (Ilima no longer doubles up with Hapu in Iki Town), and the badge copy, records and achievements now use each region's own reward name (Z-Crystals in Alola)",
            "The side panel's Gyms tab is now the League tab, which better fits regions without gyms",
          ],
        },
      ],
    },
    {
      version: '0.37.0',
      subtitle: 'The Wild Area',
      sections: [
        {
          heading: 'Regions',
          items: [
            "Galar's Wild Area is now a proper zone: a single map node that opens a picker for Rolling Fields, Dappled Grove and Giant's Mirror, each with its own wild Pokemon table",
            "Slumbering Weald, Galar Mine and Glimwood Tangle are now real wild areas too, so Galarian and Hisuian forms like Galarian Zigzagoon, Corsola and Yamask, and Hisuian Growlithe and Voltorb, can be caught in the wild",
            "The Sword/Shield expansion areas are here as post-game zones: after beating Galar's Champion, the Isle of Armor (Fields of Honor, Soothing Wetlands, Brawlers' Cave) and the Crown Tundra (Snowslide Slope, Frigid Sea, Giant's Bed) open from Hulbury and Wyndon",
            "Galar's Raid Island shrank from 59 Pokemon to 20, because those wild areas and the DLC gave its Galarian/Hisuian forms and Slowpoke line a native source",
            "The 17 missing Gen 9 DLC Pokemon (Walking Wake through Pecharunt, including Dipplin, Poltchageist, Archaludon and Ogerpon) were added with their stats, moves, abilities, breeding data and sprites",
            "Paldea's DLC is here too: Kitakami (off Mossui Town) and the Terarium (off the Pokemon League) are post-game zones with three areas each, opening after Paldea's Champion",
            "Alola's routes now carry the Alolan forms (Rattata, Meowth, Diglett, Grimer, Geodude, Sandshrew, Vulpix) and the native species the scrape dropped, so Alola's Raid Island is down to just its 27 legendary Pokemon",
            "Area Zero is a post-game zone holding the paradox Pokemon, and Paldea's other missing wilds (Paldean Tauros, Gimmighoul, Sableye, Rotom and more) now spawn on its province routes \u2014 Paldea's Raid Island is down to its 12 legendaries",
            "Alola's routes are now grouped by island and Paldea's by province: each opens as a zone with an area picker, and an area shows as ??? until it unlocks",
            "Zones get their own map marker (a blue diamond) instead of looking like a route, and the hub no longer lists encounters it can't battle",
            "Added areas and zone hubs are settled apart from the measured towns, and each zone hub now links only to its entry point and its neighbouring zones, so Alola's and Paldea's roads are no longer an overlapping web",
            "Packed region layouts (Sinnoh, Kalos, Unova and friends) are spread out so town and route labels no longer stack on each other",
            "Battle backgrounds pick up a biome colour grade, so forests, deserts, swamps, volcanoes and tundra read differently even though they share a handful of base scenes",
            "The Town Map draws a generated terrain layer \u2014 blue water with green/brown land blobs \u2014 from each location's biome and wild types, so you can read the geography at a glance",
            "Minigames are now played on location: the Game Corner at Celadon City, the Bug Catching Contest on Route 35, the Underground at Eterna City and the Battle Tower on Route 111. The Gyms tab points you there when you are elsewhere, and each of those places carries a + badge on the Town Map",
          ],
        },
      ],
    },
    {
      version: '0.36.1',
      subtitle: 'Save Reliability',
      sections: [
        {
          heading: 'Fixes',
          items: [
            'Progress now autosaves reliably after changing the game speed, travelling to an already-visited area, or toggling a standalone option such as Auto-Catch. Those changes could previously be lost if nothing else happened to trigger a save',
            "Paldea's Elite Four now fields its real roster and types: Larry (Flying) joins in the third slot and Hassel (Dragon) moves to fourth, instead of the wrong order that ended on Academy director Clavell",
          ],
        },
      ],
    },
    {
      version: '0.36.0',
      subtitle: 'Gender Sprites',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Female Pokemon now show their female artwork where the species differs (Pikachu, Hippowdon, Unfezant, Meowstic, Indeedee and the rest) \u2014 in battle, the party and box, the stats panel, the Daycare, egg hatches and Wonder Trade',
          ],
        },
      ],
    },
    {
      version: '0.35.0',
      subtitle: 'Pok\u00e9mon Slots',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'The Kanto Game Corner is now a 3\u00d73 Pok\u00e9mon slot machine: match three along any of the 8 lines (3 rows, 3 columns and 2 diagonals) to win, with common Pok\u00e9mon paying a little and the rare faces paying a lot',
            'Symbols now use Pok\u00e9mon faces (Magikarp up to Mewtwo) instead of fruit, and the reels fake-spin and stop one at a time',
          ],
        },
      ],
    },
    {
      version: '0.34.0',
      subtitle: 'Minigame Entry',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'Entering a minigame now stops the battle in progress instead of ignoring the click, so you no longer have to spam the button while an idle battle is resolving',
          ],
        },
      ],
    },
    {
      version: '0.33.0',
      subtitle: 'Wonder Trade',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Wonder Trade now plays a short main-stage animation: the Pokemon you send and the one that arrives are shown while the rest of the game pauses',
          ],
        },
      ],
    },
    {
      version: '0.32.0',
      subtitle: 'Minigame Unlocks',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'Region minigames now unlock by reaching a place instead of beating the region Champion: Celadon City opens the Game Corner, Johto Route 35 the Bug Catching Contest, Eterna City the Underground, and Hoenn Route 111 the Battle Tower',
          ],
        },
      ],
    },
    {
      version: '0.31.0',
      subtitle: 'Minigame Screens',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'The Sinnoh Underground and the Kanto Game Corner now play out on the main stage and pause the rest of the game, just like the Bug Catching Contest',
          ],
        },
      ],
    },
    {
      version: '0.30.0',
      subtitle: 'Contest Showcase',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'The Bug Catching Contest now ends with a top-3 results podium, ranking your catches against fake rival bug catchers by total base stats',
            'Placing in the contest top three now pays a cash and candy prize \u2014 and there is a small participant reward if you do not place',
            'Every Bug-type Pokemon \u2014 legendaries included \u2014 can now appear in the contest. Non-legendary bugs have been cleared out of the Raid Islands since the contest now covers them, while the legendary bugs stay on their islands too',
          ],
        },
      ],
    },
    {
      version: '0.29.0',
      subtitle: 'Tower Puzzles',
      sections: [
        {
          heading: 'Battle Tower',
          items: [
            'The Battle Tower no longer auto-climbs: clearing a floor returns you to the panel, so each puzzle floor can be tackled deliberately',
            'Losing a floor keeps you on it \u2014 build a new team and retry instead of replaying the whole climb',
          ],
        },
      ],
    },
    {
      version: '0.28.0',
      subtitle: 'Bug Catching Rework',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'The Johto Bug Catching Contest now plays out on the main stage and pauses the rest of the game while it runs',
            'Rustle one of three bushes to scare out a bug, then throw a free (unlimited) Net Ball or let it go. You get 5 rustles per run; each bug shows its level and gender, and the rarer bugs may flee after a missed throw',
          ],
        },
      ],
    },
    {
      version: '0.27.0',
      subtitle: 'Game Corner',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'Kanto now has the Game Corner: once its Champion is beaten, the Gyms tab opens the slots. Spin for $200 a go and match all three reels \u2014 the Star jackpot pays 1,500x',
          ],
        },
      ],
    },
    {
      version: '0.26.0',
      subtitle: 'Bug Catching Contest',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'Johto now has its own minigame: once its Champion is beaten, the Gyms tab runs the Bug Catching Contest. Pay $800 and search the park \u2014 keep the bug you like before your searches run out, and rarer (higher-scoring) bugs win bigger cash and candy prizes',
          ],
        },
      ],
    },
    {
      version: '0.25.0',
      subtitle: 'Sinnoh Underground',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'The first region minigame is in: once Sinnoh\u2019s Champion is beaten, its Gyms tab offers the Underground. Pay $1,500 for a run, then dig a wall for evolution stones, treasures and candies \u2014 you get ten digs to find as much as you can',
            'Other regions will get their own minigames instead of a Battle Tower',
          ],
        },
      ],
    },
    {
      version: '0.24.0',
      subtitle: 'Move Tutor',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'The Manage Moves panel now has a Move Tutor: it lists the TMs each Pokemon can learn (its real machine move set from the newest game), taught for $4,000 each. Level-up moves remain free',
          ],
        },
      ],
    },
    {
      version: '0.23.0',
      subtitle: 'Nuzlocke Mode',
      sections: [
        {
          heading: 'Challenges',
          items: [
            'Added a Nuzlocke challenge toggle in Settings: when a party Pokemon faints it is released for good (your last Pokemon is always spared, so a full wipe can\u2019t brick the save)',
          ],
        },
      ],
    },
    {
      version: '0.22.0',
      subtitle: 'Battle Polish',
      sections: [
        {
          heading: 'Moves',
          items: [
            'Haze and Clear Smog now reset stat stages \u2014 Haze clears both sides, Clear Smog just the target',
            'Contact abilities now trigger: Static (paralysis), Flame Body (burn), Poison Point (poison), Effect Spore (a random status), Cute Charm (infatuation), and Rough Skin / Iron Barbs (recoil on the attacker)',
            'Critical-hit pass: the base rate is now the modern 1/24 (was 1/16), Super Luck adds a crit stage, Sniper makes crits deal 2.25\u00d7 and Battle Armor / Shell Armor block crits entirely',
            'Never-miss damaging moves (zero listed accuracy \u2014 e.g. Smart Strike) now always hit, and Clear Smog / Ivy Cudgel got their correct accuracy back',
          ],
        },
      ],
    },
    {
      version: '0.21.0',
      subtitle: 'Attract & Curse',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Attract now infatuates an opposite-gender target, which then has a 50% chance to be too lovestruck to move (fails on genderless or same-gender Pokemon)',
            'Curse now works: a Ghost-type pays half its HP to put a draining curse on the foe, while any other type raises its Attack and Defense but lowers its Speed',
            'The auto-battler and trainers stop using setup moves once the relevant stat is already boosted, instead of spamming Swords Dance',
          ],
        },
      ],
    },
    {
      version: '0.20.0',
      subtitle: 'Terrain',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Terrain is live: Electric, Grassy, Misty and Psychic Terrain (from their moves, or Electric/Grassy/Misty/Psychic Surge on entry) last five turns',
            'Grassy Terrain heals grounded Pokemon and softens Earthquake, Electric Terrain blocks sleep and boosts Electric moves, Misty Terrain blocks status and halves Dragon damage, and Psychic Terrain blocks priority moves and boosts Psychic moves \u2014 the boosts only apply to grounded attackers/targets',
            'A badge at the top of the battle shows the active terrain and turns left',
          ],
        },
      ],
    },
    {
      version: '0.19.0',
      subtitle: 'Deterministic Battle Tower',
      sections: [
        {
          heading: 'Battle Tower',
          items: [
            'Every floor is now a fixed puzzle: the opponent roster is seeded from the floor number, so floor 7 is always the same six Pokemon',
            'Tower battles run without luck \u2014 no critical hits, no misses and no damage variance \u2014 so the outcome comes down to your team\u2019s stats, types, abilities, moves and held items',
            'The Gym panel previews the next floor\u2019s opponents (hover for their level, types, ability and item) so you can build a counter before committing to the run',
          ],
        },
      ],
    },
    {
      version: '0.18.0',
      subtitle: 'Entry Hazards',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Stealth Rock, Spikes, Toxic Spikes and Sticky Web now work: they are set on the opposing side and hit Pokemon as they switch in (trainer battles send out up to six)',
            'Stealth Rock scales with the Rock weakness, Spikes get stronger with each layer, Toxic Spikes poison or badly poison (Poison types absorb them) and Sticky Web lowers Speed \u2014 Flying types and Levitate avoid the grounded hazards',
            'The AI sets hazards when it has them',
          ],
        },
      ],
    },
    {
      version: '0.17.1',
      subtitle: 'Taunt & Substitute',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Taunt now stops the target using status moves for three turns',
            'Substitute costs 25% max HP and then soaks up damage and blocks status moves until it breaks',
          ],
        },
      ],
    },
    {
      version: '0.17.0',
      subtitle: 'Weather',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Weather is live: Rain Dance, Sunny Day, Sandstorm, Snowscape/Hail now set a five-turn field effect, and Drizzle, Drought, Sand Stream and Snow Warning set it on entry',
            'It matters: rain boosts Water and weakens Fire (sun the reverse), Swift Swim / Chlorophyll / Sand Rush / Slush Rush double Speed, sandstorm and hail chip non-immune Pokemon each turn, and Rain Dish / Dry Skin / Ice Body heal from it',
            'A badge at the top of the battle shows the active weather and turns left',
          ],
        },
      ],
    },
    {
      version: '0.16.1',
      subtitle: 'Hoenn Battle Tower',
      sections: [
        {
          heading: 'Fixes',
          items: [
            'The Battle Tower is now Hoenn-only. A run in progress no longer follows you to another region, and floors cleared elsewhere no longer credit that region\u2019s record',
            'Saves are repaired on load: legacy per-region tower records are consolidated into Hoenn\u2019s best, and a run started outside Hoenn is discarded. Other regions will get their own minigames later',
          ],
        },
      ],
    },
    {
      version: '0.16.0',
      subtitle: 'Held Items',
      sections: [
        {
          heading: 'Items',
          items: [
            'Pokemon can hold items again: the Bag has a Held Items tab, bought from marts as you win battles, and the stats panel shows what a Pokemon is holding (with a Take button)',
            'First effects are live: Leftovers, Life Orb, Choice Band / Specs / Scarf, Assault Vest, Eviolite, Focus Sash, Sitrus Berry, Lum Berry and the 18 type-boosting items',
            'Wild and trainer Pokemon can hold items too, so the mechanics cut both ways',
          ],
        },
      ],
    },
    {
      version: '0.15.0',
      subtitle: 'Abilities',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Every Pokemon now has one of its real abilities (fetched from PokeAPI), shown in the stats panel; the hidden ability has a small chance of being rolled',
          ],
        },
        {
          heading: 'Battles',
          items: [
            'A first set of abilities is now active: Levitate plus the type-absorbing abilities (Water/Volt Absorb, Flash Fire, Sap Sipper, Lightning Rod, Storm Drain, ...), Thick Fat, Multiscale/Shadow Shield, Filter/Solid Rock/Prism Armor, Huge Power/Pure Power, Guts, Overgrow/Blaze/Torrent/Swarm, Sturdy, Intimidate, Wonder Guard and Magic Guard',
            'Status- and stat-blocking abilities work too: Immunity, Limber, Water Veil, Insomnia/Vital Spirit, Sweet Veil, Clear Body, White Smoke, Hyper Cutter, Big Pecks and Keen Eye; Speed Boost and Shed Skin trigger at the end of each turn',
          ],
        },
      ],
    },
    {
      version: '0.14.0',
      subtitle: 'Accuracy, Evasion & Leech Seed',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Accuracy and evasion stat stages now work, so Sand Attack, Flash, Smokescreen, Double Team, Minimize, Sweet Scent and friends actually change the hit chance',
            'Leech Seed now drains 1/8 of the target\u2019s max HP into the planter each turn (Grass types are immune)',
            'Fixed Snowscape, which was extracted with a stray \u201craise the opponent\u2019s Defense\u201d effect',
          ],
        },
      ],
    },
    {
      version: '0.13.0',
      subtitle: 'Situational Poke Balls',
      sections: [
        {
          heading: 'Catching',
          items: [
            'Added eight situational balls: Quick (x5 on a one-turn battle), Timer (up to x4 the longer the fight), Repeat (x3.5 on species already in your Pokedex), Net (x3.5 on Water/Bug types), Dive (x3.5 on water routes), Dusk (x3 in caves or at night), Nest (better on low-level targets) and Premier (standard)',
            'Auto-catch now picks the ball with the best catch rate for the situation, and the catch-settings ball picker and marts include the new balls (unlocked as you win more wild battles)',
          ],
        },
      ],
    },
    {
      version: '0.12.0',
      subtitle: 'Friendship',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Every Pokemon now has a friendship value, shown as a \u2665 badge in the stats panel, that rises when it levels up or wins wild battles',
            'Friendship evolutions that were modelled as plain level-ups now need friendship 160 instead: Golbat \u2192 Crobat, Chansey \u2192 Blissey, Pichu \u2192 Pikachu, Cleffa/Igglybuff, Togepi, Azurill, Budew, Buneary, Chingling, Munchlax, Riolu, Woobat, Swadloon, Snom, Type: Null, and Eevee\u2019s Espeon / Umbreon / Sylveon',
          ],
        },
      ],
    },
    {
      version: '0.11.2',
      subtitle: 'Screens',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Reflect and Light Screen now work: they halve physical / special damage for five turns (critical hits ignore them), and Aurora Veil raises both at once',
          ],
        },
      ],
    },
    {
      version: '0.11.1',
      subtitle: 'Status Effects',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Added paralysis (halves Speed and has a 25% chance to stop a move), badly poisoned / toxic (damage grows each turn) and confusion (may hurt itself)',
            'Status moves that previously did nothing now work \u2014 Thunder Wave, Glare, Stun Spore, Toxic, Poison Powder, Will-O-Wisp, Sing / Sleep Powder / Spore / Hypnosis, Confuse Ray and friends \u2014 and damaging moves such as Body Slam, Thunderbolt and Nuzzle can paralyse',
          ],
        },
      ],
    },
    {
      version: '0.11.0',
      subtitle: 'Battle Depth',
      sections: [
        {
          heading: 'Moves',
          items: [
            'Healing moves (Recover, Roost, Synthesis, Rest, \u2026) now actually restore HP',
            'Multi-hit moves (Bullet Seed, Icicle Spear, Rock Blast, \u2026) strike 2\u20135 times, and high-crit moves (Slash, Stone Edge, Night Slash, \u2026) now have their raised critical-hit rate',
            'Protect, Detect, King\u2019s Shield and friends now block attacks, with +4 priority',
            'Calm Mind now raises Sp. Atk / Sp. Def (it was raising Attack / Defense), the G-Max moves deal physical/special damage as intended, and priority was corrected for Extreme Speed, Fake Out, Feint and Water Shuriken',
          ],
        },
        {
          heading: 'Battle AI',
          items: [
            'Your auto-battler and trainers now heal when low and set up stat boosts early instead of only ever choosing the strongest attack',
          ],
        },
      ],
    },
    {
      version: '0.10.1',
      subtitle: 'Master Ball Discipline',
      sections: [
        {
          heading: 'Battles',
          items: [
            'The Master Ball throw button now only appears for legendary Pokemon, or for a hard-to-catch species you have never registered \u2014 ordinary wild battles no longer advertise it',
          ],
        },
      ],
    },
    {
      version: '0.10.0',
      subtitle: 'Breeding Inheritance & Shiny Hunting',
      sections: [
        {
          heading: 'Daycare',
          items: [
            'Eggs now inherit 3 of the parents\u2019 best IVs, a 50% chance of a parent\u2019s nature, and any of the parents\u2019 moves the hatchling can learn',
          ],
        },
        {
          heading: 'Shiny Hunting',
          items: [
            'Honey and Repel now lock in a DexNav hunt: once a chain reaches 4, Honey heavily favours the hunted species and Repel keeps every other species away \u2014 the encounter list shows the real, boosted odds and a \u201cHunt locked\u201d badge',
          ],
        },
        {
          heading: 'Battle Tower',
          items: [
            'Tower runs now auto-climb: a win heals your team and immediately starts the next floor, so a run only ends when you lose',
            'Floors field six fully evolved Pokemon and hit harder \u2014 stats start scaling at floor 15 and legendaries appear from floor 40 \u2014 but now pay 1 Victory Token every 10 floors',
          ],
        },
      ],
    },
    {
      version: '0.9.30',
      subtitle: 'Slower Egg Hatching',
      sections: [
        {
          heading: 'Daycare',
          items: [
            'Eggs now take longer to hatch \u2014 30 to 120 wild wins depending on the species (previously 8 to 40)',
          ],
        },
      ],
    },
    {
      version: '0.9.29',
      subtitle: 'Egg Ticking & Secrecy',
      sections: [
        {
          heading: 'Fixes',
          items: [
            'All Eggs in the party now count down together (previously only one progressed at a time)',
            'Egg sprites never reveal what is inside: every egg uses the same generic sprite, and the box search/filters can no longer surface a hidden shiny or species',
          ],
        },
      ],
    },
    {
      version: '0.9.28',
      subtitle: 'Eggs You Carry',
      sections: [
        {
          heading: 'Daycare',
          items: [
            'Breeding now gives you an Egg to collect rather than hatching it instantly. Carry it in your party and win wild battles to hatch it \u2014 the number needed depends on the species (8\u201340)',
            'Eggs occupy a party slot, cannot battle, and show their remaining steps in the party and box; hatching then shows the hatchling\u2019s stats, IVs and nature',
          ],
        },
      ],
    },
    {
      version: '0.9.27',
      subtitle: 'Hatch Details',
      sections: [
        {
          heading: 'Daycare',
          items: [
            'The egg-hatch popup now shows the hatchling\u2019s stats, IVs (with a judge) and nature, so you can decide whether to keep or quick-release it',
          ],
        },
      ],
    },
    {
      version: '0.9.26',
      subtitle: 'Offline Progress',
      sections: [
        {
          heading: 'Idle',
          items: [
            'The game now pays out for time away: returning after a minute or more grants money and Exp. Candies, scaling with your party level and capped at 8 hours',
            'A \u201cWhile You Were Away\u201d report shows how long you were gone and what you earned',
          ],
        },
      ],
    },
    {
      version: '0.9.25',
      subtitle: 'Box Search Fix',
      sections: [
        {
          heading: 'Fixes',
          items: [
            'Collapsing the box search now clears the query and filter, so the box is never left filtered with the search controls hidden',
          ],
        },
      ],
    },
    {
      version: '0.9.24',
      subtitle: 'Larger Text',
      sections: [
        {
          heading: 'Settings',
          items: [
            'A "Larger Text" toggle in Settings scales the whole UI up by 15% (like browser zoom) for readability',
          ],
        },
      ],
    },
    {
      version: '0.9.23',
      subtitle: 'Challenge Modes',
      sections: [
        {
          heading: 'Challenge Modes',
          items: [
            'New optional hard-mode toggles in Settings: Randomizer rolls a random species on every wild encounter, and Level Scaling makes wild Pokemon match your active Pokemon\u2019s level so you cannot out-level content',
          ],
        },
      ],
    },
    {
      version: '0.9.22',
      subtitle: 'Collapsible Box Search',
      sections: [
        {
          heading: 'Box',
          items: [
            'The box search field and filters now hide behind a Search button (which stays highlighted while a search is active)',
            'Fixed dragging a Pokemon from a filtered box into the party',
          ],
        },
      ],
    },
    {
      version: '0.9.21',
      subtitle: 'Rarer Pokerus & Heart Polish',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Pok\u00e9rus is now much rarer \u2014 1 in 10,000 wild wins instead of 1 in 1,000',
            'The favourite heart in the stats panel now matches the Manage and Close buttons beside it',
          ],
        },
      ],
    },
    {
      version: '0.9.20',
      subtitle: 'Release Duplicates',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'A "Release Dupes" tool in the box releases duplicate Pokemon \u2014 keeping your best of each species and protecting favourites and shinies \u2014 and pays out the usual release rewards',
          ],
        },
      ],
    },
    {
      version: '0.9.19',
      subtitle: 'Favourite Hearts',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Favourites now use a heart instead of a star, so they no longer look like the shiny marker',
            'The stats-panel favourite toggle is now a clear chip (with a filled red heart when active) instead of a faint outline',
          ],
        },
      ],
    },
    {
      version: '0.9.18',
      subtitle: 'Nicknames & Box Search',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Give any Pokemon a nickname from the stats panel (up to 12 characters); nicknames show in the party, battle and Daycare',
            'The box has a search field plus All / Shiny / Fav filters to narrow the grid (drag-reordering pauses while searching)',
          ],
        },
      ],
    },
    {
      version: '0.9.17',
      subtitle: 'IV Judge & Favourites',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'The stats panel now shows a Pokemon\u2019s IVs with an in-game-style judge \u2014 six stat chips plus an overall verdict (Decent \u2192 Wonderful)',
            'Star a Pokemon to favourite it; favourites are protected from Release and Wonder Trade',
          ],
        },
      ],
    },
    {
      version: '0.9.16',
      subtitle: 'Dex Celebration & Sound On',
      sections: [
        {
          heading: 'Pokedex',
          items: [
            'Completing a region\u2019s national dex now plays a full-screen celebration \u2014 badge, confetti and fanfare \u2014 that pauses the game before granting the reward',
          ],
        },
        {
          heading: 'Audio',
          items: [
            'Sound effects are now on by default (music is still off); the browser unlocks audio on your first click',
          ],
        },
      ],
    },
    {
      version: '0.9.15',
      subtitle: 'Form-Change Items',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Reversible form changes now use their canonical, reusable items \u2014 Rotom Catalog, Griseous Orb, Gracidea, Meteorite, Reveal Glass, DNA Splicers, Zygarde Cube, Prison Bottle, N-Solarizer / N-Lunarizer / Ultranecrozium Z, Rusted Sword / Rusted Shield and Reins of Unity \u2014 sold in the Reward Shop',
            'These items are never consumed, so you can switch formes back and forth freely',
          ],
        },
      ],
    },
    {
      version: '0.9.14',
      subtitle: 'Daily Quests',
      sections: [
        {
          heading: 'Quests',
          items: [
            'Three daily quests now appear each day from the \ud83d\udcdc button in the battle top bar, drawn from the routes and species you can reach \u2014 win wild battles, battle on a specific route, catch a type or species, or catch a shiny',
            'Each pays money, Victory Tokens or items when claimed; progress bars track them and the button pulses when a reward is ready',
          ],
        },
      ],
    },
    {
      version: '0.9.13',
      subtitle: 'Optional Audio',
      sections: [
        {
          heading: 'Audio',
          items: [
            'Optional synthesized audio, off by default: a looping chiptune theme for each region plus sound effects for catches, evolutions, level-ups and other big moments',
            'Turn Music and Sound Effects on separately under Settings \u2192 Audio (the first click unlocks the browser\u2019s audio)',
          ],
        },
      ],
    },
    {
      version: '0.9.12',
      subtitle: 'Accessibility Options',
      sections: [
        {
          heading: 'Settings',
          items: [
            'New Accessibility options: force Reduced Motion (overrides the OS setting) and turn on Move Type Labels, which print each move\u2019s type so it is not conveyed by colour alone',
          ],
        },
      ],
    },
    {
      version: '0.9.11',
      subtitle: 'Combat Feedback',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Damage now pops as a floating number above the hit Pokemon, and the sprite shakes on impact',
            'Both effects respect the browser\u2019s reduced-motion setting',
          ],
        },
      ],
    },
    {
      version: '0.9.10',
      subtitle: 'Pokerus',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'A very rare Pokerus can infect your party after a wild win \u2014 it doubles EXP gain for 150 battles before it cures',
            'An infected party shows a PKRS badge on each party slot and on the stats panel, with the battles remaining on hover',
          ],
        },
      ],
    },
    {
      version: '0.9.9',
      subtitle: 'Nature Clarity & Panel Polish',
      sections: [
        {
          heading: 'Pokemon',
          items: [
            'Natures now show exactly what they do: the stats panel names the nature and marks the stat it raises (green \u25b2) and the one it lowers (red \u25bc), both on a badge and beside the affected stats',
            'The stats panel scrolls instead of clipping when a Pokemon\u2019s details are taller than the panel',
          ],
        },
      ],
    },
    {
      version: '0.9.8',
      subtitle: 'Notifications & Away Alert',
      sections: [
        {
          heading: 'Notifications',
          items: [
            'An opt-in setting now mirrors key events (shinies, new Pokedex entries, badges, raids and rare finds) to a browser notification while the tab is in the background',
            'Returning after the tab has been hidden for a while shows a \u201cwhile you were away\u201d summary of battles, new species, shinies and money',
          ],
        },
      ],
    },
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
