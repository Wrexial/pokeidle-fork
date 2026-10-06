import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  baseSpeciesKey,
  dexIdForSpecies,
  formLabelFor,
  formsByBase,
  isSpeciesRegistered,
  pokedexIndexes,
  pokemonSpecies,
} = await import('../src/data/gameData.js')

test('every alternate form resolves to a national-dex base', () => {
  const forms = Object.entries(pokemonSpecies).filter(([, species]) => species.id > 1025)
  assert.ok(forms.length > 0, 'there are alternate forms to check')
  for (const [key, species] of forms) {
    const base = baseSpeciesKey(key)
    assert.notEqual(base, key, `${key} is a form, not its own base`)
    const baseSpecies = pokemonSpecies[base]
    assert.ok(baseSpecies, `${key} resolves to a real base (${base})`)
    assert.ok(
      baseSpecies.id > 0 && baseSpecies.id <= 1025,
      `${key} resolves to a national-dex base (${base} #${baseSpecies.id})`
    )
    assert.equal(dexIdForSpecies(key), baseSpecies.id, `${key} shares its base dex number`)
    assert.ok((formsByBase[base] ?? []).includes(key), `${key} is listed under ${base}`)
  }
})

test('no form is grouped under more than one base', () => {
  const seen = new Map()
  for (const [base, forms] of Object.entries(formsByBase))
    for (const form of forms) {
      assert.equal(seen.get(form), undefined, `${form} is only under ${base}`)
      seen.set(form, base)
    }
  const formCount = Object.values(pokemonSpecies).filter((species) => species.id > 1025).length
  assert.equal(seen.size, formCount, 'every form is grouped exactly once')
})

test('the pokedex grid lists one slot per national dex entry, no forms', () => {
  const formKeys = new Set(
    Object.entries(pokemonSpecies)
      .filter(([, species]) => species.id > 1025)
      .map(([key]) => key)
  )
  for (const [key] of pokedexIndexes) assert.ok(!formKeys.has(key), `${key} is not a grid slot`)
  const nationalDexCount = Object.values(pokemonSpecies).filter(
    (species) => species.id > 0 && species.id <= 1025
  ).length
  // MissingNo. (id 0) is kept as an easter egg alongside the national dex.
  assert.equal(pokedexIndexes.length, nationalDexCount + 1)
  assert.equal(pokedexIndexes[0][1].id, 0)
})

test('known forms map to the expected base', () => {
  const expected = {
    'a-rattata': 'rattata',
    'g-meowth': 'meowth',
    'h-growlithe': 'growlithe',
    'p-tauros': 'tauros',
    'p-tauros-b': 'tauros',
    'm-charizard x': 'charizard',
    'gx-charizard': 'charizard',
    'gx-urshifu-rss': 'urshifu-sss',
    'urshifu-rss': 'urshifu-sss',
    'p-kyogre': 'kyogre',
    'p-groudon': 'groudon',
    'g-darmanitan-z': 'darmanitan',
    'h-rotom': 'rotom',
    'unown-b': 'unown',
    'g-mr. mime': 'mrMime',
    'deoxys-a': 'deoxys',
    'giratina-o': 'giratina',
  }
  for (const [form, base] of Object.entries(expected))
    assert.equal(baseSpeciesKey(form), base, `${form} -> ${base}`)
})

test('form labels name the common variants', () => {
  assert.equal(formLabelFor('a-rattata'), 'Alolan')
  assert.equal(formLabelFor('g-meowth'), 'Galarian')
  assert.equal(formLabelFor('h-growlithe'), 'Hisuian')
  assert.equal(formLabelFor('gx-charizard'), 'Gigantamax')
  assert.equal(formLabelFor('m-charizard x'), 'Mega X')
  assert.equal(formLabelFor('p-kyogre'), 'Primal')
  assert.equal(formLabelFor('giratina-o'), 'Origin')
  assert.equal(formLabelFor('h-rotom'), 'Heat')
  assert.equal(formLabelFor('rattata'), null)
})

test('isSpeciesRegistered counts any form of the species', () => {
  const registered = new Set(['a-rattata'])
  assert.equal(isSpeciesRegistered(registered, 'rattata'), true)
  assert.equal(isSpeciesRegistered(registered, 'raticate'), false)
  assert.equal(isSpeciesRegistered(new Set(['rattata']), 'rattata'), true)
})
