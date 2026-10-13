import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  VILLAIN_ORGS,
  VILLAIN_STAGES,
  VILLAIN_TOTAL_STAGES,
  buildVillainTeam,
  villainProgressFor,
  villainRewardFor,
  villainStageKind,
  villainStageLabel,
  villainStageLines,
  villainStageName,
  villainStatus,
  VILLAIN_STAGE_LEVELS,
} = await import('../src/game/villain-teams.js')
const { QUEST_LEGENDARY_BY_REGION, isVillainLegendaryLocked, withoutLockedLegendary } =
  await import('../src/data/legendary-quests.js')
const { mapData, pokemonSpecies, raidPoolFor } = await import('../src/data/gameData.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')
const { RIBBONS } = await import('../src/game/pokemon.js')

const REGIONS = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea']

/** A stable "random" so the team build is deterministic. */
function cyclingRng() {
  let index = 0
  return () => (index++ * 0.6180339887) % 1
}

test('every region has an org with a real hideout on its map', () => {
  for (const regionId of REGIONS) {
    const org = VILLAIN_ORGS[regionId]
    assert.ok(org, `${regionId} has an org`)
    assert.ok(org.name && org.tagline, `${regionId} is named and themed`)
    const hideout = mapData[org.hideout.id]
    assert.ok(hideout, `${regionId} hideout ${org.hideout.id} exists`)
    assert.equal(hideout.type, 'hideout')
    assert.equal(hideout.region, regionId)
    assert.equal(hideout.name, org.hideout.name)
    assert.equal(hideout.unlock.badgesRequired, org.hideout.badgeGate)
    assert.ok(hideout.unlock.requires.includes(org.hideout.parent), 'gated behind its town')
    assert.ok(hideout.connections.includes(org.hideout.parent), 'road to its town')
    assert.ok(mapData[org.hideout.parent].connections.includes(org.hideout.id), 'mutual road')
    assert.ok(org.reward.ribbon === `villain-${regionId}`, 'reward names a region ribbon')
    assert.ok(RIBBONS[org.reward.ribbon], `${regionId} ribbon is registered`)
  }
})

test('each org has an admin and a boss with a legendary', () => {
  for (const regionId of REGIONS) {
    const org = VILLAIN_ORGS[regionId],
      legendary = pokemonSpecies[org.boss.legendary]
    assert.ok(legendary, `${regionId} boss legendary is real`)
    assert.ok(legendary.legendary, `${regionId} boss fields a legendary`)
    assert.notEqual(
      org.boss.legendary,
      QUEST_LEGENDARY_BY_REGION[regionId],
      `${regionId} boss does not steal the box legendary`
    )
    assert.ok(pokemonSpecies[org.boss.signature], `${regionId} boss signature is real`)
    assert.ok(pokemonSpecies[org.admin.signature], `${regionId} admin signature is real`)
    assert.ok(org.admin.name && org.boss.name, `${regionId} officers are named`)
    assert.ok(villainStageLines(org, 'boss').length > 0, `${regionId} boss speaks`)
  }
})

test('buildVillainTeam grows from grunt to boss and keeps the ace', () => {
  for (const regionId of REGIONS) {
    const org = VILLAIN_ORGS[regionId],
      grunt = buildVillainTeam('grunt-1', regionId, cyclingRng()),
      admin = buildVillainTeam('admin', regionId, cyclingRng()),
      boss = buildVillainTeam('boss', regionId, cyclingRng())
    assert.equal(grunt.length, 2, `${regionId} grunt fields two`)
    assert.equal(admin.length, 3, `${regionId} admin fields three`)
    assert.equal(boss.length, 5, `${regionId} boss fields five`)
    const keys = [...grunt, ...admin, ...boss].map((member) => member.speciesKey)
    for (const key of keys) assert.ok(pokemonSpecies[key], `${regionId} fields ${key}`)
    assert.equal(admin[admin.length - 1].speciesKey, org.admin.signature, 'admin ace')
    assert.equal(boss[boss.length - 1].speciesKey, org.boss.legendary, 'boss legendary ace')
    assert.ok(
      boss.some((member) => member.speciesKey === org.boss.signature),
      'boss signature is present'
    )
    // Levels climb with the stage and stay ordered within a team.
    const gruntMax = Math.max(...grunt.map((member) => member.level)),
      adminMax = Math.max(...admin.map((member) => member.level)),
      bossMax = Math.max(...boss.map((member) => member.level))
    assert.ok(adminMax > gruntMax && bossMax > adminMax, `${regionId} levels ramp`)
    for (const team of [grunt, admin, boss]) {
      const levels = team.map((member) => member.level)
      assert.deepEqual(levels, [...levels].sort((left, right) => left - right), 'ordered')
      assert.ok(levels.every((level) => level >= 5 && level <= 100))
    }
  }
})

test('the stage metadata reads back the arc', () => {
  assert.deepEqual(VILLAIN_STAGES, ['grunt-1', 'grunt-2', 'grunt-3', 'admin', 'boss'])
  assert.equal(VILLAIN_TOTAL_STAGES, 5)
  assert.equal(villainStageKind('grunt-2'), 'grunt')
  assert.equal(villainStageKind('admin'), 'admin')
  assert.equal(villainStageKind('boss'), 'boss')
  const org = VILLAIN_ORGS.kanto
  assert.equal(villainStageName(org, 'admin'), org.admin.name)
  assert.equal(villainStageName(org, 'boss'), org.boss.name)
  assert.equal(villainStageLabel(org, 'grunt-3'), 'Grunt 3')
})

test('villainStatus tracks progress and the next stage', () => {
  const fresh = villainStatus({ villainProgress: {} }, 'kanto')
  assert.equal(fresh.progress, 0)
  assert.equal(fresh.nextStage, 'grunt-1')
  assert.equal(fresh.complete, false)
  assert.equal(fresh.stages.filter((stage) => stage.done).length, 0)

  const mid = villainStatus({ villainProgress: { kanto: 3 } }, 'kanto')
  assert.equal(mid.nextStage, 'admin')
  assert.deepEqual(
    mid.stages.map((stage) => stage.done),
    [true, true, true, false, false]
  )

  const done = villainStatus({ villainProgress: { kanto: 5 } }, 'kanto')
  assert.equal(done.complete, true)
  assert.equal(done.nextStage, null)
  assert.equal(villainProgressFor({ villainProgress: { kanto: 99 } }, 'kanto'), 5)
  assert.equal(villainStatus({}, 'nonsense'), null)
  assert.equal(villainRewardFor('kanto').items.masterball, 1)
})

test('a boss win completes the arc and pays the reward once', () => {
  const base = {
      ...initialGameState,
      phase: 'battling',
      money: 1000,
      inventory: {},
      villainProgress: { kanto: VILLAIN_TOTAL_STAGES - 1 },
      party: [{ id: '1', speciesKey: 'bulbasaur', level: 60, currentHp: 120, maxHp: 120 }],
      playerPokemon: { id: '1', speciesKey: 'bulbasaur', level: 60, currentHp: 120, maxHp: 120 },
      bossBattle: {
        bossId: 'villain-kanto-boss',
        bossType: 'villain',
        trainerName: 'Giovanni',
        trainerClass: 'ace',
        trainerTeam: [],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'giovanni',
        region: 'kanto',
        villainRegion: 'kanto',
        villainStage: VILLAIN_STAGES.indexOf('boss'),
      },
      bossQueue: [],
    },
    reward = villainRewardFor('kanto'),
    won = gameReducer(base, {
      type: 'BOSS_BATTLE_END',
      payload: { won: true, moneyDelta: 100 },
    })
  assert.equal(won.villainProgress.kanto, VILLAIN_TOTAL_STAGES)
  assert.equal(won.money, 1000 + 100 + reward.money)
  assert.equal(won.inventory.masterball, 1)
  assert.equal(won.victoryTokens, reward.victoryTokens)
  assert.ok(won.party[0].ribbons?.includes(reward.ribbon), 'the party earns the org ribbon')

  // A second boss win cannot pay the reward again.
  const again = gameReducer(
    { ...won, phase: 'battling', bossBattle: { ...base.bossBattle } },
    { type: 'BOSS_BATTLE_END', payload: { won: true, moneyDelta: 0 } }
  )
  assert.equal(again.inventory.masterball, 1)
  assert.equal(again.money, won.money)

  // A loss neither advances the arc nor pays.
  const lost = gameReducer(base, {
    type: 'BOSS_BATTLE_END',
    payload: { won: false, moneyDelta: -50 },
  })
  assert.equal(lost.villainProgress.kanto, VILLAIN_TOTAL_STAGES - 1)
  assert.equal(lost.inventory.masterball, undefined)
})

test('a grunt win advances the arc without paying the reward', () => {
  const base = {
      ...initialGameState,
      phase: 'battling',
      money: 1000,
      inventory: {},
      villainProgress: {},
      party: [{ id: '1', speciesKey: 'bulbasaur', level: 40, currentHp: 100, maxHp: 100 }],
      playerPokemon: { id: '1', speciesKey: 'bulbasaur', level: 40, currentHp: 100, maxHp: 100 },
      bossBattle: {
        bossId: 'villain-kanto-grunt-1',
        bossType: 'villain',
        trainerName: 'Team Rocket Grunt',
        trainerClass: 'roughneck',
        trainerTeam: [],
        currentTrainerPokemonIndex: 0,
        spriteKey: 'roughneck',
        region: 'kanto',
        villainRegion: 'kanto',
        villainStage: 0,
      },
      bossQueue: [],
    },
    won = gameReducer(base, {
      type: 'BOSS_BATTLE_END',
      payload: { won: true, moneyDelta: 100 },
    })
  assert.equal(won.villainProgress.kanto, 1)
  assert.equal(won.inventory.masterball, undefined)
  assert.ok(!won.party[0].ribbons?.includes('villain-kanto'))
})

test('the arc ramps from a Lv.75 first grunt to a Lv.100 boss', () => {
  assert.deepEqual(VILLAIN_STAGE_LEVELS, {
    'grunt-1': 75,
    'grunt-2': 80,
    'grunt-3': 85,
    admin: 90,
    boss: 100,
  })
  for (const regionId of REGIONS) {
    const boss = buildVillainTeam('boss', regionId, cyclingRng()),
      first = buildVillainTeam('grunt-1', regionId, cyclingRng())
    assert.equal(Math.max(...first.map((member) => member.level)), 75, `${regionId} first grunt`)
    assert.equal(Math.max(...boss.map((member) => member.level)), 100, `${regionId} boss`)
  }
})

test('the boss legendary is locked out of the raid pool until the arc is cleared', () => {
  for (const regionId of REGIONS) {
    const org = VILLAIN_ORGS[regionId],
      legendary = org.boss.legendary,
      fresh = raidPoolFor(regionId, { villainProgress: {} }),
      cleared = raidPoolFor(regionId, { villainProgress: { [regionId]: VILLAIN_TOTAL_STAGES } })
    assert.ok(isVillainLegendaryLocked(regionId, { villainProgress: {} }), `${regionId} locked at 0`)
    assert.ok(
      !isVillainLegendaryLocked(regionId, {
        villainProgress: { [regionId]: VILLAIN_TOTAL_STAGES },
      }),
      `${regionId} released once cleared`
    )
    assert.ok(
      !fresh.some((entry) => entry.speciesKey === legendary),
      `${regionId} hides ${legendary} while the arc is open`
    )
    assert.ok(
      cleared.some((entry) => entry.speciesKey === legendary),
      `${regionId} restores ${legendary} after the arc`
    )
    const withheld = withoutLockedLegendary(
      regionId,
      { villainProgress: {} },
      [{ speciesKey: legendary, level: 75 }]
    )
    assert.equal(withheld.length, 0, 'the generic helper withholds it too')
  }
})

test('repairSave sanitises the villain record', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    repaired = repairSave(
      serializeSave({
        ...base,
        villainProgress: { kanto: 3.7, hoenn: 99, notARegion: 2, negative: -1 },
      })
    )
  assert.equal(repaired.villainProgress.kanto, 3)
  assert.equal(repaired.villainProgress.hoenn, VILLAIN_TOTAL_STAGES)
  assert.ok(!('notARegion' in repaired.villainProgress))
  assert.ok(!('negative' in repaired.villainProgress))
})
