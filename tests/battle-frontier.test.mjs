import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  FRONTIER_FACILITIES,
  buildRentalParty,
  frontierBossBattle,
  frontierFacility,
  frontierTokenReward,
} = await import('../src/game/battle-frontier.js')
const { getTypeMultiplier, invertEffectiveness, calculateDamage, matchupScore } = await import(
  '../src/game/combat.js'
)
const { healBlocked } = await import('../src/game/combat/volatile.js')
const { reportFieldEffects } = await import('../src/game/combat/end-of-turn.js')
const {
  LADDER_MODIFIERS,
  LADDER_ROTATION,
  activeLadderRuleSet,
  battleModifierSet,
  hasBattleModifier,
  ladderBattleFields,
  ladderModifier,
} = await import('../src/game/ladder-modifiers.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')
const { createPokemon, calculatePokemonStats, getPerfectIVs } = await import(
  '../src/game/pokemon.js'
)
const { pokemonSpecies, mapData } = await import('../src/data/gameData.js')
const { moveData } = await import('../src/data/gameData.js')

test('the inverse chart flips resistances and turns immunities into weaknesses', () => {
  assert.equal(invertEffectiveness(2), 0.5)
  assert.equal(invertEffectiveness(0.5), 2)
  assert.equal(invertEffectiveness(4), 0.25)
  assert.equal(invertEffectiveness(0.25), 4)
  assert.equal(invertEffectiveness(1), 1)
  assert.equal(invertEffectiveness(0), 2)
  // Water into Fire is normally 2x; inverse makes it a resistance.
  assert.equal(getTypeMultiplier('Water', ['Fire']), 2)
  assert.equal(getTypeMultiplier('Water', ['Fire'], true), 0.5)
  // Normal into Ghost is normally immune (0); inverse makes it a 2x hit.
  assert.equal(getTypeMultiplier('Normal', ['Ghost'], true), 2)
})

test('inverse battles flip the damage a move deals', () => {
  const attacker = { level: 50, types: ['Water'] },
    defenderTypes = ['Fire'],
    move = moveData.waterGun ?? Object.values(moveData).find((entry) => entry.type === 'Water' && entry.power > 0)
  const normal = calculateDamage(
      attacker.level,
      100,
      100,
      move,
      attacker.types,
      defenderTypes,
      0,
      0,
      0,
      true,
      0,
      0,
      true,
      2,
      false,
      false
    ),
    inverse = calculateDamage(
      attacker.level,
      100,
      100,
      move,
      attacker.types,
      defenderTypes,
      0,
      0,
      0,
      true,
      0,
      0,
      true,
      2,
      false,
      true
    )
  assert.ok(normal.damage > inverse.damage, 'the normally-super-effective hit is resisted when inverted')
})

test('the AI matchup score also respects the inverse chart', () => {
  const water = { moves: ['waterGun'], types: ['Water'] },
    fire = { moves: ['ember'], types: ['Fire'] }
  assert.ok(matchupScore(water, fire) > 0, 'Water beats Fire normally')
  assert.ok(matchupScore(water, fire, true) < 0, 'but loses the inverted matchup')
})

test('the facilities cover the three rule variants', () => {
  assert.equal(FRONTIER_FACILITIES.length, 3)
  assert.deepEqual(
    FRONTIER_FACILITIES.map((facility) => facility.rule).sort(),
    ['inverse', 'noItems', 'rental']
  )
  assert.equal(frontierFacility('arena').rule, 'inverse')
  assert.equal(frontierFacility('nope'), null)
  assert.equal(frontierTokenReward(9), 0)
  assert.equal(frontierTokenReward(10), 1)
  assert.equal(frontierTokenReward(25), 2)
})

test('the factory rents a deterministic six-Pokemon team at the floor level', () => {
  const first = buildRentalParty(3),
    second = buildRentalParty(3)
  assert.equal(first.length, 6)
  assert.deepEqual(
    first.map((member) => member.speciesKey),
    second.map((member) => member.speciesKey),
    'the same floor rents the same team'
  )
  assert.equal(new Set(first.map((member) => member.speciesKey)).size, 6, 'no duplicate species')
  for (const member of first) {
    assert.ok(pokemonSpecies[member.speciesKey], `${member.speciesKey} is real`)
    assert.equal(member.level, 55 + 3 * 3)
    assert.ok(member.moves.length >= 1, `${member.speciesKey} knows a move`)
    assert.equal(member.currentHp, member.maxHp)
    assert.ok(member.ability)
    assert.equal(member.heldItem, null)
  }
  // A deeper floor rents a higher-level team.
  assert.ok(buildRentalParty(10)[0].level > first[0].level)
})

test('a frontier boss battle carries its rule and a six-member team', () => {
  for (const facility of FRONTIER_FACILITIES) {
    const boss = frontierBossBattle(facility.id, 2)
    assert.equal(boss.bossType, 'frontier')
    assert.equal(boss.rule, facility.rule)
    assert.equal(boss.facilityId, facility.id)
    assert.equal(boss.trainerTeam.length, 6)
    assert.ok(boss.trainerTeam.every((member) => member.speciesKey))
  }
  // The Arena and Palace use different teams from the Tower for the same floor.
  const tower = frontierBossBattle('arena', 1),
    factory = frontierBossBattle('factory', 1)
  assert.notDeepEqual(
    tower.trainerTeam.map((member) => member.speciesKey),
    factory.trainerTeam.map((member) => member.speciesKey)
  )
})

test('a rental floor swaps the party, starts the battle and restores the team', () => {
  const starter = createPokemon('torchic', 60, 'own'),
    base = {
      ...initialGameState,
      phase: 'idle',
      party: [starter],
      playerPokemon: starter,
      money: 0,
    },
    swapped = gameReducer(base, {
      type: 'START_FRONTIER',
      payload: { facilityId: 'factory', floor: 2 },
    })
  assert.equal(swapped.frontierFloor.factory, 2)
  assert.equal(swapped.party.length, 6, 'the rental team takes the field')
  assert.notEqual(swapped.party[0].id, 'own')
  assert.deepEqual(swapped.frontierRental.party, [starter], 'the real party is kept aside')

  const healing = gameReducer(swapped, {
    type: 'START_HEALING',
    payload: { pendingBossBattle: frontierBossBattle('factory', 2) },
  })
  assert.equal(healing.phase, 'healing')
  const battling = gameReducer(healing, { type: 'COMPLETE_HEALING' })
  assert.equal(battling.phase, 'battling')
  assert.equal(battling.bossBattle.bossType, 'frontier')
  assert.equal(battling.bossBattle.rule, 'rental')
  assert.equal(battling.bossBattle.facilityId, 'factory')

  const won = gameReducer(battling, {
    type: 'BOSS_BATTLE_END',
    payload: { won: true, moneyDelta: 500 },
  })
  assert.equal(won.phase, 'idle')
  assert.equal(won.frontierRental, null, 'the rental marker is cleared')
  assert.deepEqual(
    won.party.map((member) => member.id),
    ['own'],
    'the real party is restored'
  )
  assert.equal(won.frontierFloor.factory, 3, 'a win advances the floor')
  assert.equal(won.frontierBest.factory, 2)
  assert.equal(won.money, 500)
})

test('a loss keeps the frontier floor but still restores a rental team', () => {
  const starter = createPokemon('treecko', 60, 'own'),
    base = { ...initialGameState, phase: 'idle', party: [starter], playerPokemon: starter },
    swapped = gameReducer(base, {
      type: 'START_FRONTIER',
      payload: { facilityId: 'factory', floor: 4 },
    }),
    healing = gameReducer(swapped, {
      type: 'START_HEALING',
      payload: { pendingBossBattle: frontierBossBattle('factory', 4) },
    }),
    battling = gameReducer(healing, { type: 'COMPLETE_HEALING' }),
    lost = gameReducer(battling, {
      type: 'BOSS_BATTLE_END',
      payload: { won: false, moneyDelta: -100 },
    })
  assert.deepEqual(
    lost.party.map((member) => member.id),
    ['own']
  )
  assert.equal(lost.frontierFloor.factory, 4, 'the floor is retried')
  assert.equal(lost.frontierBest.factory, 3)
})

test('an inverse facility records the rule on the battle and does not touch the party', () => {
  const starter = createPokemon('mudkip', 60, 'own'),
    base = { ...initialGameState, phase: 'idle', party: [starter], playerPokemon: starter },
    swapped = gameReducer(base, {
      type: 'START_FRONTIER',
      payload: { facilityId: 'arena', floor: 1 },
    })
  assert.equal(swapped.frontierRental, null, 'no party swap for a non-rental facility')
  assert.deepEqual(
    swapped.party.map((member) => member.id),
    ['own']
  )
  const healing = gameReducer(swapped, {
      type: 'START_HEALING',
      payload: { pendingBossBattle: frontierBossBattle('arena', 1) },
    }),
    battling = gameReducer(healing, { type: 'COMPLETE_HEALING' })
  assert.equal(battling.bossBattle.rule, 'inverse')
})

test('repairSave restores a party left in a rental and sanitises the records', () => {
  const real = createPokemon('piplup', 50, 'real'),
    rental = createPokemon('bidoof', 60, 'rental'),
    base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'hoenn', speciesKey: 'treecko' },
    }),
    repaired = repairSave(
      serializeSave({
        ...base,
        party: [rental],
        playerPokemon: rental,
        frontierRental: { facilityId: 'factory', party: [real] },
        frontierFloor: { factory: 5, nope: 3, arena: -1, palace: 2.9 },
        frontierBest: { factory: 7.9, nope: 4 },
      })
    )
  assert.deepEqual(
    repaired.party.map((member) => member.id),
    ['real'],
    'the real party is restored on load'
  )
  assert.equal(repaired.frontierRental, null)
  assert.equal(repaired.frontierFloor.factory, 5)
  assert.equal(repaired.frontierFloor.palace, 2, 'fractional floors floor down')
  assert.ok(!('nope' in repaired.frontierFloor), 'unknown facility dropped')
  assert.ok(!('arena' in repaired.frontierFloor), 'non-positive floor dropped')
  assert.equal(repaired.frontierBest.factory, 7)
  assert.ok(!('nope' in repaired.frontierBest))
})

test('the Battle Frontier is a real Hoenn post-game location', () => {
  const location = mapData['hoenn-battle-frontier']
  assert.ok(location, 'the location exists')
  assert.equal(location.region, 'hoenn')
  assert.equal(location.unlock.championDefeated, 'hoenn')
  assert.ok(location.connections.includes('hoenn-route-111'))
  assert.ok(
    mapData['hoenn-route-111'].connections.includes('hoenn-battle-frontier'),
    'the road is mutual'
  )
  // A couple of sanity checks on the helpers used by the panel.
  const species = pokemonSpecies.bulbasaur,
    stats = calculatePokemonStats(species, 50, getPerfectIVs(), 'hardy')
  assert.ok(stats.hp > 0)
})

test('the ladder modifier registry covers the four rule variants', () => {
  assert.deepEqual(
    LADDER_MODIFIERS.map((modifier) => modifier.id).sort(),
    ['inverse', 'noHealing', 'noItems', 'weather']
  )
  assert.equal(ladderModifier('weather').weather, 'rain')
  assert.equal(ladderModifier('nope'), null)
  for (const entry of LADDER_ROTATION)
    for (const id of entry.modifierIds)
      assert.ok(ladderModifier(id), `${entry.key} references a real modifier: ${id}`)
  // A standard week is kept in the rotation so the ladder isn't always harsh.
  assert.ok(LADDER_ROTATION.some((entry) => entry.modifierIds.length === 0))
})

test('the weekly ladder pick is deterministic and date-based', () => {
  const first = activeLadderRuleSet('2026-01-01'),
    again = activeLadderRuleSet('2026-01-01'),
    nextWeek = activeLadderRuleSet('2026-01-08')
  assert.deepEqual(first, again, 'the same date gives the same ladder')
  assert.equal(first.date, '2026-01-01')
  assert.ok(first.modifiers.every((modifier) => ladderModifier(modifier.id)))
  assert.ok(
    first.modifierIds.every((id) => first.modifiers.some((modifier) => modifier.id === id)),
    'the id list and the modifier objects agree'
  )
  // Seven days later is the next rotation slot, and the cycle wraps cleanly.
  assert.equal(nextWeek.week, first.week + 1)
  assert.notEqual(nextWeek.key, first.key)
})

test('the battle payload carries the merged ladder and facility modifiers', () => {
  const ladder = {
      key: 'barehanded',
      name: 'Bare-Hands Ladder',
      icon: '',
      hint: '',
      modifierIds: ['noItems'],
      modifiers: [],
      weather: null,
      week: 0,
      date: '2026-01-01',
    },
    fields = ladderBattleFields(ladder),
    boss = frontierBossBattle('arena', 1, ladder)
  assert.equal(fields.modifiers[0], 'noItems')
  assert.equal(boss.rule, 'inverse')
  assert.equal(boss.modifiers[0], 'noItems')
  assert.equal(boss.ladderKey, 'barehanded')
  assert.deepEqual([...battleModifierSet(boss)].sort(), ['inverse', 'noItems'])
  assert.ok(hasBattleModifier(boss, 'inverse'), 'the facility rule still applies')
  assert.ok(hasBattleModifier(boss, 'noItems'), 'the weekly modifier applies on top')
  assert.ok(!hasBattleModifier(boss, 'noHealing'))
})

test('the no-healing modifier suppresses every heal source', () => {
  assert.equal(healBlocked({ noHealing: true }), true)
  assert.equal(healBlocked({ healBlockTurns: 2 }), true)
  assert.equal(healBlocked({}), false)
})

test('a weather-locked ladder battle keeps its weather', () => {
  const lockedEvents = [],
    freeEvents = [],
    weather = { type: 'rain', turns: 99 },
    emptyHazards = { player: {}, enemy: {} }
  reportFieldEffects(
    {},
    {},
    lockedEvents,
    { ...weather },
    null,
    emptyHazards,
    weather,
    null,
    emptyHazards,
    true
  )
  reportFieldEffects(
    {},
    {},
    freeEvents,
    { ...weather },
    null,
    emptyHazards,
    weather,
    null,
    emptyHazards,
    false
  )
  assert.ok(
    !lockedEvents.some((event) => event.type === 'weather'),
    'a locked weather never ticks down or changes'
  )
  assert.ok(
    freeEvents.some((event) => event.type === 'weather'),
    'an unlocked weather ticks down as usual'
  )
})
