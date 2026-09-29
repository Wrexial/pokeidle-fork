// Reducer handlers for the one-off NPC gifts and static encounters.

import { createBattlePokemon } from '../combat.js'
import { entryRequirementStatus, findGift, findStatic, giftRewardLabel, resolveGiftStarter } from '../gifts.js'
import { markCaught } from './collection.js'
import { catchPokemon } from './pokemon/management.js'
import { startEncounter } from './battle/events.js'
import { withNotification } from '../reducer-helpers.js'
import { breedShinyOdds } from '../../data/config.js'
import { eggHatchSteps } from '../breeding.js'
import { createEgg, insertIntoBox } from '../pokemon.js'
import { checkShinyOdds } from '../progression.js'

/** Phases a static encounter can interrupt (normal play, not an animation). */
const STARTABLE_PHASES = ['idle', 'victory', 'battling', 'defeat']

/**
 * Handle the `CLAIM_GIFT` action. Only a gift at the current location, with its
 * requirements met and not already claimed, pays out.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function claimGift(state, action) {
  const gift = findGift(action.payload?.giftId)
  if (!gift || state.currentLocation !== gift.location) return state
  if ((state.claimedGifts ?? []).includes(gift.id)) return state
  if (!entryRequirementStatus(state, gift).met) return state

  let next = state
  if (gift.money) next = { ...next, money: next.money + gift.money }
  if (gift.items) {
    const inventory = { ...next.inventory }
    for (const [itemId, quantity] of Object.entries(gift.items))
      inventory[itemId] = (inventory[itemId] ?? 0) + quantity
    next = { ...next, inventory }
  }
  if (gift.pokemon || gift.randomStarter) {
    const speciesKey = gift.pokemon?.speciesKey ?? resolveGiftStarter(state, gift)
    if (speciesKey) {
      next = catchPokemon(next, {
        type: 'CATCH_POKEMON',
        payload: { speciesKey, level: gift.pokemon?.level ?? 5 },
      })
      next = markCaught(next, {
        type: 'MARK_CAUGHT',
        payload: { speciesKey },
      })
    }
  }
  // An egg gift carries an Egg instead of a hatched Pokemon; it registers in
  // the Pokedex only when it hatches (the normal egg-hatch handler does that).
  if (gift.egg) {
    const egg = createEgg(
      gift.egg.speciesKey,
      next.nextPokemonId,
      checkShinyOdds(breedShinyOdds),
      eggHatchSteps(gift.egg.speciesKey)
    )
    next =
      next.party.length < 6
        ? { ...next, party: [...next.party, egg], nextPokemonId: next.nextPokemonId + 1 }
        : {
            ...next,
            box: insertIntoBox(next.box, egg, next.boxSort),
            nextPokemonId: next.nextPokemonId + 1,
          }
  }
  const reward = giftRewardLabel(gift)
  return withNotification(
    {
      ...next,
      claimedGifts: [...(next.claimedGifts ?? []), gift.id],
      battleLog: [...next.battleLog, `${gift.name} gave you ${reward}!`].slice(-50),
    },
    {
      message: `${gift.name}: ${reward}`,
      tone: 'success',
      icon: '\ud83c\udf81',
      dedupeKey: `gift:${gift.id}`,
    }
  )
}

/**
 * Handle the `START_STATIC_ENCOUNTER` action. Starts a normal wild battle with
 * the fixed species/level; the static is only marked claimed when it is caught.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startStaticEncounter(state, action) {
  const entry = findStatic(action.payload?.staticId)
  if (!entry || state.currentLocation !== entry.location) return state
  if ((state.claimedGifts ?? []).includes(entry.id)) return state
  if (!entryRequirementStatus(state, entry).met) return state
  if (!STARTABLE_PHASES.includes(state.phase) || state.trainerBattle || state.bossBattle)
    return state
  const enemy = createBattlePokemon(entry.speciesKey, entry.level, {
    wild: true,
    // A fixed-shiny static (the red Gyarados) is always shiny.
    isShiny: entry.shiny === !0,
  })
  enemy.staticId = entry.id
  return startEncounter(state, { type: 'START_ENCOUNTER', payload: { enemy } })
}
