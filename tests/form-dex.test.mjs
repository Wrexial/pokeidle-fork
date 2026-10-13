import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { formDexModel } = await import('../src/data/gameData.js')
const {
  formDexCompletion,
  formDexTargetKey,
  formDexTargetLabel,
  isFormDexTargetCollected,
  newlyCompletedFormDex,
  recordFormDexGender,
} = await import('../src/data/form-dex.js')
const { formDexFamilyBaseMoney, formDexRegionalReward } = await import('../src/data/config.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

const emptyRewarded = () => ({
  families: new Set(),
  regionalSets: new Set(),
  generations: new Set(),
})

test('the form-dex model covers every national-dex base', () => {
  const baseCount = formDexModel.families.length
  assert.ok(baseCount > 1000, `expected the national dex, got ${baseCount}`)
  for (const family of formDexModel.families) {
    assert.ok(family.dexId > 0 && family.dexId <= 1025, `${family.base} is a national-dex base`)
    assert.ok(family.targets.length >= 1, `${family.base} has at least one target`)
    // The first target is always the base form itself.
    assert.equal(family.targets[0].speciesKey, family.base)
    assert.ok(
      family.targets.some((target) => target.speciesKey === family.base),
      `${family.base} includes its own form`
    )
  }
})

test('a gender-difference species asks for both visual genders', () => {
  const pikachu = formDexModel.families.find((family) => family.base === 'pikachu')
  assert.ok(pikachu, 'Pikachu is in the model')
  const baseTargets = pikachu.targets.filter((target) => target.speciesKey === 'pikachu')
  assert.deepEqual(
    baseTargets.map((target) => target.gender),
    ['male', 'female']
  )
  const caught = new Set(['pikachu'])
  assert.equal(formDexCompletion(baseTargets, caught, { pikachu: ['male'] }).complete, false)
  assert.equal(
    formDexCompletion(baseTargets, caught, { pikachu: ['male', 'female'] }).complete,
    true
  )
})

test('regional sets group the regional variant forms', () => {
  const alolan = formDexModel.regionalSets.find((set) => set.id === 'alolan')
  assert.ok(alolan, 'the Alolan set exists')
  assert.ok(alolan.targets.some((target) => target.speciesKey === 'a-rattata'))
  // Regional forms are not gender-gated (they reuse the base species' art).
  assert.ok(alolan.targets.every((target) => target.gender === null))
})

test('form-dex target keys and labels are stable', () => {
  assert.equal(formDexTargetKey({ speciesKey: 'pikachu', gender: null }), 'pikachu')
  assert.equal(formDexTargetKey({ speciesKey: 'pikachu', gender: 'female' }), 'pikachu:female')
  assert.equal(formDexTargetLabel({ speciesKey: 'a-rattata', gender: null }, { 'a-rattata': 'Alolan' }), 'Alolan')
  assert.equal(
    formDexTargetLabel({ speciesKey: 'pikachu', gender: 'female' }, {}),
    'Base \u2640'
  )
})

test('recordFormDexGender only adds a gender once', () => {
  const first = recordFormDexGender({}, 'pikachu', 'female')
  assert.deepEqual(first, { pikachu: ['female'] })
  const again = recordFormDexGender(first, 'pikachu', 'female')
  assert.equal(again, first, 'no new reference when the gender is already known')
  const both = recordFormDexGender(first, 'pikachu', 'male')
  assert.deepEqual(both.pikachu, ['female', 'male'])
  assert.equal(recordFormDexGender(first, 'pikachu', 'genderless'), first)
})

test('a completed base-only family is detected as newly complete', () => {
  const family = formDexModel.families.find((candidate) => candidate.targets.length === 1)
  assert.ok(family, 'there is a base-only family in the national dex')
  const caught = new Set([family.base])
  const pending = newlyCompletedFormDex(formDexModel, caught, {}, emptyRewarded())
  assert.ok(pending.families.includes(family.base))
  // Paying the family clears it from the pending list.
  const paid = newlyCompletedFormDex(formDexModel, caught, {}, {
    families: new Set([family.base]),
    regionalSets: new Set(),
    generations: new Set(),
  })
  assert.ok(!paid.families.includes(family.base))
})

test('CLAIM_FORM_DEX_REWARDS pays a family once', () => {
  const family = formDexModel.families.find((candidate) => candidate.targets.length === 1),
    state = { ...initialGameState, pokedexCaught: [family.base] },
    pending = newlyCompletedFormDex(formDexModel, new Set(state.pokedexCaught), {}, emptyRewarded())
  assert.ok(pending.families.includes(family.base))

  const claimed = gameReducer(state, { type: 'CLAIM_FORM_DEX_REWARDS', payload: pending })
  assert.equal(claimed.money, state.money + formDexFamilyBaseMoney)
  assert.ok(claimed.rewardedFamilies.includes(family.base))
  assert.ok(claimed.notifications.some((note) => note.dedupeKey.startsWith('formdex:families')))

  const again = gameReducer(claimed, { type: 'CLAIM_FORM_DEX_REWARDS', payload: pending })
  assert.equal(again, claimed, 'a family reward is only paid once')
})

test('CLAIM_FORM_DEX_REWARDS pays a completed regional set', () => {
  const set = formDexModel.regionalSets.find((candidate) => candidate.id === 'alolan'),
    caught = new Set(set.targets.map((target) => target.speciesKey)),
    state = { ...initialGameState, pokedexCaught: [...caught] },
    pending = newlyCompletedFormDex(formDexModel, caught, {}, emptyRewarded())
  assert.ok(pending.regionalSets.includes('alolan'))

  const claimed = gameReducer(state, { type: 'CLAIM_FORM_DEX_REWARDS', payload: pending })
  assert.equal(claimed.victoryTokens, state.victoryTokens + formDexRegionalReward.victoryTokens)
  assert.equal(
    claimed.inventory.masterball,
    (state.inventory.masterball ?? 0) + 1,
    'the regional bundle adds one Master Ball'
  )
  assert.ok(claimed.rewardedRegionalSets.includes('alolan'))
})

test('CLAIM_FORM_DEX_REWARDS ignores groups that are not complete', () => {
  const family = formDexModel.families.find(
      (candidate) => candidate.base === 'pikachu'
    ),
    state = { ...initialGameState, pokedexCaught: ['pikachu'] }
  const claimed = gameReducer(state, {
    type: 'CLAIM_FORM_DEX_REWARDS',
    payload: { families: [family.base], regionalSets: ['alolan'], generations: [0] },
  })
  assert.equal(claimed, state, 'incomplete groups are never rewarded')
})

test('catching a Pokemon records its visual gender', () => {
  const state = gameReducer(
    { ...initialGameState, nextPokemonId: 12345 },
    { type: 'CATCH_POKEMON', payload: { speciesKey: 'pikachu', level: 5 } }
  )
  assert.ok(Array.isArray(state.formDexGenders.pikachu))
  assert.ok(state.formDexGenders.pikachu.length >= 1)
  for (const gender of state.formDexGenders.pikachu)
    assert.ok(gender === 'male' || gender === 'female')
})

test('isFormDexTargetCollected needs both the catch and the gender', () => {
  const target = { speciesKey: 'pikachu', gender: 'female' }
  assert.equal(isFormDexTargetCollected(target, new Set(['pikachu']), {}), false)
  assert.equal(isFormDexTargetCollected(target, new Set(['pikachu']), { pikachu: ['male'] }), false)
  assert.equal(isFormDexTargetCollected(target, new Set(['pikachu']), { pikachu: ['female'] }), true)
})
