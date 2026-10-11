// The idle game loop: one tick advances the current phase (encounter, battle
// turn, victory handling, ...) by dispatching reducer actions. Split out of
// hooks.js so the cross-cutting UI hooks stay small.

import React from 'react'
import { trainerClassPayouts, missingnoEncounterChance, mewUnderTruckChance, swarmShinyMultiplier, swarmShinyOddsFloor, manualInputTimeoutMs } from '../data/config.js'
import { ballOrder } from '../data/items.js'
import { completedGenerations, encounterData, mapData, pokemonSpecies, trainerData } from '../data/gameData.js'
import { gmaxEvolveReady, megaEvolveReady } from '../data/mega-evolution.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { dailyExpMultiplier, dailyPrizeMultiplier, dailyShinyMultiplier } from '../data/daily-events.js'
import { useGame } from './context.js'
import { attemptCatch, isCaveLocation, isNightTime, isWaterLocation, selectAutoCatchBall, selectBestBall, shouldAutoCatch } from './catching.js'
import { abilityOf } from './abilities.js'
import { companionExpMultiplier, companionToughOutChance } from './companion.js'
import { applyBattleForm, createBattlePokemon, createVolatileState, resolveBattleTurn, volatileStateFromBattle, AI_SKILL, chooseBestSwitch, chooseTrainingSwitch } from './combat.js'
import { isBattleReady } from './pokemon.js'
import { genderForPokemon } from './breeding.js'
import { awardExperience, checkShinyOdds, encountersForPhase, isHoneyActive, partyNeedsHealing, pokerusExpMultiplier, raidProgressFor, resolveActiveModifiers, resolvePokemonEncounter, resolveRoamer, shinyOddsForSpecies, ENCOUNTER_TYPE_ABILITY } from './progression.js'

export function useGameLoop() {
  const { state, dispatch: rawDispatch } = useGame(),
    intervalRef = React.useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null)),
    phaseRef = React.useRef(state.phase),
    stateRef = React.useRef(state),
    // True from the moment a tick dispatches an action until React commits the
    // resulting state. React applies timer updates asynchronously, so at fast
    // speeds the interval can fire again before the commit lands and `stateRef`
    // still holds the state the previous tick already acted on. Acting on that
    // stale state resolves the same turn / victory twice (a double catch, or a
    // second batch of EXP). Skipping while this is set serialises the loop with
    // React's commits.
    waitingForCommitRef = React.useRef(false),
    // When a manual battle first starts waiting for the player, so a forgotten
    // fight can fall back to auto-battling instead of stalling forever.
    manualWaitRef = React.useRef(0),
    // A single idle tick can dispatch several related actions (start an
    // encounter and record it, resolve a turn and store its volatiles, award
    // EXP and end the battle). They all run synchronously before the next
    // macrotask, so buffer them and fold the whole group into one reducer pass
    // on the next microtask (`BATCH`) instead of scheduling an update per
    // action.
    pendingActionsRef = React.useRef(/** @type {GameAction[]} */ ([])),
    flushScheduledRef = React.useRef(false),
    dispatch = React.useCallback(
      /** @param {GameAction} action */ (action) => {
        // Set before the (deferred) flush below so a fast tick can't act on
        // the state this batch is about to replace.
        waitingForCommitRef.current = true
        pendingActionsRef.current.push(action)
        if (flushScheduledRef.current) return
        flushScheduledRef.current = true
        queueMicrotask(() => {
          flushScheduledRef.current = false
          const bufferedActions = pendingActionsRef.current
          pendingActionsRef.current = []
          if (bufferedActions.length === 1) rawDispatch(bufferedActions[0])
          else if (bufferedActions.length > 1)
            rawDispatch({
              type: 'BATCH',
              payload: {
                actions: bufferedActions,
              },
            })
        })
      },
      [rawDispatch]
    )
  React.useEffect(() => {
    ;((phaseRef.current = state.phase), (stateRef.current = state))
    waitingForCommitRef.current = false
  }, [state])
  // A fresh battle, leaving one, or toggling the battle mode starts the manual
  // idle timer over. Without the mode dependency, turning Manual back on after
  // the timeout has already fired reuses the stale timestamp and immediately
  // falls back to auto-battling (which then auto-switches the active Pokemon).
  React.useEffect(() => {
    manualWaitRef.current = 0
  }, [state.phase, state.battleMode])
  const getTickDelay = React.useCallback(() => {
      const speed = stateRef.current.speed
      return speed === 25 ? 40 : speed === 5 ? 200 : speed === 2 ? 500 : 1e3
    }, []),
    tick = React.useCallback(() => {
      // Wait for the previous tick's dispatch to be committed before reading
      // the state again; otherwise a fast tick can double-process a turn or a
      // victory (see `waitingForCommitRef`).
      if (waitingForCommitRef.current) return
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
        expBonus = dailyExpBonus * pokerusExpMultiplier(currentGameState.pokerus) * companionExpMultiplier(currentGameState.companion),
        dailyPrizeBonus = dailyPrizeMultiplier(currentGameState.dailyEvent),
        // Happy Hour doubles the prize money from this battle.
        happyHourBonus = currentGameState.playerVolatile?.happyHour ? 2 : 1,
        dailyShinyBonus = dailyShinyMultiplier(currentGameState.dailyEvent)
      switch (currentGameState.phase) {
        case 'idle': {
          if (!currentGameState.playerPokemon) return
          // Optional auto-heal: top the party up at the Pokemon Center before
          // the next encounter instead of making the player press HEAL. Only
          // the idle map heals, so a battle is never interrupted mid-turn, and
          // a raid is skipped (healing there would return the player home).
          // The two dispatches share one batch, so the party is healed without
          // replaying the Pokemon Center animation on every battle.
          if (
            currentGameState.autoHeal &&
            !currentGameState.inRaid &&
            mapData[currentGameState.currentLocation]?.type !== 'raid' &&
            partyNeedsHealing(currentGameState)
          ) {
            dispatch({ type: 'START_HEALING' })
            dispatch({ type: 'COMPLETE_HEALING' })
            return
          }
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
          // Time-gated finds (a Hoothoot that only shows at night, ...): keep the
          // phase-matching entries, falling back to the full table when a route
          // would otherwise be empty (see encountersForPhase).
          const wildEncounterData = {
            ...currentEncounterData,
            encounters: encountersForPhase(currentEncounterData.encounters, isNightTime()),
          },
            regionId = mapData[currentGameState.currentLocation]?.region ?? 'kanto',
            activeSwarm =
              currentGameState.swarm?.routeKey === currentGameState.currentRoute
                ? currentGameState.swarm
                : null,
            swarmLevel = wildEncounterData.encounters[0]?.minLevel ?? 5,
            routeEncounterData = activeSwarm
              ? {
                  ...wildEncounterData,
                  encounters: [
                    // Every roll of the swarm's species gets the shiny boost,
                    // not just the extra high-weight entry below.
                    ...wildEncounterData.encounters.map((encounter) =>
                      encounter.speciesKey === activeSwarm.speciesKey
                        ? {
                            ...encounter,
                            shinyMultiplier: swarmShinyMultiplier,
                            shinyOddsFloor: swarmShinyOddsFloor,
                          }
                        : encounter
                    ),
                    {
                      speciesKey: activeSwarm.speciesKey,
                      weight: 80,
                      minLevel: swarmLevel,
                      maxLevel: swarmLevel + 2,
                      shinyMultiplier: swarmShinyMultiplier,
                      shinyOddsFloor: swarmShinyOddsFloor,
                    },
                  ],
                }
              : wildEncounterData,
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
                dailyShinyBonus,
                currentGameState.challengeMonotype,
                raidProgressFor(currentGameState, regionId)
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
                  : 0,
                currentGameState.challengeMonotype,
                // Static / Magnet Pull / Lightning Rod / Storm Drain bias the roll.
                ENCOUNTER_TYPE_ABILITY[currentGameState.playerPokemon?.ability ?? ''] ?? null
              ),
            catchRouteKey = currentGameState.currentRoute ?? '',
            routeCatchUsed =
              !!currentGameState.challengeRestrictCatches &&
              (currentGameState.challengeCatchRoutes ?? []).includes(catchRouteKey),
            pokemonData = {
              ...createBattlePokemon(spawningPokemonData.speciesKey, spawningPokemonData.level, {
                isShiny: spawningPokemonData.isShiny,
                isRoamer: spawningPokemonData.isRoamer ?? !1,
                wild: !0,
                leadAbility: currentGameState.playerPokemon?.ability ?? null,
                leadGender: currentGameState.playerPokemon?.gender ?? null,
              }),
              // Restrict Catches: only the first wild on a route can be caught.
              ...(currentGameState.challengeRestrictCatches
                ? { noCatch: routeCatchUsed }
                : {}),
            }
          // That first encounter is now used up, even if it gets away.
          currentGameState.challengeRestrictCatches &&
            !routeCatchUsed &&
            catchRouteKey &&
            dispatch({
              type: 'MARK_CATCH_ROUTE',
              payload: { routeKey: catchRouteKey },
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
          // A Mega Stone holder transforms as soon as the battle starts; the
          // next tick rebuilds the battler from the volatile form.
          if (megaEvolveReady(currentGameState)) {
            dispatch({
              type: 'MEGA_EVOLVE',
            })
            return
          }
          // A Pokemon marked by the Max Mushroom transforms once the Mega chance has passed.
          if (gmaxEvolveReady(currentGameState)) {
            dispatch({
              type: 'GMAX_EVOLVE',
            })
            return
          }
          const playerVolatile = currentGameState.playerVolatile ?? createVolatileState(),
            playerBattlePokemon = {
              speciesKey: currentGameState.playerPokemon.speciesKey,
              name: currentGameState.playerPokemon.name,
              types:
                playerVolatile.typesOverride ??
                pokemonSpecies[currentGameState.playerPokemon.speciesKey].types,
              level: currentGameState.playerPokemon.level,
              // A stale or corrupted HP above the maximum would stick the bar
              // at full, so clamp it when the battler is rebuilt each turn.
              maxHp: currentGameState.playerPokemon.maxHp,
              currentHp: Math.max(
                0,
                Math.min(
                  Number(currentGameState.playerPokemon.currentHp) || 0,
                  currentGameState.playerPokemon.maxHp
                )
              ),
              attack: currentGameState.playerPokemon.attack,
              defense: currentGameState.playerPokemon.defense,
              spAttack: currentGameState.playerPokemon.spAttack,
              spDefense: currentGameState.playerPokemon.spDefense,
              speed: currentGameState.playerPokemon.speed,
              moves: currentGameState.playerPokemon.moves,
              ability: currentGameState.playerPokemon.ability,
              heldItem: playerVolatile.heldItemOverridden
                ? playerVolatile.heldItemOverride
                : currentGameState.playerPokemon.heldItem ?? null,
              isPlayer: !0,
              isShiny: currentGameState.playerPokemon.isShiny,
              statStages: {
                ...playerVolatile.statStages,
              },
              mustRecharge: playerVolatile.mustRecharge,
              lockedMove: playerVolatile.lockedMove,
              lockTurnsRemaining: playerVolatile.lockTurnsRemaining,
              chargingMove: playerVolatile.chargingMove ?? null,
              semiInvulnerable: playerVolatile.semiInvulnerable ?? null,
              status: playerVolatile.status ?? null,
              statusTurns: playerVolatile.statusTurns ?? 0,
              flinch: playerVolatile.flinch ?? !1,
              confusionTurns: playerVolatile.confusionTurns ?? 0,
              leechSeeded: playerVolatile.leechSeeded ?? !1,
              heldItemUsed: playerVolatile.heldItemUsed ?? !1,
              // The affection save only applies to the pinned companion.
              toughOutChance:
                currentGameState.companion?.id &&
                currentGameState.companion.id === currentGameState.playerPokemon.id
                  ? companionToughOutChance(currentGameState.companion)
                  : 0,
              toughOutUsed: playerVolatile.toughOutUsed ?? !1,
              protectChain: playerVolatile.protectChain ?? 0,
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
              tailwindTurns: playerVolatile.tailwindTurns ?? 0,
              trickRoomTurns: playerVolatile.trickRoomTurns ?? 0,
              destinyBondTurns: playerVolatile.destinyBondTurns ?? 0,
              ingrained: playerVolatile.ingrained ?? !1,
              laserFocus: playerVolatile.laserFocus ?? !1,
              lockOnTurns: playerVolatile.lockOnTurns ?? 0,
              abilityOverride: playerVolatile.abilityOverride ?? null,
              abilitySuppressed: playerVolatile.abilitySuppressed ?? !1,
              typesOverride: playerVolatile.typesOverride ?? null,
              disguiseBroken: playerVolatile.disguiseBroken ?? !1,
              iceFaceBroken: playerVolatile.iceFaceBroken ?? !1,
              heldItemOverride: playerVolatile.heldItemOverride ?? null,
              heldItemOverridden: playerVolatile.heldItemOverridden ?? !1,
              formKey: playerVolatile.formKey ?? null,
              truantSkip: playerVolatile.truantSkip ?? !1,
              slowStartTurns: playerVolatile.slowStartTurns ?? 0,
              hangry: playerVolatile.hangry ?? !1,
              cudChewHeal: playerVolatile.cudChewHeal ?? 0,
              nullifiedMoves: playerVolatile.nullifiedMoves ?? {},
              choiceLock: playerVolatile.choiceLock ?? null,
              sameMoveStreak: playerVolatile.sameMoveStreak ?? 0,
              charged: playerVolatile.charged ?? !1,
              magnetRiseTurns: playerVolatile.magnetRiseTurns ?? 0,
              enduring: playerVolatile.enduring ?? !1,
              zMoveUsed: playerVolatile.zMoveUsed ?? !1,
              identified: playerVolatile.identified ?? !1,
              luckyChantTurns: playerVolatile.luckyChantTurns ?? 0,
              stockpile: playerVolatile.stockpile ?? 0,
              tormentTurns: playerVolatile.tormentTurns ?? 0,
              nightmare: playerVolatile.nightmare ?? !1,
              gravityTurns: playerVolatile.gravityTurns ?? 0,
              telekinesisTurns: playerVolatile.telekinesisTurns ?? 0,
              sportTurns: playerVolatile.sportTurns ?? 0,
              sportType: playerVolatile.sportType ?? null,
              embargoTurns: playerVolatile.embargoTurns ?? 0,
              wonderRoomTurns: playerVolatile.wonderRoomTurns ?? 0,
              powdered: playerVolatile.powdered ?? !1,
              ionDeluge: playerVolatile.ionDeluge ?? !1,
              electrified: playerVolatile.electrified ?? !1,
              magicCoat: playerVolatile.magicCoat ?? !1,
              trappedByMove: playerVolatile.trappedByMove ?? !1,
              trappedByAbility: playerVolatile.trappedByAbility ?? !1,
              emergencySwitched: playerVolatile.emergencySwitched ?? !1,
              happyHour: playerVolatile.happyHour ?? !1,
              fairyLockTurns: playerVolatile.fairyLockTurns ?? 0,
              magicRoomTurns: playerVolatile.magicRoomTurns ?? 0,
              // Supreme Overlord scales off the party members that have fainted.
              faintedAllies: currentGameState.party.filter(
                (/** @type {any} */ member) => (member.currentHp ?? 0) <= 0
              ).length,
              // Moves Assist can borrow from the rest of the party.
              assistPool: [
                ...new Set(
                  currentGameState.party
                    .filter(
                      (/** @type {any} */ member) =>
                        member.id !== currentGameState.playerPokemon?.id
                    )
                    .flatMap((/** @type {any} */ member) => member.moves ?? [])
                ),
              ],
              ivs: currentGameState.playerPokemon.ivs,
              nature: currentGameState.playerPokemon.nature,
            },
            enemyBattlePokemon = {
              ...currentGameState.enemyPokemon,
              types:
                currentGameState.enemyPokemon.typesOverride ??
                currentGameState.enemyPokemon.types,
              heldItem: currentGameState.enemyPokemon.heldItemOverridden
                ? currentGameState.enemyPokemon.heldItemOverride
                : currentGameState.enemyPokemon.heldItem ?? null,
            },
            isTrainerBattle =
              (currentGameState.trainerBattle ??
                currentGameState.bossBattle) !== null,
            isTowerBattle = currentGameState.bossBattle?.bossType === 'tower',
            // AI skill scales with the fight: wilds and route trainers toss out
            // random moves, legendary wilds and gym leaders play the full
            // heuristic, and the Elite Four, Champion, Battle Tower and the
            // player's auto-battler always take the best action.
            bossType = currentGameState.bossBattle?.bossType,
            isLegendaryWild =
              !bossType &&
              !currentGameState.trainerBattle &&
              !!pokemonSpecies[currentGameState.enemyPokemon.speciesKey]?.legendary,
            enemySkill =
              bossType === 'gym'
                ? AI_SKILL.smart
                : bossType
                  ? AI_SKILL.smartest
                  : currentGameState.trainerBattle
                    ? AI_SKILL.dumb
                    : isLegendaryWild
                      ? AI_SKILL.smart
                      : AI_SKILL.dumb,
            playerSkill = AI_SKILL.smartest,
            // If the player already switched or used an item this turn, their
            // Pokemon does not attack — only the foe acts.
            playerSkipMove = !!currentGameState.playerTurnSpent
          // The Champion and the player's auto-battler may switch before the
          // turn resolves. The player's switching is the Set / Switch battle
          // style: Set never switches on its own, Switch (the default) swaps to
          // a better type matchup, and Training only pulls its lead out when
          // that lead is in danger so it can keep levelling. Manual mode never
          // auto-switches — the player decides.
          const playerTrapped =
              !!currentGameState.playerVolatile?.trappedByMove ||
              !!currentGameState.playerVolatile?.trappedByAbility ||
              (currentGameState.playerVolatile?.fairyLockTurns ?? 0) > 0,
            enemyTrapped =
              !!currentGameState.enemyPokemon?.trappedByMove ||
              !!currentGameState.enemyPokemon?.trappedByAbility ||
              (currentGameState.enemyPokemon?.fairyLockTurns ?? 0) > 0,
            playerSwitch =
              playerSkipMove ||
              playerTrapped ||
              currentGameState.battleMode === 'manual' ||
              currentGameState.battleStyle === 'set'
                ? -1
                : currentGameState.battleStyle === 'training'
                  ? chooseTrainingSwitch(
                      playerBattlePokemon,
                      currentGameState.party,
                      currentGameState.activePlayerPokemonIndex
                    )
                  : chooseBestSwitch(
                      playerBattlePokemon,
                      currentGameState.party,
                      enemyBattlePokemon,
                      currentGameState.activePlayerPokemonIndex
                    )
          if (playerSwitch >= 0) {
            dispatch({
              type: 'SWITCH_PLAYER_POKEMON',
              payload: { newPokemonIndex: playerSwitch, costsTurn: !0 },
            })
            return
          }
          if (
            bossType === 'champion' &&
            currentGameState.bossBattle &&
            // Manual mode never auto-switches either side, and a swap already
            // spent this turn. A trapped foe cannot leave either.
            currentGameState.battleMode !== 'manual' &&
            !currentGameState.enemyTurnSpent &&
            !enemyTrapped &&
            (currentGameState.bossBattle.championSwapsRemaining ?? 0) > 0
          ) {
            const championSwitch = chooseBestSwitch(
              enemyBattlePokemon,
              currentGameState.bossBattle.trainerTeam,
              playerBattlePokemon,
              currentGameState.bossBattle.currentTrainerPokemonIndex
            )
            if (championSwitch >= 0) {
              // The swap costs the Champion its turn, and only two are allowed
              // per battle.
              dispatch({
                type: 'TRAINER_SEND_NEXT_POKEMON',
                payload: { newPokemonIndex: championSwitch, championSwap: !0 },
              })
              return
            }
          }
          // Rebuild any mid-battle form before the turn resolves.
          ;(applyBattleForm(playerBattlePokemon), applyBattleForm(enemyBattlePokemon))
          // In manual mode, wait for the player to pick a move. Forced turns
          // (recharge / charging / locked) and a turn already spent on a
          // switch resolve on their own.
          const playerForced =
            playerBattlePokemon.mustRecharge ||
            playerBattlePokemon.chargingMove ||
            playerBattlePokemon.lockedMove
          if (
            currentGameState.battleMode === 'manual' &&
            !playerSkipMove &&
            !playerForced &&
            !currentGameState.pendingPlayerMove
          ) {
            if (!manualWaitRef.current) manualWaitRef.current = Date.now()
            if (Date.now() - manualWaitRef.current < manualInputTimeoutMs) return
            // Forgotten battle: hand it back to the auto-battler.
            dispatch({ type: 'SET_BATTLE_MODE', payload: { mode: 'auto' } })
            dispatch({
              type: 'ADD_LOG',
              payload: { message: 'No move chosen \u2014 auto-battling resumes.' },
            })
            return
          }
          manualWaitRef.current = 0
          const turnEvents = resolveBattleTurn(
              playerBattlePokemon,
              enemyBattlePokemon,
              isTrainerBattle,
              (currentGameState.battleTurn ?? 0) === 0,
              currentGameState.weather ?? null,
              currentGameState.battleHazards ?? null,
              isTowerBattle,
              currentGameState.terrain ?? null,
              enemySkill,
              playerSkill,
              playerSkipMove,
              currentGameState.pendingPlayerMove ?? null,
              !!currentGameState.enemyTurnSpent
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
          const hasExpShare =
            currentGameState.activeEffects.some((effect) => effect.type === 'expShare') ||
            // Training mode hands a maxed-out lead's EXP to the rest of the
            // party instead of letting it go to waste at level 100.
            (currentGameState.battleStyle === 'training' &&
              (currentGameState.playerPokemon.level ?? 0) >= 100)
          if (currentGameState.playerPokemon.currentHp <= 0) {
            // A double knockout (Explosion, recoil or residual felled the user
            // after the foe): the encounter is already won, so release the
            // fainted Pokemon under Nuzlocke and award the surviving
            // participants' EXP once, then move on. Sending a replacement out
            // here would run the victory handler again against the fainted foe
            // and pay the EXP twice.
            const switchIndex = currentGameState.party.findIndex(
                (member, index) =>
                  index !== currentGameState.activePlayerPokemonIndex &&
                  isBattleReady(member)
              ),
              hasSurvivor = currentGameState.party.some((member) => isBattleReady(member)),
              trainerBattle = currentGameState.bossBattle ?? currentGameState.trainerBattle
            dispatch({ type: 'RELEASE_FAINTED' })
            awardExperience(
              dispatch,
              currentGameState.playerPokemon,
              currentGameState.enemyPokemon,
              trainerBattle ? 1.5 : 1,
              hasExpShare,
              currentGameState.party,
              currentGameState.activePlayerPokemonIndex,
              expBonus,
              currentGameState.battleParticipants
            )
            if (trainerBattle) {
              const nextIndex = trainerBattle.currentTrainerPokemonIndex + 1,
                trainerHasNext = nextIndex < trainerBattle.trainerTeam.length
              if (switchIndex === -1 && trainerHasNext) {
                // No Pokemon left to carry on the fight.
                if (currentGameState.challengeNuzlocke)
                  dispatch({ type: 'NUZLOCKE_GAME_OVER' })
                else dispatch({ type: 'START_HEALING' })
              } else {
                if (switchIndex !== -1)
                  dispatch({
                    type: 'SWITCH_PLAYER_POKEMON',
                    payload: {
                      newPokemonIndex: switchIndex,
                    },
                  })
                if (trainerHasNext)
                  dispatch({
                    type: 'TRAINER_SEND_NEXT_POKEMON',
                    payload: {
                      newPokemonIndex: nextIndex,
                    },
                  })
                else {
                  const maxLevel = Math.max(
                      ...trainerBattle.trainerTeam.map((member) => member.level)
                    ),
                    payout = trainerClassPayouts[trainerBattle.trainerClass] * maxLevel * dailyPrizeBonus * happyHourBonus
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
              }
            } else if (!hasSurvivor) {
              if (currentGameState.challengeNuzlocke)
                dispatch({ type: 'NUZLOCKE_GAME_OVER' })
              else dispatch({ type: 'START_HEALING' })
            } else dispatch({ type: 'PHASE_IDLE' })
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
              expBonus,
              currentGameState.battleParticipants
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
                payout = trainerClassPayouts[trainerBattle.trainerClass] * maxLevel * dailyPrizeBonus * happyHourBonus
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
            speciesKey: enemyPokemon.speciesKey,
            level: enemyPokemon.level,
            types: pokemonSpecies[enemyPokemon.speciesKey]?.types ?? [],
            alreadyCaught: currentGameState.pokedexCaught.includes(enemyPokemon.speciesKey),
            turn: currentGameState.battleTurn ?? 1,
            // Apricorn Ball context: the lead's level / gender and the foe's gender.
            leadLevel: currentGameState.playerPokemon?.level ?? 0,
            leadGender: currentGameState.playerPokemon
              ? genderForPokemon(currentGameState.playerPokemon)
              : undefined,
            enemyGender: genderForPokemon(enemyPokemon),
            isWater: isWaterLocation(mapData[currentGameState.currentLocation]),
            isCave: isCaveLocation(mapData[currentGameState.currentLocation]),
            isNight: isNightTime(),
            honey: isHoneyActive(
              currentGameState.activeEffects,
              currentGameState.currentRoute,
              enemyPokemon.speciesKey
            ),
          }
          awardExperience(
            dispatch,
            currentGameState.playerPokemon,
            enemyPokemon,
            1,
            hasExpShare,
            currentGameState.party,
            currentGameState.activePlayerPokemonIndex,
            expBonus,
            currentGameState.battleParticipants
          )
          const forceCatch = enemyPokemon.isShiny && currentGameState.alwaysCatchShinies
          if (
            !enemyPokemon.noCatch &&
            (forceCatch ||
              shouldAutoCatch(
                currentGameState,
                currentGameState.currentRoute,
                enemyPokemon.speciesKey,
                enemyPokemon.level,
                enemyPokemon.isShiny
              ))
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
                      ivs: enemyPokemon.ivs,
                      heldItem: enemyPokemon.heldItem,
                      ability: enemyPokemon.ability,
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
                : abilityOf(currentGameState.playerPokemon) === 'ballFetch'
                  ? dispatch({
                      type: 'ADD_LOG',
                      payload: {
                        message: `${enemyPokemon.name} broke free! Ball Fetch returned the ball!`,
                      },
                    })
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
              (member, index) => index !== activeIndex && isBattleReady(member)
            )
          // Manual mode hands the choice of replacement to the player, falling
          // back to the auto-switch if they never pick.
          if (currentGameState.battleMode === 'manual' && switchIndex !== -1) {
            if (!manualWaitRef.current) manualWaitRef.current = Date.now()
            if (Date.now() - manualWaitRef.current < manualInputTimeoutMs) return
            dispatch({ type: 'SET_BATTLE_MODE', payload: { mode: 'auto' } })
            dispatch({
              type: 'ADD_LOG',
              payload: { message: 'No replacement chosen \u2014 auto-battling resumes.' },
            })
            return
          }
          if (switchIndex !== -1) {
            dispatch({
              type: 'SWITCH_PLAYER_POKEMON',
              payload: {
                newPokemonIndex: switchIndex,
              },
            })
            dispatch({
              type: 'RELEASE_FAINTED',
            })
          } else if (
            currentGameState.challengeNuzlocke &&
            !currentGameState.party.some((member) => isBattleReady(member))
          ) {
            dispatch({ type: 'NUZLOCKE_GAME_OVER' })
          } else {
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
      state.phase === 'gameOver' ||
      state.phase === 'bugCatching' ||
      state.phase === 'safari' ||
      state.phase === 'academyQuiz' ||
      state.phase === 'mining' ||
      state.phase === 'gameCorner' ||
      state.phase === 'voltorbFlip' ||
      state.phase === 'auctionHouse' ||
      state.phase === 'contest' ||
      state.phase === 'pokeathlon' ||
      state.phase === 'pokeRadar' ||
      state.phase === 'battleRoyal' ||
      state.phase === 'championGauntlet' ||
      state.phase === 'doubles' ||
      state.phase === 'dynamaxAdventures' ||
      state.phase === 'lightsOut' ||
      state.phase === 'curry' ||
      state.phase === 'pokestar' ||
      state.phase === 'puzzleLeague' ||
      state.phase === 'memory' ||
      state.phase === 'whack' ||
      state.phase === 'musical' ||
      state.phase === 'picnic' ||
      state.phase === 'pokeballFactory' ||
      state.phase === 'ruinsPuzzle' ||
      state.phase === 'iceSlide' ||
      state.phase === 'pelago' ||
      state.phase === 'mantineSurf' ||
      state.phase === 'rotomRally' ||
      state.phase === 'ogreOustin' ||
      state.phase === 'typeFusion' ||
      state.phase === 'unownPicross' ||
      state.phase === 'pokeshot' ||
      state.phase === 'teraRaid' ||
      state.phase === 'pokeword' ||
      state.phase === 'berryBlender' ||
      state.phase === 'routeActivity' ||
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
  }, [state.phase, state.speed, state.paused, tick, getTickDelay])
  // Field Jobs bank on real time, independent of the battle tick and the
  // current phase (they keep working while a minigame is open), so they get
  // their own interval that hands the reducer the elapsed wall-clock time.
  React.useEffect(() => {
    let last = Date.now()
    const id = setInterval(() => {
      const now = Date.now(),
        elapsed = now - last
      last = now
      dispatch({ type: 'ACCRUE_JOBS', payload: { elapsedMs: elapsed } })
    }, 10_000)
    return () => clearInterval(id)
  }, [dispatch])
  // Resolve a manual turn the moment the player acts, rather than waiting for
  // the next idle tick. Event consumption stays on the interval above, so the
  // battle text still plays out at the normal speed.
  React.useEffect(() => {
    if (
      state.battleMode === 'manual' &&
      state.phase === 'battling' &&
      (state.pendingPlayerMove || state.playerTurnSpent)
    )
      tick()
  }, [state.battleMode, state.phase, state.pendingPlayerMove, state.playerTurnSpent, tick])
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
      // Achievements also read party/box (owned Pokemon, level 100, friendship),
      // the bag (TMs) and the minigame records, so claim them when any of those
      // change too instead of waiting for an unrelated battle stat to tick.
      state.party,
      state.box,
      state.inventory,
      state.minigameRecords,
      state.rewardedAchievements,
      dispatch,
    ]))
}
