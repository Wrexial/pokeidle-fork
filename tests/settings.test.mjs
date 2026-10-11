import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { generateIVs } = await import('../src/game/pokemon.js')
const { playSfx, startMusic, stopMusic, unlockAudio } = await import('../src/game/audio.js')

test('accessibility toggles flip their settings', () => {
  const reduced = gameReducer(initialGameState, { type: 'TOGGLE_REDUCED_MOTION' })
  assert.equal(reduced.reducedMotion, true)
  assert.equal(
    gameReducer(reduced, { type: 'TOGGLE_REDUCED_MOTION' }).reducedMotion,
    false
  )

  const colourblind = gameReducer(initialGameState, { type: 'TOGGLE_COLOURBLIND_TYPES' })
  assert.equal(colourblind.colourblindTypes, true)
  assert.equal(
    gameReducer(colourblind, { type: 'TOGGLE_COLOURBLIND_TYPES' }).colourblindTypes,
    false
  )

  const largeText = gameReducer(initialGameState, { type: 'TOGGLE_LARGE_TEXT' })
  assert.equal(largeText.largeText, true)
  assert.equal(gameReducer(largeText, { type: 'TOGGLE_LARGE_TEXT' }).largeText, false)
})

test('audio toggles flip their settings', () => {
  const music = gameReducer(initialGameState, { type: 'TOGGLE_MUSIC' })
  assert.equal(music.musicEnabled, true)
  assert.equal(gameReducer(music, { type: 'TOGGLE_MUSIC' }).musicEnabled, false)

  const sfx = gameReducer(initialGameState, { type: 'TOGGLE_SFX' })
  assert.equal(sfx.sfxEnabled, false)
  assert.equal(gameReducer(sfx, { type: 'TOGGLE_SFX' }).sfxEnabled, true)
})

test('audio defaults: music off, sound effects on', () => {
  assert.equal(initialGameState.musicEnabled, false)
  assert.equal(initialGameState.sfxEnabled, true)
})

test('battle style defaults to Switch and can be set to Set or Training', () => {
  assert.equal(initialGameState.battleStyle, 'switch')
  const setStyle = gameReducer(initialGameState, {
    type: 'SET_BATTLE_STYLE',
    payload: { style: 'set' },
  })
  assert.equal(setStyle.battleStyle, 'set')
  const trainingStyle = gameReducer(initialGameState, {
    type: 'SET_BATTLE_STYLE',
    payload: { style: 'training' },
  })
  assert.equal(trainingStyle.battleStyle, 'training')
  assert.equal(
    gameReducer(setStyle, { type: 'SET_BATTLE_STYLE', payload: { style: 'switch' } }).battleStyle,
    'switch'
  )
  // Anything unrecognised falls back to Switch (the default).
  assert.equal(
    gameReducer(initialGameState, { type: 'SET_BATTLE_STYLE', payload: { style: 'nonsense' } })
      .battleStyle,
    'switch'
  )
})

test('the audio engine is a no-op without a browser AudioContext', () => {
  // The test helper sets window without AudioContext, so these must not throw.
  assert.doesNotThrow(() => {
    unlockAudio()
    startMusic('kanto')
    playSfx('shiny')
    stopMusic()
  })
})

test('repairSave defaults the accessibility settings off and keeps them on', () => {
  const save = (/** @type {Record<string, any>} */ overrides) => ({
      version: 2,
      playerPokemon: {
        id: '1',
        speciesKey: 'bulbasaur',
        level: 5,
        ivs: generateIVs(),
        moves: ['tackle'],
        currentHp: 20,
        maxHp: 20,
      },
      party: [],
      box: [],
      nextPokemonId: 2,
      inventory: {},
      ...overrides,
    }),
    defaults = repairSave(save({})),
    enabled = repairSave(save({ reducedMotion: true, colourblindTypes: true }))
  assert.equal(defaults.reducedMotion, false)
  assert.equal(defaults.colourblindTypes, false)
  assert.equal(enabled.reducedMotion, true)
  assert.equal(enabled.colourblindTypes, true)
  assert.equal(defaults.largeText, false)
  assert.equal(repairSave(save({ largeText: true })).largeText, true)
  assert.equal(defaults.musicEnabled, false)
  assert.equal(defaults.sfxEnabled, true)
  assert.equal(repairSave(save({ musicEnabled: true, sfxEnabled: true })).musicEnabled, true)
  assert.equal(repairSave(save({ musicEnabled: true, sfxEnabled: false })).sfxEnabled, false)
  assert.equal(defaults.battleStyle, 'switch')
  assert.equal(repairSave(save({ battleStyle: 'set' })).battleStyle, 'set')
  assert.equal(repairSave(save({ battleStyle: 'training' })).battleStyle, 'training')
  assert.equal(repairSave(save({ battleStyle: 'garbage' })).battleStyle, 'switch')
  // The notification category toggles default on and keep an explicit off.
  assert.equal(defaults.notifyShiny, true)
  assert.equal(defaults.notifyRare, true)
  assert.equal(defaults.notifyEgg, true)
  assert.equal(repairSave(save({ notifyShiny: false })).notifyShiny, false)
  assert.equal(repairSave(save({ notifyEgg: false })).notifyEgg, false)
})

test('the sprite style toggle switches between animated and static', () => {
  const staticSprites = gameReducer(initialGameState, { type: 'TOGGLE_SPRITE_STYLE' })
  assert.equal(staticSprites.spriteStyle, 'static')
  assert.equal(
    gameReducer(staticSprites, { type: 'TOGGLE_SPRITE_STYLE' }).spriteStyle,
    'animated'
  )
})

test('auto-heal is opt-in and toggles', () => {
  assert.equal(initialGameState.autoHeal, false)
  const on = gameReducer(initialGameState, { type: 'TOGGLE_AUTO_HEAL' })
  assert.equal(on.autoHeal, true)
  assert.equal(gameReducer(on, { type: 'TOGGLE_AUTO_HEAL' }).autoHeal, false)
})

test('damage numbers and shiny sparkles default on and toggle', () => {
  assert.equal(initialGameState.showDamageNumbers, true)
  assert.equal(initialGameState.showShinySparkles, true)
  const noDamage = gameReducer(initialGameState, { type: 'TOGGLE_DAMAGE_NUMBERS' })
  assert.equal(noDamage.showDamageNumbers, false)
  assert.equal(noDamage.showShinySparkles, true)
  const noSparkle = gameReducer(initialGameState, { type: 'TOGGLE_SHINY_SPARKLES' })
  assert.equal(noSparkle.showShinySparkles, false)
  assert.equal(noSparkle.showDamageNumbers, true)
})

test('SET_DEFAULT_CATCH_RULE updates only the default rule', () => {
  const defaultRule = { ...initialGameState.globalCatchDefaults }
  const withLevel = gameReducer(initialGameState, {
    type: 'SET_DEFAULT_CATCH_RULE',
    payload: { rule: { mode: 'level_threshold', levelThreshold: 20 } },
  })
  assert.equal(withLevel.globalCatchDefaults.mode, 'level_threshold')
  assert.equal(withLevel.globalCatchDefaults.levelThreshold, 20)
  // The untouched fields (and every route rule) stay put.
  assert.deepEqual(withLevel.catchSettings, initialGameState.catchSettings)
  assert.equal(withLevel.globalCatchDefaults.enabled, defaultRule.enabled)
  // Invalid fields fall back to the existing value, and a non-rule payload is a no-op.
  assert.equal(
    gameReducer(withLevel, {
      type: 'SET_DEFAULT_CATCH_RULE',
      payload: { rule: { levelThreshold: -4 } },
    }).globalCatchDefaults.levelThreshold,
    20
  )
  assert.equal(
    gameReducer(initialGameState, {
      type: 'SET_DEFAULT_CATCH_RULE',
      payload: {},
    }),
    initialGameState
  )
})

test('SET_DEFAULT_CATCH_RULE filters unknown balls and keeps at least one', () => {
  const filtered = gameReducer(initialGameState, {
    type: 'SET_DEFAULT_CATCH_RULE',
    payload: { rule: { enabledBalls: ['pokeball', 'notARealBall'] } },
  })
  assert.deepEqual(filtered.globalCatchDefaults.enabledBalls, ['pokeball'])
  const empty = gameReducer(initialGameState, {
    type: 'SET_DEFAULT_CATCH_RULE',
    payload: { rule: { enabledBalls: [] } },
  })
  assert.deepEqual(empty.globalCatchDefaults.enabledBalls, initialGameState.globalCatchDefaults.enabledBalls)
})

test('repairSave defaults auto-heal off and the display toggles on', () => {
  const save = (/** @type {Record<string, any>} */ overrides) => ({
      version: 2,
      playerPokemon: {
        id: '1',
        speciesKey: 'bulbasaur',
        level: 5,
        ivs: generateIVs(),
        moves: ['tackle'],
        currentHp: 20,
        maxHp: 20,
      },
      party: [],
      box: [],
      nextPokemonId: 2,
      inventory: {},
      ...overrides,
    }),
    defaults = repairSave(save({}))
  assert.equal(defaults.autoHeal, false)
  assert.equal(defaults.showDamageNumbers, true)
  assert.equal(defaults.showShinySparkles, true)
  const configured = repairSave(
    save({ autoHeal: true, showDamageNumbers: false, showShinySparkles: false })
  )
  assert.equal(configured.autoHeal, true)
  assert.equal(configured.showDamageNumbers, false)
  assert.equal(configured.showShinySparkles, false)
})
