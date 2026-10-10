import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { MINIGAME_INFO, MINIGAME_PHASES, MINIGAME_TUTORIALS, minigameIdForPhase } = await import(
  '../src/game/minigames.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { SAVED_STATE_KEYS } = await import('../src/game/save.js')

test('every minigame has a how-to-play tutorial and no ghost entries', () => {
  const infoKeys = Object.keys(MINIGAME_INFO).sort(),
    tutorialKeys = Object.keys(MINIGAME_TUTORIALS).sort()
  assert.deepEqual(tutorialKeys, infoKeys, 'tutorials must cover exactly the registered minigames')
  for (const [minigameId, steps] of Object.entries(MINIGAME_TUTORIALS)) {
    assert.ok(Array.isArray(steps) && steps.length > 0, `${minigameId} needs at least one step`)
    for (const step of steps) assert.ok(step.trim().length > 0, `${minigameId} has an empty step`)
  }
})

test('minigameIdForPhase inverts every phase, including the renamed ones', () => {
  for (const [minigameId, phase] of Object.entries(MINIGAME_PHASES))
    assert.equal(minigameIdForPhase(phase), minigameId, `${phase} should map back to ${minigameId}`)
  // The phases whose id differs from their key are the reason this inverts.
  assert.equal(minigameIdForPhase('bugCatching'), 'bugContest')
  assert.equal(minigameIdForPhase('pelago'), 'pokePelago')
})

test('minigameIdForPhase returns null outside a minigame', () => {
  for (const phase of ['idle', 'battling', 'routeActivity', 'wonderTrade', 'gameOver'])
    assert.equal(minigameIdForPhase(phase), null)
})

test('MARK_TUTORIAL_SEEN records an id once and only once', () => {
  assert.deepEqual(initialGameState.seenTutorials, [])
  const once = gameReducer(initialGameState, {
      type: 'MARK_TUTORIAL_SEEN',
      payload: { minigameId: 'mining' },
    }),
    twice = gameReducer(once, { type: 'MARK_TUTORIAL_SEEN', payload: { minigameId: 'mining' } }),
    second = gameReducer(twice, {
      type: 'MARK_TUTORIAL_SEEN',
      payload: { minigameId: 'bugContest' },
    })
  assert.deepEqual(once.seenTutorials, ['mining'])
  assert.equal(twice, once, 're-marking the same tutorial must not change state')
  assert.deepEqual(second.seenTutorials, ['mining', 'bugContest'])
})

test('MARK_TUTORIAL_SEEN ignores a missing id and tolerates old state', () => {
  assert.equal(
    gameReducer(initialGameState, { type: 'MARK_TUTORIAL_SEEN', payload: {} }),
    initialGameState
  )
  // A state loaded before the preference existed has no array; it must not throw.
  const legacy = /** @type {any} */ ({ ...initialGameState, seenTutorials: undefined }),
    marked = gameReducer(legacy, {
      type: 'MARK_TUTORIAL_SEEN',
      payload: { minigameId: 'mining' },
    })
  assert.deepEqual(marked.seenTutorials, ['mining'])
})

test('seenTutorials is a shared preference, not run progress', () => {
  assert.ok(!SAVED_STATE_KEYS.includes('seenTutorials'))
})
