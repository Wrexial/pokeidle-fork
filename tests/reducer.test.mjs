import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { mapData } = await import('../src/data/gameData.js')

/** Start a Kanto run with Bulbasaur. */
function startedGame() {
  return gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
}

test('SELECT_STARTER sets up a Kanto run', () => {
  const state = startedGame()
  assert.equal(state.phase, 'idle')
  assert.equal(state.startRegion, 'kanto')
  assert.equal(state.party.length, 1)
  assert.equal(state.party[0].speciesKey, 'bulbasaur')
  assert.ok(state.pokedexCaught.includes('bulbasaur'))
  assert.ok(state.unlockedLocations.includes('palletTown'))
})

test('starting in a zone region opens the entry hub and its first area', () => {
  const state = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'alola', speciesKey: 'rowlet' },
  })
  assert.ok(state.unlockedLocations.includes('alola-iki-town'))
  assert.ok(state.unlockedLocations.includes('alola-melemele-island'), 'the zone hub opens')
  assert.ok(state.unlockedLocations.includes('alola-route-1'), 'the first sub-area opens')
  assert.equal(state.currentLocation, 'alola-route-1')
  assert.equal(state.currentRoute, 'alola-route-1')
})

test('UNLOCK_REGION opens a zone region entry hub and first area', () => {
  const base = {
    ...initialGameState,
    phase: 'idle',
    startRegion: 'kanto',
    unlockedRegions: ['kanto'],
    unlockedLocations: ['palletTown', 'route1'],
    defeatedChampions: ['kanto'],
  }
  for (const regionId of ['alola', 'paldea']) {
    const state = gameReducer(base, { type: 'UNLOCK_REGION', payload: { regionId } })
    assert.ok(state.unlockedRegions.includes(regionId))
    assert.ok(
      state.unlockedLocations.some(
        (id) => mapData[id]?.type === 'zone' && mapData[id].region === regionId
      ),
      `${regionId} opens its entry zone hub`
    )
    assert.ok(
      state.unlockedLocations.some(
        (id) => mapData[id]?.type === 'route' && mapData[id].region === regionId
      ),
      `${regionId} opens a wild route to play`
    )
  }
})

test('CATCH_POKEMON adds to the party and spends the ball', () => {
  const base = startedGame(),
    state = gameReducer(
      { ...base, inventory: { ...base.inventory, pokeball: 3 } },
      {
        type: 'CATCH_POKEMON',
        payload: { speciesKey: 'pidgey', level: 5, pokeballUsed: 'pokeball', isShiny: false },
      }
    )
  assert.ok(state.party.some((/** @type {any} */ member) => member.speciesKey === 'pidgey'))
  assert.equal(state.inventory.pokeball, 2)
  assert.equal(state.party.length, 2)
})

test('CATCH_POKEMON sends a catch to the box when the party is full', () => {
  const base = startedGame(),
    fullParty = Array.from({ length: 6 }, (_, index) => ({ ...base.party[0], id: String(index + 1) })),
    state = gameReducer(
      { ...base, party: fullParty, inventory: { ...base.inventory, pokeball: 1 } },
      {
        type: 'CATCH_POKEMON',
        payload: { speciesKey: 'rattata', level: 5, pokeballUsed: 'pokeball', isShiny: false },
      }
    )
  assert.ok(state.box.some((/** @type {any} */ member) => member.speciesKey === 'rattata'))
  assert.equal(state.party.length, 6)
})

test('the "newest" box sort prepends a new catch', () => {
  const base = startedGame(),
    fullParty = Array.from({ length: 6 }, (_, index) => ({ ...base.party[0], id: String(index + 1) })),
    existing = { ...base.party[0], id: '99', speciesKey: 'caterpie' },
    state = gameReducer(
      { ...base, party: fullParty, box: [existing], boxSort: 'newest' },
      { type: 'CATCH_POKEMON', payload: { speciesKey: 'pidgey', level: 5, isShiny: false } }
    )
  assert.equal(state.box[0].speciesKey, 'pidgey', 'the new catch should lead the box')
})

test('other box sorts still append', () => {
  const base = startedGame(),
    fullParty = Array.from({ length: 6 }, (_, index) => ({ ...base.party[0], id: String(index + 1) })),
    existing = { ...base.party[0], id: '99', speciesKey: 'caterpie' },
    state = gameReducer(
      { ...base, party: fullParty, box: [existing], boxSort: 'dex' },
      { type: 'CATCH_POKEMON', payload: { speciesKey: 'pidgey', level: 5, isShiny: false } }
    )
  assert.equal(state.box[state.box.length - 1].speciesKey, 'pidgey')
})

test('MARK_CAUGHT registers a new species and notifies', () => {
  const state = gameReducer(startedGame(), {
    type: 'MARK_CAUGHT',
    payload: { speciesKey: 'pidgey' },
  })
  assert.ok(state.pokedexCaught.includes('pidgey'))
  assert.ok(state.notifications.length >= 1)
})

test('a Master Ball throw always catches and returns to idle', () => {
  const base = startedGame(),
    battling = {
      ...base,
      inventory: { ...base.inventory, masterball: 1 },
      phase: 'battling',
      enemyPokemon: {
        speciesKey: 'pidgey',
        name: 'Pidgey',
        level: 7,
        currentHp: 20,
        maxHp: 20,
        isShiny: false,
      },
    },
    catching = gameReducer(battling, { type: 'THROW_MASTER_BALL' })
  assert.equal(catching.phase, 'catching')
  assert.equal(catching.inventory.masterball, 0)

  const caught = gameReducer(catching, { type: 'COMPLETE_MASTER_BALL' })
  assert.equal(caught.phase, 'idle')
  assert.equal(caught.enemyPokemon, null)
  assert.ok(caught.pokedexCaught.includes('pidgey'))
  assert.ok(caught.party.some((/** @type {any} */ member) => member.speciesKey === 'pidgey'))
})

test('the Master Ball cannot be thrown without one', () => {
  const base = startedGame(),
    battling = {
      ...base,
      phase: 'battling',
      enemyPokemon: { speciesKey: 'pidgey', name: 'Pidgey', level: 7, currentHp: 20, maxHp: 20 },
    }
  assert.equal(gameReducer(battling, { type: 'THROW_MASTER_BALL' }), battling)
})

test('the dex-completion celebration pauses and then resumes', () => {
  const base = startedGame(),
    celebrating = gameReducer(base, {
      type: 'START_DEX_CELEBRATION',
      payload: { generation: 0 },
    })
  assert.equal(celebrating.phase, 'dexComplete')
  assert.deepEqual(celebrating.dexCelebration, { generation: 0 })

  const resumed = gameReducer(celebrating, { type: 'COMPLETE_DEX_CELEBRATION' })
  assert.equal(resumed.phase, 'idle')
  assert.equal(resumed.dexCelebration, null)

  assert.equal(
    gameReducer(base, { type: 'START_DEX_CELEBRATION', payload: { generation: 'x' } }),
    base,
    'an invalid generation is ignored'
  )
})
