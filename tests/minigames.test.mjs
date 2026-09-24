import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const { BUG_CONTEST_BALL, BUG_CONTEST_BUSHES, BUG_CONTEST_COST, BUG_CONTEST_POOL, BUG_CONTEST_RUSTLES, MINIGAME_LOCATIONS, MINING_COST, SLOT_JACKPOT, SLOT_PAYLINES, SLOT_REELS, SLOT_ROWS, SLOT_SPIN_COST, SLOT_SYMBOLS, VOLTORB_FLIP_COST, VOLTORB_MAX_LEVEL, VOLTORB_SIZE, AUCTION_LOTS, auctionAppraisal, boardCleared, boardExploded, boardHints, bugCatchChance, bugContestPrize, bugFleeChance, bugStays, buildContestResults, canAuctionBid, contestPlayerRank, contestScore, createAuction, createVoltorbBoard, flipVoltorbCell, placeAuctionBid, rewardItemName, rollContestBug, rollMiningReward, spinSlots, throwNetBall, toggleVoltorbMark, voltorbBoardCoins, voltorbCountForLevel, voltorbFlipPrize } = await import(
  '../src/game/minigames.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { consumableItems, evolutionItems, heldItems } = await import('../src/data/items.js')
const { createPokemon } = await import('../src/game/pokemon.js')

test('fixed minigames live at their in-game locations', () => {
  assert.equal(MINIGAME_LOCATIONS.celadonCity, 'gameCorner')
  assert.equal(MINIGAME_LOCATIONS['johto-route-35'], 'bugContest')
  assert.equal(MINIGAME_LOCATIONS['sinnoh-eterna-city'], 'mining')
  for (const locationId of Object.keys(MINIGAME_LOCATIONS))
    assert.ok(gameData.mapData[locationId], `${locationId} should be a real location`)
})

test('mining rewards are real items with a positive quantity', () => {
  for (let roll = 0; roll < 60; roll++) {
    const reward = rollMiningReward()
    assert.ok(
      consumableItems[reward.itemId] ||
        evolutionItems[reward.itemId] ||
        heldItems[reward.itemId],
      `${reward.itemId} should be a real item`
    )
    assert.ok(reward.quantity >= 1)
    assert.equal(typeof rewardItemName(reward.itemId), 'string')
  }
})

test('mining can find held battle items and names them', () => {
  const found = new Set()
  for (let roll = 0; roll < 800; roll++) found.add(rollMiningReward().itemId)
  const battleItems = [...found].filter((itemId) => heldItems[itemId])
  assert.ok(battleItems.length >= 3, `expected several battle items, got ${battleItems.length}`)
  for (const itemId of battleItems) assert.equal(rewardItemName(itemId), heldItems[itemId].name)
})

test('PAY_MINIGAME_FEE charges the fee and refuses when broke', () => {
  const rich = gameReducer(
      { ...initialGameState, money: MINING_COST + 100 },
      { type: 'PAY_MINIGAME_FEE', payload: { amount: MINING_COST } }
    ),
    poor = gameReducer(
      { ...initialGameState, money: MINING_COST - 1 },
      { type: 'PAY_MINIGAME_FEE', payload: { amount: MINING_COST } }
    )
  assert.equal(rich.money, 100)
  assert.equal(poor.money, MINING_COST - 1)
})

test('CLAIM_MINIGAME_REWARD pays money and items', () => {
  const next = gameReducer(
    { ...initialGameState, inventory: {}, money: 0 },
    {
      type: 'CLAIM_MINIGAME_REWARD',
      payload: { money: 4000, items: [{ itemId: 'rareCandy', quantity: 1 }] },
    }
  )
  assert.equal(next.money, 4000)
  assert.equal(next.inventory.rareCandy, 1)
})

test('the slot machine is a 3x3 with eight paylines', () => {
  assert.equal(SLOT_REELS, 3)
  assert.equal(SLOT_ROWS, 3)
  assert.equal(SLOT_PAYLINES.length, 8, '3 rows + 3 columns + 2 diagonals')
  for (const line of SLOT_PAYLINES) assert.equal(line.length, 3)
})

test('slot spins score every matching line and stay near break-even', () => {
  for (let roll = 0; roll < 200; roll++) {
    const result = spinSlots()
    assert.equal(result.grid.length, SLOT_ROWS)
    for (const row of result.grid) assert.equal(row.length, SLOT_REELS)
    let expectedPayout = 0
    for (const win of result.wins) {
      const line = SLOT_PAYLINES[win.lineIndex].map(([r, c]) => result.grid[r][c])
      assert.ok(line.every((symbol) => symbol.id === win.symbol.id), 'a win line matches')
      expectedPayout += win.symbol.payout * SLOT_SPIN_COST
    }
    assert.equal(result.payout, expectedPayout, 'the payout is the sum of the winning lines')
    if (result.jackpot) assert.ok(result.payout > 0)
  }
  // Theoretical return: 8 lines * sum((weight/total)^3 * payout).
  const total = SLOT_SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0),
    expected =
      8 *
      SLOT_SYMBOLS.reduce(
        (sum, symbol) => sum + (symbol.weight / total) ** 3 * symbol.payout,
        0
      )
  assert.ok(expected > 0.8 && expected < 1.0, `return rate ${expected}`)
  assert.equal(SLOT_JACKPOT, Math.max(...SLOT_SYMBOLS.map((symbol) => symbol.payout)))
})
test('contest bugs roll a level, gender and flee chance', () => {
  assert.equal(BUG_CONTEST_BUSHES, 3)
  assert.ok(BUG_CONTEST_RUSTLES > 0)
  for (let roll = 0; roll < 50; roll++) {
    const bug = rollContestBug(40)
    assert.ok(bug.speciesKey)
    assert.ok(bug.level >= 5 && bug.level <= 75)
    assert.ok(['male', 'female', 'genderless'].includes(bug.gender))
    assert.ok(bug.fleeChance >= 0 && bug.fleeChance <= 1)
  }
})

test('rarer contest bugs are more skittish', () => {
  assert.ok(bugFleeChance('scyther') > bugFleeChance('caterpie'))
})

test('every Bug-type is contest-eligible, legendaries included', () => {
  const pool = new Set(BUG_CONTEST_POOL.map((entry) => entry.speciesKey))
  assert.ok(pool.has('caterpie'))
  assert.ok(pool.has('volcarona'), 'a non-Johto bug is eligible')
  assert.ok(pool.has('golisopod'))
  assert.ok(pool.has('genesect'), 'legendary bugs are eligible too')
  assert.ok(pool.has('pheromosa'))
  assert.ok(!pool.has('pikachu'), 'non-bugs are excluded')
})

test('raid islands keep only the legendary Bug-types', () => {
  const { pokemonSpecies, regions } = gameData
  for (const region of regions)
    for (const entry of region.raidPool ?? []) {
      const species = pokemonSpecies[entry.speciesKey]
      assert.ok(
        !(species.types ?? []).includes('Bug') || species.legendary,
        `${entry.speciesKey} in ${region.id} should be contest-only`
      )
    }
})

test('contest results rank the player and fake rivals by score', () => {
  const playerBug = { speciesKey: 'volcarona', level: 50, gender: 'male', fleeChance: 0.1 },
    results = buildContestResults([playerBug], 50, 3)
  assert.ok(results.length >= 4, 'the player plus at least three rival bugs')
  assert.ok(results.some((entry) => entry.isPlayer), 'the player is on the board')
  assert.ok(results.some((entry) => !entry.isPlayer), 'the board includes fake rivals')
  for (let index = 1; index < results.length; index++)
    assert.ok(results[index - 1].score >= results[index].score, 'the board is sorted by score')
  assert.equal(contestScore('volcarona'), 550)
})

test('the top three contest placings pay prizes, with a participant fallback', () => {
  const first = bugContestPrize(1),
    second = bugContestPrize(2),
    third = bugContestPrize(3),
    participant = bugContestPrize(null)
  assert.ok(first.money > second.money && second.money > third.money)
  assert.ok(first.items.length > 0 && second.items.length > 0 && third.items.length > 0)
  assert.equal(first.label, 'First place')
  assert.equal(participant.label, 'Participant')
  assert.ok(participant.items.length > 0)
})

test('contestPlayerRank finds the player\u2019s best placement', () => {
  assert.equal(contestPlayerRank([{ isPlayer: false }, { isPlayer: true }]), 2)
  assert.equal(contestPlayerRank([{ isPlayer: true }, { isPlayer: false }]), 1)
  assert.equal(contestPlayerRank([{ isPlayer: false }]), null)
})

test('the contest supplies free Net Balls with a real catch chance', () => {
  assert.equal(BUG_CONTEST_BALL, 'netball')
  const chance = bugCatchChance('scyther')
  assert.ok(chance > 0 && chance < 1)
  assert.equal(typeof throwNetBall('caterpie'), 'boolean')
})

test('a failed throw may spook a bug into fleeing', () => {
  const original = Math.random
  try {
    Math.random = () => 0.99 // above every flee chance: the bug stays
    assert.equal(bugStays('caterpie'), true)
    assert.equal(bugStays('scyther'), true)
    Math.random = () => 0 // below every flee chance: the bug flees
    assert.equal(bugStays('caterpie'), false)
    assert.equal(bugStays('scyther'), false)
  } finally {
    Math.random = original
  }
})

test('START_BUG_CONTEST charges entry and enters the scene', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: BUG_CONTEST_COST + 50 },
      { type: 'START_BUG_CONTEST' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: BUG_CONTEST_COST - 1 },
      { type: 'START_BUG_CONTEST' }
    )
  assert.equal(started.phase, 'bugCatching')
  assert.equal(started.money, 50)
  assert.equal(broke.phase, 'idle')
  assert.equal(broke.money, BUG_CONTEST_COST - 1)
})

test('END_BUG_CONTEST returns to idle', () => {
  const next = gameReducer(
    { ...initialGameState, phase: 'bugCatching' },
    { type: 'END_BUG_CONTEST' }
  )
  assert.equal(next.phase, 'idle')
})

test('START_MINING charges entry and enters the scene', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: MINING_COST + 25 },
      { type: 'START_MINING' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: MINING_COST - 1 },
      { type: 'START_MINING' }
    )
  assert.equal(started.phase, 'mining')
  assert.equal(started.money, 25)
  assert.equal(broke.phase, 'idle')
  assert.equal(broke.money, MINING_COST - 1)
})

test('START_GAME_CORNER enters the scene without an entry fee', () => {
  const next = gameReducer(
    { ...initialGameState, phase: 'idle', money: 1234 },
    { type: 'START_GAME_CORNER' }
  )
  assert.equal(next.phase, 'gameCorner')
  assert.equal(next.money, 1234)
})

test('entering a minigame stops an in-progress battle', () => {
  const active = createPokemon('bulbasaur', 20, 'a'),
    battling = {
      ...initialGameState,
      phase: 'battling',
      party: [active],
      playerPokemon: active,
      money: MINING_COST + 10,
      enemyPokemon: { speciesKey: 'pidgey', level: 5 },
    },
    started = gameReducer(battling, { type: 'START_MINING' }),
    stillBattling = gameReducer(
      { ...battling, phase: 'evolving' },
      { type: 'START_GAME_CORNER' }
    )
  assert.equal(started.phase, 'mining', 'the battle is dropped and the scene starts')
  assert.equal(started.enemyPokemon, null)
  assert.equal(started.money, 10)
  assert.equal(stillBattling.phase, 'evolving', 'an animation in progress is never interrupted')
})

test('END_MINIGAME returns mining and the game corner to idle', () => {
  assert.equal(
    gameReducer({ ...initialGameState, phase: 'mining' }, { type: 'END_MINIGAME' }).phase,
    'idle'
  )
  assert.equal(
    gameReducer({ ...initialGameState, phase: 'gameCorner' }, { type: 'END_MINIGAME' }).phase,
    'idle'
  )
})

test('CATCH_POKEMON keeps a rolled gender', () => {
  const next = gameReducer(
    { ...initialGameState, party: [], nextPokemonId: 7 },
    {
      type: 'CATCH_POKEMON',
      payload: { speciesKey: 'scyther', level: 40, gender: 'female' },
    }
  )
  assert.equal(next.party[0].gender, 'female')
})

test('COLLECT_MINING adds the found rewards to the bag', () => {
  const next = gameReducer(
    { ...initialGameState, inventory: {} },
    {
      type: 'COLLECT_MINING',
      payload: {
        rewards: [
          { itemId: 'nugget', quantity: 2 },
          { itemId: 'fireStone', quantity: 1 },
        ],
      },
    }
  )
  assert.equal(next.inventory.nugget, 2)
  assert.equal(next.inventory.fireStone, 1)
})

test('every fixed minigame location is a map POI', async () => {
  const { POI_LOCATIONS } = await import('../src/game/minigames.js')
  for (const id of Object.keys(MINIGAME_LOCATIONS)) assert.ok(POI_LOCATIONS.has(id))
  assert.ok(POI_LOCATIONS.has('hoenn-route-111'), 'the Battle Tower is a POI')
  assert.equal(POI_LOCATIONS.size, 9)
})

test('a Voltorb board has the level\u2019s Voltorbs and consistent hints', () => {
  assert.equal(VOLTORB_SIZE, 5)
  for (const level of [1, 4, VOLTORB_MAX_LEVEL]) {
    const board = createVoltorbBoard(level),
      voltorbs = board.cells.filter((cell) => cell.kind === 'voltorb').length,
      { rows, cols } = boardHints(board)
    assert.equal(board.cells.length, VOLTORB_SIZE * VOLTORB_SIZE)
    assert.equal(voltorbs, voltorbCountForLevel(level))
    // The hint sums are the values of the non-Voltorb tiles, and the row and
    // column totals therefore agree.
    const rowSum = rows.reduce((sum, hint) => sum + hint.sum, 0),
      colSum = cols.reduce((sum, hint) => sum + hint.sum, 0)
    assert.equal(rowSum, colSum)
    assert.equal(
      rows.reduce((sum, hint) => sum + hint.voltorbs, 0),
      voltorbs
    )
  }
})

test('flipping clears a board, and a Voltorb ends it', () => {
  const board = createVoltorbBoard(1),
    safeIndexes = board.cells
      .map((cell, index) => (cell.kind === 'voltorb' ? -1 : index))
      .filter((index) => index >= 0),
    explodedIndex = board.cells.findIndex((cell) => cell.kind === 'voltorb')
  let cleared = board
  for (const index of safeIndexes) cleared = flipVoltorbCell(cleared, index)
  assert.ok(boardCleared(cleared), 'every non-Voltorb tile is face up')
  assert.ok(voltorbBoardCoins(cleared) > 0, 'a cleared board banks coins')
  assert.equal(flipVoltorbCell(cleared, safeIndexes[0]), cleared, 'a flipped tile is ignored')

  const boom = flipVoltorbCell(board, explodedIndex)
  assert.ok(boardExploded(boom), 'flipping a Voltorb explodes')
  assert.ok(!boardCleared(boom))
})

test('tiles can be marked and unmarked while hidden', () => {
  const board = createVoltorbBoard(1),
    marked = toggleVoltorbMark(board, 0)
  assert.equal(marked.cells[0].marked, true)
  assert.equal(toggleVoltorbMark(marked, 0).cells[0].marked, false)
})

test('Voltorb Flip pays out a banked run and a deep-run candy', () => {
  const shallow = voltorbFlipPrize(1200, 1),
    deep = voltorbFlipPrize(9000, VOLTORB_MAX_LEVEL)
  assert.equal(shallow.money, 1200)
  assert.equal(shallow.items.length, 0)
  assert.ok(deep.items.length > 0)
  assert.ok(deep.items[0].itemId)
  assert.notEqual(shallow.label, deep.label)
})

test('START_VOLTORB_FLIP charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: VOLTORB_FLIP_COST + 40 },
      { type: 'START_VOLTORB_FLIP' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: VOLTORB_FLIP_COST - 1 },
      { type: 'START_VOLTORB_FLIP' }
    ),
    ended = gameReducer(started, { type: 'END_MINIGAME' })
  assert.equal(started.phase, 'voltorbFlip')
  assert.equal(started.money, 40)
  assert.equal(broke.phase, 'idle')
  assert.equal(ended.phase, 'idle')
})

test('auction lots carry real items and a sensible appraisal', () => {
  assert.ok(AUCTION_LOTS.length >= 4)
  for (const lot of AUCTION_LOTS) {
    assert.ok(lot.value > 0)
    assert.ok(lot.items.length > 0)
    for (const item of lot.items) {
      assert.ok(
        consumableItems[item.itemId] ||
          evolutionItems[item.itemId] ||
          heldItems[item.itemId],
        `${item.itemId} should be a real item`
      )
      assert.ok(item.quantity >= 1)
      assert.equal(typeof rewardItemName(item.itemId), 'string')
    }
    const { low, high } = auctionAppraisal(lot)
    assert.ok(low > 0 && high > low)
  }
})

test('auction bidding raises the price until the rivals drop out', () => {
  const lot = AUCTION_LOTS.find((candidate) => candidate.id === 'choiceSet')
  assert.ok(lot)
  let auction = createAuction(lot, () => 0)
  assert.equal(auction.highest, null)
  assert.ok(canAuctionBid(auction, 1e9))

  // Keep raising; the rivals answer at first, then drop out one by one.
  let guard = 0
  while (!auction.won && guard < 25) {
    const next = placeAuctionBid(auction)
    assert.ok(next.price >= auction.price, 'the price never goes down')
    auction = next
    guard++
  }
  assert.ok(auction.won, 'bidding past every rival wins the lot')
  assert.equal(auction.highest, 'player')
  assert.ok(auction.bidders.every((bidder) => !bidder.active))

  // You cannot bid past your wallet.
  const opening = createAuction(lot, () => 0)
  assert.equal(canAuctionBid(opening, opening.price), false)
  assert.equal(canAuctionBid(opening, opening.price + opening.raise), true)
})

test('START_AUCTION_HOUSE enters the scene and charges nothing', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: 777 },
      { type: 'START_AUCTION_HOUSE' }
    ),
    ended = gameReducer(started, { type: 'END_MINIGAME' })
  assert.equal(started.phase, 'auctionHouse')
  assert.equal(started.money, 777)
  assert.equal(ended.phase, 'idle')
})

test('winning an auction pays the bid and adds the lot', () => {
  const next = gameReducer(
    { ...initialGameState, inventory: {}, money: 20000 },
    {
      type: 'CLAIM_MINIGAME_REWARD',
      payload: { money: -8000, items: [{ itemId: 'fireStone', quantity: 2 }] },
    }
  )
  assert.equal(next.money, 12000)
  assert.equal(next.inventory.fireStone, 2)
})
