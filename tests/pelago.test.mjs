import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const {
  PELAGO_ISLANDS,
  PELAGO_MAX_READY,
  PELAGO_SLOTS,
  createPelago,
  grantExperience,
  tickPelago,
} = await import('../src/game/pelago.js')
const { MINIGAME_LOCATIONS, POI_LOCATIONS } = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/save.js')
const { createPokemon, generateIVs } = await import('../src/game/pokemon.js')
const { mapData } = gameData

test('Poké Pelago is an Alola map POI', () => {
  assert.equal(MINIGAME_LOCATIONS['alola-poke-pelago'], 'pokePelago')
  assert.ok(POI_LOCATIONS.has('alola-poke-pelago'))
  const location = mapData['alola-poke-pelago']
  assert.ok(location, 'the Pelago location exists')
  assert.equal(location.region, 'alola')
  assert.ok(location.connections.includes('alola-hauoli-city'))
  assert.equal(encounterBucket(location.routeKey), undefined, 'Pelago has no wild encounters')
})

/** @param {string} routeKey */
function encounterBucket(routeKey) {
  return gameData.mapEncounterData[routeKey]
}

test('the passive islands tick and bank a completed cycle', () => {
  const pelago = createPelago()
  assert.deepEqual(Object.keys(pelago), Object.keys(PELAGO_ISLANDS))
  pelago.beans.assigned = ['a', 'b']
  let next = pelago
  for (let battle = 0; battle < PELAGO_ISLANDS.beans.goal; battle++) next = tickPelago(next)
  assert.equal(next.beans.ready, 1)
  assert.equal(next.beans.progress, 0)
  assert.equal(next.training.ready, 0, 'an unstaffed island does nothing')
  // Banked rewards cap out.
  next = { ...next, beans: { ...next.beans, ready: PELAGO_MAX_READY } }
  for (let battle = 0; battle < PELAGO_ISLANDS.beans.goal * 2; battle++) next = tickPelago(next)
  assert.equal(next.beans.ready, PELAGO_MAX_READY)
})

test('grantExperience levels a Pokemon up', () => {
  const member = createPokemon('magikarp', 5, 'a'),
    trained = grantExperience(member, 5000)
  assert.ok(trained.level > member.level, 'it gained levels')
  assert.ok(trained.totalExp > member.totalExp)
  assert.ok(trained.maxHp >= member.maxHp)
})

test('ASSIGN/UNASSIGN staff the islands with boxed Pokemon only', () => {
  const boxMember = createPokemon('geodude', 20, 'boxed'),
    partyMember = createPokemon('pikachu', 20, 'party'),
    base = { ...initialGameState, box: [boxMember], party: [partyMember] },
    assigned = gameReducer(base, {
      type: 'ASSIGN_PELAGO',
      payload: { islandId: 'beans', pokemonId: 'boxed' },
    })
  assert.deepEqual(assigned.pelago.beans.assigned, ['boxed'])

  // A party Pokemon and an unknown id are refused.
  assert.equal(
    gameReducer(base, { type: 'ASSIGN_PELAGO', payload: { islandId: 'beans', pokemonId: 'party' } }),
    base
  )
  assert.equal(
    gameReducer(base, { type: 'ASSIGN_PELAGO', payload: { islandId: 'beans', pokemonId: 'nope' } }),
    base
  )
  // The same Pokemon cannot work two islands.
  assert.equal(
    gameReducer(assigned, {
      type: 'ASSIGN_PELAGO',
      payload: { islandId: 'caves', pokemonId: 'boxed' },
    }),
    assigned
  )

  const removed = gameReducer(assigned, {
    type: 'UNASSIGN_PELAGO',
    payload: { islandId: 'beans', pokemonId: 'boxed' },
  })
  assert.deepEqual(removed.pelago.beans.assigned, [])
})

test('COLLECT_PELAGO pays out each island', () => {
  const boxMember = createPokemon('magikarp', 5, 'a'),
    base = {
      ...initialGameState,
      box: [boxMember],
      party: [createPokemon('pikachu', 20, 'p')],
      inventory: {},
    },
    withReady = (/** @type {string} */ islandId) => ({
      ...base,
      pelago: {
        ...base.pelago,
        [islandId]: { assigned: ['a'], progress: 0, ready: 2 },
      },
    })

  const beans = gameReducer(withReady('beans'), {
    type: 'COLLECT_PELAGO',
    payload: { islandId: 'beans' },
  })
  assert.equal(beans.inventory.pokebean, 2 * 2 * 1, 'beans scale with workers and completions')
  assert.equal(beans.pelago.beans.ready, 0)

  const training = gameReducer(withReady('training'), {
    type: 'COLLECT_PELAGO',
    payload: { islandId: 'training' },
  })
  assert.ok(
    training.box[0].totalExp > base.box[0].totalExp,
    'the assigned boxed Pokemon trained'
  )

  const caves = gameReducer(withReady('caves'), {
    type: 'COLLECT_PELAGO',
    payload: { islandId: 'caves' },
  })
  const gained = Object.values(caves.inventory).reduce((sum, count) => sum + count, 0)
  assert.ok(gained > 0, 'the caves produced items')

  // Collecting with nothing banked is a no-op.
  assert.equal(
    gameReducer(base, { type: 'COLLECT_PELAGO', payload: { islandId: 'beans' } }),
    base
  )
})

test('repairSave rebuilds the islands and drops stale assignments', () => {
  const save = (/** @type {Record<string, any>} */ pelago) => ({
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
      pelago,
    }),
    repaired = repairSave(
      save({
        beans: { assigned: ['a', 'ghost'], progress: 9, ready: 999 },
        caves: { assigned: [], progress: -3, ready: -1 },
        bogus: { assigned: ['a'] },
      })
    )
  assert.deepEqual(repaired.pelago.beans.assigned, ['a'], 'stale ids are dropped')
  assert.equal(repaired.pelago.beans.ready, PELAGO_MAX_READY, 'ready is clamped')
  assert.equal(repaired.pelago.caves.progress, 0)
  assert.equal(repaired.pelago.bogus, undefined, 'unknown islands are dropped')
  assert.equal(PELAGO_SLOTS, 3)
})
