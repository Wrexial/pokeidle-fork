import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { awaySummary } = await import('../src/game/progression.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { createPokemon, generateIVs } = await import('../src/game/pokemon.js')
const { pokemonSpecies } = await import('../src/data/gameData.js')

const snapshot = (/** @type {Record<string, any>} */ overrides = {}) => ({
  wildBattlesWon: 10,
  trainerBattlesWon: 2,
  money: 1000,
  pokedexCaught: ['bulbasaur'],
  shinyCaught: [],
  ...overrides,
})

test('awaySummary is null when nothing changed', () => {
  assert.equal(awaySummary(snapshot(), snapshot()), null)
})

test('awaySummary reports battles, species, shinies and money', () => {
  assert.equal(
    awaySummary(
      snapshot(),
      snapshot({
        wildBattlesWon: 15,
        money: 1500,
        pokedexCaught: ['bulbasaur', 'pidgey'],
        shinyCaught: ['pidgey'],
      })
    ),
    'While you were away: 5 battles, 1 new species, 1 shiny, +$500.'
  )
})

test('awaySummary pluralises and signs correctly', () => {
  assert.equal(
    awaySummary(
      snapshot(),
      snapshot({ trainerBattlesWon: 4, shinyCaught: ['pidgey', 'rattata'], money: 500 })
    ),
    'While you were away: 2 battles, 2 shinies, -$500.'
  )
  assert.equal(
    awaySummary(snapshot(), snapshot({ wildBattlesWon: 11 })),
    'While you were away: 1 battle.'
  )
})

test('a swarm spawn names the area but not the Pokemon', () => {
  const active = createPokemon('charmander', 10, 'a'),
    state = {
      ...initialGameState,
      party: [active],
      playerPokemon: active,
      activePlayerPokemonIndex: 0,
      phase: 'battling',
      currentLocation: 'route1',
      unlockedLocations: ['route1'],
      enemyPokemon: { ...createPokemon('rattata', 5, 'r'), currentHp: 0 },
      pendingEvents: [{ type: 'faint', message: 'Rattata fainted!', data: { target: 'enemy' } }],
    },
    original = Math.random
  try {
    Math.random = () => 0
    const next = gameReducer(state, { type: 'CONSUME_EVENT' })
    assert.ok(next.swarm, 'a swarm spawned')
    const toast = next.notifications.find((entry) => /swarm spawned/i.test(entry.message))
    assert.ok(toast, 'a swarm toast was queued')
    assert.match(toast.message, /^A swarm spawned in the .+ area!$/)
    assert.ok(
      !toast.message.includes(pokemonSpecies[next.swarm.speciesKey]?.name ?? '\u0000'),
      'the toast does not name the species'
    )
    assert.ok(
      next.battleLog.some((line) => /swarm spawned/i.test(line)),
      'the battle log also notes the swarm'
    )
  } finally {
    Math.random = original
  }
})

test('TOGGLE_BROWSER_NOTIFICATIONS flips the setting', () => {
  const on = gameReducer(initialGameState, { type: 'TOGGLE_BROWSER_NOTIFICATIONS' })
  assert.equal(on.browserNotifications, true)
  assert.equal(
    gameReducer(on, { type: 'TOGGLE_BROWSER_NOTIFICATIONS' }).browserNotifications,
    false
  )
})

test('repairSave defaults browserNotifications off and keeps it on', () => {
  const save = (/** @type {any} */ browserNotifications) => ({
      version: 2,
      playerPokemon: {
        id: '1',
        speciesKey: 'bulbasaur',
        level: 5,
        ivs: generateIVs(),
        moves: ['tackle'],
        currentHp: 20,
        maxHp: 20,
      },
      party: [],
      box: [],
      nextPokemonId: 2,
      inventory: {},
      browserNotifications,
    })
  assert.equal(repairSave(save(undefined)).browserNotifications, false)
  assert.equal(repairSave(save(true)).browserNotifications, true)
})
