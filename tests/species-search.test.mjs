// Fuzzy Box / Pokedex search: a name query matches a species' whole evolution
// family, and the Pokedex source labels cover the evolved-only species.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { speciesMatchingSearch, fuzzyNameMatch, evolutionFamily, normalizeSearchName } =
  await import('../src/game/species-search.js')
const { pokedexSourceLabels } = await import('../src/game/pokedex-sources.js')

test('a search expands across the evolution family', () => {
  const matches = speciesMatchingSearch('Bulbasaur')
  for (const speciesKey of ['bulbasaur', 'ivysaur', 'venusaur'])
    assert.ok(matches?.has(speciesKey), `Bulbasaur search finds ${speciesKey}`)
  // Unrelated Pokemon are not dragged in.
  assert.ok(!matches?.has('charmander'))
  assert.equal(speciesMatchingSearch('   '), null)
})

test('search is fuzzy and ignores punctuation / case', () => {
  // A dropped letter still matches.
  assert.ok(speciesMatchingSearch('bulbsaur')?.has('bulbasaur'))
  assert.ok(fuzzyNameMatch('Mr. Mime', normalizeSearchName('mrmime')))
  assert.ok(fuzzyNameMatch('Pikachu', normalizeSearchName('pikchu')))
  // A one- or two-character query only matches as a plain substring.
  assert.ok(!fuzzyNameMatch('Blastoise', normalizeSearchName('bt')))
})

test('the family walk tolerates the reversible form-transform cycles', () => {
  const family = evolutionFamily('darmanitan')
  assert.ok(family.has('darmanitan'))
  assert.ok(family.has('darmanitan-z'))
})

test('evolved-only species get an "Evolves from" Pokedex source', () => {
  assert.deepEqual(pokedexSourceLabels('porygon2'), ['Evolves from Porygon'])
  assert.deepEqual(pokedexSourceLabels('golisopod'), ['Evolves from Wimpod'])
  // A species with a wild route keeps its route entry and no evolution line.
  assert.deepEqual(pokedexSourceLabels('omanyte'), ['Fossil revive'])
})
