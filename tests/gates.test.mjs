import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { quickplayAll } = await import('../tools/lib/quickplay.mjs')
const { buildRouteExclusives } = await import('../tools/lib/gate-exclusives.mjs')
const { encounterData, evolutionData, mapData, pokemonSpecies } = await import('../src/data/gameData.js')
const { regionalStarters } = await import('../src/data/config.js')

test('every region is completable from a fresh save', () => {
  for (const result of quickplayAll()) {
    assert.equal(
      result.loop,
      undefined,
      `${result.regionId} quickplay did not reach a fixpoint`
    )
    assert.deepEqual(
      result.stuck.map((entry) => `${entry.id}: ${entry.reasons.join('; ')}`),
      [],
      `${result.regionId} has unreachable locations`
    )
  }
})

test('caughtOnRoute gates only ask for species still exclusive to their route', () => {
  const starterBaseKeys = [...new Set(Object.values(regionalStarters).flat())]
  const exclusiveByRoute = buildRouteExclusives({
    mapData,
    encounterData,
    species: pokemonSpecies,
    evolutionData,
    starterBaseKeys,
  })
  let checked = 0
  for (const [locationId, location] of Object.entries(mapData)) {
    const gate = location.unlock?.caughtOnRoute
    if (!gate) continue
    checked++
    const exclusives = (exclusiveByRoute[gate.routeKey] ?? []).map((entry) => entry.key)
    assert.ok(
      exclusives.length > 0,
      `${locationId} gates on ${gate.routeKey}, which has no exclusive species left`
    )
    assert.deepEqual(
      gate.species,
      exclusives,
      `${locationId} should list exactly ${gate.routeKey}'s current exclusives`
    )
    assert.ok(
      gate.count >= 1 && gate.count <= Math.min(3, exclusives.length),
      `${locationId} asks for ${gate.count} of ${exclusives.length} exclusives`
    )
  }
  assert.ok(checked > 0, 'there are caughtOnRoute gates to check')
})
