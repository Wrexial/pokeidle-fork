import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { advanceShinyTarget, resolvePokemonEncounter, SHINY_CHAIN_FIRST_TARGET } = await import(
  '../src/game/progression.js'
)
const { encounterData } = await import('../src/data/gameData.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

test('a full radar chain forces the chained species shiny', () => {
  const bucket = encounterData.route1,
    speciesKey = bucket.encounters[0].speciesKey,
    chain = { speciesKey, count: SHINY_CHAIN_FIRST_TARGET, target: SHINY_CHAIN_FIRST_TARGET },
    originalRandom = Math.random
  try {
    Math.random = () => 0 // rolls the first pool entry
    const encounter = resolvePokemonEncounter(bucket, [], new Set(), chain)
    assert.equal(encounter.speciesKey, speciesKey)
    assert.equal(encounter.isShiny, true, 'the guaranteed shiny fires at the target')
  } finally {
    Math.random = originalRandom
  }
})

test('an unfinished chain does not force a shiny', () => {
  const bucket = encounterData.route1,
    speciesKey = bucket.encounters[0].speciesKey,
    chain = { speciesKey, count: SHINY_CHAIN_FIRST_TARGET - 1, target: SHINY_CHAIN_FIRST_TARGET },
    originalRandom = Math.random
  try {
    // 0.99 both rolls the last pool entry and fails any shiny check.
    Math.random = () => 0.99
    const encounter = resolvePokemonEncounter(bucket, [], new Set(), chain)
    assert.equal(encounter.isShiny, false)
  } finally {
    Math.random = originalRandom
  }
})

test('resolving the chained shiny resets the chain and raises the target', () => {
  const chain = { speciesKey: 'pidgey', count: 5, target: 5 },
    resolved = advanceShinyTarget(chain, { speciesKey: 'pidgey', isShiny: true })
  assert.equal(resolved.count, 0)
  assert.equal(resolved.target, 10)
  // A non-shiny or a different species leaves the chain where it is.
  assert.equal(advanceShinyTarget(chain, { speciesKey: 'pidgey', isShiny: false }).count, 5)
  assert.equal(advanceShinyTarget(chain, { speciesKey: 'rattata', isShiny: true }).count, 5)
})

test('catching a chained shiny resets the radar chain', () => {
  const state = {
      ...initialGameState,
      shinyChain: { speciesKey: 'pidgey', count: 5, target: 5 },
      enemyPokemon: { speciesKey: 'pidgey', isShiny: true },
    },
    caught = gameReducer(state, {
      type: 'CATCH_POKEMON',
      payload: { speciesKey: 'pidgey', level: 5 },
    })
  assert.equal(caught.shinyChain.count, 0)
  assert.equal(caught.shinyChain.target, 10)
})
