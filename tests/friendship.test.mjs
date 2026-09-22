import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { BASE_FRIENDSHIP, MAX_FRIENDSHIP, createPokemon, gainFriendship } = await import(
  '../src/game/pokemon.js'
)
const { getEvolutionOptions } = await import('../src/game/breeding.js')
const { repairSave } = await import('../src/game/context.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

test('new Pokemon start with base friendship', () => {
  assert.equal(createPokemon('golbat', 40, 1).friendship, BASE_FRIENDSHIP)
})

test('gainFriendship clamps between 0 and the maximum', () => {
  assert.equal(gainFriendship({ friendship: 250 }, 100), MAX_FRIENDSHIP)
  assert.equal(gainFriendship({ friendship: 250 }, -1000), 0)
  assert.equal(gainFriendship({}, 0), BASE_FRIENDSHIP)
})

test('friendship gates Golbat -> Crobat', () => {
  const low = getEvolutionOptions({ speciesKey: 'golbat', level: 50, friendship: 100 }, {}),
    lowCrobat = low.find((entry) => entry.targetKey === 'crobat')
  assert.ok(lowCrobat, 'Crobat should be listed')
  assert.equal(lowCrobat.canEvolve, false)
  assert.match(lowCrobat.requirementLabel, /Friendship 160/)

  const high = getEvolutionOptions({ speciesKey: 'golbat', level: 50, friendship: 200 }, {})
  assert.equal(high.find((entry) => entry.targetKey === 'crobat').canEvolve, true)
})

test('item evolutions still require the item', () => {
  const without = getEvolutionOptions({ speciesKey: 'pikachu', level: 30, friendship: 255 }, {}),
    withItem = getEvolutionOptions(
      { speciesKey: 'pikachu', level: 30, friendship: 255 },
      { thunderStone: 1 }
    )
  assert.equal(without.find((entry) => entry.targetKey === 'raichu').canEvolve, false)
  assert.equal(withItem.find((entry) => entry.targetKey === 'raichu').canEvolve, true)
})

test('repairSave defaults friendship for older Pokemon', () => {
  const stored = {
      id: '1',
      speciesKey: 'bulbasaur',
      level: 5,
      ivs: { hp: 10, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
      moves: ['tackle'],
      currentHp: 20,
      maxHp: 20,
      attack: 10,
      defense: 10,
      spAttack: 10,
      spDefense: 10,
      speed: 10,
    },
    repaired = repairSave({
      version: 2,
      playerPokemon: stored,
      party: [stored],
      box: [],
      nextPokemonId: 2,
      inventory: { pokeball: 5 },
    })
  assert.equal(repaired.party[0].friendship, BASE_FRIENDSHIP)
})

test('levelling up raises friendship', () => {
  const mon = createPokemon('bulbasaur', 5, 'a'),
    state = {
      ...initialGameState,
      party: [mon],
      playerPokemon: mon,
      activePlayerPokemonIndex: 0,
    },
    next = gameReducer(state, {
      type: 'APPLY_EXP',
      payload: {
        expGained: 100,
        newLevel: 6,
        newStats: {
          maxHp: mon.maxHp + 1,
          attack: mon.attack,
          defense: mon.defense,
          spAttack: mon.spAttack,
          spDefense: mon.spDefense,
          speed: mon.speed,
        },
      },
    })
  assert.equal(next.playerPokemon.friendship, BASE_FRIENDSHIP + 8)
})

test('winning a wild battle raises the active Pokemon\u2019s friendship', () => {
  const active = createPokemon('charmander', 10, 'a'),
    enemy = createPokemon('rattata', 5, 'r'),
    state = {
      ...initialGameState,
      party: [active],
      playerPokemon: active,
      activePlayerPokemonIndex: 0,
      phase: 'battling',
      enemyPokemon: { ...enemy, currentHp: 0 },
      pendingEvents: [{ type: 'faint', message: 'Rattata fainted!', data: { target: 'enemy' } }],
    },
    next = gameReducer(state, { type: 'CONSUME_EVENT' })
  assert.equal(next.party.find((member) => member.id === 'a').friendship, BASE_FRIENDSHIP + 2)
})
