import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { HORDE_DROP_ROLLS_CAP, HORDE_SIZE_MAX, HORDE_SIZE_MIN } = await import(
  '../src/data/config.js'
)
const { buildHorde, hordeDropRolls, hordeExpMultiplier, rollHordeSize, simulateHorde } =
  await import('../src/game/horde.js')
const { runDoublesRound } = await import('../src/game/minigames/doubles.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

/** @param {Record<string, any>} [overrides] */
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
    statStages: {},
    ...overrides,
  }
}

test('a horde rolls a pack of one species within 3-5 members', () => {
  for (let roll = 0; roll < 40; roll++) {
    const size = rollHordeSize()
    assert.ok(size >= HORDE_SIZE_MIN && size <= HORDE_SIZE_MAX, `size ${size} is in range`)
  }
  const pack = buildHorde('pidgey', 12, { size: 4 })
  assert.equal(pack.length, 4)
  for (const member of pack) {
    assert.equal(member.speciesKey, 'pidgey')
    assert.equal(member.level, 12)
    assert.ok(member.currentHp > 0)
  }
})

test('the clear EXP multiplier grows with the pack but is capped', () => {
  assert.ok(hordeExpMultiplier(3) > 1)
  assert.ok(hordeExpMultiplier(4) > hordeExpMultiplier(3))
  assert.ok(hordeExpMultiplier(5) >= hordeExpMultiplier(4))
  assert.equal(hordeExpMultiplier(5), 3, 'five members cap at 3x')
  assert.equal(hordeExpMultiplier(50), 3, 'an oversized pack is still capped')
})

test('drop rolls are capped so a five-pack is not a loot shower', () => {
  assert.ok(hordeDropRolls(3) >= 1)
  assert.ok(hordeDropRolls(4) >= hordeDropRolls(3))
  assert.equal(hordeDropRolls(5), HORDE_DROP_ROLLS_CAP)
  assert.equal(hordeDropRolls(20), HORDE_DROP_ROLLS_CAP)
})

test('spread moves hit the whole horde, a single-target move picks one', () => {
  const spreadPlayer = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['earthquake'],
      attack: 400,
      speed: 300,
      types: ['Ground'],
    }),
    foes = ['FoeA', 'FoeB', 'FoeC'].map((name) =>
      battler({ name, types: ['Normal'], defense: 40, currentHp: 400, maxHp: 400, speed: 1 })
    )
  runDoublesRound([spreadPlayer], foes, { deterministic: true })
  assert.ok(
    foes.every((foe) => foe.currentHp < 400),
    'Earthquake hits every member of the pack'
  )

  const singlePlayer = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['tackle'],
      attack: 400,
      speed: 300,
      types: ['Normal'],
    }),
    singleFoes = ['FoeA', 'FoeB', 'FoeC'].map((name) =>
      battler({ name, types: ['Normal'], defense: 400, currentHp: 400, maxHp: 400, speed: 1 })
    )
  runDoublesRound([singlePlayer], singleFoes, { deterministic: true })
  assert.equal(
    singleFoes.filter((foe) => foe.currentHp < 400).length,
    1,
    'a single-target move only hits one member'
  )
})

test('simulateHorde clears a weak pack and loses to a strong one', () => {
  const winner = battler({
      name: 'Champ',
      isPlayer: true,
      moves: ['thunderbolt'],
      spAttack: 600,
      speed: 300,
      types: ['Electric'],
    }),
    weakPack = ['A', 'B', 'C'].map((name) =>
      battler({
        name,
        types: ['Water'],
        spDefense: 1,
        currentHp: 20,
        maxHp: 20,
        moves: ['splash'],
        speed: 1,
      })
    ),
    won = simulateHorde(winner, weakPack, { deterministic: true }),
    loser = battler({
      name: 'Runt',
      isPlayer: true,
      moves: ['splash'],
      currentHp: 1,
      maxHp: 1,
      speed: 1,
    }),
    strongPack = ['X', 'Y', 'Z'].map((name) =>
      battler({ name, attack: 900, speed: 300, moves: ['tackle'], types: ['Normal'] })
    ),
    lost = simulateHorde(loser, strongPack, { deterministic: true })
  assert.equal(won.won, true)
  assert.ok(won.rounds >= 1)
  assert.equal(lost.won, false)
})

test('START_HORDE sets up the pack, END_HORDE clears it back to the map', () => {
  const originalRandom = Math.random
  Math.random = () => 0.5
  try {
    const started = gameReducer(initialGameState, {
        type: 'SELECT_STARTER',
        payload: { region: 'kanto', speciesKey: 'bulbasaur' },
      }),
      pack = buildHorde('pidgey', 5, { size: 3 }),
      inHorde = gameReducer(started, { type: 'START_HORDE', payload: { enemies: pack } })
    assert.equal(inHorde.phase, 'horde')
    assert.equal(inHorde.hordePack.length, 3)
    assert.ok(inHorde.hordePlayer)
    assert.equal(inHorde.hordePlayer.speciesKey, started.party[0]?.speciesKey ?? 'bulbasaur')

    const cleared = gameReducer(inHorde, { type: 'END_HORDE', payload: { won: true, size: 3 } })
    assert.equal(cleared.phase, 'idle')
    assert.equal(cleared.hordePack, null)
    assert.equal(cleared.wildBattlesWon, started.wildBattlesWon + 1, 'a horde is one wild win')
    // The drops land in the bag.
    const gained = Object.keys(cleared.inventory).some(
      (itemId) => (cleared.inventory[itemId] ?? 0) > (started.inventory[itemId] ?? 0)
    )
    assert.ok(gained, 'clearing the pack pays at least one item drop')
  } finally {
    Math.random = originalRandom
  }
})

test('losing a horde heals the party when there is no replacement', () => {
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    pack = buildHorde('pidgey', 5, { size: 3 }),
    inHorde = gameReducer(started, { type: 'START_HORDE', payload: { enemies: pack } }),
    lost = gameReducer(inHorde, { type: 'END_HORDE', payload: { won: false, size: 3 } })
  assert.equal(lost.phase, 'healing')
  assert.equal(lost.hordePack, null)
})

test('a double knockout on the winning round still recovers the party', () => {
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    pack = buildHorde('pidgey', 5, { size: 3 }),
    inHorde = gameReducer(started, { type: 'START_HORDE', payload: { enemies: pack } }),
    doubleKo = { ...inHorde, hordePlayer: { ...inHorde.hordePlayer, currentHp: 0 } },
    cleared = gameReducer(doubleKo, { type: 'END_HORDE', payload: { won: true, size: 3 } })
  assert.equal(cleared.phase, 'healing', 'a fainted winner is still recovered')
})

test('TOGGLE_HORDES flips the preference', () => {
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    off = gameReducer(started, { type: 'TOGGLE_HORDES' }),
    on = gameReducer(off, { type: 'TOGGLE_HORDES' })
  assert.equal(off.hordeEncounters, false)
  assert.equal(on.hordeEncounters, true)
})
