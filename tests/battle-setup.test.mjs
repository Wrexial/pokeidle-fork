import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { createBattlePokemon } = await import('../src/game/combat.js')

test('a default battle Pokemon is a full-HP opponent with the species data', () => {
  const pokemon = createBattlePokemon('pidgey', 20)
  assert.equal(pokemon.speciesKey, 'pidgey')
  assert.equal(pokemon.name, 'Pidgey')
  assert.deepEqual(pokemon.types, ['Normal', 'Flying'])
  assert.equal(pokemon.level, 20)
  assert.equal(pokemon.currentHp, pokemon.maxHp)
  assert.ok(pokemon.maxHp > 0)
  assert.ok(Array.isArray(pokemon.moves) && pokemon.moves.length > 0)
  assert.equal(pokemon.isPlayer, false)
  assert.equal(pokemon.isShiny, false)
  assert.equal('ability' in pokemon, false)
  assert.equal('gender' in pokemon, false)
})

test('a wild battle Pokemon rolls ability, held item, gender and roam state', () => {
  const pokemon = createBattlePokemon('pidgey', 20, { wild: true, isRoamer: true, isShiny: true })
  assert.ok('ability' in pokemon)
  assert.ok('heldItem' in pokemon)
  assert.ok('gender' in pokemon)
  assert.equal(pokemon.isRoamer, true)
  assert.equal(pokemon.isShiny, true)
})

test('a trainer Pokemon rolls only a gender and takes perfect IVs', () => {
  const pokemon = createBattlePokemon('pidgey', 20, { gender: true, perfectIvs: true })
  assert.ok('gender' in pokemon)
  assert.equal('ability' in pokemon, false)
  assert.equal('isRoamer' in pokemon, false)
})
