import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { applyEntryHazards, emptyHazards } = await import('../src/game/hazards.js')
const { resolveBattleTurn } = await import('../src/game/combat.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')

/**
 * @param {Record<string, any>} [overrides]
 * @returns {any}
 */
function battler(overrides = {}) {
  return {
    speciesKey: 'pidgey',
    name: 'Pidgey',
    types: ['Normal', 'Flying'],
    level: 50,
    currentHp: 400,
    maxHp: 400,
    attack: 150,
    defense: 120,
    spAttack: 150,
    spDefense: 120,
    speed: 80,
    moves: ['splash'],
    isPlayer: false,
    ...overrides,
  }
}

/** @param {number} value @param {() => void} body */
function withFixedRandom(value, body) {
  const originalRandom = Math.random
  try {
    Math.random = () => value
    body()
  } finally {
    Math.random = originalRandom
  }
}

test('Stealth Rock scales with the Rock weakness', () => {
  const neutral = applyEntryHazards(
      { ...emptyHazards(), stealthRock: true },
      battler({ types: ['Normal'] })
    ),
    weak = applyEntryHazards(
      { ...emptyHazards(), stealthRock: true },
      battler({ types: ['Fire', 'Flying'] })
    )
  assert.equal(neutral.damage, 50, '1/8 max HP')
  assert.ok(weak.damage > neutral.damage, '4x weak takes more')
})

test('Spikes damage rises with each layer and misses Flying types', () => {
  const one = applyEntryHazards({ ...emptyHazards(), spikes: 1 }, battler({ types: ['Normal'] })),
    three = applyEntryHazards({ ...emptyHazards(), spikes: 3 }, battler({ types: ['Normal'] })),
    flying = applyEntryHazards({ ...emptyHazards(), spikes: 3 }, battler())
  assert.equal(one.damage, 50)
  assert.equal(three.damage, 100)
  assert.equal(flying.damage, 0, 'Flying types are immune to Spikes')
})

test('Sticky Web lowers Speed and Toxic Spikes poison on entry', () => {
  const web = applyEntryHazards({ ...emptyHazards(), stickyWeb: true }, battler({ types: ['Normal'] })),
    toxic = applyEntryHazards(
      { ...emptyHazards(), toxicSpikes: 2 },
      battler({ types: ['Normal'] })
    ),
    poisonType = applyEntryHazards(
      { ...emptyHazards(), toxicSpikes: 2 },
      battler({ types: ['Poison'] })
    )
  assert.equal(web.speedStage, -1)
  assert.equal(toxic.status, 'toxic')
  assert.equal(poisonType.absorbed, true)
  assert.equal(poisonType.status, null)
})

test('a hazard move sets the enemy-side hazards', () => {
  withFixedRandom(0.9, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['stealthRock'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'] }),
      events = resolveBattleTurn(player, enemy, false, false, null, {
        player: emptyHazards(),
        enemy: emptyHazards(),
      }),
      hazardsEvent = [...events].reverse().find((event) => event.type === 'hazards' && event.data)
    assert.ok(hazardsEvent)
    assert.equal(hazardsEvent.data.hazards.enemy.stealthRock, true)
  })
})

test('switching in applies the side hazards and can lower Speed', () => {
  const lead = createPokemon('pidgey', 10, 'a'),
    incoming = createPokemon('rattata', 10, 'b'),
    active = createPokemon('charmander', 20, 'p'),
    state = {
      ...initialGameState,
      party: [active],
      playerPokemon: active,
      phase: 'battling',
      enemyPokemon: lead,
      battleHazards: {
        player: emptyHazards(),
        enemy: { ...emptyHazards(), stealthRock: true, stickyWeb: true },
      },
      bossBattle: {
        bossId: 'testGym',
        bossType: 'gym',
        trainerName: 'Tester',
        trainerClass: 'ace',
        trainerTeam: [lead, incoming],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'acetrainer',
        region: 'kanto',
      },
    },
    next = gameReducer(state, { type: 'TRAINER_SEND_NEXT_POKEMON', payload: { newPokemonIndex: 1 } })
  assert.ok(next.enemyPokemon.currentHp < incoming.maxHp, 'Stealth Rock chipped the switch-in')
  assert.equal(next.enemyPokemon.statStages.speed, -1, 'Sticky Web lowered Speed')
})
