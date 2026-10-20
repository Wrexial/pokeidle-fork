import test from 'node:test'
import assert from 'node:assert/strict'

import {
  FEATURE_UNLOCKS,
  featureUnlockHint,
  isFeatureUnlocked,
  unlockedFeatureIds,
} from '../src/game/feature-unlocks.js'

/**
 * A fresh-save state slice covering every field the gates read.
 * @param {Record<string, any>} [overrides]
 * @returns {any}
 */
function makeState(overrides = {}) {
  return {
    wildBattlesWon: 0,
    trainerBattlesWon: 0,
    defeatedGyms: [],
    defeatedChampions: [],
    hunt: null,
    jobs: {},
    teamPresets: [],
    secretBase: { locationId: null },
    pokewalker: { totalSteps: 0 },
    ...overrides,
  }
}

/** @param {number} count */
function gyms(count) {
  return Array.from({ length: count }, (_, index) => `gym-${index}`)
}

test('a fresh save starts with the late-run systems locked', () => {
  const fresh = makeState()
  for (const featureId of Object.keys(FEATURE_UNLOCKS)) {
    assert.equal(
      isFeatureUnlocked(fresh, /** @type {any} */ (featureId)),
      false,
      `${featureId} should be locked on a fresh save`
    )
  }
})

test('each badge tier opens exactly one Dailies system', () => {
  const order = [
    'dailyEvent',
    'quests',
    'pokewalker',
    'professorStory',
    'focusHunt',
    'sosChain',
    'secretBase',
  ]
  for (let count = 0; count <= order.length; count++) {
    const open = unlockedFeatureIds(makeState({ defeatedGyms: gyms(count) }))
    assert.deepEqual(open, order.slice(0, count), `${count} badges`)
  }
  // Four badges no longer dumps every mid-run system on the player at once.
  const fourBadges = makeState({ defeatedGyms: gyms(4) })
  assert.equal(isFeatureUnlocked(fourBadges, 'focusHunt'), false)
  assert.equal(isFeatureUnlocked(fourBadges, 'sosChain'), false)
  assert.equal(isFeatureUnlocked(fourBadges, 'secretBase'), false)
})

test('Mystery Gifts open on a lifetime battle count', () => {
  const almost = makeState({ wildBattlesWon: 499 })
  assert.equal(isFeatureUnlocked(almost, 'mysteryGifts'), false)
  const reached = makeState({ wildBattlesWon: 400, trainerBattlesWon: 100 })
  assert.equal(isFeatureUnlocked(reached, 'mysteryGifts'), true)
})

test('a region Champion opens the Bank, team presets and Field Jobs', () => {
  const champion = makeState({ defeatedChampions: ['kanto'] })
  for (const featureId of ['bank', 'teamPresets', 'fieldJobs']) {
    assert.equal(isFeatureUnlocked(champion, /** @type {any} */ (featureId)), true, featureId)
  }
})

test('features stay open after a region is prestiged', () => {
  // Prestiging clears the region's badges but keeps its Champion defeat, which
  // is worth a full region's badges for the feature gates.
  const prestiged = makeState({
    defeatedGyms: [],
    defeatedChampions: ['kanto'],
    wildBattlesWon: 1000,
  })
  for (const featureId of ['secretBase', 'focusHunt', 'sosChain', 'bank']) {
    assert.equal(isFeatureUnlocked(prestiged, /** @type {any} */ (featureId)), true, featureId)
  }
})

test('existing saves keep access to the features they already use', () => {
  const legacy = makeState({
    hunt: { mode: 'species', target: 'pikachu' },
    jobs: { 'route1:fishing': { pokemonId: 1 } },
    teamPresets: [{ id: 'preset-1', name: 'Team', members: [] }],
    secretBase: { locationId: 'route1' },
  })
  for (const featureId of ['focusHunt', 'fieldJobs', 'teamPresets', 'secretBase']) {
    assert.equal(isFeatureUnlocked(legacy, /** @type {any} */ (featureId)), true, featureId)
  }
})

test('banked Pokewalker steps do not skip its badge gate', () => {
  // Steps accrue on every save, open ones included, so a step count can't be
  // read as "this save already used the panel" without opening it immediately.
  const walked = makeState({ pokewalker: { totalSteps: 5000 } })
  assert.equal(isFeatureUnlocked(walked, 'pokewalker'), false)
  assert.equal(
    isFeatureUnlocked(makeState({ defeatedGyms: gyms(2) }), 'pokewalker'),
    false
  )
  assert.equal(
    isFeatureUnlocked(makeState({ defeatedGyms: gyms(3) }), 'pokewalker'),
    true
  )
})

test('unlockedFeatureIds only lists the open features', () => {
  const fresh = makeState()
  assert.deepEqual(unlockedFeatureIds(fresh), [])

  const oneBadge = makeState({ defeatedGyms: gyms(1) })
  assert.deepEqual(unlockedFeatureIds(oneBadge), ['dailyEvent'])

  const threeBadges = makeState({ defeatedGyms: gyms(3) })
  assert.deepEqual(unlockedFeatureIds(threeBadges), ['dailyEvent', 'quests', 'pokewalker'])
})

test('every feature has a label, an icon and a display hint', () => {
  for (const [featureId, feature] of Object.entries(FEATURE_UNLOCKS)) {
    assert.ok(feature.label, `${featureId} label`)
    assert.ok(feature.icon, `${featureId} icon`)
    assert.ok(feature.description, `${featureId} description`)
    assert.ok(feature.requirement, `${featureId} requirement`)
    assert.equal(
      featureUnlockHint(/** @type {any} */ (featureId)),
      `Unlocks after ${feature.requirement}`
    )
  }
})
