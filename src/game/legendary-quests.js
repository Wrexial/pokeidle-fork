// Legendary quests: a multi-step hunt for each region's box legendary, instead
// of leaving it to the Raid Island's weighted roll. Completing the steps lets
// you challenge the legendary directly; the quest is done once it is caught.

import { baseRegions, gymLeaderData, mapData, regions, speciesKeysByGeneration } from '../data/gameData.js'

/** Fraction of a region's generation that must be registered for the last step. */
export const QUEST_SPECIES_FRACTION = 0.4

/**
 * The box legendary each region's quest hunts, with a short quest name.
 * @type {Record<string, { legendary: string, name: string }>}
 */
export const LEGENDARY_QUESTS = {
  kanto: { legendary: 'mewtwo', name: 'The Psychic Cat' },
  johto: { legendary: 'lugia', name: 'The Diving Pokemon' },
  hoenn: { legendary: 'rayquaza', name: 'The Sky High Pokemon' },
  sinnoh: { legendary: 'giratina', name: 'The Renegade' },
  unova: { legendary: 'kyurem', name: 'The Boundary Pokemon' },
  kalos: { legendary: 'xerneas', name: 'The Life Pokemon' },
  alola: { legendary: 'necrozma', name: 'The Prism Pokemon' },
  galar: { legendary: 'eternatus', name: 'The Eternity Pokemon' },
  paldea: { legendary: 'terapagos', name: 'The Tera Pokemon' },
}

/**
 * The region's Raid Island location id, or null.
 * @param {string} regionId
 * @returns {string | null}
 */
export function raidLocationFor(regionId) {
  const entry = Object.values(mapData).find(
    (location) => location.type === 'raid' && (location.region ?? 'kanto') === regionId
  )
  return entry?.id ?? null
}

/**
 * The region's generation index (region order == generation order).
 * @param {string} regionId
 * @returns {number}
 */
function generationForRegion(regionId) {
  const region = baseRegions.find((entry) => entry.id === regionId),
    index = regions.findIndex((entry) => entry.id === regionId)
  return region ? regions.indexOf(region) : Math.max(0, index)
}

/**
 * The quest's steps and progress for a region, or null when there is no quest.
 * @param {GameState} state
 * @param {string} regionId
 * @returns {{
 *   region: string,
 *   legendary: string,
 *   name: string,
 *   level: number,
 *   raidLocation: string | null,
 *   caught: boolean,
 *   ready: boolean,
 *   steps: { id: string, label: string, done: boolean, progress: number, need: number }[],
 * } | null}
 */
export function legendaryQuestStatus(state, regionId) {
  const quest = LEGENDARY_QUESTS[regionId]
  if (!quest) return null
  const regionGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === regionId),
    badgeCount = regionGyms.filter((gym) => state.defeatedGyms.includes(gym.id)).length,
    champion = state.defeatedChampions.includes(regionId),
    genSpecies = speciesKeysByGeneration[generationForRegion(regionId)] ?? [],
    speciesNeed = Math.max(1, Math.ceil(genSpecies.length * QUEST_SPECIES_FRACTION)),
    speciesCaught = genSpecies.filter((key) => state.pokedexCaught.includes(key)).length,
    caught = state.pokedexCaught.includes(quest.legendary),
    level =
      regions
        .find((region) => region.id === regionId)
        ?.raidPool?.find((entry) => entry.speciesKey === quest.legendary)?.level ?? 75,
    steps = [
      {
        id: 'badges',
        label: `Earn every badge in ${regionId}`,
        done: badgeCount >= regionGyms.length,
        progress: badgeCount,
        need: regionGyms.length,
      },
      {
        id: 'champion',
        label: 'Defeat the Champion',
        done: champion,
        progress: champion ? 1 : 0,
        need: 1,
      },
      {
        id: 'species',
        label: `Register ${speciesNeed} of its generation in the Pokédex`,
        done: speciesCaught >= speciesNeed,
        progress: Math.min(speciesCaught, speciesNeed),
        need: speciesNeed,
      },
    ]
  return {
    region: regionId,
    ...quest,
    level,
    raidLocation: raidLocationFor(regionId),
    caught,
    ready: !caught && steps.every((step) => step.done),
    steps,
  }
}
