// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { legendaryPool, trainerClassPayouts } from './data/config.js'
import { ballOrder } from './data/items.js'
import { MOBILE_BREAKPOINT } from './data/ui.js'
import { encounterData, mapData, pokemonSpecies, trainerData } from './data/gameData.js'
import { useGame } from './game/context.js'
import { attemptCatch, selectAutoCatchBall, selectBestBall, shouldAutoCatch } from './game/catching.js'
import { createVolatileState, resolveBattleTurn } from './game/combat.js'
import { calculatePokemonStats, generateIVs, getPerfectIVs, resolvePokemonMoves } from './game/pokemon.js'
import { awardExperience, checkShinyOdds, resolveActiveModifiers, resolvePokemonEncounter } from './game/progression.js'

/**
 * @param {string} text
 * @param {number} [speed]
 * @returns {{ displayed: string, isComplete: boolean }}
 */
export function useTypewriter(text, speed = 30) {
  const [displayed, setDisplayed] = React.useState(''),
    [isComplete, setIsComplete] = React.useState(!1),
    indexRef = React.useRef(0)
  return (
    React.useEffect(() => {
      if ((setDisplayed(''), setIsComplete(!1), (indexRef.current = 0), !text)) {
        setIsComplete(!0)
        return
      }
      const intervalId = setInterval(() => {
        ;(indexRef.current++,
          indexRef.current >= text.length
            ? (setDisplayed(text), setIsComplete(!0), clearInterval(intervalId))
            : setDisplayed(text.slice(0, indexRef.current)))
      }, speed)
      return () => clearInterval(intervalId)
    }, [text, speed]),
    {
      displayed,
      isComplete,
    }
  )
}

export function useGameLoop() {
  const { state, dispatch } = useGame(),
    intervalRef = React.useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null)),
    phaseRef = React.useRef(state.phase),
    stateRef = React.useRef(state)
  React.useEffect(() => {
    ;((phaseRef.current = state.phase), (stateRef.current = state))
  }, [state])
  const getTickDelay = React.useCallback(() => {
      const speed = stateRef.current.speed
      return speed === 25 ? 40 : speed === 5 ? 200 : speed === 2 ? 500 : 1e3
    }, []),
    tick = React.useCallback(() => {
      const currentGameState = stateRef.current
      if (currentGameState.pendingEvents.length > 0) {
        dispatch({
          type: 'CONSUME_EVENT',
        })
        return
      }
      const totalCatchablePokedex = 151, //Object.keys(pokemonSpecies).length
        finishedDex =
          currentGameState.pokedexCaught.length >= totalCatchablePokedex
      switch (currentGameState.phase) {
        case 'idle': {
          if (!currentGameState.playerPokemon) return
          const currentLocationData = mapData[currentGameState.currentLocation]
          if (currentLocationData && currentLocationData.type === 'town') {
            const trainerList = trainerData[currentGameState.currentLocation]
            if (!trainerList?.length) return
            const trainer = trainerList[Math.floor(Math.random() * trainerList.length)],
              trainerTeam = /** @type {any[]} */ (trainer.team).map((teamMember) => {
                const species = pokemonSpecies[teamMember.speciesKey],
                  stats = calculatePokemonStats(species, teamMember.level, getPerfectIVs()),
                  moves = resolvePokemonMoves(teamMember.speciesKey, teamMember.level)
                return {
                  speciesKey: teamMember.speciesKey,
                  name: species.name,
                  types: species.types,
                  level: teamMember.level,
                  currentHp: stats.hp,
                  maxHp: stats.hp,
                  attack: stats.attack,
                  defense: stats.defense,
                  spAttack: stats.spAttack,
                  spDefense: stats.spDefense,
                  speed: stats.speed,
                  moves,
                  isPlayer: !1,
                  isShiny: checkShinyOdds(finishedDex),
                }
              })
            dispatch({
              type: 'START_TRAINER_BATTLE',
              payload: {
                trainerId: trainer.id,
                trainerName: trainer.name,
                trainerClass: trainer.trainerClass,
                trainerTeam,
              },
            })
            return
          }
          if (
            currentLocationData.type === 'raid' &&
            currentGameState.inRaid &&
            currentGameState.raidLegendary
          ) {
            const legendary = legendaryPool.find(
              (candidate) => candidate.speciesKey === currentGameState.raidLegendary
            )
            if (!legendary) return
            const species = pokemonSpecies[legendary.speciesKey]
            if (!species) return
            const raidLevel = currentGameState.raidLevel,
              ivs = generateIVs(),
              stats = calculatePokemonStats(species, raidLevel, ivs),
              moves = resolvePokemonMoves(legendary.speciesKey, raidLevel),
              enemyPokemon = {
                speciesKey: legendary.speciesKey,
                name: species.name,
                types: species.types,
                level: raidLevel,
                currentHp: stats.hp,
                maxHp: stats.hp,
                attack: stats.attack,
                defense: stats.defense,
                spAttack: stats.spAttack,
                spDefense: stats.spDefense,
                speed: stats.speed,
                moves,
                isPlayer: !1,
                isShiny: checkShinyOdds(finishedDex),
              }
            ;(dispatch({
              type: 'START_ENCOUNTER',
              payload: {
                enemy: enemyPokemon,
              },
            }),
              dispatch({
                type: 'MARK_SEEN',
                payload: {
                  speciesKey: legendary.speciesKey,
                },
              }),
              enemyPokemon.isShiny &&
                (dispatch({
                  type: 'MARK_SHINY_SEEN',
                  payload: {
                    speciesKey: legendary.speciesKey,
                  },
                }),
                dispatch({
                  type: 'ADD_LOG',
                  payload: {
                    message: `✦ A shiny ${species.name} appeared!`,
                  },
                })))
            return
          }
          const currentEncounterData =
            encounterData[currentGameState.currentRoute]
          if (!currentEncounterData) return
          const activeModifierMultipliers = resolveActiveModifiers(
              currentGameState.activeEffects,
              currentGameState.currentRoute
            ),
            spawningPokemonData = resolvePokemonEncounter(
              currentEncounterData,
              activeModifierMultipliers,
              finishedDex
            ),
            pokemonBaseStats = calculatePokemonStats(
              spawningPokemonData.species,
              spawningPokemonData.level,
              generateIVs()
            ),
            pokemonMoves = resolvePokemonMoves(
              spawningPokemonData.speciesKey,
              spawningPokemonData.level
            ),
            pokemonData = {
              speciesKey: spawningPokemonData.speciesKey,
              name: spawningPokemonData.species.name,
              types: spawningPokemonData.species.types,
              level: spawningPokemonData.level,
              currentHp: pokemonBaseStats.hp,
              maxHp: pokemonBaseStats.hp,
              attack: pokemonBaseStats.attack,
              defense: pokemonBaseStats.defense,
              spAttack: pokemonBaseStats.spAttack,
              spDefense: pokemonBaseStats.spDefense,
              speed: pokemonBaseStats.speed,
              moves: pokemonMoves,
              isPlayer: !1,
              isShiny: spawningPokemonData.isShiny,
            }
          ;(dispatch({
            type: 'START_ENCOUNTER',
            payload: {
              enemy: pokemonData,
            },
          }),
            dispatch({
              type: 'MARK_SEEN',
              payload: {
                speciesKey: spawningPokemonData.speciesKey,
              },
            }),
            spawningPokemonData.isShiny &&
              (dispatch({
                type: 'MARK_SHINY_SEEN',
                payload: {
                  speciesKey: spawningPokemonData.speciesKey,
                },
              }),
              dispatch({
                type: 'ADD_LOG',
                payload: {
                  message: `✦ A shiny ${spawningPokemonData.species.name} appeared!`,
                },
              })))
          break
        }
        case 'battling': {
          if (!currentGameState.playerPokemon || !currentGameState.enemyPokemon)
            return
          const playerVolatile = currentGameState.playerVolatile ?? createVolatileState(),
            playerBattlePokemon = {
              speciesKey: currentGameState.playerPokemon.speciesKey,
              name: currentGameState.playerPokemon.name,
              types:
                pokemonSpecies[currentGameState.playerPokemon.speciesKey].types,
              level: currentGameState.playerPokemon.level,
              currentHp: currentGameState.playerPokemon.currentHp,
              maxHp: currentGameState.playerPokemon.maxHp,
              attack: currentGameState.playerPokemon.attack,
              defense: currentGameState.playerPokemon.defense,
              spAttack: currentGameState.playerPokemon.spAttack,
              spDefense: currentGameState.playerPokemon.spDefense,
              speed: currentGameState.playerPokemon.speed,
              moves: currentGameState.playerPokemon.moves,
              isPlayer: !0,
              isShiny: currentGameState.playerPokemon.isShiny,
              statStages: {
                ...playerVolatile.statStages,
              },
              mustRecharge: playerVolatile.mustRecharge,
              lockedMove: playerVolatile.lockedMove,
              lockTurnsRemaining: playerVolatile.lockTurnsRemaining,
            },
            enemyBattlePokemon = {
              ...currentGameState.enemyPokemon,
            },
            isTrainerBattle =
              (currentGameState.trainerBattle ??
                currentGameState.bossBattle) !== null,
            turnEvents = resolveBattleTurn(playerBattlePokemon, enemyBattlePokemon, isTrainerBattle)
          dispatch({
            type: 'EXECUTE_TURN',
            payload: {
              events: turnEvents,
            },
          })
          const playerVolatileUpdate = {
              statStages: playerBattlePokemon.statStages,
              mustRecharge: playerBattlePokemon.mustRecharge ?? !1,
              lockedMove: playerBattlePokemon.lockedMove ?? null,
              lockTurnsRemaining: playerBattlePokemon.lockTurnsRemaining ?? 0,
            },
            enemyVolatileUpdate = {
              statStages: enemyBattlePokemon.statStages,
              mustRecharge: enemyBattlePokemon.mustRecharge ?? !1,
              lockedMove: enemyBattlePokemon.lockedMove ?? null,
              lockTurnsRemaining: enemyBattlePokemon.lockTurnsRemaining ?? 0,
            }
          dispatch({
            type: 'UPDATE_VOLATILE',
            payload: {
              player: playerVolatileUpdate,
              enemy: enemyVolatileUpdate,
            },
          })
          break
        }
        case 'victory': {
          if (
            !currentGameState.playerPokemon ||
            !currentGameState.enemyPokemon
          ) {
            dispatch({
              type: 'PHASE_IDLE',
            })
            return
          }
          const hasExpShare = currentGameState.activeEffects.some(
            (effect) => effect.type === 'expShare'
          )
          if (currentGameState.playerPokemon.currentHp <= 0) {
            const switchIndex = currentGameState.party.findIndex(
              (member, index) =>
                index !== currentGameState.activePlayerPokemonIndex &&
                member.currentHp > 0
            )
            ;(dispatch(
              switchIndex !== -1
                ? {
                    type: 'SWITCH_PLAYER_POKEMON',
                    payload: {
                      newPokemonIndex: switchIndex,
                    },
                  }
                : {
                    type: 'START_HEALING',
                  }
            ),
              awardExperience(
                dispatch,
                currentGameState.playerPokemon,
                currentGameState.enemyPokemon,
                (currentGameState.bossBattle ?? currentGameState.trainerBattle)
                  ? 1.5
                  : 1,
                hasExpShare,
                currentGameState.party,
                currentGameState.activePlayerPokemonIndex
              ))
            return
          }
          const trainerBattle =
            currentGameState.bossBattle ?? currentGameState.trainerBattle
          if (trainerBattle) {
            awardExperience(
              dispatch,
              currentGameState.playerPokemon,
              currentGameState.enemyPokemon,
              1.5,
              hasExpShare,
              currentGameState.party,
              currentGameState.activePlayerPokemonIndex
            )
            const nextIndex = trainerBattle.currentTrainerPokemonIndex + 1
            if (nextIndex < trainerBattle.trainerTeam.length)
              dispatch({
                type: 'TRAINER_SEND_NEXT_POKEMON',
                payload: {
                  newPokemonIndex: nextIndex,
                },
              })
            else {
              const maxLevel = Math.max(...trainerBattle.trainerTeam.map((member) => member.level)),
                payout = trainerClassPayouts[trainerBattle.trainerClass] * maxLevel
              currentGameState.bossBattle
                ? dispatch({
                    type: 'BOSS_BATTLE_END',
                    payload: {
                      won: !0,
                      moneyDelta: payout,
                    },
                  })
                : dispatch({
                    type: 'TRAINER_BATTLE_END',
                    payload: {
                      won: !0,
                      moneyDelta: payout,
                    },
                  })
            }
            return
          }
          const enemyPokemon = currentGameState.enemyPokemon
          awardExperience(
            dispatch,
            currentGameState.playerPokemon,
            enemyPokemon,
            1,
            hasExpShare,
            currentGameState.party,
            currentGameState.activePlayerPokemonIndex
          )
          const forceCatch = enemyPokemon.isShiny && currentGameState.alwaysCatchShinies
          if (
            forceCatch ||
            shouldAutoCatch(
              currentGameState,
              currentGameState.currentRoute,
              enemyPokemon.speciesKey,
              enemyPokemon.level,
              enemyPokemon.isShiny
            )
          ) {
            const ballId = forceCatch
              ? selectBestBall(enemyPokemon.speciesKey, ballOrder, currentGameState.inventory)
              : selectAutoCatchBall(
                  currentGameState,
                  currentGameState.currentRoute,
                  enemyPokemon.speciesKey
                )
            ballId
              ? attemptCatch(enemyPokemon.speciesKey, ballId)
                ? (dispatch({
                    type: 'CATCH_POKEMON',
                    payload: {
                      speciesKey: enemyPokemon.speciesKey,
                      level: enemyPokemon.level,
                      pokeballUsed: ballId,
                      isShiny: enemyPokemon.isShiny,
                    },
                  }),
                  dispatch({
                    type: 'MARK_CAUGHT',
                    payload: {
                      speciesKey: enemyPokemon.speciesKey,
                    },
                  }),
                  enemyPokemon.isShiny &&
                    dispatch({
                      type: 'MARK_SHINY_CAUGHT',
                      payload: {
                        speciesKey: enemyPokemon.speciesKey,
                      },
                    }))
                : (dispatch({
                    type: 'USE_POKEBALL',
                    payload: {
                      pokeballId: ballId,
                    },
                  }),
                  dispatch({
                    type: 'ADD_LOG',
                    payload: {
                      message: `${enemyPokemon.name} broke free!`,
                    },
                  }))
              : dispatch({
                  type: 'ADD_LOG',
                  payload: {
                    message: 'No Poke Balls left!',
                  },
                })
          }
          dispatch({
            type: 'PHASE_IDLE',
          })
          break
        }
        case 'defeat': {
          const activeIndex = currentGameState.activePlayerPokemonIndex,
            switchIndex = currentGameState.party.findIndex(
              (member, index) => index > activeIndex && member.currentHp > 0
            )
          if (switchIndex !== -1)
            dispatch({
              type: 'SWITCH_PLAYER_POKEMON',
              payload: {
                newPokemonIndex: switchIndex,
              },
            })
          else {
            if (currentGameState.bossBattle ?? currentGameState.trainerBattle) {
              const penalty = Math.min(
                currentGameState.money,
                Math.max(...currentGameState.party.map((member) => member.level)) * 12
              )
              currentGameState.bossBattle
                ? (dispatch({
                    type: 'BOSS_BATTLE_END',
                    payload: {
                      won: !1,
                      moneyDelta: -penalty,
                    },
                  }),
                  (currentGameState.bossBattle.bossType === 'e4' ||
                    currentGameState.bossBattle.bossType === 'champion') &&
                    dispatch({
                      type: 'RESET_ELITE_FOUR',
                    }))
                : dispatch({
                    type: 'TRAINER_BATTLE_END',
                    payload: {
                      won: !1,
                      moneyDelta: -penalty,
                    },
                  })
            }
            dispatch({
              type: 'START_HEALING',
            })
          }
          break
        }
        case 'healing':
          return
        case 'evolving':
          return
      }
    }, [dispatch])
  React.useEffect(() => {
    if (state.phase === 'starterSelect' || state.paused) {
      ;(intervalRef.current && clearInterval(intervalRef.current), (intervalRef.current = null))
      return
    }
    return (
      intervalRef.current && clearInterval(intervalRef.current),
      (intervalRef.current = setInterval(tick, getTickDelay())),
      () => {
        intervalRef.current && clearInterval(intervalRef.current)
      }
    )
  }, [state.phase, state.speed, state.paused, state.pendingEvents.length, tick, getTickDelay])
  const unlockedRef = React.useRef(state.unlockedLocations),
    pendingTravelRef = React.useRef(/** @type {string | null} */ (null))
  ;(React.useEffect(() => {
    if (!state.autoProceed) {
      unlockedRef.current = state.unlockedLocations
      return
    }
    const previousUnlocked = unlockedRef.current
    unlockedRef.current = state.unlockedLocations
    const newLocations = state.unlockedLocations.filter((locationId) => !previousUnlocked.includes(locationId))
    if (newLocations.length === 0) return
    const targetLocation = newLocations
      .filter((locationId) => locationId !== 'raidIsland')
      .map((locationId) => mapData[locationId])
      .filter(Boolean)
      .sort((locA, locB) => locB.unlockOrder - locA.unlockOrder)[0]
    targetLocation && (pendingTravelRef.current = targetLocation.id)
  }, [state.unlockedLocations, state.autoProceed]),
    React.useEffect(() => {
      if (state.phase !== 'idle' || !state.autoProceed) return
      const pendingLocation = pendingTravelRef.current
      pendingLocation &&
        pendingLocation !== state.currentLocation &&
        ((pendingTravelRef.current = null),
        dispatch({
          type: 'TRAVEL',
          payload: {
            locationId: pendingLocation,
          },
        }))
    }, [state.phase, state.autoProceed, state.currentLocation, dispatch]))
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < MOBILE_BREAKPOINT)
  return (
    React.useEffect(() => {
      const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`),
        handleChange = /** @param {MediaQueryListEvent} event */ (event) => setIsMobile(event.matches)
      return (
        mediaQuery.addEventListener('change', handleChange),
        () => mediaQuery.removeEventListener('change', handleChange)
      )
    }, []),
    isMobile
  )
}
