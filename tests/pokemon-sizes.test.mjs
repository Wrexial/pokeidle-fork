import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  ALPHA_EXP_MULTIPLIER,
  ALPHA_SIZE,
  SIZE_FACTOR_MAX,
  SIZE_FACTOR_MIN,
  SIZE_RATINGS,
  alphaExpMultiplier,
  formatHeight,
  isAlphaPokemon,
  rollSize,
  sizeFactor,
  sizeHeight,
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

test('sizeHeight scales the roll by the species baseline', () => {
  assert.equal(sizeFactor(0), SIZE_FACTOR_MIN)
  assert.equal(sizeFactor(255), SIZE_FACTOR_MAX)
  assert.equal(sizeFactor(undefined), 1)
  // A middle roll is the species' own height; the extremes are 0.75x / 1.25x.
  assert.equal(sizeHeight({ size: 128 }, 2), 2)
  assert.equal(sizeHeight({ size: 0 }, 2), 1.5)
  assert.equal(sizeHeight({ size: 255 }, 2), 2.5)
  // A Wailord and a Diglett keep their own scales.
  const wailord = sizeHeight({ size: 128 }, 14.5),
    diglett = sizeHeight({ size: 128 }, 0.2)
  assert.ok(wailord > 14 && wailord < 15, `Wailord ~14.5 m, got ${wailord}`)
  assert.ok(diglett > 0.1 && diglett < 0.3, `Diglett ~0.2 m, got ${diglett}`)
  // No species height -> no physical size.
  assert.equal(sizeHeight({ size: 128 }, undefined), null)
  assert.equal(sizeHeight({ size: 128 }, 0), null)
})

test('formatHeight and the tooltip name a physical size', () => {
  assert.equal(formatHeight(0.5), '0.5 m')
  assert.equal(formatHeight(2), '2 m')
  assert.equal(formatHeight(14.5), '14.5 m')
  const tip = sizeTooltip({ size: 255 }, 2)
  assert.match(tip, /XL/)
  assert.match(tip, /2\.5 m/)
  assert.match(tip, /alpha/i)
  // Without a species height the tooltip still reads sensibly.
  assert.doesNotMatch(sizeTooltip({ size: 100 }), / m\b/)
})

test('an alpha earns bonus EXP', () => {
  assert.ok(ALPHA_EXP_MULTIPLIER > 1)
  assert.equal(alphaExpMultiplier({ size: ALPHA_SIZE }), ALPHA_EXP_MULTIPLIER)
  assert.equal(alphaExpMultiplier({ size: ALPHA_SIZE - 1 }), 1)
  assert.equal(alphaExpMultiplier(null), 1)
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
