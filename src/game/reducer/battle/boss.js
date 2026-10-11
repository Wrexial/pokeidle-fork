// // Boss battle lifecycle: start and end (badges, Elite Four, Champion). Split from game/reducer/battle.js.

import { BATTLE_TOWER_REGION, gymTmRewardCount } from '../../../data/config.js'
import { gymLeaderData, mapData, regions } from '../../../data/gameData.js'
import { getTmInfo, tmItemId } from '../../../data/tms.js'
import { createVolatileState } from '../../combat.js'
import { fieldWeatherFor } from '../../weather.js'
import { emptyBattleHazards } from '../../hazards.js'
import { computeUnlockedLocations, prepareNextBattle, syncActivePokemonIntoParty, tickBattleCounters } from '../../progression.js'
import { frontierTokenReward } from '../../battle-frontier.js'
import { awardRibbonToParty } from '../../pokemon.js'
import { settleUnlockTokens, recordSeenPokemon, withNotification } from '../../reducer-helpers.js'
import { gymTmType, rollUnownedTm } from '../../tms.js'

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
  return recordSeenPokemon(
    {
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
      weather: fieldWeatherFor(mapData[state.currentLocation]),
      battleHazards: emptyBattleHazards(),
      terrain: null,
      activePlayerPokemonIndex: 0,
      battleParticipants: (state.party[0]?.id ?? state.playerPokemon?.id)
        ? [state.party[0]?.id ?? state.playerPokemon?.id]
        : [],
      playerTurnSpent: !1,
      enemyTurnSpent: !1,
      bossBattle: {
        bossId,
        bossType,
        trainerName,
        trainerClass,
        trainerTeam,
        currentTrainerPokemonIndex: 0,
        spriteKey,
        region,
        // Only the Champion makes mid-battle tactical switches.
        championSwapsRemaining: bossType === 'champion' ? 2 : 0,
      },
      bossQueue: bossQueue ?? [],
      playerVolatile: createVolatileState(),
    },
    firstPokemon
  )
}

/**
 * The ribbon a beaten boss awards the party, or null for an untracked one.
 * @param {string | undefined} bossType
 * @returns {string | null}
 */
function ribbonForBossType(bossType) {
  return bossType === 'gym'
    ? 'gym'
    : bossType === 'e4'
      ? 'elite'
      : bossType === 'champion'
        ? 'league'
        : null
}

/**
 * Give a ribbon to the whole party on a win, returning a new state only when
 * the party actually changed.
 * @param {GameState} state
 * @param {string} ribbonId
 * @returns {GameState}
 */
function withPartyRibbon(state, ribbonId) {
  const party = awardRibbonToParty(state.party, ribbonId)
  return party === state.party ? state : { ...state, party }
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
      reward = Math.floor(floor / 10),
      towerState = {
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
    return towerWon ? withPartyRibbon(towerState, 'tower') : towerState
  }
  // Battle Frontier facilities are the same deterministic floor puzzle with a
  // rule variant. The end handler restores the real party after a Battle
  // Factory rental and records the facility's floor record.
  if (state.bossBattle?.bossType === 'frontier') {
    const { won: frontierWon, moneyDelta: frontierMoneyDelta } = action.payload,
      facilityId = state.bossBattle.facilityId ?? 'factory',
      floor = state.frontierFloor?.[facilityId] ?? 1,
      best = state.frontierBest?.[facilityId] ?? 0,
      reward = frontierTokenReward(floor),
      // Put the real party back after a rental battle before rebuilding the
      // idle state (so `prepareNextBattle` sees the actual team).
      restored = state.frontierRental ? { ...state, party: state.frontierRental.party } : state,
      frontierState = {
        ...prepareNextBattle(restored),
        frontierRental: null,
        money: Math.max(0, state.money + frontierMoneyDelta),
        trainerBattlesWon: frontierWon
          ? state.trainerBattlesWon + 1
          : state.trainerBattlesWon,
        victoryTokens: frontierWon ? state.victoryTokens + reward : state.victoryTokens,
        frontierFloor: {
          ...(state.frontierFloor ?? {}),
          [facilityId]: frontierWon ? floor + 1 : Math.max(1, floor),
        },
        frontierBest: {
          ...(state.frontierBest ?? {}),
          [facilityId]: Math.max(best, frontierWon ? floor : floor - 1),
        },
        battleLog: [
          ...state.battleLog,
          frontierWon
            ? `Battle Frontier floor ${floor} cleared!${
                reward > 0 ? ` Earned ${reward} Victory Token${reward > 1 ? 's' : ''}.` : ''
              }`
            : `Battle Frontier floor ${floor} failed \u2014 your team can try again.`,
        ].slice(-50),
      }
    return frontierState
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
    // A rival win pays extra money on top of the base payout.
    rivalBonus = 0,
    rivals = state.rivals,
    inventory = state.inventory,
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
    // A beaten rival advances its stage and pays a scaling cash bonus.
    if (bossType === 'rival') {
      const rivalRegion = state.bossBattle.region ?? 'kanto',
        stage = rivals?.[rivalRegion] ?? 0,
        reward = 2000 + stage * 1000
      rivals = { ...(rivals ?? {}), [rivalRegion]: stage + 1 }
      rivalBonus = reward
      inventory = { ...inventory, rareCandy: (inventory.rareCandy ?? 0) + 1 }
      toastNotifications.push({
        message: `${state.bossBattle.trainerName} was beaten! +$${reward.toLocaleString()} and a Rare Candy.`,
        tone: 'shiny',
        icon: '\u2694',
        dedupeKey: `rival:${rivalRegion}:${stage + 1}`,
      })
    }
    // A first badge comes with a couple of TMs of the gym's theme type, so a
    // gym win is a real way to build up the TM case.
    if (bossType === 'gym' && !state.defeatedGyms.includes(bossId)) {
      const gymType = gymTmType(gymLeaderData.find((gym) => gym.id === bossId)),
        awarded = []
      for (let index = 0; index < gymTmRewardCount; index++) {
        const tmMove = rollUnownedTm(gymType ? [gymType] : null, inventory)
        if (!tmMove) break
        const tmId = tmItemId(tmMove),
          tmName = getTmInfo(tmId).name
        inventory = { ...inventory, [tmId]: (inventory[tmId] ?? 0) + 1 }
        awarded.push(tmName)
      }
      for (const tmName of awarded) notifications.push(`Received ${tmName}!`)
      if (awarded.length > 0)
        toastNotifications.push({
          message: `Received ${awarded.join(' \u00b7 ')}!`,
          tone: 'success',
          icon: '\u{1f4bf}',
          dedupeKey: `tm:${bossId}`,
        })
    }
  }
  if (won && state.bossQueue.length > 0) {
    const [nextBoss, ...remainingQueue] = state.bossQueue,
      firstPokemon = nextBoss.trainerTeam[0],
      stateWithNextBoss = {
        ...syncActivePokemonIntoParty(state),
        money: newMoney + rivalBonus,
        rivals,
        inventory,
        trainerBattlesWon,
        battlesWonByLocation,
        activeEffects,
        defeatedGyms,
        defeatedEliteFour,
        defeatedChampions,
        victoryTokens,
        phase: 'battling',
        enemyPokemon: firstPokemon,
        // Each Elite Four / Champion bout is a fresh battle: reset the
        // volatile state so stat boosts, status and screens don't carry over.
        playerVolatile: createVolatileState(),
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
        weather: fieldWeatherFor(mapData[state.currentLocation]),
        battleHazards: emptyBattleHazards(),
        terrain: null,
        enemyTurnSpent: !1,
        bossBattle: {
          bossId: nextBoss.bossId,
          bossType: nextBoss.bossType,
          trainerName: nextBoss.trainerName,
          trainerClass: nextBoss.trainerClass,
          trainerTeam: nextBoss.trainerTeam,
          currentTrainerPokemonIndex: 0,
          spriteKey: nextBoss.spriteKey,
          region: nextBoss.region,
          championSwapsRemaining: nextBoss.bossType === 'champion' ? 2 : 0,
        },
        bossQueue: remainingQueue,
      }
    let result = /** @type {GameState} */ ({
      ...recordSeenPokemon(stateWithNextBoss, firstPokemon),
      unlockedLocations: computeUnlockedLocations(stateWithNextBoss),
    })
    if (championJustDefeated) result = settleUnlockTokens(result)
    // A win hands the party the boss's ribbon.
    const queueRibbon = won ? ribbonForBossType(state.bossBattle?.bossType) : null
    if (queueRibbon) result = withPartyRibbon(result, queueRibbon)
    for (const toastNotification of toastNotifications)
      result = withNotification(result, toastNotification)
    return result
  }
  const finalState = {
    ...prepareNextBattle(state),
    money: newMoney + rivalBonus,
    rivals,
    inventory,
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
  const bossRibbon = won ? ribbonForBossType(state.bossBattle?.bossType) : null
  if (bossRibbon) finalResult = withPartyRibbon(finalResult, bossRibbon)
  for (const toastNotification of toastNotifications)
    finalResult = withNotification(finalResult, toastNotification)
  return finalResult
}
