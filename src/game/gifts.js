// One-off NPC gifts and static overworld encounters. Gifts hand over items,
// money or a Pokemon; statics start a normal wild battle with a fixed
// species/level. Both are claimed once per save (`state.claimedGifts`), and a
// static only counts as claimed when it is actually caught. Requirements are
// simple region-local gates (badges / champion / Pokedex size).

import { gymLeaderData, mapData, pokemonSpecies, regions } from '../data/gameData.js'
import { regionalStarters } from '../data/config.js'
import { rewardItemName } from './minigames/mining.js'

/**
 * @typedef {{
 *   id: string, location: string, name: string, description: string,
 *   items?: Record<string, number>, money?: number,
 *   pokemon?: { speciesKey: string, level: number },
 *   randomStarter?: string,
 *   requires?: { badges?: number, champion?: string, caught?: number },
 * }} GiftEntry
 */

/** @type {GiftEntry[]} */
export const GIFTS = [
  {
    id: 'gift-pallet-parcel',
    location: 'palletTown',
    name: "Oak's Aide",
    description: 'A welcome pack for a brand-new trainer.',
    items: { pokeball: 10, potion: 5 },
  },
  {
    id: 'gift-celadon-eevee',
    location: 'celadonCity',
    name: 'Celadon Condominiums',
    description: 'A trainer on the top floor is offering an Eevee.',
    pokemon: { speciesKey: 'eevee', level: 25 },
    requires: { badges: 4 },
  },
  {
    id: 'gift-johto-starter',
    location: 'johto-new-bark-town',
    name: "Professor Elm's Lab",
    description: 'Elm has a spare Johto starter to give away.',
    randomStarter: 'johto',
  },
  {
    id: 'gift-hoenn-castform',
    location: 'hoenn-fallarbor-town',
    name: 'Weather Institute',
    description: 'The researchers give you the Castform they study.',
    pokemon: { speciesKey: 'castform', level: 25 },
    requires: { badges: 3 },
  },
  {
    id: 'gift-sinnoh-eevee',
    location: 'sinnoh-hearthome-city',
    name: "Bebe's House",
    description: 'The PC developer has an Eevee looking for a home.',
    pokemon: { speciesKey: 'eevee', level: 25 },
    requires: { badges: 4 },
  },
  {
    id: 'gift-unova-larvesta',
    location: 'unova-nacrene-city',
    name: 'Nacrene Museum',
    description: 'A curator gifts an ancient Larvesta.',
    pokemon: { speciesKey: 'larvesta', level: 1 },
    requires: { badges: 2 },
  },
  {
    id: 'gift-kalos-riolu',
    location: 'kalos-shalour-city',
    name: 'Tower of Mastery',
    description: 'A Lucario trainer leaves you a Riolu.',
    pokemon: { speciesKey: 'riolu', level: 25 },
    requires: { badges: 3 },
  },
  {
    id: 'gift-alola-starter',
    location: 'alola-iki-town',
    name: 'Iki Town Festival',
    description: 'A trial-goer shares one of the Alola starters.',
    randomStarter: 'alola',
  },
  {
    id: 'gift-galar-toxel',
    location: 'galar-motostoke',
    name: 'Rose Tower Nursery',
    description: 'The nursery lets you take home a Toxel.',
    pokemon: { speciesKey: 'toxel', level: 1 },
    requires: { badges: 2 },
  },
  {
    id: 'gift-paldea-starter',
    location: 'paldea-mesagoza',
    name: 'Naranja Academy',
    description: 'The academy spares one of the Paldea starters.',
    randomStarter: 'paldea',
  },
]

/**
 * @typedef {{
 *   id: string, location: string, speciesKey: string, level: number,
 *   name: string, note: string,
 *   requires?: { badges?: number, champion?: string, caught?: number },
 * }} StaticEncounter
 */

/** @type {StaticEncounter[]} */
export const STATIC_ENCOUNTERS = [
  {
    id: 'static-route12-snorlax',
    location: 'route12',
    speciesKey: 'snorlax',
    level: 30,
    name: 'Sleeping Snorlax',
    note: 'A huge Snorlax is blocking the road.',
    requires: { badges: 3 },
  },
  {
    id: 'static-route16-snorlax',
    location: 'route16',
    speciesKey: 'snorlax',
    level: 30,
    name: 'Another Snorlax',
    note: 'A second Snorlax snoozes on the Cycling Road.',
    requires: { badges: 5 },
  },
  {
    id: 'static-johto-sudowoodo',
    location: 'johto-route-36',
    speciesKey: 'sudowoodo',
    level: 20,
    name: 'Wiggling Tree',
    note: 'That is no ordinary tree.',
  },
  {
    id: 'static-hoenn-kecleon',
    location: 'hoenn-route-119',
    speciesKey: 'kecleon',
    level: 25,
    name: 'Invisible Pokemon',
    note: 'Something unseen rustles in the tall grass.',
  },
  {
    id: 'static-sinnoh-munchlax',
    location: 'sinnoh-route-210',
    speciesKey: 'munchlax',
    level: 20,
    name: 'Honey-tree Munchlax',
    note: 'A very full Munchlax waddles out of the trees.',
  },
  {
    id: 'static-kalos-snorlax',
    location: 'kalos-route-7',
    speciesKey: 'snorlax',
    level: 30,
    name: 'Flute Snorlax',
    note: 'A Snorlax is asleep across the bridge.',
  },
]

/**
 * @param {{ location: string }} entry
 * @returns {string}
 */
function entryRegion(entry) {
  return mapData[entry.location]?.region ?? 'kanto'
}

/**
 * Whether an entry's requirements are met, with a readable checklist.
 * @param {GameState} state
 * @param {{ location: string, requires?: { badges?: number, champion?: string, caught?: number } }} entry
 * @returns {{ met: boolean, requirements: { label: string, current: number, required: number, met: boolean }[] }}
 */
export function entryRequirementStatus(state, entry) {
  const requires = entry.requires ?? {},
    regionId = entryRegion(entry),
    requirements = []
  if (requires.badges) {
    const current = gymLeaderData.filter(
      (gym) => (gym.region ?? 'kanto') === regionId && state.defeatedGyms.includes(gym.id)
    ).length
    requirements.push({
      label: 'Badges',
      current,
      required: requires.badges,
      met: current >= requires.badges,
    })
  }
  if (requires.champion) {
    const regionName =
      regions.find((candidate) => candidate.id === requires.champion)?.name ?? requires.champion
    requirements.push({
      label: `${regionName} Champion`,
      current: (state.defeatedChampions ?? []).includes(requires.champion) ? 1 : 0,
      required: 1,
      met: (state.defeatedChampions ?? []).includes(requires.champion),
    })
  }
  if (requires.caught) {
    requirements.push({
      label: 'Pokemon caught',
      current: state.pokedexCaught.length,
      required: requires.caught,
      met: state.pokedexCaught.length >= requires.caught,
    })
  }
  return { met: requirements.every((requirement) => requirement.met), requirements }
}

/** @param {string} giftId @returns {GiftEntry | null} */
export function findGift(giftId) {
  return GIFTS.find((gift) => gift.id === giftId) ?? null
}

/** @param {string} staticId @returns {StaticEncounter | null} */
export function findStatic(staticId) {
  return STATIC_ENCOUNTERS.find((entry) => entry.id === staticId) ?? null
}

/**
 * The gift and static entries at a location, annotated with claimed / requirement
 * state.
 * @param {GameState} state
 * @param {string} locationId
 * @returns {{
 *   gifts: (GiftEntry & { claimed: boolean, met: boolean, requirements: { label: string, current: number, required: number, met: boolean }[] })[],
 *   statics: (StaticEncounter & { claimed: boolean, met: boolean, requirements: { label: string, current: number, required: number, met: boolean }[] })[],
 * }}
 */
export function locationEntries(state, locationId) {
  const claimed = new Set(state.claimedGifts ?? [])
  return {
    gifts: GIFTS.filter((gift) => gift.location === locationId).map((gift) => ({
      ...gift,
      claimed: claimed.has(gift.id),
      ...entryRequirementStatus(state, gift),
    })),
    statics: STATIC_ENCOUNTERS.filter((entry) => entry.location === locationId).map((entry) => ({
      ...entry,
      claimed: claimed.has(entry.id),
      ...entryRequirementStatus(state, entry),
    })),
  }
}

/**
 * The starter a `randomStarter` gift hands over: a random member of the
 * region's starter trio. In the region the player started in, the starter they
 * picked pre-game is left out so the gift is never a duplicate.
 * @param {GameState} state
 * @param {GiftEntry} gift
 * @param {() => number} [rng]
 * @returns {string | null}
 */
export function resolveGiftStarter(state, gift, rng = Math.random) {
  const regionId = gift.randomStarter
  if (!regionId) return null
  const starters = (regionalStarters[regionId] ?? []).filter((key) => pokemonSpecies[key])
  if (starters.length === 0) return null
  let pool = starters
  if (regionId === state.startRegion && state.starterSpeciesKey)
    pool = starters.filter((key) => key !== state.starterSpeciesKey)
  if (pool.length === 0) pool = starters
  return pool[Math.floor(rng() * pool.length)] ?? pool[0]
}

/**
 * A short human label for what a gift hands over.
 * @param {GiftEntry} gift
 * @returns {string}
 */
export function giftRewardLabel(gift) {
  const parts = []
  if (gift.pokemon)
    parts.push(pokemonSpecies[gift.pokemon.speciesKey]?.name ?? gift.pokemon.speciesKey)
  if (gift.randomStarter) {
    const regionName =
      regions.find((region) => region.id === gift.randomStarter)?.name ?? gift.randomStarter
    parts.push(`a random ${regionName} starter`)
  }
  if (gift.money) parts.push(`$${gift.money.toLocaleString()}`)
  for (const [itemId, quantity] of Object.entries(gift.items ?? {}))
    parts.push(`${rewardItemName(itemId)} x${quantity}`)
  return parts.join(' + ')
}
