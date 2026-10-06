import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn, createVolatileState } = await import('../src/game/combat.js')
const { isTrapped } = await import('../src/game/combat/turn.js')

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

test('Baton Pass asks for a switch and carries the stat boosts', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['batonPass'],
      speed: 200,
      statStages: { attack: 2 },
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] }),
    events = resolveBattleTurn(player, enemy, false),
    request = events.find((/** @type {any} */ event) => event.type === 'switchRequest')
  assert.ok(request, 'a switch was requested')
  assert.equal(request.data.target, 'player')
  assert.equal(request.data.passBoosts.attack, 2)
})

test('U-turn is a damaging pivot move', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['uTurn'],
        speed: 200,
        attack: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 400, maxHp: 400 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(enemy.currentHp < 400, 'the hit landed')
    assert.ok(
      events.some(
        (/** @type {any} */ event) =>
          event.type === 'switchRequest' && event.data.target === 'player'
      )
    )
  })
})

test('Roar drags the foe out, but Suction Cups refuses', () => {
  const roar = () =>
    resolveBattleTurn(
      battler({ name: 'Player', isPlayer: true, moves: ['roar'], speed: 200 }),
      battler({ name: 'Foe', moves: ['splash'] }),
      false
    )
  assert.ok(roar().some((/** @type {any} */ event) => event.type === 'switchRequest'))

  const guarded = resolveBattleTurn(
    battler({ name: 'Player', isPlayer: true, moves: ['roar'], speed: 200 }),
    battler({ name: 'Foe', moves: ['splash'], ability: 'suctionCups' }),
    false
  )
  assert.ok(!guarded.some((/** @type {any} */ event) => event.type === 'switchRequest'))
})

test('Block traps the foe and stops its pivot move', () => {
  const player = battler({ name: 'Player', isPlayer: true, moves: ['block'], speed: 200 }),
    enemy = battler({ name: 'Foe', moves: ['teleport'], speed: 1 }),
    events = resolveBattleTurn(player, enemy, false)
  assert.equal(enemy.trappedByMove, true)
  assert.equal(isTrapped(enemy), true)
  assert.ok(
    !events.some(
      (/** @type {any} */ event) =>
        event.type === 'switchRequest' && event.data.target === 'enemy'
    )
  )
})

test('Arena Trap pins a grounded foe on entry', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      ability: 'arenaTrap',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'] })
  resolveBattleTurn(player, enemy, false, true)
  assert.equal(enemy.trappedByAbility, true)
  assert.equal(isTrapped(enemy), true)

  // Flying foes are not pinned by Arena Trap.
  const flying = battler({ name: 'Foe2', moves: ['splash'], types: ['Normal', 'Flying'] })
  resolveBattleTurn(player, flying, false, true)
  assert.equal(flying.trappedByAbility, false)
})

test('Emergency Exit asks to switch out below half HP', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 300,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        ability: 'emergencyExit',
        currentHp: 400,
        maxHp: 400,
        defense: 30,
      }),
      request = resolveBattleTurn(player, enemy, false).find(
        (/** @type {any} */ event) =>
          event.type === 'switchRequest' && event.data.target === 'enemy'
      )
    assert.ok(request, 'Emergency Exit requested a switch')
  })
})

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')

/** A battling state with two party members. */
function battlingState(pendingEvents) {
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    party = [started.party[0], createPokemon('pidgey', 12, 'bench-1')]
  return {
    ...started,
    phase: 'battling',
    party,
    playerPokemon: party[0],
    activePlayerPokemonIndex: 0,
    enemyPokemon: createPokemon('rattata', 5, 'foe-1'),
    playerVolatile: createVolatileState(),
    pendingEvents,
    currentLocation: 'route1',
  }
}

test('a switch request sends in the bench and Baton Pass carries the boosts', () => {
  const state = battlingState([
      { type: 'switchRequest', message: 'x', data: { target: 'player', passBoosts: { attack: 2 } } },
    ]),
    next = gameReducer(state, { type: 'CONSUME_EVENT' })
  assert.equal(next.activePlayerPokemonIndex, 1, 'the bench Pokemon came in')
  assert.equal(next.playerPokemon.id, 'bench-1')
  assert.equal(next.playerVolatile.statStages.attack, 2, 'the boosts were passed on')
})

test('Revival Blessing brings back a fainted party member', () => {
  const state = battlingState([{ type: 'revive', message: 'x' }]),
    fainted = {
      ...state,
      party: state.party.map((member) =>
        member.id === 'bench-1' ? { ...member, currentHp: 0 } : member
      ),
    },
    next = gameReducer(fainted, { type: 'CONSUME_EVENT' }),
    revived = next.party.find((member) => member.id === 'bench-1')
  assert.ok(revived.currentHp > 0, 'the fainted member was revived')
  assert.equal(revived.currentHp, Math.floor(revived.maxHp / 2))
})

test('a forced switch in a wild battle ends the encounter', () => {
  const state = battlingState([
      { type: 'switchRequest', message: 'x', data: { target: 'enemy' } },
    ]),
    next = gameReducer(state, { type: 'CONSUME_EVENT' })
  assert.equal(next.phase, 'idle')
  assert.equal(next.enemyPokemon, null)
})

test('Run Away always succeeds at fleeing a wild battle', () => {
  const state = battlingState([]),
    runner = {
      ...state,
      playerPokemon: { ...state.playerPokemon, ability: 'runAway' },
      party: state.party.map((member, index) =>
        index === 0 ? { ...member, ability: 'runAway' } : member
      ),
    },
    next = gameReducer(runner, { type: 'FLEE' })
  assert.equal(next.phase, 'idle')
  assert.equal(next.enemyPokemon, null)
})
