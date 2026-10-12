import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { breedingCompatibility, canBreed, eggSpeciesKey, genderForPokemon, inheritBreedingTraits, inheritEggMoves, inheritIVs, inheritMoves, inheritNature, masudaShinyOddsFor, rollGender } = await import(
  '../src/game/breeding.js'
)
const { masudaShinyOdds } = await import('../src/data/config.js')
const { createEgg, createPokemon } = await import('../src/game/pokemon.js')
const { eggMoves, moveData, pokemonSpecies } = await import('../src/data/gameData.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

/**
 * Minimal Pokemon shape — breeding only reads `speciesKey` and `id`.
 * @param {string} speciesKey
 * @param {string} [id]
 */
const parent = (speciesKey, id = '1') => ({ speciesKey, id })

test('the Masuda method needs two parents from different regions', () => {
  assert.equal(masudaShinyOddsFor([parent('ditto'), parent('bulbasaur')]), null, 'no regions = no Masuda')
  assert.equal(
    masudaShinyOddsFor([
      { speciesKey: 'ditto', originRegion: 'kanto' },
      { speciesKey: 'bulbasaur', originRegion: 'kanto' },
    ]),
    null,
    'same region = no Masuda'
  )
  const different = masudaShinyOddsFor([
    { speciesKey: 'ditto', originRegion: 'kanto' },
    { speciesKey: 'bulbasaur', originRegion: 'johto' },
  ])
  assert.equal(different, masudaShinyOdds)
  assert.ok(masudaShinyOdds < 4096, 'Masuda is better than full odds')
})

test('a daycare egg from mixed-region parents uses the Masuda odds', () => {
  const original = Math.random
  // 0.001 is a miss at 1/4096 (base) but a hit at 1/683 (Masuda).
  Math.random = () => 0.001
  try {
    const ditto = { ...createPokemon('ditto', 20, 'd'), originRegion: 'kanto' },
      sameRegion = { ...createPokemon('bulbasaur', 20, 'b'), originRegion: 'kanto' },
      foreign = { ...createPokemon('bulbasaur', 20, 'b2'), originRegion: 'johto' },
      base = {
        ...initialGameState,
        party: [createPokemon('charmander', 10, 'c')],
        daycare: { parents: [ditto, sameRegion], progress: 50 },
      },
      plain = gameReducer(base, { type: 'HATCH_DAYCARE_EGG' }),
      masuda = gameReducer(
        { ...base, daycare: { parents: [ditto, foreign], progress: 50 } },
        { type: 'HATCH_DAYCARE_EGG' }
      )
    assert.equal(plain.party[1].isShiny, false, 'the base odds miss at 0.001')
    assert.equal(masuda.party[1].isShiny, true, 'the Masuda odds hit at 0.001')
    assert.equal(masuda.party[1].originRegion, initialGameState.startRegion)
  } finally {
    Math.random = original
  }
})

test('Cute Charm biases a wild roll toward the requested gender', () => {
  const original = Math.random
  Math.random = () => 0.5
  try {
    assert.equal(rollGender('pidgey'), 'male', 'a 50/50 roll lands male at 0.5')
    assert.equal(rollGender('pidgey', 'female'), 'female', 'the bias pushes it female')
    assert.equal(rollGender('pidgey', 'male'), 'male')
  } finally {
    Math.random = original
  }
})

const IV_STAT_KEYS = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed']

/**
 * Find an id that makes `speciesKey` read as the wanted gender (gender is
 * derived deterministically from the id).
 * @param {string} speciesKey
 * @param {'male' | 'female'} gender
 */
function findId(speciesKey, gender) {
  for (let id = 1; id <= 5000; id++)
    if (genderForPokemon({ speciesKey, id: String(id) }) === gender) return String(id)
  throw new Error(`no ${gender} id found for ${speciesKey}`)
}

test('two Ditto cannot breed', () => {
  assert.equal(canBreed([parent('ditto'), parent('ditto', '2')]), false)
})

test('Ditto breeds with an ordinary Pokemon', () => {
  assert.equal(canBreed([parent('ditto'), parent('bulbasaur')]), true)
})

test('undiscovered species cannot breed, even with Ditto', () => {
  const result = breedingCompatibility([parent('mewtwo'), parent('ditto')])
  assert.equal(result.ok, false)
  assert.match(result.reason, /Undiscovered/)
})

test('same-gender parents are incompatible', () => {
  const maleId = findId('bulbasaur', 'male')
  const result = breedingCompatibility([parent('bulbasaur', maleId), parent('bulbasaur', maleId)])
  assert.equal(result.ok, false)
  assert.match(result.reason, /Both parents/)
})

test('opposite-gender parents sharing an egg group are compatible', () => {
  const male = parent('bulbasaur', findId('bulbasaur', 'male'))
  const female = parent('bulbasaur', findId('bulbasaur', 'female'))
  assert.equal(canBreed([male, female]), true)
})

test('eggSpeciesKey returns the mother\u2019s base form', () => {
  const mother = parent('ivysaur', findId('ivysaur', 'female'))
  const father = parent('bulbasaur', findId('bulbasaur', 'male'))
  assert.equal(eggSpeciesKey([mother, father]), 'bulbasaur')
})

// A baby line is obtained by breeding its evolved parent, so the babies do not
// need wild encounter tables of their own. `eggSpeciesKey` walks the
// pre-evolution chain back to the baby.
test('breeding an evolved parent hatches its baby', () => {
  const babyLines = {
    clefairy: 'cleffa',
    jigglypuff: 'igglybuff',
    togetic: 'togepi',
    togekiss: 'togepi',
    jynx: 'smoochum',
    magmar: 'magby',
    marill: 'azurill',
    wobbuffet: 'wynaut',
    roselia: 'budew',
    chimecho: 'chingling',
    sudowoodo: 'bonsly',
    chansey: 'happiny',
    snorlax: 'munchlax',
    lucario: 'riolu',
    mantine: 'mantyke',
    toxtricity: 'toxel',
    pikachu: 'pichu',
    electabuzz: 'elekid',
    hitmonlee: 'tyrogue',
  }
  for (const [evolvedParent, baby] of Object.entries(babyLines))
    assert.equal(
      eggSpeciesKey([parent('ditto'), parent(evolvedParent)]),
      baby,
      `breeding ${evolvedParent} should hatch ${baby}`
    )
})

test('the Daycare hatches a baby from an evolved parent', () => {
  const mother = createPokemon('clefairy', 30, 'daycare-baby-1'),
    ditto = createPokemon('ditto', 30, 'daycare-baby-2'),
    state = {
      ...initialGameState,
      party: [],
      box: [mother, ditto],
      nextPokemonId: 500,
      daycare: { parents: [mother, ditto], progress: 999 },
    },
    hatched = gameReducer(state, { type: 'HATCH_DAYCARE_EGG' }),
    egg = [...hatched.party, ...hatched.box].find((member) => member.isEgg)
  assert.ok(egg, 'an egg is produced')
  assert.equal(egg.speciesKey, 'cleffa')
})

test('gender-form species have a fixed gender', () => {
  assert.equal(genderForPokemon(parent('basculegion')), 'male')
  assert.equal(genderForPokemon(parent('basculegion-f')), 'female')
  assert.equal(genderForPokemon(parent('indeedee-f')), 'female')
})

test('genderless species report genderless', () => {
  assert.equal(genderForPokemon(parent('mewtwo')), 'genderless')
})

test('a stored gender wins over the id-derived one', () => {
  assert.equal(
    genderForPokemon({
      speciesKey: 'bulbasaur',
      id: findId('bulbasaur', 'male'),
      gender: 'female',
    }),
    'female'
  )
})

test('a fixed gender-form species ignores a stored gender', () => {
  assert.equal(genderForPokemon({ speciesKey: 'basculegion-f', gender: 'male' }), 'female')
})

test('inheritIVs passes down exactly 3 of the parents\' best stats', () => {
  // Out-of-range sentinel values (40/60) can't come from generateIVs (0-31),
  // so the count of injected values tells us how many stats were inherited.
  const flat = (/** @type {number} */ value) =>
      Object.fromEntries(IV_STAT_KEYS.map((stat) => [stat, value])),
    inherited = inheritIVs([
      { speciesKey: 'bulbasaur', id: '1', ivs: flat(40) },
      { speciesKey: 'bulbasaur', id: '2', ivs: flat(60) },
    ])
  assert.equal(
    IV_STAT_KEYS.filter((stat) => inherited[stat] === 60).length,
    3,
    'the three chosen stats take the best parent value'
  )
  for (const stat of IV_STAT_KEYS) assert.ok(inherited[stat] >= 0 && inherited[stat] <= 31 || inherited[stat] === 60)
})

test('inheritNature can take a parent\u2019s nature', () => {
  const originalRandom = Math.random,
    parents = [
      { speciesKey: 'bulbasaur', id: '1', nature: 'adamant' },
      { speciesKey: 'bulbasaur', id: '2', nature: 'jolly' },
    ]
  try {
    // First roll picks inheritance (<0.5), second picks the parent.
    const queue = [0.1, 0.1]
    Math.random = () => queue.shift() ?? 0
    assert.equal(inheritNature(parents), 'adamant')
    const queue2 = [0.1, 0.9]
    Math.random = () => queue2.shift() ?? 0
    assert.equal(inheritNature(parents), 'jolly')
  } finally {
    Math.random = originalRandom
  }
})

test('inheritNature rolls a fresh nature without a parent nature', () => {
  const nature = inheritNature([{ speciesKey: 'bulbasaur', id: '1' }, { speciesKey: 'bulbasaur', id: '2' }])
  assert.equal(typeof nature, 'string')
  assert.ok(nature.length > 0)
})

test('inheritMoves pads the level-1 moveset with a parent\u2019s moves', () => {
  const egg = inheritMoves(
    [
      { speciesKey: 'bulbasaur', id: '1', moves: ['tackle', 'vineWhip', 'razorLeaf'] },
      { speciesKey: 'bulbasaur', id: '2', moves: ['growl', 'razorLeaf'] },
    ],
    'bulbasaur'
  )
  assert.ok(egg.includes('tackle'))
  assert.ok(egg.includes('growl'))
  assert.ok(egg.includes('vineWhip'))
  assert.ok(egg.includes('razorLeaf'))
  assert.ok(egg.length <= 4)
})

test('inheritMoves ignores moves outside the family learnset', () => {
  const egg = inheritMoves(
    [{ speciesKey: 'bulbasaur', id: '1', moves: ['flamethrower'] }],
    'bulbasaur'
  )
  assert.ok(!egg.includes('flamethrower'))
})

test('inheritEggMoves passes down a breed-only move', () => {
  const egg = inheritEggMoves(
    [
      { speciesKey: 'bulbasaur', id: '1', moves: ['charm', 'tackle'] },
      { speciesKey: 'bulbasaur', id: '2', moves: ['curse'] },
    ],
    'bulbasaur'
  )
  assert.ok(egg.includes('charm'))
  assert.ok(egg.includes('curse'))
  assert.ok(!egg.includes('tackle'), 'ordinary moves are not egg moves')
})

test('inheritEggMoves ignores a non-egg move and a move the species cannot breed', () => {
  assert.deepEqual(
    inheritEggMoves([{ speciesKey: 'bulbasaur', id: '1', moves: ['flamethrower'] }], 'bulbasaur'),
    []
  )
  // Pikachu has no egg moves of its own (Pichu does).
  assert.deepEqual(
    inheritEggMoves([{ speciesKey: 'pikachu', id: '1', moves: ['charm'] }], 'pikachu'),
    []
  )
})

test('inheritMoves folds an egg move into the starting moveset', () => {
  const egg = inheritMoves([{ speciesKey: 'bulbasaur', id: '1', moves: ['charm'] }], 'bulbasaur')
  assert.ok(egg.includes('charm'))
  assert.ok(egg.length <= 4)
})

test('inheritBreedingTraits records the inherited egg moves', () => {
  const traits = inheritBreedingTraits(
    [{ speciesKey: 'bulbasaur', id: '1', moves: ['charm', 'tackle'] }],
    'bulbasaur'
  )
  assert.deepEqual(traits.eggMoves, ['charm'])
})

test('egg-move data only names real species and moves', () => {
  const keys = Object.keys(eggMoves)
  assert.ok(keys.length > 300, 'a broad egg-move table')
  for (const [speciesKey, moves] of Object.entries(eggMoves)) {
    assert.ok(pokemonSpecies[speciesKey], `${speciesKey} is a real species`)
    for (const moveId of moves) assert.ok(moveData[moveId], `${moveId} is a real move`)
  }
})

test('an egg records its inherited egg moves', () => {
  const parents = [
      { speciesKey: 'bulbasaur', id: '1', moves: ['charm'], ivs: createPokemon('bulbasaur', 5, 'p1').ivs, nature: 'jolly' },
    ],
    traits = inheritBreedingTraits(parents, 'bulbasaur'),
    egg = createEgg('bulbasaur', 'e1', false, 30, traits)
  assert.ok(egg.eggMoves.includes('charm'))
  assert.ok(egg.moves.includes('charm'))
})

test('inheritBreedingTraits bundles IVs, nature and moves', () => {
  const traits = inheritBreedingTraits(
    [
      { speciesKey: 'bulbasaur', id: '1', ivs: { hp: 31, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } },
      { speciesKey: 'bulbasaur', id: '2', ivs: { hp: 1, attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } },
    ],
    'bulbasaur'
  )
  assert.ok(traits.ivs)
  assert.ok(Array.isArray(traits.moves) && traits.moves.length >= 1)
  assert.equal(typeof traits.nature, 'string')
})
