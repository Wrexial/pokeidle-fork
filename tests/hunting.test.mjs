import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { applyEncounterModifiers, resolveActiveModifiers, resolvePokemonEncounter } = await import(
  '../src/game/progression.js'
)

const ROUTE = 'routeTest',
  CHAIN = { speciesKey: 'pidgey', count: 5 },
  encounters = [
    { speciesKey: 'pidgey', weight: 100, minLevel: 2, maxLevel: 4 },
    { speciesKey: 'rattata', weight: 100, minLevel: 2, maxLevel: 4 },
    { speciesKey: 'caterpie', weight: 100, minLevel: 2, maxLevel: 4 },
  ],
  weightOf = (/** @type {{ speciesKey: string, weight: number }[]} */ list, /** @type {string} */ key) =>
    list.find((encounter) => encounter.speciesKey === key)?.weight

const effect = (/** @type {string} */ type, /** @type {string} */ speciesKey) => ({
  type,
  routeKey: ROUTE,
  speciesKey,
  battlesRemaining: 10,
})

test('encounter weights are untouched without modifiers', () => {
  assert.deepEqual(applyEncounterModifiers(encounters, [], CHAIN), encounters)
})

test('Honey doubles its target before a chain locks in', () => {
  const modifiers = resolveActiveModifiers([effect('honey', 'pidgey')], ROUTE, {
      speciesKey: 'rattata',
      count: 1,
    }),
    weighted = applyEncounterModifiers(encounters, modifiers, { speciesKey: 'rattata', count: 1 })
  assert.equal(weightOf(weighted, 'pidgey'), 200)
  assert.equal(weightOf(weighted, 'rattata'), 100)
})

test('Honey strongly boosts the hunted species once the chain is locked in', () => {
  const modifiers = resolveActiveModifiers([effect('honey', 'pidgey')], ROUTE, CHAIN),
    weighted = applyEncounterModifiers(encounters, modifiers, CHAIN)
  assert.ok(weightOf(weighted, 'pidgey') >= 2500, 'locked honey should be a big boost')
  assert.equal(weightOf(weighted, 'rattata'), 100)
})

test('Repel halves a species before a chain locks in', () => {
  const modifiers = resolveActiveModifiers([effect('repel', 'rattata')], ROUTE, {
      speciesKey: 'pidgey',
      count: 1,
    }),
    weighted = applyEncounterModifiers(encounters, modifiers, { speciesKey: 'pidgey', count: 1 })
  assert.equal(weightOf(weighted, 'rattata'), 50)
})

test('a locked-in Repel suppresses every species except the hunted one', () => {
  const modifiers = resolveActiveModifiers([effect('repel', 'pidgey')], ROUTE, CHAIN),
    weighted = applyEncounterModifiers(encounters, modifiers, CHAIN),
    target = weightOf(weighted, 'pidgey') ?? 0,
    other = weightOf(weighted, 'rattata') ?? 0
  assert.equal(target, 100, 'the hunted species keeps its full weight')
  assert.ok(other < target / 10, 'other species are pushed away')
})

test('Honey + Repel make a locked hunt overwhelmingly likely', () => {
  const modifiers = resolveActiveModifiers(
      [effect('honey', 'pidgey'), effect('repel', 'pidgey')],
      ROUTE,
      CHAIN
    ),
    data = { name: 'Test Route', encounters },
    completed = new Set(),
    targetKey = 'pidgey'
  let hits = 0
  for (let roll = 0; roll < 200; roll++) {
    const result = resolvePokemonEncounter(data, modifiers, completed, CHAIN)
    if (result.speciesKey === targetKey) hits++
  }
  assert.ok(hits > 180, `expected the target almost every time, got ${hits}/200`)
})
