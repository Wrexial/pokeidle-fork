import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { releaseReward } = await import('../src/game/progression.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')

test('releaseReward scales money and candy with level', () => {
  assert.deepEqual(releaseReward({ level: 10, isShiny: false }), {
    money: 150,
    items: { expCandyS: 1 },
  })
  assert.deepEqual(releaseReward({ level: 30, isShiny: false }), {
    money: 450,
    items: { expCandyM: 1 },
  })
  assert.deepEqual(releaseReward({ level: 60, isShiny: false }), {
    money: 900,
    items: { expCandyL: 1 },
  })
  assert.deepEqual(releaseReward({ level: 80, isShiny: false }), {
    money: 1200,
    items: { expCandyXL: 1 },
  })
})

test('releasing a shiny gives double candy and more money', () => {
  assert.deepEqual(releaseReward({ level: 50, isShiny: true }), {
    money: 2000,
    items: { expCandyL: 2 },
  })
})

test('RELEASE_POKEMON from the box grants the reward', () => {
  const mon = createPokemon('pidgey', 60, 5),
    base = { ...initialGameState, box: [mon], money: 0, inventory: {} },
    released = gameReducer(base, {
      type: 'RELEASE_POKEMON',
      payload: { pokemonId: mon.id, source: 'box' },
    })
  assert.equal(released.box.length, 0)
  assert.equal(released.money, 900)
  assert.equal(released.inventory.expCandyL, 1)
  assert.ok(released.notifications.length >= 1)
})

test('RELEASE_POKEMON from the party keeps at least one member', () => {
  const a = createPokemon('bulbasaur', 50, 1),
    b = createPokemon('pidgey', 50, 2),
    base = {
      ...initialGameState,
      party: [a, b],
      playerPokemon: a,
      activePlayerPokemonIndex: 0,
      money: 0,
      inventory: {},
    }
  assert.equal(
    gameReducer(base, {
      type: 'RELEASE_POKEMON',
      payload: { pokemonId: a.id, source: 'party' },
    }).party.length,
    1
  )
})

test('releasing the last party Pokemon is refused', () => {
  const mon = createPokemon('bulbasaur', 20, 1),
    base = { ...initialGameState, party: [mon], playerPokemon: mon }
  assert.equal(
    gameReducer(base, {
      type: 'RELEASE_POKEMON',
      payload: { pokemonId: mon.id, source: 'party' },
    }),
    base
  )
})

test('RELEASE_FILTERED releases the listed boxed Pokemon and pays out', () => {
  const first = createPokemon('pidgey', 20, 'a'),
    second = createPokemon('rattata', 20, 'b'),
    kept = createPokemon('caterpie', 20, 'c'),
    base = { ...initialGameState, box: [first, second, kept], money: 0, inventory: {} },
    released = gameReducer(base, {
      type: 'RELEASE_FILTERED',
      payload: { ids: [first.id, second.id] },
    })
  assert.deepEqual(
    released.box.map((member) => member.id),
    [kept.id],
    'only the listed Pokemon go'
  )
  assert.ok(released.money > 0)
  assert.ok(released.notifications.length >= 1)
})

test('RELEASE_FILTERED protects favourites and shinies', () => {
  const favourite = { ...createPokemon('pidgey', 20, 'a'), favourite: true },
    shiny = { ...createPokemon('rattata', 20, 'b'), isShiny: true },
    plain = createPokemon('caterpie', 20, 'c'),
    base = { ...initialGameState, box: [favourite, shiny, plain] },
    released = gameReducer(base, {
      type: 'RELEASE_FILTERED',
      payload: { ids: [favourite.id, shiny.id, plain.id] },
    })
  assert.deepEqual(
    released.box.map((member) => member.id),
    [favourite.id, shiny.id]
  )
})

test('quick-releasing a hatchling pays out', () => {
  const egg = createPokemon('pidgey', 1, 9),
    base = { ...initialGameState, box: [egg], hatchResult: egg, money: 0, inventory: {} },
    released = gameReducer(base, {
      type: 'RELEASE_HATCHLING',
      payload: { pokemonId: egg.id },
    })
  assert.equal(released.box.length, 0)
  assert.equal(released.hatchResult, null)
  assert.equal(released.money, 15)
  assert.equal(released.inventory.expCandyS, 1)
})
