import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { heldExpMultiplier, heldMoneyMultiplier, heldStatMultiplier, rollHeldItem, rollWildHeldItem, WILD_HELD_ITEMS } = await import('../src/game/held-items.js')
const { resolveBattleTurn } = await import('../src/game/combat.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { getItemCategory } = await import('../src/game/progression.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { moveData } = await import('../src/data/gameData.js')

/**
 * @param {Record<string, any>} [overrides]
 * @returns {any}
 */
function battler(overrides = {}) {
  return {
    speciesKey: 'pidgey',
    name: 'Pidgey',
    types: ['Normal', 'Flying'],
    level: 50,
    currentHp: 400,
    maxHp: 400,
    attack: 150,
    defense: 120,
    spAttack: 150,
    spDefense: 120,
    speed: 80,
    moves: ['splash'],
    isPlayer: false,
    ...overrides,
  }
}

/** @param {number} value @param {() => void} body */
function withFixedRandom(value, body) {
  const originalRandom = Math.random
  try {
    Math.random = () => value
    body()
  } finally {
    Math.random = originalRandom
  }
}

test('held items are their own bag category and carry their stat boosts', () => {
  assert.equal(getItemCategory('leftovers'), 'held')
  assert.equal(heldStatMultiplier({ heldItem: 'choiceBand' }, 'attack'), 1.5)
  assert.equal(heldStatMultiplier({ heldItem: 'choiceBand' }, 'spAttack'), 1)
  assert.equal(heldStatMultiplier({ heldItem: 'eviolite' }, 'defense', true), 1.5)
  assert.equal(heldStatMultiplier({ heldItem: 'eviolite' }, 'defense', false), 1)
})

test('the Lucky Egg and Amulet Coin boost EXP and prize money', () => {
  assert.equal(heldExpMultiplier({ heldItem: 'luckyEgg' }), 1.5)
  assert.equal(heldExpMultiplier({ heldItem: 'leftovers' }), 1)
  assert.equal(heldExpMultiplier(null), 1)
  assert.equal(heldMoneyMultiplier({ heldItem: 'amuletCoin' }), 2)
  assert.equal(heldMoneyMultiplier({ heldItem: 'leftovers' }), 1)
})

test('Leftovers heals at the end of the turn', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        heldItem: 'leftovers',
        currentHp: 200,
        maxHp: 400,
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.currentHp, 225, '1/16 of max HP')
  })
})

test('a type booster raises damage of its type', () => {
  withFixedRandom(0.5, () => {
    const damage = (/** @type {string | undefined} */ heldItem) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['ember'],
          speed: 200,
          spAttack: 300,
          heldItem,
        }),
        enemy = battler({
          name: 'Foe',
          moves: ['splash'],
          currentHp: 9999,
          maxHp: 9999,
          types: ['Normal'],
        }),
        events = resolveBattleTurn(player, enemy, false)
      return events.find(
        (/** @type {any} */ event) => event.type === 'damage' && event.data?.target === 'enemy'
      ).data.damage
    }
    assert.ok(damage('charcoal') > damage(undefined))
  })
})

test('Life Orb boosts damage but costs the holder HP', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 200,
        heldItem: 'lifeOrb',
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 9999, maxHp: 9999, defense: 1 })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.currentHp, 360, '10% Life Orb recoil')
  })
})

test('Focus Sash survives a full-HP knockout', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['hyperBeam'],
        speed: 200,
        attack: 9999,
        spAttack: 9999,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        heldItem: 'focusSash',
        currentHp: 300,
        maxHp: 300,
        defense: 1,
      })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.currentHp, 1)
    assert.equal(enemy.heldItemUsed, true)
  })
})

test('a Sitrus Berry heals once when below half HP', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        heldItem: 'sitrusBerry',
        currentHp: 100,
        maxHp: 400,
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.currentHp, 200, '25% max HP healed')
    assert.equal(player.heldItemUsed, true)
  })
})

test('a Lum Berry cures an inflicted status', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['thunderWave'],
        speed: 200,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        heldItem: 'lumBerry',
        types: ['Normal'],
      }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(!enemy.status, 'the status is cured immediately')
    assert.equal(enemy.heldItemUsed, true)
    assert.ok(events.some((/** @type {any} */ event) => event.message.includes('Lum Berry')))
  })
})

test('wild held items are curated and never a Mega Stone', () => {
  assert.equal(rollHeldItem(0), null, 'a zero chance gives no item')
  for (let roll = 0; roll < 300; roll++) {
    const item = rollHeldItem(1)
    assert.ok(item && WILD_HELD_ITEMS.includes(item), `unexpected wild item ${item}`)
    assert.notEqual(item, 'megaStone')
  }
})

test('wild held items suit the holder types', () => {
  const water = new Set(),
    fire = new Set()
  for (let roll = 0; roll < 400; roll++) {
    water.add(rollWildHeldItem(['Water'], 1))
    fire.add(rollWildHeldItem(['Fire', 'Flying'], 1))
  }
  for (const item of water)
    assert.ok(
      ['sitrusBerry', 'lumBerry', 'mysticWater'].includes(item),
      `Water type held ${item}`
    )
  assert.ok(water.has('mysticWater'))
  // A dual type can hold either booster, but never an unrelated one.
  for (const item of fire)
    assert.ok(
      ['sitrusBerry', 'lumBerry', 'charcoal', 'sharpBeak'].includes(item),
      `Fire/Flying type held ${item}`
    )
  assert.ok(fire.has('charcoal') || fire.has('sharpBeak'))
})

test('Thief and Covet steal the foe held item', () => {
  for (const move of ['thief', 'covet']) {
    withFixedRandom(0.5, () => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: [move],
          speed: 200,
          attack: 200,
        }),
        enemy = battler({
          name: 'Foe',
          moves: ['splash'],
          heldItem: 'sitrusBerry',
          currentHp: 9999,
          maxHp: 9999,
          defense: 1,
        })
      resolveBattleTurn(player, enemy, false)
      assert.equal(player.heldItem, 'sitrusBerry', `${move} takes the item`)
      assert.equal(enemy.heldItem, null)
    })
  }
})

test('Knock Off removes the foe item but keeps it for itself', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['knockOff'],
        speed: 200,
        attack: 200,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        heldItem: 'leftovers',
        currentHp: 9999,
        maxHp: 9999,
        defense: 1,
      })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.heldItem, null)
    assert.ok(!player.heldItem, 'Knock Off does not take the item')
  })
})

test('Pluck and Bug Bite eat the foe Berry', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['bugBite'],
        speed: 200,
        attack: 200,
        currentHp: 100,
        maxHp: 400,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        heldItem: 'sitrusBerry',
        currentHp: 9999,
        maxHp: 9999,
        defense: 1,
      })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.heldItem, null, 'the Berry is eaten')
    assert.ok(player.currentHp > 100, 'the eater is healed')
  })
})

test('Sticky Hold keeps an item through Knock Off', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['knockOff'],
        speed: 200,
        attack: 200,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        heldItem: 'leftovers',
        ability: 'stickyHold',
        currentHp: 9999,
        maxHp: 9999,
        defense: 1,
      })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.heldItem, 'leftovers')
  })
})

test('the reducer equips and removes held items', () => {
  const member = createPokemon('bulbasaur', 10, 'a'),
    state = {
      ...initialGameState,
      party: [member],
      inventory: { leftovers: 1, choiceBand: 1 },
    },
    equipped = gameReducer(state, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'leftovers', pokemonId: 'a' },
    })
  assert.equal(equipped.party[0].heldItem, 'leftovers')
  assert.equal(equipped.inventory.leftovers, 0)
  const swapped = gameReducer(equipped, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'choiceBand', pokemonId: 'a' },
    }),
    cleared = gameReducer(swapped, { type: 'CLEAR_HELD_ITEM', payload: { pokemonId: 'a' } })
  assert.equal(swapped.party[0].heldItem, 'choiceBand')
  assert.equal(swapped.inventory.leftovers, 1, 'the replaced item returns to the bag')
  assert.equal(cleared.party[0].heldItem, null)
  assert.equal(cleared.inventory.choiceBand, 1)
})

test('a held item can be taken back from a boxed Pokemon', () => {
  const member = createPokemon('bulbasaur', 10, 'boxed')
  member.heldItem = 'leftovers'
  const state = { ...initialGameState, party: [], box: [member], inventory: {} },
    cleared = gameReducer(state, { type: 'CLEAR_HELD_ITEM', payload: { pokemonId: 'boxed' } })
  assert.equal(cleared.box[0].heldItem, null)
  assert.equal(cleared.inventory.leftovers, 1, 'the item returns to the bag')
  assert.deepEqual(cleared.party, [], 'the party is untouched')
})

test('a Choice item locks the holder into its first move', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle', 'ember'],
        speed: 200,
        attack: 200,
        heldItem: 'choiceBand',
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 9999, maxHp: 9999 }),
      firstEvents = resolveBattleTurn(player, enemy, false)
    assert.ok(player.choiceLock, 'the first move is locked in')
    assert.ok(
      firstEvents.some(
        (/** @type {any} */ event) =>
          event.type === 'attack' && event.message.includes(moveData[player.choiceLock].name)
      )
    )
    const locked = player.choiceLock,
      secondEvents = resolveBattleTurn(player, enemy, false)
    assert.equal(player.choiceLock, locked, 'the lock persists')
    assert.ok(
      secondEvents.some(
        (/** @type {any} */ event) =>
          event.type === 'attack' && event.message.includes(moveData[locked].name)
      ),
      'it repeats the locked move'
    )
  })
})

test('a Rocky Helmet hurts a contact attacker but not a ranged one', () => {
  const run = (/** @type {string} */ moveId) => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: [moveId],
        attack: 200,
        spAttack: 200,
        speed: 200,
      }),
      enemy = battler({
        name: 'Foe',
        heldItem: 'rockyHelmet',
        defense: 200,
        spDefense: 200,
        currentHp: 9999,
        maxHp: 9999,
      })
    resolveBattleTurn(player, enemy, false, false, null, null, true)
    return player.currentHp
  }
  // Tackle makes contact, so the helmet bites for 1/6 of max HP.
  assert.equal(run('tackle'), 400 - Math.floor(400 / 6))
  // A special move does not make contact.
  assert.equal(run('thunderbolt'), 400)
})

test('a pinch berry boosts its stat at a quarter HP, once', () => {
  const run = (/** @type {number} */ hp) => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        heldItem: 'liechiBerry',
        currentHp: hp,
        maxHp: 400,
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false, false, null, null, true)
    return player
  }
  const low = run(100)
  assert.equal(low.statStages.attack, 1, 'Liechi raises Attack at a quarter HP')
  assert.equal(low.heldItemUsed, true, 'the berry is consumed')
  // A second end-of-turn does not raise it again.
  const again = run(100)
  resolveBattleTurn(again, battler({ name: 'Foe', moves: ['splash'] }), false, false, null, null, true)
  assert.equal(again.statStages.attack, 1)
  // Above the threshold the berry is untouched.
  const healthy = run(300)
  assert.equal(healthy.statStages.attack ?? 0, 0)
  assert.ok(!healthy.heldItemUsed, 'the berry is not consumed above the threshold')
})
