// Ambient types for the globals injected by assets/gameDataInjector.js,
// plus the core game state shapes used across src/.

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

type Pokemon = {
  id: string
  speciesKey: string
  name: string
  level: number
  totalExp: number
  moves: string[]
  currentHp: number
  maxHp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
  ivs: Record<string, number>
  isShiny: boolean
  types?: string[]
  isPlayer?: boolean
  statStages?: Record<string, number>
  mustRecharge?: boolean
  lockedMove?: string | null
  lockTurnsRemaining?: number
  [key: string]: any
}

type GameAction = { type: string; payload?: any; [key: string]: any }

type ActiveEffect = {
  type: string
  battlesRemaining: number
  routeKey?: string
  speciesKey?: string
  [key: string]: any
}

type GameState = {
  phase: string
  playerPokemon: Pokemon | null
  enemyPokemon: Pokemon | null
  party: Pokemon[]
  box: Pokemon[]
  battleLog: string[]
  battleEvents: any[]
  pendingEvents: any[]
  [key: string]: any
}

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
