// The in-game changelog. `GAME_VERSION` is the newest entry and the one the
// "What’s New" modal shows; the patch-notes page lists them all, newest first.
//
// Conventions: one entry per release (`{ version, subtitle, sections }`), each
// section `{ heading, items }` using a canonical heading from
// Regions / Pokemon / Trainers / Battles / Items / Minigames / Features /
// Interface / Fixes, in that order. Items are player-facing, one line each;
// fold new work into the newest entry rather than cutting a version per change.

export const GAME_VERSION = '0.25.0'

export const LAST_SEEN_VERSION_KEY = 'pokemon-idle-last-seen-version'

export const CHANGELOG = [
  {
    version: '0.25.0',
    subtitle: 'World, Research & Prestige',
    sections: [
      {
        heading: 'Regions',
        items: [
          'A slow seasonal cycle now runs over the day/night clock: each season lasts four in-game days (four real hours), and the world turns with it. Spring brings the flowering and plant Pokemon out, summer the sun-baked fire types, autumn the fungi and fallen-leaf crowd and winter the ice types, while the world weather roll leans snowier in winter and sunnier in summer. Deerling, Sawsbuck, Burmy, Wormadam and Cherrim change their form with the season.',
          'The world has weather now: each area rolls rain, sun, sandstorm, snow, fog or strong winds (or stays clear) every 15 real minutes, weighted by its biome and its region (Hoenn is rainy, Alola sunny, Galar foggy), and shows it beside the day/night chip on the Town Map. A battle starts under that weather, and the rain- and sun-favoured route activities can fire anywhere instead of only on the seven permanently weather-struck routes. Fog thickens every move that can miss, strong winds blunt super-effective hits, and a weather a battle introduced (Rain Dance, Drizzle, …) lingers on the route for up to 15 minutes so its activities read the same.',
          'Hisui opens as a Sinnoh post-game zone: beat the Sinnoh Champion and a rift at the League leads to ancient Sinnoh — the Obsidian Fieldlands, Crimson Mirelands, Cobalt Coastlands, Coronet Highlands and Alabaster Icelands, each with its own wild table (Hisuian forms included). Its base camp, Jubilife Village, is a hub you can return to for a heal, a shop and a launch pad into any area. Each area also holds its frenzied noble as a one-off static encounter — Kleavor, Lilligant, Arcanine, Electrode and Avalugg — for a set battle against a Lv.72–76 boss, plus its ride Pokemon (Wyrdeer, Ursaluna, Basculegion, Sneasler, Braviary) as a static to catch. A swarm that rolls in Hisui can instead form a space-time distortion, which spawns a boosted rare species on a Hisui route.',
          'Lumiose City’s Wild Zones open as a Kalos post-game zone once the Kalos Champion is beaten: five numbered Wild Zones (plaza, park, canal, tunnels and the power-plant quarter), each with its own wild table. The Lumiose Plaza hub offers a heal, a boutique and one-tap travel into any zone, and it is the only place the Legends: Z-A “Z” Mega forms appear — a Pokemon holding a Mega Stone that has an upgraded Z variant (Lucario, Garchomp, Absol) takes that forme inside the Wild Zones and its original Mega everywhere else.',
        ],
      },
      {
        heading: 'Pokemon',
        items: [
          'Every Pokemon has a size now, rolled per individual like its IVs and shown beside them as an XS–XL rating on the stats panel. Every species carries its real height, so the roll is scaled into a physical size — the chip and tooltip show how tall the individual stands (a Wailord and a Diglett keep their own scales instead of sharing one). The very largest specimens are alphas and are flagged ★ ALPHA; they earn 20% more EXP from every battle, are marked ★ in the Box, and older saves get a size rolled in on load.',
          'Real field evolutions are in: some Pokemon now evolve only in the right place or moment. Eevee becomes Leafeon near a Moss Rock (any forest) and Glaceon near an Ice Rock (any tundra), Magneton and Nosepass reach Magnezone and Probopass in a cave’s Magnetic Field, and Sliggoo (including Hisuian Sliggoo) only becomes Goodra while it is raining. The party and box evolve buttons name the requirement, so you always know where to head.',
          'Pokemon can carry a personality mark now, a little title they keep for life. A newly obtained individual has a small chance to roll one — “the Sleepy”, “the Rowdy”, “the Charismatic” and more — and the rare Recluse mark is much harder to find. A shiny or alpha that did not roll one is titled “the Shiny” or “the Alpha” instead. The mark and its title show on the stats panel and in the Box, and the Box can sort by mark or filter to marked Pokemon only.',
        ],
      },
      {
        heading: 'Trainers',
        items: [
          'A recurring rival challenges you in each region: Blue, Silver, Wally, Barry, Hugh, Calem, Hau, Hop and Nemona turn up in town once you have earned 2, 4, 6 and 8 badges, each with a team that scales to your party. Each rival has their own sprite and speaks before the battle and again after a win or loss, and beating one pays a rising cash bonus and a Rare Candy. Win at all four milestones and the party earns the Rival Ribbon.',
          'A villain organisation now menaces every region \u2014 Team Rocket in Kanto and Johto, Team Aqua in Hoenn, Team Galactic in Sinnoh, Team Plasma in Unova, Team Flare in Kalos, Team Skull in Alola, Team Yell in Galar and Team Star in Paldea. Each keeps a hideout on the Town Map that opens once you have earned enough badges in that region. Clear its three grunts and an admin to reach the boss, whose team carries a legendary; every fight reuses the gym and raid plumbing and scales to the region\u2019s level curve.',
        ],
      },
      {
        heading: 'Battles',
        items: [
          'A well-kept companion can tough out a would-be knockout at 1 HP (“X toughed it out so you wouldn’t feel sad!”). The chance scales with its care stats, and any other Pokemon with near-max friendship gets a smaller version of the same save while it is in battle. It can fire once per battle, like a Focus Sash. A cared-for companion also picks up the rest of the affection set: it can read an incoming move and dodge it, shake off a status condition at the end of a turn, and lands critical hits more often.',
          'Every damaging hit now flashes a type-coloured impact over the sprite it lands on — a physical move rakes a slash, a special move bursts, each in its type colour. It can be turned off as “Move Impacts” in Settings, next to Damage Numbers.',
          'Hoenn’s Battle Frontier opens beside the Battle Tower once the Hoenn Champion is beaten: three rule-variant facilities on the Tower’s deterministic floor-puzzle format. The Battle Factory rents you a fresh six-Pokemon team for the floor (your own party waits safely), the Battle Arena runs inverse battles where the type chart is flipped (resistances become weaknesses and immunities become 2× hits), and the Battle Palace ignores every held item for both sides. Every ten floors pay a Victory Token.',
          'Hordes are in: a rare wild encounter can be a pack of 3-5 of one species at once. Your Pokemon faces the whole pack, so spread moves hit every member while a single-target move picks one, and clearing the pack pays bonus EXP (up to 3x) and extra item drops. A horde still counts as a single wild win, so the per-win systems stay idle-friendly. Hordes can be turned off in Settings.',
          'SOS chaining is in: win wild battles in a row on a route (without leaving or blacking out) and its chain climbs, raising the hidden-ability chance of every Pokemon you meet there \u2014 20% at a chain of 10, 100% by 40 \u2014 and its shiny odds, up to 4x at 150. The location panel shows the route\u2019s current and best chain with the odds it has earned, and the first time a route\u2019s chain reaches 10, 25 and 50 it pays a milestone reward.',
        ],
      },
      {
        heading: 'Items',
        items: [
          'Two ability items join the game: the Ability Capsule switches a Pokemon between its normal abilities, and the Ability Patch toggles its hidden ability (and back again).',
          'Effort Values are in, raised only by vitamins (never by battling): HP Up, Protein, Iron, Calcium, Zinc and Carbos each add 10 EVs to one stat, up to 252 per stat and 510 total. An individual’s EVs show on its stats panel beside its IVs, and feeding several at once tops a stat up without wasting any.',
          'The Research Shop has its own identity now instead of restocking the evolution stones the Kecleon Shop already sells: it offers the full Exp. Candy ladder (S / M / L / XL), Rare Candy, the Ability Capsule and Patch, Bottle Caps and the six EV vitamins, topping out with a Master Ball for 1000 RP. The Lucky Egg (its holder earns 50% more EXP) and the Amulet Coin (its holder doubles the prize money from trainer battles) are auction-only held items on the Grand Auction House block.',
          'More battle held items: the Rocky Helmet hurts a foe that makes contact for a sixth of its HP, and the six pinch Berries (Liechi, Ganlon, Salac, Petaya, Apicot, Starf) boost a stat when the holder drops to a quarter of its HP (half with Gluttony).',
          'Kurt’s Apricorn Balls are in: Apricorns turn up on Johto routes as you win wild battles (and grow in the Berry Garden now), and Kurt’s workshop in Azalea Town carves each one into its ball — Level, Lure, Friend, Heavy, Love, Fast and Moon — with their real situational catch rates. Handing him an Apricorn starts a craft that finishes after ten wild wins, and the panel shows what he is working on and lets you collect the finished balls.',
          'Dismantling a villain organisation pays its one-off arc reward: a Master Ball, Rare Candy, a regional training item, cash and Victory Tokens, plus that organisation\u2019s ribbon for the whole party.',
        ],
      },
      {
        heading: 'Minigames',
        items: [
          'Quick Guard and Wide Guard shield the user’s whole side in the Battle Maison doubles now (from priority and spread moves), and the Maison AI raises them when the opposing pair threatens one.',
          'The doubles court has a second home: Hoenn’s Battle Tower now offers the 2v2 doubles run beside its floor climb.',
          'Hoenn’s Battle Tower runs triple battles too: field three Pokemon against three, every battler picking its own target and spread moves hitting the whole opposite side. A fainted Pokemon is replaced from the bench until one side runs out.',
          'The Battle Tower also runs rotation battles: field a trio but fight with one active Pokemon at a time. Rotating your active Pokemon is free before each round, so you can answer the foe’s lead, and a fainted member is replaced by the next healthy one until a side is down to nothing.',
          'And a free-for-all: four trainers — you and three rivals — each field a team, everyone can hit everyone, and the last trainer with a Pokemon standing wins the bout. Your Pokemon picks its own target each round, so you can let it run unattended while you outlast the field.',
          'Alola’s Ultra Warp Ride is in: the new Ultra Space post-game location (east of the Raid Island, open once the Alola Champion is beaten) sends you riding through a wormhole for 30 seconds, steering left and right to collect rings and dodge debris. The cleaner the run, the deeper the wormhole it reaches \u2014 then pick one of the doors and keep the Ultra Beast or legendary waiting inside, drawn from Alola’s Raid Island pool instead of left to the raid roll.',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Focus hunts are in: pick a species or a type from the Focus Hunt bar in the location panel (search a name or choose a type) and its wild and route-activity encounter rate is tripled. The hunt tracks how many you have seen, how many you have caught, the best activity hit you landed and how long you have been at it, and lists the routes it turns up on.',
          'The Pokewalker is in: your Pokemon bank a currency of steps from the time you are away (a little also builds while the game is open), up to a daily cap, and you spend them on the walk rewards — warming your Day-Care and party eggs, finding a random item, or drawing the rarest wild on your current route out of hiding. Steps banked while away are listed in the “while you were away” report, and the Pokewalker panel opens from the top-bar shoe button.',
          'A species with no wild route no longer shows impossible “defeat it in the wild” research tasks: it observes the species instead — obtain it, feed it a berry, and use its moves in battle — for the same points. Every species also has a “catch a large specimen” task now, credited when you obtain an XL individual, plus a super-effective-hit task (defeat a species with one, or land one with it for a non-wild species) and a per-species “signature move”: the highest-level move in its learnset, seen used in battle. Finishing every task for a species also pays a one-time reward tied to it: a held item that boosts its primary type (a Charmander’s research yields a Charcoal, a Pikachu’s a Magnet), shown in its Pokedex entry.',
          'Ribbons are in: a Pokemon earns a permanent award for milestones (Effort at Lv. 100, Best Friends at max friendship, a Shiny Ribbon for any shiny, and a Discovery Ribbon for the first of its species), Gym / Elite Four wins, Battle Tower floors and cleared Contests or the Champions’ Gauntlet. Each region’s Champion hands out that region’s own League Ribbon, beating the rival at every milestone earns the Rival Ribbon, and finishing a species’ Field research gives its individuals the Research Ribbon. A ribbon case on the stats panel lists everything an individual has earned.',
          'Route activities track mastery: the best hit quality for each activity on a route is remembered, the location panel shows how many are at a perfect hit or better, and clearing every activity on a route pays a one-time bonus and marks it mastered.',
          'Villain-arc progress is saved per region, and dismantling an organisation unlocks the new \u201cVillain Vanquisher\u201d Trainer Card title.',
          'Daily quests can ask for clean route-activity hits (a perfect or ultra hit), and the Field Jobs’ overnight work is itemised in the “while you were away” report (the cycles each ran and what they banked). The report also lists the systems that kept ticking offline — Poké Pelago cycles, the Berry Garden ripening, Kurt finishing an Apricorn Ball and Day-Care progress — since those advance per wild win, and the time away is replayed as a conservative number of wins. It replays the route’s wild encounters too, so any Pokemon your auto-catch rules would have caught while you were gone are listed by name (and the balls spent on them are counted).',
          'The Day-Care tracks breeding: eggs and shinies hatched, eggs since the last shiny, and a project queue (a shiny, all-31 IVs or a specific nature) that completes the moment a matching Egg hatches. The front project also counts the eggs spent on it, and the Masuda method is explicit now: breeding two parents from different regions (a Pokemon from another region’s routes, or a Wonder Trade find) hatches shinies at 1 in 683 instead of 1 in 4096. Each Pokemon shows its origin region on the stats panel.',
          'Prestiging a region now earns Prestige Points for a permanent perk tree that survives every reset: Experience (+8% EXP per rank), Fortune (+10% prize money per rank), Capture (+5% catch rate per rank), Radiant (+10% shiny odds), Scavenger (+10% wild item drops) and Incubation (+12% egg hatching speed), up to rank 5 each. A Reset button refunds every spent point so you can re-spec.',
          'Each region’s Raid Island tracks a Legendary Quest for its box legendary: earn every badge, beat the Champion and recover ten Ancient Relics, then challenge it directly instead of leaving it to the weighted raid roll — the challenge opens with a short boss scene before the raid. Relics are dug up on that region’s wild routes as you battle there, and the region’s own count is shown in the quest panel.',
          'Every save has a Trainer Card now. Set a trainer name and a title earned from your achievements and ribbon milestones, wear an outfit unlocked by achievements or bought with prize money, pin a favourite Pokemon and choose which badges fill the badge case. The card can be exported as a shareable PNG, and each save slot shows its own card.',
          'The Pokedex tracks every form now, not just the species: alternate forms, regional variants and visual gender differences (a female Pikachu, a Galarian Meowth) are collected individually. Completing a species’ whole family pays cash scaled to how many forms it asks for, finishing a regional set (all Alolan, Galarian, Hisuian or Paldean forms) pays a bigger bundle with a Master Ball, and collecting every form in a generation is a capstone reward. Rewards are paid once and catch up automatically on load.',
          'A Pokemon Bank now lets you move individual Pokemon between your save slots: deposit them into a shared, slot-independent storage with its own capacity (thirty Pokemon), switch saves from Settings, then withdraw them into the other run. Deposits and withdrawals run each individual back through the save repair pass, and a banked Pokemon carries a hidden identity tag so the same Pokemon can never be cloned into two saves — depositing removes it from the source and an interrupted write can never leave a copy behind.',
          'Secret Bases are in: set one up on any route, then decorate it with furniture, plushies and milestone trophies on a placement grid. Placed decorations grant small passive bonuses (EXP, prize money, catch rate and shiny odds, each capped at +30%), the trophies are claimable once their milestone (badges, Champion wins, Pokedex, shinies, Tower floors, legendaries or regions) is met, and the base banks a money-and-item yield from your wild wins that you collect once a day. Moving an established base to another route costs a small fee.',
        ],
      },
      {
        heading: 'Interface',
        items: [
          'A season chip sits beside the day/night and weather chips on the Town Map, and the terrain colours are retinted to match the season.',
          'The small input controls are consistent now: one shared segmented button (battle speed, shop Buy/Sell, Box filters) and one shared number control — a track-and-handle slider with −/+ steppers and arrow-key support — for the catch level threshold and the shop quantity (with its MAX shortcut). Active states use the same gold treatment across segments, toggles, sliders and the radio lists.',
          'Settings gained Auto-Heal (top the party up at the Pokemon Center whenever the map is idle and someone is hurt) and a Default Catch Rule (mode, level threshold and enabled balls) for routes you have not customised.',
          'The Box can bulk-release a search or filter: a “Release Found” button appears while searching and releases everything shown (favourites and shinies are always protected), alongside the existing one-tap Release Dupes.',
          'The Display section gained damage-number and shiny-sparkle toggles, the Box can sort by total IVs, the move buttons show their type effectiveness and flag an estimated KO, and a TEAM button in the Party header saves the party as a preset you can restore in one tap.',
          'Contrast got a pass across the newer panels: the Prestige perks, focus-hunt bar, route-mastery hint, gym/league locks, achievements, Pokedex tiles and encounter detail, save-slot cards, EV/IV chips, gender and nature values, rarity labels, research and Field Jobs cards, the Raid Island quest panel and the “What’s New” heading all use ink that stands out from their background now, instead of dark-on-dark or light-on-parchment. The Legendary Quest’s pre-battle scene — whose light text was sitting on the shared light modal background and was effectively invisible — now uses its own dark backdrop.',
          'The Backpack gained a Trainer tab for editing the Trainer Card (name, title, outfit, favourite Pokemon and badge case), and the save slots in Settings and the boot picker show each save’s card.',
          'The Pokedex gained a Forms view (the Forms button beside Search): a Living Dex summary of collected form entries, per-family form and gender targets, regional-set and generation progress with a tick for each reward already paid, and a one-tap jump back to a species’ full entry.',
          'A Pokemon Bank panel opens from the Box header and from Settings > Save Slots. It lists what you can deposit on one tab and what is waiting in the bank on the other, with each Pokemon’s sprite, level and source, and it shows how many of the thirty slots are used.',
        ],
      },
      {
        heading: 'Fixes',
        items: [
          'One-off static encounters (Hisui’s nobles and ride Pokemon, the red Gyarados, Snorlax, ...) always get a ball now. They were skipped by the default “new species” auto-catch rule once their species was already registered — which is guaranteed for a Hisui noble or ride Pokemon that also spawns in the wild — so the static could never be claimed.',
          'A held item given to your active Pokemon no longer vanishes. The bag updated the party slot but not the active-Pokemon copy the battle uses, so the next sync wrote the old (empty) copy back over it; both copies are updated now, and putting an item away clears both.',
          'A battle can no longer freeze after an action the reducer ignores: the idle loop’s batched dispatch always produces a fresh state, so a single no-op (a stale turn, an already-ended encounter, ...) cannot leave the loop waiting forever for a commit that never comes.',
          'A region’s box legendary is now earned only through its Legendary Quest: it no longer appears in the Raid Island’s random raid roll, its wild encounters, or as a roaming legendary. Once the quest’s steps are done, the Raid Island hands it over directly.',
          'A finished Legendary Quest no longer drops you straight into the raid from the Town Map or the Pokedex: clicking the Raid Island now opens the challenge scene first, so you can read it and confirm the battle (the quest panel’s own CHALLENGE button already worked this way).',
          'The Champions’ Gauntlet and the Battle Maison now close when you collect their prizes — their end action was being ignored, which left the reward screen (and the game) stuck after a run.',
        ],
      },
    ],
  },
  {
    version: '0.24.0',
    subtitle: 'Double Battles & the Sevii Islands',
    sections: [
      {
        heading: 'Regions',
        items: [
          'Kanto’s Sevii Islands are a post-game zone on Kanto’s map now — One Island through Seven Island (Kindle Road, Mt. Ember, Berry Forest, Icefall Cave, Ruin Valley, the Tanoby Ruins and the rest), entered from Vermilion City once the Kanto Champion is beaten, with the islands spread across the sea in the focused area view.',
          'The Galar and Paldea DLC sit on their parent’s map as ordinary zones now (Isle of Armor and Crown Tundra on Galar, Kitakami and the Terarium on Paldea), and there is one Raid Island per region again: the DLC legendaries (Kubfu, Urshifu, the Regis, Calyrex, Enamorus, the Galarian birds, Ogerpon, Terapagos, Pecharunt) fold back into their parent’s raid pool.',
          'Alola’s Town Map no longer runs roads across the sea between its islands, and the League sits beside Ula’ula’s Mount Lanakila.',
          'Thirty-three more landmarks the scraper used to drop are real wild areas now — the Unova Black 2 / White 2 areas, Hoenn’s Jagged Pass and Scorched Slab, Sinnoh’s Floaroma Meadow, Ramanas Park and Trophy Garden, Kalos’s Parfum Palace and Unknown Dungeon, Alola’s Haina Desert and Resolution Cave, Paldea’s Dalizapa Passage and more — Johto’s Whirl Islands are a proper four-cave zone, and the Galar Wild Area, Poni Island and Area Zero gained more habitats.',
          'Paldea is a linear Victory Road route now: its province zones, gym towns and landmarks open in the real gym order (Katy, Brassius, Iono, Kofu, Larry, Ryme, Tulip, Grusha) behind the previous badge and a party level, so the wilds ramp smoothly from Lv. 3 to Lv. 75.',
          'Ogerpon’s three masks, Terapagos’s Terastal and Stellar formes and Bloodmoon Ursaluna are obtainable now (the masks, a Tera Orb and a Peat Block are Reward Shop items that switch the forme from the party screen), and Wimpod, Rellor and Slither Wing have real wild routes instead of being Bug-Catching-Contest-only.',
        ],
      },
      {
        heading: 'Battles',
        items: [
          'Another batch of damaging moves does what it says now: Tri Attack and Dire Claw roll several status conditions, Wake-Up Slap and Smelling Salts double against — and cure — a sleeping or paralyzed target, Facade, Hex, Venoshock and Brine double under their condition, Expanding Force, Rising Voltage and Misty Explosion get their terrain boost, Bolt Beak and Fishious Rend double when moving first, Payback, Avalanche and Revenge double when the foe moved first, and Assist, Me First, Retaliate, Round and Echoed Voice all work.',
          'A big utility-move pass: Aromatherapy and Heal Bell cure status; Foresight, Odor Sleuth and Miracle Eye let Normal and Fighting hit Ghosts; Lucky Chant, Court Change, Dragon Cheer, Power Shift, Stockpile and Swallow, Torment, Transform, Gravity, Telekinesis, Mud and Water Sport, Powder, Embargo, Wonder Room, Ion Deluge, Electrify, Magic Coat and Tea Time all work; Endure, Tidy Up, Psycho Shift, Purify, Magnet Rise, Conversion and Conversion 2, Acupressure, Power Trick, Psych Up, Refresh, No Retreat, Take Heart, Clangorous Soul, Grass Whistle and Poison Gas all work; and the flavour moves (Splash, Celebrate, Hold Hands, Happy Hour, Fairy Lock) are accounted for.',
          'Mid-battle switching is a proper action now — it spends your turn, so the foe still attacks — and the whole family works: Baton Pass carries its boosts out, Teleport, U-turn, Volt Switch, Flip Turn, Shed Tail and Parting Shot pivot, Roar, Whirlwind, Dragon Tail and Circle Throw drag the foe out, and Block, Mean Look and Spider Web pin it. The switch abilities (Arena Trap, Shadow Tag, Magnet Pull, Suction Cups, Emergency Exit, Wimp Out, Run Away, Revival Blessing) work too, and a trapped Pokemon’s SWITCH button greys out.',
          'The move-copy and item-lock moves work — Mimic, Sketch, Snatch, Magic Room, and in the Battle Maison Ally Switch and Instruct — and Multitype and RKS System use Arceus’s plates and Silvally’s boosters to change their type.',
          'Gigantamax uses its real Max Moves (the type Max Move or the Pokemon’s own G-Max move, with the real power curve and effects) and Z-Moves arrived: 18 Z-Crystals (Reward Shop and a Grand Auction lot) turn a matching move into its Z-Move once per battle.',
          'Dozens more abilities work in battle: Synchronize, Magic Bounce, Rivalry, Quick Draw, Stakeout, Supreme Overlord and the Choice lock, plus Long Reach, Heavy and Light Metal, Wonder Skin, Leaf Guard, Supersweet Syrup, Anticipation, Forewarn, Frisk, Lingering Aroma, Spicy Spray, Electromorphosis, Wind Power, Wind Rider, Mind’s Eye, Tera Shell, Teraform Zero, As One, Gear Up and Coaching (raise the user’s and an ally’s stats), Nightmare (a 1/4 residual on a sleeping target) and Doodle (copies the user’s ability onto the target).',
          'Out-of-battle abilities got a pass: Flame Body, Magma Armor and Steam Engine halve egg hatching, Static and Lightning Rod draw Electric wilds, Magnet Pull draws Steel and Storm Drain Water, Cute Charm biases a wild’s gender, Super Luck and Compound Eyes double wild held-item odds, and Illuminate draws 50% more item drops.',
          'Fishing has real bite rolls (Suction Cups and Sticky Hold steady the line, and the rarest fish are "multi-catch", needing a second perfect reel), Honey gives a 1.5x catch-rate bonus, and a third battle style joins Set and Switch: Training keeps your lead in for the EXP but swaps it out below a third of its HP (a Lv. 100 lead shares its EXP with the party).',
        ],
      },
      {
        heading: 'Minigames',
        items: [
          'The Battle Maison in Kalos runs double battles now: two of your Pokemon face two foes, every battler picks its own target, spread moves hit both, and a fainted Pokemon is replaced from the bench. Its ally play works too — Battery, Power Spot, Friend Guard, Healer, Helping Hand, Follow Me, Rage Powder, Spotlight, After You, Quash, Commander, Dancer, Flower Veil, Power of Alchemy, Receiver, Symbiosis and Telepathy.',
          'Nine new regional minigames: Mantine Surf (Alola), Rotom Rally (Galar), Ogre Oustin’ (Paldea), Type Fusion (Unova), Unown Picross (Sinnoh), Pokeshot (Kalos), Tera Raids (Paldea’s Area Zero), the Trainer School word scramble (Unova) and the Berry Blender (Sinnoh), and the hub-based ones can be started from a zone hub.',
          'Route activities are their own thing now: fishing and foraging were joined by Bug Catching, Rock Climbing and Prospecting, then Campfire, Overcharge, Séance and Summit Roost, so every one of the 18 types can be found through an activity. Each has a unique interaction (a sweeping bar, a closing ring, a rapid tap, a hold, a rune sequence, a dig grid, ...), favours a time or weather, and has a "how to play" tutorial.',
          'Every fixed minigame shows a short "how to play" the first time you start it too, and it can be reopened from its location card.',
          'The terrain minigames got deeper: Berry Foraging builds a berry combo, Diving uncovers sunken treasure, and Rock Smash can crack out a gem or a fossil.',
          'Kanto’s Indigo Plateau runs the Champions’ Gauntlet: a post-game bracket of 8 named trainers from every region (5 gym leaders, then 2 Elite Four, then a Champion) with their Lv. 80+ rematch teams, fully healing the survivors between trainers; a full clear pays a Master Ball.',
          'Field Jobs let a Pokemon keep a route activity running while you play or are away: it banks money and items or the wild Pokemon that wander in (ready to battle from the card), up to 4 jobs at once, and a stronger worker (or one with Pickup, Honey Gather or Illuminate) banks faster, with a Field Jobs panel to collect from.',
          'Balance and fixes: Type Fusion runs 100 moves and no longer overflows the scene, the Berry Blender drains slower, five-star Tera Raids scale further, the Battle Maison doubles no longer stalls after a knockout, and the Poke Pelago and Bug-Catching Contest now record their minigame results correctly.',
        ],
      },
      {
        heading: 'Features',
        items: [
          'The game works offline now: a service worker caches the app, and an Offline Play section in Settings shows the download size and fetches every sprite, backdrop, item icon and data file with a progress bar. The art and data were right-sized and minified for it (the backdrops moved to WebP) and offline uses the static sprites, keeping the download well under 50 MB.',
          'The cached app also keeps itself up to date: it checks for a new service worker on boot, when the network returns and when the tab becomes visible, and reloads a backgrounded tab into the new build, so an active battle is never interrupted.',
          'Field research: every species has five tasks (catch it, defeat it 3 / 10 / 25 times in the wild, catch its shiny) that earn Research Points. It reads the Pokedex plus a per-species wild-defeat count, tracks a research level up to 10 in the Pokedex detail, and spends the points in a Research Shop on candy, evolution stones, Bottle Caps and a Master Ball.',
        ],
      },
      {
        heading: 'Interface',
        items: [
          'The Pokedex groups alternate forms under one slot (with a form switcher), registering any form registers its species and counts toward that generation’s completion, entries name their source (Game Corner prizes, fossil revives, the Ruins of Alph, "Evolves from ..."), MissingNo. has its real glitch sprite and stays hidden until first seen, the search is a collapsible fuzzy match that also covers the whole evolution family, and selecting a Pokemon auto-filters the Box.',
          'A Pokemon that can transform in battle carries a form chip in its stats panel: a pink G-MAX chip that lights up after a Max Mushroom and a purple MEGA chip while it holds a Mega Stone.',
          'The Town Map marks a fully-caught route with a teal marker and "All Pokemon caught" legend entry, and marks the Day-Care, Berry Garden, Battle Tower, every Raid Island and the Ruins of Alph and Tanoby Ruins with named service markers.',
          'Settings gained a Display section (animated or static sprites), the game keeps the screen awake while open, and a cafe opened in each region’s main city, selling a Poffin (+30 friendship) or a Poke Bean.',
        ],
      },
      {
        heading: 'Fixes',
        items: [
          'AUTO field jobs no longer bank the same Pokemon over and over: a perfect activity hit now only biases toward a route’s rarer species instead of excluding the common ones, so a job (and a perfect manual hit) keeps rolling the whole type pool.',
          'A failed startup can no longer cost you your save: the self-heal copies every slot aside first and restores it on the next good load, and a transient failure just reloads instead of erasing anything.',
          'The battle menus stay open through the healing animation, the Pokedex detail panel gained a close (X) button, and clicking a still-unseen entry no longer fills the Box search with its name.',
          'The evolution button in a Pokemon’s detail panel is readable when greyed out now (dark text on a solid muted button).',
          'A Raid Island link in a Pokedex entry starts the raid for the Pokemon shown instead of just travelling there.',
          'Ten item-manipulating moves (Knock Off, Thief, Covet, Pluck, Bug Bite, Incinerate, Power Split, Guard Split, Speed Swap and Heal Block) and the Battle Maison’s ally abilities now show their effect in the Battle Reference instead of looking inert.',
          'Poni Island is reachable again (its hub waited on a trial that stands on Poni itself; it now opens after Nanu), and route-exclusive catch gates were refreshed against the current wild tables and no longer demand a night-only or near-rare Pokemon.',
          'The Next Unlocks list follows the region you are standing in and the real unlock requirements rather than roads, and it tucks areas you cannot work toward yet behind a "blocked areas" toggle that names what each is waiting on.',
          'Post-game sub-regions can no longer be picked as a starting region.',
        ],
      },
    ],
  },
  {
    version: '0.23.0',
    subtitle: 'World, Trainers & Collection',
    sections: [
      {
        heading: 'Regions',
        items: [
          'The old ordinary Raid Island finals now live as rare wild encounters on fitting routes (Johto’s Natu and Unown, Hoenn’s Mawile, Sinnoh’s Aipom and Spiritomb, Unova’s elemental monkeys, Kalos’s Carbink and Pumpkaboo, Galar’s Indeedee-F, Kanto’s Jynx, and the fossils and one-off lines on each region’s last route), and Raid Islands are legendary-only again: a fresh island leans toward the minor legendaries and a finished one toward the box legendaries, weighted by the region’s badges, Champion and prestige.',
          'Babies and one-off lines were cleaned up: Cleffa, Smoochum and Magby are bred from their evolved forms, Togepi still comes from Mr. Pokemon’s egg, Beldum and Porygon from Steven’s gift and the Game Corner, and Riolu, Toxel and Munchlax from their wild pre-evolutions. Slakoth was added to Hoenn Route 102.',
          'Alola runs its real league track now — 11 Z-Crystals (7 island trials + 4 grand trials, with Hala, Olivia, Nanu, Mina and Hapu) instead of 8 — Kanto went through the same generation passes as the other regions (re-levelled wilds, rebuilt type-themed gym/league teams, current-gen leader sprites), and Galar’s Champion Cup rematch is labelled as the post-game tournament.',
          'Three gifts and statics: Steven’s Beldum in Mossdeep City after the Hoenn Champion, Mr. Pokemon’s Togepi Egg on Johto Route 30 once you have a badge, and the Lake of Rage red Gyarados — a guaranteed shiny on Johto Route 43 after the seventh badge that stays put until caught.',
          'Minigames can gate routes now: Kanto’s Route 11 opens on a Whack-a-Diglett score of 15, Johto’s Route 36 on clearing the Bug-Catching Contest, and Paldea’s South Province (Area Three) on scoring 4 in the Academy Quiz.',
          'The world runs on a fixed day/night cycle now — one full day every 60 real minutes (dawn, day, dusk, night), shown in the Town Map header and tinting the battle background — and it changes what you find: nocturnal and diurnal species are tagged on the wild tables, so the night shift brings Hoothoot and Duskull while the day brings Pidgey and Caterpie.',
          'A handful of weather-struck routes start every battle under a permanent field weather (Hoenn Route 119 rains, the Hoenn and Unova deserts blow a sandstorm, the Sinnoh, Galar and Kalos snow routes drive snow), and every route and town carries a real biome (forest, autumn, desert, swamp, volcanic, tundra, ruins, ...) that drives the painted battle backgrounds and the Town Map shading.',
          'The Town Map got a readability pass: names stay on screen, a zone hub shows its sub-area count, a legend explains every node type, sub-areas sit in a ring around their hub, and clicking a zone or DLC hub opens a focused area map with a "Region map" button back.',
          'Routes feel less repetitive: the route-variety pass now covers every route (including the landmark areas added since it last ran), rolling in other Pokemon already wild in the region matched to the route’s level and types, so most routes offer around sixteen different finds.',
          'Map and progression cleanup: each road takes the corner that follows its travel direction, redundant town-to-town and duplicate links are pruned, and the DLC areas are subregions of their base region now (on the parent’s Town Map, opening automatically once the Champion is beaten).',
          'Seventy-six landmarks the scraper used to drop are real wild areas now — caves, forests, ruins, towers and lakes across Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar and Paldea — and Galar’s Wild Area, the DLC zones and Alola’s islands gained their full sets of habitats.',
          'The Bug-Catching Contest is held at Johto’s National Park now, Snowpoint Temple opens with a Strength chamber, and locations are labelled by their real kind (Cave, Forest, Sea Route, Mountain, Desert, Volcanic, Tundra, Ruins) with a "Show wild Pokemon" toggle on a zone hub.',
        ],
      },
      {
        heading: 'Pokemon',
        items: [
          'Egg moves exist now: each species has its real breed-only move list, an egg inherits any its parents know, a hatchling keeps them (re-learnable for free from the Manage Moves panel, tagged "Egg"), and they are protected from level-up replacement instead of resetting to a bare Lv. 1 set.',
        ],
      },
      {
        heading: 'Trainers',
        items: [
          'Town trainers are far more varied: 50 classes instead of 12 — each with its own type theme, class-appropriate names drawn from a much larger pool with no repeats in a region, two to four per town, and Ace Trainers, Cooltrainers and Scientists fielding larger squads.',
          'Route trainers field a much wider slice of their region’s own Pokemon now: the class’s type is a bias rather than a filter, teams are stepped to a form that could exist at their level, and every evolution line turns up on at least one trainer. Gym, Elite Four and Champion teams were rebuilt with more distinct species, and gym teams grow from three members to five as the badges add up.',
        ],
      },
      {
        heading: 'Battles',
        items: [
          'Damaging moves can carry two effects at once now (Flare Blitz recoils and can burn, Volt Tackle recoils and can paralyse, the elemental fangs inflict status and flinch, Triple Arrows drops Defense and flinches), recharge moves force a lost turn again, and many moves regained the secondary effects the extraction missed (Thunder and Thunder Punch can paralyse; Psychic, Crunch, Moonblast, Iron Tail, Seed Flare and dozens more drop a stat or accuracy). Fake Out only flinches on the first turn out, Poison Fang badly poisons, and Esper Wing raises Sp. Atk.',
          'Weather plays out on the battlefield itself now: rain streaks, a drifting sandstorm, falling snow or hail, a pulsing sun glare and sweeping strong winds move across the scene behind the combatants (hidden when reduced motion is on).',
        ],
      },
      {
        heading: 'Items',
        items: [
          'TMs are found, reusable discs now: the Move Tutor no longer sells them for cash, each gym leader hands over two of its type when you win the badge, the Underground, Bug-Catching Contest, Voltorb Flip and other minigames drop their type, and wild Pokemon occasionally drop one. Level-ups no longer overwrite a taught move, TMs live in their own bag tab, and every TM is numbered and drawn as a type-coloured disc ("TM89 Flamethrower").',
          'Bottle Caps hyper-train a party Pokemon’s IVs (a Bottle Cap caps the lowest IV, a Gold Bottle Cap caps every IV), earned as endgame minigame rewards.',
          'Fossils are a proper loop: each region hands out its fossil items (Kanto at Mt. Moon, Hoenn in the Route 111 desert, the rest on their late routes), the Sinnoh Underground digs up more, and the Cinnabar Island lab revives one at Lv. 30 into the finals that used to sit on the ordinary Raid Island.',
          'The Grand Auction House is the main source of battle held items now (marts no longer sell type boosters or competitive items): lots are held-item bundles and you pick how hard to raise (x1 / x2 / x4). The new Terrain Extender stretches the holder’s terrain from 5 to 8 turns.',
          'The Poke Ball Factory pays out more balls per shift (3, 5 or 8 by solve) and only the special balls marts do not sell.',
        ],
      },
      {
        heading: 'Minigames',
        items: [
          'Dynamax Adventures open with a scout (pick or re-roll one of three legendaries, cleared stages drop a pickup, too many KOs ends the run early, and beating the legendary awards a Nature Mint), and the Battle Royal is a proper 4-way round with 1st-to-4th placement, a cleared-round party heal, a rank ladder and a 25-win prize.',
          'Whack-a-Diglett speeds up as the round runs down and adds a rare Dugtrio jackpot, and the Game Corner slots have a 20-step prize track that hands over a random prize Pokemon (Scyther, Dratini or Porygon).',
          'The Poke Radar guarantees shinies up the chain (at 5, then 10, then 15) and the Poke Pelago companion panel is an interactive buddy stage with moods and little reactions.',
          'The Ruins of Alph puzzle hands over a random Unown form you are missing (all 28 forms exist with sprites and a Hidden Power kit), Snowpoint Temple is different every visit (four hand-designed Strength layouts plus hand-designed and procedurally generated ice rooms, all checked solvable), and Pokemon Musical can be played with the keyboard.',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Every fixed minigame now reports its result, so the Records panel has a Minigames section (cleared out of the full set and your best score in each) plus a Pokemon-owned / level-100 breakdown and a TMs-collected counter, and a second wave of achievements covers the minigames, the TM collection and owning 50 or 150 Pokemon.',
        ],
      },
      {
        heading: 'Fixes',
        items: [
          'Milestone rewards are paid the moment they are earned now: the achievement checker also watches the party, box, bag and minigame records, so a TM, a new team member, a maxed friendship or a cleared minigame is rewarded straight away.',
          'The player guide lists the correct shiny odds (1 in 4,096 base; the Shiny Charm 1 in 2,048 down to 1 in 256; swarms last 256 battles), and a location containing "fall" no longer tints the battle background as autumn.',
          'The guaranteed shiny is Poke Radar-only again: ordinary wild wins build a 1x / 2x / 3x / 4x multiplier at 40 / 80 / 120 in a row but no longer force a shiny.',
          'Alola and Paldea are playable again (starting there, or opening it with an Unlock Token, unlocks the entry island or province hub and its first area), and the Town Map no longer renders blank when you stand on a hidden sub-area.',
          'Town Map name labels no longer swallow clicks meant for a marker behind them, and hovering a route no longer makes its name flicker.',
          'Locked zone areas spell out what they still need instead of "???", appear in the Next Unlocks list, and travel checks the live unlock state so a loaded save cannot strand you.',
          'Wild encounters and trainer teams no longer field a Pokemon below the level it could evolve at, and route-exclusive catch gates list every exclusive on the route and ask for only a few of them.',
          'Zone sub-areas unlock in order behind their hub, and zone hubs show the Next Unlocks list as well as their own areas.',
          'Alola’s progression was repaired: island routes have varied gates, towns and the Poke Pelago require their island first, Route 2 no longer waits on the later Route 3, Hau’oli City lists both Ilima and Mina, Hapu stays locked until seven Z-Crystals, and Mossdeep’s leaders are correctly named Tate & Liza.',
          'Route-activity Pokemon carry the same type-appropriate items as ordinary wilds, Voltorb Flip clears as soon as every 2 and 3 is found (and every board guarantees one of each), and finishing one raid and starting another keeps your original location.',
          'Pokemon Musical’s arrows all match again: the left and right arrows were missing from the pixel font and fell back to a differently-sized one, so all four directions are now the same SVG arrow rotated to face the right way.',
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
          'Manual battle mode: toggle AUTO / MANUAL on the battle screen (or in Settings → Battles) to pick each move yourself, switch Pokemon with the SWITCH button, and choose who comes out when one faints. A battle left alone falls back to auto after a minute',
          'In manual battle mode the Champion no longer auto-switches Pokemon either, so nothing changes type behind your back; in auto mode its tactical switches are capped at two per battle and each swap now costs it a turn, giving your Pokemon a free hit',
          'Turning Manual back on after the one-minute idle fallback now waits a fresh minute instead of instantly dropping to auto again — which could auto-switch your active Pokemon the moment you took back control',
          'Trainer, gym, Elite Four and Champion battles now register the opposing Pokemon in the Pokedex as seen (and shiny seen) as they are sent out, just like a wild encounter',
          'Heal Block now works: for five turns the target cannot restore HP from any source — healing moves, drain moves, Aqua Ring, Ingrain, Wish, Poison Heal, Leftovers, berries and the rest',
          'The leftover stat moves now work: Power Split averages both battlers’ Attack and Sp. Atk, Guard Split averages their Defence and Sp. Def, and Speed Swap trades their raw Speed',
          'Protect-style moves now read at a glance: a successful Protect shows a shield over the battler and a "Blocked!" callout when it stops an attack, a repeat Protect on the very next turn fails with a "Failed!" callout instead of working forever, and the shield/callout is distinct per side',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Move-learning text is readable again: the tutor cost line in the move manager and its section labels use dark ink on the parchment panel, and the light move types (Electric, Ground, Ice, Steel) show dark text instead of white',
          'The stats-panel HP label now uses dark ink on the parchment background instead of low-contrast gold',
          'Physical, special and status moves now show clean inline icons in the battle move buttons, the move manager and a Pokemon’s summary, instead of the Unicode glyphs that rendered differently on every device',
          'Mega, Primal and Gigantamax forms no longer evolve: Gigantamax is no longer offered as an evolution, those forms can’t evolve further, and a save that stored a Pokemon in one of them reverts it to its base form',
          'Gigantamax is now a battle form fed by the new Max Mushroom (Kecleon Shop, 4 Victory Tokens): only Pokemon with a Gigantamax form can eat it, it grants them the Gigantamax Factor, and they Gigantamax for the rest of the battle like a Mega (reverting when it ends)',
          'The battle text box now has the Manual / Auto battle-mode button at its right end instead of on a row of its own above the move buttons, so the moves keep their full height',
          'Type chips are readable in every colour: each type now uses dark ink or white text depending on how light its background is, so Normal, Fire, Grass, Rock, Bug, Fairy, Flying and the rest no longer show white-on-light text in the move buttons, move manager, Pokedex or battle badges, and the muted grey label colour was lightened so it meets WCAG AA on the dark panels',
        ],
      },
      {
        heading: 'Interface',
        items: [
          'Your preferences — battle speed and style, auto-catch, notifications, accessibility, audio and more — are now stored separately from your save, so they survive a save reset and are shared across every save slot (an older save migrates its settings in on first load)',
          'Settings has a new Gameplay section that gathers auto-catch, always-catch-shinies and auto-proceed together with a battle-speed picker; exporting, importing and the confirmed reset now sit together under Save Data',
          'Browser notifications can be filtered per event: choose whether shinies, raids & legendaries and egg hatches raise an alert, on top of the master toggle',
        ],
      },
      {
        heading: 'Fixes',
        items: [
          'Battle info-box labels are readable again: the HP label, the level and the EXP label inside the parchment info box now use dark ink / darkened gold and blue instead of the low-contrast gold and pale blue borrowed from the dark panels (the HP label was only 1.7:1)',
          'Stat-changing moves work now: damaging moves that raise or lower a stat (Overheat, Superpower, Close Combat, Fire Lash, Shell Smash, Spin Out and the rest) actually apply it after the hit, instead of silently doing nothing. Several moves also had the wrong stats — Nasty Plot and Calm Mind no longer raise Attack as well, Howl, Autotomize, Power-Up Punch and Victory Dance buff the user rather than the foe, and Cotton Guard, Tail Glow, Lumina Crash and Shell Smash use their real amounts',
          'Stat boosts no longer carry between the Elite Four and Champion: each bout in the league gauntlet (and a rematch after healing) starts a fresh battle, so a Cosmic Power boost can no longer stack across the whole run and make the team nearly untouchable',
          'Gigantamax and other battle-only form changes no longer inflate HP: a form keeps the Pokemon’s own maximum, so Eternatus (Eternamax) and Zygarde-Complete can no longer snowball into effectively infinite HP over the course of a battle',
          'Wonder Trade no longer hands back a Mega, Primal or Gigantamax form: those battle-only forms were in the random pool, so a Link Cable could return a Pokemon that can never be owned (and was reverted on the next load)',
          'A Pokemon can no longer load with more current HP than its maximum: a save that carried an out-of-range HP (the HP bar stuck at full, the Pokemon nearly unkillable) is clamped when it loads, and leftover battle stat stages are dropped',
          'Wild Pokemon can no longer be caught twice from one battle: the idle loop now waits for a turn / catch to commit before acting again, so a fast battle speed can not replay the same victory and duplicate the catch',
          'A queued turn can no longer resolve after the battle has already ended, and the ATTEMPT CATCH button is disabled while a turn is still resolving',
          'Self-Destruct, Explosion, Misty Explosion and Memento now actually faint their user once they resolve',
          'Two-turn moves now take two turns: Solar Beam, Solar Blade, Razor Wind, Sky Attack, Skull Bash, Freeze Shock, Ice Burn, Geomancy, Meteor Beam and Electro Shot charge on the first turn and strike on the next, while Fly, Bounce, Dig, Dive, Phantom Force and Shadow Force go semi-invulnerable while charging and can only be hit by Earthquake / Surf / Gust and the like',
          'The Pokemon summary’s header is tidier: the name and level share a row, with nature, ability, held item and friendship in a chip strip beneath the types. A nature’s stat effect now lives in its hover tooltip instead of inline arrows, colour-coded with the raised stat in green and the lowered one in red',
          'Catch Settings now start with every ball enabled (the Master Ball keeps its own battle button), so the auto-catcher uses your best available ball instead of only Poke Balls',
          'Elite Four and Champion battles no longer flash the next Pokemon on screen before its trainer walks in — the incoming Pokemon stays hidden until the trainer actually sends it out',
          'Recoil moves (Double-Edge, Brave Bird, Flare Blitz, ...) now only hurt the user in proportion to the damage actually dealt: finishing off a nearly-fainted Pokemon no longer costs a huge chunk of HP from the overkill. Drain moves (Giga Drain, Drain Punch, ...) and Liquid Ooze scale the same way, and the damage number shown is the real damage dealt',
          'Explosion, Self-Destruct, Misty Explosion and Memento now really faint the user in the party — the self-KO was only applied to the battle copy, so the Pokemon came back at full HP afterwards (and a double knockout no longer pays the battle EXP twice)',
          'A Pokemon that fainted no longer earns EXP from the battle it went down in, and no longer dilutes the share of the Pokemon still standing: a mid-battle faint used to leave it collecting a partial share of the winner’s reward',
          'Manual battle text plays at the normal speed again instead of flashing past: the player’s picked move now resolves the turn immediately through a dedicated tick, rather than speeding up the whole loop (which had also rushed every event and battle line)',
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
        heading: 'Features',
        items: [
          'The game now adapts to any screen shape: on short or narrow windows (laptops, tablets, landscape phones) the battle scene scales down to fit instead of clipping the HP bars or move bar, and the party / box / location panels move into a tabbed layout rather than being squeezed off the edge',
          'The battle move bar no longer disappears on short screens, and the battle log keeps a few lines of room',
          'On ultrawide monitors (21:9 and 32:9) each side panel now splits into two columns and the battle scene grows to fill the centre instead of sitting in a sea of empty background',
          'Pop-up windows (Settings, patch notes, the move manager, the Pokédex) now fit inside narrow screens instead of running off the edge',
          'Phones respect screen notches and rounded corners (safe-area insets) and the battle scene sizes itself to the device in either orientation',
          'Save slots now say whether each run is Normal or Challenge and list the active rules',
          'Party order on phones: the mobile party panel now has up/down buttons on each Pokemon, since touch devices have no drag-and-drop',
          'The Town Map supports two-finger pinch-to-zoom on touch screens and its +/−/fit/centre buttons are touch-sized on phones',
          'Mobile layouts no longer run under the browser’s address bar: the dynamic-viewport height override was declared before the old fallback, so the bottom of the Map and item tabs is reachable again',
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
          'Opening a Pokemon in the Pokedex now has a Search Box button that jumps to the Box and pre-fills its search with that Pokemon’s name',
          'Unlock toasts (“Route X is now accessible!”) have a GO button that travels to the new area and dismisses the toast',
        ],
      },
      {
        heading: 'Fixes',
        items: [
          'New species no longer raise a toast for every first encounter — the Pokedex still records the sighting quietly',
          'The Settings and Poké Pelago modals are no longer clipped: the centre column no longer traps fixed-position overlays (Daily Quests and the Daily Event benefit too)',
          'Layout pass on crowded controls: the Box header no longer overlaps its pager with the Pokedex / Records / Daycare buttons, and toolbar / tab / save-button rows wrap instead of colliding',
          'The gym tab’s "GO TO <town>" hint is now a button: click it to travel straight to that leader’s town',
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
        heading: 'Regions',
        items: [
          'One-off NPC gifts and static encounters: towns and routes now offer a gift (an item pack, an Eevee, a regional starter, a Riolu, ...) or a fixed wild battle (a Snorlax blocking the road, a wiggling Sudowoodo, a honey-tree Munchlax, ...), each claimable once per save and listed in the location panel with any badge gate spelled out',
          'The Johto, Alola and Paldea starter gifts now hand over a random starter from that region (shown as its trio), and skip the starter you picked if it is your first region',
          'A town’s Poke Mart can now be collapsed from its header, and it stays collapsed on your next visit, so a long shop list no longer pushes the area’s encounters and activities off-screen',
          'Marts now stock different shelves: each region’s situational balls and held items are split between its towns instead of every mart listing the whole regional set',
          'Premier Balls are no longer sold — you get one free for every 10 balls you buy',
          'Swarms last 256 wild battles and their species has 4x shiny odds (never better than 1 in 256). They still announce themselves with a toast that names the area but not the Pokemon, so it stays a surprise until you arrive',
          'The Bag, Poke Mart, Reward Shop and Auction House now show a proper item sprite next to every item instead of a blank square',
          'The Bag uses category tabs (Poke Balls, Medicine, Candies, Items, Held Items, Valuables) instead of next/previous arrows, so you can jump straight to the pocket you want',
          'Selling moved to the Poke Mart: each mart now has a BUY / SELL toggle, so you sell your items where you shop instead of from the Bag',
          'The Weather Institute gift now sits on Hoenn Route 119 (where it belongs) and the invisible Kecleon static has moved to Route 120',
          'The League panel now shows each gym leader, Elite Four member and Champion’s team level range (e.g. Lv.12-16), and an earned badge lists it in its tooltip — so you can tell what you are walking into',
          'High-level wild areas no longer open before the region expects them: routes whose wilds jump far above the area that unlocks them (Paldea’s province areas, Alola’s late island routes, several end-game routes) now also require a party level closer to their wilds, so you cannot wander into Lv.70+ Pokemon with a starter team',
          'Every region’s opening route now starts at Lv. 3-5 instead of Lv. 5-7 (Galar’s opening route and the Slumbering Weald included), so a fresh starter has room to find its feet before the region’s curve starts climbing',
          'The Exp. Share is rebalanced: over 500 battles the active Pokemon gains 50% EXP and every other non-fainted party member gains 25% (it used to give the rest only 5%, but lasted 1000 battles)',
          'Marts now only buy back Valuables (Nuggets, Pearls, Stardust and the rest) — Potions, Poke Balls, held items and other gear can no longer be sold, so the treasure you find is the way to turn spare loot into cash',
          'The Elite Four and Champion are now challenged from the Pokemon League location itself (like gyms) — the location panel shows their teams and a BEGIN CHALLENGE button, and the League panel keeps the overview with a GO TO shortcut',
          'Kanto’s route gates now follow the story order: after Cerulean the road runs Route 5 → Vermilion (Lt. Surge) → Celadon (Erika) → the Rock Tunnel / Power Plant branch, and Saffron City opens after Vermilion instead of before it. Routes 6, 7, 9 and 10, Rock Tunnel and the Power Plant were re-levelled so the wild curve no longer spikes on the way to the third badge, and Lt. Surge’s team was trimmed to match',
          'When a region has nothing left to unlock, the location panel now shows a single Next Goal — beat its Champion to earn a Region Unlock Token, or spend a token you already hold — instead of listing far-off locations from a locked region',
          'Gym leaders are now challenged from the location panel while you stand in their town, like the Battle Tower and the other location activities; the League panel is now just an overview (badges, team levels, Elite Four and Champion) with a GO TO button to travel to any gym you have not reached yet',
        ],
      },
      {
        heading: 'Features',
        items: [
          'New games now open by asking Normal Mode or Challenge Mode: pick Challenge and you set the Randomizer, Level Scaling, Nuzlocke and Monotype rules before choosing a starter, and the same toggles stay in Settings for later changes',
          'Monotype no longer leaks other types onto a route that has none of your chosen type: it now rolls a random Pokemon of that type that could actually exist at the route’s level',
          'Monotype runs now skip the starter choice: you only pick the region, and begin with a random base of a three-stage evolution line of your chosen type',
          'Pokemon-reward minigames obey the Monotype challenge: fishing, Headbutt, Rock Smash, Diving, foraging, the Safari Zone, the Bug Catching Contest, Picnic and Dynamax Adventures all hand out a Pokemon of your chosen type',
          'In a Nuzlocke run, fainting your last Pokemon now ends the run on a Game Over screen, with the option to start a new save, instead of healing it back up',
          'The Challenge Mode setup screen now explains what each rule does, instead of leaving you to guess from the toggle names',
          'Nuzlocke now releases a Pokemon the moment it faints rather than batching the releases at the end of a battle; your last one is still spared',
          'New challenge: One Catch per Route — you may only catch the first wild Pokemon you meet on each route or area, and that first encounter uses the route up even if it gets away',
        ],
      },
      {
        heading: 'Interface',
        items: [
          'New Battle Reference page (/reference.html): a searchable breakdown of every move, ability and held item, showing what each one does in this engine and which are still inert. It is generated from the game data, so it stays in step with the engine',
          'The player guide now covers the Companion, Berry Garden and Poke Pelago, the full line-up of minigames and route activities, and gifts and static encounters, and its ability / move coverage notes are refreshed for the current engine',
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
          'Variable-power moves now work: Heat Crash and Heavy Slam scale with how much heavier the user is, Low Kick and Grass Knot with the target’s weight, Electro Ball and Gyro Ball with the speed gap, Flail / Reversal / Eruption / Water Spout / Dragon Energy with HP, Crush Grip and Wring Out with the target’s HP, Stored Power / Power Trip / Punishment with stat boosts, and Return / Frustration with friendship',
          'In-battle Mega Evolution: give a Mega-capable Pokemon the new held Mega Stone (from the Reward Shop, Kalos marts or the Auction House) and it transforms for the rest of the battle — taking the physical X forme or the special Y forme — with the forme’s stats, typing and ability, then reverting afterwards',
          'The Legends: Z-A Mega Evolutions are in: 47 more Megas (Mega Clefable, Victreebel, Emboar, Excadrill, Chandelure, Chesnaught, Greninja, Baxcalibur, Raichu X and Y, Mega Heatran/Darkrai/Zeraora, the Mega Absol / Garchomp / Lucario Z formes, and the rest) can now be reached with the Mega Stone',
          'The same Mega Stone now triggers Primal Reversion: Primal Groudon and Kyogre transform in battle with Desolate Land and Primordial Sea',
          'Mega Evolution is no longer offered as a level-100 evolution — the Mega Stone is the way to Mega Evolve, so a Lv.100 Pokemon no longer shows a redundant evolve option',
          'Gigantamax and the item-based alternate forms (Rotom appliances, Giratina-Origin, the Therian formes, Necrozma, Calyrex, ...) are no longer labelled as evolutions — their button reads FORM: <name> in blue and the scene says the Pokemon changed form',
          'Mega Evolution no longer raises a notification toast; the battle log and the transformed sprite still show it',
          'The battle screen’s MOVES button is gone — manage moves from a Pokemon’s summary instead (the Manage button in its stats panel)',
          'Moves that never miss (Swift, Aerial Ace, Aura Sphere, the G-Max moves and the rest) now truly cannot miss: they ignore accuracy and evasion stages instead of having their accuracy lowered by them, and their accuracy reads as an em dash rather than "101%"',
          'Battle status effects always show a three-letter tag now — including TOX for badly poisoned and PAR for paralysis — and the info nameplate reserves the tag’s space so it never jumps or resizes when a status lands or wears off',
          'Moves and abilities now have hover tooltips: hover a move (battle bar, Move Manager or a Pokémon’s summary) for its type, category, power, accuracy and a plain-English effect, and hover an ability for what it does — held items now show the same hover tooltip (their battle effect) in the party, Box and summary',
          'Held-item moves now actually act on the item: Thief and Covet steal it, Knock Off removes it, Pluck and Bug Bite eat a held Berry, and Incinerate burns one away — all stopped by Sticky Hold',
          'Wild Pokemon and trainers hold items far less often (8% / 30% down to 5% / 15%) and only from a sensible pool, so a random Pidgey no longer turns up with a Mega Stone or Choice Specs; type boosters match the holder, so a Water type never carries Charcoal',
          'A small item badge now marks any Pokemon holding an item in the party and in the Box',
          'A held item can now be taken back from a boxed Pokemon in its stats window — the Take button only searched the party before',
          'Auto-battling Pokemon now adapt to an ability that cancels an attack: once a move is absorbed or blocked (Water Absorb, Levitate, Flash Fire, Bulletproof, Wonder Guard and the rest) they switch to their next best move instead of repeating it — they are not told the ability up front, so the first attempt still goes through',
          'Foes now have AI skill tiers: wild Pokemon and route trainers throw out random attacks, legendary wilds and gym leaders play the full move-picking heuristic, and the Elite Four, Champion, Battle Tower and your own auto-battler always take the best action',
          'The Champion and your own auto-battler also switch Pokemon now: when the active one is losing the type matchup and a teammate lines up much better, they bring the teammate in',
          'Every Pokemon that took part in a battle now shares its EXP, not just the one that landed the final blow',
          'Switching a Pokemon in or using an item during a battle now uses up that turn: the foe still acts, and your Pokemon does not attack',
          'Set / Switch battle style in Settings → Battles: Switch (the default) lets your auto-battler switch to a better type matchup on its own, while Set never switches automatically',
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
          'Fishing, Rock Smash, Headbutt, Diving and foraging now show what you found before the battle — the Pokemon, its level and its bonuses — with a BATTLE or LET IT GO choice',
          'Activity encounters are now worth chasing: they spawn a few levels above the route, have boosted shiny odds, and can carry a held item (guaranteed on an ultra hit). Better hit quality improves all three',
          'Caught wild Pokemon now keep the IVs, ability and held item of the one you actually battled',
          'A minigame battle now offers an ATTEMPT CATCH button: throw your configured ball at the find (falling back to your best ball) instead of waiting for the auto-catcher',
          'Every minigame now ends on a reward screen that itemises what you won — money and each item by name — before you collect it, instead of tucking the prize into a line of text',
          'The minigames are livelier: Voltorb tiles flip, memory cards turn over, lights glow and pulse, targets pop, markers flicker, and the reward panel bursts in',
          'Headbutt no longer plays like Diving: hold one of three trees to charge a bar, then release in the green/yellow/cyan sweet spot to shake a Pokemon loose',
          'Headbutt and the Bug Catching Contest can now shake out two Pokemon at once. You can only engage one — pick your target and the other slips away with an “awwhh”',
          'Voltorb Flip: clicking a Voltorb now actually explodes — a burst on the tile, a board shake and a new explosion sound effect',
          'Fishing no longer hides a route-exclusive catch behind a perfect cast: the rarest Water species is back in the normal wild table and can be found while exploring, and a perfect cast instead just boosts the shiny odds and level',
          'The Town Map no longer badges fishing spots with a rod icon now that route activities live in the location panel',
          'Picnic rework: pick three fillings (each a different type), drop them between a bottom and top slice of Bread, and the finished sandwich lures out a wild Pokemon of one of the fillings’ types (chosen at random) at tripled shiny odds — the toppled or timed-out stack spawns nothing',
          'The Poke Ball Factory now pays out the situational balls (Quick, Timer, Repeat, Net, Dive, Dusk and Nest) instead of candy, more for a cleaner shift and with no cash payout — each ball is listed by its proper name and sprite. Those balls are no longer sold in any Poke Mart, so the factory is the only source (Poke, Great and Ultra Balls stay on the shelves, and Premier Balls still come free with every ten bought)',
          'Pokemon Musical gives real feedback: a PERFECT! / GREAT! / GOOD! / MISS callout with the points on every note, a pulsing combo badge and lane flash, a live score and accuracy readout, and a song progress bar',
          'Voltorb Flip reveals every Voltorb on the board once the run ends, so you can see where the bombs were hiding before you collect',
          'Pokestar Studios has twice as many film briefs and shuffles each shot’s takes, so the best take is no longer always in the top-left corner',
          'Curry Cooking now runs a 3-2-1 countdown before you take the fan, with a tighter sweet spot to keep the timing a challenge',
          'Poke Pelago opens as a full main-screen scene from the Alola Pelago location instead of a popup, with its Companion, Berry Fields and Islands tabs and an X to leave',
          'Bean Farm and Isle Caves collections now show a result card itemising exactly what you got — every item by name and sprite — and Training Isle workers show an EXP bar that fills up when you collect',
          'Three new region minigames: Castelia City’s Pokemon Musical (tap the four arrows on the beat), Cortondo’s Picnic (drop ingredients onto the sandwich without toppling it) and Laverre City’s Poke Ball Factory (rotate the conveyor tiles to link the inlet to the outlet)',
          'Violet City’s Ruins of Alph is a sliding picture puzzle — tap a stone tile beside the gap (or use the arrow keys) to shuffle the 3×3 picture back into order, and a quicker solve pays more',
          'Snowpoint City’s Snowpoint Temple is a four-room ice-slide maze — pick a direction and the hero slides until a wall or boulder stops them; clear every room to reach the heart, with a flawless run levelling a Never-Melt Ice and an Ice Stone',
          'The Safari Zone is now four areas — Center, East, North and West — each with its own Pokémon distribution and advertised rare finds (Tauros, Kangaskhan and Chansey in the Center; Dratini, Dragonair and Squirtle in the East; Scyther, Pinsir and Charmander in the North; Tangela, Bulbasaur and Exeggcute in the West). Switch areas freely between encounters, and Safari finds roll shiny at twice the usual odds',
          'The Safari Zone’s RUN button now darts straight back into the grass for the next Pokemon instead of stopping on a result screen',
          'The Safari Zone’s area picker now has a LEAVE option, so a run can end without spending the rest of the Safari Balls',
          'Minigames now react with sound: a soft tick for a tap, slide or rotation, a positive chime for a match, correct answer, good note or clean cast, a bigger fanfare for a perfect, combo or solved result, and a buzz for a miss or wrong answer (with the Sound Effects setting on)',
          'Puzzle League tiles are now Pokemon faces (Fire is Charmander, Water is Squirtle and so on) and the board animates: swapped tiles slide past each other, cleared tiles pop and then replacements drop in from above',
          'The Bug Catching Contest now judges only your single best catch for the podium — you still keep every bug you caught, but one run can no longer take all three places',
          'Pokeathlon now opens with a three-second countdown that explains the Sprint before it starts, so the first event no longer begins before you know what to do',
          'Poke Radar is fixed and themed: the first patch of each sequence is no longer cut short by a leftover timer, each sequence gets a short lead-in, and every grass patch now shows a route Pokemon hiding in the grass',
          'Snowpoint Temple no longer runs off the bottom of the screen: the ice board now sits beside a smaller D-pad, so the arrow buttons stay fully visible on the larger rooms',
        ],
      },
    ],
  },
  {
    version: '0.17.0',
    subtitle: 'Companion, Garden & Poké Pelago',
    sections: [
      {
        heading: 'Features',
        items: [
          'New Companion: pin one of your party Pokemon (the paw button in the top bar) and keep it fed, happy and rested. Care fades as you win battles, one care action is allowed per win, and a content companion grants +15% EXP',
          'New Berry Garden (the sprout button): plant Oran, Sitrus or Lum Berries in four plots, let them ripen over wild wins, and harvest a crop back into the bag',
          'Blend three Berries into a Poffin, which raises a party Pokemon’s friendship by 30 when used',
          'Oran Berries are sold at every Mart so the garden is easy to start',
          'Poké Pelago is here: a new island off Alola (Hau’oli City) that you visit from the Town Map. Companion care and the Berry Garden move there from the top bar and share one hub',
          'Companion care gained a Cleanliness stat and Pat, Brush and Wash actions, so there is more to do between battles. The +15% EXP bonus now needs all four care stats at 50+',
          'Three passive islands — the Bean Farm, Training Isle and Isle Caves — can be staffed with boxed Pokemon. They gather Poke Beans, EXP and items while you battle, banking rewards to collect when you return',
          'The Daycare now sits on a route in every region (Kanto Route 5, Johto Route 34, and so on) — open it from the location panel to pick two Box Pokemon and collect Eggs, instead of depositing from a Pokemon’s stats window. The breeding pair is shared across regions',
        ],
      },
    ],
  },
  {
    version: '0.16.0',
    subtitle: 'Minigames & Battle Items',
    sections: [
      {
        heading: 'Items',
        items: [
          'Held battle items are actually purchasable now: marts listed Leftovers, the Choice items, the type boosters and the rest, but the shop had no row for them, so they could never be bought',
          'Marts no longer all sell the same shelves: only the basics are common to every region, while each region has its own situational Poke Ball and handful of held battle items (the Underground still drops them all)',
          'The Sinnoh Underground now digs up those battle items too — type boosters, Choice Band / Specs / Scarf, Leftovers, Life Orb, Assault Vest, Eviolite, Focus Sash and Sitrus / Lum Berries — giving every held item a second source',
        ],
      },
      {
        heading: 'Minigames',
        items: [
          'Two new route activities: go Fishing on water routes and areas, or forage for berries and supplies in forests and gardens. Land the timing bar on the sweet spot — a hooked Pokemon starts a normal wild battle from that route',
          'Minigames now launch from where you are standing: the Game Corner, Bug Catching Contest, Underground and route activities appear as cards in the location panel instead of the League tab',
          'Fishing now uses rod tiers: the Old Rod only reaches the common Pokemon near the surface, the Good Rod reaches deeper mid-water species, and the Super Rod hooks the rarest in the deep with a level bonus',
          'You find a better rod each time you open another region — the Old Rod from the start, the Good Rod with a second region and the Super Rod with a third — and the fishing card and scene show the rod you are using and the next one to find',
          'Fishing is limited to 30 hand-picked water-rich routes (about three per region, marked with a rod on the Town Map), and a cast only ever hooks a Water Pokemon — a route with none has nothing to catch',
          'Every fishing route now guards an exclusive Water Pokemon. Hit the tiny centre of the cast bar — a fourth, smallest zone — to hook it. It is pulled out of the route’s normal wild table and marked with a fishing rod in the Wild Pokemon list',
          'Berry Foraging now plays as an expanding ring you time on the target instead of a left-to-right bar, so it no longer looks like fishing',
          'A successful search can now flush a Grass Pokemon out of the bush (more likely on a perfect search) and start a normal wild battle',
          'Fishing and foraging are easier to time: the marker sweeps slower (about 1.6s a pass) and the hit / perfect / centre zones are much wider, so the sweet spot is a bigger target',
          'Kanto’s Safari Zone is now playable: pay $500 for 30 free Safari Balls and roam the reserve. Bait calms a Pokemon but makes it harder to catch, while a Rock makes it easier to catch but far more likely to bolt — so the rare catches are a gamble',
          'Three new route activities join Fishing and Foraging: Rock Smash on cave routes finds Rock and Ground Pokemon, Headbutt on grassy routes finds Normal and Flying Pokemon, and Diving on water routes reaches the deeper Water Pokemon that fishing cannot',
          'Each activity has its own look — a swinging pickaxe, a marker bobbing up a tree trunk, and a descending depth gauge — so the timing game never looks the same twice',
          'Paldea’s Mesagoza Academy now runs the Academy Quiz: answer 10 type-matchup questions against a 10-second clock with 3 lives. Most ask which type is super-effective; some ask about immunities. A good score pays money and candy, and a perfect run earns a Rare Candy',
          'Unova’s Nimbasa City hosts Voltorb Flip: a 5×5 deduction board where every row and column advertises how many Voltorbs and how many points it hides. Flip the 2s and 3s to bank coins, clear a board to climb a level, and a single Voltorb ends the run',
          'Kalos’s Lumiose City opens the Grand Auction House: bid against hidden rival budgets for a lot of items. The appraiser gives a value range and the rivals drop out at their own ceilings, but win the hammer and you pay whatever you bid — even over the odds',
          'Hoenn’s Lilycove City runs the Pokémon Contest: pick a move each round for four rounds, matching the contest theme and chaining two different moves of the same type for a combo while avoiding repeats, then rank against the rivals',
          'Johto’s Ecruteak City hosts the Pokéathlon: three events — mash the Sprint, time the Hurdle and hit the moving Target — scored together for a gold, silver or bronze medal',
          'Sinnoh’s Sandgem Town raises the Poké Radar: watch the grass light up, repeat the sequence and build a chain that boosts the shiny odds of a route’s rarest species, with a wrong tap breaking it',
          'Alola’s Heahea City hosts the Battle Royal: an endless wave gauntlet for your party that heals a little between wins, with the purse growing the deeper you get',
          'Galar’s Max Lair (Hammerlocke) offers Dynamax Adventures: pick a path through three encounters, then face a legendary from Galar’s raid pool — beat it to add it to your team',
          'Hoenn’s Mauville City adds Lights Out: every tap toggles a tile and its four neighbours, and turning all 16 lights back on in a flawless few taps pays best',
          'Galar’s Motostoke lets you cook a Curry: match the customer’s flavour, then hold the fan to keep the campfire in the sweet spot while it simmers — a great curry is worth money and a full-heal Curry',
          'Unova’s Virbank City runs Pokéstar Studios: the director calls three shots and you pick the take that best matches each brief',
          'Johto’s Goldenrod City adds the Pokémon Puzzle League: swap adjacent tiles to line up three or more, clear them in cascades and score as much as you can in 12 swaps',
          'Hoenn’s Slateport City adds Pokémon Memory: flip cards two at a time to find all eight matching pairs, with fewer flips scoring better',
          'Kanto’s Vermilion City adds Whack-a-Diglett: tap each Diglett before it ducks back down and leave the Zubat alone across a 20-second round',
          'Every minigame is now explicitly tied to its map area: the Town Map tooltip for a point of interest names the minigame based there',
        ],
      },
      {
        heading: 'Interface',
        items: [
          'The Battle Tower now launches from Hoenn Route 111 itself: its opponent preview and FIGHT FLOOR button appear in the location panel, and the League tab simply points you there',
        ],
      },
      {
        heading: 'Fixes',
        items: [
          'The trainer name banner no longer overlaps the top-bar buttons during trainer battles',
        ],
      },
    ],
  },
  {
    version: '0.15.0',
    subtitle: 'Challenges & Save Slots',
    sections: [
      {
        heading: 'Features',
        items: [
          'New Monotype challenge: limit wild encounters to a single type. Pick it on the starter screen or in Settings — a route with no on-type Pokemon falls back to its normal table so a run can’t soft-lock, and off-type roamers stay away',
        ],
      },
      {
        heading: 'Fixes',
        items: [
          'The game keeps up to three independent save slots. When more than one holds a save you choose which to continue at boot, and Settings → Save Slots can play, start a new game in, or delete any slot',
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
        heading: 'Battles',
        items: [
          'Weather and terrain now change moves: Weather Ball switches type and doubles its power, Thunder and Hurricane never miss in rain (Blizzard in snow), and the terrain synergy abilities work',
          'A large batch of status and utility moves is live: Focus Energy, Aqua Ring, Wish, Yawn, Topsy-Turvy, Pain Split, Safeguard, Mist, Encore, Disable, Perish Song, Tailwind, Trick Room, Destiny Bond, Ingrain, Laser Focus and Lock-On, plus Life Dew / Jungle Healing / Lunar Blessing',
          'Ability and type manipulation works: Gastro Acid, Worry Seed, Simple Beam, Role Play, Entrainment and Skill Swap; Soak, Magic Powder, Reflect Type and Forest’s Curse / Trick-or-Treat; Power / Guard / Heart Swap; Recycle; and Metronome / Copycat / Mirror Move / Nature Power',
          'The bulk of the ~300 abilities are now modelled — attacking and defensive modifiers, stat shaping, switch-in effects, field auras, contact reactions, recovery, speed / priority / accuracy, type-changing and ability suppression',
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
          'Zones group a map node into named areas: Galar’s Wild Area, Alola’s islands, Paldea’s provinces and Area Zero each open an area picker with their own wild Pokemon',
          'Galar’s Isle of Armor and Crown Tundra and Paldea’s Kitakami and Terarium are post-game zones, and the 17 missing Gen 9 DLC species joined — shrinking the Galar, Paldea and Alola Raid Islands as those species found native routes',
          'Every region now describes its own league: Alola runs the island trials for Z-Crystals, Galar’s endgame is the Champion Cup, and Paldea’s gyms can be tackled in any order. The Gyms tab is now the League tab',
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
        heading: 'Pokemon',
        items: [
          'Female Pokemon show their female artwork everywhere the species differs, and save reliability was fixed for speed, travel and standalone option changes',
        ],
      },
      {
        heading: 'Minigames',
        items: [
          'Four location-based minigames: the Sinnoh Underground, Johto Bug Catching Contest, Kanto Game Corner slots and Hoenn Battle Tower. They unlock by reaching their place and play out on the main stage, pausing the rest of the game',
          'The Bug Contest ends on a top-3 podium with cash and candy prizes; the Game Corner is a 3×3 Pokemon slot machine; the Battle Tower floors are fixed seeded puzzles with a next-floor preview, and a loss keeps you on the floor',
          'The Move Tutor teaches each Pokemon’s real TM moves for $4,000, and Wonder Trade now plays a short main-stage animation',
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
          'Tower floors became deterministic puzzles: the roster is seeded from the floor, battles run without luck, and the panel previews the next floor',
        ],
      },
      {
        heading: 'Items',
        items: [
          'Pokemon can hold items again: Leftovers, Life Orb, the Choice items, Assault Vest, Eviolite, Focus Sash, Sitrus and Lum Berries and the type boosters — with a Held Items bag tab. Wild and trainer Pokemon hold them too',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Added the Nuzlocke challenge toggle — fainted party Pokemon are released, and the last one is always spared',
        ],
      },
    ],
  },
  {
    version: '0.10.0',
    subtitle: 'Battle Depth & Collection',
    sections: [
      {
        heading: 'Pokemon',
        items: [
          'Every Pokemon has a real ability (with a hidden-ability roll) and a friendship value, and friendship evolutions now require friendship 160',
          'Eight situational Poke Balls (Quick, Timer, Repeat, Net, Dive, Dusk, Nest and Premier) with auto-catch picking the best one',
          'Eggs inherit three of the parents’ best IVs, a 50% chance of a parent’s nature, and any moves the hatchling can learn; Honey and Repel lock in a DexNav hunt once a chain reaches 4',
        ],
      },
      {
        heading: 'Battles',
        items: [
          'Healing, multi-hit, Protect / Detect and high-crit moves now work, with corrected priorities and an auto-battler that heals and sets up',
          'Status conditions (paralysis, bad poison and confusion) and their moves, Reflect / Light Screen, accuracy and evasion stages, and Leech Seed',
          'Master Ball throwing is a manual, animated action shown only for legendaries or hard-to-catch species',
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
        heading: 'Features',
        items: [
          'Offline progress and a “While You Were Away” report, Daily Events with a Daily Gift, Daily Quests, and one-off achievement rewards',
          'Optional browser notifications and a hidden-tab away summary, plus floating combat feedback that respects reduced motion',
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
        heading: 'Battles',
        items: [
          'Deeper Tower floors now keep getting harder: past floor 25 the trainers’ stats rise by 3% per floor instead of plateauing at level 100',
        ],
      },
      {
        heading: 'Interface',
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
        heading: 'Regions',
        items: [
          'A region’s uncaught legends can now show up as a rare roamer on any of its routes',
          'A roamer may flee each turn — catch it fast, and once caught it leaves the roaming pool',
        ],
      },
      {
        heading: 'Pokemon',
        items: [
          'Deposit two Pokemon from their stats panel into the Daycare; they produce an Egg after 50 battles',
          'Breeding respects gender and egg groups — the parents must be opposite genders and share an egg group; Ditto can breed with anything, while genderless and Undiscovered Pokemon need a Ditto (or cannot breed at all)',
          'Eggs hatch into the mother’s base form at level 1 with 1 in 4,096 shiny odds — improved to 1 in 512 if a parent is shiny',
        ],
      },
      {
        heading: 'Battles',
        items: [
          'Moves can now poison, burn, freeze, sleep and flinch their target — poison and burn deal damage every turn, burn halves physical attack, and sleep/freeze stop the Pokemon acting',
          'Drain moves (Absorb, Giga Drain, ...) heal the user for part of the damage dealt',
          'Status conditions show as a badge beside each Pokemon’s HP bar in battle',
          'Once a region’s Champion is beaten, its Gyms tab offers an endless Battle Tower: steadily stronger trainers, your team healed between floors, for Victory Tokens that scale with depth',
          'A loss ends the run; your best floor per region is tracked and shown in the Records panel',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Spend a Link Cable from a Pokemon’s stats panel to trade it for a random Pokemon of the same level',
          'Wonder Trade Pokemon have a boosted 1 in 512 chance of being shiny',
          'Occasionally a swarm breaks out on a random unlocked route, making one of its rarer species very common for 50 battles',
          'The route’s Wild Pokemon header shows the active swarm and its remaining battles',
          'A set of 21 medals now tracks your milestones — battles, Pokedex, shinies, badges, Champions, prestige and the Battle Tower',
          'They appear at the top of the Records panel with your earned/unearned count',
          'Consecutive encounters of the same species build a shiny chain that improves its shiny odds — up to 4x at 120 in a row',
          'The chained species shows a ✦ badge on its encounter tile',
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
        heading: 'Regions',
        items: [
          'Beating a region’s Champion now earns an Unlock Token — spend it from the Town Map to open any region you like, instead of following a fixed order',
          'Locked region tabs glow while you have a token; click one to open it',
        ],
      },
      {
        heading: 'Pokemon',
        items: [
          'The Reward Shop now stocks working evolution items: Sun, Dusk, Shiny, Dawn, Ice and Oval Stones, plus Link Cable, King’s Rock, Metal Coat, Protector, Electirizer, Magmarizer, Razor Claw, Razor Fang, Reaper Cloth, Deep Sea Tooth/Scale, Upgrade, Dubious Disc, Sachet, Whipped Dream, Sweet/Tart Apple, Cracked Pot and the Galar/armor items',
          'Pokemon that normally evolve by trade — Kadabra, Machoke, Graveler, Haunter, Boldore, Gurdurr, Phantump, Pumpkaboo and more — now evolve with a Link Cable',
          'Stone evolutions (Pikachu, Eevee, Vulpix, Growlithe, Gloom, Clefairy, Kirlia and many others) use their stone instead of levelling up',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Once you finish a region, the Gyms tab offers a Prestige button that replays its routes and badges without losing your Pokemon, items, money or Pokedex',
          'Prestige level is tracked per region and each reset awards Victory Tokens',
          'Prestige requires the region’s Elite Four to be beaten again, and re-locks its badge gates',
          'Route-exclusive catch goals now name the species they want, and the Wild Pokemon grid flags which tiles are exclusive to that route',
          'Cinnabar Island has a 1 in 1,000 chance of a MissingNo. encounter instead of a trainer battle',
        ],
      },
      {
        heading: 'Fixes',
        items: [
          'Badge requirements count only their own region’s badges, so prestiging a region properly re-locks its gates',
        ],
      },
    ],
  },
  {
    version: '0.6.0',
    subtitle: 'Balance Pass — Encounters, Forms & Trainers',
    sections: [
      {
        heading: 'Pokemon',
        items: [
          'Route tables no longer include radio/Poke Radar/dual-slot crossovers, in-game trades, fossil items, swarms or headbutt/honey-tree species',
          'Static legendaries moved off regular routes and onto the Raid Islands',
          'The Kanto Raid Island now works like every other region’s',
          'Paldea’s open-world areas were trimmed to their most common species, with the rest moved to its Raid Island',
          'Every species can now be obtained — including Mega, Gigantamax, regional and paradox forms',
          'Mega and Gigantamax forms are level-100 evolutions; regional forms live on their region’s Raid Island',
          'Every Pokemon now has a move set (forms and a few species used to enter battle with no moves)',
          'The Pokedex "All" tab counts only the national dex, so completion is now reachable',
        ],
      },
      {
        heading: 'Trainers',
        items: [
          'Route trainers and gym leaders no longer field unevolved Pokemon far past their evolution level',
          'Generated trainers now have names like "Bug Catcher Joey" instead of "Route 2 Trainer 1"',
          'Poke Marts open up gradually — Ultra Balls and Repel are no longer sold in the first town',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Some routes now ask you to catch Pokemon that spawn only there, a harder, route-specific cousin of the old "catch X Pokemon" goal',
          'Legendaries, starters and ultra-rare finds are left out so the goal stays fair',
        ],
      },
      {
        heading: 'Interface',
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
        heading: 'Regions',
        items: [
          'Eight new regions are now reachable: Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar and Paldea',
          'Your chosen region is open from the start; every other region unlocks after you beat the previous region’s Elite Four and Champion',
          'Within a region, routes unlock as you win battles on the previous route',
          'Every region reproduces its real map — actual towns and routes with their genuine connections — plus a Raid Island and gyms',
          'The Town Map now has region tabs — switch between regions to view their routes',
          'Locked regions are greyed out until you reach them',
          'Wild Pokemon now scale dynamically per zone — each route sits in a tight level band based on how far into the region it is',
          'Every region runs its own 5-75 curve, so wilds, trainers, gyms, the Elite Four and the Champion all ramp together within each region',
        ],
      },
      {
        heading: 'Pokemon',
        items: [
          'Pick a starter from any of the nine regions — your choice determines where your journey begins',
          'Each region’s three starter Pokemon can also be found as rare encounters on its first route',
          'Over 700 species are obtainable as wild encounters across all nine generations',
          'Routes now spawn their real wild Pokemon (authentic per-route encounter tables), not arbitrary picks',
          'The Shiny Charm now unlocks once you complete the wild Pokedex (previously a fixed 151)',
        ],
      },
      {
        heading: 'Trainers',
        items: [
          'Each region has its own 8 gym leaders, Elite Four and Champion',
          'Gym badges gate the road onward — a route that needs a badge stays shut until you beat that leader (backtracking to them if you passed their town early), and the league demands all eight badges',
          'Badges, gym order and the league challenge are all per-region',
          'Beating a region’s Champion is what opens up the next region',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Each region has a Raid Island holding that generation’s Pokemon you can’t catch anywhere in the region',
        ],
      },
    ],
  },
  {
    version: '0.4.0',
    subtitle: 'Repel & Honey, Exp. Share, Mobile Layout & QoL',
    sections: [
      {
        heading: 'Pokemon',
        items: [
          'Starters (Bulbasaur, Charmander, Squirtle) can now be found as ultra-rare encounters in the Safari Zone',
          'Omanyte and Kabuto now evolve into Omastar and Kabutops at level 40',
          'Added "Ultra Rare" rarity tier for the rarest encounters',
        ],
      },
      {
        heading: 'Items',
        items: [
          'New consumable items: Repel (halves encounter weight) and Honey (doubles encounter weight) for a specific Pokemon on a route, lasting 500 battles',
          'Buy them from any Poke Mart for $2,000 each',
          'Apply from the detail panel by clicking a Pokemon tile, or use the new selector mode buttons in the Wild Pokemon header to batch-apply by clicking tiles directly',
          'Active effects show as blue "R" and yellow "H" badges on encounter tiles',
          'Active effect durations are displayed in the battle log and detail panel',
          'Re-using on the same species extends the duration instead of stacking',
          'New item available in the Reward Shop for 2 Victory Tokens',
          'When active, the battling Pokemon receives 50% EXP and all non-fainted party members receive 5% EXP each',
          'Lasts 1000 battles — activate from your Bag',
          'Party members can level up and learn moves from shared EXP',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Complete the Pokedex (catch all 151 Pokemon) to unlock the Shiny Charm',
          'Doubles shiny encounter odds from 1/8192 to 1/4096',
          'Applies to wild encounters and raid legendaries',
          'Check your shiny stats and charm status in the ? info menu',
        ],
      },
      {
        heading: 'Interface',
        items: [
          'Completely new responsive layout for screens under 768px',
          'Tabbed navigation: Battle, Location, Party, Box, and Map tabs',
          'Battle scene scales to fit the screen width',
          'Battle log auto-hides when space is too tight',
          'Default catch mode changed from "Always" to "Pokedex New" for less ball waste',
          'Route 6/Vermilion unlock order swapped with Route 7/Celadon for better progression flow',
          'Safari Zone encounter weights rebalanced for smoother distribution',
          'Duplicate move learning is now prevented — Pokemon won’t re-learn moves they already know',
          'Move manage panel now validates the active Pokemon hasn’t changed mid-edit',
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
        heading: 'Pokemon',
        items: [
          'Previously all Pokemon would have full 15 IVs, now they will be randomly assigned just like in the games',
        ],
      },
      {
        heading: 'Battles',
        items: [
          'Recoil moves (Take Down, Submission) now deal damage back to the user',
          'Hyper Beam now requires a recharge turn after use',
          'Self-Destruct causes the user to faint after dealing damage',
          'Multi-turn moves (Outrage, Petal Dance) lock the user in for 2–3 turns, then cause confusion self-damage',
          'High Jump Kick now damages the user on a miss',
          'Status moves now actually work! Swords Dance, Amnesia, Barrier, Harden, Sharpen, and Defense Curl boost your stats in battle',
          'Growl, Leer, and Tail Whip lower the opponent’s stats',
          'Stat changes range from -6 to +6 and reset each battle',
          'Your Pokemon now considers move drawbacks when picking attacks — it won’t blindly spam Hyper Beam over Flamethrower',
          'Trainer Pokemon also weigh drawbacks when choosing moves',
          'Stat stages are factored into move selection for both sides',
        ],
      },
      {
        heading: 'Features',
        items: [
          'Legendary Pokemon (Articuno, Zapdos, Moltres, Mewtwo, Mew) have been removed from wild encounters',
          'New Raid Island location unlocks after defeating the Champion',
          'Click Raid Island to heal your party and fight a random legendary repeatedly until you wipe or leave',
          'Legendaries will grow stronger as you beat them, you’ll need a strong team to have the best odds of catching them',
          'Normal catch logic applies during raids — use your default ball settings',
          '10-minute cooldown between raids, persists across refreshes',
        ],
      },
    ],
  },
  {
    version: '0.2.0',
    subtitle: 'Gym Leaders, Elite Four, Evolution Items & More',
    sections: [
      {
        heading: 'Regions',
        items: [
          'Unlock criteria reworked: routes now unlock based on battles fought at specific locations and badges earned, instead of a flat total battle count',
        ],
      },
      {
        heading: 'Pokemon',
        items: [
          'Pokemon that evolve by stone or trade can now be evolved using these items from the stats panel',
          'Pokemon with multiple evolution options (e.g. Eevee) show all options side by side',
        ],
      },
      {
        heading: 'Trainers',
        items: [
          'All 8 Kanto gym leaders are now in the game! Defeat them in order to earn badges and progress',
          'Each gym leader has their classic team from the original games',
          'After earning all 8 badges, take on the Elite Four gauntlet — Lorelei, Bruno, Agatha, and Lance back-to-back',
          'Defeat all four to face Champion Blue and his full team of 6',
        ],
      },
      {
        heading: 'Items',
        items: [
          'Earn Victory Tokens by defeating gym leaders for the first time (1 token per gym) and completing the Elite Four gauntlet (1 token per champion defeat)',
          'Spend tokens in the new Reward Shop (accessible from the Gyms tab) on evolution items:',
          'Fire Stone, Water Stone, Thunder Stone, Leaf Stone — 1 token each',
          'Moon Stone, Link Cable — 2 tokens each',
        ],
      },
      {
        heading: 'Interface',
        items: [
          'New toggle button (▶▶) next to the settings gear in the battle scene',
          'When enabled, automatically travels to newly unlocked locations so you can idle hands-free',
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
