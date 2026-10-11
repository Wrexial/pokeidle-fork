import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  ALPHA_SIZE,
  SIZE_RATINGS,
  isAlphaPokemon,
  rollSize,
  sizeRating,
  sizeTooltip,
} = await import('../src/game/pokemon.js')
const { createPokemon, generateIVs } = await import('../src/game/pokemon.js')
const { repairSave } = await import('../src/game/save.js')

test('rollSize stays in range and follows the rng', () => {
  assert.equal(rollSize(() => 0), 0)
  assert.equal(rollSize(() => 1), 255)
  assert.equal(rollSize(() => 0.5), 128, 'the middle of the bell')
  for (let roll = 0; roll < 500; roll++) {
    const size = rollSize()
    assert.ok(size >= 0 && size <= 255, `${size} is in 0..255`)
    assert.ok(Number.isInteger(size))
  }
})

test('sizeRating splits 0-255 into five ratings', () => {
  assert.deepEqual(SIZE_RATINGS, ['XS', 'S', 'M', 'L', 'XL'])
  assert.equal(sizeRating(0), 'XS')
  assert.equal(sizeRating(50), 'XS')
  assert.equal(sizeRating(51), 'S')
  assert.equal(sizeRating(102), 'S')
  assert.equal(sizeRating(103), 'M')
  assert.equal(sizeRating(153), 'M')
  assert.equal(sizeRating(154), 'L')
  assert.equal(sizeRating(204), 'L')
  assert.equal(sizeRating(205), 'XL')
  assert.equal(sizeRating(255), 'XL')
  // A missing size reads as average.
  assert.equal(sizeRating(undefined), 'M')
})

test('the largest specimens are alphas', () => {
  assert.equal(ALPHA_SIZE, 240)
  assert.equal(isAlphaPokemon({ size: ALPHA_SIZE }), true)
  assert.equal(isAlphaPokemon({ size: ALPHA_SIZE - 1 }), false)
  assert.equal(isAlphaPokemon({}), false)
  assert.equal(isAlphaPokemon(null), false)
  assert.match(sizeTooltip({ size: 255 }), /alpha/i)
  assert.doesNotMatch(sizeTooltip({ size: 100 }), /alpha/i)
})

test('a freshly created Pokemon rolls a size', () => {
  const pokemon = createPokemon('bulbasaur', 5, 1)
  assert.ok(Number.isInteger(pokemon.size) && pokemon.size >= 0 && pokemon.size <= 255)
})

test('repairSave rolls a size for a save that predates them', () => {
  const stored = {
      id: '1',
      speciesKey: 'bulbasaur',
      level: 5,
      ivs: generateIVs(),
      moves: ['tackle'],
      currentHp: 20,
      maxHp: 20,
    },
    repaired = repairSave({
      version: 2,
      playerPokemon: stored,
      party: [stored],
      box: [{ ...stored, id: '2' }],
      nextPokemonId: 3,
      inventory: {},
    })
  assert.ok(Number.isInteger(repaired.party[0].size))
  assert.ok(Number.isInteger(repaired.box[0].size))
  // A save that already has a size keeps it.
  const keeps = repairSave({
    version: 2,
    playerPokemon: { ...stored, size: 42 },
    party: [{ ...stored, size: 42 }],
    box: [],
    nextPokemonId: 2,
    inventory: {},
  })
  assert.equal(keeps.party[0].size, 42)
})
