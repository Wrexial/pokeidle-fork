import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const {
  ACTIVITY_ATTEMPTS,
  ACTIVITY_BITE_CHANCE,
  ACTIVITY_BUG_FLEE_MS,
  ACTIVITY_CIRCUIT_SPARKS,
  ACTIVITY_DIG_TRIES,
  ACTIVITY_HIT_ZONE,
  ACTIVITY_MASH_TAPS,
  ACTIVITY_PERFECT_ZONE,
  ACTIVITY_RUNE_LENGTH,
  ACTIVITY_ULTRA_ZONE,
  FISHING_LOCATIONS,
  ROUTE_ACTIVITIES,
  ROUTE_ACTIVITY_TUTORIALS,
  activityBandQuality,
  activityBiteChance,
  activityBugQuality,
  activityCircuitQuality,
  activityConditionLabel,
  activityConditionMatches,
  activityDigQuality,
  activityGripQuality,
  activityLevelBonus,
  activityMashQuality,
  activityQualityForDistance,
  activityRewardName,
  activityRuneQuality,
  activityShinyMultiplier,
  activitySoarQuality,
  bumpActivityQuality,
  rollActivityEncounter,
  rollActivityEncounters,
  rollActivityHeldItem,
  rollActivityLoot,
  rollForageBerry,
  rollDiveTreasure,
  rollSmashBonus,
  rollProspectLoot,
  rollProspectBonus,
  routeActivityIds,
} = await import('../src/game/minigames.js')
const { isWaterLocation } = await import('../src/game/catching.js')
const { consumableItems, evolutionItems, heldItems, fossilItems } = await import('../src/data/items.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')

const { mapData, pokemonSpecies, mapEncounterData: encounterData } = gameData,
  locations = Object.values(mapData),
  waterRoute = locations.find((location) => routeActivityIds(location).includes('fishing')),
  forageRoute = locations.find((location) => routeActivityIds(location).includes('forage')),
  town = locations.find((location) => location.type === 'town')

test('Suction Cups and Sticky Hold improve the fishing bite chance', () => {
  assert.equal(activityBiteChance(null), ACTIVITY_BITE_CHANCE)
  assert.equal(activityBiteChance('overgrow'), ACTIVITY_BITE_CHANCE)
  assert.ok(activityBiteChance('suctionCups') > ACTIVITY_BITE_CHANCE)
  assert.ok(activityBiteChance('stickyHold') > ACTIVITY_BITE_CHANCE)
  assert.ok(activityBiteChance('suctionCups') <= 1, 'the chance never exceeds 100%')
})

test('the rarest fish on a route are flagged multi-catch', () => {
  const original = Math.random,
    flags = new Set()
  try {
    for (let index = 0; index < 400; index++) {
      Math.random = () => (index + 0.5) / 400
      const encounter = rollActivityEncounter('fishing', waterRoute.routeKey, true, 'superRod')
      if (encounter) flags.add(encounter.multi)
    }
  } finally {
    Math.random = original
  }
  assert.ok(flags.has(true), 'some fish need a second perfect reel to land')
  assert.ok(flags.has(false), 'common fish are hooked on the first perfect')
})

test('route activities are offered by terrain', () => {
  assert.ok(waterRoute, 'some route supports fishing')
  assert.ok(forageRoute, 'some route supports foraging')
  assert.ok(routeActivityIds(waterRoute).includes('fishing'))
  assert.ok(routeActivityIds(forageRoute).includes('forage'))
  assert.deepEqual(routeActivityIds(town), [], 'towns offer nothing to fish for or forage')
  assert.deepEqual(routeActivityIds(undefined), [])
})

test('foraging follows the location biome', () => {
  const withEncounters = (/** @type {string} */ biome) =>
    locations.find(
      (location) => location.biome === biome && encounterData[location.routeKey]?.encounters?.length
    )
  const forest = withEncounters('forest')
  assert.ok(forest, 'a forest route exists')
  assert.ok(routeActivityIds(forest).includes('forage'), 'woods are forageable')
  const coast = withEncounters('coast')
  assert.ok(coast, 'a coastal route exists')
  assert.ok(!routeActivityIds(coast).includes('forage'), 'beaches are not forageable')
  const ruins = withEncounters('ruins')
  assert.ok(ruins, 'a ruins route exists')
  assert.ok(!routeActivityIds(ruins).includes('forage'), 'ruins are not forageable')
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

test('fishing has no exclusive species; every Water species is reachable', () => {
  assert.ok(
    ACTIVITY_ULTRA_ZONE < ACTIVITY_PERFECT_ZONE && ACTIVITY_PERFECT_ZONE < ACTIVITY_HIT_ZONE,
    'the perfect-catch zone is the smallest'
  )
  let checked = 0
  for (const locationId of FISHING_LOCATIONS) {
    const location = mapData[locationId],
      routeKey = location.routeKey,
      water = (encounterData[routeKey]?.encounters ?? []).filter((entry) =>
        pokemonSpecies[entry.speciesKey].types.includes('Water')
      )
    if (water.length === 0) continue
    checked++
    // A Super Rod cast can reach every Water species on the route — none are
    // fenced off as a fishing exclusive any more.
    const candidates = [...water].sort((left, right) => right.weight - left.weight),
      total = candidates.reduce((sum, entry) => sum + entry.weight, 0),
      original = Math.random
    try {
      for (let index = 0; index < candidates.length; index++) {
        const before = candidates
          .slice(0, index)
          .reduce((sum, entry) => sum + entry.weight, 0)
        Math.random = () => (before + candidates[index].weight / 2) / total
        assert.equal(
          rollActivityEncounter('fishing', routeKey, false, 'superRod').speciesKey,
          candidates[index].speciesKey,
          `${locationId} should be able to hook ${candidates[index].speciesKey}`
        )
      }
    } finally {
      Math.random = original
    }
  }
  assert.ok(checked > 0, 'at least one fishing route has Water species')
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

test('headbutt can shake out two Pokemon, other activities cannot', () => {
  const headbuttRoute = locations.find(
    (location) =>
      routeActivityIds(location).includes('headbutt') &&
      encounterData[location.routeKey]?.encounters?.length
  )
  assert.ok(headbuttRoute, 'a headbutt route exists')
  const fishingRoute = locations.find((location) =>
    routeActivityIds(location).includes('fishing')
  )
  const original = Math.random
  try {
    Math.random = () => 0
    assert.equal(
      rollActivityEncounters('headbutt', headbuttRoute.routeKey, true).length,
      2,
      'a low roll produces a second Pokemon'
    )
    if (fishingRoute)
      assert.equal(
        rollActivityEncounters('fishing', fishingRoute.routeKey, true, 'superRod').length,
        1,
        'only headbutt doubles up'
      )
    Math.random = () => 0.999
    assert.equal(
      rollActivityEncounters('headbutt', headbuttRoute.routeKey, true).length,
      1,
      'a high roll keeps it single'
    )
  } finally {
    Math.random = original
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

test('foraging uses a ring display and can flush out a Grass, Poison or Fairy Pokemon', () => {
  assert.equal(ROUTE_ACTIVITIES.forage.display, 'rings')
  assert.equal(ROUTE_ACTIVITIES.fishing.display, 'bar', 'fishing keeps the bar')
  assert.equal(ROUTE_ACTIVITIES.forage.mode, 'loot')
  for (const type of ['Grass', 'Poison', 'Fairy'])
    assert.ok(ROUTE_ACTIVITIES.forage.preferTypes.includes(type), `forage hooks ${type}`)
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
    assert.ok(hidden, 'a Pokemon can be flushed out')
    assert.ok(
      ['Grass', 'Poison', 'Fairy'].some((type) =>
        pokemonSpecies[hidden.speciesKey].types.includes(type)
      ),
      `${hidden.speciesKey} should be one of foraging's types`
    )
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
    assert.equal(
      rollActivityHeldItem('hit', ['Water']),
      null,
      'a plain hit usually carries nothing'
    )
    Math.random = () => 0
    assert.ok(rollActivityHeldItem('ultra', ['Water']), 'an ultra hit guarantees a held item')
    assert.ok(heldItems[rollActivityHeldItem('ultra', ['Water'])], 'the held item is real')
  } finally {
    Math.random = original
  }
  // Activity finds use the same pooled wild items as normal battles: a berry
  // or a booster of one of the Pokemon's own types (never a trainer-only item).
  const allowedFire = new Set(['sitrusBerry', 'lumBerry', 'charcoal'])
  for (let i = 0; i < 300; i++) {
    const item = rollActivityHeldItem('ultra', ['Fire'])
    assert.ok(item && allowedFire.has(item), `a Fire find held ${item}`)
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

    // While a turn is still resolving (a faint event queued but not consumed),
    // a manual throw must not also end the battle, or the loop's victory
    // handler would catch the same Pokemon a second time.
    const midTurnBase = {
        ...base,
        pendingEvents: [{ type: 'faint', data: { target: 'enemy' } }],
      },
      midTurn = gameReducer(midTurnBase, { type: 'ATTEMPT_CATCH' })
    assert.equal(midTurn, midTurnBase, 'the throw is ignored while events are queued')
    assert.equal(midTurn.phase, 'battling')
    assert.equal(midTurn.inventory.pokeball, 5, 'no ball is spent')
  } finally {
    Math.random = original
  }
})

test('EXECUTE_TURN is ignored once the battle has ended', () => {
  const finished = {
      ...initialGameState,
      phase: 'idle',
      enemyPokemon: null,
    },
    next = gameReducer(finished, {
      type: 'EXECUTE_TURN',
      payload: { events: [{ type: 'faint', data: { target: 'enemy' } }] },
    })
  assert.equal(next, finished, 'a stale turn cannot re-queue a faint')
  assert.equal(next.phase, 'idle')
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
  assert.equal(ROUTE_ACTIVITIES.rockSmash.display, 'mash')
  assert.equal(ROUTE_ACTIVITIES.headbutt.display, 'charge')
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
    ['rockSmash', ['Rock', 'Ground', 'Steel', 'Ice', 'Fighting']],
    ['headbutt', ['Normal', 'Flying']],
    ['diving', ['Water', 'Ice']],
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
    assert.ok(
      ['Rock', 'Ground', 'Steel', 'Ice', 'Fighting'].some((type) =>
        pokemonSpecies[smashed.speciesKey].types.includes(type)
      )
    )
    assert.ok(['Normal', 'Flying'].some((type) => pokemonSpecies[butted.speciesKey].types.includes(type)))
    assert.ok(
      ['Water', 'Ice'].some((type) => pokemonSpecies[dived.speciesKey].types.includes(type))
    )
  }
})

test('the berry hunt turns up berries and fills the basket with a combo', () => {
  const berryIds = new Set(['oranBerry', 'sitrusBerry', 'lumBerry']),
    first = rollForageBerry(0)
  assert.ok(berryIds.has(first.itemId), `${first.itemId} is a berry`)
  assert.equal(first.quantity, 1)
  assert.ok(rollForageBerry(6).quantity > first.quantity, 'a longer combo fills the basket')
})

test('diving uncovers treasure and rock smash cracks out gems', () => {
  const original = Math.random,
    rollMany = (/** @type {() => string | null} */ fn) => {
      const items = new Set()
      try {
        for (let index = 0; index < 200; index++) {
          Math.random = () => (index + 0.5) / 200
          const item = fn()
          if (item) items.add(item)
        }
      } finally {
        Math.random = original
      }
      return items
    }
  assert.equal(rollDiveTreasure('hit'), null, 'a glancing dive finds no treasure')
  assert.ok(rollMany(() => rollDiveTreasure('ultra')).size > 0, 'an ultra dive finds treasure')
  assert.equal(rollSmashBonus('hit'), null, 'a glancing smash cracks nothing open')
  assert.ok(rollMany(() => rollSmashBonus('perfect')).size > 0, 'a perfect smash cracks out gems')
})

test('bug catching and climbing roll their terrain types', () => {
  assert.equal(ROUTE_ACTIVITIES.bugCatch.mode, 'encounter')
  assert.equal(ROUTE_ACTIVITIES.bugCatch.display, 'net')
  assert.equal(ROUTE_ACTIVITIES.climb.mode, 'encounter')
  assert.equal(ROUTE_ACTIVITIES.climb.display, 'grip')

  const find = (/** @type {string} */ id) =>
    locations.find((location) => routeActivityIds(location).includes(id))
  const bug = find('bugCatch'),
    climb = find('climb')
  assert.ok(bug, 'some route supports bug catching')
  assert.ok(climb, 'some route supports climbing')

  // Every offered route holds at least one matching-type species.
  for (const [activityId, types] of [
    ['bugCatch', ['Bug']],
    ['climb', ['Rock', 'Ground', 'Flying']],
  ])
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
    const caught = rollActivityEncounter('bugCatch', bug.routeKey, roll % 2 === 0),
      climbed = rollActivityEncounter('climb', climb.routeKey, roll % 2 === 0)
    assert.ok(pokemonSpecies[caught.speciesKey].types.includes('Bug'))
    assert.ok(
      ['Rock', 'Ground', 'Flying'].some((type) =>
        pokemonSpecies[climbed.speciesKey].types.includes(type)
      )
    )
  }

  const townActivity = routeActivityIds(locations.find((location) => location.type === 'town'))
  assert.ok(!townActivity.includes('bugCatch'), 'towns have no bugs to sweep')
  assert.ok(!townActivity.includes('climb'), 'towns have no cliffs')
  assert.ok(!townActivity.includes('prospecting'), 'towns have nothing to dig for')
})

test('prospecting digs up real relics and can turn up a bonus', () => {
  assert.equal(ROUTE_ACTIVITIES.prospecting.mode, 'loot')
  assert.equal(ROUTE_ACTIVITIES.prospecting.display, 'dig')
  assert.ok(
    locations.some((location) => routeActivityIds(location).includes('prospecting')),
    'some route supports prospecting'
  )
  for (let roll = 0; roll < 80; roll++) {
    const reward = rollProspectLoot(roll % 2 === 0)
    assert.ok(
      consumableItems[reward.itemId] ||
        evolutionItems[reward.itemId] ||
        heldItems[reward.itemId],
      `${reward.itemId} should be a real item`
    )
    assert.ok(reward.quantity >= 1)
    assert.equal(typeof activityRewardName(reward.itemId), 'string')
  }
  const original = Math.random
  try {
    Math.random = () => 0
    assert.equal(rollProspectBonus('hit'), null, 'a glancing dig finds no bonus')
    const bonus = rollProspectBonus('ultra')
    assert.ok(
      fossilItems[bonus] ||
        consumableItems[bonus] ||
        heldItems[bonus] ||
        evolutionItems[bonus],
      `${bonus} should be a real item`
    )
  } finally {
    Math.random = original
  }
})

test('START_ROUTE_ACTIVITY starts the new activities where they are offered', () => {
  const prospect = locations.find((location) =>
      routeActivityIds(location).includes('prospecting')
    ),
    base = {
      ...initialGameState,
      phase: 'idle',
      currentLocation: prospect.id,
      unlockedLocations: [prospect.id],
    },
    started = gameReducer(base, {
      type: 'START_ROUTE_ACTIVITY',
      payload: { activityId: 'prospecting' },
    })
  assert.equal(started.phase, 'routeActivity')
  assert.equal(started.routeActivity, 'prospecting')
})

test('every route activity has its own interaction', () => {
  const displays = Object.values(ROUTE_ACTIVITIES).map((activity) => activity.display)
  assert.equal(displays.length, 12, 'all twelve activities are accounted for')
  assert.equal(
    new Set(displays).size,
    displays.length,
    'no two activities share an interaction'
  )
  for (const activity of Object.values(ROUTE_ACTIVITIES))
    assert.ok(activity.display, `${activity.id} declares a display`)
})

test('the sweep interactions grade by distance from the sweet spot', () => {
  assert.equal(activityQualityForDistance(0), 'ultra')
  assert.equal(activityQualityForDistance(ACTIVITY_ULTRA_ZONE), 'ultra')
  assert.equal(activityQualityForDistance(ACTIVITY_ULTRA_ZONE + 0.001), 'perfect')
  assert.equal(activityQualityForDistance(ACTIVITY_PERFECT_ZONE), 'perfect')
  assert.equal(activityQualityForDistance(ACTIVITY_PERFECT_ZONE + 0.001), 'hit')
  assert.equal(activityQualityForDistance(ACTIVITY_HIT_ZONE), 'hit')
  assert.equal(activityQualityForDistance(ACTIVITY_HIT_ZONE + 0.001), null)
})

test('the mash, net, grip and dig interactions grade their own metrics', () => {
  assert.equal(activityMashQuality(0), null, 'an untouched boulder resists')
  assert.equal(activityMashQuality(ACTIVITY_MASH_TAPS.hit), 'hit')
  assert.equal(activityMashQuality(ACTIVITY_MASH_TAPS.perfect), 'perfect')
  assert.equal(activityMashQuality(ACTIVITY_MASH_TAPS.ultra), 'ultra')
  assert.equal(activityMashQuality(999), 'ultra', 'over-smashing tops out at ultra')

  assert.equal(activityBugQuality(0), 'ultra', 'an instant sweep is a bullseye')
  assert.equal(
    activityBugQuality(ACTIVITY_BUG_FLEE_MS),
    null,
    'a bug that sat out the whole window flees'
  )

  assert.equal(activityGripQuality(0), null, 'falling the whole way finds nothing')
  assert.equal(activityGripQuality(1), 'ultra', 'a steady climb tops out at ultra')
  assert.equal(activityGripQuality(0.3), 'perfect')
  assert.equal(activityGripQuality(0.15), 'hit')

  assert.equal(activityDigQuality(1), 'ultra', 'the first hole is gold')
  assert.equal(activityDigQuality(2), 'perfect')
  assert.equal(activityDigQuality(ACTIVITY_DIG_TRIES), 'hit')
})

test('every Pokemon type is hooked to at least one route activity', () => {
  const TYPES = [
    'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
    'Steel', 'Fairy',
  ]
  const hooked = new Map()
  for (const activity of Object.values(ROUTE_ACTIVITIES))
    for (const type of activity.preferTypes ?? [])
      hooked.set(type, [...(hooked.get(type) ?? []), activity.id])

  for (const type of TYPES)
    assert.ok(hooked.has(type), `${type} is hooked to a route activity`)

  // The stronger check: for every type, the offer actually surfaces on a real
  // location whose wild table holds a species of that type.
  for (const type of TYPES) {
    const offered = locations.some((location) => {
      const ids = routeActivityIds(location)
      if (ids.length === 0) return false
      const hasType = (encounterData[location.routeKey]?.encounters ?? []).some((entry) =>
        pokemonSpecies[entry.speciesKey].types.includes(type)
      )
      return hasType && ids.some((id) => (ROUTE_ACTIVITIES[id]?.preferTypes ?? []).includes(type))
    })
    assert.ok(offered, `${type} wild Pokemon can be reached through an activity`)
  }
})

test('the campfire, overcharge and s\u00e9ance interactions grade their metrics', () => {
  assert.equal(ROUTE_ACTIVITIES.kindle.display, 'stoke')
  assert.equal(ROUTE_ACTIVITIES.kindle.preferTypes.join(','), 'Fire')
  assert.equal(ROUTE_ACTIVITIES.overcharge.display, 'circuit')
  assert.equal(ROUTE_ACTIVITIES.overcharge.preferTypes.join(','), 'Electric')
  assert.deepEqual(ROUTE_ACTIVITIES.seance.preferTypes, ['Psychic', 'Ghost', 'Dark'])
  assert.equal(ROUTE_ACTIVITIES.summit.display, 'soar')
  assert.equal(ROUTE_ACTIVITIES.summit.preferTypes.join(','), 'Dragon')

  assert.equal(activityBandQuality(0), null, 'never on the band finds nothing')
  assert.equal(activityBandQuality(1), 'ultra')
  assert.equal(activityBandQuality(0.4), 'perfect')
  assert.equal(activityBandQuality(0.2), 'hit')

  assert.equal(activityCircuitQuality(0), null, 'missing every spark fizzles')
  assert.equal(activityCircuitQuality(ACTIVITY_CIRCUIT_SPARKS), 'ultra')
  assert.equal(activityCircuitQuality(2), 'perfect')
  assert.equal(activityCircuitQuality(1), 'hit')

  assert.equal(activityRuneQuality(0), null, 'a wrong reading draws nothing')
  assert.equal(activityRuneQuality(ACTIVITY_RUNE_LENGTH), 'ultra')
  assert.equal(activityRuneQuality(ACTIVITY_RUNE_LENGTH - 1), 'perfect')
  assert.equal(activityRuneQuality(ACTIVITY_RUNE_LENGTH - 2), 'hit')

  // Summit Roost is a stamina climb, not a band: reaching the roost scores by
  // the stamina left, and a high peak still finds something.
  assert.equal(activitySoarQuality(true, 1, 60), 'ultra', 'the roost with stamina to spare')
  assert.equal(activitySoarQuality(true, 1, 25), 'perfect')
  assert.equal(activitySoarQuality(true, 1, 5), 'hit', 'reaching the roost always lands')
  assert.equal(activitySoarQuality(false, 0.7, 0), 'hit', 'a high peak still finds a Pokemon')
  assert.equal(activitySoarQuality(false, 0.3, 0), null, 'a low stall finds nothing')
})

test('the new activities start where their terrain and types meet', () => {
  for (const activityId of ['kindle', 'overcharge', 'seance', 'summit']) {
    const location = locations.find((candidate) =>
      routeActivityIds(candidate).includes(activityId)
    )
    assert.ok(location, `${activityId} is offered somewhere`)
    const started = gameReducer(
      {
        ...initialGameState,
        phase: 'idle',
        currentLocation: location.id,
        unlockedLocations: [location.id],
      },
      { type: 'START_ROUTE_ACTIVITY', payload: { activityId } }
    )
    assert.equal(started.phase, 'routeActivity')
    assert.equal(started.routeActivity, activityId)
  }
})

test('every route activity has a "how to play" tutorial', () => {
  for (const activity of Object.values(ROUTE_ACTIVITIES)) {
    const steps = ROUTE_ACTIVITY_TUTORIALS[activity.id]
    assert.ok(
      Array.isArray(steps) && steps.length >= 2,
      `${activity.id} has a tutorial with at least two steps`
    )
    for (const step of steps) {
      assert.equal(typeof step, 'string')
      assert.ok(step.length > 0)
    }
  }
  // No stray tutorials for activities that do not exist.
  for (const id of Object.keys(ROUTE_ACTIVITY_TUTORIALS))
    assert.ok(ROUTE_ACTIVITIES[id], `${id} is a real activity`)
})

test('day/night and weather favour an activity and lift a landed hit', () => {
  const night = { time: /** @type {'night'} */ ('night'), weather: null },
    day = { time: /** @type {'day'} */ ('day'), weather: null }
  assert.ok(activityConditionMatches(ROUTE_ACTIVITIES.seance, night))
  assert.ok(!activityConditionMatches(ROUTE_ACTIVITIES.seance, day))
  assert.ok(activityConditionMatches(ROUTE_ACTIVITIES.forage, day))
  assert.ok(activityConditionMatches(ROUTE_ACTIVITIES.fishing, { time: 'day', weather: 'rain' }))
  assert.ok(!activityConditionMatches(ROUTE_ACTIVITIES.fishing, { time: 'day', weather: 'sun' }))
  // An activity with no favoured condition never qualifies.
  assert.ok(!activityConditionMatches(ROUTE_ACTIVITIES.rockSmash, night))
  assert.ok(!activityConditionMatches(undefined, night))

  assert.equal(activityConditionLabel(ROUTE_ACTIVITIES.seance), 'at night')
  assert.equal(activityConditionLabel(ROUTE_ACTIVITIES.forage), 'during the day')
  assert.equal(activityConditionLabel(ROUTE_ACTIVITIES.fishing), 'in the rain')
  assert.equal(activityConditionLabel(ROUTE_ACTIVITIES.rockSmash), null)

  assert.equal(bumpActivityQuality('hit'), 'perfect')
  assert.equal(bumpActivityQuality('perfect'), 'ultra')
  assert.equal(bumpActivityQuality('ultra'), 'ultra')
  assert.equal(bumpActivityQuality(null), null)
})
