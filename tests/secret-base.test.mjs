import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  SECRET_BASE_BONUS_CAP,
  SECRET_BASE_DECORATIONS,
  SECRET_BASE_GRID,
  SECRET_BASE_RELOCATE_COST,
  SECRET_BASE_YIELD_PER_WIN,
  SECRET_BASE_YIELD_WIN_CAP,
  canPlaceAt,
  createSecretBase,
  decorationById,
  decorationUnlocked,
  isSecretBaseYieldReady,
  placeDecoration,
  removeDecoration,
  secretBaseBonuses,
  secretBaseDailyYield,
  tickSecretBase,
} = await import('../src/game/secret-base.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/save.js')
const { generateIVs } = await import('../src/game/pokemon.js')
const { todayKey } = await import('../src/data/daily-events.js')

test('secret base helpers place and lift decorations', () => {
  const base = { ...createSecretBase(), locationId: 'route1', inventory: { woodenDesk: 1 } }
  assert.equal(canPlaceAt(base, 0, 0), true)
  assert.equal(canPlaceAt(base, -1, 0), false)
  assert.equal(canPlaceAt(base, SECRET_BASE_GRID.width, 0), false)

  const placed = placeDecoration(base, 'woodenDesk', 0, 0)
  assert.deepEqual(placed?.placements, [{ decorationId: 'woodenDesk', x: 0, y: 0 }])
  assert.equal(placed?.inventory.woodenDesk, undefined)
  // The cell is now taken and there is no stock left.
  assert.equal(placeDecoration(placed, 'woodenDesk', 0, 0), null)
  assert.equal(placeDecoration(placed, 'pottedPlant', 1, 0), null)
  assert.equal(canPlaceAt(placed, 0, 0), false)

  const lifted = removeDecoration(placed, 0, 0)
  assert.deepEqual(lifted?.placements, [])
  assert.equal(lifted?.inventory.woodenDesk, 1)
  assert.equal(removeDecoration(placed, 5, 3), null)
})

test('passive bonuses sum placements and cap', () => {
  const empty = secretBaseBonuses(createSecretBase())
  assert.deepEqual(empty, { exp: 0, money: 0, catch: 0, shiny: 0 })

  let base = createSecretBase()
  base = { ...base, placements: [{ decorationId: 'bookshelf', x: 0, y: 0 }] }
  assert.equal(secretBaseBonuses(base).exp, 0.02)
  // Duplicating a decoration stacks, but the total is capped.
  base = {
    ...base,
    placements: [
      { decorationId: 'bookshelf', x: 0, y: 0 },
      { decorationId: 'bookshelf', x: 1, y: 0 },
    ],
  }
  assert.equal(secretBaseBonuses(base).exp, 0.04)
  base = {
    ...base,
    placements: Array.from({ length: 20 }, (_, index) => ({
      decorationId: 'bookshelf',
      x: index % 6,
      y: Math.floor(index / 6),
    })),
  }
  assert.equal(secretBaseBonuses(base).exp, SECRET_BASE_BONUS_CAP)
})

test('the daily yield grows with wild wins and resets on collect', () => {
  const base = { ...createSecretBase(), locationId: 'route1' },
    first = secretBaseDailyYield(base)
  assert.ok(first.money > 0)
  let ticked = base
  for (let battle = 0; battle < 10; battle++) ticked = tickSecretBase(ticked) ?? ticked
  assert.equal(ticked.yieldProgress, 10)
  assert.equal(
    secretBaseDailyYield(ticked).money,
    first.money + 10 * SECRET_BASE_YIELD_PER_WIN
  )
  // The bank stops growing past the cap.
  ticked = { ...ticked, yieldProgress: SECRET_BASE_YIELD_WIN_CAP }
  assert.equal(tickSecretBase(ticked), ticked)
  // An unplaced base never ticks.
  const empty = createSecretBase()
  assert.equal(tickSecretBase(empty), empty)
})

test('SETUP/BUY/PLACE/COLLECT flow through the reducer', () => {
  const state = {
      ...initialGameState,
      currentLocation: 'route1',
      money: 10_000,
      inventory: {},
    },
    set = gameReducer(state, { type: 'SETUP_SECRET_BASE', payload: { locationId: 'route1' } })
  assert.equal(set.secretBase.locationId, 'route1')
  assert.equal(set.money, 10_000, 'the first setup is free')

  // Relocating costs a fee.
  if (initialGameState.secretBase?.locationId !== 'route1') {
    const moved = gameReducer(set, {
      type: 'SETUP_SECRET_BASE',
      payload: { locationId: 'route2' },
    })
    assert.equal(moved.secretBase.locationId, 'route2')
    assert.equal(moved.money, 10_000 - SECRET_BASE_RELOCATE_COST)
  }

  const bought = gameReducer(set, {
    type: 'BUY_DECORATION',
    payload: { decorationId: 'woodenDesk' },
  })
  assert.equal(bought.secretBase.inventory.woodenDesk, 1)
  assert.ok(bought.money < set.money)

  const placed = gameReducer(bought, {
    type: 'PLACE_DECORATION',
    payload: { decorationId: 'woodenDesk', x: 2, y: 1 },
  })
  assert.equal(placed.secretBase.placements.length, 1)
  assert.equal(placed.secretBase.inventory.woodenDesk, undefined)

  const removed = gameReducer(placed, {
    type: 'REMOVE_DECORATION',
    payload: { x: 2, y: 1 },
  })
  assert.equal(removed.secretBase.placements.length, 0)
  assert.equal(removed.secretBase.inventory.woodenDesk, 1)

  // Collect pays the yield once per day.
  const ready = { ...placed, secretBase: { ...placed.secretBase, yieldProgress: 25 } }
  assert.equal(isSecretBaseYieldReady(ready.secretBase), true)
  const collected = gameReducer(ready, { type: 'COLLECT_SECRET_BASE_YIELD' })
  assert.ok(collected.money > ready.money)
  assert.equal(collected.secretBase.yieldProgress, 0)
  assert.equal(collected.secretBase.lastYieldDate, todayKey())
  assert.ok(collected.secretBaseCollect.money > 0)
  assert.equal(gameReducer(collected, { type: 'COLLECT_SECRET_BASE_YIELD' }), collected)
  assert.equal(
    gameReducer(collected, { type: 'DISMISS_SECRET_BASE_COLLECT' }).secretBaseCollect,
    null
  )

  // A trophy cannot be claimed before its milestone.
  const locked = gameReducer(set, {
    type: 'BUY_DECORATION',
    payload: { decorationId: 'championCup' },
  })
  assert.equal(locked.secretBase.inventory.championCup, undefined)
  const unlocked = gameReducer(
    { ...set, defeatedChampions: ['kanto'] },
    { type: 'BUY_DECORATION', payload: { decorationId: 'championCup' } }
  )
  assert.equal(unlocked.secretBase.inventory.championCup, 1)
  // It is unique: a second claim is refused.
  assert.equal(
    gameReducer(unlocked, { type: 'BUY_DECORATION', payload: { decorationId: 'championCup' } }),
    unlocked
  )
})

test('the base is only set up on a route', () => {
  const state = { ...initialGameState, currentLocation: 'palletTown', money: 5000 }
  assert.equal(
    gameReducer(state, { type: 'SETUP_SECRET_BASE', payload: { locationId: 'palletTown' } }),
    state
  )
  assert.ok(decorationById('woodenDesk'))
  assert.equal(decorationUnlocked(decorationById('woodenDesk'), state), true)
})

test('repairSave rebuilds the base and drops junk', () => {
  const save = (/** @type {Record<string, any>} */ secretBase) => ({
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
      secretBase,
    }),
    repaired = repairSave(
      save({
        locationId: 'route1',
        placements: [
          { decorationId: 'woodenDesk', x: 0, y: 0 },
          { decorationId: 'woodenDesk', x: 0, y: 0 },
          { decorationId: 'bogus', x: 1, y: 1 },
          { decorationId: 'pottedPlant', x: 99, y: 1 },
        ],
        inventory: {
          woodenDesk: 3,
          championCup: 5,
          bogus: 2,
        },
        lastYieldDate: '2020-01-01',
        yieldProgress: 99999,
        totalYield: 1234,
      })
    )
  assert.equal(repaired.secretBase.locationId, 'route1')
  assert.equal(repaired.secretBase.placements.length, 1, 'duplicate/out-of-bounds/junk dropped')
  assert.equal(repaired.secretBase.inventory.woodenDesk, 3)
  assert.equal(repaired.secretBase.inventory.championCup, 1, 'trophies are unique')
  assert.equal(repaired.secretBase.inventory.bogus, undefined)
  assert.equal(repaired.secretBase.yieldProgress, SECRET_BASE_YIELD_WIN_CAP)
  assert.equal(repaired.secretBase.totalYield, 1234)

  const legacy = repairSave(save(undefined))
  assert.deepEqual(legacy.secretBase, createSecretBase())
  assert.equal(SECRET_BASE_DECORATIONS.length >= 15, true)
})
