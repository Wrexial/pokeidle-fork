// Field evolutions: an evolution can require the player's current location,
// its biome and/or the field weather (Moss Rock, Ice Rock, Magnetic Field,
// rain). The party/box evolve UI checks the gate and shows the hint.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { getEvolutionOptions } = await import('../src/game/breeding.js')
const { fieldEvolutionMet, fieldEvolutionRequirements } = await import(
  '../src/game/pokemon.js'
)
const { evolutionData } = await import('../src/data/gameData.js')

const FOREST = {
    locationId: 'eternaForest',
    locationName: 'Eterna Forest',
    biome: 'forest',
    weather: null,
  },
  CAVE = { locationId: 'chargestoneCave', locationName: 'Chargestone Cave', biome: 'cave', weather: null },
  TOWN = { locationId: 'palletTown', locationName: 'Pallet Town', biome: 'town', weather: null }

test('field evolutions are gated in the data', () => {
  const leafeon = evolutionData.eevee.find((entry) => entry.into === 'leafeon'),
    glaceon = evolutionData.eevee.find((entry) => entry.into === 'glaceon')
  assert.equal(leafeon?.biome, 'forest')
  assert.equal(glaceon?.biome, 'tundra')
  // The field method replaces Eevee's stone method, so the stones don't
  // silently outshine it.
  assert.equal(leafeon?.item, undefined, 'the Leaf Stone no longer evolves Eevee')
  assert.equal(glaceon?.item, undefined, 'the Ice Stone no longer evolves Eevee')
  assert.equal(evolutionData.magneton.find((entry) => entry.into === 'magnezone')?.biome, 'cave')
  assert.equal(evolutionData.nosepass.find((entry) => entry.into === 'probopass')?.biome, 'cave')
  assert.equal(evolutionData.sliggoo.find((entry) => entry.into === 'goodra')?.weather, 'rain')
})

test('the Moss Rock gate needs a forest and shows its hint', () => {
  const eevee = { speciesKey: 'eevee', level: 50, friendship: 70 }
  const leafeon = getEvolutionOptions(eevee, {}, FOREST).find((entry) => entry.targetKey === 'leafeon')
  assert.equal(leafeon?.canEvolve, true)
  assert.equal(leafeon?.requirementLabel, 'Level up near a Moss Rock (forest)')

  const blocked = getEvolutionOptions(eevee, {}, TOWN).find((entry) => entry.targetKey === 'leafeon')
  assert.equal(blocked?.canEvolve, false)
  // The hint is still shown while the gate is unmet, so it is discoverable.
  assert.equal(blocked?.requirementLabel, 'Level up near a Moss Rock (forest)')
})

test('the Magnetic Field gate needs a cave', () => {
  const magneton = { speciesKey: 'magneton', level: 45 }
  assert.equal(
    getEvolutionOptions(magneton, {}, CAVE).find((entry) => entry.targetKey === 'magnezone')?.canEvolve,
    true
  )
  assert.equal(
    getEvolutionOptions(magneton, {}, TOWN).find((entry) => entry.targetKey === 'magnezone')?.canEvolve,
    false
  )
})

test('the rain gate follows the field weather', () => {
  const sliggoo = { speciesKey: 'sliggoo', level: 60 }
  const rainy = getEvolutionOptions(sliggoo, {}, { ...TOWN, weather: 'rain' }),
    clear = getEvolutionOptions(sliggoo, {}, { ...TOWN, weather: null })
  assert.equal(rainy.find((entry) => entry.targetKey === 'goodra')?.canEvolve, true)
  assert.equal(clear.find((entry) => entry.targetKey === 'goodra')?.canEvolve, false)
  assert.equal(
    clear.find((entry) => entry.targetKey === 'goodra')?.requirementLabel,
    'Lv. 50 + Level up while it is raining',
    'the level gate and the weather hint both show'
  )
})

test('fieldEvolutionMet is an AND over location, biome and weather', () => {
  assert.equal(fieldEvolutionMet({ into: 'x' }, null), true, 'no gate means always met')
  assert.equal(fieldEvolutionMet({ into: 'x', biome: 'forest' }, { biome: 'forest' }), true)
  assert.equal(fieldEvolutionMet({ into: 'x', biome: 'forest' }, { biome: 'cave' }), false)
  assert.equal(fieldEvolutionMet({ into: 'x', biome: 'forest' }, null), false)
  const both = { into: 'x', location: 'mtCoronet', weather: 'rain' }
  assert.equal(
    fieldEvolutionMet(both, { locationId: 'mtCoronet', weather: 'rain' }),
    true
  )
  assert.equal(
    fieldEvolutionMet(both, { locationId: 'mtCoronet', weather: 'sun' }),
    false,
    'every gate present must match'
  )
})

test('generic field requirements read naturally without a hint', () => {
  assert.deepEqual(fieldEvolutionRequirements({ into: 'x', biome: 'cave' }, {}), ['In a cave'])
  assert.deepEqual(
    fieldEvolutionRequirements({ into: 'x', location: 'victoryRoad' }, { locationName: 'Victory Road' }),
    ['At Victory Road']
  )
  assert.deepEqual(fieldEvolutionRequirements({ into: 'x', weather: 'snow' }, {}), ['During snow'])
  assert.deepEqual(fieldEvolutionRequirements({ into: 'x' }, {}), [])
})
