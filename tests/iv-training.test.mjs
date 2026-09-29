import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { calculatePokemonStats, createPokemon, getPerfectIVs } = await import(
  '../src/game/pokemon.js'
)
const { pokemonSpecies } = await import('../src/data/gameData.js')
const { inheritIVs } = await import('../src/game/breeding.js')

const SPREAD = { hp: 5, attack: 10, defense: 31, spAttack: 0, spDefense: 20, speed: 15 }

/** A party of one Charmander with a spread of IVs. */
function party() {
  const member = { ...createPokemon('charmander', 50, 'iv-test'), ivs: { ...SPREAD } }
  return {
    ...initialGameState,
    phase: 'idle',
    party: [member],
    playerPokemon: member,
    inventory: { bottleCap: 1, goldBottleCap: 1 },
  }
}

/** @param {any} state @param {string} itemId */
const use = (state, itemId) =>
  gameReducer(state, {
    type: 'USE_ITEM_ON_POKEMON',
    payload: { itemId, pokemonId: 'iv-test' },
  })

test('a Bottle Cap caps the lowest IV only', () => {
  const next = use(party(), 'bottleCap'),
    member = next.party[0]
  assert.equal(member.ivs.spAttack, 31, 'the lowest IV is capped')
  assert.equal(member.ivs.attack, 10, 'the others are untouched')
  assert.equal(next.inventory.bottleCap, 0, 'the cap is consumed')
  assert.equal(member.naturalIvs.spAttack, 0, 'the pre-training IVs are kept')
})

test('a Gold Bottle Cap caps every IV', () => {
  const member = use(party(), 'goldBottleCap').party[0]
  for (const stat of ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'])
    assert.equal(member.ivs[stat], 31, `${stat} is capped`)
})

test('hyper training recomputes the stat block and max HP', () => {
  const next = use(party(), 'goldBottleCap'),
    member = next.party[0],
    expected = calculatePokemonStats(pokemonSpecies.charmander, 50, getPerfectIVs(), member.nature)
  assert.equal(member.maxHp, expected.hp)
  assert.equal(member.attack, expected.attack)
  assert.equal(member.speed, expected.speed)
  assert.ok(member.currentHp <= member.maxHp)
})

test('a fully trained Pokemon refuses another cap without consuming it', () => {
  const perfect = { ...createPokemon('charmander', 50, 'iv-perfect'), ivs: getPerfectIVs() },
    next = gameReducer(
      {
        ...initialGameState,
        phase: 'idle',
        party: [perfect],
        playerPokemon: perfect,
        inventory: { goldBottleCap: 1 },
      },
      {
        type: 'USE_ITEM_ON_POKEMON',
        payload: { itemId: 'goldBottleCap', pokemonId: 'iv-perfect' },
      }
    )
  assert.equal(next.inventory.goldBottleCap, 1)
})

test('hyper-trained IVs are not passed down by breeding', () => {
  const zero = Object.fromEntries(Object.keys(getPerfectIVs()).map((stat) => [stat, 0])),
    originalRandom = Math.random
  try {
    const fixed = () => 0.5
    Math.random = fixed
    const trained = inheritIVs([{ ivs: getPerfectIVs(), naturalIvs: { ...zero } }])
    Math.random = fixed
    const untrained = inheritIVs([{ ivs: { ...zero } }])
    assert.deepEqual(trained, untrained, 'the trained 31s are ignored')
  } finally {
    Math.random = originalRandom
  }
})
