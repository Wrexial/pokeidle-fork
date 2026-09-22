import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { breedingCompatibility, canBreed, eggSpeciesKey, genderForPokemon } = await import(
  '../src/game/breeding.js'
)

/**
 * Minimal Pokemon shape — breeding only reads `speciesKey` and `id`.
 * @param {string} speciesKey
 * @param {string} [id]
 */
const parent = (speciesKey, id = '1') => ({ speciesKey, id })

/**
 * Find an id that makes `speciesKey` read as the wanted gender (gender is
 * derived deterministically from the id).
 * @param {string} speciesKey
 * @param {'male' | 'female'} gender
 */
function findId(speciesKey, gender) {
  for (let id = 1; id <= 5000; id++)
    if (genderForPokemon({ speciesKey, id: String(id) }) === gender) return String(id)
  throw new Error(`no ${gender} id found for ${speciesKey}`)
}

test('two Ditto cannot breed', () => {
  assert.equal(canBreed([parent('ditto'), parent('ditto', '2')]), false)
})

test('Ditto breeds with an ordinary Pokemon', () => {
  assert.equal(canBreed([parent('ditto'), parent('bulbasaur')]), true)
})

test('undiscovered species cannot breed, even with Ditto', () => {
  const result = breedingCompatibility([parent('mewtwo'), parent('ditto')])
  assert.equal(result.ok, false)
  assert.match(result.reason, /Undiscovered/)
})

test('same-gender parents are incompatible', () => {
  const maleId = findId('bulbasaur', 'male')
  const result = breedingCompatibility([parent('bulbasaur', maleId), parent('bulbasaur', maleId)])
  assert.equal(result.ok, false)
  assert.match(result.reason, /Both parents/)
})

test('opposite-gender parents sharing an egg group are compatible', () => {
  const male = parent('bulbasaur', findId('bulbasaur', 'male'))
  const female = parent('bulbasaur', findId('bulbasaur', 'female'))
  assert.equal(canBreed([male, female]), true)
})

test('eggSpeciesKey returns the mother\u2019s base form', () => {
  const mother = parent('ivysaur', findId('ivysaur', 'female'))
  const father = parent('bulbasaur', findId('bulbasaur', 'male'))
  assert.equal(eggSpeciesKey([mother, father]), 'bulbasaur')
})

test('gender-form species have a fixed gender', () => {
  assert.equal(genderForPokemon(parent('basculegion')), 'male')
  assert.equal(genderForPokemon(parent('basculegion-f')), 'female')
  assert.equal(genderForPokemon(parent('indeedee-f')), 'female')
})

test('genderless species report genderless', () => {
  assert.equal(genderForPokemon(parent('mewtwo')), 'genderless')
})
