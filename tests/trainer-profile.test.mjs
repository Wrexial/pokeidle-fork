import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { OUTFITS } = await import('../src/data/outfits.js')
const { pokedexIndexes } = await import('../src/data/gameData.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const {
  BADGE_CASE_MAX,
  availableOutfits,
  buildTrainerCard,
  createTrainerProfile,
  sanitizeTrainerProfile,
} = await import('../src/game/trainer-profile.js')
const { availableTitles, titleById } = await import('../src/game/titles.js')

test('createTrainerProfile starts with the free outfit and no title', () => {
  const profile = createTrainerProfile()
  assert.equal(profile.name, 'Trainer')
  assert.equal(profile.title, null)
  assert.equal(profile.outfit, OUTFITS[0].id)
  assert.deepEqual(profile.ownedOutfits, [OUTFITS[0].id])
  assert.equal(profile.favouritePokemonId, null)
  assert.deepEqual(profile.badgeCase, [])
})

test('sanitizeTrainerProfile trims the name and drops unknown values', () => {
  const profile = sanitizeTrainerProfile({
    name: '  Red  ',
    title: 'not-a-real-title',
    outfit: 'not-a-real-outfit',
    ownedOutfits: ['ace', 'bogus'],
    favouritePokemonId: 'missing',
    badgeCase: ['brock', 'not-a-gym'],
  })
  assert.equal(profile.name, 'Red')
  assert.equal(profile.title, null)
  assert.equal(profile.outfit, OUTFITS[0].id)
  assert.ok(profile.ownedOutfits.includes('ace'))
  assert.ok(profile.ownedOutfits.includes(OUTFITS[0].id))
  assert.ok(!profile.ownedOutfits.includes('bogus'))
  assert.equal(profile.favouritePokemonId, null)
  assert.deepEqual(profile.badgeCase, ['brock'])
})

test('sanitizeTrainerProfile caps the name and badge case', () => {
  const profile = sanitizeTrainerProfile({
    name: 'A'.repeat(40),
    badgeCase: Array.from({ length: 40 }, (_, index) => `badge-${index}`),
  })
  assert.equal(profile.name.length, 16)
  assert.ok(profile.badgeCase.length <= BADGE_CASE_MAX)
})

test('earned achievement outfits unlock, bought ones do not until owned', () => {
  const caught = pokedexIndexes
      .filter((entry) => entry[1].id > 0 && entry[1].id <= 1025)
      .slice(0, 100)
      .map(([speciesKey]) => speciesKey),
    state = { ...initialGameState, pokedexCaught: caught },
    unlocked = availableOutfits(state).map((outfit) => outfit.id)
  assert.ok(unlocked.includes('collector'), 'catch100 should unlock the Collector outfit')
  assert.ok(!unlocked.includes('ace'), 'a priced outfit is not owned by default')

  const owned = availableOutfits({
      ...state,
      trainerProfile: { ...createTrainerProfile(), ownedOutfits: [OUTFITS[0].id, 'ace'] },
    }).map((outfit) => outfit.id)
  assert.ok(owned.includes('ace'), 'a bought outfit stays wearable')
})

test('availableTitles feeds achievements and ribbons through', () => {
  const pokemon = { ...createPokemon('bulbasaur', 5, 1), ribbons: ['shiny'] },
    state = {
      ...initialGameState,
      party: [pokemon],
      defeatedChampions: ['kanto'],
    },
    titles = availableTitles(state).map((title) => title.id)
  assert.ok(titles.includes('ach:championFirst'), 'an achieved title is offered')
  assert.ok(titles.includes('ribbon:shiny'), 'a ribbon title is offered')
  assert.ok(titles.includes('ribbon:decorated'))
  assert.equal(titleById('ach:championFirst')?.name, 'Champion')
  assert.equal(titleById('ribbon:shiny')?.name, 'Sparkling Friend')
  assert.equal(titleById('nonsense'), null)
})

test('UPDATE_TRAINER_PROFILE sanitises through the reducer', () => {
  const next = gameReducer(initialGameState, {
    type: 'UPDATE_TRAINER_PROFILE',
    payload: { name: 'Blue', outfit: 'ace', title: 'ach:championFirst' },
  })
  assert.equal(next.trainerProfile.name, 'Blue')
  assert.equal(next.trainerProfile.outfit, OUTFITS[0].id, 'a locked outfit is not worn')
  // championFirst is not achieved yet, so the title is dropped.
  assert.equal(next.trainerProfile.title, null)
})

test('BUY_OUTFIT spends money, owns and wears the outfit', () => {
  const base = { ...initialGameState, money: 100000 },
    bought = gameReducer(base, { type: 'BUY_OUTFIT', payload: { outfitId: 'ace' } })
  assert.equal(bought.money, 0)
  assert.ok(bought.trainerProfile.ownedOutfits.includes('ace'))
  assert.equal(bought.trainerProfile.outfit, 'ace')

  const poor = gameReducer(
      { ...initialGameState, money: 10 },
      { type: 'BUY_OUTFIT', payload: { outfitId: 'ace' } }
    ),
    free = gameReducer(base, { type: 'BUY_OUTFIT', payload: { outfitId: 'trainer' } })
  assert.equal(poor.money, 10, 'an unaffordable outfit is not bought')
  assert.ok(!poor.trainerProfile.ownedOutfits.includes('ace'))
  assert.equal(free.money, base.money, 'the free outfit cannot be bought')
})

test('a trainer profile survives a save round-trip and repairs junk', () => {
  const pokemon = createPokemon('bulbasaur', 5, 1),
    state = {
      ...initialGameState,
      party: [pokemon],
      playerPokemon: pokemon,
      trainerProfile: {
        name: 'Leaf',
        title: null,
        outfit: 'collector',
        ownedOutfits: ['trainer', 'collector'],
        favouritePokemonId: pokemon.id,
        badgeCase: [],
      },
    },
    repaired = repairSave(serializeSave(state))
  assert.equal(repaired.trainerProfile.name, 'Leaf')
  assert.equal(repaired.trainerProfile.outfit, 'collector')
  assert.equal(repaired.trainerProfile.favouritePokemonId, pokemon.id)

  const junk = repairSave(
    serializeSave({
      ...state,
      trainerProfile: {
        name: '',
        outfit: 'nope',
        ownedOutfits: 'bad',
        favouritePokemonId: 'released',
        badgeCase: ['not-a-gym'],
      },
    })
  )
  assert.equal(junk.trainerProfile.name, 'Trainer')
  assert.equal(junk.trainerProfile.outfit, OUTFITS[0].id)
  assert.equal(junk.trainerProfile.favouritePokemonId, null)
  assert.deepEqual(junk.trainerProfile.badgeCase, [])
})

test('buildTrainerCard falls back to the active Pokemon and current region', () => {
  const pokemon = createPokemon('bulbasaur', 5, 1),
    card = buildTrainerCard({
      ...initialGameState,
      party: [pokemon],
      playerPokemon: pokemon,
      pokedexCaught: ['bulbasaur'],
    })
  assert.equal(card.name, 'Trainer')
  assert.equal(card.favourite?.speciesKey, 'bulbasaur')
  assert.equal(card.regionName, 'Kanto')
  assert.equal(card.dex, 1)
})
