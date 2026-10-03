import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { BIOME_FILTERS, BIOME_SCENE_IMAGES, biomeBackgroundFor, biomeForLocation } = await import('../src/data/ui.js')

test('biomeForLocation picks a tint from the name and background', () => {
  assert.equal(biomeForLocation({ name: 'Glimwood Tangle' }), 'forest')
  assert.equal(biomeForLocation({ name: 'Galar Mine' }), 'cave')
  assert.equal(biomeForLocation({ name: 'Snowslide Slope' }), 'tundra')
  assert.equal(
    biomeForLocation({ name: 'Route 5', background: '/backgrounds/beach.png' }),
    'coast'
  )
  assert.equal(
    biomeForLocation({ name: 'Route 1', background: '/backgrounds/grassland.png' }),
    'grassland'
  )
  assert.equal(biomeForLocation(undefined), 'grassland')
})

test('biomeForLocation no longer mistakes "fall" for autumn', () => {
  assert.equal(biomeForLocation({ name: 'Tohjo Falls' }), 'coast')
  assert.equal(biomeForLocation({ name: 'Fallarbor Town' }), 'grassland')
  assert.equal(biomeForLocation({ name: 'Volcano Route' }), 'volcanic')
})

test('dedicated biome scenes take over once the art is installed', () => {
  const scenes = { forest: '/backgrounds/forest.png' }
  assert.deepEqual(biomeBackgroundFor({ name: 'Glimwood Tangle' }, scenes), {
    image: '/backgrounds/forest.png',
    biome: 'forest',
  })
  assert.equal(
    biomeBackgroundFor({ name: 'Glimwood Tangle' }),
    null,
    'no painted forest scene installed yet'
  )
  assert.equal(
    biomeBackgroundFor({ name: 'Route 1' }, scenes),
    null,
    'grassland has no dedicated scene'
  )
})

test('every installed biome scene has a filter fallback and a background path', () => {
  for (const [biome, image] of Object.entries(BIOME_SCENE_IMAGES)) {
    assert.equal(typeof BIOME_FILTERS[biome], 'string', `${biome} needs a filter fallback`)
    assert.match(image, /^\/backgrounds\/.+\.png$/)
  }
})

test('every biome has a filter value', () => {
  for (const value of Object.values(BIOME_FILTERS)) assert.equal(typeof value, 'string')
})
