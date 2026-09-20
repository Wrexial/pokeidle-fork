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
  [key: string]: any
}

type Pokemon = BattlePokemon & {
  id: string
  totalExp: number
  ivs: Record<string, number>
  isShiny: boolean
}

type Inspected = { source: string; id: string } | null

type ActiveItem = {
  id: string
  name: string
  description: string
  duration: number
  buyPrice: number | null
}

type PokeBall = {
  id: string
  name: string
  description: string
  buyPrice: number | null
  ballModifier: number
}

type CatchRule = {
  enabled: boolean
  mode: string
  levelThreshold: number
  enabledBalls: string[]
}

type VolatileState = {
  statStages: Record<string, number>
  mustRecharge: boolean
  lockedMove: string | null
  lockTurnsRemaining: number
}

type GameAction = { type: string; payload?: any; [key: string]: any }

type ActiveEffect = {
  type: string
  battlesRemaining: number
  routeKey?: string
  speciesKey?: string
  [key: string]: any
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

type GameState = {
  phase: string
  playerPokemon: Pokemon | null
  enemyPokemon: any
  party: Pokemon[]
  box: Pokemon[]
  battleLog: string[]
  battleEvents: any[]
  pendingEvents: any[]
  currentRoute: string
  currentLocation: string
  unlockedLocations: string[]
  speed: number
  paused: boolean
  autoCatch: boolean
  autoProceed: boolean
  nextPokemonId: number
  money: number
  inventory: Record<string, number>
  catchSettings: Record<string, Record<string, CatchRule>>
  globalCatchDefaults: CatchRule
  activeEffects: ActiveEffect[]
  pokedexSeen: string[]
  pokedexCaught: string[]
  shinySeen: string[]
  shinyCaught: string[]
  defeatedGyms: string[]
  defeatedEliteFour: string[]
  defeatedChampions: string[]
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
  legendaries?: { speciesKey: string; level: number }[]
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
  mart?: Mart
  trainerCount?: number
  unlock: {
    battlesAtLocation?: { locationId: string; count: number }[]
    badgesRequired?: number
    championDefeated?: boolean
    requires?: string[]
  }
  unlockOrder: number
  position: { x: number; y: number }
  [key: string]: any
}

type Evolution = { into: string; level?: number; item?: string; [key: string]: any }

interface Window {
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
