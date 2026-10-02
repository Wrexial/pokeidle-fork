import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  COMPANION_CARE_ACTIONS,
  COMPANION_CONTENT_THRESHOLD,
  COMPANION_EXP_MULTIPLIER,
  COMPANION_FEED_COST,
  COMPANION_MAX_CARE,
  applyCareAction,
  companionExpMultiplier,
  companionMood,
  createCompanionCare,
  isCompanionContent,
  tickCompanion,
} = await import('../src/game/companion.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')

test('companion mood reflects the lowest care stat', () => {
  assert.equal(companionMood(createCompanionCare(null, 0)), null)
  const happy = createCompanionCare('a', 0),
    hungry = { ...happy, fullness: 10 },
    sleepy = { ...happy, energy: 5, happiness: 30 }
  assert.equal(companionMood(happy).label, 'Happy')
  assert.ok(companionMood(happy).icon)
  assert.equal(companionMood(hungry).label, 'Hungry')
  assert.equal(companionMood(sleepy).label, 'Sleepy')
})

test('companion care helpers', () => {
  const care = createCompanionCare('a', 5)
  assert.deepEqual(care, {
    id: 'a',
    fullness: COMPANION_MAX_CARE,
    happiness: COMPANION_MAX_CARE,
    energy: COMPANION_MAX_CARE,
    cleanliness: COMPANION_MAX_CARE,
    careBattle: 4,
  })
  assert.equal(isCompanionContent(care), true)
  assert.equal(companionExpMultiplier(care), COMPANION_EXP_MULTIPLIER)
  assert.equal(isCompanionContent(createCompanionCare(null, 0)), false)
  assert.equal(companionExpMultiplier(createCompanionCare(null, 0)), 1)

  // Decay is a single point on a rotating stat, only when the companion fought.
  const afterOne = tickCompanion(care, true, 0)
  assert.equal(afterOne.fullness, COMPANION_MAX_CARE - 1)
  assert.equal(afterOne.happiness, COMPANION_MAX_CARE, 'only one stat drains per battle')
  const afterTwo = tickCompanion(afterOne, true, 1)
  assert.equal(afterTwo.happiness, COMPANION_MAX_CARE - 1)
  assert.equal(afterTwo.fullness, COMPANION_MAX_CARE - 1, 'the drain rotates')
  assert.equal(tickCompanion(care, false, 2), care, 'a battle it sat out does not decay it')

  // Decay never drops a stat below zero.
  const drained = tickCompanion({ ...care, energy: 0 }, true, 2)
  assert.equal(drained.energy, 0)
  assert.equal(isCompanionContent({ ...care, fullness: COMPANION_CONTENT_THRESHOLD - 1 }), false)

  // Care actions clamp at the cap.
  const fed = applyCareAction({ ...care, fullness: 90 }, 'feed')
  assert.equal(fed.fullness, COMPANION_MAX_CARE)
  assert.equal(applyCareAction(care, 'nonsense'), null)
  assert.equal(applyCareAction(createCompanionCare(null, 0), 'feed'), null)
})

test('SET_COMPANION pins a party Pokemon and resets its care', () => {
  const member = createPokemon('bulbasaur', 10, 'a'),
    pinned = gameReducer(
      { ...initialGameState, party: [member], playerPokemon: member },
      { type: 'SET_COMPANION', payload: { pokemonId: 'a' } }
    )
  assert.equal(pinned.companion.id, 'a')
  assert.equal(pinned.companion.fullness, COMPANION_MAX_CARE)

  const missing = gameReducer(pinned, {
    type: 'SET_COMPANION',
    payload: { pokemonId: 'nope' },
  })
  assert.equal(missing.companion.id, 'a', 'unknown ids are ignored')

  const unpinned = gameReducer(pinned, {
    type: 'SET_COMPANION',
    payload: { pokemonId: null },
  })
  assert.equal(unpinned.companion.id, null)
})

test('CARE_COMPANION raises friendship, charges for feed and limits to one per win', () => {
  const member = { ...createPokemon('charmander', 10, 'a'), friendship: 70 },
    base = {
      ...initialGameState,
      party: [member],
      playerPokemon: member,
      wildBattlesWon: 0,
      companion: createCompanionCare('a', 0),
    },
    fed = gameReducer(base, { type: 'CARE_COMPANION', payload: { action: 'feed' } })
  assert.equal(fed.money, base.money - COMPANION_FEED_COST)
  assert.equal(fed.party[0].friendship, 74)
  assert.equal(fed.companion.careBattle, 0)

  // A second care before the next win is refused.
  assert.equal(gameReducer(fed, { type: 'CARE_COMPANION', payload: { action: 'play' } }), fed)

  // After a win, play is allowed and free.
  const played = gameReducer(
    { ...fed, wildBattlesWon: 1 },
    { type: 'CARE_COMPANION', payload: { action: 'play' } }
  )
  assert.notEqual(played, fed)
  assert.equal(played.money, fed.money)

  // Feeding without the money is refused.
  const broke = gameReducer(
    { ...base, money: COMPANION_FEED_COST - 1, wildBattlesWon: 1 },
    { type: 'CARE_COMPANION', payload: { action: 'feed' } }
  )
  assert.equal(broke.party[0].friendship, 70)
})

test('complete care gives the EXP bonus', () => {
  const content = {
      ...createCompanionCare('a', 0),
      fullness: COMPANION_CONTENT_THRESHOLD,
      happiness: COMPANION_CONTENT_THRESHOLD,
      energy: COMPANION_CONTENT_THRESHOLD,
      cleanliness: COMPANION_CONTENT_THRESHOLD,
    },
    hungry = { ...content, fullness: COMPANION_CONTENT_THRESHOLD - 1 },
    grubby = { ...content, cleanliness: COMPANION_CONTENT_THRESHOLD - 1 }
  assert.equal(companionExpMultiplier(content), COMPANION_EXP_MULTIPLIER)
  assert.equal(companionExpMultiplier(hungry), 1)
  assert.equal(companionExpMultiplier(grubby), 1, 'a dirty companion drops the bonus too')
})

test('pat, brush and wash care for the companion', () => {
  const care = { ...createCompanionCare('a', 0), happiness: 40, cleanliness: 30, energy: 60 }
  assert.ok(COMPANION_CARE_ACTIONS.pat.changes.happiness > 0)
  assert.ok(applyCareAction(care, 'pat').happiness > care.happiness)
  assert.ok(applyCareAction(care, 'brush').cleanliness > care.cleanliness)
  assert.ok(applyCareAction(care, 'wash').cleanliness > applyCareAction(care, 'brush').cleanliness)
})
