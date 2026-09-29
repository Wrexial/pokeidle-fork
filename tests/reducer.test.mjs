import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createVolatileState } = await import('../src/game/combat.js')
const { mapData } = await import('../src/data/gameData.js')
const { createPokemon } = await import('../src/game/pokemon.js')

/** Start a Kanto run with Bulbasaur. */
function startedGame() {
  return gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
}

test('SELECT_STARTER sets up a Kanto run', () => {
  const state = startedGame()
  assert.equal(state.phase, 'idle')
  assert.equal(state.startRegion, 'kanto')
  assert.equal(state.party.length, 1)
  assert.equal(state.party[0].speciesKey, 'bulbasaur')
  assert.ok(state.pokedexCaught.includes('bulbasaur'))
  assert.ok(state.unlockedLocations.includes('palletTown'))
})

test('starting in a zone region opens the entry hub and its first area', () => {
  const state = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'alola', speciesKey: 'rowlet' },
  })
  assert.ok(state.unlockedLocations.includes('alola-iki-town'))
  assert.ok(state.unlockedLocations.includes('alola-melemele-island'), 'the zone hub opens')
  assert.ok(state.unlockedLocations.includes('alola-route-1'), 'the first sub-area opens')
  assert.equal(state.currentLocation, 'alola-route-1')
  assert.equal(state.currentRoute, 'alola-route-1')
})

test('TRAVEL reaches a location whose gate is met even if the saved list is stale', () => {
  // A loaded save can meet a gate without having recomputed its unlock list
  // yet, so TRAVEL checks the freshly-computed set rather than only the save.
  const started = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'alola', speciesKey: 'rowlet' },
    }),
    stale = {
      ...started,
      unlockedLocations: started.unlockedLocations.filter(
        (id) => id !== 'alola-route-1--hauoli-outskirts'
      ),
      pokedexCaught: ['rowlet', 'wingull'],
      // The outskirts now need a few Route 1 wins as well as the entry town.
      battlesWonByLocation: { 'alola-route-1': 4 },
    },
    traveled = gameReducer(stale, {
      type: 'TRAVEL',
      payload: { locationId: 'alola-route-1--hauoli-outskirts' },
    })
  assert.equal(traveled.currentLocation, 'alola-route-1--hauoli-outskirts')
  assert.ok(traveled.unlockedLocations.includes('alola-route-1--hauoli-outskirts'))
})

test('UNLOCK_REGION opens a zone region entry hub and first area', () => {
  const base = {
    ...initialGameState,
    phase: 'idle',
    startRegion: 'kanto',
    unlockedRegions: ['kanto'],
    unlockedLocations: ['palletTown', 'route1'],
    defeatedChampions: ['kanto'],
  }
  for (const regionId of ['alola', 'paldea']) {
    const state = gameReducer(base, { type: 'UNLOCK_REGION', payload: { regionId } })
    assert.ok(state.unlockedRegions.includes(regionId))
    assert.ok(
      state.unlockedLocations.some(
        (id) => mapData[id]?.type === 'zone' && mapData[id].region === regionId
      ),
      `${regionId} opens its entry zone hub`
    )
    assert.ok(
      state.unlockedLocations.some(
        (id) => mapData[id]?.type === 'route' && mapData[id].region === regionId
      ),
      `${regionId} opens a wild route to play`
    )
  }
})

test('candies apply in bulk and stop at level 100', () => {
  const mon = createPokemon('bulbasaur', 5, 'a'),
    state = {
      ...initialGameState,
      party: [mon],
      playerPokemon: mon,
      activePlayerPokemonIndex: 0,
      inventory: { rareCandy: 200 },
    },
    ten = gameReducer(state, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'rareCandy', pokemonId: 'a', quantity: 10 },
    })
  assert.equal(ten.party[0].level, 15)
  assert.equal(ten.inventory.rareCandy, 190)
  // A big stack stops at 100 and only consumes the candies it actually used
  // (85 more levels), not the whole request.
  const capped = gameReducer(ten, {
    type: 'USE_ITEM_ON_POKEMON',
    payload: { itemId: 'rareCandy', pokemonId: 'a', quantity: 999 },
  })
  assert.equal(capped.party[0].level, 100)
  assert.equal(capped.inventory.rareCandy, 105)
  // No candy is spent on an already maxed Pokemon.
  const maxed = gameReducer(capped, {
    type: 'USE_ITEM_ON_POKEMON',
    payload: { itemId: 'rareCandy', pokemonId: 'a', quantity: 1 },
  })
  assert.equal(maxed, capped)
})

test('CATCH_POKEMON adds to the party and spends the ball', () => {
  const base = startedGame(),
    state = gameReducer(
      { ...base, inventory: { ...base.inventory, pokeball: 3 } },
      {
        type: 'CATCH_POKEMON',
        payload: { speciesKey: 'pidgey', level: 5, pokeballUsed: 'pokeball', isShiny: false },
      }
    )
  assert.ok(state.party.some((/** @type {any} */ member) => member.speciesKey === 'pidgey'))
  assert.equal(state.inventory.pokeball, 2)
  assert.equal(state.party.length, 2)
})

test('CATCH_POKEMON sends a catch to the box when the party is full', () => {
  const base = startedGame(),
    fullParty = Array.from({ length: 6 }, (_, index) => ({ ...base.party[0], id: String(index + 1) })),
    state = gameReducer(
      { ...base, party: fullParty, inventory: { ...base.inventory, pokeball: 1 } },
      {
        type: 'CATCH_POKEMON',
        payload: { speciesKey: 'rattata', level: 5, pokeballUsed: 'pokeball', isShiny: false },
      }
    )
  assert.ok(state.box.some((/** @type {any} */ member) => member.speciesKey === 'rattata'))
  assert.equal(state.party.length, 6)
})

test('the "newest" box sort prepends a new catch', () => {
  const base = startedGame(),
    fullParty = Array.from({ length: 6 }, (_, index) => ({ ...base.party[0], id: String(index + 1) })),
    existing = { ...base.party[0], id: '99', speciesKey: 'caterpie' },
    state = gameReducer(
      { ...base, party: fullParty, box: [existing], boxSort: 'newest' },
      { type: 'CATCH_POKEMON', payload: { speciesKey: 'pidgey', level: 5, isShiny: false } }
    )
  assert.equal(state.box[0].speciesKey, 'pidgey', 'the new catch should lead the box')
})

test('other box sorts still append', () => {
  const base = startedGame(),
    fullParty = Array.from({ length: 6 }, (_, index) => ({ ...base.party[0], id: String(index + 1) })),
    existing = { ...base.party[0], id: '99', speciesKey: 'caterpie' },
    state = gameReducer(
      { ...base, party: fullParty, box: [existing], boxSort: 'dex' },
      { type: 'CATCH_POKEMON', payload: { speciesKey: 'pidgey', level: 5, isShiny: false } }
    )
  assert.equal(state.box[state.box.length - 1].speciesKey, 'pidgey')
})

test('MARK_CAUGHT registers a new species and notifies', () => {
  const state = gameReducer(startedGame(), {
    type: 'MARK_CAUGHT',
    payload: { speciesKey: 'pidgey' },
  })
  assert.ok(state.pokedexCaught.includes('pidgey'))
  assert.ok(state.notifications.length >= 1)
})

test('a Master Ball throw always catches and returns to idle', () => {
  const base = startedGame(),
    battling = {
      ...base,
      inventory: { ...base.inventory, masterball: 1 },
      phase: 'battling',
      enemyPokemon: {
        speciesKey: 'pidgey',
        name: 'Pidgey',
        level: 7,
        currentHp: 20,
        maxHp: 20,
        isShiny: false,
      },
    },
    catching = gameReducer(battling, { type: 'THROW_MASTER_BALL' })
  assert.equal(catching.phase, 'catching')
  assert.equal(catching.inventory.masterball, 0)

  const caught = gameReducer(catching, { type: 'COMPLETE_MASTER_BALL' })
  assert.equal(caught.phase, 'idle')
  assert.equal(caught.enemyPokemon, null)
  assert.ok(caught.pokedexCaught.includes('pidgey'))
  assert.ok(caught.party.some((/** @type {any} */ member) => member.speciesKey === 'pidgey'))
})

test('the Master Ball cannot be thrown without one', () => {
  const base = startedGame(),
    battling = {
      ...base,
      phase: 'battling',
      enemyPokemon: { speciesKey: 'pidgey', name: 'Pidgey', level: 7, currentHp: 20, maxHp: 20 },
    }
  assert.equal(gameReducer(battling, { type: 'THROW_MASTER_BALL' }), battling)
})

test('the dex-completion celebration pauses and then resumes', () => {
  const base = startedGame(),
    celebrating = gameReducer(base, {
      type: 'START_DEX_CELEBRATION',
      payload: { generation: 0 },
    })
  assert.equal(celebrating.phase, 'dexComplete')
  assert.deepEqual(celebrating.dexCelebration, { generation: 0 })

  const resumed = gameReducer(celebrating, { type: 'COMPLETE_DEX_CELEBRATION' })
  assert.equal(resumed.phase, 'idle')
  assert.equal(resumed.dexCelebration, null)

  assert.equal(
    gameReducer(base, { type: 'START_DEX_CELEBRATION', payload: { generation: 'x' } }),
    base,
    'an invalid generation is ignored'
  )
})

test('a Champion tactical swap costs its turn and is capped per battle', () => {
  const base = startedGame(),
    trainerTeam = [
      createPokemon('charizard', 75, 'champion-1'),
      createPokemon('blastoise', 75, 'champion-2'),
    ],
    state = {
      ...base,
      phase: 'battling',
      enemyPokemon: trainerTeam[0],
      bossBattle: {
        bossId: 'champion-kanto',
        bossType: 'champion',
        trainerName: 'Blue',
        trainerClass: 'ace',
        trainerTeam,
        currentTrainerPokemonIndex: 0,
        championSwapsRemaining: 2,
      },
    }
  const swapped = gameReducer(state, {
    type: 'TRAINER_SEND_NEXT_POKEMON',
    payload: { newPokemonIndex: 1, championSwap: true },
  })
  assert.equal(swapped.enemyPokemon.id, trainerTeam[1].id)
  assert.equal(swapped.enemyTurnSpent, true, 'the swap spends the Champion turn')
  assert.equal(swapped.bossBattle.championSwapsRemaining, 1)

  // A regular faint replacement neither costs a turn nor spends a swap.
  const normal = gameReducer(state, {
    type: 'TRAINER_SEND_NEXT_POKEMON',
    payload: { newPokemonIndex: 1 },
  })
  assert.notEqual(normal.enemyTurnSpent, true)
  assert.equal(normal.bossBattle.championSwapsRemaining, 2)

  // The counter never goes below zero.
  const exhausted = gameReducer(
    { ...state, bossBattle: { ...state.bossBattle, championSwapsRemaining: 0 } },
    {
      type: 'TRAINER_SEND_NEXT_POKEMON',
      payload: { newPokemonIndex: 1, championSwap: true },
    }
  )
  assert.equal(exhausted.bossBattle.championSwapsRemaining, 0)
})

test('stat stages reset when a new battle starts', () => {
  const enemy = { speciesKey: 'pidgey', name: 'Pidgey', currentHp: 10, maxHp: 10, moves: [] }
  let state = gameReducer(startedGame(), { type: 'START_ENCOUNTER', payload: { enemy } })
  state = gameReducer(state, {
    type: 'UPDATE_VOLATILE',
    payload: {
      player: {
        ...state.playerVolatile,
        statStages: { attack: 0, defense: 2, spAttack: 0, spDefense: 2, speed: 0 },
      },
      enemy: state.playerVolatile,
    },
  })
  assert.equal(state.playerVolatile.statStages.defense, 2, 'the boost is recorded for the turn')

  // Leaving the battle and starting another begins from a clean slate, so a
  // Cosmic Power boost cannot leak into the next encounter.
  state = gameReducer(state, { type: 'PHASE_IDLE' })
  state = gameReducer(state, { type: 'START_ENCOUNTER', payload: { enemy } })
  assert.deepEqual(state.playerVolatile.statStages, {
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
  })
})

const boostedVolatile = () => ({
  ...createVolatileState(),
  statStages: { attack: 0, defense: 4, spAttack: 0, spDefense: 4, speed: 0 },
})

test('chained Elite Four battles reset the player volatile state', () => {
  // BOSS_BATTLE_END with a queued next member used to start the next bout
  // without a fresh volatile, so a Cosmic Power boost carried through the
  // whole Elite Four and Champion run.
  const nextTeam = [createPokemon('lapras', 70, 'e4-2')],
    state = {
      ...startedGame(),
      phase: 'battling',
      enemyPokemon: createPokemon('exeggutor', 70, 'e4-1'),
      playerVolatile: boostedVolatile(),
      bossBattle: {
        bossId: 'e4-1',
        bossType: 'e4',
        trainerName: 'Lorelei',
        trainerClass: 'elite',
        trainerTeam: [createPokemon('exeggutor', 70, 'e4-1')],
        currentTrainerPokemonIndex: 0,
        region: 'kanto',
      },
      bossQueue: [
        {
          bossId: 'e4-2',
          bossType: 'e4',
          trainerName: 'Bruno',
          trainerClass: 'elite',
          trainerTeam: nextTeam,
          spriteKey: 'bruno',
          region: 'kanto',
        },
      ],
    }
  const next = gameReducer(state, { type: 'BOSS_BATTLE_END', payload: { won: true, moneyDelta: 100 } })
  assert.equal(next.phase, 'battling')
  assert.equal(next.enemyPokemon.id, nextTeam[0].id, 'the next member is sent out')
  assert.deepEqual(next.playerVolatile.statStages, {
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
  })
})

test('healing into a boss rematch resets the player volatile state', () => {
  const team = [createPokemon('machamp', 70, 'boss-1')],
    state = {
      ...startedGame(),
      phase: 'healing',
      healingState: { step: 'place' },
      playerVolatile: boostedVolatile(),
      pendingBossBattle: {
        bossId: 'e4-1',
        bossType: 'e4',
        trainerName: 'Lorelei',
        trainerClass: 'elite',
        trainerTeam: team,
        spriteKey: 'lorelei',
        region: 'kanto',
      },
    }
  const next = gameReducer(state, { type: 'COMPLETE_HEALING' })
  assert.equal(next.phase, 'battling')
  assert.equal(next.enemyPokemon.id, team[0].id)
  assert.deepEqual(next.playerVolatile.statStages, {
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
  })
})
