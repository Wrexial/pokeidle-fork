import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  BLEND_BERRY_COST,
  BLEND_RESULT_ITEM,
  GARDEN_BERRIES,
  GARDEN_PLOTS,
  createGarden,
  isPlantableBerry,
  isPlotReady,
  rollHarvest,
  tickGarden,
} = await import('../src/game/garden.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/save.js')
const { createPokemon, generateIVs } = await import('../src/game/pokemon.js')

test('garden helpers', () => {
  const garden = createGarden()
  assert.equal(garden.plots.length, GARDEN_PLOTS)
  assert.ok(garden.plots.every((plot) => plot === null))
  assert.equal(isPlantableBerry('oranBerry'), true)
  assert.equal(isPlantableBerry('pokeball'), false)
  assert.equal(isPlotReady(null), false)

  const growing = {
    ...garden,
    plots: [{ berryId: 'oranBerry', battlesRemaining: 2 }, null, null, null],
  }
  const ticked = tickGarden(growing)
  assert.equal(ticked.plots[0].battlesRemaining, 1)
  const ripe = tickGarden(ticked)
  assert.equal(ripe.plots[0].battlesRemaining, 0)
  assert.equal(isPlotReady(ripe.plots[0]), true)
  assert.equal(tickGarden(ripe), ripe, 'a ripe plot stops changing')

  for (let roll = 0; roll < 40; roll++) {
    const quantity = rollHarvest('oranBerry')
    assert.ok(quantity >= GARDEN_BERRIES.oranBerry.minYield)
    assert.ok(quantity <= GARDEN_BERRIES.oranBerry.maxYield)
  }
  assert.equal(rollHarvest('nonsense'), 0)
})

test('PLANT_BERRY consumes a berry into an empty plot', () => {
  const base = {
      ...initialGameState,
      inventory: { oranBerry: 2 },
    },
    planted = gameReducer(base, {
      type: 'PLANT_BERRY',
      payload: { plotIndex: 0, berryId: 'oranBerry' },
    })
  assert.equal(planted.inventory.oranBerry, 1)
  assert.deepEqual(planted.garden.plots[0], {
    berryId: 'oranBerry',
    battlesRemaining: GARDEN_BERRIES.oranBerry.growBattles,
  })

  // Occupied plot, no stock, and an unknown berry are all refused.
  assert.equal(
    gameReducer(planted, { type: 'PLANT_BERRY', payload: { plotIndex: 0, berryId: 'oranBerry' } }),
    planted
  )
  assert.equal(
    gameReducer(
      { ...base, inventory: {} },
      { type: 'PLANT_BERRY', payload: { plotIndex: 0, berryId: 'oranBerry' } }
    ).garden.plots[0],
    null
  )
  assert.equal(
    gameReducer(base, { type: 'PLANT_BERRY', payload: { plotIndex: 0, berryId: 'pokeball' } }),
    base
  )
})

test('HARVEST_BERRY only pays out a ripe plot', () => {
  const ready = {
      ...initialGameState,
      inventory: {},
      garden: {
        plots: [{ berryId: 'sitrusBerry', battlesRemaining: 0 }, null, null, null],
      },
    },
    harvested = gameReducer(ready, { type: 'HARVEST_BERRY', payload: { plotIndex: 0 } })
  assert.equal(harvested.garden.plots[0], null)
  assert.ok(harvested.inventory.sitrusBerry >= GARDEN_BERRIES.sitrusBerry.minYield)
  assert.ok(harvested.inventory.sitrusBerry <= GARDEN_BERRIES.sitrusBerry.maxYield)

  const growing = {
    ...ready,
    garden: { plots: [{ berryId: 'sitrusBerry', battlesRemaining: 3 }, null, null, null] },
  }
  assert.equal(gameReducer(growing, { type: 'HARVEST_BERRY', payload: { plotIndex: 0 } }), growing)
})

test('repairSave rebuilds the garden and validates the companion', () => {  const save = (/** @type {Record<string, any>} */ overrides) => ({
      version: 2,
      playerPokemon: {
        id: 'a',
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
      ...overrides,
    }),
    repaired = repairSave(
      save({
        companion: { id: 'a', fullness: 40, happiness: 500, energy: -5, careBattle: 3 },
        garden: {
          plots: [
            { berryId: 'oranBerry', battlesRemaining: 9 },
            { berryId: 'pokeball', battlesRemaining: 1 },
            'junk',
          ],
        },
      })
    )
  assert.equal(repaired.companion.id, 'a')
  assert.equal(repaired.companion.happiness, 100, 'care is clamped')
  assert.equal(repaired.companion.energy, 0)
  assert.equal(repaired.garden.plots.length, GARDEN_PLOTS)
  assert.deepEqual(repaired.garden.plots[0], { berryId: 'oranBerry', battlesRemaining: 9 })
  assert.equal(repaired.garden.plots[1], null, 'unknown berries are dropped')

  // A companion that no longer exists is cleared.
  assert.equal(repairSave(save({ companion: { id: 'gone' } })).companion.id, null)
  // Older saves with no companion/garden get safe defaults.
  const legacy = repairSave(save({}))
  assert.equal(legacy.companion.id, null)
  assert.equal(legacy.garden.plots.length, GARDEN_PLOTS)
})

test('BLEND_BERRIES turns berries into a Poffin', () => {
  const base = { ...initialGameState, inventory: { oranBerry: BLEND_BERRY_COST } },
    blended = gameReducer(base, { type: 'BLEND_BERRIES', payload: { berryId: 'oranBerry' } })
  assert.equal(blended.inventory.oranBerry, 0)
  assert.equal(blended.inventory[BLEND_RESULT_ITEM], 1)

  const short = { ...initialGameState, inventory: { oranBerry: BLEND_BERRY_COST - 1 } }
  assert.equal(gameReducer(short, { type: 'BLEND_BERRIES', payload: { berryId: 'oranBerry' } }), short)
  assert.equal(
    gameReducer(base, { type: 'BLEND_BERRIES', payload: { berryId: 'pokeball' } }),
    base
  )
})

test('a Poffin raises friendship and is used up', () => {
  const member = { ...createPokemon('eevee', 10, 'a'), friendship: 100 },
    state = {
      ...initialGameState,
      party: [member],
      playerPokemon: member,
      inventory: { [BLEND_RESULT_ITEM]: 1 },
    },
    used = gameReducer(state, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: BLEND_RESULT_ITEM, pokemonId: 'a' },
    })
  assert.equal(used.party[0].friendship, 130)
  assert.equal(used.inventory[BLEND_RESULT_ITEM], 0)
})
