import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { createPokemon, ivStatLabel, ivVerdict, judgeIVs, pokemonDisplayName } = await import(
  '../src/game/pokemon.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

function startedGame() {
  return gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
}

test('RELEASE_DUPLICATES keeps the best copy and spares favourites/shinies', () => {
  const mon = (/** @type {string} */ speciesKey, /** @type {string} */ id, /** @type {number} */ iv, /** @type {Record<string, any>} */ extra = {}) => ({
      ...createPokemon(speciesKey, 20, id),
      ivs: { hp: iv, attack: iv, defense: iv, spAttack: iv, spDefense: iv, speed: iv },
      ...extra,
    }),
    a1 = mon('pidgey', 'a1', 0),
    a2 = mon('pidgey', 'a2', 31),
    a3 = mon('pidgey', 'a3', 10),
    b1 = mon('rattata', 'b1', 5),
    shiny = mon('caterpie', 'c1', 31, { isShiny: true }),
    plain = mon('caterpie', 'c2', 0),
    base = {
      ...initialGameState,
      box: [a1, a2, a3, b1, shiny, plain],
      money: 0,
      inventory: {},
    },
    result = gameReducer(base, { type: 'RELEASE_DUPLICATES' })
  const ids = result.box.map((/** @type {any} */ member) => member.id)
  assert.deepEqual(ids.sort(), ['a2', 'b1', 'c1'])
  assert.ok(result.money > 0, 'releasing duplicates should pay out')
})

test('RELEASE_DUPLICATES is a no-op without duplicates', () => {
  const base = {
    ...initialGameState,
    box: [createPokemon('pidgey', 20, 'a1'), createPokemon('rattata', 20, 'b1')],
  }
  assert.equal(gameReducer(base, { type: 'RELEASE_DUPLICATES' }), base)
})

const perfect = { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
  zero = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }

test('judgeIVs totals, verdicts and per-stat labels', () => {
  const best = judgeIVs(perfect)
  assert.equal(best.total, 186)
  assert.equal(best.verdict, 'Wonderful')
  assert.equal(best.perStat.attack.label, 'Best')

  const worst = judgeIVs(zero)
  assert.equal(worst.total, 0)
  assert.equal(worst.verdict, 'Decent')
  assert.equal(worst.perStat.speed.label, 'No Good')

  const middling = judgeIVs({ hp: 20, attack: 20, defense: 20, spAttack: 20, spDefense: 20, speed: 20 })
  assert.equal(middling.total, 120)
  assert.equal(middling.verdict, 'Above Average')
})

test('ivStatLabel and ivVerdict boundaries', () => {
  assert.equal(ivStatLabel(31), 'Best')
  assert.equal(ivStatLabel(30), 'Fantastic')
  assert.equal(ivStatLabel(26), 'Very Good')
  assert.equal(ivStatLabel(16), 'Pretty Good')
  assert.equal(ivStatLabel(1), 'Decent')
  assert.equal(ivStatLabel(0), 'No Good')
  assert.equal(ivVerdict(151), 'Wonderful')
  assert.equal(ivVerdict(150), 'Superior')
  assert.equal(ivVerdict(120), 'Above Average')
  assert.equal(ivVerdict(90), 'Decent')
})

test('TOGGLE_FAVOURITE flips the flag on the owned Pokemon', () => {
  const base = startedGame(),
    id = base.party[0].id,
    favourited = gameReducer(base, { type: 'TOGGLE_FAVOURITE', payload: { pokemonId: id } })
  assert.equal(favourited.party[0].favourite, true)
  assert.equal(favourited.playerPokemon.favourite, true)
  assert.equal(
    gameReducer(favourited, { type: 'TOGGLE_FAVOURITE', payload: { pokemonId: id } }).party[0]
      .favourite,
    false
  )
})

test('pokemonDisplayName prefers the nickname', () => {
  assert.equal(pokemonDisplayName({ name: 'Pikachu' }), 'Pikachu')
  assert.equal(pokemonDisplayName({ name: 'Pikachu', nickname: 'Sparky' }), 'Sparky')
})

test('SET_NICKNAME trims, caps at 12 characters and clears', () => {
  const base = startedGame(),
    id = base.party[0].id,
    named = gameReducer(base, {
      type: 'SET_NICKNAME',
      payload: { pokemonId: id, nickname: '  Buddy  ' },
    })
  assert.equal(named.party[0].nickname, 'Buddy')
  assert.equal(named.playerPokemon.nickname, 'Buddy')
  assert.equal(
    gameReducer(base, {
      type: 'SET_NICKNAME',
      payload: { pokemonId: id, nickname: 'ABCDEFGHIJKLMNOP' },
    }).party[0].nickname,
    'ABCDEFGHIJKL'
  )
  assert.equal(
    gameReducer(named, {
      type: 'SET_NICKNAME',
      payload: { pokemonId: id, nickname: '' },
    }).party[0].nickname,
    undefined
  )
})

test('favourites are protected from release and Wonder Trade', () => {
  const base = startedGame(),
    boxMon = { ...base.party[0], id: 'box1', favourite: true },
    state = { ...base, box: [boxMon], inventory: { ...base.inventory, linkCable: 1 } }
  assert.equal(
    gameReducer(state, {
      type: 'RELEASE_POKEMON',
      payload: { pokemonId: 'box1', source: 'box' },
    }),
    state,
    'a favourite cannot be released'
  )
  assert.equal(
    gameReducer(state, { type: 'WONDER_TRADE', payload: { pokemonId: 'box1' } }),
    state,
    'a favourite cannot be traded'
  )

  const unfavourited = { ...state, box: [{ ...boxMon, favourite: false }] }
  assert.equal(
    gameReducer(unfavourited, {
      type: 'RELEASE_POKEMON',
      payload: { pokemonId: 'box1', source: 'box' },
    }).box.length,
    0
  )
})
