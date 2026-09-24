import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const { GIFTS, STATIC_ENCOUNTERS, entryRequirementStatus, findGift, findStatic, giftRewardLabel, locationEntries } =
  await import('../src/game/gifts.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { consumableItems, evolutionItems, heldItems, pokeBalls } = await import('../src/data/items.js')

const { mapData, pokemonSpecies, gymLeaderData } = gameData

test('every gift and static is real data on a real location', () => {
  const ids = new Set()
  for (const gift of GIFTS) {
    assert.ok(!ids.has(gift.id), `${gift.id} is duplicated`)
    ids.add(gift.id)
    assert.ok(mapData[gift.location], `${gift.id} is on a real location`)
    if (gift.pokemon) assert.ok(pokemonSpecies[gift.pokemon.speciesKey], `${gift.id} species`)
    for (const itemId of Object.keys(gift.items ?? {}))
      assert.ok(
        consumableItems[itemId] || heldItems[itemId] || evolutionItems[itemId] || pokeBalls[itemId],
        `${gift.id} item ${itemId}`
      )
    assert.ok(giftRewardLabel(gift).length > 0)
  }
  for (const entry of STATIC_ENCOUNTERS) {
    assert.ok(!ids.has(entry.id), `${entry.id} is duplicated`)
    ids.add(entry.id)
    assert.ok(mapData[entry.location], `${entry.id} is on a real location`)
    assert.ok(pokemonSpecies[entry.speciesKey], `${entry.id} species`)
    assert.ok(entry.level >= 1 && entry.level <= 100)
  }
})

test('find helpers resolve entries', () => {
  assert.equal(findGift(GIFTS[0].id)?.id, GIFTS[0].id)
  assert.equal(findGift('nope'), null)
  assert.equal(findStatic(STATIC_ENCOUNTERS[0].id)?.id, STATIC_ENCOUNTERS[0].id)
  assert.equal(findStatic('nope'), null)
})

test('badge requirements gate and then open a gift', () => {
  const gift = GIFTS.find((entry) => entry.requires?.badges) ?? GIFTS[0]
  if (!gift.requires?.badges) return
  const locked = gameReducer(
      { ...initialGameState, phase: 'idle', currentLocation: gift.location },
      { type: 'CLAIM_GIFT', payload: { giftId: gift.id } }
    ),
    regionId = mapData[gift.location]?.region ?? 'kanto',
    badges = gymLeaderData
      .filter((gym) => (gym.region ?? 'kanto') === regionId)
      .slice(0, gift.requires.badges)
      .map((gym) => gym.id),
    unlocked = gameReducer(
      {
        ...initialGameState,
        phase: 'idle',
        currentLocation: gift.location,
        defeatedGyms: badges,
      },
      { type: 'CLAIM_GIFT', payload: { giftId: gift.id } }
    )
  assert.ok(!(locked.claimedGifts ?? []).includes(gift.id), 'a locked gift is refused')
  assert.ok((unlocked.claimedGifts ?? []).includes(gift.id), 'the badge gate opens it')
})

test('CLAIM_GIFT hands over items once, at the right place', () => {
  const gift = GIFTS.find((entry) => entry.items) ?? GIFTS[0]
  if (!gift.items) return
  const here = gameReducer(
      { ...initialGameState, phase: 'idle', currentLocation: gift.location, inventory: {} },
      { type: 'CLAIM_GIFT', payload: { giftId: gift.id } }
    ),
    elsewhere = gameReducer(
      {
        ...initialGameState,
        phase: 'idle',
        currentLocation: 'not-a-place',
        inventory: {},
      },
      { type: 'CLAIM_GIFT', payload: { giftId: gift.id } }
    ),
    twice = gameReducer(here, { type: 'CLAIM_GIFT', payload: { giftId: gift.id } })
  for (const [itemId, quantity] of Object.entries(gift.items))
    assert.equal(here.inventory[itemId], quantity)
  assert.deepEqual(elsewhere.inventory, {}, 'the gift is not claimable elsewhere')
  assert.equal(twice.claimedGifts.filter((id) => id === gift.id).length, 1, 'claimed only once')
})

test('a Pokemon gift joins the party and the Pokedex', () => {
  const gift = GIFTS.find((entry) => entry.pokemon && !entry.requires)
  assert.ok(gift)
  const next = gameReducer(
    {
      ...initialGameState,
      phase: 'idle',
      currentLocation: gift.location,
      party: [],
      box: [],
      pokedexCaught: [],
    },
    { type: 'CLAIM_GIFT', payload: { giftId: gift.id } }
  )
  const member = [...next.party, ...next.box].find(
    (pokemon) => pokemon.speciesKey === gift.pokemon.speciesKey
  )
  assert.ok(member, 'the gifted Pokemon joined the squad')
  assert.equal(member.level, gift.pokemon.level)
  assert.ok(next.pokedexCaught.includes(gift.pokemon.speciesKey))
})

test('START_STATIC_ENCOUNTER begins a real battle with the fixed foe', () => {
  const entry = STATIC_ENCOUNTERS.find((candidate) => !candidate.requires) ?? STATIC_ENCOUNTERS[0],
    active = createPokemon('cyndaquil', 20, 'static-test'),
    base = {
      ...initialGameState,
      phase: 'idle',
      currentLocation: entry.location,
      party: [active],
      playerPokemon: active,
      claimedGifts: [],
    },
    started = gameReducer(base, {
      type: 'START_STATIC_ENCOUNTER',
      payload: { staticId: entry.id },
    })
  assert.equal(started.phase, 'battling')
  assert.equal(started.enemyPokemon.speciesKey, entry.speciesKey)
  assert.equal(started.enemyPokemon.staticId, entry.id)
  assert.equal(started.enemyPokemon.level, entry.level)

  // Catching it claims the static; fainting/fleeing would leave it available.
  const caught = gameReducer(started, {
    type: 'CATCH_POKEMON',
    payload: { speciesKey: entry.speciesKey, level: entry.level },
  })
  assert.ok(caught.claimedGifts.includes(entry.id))
})

test('a claimed static cannot be started again', () => {
  const entry = STATIC_ENCOUNTERS.find((candidate) => !candidate.requires) ?? STATIC_ENCOUNTERS[0],
    active = createPokemon('cyndaquil', 20, 'static-test-2'),
    claimed = {
      ...initialGameState,
      phase: 'idle',
      currentLocation: entry.location,
      party: [active],
      playerPokemon: active,
      claimedGifts: [entry.id],
    },
    next = gameReducer(claimed, {
      type: 'START_STATIC_ENCOUNTER',
      payload: { staticId: entry.id },
    })
  assert.equal(next.phase, 'idle')
})

test('locationEntries flags claimed entries', () => {
  const gift = GIFTS[0],
    state = { ...initialGameState, claimedGifts: [gift.id] },
    entries = locationEntries(state, gift.location)
  assert.ok(entries.gifts.some((entry) => entry.id === gift.id && entry.claimed))
})

test('entryRequirementStatus reports an unmet checklist', () => {
  const gift = GIFTS.find((entry) => entry.requires?.badges)
  if (!gift) return
  const status = entryRequirementStatus({ ...initialGameState, defeatedGyms: [] }, gift)
  assert.equal(status.met, false)
  assert.ok(status.requirements.some((requirement) => !requirement.met))
})
