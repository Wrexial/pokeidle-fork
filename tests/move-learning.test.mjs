import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { applyMoveLearning, createPokemon, getFamilyLearnset, getTutorMoves } = await import(
  '../src/game/pokemon.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

const tutorMoves = getTutorMoves('pikachu'),
  levelMoves = getFamilyLearnset('pikachu', 50).map((entry) => entry.moveId)

test('a free moveset takes the new moves in order', () => {
  const { moves, learned, forgotten, pending } = applyMoveLearning('pikachu', [], [
    levelMoves[0],
    levelMoves[1],
  ])
  assert.deepEqual(moves, [levelMoves[0], levelMoves[1]])
  assert.deepEqual(learned, [levelMoves[0], levelMoves[1]])
  assert.deepEqual(forgotten, [])
  assert.deepEqual(pending, [])
})

test('a full moveset forgets the oldest level-up move', () => {
  const start = [levelMoves[0], levelMoves[1], levelMoves[2], levelMoves[3]],
    { moves, forgotten } = applyMoveLearning('pikachu', start, [levelMoves[4]])
  assert.deepEqual(moves, [levelMoves[4], levelMoves[1], levelMoves[2], levelMoves[3]])
  assert.deepEqual(forgotten, [levelMoves[0]])
})

test('a TM move is never the one forgotten', () => {
  const tmMove = tutorMoves[0],
    start = [tmMove, levelMoves[0], levelMoves[1], levelMoves[2]],
    { moves, forgotten, pending } = applyMoveLearning('pikachu', start, [levelMoves[3]])
  assert.equal(moves.includes(tmMove), true, 'the TM survives')
  assert.deepEqual(forgotten, [levelMoves[0]])
  assert.deepEqual(pending, [])
})

test('a moveset of only TMs leaves the new move pending', () => {
  if (tutorMoves.length < 4) return
  const allTms = tutorMoves.slice(0, 4),
    { moves, pending } = applyMoveLearning('pikachu', allTms, [levelMoves[0]])
  assert.deepEqual(moves, allTms, 'nothing was forgotten')
  assert.deepEqual(pending, [levelMoves[0]])
})

test('a move learned in the same batch is not immediately forgotten', () => {
  const { moves, learned, pending } = applyMoveLearning(
    'pikachu',
    [tutorMoves[0], tutorMoves[1], tutorMoves[2]],
    [levelMoves[0], levelMoves[1]]
  )
  assert.deepEqual(moves, [tutorMoves[0], tutorMoves[1], tutorMoves[2], levelMoves[0]])
  assert.deepEqual(learned, [levelMoves[0]])
  assert.deepEqual(pending, [levelMoves[1]])
})

test('APPLY_EXP keeps a taught TM when a level-up move fills the set', () => {
  const tmMove = tutorMoves[0],
    pokemon = {
      ...createPokemon('pikachu', 50, 'a'),
      moves: [tmMove, levelMoves[0], levelMoves[1], levelMoves[2]],
    },
    next = gameReducer(
      { ...initialGameState, playerPokemon: pokemon, party: [pokemon] },
      { type: 'APPLY_EXP', payload: { expGained: 100, newMoves: [levelMoves[3]] } }
    )
  assert.equal(next.playerPokemon.moves.includes(tmMove), true, 'the TM was kept')
  assert.equal(next.playerPokemon.moves.includes(levelMoves[3]), true, 'the new move was learned')
  assert.equal(next.playerPokemon.moves.includes(levelMoves[0]), false, 'the oldest level move made room')
})

test('an inherited egg move is never forgotten', () => {
  const bulbasaurLevelMoves = getFamilyLearnset('bulbasaur', 50).map((entry) => entry.moveId),
    { moves, forgotten } = applyMoveLearning(
      'bulbasaur',
      ['charm', bulbasaurLevelMoves[0], bulbasaurLevelMoves[1], bulbasaurLevelMoves[2]],
      [bulbasaurLevelMoves[3]],
      ['charm']
    )
  assert.equal(moves.includes('charm'), true, 'the egg move was kept')
  assert.deepEqual(forgotten, [bulbasaurLevelMoves[0]])
})
