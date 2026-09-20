// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { jsx } from 'react/jsx-runtime'
import { SAVE_KEY } from '../data/config.js'
import { preEvolutionMap } from '../data/gameData.js'
import { generateIVs } from './pokemon.js'
import { gameReducer, initialGameState } from './reducer.js'

/** @type {React.Context<{ state: GameState, dispatch: (action: GameAction) => void } | null>} */
const GameContext = React.createContext(
  /** @type {{ state: GameState, dispatch: (action: GameAction) => void } | null} */ (null)
)

/** @param {{ children: any }} props */
export function GameProvider({ children }) {
  const [state, dispatch] = React.useReducer(gameReducer, initialGameState, (initialState) => {
    try {
      const savedJson = localStorage.getItem(SAVE_KEY)
      if (savedJson) {
        const saved = JSON.parse(savedJson)
        if (saved.playerPokemon) {
          let nextId = saved.nextPokemonId || 1
          const playerPokemon = {
            ...saved.playerPokemon,
          }
          ;(playerPokemon.isShiny === void 0 && (playerPokemon.isShiny = !1),
            playerPokemon.id || (playerPokemon.id = String(nextId++)))
          let party = /** @type {any[]} */ (saved.party || [])
          party.length === 0
            ? (party = [playerPokemon])
            : (party = party.map((pokemon) => {
                const normalized =
                  pokemon.isShiny === void 0
                    ? {
                        ...pokemon,
                        isShiny: !1,
                      }
                    : pokemon
                return normalized.id
                  ? normalized
                  : {
                      ...normalized,
                      id: String(nextId++),
                    }
              }))
          let box = /** @type {any[]} */ (saved.box || [])
          ;((box = box.map((pokemon) => {
            const normalized =
              pokemon.isShiny === void 0
                ? {
                    ...pokemon,
                    isShiny: !1,
                  }
                : pokemon
            return normalized.id
              ? normalized
              : {
                  ...normalized,
                  id: String(nextId++),
                }
          })),
            playerPokemon.ivs || (playerPokemon.ivs = generateIVs()),
            (party = party.map((pokemon) =>
              pokemon.ivs
                ? pokemon
                : {
                    ...pokemon,
                    ivs: generateIVs(),
                  }
            )),
            (box = box.map((pokemon) =>
              pokemon.ivs
                ? pokemon
                : {
                    ...pokemon,
                    ivs: generateIVs(),
                  }
            )))
          const catchSettings = saved.catchSettings || {}
          for (const speciesKey of Object.keys(catchSettings))
            for (const ballId of Object.keys(catchSettings[speciesKey])) {
              const rule = catchSettings[speciesKey][ballId]
              rule.enabledBalls ||
                ((rule.enabledBalls = [rule.pokeball || 'pokeball']),
                delete rule.pokeball)
            }
          let seen = saved.pokedexSeen || [],
            caught = saved.pokedexCaught || []
          if (!saved.pokedexSeen || !saved.pokedexCaught) {
            const speciesSet = new Set()
            for (const pokemon of [...party, ...box]) speciesSet.add(pokemon.speciesKey)
            ;((caught = Array.from(speciesSet)), (seen = [...caught]))
          }
          const caughtSet = new Set(caught)
          for (const speciesKey of [...caughtSet]) {
            let preEvolution = preEvolutionMap[speciesKey]
            for (; preEvolution; ) (caughtSet.add(preEvolution), (preEvolution = preEvolutionMap[preEvolution]))
          }
          const seenSet = new Set([...seen, ...caughtSet])
          return (
            (caught = Array.from(caughtSet)),
            (seen = Array.from(seenSet)),
            {
              ...initialState,
              phase: 'idle',
              startRegion: saved.startRegion || 'kanto',
              playerPokemon: party[0] || playerPokemon,
              currentRoute: saved.currentRoute || initialState.currentRoute,
              speed: saved.speed || initialState.speed,
              wildBattlesWon: saved.wildBattlesWon ?? saved.battlesWon ?? 0,
              trainerBattlesWon: saved.trainerBattlesWon ?? 0,
              battlesWonByLocation: saved.battlesWonByLocation ?? {},
              party,
              box,
              autoCatch: saved.autoCatch ?? !0,
              nextPokemonId: nextId,
              currentLocation: saved.currentLocation || 'palletTown',
              unlockedLocations: saved.unlockedLocations || [
                'palletTown',
                'route1',
              ],
              battleLog: ['Game loaded!'],
              evolutionState: null,
              catchSettings,
              globalCatchDefaults: saved.globalCatchDefaults || {
                enabled: !0,
                mode: 'always',
                levelThreshold: 1,
                enabledBalls: ['pokeball'],
              },
              money: saved.money ?? 3e3,
              inventory: saved.inventory ?? {
                pokeball: 20,
              },
              trainerBattle: null,
              bossBattle: null,
              bossQueue: [],
              activePlayerPokemonIndex: 0,
              healingState: null,
              pendingBossBattle: null,
              pokedexSeen: seen,
              pokedexCaught: caught,
              shinyCaught: saved.shinyCaught || [],
              shinySeen: saved.shinySeen || [],
              alwaysCatchShinies: saved.alwaysCatchShinies ?? !0,
              defeatedGyms: saved.defeatedGyms || [],
              defeatedEliteFour: saved.defeatedEliteFour || [],
              defeatedChampions:
                saved.defeatedChampions || (saved.championDefeated ? ['kanto'] : []),
              victoryTokens: saved.victoryTokens ?? 0,
              autoProceed: saved.autoProceed ?? !1,
              raidCooldownEnd: saved.raidCooldownEnd ?? null,
              raidLegendary: saved.inRaid ? (saved.raidLegendary ?? null) : null,
              raidRegion: saved.inRaid ? (saved.raidRegion ?? 'kanto') : null,
              inRaid: saved.inRaid ?? !1,
              raidLevel: saved.inRaid ? (saved.raidLevel ?? 0) : 0,
              preRaidLocation: saved.inRaid ? (saved.preRaidLocation ?? null) : null,
              activeEffects: saved.activeEffects ?? [],
              ...(saved.inRaid
                ? {
                    currentLocation: saved.currentLocation || 'raidIsland',
                  }
                : {}),
            }
          )
        }
      }
    } catch {}
    return initialState
  })
  return (
    React.useEffect(() => {
      if (state.playerPokemon && (state.phase === 'idle' || state.phase === 'victory')) {
        const saveData = {
          playerPokemon: state.playerPokemon,
          startRegion: state.startRegion,
          currentRoute: state.currentRoute,
          speed: state.speed,
          wildBattlesWon: state.wildBattlesWon,
          trainerBattlesWon: state.trainerBattlesWon,
          battlesWonByLocation: state.battlesWonByLocation,
          party: state.party,
          box: state.box,
          autoCatch: state.autoCatch,
          nextPokemonId: state.nextPokemonId,
          currentLocation: state.currentLocation,
          unlockedLocations: state.unlockedLocations,
          catchSettings: state.catchSettings,
          globalCatchDefaults: state.globalCatchDefaults,
          alwaysCatchShinies: state.alwaysCatchShinies,
          money: state.money,
          inventory: state.inventory,
          pokedexSeen: state.pokedexSeen,
          pokedexCaught: state.pokedexCaught,
          shinyCaught: state.shinyCaught,
          shinySeen: state.shinySeen,
          defeatedGyms: state.defeatedGyms,
          defeatedEliteFour: state.defeatedEliteFour,
          defeatedChampions: state.defeatedChampions,
          victoryTokens: state.victoryTokens,
          autoProceed: state.autoProceed,
          raidCooldownEnd: state.raidCooldownEnd,
          raidLegendary: state.raidLegendary,
          raidRegion: state.raidRegion,
          inRaid: state.inRaid,
          raidLevel: state.raidLevel,
          preRaidLocation: state.preRaidLocation,
          activeEffects: state.activeEffects,
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
      }
    }, [
      state.phase,
      state.playerPokemon?.level,
      state.playerPokemon?.totalExp,
      state.party.length,
      state.box.length,
      state.catchSettings,
      state.money,
      state.inventory,
      state.pokedexSeen.length,
      state.pokedexCaught.length,
      state.shinyCaught.length,
      state.shinySeen.length,
      state.alwaysCatchShinies,
      state.defeatedGyms.length,
      state.defeatedEliteFour.length,
      state.defeatedChampions.length,
      state.victoryTokens,
      state.autoProceed,
      state.raidCooldownEnd,
      state.activeEffects,
    ]),
    jsx(GameContext.Provider, {
      value: {
        state,
        dispatch,
      },
      children,
    })
  )
}

/** @returns {{ state: GameState, dispatch: (action: GameAction) => void }} */
export function useGame() {
  const context = React.useContext(GameContext)
  if (!context) throw new Error('useGame must be used within GameProvider')
  return context
}
