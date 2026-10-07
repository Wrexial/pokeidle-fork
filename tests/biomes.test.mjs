import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { BIOME_FILTERS, BIOME_SCENE_IMAGES, biomeBackgroundFor, biomeForLocation } = await import('../src/data/ui.js')
const { deriveBiome } = createRequire(import.meta.url)('../tools/lib/biomes.cjs')
const { mapData } = await import('../src/data/gameData.js')

test('biomeForLocation picks a tint from the name and background', () => {
  assert.equal(biomeForLocation({ name: 'Glimwood Tangle' }), 'forest')
  assert.equal(biomeForLocation({ name: 'Galar Mine' }), 'cave')
  assert.equal(biomeForLocation({ name: 'Snowslide Slope' }), 'tundra')
  assert.equal(
    biomeForLocation({ name: 'Route 5', background: '/backgrounds/beach.webp' }),
    'coast'
  )
  assert.equal(
    biomeForLocation({ name: 'Route 1', background: '/backgrounds/grassland.webp' }),
    'grassland'
  )
  assert.equal(biomeForLocation(undefined), 'grassland')
})

test('biomeForLocation prefers a declared biome over its heuristics', () => {
  assert.equal(
    biomeForLocation({ name: 'Route 111', background: '/backgrounds/grassland.webp', biome: 'desert' }),
    'desert'
  )
  // An unknown biome is ignored so old data still renders.
  assert.equal(biomeForLocation({ name: 'Route 1', biome: 'nonsense' }), 'grassland')
})

test('biomeForLocation no longer mistakes "fall" for autumn', () => {
  assert.equal(biomeForLocation({ name: 'Tohjo Falls' }), 'coast')
  assert.equal(biomeForLocation({ name: 'Fallarbor Town' }), 'grassland')
  assert.equal(biomeForLocation({ name: 'Volcano Route' }), 'volcanic')
})

test('dedicated biome scenes take over once the art is installed', () => {
  const scenes = { forest: '/backgrounds/forest.webp' }
  assert.deepEqual(biomeBackgroundFor({ name: 'Glimwood Tangle' }, scenes), {
    image: '/backgrounds/forest.webp',
    biome: 'forest',
  })
  assert.deepEqual(biomeBackgroundFor({ name: 'Glimwood Tangle' }), {
    image: '/backgrounds/forest.webp',
    biome: 'forest',
  })
  assert.equal(
    biomeBackgroundFor({ name: 'Route 1' }, scenes),
    null,
    'grassland has no dedicated scene'
  )
})

test('every installed biome scene has a filter fallback and a background path', () => {
  for (const [biome, image] of Object.entries(BIOME_SCENE_IMAGES)) {
    assert.equal(typeof BIOME_FILTERS[biome], 'string', `${biome} needs a filter fallback`)
    assert.match(image, /^\/backgrounds\/.+\.(png|jpe?g|webp)$/)
  }
})

test('every biome has a filter value', () => {
  for (const value of Object.values(BIOME_FILTERS)) assert.equal(typeof value, 'string')
})

test('every committed location biome is a known filter key', () => {
  for (const location of Object.values(mapData)) {
    assert.ok(
      Object.hasOwn(BIOME_FILTERS, location.biome),
      `${location.id ?? location.name} has biome ${location.biome}`
    )
  }
})

test('deriveBiome reads the wild table when the name gives nothing away', () => {
  const species = {
    geodude: { types: ['Rock', 'Ground'] },
    sandshrew: { types: ['Ground'] },
    magikarp: { types: ['Water'] },
    goldeen: { types: ['Water'] },
    oddish: { types: ['Grass', 'Poison'] },
    caterpie: { types: ['Bug'] },
  }
  const enc = (key, weight) => ({ speciesKey: key, weight })
  // A desert route with a fishing pond still reads as desert, not coast.
  assert.equal(
    deriveBiome(
      { id: 'hoenn-route-999', name: 'Route 999' },
      [enc('geodude', 50), enc('sandshrew', 40), enc('magikarp', 30), enc('goldeen', 20)],
      species
    ),
    'desert'
  )
  // Bug/Grass dominant -> forest.
  assert.equal(
    deriveBiome({ id: 'x', name: 'Route X' }, [enc('caterpie', 40), enc('oddish', 30)], species),
    'forest'
  )
  // A curated override wins over the table (Hoenn's sea routes).
  assert.equal(
    deriveBiome({ id: 'hoenn-route-124', name: 'Route 124' }, [enc('oddish', 50)], species),
    'coast'
  )
  // Name keywords are checked before types.
  assert.equal(
    deriveBiome({ id: 'x', name: 'Snowpoint Temple' }, [enc('caterpie', 50)], species),
    'tundra'
  )
  // No signal at all falls back to the base background.
  assert.equal(deriveBiome({ id: 'x', name: 'Route 1', background: '/backgrounds/beach.webp' }, [], species), 'coast')
})
