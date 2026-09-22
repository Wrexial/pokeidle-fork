import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const data = installGameData()

const { buildTowerTeam } = await import('../src/game/progression.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')

test('a tower team is always six distinct Pokemon', () => {
  for (const floor of [1, 5, 15, 30, 60]) {
    const team = buildTowerTeam(floor)
    assert.equal(team.length, 6, `floor ${floor} should field six`)
    assert.equal(new Set(team.map((member) => member.speciesKey)).size, 6)
  }
})

test('tower levels start at 55 and climb three per floor', () => {
  const team = buildTowerTeam(1)
  assert.equal(team[0].level, 58)
  assert.equal(team[5].level, 63)
})

test('tower levels cap at 100', () => {
  const team = buildTowerTeam(100)
  assert.ok(team.every((member) => member.level <= 100))
})

test('tower stat scaling starts at floor 15', () => {
  assert.equal(buildTowerTeam(10)[0].statMultiplier, 1)
  assert.equal(buildTowerTeam(15)[0].statMultiplier, 1)
  assert.ok(buildTowerTeam(20)[0].statMultiplier > 1)
})

test('early tower floors never field pre-evolutions or legendaries', () => {
  const earlyStages = new Set([
      'charmander',
      'charmeleon',
      'bulbasaur',
      'ivysaur',
      'squirtle',
      'wartortle',
      'pichu',
      'pikachu',
      'magikarp',
      'caterpie',
      'pidgey',
      'rattata',
    ]),
    { pokemonSpecies } = data
  for (let roll = 0; roll < 10; roll++)
    for (const member of buildTowerTeam(5)) {
      assert.ok(!earlyStages.has(member.speciesKey), `${member.speciesKey} is not final`)
      assert.ok(!pokemonSpecies[member.speciesKey].legendary, 'no legendaries before floor 40')
    }
})

test('a tower win auto-climbs, heals and stays in battle', () => {
  const active = createPokemon('charizard', 80, 'a'),
    state = {
      ...initialGameState,
      party: [active],
      playerPokemon: active,
      activePlayerPokemonIndex: 0,
      phase: 'victory',
      towerFloor: 3,
      bossBattle: {
        bossId: 'tower',
        bossType: 'tower',
        trainerName: 'Tower Trainer (Floor 3)',
        trainerClass: 'ace',
        trainerTeam: [],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'acetrainer',
        region: 'kanto',
      },
    },
    next = gameReducer(state, { type: 'BOSS_BATTLE_END', payload: { won: true, moneyDelta: 100 } })
  assert.equal(next.towerFloor, 4)
  assert.equal(next.phase, 'battling')
  assert.ok(next.enemyPokemon, 'the next floor starts immediately')
  assert.equal(next.bossBattle.bossType, 'tower')
  assert.ok(next.party.every((member) => member.currentHp === member.maxHp), 'the party is healed')
  assert.equal(next.victoryTokens, state.victoryTokens, 'floor 3 pays no tokens')
})

test('losing a tower run ends it and returns to idle', () => {
  const active = createPokemon('charizard', 80, 'a'),
    state = {
      ...initialGameState,
      party: [{ ...active, currentHp: 0 }],
      playerPokemon: active,
      activePlayerPokemonIndex: 0,
      phase: 'defeat',
      towerFloor: 7,
      bossBattle: {
        bossId: 'tower',
        bossType: 'tower',
        trainerName: 'Tower Trainer (Floor 7)',
        trainerClass: 'ace',
        trainerTeam: [],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'acetrainer',
        region: 'kanto',
      },
    },
    next = gameReducer(state, { type: 'BOSS_BATTLE_END', payload: { won: false, moneyDelta: 0 } })
  assert.equal(next.towerFloor, 0)
  assert.equal(next.phase, 'idle')
  assert.equal(next.towerBest.hoenn, 6)
})

test('a tower run is only offered in Hoenn', () => {
  const inKanto = gameReducer(
      { ...initialGameState, currentLocation: 'palletTown' },
      { type: 'START_TOWER', payload: { floor: 1 } }
    ),
    inHoenn = gameReducer(
      { ...initialGameState, currentLocation: 'hoenn-littleroot-town' },
      { type: 'START_TOWER', payload: { floor: 1 } }
    )
  assert.equal(inKanto.towerFloor, 0)
  assert.equal(inHoenn.towerFloor, 1)
})

test('a tower win always credits Hoenn, never the current region', () => {
  const active = createPokemon('blaziken', 80, 'a'),
    state = {
      ...initialGameState,
      party: [active],
      playerPokemon: active,
      activePlayerPokemonIndex: 0,
      phase: 'victory',
      currentLocation: 'palletTown',
      towerFloor: 9,
      bossBattle: {
        bossId: 'tower',
        bossType: 'tower',
        trainerName: 'Tower Trainer (Floor 9)',
        trainerClass: 'ace',
        trainerTeam: [],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'acetrainer',
        region: 'kanto',
      },
    },
    next = gameReducer(state, { type: 'BOSS_BATTLE_END', payload: { won: true, moneyDelta: 0 } })
  assert.equal(next.towerBest.hoenn, 9)
  assert.equal(next.towerBest.kanto, undefined)
})

/** A minimal but valid Hoenn save for repairSave. */
function hoennSave() {
  const mon = createPokemon('treecko', 10, 'a')
  return {
    version: 2,
    playerPokemon: mon,
    party: [mon],
    box: [],
    nextPokemonId: 2,
    inventory: { pokeball: 5 },
    startRegion: 'hoenn',
    currentLocation: 'hoenn-littleroot-town',
    currentRoute: 'hoenn-route-101',
  }
}

test('repairSave consolidates legacy per-region tower records into Hoenn', () => {
  const repaired = repairSave({
    ...hoennSave(),
    towerBest: { kanto: 12, hoenn: 7, johto: 3 },
    towerFloor: 5,
  })
  assert.deepEqual(repaired.towerBest, { hoenn: 12 }, 'the best record moves to Hoenn')
  assert.equal(repaired.towerFloor, 5, 'a Hoenn run is kept')
})

test('repairSave drops a tower run started in another region', () => {
  const repaired = repairSave({
    ...hoennSave(),
    startRegion: 'kanto',
    currentLocation: 'palletTown',
    currentRoute: 'route1',
    towerBest: { kanto: 9 },
    towerFloor: 4,
  })
  assert.deepEqual(repaired.towerBest, { hoenn: 9 })
  assert.equal(repaired.towerFloor, 0, 'a non-Hoenn run is discarded')
})
