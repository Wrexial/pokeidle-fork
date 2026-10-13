// Reducer handlers for collection actions. Split from game/reducer.js.

import { ACHIEVEMENTS } from '../../data/achievements.js'
import {
  dexRewardVictoryTokens,
  formDexFamilyBaseMoney,
  formDexFamilyVariantMoney,
  formDexGenerationReward,
  formDexRegionalReward,
} from '../../data/config.js'
import { dailyEventByKey, rollDailyEvent, todayKey } from '../../data/daily-events.js'
import { formDexModel, pokemonSpecies } from '../../data/gameData.js'
import { newlyCompletedFormDex } from '../../data/form-dex.js'
import { SHINY_CHAIN_FIRST_TARGET, formatReward, prepareNextBattle } from '../progression.js'
import { recordHuntCatch } from '../hunt.js'
import { questLabel, professorStoryStatus, rollQuests } from '../quests.js'
import { applyResearchEarnings, applyResearchRibbon } from '../research.js'
import { awardRibbonToParty } from '../pokemon.js'
import { withNotification } from '../reducer-helpers.js'
import { sosRewardsCrossed } from '../sos-chain.js'

/**
 * Handle the `MARK_SEEN` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function markSeen(state, action) {
  const { speciesKey } = action.payload
  // Record the sighting silently; the toast for every first-encounter was noise.
  return state.pokedexSeen.includes(speciesKey)
    ? state
    : {
        ...state,
        pokedexSeen: [...state.pokedexSeen, speciesKey],
      }
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
    hunted = recordHuntCatch(state.hunt, speciesKey),
    baseState =
      pokedexSeen === state.pokedexSeen && pokedexCaught === state.pokedexCaught
        ? state
        : {
            ...state,
            pokedexSeen,
            pokedexCaught,
          },
    nextState = hunted === state.hunt ? baseState : { ...baseState, hunt: hunted }
  return withNotification(
    applyResearchRibbon(applyResearchEarnings(nextState, speciesKey), speciesKey),
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
        applyResearchEarnings(
          {
            ...state,
            shinyCaught: [...state.shinyCaught, speciesKey],
          },
          speciesKey
        ),
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
 * Handle the `CLAIM_FORM_DEX_REWARDS` action. The Living Dex pays at three
 * levels: a money reward per completed species family, a bundle per completed
 * regional set, and a bigger capstone per generation whose every form is
 * collected. The handler re-derives which requested groups are genuinely
 * complete (and unpaid) so a stale or forged payload can't mint rewards.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function claimFormDexRewards(state, action) {
  const pending = newlyCompletedFormDex(
    formDexModel,
    new Set(state.pokedexCaught),
    state.formDexGenders ?? {},
    {
      families: new Set(state.rewardedFamilies ?? []),
      regionalSets: new Set(state.rewardedRegionalSets ?? []),
      generations: new Set(state.rewardedFormGenerations ?? []),
    }
  ),
    requestedFamilies = new Set(
      Array.isArray(action.payload?.families) ? action.payload.families : []
    ),
    requestedSets = new Set(
      Array.isArray(action.payload?.regionalSets) ? action.payload.regionalSets : []
    ),
    requestedGenerations = new Set(
      Array.isArray(action.payload?.generations) ? action.payload.generations : []
    ),
    families = pending.families.filter((base) => requestedFamilies.has(base)),
    regionalSets = pending.regionalSets.filter((id) => requestedSets.has(id)),
    generations = pending.generations.filter((generation) => requestedGenerations.has(generation))
  if (families.length === 0 && regionalSets.length === 0 && generations.length === 0) return state

  const familyByBase = new Map(formDexModel.families.map((family) => [family.base, family]))
  let money = state.money,
    victoryTokens = state.victoryTokens
  const inventory = { ...state.inventory },
    logLines = []
  let familyMoney = 0
  for (const base of families) {
    const targetCount = familyByBase.get(base)?.targets.length ?? 1,
      reward = formDexFamilyBaseMoney + formDexFamilyVariantMoney * Math.max(0, targetCount - 1)
    familyMoney += reward
    logLines.push(`Living Dex: ${pokemonSpecies[base]?.name ?? base} family complete (+$${reward.toLocaleString()}).`)
  }
  money += familyMoney
  for (let index = 0; index < regionalSets.length; index++)
    for (const [itemId, quantity] of Object.entries(formDexRegionalReward.items ?? {}))
      inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  money += regionalSets.length * formDexRegionalReward.money
  victoryTokens += regionalSets.length * formDexRegionalReward.victoryTokens
  for (let index = 0; index < generations.length; index++)
    for (const [itemId, quantity] of Object.entries(formDexGenerationReward.items ?? {}))
      inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  money += generations.length * formDexGenerationReward.money
  victoryTokens += generations.length * formDexGenerationReward.victoryTokens
  for (const id of regionalSets)
    logLines.push(`Living Dex: ${formDexModel.regionalSets.find((set) => set.id === id)?.label ?? id} complete!`)
  for (const generation of generations)
    logLines.push(`Living Dex: Generation ${generation + 1} forms complete!`)

  let claimedState = /** @type {GameState} */ ({
    ...state,
    money,
    victoryTokens,
    inventory,
    rewardedFamilies: [...(state.rewardedFamilies ?? []), ...families],
    rewardedRegionalSets: [...(state.rewardedRegionalSets ?? []), ...regionalSets],
    rewardedFormGenerations: [...(state.rewardedFormGenerations ?? []), ...generations],
    battleLog: [...state.battleLog, ...logLines].slice(-50),
  })
  if (families.length > 0)
    claimedState = withNotification(claimedState, {
      message: `${families.length} form-dex famil${families.length === 1 ? 'y' : 'ies'} complete! +$${familyMoney.toLocaleString()}`,
      tone: 'success',
      icon: '📖',
      dedupeKey: `formdex:families:${families.length}:${families[0]}`,
    })
  for (const id of regionalSets) {
    const set = formDexModel.regionalSets.find((candidate) => candidate.id === id)
    claimedState = withNotification(claimedState, {
      message: `Living Dex: ${set?.label ?? id} complete! ${formatReward(formDexRegionalReward)}`,
      tone: 'shiny',
      icon: '🏅',
      dedupeKey: `formdex:regional:${id}`,
    })
  }
  for (const generation of generations)
    claimedState = withNotification(claimedState, {
      message: `Living Dex: Generation ${generation + 1} complete! ${formatReward(formDexGenerationReward)}`,
      tone: 'shiny',
      icon: '🏅',
      dedupeKey: `formdex:generation:${generation}`,
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
 * Handle the `CLAIM_STORY_CHAPTER` action: pay a Professor's Story chapter's
 * reward once its derived steps are all done. The chapter is re-derived from
 * the live state, so a stale or forged payload can't mint a reward.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function claimStoryChapter(state, action) {
  const { chapterId } = action.payload,
    chapter = professorStoryStatus(state).chapters.find(
      /** @param {any} candidate */ (candidate) => candidate.id === chapterId
    )
  if (!chapter || !chapter.claimable) return state
  const reward = chapter.reward ?? {},
    inventory = { ...state.inventory }
  for (const [itemId, quantity] of Object.entries(reward.items ?? {}))
    inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  return withNotification(
    {
      ...state,
      money: state.money + (reward.money ?? 0),
      victoryTokens: state.victoryTokens + (reward.victoryTokens ?? 0),
      inventory,
      party: reward.ribbon ? awardRibbonToParty(state.party, reward.ribbon) : state.party,
      professorStory: {
        claimed: [...(state.professorStory?.claimed ?? []), chapterId],
      },
      battleLog: [
        ...state.battleLog,
        `Professor's story: ${chapter.title} complete!`,
      ].slice(-50),
    },
    {
      message: `Professor's story complete: ${reward.charm ?? chapter.title} — ${formatReward(reward)}`,
      tone: 'success',
      icon: '🎓',
      dedupeKey: `story:${chapterId}`,
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
 * Handle the `ADVANCE_SOS_CHAIN` action: a wild win extends the current
 * route's SOS chain while the same species keeps appearing (a win on another
 * route, or over a different species, starts a new chain). The route's best
 * chain is updated, and each milestone reward is paid once per route the first
 * time its best chain passes the threshold.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function advanceSosChain(state, action) {
  const routeKey = action.payload?.routeKey,
    speciesKey = action.payload?.speciesKey
  if (!routeKey) return state
  const chain = state.sosChain ?? { routeKey: null, speciesKey: null, count: 0 },
    sameChain =
      chain.routeKey === routeKey && !!speciesKey && chain.speciesKey === speciesKey,
    count = sameChain ? chain.count + 1 : 1,
    previousBest = state.sosBestChains?.[routeKey] ?? 0,
    best = Math.max(previousBest, count),
    rewards = previousBest < count ? sosRewardsCrossed(previousBest, count) : [],
    next = {
      ...state,
      sosChain: { routeKey, speciesKey: speciesKey ?? null, count },
      sosBestChains: { ...(state.sosBestChains ?? {}), [routeKey]: best },
    }
  if (rewards.length === 0) return next
  const inventory = { ...next.inventory }
  for (const reward of rewards)
    inventory[reward.itemId] = (inventory[reward.itemId] ?? 0) + reward.amount
  return withNotification(
    { ...next, inventory },
    {
      message: `SOS chain ${best}! Milestone reward: ${rewards.map((reward) => reward.label).join(' and ')}.`,
      tone: 'success',
      icon: '\u{1f517}',
      dedupeKey: `sos:${routeKey}:${best}`,
    }
  )
}

/**
 * Handle the `RESET_SOS_CHAIN` action: a lost battle breaks the consecutive-win
 * streak. The route's best chain is kept.
 * @param {GameState} state
 * @returns {GameState}
 */
export function resetSosChain(state) {
  if (!state.sosChain?.count) return state
  return {
    ...state,
    sosChain: {
      routeKey: state.sosChain.routeKey ?? null,
      speciesKey: state.sosChain.speciesKey ?? null,
      count: 0,
    },
  }
}

/**
 * Handle the `UPDATE_SHINY_CHAIN` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function updateShinyChain(state, action) {
  const { speciesKey, amount = 1, radar = false } = action.payload,
    current = state.shinyChain ?? { speciesKey: null, count: 0, radar: 0 },
    sameSpecies = current.speciesKey === speciesKey,
    base = sameSpecies
      ? {
          count: current.count,
          radar: current.radar ?? 0,
          target: current.target ?? SHINY_CHAIN_FIRST_TARGET,
        }
      : { count: 0, radar: 0, target: SHINY_CHAIN_FIRST_TARGET }
  return {
    ...state,
    shinyChain: {
      speciesKey,
      count: base.count + amount,
      // Only the Poke Radar banks levels toward the guaranteed shiny; an
      // ordinary wild encounter still builds the odds multiplier (`count`).
      radar: radar ? base.radar + amount : base.radar,
      target: base.target,
    },
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
