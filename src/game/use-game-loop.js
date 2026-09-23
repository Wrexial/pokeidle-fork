// The idle game loop: one tick advances the current phase (encounter, battle
// turn, victory handling, ...) by dispatching reducer actions. Split out of
// hooks.js so the cross-cutting UI hooks stay small.

import React from 'react'
import { trainerClassPayouts, missingnoEncounterChance, mewUnderTruckChance } from '../data/config.js'
import { ballOrder } from '../data/items.js'
import { completedGenerations, encounterData, mapData, pokemonSpecies, trainerData } from '../data/gameData.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { dailyExpMultiplier, dailyPrizeMultiplier, dailyShinyMultiplier } from '../data/daily-events.js'
import { useGame } from './context.js'
import { attemptCatch, isCaveLocation, isNightTime, isWaterLocation, selectAutoCatchBall, selectBestBall, shouldAutoCatch } from './catching.js'
import { createBattlePokemon, createVolatileState, resolveBattleTurn, volatileStateFromBattle } from './combat.js'
import { isBattleReady } from './pokemon.js'
import { awardExperience, checkShinyOdds, pokerusExpMultiplier, resolveActiveModifiers, resolvePokemonEncounter, resolveRoamer, shinyOddsForSpecies } from './progression.js'

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
              const missingnoLevel = Math.max(5, currentGameState.playerPokemon.level)
              ;(dispatch({
                type: 'START_ENCOUNTER',
                payload: {
                  enemy: createBattlePokemon('missingno', missingnoLevel),
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
              const mewLevel = Math.max(5, currentGameState.playerPokemon.level)
              ;(dispatch({
                type: 'START_ENCOUNTER',
                payload: {
                  enemy: createBattlePokemon('mew', mewLevel),
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
              trainerTeam = /** @type {any[]} */ (trainer.team).map((teamMember) =>
                createBattlePokemon(teamMember.speciesKey, teamMember.level, {
                  perfectIvs: !0,
                  isShiny: checkShinyOdds(
                    shinyOddsForSpecies(teamMember.speciesKey, completedGenerationSet)
                  ),
                  gender: !0,
                })
              )
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
              enemyPokemon = createBattlePokemon(raidSpeciesKey, raidLevel, {
                isShiny: checkShinyOdds(shinyOddsForSpecies(raidSpeciesKey, completedGenerationSet)),
              })
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
          // A zone hub is a picker, not a wild route; the player travels to a
          // sub-area to battle (see `location-panel.js`).
          if (currentLocationData?.type === 'zone') return
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
            pokemonData = createBattlePokemon(spawningPokemonData.speciesKey, spawningPokemonData.level, {
              isShiny: spawningPokemonData.isShiny,
              isRoamer: spawningPokemonData.isRoamer ?? !1,
              wild: !0,
            })
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
              ability: currentGameState.playerPokemon.ability,
              heldItem: currentGameState.playerPokemon.heldItem ?? null,
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
              leechSeeded: playerVolatile.leechSeeded ?? !1,
              heldItemUsed: playerVolatile.heldItemUsed ?? !1,
              tauntTurns: playerVolatile.tauntTurns ?? 0,
              substituteHp: playerVolatile.substituteHp ?? 0,
              infatuated: playerVolatile.infatuated ?? !1,
              cursed: playerVolatile.cursed ?? !1,
              screens: playerVolatile.screens ?? { reflect: 0, lightScreen: 0 },
              focusEnergy: playerVolatile.focusEnergy ?? !1,
              aquaRing: playerVolatile.aquaRing ?? !1,
              yawnTurns: playerVolatile.yawnTurns ?? 0,
              wishTurns: playerVolatile.wishTurns ?? 0,
              wishHeal: playerVolatile.wishHeal ?? 0,
              lastMove: playerVolatile.lastMove ?? null,
              encoreTurns: playerVolatile.encoreTurns ?? 0,
              encoreMove: playerVolatile.encoreMove ?? null,
              disableTurns: playerVolatile.disableTurns ?? 0,
              disabledMove: playerVolatile.disabledMove ?? null,
              safeguardTurns: playerVolatile.safeguardTurns ?? 0,
              mistTurns: playerVolatile.mistTurns ?? 0,
              perishTurns: playerVolatile.perishTurns ?? 0,
            },
            enemyBattlePokemon = {
              ...currentGameState.enemyPokemon,
            },
            isTrainerBattle =
              (currentGameState.trainerBattle ??
                currentGameState.bossBattle) !== null,
            isTowerBattle = currentGameState.bossBattle?.bossType === 'tower',
            turnEvents = resolveBattleTurn(
              playerBattlePokemon,
              enemyBattlePokemon,
              isTrainerBattle,
              (currentGameState.battleTurn ?? 0) === 0,
              currentGameState.weather ?? null,
              currentGameState.battleHazards ?? null,
              isTowerBattle,
              currentGameState.terrain ?? null
            )
          dispatch({
            type: 'EXECUTE_TURN',
            payload: {
              events: turnEvents,
            },
          })
          const playerVolatileUpdate = volatileStateFromBattle(playerBattlePokemon),
            enemyVolatileUpdate = volatileStateFromBattle(enemyBattlePokemon)
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
          const catchContext = {
            level: enemyPokemon.level,
            types: pokemonSpecies[enemyPokemon.speciesKey]?.types ?? [],
            alreadyCaught: currentGameState.pokedexCaught.includes(enemyPokemon.speciesKey),
            turn: currentGameState.battleTurn ?? 1,
            isWater: isWaterLocation(mapData[currentGameState.currentLocation]),
            isCave: isCaveLocation(mapData[currentGameState.currentLocation]),
            isNight: isNightTime(),
          }
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
              ? selectBestBall(
                  enemyPokemon.speciesKey,
                  ballOrder,
                  currentGameState.inventory,
                  catchContext
                )
              : selectAutoCatchBall(
                  currentGameState,
                  currentGameState.currentRoute,
                  enemyPokemon.speciesKey,
                  catchContext
                )
            ballId
              ? attemptCatch(enemyPokemon.speciesKey, ballId, catchContext)
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
        case 'bugCatching':
          return
        case 'mining':
          return
        case 'gameCorner':
          return
        case 'wonderTrade':
          return
        case 'dexComplete':
          return
      }
    }, [dispatch])
  React.useEffect(() => {
    if (
      state.phase === 'starterSelect' ||
      state.phase === 'bugCatching' ||
      state.phase === 'mining' ||
      state.phase === 'gameCorner' ||
      state.phase === 'wonderTrade' ||
      state.paused
    ) {
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
