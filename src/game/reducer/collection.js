// Reducer handlers for collection actions. Split from game/reducer.js.

import { ACHIEVEMENTS } from '../../data/achievements.js'
import { dexRewardVictoryTokens } from '../../data/config.js'
import { dailyEventByKey, rollDailyEvent, todayKey } from '../../data/daily-events.js'
import { pokemonSpecies } from '../../data/gameData.js'
import { formatReward, prepareNextBattle } from '../progression.js'
import { questLabel, rollQuests } from '../quests.js'
import { withNotification } from '../reducer-helpers.js'

/**
 * Handle the `MARK_SEEN` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function markSeen(state, action) {
  const { speciesKey } = action.payload
  return state.pokedexSeen.includes(speciesKey)
    ? state
    : withNotification(
        {
          ...state,
          pokedexSeen: [...state.pokedexSeen, speciesKey],
        },
        {
          message: `You found a wild ${pokemonSpecies[speciesKey]?.name ?? speciesKey}!`,
          tone: 'info',
          icon: '👀',
          dedupeKey: `seen:${speciesKey}`,
        }
      )
}

/**
 * Handle the `MARK_CAUGHT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function markCaught(state, action) {
  const { speciesKey } = action.payload,
    isNewSpecies = !state.pokedexCaught.includes(speciesKey),
    speciesName = pokemonSpecies[speciesKey]?.name ?? speciesKey,
    pokedexSeen = state.pokedexSeen.includes(speciesKey)
      ? state.pokedexSeen
      : [...state.pokedexSeen, speciesKey],
    pokedexCaught = isNewSpecies ? [...state.pokedexCaught, speciesKey] : state.pokedexCaught,
    nextState =
      pokedexSeen === state.pokedexSeen && pokedexCaught === state.pokedexCaught
        ? state
        : {
            ...state,
            pokedexSeen,
            pokedexCaught,
          }
  return withNotification(
    nextState,
    isNewSpecies
      ? {
          message: `${speciesName} was registered in the Pokédex!`,
          tone: 'success',
          icon: '📕',
          dedupeKey: `caught:${speciesKey}`,
        }
      : {
          message: `${speciesName} was caught again.`,
          tone: 'info',
          icon: '🔴',
          dedupeKey: `repeat:${speciesKey}`,
          cooldown: 15000,
        }
  )
}

/**
 * Handle the `MARK_SHINY_CAUGHT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function markShinyCaught(state, action) {
  const { speciesKey } = action.payload
  return state.shinyCaught.includes(speciesKey)
    ? state
    : withNotification(
        {
          ...state,
          shinyCaught: [...state.shinyCaught, speciesKey],
        },
        {
          message: `Shiny ${pokemonSpecies[speciesKey]?.name ?? speciesKey} was caught!`,
          tone: 'shiny',
          icon: '🌟',
          dedupeKey: `shinycaught:${speciesKey}`,
        }
      )
}

/**
 * Handle the `CLAIM_DEX_REWARDS` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function claimDexRewards(state, action) {
  const generations = /** @type {number[]} */ (
      Array.isArray(action.payload?.generations) ? action.payload.generations : []
    ),
    newlyCompleted = generations.filter(
      (generationIndex) =>
        Number.isInteger(generationIndex) &&
        !state.rewardedGenerations.includes(generationIndex)
    )
  if (newlyCompleted.length === 0) return state
  let claimedState = /** @type {GameState} */ ({
    ...state,
    rewardedGenerations: [...state.rewardedGenerations, ...newlyCompleted],
    victoryTokens: state.victoryTokens + newlyCompleted.length * dexRewardVictoryTokens,
    inventory: {
      ...state.inventory,
      masterball: (state.inventory.masterball ?? 0) + newlyCompleted.length,
    },
    battleLog: [
      ...state.battleLog,
      ...newlyCompleted.map(
        (generationIndex) =>
          `Generation ${generationIndex + 1} dex complete! Earned ${dexRewardVictoryTokens} Victory Tokens and a Master Ball.`
      ),
    ].slice(-50),
  })
  for (const generationIndex of newlyCompleted)
    claimedState = withNotification(claimedState, {
      message: `Generation ${generationIndex + 1} dex complete! +${dexRewardVictoryTokens} Victory Tokens, +1 Master Ball`,
      tone: 'shiny',
      icon: '🏆',
      dedupeKey: `dexreward:${generationIndex}`,
    })
  return claimedState
}

/**
 * Handle the `CLAIM_ACHIEVEMENT_REWARDS` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function claimAchievementRewards(state, action) {
  const requestedIds = Array.isArray(action.payload?.ids) ? action.payload.ids : [],
    rewarded = new Set(state.rewardedAchievements ?? []),
    newlyRewarded = requestedIds.filter((/** @type {string} */ id) => {
      const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === id)
      return achievement && !rewarded.has(id) && achievement.check(state)
    })
  if (newlyRewarded.length === 0) return state
  let money = state.money,
    victoryTokens = state.victoryTokens
  const inventory = { ...state.inventory }
  for (const id of newlyRewarded) {
    const reward = /** @type {any} */ (
      ACHIEVEMENTS.find((achievement) => achievement.id === id)
    ).reward
    money += reward.money ?? 0
    victoryTokens += reward.victoryTokens ?? 0
    for (const [itemId, quantity] of Object.entries(reward.items ?? {}))
      inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  }
  let claimedState = {
    ...state,
    money,
    victoryTokens,
    inventory,
    rewardedAchievements: [...(state.rewardedAchievements ?? []), ...newlyRewarded],
  }
  for (const id of newlyRewarded) {
    const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === id)
    if (!achievement) continue
    claimedState = withNotification(claimedState, {
      message: `Achievement: ${achievement.name} (+${formatReward(achievement.reward)})`,
      tone: 'success',
      icon: '🏆',
      dedupeKey: `achievement:${id}`,
    })
  }
  return claimedState
}

/**
 * Handle the `REFRESH_QUESTS` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function refreshQuests(state, action) {
  const today = action.payload?.today ?? todayKey()
  if (state.quests?.date === today) return state
  return withNotification(
    { ...state, quests: rollQuests(state, today) },
    {
      message: 'New daily quests are available!',
      tone: 'info',
      icon: '📜',
      dedupeKey: `quests:${today}`,
    }
  )
}

/**
 * Handle the `CLAIM_QUEST` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function claimQuest(state, action) {
  const { questId } = action.payload,
    quest = state.quests?.list?.find(
      /** @param {any} candidate */ (candidate) => candidate.id === questId
    )
  if (!quest || quest.claimed || quest.progress < quest.goal) return state
  const reward = quest.reward ?? {},
    inventory = { ...state.inventory }
  for (const [itemId, quantity] of Object.entries(reward.items ?? {}))
    inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  return withNotification(
    {
      ...state,
      money: state.money + (reward.money ?? 0),
      victoryTokens: state.victoryTokens + (reward.victoryTokens ?? 0),
      inventory,
      quests: {
        ...state.quests,
        list: state.quests.list.map(
          /** @param {any} candidate */ (candidate) =>
            candidate.id === questId ? { ...candidate, claimed: true } : candidate
        ),
      },
      battleLog: [...state.battleLog, `Quest complete: ${questLabel(quest)}!`].slice(-50),
    },
    {
      message: `Quest reward: ${formatReward(reward)}`,
      tone: 'success',
      icon: '📜',
      dedupeKey: `quest:${questId}`,
    }
  )
}

/**
 * Handle the `START_DEX_CELEBRATION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startDexCelebration(state, action) {
  if (state.phase === 'dexComplete') return state
  const generation = action.payload?.generation
  if (!Number.isInteger(generation)) return state
  return {
    ...state,
    phase: 'dexComplete',
    dexCelebration: { generation },
    pendingEvents: [],
    battleEvents: [],
  }
}

/**
 * Handle the `COMPLETE_DEX_CELEBRATION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function completeDexCelebration(state, action) {
  return state.phase !== 'dexComplete'
    ? state
    : { ...prepareNextBattle(state), dexCelebration: null }
}

/**
 * Handle the `CLEAR_OFFLINE_REPORT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function clearOfflineReport(state, action) {
  return {
    ...state,
    offlineReport: null,
  }
}

/**
 * Handle the `REFRESH_DAILY_EVENT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function refreshDailyEvent(state, action) {
  const today = action.payload?.today ?? todayKey()
  if (state.dailyEvent?.date === today) return state
  const dailyEvent = rollDailyEvent(today),
    event = dailyEventByKey[dailyEvent.kind]
  return withNotification(
    {
      ...state,
      dailyEvent,
    },
    {
      message: `${event.name}: ${event.description}`,
      tone: 'info',
      icon: event.icon,
      dedupeKey: `daily:${today}`,
    }
  )
}

/**
 * Handle the `CLAIM_DAILY_GIFT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function claimDailyGift(state, action) {
  const dailyEvent = state.dailyEvent,
    event = dailyEvent ? dailyEventByKey[dailyEvent.kind] : null
  if (!event || !dailyEvent || dailyEvent.claimed) return state
  const inventory = { ...state.inventory }
  for (const [itemId, quantity] of Object.entries(event.gift.items))
    inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  const giftMoney = event.gift.money
  return withNotification(
    {
      ...state,
      money: state.money + giftMoney,
      inventory,
      dailyEvent: { ...dailyEvent, claimed: true },
      battleLog: [
        ...state.battleLog,
        `Claimed the ${event.name} gift: $${giftMoney.toLocaleString()} and items!`,
      ].slice(-50),
    },
    {
      message: `${event.name} gift claimed!`,
      tone: 'success',
      icon: '🎁',
      dedupeKey: `dailygift:${dailyEvent.date}`,
    }
  )
}

/**
 * Handle the `UPDATE_SHINY_CHAIN` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function updateShinyChain(state, action) {
  const { speciesKey } = action.payload
  return {
    ...state,
    shinyChain:
      state.shinyChain.speciesKey === speciesKey
        ? { speciesKey, count: state.shinyChain.count + 1 }
        : { speciesKey, count: 1 },
  }
}

/**
 * Handle the `MARK_SHINY_SEEN` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function markShinySeen(state, action) {
  const { speciesKey } = action.payload
  return state.shinySeen.includes(speciesKey)
    ? state
    : withNotification(
        {
          ...state,
          shinySeen: [...state.shinySeen, speciesKey],
        },
        {
          message: `A shiny ${pokemonSpecies[speciesKey]?.name ?? speciesKey} appeared!`,
          tone: 'shiny',
          icon: '✨',
          dedupeKey: `shinyseen:${speciesKey}`,
        }
      )
}
