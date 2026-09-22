// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { trainerClassPayouts, missingnoEncounterChance, mewUnderTruckChance } from './data/config.js'
import { ballOrder } from './data/items.js'
import { MOBILE_BREAKPOINT } from './data/ui.js'
import { completedGenerations, encounterData, mapData, pokemonSpecies, trainerData } from './data/gameData.js'
import { ACHIEVEMENTS } from './data/achievements.js'
import { useGame } from './game/context.js'
import { attemptCatch, selectAutoCatchBall, selectBestBall, shouldAutoCatch } from './game/catching.js'
import { createVolatileState, resolveBattleTurn } from './game/combat.js'
import { calculatePokemonStats, generateIVs, getPerfectIVs, resolvePokemonMoves } from './game/pokemon.js'
import { awardExperience, checkShinyOdds, resolveActiveModifiers, resolvePokemonEncounter, resolveRoamer, shinyOddsForSpecies } from './game/progression.js'

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
    stateRef = React.useRef(state),
    /** Null until the first render, so already-earned medals don't all pop at once. */
    announcedAchievementsRef = React.useRef(/** @type {Set<string> | null} */ (null))
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
      // The Shiny Charm is per generation: a species gets the boosted odds once
      // its own generation's national dex is complete.
      const completedGenerationSet = completedGenerations(currentGameState.pokedexCaught)
      switch (currentGameState.phase) {
        case 'idle': {
          if (!currentGameState.playerPokemon) return
          const currentLocationData = mapData[currentGameState.currentLocation]
          if (currentLocationData && currentLocationData.type === 'town') {
            // Cinnabar Island's famous glitch: a very rare MissingNo. encounter
            // in place of a trainer battle.
            if (
              currentGameState.currentLocation === 'cinnabarIsland' &&
              pokemonSpecies.missingno &&
              Math.random() < missingnoEncounterChance
            ) {
              const missingnoLevel = Math.max(5, currentGameState.playerPokemon.level),
                missingnoStats = calculatePokemonStats(
                  pokemonSpecies.missingno,
                  missingnoLevel,
                  generateIVs()
                )
              ;(dispatch({
                type: 'START_ENCOUNTER',
                payload: {
                  enemy: {
                    speciesKey: 'missingno',
                    name: pokemonSpecies.missingno.name,
                    types: pokemonSpecies.missingno.types,
                    level: missingnoLevel,
                    currentHp: missingnoStats.hp,
                    maxHp: missingnoStats.hp,
                    attack: missingnoStats.attack,
                    defense: missingnoStats.defense,
                    spAttack: missingnoStats.spAttack,
                    spDefense: missingnoStats.spDefense,
                    speed: missingnoStats.speed,
                    moves: resolvePokemonMoves('missingno', missingnoLevel),
                    isPlayer: !1,
                    isShiny: !1,
                  },
                },
              }),
                dispatch({
                  type: 'MARK_SEEN',
                  payload: {
                    speciesKey: 'missingno',
                  },
                }),
                dispatch({
                  type: 'ADD_LOG',
                  payload: {
                    message: '?! A glitchy shape flickers before you... MissingNo.!',
                  },
                }))
              return
            }
            // The truck by the S.S. Anne: a hidden Mew.
            if (
              currentGameState.currentLocation === 'vermilionCity' &&
              pokemonSpecies.mew &&
              Math.random() < mewUnderTruckChance
            ) {
              const mewLevel = Math.max(5, currentGameState.playerPokemon.level),
                mewStats = calculatePokemonStats(pokemonSpecies.mew, mewLevel, generateIVs())
              ;(dispatch({
                type: 'START_ENCOUNTER',
                payload: {
                  enemy: {
                    speciesKey: 'mew',
                    name: pokemonSpecies.mew.name,
                    types: pokemonSpecies.mew.types,
                    level: mewLevel,
                    currentHp: mewStats.hp,
                    maxHp: mewStats.hp,
                    attack: mewStats.attack,
                    defense: mewStats.defense,
                    spAttack: mewStats.spAttack,
                    spDefense: mewStats.spDefense,
                    speed: mewStats.speed,
                    moves: resolvePokemonMoves('mew', mewLevel),
                    isPlayer: !1,
                    isShiny: !1,
                  },
                },
              }),
                dispatch({
                  type: 'MARK_SEEN',
                  payload: {
                    speciesKey: 'mew',
                  },
                }),
                dispatch({
                  type: 'ADD_LOG',
                  payload: {
                    message: 'Something stirs under the truck... Mew!',
                  },
                }))
              return
            }
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
                  isShiny: checkShinyOdds(shinyOddsForSpecies(teamMember.speciesKey, completedGenerationSet)),
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
            currentLocationData?.type === 'raid' &&
            currentGameState.inRaid &&
            currentGameState.raidLegendary
          ) {
            const raidSpeciesKey = currentGameState.raidLegendary,
              species = pokemonSpecies[raidSpeciesKey]
            if (!species) return
            const raidLevel = currentGameState.raidLevel,
              ivs = generateIVs(),
              stats = calculatePokemonStats(species, raidLevel, ivs),
              moves = resolvePokemonMoves(raidSpeciesKey, raidLevel),
              enemyPokemon = {
                speciesKey: raidSpeciesKey,
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
                isShiny: checkShinyOdds(shinyOddsForSpecies(raidSpeciesKey, completedGenerationSet)),
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
                  speciesKey: raidSpeciesKey,
                },
              }),
              enemyPokemon.isShiny &&
                (dispatch({
                  type: 'MARK_SHINY_SEEN',
                  payload: {
                    speciesKey: raidSpeciesKey,
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
          const regionId = mapData[currentGameState.currentLocation]?.region ?? 'kanto',
            activeSwarm =
              currentGameState.swarm?.routeKey === currentGameState.currentRoute
                ? currentGameState.swarm
                : null,
            swarmLevel = currentEncounterData.encounters[0]?.minLevel ?? 5,
            routeEncounterData = activeSwarm
              ? {
                  ...currentEncounterData,
                  encounters: [
                    ...currentEncounterData.encounters,
                    {
                      speciesKey: activeSwarm.speciesKey,
                      weight: 80,
                      minLevel: swarmLevel,
                      maxLevel: swarmLevel + 2,
                    },
                  ],
                }
              : currentEncounterData,
            activeModifierMultipliers = resolveActiveModifiers(
              currentGameState.activeEffects,
              currentGameState.currentRoute
            ),
            spawningPokemonData =
              resolveRoamer(
                regionId,
                currentGameState.pokedexSeen,
                currentGameState.pokedexCaught,
                completedGenerationSet
              ) ??
              resolvePokemonEncounter(
                routeEncounterData,
                activeModifierMultipliers,
                completedGenerationSet,
                currentGameState.shinyChain
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
              isRoamer: spawningPokemonData.isRoamer ?? !1,
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
            dispatch({
              type: 'UPDATE_SHINY_CHAIN',
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
              status: playerVolatile.status ?? null,
              statusTurns: playerVolatile.statusTurns ?? 0,
              flinch: playerVolatile.flinch ?? !1,
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
              status: playerBattlePokemon.status ?? null,
              statusTurns: playerBattlePokemon.statusTurns ?? 0,
              flinch: playerBattlePokemon.flinch ?? !1,
            },
            enemyVolatileUpdate = {
              statStages: enemyBattlePokemon.statStages,
              mustRecharge: enemyBattlePokemon.mustRecharge ?? !1,
              lockedMove: enemyBattlePokemon.lockedMove ?? null,
              lockTurnsRemaining: enemyBattlePokemon.lockTurnsRemaining ?? 0,
              status: enemyBattlePokemon.status ?? null,
              statusTurns: enemyBattlePokemon.statusTurns ?? 0,
              flinch: enemyBattlePokemon.flinch ?? !1,
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
        case 'catching':
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
    }, [state.phase, state.autoProceed, state.currentLocation, dispatch]),
    React.useEffect(() => {
      // Completing a generation's national dex pays a one-off reward. Detected
      // here so it fires however the last species arrived (catch, evolution,
      // hatch, starter or trade).
      const completed = completedGenerations(state.pokedexCaught),
        pending = [...completed].filter(
          (generationIndex) => !(state.rewardedGenerations ?? []).includes(generationIndex)
        )
      pending.length > 0 &&
        dispatch({
          type: 'CLAIM_DEX_REWARDS',
          payload: {
            generations: pending,
          },
        })
    }, [state.pokedexCaught, state.rewardedGenerations, dispatch]),
    React.useEffect(() => {
      const achieved = ACHIEVEMENTS.filter(
        (achievement) => achievement.check(state)
      )
      if (announcedAchievementsRef.current === null) {
        announcedAchievementsRef.current = new Set(
          achieved.map((achievement) => achievement.id)
        )
        return
      }
      const newlyAchieved = achieved.filter(
        (achievement) => !announcedAchievementsRef.current?.has(achievement.id)
      )
      announcedAchievementsRef.current = new Set(
        achieved.map((achievement) => achievement.id)
      )
      for (const achievement of newlyAchieved)
        dispatch({
          type: 'PUSH_NOTIFICATION',
          payload: {
            message: `Achievement unlocked: ${achievement.name}`,
            tone: 'success',
            icon: '🏆',
            dedupeKey: `achievement:${achievement.id}`,
          },
        })
    }, [
      state.wildBattlesWon,
      state.trainerBattlesWon,
      state.pokedexCaught,
      state.shinyCaught,
      state.defeatedGyms,
      state.defeatedChampions,
      state.regionPrestige,
      state.towerBest,
      state.money,
      dispatch,
    ]))
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

// Classic Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

/**
 * Debug cheat: calls `onUnlock` when the Konami code is typed. Keys are matched
 * case-insensitively and any wrong key restarts the sequence (a stray repeat of
 * the first key just keeps the attempt alive).
 * @param {() => void} onUnlock
 */
export function useKonamiCode(onUnlock) {
  const progressRef = React.useRef(0),
    onUnlockRef = React.useRef(onUnlock)
  React.useEffect(() => {
    onUnlockRef.current = onUnlock
  })
  return React.useEffect(() => {
    const handleKeyDown = /** @param {KeyboardEvent} event */ (event) => {
      const target = /** @type {HTMLElement | null} */ (event.target)
      if (
        event.repeat ||
        (target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable))
      )
        return
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      if (key === KONAMI_CODE[progressRef.current]) {
        progressRef.current += 1
        if (progressRef.current === KONAMI_CODE.length) {
          progressRef.current = 0
          onUnlockRef.current()
        }
        return
      }
      progressRef.current = key === KONAMI_CODE[0] ? 1 : 0
    }
    return (
      window.addEventListener('keydown', handleKeyDown),
      () => window.removeEventListener('keydown', handleKeyDown)
    )
  }, [])
}
