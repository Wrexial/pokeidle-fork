import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { MEGA_STONE_ITEM, MEGA_FORMS, chooseMegaForm, isMegaForm, isMegaOrPrimalForm, isPrimalForm, megaAbility, megaEvolveReady, megaFormsFor } = await import(
  '../src/data/mega-evolution.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { getEvolutionOptions } = await import('../src/game/breeding.js')
const { heldItems } = await import('../src/data/items.js')

/** A battling state with `pokemon` as the active, optionally stone-holding, Pokemon. */
function battlingState(speciesKey, level, heldItem) {
  const pokemon = createPokemon(speciesKey, level, 'mega-test')
  if (heldItem) pokemon.heldItem = heldItem
  return {
    ...initialGameState,
    phase: 'battling',
    party: [pokemon],
    playerPokemon: pokemon,
    enemyPokemon: { speciesKey: 'pidgey', level: 5 },
    playerVolatile: null,
  }
}

test('Mega forms are discovered from the evolution table', () => {
  assert.ok(Object.keys(MEGA_FORMS).length > 30, 'plenty of Megas are modelled')
  assert.deepEqual(megaFormsFor('charizard'), ['m-charizard x', 'm-charizard y'])
  assert.equal(megaFormsFor('lucario').length, 1)
  assert.equal(megaFormsFor('pikachu').length, 0)
  assert.ok(isMegaForm('m-charizard x'))
  assert.ok(!isMegaForm('charizard'))
})

test('a two-Mega species picks X for physical and Y for special', () => {
  assert.equal(chooseMegaForm('charizard', { attack: 200, spAttack: 100 }), 'm-charizard x')
  assert.equal(chooseMegaForm('charizard', { attack: 100, spAttack: 200 }), 'm-charizard y')
  assert.equal(chooseMegaForm('lucario', { attack: 1, spAttack: 1 }), 'm-lucario')
  assert.equal(chooseMegaForm('pikachu', { attack: 1, spAttack: 1 }), null)
})

test('Mega forms carry their own ability', () => {
  assert.equal(megaAbility('m-charizard y'), 'drought')
  assert.equal(megaAbility('m-lucario'), 'adaptability')
})

test('the Mega Stone is a holdable item', () => {
  assert.equal(MEGA_STONE_ITEM, 'megaStone')
  assert.ok(heldItems.megaStone)
  assert.equal(heldItems.megaStone.effect.type, 'megaEvolve')
})

test('megaEvolveReady only allows a stone holder that can evolve', () => {
  const ready = { playerPokemon: { speciesKey: 'charizard', heldItem: 'megaStone' }, playerVolatile: null },
    noStone = { playerPokemon: { speciesKey: 'charizard', heldItem: null }, playerVolatile: null },
    noMega = { playerPokemon: { speciesKey: 'pikachu', heldItem: 'megaStone' }, playerVolatile: null },
    done = {
      playerPokemon: { speciesKey: 'charizard', heldItem: 'megaStone' },
      playerVolatile: { formKey: 'm-charizard x' },
    }
  assert.equal(megaEvolveReady(ready), true)
  assert.equal(megaEvolveReady(noStone), false)
  assert.equal(megaEvolveReady(noMega), false)
  assert.equal(megaEvolveReady(done), false)
})

test('MEGA_EVOLVE transforms the active battler and its ability', () => {
  const state = battlingState('charizard', 60, 'megaStone'),
    next = gameReducer(state, { type: 'MEGA_EVOLVE' })
  // Charizard's Sp. Atk is higher, so it takes the special Y forme.
  assert.equal(next.playerVolatile.formKey, 'm-charizard y')
  assert.equal(next.playerVolatile.abilityOverride, 'drought')
  assert.ok(next.battleLog.some((line) => /Mega Evolved/.test(line)))
  // The saved Pokemon is untouched; the change is battle-only.
  assert.equal(next.playerPokemon.speciesKey, 'charizard')
})

test('MEGA_EVOLVE refuses without a stone or without a Mega form', () => {
  const noStone = gameReducer(battlingState('charizard', 60, null), { type: 'MEGA_EVOLVE' }),
    noMega = gameReducer(battlingState('pikachu', 60, 'megaStone'), { type: 'MEGA_EVOLVE' })
  assert.equal(noStone.playerVolatile, null)
  assert.equal(noMega.playerVolatile, null)
})

test('Primal Groudon and Kyogre are held-stone battle forms', () => {
  assert.deepEqual(megaFormsFor('groudon'), ['p-groudon'])
  assert.deepEqual(megaFormsFor('kyogre'), ['p-kyogre'])
  assert.ok(isPrimalForm('p-groudon'))
  assert.ok(isMegaOrPrimalForm('p-kyogre'))
  // Paldean regional forms share the `p-` prefix but are not primal forms.
  assert.ok(!isPrimalForm('p-tauros'))
  assert.equal(megaFormsFor('p-tauros').length, 0)
})

test('Groudon transforms into Primal Groudon with the Mega Stone', () => {
  const state = battlingState('groudon', 60, 'megaStone'),
    next = gameReducer(state, { type: 'MEGA_EVOLVE' })
  assert.equal(next.playerVolatile.formKey, 'p-groudon')
  assert.equal(next.playerVolatile.abilityOverride, 'desolateLand')
  assert.ok(next.battleLog.some((line) => /Primal Reverted/.test(line)))
})

test('Mega and Primal forms are not offered as level-100 evolutions', () => {
  const charizard = getEvolutionOptions({ speciesKey: 'charizard', level: 100 }, {}),
    groudon = getEvolutionOptions({ speciesKey: 'groudon', level: 100 }, {})
  assert.ok(!charizard.some((entry) => entry.targetKey.startsWith('m-')))
  assert.equal(groudon.length, 0, 'Groudon has no ordinary evolution left')
})

test('a Pokemon can only Mega Evolve once per battle', () => {
  const once = gameReducer(battlingState('lucario', 60, 'megaStone'), { type: 'MEGA_EVOLVE' }),
    twice = gameReducer(once, { type: 'MEGA_EVOLVE' })
  assert.equal(once.playerVolatile.formKey, 'm-lucario')
  assert.equal(twice, once, 'the second attempt is ignored')
})

test('ending the battle clears the Mega form', () => {
  const evolved = gameReducer(battlingState('lucario', 60, 'megaStone'), { type: 'MEGA_EVOLVE' }),
    ended = gameReducer(evolved, { type: 'PHASE_IDLE' })
  assert.equal(ended.playerVolatile, null)
  assert.equal(ended.playerPokemon.speciesKey, 'lucario')
})
