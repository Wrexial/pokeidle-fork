import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { initialGameState, gameReducer } = await import('../src/game/reducer.js')
const { SAVED_STATE_KEYS, decodeShareCode, encodeShareCode, repairSave, serializeSave } = await import('../src/game/save.js')

const ENVELOPE_KEYS = ['version', 'savedAt']

/** Start a Kanto run with Bulbasaur and a few persisted fields changed. */
function startedGame() {
  const base = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
  return {
    ...base,
    speed: 5,
    autoCatch: false,
    money: 1234,
    inventory: { ...base.inventory, pokeball: 7 },
    wildBattlesWon: 12,
    battlesWonByLocation: { route1: 12 },
  }
}

test('serializeSave writes exactly the declared save fields', () => {
  const saved = serializeSave(startedGame()),
    keys = Object.keys(saved)
  assert.deepEqual([...keys].sort(), [...ENVELOPE_KEYS, ...SAVED_STATE_KEYS].sort())
})

test('every declared save field exists on the initial state', () => {
  for (const key of SAVED_STATE_KEYS) {
    assert.ok(key in initialGameState, `initialGameState is missing persisted field "${key}"`)
  }
})

test('the save field list has no duplicates or envelope keys', () => {
  assert.equal(new Set(SAVED_STATE_KEYS).size, SAVED_STATE_KEYS.length)
  for (const key of ENVELOPE_KEYS)
    assert.ok(!SAVED_STATE_KEYS.includes(key), `"${key}" is written by serializeSave itself`)
})

test('serializeSave keeps the value of every persisted field', () => {
  const state = startedGame(),
    saved = serializeSave(state)
  for (const key of SAVED_STATE_KEYS) assert.deepEqual(saved[key], state[key], key)
})

test('a serialized save round-trips through repairSave', () => {
  const state = startedGame(),
    repaired = repairSave(serializeSave(state))
  assert.ok(repaired, 'a freshly serialized save must repair')
  for (const key of ['money', 'inventory', 'wildBattlesWon', 'battlesWonByLocation'])
    assert.deepEqual(repaired[key], state[key], key)
})

test('the Game Corner prize track survives a save round-trip', () => {
  const repaired = repairSave(serializeSave({ ...startedGame(), gameCornerProgress: 13 }))
  assert.equal(repaired.gameCornerProgress, 13)
})

test('repairSave keeps well-formed team presets and drops junk', () => {
  const repaired = repairSave(
    serializeSave({
      ...startedGame(),
      teamPresets: [
        { id: 'a', name: 'Alpha', members: ['1', '2'] },
        { id: 'b', members: ['3'] },
        { name: 'no members' },
        'nonsense',
      ],
    })
  )
  assert.equal(repaired.teamPresets.length, 2)
  assert.deepEqual(repaired.teamPresets[0], { id: 'a', name: 'Alpha', members: ['1', '2'] })
  assert.equal(repaired.teamPresets[1].name, 'Team 2')
  assert.deepEqual(repaired.teamPresets[1].members, ['3'])
  // A too-long preset is trimmed to a party of six.
  const capped = repairSave(
    serializeSave({
      ...startedGame(),
      teamPresets: [{ id: 'c', name: 'Big', members: ['1', '2', '3', '4', '5', '6', '7', '8'] }],
    })
  )
  assert.equal(capped.teamPresets[0].members.length, 6)
})

test('repairSave reverts a Pokemon saved in a Mega / Gigantamax form', () => {
  const base = startedGame()
  /** @param {string} speciesKey @param {string} name @param {string[]} types */
  const savedAs = (speciesKey, name, types) => ({
    ...base.party[0],
    speciesKey,
    name,
    types,
    level: 100,
  })
  for (const [formKey, baseKey, name, types] of [
    ['gx-venusaur', 'venusaur', 'Venusaur', ['Grass', 'Poison']],
    ['m-charizard x', 'charizard', 'Charizard', ['Fire', 'Flying']],
    ['p-groudon', 'groudon', 'Groudon', ['Ground']],
  ]) {
    const pokemon = savedAs(formKey, name, types),
      repaired = repairSave(serializeSave({ ...base, party: [pokemon], playerPokemon: pokemon }))
    assert.ok(repaired, `${formKey} save repairs`)
    assert.equal(repaired.party[0].speciesKey, baseKey, `${formKey} reverts to ${baseKey}`)
    assert.equal(repaired.party[0].name, name)
  }
})

test('repairSave clamps an out-of-range HP and drops battle stat stages', () => {
  const base = startedGame(),
    // A stale save can carry currentHp above maxHp (the HP bar sticks at full
    // and the Pokemon is nearly unkillable) and a leftover hazard statStages.
    corrupt = {
      ...base.party[0],
      maxHp: 80,
      currentHp: 999999,
      statStages: { speed: -1 },
    },
    repaired = repairSave(
      serializeSave({ ...base, party: [corrupt], playerPokemon: corrupt })
    )
  assert.ok(repaired, 'the corrupt save still repairs')
  assert.equal(repaired.party[0].maxHp, 80)
  assert.equal(repaired.party[0].currentHp, 80, 'currentHp is clamped to maxHp')
  assert.equal(repaired.playerPokemon.currentHp, 80)
  assert.equal('statStages' in repaired.party[0], false, 'battle stages are stripped')
})

test('repairSave leaves a healthy Pokemon HP untouched', () => {
  const base = startedGame(),
    wounded = { ...base.party[0], maxHp: base.party[0].maxHp, currentHp: 1 },
    repaired = repairSave(
      serializeSave({ ...base, party: [wounded], playerPokemon: wounded })
    )
  assert.equal(repaired.party[0].currentHp, 1)
  assert.equal(repaired.party[0].maxHp, wounded.maxHp)
})

test('preferences are not written into the save', () => {
  const saved = serializeSave(startedGame())
  for (const key of ['speed', 'autoCatch', 'battleStyle', 'browserNotifications', 'musicEnabled'])
    assert.ok(!(key in saved), `preference "${key}" should live in the settings store, not the save`)
})

test('repairSave opens a zone region entry hub for a stuck save', () => {
  // An Alola save whose entry hub was gated behind an unreachable catch goal:
  // the repair has to open the hub and its first area so the region is playable.
  const stuck = {
      ...startedGame(),
      startRegion: 'alola',
      currentLocation: 'alola-iki-town',
      currentRoute: 'route1',
      unlockedLocations: ['alola-iki-town'],
      unlockedRegions: ['alola'],
    },
    repaired = repairSave(serializeSave(stuck))
  assert.ok(repaired, 'the stuck save repairs')
  assert.ok(repaired.unlockedLocations.includes('alola-melemele-island'), 'the zone hub is opened')
  assert.ok(repaired.unlockedLocations.includes('alola-route-1'), 'the first sub-area is opened')
  assert.equal(repaired.currentRoute, 'alola-route-1', 'the wrong-region route is replaced')
})

test('the autosave tracks fields that are not covered by other slices', () => {
  // GameProvider derives its effect dependencies from this list, so these
  // must be present for a change to them to trigger an autosave. Preferences
  // are tracked separately by the settings store instead.
  for (const key of ['currentLocation', 'unlockedLocations', 'shinyChain', 'swarm', 'pokerus', 'daycare', 'dailyEvent'])
    assert.ok(SAVED_STATE_KEYS.includes(key), `${key} should be persisted and autosaved`)
})

test('a save round-trips through a share code', () => {
  const state = startedGame(),
    code = encodeShareCode(serializeSave(state)),
    decoded = decodeShareCode(code)
  assert.ok(decoded, 'the code decodes')
  assert.equal(decoded.money, state.money)
  assert.equal(decoded.currentLocation, state.currentLocation)
  assert.ok(repairSave(decoded), 'the decoded blob repairs like the original')
})

test('a share code is URL-safe base64 without padding', () => {
  assert.match(encodeShareCode(serializeSave(startedGame())), /^[A-Za-z0-9_-]+$/)
})

test('a share code tolerates pasted whitespace', () => {
  const code = encodeShareCode(serializeSave(startedGame())),
    spaced = `  ${code.slice(0, 12)}\n${code.slice(12)}  `
  assert.deepEqual(decodeShareCode(spaced), decodeShareCode(code))
})

test('share codes keep non-Latin characters intact', () => {
  const state = startedGame()
  state.party[0].nickname = 'Pok\u00e9 \u2728'
  const decoded = decodeShareCode(encodeShareCode(serializeSave(state)))
  assert.equal(decoded.party[0].nickname, 'Pok\u00e9 \u2728')
})

test('decodeShareCode returns null for junk', () => {
  assert.equal(decodeShareCode('not a share code!!'), null)
  assert.equal(decodeShareCode(''), null)
  // Valid base64 JSON that is not a save still decodes; repairSave rejects it.
  assert.equal(repairSave(decodeShareCode(btoa('{"nope":true}'))), null)
})

test('repairSave treats a legacy shiny chain as having no banked radar levels', () => {
  const state = startedGame(),
    // An old save stored the combined chain count with no radar counter.
    legacy = {
      ...serializeSave(state),
      shinyChain: { speciesKey: 'pidgey', count: 40, target: 5 },
    },
    repaired = repairSave(legacy)
  assert.equal(repaired.shinyChain.count, 40, 'the ordinary chain is kept')
  assert.equal(repaired.shinyChain.radar, 0, 'the legacy count is not read as radar progress')
})

test('repairSave keeps banked radar levels', () => {
  const state = startedGame(),
    save = {
      ...serializeSave(state),
      shinyChain: { speciesKey: 'pidgey', count: 12, radar: 5, target: 5 },
    },
    repaired = repairSave(save)
  assert.equal(repaired.shinyChain.count, 12)
  assert.equal(repaired.shinyChain.radar, 5)
})
