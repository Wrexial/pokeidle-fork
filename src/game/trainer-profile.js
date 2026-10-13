// The player's Trainer Card profile: their name, chosen title, outfit, pinned
// favourite Pokemon and the badges shown in the badge case. The profile is a
// single persisted slice (`state.trainerProfile`); everything cosmetic about it
// is derived here so the card renderer and save-slot summary share one shape.

import { ACHIEVEMENTS } from '../data/achievements.js'
import { OUTFITS, outfitById } from '../data/outfits.js'
import { gymLeaderData, mapData, pokemonSpecies, regions } from '../data/gameData.js'
import { pokemonDisplayName } from './pokemon.js'
import { availableTitles, titleById } from './titles.js'

/** The fallback name for a profile that has never been edited. */
export const DEFAULT_TRAINER_NAME = 'Trainer'
/** Longest trainer name the card and save slot accept. */
export const TRAINER_NAME_MAX_LENGTH = 16
/** Widest badge case the card shows (the old eight-badge standard, with room
 * for Alola's eleven trials). */
export const BADGE_CASE_MAX = 11

/**
 * A fresh Trainer Card profile: the starter outfit, a default name, no title
 * and an empty (auto) badge case.
 * @returns {TrainerProfile}
 */
export function createTrainerProfile() {
  return {
    name: DEFAULT_TRAINER_NAME,
    title: null,
    outfit: OUTFITS[0].id,
    ownedOutfits: [OUTFITS[0].id],
    favouritePokemonId: null,
    badgeCase: [],
  }
}

/**
 * Make a raw stored profile safe to use: trim the name, drop unknown outfits,
 * titles, badges and Pokemon ids, and guarantee the starter outfit is owned.
 * @param {any} raw
 * @param {{ pokemonIds?: Set<string>, gymIds?: Set<string> }} [options]
 * @returns {TrainerProfile}
 */
export function sanitizeTrainerProfile(raw, options = {}) {
  const source = raw && typeof raw === 'object' ? raw : {},
    fallback = createTrainerProfile(),
    name =
      typeof source.name === 'string' && source.name.trim()
        ? source.name.trim().slice(0, TRAINER_NAME_MAX_LENGTH)
        : fallback.name,
    outfit = OUTFITS.some((entry) => entry.id === source.outfit)
      ? source.outfit
      : fallback.outfit,
    ownedOutfits = [
      ...new Set([
        ...(Array.isArray(source.ownedOutfits) ? source.ownedOutfits : []).filter(
          (/** @type {any} */ id) => OUTFITS.some((entry) => entry.id === id)
        ),
        fallback.outfit,
      ]),
    ],
    title =
      typeof source.title === 'string' && titleById(source.title) ? source.title : null,
    favouritePokemonId =
      options.pokemonIds && options.pokemonIds.has(source.favouritePokemonId)
        ? source.favouritePokemonId
        : null,
    badgeCase = [
      ...new Set(
        (Array.isArray(source.badgeCase) ? source.badgeCase : []).filter(
          (/** @type {any} */ id) =>
            gymLeaderData.some((gym) => gym.id === id) &&
            (!options.gymIds || options.gymIds.has(id))
        )
      ),
    ].slice(0, BADGE_CASE_MAX)
  return { name, title, outfit, ownedOutfits, favouritePokemonId, badgeCase }
}

/**
 * Every outfit the player can currently wear: the free starter, any unlocked by
 * an achieved achievement, and any bought into `ownedOutfits`.
 * @param {GameState} state
 * @returns {typeof OUTFITS}
 */
export function availableOutfits(state) {
  const profile = state.trainerProfile ?? createTrainerProfile(),
    earnedAchievements = new Set(
      ACHIEVEMENTS.filter((achievement) => achievement.check(state)).map(
        (achievement) => achievement.id
      )
    ),
    owned = new Set(profile.ownedOutfits ?? [])
  return OUTFITS.filter((outfit) => {
    if (outfit.unlock.free) return true
    if (outfit.unlock.achievement) return earnedAchievements.has(outfit.unlock.achievement)
    if (outfit.unlock.cost) return owned.has(outfit.id)
    return false
  })
}

/**
 * The Pokemon the profile pins to its card, falling back to the active Pokemon
 * when nothing (or a released Pokemon) is selected.
 * @param {GameState} state
 * @returns {Pokemon | null}
 */
export function favouriteTrainerPokemon(state) {
  const id = state.trainerProfile?.favouritePokemonId,
    found = id ? [...(state.party ?? []), ...(state.box ?? [])].find((p) => p.id === id) : null
  return found ?? state.playerPokemon ?? null
}

/**
 * The card-ready view model the DOM card and the PNG export both render. Built
 * from the live state so it always reflects the current save.
 * @param {GameState} state
 * @returns {TrainerCardData}
 */
export function buildTrainerCard(state) {
  const profile = state.trainerProfile ?? createTrainerProfile(),
    regionId = mapData[state.currentLocation]?.region ?? state.startRegion ?? 'kanto',
    region = regions.find((entry) => entry.id === regionId),
    gyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === regionId),
    earned = new Set(state.defeatedGyms ?? []),
    // A pinned badge case wins; otherwise the card shows the current region's
    // earned badges automatically.
    pinned = (profile.badgeCase ?? [])
      .map((id) => gymLeaderData.find((gym) => gym.id === id))
      .filter(Boolean),
    badgeCase = pinned.length > 0 ? pinned : gyms.filter((gym) => earned.has(gym.id)),
    favourite = favouriteTrainerPokemon(state),
    title = titleById(profile.title),
    titleUnlocked =
      !!profile.title && availableTitles(state).some((entry) => entry.id === profile.title)
  return {
    name: profile.name,
    title: titleUnlocked && title ? title.name : null,
    outfit: outfitById(profile.outfit),
    favourite: favourite
      ? {
          speciesKey: favourite.speciesKey,
          name: pokemonDisplayName(favourite),
          speciesName: pokemonSpecies[favourite.speciesKey]?.name ?? favourite.speciesKey,
          spriteId: pokemonSpecies[favourite.speciesKey]?.id,
          level: favourite.level ?? 1,
          isShiny: !!favourite.isShiny,
        }
      : null,
    regionName: region?.name ?? 'Kanto',
    level: state.playerPokemon?.level ?? 1,
    dex: (state.pokedexCaught ?? []).length,
    badges: badgeCase.map((gym) => ({
      id: gym.id,
      name: gym.badgeName,
      color: gym.badgeColor,
    })),
    totalBadges: (state.defeatedGyms ?? []).length,
    regionId,
  }
}
