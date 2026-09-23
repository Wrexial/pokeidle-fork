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
  /** Optional player-given nickname (max 12 characters). */
  nickname?: string
  /** Stored gender, e.g. rolled by the Bug Catching Contest. Falls back to a species-derived value. */
  gender?: 'male' | 'female' | 'genderless'
  /** An unhatched egg: it cannot battle and hatches after `eggStepsRemaining` wild wins while in the party. */
  isEgg?: boolean
  eggStepsRemaining?: number
  isShiny: boolean
}

/** Traits a Daycare egg can inherit from its parents. */
type BreedingInheritance = {
  /** Complete IV block (3 stats take the best of both parents). */
  ivs?: Record<string, number>
  /** A nature inherited from a parent, or a random one. */
  nature?: string
  /** Start moves, including any moves the parents passed down. */
  moves?: string[]
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
  /** Bag tab: medicine and candy can be used, valuables are sold. */
  category: 'medicine' | 'candy' | 'valuables'
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
}

type VolatileState = {
  statStages: Record<string, number>
  mustRecharge: boolean
  lockedMove: string | null
  lockTurnsRemaining: number
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
  /** Turns of Taunt left (0 when not taunted). */
  tauntTurns?: number
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
}

type GameAction = { type: string; payload?: any; [key: string]: any }

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
  /** Collapses repeat events (same key inside the cooldown is dropped). */
  dedupeKey: string
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
  playerPokemon: Pokemon | null
  enemyPokemon: any
  party: Pokemon[]
  box: Pokemon[]
  /** A pending Wonder Trade shown in the `wonderTrade` phase. */
  wonderTradeState?: WonderTradeState | null
  /** Chosen box sort mode (see BOX_SORT_OPTIONS). */
  boxSort: string
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
  autoCatch: boolean
  autoProceed: boolean
  /** Raise browser notifications for key events while the tab is hidden. */
  browserNotifications: boolean
  /** Force reduced-motion animations off, regardless of the OS setting. */
  reducedMotion: boolean
  /** Add type labels to moves so type is not conveyed by colour alone. */
  colourblindTypes: boolean
  /** Uniformly scale the UI up for readability. */
  largeText: boolean
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
  nextPokemonId: number
  money: number
  inventory: Record<string, number>
  catchSettings: Record<string, Record<string, CatchRule>>
  globalCatchDefaults: CatchRule
  activeEffects: ActiveEffect[]
  /** Today's rotating daily event, or null before it is rolled. */
  dailyEvent?: { date: string, kind: string, claimed: boolean } | null
  pokedexSeen: string[]
  pokedexCaught: string[]
  shinySeen: string[]
  shinyCaught: string[]
  shinyChain: { speciesKey: string | null; count: number }
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
  defeatedGyms: string[]
  defeatedEliteFour: string[]
  defeatedChampions: string[]
  /** Generation indices (0-based) whose dex-completion reward has been paid. */
  rewardedGenerations: number[]
  /** Achievement ids whose one-off reward has been paid. */
  rewardedAchievements: string[]
  /** Times each region has been prestiged (map progress reset). */
  regionPrestige: Record<string, number>
  /** Next Battle Tower floor to attempt (0 = not in a run). Hoenn only. */
  towerFloor: number
  /** Best Battle Tower floor cleared, keyed by region (Hoenn only). */
  towerBest: Record<string, number>
  victoryTokens: number
  battlesWonByLocation: Record<string, number>
  wildBattlesWon: number
  trainerBattlesWon: number
  activePlayerPokemonIndex: number
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
}

type EncounterData = { name: string; encounters: EncounterEntry[]; [key: string]: any }

type Region = {
  id: string
  name: string
  generation: number
  order: number
  entry?: string
  startLevel?: number
  raidPool?: { speciesKey: string; level: number }[]
  /** Non-legendary finals with no other source; a lower tier than `raidPool`. */
  raidOrdinaryPool?: { speciesKey: string; level: number }[]
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
