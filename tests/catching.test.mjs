import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { calculateCatchChance, getBallModifier, getDexStatus, isCaveLocation, isNightTime, isWaterLocation, selectBestBall, shouldForceCatch, shouldOfferMasterBall, HONEY_CATCH_BONUS } = await import(
  '../src/game/catching.js'
)
const { isHoneyActive } = await import('../src/game/progression.js')
const { initialGameState } = await import('../src/game/reducer.js')
const { autoCatchBallOrder } = await import('../src/data/items.js')

test('Honey makes the species it is applied to easier to catch', () => {
  const base = calculateCatchChance('bulbasaur', 'pokeball', {}),
    honied = calculateCatchChance('bulbasaur', 'pokeball', { honey: true })
  assert.ok(honied > base, 'the honied species has a higher catch chance')
  assert.equal(honied, Math.min(1, base * HONEY_CATCH_BONUS))
})

test('isHoneyActive only matches the honied species on its route', () => {
  const effects = [{ type: 'honey', routeKey: 'route1', speciesKey: 'pidgey' }]
  assert.equal(isHoneyActive(effects, 'route1', 'pidgey'), true)
  assert.equal(isHoneyActive(effects, 'route1', 'rattata'), false)
  assert.equal(isHoneyActive(effects, 'route2', 'pidgey'), false)
  assert.equal(isHoneyActive([], 'route1', 'pidgey'), false)
})

test('every auto-catch ball is enabled by default', () => {
  assert.deepEqual(initialGameState.globalCatchDefaults.enabledBalls, autoCatchBallOrder)
  assert.ok(autoCatchBallOrder.includes('pokeball'))
  assert.ok(autoCatchBallOrder.includes('ultraball'))
  assert.ok(
    !autoCatchBallOrder.includes('masterball'),
    'the Master Ball is thrown from its own button, not the auto-catcher'
  )
})

test('getDexStatus reports the strongest Pokedex state first', () => {
  const state = {
    pokedexSeen: ['pidgey', 'rattata'],
    pokedexCaught: ['rattata'],
    shinyCaught: ['pidgey'],
  }
  assert.equal(getDexStatus(state, 'pidgey'), 'shiny', 'a caught shiny beats a plain catch')
  assert.equal(getDexStatus(state, 'rattata'), 'caught')
  assert.equal(getDexStatus(state, 'caterpie'), null, 'an unregistered species has no badge')
  assert.equal(
    getDexStatus({ pokedexSeen: [], pokedexCaught: [], shinyCaught: [] }, 'pidgey'),
    null
  )
})

test('the Master Ball is offered for legendaries even once caught', () => {
  assert.equal(shouldOfferMasterBall({ pokedexCaught: [] }, 'mewtwo'), true)
  assert.equal(shouldOfferMasterBall({ pokedexCaught: ['mewtwo'] }, 'mewtwo'), true)
})

test('a one-off static is always thrown at, even if already registered', () => {
  const state = { alwaysCatchShinies: false }
  // The species could already sit in the Pokedex (a wild h-avalugg), so the
  // default pokedex_new rule would skip it; a static must still get a ball.
  assert.equal(shouldForceCatch(state, { staticId: 'static-hisui-avalugg' }), true)
  assert.equal(shouldForceCatch(state, {}), false)
  assert.equal(shouldForceCatch({ alwaysCatchShinies: true }, { isShiny: true }), true)
  assert.equal(shouldForceCatch({ alwaysCatchShinies: false }, { isShiny: true }), false)
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
  // The committed biome wins once apply-biomes.cjs has run, so a sea route with
  // a placeholder name still gets the Dive Ball bonus and a ruin counts as a
  // cave for the Dusk Ball.
  assert.equal(isWaterLocation({ name: 'Route 999', biome: 'coast' }), true)
  assert.equal(isWaterLocation({ name: 'Route 999', biome: 'forest' }), false)
  assert.equal(isCaveLocation({ name: 'Route 999', biome: 'cave' }), true)
  assert.equal(isCaveLocation({ name: 'Bell Tower', biome: 'ruins' }), true)
  assert.equal(isCaveLocation({ name: 'Route 999', biome: 'grassland' }), false)
  // isNightTime follows the game's 60-minute day/night cycle, not the wall
  // clock (see tests/day-night.test.mjs for the cycle itself).
  assert.equal(isNightTime(3_600_000 * 0.8), true)
  assert.equal(isNightTime(3_600_000 * 0.2), false)
})
