// Ambient types for the globals injected by assets/gameDataInjector.js,
// plus the core game state shapes used across src/.

type StatBlock = {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

type Species = {
  id: number
  name: string
  types: string[]
  baseStats: StatBlock
  baseExpYield: number
  growthRate: string
  catchRate?: number
  [key: string]: any
}

/** Gender rate (-1 genderless, 0 male-only, 8 female-only, else eighths female) + egg groups. */
type BreedingData = {
  genderRate: number
  eggGroups: string[]
  undiscovered: boolean
}

/** A move id -> move definition lookup is data-driven; keep it loose. */
type Move = {
  name: string
  type: string
  category: string
  power: number
  accuracy: number
  priority?: number
  effect?: any
  [key: string]: any
}

type BattlePokemon = {
  speciesKey: string
  name: string
  types: string[]
  level: number
  currentHp: number
  maxHp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
  moves: string[]
  isShiny?: boolean
  isPlayer?: boolean
  statStages?: Record<string, number>
  mustRecharge?: boolean
  lockedMove?: string | null
  lockTurnsRemaining?: number
  status?: string | null
  statusTurns?: number
  flinch?: boolean
  /** A roaming legendary, which may flee the battle. */
  isRoamer?: boolean
  [key: string]: any
}

type Pokemon = BattlePokemon & {
  id: string
  totalExp: number
  ivs: Record<string, number>
  /** Pre-hyper-training IVs, so a bred egg can't inherit the boosts. */
  naturalIvs?: Record<string, number>
  /** One of the 25 nature keys (see src/data/natures.js). */
  nature?: string
  /** Friendship (0-255), raised by battling and levelling; gates friendship evolutions. */
  friendship?: number
  /** This Pokemon's ability (see ability-data.json). */
  ability?: string | null
  /** Equipped held item (see heldItems). */
  heldItem?: string | null
  /** Favourited Pokemon are protected from Release and Wonder Trade. */
  favourite?: boolean
  /** Gigantamax Factor (mark): set by the Max Mushroom, lets it Gigantamax in battle. */
  gmax?: boolean
  /** Optional player-given nickname (max 12 characters). */
  nickname?: string
  /** Stored gender, e.g. rolled by the Bug Catching Contest. Falls back to a species-derived value. */
  gender?: 'male' | 'female' | 'genderless'
  /** An unhatched egg: it cannot battle and hatches after `eggStepsRemaining` wild wins while in the party. */
  isEgg?: boolean
  eggStepsRemaining?: number
  /** Egg moves this Pokemon inherited by breeding; re-learnable for this individual. */
  eggMoves?: string[]
  /** Per-individual size (0-255), shown as an XS-XL rating (see game/pokemon/sizes.js). */
  size?: number
  /** Ribbon ids this individual has earned (see game/ribbons.js). */
  ribbons?: string[]
  isShiny: boolean
}

/** A saved party arrangement (see game/reducer/pokemon/team-presets.js). */
type TeamPreset = { id: string; name: string; members: string[] }

/** A pinned companion and its care stats (see game/companion.js). */
type Companion = {
  id: string | null
  fullness: number
  happiness: number
  energy: number
  cleanliness: number
  /** Wild-battle count at the last care action, for the one-per-win limit. */
  careBattle: number
}

/** One Berry Garden plot: a growing berry, or null when empty. */
type GardenPlot = { berryId: string; battlesRemaining: number } | null

/** The Berry Garden (see game/garden.js). */
type Garden = { plots: GardenPlot[] }

/** Poké Pelago's passive islands (see game/pelago.js). */
type PelagoIsland = { assigned: string[]; progress: number; ready: number }
type Pelago = Record<string, PelagoIsland>

/** Field Jobs: a Pokemon auto-running a route activity (see game/jobs.js). */
type FieldJob = {
  locationId: string
  activityId: string
  pokemonId: string
  progressMs: number
  cycleMs: number
  money: number
  items: Record<string, number>
  encounters: { speciesKey: string; level: number }[]
  cycles: number
}
type FieldJobs = Record<string, FieldJob>

/** The result of collecting a Pelago island, shown once in a card. */
type PelagoCollect = {
  islandId: string
  /** Banked completions that were collected. */
  count: number
  /** Aggregated item haul (Bean Farm / Isle Caves). */
  items: { itemId: string; quantity: number }[]
  /** EXP each Training Isle worker gained. */
  exp: number
}

/** Traits a Daycare egg can inherit from its parents. */
type BreedingInheritance = {
  /** Complete IV block (3 stats take the best of both parents). */
  ivs?: Record<string, number>
  /** A nature inherited from a parent, or a random one. */
  nature?: string
  /** Start moves, including any moves the parents passed down. */
  moves?: string[]
  /** Egg moves inherited from a parent (see egg-moves.json). */
  eggMoves?: string[]
  /** A size to pass down instead of rolling a fresh one. */
  size?: number
}

type Inspected = { source: string; id: string } | null

type ActiveItem = {
  id: string
  name: string
  description: string
  duration: number
  buyPrice: number | null
}

type ConsumableItem = {
  id: string
  name: string
  description: string
  /** Bag tab: medicine and candy can be used, items are used on a Pokemon, valuables are sold. */
  category: 'medicine' | 'candy' | 'items' | 'valuables'
  buyPrice: number | null
  sellPrice: number | null
  /** HP restored by a healing item (omitted for a full heal). */
  heal?: number
  /** Heal/revive to full HP. */
  full?: boolean
  /** Revive a fainted Pokemon instead of healing a conscious one. */
  revive?: boolean
  /** Flat EXP granted by an Exp. Candy. */
  exp?: number
  /** Levels granted by a Rare Candy. */
  levelUp?: number
  /** Re-rolls the target's nature instead of healing/levelling it. */
  natureMint?: boolean
  /** Raises the target's friendship by this much (Poffin). */
  friendship?: number
  /** Grants the Gigantamax Factor (mark) to a Pokemon that has a G-Max form. */
  grantsGmax?: boolean
  /** Hyper-trains the target: `lowest` caps its lowest IV at 31, `all` caps every IV. */
  ivTraining?: 'lowest' | 'all'
  /** Changes the target's ability: `capsule` cycles its normal abilities, `patch` toggles the hidden one. */
  abilityChange?: 'capsule' | 'patch'
}

type PokeBall = {
  id: string
  name: string
  description: string
  buyPrice: number | null
  ballModifier: number
}

type HeldItem = {
  id: string
  name: string
  description: string
  buyPrice: number | null
  sellPrice: number | null
  effect: any
}

type CatchRule = {
  enabled: boolean
  mode: string
  levelThreshold: number
  enabledBalls: string[]
}

/** Active field weather for the current battle. */
type BattleWeather = { type: string; turns: number }

/** Active field terrain for the current battle. */
type BattleTerrain = { type: string; turns: number }

/** Extra information a situational ball needs at catch time. */
type CatchContext = {
  /** Target's level (Nest Ball). */
  level?: number
  /** Target's types (Net Ball). */
  types?: string[]
  /** Whether the species is already registered in the Pokedex (Repeat Ball). */
  alreadyCaught?: boolean
  /** How many turns the battle lasted (Quick / Timer Ball). */
  turn?: number
  /** Whether the current route is water (Dive Ball). */
  isWater?: boolean
  /** Whether the current route is a cave (Dusk Ball). */
  isCave?: boolean
  /** Whether it is night locally (Dusk Ball). */
  isNight?: boolean
  /** Whether Honey is boosting this species on the route (catch bonus). */
  honey?: boolean
}

type VolatileState = {
  statStages: Record<string, number>
  mustRecharge: boolean
  lockedMove: string | null
  lockTurnsRemaining: number
  /** Move a Choice item has locked the holder into, or null. */
  choiceLock?: string | null
  /** Consecutive turns the same move has been used (Round / Echoed Voice). */
  sameMoveStreak?: number
  /** Move being charged for a two-turn attack, or null. */
  chargingMove: string | null
  /** Semi-invulnerable charge state (air/ground/water/vanish), or null. */
  semiInvulnerable: string | null
  /** Major status condition (poison/toxic/burn/freeze/sleep/paralysis) or null. */
  status: string | null
  /** Remaining sleep turns, or the escalating toxic counter. */
  statusTurns: number
  /** One-turn flinch flag. */
  flinch: boolean
  /** Turns of confusion left (0 when not confused). */
  confusionTurns?: number
  /** Leech Seed is draining this Pokemon each turn. */
  leechSeeded?: boolean
  /** Focus Sash / berry consumed for this battle. */
  heldItemUsed?: boolean
  /** The pinned companion has already toughed out a knockout this battle. */
  toughOutUsed?: boolean
  /** Consecutive turns the battler has used a Protect-style move. */
  protectChain?: number
  /** Turns of Taunt left (0 when not taunted). */
  tauntTurns?: number
  /** Turns of Heal Block left (0 when healing freely). */
  healBlockTurns?: number
  /** Remaining hit points of a Substitute (0 when none). */
  substituteHp?: number
  /** Infatuation (Attract) is active. */
  infatuated?: boolean
  /** A Ghost-type Curse is draining this Pokemon each turn. */
  cursed?: boolean
  /** Remaining turns of Reflect / Light Screen (0 when down). */
  screens?: { reflect: number, lightScreen: number }
  /** Focus Energy is active (adds 2 critical-hit stages). */
  focusEnergy?: boolean
  /** Aqua Ring heals this Pokemon each end of turn. */
  aquaRing?: boolean
  /** Turns until Yawn puts this Pokemon to sleep (0 when not drowsy). */
  yawnTurns?: number
  /** Turns until a pending Wish heals the user's side (0 when none). */
  wishTurns?: number
  /** How much HP that pending Wish restores. */
  wishHeal?: number
  /** The last move this Pokemon attempted (for Encore / Disable). */
  lastMove?: string | null
  /** Turns Encore locks this Pokemon into `encoreMove` (0 when free). */
  encoreTurns?: number
  /** The move Encore keeps forcing. */
  encoreMove?: string | null
  /** Turns Disable blocks `disabledMove` (0 when free). */
  disableTurns?: number
  /** The move Disable blocks. */
  disabledMove?: string | null
  /** Turns Safeguard blocks status conditions (0 when down). */
  safeguardTurns?: number
  /** Turns Mist blocks stat drops (0 when down). */
  mistTurns?: number
  /** Perish Song countdown: faints at 0 (0 when not counting). */
  perishTurns?: number
  /** Tailwind doubles this Pokemon's side Speed while above 0. */
  tailwindTurns?: number
  /** Trick Room reverses the speed order while above 0. */
  trickRoomTurns?: number
  /** Turns Destiny Bond drags down whoever faints the holder (0 when off). */
  destinyBondTurns?: number
  /** Ingrain heals this Pokemon each end of turn. */
  ingrained?: boolean
  /** The next damaging move is a guaranteed critical hit. */
  laserFocus?: boolean
  /** The next damaging move cannot miss (Lock-On / Mind Reader). */
  lockOnTurns?: number
  /** Ability replaced by Skill Swap / Role Play / Entrainment / Worry Seed. */
  abilityOverride?: string | null
  /** Gastro Acid has suppressed this Pokemon's ability. */
  abilitySuppressed?: boolean
  /** Types replaced by Soak / Magic Powder / Reflect Type / Forest's Curse. */
  typesOverride?: string[] | null
  /** Disguise (Mimikyu) has already absorbed a hit. */
  disguiseBroken?: boolean
  /** Ice Face (Eiscue) has already absorbed a physical hit. */
  iceFaceBroken?: boolean
  /** Held item after Trick / Magician / Pickpocket / Bestow / Corrosive Gas. */
  heldItemOverride?: string | null
  /** Whether `heldItemOverride` is set (so a null item is distinguishable). */
  heldItemOverridden?: boolean
  /** Mid-battle form (species key) the Pokemon has changed into. */
  formKey?: string | null
  /** Truant's alternating loaf-around flag. */
  truantSkip?: boolean
  /** Turns of Slow Start left (halves Attack and Speed while above 0). */
  slowStartTurns?: number
  /** Hunger Switch's alternating Hangry form flag. */
  hangry?: boolean
  /** Charged by Electromorphosis / Wind Power / Charge: next Electric move doubles. */
  charged?: boolean
  /** Turns of Magnet Rise left (immune to Ground moves while above 0). */
  magnetRiseTurns?: number
  /** Endure is active this turn (survive a hit at 1 HP). */
  enduring?: boolean
  /** The holder has spent its one Z-Move this battle. */
  zMoveUsed?: boolean
  /** The foe is identified (Foresight / Odor Sleuth / Miracle Eye). */
  identified?: boolean
  /** Turns of Lucky Chant left (no critical hits taken). */
  luckyChantTurns?: number
  /** Stockpile count (0-3) for Stockpile / Spit Up / Swallow. */
  stockpile?: number
  /** Turns of Torment left (cannot repeat the last move). */
  tormentTurns?: number
  /** Nightmare is active (sleeping target takes damage each turn). */
  nightmare?: boolean
  /** Turns of Gravity left (grounds Flying types). */
  gravityTurns?: number
  /** Turns the Pokemon is telekinetically lifted. */
  telekinesisTurns?: number
  /** Turns a weakened type (Mud Sport / Water Sport) lasts. */
  sportTurns?: number
  /** The weakened type: 'mud' (Electric) or 'water' (Fire). */
  sportType?: string | null
  /** Turns the holder cannot use its held item (Embargo). */
  embargoTurns?: number
  /** Turns of Wonder Room left (Defense and Sp. Def are swapped). */
  wonderRoomTurns?: number
  /** Powdered: the next Fire move explodes. */
  powdered?: boolean
  /** Ion Deluge is active this turn (Normal moves become Electric). */
  ionDeluge?: boolean
  /** Electrified: this battler's next move becomes Electric. */
  electrified?: boolean
  /** Magic Coat is up this turn (status moves are reflected). */
  magicCoat?: boolean
  /** Trapped by Block / Mean Look / Spider Web (cannot switch out). */
  trappedByMove?: boolean
  /** Trapped by Arena Trap / Shadow Tag / Magnet Pull. */
  trappedByAbility?: boolean
  /** Emergency Exit / Wimp Out has already requested a switch. */
  emergencySwitched?: boolean
  /** Flower Veil is protecting this Grass-type ally (Doubles). */
  flowerVeilProtected?: boolean
  /** A Commander Tatsugiri is riding its Dondozo ally and cannot act. */
  commanding?: boolean
  /** Happy Hour is active: prize money from this battle is doubled. */
  happyHour?: boolean
  /** Turns of Fairy Lock left (nobody can switch out). */
  fairyLockTurns?: number
  /** Turns of Magic Room left (every held item is disabled). */
  magicRoomTurns?: number
  /** Leaf Guard is active because the sun is shining this turn. */
  leafGuardActive?: boolean
  /** Pending Cud Chew heal (the berry eaten last turn). */
  cudChewHeal?: number
  /**
   * Moves this battler has used that the foe's ability made do nothing, keyed
   * by the foe's species. Lets the AI stop picking a dead move after it fails.
   */
  nullifiedMoves?: Record<string, string[]>
}

type GameAction = { type: string; payload?: any; [key: string]: any }

/** A save slot as summarised for the boot picker and Settings. */
type SaveSlotSummary = {
  slot: number
  empty: boolean
  regionId?: string
  regionName?: string
  level?: number
  dex?: number
  badges?: number
  savedAt?: number
  /** Active challenge rules, empty for a normal run. */
  challenges?: string[]
}

type ActiveEffect = {
  type: string
  battlesRemaining: number
  routeKey?: string
  speciesKey?: string
  [key: string]: any
}

/** A transient on-screen toast. Not persisted between sessions. */
type GameNotification = {
  id: number
  message: string
  /** Visual tone: info | success | shiny | warn. */
  tone: string
  icon: string | null
  /** Optional event category for the browser-notification filters (shiny | rare | egg). */
  kind?: string | null
  /** Collapses repeat events (same key inside the cooldown is dropped). */
  dedupeKey: string
  /** When set, the toast offers a GO button that travels to this location. */
  locationId?: string | null
  createdAt: number
}

type TrainerBattle = {
  trainerId?: string
  trainerName: string
  trainerClass: string
  trainerTeam: any[]
  currentTrainerPokemonIndex: number
  bossId?: string
  bossType?: string
  spriteKey?: string
  bossQueue?: any[]
  /** Champion tactical switches left this battle (2 at the start). */
  championSwapsRemaining?: number
  [key: string]: any
}

/** A pending Wonder Trade animation. The swap is already applied when set. */
type WonderTradeState = {
  sentPokemon: Pokemon
  receivedPokemon: Pokemon
  receivedSpeciesKey: string
  receivedIsShiny: boolean
  /** Phase to return to when the animation finishes. */
  returnPhase: string
}

type GameState = {
  phase: string
  startRegion: string
  /** Species key of the starter chosen at game start (see SELECT_STARTER). */
  starterSpeciesKey?: string | null
  playerPokemon: Pokemon | null
  enemyPokemon: any
  party: Pokemon[]
  box: Pokemon[]
  /** A pending Wonder Trade shown in the `wonderTrade` phase. */
  wonderTradeState?: WonderTradeState | null
  /** The route activity playing in the `routeActivity` phase, or null. */
  routeActivity?: string | null
  /** Chosen box sort, stored as "<field>_<direction>" (see BOX_SORT_FIELDS / BOX_SORT_DIRECTIONS). */
  boxSort: string
  /** Saved party presets, most recent last. */
  teamPresets: TeamPreset[]
  /** The most recently hatched egg, shown in the hatch popup until dismissed. */
  hatchResult: Pokemon | null
  battleLog: string[]
  battleEvents: any[]
  pendingEvents: any[]
  /** Turns the current battle has lasted (reset when a new one starts). */
  battleTurn: number
  /** Active field weather (rain/sun/sandstorm/snow/hail), or null. */
  weather: BattleWeather | null
  /** Active field terrain (electric/grassy/misty/psychic), or null. */
  terrain: BattleTerrain | null
  /** Entry hazards for the current battle, one bucket per side. */
  battleHazards: { player: any, enemy: any }
  currentRoute: string
  currentLocation: string
  unlockedLocations: string[]
  /** Regions the player can enter (starting region + ones opened with a token). */
  unlockedRegions: string[]
  speed: number
  paused: boolean
  /** Set never auto-switches; Switch picks a better matchup; Training protects a low-HP lead and shares a maxed one's EXP. */
  battleStyle: 'set' | 'switch' | 'training'
  /** Auto battles run by themselves; manual waits for the player to choose. */
  battleMode: 'auto' | 'manual'
  autoCatch: boolean
  autoProceed: boolean
  /** Automatically heal the party at the Pokemon Center whenever the map is idle and it is damaged. */
  autoHeal: boolean
  /** Raise browser notifications for key events while the tab is hidden. */
  browserNotifications: boolean
  /** Browser-notification categories (only used when notifications are on). */
  notifyShiny: boolean
  notifyRare: boolean
  notifyEgg: boolean
  /** Force reduced-motion animations off, regardless of the OS setting. */
  reducedMotion: boolean
  /** Add type labels to moves so type is not conveyed by colour alone. */
  colourblindTypes: boolean
  /** Uniformly scale the UI up for readability. */
  largeText: boolean
  /** Sprite style: animated gifs or static pngs. */
  spriteStyle: 'animated' | 'static'
  /** Float the damage dealt over the sprite in battle. */
  showDamageNumbers: boolean
  /** Sparkle a shiny Pokemon's sprite in battle. */
  showShinySparkles: boolean
  /** Background music (off by default). */
  musicEnabled: boolean
  /** Sound effects for notable events (off by default). */
  sfxEnabled: boolean
  /** Challenge: wild encounters roll a random species. */
  challengeRandomizer: boolean
  /** Challenge: wild encounter levels match your active Pokemon. */
  challengeLevelScale: boolean
  /** Challenge: a fainted party Pokemon is released permanently. */
  challengeNuzlocke: boolean
  /** Challenge: only the first wild Pokemon on each route can be caught. */
  challengeRestrictCatches: boolean
  /** Routes whose first wild encounter has already been used up. */
  challengeCatchRoutes: string[]
  /** Challenge: wild encounters are limited to this type (null = off). */
  challengeMonotype: string | null
  /** Nuzlocke only: the last party Pokemon fainted, ending the run. */
  nuzlockeGameOver: boolean
  nextPokemonId: number
  money: number
  inventory: Record<string, number>
  /** Fishing rods the player has found (see game/minigames/rods.js). */
  rods: string[]
  catchSettings: Record<string, Record<string, CatchRule>>
  globalCatchDefaults: CatchRule
  activeEffects: ActiveEffect[]
  /** Today's rotating daily event, or null before it is rolled. */
  dailyEvent?: { date: string, kind: string, claimed: boolean } | null
  pokedexSeen: string[]
  pokedexCaught: string[]
  shinySeen: string[]
  shinyCaught: string[]
  shinyChain: { speciesKey: string | null; count: number; radar?: number; target?: number }
  /** A route temporarily overrun by one species. */
  swarm: { routeKey: string; speciesKey: string; battlesRemaining: number } | null
  /** Rare party-wide 2x EXP boost with a wild-battle countdown. */
  pokerus?: { battlesRemaining: number } | null
  /** Today's daily quests (see src/game/quests.js). */
  quests?: any
  /** A pending region-dex-completion celebration shown in the `dexComplete` phase. */
  dexCelebration?: { generation: number } | null
  /** Offline-progress summary shown on return (transient). */
  offlineReport?: { awayMs: number, money: number, items: Record<string, number> } | null
  /** Daycare parents (up to 2) and battles toward the next egg. */
  daycare: { parents: Pokemon[]; progress: number }
  /** The pinned companion and its care stats (see game/companion.js). */
  companion: Companion
  /** Winning slot lines banked toward the Game Corner prize track. */
  gameCornerProgress: number
  /** The Berry Garden plots (see game/garden.js). */
  garden: Garden
  /** Poké Pelago's passive islands (see game/pelago.js). */
  pelago: Pelago
  /** Field Jobs: Pokemon auto-running route activities (see game/jobs.js). */
  jobs: FieldJobs
  /** Field research: wild defeats per species (see game/research.js). */
  researchDefeated: Record<string, number>
  /** Field research: berries fed to a species, for non-wild species. */
  researchFed: Record<string, number>
  /** Field research: moves used by a species, for non-wild species. */
  researchMoves: Record<string, number>
  /** Research points already credited per species. */
  researchClaimed: Record<string, number>
  /** Unspent Research Points. */
  researchPoints: number
  /** The last Pelago collection, shown in a result card until dismissed. */
  pelagoCollect: PelagoCollect | null
  defeatedGyms: string[]
  defeatedEliteFour: string[]
  defeatedChampions: string[]
  /** Generation indices (0-based) whose dex-completion reward has been paid. */
  rewardedGenerations: number[]
  /** Achievement ids whose one-off reward has been paid. */
  rewardedAchievements: string[]
  /** NPC gift / static-encounter ids already claimed this save. */
  claimedGifts: string[]
  /** Times each region has been prestiged (map progress reset). */
  regionPrestige: Record<string, number>
  /** Best result per minigame, for `unlock.minigame` gates (see endMinigame). */
  minigameRecords: Record<string, { best: number; completed: boolean }>
  /** Next Battle Tower floor to attempt (0 = not in a run). Hoenn only. */
  towerFloor: number
  /** Best Battle Tower floor cleared, keyed by region (Hoenn only). */
  towerBest: Record<string, number>
  victoryTokens: number
  battlesWonByLocation: Record<string, number>
  wildBattlesWon: number
  trainerBattlesWon: number
  activePlayerPokemonIndex: number
  /** Pokemon ids that have taken part in the current battle (EXP shares). */
  battleParticipants?: string[]
  /** The player switched or used an item this turn, so only the foe acts. */
  playerTurnSpent?: boolean
  /** The foe spent its turn switching (Champion swap), so only the player acts. */
  enemyTurnSpent?: boolean
  /** The move chosen for the next manual turn (null when none). */
  pendingPlayerMove?: string | null
  alwaysCatchShinies: boolean
  trainerBattle: TrainerBattle | null
  bossBattle: TrainerBattle | null
  bossQueue: any[]
  raidRegion: string | null
  levelUpNotification: string | null
  /** Transient toast queue (see NotificationStack). */
  notifications: GameNotification[]
  /** Monotonic id source for toast keys. */
  nextNotificationId: number
  [key: string]: any
}

type EncounterEntry = {
  speciesKey: string
  weight: number
  minLevel: number
  maxLevel: number
  /** Shiny-odds multiplier for this entry (swarms make their species 4x as likely). */
  shinyMultiplier?: number
  /** Best shiny odds this entry can reach (a divisor floor, e.g. 256 during a swarm). */
  shinyOddsFloor?: number
  /** Only active during this day/night phase ("night" or "day"); unset = any time. */
  time?: 'day' | 'night'
}

type EncounterData = { name: string; encounters: EncounterEntry[]; [key: string]: any }

type Region = {
  id: string
  name: string
  generation: number
  order: number
  entry?: string
  startLevel?: number
  /** DLC expansions are post-game regions opened by beating their parent
   * region's Champion; they are excluded from Unlock Token / World Tour counts. */
  isDlc?: boolean
  /** For a DLC region, the base region whose Champion opens it. */
  parentRegion?: string
  raidPool?: { speciesKey: string; level: number }[]
  /** Location of the region's Pokémon League; the Elite Four can only be
   * challenged while standing here. */
  leagueLocationKey?: string
  /** Per-region league structure/copy (Alola's island trials, Galar's
   * Champion Cup, Paldea's any-order gyms). */
  league?: {
    /** 'ordered' lays ordered badge gates on the map; 'free' lets the gyms be
     * challenged in any order and gates the league on a badge count. */
    badgeOrder?: 'ordered' | 'free'
    /** Section heading for the badge track, e.g. 'Gym Leaders' / 'Island Trials'. */
    badgeTrack?: string
    /** Singular noun for a badge, e.g. 'Badge' / 'Z-Crystal'. */
    badgeName?: string
    /** Section heading for the endgame, e.g. 'Elite Four & Champion' / 'Champion Cup'. */
    eliteTrack?: string
  }
}

type Mart = {
  name: string
  items: { itemId: string; unlockWildBattlesWon?: number }[]
}

type MapLocation = {
  id: string
  name: string
  type: string
  description?: string
  region?: string
  connections: string[]
  routeKey?: string
  /** battle background for wild encounters here (defaults handled in the UI) */
  background?: string
  /** a permanent field weather this location's battles start under ("rain", "sun", ...) */
  weather?: string
  /** zone sub-areas shown in the location panel (hub nodes only) */
  subAreas?: { id: string, name: string }[]
  mart?: Mart
  trainerCount?: number
  unlock: {
    battlesAtLocation?: { locationId: string; count: number }[]
    badgesRequired?: number
    /** specific gym ids that must be beaten to unlock this location */
    gymsRequired?: string[]
    championDefeated?: boolean | string
    requires?: string[]
    /** minimum number of species the player must have caught */
    caughtCount?: number
    /** catch some of the species that spawn only on `routeKey` — a
     * route-specific alternative to `caughtCount` */
    caughtOnRoute?: { routeKey: string; species: string[]; count: number }
    /** minimum level any party Pokemon must reach */
    partyLevel?: number
    /** clear (or score at least `minScore` in) a fixed minigame */
    minigame?: string
    minScore?: number
    /** region-entry gate: unlocked if it's the player's start region, or the
     * region has been opened with an Unlock Token (`state.unlockedRegions`) */
    entry?: boolean
  }
  /** Stable per-region progress key (region-offset route rank). Used only for
   * ordering; it is derived, not counted, so adding a location never renumbers
   * its neighbours. */
  unlockOrder: number
  position: { x: number; y: number }
  [key: string]: any
}

type Evolution = { into: string; level?: number; item?: string; friendship?: number; gender?: 'male' | 'female'; [key: string]: any }

interface Window {
  /** set by the boot guard in index.html; flipped once the app mounts */
  __piBooted?: boolean
  /** Console helper to wipe the save: `pokemonIdleResetSave()` */
  pokemonIdleResetSave?: () => void
  /** Resolves once all game JSON has been fetched. */
  gameDataReady: Promise<unknown>
  gameDataInjector: {
    data: Record<string, any>
    isLoading: () => boolean
    isError: () => boolean
    getError: () => unknown
    getPokemonSpecies: (key: string) => any
    getEvolutionData: (key: string) => any
    getMoveLearnset: (key: string) => any
    getTrainerClasses: () => any
    waitForData: () => Promise<unknown>
  }
  gameDataDebug: Record<string, any>
}

/**
 * Vite replaces `import.meta.env` in a bundled build. It is undefined when a
 * module is imported directly under Node (tests/tools), so keep it optional.
 */
interface ImportMeta {
  readonly env?: { readonly DEV?: boolean; readonly PROD?: boolean }
}
