import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { getBallModifier } = await import('../src/game/catching.js')
const { APRICORN_IDS, autoCatchBallOrder, ballOrder, consumableItems, pokeBalls } =
  await import('../src/data/items.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

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

test('Kurt carves an Apricorn into its ball', () => {
  const base = { ...initialGameState, inventory: { apricornRed: 2 } },
    crafted = gameReducer(base, {
      type: 'CRAFT_APRICORN_BALL',
      payload: { apricornId: 'apricornRed' },
    })
  assert.equal(crafted.inventory.apricornRed, 1, 'the Apricorn is consumed')
  assert.equal(crafted.inventory.levelball, 1, 'the Level Ball is granted')

  // No Apricorn, no ball.
  const empty = gameReducer(
    { ...initialGameState, inventory: {} },
    { type: 'CRAFT_APRICORN_BALL', payload: { apricornId: 'apricornRed' } }
  )
  assert.equal(empty.inventory.levelball, undefined)
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
    assert.equal(one.inventory[ballId], 1, `${apricornId} -> ${ballId}`)
  }
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
