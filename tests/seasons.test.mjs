import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  DAYS_PER_SEASON,
  SEASON_CYCLE_MS,
  SEASONS,
  currentSeason,
  msUntilSeasonChange,
  seasonAt,
} = await import('../src/game/seasons.js')
const { DAY_NIGHT_CYCLE_MS } = await import('../src/game/day-night.js')
const { encountersForPhase } = await import('../src/game/progression.js')
const { seasonalSpriteId, getPokemonSpriteUrl, getPokemonSpriteFallbackUrl } = await import(
  '../src/game/pokemon.js'
)
const { getEvolutionOptions } = await import('../src/game/breeding.js')
const { evolutionData } = await import('../src/data/gameData.js')

test('the seasonal cycle runs a season every four in-game days', () => {
  assert.equal(DAYS_PER_SEASON, 4)
  assert.equal(SEASON_CYCLE_MS, 4 * DAY_NIGHT_CYCLE_MS)
  assert.equal(seasonAt(0).id, 'spring')
  assert.equal(seasonAt(SEASON_CYCLE_MS * 0.3).id, 'summer')
  assert.equal(seasonAt(SEASON_CYCLE_MS * 0.6).id, 'autumn')
  assert.equal(seasonAt(SEASON_CYCLE_MS * 0.8).id, 'winter')
  // The year wraps, and every season is reachable across one loop.
  assert.equal(seasonAt(SEASON_CYCLE_MS).id, seasonAt(0).id)
  const ids = new Set()
  for (let step = 0; step < 40; step++) ids.add(seasonAt((SEASON_CYCLE_MS * step) / 40).id)
  assert.equal(ids.size, SEASONS.length)
})

test('currentSeason and msUntilSeasonChange follow the cycle', () => {
  assert.equal(currentSeason(0), 'spring')
  assert.equal(currentSeason(SEASON_CYCLE_MS * 0.9), 'winter')
  const now = SEASON_CYCLE_MS * 0.1,
    wait = msUntilSeasonChange(now)
  assert.ok(wait > 0 && wait <= SEASON_CYCLE_MS)
  assert.notEqual(seasonAt(now + wait + 1).id, seasonAt(now).id)
})

test('seasonal species swap their artwork by season', () => {
  // Deerling (585) is spring in base form, then one sprite per season.
  assert.equal(seasonalSpriteId(585, { season: 'spring', animated: true }), 585)
  assert.equal(seasonalSpriteId(585, { season: 'summer', animated: true }), '585-summer')
  assert.equal(seasonalSpriteId(586, { season: 'winter', animated: true }), '586-winter')
  // Burmy's cloak and Cherrim's sunshine form follow the season too.
  assert.equal(seasonalSpriteId(412, { season: 'autumn', animated: true }), '412-sandy')
  assert.equal(seasonalSpriteId(421, { season: 'summer', animated: true }), '421-sunshine')
  // Anything without seasonal art keeps its base sprite.
  assert.equal(seasonalSpriteId(25, { season: 'winter', animated: true }), 25)
})

test('the static set keeps the base art where a seasonal variant is missing', () => {
  // Wormadam's seasonal art is animated only.
  assert.equal(seasonalSpriteId(413, { season: 'autumn', animated: true }), '413-sandy')
  assert.equal(seasonalSpriteId(413, { season: 'autumn' }), 413)
  // There is no seasonal shiny front static png, so that falls back too.
  assert.equal(seasonalSpriteId(585, { season: 'summer', isShiny: true }), 585)
  assert.equal(seasonalSpriteId(585, { season: 'summer' }), '585-summer')
})

test('the sprite helpers resolve the seasonal variant from the clock', () => {
  const originalNow = Date.now
  try {
    // 0.3 through the year is summer.
    Date.now = () => SEASON_CYCLE_MS * 0.3
    assert.equal(
      getPokemonSpriteUrl(585, false, false, false),
      '/sprites/pokemon/versions/generation-v/black-white/animated/585-summer.gif'
    )
    assert.equal(getPokemonSpriteFallbackUrl(585, false, false, false), '/sprites/pokemon/585-summer.png')
    // Spring is the base artwork.
    Date.now = () => 0
    assert.equal(getPokemonSpriteFallbackUrl(585, false, false, false), '/sprites/pokemon/585.png')
  } finally {
    Date.now = originalNow
  }
})

test('season-gated encounters narrow the table, falling back when empty', () => {
  const table = [
    { speciesKey: 'snover', season: 'winter' },
    { speciesKey: 'vulpix', season: 'summer' },
    { speciesKey: 'pidgey' },
  ]
  assert.deepEqual(
    encountersForPhase(table, false, 'winter').map((entry) => entry.speciesKey),
    ['snover', 'pidgey']
  )
  assert.deepEqual(
    encountersForPhase(table, false, 'spring').map((entry) => entry.speciesKey),
    ['pidgey']
  )
  // A table that is entirely off-season falls back to the phase table.
  const winterOnly = [{ speciesKey: 'snover', season: 'winter' }]
  assert.deepEqual(encountersForPhase(winterOnly, false, 'summer'), winterOnly)
  // The day/night phase is still honoured alongside the season.
  const timed = [
    { speciesKey: 'hoothoot', time: 'night', season: 'winter' },
    { speciesKey: 'pidgey', time: 'day' },
  ]
  assert.deepEqual(encountersForPhase(timed, true, 'winter'), [timed[0]])
  assert.deepEqual(encountersForPhase(timed, false, 'winter'), [timed[1]])
  // Omitting the season keeps the previous behaviour.
  assert.deepEqual(encountersForPhase(table, false), table)
})

test('an evolution can be gated to a season', () => {
  const original = evolutionData.pikachu,
    originalNow = Date.now
  try {
    evolutionData.pikachu = [{ into: 'raichu', level: 20, season: 'winter' }]
    Date.now = () => SEASON_CYCLE_MS * 0.9 // winter
    const inSeason = getEvolutionOptions({ speciesKey: 'pikachu', level: 50 }, {})
    assert.equal(inSeason[0].canEvolve, true)
    assert.equal(inSeason[0].requirementLabel, 'Lv. 20 + Winter only')
    Date.now = () => 0 // spring
    const offSeason = getEvolutionOptions({ speciesKey: 'pikachu', level: 50 }, {})
    assert.equal(offSeason[0].canEvolve, false)
    assert.equal(offSeason[0].requirementLabel, 'Lv. 20 + Winter only')
  } finally {
    evolutionData.pikachu = original
    Date.now = originalNow
  }
})
