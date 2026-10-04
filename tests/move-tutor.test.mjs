import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { createPokemon, getFamilyLearnset, getTutorMoves, isTutorMove } = await import(
  '../src/game/pokemon.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { tmItemId } = await import('../src/data/tms.js')
const { tmTeachCost } = await import('../src/data/config.js')

test('tutor moves are TM moves outside the level-up learnset', () => {
  const tutorMoves = getTutorMoves('pikachu'),
    familyMoves = new Set(getFamilyLearnset('pikachu', 1000).map((entry) => entry.moveId))
  assert.ok(tutorMoves.length > 0, 'Pikachu has TM moves')
  for (const moveId of tutorMoves) {
    assert.ok(!familyMoves.has(moveId), `${moveId} should not be a level-up move`)
    assert.equal(isTutorMove('pikachu', moveId), true)
  }
  const levelMove = [...familyMoves][0]
  assert.equal(isTutorMove('pikachu', levelMove), false)
})

test('the Move Tutor refuses a TM the player has not found', () => {
  const pokemon = createPokemon('pikachu', 50, 'a'),
    tutorMove = getTutorMoves('pikachu')[0],
    state = {
      ...initialGameState,
      party: [pokemon],
      playerPokemon: pokemon,
      inventory: {},
      money: 100000,
    },
    next = gameReducer(state, {
      type: 'SET_MOVES',
      payload: { pokemonId: 'a', moves: [tutorMove] },
    })
  assert.deepEqual(next.party[0].moves, pokemon.moves, 'the change was rejected')
  assert.equal(next.money, 100000)
})

test('an owned TM teaches its move for the TM fee', () => {
  const pokemon = createPokemon('pikachu', 50, 'a'),
    tutorMove = getTutorMoves('pikachu')[0],
    state = {
      ...initialGameState,
      party: [pokemon],
      playerPokemon: pokemon,
      inventory: { [tmItemId(tutorMove)]: 1 },
      money: tmTeachCost * 2,
    },
    next = gameReducer(state, {
      type: 'SET_MOVES',
      payload: { pokemonId: 'a', moves: [tutorMove] },
    })
  assert.deepEqual(next.party[0].moves, [tutorMove])
  assert.equal(next.money, tmTeachCost, 'the TM fee was charged')
  assert.equal(next.inventory[tmItemId(tutorMove)], 1, 'TMs are reusable')
})

test('the Move Tutor refuses when you cannot afford the TM fee', () => {
  const pokemon = createPokemon('pikachu', 50, 'a'),
    tutorMove = getTutorMoves('pikachu')[0],
    state = {
      ...initialGameState,
      party: [pokemon],
      playerPokemon: pokemon,
      inventory: { [tmItemId(tutorMove)]: 1 },
      money: tmTeachCost - 1,
    },
    next = gameReducer(state, {
      type: 'SET_MOVES',
      payload: { pokemonId: 'a', moves: [tutorMove] },
    })
  assert.deepEqual(next.party[0].moves, pokemon.moves, 'the change was rejected')
  assert.equal(next.money, tmTeachCost - 1)
})

test('re-learning a level-up move is free', () => {
  const pokemon = createPokemon('pikachu', 50, 'a'),
    levelMove = getFamilyLearnset('pikachu', 50)[0].moveId,
    state = {
      ...initialGameState,
      party: [pokemon],
      playerPokemon: pokemon,
      money: 1000,
    },
    next = gameReducer(state, {
      type: 'SET_MOVES',
      payload: { pokemonId: 'a', moves: [levelMove] },
    })
  assert.equal(next.money, 1000)
  assert.deepEqual(next.party[0].moves, [levelMove])
})

test('an inherited egg move is free to re-learn without its TM', () => {
  // Charm is both a TM and a Bulbasaur egg move; the egg move wins.
  const pokemon = {
      ...createPokemon('bulbasaur', 20, 'a'),
      moves: ['tackle'],
      eggMoves: ['charm'],
    },
    state = {
      ...initialGameState,
      party: [pokemon],
      playerPokemon: pokemon,
      inventory: {},
      money: 0,
    },
    next = gameReducer(state, {
      type: 'SET_MOVES',
      payload: { pokemonId: 'a', moves: ['tackle', 'charm'] },
    })
  assert.ok(next.party[0].moves.includes('charm'))
  assert.equal(next.money, 0, 'an egg move does not charge the TM fee')
})
