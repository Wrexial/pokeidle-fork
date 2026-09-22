import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { shouldOfferMasterBall } = await import('../src/game/catching.js')

test('the Master Ball is offered for legendaries even once caught', () => {
  assert.equal(shouldOfferMasterBall({ pokedexCaught: [] }, 'mewtwo'), true)
  assert.equal(shouldOfferMasterBall({ pokedexCaught: ['mewtwo'] }, 'mewtwo'), true)
})

test('a hard-to-catch new species is offered the Master Ball', () => {
  assert.equal(shouldOfferMasterBall({ pokedexCaught: [] }, 'snorlax'), true)
  assert.equal(shouldOfferMasterBall({ pokedexCaught: [] }, 'beldum'), true)
})

test('a hard-to-catch species already caught is not offered', () => {
  assert.equal(shouldOfferMasterBall({ pokedexCaught: ['snorlax'] }, 'snorlax'), false)
})

test('ordinary new species are not offered', () => {
  assert.equal(shouldOfferMasterBall({ pokedexCaught: [] }, 'caterpie'), false)
  assert.equal(shouldOfferMasterBall({ pokedexCaught: [] }, 'pidgey'), false)
})

test('an unknown species never offers the ball', () => {
  assert.equal(shouldOfferMasterBall({ pokedexCaught: [] }, 'notARealSpecies'), false)
})
