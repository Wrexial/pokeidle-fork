import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  LEGENDARY_DIALOGUE,
  LEGENDARY_QUESTS,
  QUEST_RELIC_COUNT,
  legendaryDialogue,
  legendaryQuestStatus,
  raidLocationFor,
} = await import('../src/game/legendary-quests.js')
const {
  gymLeaderData,
  pokemonSpecies,
  raidLegendaryPoolFor,
  raidPoolFor,
  regions,
} = await import('../src/data/gameData.js')
const { isQuestLegendary } = await import('../src/data/legendary-quests.js')
const { resolveRoamer } = await import('../src/game/progression.js')
const { initialGameState } = await import('../src/game/reducer.js')
const { gameReducer } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')

test('each region has a quest with a real legendary and a Raid Island', () => {
  for (const [regionId, quest] of Object.entries(LEGENDARY_QUESTS)) {
    assert.ok(pokemonSpecies[quest.legendary], `${quest.legendary} is a real species`)
    assert.ok(quest.name, `${regionId} has a quest name`)
    assert.ok(raidLocationFor(regionId), `${regionId} has a Raid Island`)
  }
})

test('each legendary quest has a pre-battle scene', () => {
  for (const regionId of Object.keys(LEGENDARY_QUESTS)) {
    const lines = LEGENDARY_DIALOGUE[regionId]
    assert.ok(Array.isArray(lines) && lines.length > 0, `${regionId} has intro lines`)
    for (const line of lines) assert.equal(typeof line, 'string')
    assert.deepEqual(legendaryDialogue(regionId), lines)
  }
  assert.deepEqual(legendaryDialogue('nonsense'), [])
})

test('the quest steps track badges, the Champion and the region relics', () => {
  const kantoGyms = gymLeaderData
      .filter((gym) => (gym.region ?? 'kanto') === 'kanto')
      .map((gym) => gym.id),
    empty = {
      ...initialGameState,
      defeatedGyms: [],
      defeatedChampions: [],
      pokedexCaught: [],
      relics: {},
    },
    fresh = legendaryQuestStatus(empty, 'kanto')
  assert.equal(fresh.caught, false)
  assert.equal(fresh.ready, false)
  assert.equal(fresh.steps.find((step) => step.id === 'badges').need, kantoGyms.length)

  const full = {
      ...initialGameState,
      defeatedGyms: kantoGyms,
      defeatedChampions: ['kanto'],
      relics: { kanto: QUEST_RELIC_COUNT },
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
    { ...full, pokedexCaught: ['mewtwo'] },
    'kanto'
  )
  assert.equal(caught.caught, true)
  assert.equal(caught.ready, false)
  // A region without a quest returns null.
  assert.equal(legendaryQuestStatus(full, 'nonsense'), null)
})

test('the relic step only counts the region it belongs to', () => {
  const base = {
      ...initialGameState,
      defeatedGyms: [],
      defeatedChampions: [],
      relics: { kanto: 4, johto: 10 },
    },
    kanto = legendaryQuestStatus(base, 'kanto').steps.find((step) => step.id === 'relics'),
    johto = legendaryQuestStatus(base, 'johto').steps.find((step) => step.id === 'relics')
  assert.equal(kanto.progress, 4)
  assert.equal(kanto.done, false)
  assert.equal(johto.progress, QUEST_RELIC_COUNT)
  assert.equal(johto.done, true)
})

test('a wild win on a route can unearth an Ancient Relic', () => {
  const originalRandom = Math.random
  try {
    // A constant roll below the relic chance drops one, while staying above
    // the treasure/candy/TM chances so nothing else lands.
    Math.random = () => 0.05
    const active = createPokemon('charmander', 50, 'a'),
      state = {
        ...initialGameState,
        phase: 'battling',
        currentLocation: 'route22',
        party: [active],
        playerPokemon: active,
        activePlayerPokemonIndex: 0,
        enemyPokemon: createPokemon('pidgey', 5, 'e'),
        pendingEvents: [{ type: 'faint', message: 'x', data: { target: 'enemy' } }],
        battleEvents: [],
      },
      won = gameReducer(state, { type: 'CONSUME_EVENT' })
    assert.equal(won.relics.kanto, 1, 'Kanto relics are tracked')
    assert.equal(won.inventory.ancientRelic, 1, 'the relic item lands in the bag')
  } finally {
    Math.random = originalRandom
  }
})

test('the box legendary is quest-exclusive, never a random raid or roamer', () => {
  for (const [regionId, quest] of Object.entries(LEGENDARY_QUESTS)) {
    assert.ok(isQuestLegendary(regionId, quest.legendary), 'the helper knows the box legendary')
    assert.ok(
      !raidPoolFor(regionId).some((entry) => entry.speciesKey === quest.legendary),
      `${regionId}'s random raid pool leaves ${quest.legendary} out`
    )
    assert.ok(
      !raidLegendaryPoolFor(regionId).some((entry) => entry.speciesKey === quest.legendary),
      `${regionId}'s raid-headline pool leaves ${quest.legendary} out`
    )
    // The quest still knows where to send the player: the raw roster has it.
    assert.ok(
      (regions.find((region) => region.id === regionId)?.raidPool ?? []).some(
        (entry) => entry.speciesKey === quest.legendary
      ),
      `${regionId}'s roster still carries ${quest.legendary} for the quest`
    )
  }
  // A forced roamer roll never turns up the box legendary.
  const originalRandom = Math.random
  try {
    Math.random = () => 0
    for (const [regionId, quest] of Object.entries(LEGENDARY_QUESTS)) {
      for (let roll = 0; roll < 10; roll++) {
        const roamer = resolveRoamer(regionId, [], [], new Set(), 1, null, 12)
        if (roamer) assert.notEqual(roamer.speciesKey, quest.legendary)
      }
    }
  } finally {
    Math.random = originalRandom
  }
})
