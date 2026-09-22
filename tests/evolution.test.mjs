import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { evolutionItems } = await import('../src/data/items.js')
const { evolutionData } = await import('../src/data/gameData.js')

/** Start a run so there is an owned Pokemon to evolve. */
function startedGame() {
  return gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
}

test('form-change items are reusable, ordinary evolution items are consumed', () => {
  const base = startedGame(),
    pokemonId = base.party[0].id,
    state = {
      ...base,
      inventory: { ...base.inventory, rotomCatalog: 1, fireStone: 1 },
    },
    reusable = gameReducer(state, {
      type: 'START_EVOLUTION',
      payload: {
        pokemonId,
        fromSpeciesKey: 'rotom',
        toSpeciesKey: 'h-rotom',
        consumeItem: 'rotomCatalog',
      },
    }),
    consumed = gameReducer(state, {
      type: 'START_EVOLUTION',
      payload: {
        pokemonId,
        fromSpeciesKey: 'vulpix',
        toSpeciesKey: 'ninetales',
        consumeItem: 'fireStone',
      },
    })
  assert.equal(reusable.phase, 'evolving')
  assert.equal(reusable.inventory.rotomCatalog, 1, 'the catalog is not consumed')
  assert.equal(consumed.inventory.fireStone, 0, 'the Fire Stone is consumed')
})

test('an evolution item must be owned to evolve', () => {
  const base = startedGame()
  assert.equal(
    gameReducer(base, {
      type: 'START_EVOLUTION',
      payload: {
        pokemonId: base.party[0].id,
        fromSpeciesKey: 'rotom',
        toSpeciesKey: 'rotom',
        consumeItem: 'rotomCatalog',
      },
    }).phase,
    'idle'
  )
})

test('form-change items are marked reusable and exist in the shop', async () => {
  const { tokenShopItems } = await import('../src/data/items.js'),
    shopIds = new Set(tokenShopItems.map((entry) => entry.itemId))
  for (const itemId of [
    'rotomCatalog',
    'griseousOrb',
    'gracidea',
    'meteorite',
    'revealGlass',
    'dnaSplicers',
    'zygardeCube',
    'prisonBottle',
    'nSolarizer',
    'nLunarizer',
    'ultranecroziumZ',
    'rustedSword',
    'rustedShield',
    'reinsOfUnity',
  ]) {
    assert.equal(evolutionItems[itemId]?.reusable, true, `${itemId} should be reusable`)
    assert.ok(shopIds.has(itemId), `${itemId} should be in the Reward Shop`)
  }
})

test('form transformations are item-gated in the data', () => {
  for (const speciesKey of ['rotom', 'deoxys', 'kyurem', 'necrozma', 'calyrex', 'zygarde']) {
    const edges = evolutionData[speciesKey] ?? []
    assert.ok(edges.length > 0, `${speciesKey} should have form transformations`)
    assert.ok(
      edges.every((edge) => edge.item || edge.level),
      `${speciesKey} edges need an item or level`
    )
    assert.ok(
      edges.some((edge) => edge.item),
      `${speciesKey} should use an item`
    )
  }
})
