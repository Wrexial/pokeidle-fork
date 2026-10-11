import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  RIVAL_DIALOGUE,
  RIVAL_MILESTONES,
  buildRivalTeam,
  rivalChallenge,
  rivalDialogue,
  rivalName,
  rivalSpriteKey,
} = await import('../src/game/rival.js')
const { pokemonSpecies } = await import('../src/data/gameData.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')

/** A stable "random" so the team build is deterministic. */
function cyclingRng() {
  let index = 0
  return () => ((index++ * 0.6180339887) % 1)
}

test('every region has a named rival', () => {
  for (const regionId of [
    'kanto',
    'johto',
    'hoenn',
    'sinnoh',
    'unova',
    'kalos',
    'alola',
    'galar',
    'paldea',
  ])
    assert.ok(rivalName(regionId) && rivalName(regionId) !== 'Rival', regionId)
  assert.equal(rivalName('nonsense'), 'Rival')
})

test('the rival is ready at each badge milestone and done after the last', () => {
  assert.deepEqual(RIVAL_MILESTONES, [2, 4, 6, 8])
  // Fresh save: not ready at 1 badge, ready at 2.
  assert.equal(rivalChallenge({ rivals: {} }, 'kanto', 1).ready, false)
  assert.equal(rivalChallenge({ rivals: {} }, 'kanto', 2).ready, true)
  // After one win, the next milestone is 4 badges.
  const afterOne = rivalChallenge({ rivals: { kanto: 1 } }, 'kanto', 3)
  assert.equal(afterOne.ready, false)
  assert.equal(afterOne.requiredBadges, 4)
  assert.equal(rivalChallenge({ rivals: { kanto: 1 } }, 'kanto', 4).ready, true)
  // After every milestone, no more challenges.
  assert.equal(
    rivalChallenge({ rivals: { kanto: RIVAL_MILESTONES.length } }, 'kanto', 8).ready,
    false
  )
})

test('every rival has a sprite key and dialogue', () => {
  const regions = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea']
  for (const regionId of regions) {
    assert.ok(RIVAL_DIALOGUE[regionId], `${regionId} has dialogue`)
    const sprite = rivalSpriteKey(regionId)
    assert.ok(sprite && sprite !== 'acetrainer', `${regionId} has a rival sprite`)
    const dialogue = rivalDialogue(regionId, 0)
    assert.ok(dialogue.intro.length > 0 && dialogue.win && dialogue.lose)
  }
  assert.equal(rivalSpriteKey('nonsense'), 'acetrainer')
  assert.equal(rivalDialogue('nonsense', 0).intro.length > 0, true, 'falls back to a real rival')
})

test('buildRivalTeam scales and stays in the region generation', () => {
  const team = buildRivalTeam('kanto', 1, 30, cyclingRng())
  assert.equal(team.length, 3, '2 + stage members')
  assert.equal(new Set(team.map((member) => member.speciesKey)).size, 3, 'all distinct')
  for (const member of team) assert.ok(pokemonSpecies[member.speciesKey], `${member.speciesKey} is real`)
  // The ace sits at the base level (lead + stage) and the rest a little below.
  assert.equal(Math.max(...team.map((member) => member.level)), 31)
  assert.ok(team.every((member) => member.level <= 31 && member.level >= 29))
  // A higher stage fields more, higher-level Pokemon, capped at 100.
  const big = buildRivalTeam('kanto', 3, 98, cyclingRng())
  assert.equal(big.length, 5)
  assert.ok(big.every((member) => member.level <= 100))
})

test('beating the rival advances the stage and pays the bonus', () => {
  const base = {
      ...initialGameState,
      phase: 'battling',
      money: 1000,
      inventory: {},
      rivals: {},
      party: [{ id: '1', speciesKey: 'bulbasaur', level: 30, currentHp: 60, maxHp: 60 }],
      playerPokemon: { id: '1', speciesKey: 'bulbasaur', level: 30, currentHp: 60, maxHp: 60 },
      bossBattle: {
        bossId: 'rival-kanto-0',
        bossType: 'rival',
        trainerName: 'Blue',
        trainerClass: 'ace',
        trainerTeam: [],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'acetrainer',
        region: 'kanto',
      },
      bossQueue: [],
    },
    won = gameReducer(base, {
      type: 'BOSS_BATTLE_END',
      payload: { won: true, moneyDelta: 100 },
    })
  assert.equal(won.rivals.kanto, 1)
  assert.equal(won.money, 1000 + 100 + 2000, 'base payout plus the stage-0 bonus')
  assert.equal(won.inventory.rareCandy, 1)

  // A loss leaves the stage and money bonus alone.
  const lost = gameReducer(base, {
    type: 'BOSS_BATTLE_END',
    payload: { won: false, moneyDelta: -50 },
  })
  assert.ok(!lost.rivals.kanto)
  assert.equal(lost.inventory.rareCandy, undefined)
})

test('a full set of rival wins earns the Rival Ribbon', () => {
  const base = {
      ...initialGameState,
      phase: 'battling',
      money: 1000,
      inventory: {},
      rivals: { kanto: RIVAL_MILESTONES.length - 1 },
      party: [{ id: '1', speciesKey: 'bulbasaur', level: 30, currentHp: 60, maxHp: 60 }],
      playerPokemon: { id: '1', speciesKey: 'bulbasaur', level: 30, currentHp: 60, maxHp: 60 },
      bossBattle: {
        bossId: 'rival-kanto-3',
        bossType: 'rival',
        trainerName: 'Blue',
        trainerClass: 'ace',
        trainerTeam: [],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'blue',
        region: 'kanto',
      },
      bossQueue: [],
    },
    won = gameReducer(base, {
      type: 'BOSS_BATTLE_END',
      payload: { won: true, moneyDelta: 100 },
    })
  assert.equal(won.rivals.kanto, RIVAL_MILESTONES.length)
  assert.ok(won.party[0].ribbons?.includes('rival'), 'the party earns the Rival Ribbon')
  // A win before the last milestone does not.
  const early = gameReducer(
    { ...base, rivals: { kanto: 0 }, bossBattle: { ...base.bossBattle, bossId: 'rival-kanto-0' } },
    { type: 'BOSS_BATTLE_END', payload: { won: true, moneyDelta: 100 } }
  )
  assert.ok(!early.party[0].ribbons?.includes('rival'))
})

test('repairSave sanitises the rival record', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    repaired = repairSave(
      serializeSave({
        ...base,
        rivals: { kanto: 2.9, johto: 99, notARegion: 3, negative: -1 },
      })
    )
  assert.equal(repaired.rivals.kanto, 2)
  assert.equal(repaired.rivals.johto, RIVAL_MILESTONES.length, 'clamped to the milestone count')
  assert.ok(!('notARegion' in repaired.rivals))
  assert.ok(!('negative' in repaired.rivals))
})
