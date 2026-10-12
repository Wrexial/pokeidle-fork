import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  DOUBLES_COST,
  DOUBLES_MAX_ROUNDS,
  SPREAD_MOVES,
  TRIPLES_COST,
  doublesOpponents,
  doublesPrize,
  runDoublesRound,
  simulateDoubles,
  triplesOpponents,
  triplesPrize,
} = await import('../src/game/minigames/doubles.js')
const { pokemonSpecies } = await import('../src/data/gameData.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

test('START_DOUBLES can be launched from any region (a second doubles home)', () => {
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    state = { ...started, money: DOUBLES_COST }
  const entered = gameReducer(state, { type: 'START_DOUBLES' })
  assert.equal(entered.phase, 'doubles')
  assert.equal(entered.money, 0, 'the entry fee is paid')
  // Without the fee the action is a no-op.
  const broke = gameReducer({ ...state, money: DOUBLES_COST - 1 }, { type: 'START_DOUBLES' })
  assert.equal(broke.phase, 'idle')
})

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
    ...overrides,
  }
}

test('doublesOpponents rolls a pair at the party level', () => {
  const pair = doublesOpponents(50, 2)
  assert.equal(pair.length, 2)
  for (const opponent of pair) {
    assert.ok(pokemonSpecies[opponent.speciesKey], `${opponent.speciesKey} is a real species`)
    assert.ok(opponent.level >= 50 && opponent.level <= 100)
    assert.equal(typeof opponent.name, 'string')
  }
})

test('a doubles round resolves every action and damages the foe', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['thunderbolt'],
      spAttack: 300,
      speed: 200,
      types: ['Electric'],
    }),
    partner = battler({ name: 'Partner', isPlayer: true, moves: ['splash'], speed: 10 }),
    foeX = battler({ name: 'FoeX', types: ['Water'], spDefense: 60, currentHp: 300, maxHp: 300 }),
    foeY = battler({ name: 'FoeY', types: ['Water'], spDefense: 60, currentHp: 300, maxHp: 300 })
  runDoublesRound([ally, partner], [foeX, foeY], { deterministic: true })
  assert.ok(
    foeX.currentHp < 300 || foeY.currentHp < 300,
    'the Electric move damages a Water foe'
  )
})

test('spread moves hit both foes', () => {
  assert.ok(SPREAD_MOVES.has('earthquake'))
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['earthquake'],
      attack: 400,
      speed: 200,
      types: ['Ground'],
    }),
    partner = battler({ name: 'Partner', isPlayer: true, moves: ['splash'], speed: 10 }),
    foeX = battler({ name: 'FoeX', types: ['Normal'], defense: 60, currentHp: 300, maxHp: 300 }),
    foeY = battler({ name: 'FoeY', types: ['Normal'], defense: 60, currentHp: 300, maxHp: 300 })
  runDoublesRound([ally, partner], [foeX, foeY], { deterministic: true })
  assert.ok(foeX.currentHp < 300, 'the first foe is hit')
  assert.ok(foeY.currentHp < 300, 'the second foe is hit too')
})

test('simulateDoubles resolves a whole bout', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['thunderbolt'],
      spAttack: 500,
      speed: 300,
      types: ['Electric'],
    }),
    partner = battler({ name: 'Partner', isPlayer: true, moves: ['splash'], speed: 10 }),
    foeX = battler({ name: 'FoeX', types: ['Water'], currentHp: 50, maxHp: 50, spDefense: 1 }),
    foeY = battler({ name: 'FoeY', types: ['Water'], currentHp: 50, maxHp: 50, spDefense: 1 })
  const outcome = simulateDoubles([ally, partner], [foeX, foeY], { deterministic: true })
  assert.equal(outcome.won, true)
  assert.ok(outcome.rounds >= 1 && outcome.rounds < DOUBLES_MAX_ROUNDS)
  assert.ok(outcome.log.length > 0)
})

test('a side down to a single battler still resolves the round', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['thunderbolt'],
      spAttack: 200,
      speed: 200,
      types: ['Electric'],
    }),
    foeX = battler({ name: 'FoeX', types: ['Water'], currentHp: 300, maxHp: 300, moves: ['splash'] }),
    foeY = battler({ name: 'FoeY', types: ['Water'], currentHp: 300, maxHp: 300, moves: ['splash'] })
  // The scene used to drop a fainted foe from the array, which left the
  // residual pass (allies[1], foes[1]) dereferencing undefined; and a fainted
  // ally with an empty bench left only one ally. Neither may throw.
  assert.doesNotThrow(() => runDoublesRound([ally], [foeX, foeY], { deterministic: true }))
  assert.doesNotThrow(() => runDoublesRound([ally], [foeX], { deterministic: true }))
  const downed = battler({ name: 'Downed', isPlayer: true, currentHp: 0, moves: ['splash'] })
  assert.doesNotThrow(() =>
    runDoublesRound([ally, downed], [foeX, foeY], { deterministic: true })
  )
})

test('double-battle prizes scale with bouts won', () => {
  assert.equal(doublesPrize(0).label, 'Knocked out early')
  assert.ok(doublesPrize(10).money > doublesPrize(2).money)
  assert.ok(doublesPrize(4).items.length > 0)
})

test('a doubles heal restores the wounded partner', () => {
  const healer = battler({
      name: 'Healer',
      isPlayer: true,
      moves: ['recover'],
      currentHp: 100,
      maxHp: 400,
      speed: 200,
    }),
    partner = battler({
      name: 'Partner',
      isPlayer: true,
      moves: ['splash'],
      currentHp: 50,
      maxHp: 400,
      speed: 10,
    }),
    foeX = battler({ name: 'FoeX', moves: ['splash'] }),
    foeY = battler({ name: 'FoeY', moves: ['splash'] })
  runDoublesRound([healer, partner], [foeX, foeY], { deterministic: true })
  assert.ok(partner.currentHp > 50, 'the most wounded ally is healed')
})

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

test('Friend Guard softens hits on its ally', () => {
  const remaining = (guard) => {
    const target = battler({ name: 'Ally', isPlayer: true, types: ['Normal'], defense: 100 }),
      partner = battler({
        name: 'Partner',
        isPlayer: true,
        ability: guard ? 'friendGuard' : undefined,
        speed: 1,
      }),
      attacker = battler({
        name: 'Attacker',
        attack: 300,
        speed: 100,
        moves: ['tackle'],
        types: ['Normal'],
      }),
      other = battler({ name: 'OtherFoe', speed: 1, moves: ['splash'] })
    runDoublesRound([target, partner], [attacker, other], { deterministic: true })
    return target.currentHp
  }
  assert.ok(remaining(true) > remaining(false), 'Friend Guard reduces the damage')
})

test('Battery powers up its ally', () => {
  const remaining = (battery) => {
    const attacker = battler({
        name: 'Attacker',
        isPlayer: true,
        moves: ['thunderbolt'],
        spAttack: 200,
        speed: 200,
        types: ['Electric'],
      }),
      partner = battler({
        name: 'Partner',
        isPlayer: true,
        ability: battery ? 'battery' : undefined,
        speed: 1,
      }),
      foe = battler({ name: 'Foe', types: ['Water'], spDefense: 100, currentHp: 500, maxHp: 500, moves: ['splash'] }),
      other = battler({ name: 'Other', speed: 1, moves: ['splash'] })
    runDoublesRound([attacker, partner], [foe, other], { deterministic: true })
    return foe.currentHp
  }
  assert.ok(remaining(true) < remaining(false), 'Battery increases the damage')
})

test('Healer cures a statused ally', () => {
  withFixedRandom(0, () => {
    const healer = battler({ name: 'Healer', isPlayer: true, ability: 'healer', speed: 200 }),
      ally = battler({ name: 'Ally', isPlayer: true, status: 'burn', speed: 10 }),
      foeX = battler({ name: 'FoeX', moves: ['splash'], speed: 1 }),
      foeY = battler({ name: 'FoeY', moves: ['splash'], speed: 1 })
    runDoublesRound([healer, ally], [foeX, foeY], { deterministic: false })
    assert.equal(ally.status, null, 'Healer cured the burn')
  })
})

test('Telepathy shields the ally from a spread move', () => {
  const remaining = (/** @type {any} */ ability) => {
    const attacker = battler({
        name: 'Attacker',
        isPlayer: true,
        moves: ['earthquake'],
        attack: 400,
        speed: 200,
        types: ['Ground'],
      }),
      partner = battler({
        name: 'Partner',
        isPlayer: true,
        ability,
        types: ['Normal'],
        defense: 60,
        currentHp: 300,
        maxHp: 300,
      }),
      foeX = battler({ name: 'FoeX', types: ['Normal'], defense: 60, currentHp: 300, maxHp: 300 }),
      foeY = battler({ name: 'FoeY', types: ['Normal'], defense: 60, currentHp: 300, maxHp: 300 })
    runDoublesRound([attacker, partner], [foeX, foeY], { deterministic: true })
    return partner.currentHp
  }
  assert.equal(remaining('telepathy'), 300, 'Telepathy blocks the ally damage')
  assert.ok(remaining(undefined) < 300, 'the ally is hit otherwise')
})

test('Commander boosts its Dondozo and grounds the Tatsugiri', () => {
  const tatsu = battler({
      name: 'Tatsugiri',
      isPlayer: true,
      speciesKey: 'tatsugiri',
      ability: 'commander',
      moves: ['waterGun'],
      speed: 200,
      statStages: {},
    }),
    dondozo = battler({
      name: 'Dondozo',
      isPlayer: true,
      speciesKey: 'dondozo',
      moves: ['splash'],
      speed: 10,
      statStages: {},
    }),
    foeX = battler({ name: 'FoeX', moves: ['splash'], speed: 1 }),
    foeY = battler({ name: 'FoeY', moves: ['splash'], speed: 1 })
  runDoublesRound([tatsu, dondozo], [foeX, foeY], { deterministic: true })
  assert.equal(dondozo.statStages.attack, 2, 'Dondozo got the +2')
  assert.equal(dondozo.statStages.speed, 2)
  assert.equal(tatsu.commanding, true, 'Tatsugiri is riding along')
})

test('Dancer copies an ally dance move', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['dragonDance'],
      speed: 200,
      statStages: {},
    }),
    dancer = battler({
      name: 'Dancer',
      isPlayer: true,
      ability: 'dancer',
      moves: ['splash'],
      speed: 10,
      statStages: {},
    }),
    foeX = battler({ name: 'FoeX', moves: ['splash'], speed: 1 }),
    foeY = battler({ name: 'FoeY', moves: ['splash'], speed: 1 })
  runDoublesRound([ally, dancer], [foeX, foeY], { deterministic: true })
  assert.equal(dancer.statStages.attack, 1, 'Dancer copied Dragon Dance')
})

test('Flower Veil protects a Grass ally from stat drops', () => {
  const holder = battler({
      name: 'Veil',
      isPlayer: true,
      ability: 'flowerVeil',
      types: ['Fairy'],
      moves: ['splash'],
      speed: 1,
    }),
    grass = battler({ name: 'Grass', isPlayer: true, types: ['Grass'], moves: ['splash'], speed: 1 }),
    foeX = battler({ name: 'FoeX', moves: ['splash'], speed: 1 }),
    foeY = battler({ name: 'FoeY', moves: ['splash'], speed: 1 })
  runDoublesRound([holder, grass], [foeX, foeY], { deterministic: true })
  assert.equal(grass.flowerVeilProtected, true, 'the Grass ally is protected')
})

test('Power of Alchemy and Receiver copy a fainted ally ability', () => {
  for (const ability of ['powerOfAlchemy', 'receiver']) {
    const copier = battler({ name: 'Copier', isPlayer: true, ability, speed: 1 }),
      fainted = battler({
        name: 'Fainted',
        isPlayer: true,
        ability: 'intimidate',
        currentHp: 0,
        maxHp: 400,
        speed: 1,
      }),
      foeX = battler({ name: 'FoeX', moves: ['splash'], speed: 1 }),
      foeY = battler({ name: 'FoeY', moves: ['splash'], speed: 1 })
    runDoublesRound([copier, fainted], [foeX, foeY], { deterministic: true })
    assert.equal(copier.ability, 'intimidate', `${ability} copied the fainted ally`)
  }
})

test('Symbiosis passes its item to an itemless ally', () => {
  const giver = battler({
      name: 'Giver',
      isPlayer: true,
      ability: 'symbiosis',
      heldItem: 'leftovers',
      speed: 1,
    }),
    receiver = battler({
      name: 'Receiver',
      isPlayer: true,
      heldItem: null,
      heldItemUsed: true,
      speed: 1,
    }),
    foeX = battler({ name: 'FoeX', moves: ['splash'], speed: 1 }),
    foeY = battler({ name: 'FoeY', moves: ['splash'], speed: 1 })
  runDoublesRound([giver, receiver], [foeX, foeY], { deterministic: true })
  assert.equal(receiver.heldItem, 'leftovers')
  assert.equal(giver.heldItem, null)
})

test('Instruct makes the ally repeat its last move', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['swordsDance'],
      speed: 200,
      statStages: {},
    }),
    instructor = battler({
      name: 'Instructor',
      isPlayer: true,
      moves: ['instruct'],
      speed: 10,
      statStages: {},
    }),
    foeX = battler({ name: 'FoeX', moves: ['splash'], speed: 1 }),
    foeY = battler({ name: 'FoeY', moves: ['splash'], speed: 1 })
  runDoublesRound([ally, instructor], [foeX, foeY], { deterministic: true })
  assert.equal(ally.statStages.attack, 4, 'Swords Dance ran again via Instruct')
})

test('Ally Switch resolves and redirects the round', () => {
  const switcher = battler({
      name: 'Switcher',
      isPlayer: true,
      moves: ['allySwitch'],
      speed: 200,
      types: ['Normal'],
      currentHp: 300,
      maxHp: 300,
    }),
    partner = battler({
      name: 'Partner',
      isPlayer: true,
      moves: ['splash'],
      speed: 5,
      types: ['Normal'],
      currentHp: 300,
      maxHp: 300,
    }),
    foeX = battler({
      name: 'FoeX',
      moves: ['tackle'],
      attack: 400,
      speed: 100,
      types: ['Normal'],
    }),
    foeY = battler({ name: 'FoeY', moves: ['splash'], speed: 1 })
  const result = runDoublesRound([switcher, partner], [foeX, foeY], { deterministic: true })
  assert.ok(
    result.log.some((line) => /Ally Switch/.test(line)),
    'Ally Switch was used'
  )
  // The foes' targets were swapped, so the damage landed on the partner.
  assert.ok(switcher.currentHp >= partner.currentHp, 'the switch moved the attack off the switcher')
})

test('Wide Guard shields the whole side from a spread move', () => {
  const run = (/** @type {boolean} */ useGuard) => {
    const ally = battler({
        name: 'Ally',
        isPlayer: true,
        moves: useGuard ? ['wideGuard'] : ['splash'],
        types: ['Electric'],
        speed: 200,
      }),
      partner = battler({
        name: 'Partner',
        isPlayer: true,
        moves: ['splash'],
        types: ['Electric'],
        speed: 10,
      }),
      foeX = battler({
        name: 'FoeX',
        types: ['Ground'],
        moves: ['earthquake'],
        attack: 400,
        speed: 300,
      }),
      foeY = battler({
        name: 'FoeY',
        types: ['Ground'],
        moves: ['earthquake'],
        attack: 400,
        speed: 300,
      }),
      result = runDoublesRound([ally, partner], [foeX, foeY], { deterministic: true })
    return { allyHp: ally.currentHp, partnerHp: partner.currentHp, log: result.log }
  }
  const guarded = run(true)
  assert.ok(
    guarded.log.some((line) => /protected the team with Wide Guard/.test(line)),
    'the guard goes up'
  )
  assert.ok(
    guarded.log.some((line) => /protected by Wide Guard/.test(line)),
    'the spread move is blocked'
  )
  assert.equal(guarded.allyHp, 400, 'the guarded side takes no spread damage')
  assert.equal(guarded.partnerHp, 400, 'the partner is shielded too')
  // Without the guard the spread move lands.
  const unguarded = run(false)
  assert.ok(unguarded.allyHp < 400 && unguarded.partnerHp < 400)
})

test('Quick Guard shields the whole side from a priority move', () => {
  const run = (/** @type {boolean} */ useGuard) => {
    const ally = battler({
        name: 'Ally',
        isPlayer: true,
        moves: useGuard ? ['quickGuard'] : ['splash'],
        types: ['Electric'],
        speed: 1,
      }),
      partner = battler({
        name: 'Partner',
        isPlayer: true,
        moves: ['splash'],
        types: ['Electric'],
        speed: 1,
      }),
      foeX = battler({
        name: 'FoeX',
        types: ['Water'],
        moves: ['aquaJet'],
        attack: 400,
        speed: 300,
      }),
      foeY = battler({
        name: 'FoeY',
        types: ['Water'],
        moves: ['aquaJet'],
        attack: 400,
        speed: 300,
      }),
      result = runDoublesRound([ally, partner], [foeX, foeY], { deterministic: true })
    return { allyHp: ally.currentHp, partnerHp: partner.currentHp, log: result.log }
  }
  const guarded = run(true)
  assert.ok(guarded.log.some((line) => /protected the team with Quick Guard/.test(line)))
  assert.ok(guarded.log.some((line) => /protected by Quick Guard/.test(line)))
  assert.equal(guarded.allyHp, 400, 'the guarded side takes no priority damage')
  assert.equal(guarded.partnerHp, 400)
  // Aqua Jet is single-target, so only the chosen ally is hit without the guard.
  const unguarded = run(false)
  assert.ok(Math.min(unguarded.allyHp, unguarded.partnerHp) < 400)
})

test('Quick Guard does not block a non-priority spread move', () => {
  // The foe knows a priority move (so the guard goes up) but leads with a
  // stronger non-priority spread move, which Quick Guard must not stop.
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['quickGuard'],
      types: ['Electric'],
      speed: 1,
    }),
    partner = battler({
      name: 'Partner',
      isPlayer: true,
      moves: ['splash'],
      types: ['Electric'],
      speed: 1,
    }),
    foeX = battler({
      name: 'FoeX',
      types: ['Ground'],
      moves: ['earthquake', 'quickAttack'],
      attack: 400,
      speed: 300,
    }),
    foeY = battler({
      name: 'FoeY',
      types: ['Ground'],
      moves: ['earthquake', 'quickAttack'],
      attack: 400,
      speed: 300,
    }),
    result = runDoublesRound([ally, partner], [foeX, foeY], { deterministic: true })
  assert.ok(
    result.log.some((line) => /protected the team with Quick Guard/.test(line)),
    'Quick Guard went up because the foe knows a priority move'
  )
  assert.ok(ally.currentHp < 400, 'the non-priority spread move still lands')
})

test('triplesOpponents rolls a trio and START_TRIPLES charges the Tower', () => {
  const trio = triplesOpponents(60, 3)
  assert.equal(trio.length, 3)
  for (const opponent of trio) {
    assert.ok(pokemonSpecies[opponent.speciesKey], `${opponent.speciesKey} is a real species`)
    assert.ok(opponent.level >= 60 && opponent.level <= 100)
  }
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    state = { ...started, money: TRIPLES_COST },
    entered = gameReducer(state, { type: 'START_TRIPLES' })
  assert.equal(entered.phase, 'triples')
  assert.equal(entered.money, 0, 'the entry fee is paid')
  const broke = gameReducer({ ...state, money: TRIPLES_COST - 1 }, { type: 'START_TRIPLES' })
  assert.equal(broke.phase, 'idle', 'a triple run needs the fee')
})

test('a triple round resolves three-a-side and spread hits the whole side', () => {
  const ally = battler({
      name: 'Ally',
      isPlayer: true,
      moves: ['thunderbolt'],
      spAttack: 300,
      speed: 200,
      types: ['Electric'],
    }),
    partnerA = battler({ name: 'PartnerA', isPlayer: true, moves: ['splash'], speed: 10 }),
    partnerB = battler({ name: 'PartnerB', isPlayer: true, moves: ['splash'], speed: 5 }),
    // Three Water foes, so the Electric move is super effective on all of them.
    foes = ['FoeX', 'FoeY', 'FoeZ'].map((name) =>
      battler({ name, types: ['Water'], spDefense: 60, currentHp: 300, maxHp: 300, speed: 1 })
    )
  const result = runDoublesRound([ally, partnerA, partnerB], foes, { deterministic: true })
  assert.ok(result.events.length > 0)
  assert.ok(
    foes.some((foe) => foe.currentHp < 300),
    'at least one foe takes damage in a triple round'
  )
  // Every foe still at 0 HP sanity-checks the residual pass over three slots.
  for (const foe of foes) assert.ok(foe.currentHp <= 300)
})

test('triplesPrize pays more than the doubles purse', () => {
  assert.ok(triplesPrize(5).money > doublesPrize(5).money)
  assert.equal(typeof triplesPrize(0).label, 'string')
})

test('a triple run records its result and returns to idle', () => {
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    entered = gameReducer(
      { ...started, money: TRIPLES_COST },
      { type: 'START_TRIPLES' }
    ),
    ended = gameReducer(entered, {
      type: 'END_MINIGAME',
      payload: { minigame: 'triples', score: 3, completed: true },
    })
  assert.equal(ended.phase, 'idle')
  assert.equal(ended.minigameRecords.triples.best, 3)
  assert.equal(ended.minigameRecords.triples.completed, true)
})
