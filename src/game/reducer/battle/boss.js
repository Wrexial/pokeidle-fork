// // Boss battle lifecycle: start and end (badges, Elite Four, Champion). Split from game/reducer/battle.js.

import { BATTLE_TOWER_REGION } from '../../../data/config.js'
import { gymLeaderData, regions } from '../../../data/gameData.js'
import { createVolatileState } from '../../combat.js'
import { emptyBattleHazards } from '../../hazards.js'
import { computeUnlockedLocations, prepareNextBattle, syncActivePokemonIntoParty, tickBattleCounters } from '../../progression.js'
import { settleUnlockTokens, withNotification } from '../../reducer-helpers.js'

/**
 * Handle the `START_BOSS_BATTLE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startBossBattle(state, action) {
  const {
      bossId,
      bossType,
      trainerName,
      trainerClass,
      trainerTeam,
      bossQueue,
      spriteKey,
      region,
    } = action.payload,
    firstPokemon = trainerTeam[0]
  return {
    ...state,
    phase: 'battling',
    enemyPokemon: firstPokemon,
    battleEvents: [],
    pendingEvents: [
      {
        type: 'trainerAppear',
        message: `${trainerName} wants to battle!`,
      },
      {
        type: 'trainerSendOut',
        message: `${trainerName} sent out ${firstPokemon.name}!`,
      },
    ],
    currentEventIndex: 0,
    battleTurn: 0,
    weather: null,
    battleHazards: emptyBattleHazards(),
    terrain: null,
    activePlayerPokemonIndex: 0,
    battleParticipants: (state.party[0]?.id ?? state.playerPokemon?.id)
      ? [state.party[0]?.id ?? state.playerPokemon?.id]
      : [],
    playerTurnSpent: !1,
    bossBattle: {
      bossId,
      bossType,
      trainerName,
      trainerClass,
      trainerTeam,
      currentTrainerPokemonIndex: 0,
      spriteKey,
      region,
    },
    bossQueue: bossQueue ?? [],
    playerVolatile: createVolatileState(),
  }
}

/**
 * Handle the `BOSS_BATTLE_END` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function bossBattleEnd(state, action) {
  // Battle Tower floors are a puzzle, not an endless auto-climb: clearing
  // one returns to the panel so the next floor can be chosen deliberately,
  // and a loss keeps you on that floor instead of sending you back to
  // floor 1. It lives in Hoenn only, so its record is always credited
  // there.
  if (state.bossBattle?.bossType === 'tower') {
    const { won: towerWon, moneyDelta: towerMoneyDelta } = action.payload,
      regionId = BATTLE_TOWER_REGION,
      floor = state.towerFloor,
      best = state.towerBest[regionId] ?? 0,
      reward = Math.floor(floor / 10)
    return {
      ...prepareNextBattle(state),
      money: Math.max(0, state.money + towerMoneyDelta),
      trainerBattlesWon: towerWon ? state.trainerBattlesWon + 1 : state.trainerBattlesWon,
      victoryTokens: towerWon ? state.victoryTokens + reward : state.victoryTokens,
      towerFloor: towerWon ? floor + 1 : Math.max(1, floor),
      towerBest: {
        ...state.towerBest,
        [regionId]: Math.max(best, towerWon ? floor : floor - 1),
      },
      battleLog: [
        ...state.battleLog,
        towerWon
          ? `Tower floor ${floor} cleared!${
              reward > 0
                ? ` Earned ${reward} Victory Token${reward > 1 ? 's' : ''}.`
                : ''
            }`
          : `Tower floor ${floor} failed \u2014 your team can try again.`,
      ].slice(-50),
    }
  }
  const { won, moneyDelta } = action.payload,
    newMoney = Math.max(0, state.money + moneyDelta),
    eventType = won ? 'moneyGain' : 'moneyLoss',
    message = won ? `Got $${moneyDelta} for winning!` : `Lost $${Math.abs(moneyDelta)}...`,
    trainerBattlesWon = won ? state.trainerBattlesWon + 1 : state.trainerBattlesWon,
    locationWins = state.battlesWonByLocation[state.currentLocation] ?? 0,
    battlesWonByLocation = won
      ? {
          ...state.battlesWonByLocation,
          [state.currentLocation]: locationWins + 1,
        }
      : state.battlesWonByLocation,
    activeEffects = won ? tickBattleCounters(state.activeEffects) : state.activeEffects
  let defeatedGyms = state.defeatedGyms,
    defeatedEliteFour = state.defeatedEliteFour,
    defeatedChampions = state.defeatedChampions,
    victoryTokens = state.victoryTokens,
    championJustDefeated = false
  const notifications = [],
    toastNotifications = []
  if (won && state.bossBattle) {
    const { bossType, bossId } = /** @type {{ bossType: string, bossId: string }} */ (
      state.bossBattle
    )
    bossType === 'gym' && !defeatedGyms.includes(bossId)
      ? ((defeatedGyms = [...defeatedGyms, bossId]),
        (victoryTokens += 1),
        notifications.push('Earned a Victory Token!'),
        toastNotifications.push({
          message: `${gymLeaderData.find((gym) => gym.id === bossId)?.badgeName ?? 'Badge'} earned!`,
          tone: 'success',
          icon: '🏅',
          dedupeKey: `gym:${bossId}`,
        }))
      : bossType === 'e4' && !defeatedEliteFour.includes(bossId)
        ? ((defeatedEliteFour = [...defeatedEliteFour, bossId]),
          toastNotifications.push({
            message: 'Elite Four member defeated!',
            tone: 'success',
            icon: '🏅',
            dedupeKey: `e4:${bossId}`,
          }))
        : bossType === 'champion' &&
          (() => {
            const championRegion = state.bossBattle.region ?? 'kanto'
            // A rematch replays the Champion for its teams, but only the
            // first win credits the region (and thus an Unlock Token).
            defeatedChampions.includes(championRegion) ||
              ((defeatedChampions = [...defeatedChampions, championRegion]),
              (championJustDefeated = true),
              toastNotifications.push({
                message: `${regions.find((region) => region.id === championRegion)?.name ?? championRegion} Champion defeated!`,
                tone: 'shiny',
                icon: '👑',
                dedupeKey: `champion:${championRegion}`,
              }))
            ;((victoryTokens += 1), notifications.push('Earned a Victory Token!'))
          })()
  }
  if (won && state.bossQueue.length > 0) {
    const [nextBoss, ...remainingQueue] = state.bossQueue,
      firstPokemon = nextBoss.trainerTeam[0],
      stateWithNextBoss = {
        ...syncActivePokemonIntoParty(state),
        money: newMoney,
        trainerBattlesWon,
        battlesWonByLocation,
        activeEffects,
        defeatedGyms,
        defeatedEliteFour,
        defeatedChampions,
        victoryTokens,
        phase: 'battling',
        enemyPokemon: firstPokemon,
        battleEvents: [],
        pendingEvents: [
          {
            type: eventType,
            message,
          },
          ...notifications.map((notification) => ({
            type: 'moneyGain',
            message: notification,
          })),
          {
            type: 'trainerAppear',
            message: `${nextBoss.trainerName} wants to battle!`,
          },
          {
            type: 'trainerSendOut',
            message: `${nextBoss.trainerName} sent out ${firstPokemon.name}!`,
          },
        ],
        currentEventIndex: 0,
        battleTurn: 0,
        weather: null,
        battleHazards: emptyBattleHazards(),
        terrain: null,
        bossBattle: {
          bossId: nextBoss.bossId,
          bossType: nextBoss.bossType,
          trainerName: nextBoss.trainerName,
          trainerClass: nextBoss.trainerClass,
          trainerTeam: nextBoss.trainerTeam,
          currentTrainerPokemonIndex: 0,
          spriteKey: nextBoss.spriteKey,
          region: nextBoss.region,
        },
        bossQueue: remainingQueue,
      }
    let result = /** @type {GameState} */ ({
      ...stateWithNextBoss,
      unlockedLocations: computeUnlockedLocations(stateWithNextBoss),
    })
    if (championJustDefeated) result = settleUnlockTokens(result)
    for (const toastNotification of toastNotifications)
      result = withNotification(result, toastNotification)
    return result
  }
  const finalState = {
    ...prepareNextBattle(state),
    money: newMoney,
    trainerBattlesWon,
    battlesWonByLocation,
    activeEffects,
    defeatedGyms,
    defeatedEliteFour,
    defeatedChampions,
    victoryTokens,
    pendingEvents: [
      {
        type: eventType,
        message,
      },
      ...notifications.map((notification) => ({
        type: 'moneyGain',
        message: notification,
      })),
    ],
  }
  let finalResult = /** @type {GameState} */ ({
    ...finalState,
    unlockedLocations: computeUnlockedLocations(finalState),
  })
  if (championJustDefeated) finalResult = settleUnlockTokens(finalResult)
  for (const toastNotification of toastNotifications)
    finalResult = withNotification(finalResult, toastNotification)
  return finalResult
}
