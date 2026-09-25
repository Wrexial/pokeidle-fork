import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { getEvolutionOptions } = await import('../src/game/breeding.js')

test('Gigantamax and form-item transforms are flagged as form changes', () => {
  const rotom = getEvolutionOptions({ speciesKey: 'rotom', level: 50 }, {})
  assert.ok(rotom.length > 0, 'Rotom has appliance forms')
  assert.ok(
    rotom.every((entry) => entry.isForm),
    'every Rotom appliance is a form change, not an evolution'
  )

  const giratina = getEvolutionOptions({ speciesKey: 'giratina', level: 50 }, {}),
    origin = giratina.find((entry) => entry.targetKey === 'giratina-o')
  assert.ok(origin?.isForm, 'Giratina-Origin is a form change')

  const charizard = getEvolutionOptions({ speciesKey: 'charizard', level: 100 }, {})
  assert.ok(
    charizard.some((entry) => entry.targetKey === 'gx-charizard' && entry.isForm),
    'Gigantamax Charizard is a form change'
  )
  assert.ok(
    !charizard.some((entry) => entry.targetKey.startsWith('m-')),
    'Mega forms stay filtered out'
  )
})

test('real evolutions and regional evolutions are not form changes', () => {
  const pikachu = getEvolutionOptions({ speciesKey: 'pikachu', level: 50 }, { thunderStone: 1 }),
    raichu = pikachu.find((entry) => entry.targetKey === 'raichu')
  assert.ok(raichu && raichu.isForm === false, 'a stone evolution is a real evolution')
  assert.ok(
    pikachu.some((entry) => entry.targetKey === 'gx-pikachu' && entry.isForm),
    'Gigantamax Pikachu is still a form change'
  )

  const rattata = getEvolutionOptions({ speciesKey: 'a-rattata', level: 20 }, {})
  assert.ok(rattata.length > 0, 'Alolan Rattata evolves')
  assert.ok(
    rattata.every((entry) => !entry.isForm),
    'Alolan Raticate is a real evolution, not a form change'
  )
})
