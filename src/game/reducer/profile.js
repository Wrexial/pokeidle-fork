// Reducer handlers for the Trainer Card profile: editing the name/title/outfit,
// buying an outfit, and pinning badges or a favourite Pokemon.

import { availableOutfits, createTrainerProfile, sanitizeTrainerProfile } from '../trainer-profile.js'
import { availableTitles } from '../titles.js'
import { OUTFITS } from '../../data/outfits.js'

/**
 * Handle the `UPDATE_TRAINER_PROFILE` action: merge a partial profile change
 * (name, title, outfit, favourite Pokemon, badge case) through the same
 * sanitiser the save loader uses. An outfit or title the player has not
 * unlocked is ignored, and badges must already have been earned, so a crafted
 * action can never grant content for free.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function updateTrainerProfile(state, action) {
  const profile = state.trainerProfile ?? createTrainerProfile(),
    patch = { ...(action.payload ?? {}) },
    pokemonIds = new Set([...(state.party ?? []), ...(state.box ?? [])].map((p) => p.id)),
    earnedGymIds = new Set(state.defeatedGyms ?? []),
    wearable = new Set(availableOutfits(state).map((outfit) => outfit.id)),
    titleIds = new Set(availableTitles(state).map((title) => title.id))
  if ('outfit' in patch && !wearable.has(patch.outfit)) delete patch.outfit
  if ('title' in patch && patch.title != null && !titleIds.has(patch.title)) patch.title = null
  if (Array.isArray(patch.badgeCase))
    patch.badgeCase = patch.badgeCase.filter((/** @type {string} */ id) => earnedGymIds.has(id))
  const next = sanitizeTrainerProfile(
    { ...profile, ...patch },
    { pokemonIds, gymIds: earnedGymIds }
  )
  return { ...state, trainerProfile: next }
}

/**
 * Handle the `BUY_OUTFIT` action: spend money on a priced outfit and wear it.
 * No-op when it is already owned or unaffordable.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function buyOutfit(state, action) {
  const outfit = OUTFITS.find((entry) => entry.id === action.payload?.outfitId)
  if (!outfit || !outfit.unlock.cost) return state
  const profile = state.trainerProfile,
    owned = profile?.ownedOutfits ?? []
  if (owned.includes(outfit.id) || state.money < outfit.unlock.cost) return state
  return {
    ...state,
    money: state.money - outfit.unlock.cost,
    trainerProfile: {
      ...createTrainerProfile(),
      ...(profile ?? {}),
      ownedOutfits: [...owned, outfit.id],
      outfit: outfit.id,
    },
  }
}
