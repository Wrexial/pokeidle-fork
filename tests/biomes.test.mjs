import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { BIOME_FILTERS, biomeForLocation } = await import('../src/data/ui.js')

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

test('every biome has a filter value', () => {
  for (const value of Object.values(BIOME_FILTERS)) assert.equal(typeof value, 'string')
})
