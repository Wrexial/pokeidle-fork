import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { NATURES, natureByKey } = await import('../src/data/natures.js')
const { calculatePokemonStats, createPokemon, generateIVs } = await import('../src/game/pokemon.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { pokemonSpecies } = await import('../src/data/gameData.js')

test('there are 25 natures with valid stat keys', () => {
  assert.equal(NATURES.length, 25)
  const statKeys = ['attack', 'defense', 'spAttack', 'spDefense', 'speed']
  for (const nature of NATURES) {
    assert.ok(statKeys.includes(nature.increased), `${nature.key} has a bad increased stat`)
    assert.equal(typeof nature.name, 'string')
  }
})

test('a nature raises one stat, lowers another, and never touches HP', () => {
  const ivs = generateIVs(),
    species = pokemonSpecies.bulbasaur,
    neutral = calculatePokemonStats(species, 50, ivs),
    adamant = calculatePokemonStats(species, 50, ivs, 'adamant')
  assert.equal(adamant.hp, neutral.hp, 'HP must be unaffected')
  assert.ok(adamant.attack > neutral.attack, 'Adamant raises Attack')
  assert.ok(adamant.spAttack < neutral.spAttack, 'Adamant lowers Sp. Atk')
  const hardy = calculatePokemonStats(species, 50, ivs, 'hardy')
  assert.equal(hardy.attack, neutral.attack, 'Hardy is neutral')
})

test('createPokemon rolls a valid nature', () => {
  const pokemon = createPokemon('charmander', 10, 1)
  assert.ok(natureByKey[pokemon.nature], 'nature should be one of the 25')
})

test('a Nature Mint re-rolls the nature and recalculates stats', () => {
  let state = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
  state = { ...state, inventory: { ...state.inventory, natureMint: 2 } }
  const before = state.party[0],
    minted = gameReducer(state, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'natureMint', pokemonId: before.id },
    }),
    after = minted.party[0]
  assert.notEqual(after.nature, before.nature, 'the mint should change the nature')
  assert.equal(minted.inventory.natureMint, 1, 'the mint should be consumed')
  const expected = calculatePokemonStats(
    pokemonSpecies.bulbasaur,
    after.level,
    after.ivs,
    after.nature
  )
  assert.equal(after.attack, expected.attack)
  assert.equal(after.spAttack, expected.spAttack)
})

test('repairSave migrates an old Pokemon that has no nature', () => {
  const ivs = generateIVs(),
    stats = { hp: 20, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
    stored = {
      id: '1',
      speciesKey: 'bulbasaur',
      level: 5,
      ivs,
      moves: ['tackle'],
      currentHp: 20,
      maxHp: 20,
      ...stats,
    },
    repaired = repairSave({
      version: 2,
      playerPokemon: stored,
      party: [stored],
      box: [],
      nextPokemonId: 2,
      inventory: { pokeball: 5 },
    }),
    migrated = repaired.party[0]
  assert.ok(natureByKey[migrated.nature], 'a nature should be assigned')
  const expected = calculatePokemonStats(
    pokemonSpecies.bulbasaur,
    migrated.level,
    migrated.ivs,
    migrated.nature
  )
  assert.equal(migrated.attack, expected.attack, 'stats should be recomputed for the new nature')
  assert.equal(migrated.maxHp, expected.hp)
  assert.ok(migrated.currentHp <= migrated.maxHp)
})
