import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  LEGENDARY_QUESTS,
  QUEST_SPECIES_FRACTION,
  legendaryQuestStatus,
  raidLocationFor,
} = await import('../src/game/legendary-quests.js')
const {
  gymLeaderData,
  pokemonSpecies,
  regions,
  speciesKeysByGeneration,
} = await import('../src/data/gameData.js')
const { initialGameState } = await import('../src/game/reducer.js')

test('each region has a quest with a real legendary and a Raid Island', () => {
  for (const [regionId, quest] of Object.entries(LEGENDARY_QUESTS)) {
    assert.ok(pokemonSpecies[quest.legendary], `${quest.legendary} is a real species`)
    assert.ok(quest.name, `${regionId} has a quest name`)
    assert.ok(raidLocationFor(regionId), `${regionId} has a Raid Island`)
  }
})

test('the quest steps track badges, the Champion and the generation dex', () => {
  const kantoGyms = gymLeaderData
      .filter((gym) => (gym.region ?? 'kanto') === 'kanto')
      .map((gym) => gym.id),
    gen1 = speciesKeysByGeneration[0],
    need = Math.ceil(gen1.length * QUEST_SPECIES_FRACTION),
    empty = { ...initialGameState, defeatedGyms: [], defeatedChampions: [], pokedexCaught: [] },
    fresh = legendaryQuestStatus(empty, 'kanto')
  assert.equal(fresh.caught, false)
  assert.equal(fresh.ready, false)
  assert.equal(fresh.steps.find((step) => step.id === 'badges').need, kantoGyms.length)

  const full = {
      ...initialGameState,
      defeatedGyms: kantoGyms,
      defeatedChampions: ['kanto'],
      pokedexCaught: gen1.slice(0, need),
    },
    ready = legendaryQuestStatus(full, 'kanto')
  assert.ok(ready.steps.every((step) => step.done), 'all steps done')
  assert.equal(ready.ready, true)
  assert.equal(ready.raidLocation, raidLocationFor('kanto'))
  assert.equal(
    ready.level,
    regions.find((region) => region.id === 'kanto').raidPool.find((e) => e.speciesKey === 'mewtwo')
      .level
  )

  // Catching the legendary completes the quest.
  const caught = legendaryQuestStatus(
    { ...full, pokedexCaught: [...full.pokedexCaught, 'mewtwo'] },
    'kanto'
  )
  assert.equal(caught.caught, true)
  assert.equal(caught.ready, false)
  // A region without a quest returns null.
  assert.equal(legendaryQuestStatus(full, 'nonsense'), null)
})
