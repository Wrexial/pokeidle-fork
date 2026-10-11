import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  PRESTIGE_POINT_REWARD,
  perkCost,
  perkInvested,
  perkRank,
  prestigeMultipliers,
  totalPrestigeInvested,
} = await import('../src/game/prestige.js')
const { calculateCatchChance } = await import('../src/game/catching.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')
const { elite4Data } = await import('../src/data/gameData.js')
const { createPokemon } = await import('../src/game/pokemon.js')

/** A Kanto run that has beaten the Champion and its Elite Four. */
function championRun() {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    eliteFour = elite4Data
      .filter((member) => (member.region ?? 'kanto') === 'kanto')
      .map((member) => member.id)
  return {
    ...base,
    defeatedChampions: ['kanto'],
    defeatedEliteFour: eliteFour,
  }
}

test('perkCost scales with rank and caps at the perk max', () => {
  assert.equal(perkCost('experience', 0), 1)
  assert.equal(perkCost('experience', 1), 2)
  assert.equal(perkCost('experience', 5), null, 'maxed')
  assert.equal(perkCost('capture', 0), 2)
  assert.equal(perkCost('nonsense', 0), null)
  assert.equal(perkRank({ prestigePerks: { fortune: 3 } }, 'fortune'), 3)
  assert.equal(perkRank({}, 'fortune'), 0)
  assert.equal(perkCost('radiant', 0), 2)
  assert.equal(perkCost('scavenger', 0), 1)
})

test('perkInvested and totalPrestigeInvested sum the purchase history', () => {
  assert.equal(perkInvested('experience', 0), 0)
  // 1 + 2 + 3 = 6.
  assert.equal(perkInvested('experience', 3), 6)
  // Capture starts at 2: 2 + 3 = 5.
  assert.equal(perkInvested('capture', 2), 5)
  assert.equal(perkInvested('nonsense', 2), 0)
  assert.equal(
    totalPrestigeInvested({ prestigePerks: { experience: 3, capture: 2 } }),
    11
  )
})

test('prestigeMultipliers scale with the owned ranks', () => {
  assert.deepEqual(prestigeMultipliers({ prestigePerks: {} }), {
    experience: 1,
    fortune: 1,
    capture: 1,
    shiny: 1,
    drops: 1,
    hatch: 1,
  })
  const multipliers = prestigeMultipliers({
    prestigePerks: { experience: 5, fortune: 2, capture: 4, radiant: 3, scavenger: 5, incubation: 4 },
  })
  assert.ok(Math.abs(multipliers.experience - 1.4) < 1e-9)
  assert.ok(Math.abs(multipliers.fortune - 1.2) < 1e-9)
  assert.ok(Math.abs(multipliers.capture - 1.2) < 1e-9)
  assert.ok(Math.abs(multipliers.shiny - 1.3) < 1e-9)
  assert.ok(Math.abs(multipliers.drops - 1.5) < 1e-9)
  assert.ok(Math.abs(multipliers.hatch - 1.48) < 1e-9)
})

test('a region prestige awards Prestige Points', () => {
  const after = gameReducer(championRun(), {
    type: 'PRESTIGE_REGION',
    payload: { regionId: 'kanto' },
  })
  assert.equal(after.prestigePoints, PRESTIGE_POINT_REWARD)
  assert.equal(after.regionPrestige.kanto, 1)
})

test('buying a perk spends points and raises its rank', () => {
  const base = { ...initialGameState, phase: 'idle', prestigePoints: 3, prestigePerks: {} },
    bought = gameReducer(base, {
      type: 'BUY_PRESTIGE_PERK',
      payload: { perkId: 'experience' },
    })
  assert.equal(bought.prestigePoints, 2)
  assert.equal(bought.prestigePerks.experience, 1)

  // Too few points is a no-op.
  assert.equal(
    gameReducer(
      { ...base, prestigePoints: 0 },
      { type: 'BUY_PRESTIGE_PERK', payload: { perkId: 'capture' } }
    ).prestigePerks.capture,
    undefined
  )
  // An unknown perk is a no-op.
  assert.equal(
    gameReducer(base, { type: 'BUY_PRESTIGE_PERK', payload: { perkId: 'nope' } }),
    base
  )
  // A maxed perk cannot be bought again.
  const maxed = { ...base, prestigePoints: 99, prestigePerks: { experience: 5 } }
  assert.equal(
    gameReducer(maxed, { type: 'BUY_PRESTIGE_PERK', payload: { perkId: 'experience' } }),
    maxed
  )
})

test('resetting prestige perks refunds exactly what was spent', () => {
  const base = {
      ...initialGameState,
      phase: 'idle',
      prestigePoints: 1,
      prestigePerks: { experience: 3, scavenger: 2 },
    },
    invested = totalPrestigeInvested(base),
    reset = gameReducer(base, { type: 'RESET_PRESTIGE_PERKS' })
  assert.equal(invested, 9)
  assert.deepEqual(reset.prestigePerks, {})
  assert.equal(reset.prestigePoints, 10)
  // Nothing invested: the action is a no-op and returns the same state.
  const noop = { ...base, prestigePerks: {} }
  assert.equal(gameReducer(noop, { type: 'RESET_PRESTIGE_PERKS' }), noop)
})

test('the Incubation perk shortens the daycare egg', () => {
  const base = {
      ...initialGameState,
      party: [createPokemon('charmander', 10, 1)],
      daycare: {
        parents: [createPokemon('ditto', 10, 2), createPokemon('bulbasaur', 10, 3)],
        progress: 50,
      },
    },
    plain = gameReducer(base, { type: 'HATCH_DAYCARE_EGG' }),
    boosted = gameReducer(
      { ...base, prestigePerks: { incubation: 5 } },
      { type: 'HATCH_DAYCARE_EGG' }
    )
  assert.ok(
    boosted.party[1].eggStepsRemaining < plain.party[1].eggStepsRemaining,
    'the perk hatches the egg in fewer battles'
  )
})

test('the Capture perk raises the catch chance', () => {
  const base = calculateCatchChance('mewtwo', 'pokeball', {}),
    boosted = calculateCatchChance('mewtwo', 'pokeball', { catchMultiplier: 1.25 })
  assert.ok(boosted > base, 'the multiplier lifts the chance')
})

test('repairSave sanitises prestige points and perks', () => {
  const repaired = repairSave(
    serializeSave({
      ...championRun(),
      prestigePoints: 4.9,
      prestigePerks: { experience: 2, fortune: 99, nope: 1, bad: -1 },
    })
  )
  assert.equal(repaired.prestigePoints, 4)
  assert.equal(repaired.prestigePerks.experience, 2)
  assert.equal(repaired.prestigePerks.fortune, 5, 'clamped to the perk max')
  assert.ok(!('nope' in repaired.prestigePerks))
  assert.ok(!('bad' in repaired.prestigePerks))
})
