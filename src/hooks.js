// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { trainerClassPayouts, missingnoEncounterChance, mewUnderTruckChance } from './data/config.js'
import { ballOrder } from './data/items.js'
import { MOBILE_BREAKPOINT } from './data/ui.js'
import { completedGenerations, encounterData, mapData, pokemonSpecies, trainerData } from './data/gameData.js'
import { ACHIEVEMENTS } from './data/achievements.js'
import { dailyExpMultiplier, dailyPrizeMultiplier, dailyShinyMultiplier } from './data/daily-events.js'
import { useGame } from './game/context.js'
import { playSfx, startMusic, stopMusic, unlockAudio } from './game/audio.js'
import { attemptCatch, selectAutoCatchBall, selectBestBall, shouldAutoCatch } from './game/catching.js'
import { createVolatileState, resolveBattleTurn } from './game/combat.js'
import { calculatePokemonStats, generateIVs, getPerfectIVs, isBattleReady, resolvePokemonMoves } from './game/pokemon.js'
import { awaySummary, awardExperience, checkShinyOdds, pokerusExpMultiplier, resolveActiveModifiers, resolvePokemonEncounter, resolveRoamer, shinyOddsForSpecies } from './game/progression.js'

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
      // The Shiny Charm is per generation: a species gets the boosted odds once
      // its own generation's national dex is complete.
      const completedGenerationSet = completedGenerations(currentGameState.pokedexCaught),
        dailyExpBonus = dailyExpMultiplier(currentGameState.dailyEvent),
        expBonus = dailyExpBonus * pokerusExpMultiplier(currentGameState.pokerus),
        dailyPrizeBonus = dailyPrizeMultiplier(currentGameState.dailyEvent),
        dailyShinyBonus = dailyShinyMultiplier(currentGameState.dailyEvent)
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
              currentGameState.currentRoute,
              currentGameState.shinyChain
            ),
            spawningPokemonData =
              resolveRoamer(
                regionId,
                currentGameState.pokedexSeen,
                currentGameState.pokedexCaught,
                completedGenerationSet,
                dailyShinyBonus
              ) ??
              resolvePokemonEncounter(
                routeEncounterData,
                activeModifierMultipliers,
                completedGenerationSet,
                currentGameState.shinyChain,
                dailyShinyBonus,
                currentGameState.challengeRandomizer,
                currentGameState.challengeLevelScale
                  ? currentGameState.playerPokemon?.level ?? 0
                  : 0
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
              confusionTurns: playerVolatile.confusionTurns ?? 0,
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
              confusionTurns: playerBattlePokemon.confusionTurns ?? 0,
            },
            enemyVolatileUpdate = {
              statStages: enemyBattlePokemon.statStages,
              mustRecharge: enemyBattlePokemon.mustRecharge ?? !1,
              lockedMove: enemyBattlePokemon.lockedMove ?? null,
              lockTurnsRemaining: enemyBattlePokemon.lockTurnsRemaining ?? 0,
              status: enemyBattlePokemon.status ?? null,
              statusTurns: enemyBattlePokemon.statusTurns ?? 0,
              flinch: enemyBattlePokemon.flinch ?? !1,
              confusionTurns: enemyBattlePokemon.confusionTurns ?? 0,
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
                isBattleReady(member)
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
                currentGameState.activePlayerPokemonIndex,
                expBonus
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
              currentGameState.activePlayerPokemonIndex,
              expBonus
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
                payout = trainerClassPayouts[trainerBattle.trainerClass] * maxLevel * dailyPrizeBonus
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
            currentGameState.activePlayerPokemonIndex,
            expBonus
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
              (member, index) => index > activeIndex && isBattleReady(member)
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
        case 'dexComplete':
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
      // Completing a generation's national dex pays a one-off reward, shown as a
      // celebration that pauses the game before the reward is granted.
      if (state.phase === 'dexComplete' || state.dexCelebration) return
      const completed = completedGenerations(state.pokedexCaught),
        pending = [...completed].filter(
          (generationIndex) => !(state.rewardedGenerations ?? []).includes(generationIndex)
        )
      pending.length > 0 &&
        dispatch({
          type: 'START_DEX_CELEBRATION',
          payload: {
            generation: pending[0],
          },
        })
    }, [
      state.pokedexCaught,
      state.rewardedGenerations,
      state.phase,
      state.dexCelebration,
      dispatch,
    ]),
    React.useEffect(() => {
      // Claim any achieved-but-unpaid milestone rewards. This also runs on load,
      // so older saves get their rewards retroactively (rewardedAchievements is
      // persisted, so each reward is only paid once).
      const rewarded = new Set(state.rewardedAchievements ?? []),
        pending = ACHIEVEMENTS.filter(
          (achievement) => !rewarded.has(achievement.id) && achievement.check(state)
        )
      pending.length > 0 &&
        dispatch({
          type: 'CLAIM_ACHIEVEMENT_REWARDS',
          payload: {
            ids: pending.map((achievement) => achievement.id),
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
      state.rewardedAchievements,
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

/**
 * Keep the daily event in sync with the real calendar day: rolls today's event
 * on mount and checks again every minute (so it refreshes at local midnight,
 * even if the tab stays open).
 */
export function useDailyEvent() {
  const { dispatch } = useGame()
  return React.useEffect(() => {
    const refresh = () => dispatch({ type: 'REFRESH_DAILY_EVENT' })
    refresh()
    const intervalId = setInterval(refresh, 60_000)
    return () => clearInterval(intervalId)
  }, [dispatch])
}

/**
 * Mirror important in-game toasts to a browser notification while the tab is
 * hidden (opt-in from Settings). Info-only toasts are skipped so the alerts
 * stay meaningful; the first observed toast just sets the baseline.
 */
export function useBrowserNotifications() {
  const { state } = useGame(),
    lastSeenRef = React.useRef(/** @type {number | null} */ (null))
  return React.useEffect(() => {
    const lastNotification = state.notifications[state.notifications.length - 1]
    if (!lastNotification) return
    const previousId = lastSeenRef.current
    lastSeenRef.current = lastNotification.id
    if (!state.browserNotifications || previousId === null) return
    if (!document.hidden) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const fresh = state.notifications
      .filter(
        (notification) => notification.id > previousId && notification.tone !== 'info'
      )
      .slice(-3)
    for (const notification of fresh)
      new Notification('Pokemon Idle', {
        body: `${notification.icon ? `${notification.icon} ` : ''}${notification.message}`,
        tag: notification.dedupeKey ?? `pokemon-idle:${notification.id}`,
      })
  }, [state.notifications, state.browserNotifications])
}

/**
 * Show a "while you were away" summary toast when the player returns after the
 * tab has been hidden for a while. The idle loop keeps running in a background
 * tab (throttled), so the summary reflects real progress.
 */
export function useAwayAlert() {
  const { state, dispatch } = useGame(),
    stateRef = React.useRef(state)
  React.useEffect(() => {
    stateRef.current = state
  }, [state])
  return React.useEffect(() => {
    const AWAY_THRESHOLD_MS = 30_000
    let hiddenAt = 0,
      snapshot = /** @type {GameState | null} */ (null)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        snapshot = stateRef.current
        return
      }
      const awayMs = hiddenAt ? Date.now() - hiddenAt : 0
      hiddenAt = 0
      if (!snapshot || awayMs < AWAY_THRESHOLD_MS) {
        snapshot = null
        return
      }
      const summary = awaySummary(snapshot, stateRef.current)
      snapshot = null
      summary &&
        dispatch({
          type: 'PUSH_NOTIFICATION',
          payload: {
            message: summary,
            tone: 'info',
            icon: '🌙',
            dedupeKey: `away:${Date.now()}`,
          },
        })
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [dispatch])
}

/**
 * Reflect the accessibility display preferences onto the document root so the
 * stylesheet can react (reduced motion, colourblind-friendly move labels).
 */
export function useAccessibilitySettings() {
  const { state } = useGame()
  return React.useEffect(() => {
    const root = document.documentElement
    root.dataset.reducedMotion = state.reducedMotion ? 'true' : 'false'
    root.dataset.colourblindTypes = state.colourblindTypes ? 'true' : 'false'
    root.dataset.largeText = state.largeText ? 'true' : 'false'
  }, [state.reducedMotion, state.colourblindTypes, state.largeText])
}

/**
 * Play the synthesized region theme and event sound effects when the matching
 * setting is on. Music switches as the player travels; effects are driven by
 * toasts, phase changes and level-ups. Silent (and free) while audio is off.
 */
export function useGameAudio() {
  const { state } = useGame(),
    lastNotificationRef = React.useRef(/** @type {number | null} */ (null)),
    lastPhaseRef = React.useRef(state.phase),
    lastLevelUpRef = React.useRef(state.levelUpNotification)
  return (
    React.useEffect(() => {
      // Browsers only allow audio after a user gesture; resume on the first one.
      if (!state.musicEnabled && !state.sfxEnabled) return
      const unlock = () => unlockAudio()
      window.addEventListener('pointerdown', unlock, { once: true })
      window.addEventListener('keydown', unlock, { once: true })
      return () => {
        window.removeEventListener('pointerdown', unlock)
        window.removeEventListener('keydown', unlock)
      }
    }, [state.musicEnabled, state.sfxEnabled]),
    React.useEffect(() => {
      if (!state.musicEnabled) {
        stopMusic()
        return
      }
      startMusic(mapData[state.currentLocation]?.region ?? state.startRegion ?? 'kanto')
    }, [state.musicEnabled, state.currentLocation, state.startRegion]),
    React.useEffect(() => () => stopMusic(), []),
    React.useEffect(() => {
      const latest = state.notifications[state.notifications.length - 1]
      if (!latest) return
      const previous = lastNotificationRef.current
      lastNotificationRef.current = latest.id
      if (!state.sfxEnabled || previous === null) return
      for (const notification of state.notifications.filter((entry) => entry.id > previous)) {
        if (notification.tone === 'shiny') playSfx('shiny')
        else if (notification.tone === 'success') playSfx('notify')
      }
    }, [state.notifications, state.sfxEnabled]),
    React.useEffect(() => {
      const previous = lastPhaseRef.current
      lastPhaseRef.current = state.phase
      if (!state.sfxEnabled || previous === state.phase) return
      if (state.phase === 'evolving') playSfx('evolution')
      else if (state.phase === 'healing') playSfx('heal')
      else if (state.phase === 'catching') playSfx('catch')
      else if (state.phase === 'dexComplete') playSfx('dexComplete')
    }, [state.phase, state.sfxEnabled]),
    React.useEffect(() => {
      const current = state.levelUpNotification,
        previous = lastLevelUpRef.current
      lastLevelUpRef.current = current
      if (state.sfxEnabled && current && current !== previous) playSfx('levelUp')
    }, [state.levelUpNotification, state.sfxEnabled])
  )
}

/**
 * Roll today's daily quests on mount and refresh them at local midnight (the
 * reducer only re-rolls when the calendar day changes).
 */
export function useQuests() {
  const { dispatch } = useGame()
  return React.useEffect(() => {
    const refresh = () => dispatch({ type: 'REFRESH_QUESTS' })
    refresh()
    const intervalId = setInterval(refresh, 60_000)
    return () => clearInterval(intervalId)
  }, [dispatch])
}
