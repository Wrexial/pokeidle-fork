import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { bagCategories, fossilItems } = await import('../src/data/items.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { encounterData, pokemonSpecies } = await import('../src/data/gameData.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { rewardItemName, rollMiningReward } = await import('../src/game/minigames.js')

const FOSSIL_FINALS = [
  'omastar',
  'kabutops',
  'aerodactyl',
  'cradily',
  'armaldo',
  'rampardos',
  'bastiodon',
  'carracosta',
  'archeops',
  'tyrantrum',
  'aurorus',
  'dracozolt',
  'arctozolt',
  'dracovish',
  'arctovish',
]

test('every fossil maps to a real species and a bag category', () => {
  assert.ok(bagCategories.some((category) => category.id === 'fossils'))
  for (const fossil of Object.values(fossilItems)) {
    assert.ok(pokemonSpecies[fossil.speciesKey], `${fossil.id} species exists`)
    assert.ok(fossil.level >= 1 && fossil.level <= 100, `${fossil.id} has a valid level`)
    assert.equal(rewardItemName(fossil.id), fossil.name)
  }
})

test('fossil finals come from reviving, not wild routes', () => {
  const wild = new Set()
  for (const bucket of Object.values(encounterData ?? {}))
    for (const encounter of bucket.encounters ?? []) wild.add(encounter.speciesKey)
  for (const key of FOSSIL_FINALS)
    assert.ok(!wild.has(key), `${key} should be revived, not found in the wild`)
})

test('a fossil revives at Cinnabar Island and is consumed', () => {
  const fossil = fossilItems.helixFossil,
    active = createPokemon('charmander', 40, 'fossil-test'),
    base = {
      ...initialGameState,
      phase: 'idle',
      currentLocation: 'cinnabarIsland',
      party: [active],
      playerPokemon: active,
      inventory: { ...initialGameState.inventory, helixFossil: 2 },
    },
    revived = gameReducer(base, { type: 'REVIVE_FOSSIL', payload: { itemId: 'helixFossil' } })
  assert.equal(revived.inventory.helixFossil, 1, 'one fossil is consumed')
  const member = [...revived.party, ...revived.box].find(
    (pokemon) => pokemon.speciesKey === fossil.speciesKey
  )
  assert.ok(member, 'the revived Pokemon joins the squad')
  assert.equal(member.level, fossil.level)
  assert.ok(revived.pokedexCaught.includes(fossil.speciesKey))
})

test('fossils cannot be revived away from Cinnabar Island', () => {
  const base = {
    ...initialGameState,
    phase: 'idle',
    currentLocation: 'palletTown',
    inventory: { ...initialGameState.inventory, helixFossil: 1 },
  }
  assert.equal(
    gameReducer(base, { type: 'REVIVE_FOSSIL', payload: { itemId: 'helixFossil' } }),
    base,
    'the revive is refused outside the lab'
  )
})

test('the Sinnoh Underground can drop fossils', () => {
  const fossilIds = new Set(Object.keys(fossilItems))
  let found = false
  for (let roll = 0; roll < 5000 && !found; roll++)
    found = fossilIds.has(rollMiningReward().itemId)
  assert.ok(found, 'mining eventually yields a fossil')
})
