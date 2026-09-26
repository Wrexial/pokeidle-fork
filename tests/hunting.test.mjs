import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { applyEncounterModifiers, resolveActiveModifiers, resolvePokemonEncounter } = await import(
  '../src/game/progression.js'
)
const { swarmBattleCount, swarmShinyMultiplier, swarmShinyOddsFloor } = await import(
  '../src/data/config.js'
)

/** Run `fn` with `Math.random` pinned to a constant, then restore it. */
function withRandom(/** @type {number} */ value, /** @type {() => any} */ fn) {
  const original = Math.random
  Math.random = () => value
  try {
    return fn()
  } finally {
    Math.random = original
  }
}

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

test('a swarm lasts 256 battles and boosts its species', () => {
  assert.equal(swarmBattleCount, 256)
  assert.equal(swarmShinyMultiplier, 4)
  assert.equal(swarmShinyOddsFloor, 256)
})

test('a swarm entry rolls shiny four times as often', () => {
  const base = { speciesKey: 'pidgey', weight: 100, minLevel: 2, maxLevel: 2 },
    swarm = { ...base, shinyMultiplier: 4, shinyOddsFloor: 256 },
    data = (/** @type {any} */ entry) => ({ name: 'Test Route', encounters: [entry] }),
    // 1/4096 is shiny under the swarm's boosted 1/1024 odds, but not under full 1/4096 odds.
    roll = 1 / 4096
  const plain = withRandom(roll, () =>
      resolvePokemonEncounter(data(base), [], new Set(), undefined, 1, false, 2)
    ),
    boosted = withRandom(roll, () =>
      resolvePokemonEncounter(data(swarm), [], new Set(), undefined, 1, false, 2)
    )
  assert.equal(plain.isShiny, false)
  assert.equal(boosted.isShiny, true)
})

test('a swarm never beats 1 in 256 shiny odds', () => {
  // A huge shiny bonus would normally push the odds far below the floor.
  const swarm = {
      speciesKey: 'pidgey',
      weight: 100,
      minLevel: 2,
      maxLevel: 2,
      shinyMultiplier: 4,
      shinyOddsFloor: 256,
    },
    // 0.05 is shiny at 1/8 odds but not at the 1/256 floor.
    result = withRandom(0.05, () =>
      resolvePokemonEncounter(
        { name: 'Test Route', encounters: [swarm] },
        [],
        new Set(),
        undefined,
        1000,
        false,
        2
      )
    )
  assert.equal(result.isShiny, false)
})
