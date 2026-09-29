// Trainer battles must register the opposing Pokemon in the Pokedex as "seen",
// exactly like a wild encounter does (and "shiny seen" for a shiny foe).

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { createBattlePokemon } = await import('../src/game/combat.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

/** A minimal battling state carrying a player Pokemon. */
function state(overrides = {}) {
  const player = {
    id: 'p1',
    speciesKey: 'charmander',
    name: 'Charmander',
    types: ['Fire'],
    level: 20,
    currentHp: 60,
    maxHp: 60,
    moves: ['tackle'],
  }
  return {
    ...initialGameState,
    phase: 'idle',
    party: [player],
    playerPokemon: player,
    ...overrides,
  }
}

test('a wild encounter registers the foe as seen', () => {
  const enemy = createBattlePokemon('pidgey', 5)
  const after = gameReducer(state(), { type: 'START_ENCOUNTER', payload: { enemy } })
  assert.ok(after.pokedexSeen.includes('pidgey'))
})

test('a shiny wild encounter also registers it as shiny seen', () => {
  const enemy = createBattlePokemon('pidgey', 5, { isShiny: true })
  const after = gameReducer(state(), { type: 'START_ENCOUNTER', payload: { enemy } })
  assert.ok(after.pokedexSeen.includes('pidgey'))
  assert.ok(after.shinySeen.includes('pidgey'))
})

test('a static encounter registers the foe as seen', () => {
  const after = gameReducer(
    state({ currentLocation: 'johto-route-36', claimedGifts: [] }),
    { type: 'START_STATIC_ENCOUNTER', payload: { staticId: 'static-johto-sudowoodo' } }
  )
  assert.ok(after.pokedexSeen.includes('sudowoodo'))
})

test('a trainer battle registers the first Pokemon out as seen', () => {
  const trainerTeam = [createBattlePokemon('geodude', 12), createBattlePokemon('onix', 14)]
  const after = gameReducer(state(), {
    type: 'START_TRAINER_BATTLE',
    payload: {
      trainerId: 'brock',
      trainerName: 'Brock',
      trainerClass: 'ace',
      trainerTeam,
    },
  })
  assert.ok(after.pokedexSeen.includes('geodude'), 'the lead is seen')
  assert.ok(!after.pokedexSeen.includes('onix'), 'the bench is not seen until sent out')
})

test('sending the next trainer Pokemon registers it as seen', () => {
  const trainerTeam = [createBattlePokemon('geodude', 12), createBattlePokemon('onix', 14)],
    battling = gameReducer(state(), {
      type: 'START_TRAINER_BATTLE',
      payload: {
        trainerId: 'brock',
        trainerName: 'Brock',
        trainerClass: 'ace',
        trainerTeam,
      },
    }),
    after = gameReducer(battling, {
      type: 'TRAINER_SEND_NEXT_POKEMON',
      payload: { newPokemonIndex: 1 },
    })
  assert.ok(after.pokedexSeen.includes('onix'))
})

test('a gym/league boss battle registers its lead as seen', () => {
  const trainerTeam = [createBattlePokemon('staryu', 21), createBattlePokemon('starmie', 23)]
  const after = gameReducer(state(), {
    type: 'START_BOSS_BATTLE',
    payload: {
      bossId: 'misty',
      bossType: 'gym',
      trainerName: 'Misty',
      trainerClass: 'ace',
      trainerTeam,
    },
  })
  assert.ok(after.pokedexSeen.includes('staryu'))
  assert.ok(!after.pokedexSeen.includes('starmie'))
})

test('the Elite Four gauntlet registers the next member\u2019s lead as seen', () => {
  const nextTeam = [createBattlePokemon('slowpoke', 50), createBattlePokemon('slowbro', 52)]
  const after = gameReducer(
    state({
      phase: 'battling',
      bossBattle: {
        bossId: 'lorelei',
        bossType: 'e4',
        trainerName: 'Lorelei',
        trainerClass: 'ace',
        trainerTeam: [createBattlePokemon('dewgong', 50)],
        currentTrainerPokemonIndex: 0,
      },
      bossQueue: [
        {
          bossId: 'bruno',
          bossType: 'e4',
          trainerName: 'Bruno',
          trainerClass: 'ace',
          trainerTeam: nextTeam,
          spriteKey: 'bruno',
        },
      ],
    }),
    { type: 'BOSS_BATTLE_END', payload: { won: true, moneyDelta: 100 } }
  )
  assert.ok(after.pokedexSeen.includes('slowpoke'), 'the next member\u2019s lead is seen')
  assert.ok(!after.pokedexSeen.includes('slowbro'))
})
