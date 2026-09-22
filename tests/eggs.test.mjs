import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { createEgg, createPokemon, isBattleReady } = await import('../src/game/pokemon.js')
const { eggHatchSteps } = await import('../src/game/breeding.js')
const { tickPartyEggs } = await import('../src/game/progression.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

test('eggHatchSteps scales with species strength and stays in range', () => {
  const weak = eggHatchSteps('caterpie'),
    strong = eggHatchSteps('mewtwo')
  assert.ok(weak >= 8 && weak <= 40)
  assert.ok(strong >= 8 && strong <= 40)
  assert.ok(strong > weak)
})

test('createEgg makes a non-battle-ready egg', () => {
  const egg = createEgg('pidgey', 1, false, 12)
  assert.equal(egg.isEgg, true)
  assert.equal(egg.eggStepsRemaining, 12)
  assert.equal(egg.level, 1)
  assert.equal(isBattleReady(egg), false)
  assert.equal(isBattleReady({ currentHp: 0 }), false)
  assert.equal(isBattleReady({ currentHp: 10 }), true)
})

test('tickPartyEggs counts down and hatches', () => {
  const egg = createEgg('pidgey', 1, false, 2),
    first = tickPartyEggs([egg])
  assert.equal(first.hatched, null)
  assert.equal(first.party[0].eggStepsRemaining, 1)

  const second = tickPartyEggs(first.party)
  assert.ok(second.hatched, 'the egg should hatch')
  assert.equal(second.party[0].isEgg, false)
  assert.ok(second.party[0].moves.length >= 1, 'the hatchling should know a move')
})

test('HATCH_DAYCARE_EGG gives an egg, not a hatched Pokemon', () => {
  const state = {
      ...initialGameState,
      party: [createPokemon('charmander', 10, 1)],
      daycare: {
        parents: [createPokemon('ditto', 10, 2), createPokemon('bulbasaur', 10, 3)],
        progress: 50,
      },
    },
    result = gameReducer(state, { type: 'HATCH_DAYCARE_EGG' }),
    egg = result.party[1]
  assert.equal(result.party.length, 2)
  assert.equal(egg.isEgg, true)
  assert.ok(egg.eggStepsRemaining >= 8)
  assert.equal(result.hatchResult, null, 'it should not hatch immediately')
  assert.equal(result.daycare.progress, 0)
})

test('a party egg hatches on a wild win', () => {
  const active = createPokemon('charmander', 10, 'a'),
    egg = createEgg('pidgey', 'e', false, 1),
    enemy = createPokemon('rattata', 5, 'r'),
    state = {
      ...initialGameState,
      party: [active, egg],
      playerPokemon: active,
      activePlayerPokemonIndex: 0,
      phase: 'battling',
      enemyPokemon: { ...enemy, currentHp: 0 },
      pendingEvents: [{ type: 'faint', message: 'Rattata fainted!', data: { target: 'enemy' } }],
    },
    next = gameReducer(state, { type: 'CONSUME_EVENT' })
  assert.ok(next.hatchResult, 'the hatch should be reported')
  assert.equal(next.party.find((/** @type {any} */ member) => member.id === 'e').isEgg, false)
  assert.ok(next.pokedexCaught.includes('pidgey'))
})

test('an egg in the box does not progress or battle', () => {
  const egg = createEgg('pidgey', 'e', false, 5),
    state = { ...initialGameState, party: [createPokemon('charmander', 10, 'a')], box: [egg], playerPokemon: createPokemon('charmander', 10, 'a') }
  assert.equal(isBattleReady(egg), false)
  // The boxed egg is untouched by a wild win.
  const enemy = createPokemon('rattata', 5, 'r'),
    next = gameReducer(
      {
        ...state,
        phase: 'battling',
        playerPokemon: state.party[0],
        enemyPokemon: { ...enemy, currentHp: 0 },
        pendingEvents: [
          { type: 'faint', message: 'gone', data: { target: 'enemy' } },
        ],
      },
      { type: 'CONSUME_EVENT' }
    )
  assert.equal(next.box[0].eggStepsRemaining, 5)
  assert.equal(next.hatchResult, null)
})
