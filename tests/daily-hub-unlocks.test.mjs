import test from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

// `dailyHubTabs` is a plain function even though it lives in a component
// module, so it can be called directly (the component imports use hooks, but
// the tab builder does not).
const { dailyHubStatus, dailyHubTabs } = await import('../src/components/daily-hub-modal.js')

/** @param {Record<string, any>} [overrides] @returns {any} */
function makeState(overrides = {}) {
  return {
    dailyEvent: null,
    quests: null,
    claimedGifts: [],
    companion: { id: null, careBattle: 0 },
    pokewalker: { steps: 0, totalSteps: 0 },
    unlockedLocations: ['palletTown', 'route1'],
    wildBattlesWon: 0,
    trainerBattlesWon: 0,
    defeatedGyms: [],
    defeatedChampions: [],
    pokedexCaught: [],
    professorStory: { claimed: [] },
    startRegion: 'kanto',
    unlockedRegions: [],
    ...overrides,
  }
}

/** @param {any[]} tabs @param {string} id */
function tab(tabs, id) {
  const found = tabs.find((entry) => entry.id === id)
  assert.ok(found, `${id} tab exists`)
  return found
}

test('a fresh save hides the Dailies button and locks every section', () => {
  const state = makeState(),
    tabs = dailyHubTabs(state)
  assert.deepEqual(dailyHubStatus(state), { available: false, claimable: false })
  for (const tabDef of tabs) assert.equal(tabDef.locked, true, tabDef.id)
  assert.equal(tab(tabs, 'quests').hint, 'Unlocks after 2 Gym badges')
})

test('the first badge opens the Daily Event and the hub, then the others follow', () => {
  const state = makeState({ defeatedGyms: ['kanto-pewter'] }),
    tabs = dailyHubTabs(state)
  assert.equal(dailyHubStatus(state).available, true)
  assert.equal(tab(tabs, 'event').locked, false)
  assert.equal(tab(tabs, 'quests').locked, true, 'quests wait for badge 2')
  assert.equal(tab(tabs, 'pokewalker').locked, true, 'the walker waits for badge 3')
  assert.equal(tab(tabs, 'story').locked, true)
  assert.equal(tab(tabs, 'story').hint, 'Unlocks after 4 Gym badges')

  const twoBadges = makeState({
    defeatedGyms: ['kanto-pewter', 'kanto-cerulean'],
  })
  assert.equal(tab(dailyHubTabs(twoBadges), 'quests').locked, false)
  assert.equal(tab(dailyHubTabs(twoBadges), 'pokewalker').locked, true)
})

test('a locked section never lights the claim dot', () => {
  // A big Pokewalker balance still can't pulse before its badge gate.
  const state = makeState({
    pokewalker: { steps: 9999, totalSteps: 0 },
  })
  assert.equal(tab(dailyHubTabs(state), 'pokewalker').locked, true)
  assert.equal(tab(dailyHubTabs(state), 'pokewalker').claimable, false)
  assert.equal(dailyHubStatus(state).claimable, false)
})
