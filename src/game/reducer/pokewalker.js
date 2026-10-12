// Pokewalker reducer handlers: bank steps from elapsed real time and spend
// them on the walk rewards. The pure math lives in game/pokewalker.js.

import { daycareEggBattles, pokewalkerEggDaycareProgress, pokewalkerEggSteps } from '../../data/config.js'
import { activeItems } from '../../data/items.js'
import { pokemonSpecies } from '../../data/gameData.js'
import { withNotification } from '../reducer-helpers.js'
import { POKEWALKER_OPTIONS, accruePokewalker as accrueSteps, pokewalkerItemName, rarestRouteSpecies, rollPokewalkerItem } from '../pokewalker.js'

/**
 * Handle the `ACCRUE_POKEWALKER` action. Uses the wall-clock time since the
 * last bank so the daily cap can't be beaten by ticking fast.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function accruePokewalker(state, action) {
  const elapsedMs = Math.max(0, Number(action.payload?.elapsedMs) || 0)
  if (elapsedMs <= 0) return state
  const result = accrueSteps(state.pokewalker, elapsedMs)
  return result.gained <= 0 && result.pokewalker === state.pokewalker
    ? state
    : { ...state, pokewalker: result.pokewalker }
}

/**
 * Handle the `SPEND_POKEWALKER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function spendPokewalker(state, action) {
  const option = POKEWALKER_OPTIONS.find((entry) => entry.id === action.payload?.optionId)
  if (!option) return state
  const balance = state.pokewalker?.steps ?? 0
  if (balance < option.cost) return state
  const nextPokewalker = { ...state.pokewalker, steps: balance - option.cost }
  if (option.id === 'egg') return spendOnEggs(state, nextPokewalker)
  if (option.id === 'item') return spendOnItem(state, nextPokewalker)
  return spendOnReveal(state, nextPokewalker)
}

/**
 * Advance the Day-Care egg and every party egg. Party eggs are stopped one
 * step short so the next wild win still hatches them the normal way.
 * @param {GameState} state
 * @param {Pokewalker} nextPokewalker
 * @returns {GameState}
 */
function spendOnEggs(state, nextPokewalker) {
  const party = (state.party ?? []).map((member) => {
      if (!member?.isEgg) return member
      const remaining = member.eggStepsRemaining ?? 0
      return remaining <= 1
        ? member
        : { ...member, eggStepsRemaining: Math.max(1, remaining - pokewalkerEggSteps) }
    }),
    daycare =
      state.daycare?.parents?.length === 2
        ? {
            ...state.daycare,
            progress: Math.min(
              daycareEggBattles,
              (state.daycare.progress ?? 0) + pokewalkerEggDaycareProgress
            ),
          }
        : state.daycare
  return withNotification(
    {
      ...state,
      pokewalker: nextPokewalker,
      party,
      daycare,
      battleLog: [...state.battleLog, 'The Pokewalker walked your eggs warmer.'].slice(-50),
    },
    { message: 'The Pokewalker walked your eggs warm!', tone: 'success', icon: '\u{1f95a}' }
  )
}

/**
 * Find a random item and add it to the bag.
 * @param {GameState} state
 * @param {Pokewalker} nextPokewalker
 * @returns {GameState}
 */
function spendOnItem(state, nextPokewalker) {
  const { itemId, quantity } = rollPokewalkerItem()
  return withNotification(
    {
      ...state,
      pokewalker: nextPokewalker,
      inventory: {
        ...state.inventory,
        [itemId]: (state.inventory[itemId] ?? 0) + quantity,
      },
      battleLog: [...state.battleLog, `The Pokewalker found ${quantity}x ${pokewalkerItemName(itemId)}!`].slice(-50),
    },
    {
      message: `The Pokewalker found ${quantity}x ${pokewalkerItemName(itemId)}!`,
      tone: 'success',
      icon: '\u{1f392}',
    }
  )
}

/**
 * Draw the current route's rarest wild out of hiding with a Honey-style
 * encounter boost (and catch bonus).
 * @param {GameState} state
 * @param {Pokewalker} nextPokewalker
 * @returns {GameState}
 */
function spendOnReveal(state, nextPokewalker) {
  const routeKey = state.currentRoute,
    speciesKey = rarestRouteSpecies(routeKey)
  if (!speciesKey) return state
  const existingIndex = state.activeEffects.findIndex(
      (effect) =>
        effect.type === 'honey' && effect.routeKey === routeKey && effect.speciesKey === speciesKey
    ),
    name = pokemonSpecies[speciesKey]?.name ?? speciesKey
  let activeEffects
  if (existingIndex >= 0) {
    activeEffects = [...state.activeEffects]
    activeEffects[existingIndex] = {
      ...activeEffects[existingIndex],
      battlesRemaining: (activeEffects[existingIndex].battlesRemaining ?? 0) + activeItems.honey.duration,
    }
  } else
    activeEffects = [
      ...state.activeEffects,
      { type: 'honey', battlesRemaining: activeItems.honey.duration, routeKey, speciesKey },
    ]
  return withNotification(
    {
      ...state,
      pokewalker: nextPokewalker,
      activeEffects,
      battleLog: [...state.battleLog, `The Rare Radar draws ${name} out of hiding!`].slice(-50),
    },
    {
      message: `The Rare Radar draws ${name} out of hiding!`,
      tone: 'success',
      icon: '\u{1f4e1}',
    }
  )
}
