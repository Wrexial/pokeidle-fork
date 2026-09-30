import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  buildWildPool,
  collectProtectedSpecies,
  enrichEncounters,
  VARIETY_FLAG,
  MIN_ROUTE_SPECIES,
} = require('../tools/lib/route-variety.cjs')

const levels = { minLevel: {}, preEvolutionOf: {} }

const speciesByKey = {
  pidgey: { id: 16, types: ['Normal', 'Flying'], baseStats: {} },
  rattata: { id: 19, types: ['Normal'], baseStats: {} },
  caterpie: { id: 10, types: ['Bug'], baseStats: {} },
}

test('buildWildPool ignores entries a previous run added', () => {
  const buckets = {
    routeA: {
      encounters: [
        { speciesKey: 'pidgey', minLevel: 3, maxLevel: 5 },
        { speciesKey: 'rattata', minLevel: 10, maxLevel: 12, [VARIETY_FLAG]: true },
      ],
    },
  }
  const mapData = { routeA: { type: 'route' } }
  const pool = buildWildPool(buckets, mapData)
  assert.deepEqual([...pool.keys()], ['pidgey'])
})

test('enrichEncounters tops a route up to the target and is idempotent', () => {
  const encounters = [{ speciesKey: 'pidgey', weight: 20, minLevel: 3, maxLevel: 5 }]
  const pool = new Map([
    ['rattata', { minLevel: 3, maxLevel: 5 }],
    ['caterpie', { minLevel: 3, maxLevel: 5 }],
  ])
  const first = enrichEncounters(encounters, pool, speciesByKey, levels, { target: 3 })
  assert.equal(first.encounters.length, 3)
  assert.deepEqual(first.added, ['rattata', 'caterpie'])
  assert.ok(
    first.encounters.filter((entry) => entry[VARIETY_FLAG]).length === 2,
    'added finds are flagged'
  )
  const second = enrichEncounters(first.encounters, pool, speciesByKey, levels, { target: 3 })
  assert.equal(second.added.length, 0)
  assert.equal(second.encounters, first.encounters)
})

test('enrichEncounters leaves a table already at the target untouched', () => {
  const encounters = [
    { speciesKey: 'pidgey', weight: 20, minLevel: 3, maxLevel: 5 },
    { speciesKey: 'rattata', weight: 20, minLevel: 3, maxLevel: 5 },
  ]
  const pool = new Map([['caterpie', { minLevel: 3, maxLevel: 5 }]])
  const result = enrichEncounters(encounters, pool, speciesByKey, levels, { target: 2 })
  assert.equal(result.encounters, encounters)
  assert.equal(result.added.length, 0)
})

test('collectProtectedSpecies covers starter lines, babies and route gates', () => {
  const protectedSpecies = collectProtectedSpecies(
    { bulbasaur: [{ into: 'ivysaur' }], ivysaur: [{ into: 'venusaur' }] },
    ['bulbasaur'],
    { routeA: { unlock: { caughtOnRoute: { species: ['pikachu'] } } } }
  )
  for (const key of ['bulbasaur', 'ivysaur', 'venusaur', 'pichu', 'pikachu'])
    assert.ok(protectedSpecies.has(key), `${key} is protected`)
})

test('the configured target is a sane size', () => {
  assert.ok(MIN_ROUTE_SPECIES >= 8)
})
