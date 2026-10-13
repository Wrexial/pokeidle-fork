import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  hasClaimableProfessorStory,
  professorStoryCatchBonus,
  professorStoryStatus,
} = await import('../src/game/quests.js')
const { PROFESSOR_CHAPTER_IDS, PROFESSOR_STORY } = await import('../src/data/professor-story.js')
const { QUEST_LEGENDARY_BY_REGION } = await import('../src/data/legendary-quests.js')
const { getItemInfo } = await import('../src/game/progression.js')
const { gymLeaderData, pokemonSpecies, speciesKeysByGeneration } = await import(
  '../src/data/gameData.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { generateIVs } = await import('../src/game/pokemon.js')

const kantoGyms = gymLeaderData
  .filter((gym) => (gym.region ?? 'kanto') === 'kanto')
  .map((gym) => gym.id)
const unovaGyms = gymLeaderData
  .filter((gym) => (gym.region ?? 'kanto') === 'unova')
  .map((gym) => gym.id)

test('every chapter is well-formed and its reward items are real', () => {
  assert.ok(PROFESSOR_STORY.length > 1)
  for (const chapter of PROFESSOR_STORY) {
    assert.ok(PROFESSOR_CHAPTER_IDS.has(chapter.id))
    assert.ok(chapter.professor && chapter.title && chapter.intro)
    assert.ok(chapter.steps.length > 0, `${chapter.id} has steps`)
    for (const step of chapter.steps) {
      assert.ok(step.id && step.label)
      assert.ok(step.need > 0)
    }
    for (const itemId of Object.keys(chapter.reward?.items ?? {}))
      assert.notEqual(getItemInfo(itemId).name, itemId, `${chapter.id} reward item ${itemId} exists`)
  }
  // Only the capstone has no region.
  assert.equal(PROFESSOR_STORY.filter((chapter) => !chapter.region).length, 1)
})

test('the chain starts on Kanto with the rest locked', () => {
  const status = professorStoryStatus(initialGameState)
  assert.equal(status.chapters[0].unlocked, true)
  assert.equal(status.chapters[0].claimable, false)
  assert.equal(status.chapters[1].unlocked, false)
  assert.equal(hasClaimableProfessorStory(initialGameState), false)
  assert.equal(status.current.id, 'kanto')
})

test('finishing the Kanto steps makes the chapter claimable', () => {
  const base = {
      ...initialGameState,
      pokedexCaught: speciesKeysByGeneration[0].slice(0, 20),
      wildBattlesWon: 100,
      defeatedGyms: kantoGyms.slice(0, 4),
    },
    chapter = professorStoryStatus(base).chapters[0]
  assert.ok(chapter.done)
  assert.ok(chapter.claimable)
  assert.ok(hasClaimableProfessorStory(base))
})

test('claiming a chapter pays once and unlocks the next', () => {
  const base = {
      ...initialGameState,
      pokedexCaught: speciesKeysByGeneration[0].slice(0, 20),
      wildBattlesWon: 100,
      defeatedGyms: kantoGyms.slice(0, 4),
    },
    claimed = gameReducer(base, {
      type: 'CLAIM_STORY_CHAPTER',
      payload: { chapterId: 'kanto' },
    }),
    chapter = PROFESSOR_STORY[0]
  assert.deepEqual(claimed.professorStory.claimed, ['kanto'])
  assert.equal(claimed.money, base.money + (chapter.reward.money ?? 0))
  assert.equal(claimed.inventory.greatball, (base.inventory.greatball ?? 0) + 10)
  assert.equal(professorStoryStatus(claimed).chapters[1].unlocked, true)
  // A second claim is a no-op.
  assert.equal(
    gameReducer(claimed, { type: 'CLAIM_STORY_CHAPTER', payload: { chapterId: 'kanto' } }),
    claimed
  )
})

test('an incomplete chapter cannot be claimed', () => {
  assert.equal(
    gameReducer(initialGameState, { type: 'CLAIM_STORY_CHAPTER', payload: { chapterId: 'kanto' } }),
    initialGameState
  )
  // A locked chapter cannot be skipped to.
  const almost = {
    ...initialGameState,
    pokedexCaught: speciesKeysByGeneration[4].slice(0, 40),
    wildBattlesWon: 100,
    defeatedGyms: unovaGyms,
    defeatedChampions: ['unova'],
    researchRewarded: Object.fromEntries(
      speciesKeysByGeneration[4].slice(0, 25).map((key) => [key, true])
    ),
  }
  assert.equal(
    gameReducer(almost, { type: 'CLAIM_STORY_CHAPTER', payload: { chapterId: 'unova' } }),
    almost
  )
})

test('the Catching Charm chapter grants its passive bonus once claimed', () => {
  assert.equal(professorStoryCatchBonus(initialGameState), 0)
  const charmed = {
    ...initialGameState,
    professorStory: { claimed: ['unova'] },
  }
  assert.equal(professorStoryCatchBonus(charmed), PROFESSOR_STORY.find((c) => c.id === 'unova').reward.catchBonus)
  assert.ok(professorStoryCatchBonus(charmed) > 0)
})

test('the capstone unlocks once every chapter and every legendary is complete', () => {
  const allClaimed = PROFESSOR_STORY.filter((chapter) => chapter.region).map((chapter) => chapter.id),
    legendaryKeys = Object.values(QUEST_LEGENDARY_BY_REGION),
    capstone = PROFESSOR_STORY[PROFESSOR_STORY.length - 1],
    base = {
      ...initialGameState,
      professorStory: { claimed: allClaimed },
      pokedexCaught: [...Object.keys(pokemonSpecies), ...legendaryKeys],
      defeatedGyms: Array.from({ length: 80 }, (_, index) => `gym-${index}`),
    },
    chapter = professorStoryStatus(base).chapters.find((candidate) => candidate.id === capstone.id)
  assert.ok(chapter.unlocked)
  assert.ok(chapter.done)
  assert.ok(chapter.claimable)
  const claimed = gameReducer(base, {
    type: 'CLAIM_STORY_CHAPTER',
    payload: { chapterId: capstone.id },
  })
  assert.equal(claimed.inventory.masterball, (base.inventory.masterball ?? 0) + 3)
  assert.ok(claimed.party.length === 0 || claimed.party.every((member) => member.ribbons?.includes('professor')))
})

test('repairSave drops unknown story chapter ids', () => {
  const save = {
      version: 2,
      playerPokemon: {
        id: '1',
        speciesKey: 'bulbasaur',
        level: 5,
        ivs: generateIVs(),
        moves: ['tackle'],
        currentHp: 20,
        maxHp: 20,
      },
      party: [],
      box: [],
      nextPokemonId: 2,
      inventory: {},
      professorStory: { claimed: ['kanto', 'not-a-chapter'] },
    },
    repaired = repairSave(save)
  assert.deepEqual(repaired.professorStory.claimed, ['kanto'])
})
