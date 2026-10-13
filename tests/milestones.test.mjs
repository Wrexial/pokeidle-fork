import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { initialGameState, gameReducer } = await import('../src/game/reducer.js')
const {
  MILESTONE_CAP,
  backfillMilestones,
  recordMilestones,
  sanitizeMilestones,
  summarizeRun,
} = await import('../src/game/milestones.js')
const { repairSave } = await import('../src/game/save.js')

/** @param {Record<string, any>} [overrides] */
function baseState(overrides = {}) {
  return { ...initialGameState, phase: 'idle', startRegion: 'kanto', ...overrides }
}

test('registering a new species records a catch milestone', () => {
  const before = baseState(),
    after = gameReducer(before, { type: 'MARK_CAUGHT', payload: { speciesKey: 'pikachu' } }),
    milestone = after.milestones.find(entry => entry.kind === 'catch')
  assert.ok(milestone, 'a catch milestone was recorded')
  assert.equal(milestone.key, 'pikachu')
  assert.equal(milestone.name, 'Pikachu')
})

test('a legendary catch gets its own kind', () => {
  const after = gameReducer(baseState(), {
    type: 'MARK_CAUGHT',
    payload: { speciesKey: 'mewtwo' },
  })
  assert.ok(after.milestones.some(entry => entry.kind === 'legendary' && entry.key === 'mewtwo'))
  assert.ok(!after.milestones.some(entry => entry.kind === 'catch' && entry.key === 'mewtwo'))
})

test('recording the same milestone twice does not duplicate it', () => {
  const once = gameReducer(baseState(), {
      type: 'MARK_CAUGHT',
      payload: { speciesKey: 'pikachu' },
    }),
    twice = gameReducer(once, { type: 'MARK_CAUGHT', payload: { speciesKey: 'pikachu' } })
  assert.equal(twice.milestones.filter(entry => entry.id === 'catch:pikachu').length, 1)
})

test('a shiny catch records a shiny milestone', () => {
  const after = gameReducer(baseState(), {
    type: 'MARK_SHINY_CAUGHT',
    payload: { speciesKey: 'pikachu' },
  })
  assert.ok(after.milestones.some(entry => entry.kind === 'shiny' && entry.key === 'pikachu'))
})

test('a new gym badge records a badge milestone', () => {
  const before = baseState()
  const after = recordMilestones(before, { ...before, defeatedGyms: ['brock'], milestones: [] })
  const milestone = after.milestones.find(entry => entry.kind === 'badge')
  assert.ok(milestone, 'a badge milestone was recorded')
  assert.equal(milestone.key, 'brock')
  assert.equal(milestone.name, 'Boulder Badge')
})

test('a first level 100 records once, not on every later tick', () => {
  const before = baseState()
  const mon = { id: 'mon-1', speciesKey: 'pikachu', name: 'Pikachu', level: 100, moves: [] }
  const maxed = recordMilestones(before, { ...before, party: [mon], playerPokemon: mon, milestones: [] })
  assert.ok(maxed.milestones.some(entry => entry.kind === 'level100' && entry.key === 'mon-1'))
  // A later state that changes the party reference again (same maxed Pokemon)
  // must not append a second milestone.
  const again = recordMilestones(maxed, { ...maxed, party: [{ ...mon }] })
  assert.equal(again.milestones.filter(entry => entry.kind === 'level100').length, 1)
})

test('the timeline is capped', () => {
  const before = baseState(),
    caught = Array.from({ length: MILESTONE_CAP + 50 }, (_, index) => `species-${index}`)
  const after = recordMilestones(before, { ...before, pokedexCaught: caught, milestones: [] })
  assert.equal(after.milestones.length, MILESTONE_CAP)
  // The cap keeps the newest entries.
  assert.equal(after.milestones[after.milestones.length - 1].key, `species-${MILESTONE_CAP + 49}`)
})

test('the cap keeps important milestones over a catch flood', () => {
  const before = baseState()
  const badged = recordMilestones(before, { ...before, defeatedGyms: ['brock'], milestones: [] })
  const caught = Array.from({ length: MILESTONE_CAP + 50 }, (_, index) => `species-${index}`)
  const after = recordMilestones(badged, { ...badged, pokedexCaught: caught })
  assert.equal(after.milestones.length, MILESTONE_CAP)
  assert.ok(
    after.milestones.some(entry => entry.kind === 'badge' && entry.key === 'brock'),
    'the badge survives the catch flood'
  )
})

test('sanitizeMilestones drops unknown kinds and clamps the cap', () => {
  const raw = [
    { id: 'keep', kind: 'catch', at: 1, key: 'pikachu', name: 'Pikachu' },
    { id: 'drop', kind: 'not-a-kind', at: 1, key: 'x', name: 'X' },
    ...Array.from({ length: MILESTONE_CAP + 10 }, (_, index) => ({
      id: `s-${index}`,
      kind: 'badge',
      at: index,
      key: `gym-${index}`,
      name: 'Badge',
    })),
  ]
  const cleaned = sanitizeMilestones(raw)
  assert.equal(cleaned.length, MILESTONE_CAP)
  assert.ok(!cleaned.some(entry => entry.id === 'drop'))
})

test('backfillMilestones marks pre-feature saves as earlier', () => {
  const timeline = backfillMilestones({
    starterSpeciesKey: 'bulbasaur',
    startRegion: 'kanto',
    unlockedRegions: ['kanto'],
    pokedexCaught: ['bulbasaur', 'mewtwo'],
    shinyCaught: ['pikachu'],
    defeatedGyms: ['brock'],
    defeatedEliteFour: [],
    defeatedChampions: [],
    party: [{ id: 'a', speciesKey: 'pikachu', name: 'Pikachu', level: 100 }],
    box: [],
  })
  assert.ok(timeline.every(entry => entry.backfilled))
  assert.ok(timeline.some(entry => entry.kind === 'starter'))
  assert.ok(timeline.some(entry => entry.kind === 'legendary' && entry.key === 'mewtwo'))
  assert.ok(timeline.some(entry => entry.kind === 'shiny' && entry.key === 'pikachu'))
  assert.ok(timeline.some(entry => entry.kind === 'badge' && entry.key === 'brock'))
})

test('summarizeRun derives headline stats and callouts', () => {
  const state = baseState({
      pokedexCaught: ['pikachu', 'bulbasaur'],
      shinyCaught: ['pikachu'],
      defeatedGyms: ['brock'],
      defeatedChampions: ['kanto'],
      unlockedRegions: ['kanto', 'johto'],
      trainerProfile: { ...initialGameState.trainerProfile, name: 'Ash' },
      milestones: [
        { id: 'shiny:pikachu', kind: 'shiny', at: 1, key: 'pikachu', name: 'Pikachu' },
        { id: 'level100:a', kind: 'level100', at: 2, key: 'a', name: 'Sparky' },
      ],
    }),
    summary = summarizeRun(state)
  assert.equal(summary.trainerName, 'Ash')
  assert.equal(summary.stats.caught, 2)
  assert.equal(summary.stats.shinies, 1)
  assert.equal(summary.stats.badges, 1)
  assert.equal(summary.stats.champions, 1)
  assert.equal(summary.firstShiny?.key, 'pikachu')
  assert.equal(summary.firstLevel100?.name, 'Sparky')
})

test('repairSave backfills a save that predates the timeline', () => {
  const started = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
  const { milestones, ...stripped } = started
  const repaired = repairSave({
    ...stripped,
    pokedexCaught: ['bulbasaur', 'mewtwo'],
    shinyCaught: ['pikachu'],
    defeatedGyms: ['brock'],
  })
  assert.ok(repaired.milestones.length > 0, 'a backfilled timeline was built')
  assert.ok(repaired.milestones.every(entry => entry.backfilled))
  assert.ok(repaired.milestones.some(entry => entry.kind === 'legendary'))
})

test('repairSave keeps a recorded timeline', () => {
  const started = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
  const repaired = repairSave({
    ...started,
    milestones: [{ id: 'catch:pikachu', kind: 'catch', at: 1, key: 'pikachu', name: 'Pikachu' }],
  })
  assert.deepEqual(
    repaired.milestones.map(entry => entry.id),
    ['catch:pikachu']
  )
})
