import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const {
  MYSTERY_GIFTS,
  MYSTERY_GIFT_ROTATION,
  MYSTERY_GIFT_BATTLE_STEP,
  claimableMysteryGifts,
  featuredMysteryGift,
  findMysteryGift,
  findMysteryGiftByCode,
  giftRewardLabel,
  mysteryGiftProgress,
  mysteryGiftStatus,
  mysteryGiftUnlockBattles,
  mysteryGiftUnlocked,
  nextMysteryGift,
} = await import('../src/game/gifts.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { consumableItems, evolutionItems, fossilItems, heldItems, pokeBalls } = await import(
  '../src/data/items.js'
)

const { pokemonSpecies } = gameData

/** A fresh state with a given number of total battles won. @param {number} battles */
const stateWithBattles = (battles) => ({
  ...initialGameState,
  claimedGifts: [],
  wildBattlesWon: battles,
  trainerBattlesWon: 0,
})

test('every mystery gift is real data with unique ids and codes', () => {
  const ids = new Set(),
    codes = new Set()
  for (const gift of MYSTERY_GIFTS) {
    assert.ok(!ids.has(gift.id), `${gift.id} is duplicated`)
    ids.add(gift.id)
    assert.ok(gift.name && gift.distribution && gift.description, `${gift.id} has card text`)
    assert.ok(gift.ot, `${gift.id} has an original trainer`)
    if (gift.pokemon) {
      assert.ok(pokemonSpecies[gift.pokemon.speciesKey], `${gift.id} species`)
      assert.ok(gift.pokemon.level >= 1 && gift.pokemon.level <= 100)
    }
    if (gift.code) {
      assert.ok(!codes.has(gift.code), `${gift.code} is duplicated`)
      codes.add(gift.code)
    }
    for (const itemId of Object.keys(gift.items ?? {}))
      assert.ok(
        consumableItems[itemId] || heldItems[itemId] || evolutionItems[itemId] || fossilItems[itemId] || pokeBalls[itemId],
        `${gift.id} item ${itemId}`
      )
    assert.ok(giftRewardLabel(gift).length > 0, `${gift.id} has a reward label`)
  }
  assert.ok(MYSTERY_GIFT_ROTATION.length > 4, 'there is a real rotation')
  assert.ok(
    MYSTERY_GIFT_ROTATION.every((gift) => !gift.code),
    'code gifts stay out of the rotation'
  )
})

test('find helpers resolve gifts and codes', () => {
  assert.equal(findMysteryGift(MYSTERY_GIFTS[0].id)?.id, MYSTERY_GIFTS[0].id)
  assert.equal(findMysteryGift('nope'), null)
  const codeGift = MYSTERY_GIFTS.find((gift) => gift.code)
  assert.ok(codeGift)
  assert.equal(findMysteryGiftByCode(codeGift.code.toLowerCase())?.id, codeGift.id)
  assert.equal(findMysteryGiftByCode('  '), null)
  assert.equal(findMysteryGiftByCode('nope'), null)
})

test('the battle rotation unlocks one gift per threshold', () => {
  const first = MYSTERY_GIFT_ROTATION[0],
    second = MYSTERY_GIFT_ROTATION[1],
    idle = stateWithBattles(0),
    afterOne = stateWithBattles(MYSTERY_GIFT_BATTLE_STEP),
    afterTwo = stateWithBattles(MYSTERY_GIFT_BATTLE_STEP * 2)
  assert.equal(mysteryGiftProgress(idle), 0, 'no card opens before the first step')
  assert.equal(mysteryGiftProgress(afterOne), 1)
  assert.equal(mysteryGiftProgress(afterTwo), 2)
  assert.equal(featuredMysteryGift(idle), null, 'nothing is featured before the first step')
  assert.equal(mysteryGiftUnlocked(first, idle), false)
  assert.equal(mysteryGiftUnlocked(first, afterOne), true)
  assert.equal(mysteryGiftUnlocked(second, afterOne), false, 'the next card is still locked')
  assert.equal(mysteryGiftUnlocked(second, afterTwo), true)
  assert.equal(featuredMysteryGift(afterOne)?.id, first.id)
  assert.equal(featuredMysteryGift(afterTwo)?.id, second.id)
  assert.equal(mysteryGiftUnlockBattles(first), MYSTERY_GIFT_BATTLE_STEP)
  assert.equal(mysteryGiftUnlockBattles(second), MYSTERY_GIFT_BATTLE_STEP * 2)
  const next = nextMysteryGift(afterOne)
  assert.equal(next?.gift.id, second.id)
  assert.equal(next?.battles, MYSTERY_GIFT_BATTLE_STEP * 2)
  assert.equal(nextMysteryGift(idle)?.battles, MYSTERY_GIFT_BATTLE_STEP)
})

test('the code gifts are always unlocked', () => {
  const codeGift = MYSTERY_GIFTS.find((gift) => gift.code)
  assert.ok(codeGift)
  assert.equal(mysteryGiftUnlocked(codeGift, stateWithBattles(0)), true)
  assert.equal(mysteryGiftStatus(stateWithBattles(0), codeGift).unlocked, true)
})

test('claiming the featured gift hands over the Pokemon once', () => {
  const gift = MYSTERY_GIFT_ROTATION[0],
    claimed = gameReducer(stateWithBattles(MYSTERY_GIFT_BATTLE_STEP), {
      type: 'CLAIM_MYSTERY_GIFT',
      payload: { giftId: gift.id },
    }),
    member = [...claimed.party, ...claimed.box].find(
      (pokemon) => pokemon.speciesKey === gift.pokemon.speciesKey
    )
  assert.ok((claimed.claimedGifts ?? []).includes(gift.id))
  assert.ok(member, 'the gift Pokemon joins the squad')
  assert.equal(member.level, gift.pokemon.level)
  assert.ok(claimed.pokedexCaught.includes(gift.pokemon.speciesKey))
  const twice = gameReducer(claimed, {
    type: 'CLAIM_MYSTERY_GIFT',
    payload: { giftId: gift.id },
  })
  assert.equal(twice.claimedGifts.filter((id) => id === gift.id).length, 1, 'claimed only once')
})

test('a gift is refused before its battle threshold', () => {
  const locked = MYSTERY_GIFT_ROTATION[1],
    before = gameReducer(stateWithBattles(0), {
      type: 'CLAIM_MYSTERY_GIFT',
      payload: { giftId: locked.id },
    }),
    after = gameReducer(stateWithBattles(MYSTERY_GIFT_BATTLE_STEP * 2), {
      type: 'CLAIM_MYSTERY_GIFT',
      payload: { giftId: locked.id },
    })
  assert.ok(!(before.claimedGifts ?? []).includes(locked.id), 'locked before its threshold')
  assert.ok(
    (after.claimedGifts ?? []).includes(locked.id),
    'open once the threshold is reached'
  )
})

test('an offline code redeems its bundle', () => {
  const gift = MYSTERY_GIFTS.find((candidate) => candidate.code && candidate.items),
    claimed = gameReducer(
      { ...initialGameState, claimedGifts: [], inventory: {} },
      { type: 'CLAIM_MYSTERY_GIFT', payload: { code: gift.code.toLowerCase() } }
    )
  assert.ok((claimed.claimedGifts ?? []).includes(gift.id))
  for (const [itemId, quantity] of Object.entries(gift.items))
    assert.equal(claimed.inventory[itemId], quantity)
  const badCode = gameReducer(
    { ...initialGameState, claimedGifts: [] },
    { type: 'CLAIM_MYSTERY_GIFT', payload: { code: 'NOT-A-CODE' } }
  )
  assert.deepEqual(badCode.claimedGifts, [], 'an unknown code does nothing')
})

test('claimableMysteryGifts tracks opened, unclaimed cards', () => {
  const open = claimableMysteryGifts(stateWithBattles(MYSTERY_GIFT_BATTLE_STEP))
  assert.ok(open.some((gift) => gift.id === MYSTERY_GIFT_ROTATION[0].id))
  assert.ok(!open.some((gift) => gift.id === MYSTERY_GIFT_ROTATION[1].id), 'next card is not open')
  const afterClaim = claimableMysteryGifts({
    ...stateWithBattles(MYSTERY_GIFT_BATTLE_STEP),
    claimedGifts: [MYSTERY_GIFT_ROTATION[0].id],
  })
  assert.ok(!afterClaim.some((gift) => gift.id === MYSTERY_GIFT_ROTATION[0].id))
})
