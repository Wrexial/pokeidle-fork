import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { prepareNextBattle } = await import('../src/game/progression.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

/** @param {string} speciesKey @param {string} id @param {number} [currentHp] */
function member(speciesKey, id, currentHp) {
  const pokemon = createPokemon(speciesKey, 10, id)
  return currentHp === void 0 ? pokemon : { ...pokemon, currentHp }
}

test('Nuzlocke releases a fainted party Pokemon', () => {
  const alive = member('charmander', 'a'),
    fainted = member('rattata', 'b', 0),
    state = {
      ...initialGameState,
      challengeNuzlocke: true,
      party: [alive, fainted],
      playerPokemon: alive,
      activePlayerPokemonIndex: 0,
    },
    next = prepareNextBattle(state)
  assert.equal(
    next.party.some((entry) => entry.id === 'b'),
    false,
    'the fainted Pokemon is gone'
  )
  assert.equal(
    next.party.some((entry) => entry.id === 'a'),
    true,
    'the survivor stays'
  )
  assert.ok(next.battleLog.some((line) => line.includes('Nuzlocke')))
})

test('Nuzlocke never releases the last Pokemon', () => {
  const fainted = member('rattata', 'b', 0),
    state = {
      ...initialGameState,
      challengeNuzlocke: true,
      party: [fainted],
      playerPokemon: fainted,
      activePlayerPokemonIndex: 0,
    },
    next = prepareNextBattle(state)
  assert.equal(next.party.length, 1, 'a full wipe is not wiped from the save')
})

test('fainted Pokemon are kept when Nuzlocke is off', () => {
  const alive = member('charmander', 'a'),
    fainted = member('rattata', 'b', 0),
    state = {
      ...initialGameState,
      challengeNuzlocke: false,
      party: [alive, fainted],
      playerPokemon: alive,
      activePlayerPokemonIndex: 0,
    },
    next = prepareNextBattle(state)
  assert.equal(next.party.length, 2)
})

test('the Nuzlocke challenge toggle flips', () => {
  const next = gameReducer(
    { ...initialGameState, challengeNuzlocke: false },
    { type: 'TOGGLE_CHALLENGE_NUZLOCKE' }
  )
  assert.equal(next.challengeNuzlocke, true)
})
