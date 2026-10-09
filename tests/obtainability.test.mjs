// Obtainability sources beyond wild encounters: gifts, minigames and breeding.
// Locks in that the species we deliberately keep out of the wild tables (the
// babies and the gift / Game Corner lines) still have a real source.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { evolutionData, encounterData } = await import('../src/data/gameData.js')
const { GIFTS } = await import('../src/game/gifts.js')
const { eggSpeciesKey } = await import('../src/game/breeding.js')
const { GAME_CORNER_PRIZE_POOL } = await import('../src/game/minigames/game-corner.js')
const { regionalStarters } = await import('../src/data/config.js')
const { speciesSources } = await import('../src/game/pokedex-sources.js')

/** Every species that appears in a wild encounter table. */
function wildSpecies() {
  const wild = new Set()
  for (const bucket of Object.values(encounterData))
    for (const encounter of bucket.encounters ?? []) wild.add(encounter.speciesKey)
  return wild
}

/** Species handed over by a gift, directly or as a regional starter. */
function giftSpecies() {
  const gifted = new Set()
  for (const gift of GIFTS) {
    if (gift.pokemon) gifted.add(gift.pokemon.speciesKey)
    if (gift.egg) gifted.add(gift.egg.speciesKey)
    if (gift.randomStarter)
      for (const key of regionalStarters[gift.randomStarter] ?? []) gifted.add(key)
  }
  return gifted
}

/** Grow a source set along evolutions (breeding only ever reaches back to a root). */
function evolveForward(sources) {
  let changed = true
  while (changed) {
    changed = false
    for (const key of [...sources])
      for (const evolution of evolutionData[key] ?? [])
        if (!sources.has(evolution.into)) (sources.add(evolution.into), (changed = true))
  }
  return sources
}

test('gift-exclusive lines stay out of the wild and come from a gift', () => {
  const wild = wildSpecies(),
    gifted = giftSpecies()
  // The Togepi egg (Mr. Pokemon) and Steven's Beldum are their lines' source.
  for (const speciesKey of ['togepi', 'beldum']) {
    assert.ok(gifted.has(speciesKey), `${speciesKey} is handed over by a gift`)
    assert.ok(!wild.has(speciesKey), `${speciesKey} is not a wild encounter`)
  }
})

test('Game Corner-exclusive lines come from the prize track', () => {
  const prizes = new Set(GAME_CORNER_PRIZE_POOL.map((prize) => prize.speciesKey))
  // Porygon has no wild table of its own, so the prize track is its source.
  assert.ok(prizes.has('porygon'), 'porygon is a Game Corner prize')
  assert.ok(!wildSpecies().has('porygon'), 'porygon is not a wild encounter')
  // Scyther and Dratini are also prizes, though the Safari Zone can also yield them.
  for (const speciesKey of ['scyther', 'dratini']) assert.ok(prizes.has(speciesKey))
})

test('the Pokedex labels each non-wild source', () => {
  // Game Corner prize track.
  assert.deepEqual(speciesSources('porygon'), ['Game Corner'])
  assert.deepEqual(speciesSources('scyther'), ['Game Corner'])
  // Fossil revives at Cinnabar Island.
  assert.deepEqual(speciesSources('omanyte'), ['Fossil revive'])
  assert.deepEqual(speciesSources('aerodactyl'), ['Fossil revive'])
  // The Ruins of Alph puzzle hands out the whole Unown set.
  assert.deepEqual(speciesSources('unown'), ['Ruins of Alph puzzle'])
  assert.deepEqual(speciesSources('unown-question'), ['Ruins of Alph puzzle'])
  // A plain wild species has no extra source line.
  assert.deepEqual(speciesSources('bulbasaur'), [])
})

test('baby lines are bred from an obtainable evolved parent', () => {
  // Each baby kept out of the wild tables must be reachable by breeding a
  // parent that is wild, gifted or evolved from one.
  const wild = wildSpecies(),
    sources = evolveForward(new Set([...wild, ...giftSpecies()])),
    babies = ['togepi', 'cleffa', 'smoochum', 'magby']
  for (const baby of babies) {
    assert.ok(!wild.has(baby), `${baby} is not a wild encounter`)
    const parent = evolutionData[baby]?.[0]?.into
    assert.ok(parent, `${baby} has an evolved parent`)
    assert.ok(sources.has(parent), `${baby}'s parent ${parent} is obtainable`)
    assert.equal(
      eggSpeciesKey([{ speciesKey: 'ditto', id: '1' }, { speciesKey: parent, id: '2' }]),
      baby,
      `breeding ${parent} hatches ${baby}`
    )
  }
})
