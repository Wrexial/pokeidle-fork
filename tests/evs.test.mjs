import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  EV_MAX_PER_STAT,
  EV_MAX_TOTAL,
  EV_VITAMIN_GAIN,
} = await import('../src/data/config.js')
const {
  calculatePokemonStats,
  createEmptyEvs,
  createPokemon,
  getPerfectIVs,
  totalEvs,
} = await import('../src/game/pokemon.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')
const { pokemonSpecies } = await import('../src/data/gameData.js')

test('EVs raise the calculated stats', () => {
  const species = pokemonSpecies.machop,
    ivs = getPerfectIVs(),
    plain = calculatePokemonStats(species, 50, ivs, 'hardy', createEmptyEvs()),
    trained = calculatePokemonStats(species, 50, ivs, 'hardy', {
      ...createEmptyEvs(),
      attack: EV_MAX_PER_STAT,
      hp: EV_MAX_PER_STAT,
    })
  assert.ok(trained.attack > plain.attack, 'Attack EVs raise Attack')
  assert.ok(trained.hp > plain.hp, 'HP EVs raise HP')
  assert.equal(plain.attack, calculatePokemonStats(species, 50, ivs, 'hardy').attack, 'no evs = 0')
})

test('a freshly created Pokemon has an empty EV block', () => {
  const pokemon = createPokemon('machop', 5, 1)
  assert.deepEqual(pokemon.evs, createEmptyEvs())
  assert.equal(totalEvs(pokemon.evs), 0)
})

test('a vitamin raises one stat by 10 EVs and is consumed', () => {
  const member = createPokemon('machop', 50, 'a'),
    base = {
      ...initialGameState,
      party: [member],
      playerPokemon: member,
      activePlayerPokemonIndex: 0,
      inventory: { protein: 3 },
    },
    used = gameReducer(base, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'protein', pokemonId: 'a', quantity: 1 },
    }),
    after = used.party[0]
  assert.equal(after.evs.attack, EV_VITAMIN_GAIN)
  assert.equal(used.inventory.protein, 2)
  assert.ok(after.attack > member.attack, 'the Attack stat went up')
})

test('bulk vitamins stop at the caps and only consume what is used', () => {
  const member = { ...createPokemon('machop', 50, 'a'), evs: { ...createEmptyEvs(), attack: 250 } },
    base = {
      ...initialGameState,
      party: [member],
      playerPokemon: member,
      activePlayerPokemonIndex: 0,
      inventory: { protein: 10 },
    },
    used = gameReducer(base, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'protein', pokemonId: 'a', quantity: 10 },
    })
  assert.equal(used.party[0].evs.attack, EV_MAX_PER_STAT, 'tops up to 252')
  assert.equal(used.inventory.protein, 9, 'only one vitamin was used')
  // A stat already at the cap refuses the vitamin (the state is unchanged).
  const maxedState = {
    ...base,
    party: [{ ...member, evs: { ...createEmptyEvs(), attack: EV_MAX_PER_STAT } }],
    inventory: { protein: 1 },
  }
  assert.equal(
    gameReducer(maxedState, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'protein', pokemonId: 'a', quantity: 1 },
    }),
    maxedState
  )
})

test('the total EV cap is enforced across stats', () => {
  const evs = { ...createEmptyEvs(), hp: 252, attack: 252 },
    member = { ...createPokemon('machop', 50, 'a'), evs },
    base = {
      ...initialGameState,
      party: [member],
      playerPokemon: member,
      activePlayerPokemonIndex: 0,
      inventory: { iron: 5 },
    },
    // 504 invested, 6 left: one Iron wants 10 but clamps to 6, so 510 total.
    used = gameReducer(base, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'iron', pokemonId: 'a', quantity: 1 },
    })
  assert.equal(used.party[0].evs.defense, 6, 'the last vitamin tops up the remaining budget')
  assert.equal(totalEvs(used.party[0].evs), EV_MAX_TOTAL)
  assert.equal(used.inventory.iron, 4)
})

test('repairSave defaults empty EVs and clamps bad values', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    stripped = { ...base.party[0] }
  delete stripped.evs
  const repaired = repairSave(serializeSave({ ...base, party: [stripped], playerPokemon: stripped }))
  assert.deepEqual(repaired.party[0].evs, createEmptyEvs(), 'an old save gets an empty EV block')

  const wild = {
      ...base.party[0],
      evs: { hp: 999, attack: -5, defense: 252, spAttack: 252, spDefense: 252, speed: 252 },
    },
    clamped = repairSave(serializeSave({ ...base, party: [wild], playerPokemon: wild }))
  assert.ok(clamped.party[0].evs.hp <= EV_MAX_PER_STAT, 'per-stat clamp')
  assert.equal(clamped.party[0].evs.attack, 0, 'a negative stat resets to 0')
  assert.equal(totalEvs(clamped.party[0].evs), EV_MAX_TOTAL, 'the total is clamped to 510')
})
