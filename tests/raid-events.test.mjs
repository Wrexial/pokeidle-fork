import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  RAID_EVENT_ROTATION,
  raidEventByKey,
  rollRaidEvent,
  activeRaidEvent,
  todayKey,
} = await import('../src/data/daily-events.js')
const { gmaxFormFor } = await import('../src/data/mega-evolution.js')
const {
  TERA_TYPES,
  gmaxRaidBoss,
  gmaxRaidAlly,
  createGmaxRaidBoss,
  createTeraRaidBoss,
  gmaxRaidPrize,
} = await import('../src/game/minigames.js')
const { createOpponent } = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { pokemonSpecies } = await import('../src/data/gameData.js')

test('every rotation event names a real Gigantamax boss and ally', () => {
  assert.ok(RAID_EVENT_ROTATION.length >= 6, 'there is a real weekly rotation')
  const keys = RAID_EVENT_ROTATION.map((event) => event.key)
  assert.equal(new Set(keys).size, keys.length, 'no event is listed twice')
  for (const event of RAID_EVENT_ROTATION) {
    assert.equal(raidEventByKey[event.key], event)
    assert.ok(gmaxFormFor(event.boss), `${event.boss} has a Gigantamax form`)
    assert.ok(pokemonSpecies[event.ally], `${event.ally} is a real ally`)
    assert.ok(event.teraTypes.length > 0, `${event.key} lists Tera types`)
    for (const type of event.teraTypes)
      assert.ok(TERA_TYPES.includes(type), `${event.key} lists real type ${type}`)
    assert.ok(event.drops.length > 0, `${event.key} has an exclusive drop`)
  }
})

test('rollRaidEvent rotates weekly and picks the Tera type daily', () => {
  const thursday = rollRaidEvent('2024-01-04'),
    nextWednesday = rollRaidEvent('2024-01-10'),
    nextThursday = rollRaidEvent('2024-01-11')
  assert.deepEqual(thursday, rollRaidEvent('2024-01-04'))
  assert.equal(thursday.date, '2024-01-04')
  assert.equal(thursday.key, nextWednesday.key, 'the boss holds for the whole week')
  assert.notEqual(thursday.key, nextThursday.key, 'the boss changes the next week')
  assert.ok(raidEventByKey[thursday.key], 'the key maps to a real event')
  assert.ok(
    raidEventByKey[thursday.key].teraTypes.includes(thursday.teraType),
    'the daily Tera type belongs to the featured event'
  )
  const rotated = activeRaidEvent('2024-01-03')
  assert.equal(rotated.event.key, rotated.key, 'activeRaidEvent resolves the table entry')
  assert.equal(rotated.date, '2024-01-03')
})

test('a Gmax boss resolves to the gx- form and carries event metadata', () => {
  const rotation = activeRaidEvent('2024-06-15'),
    info = gmaxRaidBoss(rotation, 50)
  assert.equal(info.gmax, true)
  assert.equal(info.eventKey, rotation.key)
  assert.ok(info.speciesKey.startsWith('gx-'), 'the boss fights in its Gigantamax form')
  assert.equal(info.baseSpeciesKey, raidEventByKey[rotation.key].boss)
  assert.equal(info.stars, 5, 'event bosses are five-star')
  assert.equal(info.teraType, rotation.teraType)
  assert.ok(info.level > 50, 'the boss sits above the party')
})

test('the Gmax ally is a battle-ready simulated partner', () => {
  const event = RAID_EVENT_ROTATION[0],
    ally = gmaxRaidAlly(event, 40)
  assert.equal(ally.speciesKey, event.ally)
  assert.equal(ally.isAlly, true)
  assert.equal(ally.isPlayer, true)
  assert.ok(ally.maxHp > 0 && ally.currentHp > 0)
  assert.ok(ally.level >= 40)
})

test('the Gmax boss carries extra HP over a plain Tera boss', () => {
  const info = gmaxRaidBoss(activeRaidEvent('2024-06-15'), 50),
    gmax = createGmaxRaidBoss(info),
    plain = createTeraRaidBoss(info)
  assert.ok(gmax.maxHp > plain.maxHp, 'the event boss is tougher')
  assert.equal(gmax.currentHp, gmax.maxHp)
})

test('the event prize hands over a Gigantamax-capable boss and exclusive drops', () => {
  const event = RAID_EVENT_ROTATION[0],
    prize = gmaxRaidPrize(event, true, 65)
  assert.equal(prize.pokemon.speciesKey, event.boss)
  assert.equal(prize.pokemon.gmax, true, 'the reward can Gigantamax')
  assert.equal(prize.pokemon.level, 65)
  assert.ok(
    prize.items.some((item) => item.itemId === 'maxMushroom'),
    'a guaranteed Max Mushroom comes with the clear'
  )
  for (const drop of event.drops)
    assert.ok(
      prize.items.some((item) => item.itemId === drop.itemId),
      `${drop.itemId} is paid out`
    )
  assert.equal(gmaxRaidPrize(event, false, 65).pokemon, null, 'a failed event catches nothing')
})

test('clearing an event records it, ribbons the party and grants the Gmax factor', () => {
  const event = RAID_EVENT_ROTATION[0],
    base = {
      ...initialGameState,
      phase: 'teraRaid',
      party: [],
      box: [],
      inventory: {},
      money: 0,
      minigameRecords: {},
      raidEventRecords: {},
      nextPokemonId: 1,
    },
    originalRandom = Math.random
  Math.random = () => 0.99
  try {
    const claimed = gameReducer(base, {
        type: 'CLAIM_MINIGAME_REWARD',
        payload: gmaxRaidPrize(event, true, 60),
      }),
      ended = gameReducer(claimed, {
        type: 'END_MINIGAME',
        payload: { minigame: 'teraRaid', score: 5, completed: true, raidEvent: event.key },
      })
    assert.deepEqual(ended.raidEventRecords[event.key], { cleared: true, clears: 1 })
    assert.equal(ended.minigameRecords.teraRaid.completed, true)
    const reward = ended.party.find((member) => member.speciesKey === event.boss)
    assert.ok(reward, 'the event boss joins the party')
    assert.equal(reward.gmax, true, 'the caught boss carries the Gigantamax Factor')
    assert.ok(reward.ribbons.includes('gmax'), 'the party earns the Gigantamax Ribbon')

    // Clearing again counts up instead of replacing the record.
    const again = gameReducer(
      { ...ended, phase: 'teraRaid' },
      {
        type: 'END_MINIGAME',
        payload: { minigame: 'teraRaid', score: 5, completed: true, raidEvent: event.key },
      }
    )
    assert.equal(again.raidEventRecords[event.key].clears, 2)
  } finally {
    Math.random = originalRandom
  }
})

test('leaving an event raid without clearing never records a completion', () => {
  const event = RAID_EVENT_ROTATION[0],
    base = { ...initialGameState, phase: 'teraRaid', raidEventRecords: {} },
    left = gameReducer(base, {
      type: 'END_MINIGAME',
      payload: { minigame: 'teraRaid', score: 4, completed: false, raidEvent: event.key },
    })
  assert.equal(left.raidEventRecords[event.key], undefined)
})

test('todayKey still feeds a valid raid rotation', () => {
  const current = activeRaidEvent(todayKey())
  assert.ok(current.key && raidEventByKey[current.key])
  assert.ok(TERA_TYPES.includes(current.teraType))
})
