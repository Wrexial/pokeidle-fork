import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { evolutionData, moveLearnsets, pokemonSpecies } = await import('../src/data/gameData.js')

const NEW_SPECIES = [
  'walkingWake',
  'ironLeaves',
  'dipplin',
  'poltchageist',
  'sinistcha',
  'archaludon',
  'hydrapple',
  'ogerpon',
  'terapagos',
  'pecharunt',
]

test('the added Gen 9 DLC species have data and level-up moves', () => {
  for (const key of NEW_SPECIES) {
    assert.ok(pokemonSpecies[key], `${key} exists`)
    assert.ok(pokemonSpecies[key].baseStats, `${key} has base stats`)
    assert.ok((moveLearnsets[key] ?? []).length > 0, `${key} has level-up moves`)
  }
})

test('the added Gen 9 DLC evolutions are wired up', () => {
  const hasEdge = (from, into) => (evolutionData[from] ?? []).some((e) => e.into === into)
  assert.ok(hasEdge('applin', 'dipplin'), 'Applin -> Dipplin')
  assert.ok(hasEdge('dipplin', 'hydrapple'), 'Dipplin -> Hydrapple')
  assert.ok(hasEdge('duraludon', 'archaludon'), 'Duraludon -> Archaludon')
  assert.ok(hasEdge('poltchageist', 'sinistcha'), 'Poltchageist -> Sinistcha')
})
