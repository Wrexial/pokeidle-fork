// Reducer handlers for minigames actions. Split from game/reducer.js.

import { MATCH3_COST, MEMORY_COST, MUSICAL_COST, PICNIC_COST, POKEBALL_FACTORY_COST, WHACK_COST, BATTLE_ROYAL_COST, BUG_CONTEST_COST, CONTEST_COST, CURRY_COST, DYNAMAX_ADVENTURES_COST, LIGHTS_OUT_COST, MINING_COST, POKEATHLON_COST, POKE_RADAR_COST, POKESTAR_COST, QUIZ_COST, ROUTE_ACTIVITIES, SAFARI_COST, SLIDING_COST, ICE_SLIDE_COST, VOLTORB_FLIP_COST, GAME_CORNER_PRIZE_GOAL, rollGameCornerPrize, routeActivityIds } from '../minigames.js'
import { minigameTmChance } from '../../data/config.js'
import { mapData, pokemonSpecies } from '../../data/gameData.js'
import { getTmInfo, tmItemId } from '../../data/tms.js'
import { createIdleBattleState } from '../progression.js'
import { enterMinigame, withNotification } from '../reducer-helpers.js'
import { minigameTmTypes, rollUnownedTm } from '../tms.js'
import { markCaught } from './collection.js'
import { catchPokemon } from './pokemon/management.js'

/**
 * Handle the `START_BUG_CONTEST` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startBugContest(state, action) {
  return enterMinigame(
    state,
    'bugCatching',
    BUG_CONTEST_COST,
    'You entered the Bug Catching Contest!'
  )
}

/**
 * Handle the `END_BUG_CONTEST` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endBugContest(state, action) {
  return state.phase === 'bugCatching'
    ? recordMinigame({ ...state, ...createIdleBattleState() }, action.payload)
    : state
}

/**
 * Handle the `START_SAFARI` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startSafari(state, action) {
  return enterMinigame(
    state,
    'safari',
    SAFARI_COST,
    'You headed into the Safari Zone!'
  )
}

/**
 * Handle the `END_SAFARI` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endSafari(state, action) {
  return state.phase === 'safari' ? { ...state, ...createIdleBattleState() } : state
}

/**
 * Handle the `START_ACADEMY_QUIZ` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startAcademyQuiz(state, action) {
  return enterMinigame(
    state,
    'academyQuiz',
    QUIZ_COST,
    'You sat down for the Academy Quiz.'
  )
}

/**
 * Handle the `START_MINING` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startMining(state, action) {
  return enterMinigame(
    state,
    'mining',
    MINING_COST,
    'You headed down into the Underground.'
  )
}

/**
 * Handle the `START_GAME_CORNER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startGameCorner(state, action) {
  return enterMinigame(state, 'gameCorner', 0, 'You stepped up to the Game Corner slots.')
}

/**
 * Handle the `RECORD_GAME_CORNER_WIN` action: advance the slot prize track by
 * the winning lines this spin, and hand out a Game Corner prize Pokemon each
 * time the track fills (Scyther / Dratini / Porygon).
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function recordGameCornerWin(state, action) {
  const lines = Math.max(0, Math.floor(action.payload?.lines ?? 0))
  if (state.phase !== 'gameCorner' || lines <= 0) return state
  let next = state,
    progress = (state.gameCornerProgress ?? 0) + lines
  if (progress >= GAME_CORNER_PRIZE_GOAL) {
    progress -= GAME_CORNER_PRIZE_GOAL
    const prize = rollGameCornerPrize()
    next = catchPokemon(next, {
      type: 'CATCH_POKEMON',
      payload: { speciesKey: prize.speciesKey, level: prize.level },
    })
    next = markCaught(next, {
      type: 'MARK_CAUGHT',
      payload: { speciesKey: prize.speciesKey },
    })
    next = withNotification(next, {
      message: `Game Corner prize: ${pokemonSpecies[prize.speciesKey]?.name ?? prize.speciesKey}!`,
      tone: 'success',
      icon: '\u{1f3b0}',
      dedupeKey: `game-corner-prize:${prize.speciesKey}`,
    })
  }
  return { ...next, gameCornerProgress: progress }
}

/**
 * Handle the `START_VOLTORB_FLIP` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startVoltorbFlip(state, action) {
  return enterMinigame(
    state,
    'voltorbFlip',
    VOLTORB_FLIP_COST,
    'You sat down at the Voltorb Flip table.'
  )
}

/**
 * Handle the `START_AUCTION_HOUSE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startAuctionHouse(state, action) {
  return enterMinigame(state, 'auctionHouse', 0, 'You took a seat at the Grand Auction House.')
}

/**
 * Handle the `START_CONTEST` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startContest(state, action) {
  return enterMinigame(
    state,
    'contest',
    CONTEST_COST,
    'You stepped onto the Contest stage.'
  )
}

/**
 * Handle the `START_POKEATHLON` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPokeathlon(state, action) {
  return enterMinigame(
    state,
    'pokeathlon',
    POKEATHLON_COST,
    'You signed up for the Pokeathlon.'
  )
}

/**
 * Handle the `START_POKE_RADAR` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPokeRadar(state, action) {
  return enterMinigame(
    state,
    'pokeRadar',
    POKE_RADAR_COST,
    'You raised the Poke Radar and the grass began to rustle.'
  )
}

/**
 * Handle the `START_BATTLE_ROYAL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startBattleRoyal(state, action) {
  return enterMinigame(
    state,
    'battleRoyal',
    BATTLE_ROYAL_COST,
    'You stepped into the Battle Royal ring.'
  )
}

/**
 * Handle the `START_DYNAMAX_ADVENTURES` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startDynamaxAdventures(state, action) {
  return enterMinigame(
    state,
    'dynamaxAdventures',
    DYNAMAX_ADVENTURES_COST,
    'You descended into the Max Lair.'
  )
}

/**
 * Handle the `START_LIGHTS_OUT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startLightsOut(state, action) {
  return enterMinigame(state, 'lightsOut', LIGHTS_OUT_COST, 'You flicked the lights off.')
}

/**
 * Handle the `START_CURRY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startCurry(state, action) {
  return enterMinigame(state, 'curry', CURRY_COST, 'You set up a campfire to cook.')
}

/**
 * Handle the `START_POKESTAR` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPokestar(state, action) {
  return enterMinigame(state, 'pokestar', POKESTAR_COST, 'You stepped onto the Pokestar lot.')
}

/**
 * Handle the `START_PUZZLE_LEAGUE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPuzzleLeague(state, action) {
  return enterMinigame(state, 'puzzleLeague', MATCH3_COST, 'You entered the Puzzle League.')
}

/**
 * Handle the `START_MEMORY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startMemory(state, action) {
  return enterMinigame(state, 'memory', MEMORY_COST, 'You shuffled the memory deck.')
}

/**
 * Handle the `START_WHACK` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startWhack(state, action) {
  return enterMinigame(state, 'whack', WHACK_COST, 'The Diglett are ready to pop.')
}

/**
 * Handle the `START_MUSICAL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startMusical(state, action) {
  return enterMinigame(state, 'musical', MUSICAL_COST, 'You stepped onto the Musical stage.')
}

/**
 * Handle the `START_PICNIC` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPicnic(state, action) {
  return enterMinigame(state, 'picnic', PICNIC_COST, 'You set out a picnic blanket.')
}

/**
 * Handle the `START_POKEBALL_FACTORY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPokeballFactory(state, action) {
  return enterMinigame(
    state,
    'pokeballFactory',
    POKEBALL_FACTORY_COST,
    'You clocked on at the Pok\u00e9 Ball Factory.'
  )
}

/**
 * Handle the `START_PELAGO` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPelago(state, action) {
  return enterMinigame(state, 'pelago', 0, 'You arrived at Pok\u00e9 Pelago.')
}

/**
 * Handle the `START_RUINS_PUZZLE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startRuinsPuzzle(state, action) {
  return enterMinigame(state, 'ruinsPuzzle', SLIDING_COST, 'You stepped into the Ruins of Alph.')
}

/**
 * Handle the `START_ICE_SLIDE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startIceSlide(state, action) {
  return enterMinigame(state, 'iceSlide', ICE_SLIDE_COST, 'You entered Snowpoint Temple.')
}

/**
 * Merge a minigame result into `state.minigameRecords`, keeping the best score.
 * @param {GameState} state
 * @param {{ minigame?: string, score?: number, completed?: boolean } | null | undefined} [result]
 * @returns {GameState}
 */
function recordMinigame(state, result) {
  if (!result?.minigame) return state
  const previous = state.minigameRecords?.[result.minigame] ?? { best: 0, completed: false },
    best = Math.max(previous.best ?? 0, Math.max(0, Math.floor(result.score ?? 0))),
    completed = previous.completed || !!result.completed || best > 0
  return {
    ...state,
    minigameRecords: {
      ...(state.minigameRecords ?? {}),
      [result.minigame]: { best, completed },
    },
  }
}

/**
 * Handle the `END_MINIGAME` action, recording the run's result for the
 * `unlock.minigame` route gates.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endMinigame(state, action) {
  return state.phase === 'mining' ||
    state.phase === 'gameCorner' ||
    state.phase === 'academyQuiz' ||
    state.phase === 'voltorbFlip' ||
    state.phase === 'auctionHouse' ||
    state.phase === 'contest' ||
    state.phase === 'pokeathlon' ||
    state.phase === 'pokeRadar' ||
    state.phase === 'battleRoyal' ||
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
    state.phase === 'pelago'
    ? recordMinigame({ ...state, ...createIdleBattleState() }, action.payload)
    : state
}

/**
 * Handle the `START_ROUTE_ACTIVITY` action. Only starts an activity that is
 * actually available at the current location.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startRouteActivity(state, action) {
  const activityId = action.payload?.activityId,
    activity = ROUTE_ACTIVITIES[activityId]
  if (!activity || !routeActivityIds(mapData[state.currentLocation]).includes(activityId))
    return state
  const base = enterMinigame(
    state,
    'routeActivity',
    0,
    `You started ${activity.title.toLowerCase()}.`
  )
  return base === state ? state : { ...base, routeActivity: activityId }
}

/**
 * Handle the `END_ROUTE_ACTIVITY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endRouteActivity(state, action) {
  return state.phase === 'routeActivity'
    ? { ...state, ...createIdleBattleState(), routeActivity: null }
    : state
}

/**
 * Handle the `PAY_MINIGAME_FEE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function payMinigameFee(state, action) {
  const amount = action.payload?.amount ?? 0
  if (amount <= 0 || state.money < amount) return state
  return {
    ...state,
    money: state.money - amount,
  }
}

/**
 * Handle the `CLAIM_MINIGAME_REWARD` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function claimMinigameReward(state, action) {
  const { money = 0, items = [], pokemon = null } = action.payload ?? {},
    inventory = { ...state.inventory }
  for (const item of items)
    if (item?.itemId && item.quantity > 0)
      inventory[item.itemId] = (inventory[item.itemId] ?? 0) + item.quantity
  let next = {
    ...state,
    money: state.money + money,
    inventory,
    battleLog: [...state.battleLog, 'Minigame reward claimed.'].slice(-50),
  }
  // A themed minigame can turn up a TM the player has not found yet.
  const tmTypes = minigameTmTypes(state.phase, state.routeActivity)
  if (tmTypes !== undefined && Math.random() < minigameTmChance) {
    const tmMove = rollUnownedTm(tmTypes, inventory)
    if (tmMove) {
      const tmId = tmItemId(tmMove),
        tmName = getTmInfo(tmId).name
      inventory[tmId] = (inventory[tmId] ?? 0) + 1
      next = withNotification(
        {
          ...next,
          inventory,
          battleLog: [...next.battleLog, `Found a ${tmName}!`].slice(-50),
        },
        {
          message: `Found a ${tmName}!`,
          tone: 'success',
          icon: '\u{1f4bf}',
          dedupeKey: `tm:${tmId}`,
        }
      )
    }
  }
  // Some minigames hand over a fixed Pokemon (the Ruins of Alph's Unown).
  if (pokemon?.speciesKey && pokemonSpecies[pokemon.speciesKey]) {
    const speciesKey = pokemon.speciesKey
    next = catchPokemon(next, {
      type: 'CATCH_POKEMON',
      payload: { speciesKey, level: pokemon.level ?? 5 },
    })
    next = markCaught(next, { type: 'MARK_CAUGHT', payload: { speciesKey } })
  }
  return next
}

/**
 * Handle the `COLLECT_MINING` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function collectMining(state, action) {
  const rewards = Array.isArray(action.payload?.rewards) ? action.payload.rewards : []
  if (rewards.length === 0) return state
  const inventory = { ...state.inventory }
  for (const reward of rewards)
    if (reward?.itemId && reward.quantity > 0)
      inventory[reward.itemId] = (inventory[reward.itemId] ?? 0) + reward.quantity
  let next = {
    ...state,
    inventory,
    battleLog: [...state.battleLog, 'Collected the Underground finds.'].slice(-50),
  }
  // The Underground is the Rock/Ground/Steel TM source.
  const tmTypes = minigameTmTypes('mining', null)
  if (tmTypes !== undefined && Math.random() < minigameTmChance) {
    const tmMove = rollUnownedTm(tmTypes, inventory)
    if (tmMove) {
      const tmId = tmItemId(tmMove),
        tmName = getTmInfo(tmId).name
      inventory[tmId] = (inventory[tmId] ?? 0) + 1
      next = withNotification(
        {
          ...next,
          inventory,
          battleLog: [...next.battleLog, `Found a ${tmName}!`].slice(-50),
        },
        {
          message: `Found a ${tmName}!`,
          tone: 'success',
          icon: '\u{1f4bf}',
          dedupeKey: `tm:${tmId}`,
        }
      )
    }
  }
  return next
}
