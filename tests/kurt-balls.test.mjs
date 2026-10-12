import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { getBallModifier } = await import('../src/game/catching.js')
const { APRICORN_IDS, autoCatchBallOrder, ballOrder, consumableItems, pokeBalls } =
  await import('../src/data/items.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { KURT_CRAFT_BATTLES, queueKurtCraft, readyKurtCrafts, tickKurtCrafts } = await import(
  '../src/game/kurt.js'
)
const { GARDEN_BERRIES, isPlantableBerry } = await import('../src/game/garden.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')

test('the seven Apricorn Balls are real, auto-catchable balls', () => {
  assert.equal(APRICORN_IDS.length, 7)
  for (const apricornId of APRICORN_IDS) {
    const apricorn = consumableItems[apricornId]
    assert.ok(apricorn, `${apricornId} is a real item`)
    const ballId = /** @type {string} */ (apricorn.kurtBall)
    assert.ok(pokeBalls[ballId], `${ballId} exists`)
    assert.ok(ballOrder.includes(ballId), `${ballId} is in ballOrder`)
    assert.ok(autoCatchBallOrder.includes(ballId), `${ballId} is auto-catchable`)
  }
})

test('the Apricorn Balls apply their situational catch rates', () => {
  // Level Ball: the lower the foe's level vs the lead, the better.
  assert.equal(getBallModifier('levelball', { leadLevel: 80, level: 10 }), 8)
  assert.equal(getBallModifier('levelball', { leadLevel: 80, level: 30 }), 4)
  assert.equal(getBallModifier('levelball', { leadLevel: 80, level: 60 }), 2)
  assert.equal(getBallModifier('levelball', { leadLevel: 10, level: 60 }), 1)
  // Lure Ball: on a water route only.
  assert.equal(getBallModifier('lureball', { isWater: true }), 5)
  assert.equal(getBallModifier('lureball', {}), 1)
  // Heavy Ball: scales with the species' weight.
  assert.equal(getBallModifier('heavyball', { speciesKey: 'snorlax' }), 8)
  assert.equal(getBallModifier('heavyball', { speciesKey: 'wailord' }), 8)
  assert.equal(getBallModifier('heavyball', { speciesKey: 'pikachu' }), 0.5)
  // Love Ball: opposite gender.
  assert.equal(getBallModifier('loveball', { leadGender: 'male', enemyGender: 'female' }), 8)
  assert.equal(getBallModifier('loveball', { leadGender: 'male', enemyGender: 'male' }), 1)
  assert.equal(getBallModifier('loveball', { leadGender: 'genderless', enemyGender: 'female' }), 1)
  // Fast Ball: high base Speed.
  assert.equal(getBallModifier('fastball', { speciesKey: 'electrode' }), 4)
  assert.equal(getBallModifier('fastball', { speciesKey: 'snorlax' }), 1)
  // Moon Ball: a Moon Stone evolution.
  assert.equal(getBallModifier('moonball', { speciesKey: 'clefairy' }), 4)
  assert.equal(getBallModifier('moonball', { speciesKey: 'nidorino' }), 4)
  assert.equal(getBallModifier('moonball', { speciesKey: 'pikachu' }), 1)
})

test('Kurt queues an Apricorn, carves it over a few wins, then hands it over', () => {
  const base = { ...initialGameState, inventory: { apricornRed: 2 } },
    crafted = gameReducer(base, {
      type: 'CRAFT_APRICORN_BALL',
      payload: { apricornId: 'apricornRed' },
    })
  assert.equal(crafted.inventory.apricornRed, 1, 'the Apricorn is consumed')
  assert.equal(crafted.inventory.levelball, undefined, 'the ball is not instant')
  assert.equal(crafted.kurtCrafts.length, 1)
  assert.equal(crafted.kurtCrafts[0].battlesRemaining, KURT_CRAFT_BATTLES)

  // Collecting does nothing until he is done.
  assert.equal(gameReducer(crafted, { type: 'COLLECT_KURT_BALLS' }), crafted)
  // Ten wild wins finish the craft.
  let ticking = crafted
  for (let win = 0; win < KURT_CRAFT_BATTLES; win++)
    ticking = { ...ticking, kurtCrafts: tickKurtCrafts(ticking.kurtCrafts) }
  const collected = gameReducer(ticking, { type: 'COLLECT_KURT_BALLS' })
  assert.equal(collected.kurtCrafts.length, 0, 'the queue is emptied')
  assert.equal(collected.inventory.levelball, 1, 'the Level Ball is granted')

  // No Apricorn, no queue.
  const empty = gameReducer(
    { ...initialGameState, inventory: {} },
    { type: 'CRAFT_APRICORN_BALL', payload: { apricornId: 'apricornRed' } }
  )
  assert.equal(empty.kurtCrafts.length, 0)
  // An unknown Apricorn is a no-op.
  assert.equal(
    gameReducer(base, { type: 'CRAFT_APRICORN_BALL', payload: { apricornId: 'nope' } }),
    base
  )
  // Every colour maps to its ball.
  for (const apricornId of APRICORN_IDS) {
    const one = gameReducer(
        { ...initialGameState, inventory: { [apricornId]: 1 } },
        { type: 'CRAFT_APRICORN_BALL', payload: { apricornId } }
      ),
      ballId = /** @type {string} */ (consumableItems[apricornId].kurtBall)
    assert.equal(one.kurtCrafts[0].ballId, ballId, `${apricornId} -> ${ballId}`)
  }
})

test('the kurt craft queue helpers tick and report readiness', () => {
  assert.deepEqual(queueKurtCraft([], 'nope'), [])
  assert.deepEqual(queueKurtCraft(undefined, 'apricornRed'), [
    { apricornId: 'apricornRed', ballId: 'levelball', battlesRemaining: KURT_CRAFT_BATTLES },
  ])
  const pending = [{ apricornId: 'apricornRed', ballId: 'levelball', battlesRemaining: 1 }]
  assert.equal(tickKurtCrafts(pending)[0].battlesRemaining, 0)
  assert.equal(readyKurtCrafts(tickKurtCrafts(pending)).length, 1)
  assert.equal(readyKurtCrafts(pending).length, 0)
  // An already-finished craft doesn't tick below zero.
  const done = [{ apricornId: 'apricornRed', ballId: 'levelball', battlesRemaining: 0 }]
  assert.equal(tickKurtCrafts(done), done)
})

test('Apricorns can be grown in the Berry Garden', () => {
  for (const apricornId of APRICORN_IDS) {
    assert.ok(isPlantableBerry(apricornId), `${apricornId} is plantable`)
    assert.ok(GARDEN_BERRIES[apricornId].growBattles > 0)
  }
  const base = { ...initialGameState, inventory: { apricornRed: 1 } },
    planted = gameReducer(base, {
      type: 'PLANT_BERRY',
      payload: { plotIndex: 0, berryId: 'apricornRed' },
    })
  assert.equal(planted.garden.plots[0].berryId, 'apricornRed')
  assert.equal(planted.inventory.apricornRed, 0)
  const ripe = {
    ...planted,
    garden: { plots: [{ berryId: 'apricornRed', battlesRemaining: 0 }, null, null, null] },
  }
  const harvested = gameReducer(ripe, { type: 'HARVEST_BERRY', payload: { plotIndex: 0 } })
  assert.ok(harvested.inventory.apricornRed >= 2, 'the harvest pays a small crop')
})

test('repairSave sanitises the kurt craft queue', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'johto', speciesKey: 'chikorita' },
    }),
    repaired = repairSave(
      serializeSave({
        ...base,
        kurtCrafts: [
          { apricornId: 'apricornRed', ballId: 'levelball', battlesRemaining: 3 },
          { apricornId: 'nope', ballId: 'levelball', battlesRemaining: 2 },
          { apricornId: 'apricornBlue', battlesRemaining: -5 },
        ],
      })
    )
  assert.equal(repaired.kurtCrafts.length, 2, 'unknown Apricorns are dropped')
  assert.equal(repaired.kurtCrafts[0].ballId, 'levelball')
  assert.equal(repaired.kurtCrafts[1].battlesRemaining, 0, 'a negative count clamps to 0')
})

test('the Friend Ball sets a high friendship on catch', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    caught = gameReducer(
      { ...base, inventory: { friendball: 1 }, phase: 'battling' },
      {
        type: 'CATCH_POKEMON',
        payload: { speciesKey: 'pidgey', level: 5, pokeballUsed: 'friendball' },
      }
    ),
    newMember = caught.party.find((member) => member.speciesKey === 'pidgey')
  assert.ok(newMember, 'the Pokemon was caught')
  assert.equal(newMember.friendship, 200, 'the Friend Ball sets 200 friendship')
})
