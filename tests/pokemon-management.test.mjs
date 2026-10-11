import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { createPokemon, ivStatLabel, ivVerdict, judgeIVs, pokemonDisplayName, sortBoxMembers, parseBoxSort, nextBoxSortField, toggleBoxSortDirection, insertIntoBox } = await import(
  '../src/game/pokemon.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

function startedGame() {
  return gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
}

test('RELEASE_DUPLICATES keeps the best copy and spares favourites/shinies', () => {
  const mon = (/** @type {string} */ speciesKey, /** @type {string} */ id, /** @type {number} */ iv, /** @type {Record<string, any>} */ extra = {}) => ({
      ...createPokemon(speciesKey, 20, id),
      ivs: { hp: iv, attack: iv, defense: iv, spAttack: iv, spDefense: iv, speed: iv },
      ...extra,
    }),
    a1 = mon('pidgey', 'a1', 0),
    a2 = mon('pidgey', 'a2', 31),
    a3 = mon('pidgey', 'a3', 10),
    b1 = mon('rattata', 'b1', 5),
    shiny = mon('caterpie', 'c1', 31, { isShiny: true }),
    plain = mon('caterpie', 'c2', 0),
    base = {
      ...initialGameState,
      box: [a1, a2, a3, b1, shiny, plain],
      money: 0,
      inventory: {},
    },
    result = gameReducer(base, { type: 'RELEASE_DUPLICATES' })
  const ids = result.box.map((/** @type {any} */ member) => member.id)
  assert.deepEqual(ids.sort(), ['a2', 'b1', 'c1'])
  assert.ok(result.money > 0, 'releasing duplicates should pay out')
})

test('RELEASE_DUPLICATES is a no-op without duplicates', () => {
  const base = {
    ...initialGameState,
    box: [createPokemon('pidgey', 20, 'a1'), createPokemon('rattata', 20, 'b1')],
  }
  assert.equal(gameReducer(base, { type: 'RELEASE_DUPLICATES' }), base)
})

const perfect = { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
  zero = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }

test('judgeIVs totals, verdicts and per-stat labels', () => {
  const best = judgeIVs(perfect)
  assert.equal(best.total, 186)
  assert.equal(best.verdict, 'Wonderful')
  assert.equal(best.perStat.attack.label, 'Best')

  const worst = judgeIVs(zero)
  assert.equal(worst.total, 0)
  assert.equal(worst.verdict, 'Decent')
  assert.equal(worst.perStat.speed.label, 'No Good')

  const middling = judgeIVs({ hp: 20, attack: 20, defense: 20, spAttack: 20, spDefense: 20, speed: 20 })
  assert.equal(middling.total, 120)
  assert.equal(middling.verdict, 'Above Average')
})

test('ivStatLabel and ivVerdict boundaries', () => {
  assert.equal(ivStatLabel(31), 'Best')
  assert.equal(ivStatLabel(30), 'Fantastic')
  assert.equal(ivStatLabel(26), 'Very Good')
  assert.equal(ivStatLabel(16), 'Pretty Good')
  assert.equal(ivStatLabel(1), 'Decent')
  assert.equal(ivStatLabel(0), 'No Good')
  assert.equal(ivVerdict(151), 'Wonderful')
  assert.equal(ivVerdict(150), 'Superior')
  assert.equal(ivVerdict(120), 'Above Average')
  assert.equal(ivVerdict(90), 'Decent')
})

test('TOGGLE_FAVOURITE flips the flag on the owned Pokemon', () => {
  const base = startedGame(),
    id = base.party[0].id,
    favourited = gameReducer(base, { type: 'TOGGLE_FAVOURITE', payload: { pokemonId: id } })
  assert.equal(favourited.party[0].favourite, true)
  assert.equal(favourited.playerPokemon.favourite, true)
  assert.equal(
    gameReducer(favourited, { type: 'TOGGLE_FAVOURITE', payload: { pokemonId: id } }).party[0]
      .favourite,
    false
  )
})

test('pokemonDisplayName prefers the nickname', () => {
  assert.equal(pokemonDisplayName({ name: 'Pikachu' }), 'Pikachu')
  assert.equal(pokemonDisplayName({ name: 'Pikachu', nickname: 'Sparky' }), 'Sparky')
})

test('SET_NICKNAME trims, caps at 12 characters and clears', () => {
  const base = startedGame(),
    id = base.party[0].id,
    named = gameReducer(base, {
      type: 'SET_NICKNAME',
      payload: { pokemonId: id, nickname: '  Buddy  ' },
    })
  assert.equal(named.party[0].nickname, 'Buddy')
  assert.equal(named.playerPokemon.nickname, 'Buddy')
  assert.equal(
    gameReducer(base, {
      type: 'SET_NICKNAME',
      payload: { pokemonId: id, nickname: 'ABCDEFGHIJKLMNOP' },
    }).party[0].nickname,
    'ABCDEFGHIJKL'
  )
  assert.equal(
    gameReducer(named, {
      type: 'SET_NICKNAME',
      payload: { pokemonId: id, nickname: '' },
    }).party[0].nickname,
    undefined
  )
})

test('favourites are protected from release and Wonder Trade', () => {
  const base = startedGame(),
    boxMon = { ...base.party[0], id: 'box1', favourite: true },
    state = { ...base, box: [boxMon], inventory: { ...base.inventory, linkCable: 1 } }
  assert.equal(
    gameReducer(state, {
      type: 'RELEASE_POKEMON',
      payload: { pokemonId: 'box1', source: 'box' },
    }),
    state,
    'a favourite cannot be released'
  )
  assert.equal(
    gameReducer(state, { type: 'WONDER_TRADE', payload: { pokemonId: 'box1' } }),
    state,
    'a favourite cannot be traded'
  )

  const unfavourited = { ...state, box: [{ ...boxMon, favourite: false }] }
  assert.equal(
    gameReducer(unfavourited, {
      type: 'RELEASE_POKEMON',
      payload: { pokemonId: 'box1', source: 'box' },
    }).box.length,
    0
  )
})

test('Wonder Trade swaps the Pokemon and stages a pausing animation', () => {
  const base = startedGame(),
    boxMon = { ...base.party[0], id: 'box1' },
    state = { ...base, box: [boxMon], inventory: { ...base.inventory, linkCable: 1 } },
    staged = gameReducer(state, { type: 'WONDER_TRADE', payload: { pokemonId: 'box1' } })
  assert.equal(staged.phase, 'wonderTrade')
  assert.ok(staged.wonderTradeState, 'the swap is staged for the animation')
  assert.equal(staged.wonderTradeState.sentPokemon.id, 'box1')
  assert.ok(
    staged.box.some((member) => member.id === staged.wonderTradeState.receivedPokemon.id),
    'the received Pokemon is already in the box'
  )
  assert.equal(staged.inventory.linkCable, 0)
  const done = gameReducer(staged, { type: 'COMPLETE_WONDER_TRADE' })
  assert.equal(done.phase, 'idle')
  assert.equal(done.wonderTradeState, null)
})

test('box sort splits into a field and a direction', () => {
  // Legacy field-only values fall back to that field's default direction.
  assert.deepEqual(parseBoxSort('dex'), { field: 'dex', direction: 'asc' })
  assert.deepEqual(parseBoxSort('level_asc'), { field: 'level', direction: 'asc' })
  assert.deepEqual(parseBoxSort('shiny'), { field: 'shiny', direction: 'desc' })
  assert.deepEqual(parseBoxSort('name_desc'), { field: 'name', direction: 'desc' })
  assert.deepEqual(parseBoxSort('nonsense'), { field: 'dex', direction: 'asc' })
})

test('box sorts honour the field and direction', () => {
  const box = [
      createPokemon('pidgey', 10, '1'),
      createPokemon('rattata', 20, '2'),
      createPokemon('caterpie', 5, '3'),
    ],
    order = (/** @type {any[]} */ members) =>
      members.map((member) => member.speciesKey).join(','),
    levels = (/** @type {any[]} */ members) =>
      members.map((member) => member.level).join(',')
  assert.equal(order(sortBoxMembers(box, 'dex_asc')), 'caterpie,pidgey,rattata')
  assert.equal(order(sortBoxMembers(box, 'dex_desc')), 'rattata,pidgey,caterpie')
  assert.equal(levels(sortBoxMembers(box, 'level_desc')), '20,10,5')
  assert.equal(levels(sortBoxMembers(box, 'level_asc')), '5,10,20')
  assert.equal(order(sortBoxMembers(box, 'name_asc')), 'caterpie,pidgey,rattata')
  assert.equal(order(sortBoxMembers(box, 'newest_desc')), 'caterpie,rattata,pidgey')
  // The legacy field-only values keep working.
  assert.equal(levels(sortBoxMembers(box, 'level_asc')), '5,10,20')
  assert.equal(order(sortBoxMembers(box, 'newest')), 'caterpie,rattata,pidgey')
})

test('box sorts by total IVs', () => {
  const box = [
    createPokemon('pidgey', 10, '1'),
    createPokemon('rattata', 10, '2'),
    createPokemon('caterpie', 10, '3'),
  ]
  box[0].ivs = { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 }
  box[1].ivs = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }
  box[2].ivs = { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 }
  const order = (/** @type {any[]} */ members) =>
    members.map((member) => member.speciesKey).join(',')
  assert.equal(order(sortBoxMembers(box, 'iv_desc')), 'pidgey,caterpie,rattata')
  assert.equal(order(sortBoxMembers(box, 'iv_asc')), 'rattata,caterpie,pidgey')
  // The field-only legacy value defaults to highest-IVs-first.
  assert.equal(order(sortBoxMembers(box, 'iv')), 'pidgey,caterpie,rattata')
})

test('the sort button cycles the field and the mode button flips the direction', () => {
  assert.equal(nextBoxSortField('dex_asc'), 'level_asc')
  assert.equal(nextBoxSortField('level_desc'), 'iv_desc')
  assert.equal(nextBoxSortField('iv_desc'), 'name_desc')
  assert.equal(toggleBoxSortDirection('dex_asc'), 'dex_desc')
  assert.equal(toggleBoxSortDirection('level_desc'), 'level_asc')
})

test('only a newest-first box prepends a new member', () => {
  const existing = createPokemon('caterpie', 5, '99'),
    fresh = createPokemon('pidgey', 5, '100')
  assert.deepEqual(
    insertIntoBox([existing], fresh, 'newest_desc').map((/** @type {any} */ member) => member.id),
    ['100', '99']
  )
  assert.deepEqual(
    insertIntoBox([existing], fresh, 'newest_asc').map((/** @type {any} */ member) => member.id),
    ['99', '100']
  )
  assert.deepEqual(
    insertIntoBox([existing], fresh, 'dex_asc').map((/** @type {any} */ member) => member.id),
    ['99', '100']
  )
})

test('Wonder Trade never hands back a battle-only form', async () => {
  const { WONDER_TRADE_POOL } = await import('../src/game/reducer/pokemon/wonder-trade.js'),
    { isTerminalForm } = await import('../src/data/mega-evolution.js')
  assert.ok(WONDER_TRADE_POOL.length > 1000)
  assert.ok(WONDER_TRADE_POOL.includes('froslass'))
  assert.ok(WONDER_TRADE_POOL.includes('a-rattata'), 'real alternate forms stay tradeable')
  assert.ok(!WONDER_TRADE_POOL.includes('m-froslass'), 'Mega forms are not tradeable')
  assert.ok(!WONDER_TRADE_POOL.includes('missingno'), 'MissingNo is not tradeable')
  assert.ok(
    WONDER_TRADE_POOL.every((speciesKey) => !isTerminalForm(speciesKey)),
    'no Mega / Primal / Gigantamax forms'
  )
})

test('team presets save the current party and restore it', () => {
  const a = createPokemon('bulbasaur', 5, '1'),
    b = createPokemon('charmander', 5, '2'),
    c = createPokemon('squirtle', 5, '3'),
    base = {
      ...initialGameState,
      phase: 'idle',
      party: [a, b],
      box: [c],
      playerPokemon: a,
      activePlayerPokemonIndex: 0,
    },
    saved = gameReducer(base, { type: 'SAVE_TEAM_PRESET', payload: {} })
  assert.equal(saved.teamPresets.length, 1)
  assert.deepEqual(saved.teamPresets[0].members, ['1', '2'])

  const preset = { id: 'p1', name: 'Test', members: ['3', '1'] },
    applied = gameReducer(
      { ...base, teamPresets: [preset] },
      { type: 'APPLY_TEAM_PRESET', payload: { presetId: 'p1' } }
    )
  assert.deepEqual(
    applied.party.map((member) => member.id),
    ['3', '1', '2'],
    'preset members lead, the rest of the party follows'
  )
  assert.deepEqual(applied.box, [], 'the boxed member left the box')
  assert.equal(applied.playerPokemon.id, '3')

  // A member that no longer exists is skipped, and the rest of the party stays.
  const ghost = { id: 'p2', name: 'Ghost', members: ['999', '2'] },
    appliedGhost = gameReducer(
      { ...base, teamPresets: [ghost] },
      { type: 'APPLY_TEAM_PRESET', payload: { presetId: 'p2' } }
    )
  assert.deepEqual(appliedGhost.party.map((member) => member.id), ['2', '1'])

  // Applying mid-battle is a no-op.
  const battling = { ...base, phase: 'battling', teamPresets: [preset] }
  assert.equal(
    gameReducer(battling, { type: 'APPLY_TEAM_PRESET', payload: { presetId: 'p1' } }),
    battling
  )

  // Deleting removes it.
  const deleted = gameReducer(
    { ...base, teamPresets: [preset] },
    { type: 'DELETE_TEAM_PRESET', payload: { presetId: 'p1' } }
  )
  assert.equal(deleted.teamPresets.length, 0)
})

test('team presets cap at MAX_TEAM_PRESETS', async () => {
  const { MAX_TEAM_PRESETS } = await import('../src/data/config.js'),
    member = createPokemon('bulbasaur', 5, '1')
  let state = { ...initialGameState, phase: 'idle', party: [member], playerPokemon: member }
  for (let index = 0; index < MAX_TEAM_PRESETS + 2; index++)
    state = gameReducer(state, { type: 'SAVE_TEAM_PRESET', payload: {} })
  assert.equal(state.teamPresets.length, MAX_TEAM_PRESETS)
  assert.equal(
    new Set(state.teamPresets.map((preset) => preset.id)).size,
    MAX_TEAM_PRESETS,
    'preset ids stay unique'
  )
})
