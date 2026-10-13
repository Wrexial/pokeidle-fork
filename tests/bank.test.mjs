import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

// Minimal in-memory localStorage; the bank and save modules read the bare
// `localStorage` global, which Node does not provide.
const store = new Map()
globalThis.localStorage = {
  getItem: (/** @type {string} */ key) => (store.has(key) ? store.get(key) : null),
  setItem: (/** @type {string} */ key, /** @type {string} */ value) =>
    store.set(key, String(value)),
  removeItem: (/** @type {string} */ key) => store.delete(key),
  clear: () => store.clear(),
  key: (/** @type {number} */ index) => [...store.keys()][index] ?? null,
  get length() {
    return store.size
  },
}

const { BANK_CAPACITY, setActiveSlot } = await import('../src/data/config.js')
const { depositToBank, readBank, repairBankPokemon, slotsWithBankTag, withdrawFromBank, writeBank } =
  await import('../src/game/bank.js')
const { loadSavedState, persistSave } = await import('../src/game/save.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

/** @param {string} [speciesKey] */
function startedGame(speciesKey = 'bulbasaur') {
  return gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey },
  })
}

test('readBank starts empty and drops malformed entries', () => {
  store.clear()
  assert.deepEqual(readBank(), { version: 1, entries: [] })
  store.set(
    'pokemon-idle-bank',
    JSON.stringify({
      version: 1,
      entries: [
        { tag: 'ok', pokemon: createPokemon('pidgey', 5, '1') },
        { tag: '', pokemon: createPokemon('rattata', 5, '2') },
        { tag: 'bad', pokemon: { speciesKey: 'notARealSpecies' } },
      ],
    })
  )
  const bank = readBank()
  assert.equal(bank.entries.length, 1)
  assert.equal(bank.entries[0].tag, 'ok')
  assert.equal(bank.entries[0].pokemon.bankTag, 'ok')
})

test('repairBankPokemon drops an unknown species', () => {
  assert.equal(repairBankPokemon({ id: '1', speciesKey: 'notARealSpecies', level: 5 }), null)
  assert.ok(repairBankPokemon(createPokemon('pidgey', 5, '1')))
})

test('deposit moves a box Pokemon out of the save and into the bank', () => {
  store.clear()
  setActiveSlot(1)
  const boxMon = createPokemon('pidgey', 10, '99')
  const state = { ...startedGame(), box: [boxMon] }
  persistSave(state, 1)
  const result = depositToBank(state, '99', 'box')
  assert.ok(!('error' in result))
  assert.equal(result.state.box.length, 0)
  assert.equal(result.bank.entries.length, 1)
  assert.equal(result.bank.entries[0].pokemon.speciesKey, 'pidgey')
  assert.ok(result.bank.entries[0].pokemon.bankTag, 'the deposit is tagged')
  assert.equal(result.bank.entries[0].sourceSlot, 1)
  assert.equal(loadSavedState(1).box.length, 0, 'the save no longer holds it')
  assert.equal(readBank().entries.length, 1, 'the bank persists')
})

test('withdraw returns a banked Pokemon with a fresh save id', () => {
  store.clear()
  setActiveSlot(1)
  const boxMon = createPokemon('pidgey', 10, '99')
  const deposited = depositToBank({ ...startedGame(), box: [boxMon] }, '99', 'box')
  assert.ok(!('error' in deposited))
  const entry = deposited.bank.entries[0]
  const withdrawn = withdrawFromBank(deposited.state, entry.tag)
  assert.ok(!('error' in withdrawn))
  assert.equal(withdrawn.bank.entries.length, 0, 'the bank is emptied')
  assert.equal(withdrawn.state.box.length, 1)
  const restored = withdrawn.state.box[0]
  assert.equal(restored.speciesKey, 'pidgey')
  assert.equal(restored.bankTag, entry.tag, 'the tag travels with the individual')
  assert.notEqual(restored.id, '99', 're-keyed into the save id sequence')
  assert.notEqual(restored.id, withdrawn.state.party[0].id, 'no collision with the party')
  assert.equal(readBank().entries.length, 0)
})

test('the bank respects its own capacity', () => {
  store.clear()
  setActiveSlot(1)
  const template = createPokemon('pidgey', 5, '1')
  writeBank({
    version: 1,
    entries: Array.from({ length: BANK_CAPACITY }, (_, index) => ({
      tag: `t${index}`,
      pokemon: template,
      sourceSlot: 1,
      depositedAt: 0,
    })),
  })
  const state = { ...startedGame(), box: [{ ...template, id: '99' }] }
  const result = depositToBank(state, '99', 'box')
  assert.ok('error' in result, 'a full bank rejects the deposit')
})

test('a Pokemon tagged in another save cannot be deposited', () => {
  store.clear()
  setActiveSlot(1)
  const other = { ...createPokemon('rattata', 8, '50'), bankTag: 'tag-x' }
  persistSave({ ...startedGame('charmander'), box: [other] }, 2)
  setActiveSlot(1)
  const mine = { ...createPokemon('pidgey', 8, '99'), bankTag: 'tag-x' }
  const result = depositToBank({ ...startedGame(), box: [mine] }, '99', 'box')
  assert.ok('error' in result, 'the clone guard refuses the deposit')
  assert.deepEqual(slotsWithBankTag('tag-x'), [2])
})

test('withdraw refuses when the tag already lives in a save', () => {
  store.clear()
  setActiveSlot(1)
  const pokemon = { ...createPokemon('pidgey', 10, '77'), bankTag: 'tag-y' }
  writeBank({
    version: 1,
    entries: [{ tag: 'tag-y', pokemon, sourceSlot: 1, depositedAt: 0 }],
  })
  const result = withdrawFromBank({ ...startedGame(), box: [pokemon] }, 'tag-y')
  assert.ok('error' in result, 'the clone guard refuses the withdrawal')
})

test('a party Pokemon is not deposited when it is the last battler', () => {
  store.clear()
  setActiveSlot(1)
  const state = startedGame()
  const activeId = state.party[0].id
  const result = depositToBank(state, activeId, 'party')
  assert.ok('error' in result, 'the last party member cannot be banked')
})
