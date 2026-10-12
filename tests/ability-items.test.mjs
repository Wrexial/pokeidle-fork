import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

/** A Kanto run whose starter has the given ability. */
function stateWithAbility(ability) {
  const base = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'pidgey' },
  })
  const member = { ...base.party[0], ability }
  return {
    ...base,
    party: [member],
    playerPokemon: member,
    inventory: { abilityCapsule: 3, abilityPatch: 3 },
  }
}

/** Use an item on the active Pokemon. */
function useItem(state, itemId) {
  return gameReducer(state, {
    type: 'USE_ITEM_ON_POKEMON',
    payload: { itemId, pokemonId: state.party[0].id },
  })
}

test('an Ability Capsule cycles the normal abilities', () => {
  // Pidgey has two normal abilities (Keen Eye / Tangled Feet) and one hidden.
  const start = stateWithAbility('keenEye'),
    toSecond = useItem(start, 'abilityCapsule')
  assert.equal(toSecond.party[0].ability, 'tangledFeet')
  assert.equal(toSecond.playerPokemon.ability, 'tangledFeet', 'the active Pokemon updates')
  assert.equal(toSecond.inventory.abilityCapsule, 2, 'the capsule is consumed')
  // Cycling wraps back around.
  assert.equal(useItem(toSecond, 'abilityCapsule').party[0].ability, 'keenEye')
})

test('an Ability Capsule turns a hidden ability into a normal one', () => {
  const patched = useItem(stateWithAbility('bigPecks'), 'abilityCapsule')
  assert.equal(patched.party[0].ability, 'keenEye')
})

test('an Ability Capsule does nothing when there is no second normal ability', () => {
  // Pikachu has a single normal ability (Static) plus a hidden one.
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'pikachu' },
    }),
    member = { ...base.party[0], ability: 'static' },
    state = { ...base, party: [member], playerPokemon: member, inventory: { abilityCapsule: 1 } },
    result = useItem(state, 'abilityCapsule')
  assert.equal(result, state, 'the item is not consumed and nothing changes')
})

test('an Ability Patch toggles the hidden ability', () => {
  const start = stateWithAbility('keenEye'),
    toHidden = useItem(start, 'abilityPatch')
  assert.equal(toHidden.party[0].ability, 'bigPecks')
  assert.equal(toHidden.inventory.abilityPatch, 2)
  // Using it again on the hidden ability switches back to a normal one.
  assert.equal(useItem(toHidden, 'abilityPatch').party[0].ability, 'keenEye')
})

test('an Ability Patch does nothing for a species with no hidden ability', () => {
  // Metapod has no hidden ability.
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'metapod' },
    }),
    member = { ...base.party[0], ability: 'shedSkin' },
    state = { ...base, party: [member], playerPokemon: member, inventory: { abilityPatch: 1 } },
    result = useItem(state, 'abilityPatch')
  assert.equal(result, state)
})

test('the Research Shop stocks the ability items and no evolution stones', async () => {
  const { RESEARCH_SHOP } = await import('../src/game/research.js'),
    ids = RESEARCH_SHOP.map((entry) => entry.itemId)
  assert.ok(ids.includes('abilityCapsule'))
  assert.ok(ids.includes('abilityPatch'))
  // Research-only held items.
  assert.ok(ids.includes('luckyEgg'))
  assert.ok(ids.includes('amuletCoin'))
  // The evolution stones live in the Kecleon Shop, so the Research Shop keeps
  // its own identity instead of restocking them.
  for (const stone of ['fireStone', 'waterStone', 'thunderStone', 'leafStone'])
    assert.ok(!ids.includes(stone), `the Research Shop should not sell ${stone}`)
})
