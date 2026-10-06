import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { baseSpeciesKey, mapData, pokedexData, raidPoolFor } = await import('../src/data/gameData.js')

// The Pokedex treats a Raid Island entry as "start a raid", so the species it
// links must be on that region's raid roster (otherwise the link would fall
// back to a random legendary).
test('every raid Pokedex link names a species on that region raid roster', () => {
  let checked = 0
  for (const [speciesKey, routes] of Object.entries(pokedexData)) {
    for (const route of routes) {
      const location = mapData[route.id]
      if (location?.type !== 'raid') continue
      checked++
      const pool = raidPoolFor(location.region ?? 'kanto').map((entry) => entry.speciesKey)
      assert.ok(
        pool.includes(speciesKey) || pool.includes(baseSpeciesKey(speciesKey)),
        `${speciesKey} on ${route.id} is in the ${location.region} raid pool`
      )
    }
  }
  assert.ok(checked > 0, 'there are raid links to check')
})
