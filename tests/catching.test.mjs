import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { calculateCatchChance, getBallModifier, isCaveLocation, isNightTime, isWaterLocation, selectBestBall, shouldOfferMasterBall } = await import(
  '../src/game/catching.js'
)

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

test('situational balls only boost in the right situation', () => {
  assert.equal(getBallModifier('quickball', { turn: 1 }), 5)
  assert.equal(getBallModifier('quickball', { turn: 2 }), 1)
  assert.equal(getBallModifier('repeatball', { alreadyCaught: true }), 3.5)
  assert.equal(getBallModifier('repeatball', { alreadyCaught: false }), 1)
  assert.equal(getBallModifier('netball', { types: ['Water'] }), 3.5)
  assert.equal(getBallModifier('netball', { types: ['Bug', 'Flying'] }), 3.5)
  assert.equal(getBallModifier('netball', { types: ['Normal'] }), 1)
  assert.equal(getBallModifier('diveball', { isWater: true }), 3.5)
  assert.equal(getBallModifier('diveball', { isWater: false }), 1)
  assert.equal(getBallModifier('duskball', { isCave: true }), 3)
  assert.equal(getBallModifier('duskball', { isNight: true }), 3)
  assert.equal(getBallModifier('duskball', {}), 1)
  assert.equal(getBallModifier('pokeball', {}), 1)
})

test('Timer Ball scales with the battle length', () => {
  assert.equal(getBallModifier('timerball', { turn: 1 }), 1)
  assert.ok(getBallModifier('timerball', { turn: 11 }) > getBallModifier('timerball', { turn: 4 }))
  assert.equal(getBallModifier('timerball', { turn: 999 }), 4)
})

test('Nest Ball favours lower-level targets', () => {
  assert.ok(getBallModifier('nestball', { level: 5 }) > getBallModifier('nestball', { level: 30 }))
  assert.equal(getBallModifier('nestball', { level: 60 }), 1)
})

test('a situational ball can beat a stronger flat ball', () => {
  const best = selectBestBall(
    'mewtwo',
    ['pokeball', 'quickball', 'ultraball'],
    { pokeball: 1, quickball: 1, ultraball: 1 },
    { turn: 1 }
  )
  assert.equal(best, 'quickball')
})

test('calculateCatchChance uses the situational modifier', () => {
  const normal = calculateCatchChance('mewtwo', 'pokeball', {}),
    quick = calculateCatchChance('mewtwo', 'quickball', { turn: 1 })
  assert.ok(quick > normal)
})

test('location helpers classify water, caves and night', () => {
  assert.equal(isWaterLocation({ name: 'Route 21', description: 'A sea route back to Pallet Town.' }), true)
  assert.equal(isWaterLocation({ name: 'Route 1', description: 'A grassy path.' }), false)
  assert.equal(isCaveLocation({ name: 'Mt. Moon', description: 'A cave through the mountain.' }), true)
  assert.equal(isCaveLocation({ name: 'Route 2', description: 'A path.' }), false)
  assert.equal(isNightTime(new Date(2024, 0, 1, 22, 0)), true)
  assert.equal(isNightTime(new Date(2024, 0, 1, 12, 0)), false)
})
