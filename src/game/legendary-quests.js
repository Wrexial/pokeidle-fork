// Legendary quests: a multi-step hunt for each region's box legendary, instead
// of leaving it to the Raid Island's weighted roll. Completing the steps lets
// you challenge the legendary directly; the quest is done once it is caught.

import { gymLeaderData, mapData, regions } from '../data/gameData.js'

/** Ancient Relics a region's legendary quest asks for. */
export const QUEST_RELIC_COUNT = 10

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
 * A short pre-battle scene for each legendary quest's boss: the lines a
 * challenger reads before committing to the raid.
 * @type {Record<string, string[]>}
 */
export const LEGENDARY_DIALOGUE = {
  kanto: [
    'The air in the cave turns heavy and cold.',
    'A single psychic eye opens in the dark \u2014 it has been waiting for you.',
  ],
  johto: [
    'The sea below the Whirl Islands goes still.',
    'A silver wing breaks the surface, and the whole sky darkens.',
  ],
  hoenn: [
    'The clouds above the tower spiral into a single ring.',
    'A green serpent uncoils through the stratosphere, roaring.',
  ],
  sinnoh: [
    'The rift tears wider, and gravity turns sideways.',
    'Something ancient and furious drags itself out of the distortion.',
  ],
  unova: [
    'Frost crawls up the walls of the cavern.',
    'A grey dragon fused with ice rises, and the air itself cracks.',
  ],
  kalos: [
    'Petals drift down from nowhere, then stop mid-air.',
    'A towering, luminous shape steps out of the light \u2014 and offers you a choice.',
  ],
  alola: [
    'The prism splits the light into a hundred colours.',
    'A creature of glass and shadow unfolds from the shards.',
  ],
  galar: [
    'The sky over the island turns a sickly red.',
    'Something enormous and alien touches down, and the ground hums.',
  ],
  paldea: [
    'Crystals erupt from the earth in every direction.',
    'The shell of a sleeping titan shifts, and a thousand years of dust falls away.',
  ],
}

/**
 * The pre-battle lines for a region's legendary boss, or an empty list.
 * @param {string} regionId
 * @returns {string[]}
 */
export function legendaryDialogue(regionId) {
  return LEGENDARY_DIALOGUE[regionId] ?? []
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
    relicCount = state.relics?.[regionId] ?? 0,
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
        id: 'relics',
        label: `Recover ${QUEST_RELIC_COUNT} Ancient Relics in ${regionId}`,
        done: relicCount >= QUEST_RELIC_COUNT,
        progress: Math.min(relicCount, QUEST_RELIC_COUNT),
        need: QUEST_RELIC_COUNT,
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
