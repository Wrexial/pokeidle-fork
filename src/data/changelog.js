// Split from src/data/constants.js — see tools/decompile/split-module.mjs

export const GAME_VERSION = '0.23.0'

export const LAST_SEEN_VERSION_KEY = 'pokemon-idle-last-seen-version'

export const CHANGELOG = [
    {
      version: '0.23.0',
      subtitle: 'World, Trainers & Collection',
      sections: [
        {
          heading: 'Regions',
          items: [
            'The former ordinary Raid Island finals now live as wild encounters on routes that suit them — Johto\'s Natu and Unown, Hoenn\'s Mawile, Sinnoh\'s Aipom and Spiritomb, Unova\'s elemental monkeys and cave lines, Kalos\'s Carbink and Pumpkaboo, Galar\'s Indeedee-F, and Kanto\'s Jynx — instead of one-off "Rare Pokemon" statics bolted onto each region\'s last route',
            'Baby Pokemon are no longer planted in the wild to fill out the former raid roster: Cleffa, Smoochum and Magby are hatched by breeding their evolved forms, and Togepi still comes from Mr. Pok\u00e9mon\'s egg. Beldum and Porygon likewise come from Steven\'s gift and the Game Corner',
            'Riolu, Toxel and Munchlax are no longer one-off gifts or statics: catch their wild pre-evolutions (Kalos Route 22, Galar Route 7, Alola Route 1), evolve them into the breedable parents and hatch more. The Incense-only babies (Munchlax, Budew, Chingling, Bonsly, Mime Jr., Happiny, Mantyke, Wynaut) still hatch without the held item',
            'Hoenn’s Route 102 now has the missing Slakoth base form as a rare wild encounter',
            'The Galarian birds — Galarian Articuno, Zapdos and Moltres — are legendary Raid Island bosses again, instead of being filed among the ordinary one-off refuge encounters',
            'Raid Islands hand out their legendaries as a ladder now: a fresh island leans toward the minor legendaries and a completed (or prestiged) one toward the box legendaries, weighted by the region\u2019s badges, Champion and prestige instead of a flat random pick',
            'Alola runs its real league track now — 11 Z-Crystals (7 island trials + 4 grand trials) instead of 8. Hala, Olivia and Nanu join as grand-trial island kahunas, the trials are ordered by island (each needs the previous Z-Crystals), and Mina and Hapu hold Poni Island. The league wants all 11',
            'Kanto now goes through the same generation passes as the other regions for its wild encounters, gym/league teams and leader art: its routes are re-levelled and topped up, its Gym Leaders, Elite Four and Champion field rebuilt type-themed teams, and its leaders use current-gen sprites instead of the gen3 art. Its hand-curated map, route connections and gym ids are unchanged',
            'Galar\u2019s post-game Champion Cup rematch is labelled as the post-game tournament on the league panel',
            'Steven’s post-Champion Beldum gift is available at his house in Mossdeep City once you have beaten the Hoenn Champion',
            'Mr. Pok\u00e9mon on Johto\u2019s Route 30 now hands over the canonical Togepi Egg once you have a Johto badge; carry it in the party and battle to hatch it',
            'The Lake of Rage’s red Gyarados is a one-off guaranteed-shiny static on Johto Route 43 (after the seventh badge); it stays put until you catch it',
            'Minigames can gate routes now: Kanto’s Route 11 opens after a Whack-a-Diglett score of 15, Johto’s Route 36 after clearing the Bug-Catching Contest, and Paldea’s South Province (Area Three) after scoring 4 in the Academy Quiz. A locked route lists the current / best score and links to the minigame’s home area',
            'The world runs on a fixed day/night cycle now: one full day every 60 real minutes (dawn, day, dusk, night), independent of the wall clock. The Town Map header shows the current phase, the battle background is tinted to match, and the Dusk Ball keeps its night bonus',
            'The day/night cycle changes what you find: clearly nocturnal and diurnal species are tagged on the wild tables, so the night shift brings Hoothoot, Murkrow, Duskull and their kin out while the day brings Pidgey, Pikachu, Caterpie and friends. A route’s wild grid and the offline encounter index mark the phase, and a route falls back to its full table if a phase would otherwise be empty',
            'A handful of thematically weather-struck routes now start every battle under a permanent field weather — Hoenn Route 119 rains, the Hoenn and Unova deserts blow a sandstorm, and the Sinnoh, Galar and Kalos snow routes drive snow',
            'Every route and town now carries a proper biome (forest, autumn, desert, swamp, volcanic, tundra, ruins, or the base grassland / coast / mountain / cave), read from its name and its wild table, so the painted battle scenes show up across all nine regions and the Town Map shades each area to match. The Dive Ball and Dusk Ball bonuses and berry foraging key off the biome too, so a coast or ruin is recognised even when its name does not give it away',
            'The Town Map got a readability pass: town and area/zone names stay on screen instead of appearing only on hover, a zone hub shows how many sub-areas it holds on its marker, and a legend (the ⓘ button) explains every node type',
            'Routes feel less repetitive: every route that only had a handful of species now also rolls other Pokemon already wild elsewhere in the same region, matched to the route\u2019s level and dominant types, so most routes offer up to around sixteen different finds. Starter lines, breed-only babies, Raid Island rosters and route-exclusive catch targets are left alone',
            'Snowpoint Temple now opens with a Strength chamber: push the boulder onto the pressure plate to unseal the exit before the ice rooms',
            'Locations are labelled by their real kind now — Cave, Forest, Sea Route, Mountain, Desert, Volcanic, Tundra, Ruins — instead of calling every wild stop a \u201cRoute\u201d, and a zone hub can show each open sub-area\u2019s wild Pokemon behind a “Show wild Pokemon” toggle so its habitats can be compared without travelling into each one',
            'Galar\u2019s Wild Area is complete: Stony Wilderness, Dusty Bowl, Lake of Outrage, Bridge Field, Giant\u2019s Seat, Hammerlocke Hills, North Lake Miloch and East Lake Axewell join Rolling Fields, Dappled Grove and Giant\u2019s Mirror as its eleven habitats, each with its own wild table',
            'The DLC areas are their own regions now: the Galar Expansion Pass (Isle of Armor, Crown Tundra) and the Paldea DLC (Kitakami, the Terarium) each get a Town Map tab, their own map and level band, and a legendary Raid Island, and open automatically once their parent region\u2019s Champion is beaten — no Unlock Token needed. Their legendaries moved off the base region\u2019s Raid Island onto their own',
            'Seventy-six landmarks the map scraper used to drop are real wild areas now, each with its own wild table — caves, forests, ruins, towers and lakes across Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar and Paldea, from Ilex Forest and the Ruins of Alph to the Safari Zones, Stark Mountain, Dragonspiral Tower, Lush Jungle and Casseroya Lake',
          ],
        },
        {
          heading: 'Trainers',
          items: [
            'Town trainers are far more varied: 50 trainer classes instead of 12 — from Fisherman, Bird Keeper and Picnicker to Lady, Rich Boy, Nurse, Policeman, Musician and Medium — each with their own type theme, class-appropriate names drawn from a much larger pool with no repeats inside a region, two to four trainers per town rather than always three, and Ace Trainers, Cooltrainers and Scientists fielding larger squads',
            'Route trainers in every region \u2014 Kanto included \u2014 field a much wider slice of that region\u2019s own Pokemon now: the class\u2019s type is a bias rather than a filter, teams are stepped to the form that could exist at their level, and every evolution line turns up on at least one trainer (each town also fields a couple of extra trainers for headroom), so the Pokedex \u201cseen\u201d log fills in as you battle',
            'Gym, Elite Four and Champion teams were rebuilt on the same pass with more distinct species instead of repeated copies, and gym teams grow from three members to five as the badges add up',
          ],
        },
        {
          heading: 'Battles',
          items: [
            'Damaging moves can now carry two effects at once: Flare Blitz still recoils and can burn, Volt Tackle recoils and can paralyse, the elemental fangs can inflict their status and flinch, and Triple Arrows can lower Defense and flinch on the same hit',
            'Recharge moves force a lost turn again — Hyper Beam, Giga Impact, Rock Wrecker, Roar of Time, Blast Burn, Hydro Cannon, Frenzy Plant, Prismatic Laser, Eternabeam and Meteor Assault. The recharge flag had been lost when the move data was rebuilt',
            'Many damaging moves regained the secondary effects the extraction missed: Thunder and Thunder Punch can paralyse, Psychic, Crunch, Bug Buzz, Focus Blast, Earth Power, Energy Ball, Moonblast, Play Rough, Iron Tail, Rock Smash, Liquidation, Aurora Beam, Shadow Ball, Flash Cannon and Seed Flare drop a stat, Muddy Water, Octazooka and Mirror Shot drop accuracy, and Metal Claw, Charge Beam, Meteor Mash, Fiery Dance, Diamond Storm, Ancient Power, Silver Wind and Ominous Wind can raise the user\u2019s own stats',
            'Fake Out only flinches on the user\u2019s first turn on the field, so it can no longer lock a foe down every turn; Poison Fang now badly poisons instead of plain poisoning; and Esper Wing raises Sp. Atk rather than Speed',
            'Weather now plays out on the battlefield itself: rain streaks, a drifting sandstorm, falling snow or hail, a pulsing sun glare and sweeping strong winds move across the scene behind the combatants (they disappear when reduced motion is on)',
          ],
        },
        {
          heading: 'Minigames',
          items: [
            'Whack-a-Diglett speeds up as the round runs down (targets stay up for less time) and adds a rare Dugtrio jackpot worth 5 points on top of the Diglett and Zubat',
            'The Game Corner slots have a prize track: every winning line fills a 20-step bar, and a full bar hands over a random Game Corner prize Pokemon — Scyther, Dratini or Porygon',
            'Dynamax Adventures now open with a scout: pick — or re-roll — one of three legendaries from the Max Lair\u2019s real raid pool before the run. Each cleared stage drops a pickup (Max Honey, Revive or Full Restore), and the run ends early if you rack up too many KOs; beating the legendary also awards a Nature Mint',
            'The Battle Royal is a proper 4-way round now: your Pokemon faces the other three participants (one at a time) and is placed 1st (all three beaten) down to 4th, a cleared round heals the party, and a rank ladder (Normal \u2192 Great \u2192 Ultra \u2192 Master \u2192 Royal) plus your best-ever run is tracked. A 25-win run pays a Nature Mint',
            'The Poke Radar now guarantees shinies: each chain level counts toward a target that starts at 5, so the chained species is shiny at 5, then 10, then 15 levels. Catching (or beating) it banks the shiny, resets the chain and raises the next target by 5',
            'The Poke Pelago companion panel is an interactive buddy stage now: your companion bobs on its mat, shows a mood — happy, hungry, bored, sleepy or mucky — and taps (or care actions) throw up a little reaction',
            'The Ruins of Alph puzzle finally hands over an Unown: every solve unearths a random form you are missing (and a random repeat once the set is complete), and the full 28-form set — A–Z, ! and ? — now exists with its own sprites and Hidden Power kit',
            'Snowpoint Temple is different every visit: each run rolls its Strength chambers from four hand-designed layouts and its ice rooms from eight hand-designed rooms plus fresh procedurally generated ones (every generated room is checked to be solvable and trap-free), and higher Sinnoh prestige adds an extra ice room; the flawless-move bonus scales to the rooms you actually drew',
            'Pokemon Musical can be played with the keyboard: the arrow keys hit the matching lane (left/down/up/right)',
          ],
        },
        {
          heading: 'Items',
          items: [
            'Bottle Caps hyper-train a party Pokemon: a Bottle Cap caps its lowest IV at 31 and a Gold Bottle Cap caps every IV. Both are endgame-minigame rewards — a Bottle Cap at 15 Battle Royal waves or a Dynamax Adventures boss, and a Gold Bottle Cap from a 20-wave Battle Royal — and hyper-trained IVs are never passed down by breeding',
            'Fossils are a proper loop now: each region hands out its fossil items (Kanto at Mt. Moon, Hoenn in the Route 111 desert, the rest on their late routes), the Sinnoh Underground can dig up more, and the Cinnabar Island lab revives a fossil into its Pokemon at Lv. 30',
            'The revived fossils evolve into the finals that used to sit on the ordinary Raid Island — Omastar, Kabutops, Aerodactyl, Cradily, Armaldo, Rampardos, Bastiodon, Carracosta, Archeops, Tyrantrum, Aurorus and the four Galar fossils',
            'The Grand Auction House is now the main source of battle held items: marts no longer sell type boosters or competitive items, and the auction’s lots are held-item bundles (Choice items, Leftovers, Life Orb, Eviolite, boosters, Mega Stones). You also pick how hard to raise (\u00d71/\u00d72/\u00d74) \u2014 a bigger jump can win the lot before a rival answers, but costs more \u2014 and the rivals\u2019 reactions are shown as they drop out',
            'The new Terrain Extender stretches the holder’s terrain from 5 turns to 8, in the same spirit as the weather rocks. It is sold in the Reward Shop and can turn up in a Grand Auction House lot',
            'The Poke Ball Factory pays out more balls per shift (3, 5 or 8 depending on the solve) and only ever the special balls marts don’t sell',
          ],
        },
        {
          heading: 'Fixes',
          items: [
            'The player guide now lists the correct shiny odds: base odds are 1 in 4,096 and the per-generation Shiny Charm runs from 1 in 2,048 for the first completed generation to 1 in 256 when all nine are done (it still said 1 in 8,192), and swarms last 256 battles rather than 50',
            'A location whose name contains "fall" \u2014 a waterfall route, or Fallarbor Town \u2014 no longer makes the battle background tint as if it were autumn',
            'The guaranteed shiny is now Poke Radar-only: a run of ordinary wild encounters builds the odds multiplier again (1\u00d7 / 2\u00d7 / 3\u00d7 / 4\u00d7 at 40 / 80 / 120 in a row) but no longer forces a shiny, and a lucky ordinary shiny no longer raises the radar\u2019s next guaranteed-shiny target',
            'Alola and Paldea are playable again: starting in one (or opening it with an Unlock Token) now unlocks the entry island/province hub and its first area, instead of stranding the player because the hub asked for a Pokedex count they had no route to reach',
            'The Town Map no longer renders blank when you stand on a hidden zone sub-area (starting in Alola or Paldea): the camera focuses the entry island/province hub instead of empty space between nodes, so the map stays navigable',
            'Locked zone areas (Alola\u2019s islands, Paldea\u2019s provinces) now spell out what they still need \u2014 e.g. \u201c3/8 Battles at Route 1 \u00b7 9/11 Team level\u201d \u2014 instead of an unexplained \u201c???\u201d, and they now appear in the Next Unlocks list; travel checks the live unlock state, so a loaded save can no longer strand an area whose gate is already met',
            'Wild encounters and trainer teams no longer field a Pokemon below the level it could evolve at: a Lv. 3 Chesnaught or a Lv. 7 Machamp is stepped back to a form that can exist at that level. The Alola Route 3 gate now asks for an Alolan Sandshrew or Alolan Vulpix (which do spawn there) instead of a Salamence that no longer appears',
            'Route-exclusive catch gates now list every exclusive on the route and ask for only a few of them \u2014 Alola\u2019s gate wants any three of Route 1\u2019s nine exclusives, not three specific ones',
            'Zone sub-areas now unlock in order behind their hub: you can no longer reach Akala Island\u2019s Route 6 before Route 4 and Route 5 (and Route 4 can\u2019t be skipped past its island)',
            'Zone hubs now show the Next Unlocks list as well as their own areas, so an island or province panel tells you what the next route or town still needs',
            'Alola\u2019s island routes now have varied unlock gates instead of repeating the island\u2019s own requirement \u2014 a mix of battles, Pokedex counts, route-exclusive catches and party levels \u2014 while still unlocking one after another (Route 4, 9 and 16 open as soon as their island does)',
            'Alola\u2019s towns and Poke Pelago now require their island to be unlocked first \u2014 Paniola Town, Heahea City and Po Town used to open from an earlier island\u2019s route',
            'Alola\u2019s Route 2 no longer asks for wins on the later, still-locked Route 3: it now opens from Route 1, so the island\u2019s early progression and the \u201cNext Unlocks\u201d list point somewhere you can actually reach',
            'Alola\u2019s Mina is challengeable again: when a town hosts more than one Gym Leader (Hau\u2019oli City has both Ilima and Mina), the location panel now lists them all with their own FIGHT button instead of only the first',
            'Alola\u2019s Hapu no longer lets you fight the region\u2019s eighth trial from the very first town: she stays locked until you hold seven Z-Crystals (her Iki Town node is the region\u2019s entry point)',
            'Mossdeep City\u2019s Gym leaders are now correctly named Tate & Liza (they were shown as just "Tate")',
            'Pokemon found through route activities (fishing, foraging, Rock Smash, Headbutt, Diving) now carry the same type-appropriate items as ordinary wild Pokemon \u2014 a berry or a booster of one of their own types \u2014 instead of a random shop item like a Choice Band or a mismatched type booster',
            'Voltorb Flip clears a level as soon as every 2 and 3 has been found, so the 1s can be left face down as the rules say (previously it demanded every non-Voltorb tile, so a solved board could refuse to clear). Every board is also guaranteed at least one 2 and one 3, and the board now explains what the two hint numbers mean',
            'Finishing one raid and starting another no longer strands you on the first Raid Island: switching islands keeps your original pre-raid location, so leaving or wiping returns you home instead of dropping you onto an island whose wild table spawns random Raid Pool Pokemon',
            'Raid Islands are legendary-only again: the ordinary finals they used to advertise (fossils and one-off lines such as Omastar, Kabutops, Aerodactyl, Metagross and the Galarian birds) now live as rare one-off refuge encounters on each region’s last route, so they can actually be caught instead of being stranded on an island that never spawned them',
            'Pokemon Musical arrows all match again: the left and right arrows were missing from the pixel font and fell back to a differently-sized font, so all four directions are now drawn as the same SVG arrow rotated to face the right way, and the lanes use the standard dance-pad order (left, down, up, right)',
          ],
        },
      ],
    },
    {
      version: '0.22.0',
      subtitle: 'Battle Overhaul',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Manual battle mode: toggle AUTO / MANUAL on the battle screen (or in Settings \u2192 Battles) to pick each move yourself, switch Pokemon with the SWITCH button, and choose who comes out when one faints. A battle left alone falls back to auto after a minute',
            'In manual battle mode the Champion no longer auto-switches Pokemon either, so nothing changes type behind your back; in auto mode its tactical switches are capped at two per battle and each swap now costs it a turn, giving your Pokemon a free hit',
            'Turning Manual back on after the one-minute idle fallback now waits a fresh minute instead of instantly dropping to auto again — which could auto-switch your active Pokemon the moment you took back control',
            'Trainer, gym, Elite Four and Champion battles now register the opposing Pokemon in the Pokedex as seen (and shiny seen) as they are sent out, just like a wild encounter',
            'Heal Block now works: for five turns the target cannot restore HP from any source \u2014 healing moves, drain moves, Aqua Ring, Ingrain, Wish, Poison Heal, Leftovers, berries and the rest',
            'The leftover stat moves now work: Power Split averages both battlers\u2019 Attack and Sp. Atk, Guard Split averages their Defence and Sp. Def, and Speed Swap trades their raw Speed',
            'Protect-style moves now read at a glance: a successful Protect shows a shield over the battler and a "Blocked!" callout when it stops an attack, a repeat Protect on the very next turn fails with a "Failed!" callout instead of working forever, and the shield/callout is distinct per side',
          ],
        },
        {
          heading: 'Settings',
          items: [
            'Your preferences \u2014 battle speed and style, auto-catch, notifications, accessibility, audio and more \u2014 are now stored separately from your save, so they survive a save reset and are shared across every save slot (an older save migrates its settings in on first load)',
            'Settings has a new Gameplay section that gathers auto-catch, always-catch-shinies and auto-proceed together with a battle-speed picker; exporting, importing and the confirmed reset now sit together under Save Data',
            'Browser notifications can be filtered per event: choose whether shinies, raids & legendaries and egg hatches raise an alert, on top of the master toggle',
          ],
        },
        {
          heading: 'Interface',
          items: [
            'Move-learning text is readable again: the tutor cost line in the move manager and its section labels use dark ink on the parchment panel, and the light move types (Electric, Ground, Ice, Steel) show dark text instead of white',
            'The stats-panel HP label now uses dark ink on the parchment background instead of low-contrast gold',
            'Physical, special and status moves now show clean inline icons in the battle move buttons, the move manager and a Pokemon\u2019s summary, instead of the Unicode glyphs that rendered differently on every device',
            'Mega, Primal and Gigantamax forms no longer evolve: Gigantamax is no longer offered as an evolution, those forms can’t evolve further, and a save that stored a Pokemon in one of them reverts it to its base form',
            'Gigantamax is now a battle form fed by the new Max Mushroom (Kecleon Shop, 4 Victory Tokens): only Pokemon with a Gigantamax form can eat it, it grants them the Gigantamax Factor, and they Gigantamax for the rest of the battle like a Mega (reverting when it ends)',
            'The battle text box now has the Manual / Auto battle-mode button at its right end instead of on a row of its own above the move buttons, so the moves keep their full height',
            'Type chips are readable in every colour: each type now uses dark ink or white text depending on how light its background is, so Normal, Fire, Grass, Rock, Bug, Fairy, Flying and the rest no longer show white-on-light text in the move buttons, move manager, Pokedex or battle badges, and the muted grey label colour was lightened so it meets WCAG AA on the dark panels',
          ],
        },
        {
          heading: 'Fixes',
          items: [
            'Battle info-box labels are readable again: the HP label, the level and the EXP label inside the parchment info box now use dark ink / darkened gold and blue instead of the low-contrast gold and pale blue borrowed from the dark panels (the HP label was only 1.7:1)',
            'Stat-changing moves work now: damaging moves that raise or lower a stat (Overheat, Superpower, Close Combat, Fire Lash, Shell Smash, Spin Out and the rest) actually apply it after the hit, instead of silently doing nothing. Several moves also had the wrong stats — Nasty Plot and Calm Mind no longer raise Attack as well, Howl, Autotomize, Power-Up Punch and Victory Dance buff the user rather than the foe, and Cotton Guard, Tail Glow, Lumina Crash and Shell Smash use their real amounts',
            'Stat boosts no longer carry between the Elite Four and Champion: each bout in the league gauntlet (and a rematch after healing) starts a fresh battle, so a Cosmic Power boost can no longer stack across the whole run and make the team nearly untouchable',
            'Gigantamax and other battle-only form changes no longer inflate HP: a form keeps the Pokemon\u2019s own maximum, so Eternatus (Eternamax) and Zygarde-Complete can no longer snowball into effectively infinite HP over the course of a battle',
            'Wonder Trade no longer hands back a Mega, Primal or Gigantamax form: those battle-only forms were in the random pool, so a Link Cable could return a Pokemon that can never be owned (and was reverted on the next load)',
            'A Pokemon can no longer load with more current HP than its maximum: a save that carried an out-of-range HP (the HP bar stuck at full, the Pokemon nearly unkillable) is clamped when it loads, and leftover battle stat stages are dropped',
            'Wild Pokemon can no longer be caught twice from one battle: the idle loop now waits for a turn / catch to commit before acting again, so a fast battle speed can not replay the same victory and duplicate the catch',
            'A queued turn can no longer resolve after the battle has already ended, and the ATTEMPT CATCH button is disabled while a turn is still resolving',
            'Self-Destruct, Explosion, Misty Explosion and Memento now actually faint their user once they resolve',
            'Two-turn moves now take two turns: Solar Beam, Solar Blade, Razor Wind, Sky Attack, Skull Bash, Freeze Shock, Ice Burn, Geomancy, Meteor Beam and Electro Shot charge on the first turn and strike on the next, while Fly, Bounce, Dig, Dive, Phantom Force and Shadow Force go semi-invulnerable while charging and can only be hit by Earthquake / Surf / Gust and the like',
            'The Pokemon summary\u2019s header is tidier: the name and level share a row, with nature, ability, held item and friendship in a chip strip beneath the types. A nature\u2019s stat effect now lives in its hover tooltip instead of inline arrows, colour-coded with the raised stat in green and the lowered one in red',
            'Catch Settings now start with every ball enabled (the Master Ball keeps its own battle button), so the auto-catcher uses your best available ball instead of only Poke Balls',
            'Elite Four and Champion battles no longer flash the next Pokemon on screen before its trainer walks in \u2014 the incoming Pokemon stays hidden until the trainer actually sends it out',
            'Recoil moves (Double-Edge, Brave Bird, Flare Blitz, ...) now only hurt the user in proportion to the damage actually dealt: finishing off a nearly-fainted Pokemon no longer costs a huge chunk of HP from the overkill. Drain moves (Giga Drain, Drain Punch, ...) and Liquid Ooze scale the same way, and the damage number shown is the real damage dealt',
            'Explosion, Self-Destruct, Misty Explosion and Memento now really faint the user in the party \u2014 the self-KO was only applied to the battle copy, so the Pokemon came back at full HP afterwards (and a double knockout no longer pays the battle EXP twice)',
            'A Pokemon that fainted no longer earns EXP from the battle it went down in, and no longer dilutes the share of the Pokemon still standing: a mid-battle faint used to leave it collecting a partial share of the winner\u2019s reward',
            'Manual battle text plays at the normal speed again instead of flashing past: the player\u2019s picked move now resolves the turn immediately through a dedicated tick, rather than speeding up the whole loop (which had also rushed every event and battle line)',
            'Shared EXP no longer revives a fainted party member: a level-up only tops up a Pokemon that is still standing, instead of adding the new max HP to a fainted member and bringing it back',
          ],
        },
      ],
    },
    {
      version: '0.21.0',
      subtitle: 'Interface & Quality of Life',
      sections: [
        {
          heading: 'Interface',
          items: [
            'The game now adapts to any screen shape: on short or narrow windows (laptops, tablets, landscape phones) the battle scene scales down to fit instead of clipping the HP bars or move bar, and the party / box / location panels move into a tabbed layout rather than being squeezed off the edge',
            'The battle move bar no longer disappears on short screens, and the battle log keeps a few lines of room',
            'On ultrawide monitors (21:9 and 32:9) each side panel now splits into two columns and the battle scene grows to fill the centre instead of sitting in a sea of empty background',
            'Pop-up windows (Settings, patch notes, the move manager, the Pok\u00e9dex) now fit inside narrow screens instead of running off the edge',
            'Phones respect screen notches and rounded corners (safe-area insets) and the battle scene sizes itself to the device in either orientation',
            'Save slots now say whether each run is Normal or Challenge and list the active rules',
            'Party order on phones: the mobile party panel now has up/down buttons on each Pokemon, since touch devices have no drag-and-drop',
            'The Town Map supports two-finger pinch-to-zoom on touch screens and its +/−/fit/centre buttons are touch-sized on phones',
            'Mobile layouts no longer run under the browser\u2019s address bar: the dynamic-viewport height override was declared before the old fallback, so the bottom of the Map and item tabs is reachable again',
            'The Backpack is a new section under the Location panel (where the bag used to be): it holds the League badges / Elite Four, Pokedex, Kecleon Wares (Victory Tokens and the Kecleon Shop), Items (bag) and Records as tabs, so the League no longer shares a tab with the location. On mobile the Backpack and the battle Log are their own tabs alongside Map / Party / Box / Location',
            'The Reward Shop is now the Kecleon Shop and its Backpack tab is Kecleon Wares (the separate money line was dropped since the Bag header already shows it), and the Pokedex / Records buttons were removed from the Box header now that the Backpack holds them',
            'The Kecleon Shop and the Town Map search boxes can now be collapsed: the shop has a Search toggle, and the map hides its search behind a magnifier button',
            'On 21:9 and wider screens the party and box now stack vertically instead of splitting into two side-by-side columns',
            'Empty Box slots now show a recessed placeholder shadow, so it is obvious which slots are free',
            'The Town Map now marks service stops: the Day-Care on each region’s breeding route shows an egg badge (with a tooltip and a Services tag in the location panel), so you can find it without guessing the route',
            'Companion care is now a top-bar button beside the daily tasks once Poke Pelago is unlocked, instead of only being reachable inside the Pelago hub',
            'Companion care is much gentler: a pinned companion now loses a single care point per wild win it actually took part in (on a rotating stat) instead of one point from every stat on every win, the “content” bar is 40 (was 50), and Play / Wash no longer drain as much energy, so a companion can stay content with occasional care',
            'The Box can be reordered by touch again: inspecting a Pokemon in the mobile Box shows up/down buttons (the party already had them), so reordering no longer needs drag-and-drop',
            'The Box keeps a fixed size instead of stretching to fill the left panel and shrinking as the party grows: the party panel now takes the spare space (and scrolls when a summary is open), so the Box grid no longer scales up and down as you catch or swap Pokemon',
            'The Box sort control is split in two: the Sort button cycles the field (Dex, Lv, A-Z, shiny, New) and the Mode button flips the direction (ascending or descending), so you can now sort any field either way instead of only the level having both orders',
            'The routes listed in the Pokedex are links that travel straight there (greyed out until the route is unlocked)',
            'The Pokedex keeps your place: the selected Pokemon and the generation tab are remembered when you switch Backpack tabs and come back',
            'Opening a Pokemon in the Pokedex now has a Search Box button that jumps to the Box and pre-fills its search with that Pokemon\u2019s name',
            'Unlock toasts (“Route X is now accessible!”) have a GO button that travels to the new area and dismisses the toast',
          ],
        },
        {
          heading: 'Fixes',
          items: [
            'New species no longer raise a toast for every first encounter \u2014 the Pokedex still records the sighting quietly',
            'The Settings and Pok\u00e9 Pelago modals are no longer clipped: the centre column no longer traps fixed-position overlays (Daily Quests and the Daily Event benefit too)',
            'Layout pass on crowded controls: the Box header no longer overlaps its pager with the Pokedex / Records / Daycare buttons, and toolbar / tab / save-button rows wrap instead of colliding',
            'The gym tab\u2019s "GO TO <town>" hint is now a button: click it to travel straight to that leader\u2019s town',
            'Candies can be applied in bulk: choose 1, 10 or All in the bag and use them in one go. A stack stops at Lv.100 and only spends the candies it actually needed',
            'Switching or deleting a save slot no longer overwrites the slot you picked: the autosave pauses while a slot is being loaded, deleted or imported, so the running session cannot clobber it before the reload',
          ],
        },
      ],
    },
    {
      version: '0.20.0',
      subtitle: 'World, Guides & Challenges',
      sections: [
        {
          heading: 'People & Places',
          items: [
            'One-off NPC gifts and static encounters: towns and routes now offer a gift (an item pack, an Eevee, a regional starter, a Riolu, ...) or a fixed wild battle (a Snorlax blocking the road, a wiggling Sudowoodo, a honey-tree Munchlax, ...), each claimable once per save and listed in the location panel with any badge gate spelled out',
            'The Johto, Alola and Paldea starter gifts now hand over a random starter from that region (shown as its trio), and skip the starter you picked if it is your first region',
            'A town\u2019s Poke Mart can now be collapsed from its header, and it stays collapsed on your next visit, so a long shop list no longer pushes the area\u2019s encounters and activities off-screen',
            'Marts now stock different shelves: each region\u2019s situational balls and held items are split between its towns instead of every mart listing the whole regional set',
            'Premier Balls are no longer sold \u2014 you get one free for every 10 balls you buy',
            'Swarms last 256 wild battles and their species has 4x shiny odds (never better than 1 in 256). They still announce themselves with a toast that names the area but not the Pokemon, so it stays a surprise until you arrive',
            'The Bag, Poke Mart, Reward Shop and Auction House now show a proper item sprite next to every item instead of a blank square',
            'The Bag uses category tabs (Poke Balls, Medicine, Candies, Items, Held Items, Valuables) instead of next/previous arrows, so you can jump straight to the pocket you want',
            'Selling moved to the Poke Mart: each mart now has a BUY / SELL toggle, so you sell your items where you shop instead of from the Bag',
            'The Weather Institute gift now sits on Hoenn Route 119 (where it belongs) and the invisible Kecleon static has moved to Route 120',
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
            'The League panel now shows each gym leader, Elite Four member and Champion\u2019s team level range (e.g. Lv.12-16), and an earned badge lists it in its tooltip \u2014 so you can tell what you are walking into',
            'High-level wild areas no longer open before the region expects them: routes whose wilds jump far above the area that unlocks them (Paldea\u2019s province areas, Alola\u2019s late island routes, several end-game routes) now also require a party level closer to their wilds, so you cannot wander into Lv.70+ Pokemon with a starter team',
            'Every region\u2019s opening route now starts at Lv. 3-5 instead of Lv. 5-7 (Galar\u2019s opening route and the Slumbering Weald included), so a fresh starter has room to find its feet before the region\u2019s curve starts climbing',
            'The Exp. Share is rebalanced: over 500 battles the active Pokemon gains 50% EXP and every other non-fainted party member gains 25% (it used to give the rest only 5%, but lasted 1000 battles)',
            'Marts now only buy back Valuables (Nuggets, Pearls, Stardust and the rest) \u2014 Potions, Poke Balls, held items and other gear can no longer be sold, so the treasure you find is the way to turn spare loot into cash',
            'The Elite Four and Champion are now challenged from the Pokemon League location itself (like gyms) \u2014 the location panel shows their teams and a BEGIN CHALLENGE button, and the League panel keeps the overview with a GO TO shortcut',
            'Kanto\u2019s route gates now follow the story order: after Cerulean the road runs Route 5 \u2192 Vermilion (Lt. Surge) \u2192 Celadon (Erika) \u2192 the Rock Tunnel / Power Plant branch, and Saffron City opens after Vermilion instead of before it. Routes 6, 7, 9 and 10, Rock Tunnel and the Power Plant were re-levelled so the wild curve no longer spikes on the way to the third badge, and Lt. Surge\u2019s team was trimmed to match',
            'When a region has nothing left to unlock, the location panel now shows a single Next Goal \u2014 beat its Champion to earn a Region Unlock Token, or spend a token you already hold \u2014 instead of listing far-off locations from a locked region',
            'Gym leaders are now challenged from the location panel while you stand in their town, like the Battle Tower and the other location activities; the League panel is now just an overview (badges, team levels, Elite Four and Champion) with a GO TO button to travel to any gym you have not reached yet',
          ],
        },
        {
          heading: 'Challenges',
          items: [
            'New games now open by asking Normal Mode or Challenge Mode: pick Challenge and you set the Randomizer, Level Scaling, Nuzlocke and Monotype rules before choosing a starter, and the same toggles stay in Settings for later changes',
            'Monotype no longer leaks other types onto a route that has none of your chosen type: it now rolls a random Pokemon of that type that could actually exist at the route\u2019s level',
            'Monotype runs now skip the starter choice: you only pick the region, and begin with a random base of a three-stage evolution line of your chosen type',
            'Pokemon-reward minigames obey the Monotype challenge: fishing, Headbutt, Rock Smash, Diving, foraging, the Safari Zone, the Bug Catching Contest, Picnic and Dynamax Adventures all hand out a Pokemon of your chosen type',
            'In a Nuzlocke run, fainting your last Pokemon now ends the run on a Game Over screen, with the option to start a new save, instead of healing it back up',
            'The Challenge Mode setup screen now explains what each rule does, instead of leaving you to guess from the toggle names',
            'Nuzlocke now releases a Pokemon the moment it faints rather than batching the releases at the end of a battle; your last one is still spared',
            'New challenge: One Catch per Route \u2014 you may only catch the first wild Pokemon you meet on each route or area, and that first encounter uses the route up even if it gets away',
          ],
        },
      ],
    },
    {
      version: '0.19.0',
      subtitle: 'Mega Evolution & Battle Polish',
      sections: [
        {
          heading: 'Battles',
          items: [
            'Variable-power moves now work: Heat Crash and Heavy Slam scale with how much heavier the user is, Low Kick and Grass Knot with the target\u2019s weight, Electro Ball and Gyro Ball with the speed gap, Flail / Reversal / Eruption / Water Spout / Dragon Energy with HP, Crush Grip and Wring Out with the target\u2019s HP, Stored Power / Power Trip / Punishment with stat boosts, and Return / Frustration with friendship',
            'In-battle Mega Evolution: give a Mega-capable Pokemon the new held Mega Stone (from the Reward Shop, Kalos marts or the Auction House) and it transforms for the rest of the battle \u2014 taking the physical X forme or the special Y forme \u2014 with the forme\u2019s stats, typing and ability, then reverting afterwards',
            'The Legends: Z-A Mega Evolutions are in: 47 more Megas (Mega Clefable, Victreebel, Emboar, Excadrill, Chandelure, Chesnaught, Greninja, Baxcalibur, Raichu X and Y, Mega Heatran/Darkrai/Zeraora, the Mega Absol / Garchomp / Lucario Z formes, and the rest) can now be reached with the Mega Stone',
            'The same Mega Stone now triggers Primal Reversion: Primal Groudon and Kyogre transform in battle with Desolate Land and Primordial Sea',
            'Mega Evolution is no longer offered as a level-100 evolution \u2014 the Mega Stone is the way to Mega Evolve, so a Lv.100 Pokemon no longer shows a redundant evolve option',
            'Gigantamax and the item-based alternate forms (Rotom appliances, Giratina-Origin, the Therian formes, Necrozma, Calyrex, ...) are no longer labelled as evolutions \u2014 their button reads FORM: <name> in blue and the scene says the Pokemon changed form',
            'Mega Evolution no longer raises a notification toast; the battle log and the transformed sprite still show it',
            'The battle screen\u2019s MOVES button is gone \u2014 manage moves from a Pokemon\u2019s summary instead (the Manage button in its stats panel)',
            'Moves that never miss (Swift, Aerial Ace, Aura Sphere, the G-Max moves and the rest) now truly cannot miss: they ignore accuracy and evasion stages instead of having their accuracy lowered by them, and their accuracy reads as an em dash rather than "101%"',
            'Battle status effects always show a three-letter tag now \u2014 including TOX for badly poisoned and PAR for paralysis \u2014 and the info nameplate reserves the tag\u2019s space so it never jumps or resizes when a status lands or wears off',
            'Moves and abilities now have hover tooltips: hover a move (battle bar, Move Manager or a Pokémon\u2019s summary) for its type, category, power, accuracy and a plain-English effect, and hover an ability for what it does \u2014 held items now show the same hover tooltip (their battle effect) in the party, Box and summary',
            'Held-item moves now actually act on the item: Thief and Covet steal it, Knock Off removes it, Pluck and Bug Bite eat a held Berry, and Incinerate burns one away \u2014 all stopped by Sticky Hold',
            'Wild Pokemon and trainers hold items far less often (8% / 30% down to 5% / 15%) and only from a sensible pool, so a random Pidgey no longer turns up with a Mega Stone or Choice Specs; type boosters match the holder, so a Water type never carries Charcoal',
            'A small item badge now marks any Pokemon holding an item in the party and in the Box',
            'A held item can now be taken back from a boxed Pokemon in its stats window \u2014 the Take button only searched the party before',
            'Auto-battling Pokemon now adapt to an ability that cancels an attack: once a move is absorbed or blocked (Water Absorb, Levitate, Flash Fire, Bulletproof, Wonder Guard and the rest) they switch to their next best move instead of repeating it \u2014 they are not told the ability up front, so the first attempt still goes through',
            'Foes now have AI skill tiers: wild Pokemon and route trainers throw out random attacks, legendary wilds and gym leaders play the full move-picking heuristic, and the Elite Four, Champion, Battle Tower and your own auto-battler always take the best action',
            'The Champion and your own auto-battler also switch Pokemon now: when the active one is losing the type matchup and a teammate lines up much better, they bring the teammate in',
            'Every Pokemon that took part in a battle now shares its EXP, not just the one that landed the final blow',
            'Switching a Pokemon in or using an item during a battle now uses up that turn: the foe still acts, and your Pokemon does not attack',
            'Set / Switch battle style in Settings \u2192 Battles: Switch (the default) lets your auto-battler switch to a better type matchup on its own, while Set never switches automatically',
            'Wild shiny odds are now 1 in 4096 (down from 1/8192); the per-generation Shiny Charm still halves them, from 1/2048 down to 1/256 as generations are completed',
          ],
        },
      ],
    },
    {
      version: '0.18.0',
      subtitle: 'Minigame Overhaul',
      sections: [
        {
          heading: 'Minigames',
          items: [
            'The Battle Royal reads much better: each fighter shows a level and HP bar, the latest knockout stays on screen with a WIN / LOSS banner and the turn count, and the party strip shows sprites with IN / KO tags (and a shake on every hit)',
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
            'Picnic rework: pick three fillings (each a different type), drop them between a bottom and top slice of Bread, and the finished sandwich lures out a wild Pokemon of one of the fillings\u2019 types (chosen at random) at tripled shiny odds \u2014 the toppled or timed-out stack spawns nothing',
            'The Poke Ball Factory now pays out the situational balls (Quick, Timer, Repeat, Net, Dive, Dusk and Nest) instead of candy, more for a cleaner shift and with no cash payout \u2014 each ball is listed by its proper name and sprite. Those balls are no longer sold in any Poke Mart, so the factory is the only source (Poke, Great and Ultra Balls stay on the shelves, and Premier Balls still come free with every ten bought)',
            'Pokemon Musical gives real feedback: a PERFECT! / GREAT! / GOOD! / MISS callout with the points on every note, a pulsing combo badge and lane flash, a live score and accuracy readout, and a song progress bar',
            'Voltorb Flip reveals every Voltorb on the board once the run ends, so you can see where the bombs were hiding before you collect',
            'Pokestar Studios has twice as many film briefs and shuffles each shot\u2019s takes, so the best take is no longer always in the top-left corner',
            'Curry Cooking now runs a 3-2-1 countdown before you take the fan, with a tighter sweet spot to keep the timing a challenge',
            'Poke Pelago opens as a full main-screen scene from the Alola Pelago location instead of a popup, with its Companion, Berry Fields and Islands tabs and an X to leave',
            'Bean Farm and Isle Caves collections now show a result card itemising exactly what you got \u2014 every item by name and sprite \u2014 and Training Isle workers show an EXP bar that fills up when you collect',
            'Three new region minigames: Castelia City\u2019s Pokemon Musical (tap the four arrows on the beat), Cortondo\u2019s Picnic (drop ingredients onto the sandwich without toppling it) and Laverre City\u2019s Poke Ball Factory (rotate the conveyor tiles to link the inlet to the outlet)',
            'Violet City\u2019s Ruins of Alph is a sliding picture puzzle \u2014 tap a stone tile beside the gap (or use the arrow keys) to shuffle the 3\u00d73 picture back into order, and a quicker solve pays more',
            'Snowpoint City\u2019s Snowpoint Temple is a four-room ice-slide maze \u2014 pick a direction and the hero slides until a wall or boulder stops them; clear every room to reach the heart, with a flawless run levelling a Never-Melt Ice and an Ice Stone',
            'The Safari Zone is now four areas \u2014 Center, East, North and West \u2014 each with its own Pok\u00e9mon distribution and advertised rare finds (Tauros, Kangaskhan and Chansey in the Center; Dratini, Dragonair and Squirtle in the East; Scyther, Pinsir and Charmander in the North; Tangela, Bulbasaur and Exeggcute in the West). Switch areas freely between encounters, and Safari finds roll shiny at twice the usual odds',
            'The Safari Zone\u2019s RUN button now darts straight back into the grass for the next Pokemon instead of stopping on a result screen',
            'The Safari Zone\u2019s area picker now has a LEAVE option, so a run can end without spending the rest of the Safari Balls',
            'Minigames now react with sound: a soft tick for a tap, slide or rotation, a positive chime for a match, correct answer, good note or clean cast, a bigger fanfare for a perfect, combo or solved result, and a buzz for a miss or wrong answer (with the Sound Effects setting on)',
            'Puzzle League tiles are now Pokemon faces (Fire is Charmander, Water is Squirtle and so on) and the board animates: swapped tiles slide past each other, cleared tiles pop and then replacements drop in from above',
            'The Bug Catching Contest now judges only your single best catch for the podium \u2014 you still keep every bug you caught, but one run can no longer take all three places',
            'Pokeathlon now opens with a three-second countdown that explains the Sprint before it starts, so the first event no longer begins before you know what to do',
            'Poke Radar is fixed and themed: the first patch of each sequence is no longer cut short by a leftover timer, each sequence gets a short lead-in, and every grass patch now shows a route Pokemon hiding in the grass',
            'Snowpoint Temple no longer runs off the bottom of the screen: the ice board now sits beside a smaller D-pad, so the arrow buttons stay fully visible on the larger rooms',
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
            'The Daycare now sits on a route in every region (Kanto Route 5, Johto Route 34, and so on) \u2014 open it from the location panel to pick two Box Pokemon and collect Eggs, instead of depositing from a Pokemon\u2019s stats window. The breeding pair is shared across regions',
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
