import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const data = installGameData()

const { buildTowerTeam } = await import('../src/game/progression.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

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
  assert.equal(next.towerBest.kanto, 6)
})
