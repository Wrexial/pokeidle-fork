import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { initialGameState, gameReducer } = await import('../src/game/reducer.js')
const { fieldMoves } = await import('../src/data/config.js')
const { isHoneyActive } = await import('../src/game/progression.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')

const ROUTE = 'route1',
  SPECIES = 'pidgey',
  HONEY_DURATION = 500

/** A Sweet Scent user in the party, standing on a wild route. */
function stateWithSweetScent(overrides = {}) {
  const user = { ...createPokemon('bulbasaur', 5, 1), moves: ['sweetScent', 'tackle'] }
  return {
    ...initialGameState,
    startRegion: 'kanto',
    unlockedRegions: ['kanto'],
    unlockedLocations: ['palletTown', ROUTE],
    currentLocation: ROUTE,
    currentRoute: ROUTE,
    party: [user],
    playerPokemon: user,
    ...overrides,
  }
}

/** Run `fn` with `Date.now` pinned, then restore it. */
function withNow(/** @type {number} */ value, /** @type {() => any} */ fn) {
  const original = Date.now
  Date.now = () => value
  try {
    return fn()
  } finally {
    Date.now = original
  }
}

const useSweetScent = (/** @type {GameState} */ state, /** @type {number} */ now) =>
  withNow(now, () =>
    gameReducer(state, {
      type: 'USE_FIELD_MOVE',
      payload: { moveId: 'sweetScent', routeKey: ROUTE, speciesKey: SPECIES },
    })
  )

test('a party Sweet Scent grants Honey without spending an item', () => {
  const state = stateWithSweetScent({
      inventory: { ...initialGameState.inventory, honey: 1 },
    }),
    next = useSweetScent(state, 1e3)
  assert.equal(next.inventory.honey, 1, 'Honey is not consumed')
  assert.ok(isHoneyActive(next.activeEffects, ROUTE, SPECIES), 'the Honey lure is active')
  const effect = next.activeEffects.find((entry) => entry.type === 'honey')
  assert.equal(effect?.battlesRemaining, HONEY_DURATION)
})

test('the field move sets a cooldown and is a no-op until it expires', () => {
  const used = useSweetScent(stateWithSweetScent(), 1e3)
  assert.equal(used.fieldMoveCooldowns.sweetScent, 1e3 + fieldMoves.sweetScent.cooldownMs)
  const again = useSweetScent(used, used.fieldMoveCooldowns.sweetScent - 1)
  assert.equal(again, used, 'the state is untouched while cooling down')
  assert.equal(again.activeEffects[0].battlesRemaining, HONEY_DURATION, 'the lure is not extended')
})

test('the field move is usable again once the cooldown passes', () => {
  const used = useSweetScent(stateWithSweetScent(), 1e3),
    ready = useSweetScent(used, used.fieldMoveCooldowns.sweetScent)
  assert.equal(ready.activeEffects[0].battlesRemaining, HONEY_DURATION * 2, 'a new use stacks')
  assert.equal(ready.fieldMoveCooldowns.sweetScent, used.fieldMoveCooldowns.sweetScent + fieldMoves.sweetScent.cooldownMs)
})

test('the field move needs a healthy party member that knows it', () => {
  const ineligible = [
    stateWithSweetScent({ party: [createPokemon('rattata', 5, 2)] }),
    stateWithSweetScent({
      party: [{ ...createPokemon('bulbasaur', 5, 1), moves: ['sweetScent'], currentHp: 0 }],
    }),
  ]
  for (const state of ineligible) {
    assert.equal(useSweetScent(state, 1e3), state, 'an ineligible party cannot lure')
  }
})

test('an unknown field move is ignored', () => {
  const state = stateWithSweetScent()
  assert.equal(
    gameReducer(state, {
      type: 'USE_FIELD_MOVE',
      payload: { moveId: 'notAMove', routeKey: ROUTE, speciesKey: SPECIES },
    }),
    state
  )
})

test('the field-move cooldown persists and unknown moves are dropped on repair', () => {
  const used = useSweetScent(stateWithSweetScent(), 1e3),
    saved = serializeSave(used)
  assert.deepEqual(saved.fieldMoveCooldowns, used.fieldMoveCooldowns)
  assert.deepEqual(repairSave(saved).fieldMoveCooldowns, used.fieldMoveCooldowns)
  assert.deepEqual(
    repairSave({ ...saved, fieldMoveCooldowns: { bogus: 123, sweetScent: 456 } })
      .fieldMoveCooldowns,
    { sweetScent: 456 }
  )
})
