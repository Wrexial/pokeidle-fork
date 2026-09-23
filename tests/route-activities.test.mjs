import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const {
  ACTIVITY_ATTEMPTS,
  ACTIVITY_HIT_ZONE,
  ACTIVITY_PERFECT_ZONE,
  ACTIVITY_ULTRA_ZONE,
  FISHING_LOCATIONS,
  ROUTE_ACTIVITIES,
  activityLevelBonus,
  activityRewardName,
  activityShinyMultiplier,
  encountersWithoutFishingExclusive,
  fishingExclusiveFor,
  rollActivityEncounter,
  rollActivityHeldItem,
  rollActivityLoot,
  rollFishingExclusive,
  routeActivityIds,
} = await import('../src/game/minigames.js')
const { isWaterLocation } = await import('../src/game/catching.js')
const { consumableItems, evolutionItems, heldItems } = await import('../src/data/items.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')

const { mapData, pokemonSpecies, mapEncounterData: encounterData } = gameData,
  locations = Object.values(mapData),
  waterRoute = locations.find((location) => routeActivityIds(location).includes('fishing')),
  forageRoute = locations.find((location) => routeActivityIds(location).includes('forage')),
  town = locations.find((location) => location.type === 'town')

test('route activities are offered by terrain', () => {
  assert.ok(waterRoute, 'some route supports fishing')
  assert.ok(forageRoute, 'some route supports foraging')
  assert.ok(routeActivityIds(waterRoute).includes('fishing'))
  assert.ok(routeActivityIds(forageRoute).includes('forage'))
  assert.deepEqual(routeActivityIds(town), [], 'towns offer nothing to fish for or forage')
  assert.deepEqual(routeActivityIds(undefined), [])
})

test('fishing is only offered on the curated water-rich routes', () => {
  assert.ok(FISHING_LOCATIONS.size > 0)
  for (const locationId of FISHING_LOCATIONS) {
    const location = mapData[locationId]
    assert.ok(location, `${locationId} should be a real location`)
    const water = (encounterData[location.routeKey]?.encounters ?? []).filter((entry) =>
      pokemonSpecies[entry.speciesKey].types.includes('Water')
    )
    assert.ok(water.length >= 2, `${locationId} should be water-rich`)
    assert.ok(routeActivityIds(location).includes('fishing'))
  }
  // A water route outside the curated list does not offer fishing.
  const otherWater = locations.find(
    (location) =>
      isWaterLocation(location) &&
      !FISHING_LOCATIONS.has(location.id) &&
      encounterData[location.routeKey]?.encounters
  )
  assert.ok(otherWater, 'there is a water route outside the list')
  assert.ok(!routeActivityIds(otherWater).includes('fishing'))
})

test('a cast never falls back to non-Water species', () => {  const landRoute = locations.find(
    (location) =>
      encounterData[location.routeKey]?.encounters?.length &&
      !encounterData[location.routeKey].encounters.some((entry) =>
        pokemonSpecies[entry.speciesKey].types.includes('Water')
      )
  )
  assert.ok(landRoute, 'a route with no Water species exists')
  for (let roll = 0; roll < 20; roll++)
    assert.equal(
      rollActivityEncounter('fishing', landRoute.routeKey, roll % 2 === 0),
      null,
      'nothing to catch on a dry route'
    )
})

test('each fishing route has a Water-only exclusive catch', () => {
  assert.ok(
    ACTIVITY_ULTRA_ZONE < ACTIVITY_PERFECT_ZONE && ACTIVITY_PERFECT_ZONE < ACTIVITY_HIT_ZONE,
    'the perfect-catch zone is the smallest'
  )
  let checked = 0
  for (const locationId of FISHING_LOCATIONS) {
    const location = mapData[locationId],
      routeKey = location.routeKey,
      exclusive = fishingExclusiveFor(routeKey)
    if (!exclusive) continue
    checked++
    assert.ok(
      pokemonSpecies[exclusive].types.includes('Water'),
      `${locationId}'s exclusive should be a Water Pokemon`
    )
    assert.ok(
      !encountersWithoutFishingExclusive(routeKey, encounterData[routeKey].encounters).some(
        (entry) => entry.speciesKey === exclusive
      ),
      `${exclusive} should be removed from the normal wild table`
    )
    assert.equal(rollFishingExclusive(routeKey).speciesKey, exclusive)
    // Never reachable by an ordinary cast, only by the perfect-cast roll.
    for (let roll = 0; roll < 20; roll++)
      assert.notEqual(
        rollActivityEncounter('fishing', routeKey, roll % 2 === 0, 'superRod').speciesKey,
        exclusive
      )
  }
  assert.ok(checked > 0, 'at least one fishing route has an exclusive catch')
})

test('each activity is configured with an outcome and copy', () => {
  assert.equal(ROUTE_ACTIVITIES.fishing.mode, 'encounter')
  assert.equal(ROUTE_ACTIVITIES.forage.mode, 'loot')
  assert.equal(ACTIVITY_ATTEMPTS, 3)
  for (const activity of Object.values(ROUTE_ACTIVITIES)) {
    assert.ok(activity.title && activity.action && activity.hint && activity.icon)
  }
})

test('fishing rolls a species from the route table, preferring Water', () => {
  const table = encounterData[waterRoute.routeKey].encounters,
    keys = new Set(table.map((entry) => entry.speciesKey)),
    waterSpecies = table.filter((entry) =>
      pokemonSpecies[entry.speciesKey].types.includes('Water')
    )
  for (let roll = 0; roll < 40; roll++) {
    const encounter = rollActivityEncounter('fishing', waterRoute.routeKey, roll % 2 === 0)
    assert.ok(keys.has(encounter.speciesKey), 'the species comes from the route')
    assert.ok(encounter.level >= 1)
    if (waterSpecies.length > 0)
      assert.ok(
        pokemonSpecies[encounter.speciesKey].types.includes('Water'),
        'Water species win when the route has any'
      )
  }
})

test('forage loot is always a real item', () => {
  for (let roll = 0; roll < 80; roll++) {
    const reward = rollActivityLoot(roll % 2 === 0)
    assert.ok(
      consumableItems[reward.itemId] || evolutionItems[reward.itemId] || heldItems[reward.itemId],
      `${reward.itemId} should be a real item`
    )
    assert.ok(reward.quantity >= 1)
    assert.equal(typeof activityRewardName(reward.itemId), 'string')
  }
})

test('foraging uses a ring display and can flush out a Grass Pokemon', () => {
  assert.equal(ROUTE_ACTIVITIES.forage.display, 'rings')
  assert.equal(ROUTE_ACTIVITIES.fishing.display, 'bar', 'fishing keeps the bar')
  assert.equal(ROUTE_ACTIVITIES.forage.mode, 'loot')
  assert.ok(ROUTE_ACTIVITIES.forage.preferTypes.includes('Grass'))
  assert.ok(ROUTE_ACTIVITIES.forage.encounterChance > 0)
  assert.ok(
    ROUTE_ACTIVITIES.forage.perfectEncounterChance > ROUTE_ACTIVITIES.forage.encounterChance,
    'a perfect search is likelier to flush a Pokemon out'
  )

  const grassyForage = locations.find(
    (location) =>
      routeActivityIds(location).includes('forage') &&
      (encounterData[location.routeKey]?.encounters ?? []).some((entry) =>
        pokemonSpecies[entry.speciesKey].types.includes('Grass')
      )
  )
  assert.ok(grassyForage, 'a forage route with a Grass Pokemon exists')
  for (let roll = 0; roll < 20; roll++) {
    const hidden = rollActivityEncounter('forage', grassyForage.routeKey, roll % 2 === 0)
    assert.ok(hidden, 'a Grass Pokemon can be flushed out')
    assert.ok(pokemonSpecies[hidden.speciesKey].types.includes('Grass'))
  }
})

test('START_ROUTE_ACTIVITY only starts an activity available here', () => {
  const base = {
      ...initialGameState,
      phase: 'idle',
      currentLocation: waterRoute.id,
      unlockedLocations: [waterRoute.id],
    },
    started = gameReducer(base, {
      type: 'START_ROUTE_ACTIVITY',
      payload: { activityId: 'fishing' },
    })
  assert.equal(started.phase, 'routeActivity')
  assert.equal(started.routeActivity, 'fishing')

  const wrongPlace = gameReducer(
      { ...base, currentLocation: town.id, unlockedLocations: [town.id] },
      { type: 'START_ROUTE_ACTIVITY', payload: { activityId: 'fishing' } }
    ),
    bogus = gameReducer(base, {
      type: 'START_ROUTE_ACTIVITY',
      payload: { activityId: 'nonsense' },
    })
  assert.equal(wrongPlace.phase, 'idle')
  assert.equal(bogus.phase, 'idle')
})

test('activity hit quality scales the encounter rewards', () => {
  assert.ok(activityLevelBonus('ultra') > activityLevelBonus('perfect'))
  assert.ok(activityLevelBonus('perfect') > activityLevelBonus('hit'))
  assert.ok(activityShinyMultiplier('ultra') > activityShinyMultiplier('hit'))
  const original = Math.random
  try {
    Math.random = () => 0.999
    assert.equal(rollActivityHeldItem('hit'), null, 'a plain hit usually carries nothing')
    Math.random = () => 0
    assert.ok(rollActivityHeldItem('ultra'), 'an ultra hit guarantees a held item')
    assert.ok(heldItems[rollActivityHeldItem('ultra')], 'the held item is real')
  } finally {
    Math.random = original
  }
})

test('CATCH_POKEMON keeps the wild IVs, ability and held item', () => {
  const ivs = { hp: 31, attack: 30, defense: 29, spAttack: 28, spDefense: 27, speed: 26 },
    next = gameReducer(
      { ...initialGameState, party: [], nextPokemonId: 1 },
      {
        type: 'CATCH_POKEMON',
        payload: {
          speciesKey: 'pikachu',
          level: 20,
          ivs,
          heldItem: 'leftovers',
          ability: 'static',
        },
      }
    )
  assert.deepEqual(next.party[0].ivs, ivs)
  assert.equal(next.party[0].heldItem, 'leftovers')
  assert.equal(next.party[0].ability, 'static')
})

test('ATTEMPT_CATCH manually catches a minigame Pokemon', () => {
  const player = createPokemon('rowlet', 20, 'p'),
    enemy = {
      speciesKey: 'dratini',
      name: 'Dratini',
      types: ['Dragon'],
      level: 15,
      currentHp: 30,
      maxHp: 30,
      attack: 10,
      defense: 10,
      spAttack: 10,
      spDefense: 10,
      speed: 10,
      moves: ['tackle'],
      ivs: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 },
      ability: 'shedSkin',
      heldItem: 'leftovers',
      isShiny: false,
      fromActivity: true,
    },
    base = {
      ...initialGameState,
      phase: 'battling',
      currentLocation: 'route21',
      currentRoute: 'route21',
      party: [player],
      playerPokemon: player,
      enemyPokemon: enemy,
      inventory: { pokeball: 5 },
    },
    original = Math.random
  try {
    Math.random = () => 0.999
    const missed = gameReducer(base, { type: 'ATTEMPT_CATCH' })
    assert.equal(missed.phase, 'battling', 'a failed throw keeps the battle going')
    assert.equal(missed.inventory.pokeball, 4, 'the ball is spent')
    assert.equal(missed.enemyPokemon.speciesKey, 'dratini')

    Math.random = () => 0
    const caught = gameReducer(base, { type: 'ATTEMPT_CATCH' })
    assert.equal(caught.phase, 'idle', 'a successful catch ends the battle')
    assert.equal(caught.inventory.pokeball, 4)
    assert.ok(caught.pokedexCaught.includes('dratini'))
    const caughtMon = [...caught.party, ...caught.box].find(
      (member) => member.speciesKey === 'dratini'
    )
    assert.ok(caughtMon, 'the Pokemon joined the party or box')
    assert.equal(caughtMon.heldItem, 'leftovers', 'the wild held item carried over')

    // No balls at all: nothing happens.
    const broke = gameReducer({ ...base, inventory: {} }, { type: 'ATTEMPT_CATCH' })
    assert.equal(broke.phase, 'battling')
  } finally {
    Math.random = original
  }
})

test('END_ROUTE_ACTIVITY returns to idle', () => {
  const next = gameReducer(
    { ...initialGameState, phase: 'routeActivity', routeActivity: 'fishing' },
    { type: 'END_ROUTE_ACTIVITY' }
  )
  assert.equal(next.phase, 'idle')
  assert.equal(next.routeActivity, null)
})

test('rock smash, headbutt and diving are offered only where their types live', () => {
  assert.equal(ROUTE_ACTIVITIES.rockSmash.display, 'swing')
  assert.equal(ROUTE_ACTIVITIES.headbutt.display, 'trunk')
  assert.equal(ROUTE_ACTIVITIES.diving.display, 'depth')
  for (const activity of [ROUTE_ACTIVITIES.rockSmash, ROUTE_ACTIVITIES.headbutt, ROUTE_ACTIVITIES.diving]) {
    assert.equal(activity.mode, 'encounter')
    assert.ok(activity.preferTypes.length > 0)
  }

  const find = (/** @type {string} */ id) =>
    locations.find((location) => routeActivityIds(location).includes(id))
  const smash = find('rockSmash'),
    headbutt = find('headbutt'),
    diving = find('diving')
  assert.ok(smash && headbutt && diving, 'each activity has at least one route')

  // Every offered route holds at least one matching-type species.
  const activityTypes = [
    ['rockSmash', ['Rock', 'Ground']],
    ['headbutt', ['Normal', 'Flying']],
    ['diving', ['Water']],
  ]
  for (const [activityId, types] of activityTypes)
    for (const location of locations.filter((candidate) =>
      routeActivityIds(candidate).includes(activityId)
    ))
      assert.ok(
        encounterData[location.routeKey].encounters.some((entry) =>
          types.some((type) => pokemonSpecies[entry.speciesKey].types.includes(type))
        ),
        `${location.id} offers ${activityId} but has no ${types.join('/')}`
      )

  for (let roll = 0; roll < 20; roll++) {
    const smashed = rollActivityEncounter('rockSmash', smash.routeKey, roll % 2 === 0),
      butted = rollActivityEncounter('headbutt', headbutt.routeKey, roll % 2 === 0),
      dived = rollActivityEncounter('diving', diving.routeKey, roll % 2 === 0)
    assert.ok(['Rock', 'Ground'].some((type) => pokemonSpecies[smashed.speciesKey].types.includes(type)))
    assert.ok(['Normal', 'Flying'].some((type) => pokemonSpecies[butted.speciesKey].types.includes(type)))
    assert.ok(pokemonSpecies[dived.speciesKey].types.includes('Water'))
  }
})
