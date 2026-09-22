import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { createPokemon, getFamilyLearnset, getTutorMoves, isTutorMove } = await import(
  '../src/game/pokemon.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { tutorMoveCost } = await import('../src/data/config.js')

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

test('the Move Tutor charges for a newly taught TM move', () => {
  const pokemon = createPokemon('pikachu', 50, 'a'),
    tutorMove = getTutorMoves('pikachu')[0],
    state = {
      ...initialGameState,
      party: [pokemon],
      playerPokemon: pokemon,
      money: tutorMoveCost * 2,
    },
    next = gameReducer(state, {
      type: 'SET_MOVES',
      payload: { pokemonId: 'a', moves: [tutorMove] },
    })
  assert.equal(next.money, tutorMoveCost, 'one move was charged')
  assert.deepEqual(next.party[0].moves, [tutorMove])
})

test('the Move Tutor refuses when you cannot afford it', () => {
  const pokemon = createPokemon('pikachu', 50, 'a'),
    tutorMove = getTutorMoves('pikachu')[0],
    state = {
      ...initialGameState,
      party: [pokemon],
      playerPokemon: pokemon,
      money: tutorMoveCost - 1,
    },
    next = gameReducer(state, {
      type: 'SET_MOVES',
      payload: { pokemonId: 'a', moves: [tutorMove] },
    })
  assert.deepEqual(next.party[0].moves, pokemon.moves, 'the change was rejected')
  assert.equal(next.money, tutorMoveCost - 1)
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
