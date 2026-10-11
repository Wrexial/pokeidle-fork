import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  RIBBONS,
  awardRibbon,
  awardRibbonToParty,
  pokemonRibbons,
  syncMilestoneRibbons,
} = await import('../src/game/ribbons.js')
const { createPokemon, generateIVs } = await import('../src/game/pokemon.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')
const { gymLeaderData } = await import('../src/data/gameData.js')

test('awardRibbon is idempotent and ignores unknown ids', () => {
  const pokemon = createPokemon('bulbasaur', 5, 1)
  assert.equal(pokemon.ribbons, undefined)
  const once = awardRibbon(pokemon, 'effort')
  assert.deepEqual(once.ribbons, ['effort'])
  assert.equal(awardRibbon(once, 'effort'), once, 'a second award is a no-op')
  assert.equal(awardRibbon(pokemon, 'nonsense'), pokemon, 'an unknown id is ignored')
  assert.equal(RIBBONS.effort.name, 'Effort Ribbon')
})

test('awardRibbonToParty awards everyone and keeps the array when unchanged', () => {
  const party = [createPokemon('bulbasaur', 5, 1), createPokemon('charmander', 5, 2)]
  const awarded = awardRibbonToParty(party, 'gym')
  assert.ok(awarded.every((member) => member.ribbons.includes('gym')))
  assert.equal(awardRibbonToParty(awarded, 'gym'), awarded, 'no change, same array')
})

test('syncMilestoneRibbons awards the effort and friendship ribbons', () => {
  const base = createPokemon('bulbasaur', 5, 1)
  assert.equal(syncMilestoneRibbons(base).ribbons, undefined)
  const maxed = syncMilestoneRibbons({ ...base, level: 100 })
  assert.ok(maxed.ribbons.includes('effort'))
  const loved = syncMilestoneRibbons({ ...base, friendship: 255 })
  assert.ok(loved.ribbons.includes('bestFriends'))
  // Both at once.
  const both = syncMilestoneRibbons({ ...base, level: 100, friendship: 255 })
  assert.deepEqual([...both.ribbons].sort(), ['bestFriends', 'effort'])
})

test('pokemonRibbons maps ids to definitions and drops unknown ones', () => {
  const pokemon = { ribbons: ['gym', 'nonsense', 'league'] },
    ribbons = pokemonRibbons(pokemon)
  assert.deepEqual(
    ribbons.map((ribbon) => ribbon.id),
    ['gym', 'league']
  )
  assert.equal(pokemonRibbons(null).length, 0)
})

test('a Gym win hands the party the Gym Ribbon', () => {
  const starter = createPokemon('bulbasaur', 20, 1),
    gymId = gymLeaderData[0]?.id,
    base = {
      ...initialGameState,
      phase: 'battling',
      party: [starter],
      playerPokemon: starter,
      bossBattle: {
        bossId: gymId,
        bossType: 'gym',
        trainerName: 'Leader',
        trainerClass: 'Leader',
        trainerTeam: [],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'leader',
      },
      bossQueue: [],
    },
    ended = gameReducer(base, {
      type: 'BOSS_BATTLE_END',
      payload: { won: true, moneyDelta: 100 },
    })
  assert.ok(ended.party[0].ribbons?.includes('gym'), 'the party earned a Gym Ribbon')
})

test('a loss hands out no ribbon', () => {
  const starter = createPokemon('bulbasaur', 20, 1),
    base = {
      ...initialGameState,
      phase: 'battling',
      party: [starter],
      playerPokemon: starter,
      bossBattle: {
        bossId: gymLeaderData[0]?.id,
        bossType: 'gym',
        trainerName: 'Leader',
        trainerClass: 'Leader',
        trainerTeam: [],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'leader',
      },
      bossQueue: [],
    },
    ended = gameReducer(base, {
      type: 'BOSS_BATTLE_END',
      payload: { won: false, moneyDelta: -10 },
    })
  assert.ok(!ended.party[0].ribbons?.includes('gym'))
})

test('repairSave drops unknown ribbon ids and keeps real ones', () => {
  const stored = {
      id: '1',
      speciesKey: 'bulbasaur',
      level: 5,
      ivs: generateIVs(),
      moves: ['tackle'],
      currentHp: 20,
      maxHp: 20,
      ribbons: ['effort', 'notARibbon', 'gym'],
    },
    repaired = repairSave(
      serializeSave({
        ...gameReducer(initialGameState, {
          type: 'SELECT_STARTER',
          payload: { region: 'kanto', speciesKey: 'bulbasaur' },
        }),
        party: [stored],
        playerPokemon: stored,
        box: [],
      })
    )
  assert.deepEqual(repaired.party[0].ribbons, ['effort', 'gym'])
})

test('a cleared Contest hands the party the Contest Ribbon', () => {
  const starter = createPokemon('bulbasaur', 20, 1),
    base = { ...initialGameState, phase: 'contest', party: [starter], playerPokemon: starter },
    ended = gameReducer(base, {
      type: 'END_MINIGAME',
      payload: { score: 100, completed: true, minigame: 'contest' },
    })
  assert.ok(ended.party[0].ribbons?.includes('contest'))
  // A contest that was not cleared gives nothing.
  const left = gameReducer(
    { ...base, party: [createPokemon('bulbasaur', 20, 3)] },
    { type: 'END_MINIGAME', payload: { score: 0, completed: false, minigame: 'contest' } }
  )
  assert.ok(!left.party[0].ribbons?.includes('contest'))
})
