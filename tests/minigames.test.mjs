import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const { BATTLE_ROYAL_COST, BATTLE_ROYAL_POOL, BATTLE_ROYAL_ROUND_SIZE, BATTLE_ROYAL_RANKS, BUG_CONTEST_BALL, BUG_CONTEST_BUSHES, BUG_CONTEST_COST, BUG_CONTEST_POOL, BUG_CONTEST_RUSTLES, CONTEST_COST, CONTEST_THEMES, DYNAMAX_ADVENTURES_COST, DYNAMAX_STAGES, MINIGAME_LOCATIONS, MINIGAME_INFO, MINIGAME_AREAS, MINIGAME_REGIONS, MINIGAME_PHASES, MINIGAME_START_ACTION, minigameForLocation, minigamesInRegion, minigameNameForLocation, MINING_COST, POKEATHLON_COST, POKEATHLON_SPRINT_MS, POKE_RADAR_CHAIN_STEP, POKE_RADAR_COST, POKE_RADAR_SIZE, SLOT_JACKPOT, SLOT_PAYLINES, SLOT_REELS, SLOT_ROWS, SLOT_SPIN_COST, SLOT_SYMBOLS, VOLTORB_FLIP_COST, VOLTORB_MAX_LEVEL, VOLTORB_SIZE, AUCTION_LOTS, accuracyScore, auctionAppraisal, battleRoyalOpponent, battleRoyalPlacement, battleRoyalPrize, battleRoyalRank, boardCleared, boardExploded, boardHints, bugCatchChance, bugContestPrize, bugFleeChance, bugStays, buildContestResults, canAuctionBid, contestAppeal, contestPlacement, contestPlayerRank, contestPrize, contestRank, contestScore, contestTheme, createAuction, createOpponent, createVoltorbBoard, dynamaxBoss, dynamaxBossOptions, dynamaxPaths, dynamaxPickup, dynamaxPrize, dynamaxKoLimit, applyDynamaxPickup, DYNAMAX_PICKUPS, flipVoltorbCell, healSquad, moveBaseAppeal, pickRadarTarget, placeAuctionBid, pokeathlonPrize, pokeRadarPrize, radarChainPoints, radarSequence, rewardItemName, rollContestBug, rollContestBugs, rollContestRivalRound, rollContestTheme, rollMiningReward, simulateBattle, spinSlots, sprintScore, throwNetBall, toBattlePokemon, toggleVoltorbMark, voltorbBoardCoins, voltorbCountForLevel, voltorbFlipPrize, LIGHTS_OUT_COST, LIGHTS_OUT_SCRAMBLE, LIGHTS_OUT_SIZE, CURRY_COST, CURRY_FLAVORS, CURRY_INGREDIENTS, CURRY_ZONE, POKESTAR_COST, POKESTAR_SHOT_COUNT, createLightsOut, toggleLights, lightsSolved, lightsOutPrize, rollCurryRequest, curryScore, curryPrize, pickPokestarShots, pokestarPrize, MATCH3_COST, MATCH3_MOVES, MATCH3_SIZE, MEMORY_COST, MEMORY_PAIRS, WHACK_COST, WHACK_DURATION_MS, WHACK_POP_MIN_MS, WHACK_TARGETS, whackPopupMs, GAME_CORNER_PRIZE_GOAL, GAME_CORNER_PRIZE_POOL, createMatch3Board, findMatches, tryMatch3Swap, resolveMatch3, match3Prize, createMemoryDeck, memoryPrize, rollWhackTarget, whackPrize, MUSICAL_COST, MUSICAL_NOTES, MUSICAL_MAX_SCORE, generateMusicalPattern, judgeMusicalHit, musicalPrize, musicalTotalMs, PICNIC_COST, PICNIC_PICKS, PICNIC_INGREDIENTS, PICNIC_SHINY_MULTIPLIER, ingredientById, sandwichTypes, rollSandwichType, picnicDropScore, picnicSpeciesPool, rollPicnicEncounter, POKEBALL_FACTORY_COST, FACTORY_SIZE, connectionsFor, createFactoryPuzzle, rotateFactoryTile, factoryPowered, factorySolved, factoryPrize, FACTORY_BALL_POOL, rollFactoryBalls, SLIDING_COST, SLIDING_SIZE, solvedSlidingBoard, canSlide, slideTile, isSlidingSolved, createSlidingPuzzle, slidingTileForDirection, slidingPrize, UNOWN_FORMS, randomUnownForm, ICE_SLIDE_COST, ICE_SLIDE_ROOMS, ICE_SLIDE_TOTAL_PAR, iceSlidePosition, iceSlideSolved, iceSlidePrize, MANTINE_SURF_COST, MANTINE_SURF_WAVES, MANTINE_SURF_MAX_SCORE, surfWaveZone, surfWaveScore, surfMarkerPosition, mantineSurfPrize, ROTOM_RALLY_COST, ROTOM_RALLY_DISTANCE, rotomRallyScore, rotomRallyPrize, OGRE_OUSTIN_COST, OGRE_OUSTIN_LANES, rollOgreDrop, ogreFallMs, ogreSpawnMs, ogreOustinPrize, TYPE_FUSION_COST, TYPE_FUSION_SIZE, TYPE_FUSION_MOVES, createTypeFusionBoard, slideTypeFusion, typeFusionCanMove, typeFusionLabel, typeFusionPrize, UNOWN_PICROSS_COST, createPicrossPuzzle, picrossClues, picrossMatches, picrossWrongFills, picrossScore, picrossPrize, POKESHOT_COST, POKESHOT_FRAME, rollPokeshotTarget, pokeshotShotScore, pokeshotShotPoints, pokeshotPrize, TERA_RAID_COST, TERA_RAID_POOL, TERA_TYPES, teraRaidStars, teraRaidBoss, teraRaidHpMultiplier, createTeraRaidBoss, simulateTeraRaid, teraRaidScore, teraRaidPrize, POKEWORD_COST, POKEWORD_ROUNDS, scrambleLetters, rollPokewordChallenge, pokewordMatches, pokewordPrize, BERRY_BLENDER_COST, BERRY_BLENDER_MS, BERRY_BLENDER_TICK_MS, BERRY_BLENDER_TAP, BERRY_BLENDER_DECAY, blenderSweetSpot, blenderInZone, blenderScore, blenderPrize } = await import(
  '../src/game/minigames.js'
)
const { match3SwapFrames, MATCH3_SPECIES, MATCH3_TYPES, radarFaces, STRENGTH_ROOMS, STRENGTH_TOTAL_PAR, createStrengthState, strengthMove, strengthSolved, buildIceTempleStages, buildIceTempleRoomPool, generateIceRoom, isIceRoomFair, iceTempleRunSize, ICE_GENERATOR_MIN_PAR, ICE_TEMPLE_ICE_STAGES, ICE_TEMPLE_PRESTIGE_MAX, ICE_TEMPLE_STRENGTH_STAGES, parseIceLevel } = await import(
  '../src/game/minigames.js'
)
const { mulberry32 } = await import('../src/game/rng.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { consumableItems, evolutionItems, fossilItems, heldItems } = await import('../src/data/items.js')
const { createPokemon } = await import('../src/game/pokemon.js')

test('fixed minigames live at their in-game locations', () => {
  assert.equal(MINIGAME_LOCATIONS.celadonCity, 'gameCorner')
  assert.equal(MINIGAME_LOCATIONS['johto-national-park'], 'bugContest')
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
        fossilItems[reward.itemId] ||
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

test('a rustled contest bush can hold two bugs', () => {
  const original = Math.random
  try {
    Math.random = () => 0
    assert.equal(rollContestBugs(20).length, 2, 'a low roll doubles up')
    Math.random = () => 0.999
    assert.equal(rollContestBugs(20).length, 1, 'a high roll keeps it single')
  } finally {
    Math.random = original
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

test('only the player’s best bug is ranked, though all are kept', () => {
  const caught = [
      { speciesKey: 'caterpie', level: 10, gender: 'male', fleeChance: 0.1 },
      { speciesKey: 'volcarona', level: 50, gender: 'male', fleeChance: 0.1 },
      { speciesKey: 'scyther', level: 30, gender: 'male', fleeChance: 0.1 },
    ],
    board = buildContestResults(caught, 50, 3),
    playerEntries = board.filter((entry) => entry.isPlayer)
  assert.equal(playerEntries.length, 1, 'the player only places once')
  assert.equal(playerEntries[0].speciesKey, 'volcarona', 'only the best bug is judged')
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
  assert.equal(POI_LOCATIONS.size, Object.keys(MINIGAME_LOCATIONS).length + 1)
})

test('a radar sequence is distinct patches of the right length', () => {
  assert.equal(POKE_RADAR_SIZE, 4)
  const sequence = radarSequence(6)
  assert.equal(sequence.length, 6)
  assert.equal(new Set(sequence).size, 6, 'patches never repeat in a sequence')
  for (const index of sequence) assert.ok(index >= 0 && index < POKE_RADAR_SIZE * POKE_RADAR_SIZE)
  assert.equal(radarSequence(999).length, POKE_RADAR_SIZE * POKE_RADAR_SIZE, 'capped at the field')
})

test('the radar targets a real rare route species and pays a chain', () => {
  const target = pickRadarTarget({ currentRoute: 'route1', unlockedLocations: ['route1'] })
  assert.ok(target, 'a Kanto route has a target')
  assert.ok(gameData.pokemonSpecies[target.speciesKey], 'the target is a real species')
  assert.equal(target.routeKey, 'route1')
  assert.equal(radarChainPoints(4), 4 * POKE_RADAR_CHAIN_STEP)
  assert.ok(pokeRadarPrize(10).money > pokeRadarPrize(1).money)
})

test('radar faces fill the field with real route species, or blank', () => {
  const faces = radarFaces('route1')
  assert.equal(faces.length, POKE_RADAR_SIZE * POKE_RADAR_SIZE)
  assert.ok(
    faces.every((face) => face === null || gameData.pokemonSpecies[face]),
    'every face is a real species'
  )
  assert.ok(faces.some((face) => face !== null), 'a route with wilds has faces')
  assert.deepEqual(
    radarFaces('notARealRoute'),
    Array(POKE_RADAR_SIZE * POKE_RADAR_SIZE).fill(null),
    'a route with no wilds shows no faces'
  )
})

test('UPDATE_SHINY_CHAIN can add a batch of radar chain points', () => {
  const next = gameReducer(
    { ...initialGameState, shinyChain: { speciesKey: null, count: 0, radar: 0 } },
    { type: 'UPDATE_SHINY_CHAIN', payload: { speciesKey: 'pikachu', amount: 40, radar: true } }
  )
  assert.deepEqual(next.shinyChain, { speciesKey: 'pikachu', count: 40, radar: 40, target: 5 })
  const extended = gameReducer(next, {
    type: 'UPDATE_SHINY_CHAIN',
    payload: { speciesKey: 'pikachu', amount: 10, radar: true },
  })
  assert.equal(extended.shinyChain.count, 50)
  assert.equal(extended.shinyChain.radar, 50)
  // A plain wild encounter only builds `count`, never the radar guarantee.
  const wild = gameReducer(extended, {
    type: 'UPDATE_SHINY_CHAIN',
    payload: { speciesKey: 'pikachu', amount: 1 },
  })
  assert.equal(wild.shinyChain.count, 51)
  assert.equal(wild.shinyChain.radar, 50)
})

test('START_POKE_RADAR charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: POKE_RADAR_COST + 5 },
      { type: 'START_POKE_RADAR' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: POKE_RADAR_COST - 1 },
      { type: 'START_POKE_RADAR' }
    ),
    ended = gameReducer(started, { type: 'END_MINIGAME' })
  assert.equal(started.phase, 'pokeRadar')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(ended.phase, 'idle')
})

test('a real battle simulation resolves to a winner', () => {
  const player = toBattlePokemon(createOpponent('charizard', 50), { isPlayer: true }),
    enemy = createOpponent('venusaur', 48),
    outcome = simulateBattle(player, enemy)
  assert.equal(typeof outcome.won, 'boolean')
  assert.ok(outcome.turns >= 1 && outcome.turns <= 80)
  assert.ok(player.currentHp <= player.maxHp)
})

test('Battle Royal waves scale and heal the squad', () => {
  assert.ok(BATTLE_ROYAL_POOL.length > 0)
  const early = battleRoyalOpponent(1, 50),
    late = battleRoyalOpponent(10, 50)
  assert.ok(late.level > early.level, 'later waves are higher level')
  assert.ok(gameData.pokemonSpecies[early.speciesKey])
  const hurt = [{ name: 'A', currentHp: 10, maxHp: 100 }, { name: 'B', currentHp: 0, maxHp: 100 }],
    healed = healSquad(hurt, 0.5)
  assert.equal(healed[0].currentHp, 60)
  assert.equal(healed[1].currentHp, 0, 'fainted Pokemon are not revived')
  assert.ok(battleRoyalPrize(15).money > battleRoyalPrize(1).money)
  // The Bottle Caps are Battle Royal-only rewards: Bottle Cap at 15, Gold at 20.
  assert.ok(
    battleRoyalPrize(15).items.some((item) => item.itemId === 'bottleCap'),
    'a 15-wave run awards a Bottle Cap'
  )
  assert.ok(
    battleRoyalPrize(20).items.some((item) => item.itemId === 'goldBottleCap'),
    'a 20-wave run awards a Gold Bottle Cap'
  )
  assert.ok(
    !battleRoyalPrize(14).items.some((item) => /bottleCap$/i.test(item.itemId)),
    'shorter runs do not award caps'
  )
})

test('Battle Royal places rounds 1st-4th and tracks ranks', () => {
  assert.equal(BATTLE_ROYAL_ROUND_SIZE, 3)
  assert.equal(battleRoyalPlacement(3), 1)
  assert.equal(battleRoyalPlacement(2), 2)
  assert.equal(battleRoyalPlacement(1), 3)
  assert.equal(battleRoyalPlacement(0), 4)
  assert.equal(battleRoyalRank(0).id, 'normal')
  assert.equal(battleRoyalRank(15).id, 'royal')
  assert.equal(BATTLE_ROYAL_RANKS.length, 5)
  // The top tier awards a Nature Mint.
  assert.ok(battleRoyalPrize(25).items.some((item) => item.itemId === 'natureMint'))
})

test('START_BATTLE_ROYAL charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: BATTLE_ROYAL_COST + 5 },
      { type: 'START_BATTLE_ROYAL' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: BATTLE_ROYAL_COST - 1 },
      { type: 'START_BATTLE_ROYAL' }
    ),
    ended = gameReducer(started, { type: 'END_MINIGAME' })
  assert.equal(started.phase, 'battleRoyal')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(ended.phase, 'idle')
})

test('Dynamax Adventures offer paths and a real Galar legendary boss', () => {
  assert.equal(DYNAMAX_STAGES, 3)
  const paths = dynamaxPaths(0, 50)
  assert.equal(paths.length, 2)
  for (const path of paths) assert.ok(gameData.pokemonSpecies[path.speciesKey])
  const boss = dynamaxBoss('galar'),
    galarPool = new Set((gameData.regions.find((r) => r.id === 'galar')?.raidPool ?? []).map((e) => e.speciesKey))
  assert.ok(galarPool.has(boss.speciesKey), `${boss.speciesKey} should be a Galar raid legendary`)
  assert.ok(dynamaxPrize(3, !0).money > dynamaxPrize(1, !1).money)
  assert.ok(
    dynamaxPrize(DYNAMAX_STAGES, !0).items.some((item) => item.itemId === 'bottleCap'),
    'beating the legendary awards a Bottle Cap'
  )
  assert.ok(
    !dynamaxPrize(DYNAMAX_STAGES, !1).items.some((item) => item.itemId === 'bottleCap'),
    'losing to the legendary does not'
  )
  assert.ok(
    dynamaxPrize(DYNAMAX_STAGES, !0).items.some((item) => item.itemId === 'natureMint'),
    'beating the legendary awards a Nature Mint'
  )
})

test('Dynamax Adventures scout distinct legends and drop pickups', () => {
  const options = dynamaxBossOptions('galar', null, 3),
    galarPool = new Set(
      (gameData.regions.find((region) => region.id === 'galar')?.raidPool ?? []).map(
        (entry) => entry.speciesKey
      )
    )
  assert.ok(options.length >= 1)
  for (const option of options) assert.ok(galarPool.has(option.speciesKey))
  assert.equal(
    new Set(options.map((option) => option.speciesKey)).size,
    options.length,
    'scouted legends are distinct'
  )

  const pickup = dynamaxPickup(() => 0)
  assert.ok(DYNAMAX_PICKUPS.some((entry) => entry.id === pickup.id))
  // A heal restores half the active Pokemon; a revive brings one back.
  const squad = [
    { currentHp: 20, maxHp: 100 },
    { currentHp: 0, maxHp: 100 },
  ]
  assert.equal(applyDynamaxPickup('heal', squad, 0)[0].currentHp, 70)
  assert.equal(applyDynamaxPickup('revive', squad, 0)[1].currentHp, 50)
  assert.equal(dynamaxKoLimit(6), 3)
})

test('START_DYNAMAX_ADVENTURES charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: DYNAMAX_ADVENTURES_COST + 5 },
      { type: 'START_DYNAMAX_ADVENTURES' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: DYNAMAX_ADVENTURES_COST - 1 },
      { type: 'START_DYNAMAX_ADVENTURES' }
    ),
    ended = gameReducer(started, { type: 'END_MINIGAME' })
  assert.equal(started.phase, 'dynamaxAdventures')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(ended.phase, 'idle')
})

test('contest appeal rewards theme, combo and move power', () => {
  const cool = 'cool'
  assert.ok(moveBaseAppeal('flamethrower') > moveBaseAppeal('ember'))
  assert.equal(moveBaseAppeal('growl'), 1, 'status moves are the minimum')

  // Flamethrower is Fire, which is a Cool theme type.
  const onTheme = contestAppeal('flamethrower', cool, null)
  assert.ok(onTheme.onTheme)
  assert.ok(onTheme.appeal > moveBaseAppeal('flamethrower'))

  // A different Fire move the next round chains a combo.
  const combo = contestAppeal('ember', cool, { moveId: 'flamethrower', type: 'Fire' })
  assert.ok(combo.combo)
  assert.equal(combo.appeal, moveBaseAppeal('ember') + 2 + 2)

  // Repeating the exact same move is penalised to 1.
  const repeat = contestAppeal('ember', cool, { moveId: 'ember', type: 'Fire' })
  assert.ok(repeat.repeated)
  assert.equal(repeat.appeal, 1)
})

test('contest themes and rivals behave sanely', () => {
  const theme = rollContestTheme()
  assert.ok(CONTEST_THEMES.some((candidate) => candidate.id === theme.id))
  assert.equal(contestTheme('nonsense').id, CONTEST_THEMES[0].id)
  for (const skill of [0, 1, 2]) {
    const score = rollContestRivalRound(skill)
    assert.ok(score >= 2 && score <= 7)
  }

  const board = contestPlacement(20, [
    { name: 'A', score: 25 },
    { name: 'B', score: 10 },
    { name: 'C', score: 30 },
  ])
  assert.equal(board[0].owner, 'C')
  assert.ok(board.some((entry) => entry.isPlayer))
  assert.equal(contestRank(board), 3)
  const won = contestPlacement(99, [{ name: 'A', score: 1 }])
  assert.equal(contestRank(won), 1)
  assert.ok(contestPrize(1).money > contestPrize(4).money)
})

test('START_CONTEST charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: CONTEST_COST + 10 },
      { type: 'START_CONTEST' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: CONTEST_COST - 1 },
      { type: 'START_CONTEST' }
    ),
    ended = gameReducer(started, { type: 'END_MINIGAME' })
  assert.equal(started.phase, 'contest')
  assert.equal(started.money, 10)
  assert.equal(broke.phase, 'idle')
  assert.equal(ended.phase, 'idle')
})

test('Pokeathlon scores scale from zero to a hundred', () => {
  assert.equal(sprintScore(0), 0)
  assert.equal(sprintScore(60, POKEATHLON_SPRINT_MS), 100, '12 presses a second is perfect')
  assert.ok(sprintScore(30, POKEATHLON_SPRINT_MS) > 0)
  assert.equal(accuracyScore(0), 100, 'dead centre is perfect')
  assert.equal(accuracyScore(1), 0, 'the edge scores nothing')
  assert.ok(accuracyScore(0.25) > accuracyScore(0.75))
})

test('Pokeathlon medals pay by combined total', () => {
  const gold = pokeathlonPrize(300),
    silver = pokeathlonPrize(240),
    bronze = pokeathlonPrize(160),
    none = pokeathlonPrize(60)
  assert.equal(gold.tier, 'gold')
  assert.equal(silver.tier, 'silver')
  assert.equal(bronze.tier, 'bronze')
  assert.equal(none.tier, 'none')
  assert.ok(gold.money > silver.money && silver.money > bronze.money)
  assert.ok(gold.items.length > 0)
})

test('START_POKEATHLON charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: POKEATHLON_COST + 55 },
      { type: 'START_POKEATHLON' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: POKEATHLON_COST - 1 },
      { type: 'START_POKEATHLON' }
    ),
    ended = gameReducer(started, { type: 'END_MINIGAME' })
  assert.equal(started.phase, 'pokeathlon')
  assert.equal(started.money, 55)
  assert.equal(broke.phase, 'idle')
  assert.equal(ended.phase, 'idle')
})

test('a Voltorb board has the level\u2019s Voltorbs and consistent hints', () => {
  assert.equal(VOLTORB_SIZE, 5)
  for (const level of [1, 4, VOLTORB_MAX_LEVEL]) {
    const board = createVoltorbBoard(level),
      voltorbs = board.cells.filter((cell) => cell.kind === 'voltorb').length,
      { rows, cols } = boardHints(board)
    assert.equal(board.cells.length, VOLTORB_SIZE * VOLTORB_SIZE)
    assert.equal(voltorbs, voltorbCountForLevel(level))
    // Every board has at least one 2 and one 3, so the clear rule is reachable.
    assert.ok(board.cells.some((cell) => cell.kind === 'two'))
    assert.ok(board.cells.some((cell) => cell.kind === 'three'))
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

test('a level clears once every 2 and 3 is found, even with 1s hidden', () => {
  // A deterministic board: two point tiles, one 1 and the rest Voltorbs.
  /** @param {string} kind */
  const makeCell = (kind) => ({ kind, flipped: false, marked: false })
  const cells = Array.from({ length: VOLTORB_SIZE * VOLTORB_SIZE }, (_, index) =>
      makeCell(index === 0 ? 'two' : index === 1 ? 'three' : index === 2 ? 'one' : 'voltorb')
    ),
    board = { level: 1, cells }

  // Leaving even one 2 or 3 face down keeps the level open.
  const partial = flipVoltorbCell(board, 0)
  assert.ok(!boardCleared(partial), 'an unfound 2 or 3 keeps the level open')

  let cleared = flipVoltorbCell(partial, 1)
  assert.ok(boardCleared(cleared), 'finding every 2 and 3 clears the level')
  assert.equal(cleared.cells[2].flipped, false, 'the 1 can stay face down')
  assert.ok(voltorbBoardCoins(cleared) > 0, 'a cleared board banks coins')

  // A board with no point tiles is never "clear" (the generator prevents it).
  const noPoints = { level: 1, cells: cells.map((cell) => makeCell(cell.kind === 'two' || cell.kind === 'three' ? 'one' : cell.kind)) }
  assert.ok(!boardCleared(noPoints))
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

test('the Grand Auction House stocks the Lucky Egg and Amulet Coin', () => {
  const auctioned = new Set(
    AUCTION_LOTS.flatMap((lot) => lot.items.map((item) => item.itemId))
  )
  assert.ok(auctioned.has('luckyEgg'))
  assert.ok(auctioned.has('amuletCoin'))
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

test('a wide raise can win an auction before the rivals answer', () => {
  const lot = AUCTION_LOTS.find((candidate) => candidate.id === 'choiceSet')
  const one = placeAuctionBid(createAuction(lot, () => 0), 2)
  assert.ok(one.won, 'the biggest raise jumps past every opening ceiling')
  assert.equal(one.highest, 'player')
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

test('Lights Out toggles a cross and scrambles to a solvable board', () => {
  assert.equal(LIGHTS_OUT_SIZE, 4)
  const solved = Array(LIGHTS_OUT_SIZE * LIGHTS_OUT_SIZE).fill(true),
    toggled = toggleLights(solved, 0)
  assert.equal(toggled[0], false)
  assert.equal(toggled[1], false, 'the right neighbour flips')
  assert.equal(toggled[4], false, 'the below neighbour flips')
  assert.equal(toggled[5], true, 'the diagonal is untouched')
  const board = createLightsOut()
  assert.equal(board.length, LIGHTS_OUT_SIZE * LIGHTS_OUT_SIZE)
  assert.ok(!lightsSolved(board), 'a fresh board is scrambled')
  assert.ok(lightsSolved(Array(LIGHTS_OUT_SIZE * LIGHTS_OUT_SIZE).fill(true)))
  assert.ok(lightsOutPrize(4, true).money > lightsOutPrize(12, true).money)
  assert.ok(lightsOutPrize(12, true).money > lightsOutPrize(0, false).money)
})

test('START_LIGHTS_OUT charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: LIGHTS_OUT_COST + 5 },
      { type: 'START_LIGHTS_OUT' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: LIGHTS_OUT_COST - 1 },
      { type: 'START_LIGHTS_OUT' }
    )
  assert.equal(started.phase, 'lightsOut')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('curry scoring rewards a matching flavour and good timing', () => {
  assert.ok(CURRY_FLAVORS.includes(rollCurryRequest()))
  assert.ok(CURRY_INGREDIENTS.some((entry) => entry.flavor))
  assert.ok(CURRY_ZONE > 0 && CURRY_ZONE < 0.2, 'the countdown is offset by a tighter zone')
  assert.equal(curryScore(false, 0), 0)
  assert.equal(curryScore(false, 1), 70)
  assert.equal(curryScore(true, 1), 100)
  assert.ok(curryPrize(95).money > curryPrize(60).money)
  assert.ok(curryPrize(95).items.some((item) => item.itemId === 'curry'))
})

test('START_CURRY charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: CURRY_COST + 5 },
      { type: 'START_CURRY' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: CURRY_COST - 1 },
      { type: 'START_CURRY' }
    )
  assert.equal(started.phase, 'curry')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('Pokestar picks distinct shots with one best take each', () => {
  const shots = pickPokestarShots(POKESTAR_SHOT_COUNT)
  assert.equal(shots.length, POKESTAR_SHOT_COUNT)
  assert.equal(new Set(shots.map((shot) => shot.brief)).size, POKESTAR_SHOT_COUNT)
  for (const shot of shots) {
    assert.equal(shot.takes.length, 4)
    assert.ok(shot.takes.some((take) => take.score === 3), 'every shot has a best take')
  }
  assert.ok(pokestarPrize(9).money > pokestarPrize(3).money)
})

test('Pokestar shuffles the takes so the best is not always first', () => {
  const original = Math.random
  try {
    // A fixed roll makes the shuffle deterministic: the best take lands last.
    Math.random = () => 0
    const shots = pickPokestarShots(POKESTAR_SHOT_COUNT)
    for (const shot of shots) assert.equal(shot.takes[3].score, 3, 'the best take moved')
  } finally {
    Math.random = original
  }
  // Across many films the best take appears in more than one slot.
  const positions = new Set()
  for (let run = 0; run < 30; run++)
    for (const shot of pickPokestarShots(POKESTAR_SHOT_COUNT))
      positions.add(shot.takes.findIndex((take) => take.score === 3))
  assert.ok(positions.size > 1, 'the best take is not parked in one slot')
})

test('START_POKESTAR charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: POKESTAR_COST + 5 },
      { type: 'START_POKESTAR' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: POKESTAR_COST - 1 },
      { type: 'START_POKESTAR' }
    )
  assert.equal(started.phase, 'pokestar')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('a fresh match-3 board has no matches ready to clear', () => {
  assert.equal(MATCH3_SIZE, 8)
  for (let attempt = 0; attempt < 5; attempt++) {
    const board = createMatch3Board()
    assert.equal(board.length, MATCH3_SIZE * MATCH3_SIZE)
    assert.equal(findMatches(board).size, 0, 'no initial matches')
  }
})

test('findMatches spots horizontal and vertical runs', () => {
  const board = ['A', 'B', 'A', 'B', 'A', 'B', 'C', 'C', 'C']
  assert.deepEqual([...findMatches(board, 3)].sort(), [6, 7, 8])
  assert.equal(findMatches(createMatch3Board(4), 4).size, 0)
})

test('a swap only counts when it makes a match', () => {
  const board = ['A', 'B', 'A', 'B', 'A', 'C', 'D', 'E', 'C'],
    invalid = tryMatch3Swap(board, 0, 1, 3),
    valid = tryMatch3Swap(board, 1, 4, 3)
  assert.equal(invalid.valid, false)
  assert.equal(invalid.board, board, 'an invalid swap leaves the board untouched')
  assert.equal(valid.valid, true)
  assert.ok(valid.score > 0)
  assert.equal(findMatches(valid.board, 3).size, 0, 'the board settles with no matches left')
  assert.ok(match3Prize(1600).money > match3Prize(100).money)
})

test('match-3 swap frames settle to the same board as a plain swap', () => {
  const board = ['A', 'B', 'A', 'B', 'A', 'C', 'D', 'E', 'C'],
    originalRandom = Math.random
  // Both resolvers refill randomly, so pin the RNG (a seeded LCG, not a
  // constant, which could cascade forever) to compare their output.
  let seed = 1
  Math.random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  try {
    const animated = match3SwapFrames(board, 1, 4, 3)
    seed = 1
    const plain = tryMatch3Swap(board, 1, 4, 3)
    assert.equal(animated.valid, true)
    assert.ok(animated.frames.length >= 1, 'at least one cascade frame')
    assert.equal(animated.cascade, animated.frames.length)
    assert.equal(animated.score, plain.score)
    assert.deepEqual(animated.board, plain.board)
    assert.deepEqual(animated.frames[animated.frames.length - 1].board, plain.board)
    assert.equal(findMatches(animated.board, 3).size, 0)
  } finally {
    Math.random = originalRandom
  }

  const rejected = match3SwapFrames(board, 0, 1, 3)
  assert.equal(rejected.valid, false)
  assert.deepEqual(rejected.frames, [])
})

test('every match-3 tile type has a themed Pokemon face', () => {
  for (const type of MATCH3_TYPES) {
    assert.ok(MATCH3_SPECIES[type], `${type} needs a Pokemon face`)
    assert.ok(gameData.pokemonSpecies[MATCH3_SPECIES[type]], `${MATCH3_SPECIES[type]} exists`)
  }
})

test('START_PUZZLE_LEAGUE charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: MATCH3_COST + 5 },
      { type: 'START_PUZZLE_LEAGUE' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: MATCH3_COST - 1 },
      { type: 'START_PUZZLE_LEAGUE' }
    )
  assert.equal(started.phase, 'puzzleLeague')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('a memory deck holds every pair exactly twice', () => {
  const deck = createMemoryDeck(MEMORY_PAIRS)
  assert.equal(deck.length, MEMORY_PAIRS * 2)
  const counts = new Map()
  for (const speciesKey of deck) counts.set(speciesKey, (counts.get(speciesKey) ?? 0) + 1)
  assert.equal(counts.size, MEMORY_PAIRS)
  for (const count of counts.values()) assert.equal(count, 2)
  assert.ok(memoryPrize(MEMORY_PAIRS).money > memoryPrize(MEMORY_PAIRS + 12).money)
})

test('START_MEMORY charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: MEMORY_COST + 5 },
      { type: 'START_MEMORY' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: MEMORY_COST - 1 },
      { type: 'START_MEMORY' }
    )
  assert.equal(started.phase, 'memory')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('whack targets roll and pay by score', () => {
  for (let roll = 0; roll < 40; roll++) {
    const target = rollWhackTarget()
    assert.ok(['diglett', 'dugtrio', 'zubat'].includes(target.kind))
    assert.equal(typeof target.points, 'number')
  }
  assert.ok(whackPrize(35).money > whackPrize(5).money)
  // Dugtrio is a rarer jackpot worth more, and the round speeds up over time.
  const dugtrio = WHACK_TARGETS.find((target) => target.kind === 'dugtrio')
  assert.ok(dugtrio.points > 1)
  assert.ok(whackPopupMs(0) > whackPopupMs(WHACK_DURATION_MS), 'targets get faster')
  assert.equal(whackPopupMs(WHACK_DURATION_MS), WHACK_POP_MIN_MS)
})

test('the Game Corner prize track hands out a prize Pokemon', () => {
  const started = gameReducer(
    { ...initialGameState, phase: 'idle', money: 10000 },
    { type: 'START_GAME_CORNER' }
  )
  assert.equal(started.phase, 'gameCorner')
  let state = started
  for (let i = 0; i < GAME_CORNER_PRIZE_GOAL - 1; i++)
    state = gameReducer(state, { type: 'RECORD_GAME_CORNER_WIN', payload: { lines: 1 } })
  assert.equal(state.gameCornerProgress, GAME_CORNER_PRIZE_GOAL - 1, 'no prize before it fills')
  assert.equal([...state.party, ...state.box].length, [...started.party, ...started.box].length)

  // The completing line resets the track and gifts a prize.
  state = gameReducer(state, { type: 'RECORD_GAME_CORNER_WIN', payload: { lines: 1 } })
  assert.equal(state.gameCornerProgress, 0)
  const prize = [...state.party, ...state.box].find((member) =>
    GAME_CORNER_PRIZE_POOL.some((entry) => entry.speciesKey === member.speciesKey)
  )
  assert.ok(prize, 'a prize Pokemon joins the squad')
  assert.ok(state.pokedexCaught.includes(prize.speciesKey))
})

test('START_WHACK charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: WHACK_COST + 5 },
      { type: 'START_WHACK' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: WHACK_COST - 1 },
      { type: 'START_WHACK' }
    )
  assert.equal(started.phase, 'whack')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('a Musical routine is playable and judged by timing', () => {
  const pattern = generateMusicalPattern(MUSICAL_NOTES)
  assert.equal(pattern.length, MUSICAL_NOTES)
  assert.ok(musicalTotalMs(pattern) > pattern[pattern.length - 1].time)
  for (let index = 1; index < pattern.length; index++)
    assert.notEqual(pattern[index].lane, pattern[index - 1].lane, 'no immediate repeats')
  for (const note of pattern) assert.ok(note.lane >= 0 && note.lane < 4)
  assert.equal(judgeMusicalHit(0).grade, 'perfect')
  assert.equal(judgeMusicalHit(0).points, 100)
  assert.ok(judgeMusicalHit(120).points < judgeMusicalHit(20).points)
  assert.equal(judgeMusicalHit(9999).grade, 'miss')
  assert.ok(musicalPrize(MUSICAL_MAX_SCORE).money > musicalPrize(0).money)
})

test('START_MUSICAL charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: MUSICAL_COST + 5 },
      { type: 'START_MUSICAL' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: MUSICAL_COST - 1 },
      { type: 'START_MUSICAL' }
    )
  assert.equal(started.phase, 'musical')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('a sandwich can turn out any of its three fillings', () => {
  assert.equal(PICNIC_INGREDIENTS.length, 18)
  for (const ingredient of PICNIC_INGREDIENTS) {
    assert.ok(ingredient.type, `${ingredient.id} has a type`)
    assert.equal(ingredientById(ingredient.id)?.name, ingredient.name)
    assert.equal(ingredientById(ingredient.id)?.type, ingredient.type)
  }
  assert.deepEqual(sandwichTypes(['lettuce', 'popcorn', 'egg']), ['Grass', 'Flying', 'Normal'])
  // The reward is a random one of the picks, so every pick matters.
  assert.equal(rollSandwichType(['lettuce', 'popcorn', 'egg'], () => 0), 'Grass')
  assert.equal(rollSandwichType(['lettuce', 'popcorn', 'egg'], () => 0.5), 'Flying')
  assert.equal(rollSandwichType(['lettuce', 'popcorn', 'egg'], () => 0.999), 'Normal')
  assert.equal(rollSandwichType([], () => 0), null)
})

test('picnic drops score by accuracy and topple off the edge', () => {
  assert.equal(picnicDropScore(0).grade, 'perfect')
  assert.equal(picnicDropScore(0).points, 100)
  assert.ok(picnicDropScore(0).points > picnicDropScore(0.15).points)
  assert.equal(picnicDropScore(0.5).topple, true)
})

test('a picnic sandwich lures a wild Pokemon of its type', () => {
  const types = new Set(PICNIC_INGREDIENTS.map((ingredient) => ingredient.type))
  assert.equal(types.size, 18, 'every type has a filling')
  for (const type of types)
    assert.ok(picnicSpeciesPool(type, 'paldea').length > 0, `Paldea has a ${type} species`)
  const encounter = rollPicnicEncounter('Grass', 'paldea', 20, () => 0)
  assert.ok(encounter, 'a sandwich finds something')
  assert.equal(encounter.level, 20)
  assert.ok(gameData.pokemonSpecies[encounter.speciesKey].types.includes('Grass'))
  assert.equal(PICNIC_SHINY_MULTIPLIER, 3, 'picnic spawns are 3x shiny')
})

test('START_PICNIC charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: PICNIC_COST + 5 },
      { type: 'START_PICNIC' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: PICNIC_COST - 1 },
      { type: 'START_PICNIC' }
    )
  assert.equal(started.phase, 'picnic')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('the factory puzzle is solvable and rotating links the line', () => {
  const puzzle = createFactoryPuzzle(FACTORY_SIZE)
  assert.equal(puzzle.tiles.length, FACTORY_SIZE * FACTORY_SIZE)
  assert.equal(puzzle.size, FACTORY_SIZE)
  assert.ok(!factorySolved(puzzle), 'a fresh puzzle is scrambled')
  const solved = puzzle.tiles.reduce((current, tile, index) => {
    const target = puzzle.solution[index]
    let next = current
    for (let step = 0; step < 4 && next.tiles[index].rot % 4 !== target % 4; step++)
      next = rotateFactoryTile(next, index)
    return next
  }, puzzle)
  assert.ok(factorySolved(solved), 'the stored solution solves it')
  assert.ok(factoryPowered(solved).size >= 2)
  assert.deepEqual(connectionsFor('straight', 0).slice().sort(), ['N', 'S'])
  assert.deepEqual(connectionsFor('straight', 1).slice().sort(), ['E', 'W'])
  assert.ok(factoryPrize(3, true).items.length > 0)
  assert.equal(factoryPrize(3, true).money, 0, 'the factory pays balls, not money')
})

test('the factory pays out special balls, more for a cleaner shift', () => {
  const count = (/** @type {ReturnType<typeof factoryPrize>} */ prize) =>
    prize.items.reduce((sum, item) => sum + item.quantity, 0)
  const flawless = factoryPrize(3, true, () => 0),
    cleared = factoryPrize(10, true, () => 0),
    patched = factoryPrize(30, true, () => 0),
    failed = factoryPrize(30, false, () => 0)
  assert.ok(count(flawless) > count(cleared))
  assert.ok(count(cleared) > count(patched))
  assert.ok(count(flawless) >= 8, 'a flawless shift pays a healthy batch')
  assert.ok(count(patched) >= 3, 'even a slow clear pays a few balls')
  assert.equal(count(failed), 0, 'a jammed line pays no balls')
  for (const ballId of ['pokeball', 'greatball', 'ultraball', 'premierball', 'masterball'])
    assert.ok(!FACTORY_BALL_POOL.includes(ballId), `${ballId} is not a factory reward`)
  for (const prize of [flawless, cleared, patched])
    for (const item of prize.items) {
      assert.ok(FACTORY_BALL_POOL.includes(item.itemId), `${item.itemId} is a factory ball`)
      assert.notEqual(
        rewardItemName(item.itemId),
        item.itemId,
        'the reward uses the ball\u2019s display name'
      )
    }
  // A fixed roll draws the first pool entry and merges the duplicates.
  const batch = rollFactoryBalls(3, () => 0)
  assert.deepEqual(batch, [{ itemId: FACTORY_BALL_POOL[0], quantity: 3 }])
})

test('START_POKEBALL_FACTORY charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: POKEBALL_FACTORY_COST + 5 },
      { type: 'START_POKEBALL_FACTORY' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: POKEBALL_FACTORY_COST - 1 },
      { type: 'START_POKEBALL_FACTORY' }
    )
  assert.equal(started.phase, 'pokeballFactory')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('the Ruins puzzle scrambles from the solved board and slides back', () => {
  const solved = solvedSlidingBoard(SLIDING_SIZE)
  assert.deepEqual(solved, [1, 2, 3, 4, 5, 6, 7, 8, 0])
  assert.ok(isSlidingSolved(solved))
  assert.equal(canSlide(solved, 7), true, 'the tile left of the blank can move')
  assert.equal(canSlide(solved, 0), false, 'a corner tile cannot')
  assert.deepEqual(slideTile([1, 2, 3, 4, 5, 6, 7, 8, 0], 7), [1, 2, 3, 4, 5, 6, 7, 0, 8])
  assert.deepEqual(
    slideTile([1, 2, 3, 4, 5, 6, 7, 8, 0], 0),
    [1, 2, 3, 4, 5, 6, 7, 8, 0],
    'an illegal slide leaves the board alone'
  )
  assert.equal(slidingTileForDirection([1, 2, 3, 4, 5, 6, 7, 8, 0], 'W'), 7)
  assert.equal(slidingTileForDirection([1, 2, 3, 4, 5, 6, 7, 8, 0], 'N'), 5)
  assert.equal(slidingTileForDirection([1, 2, 3, 4, 5, 6, 7, 8, 0], 'E'), null)
  assert.equal(slidingTileForDirection([1, 2, 3, 4, 5, 6, 7, 8, 0], 'S'), null)

  const puzzle = createSlidingPuzzle(SLIDING_SIZE)
  assert.equal(puzzle.length, SLIDING_SIZE * SLIDING_SIZE)
  assert.ok(!isSlidingSolved(puzzle), 'a fresh puzzle is scrambled')
  assert.deepEqual([...puzzle].sort((a, b) => a - b), [...solvedSlidingBoard(SLIDING_SIZE)].sort((a, b) => a - b))
  assert.ok(slidingPrize(10, true).money > slidingPrize(60, true).money)
  assert.equal(slidingPrize(10, false).money < slidingPrize(60, true).money, true)
})

test('START_RUINS_PUZZLE charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: SLIDING_COST + 5 },
      { type: 'START_RUINS_PUZZLE' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: SLIDING_COST - 1 },
      { type: 'START_RUINS_PUZZLE' }
    )
  assert.equal(started.phase, 'ruinsPuzzle')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('the Ruins puzzle awards a random missing Unown form', () => {
  assert.equal(UNOWN_FORMS.length, 28)
  for (const key of UNOWN_FORMS) assert.ok(gameData.pokemonSpecies[key], `${key} is a real species`)
  assert.equal(UNOWN_FORMS[0], 'unown')
  const caught = ['unown', 'unown-b', 'unown-c']
  // Never a caught form while any remain, and not always the same one.
  const picks = new Set()
  for (let roll = 0; roll < 200; roll++) {
    const picked = randomUnownForm(caught)
    assert.ok(UNOWN_FORMS.includes(picked) && !caught.includes(picked))
    picks.add(picked)
  }
  assert.ok(picks.size > 1, 'the pick is random, not sequential')
  // A stubbed RNG picks from the missing pool by index.
  assert.equal(randomUnownForm(['unown', 'unown-b'], () => 0), 'unown-c')
  assert.equal(randomUnownForm(['unown', 'unown-c'], () => 0), 'unown-b')
  // Once the set is complete, any form can repeat.
  const repeat = randomUnownForm(UNOWN_FORMS, () => 0)
  assert.ok(UNOWN_FORMS.includes(repeat))
})

test('CLAIM_MINIGAME_REWARD can hand over a fixed Pokemon', () => {
  const claimed = gameReducer(
    { ...initialGameState, party: [], box: [], pokedexCaught: [] },
    {
      type: 'CLAIM_MINIGAME_REWARD',
      payload: { money: 0, items: [], pokemon: { speciesKey: 'unown-c', level: 5 } },
    }
  )
  assert.ok(claimed.pokedexCaught.includes('unown-c'), 'the form is registered as caught')
  const owned = [...claimed.party, ...claimed.box].find((mon) => mon.speciesKey === 'unown-c')
  assert.ok(owned, 'the Unown joins the party or box')
  assert.equal(owned.level, 5)
})

test('every ice room has a finite par and its exit lands', () => {
  assert.ok(ICE_SLIDE_ROOMS.length >= 6, 'the pool is wider than a single run')
  assert.ok(ICE_SLIDE_TOTAL_PAR > 0)
  for (const room of ICE_SLIDE_ROOMS) {
    assert.ok(Number.isFinite(room.par) && room.par > 0, 'each room is solvable')
    assert.notEqual(room.start, room.goal)
    // A wall always stops a slide in each of the four directions.
    for (const direction of ['N', 'E', 'S', 'W']) {
      const landing = iceSlidePosition(room, room.start, direction)
      assert.ok(landing >= 0 && landing < room.width * room.height)
      assert.notEqual(room.rows[Math.floor(landing / room.width)][landing % room.width], '#')
    }
  }
})

test('ice slides stop at walls and boulders and never overshoot the exit', () => {
  const room = ICE_SLIDE_ROOMS[0]
  // From the start, sliding east stops against the wall before the exit row.
  const east = iceSlidePosition(room, room.start, 'E')
  assert.notEqual(east, room.start)
  assert.equal(iceSlidePosition(room, east, 'E'), east, 'a wall blocks further travel')
  assert.equal(iceSlideSolved(room, room.goal), true)
  assert.equal(iceSlideSolved(room, room.start), false)
  // A slide that reaches the exit lands on it rather than sliding past.
  const crossing = iceSlidePosition(room, east, 'S')
  assert.equal(room.rows[Math.floor(crossing / room.width)][crossing % room.width], 'E')
  assert.ok(iceSlidePrize(4, ICE_SLIDE_TOTAL_PAR, ICE_SLIDE_TOTAL_PAR, true).money > iceSlidePrize(4, ICE_SLIDE_TOTAL_PAR + 10, ICE_SLIDE_TOTAL_PAR, true).money)
  assert.equal(iceSlidePrize(0, 0, 0, false).money > 0, true)
})

test('a Strength room is solvable and its par route reaches the exit', () => {
  assert.ok(STRENGTH_ROOMS.length > 0)
  assert.ok(STRENGTH_TOTAL_PAR > 0)
  for (const level of STRENGTH_ROOMS) {
    assert.ok(level.blockStarts.length > 0, 'the room has a boulder')
    assert.ok(level.plates.size > 0, 'the room has a plate')
    assert.ok(Number.isFinite(level.par), 'the room is solvable')
    assert.equal(strengthSolved(level, createStrengthState(level)), false)
  }
})

test('pushing the boulder onto the plate unseals the exit', () => {
  const level = STRENGTH_ROOMS[0]
  // S(1,1) -> right, push down onto the plate, then walk to the exit.
  const route = ['E', 'S', 'E', 'E', 'E', 'S', 'S']
  let state = createStrengthState(level)
  for (const direction of route) {
    const moved = strengthMove(level, state, direction)
    assert.ok(moved, `the ${direction} move is legal`)
    state = moved
  }
  assert.ok(strengthSolved(level, state), 'the route solves the room')
  assert.equal(level.par, route.length, 'the par is the shortest route')
})

test('the exit stays sealed until the boulder is on the plate', () => {
  const level = STRENGTH_ROOMS[0]
  // Walk to the cell above the exit without touching the boulder.
  let state = createStrengthState(level)
  for (const direction of ['E', 'E', 'E', 'E', 'S', 'S', 'S'])
    state = strengthMove(level, state, direction) ?? state
  assert.equal(strengthMove(level, state, 'S'), null, 'the sealed exit cannot be entered')
})

test('a temple run rolls a fair, varied set of rooms', () => {
  // A deterministic RNG keeps the roll reproducible.
  let seed = 1
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  const run = buildIceTempleStages(random)
  assert.equal(run.stages.length, ICE_TEMPLE_STRENGTH_STAGES + ICE_TEMPLE_ICE_STAGES)
  assert.equal(run.strengthRooms.length, ICE_TEMPLE_STRENGTH_STAGES)
  assert.equal(run.iceRooms.length, ICE_TEMPLE_ICE_STAGES)
  assert.equal(new Set(run.strengthRooms).size, ICE_TEMPLE_STRENGTH_STAGES, 'strength rooms are distinct')
  assert.equal(new Set(run.iceRooms).size, ICE_TEMPLE_ICE_STAGES, 'ice rooms are distinct')
  assert.equal(run.stages[0].mode, 'strength')
  assert.equal(run.stages[run.stages.length - 1].mode, 'ice')
  const expectedPar =
    run.strengthRooms.reduce((sum, room) => sum + room.par, 0) +
    run.iceRooms.reduce((sum, room) => sum + room.par, 0)
  assert.equal(run.par, expectedPar)
  assert.ok(Number.isFinite(run.par) && run.par > 0)
  for (const room of run.iceRooms) assert.ok(isIceRoomFair(room), 'every drawn room is fair')
  // Repeated visits roll different rooms.
  const rolls = new Set(
    Array.from({ length: 10 }, () => buildIceTempleStages(random).iceRooms.map((room) => room.par).join(','))
  )
  assert.ok(rolls.size > 1, 'runs vary')
})

test('hand-designed rooms are fair and a known trap room is not', () => {
  for (const room of ICE_SLIDE_ROOMS) assert.ok(isIceRoomFair(room), 'a curated room is fair')
  // This room is solvable from the start, but some slide can strand the hero
  // where the exit is unreachable.
  const trap = parseIceLevel([
    '#######',
    '#....##',
    '##..#.#',
    '#....##',
    '#..#..#',
    '#S.#.E#',
    '#######',
  ])
  assert.ok(Number.isFinite(trap.par), 'the trap room is still solvable from the start')
  assert.equal(isIceRoomFair(trap), false)
})

test('the procedural generator emits fair, seeded, solvable rooms', () => {
  const first = generateIceRoom(mulberry32(1234)),
    second = generateIceRoom(mulberry32(1234))
  assert.ok(first, 'the generator finds a room')
  assert.deepEqual(first.rows, second.rows, 'the same seed rolls the same room')
  assert.ok(Number.isFinite(first.par) && first.par >= ICE_GENERATOR_MIN_PAR)
  assert.ok(isIceRoomFair(first))
  assert.notEqual(first.start, first.goal)
  // A run of seeds all produce fair rooms.
  for (let seed = 1; seed <= 25; seed++) {
    const room = generateIceRoom(mulberry32(seed))
    assert.ok(room && isIceRoomFair(room), `seed ${seed} yields a fair room`)
  }
})

test('the temple ice pool mixes curated and generated rooms', () => {
  const pool = buildIceTempleRoomPool(mulberry32(42))
  assert.ok(pool.length > ICE_SLIDE_ROOMS.length, 'at least one room was generated')
  assert.equal(new Set(pool.map((room) => room.rows.join('\n'))).size, pool.length, 'the pool is de-duplicated')
  for (const room of pool) assert.ok(isIceRoomFair(room))
})

test('Sinnoh prestige lengthens temple runs, but not without bound', () => {
  const base = iceTempleRunSize(0)
  assert.equal(base.iceStages, ICE_TEMPLE_ICE_STAGES)
  assert.equal(base.strengthStages, ICE_TEMPLE_STRENGTH_STAGES)
  assert.ok(iceTempleRunSize(1).iceStages > base.iceStages, 'prestige adds a room')
  assert.equal(
    iceTempleRunSize(99).iceStages,
    ICE_TEMPLE_ICE_STAGES + ICE_TEMPLE_PRESTIGE_MAX,
    'the bonus is capped'
  )
})

test('START_ICE_SLIDE charges entry and END_MINIGAME returns to idle', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: ICE_SLIDE_COST + 5 },
      { type: 'START_ICE_SLIDE' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: ICE_SLIDE_COST - 1 },
      { type: 'START_ICE_SLIDE' }
    )
  assert.equal(started.phase, 'iceSlide')
  assert.equal(started.money, 5)
  assert.equal(broke.phase, 'idle')
  assert.equal(gameReducer(started, { type: 'END_MINIGAME' }).phase, 'idle')
})

test('END_MINIGAME closes every registered minigame phase', () => {
  // Every scene phase in the registry ends through END_MINIGAME, except the
  // Bug-Catching Contest and Safari Zone, which have their own end actions.
  for (const [minigameId, phase] of Object.entries(MINIGAME_PHASES)) {
    if (minigameId === 'bugContest' || minigameId === 'safari') continue
    const state = { ...initialGameState, phase },
      next = gameReducer(state, {
        type: 'END_MINIGAME',
        payload: { minigame: minigameId, score: 5, completed: true },
      })
    assert.equal(next.phase, 'idle', `${minigameId} ends and returns to idle`)
    assert.equal(
      next.minigameRecords[minigameId].completed,
      true,
      `${minigameId} records its result`
    )
  }
  // The two special phases ignore END_MINIGAME (they use END_BUG_CONTEST /
  // END_SAFARI).
  for (const phase of ['bugCatching', 'safari']) {
    const state = { ...initialGameState, phase }
    assert.equal(
      gameReducer(state, { type: 'END_MINIGAME', payload: { minigame: 'x', score: 1 } }),
      state
    )
  }
})

test('every minigame is linked to a real area in its own region', () => {
  const expectedRegions = {
    gameCorner: 'kanto',
    championGauntlet: 'kanto',
    bugContest: 'johto',
    mining: 'sinnoh',
    safari: 'kanto',
    academyQuiz: 'paldea',
    voltorbFlip: 'unova',
    auctionHouse: 'kalos',
    contest: 'hoenn',
    pokeathlon: 'johto',
    pokeRadar: 'sinnoh',
    battleRoyal: 'alola',
    doubles: 'kalos',
    dynamaxAdventures: 'galar',
    lightsOut: 'hoenn',
    curry: 'galar',
    pokestar: 'unova',
    puzzleLeague: 'johto',
    memory: 'hoenn',
    whack: 'kanto',
    musical: 'unova',
    picnic: 'paldea',
    pokeballFactory: 'kalos',
    ruinsPuzzle: 'johto',
    iceSlide: 'sinnoh',
    pokePelago: 'alola',
    mantineSurf: 'alola',
    rotomRally: 'galar',
    ogreOustin: 'paldea',
    typeFusion: 'unova',
    unownPicross: 'sinnoh',
    pokeshot: 'kalos',
    teraRaid: 'paldea',
    pokeword: 'unova',
    berryBlender: 'sinnoh',
    ultraWarp: 'alola',
  }
  // Every catalogued minigame has exactly one home area, and vice versa: no
  // orphaned info entries and no locations pointing at missing metadata.
  for (const minigameId of Object.keys(MINIGAME_INFO)) {
    assert.ok(MINIGAME_AREAS[minigameId], `${minigameId} has no home area`)
    assert.equal(MINIGAME_REGIONS[minigameId], expectedRegions[minigameId], `${minigameId} region`)
  }
  for (const minigameId of Object.values(MINIGAME_LOCATIONS))
    assert.ok(MINIGAME_INFO[minigameId], `${minigameId} has no panel info`)

  for (const [locationId, minigameId] of Object.entries(MINIGAME_LOCATIONS)) {
    const location = gameData.mapData[locationId]
    assert.ok(location, `${locationId} is a real area`)
    assert.ok(!location.hidden, `${minigameId} is on a visible area`)
    assert.equal(MINIGAME_REGIONS[minigameId], location.region ?? 'kanto')
    assert.equal(minigameForLocation(locationId), minigameId)
    assert.equal(minigameNameForLocation(locationId), MINIGAME_INFO[minigameId].title)
    if (minigameId !== 'pokePelago')
      assert.ok(MINIGAME_START_ACTION[minigameId], `${minigameId} has a start action`)
  }
  assert.equal(minigameNameForLocation('route1'), null, 'a plain route hosts no minigame')
})

test('minigamesInRegion groups them by region', () => {
  assert.deepEqual(minigamesInRegion('kanto').sort(), ['championGauntlet', 'gameCorner', 'safari', 'whack'])
  assert.deepEqual(minigamesInRegion('johto').sort(), ['bugContest', 'pokeathlon', 'puzzleLeague', 'ruinsPuzzle'])
  assert.ok(minigamesInRegion('hoenn').includes('contest'))
  assert.deepEqual(minigamesInRegion('alola').sort(), ['battleRoyal', 'mantineSurf', 'pokePelago', 'ultraWarp'])
  assert.deepEqual(minigamesInRegion('galar').sort(), ['curry', 'dynamaxAdventures', 'rotomRally'])
  assert.deepEqual(minigamesInRegion('paldea').sort(), ['academyQuiz', 'ogreOustin', 'picnic', 'teraRaid'])
  assert.deepEqual(minigamesInRegion('sinnoh').sort(), ['berryBlender', 'iceSlide', 'mining', 'pokeRadar', 'unownPicross'])
  assert.deepEqual(minigamesInRegion('unova').sort(), ['musical', 'pokestar', 'pokeword', 'typeFusion', 'voltorbFlip'])
  assert.deepEqual(minigamesInRegion('kalos').sort(), ['auctionHouse', 'doubles', 'pokeballFactory', 'pokeshot'])
  assert.deepEqual(minigamesInRegion('nope'), [])
})

test('type fusion slides, merges and ends when stuck', () => {
  const start = createTypeFusionBoard()
  assert.equal(
    start.flat().filter((value) => value > 0).length,
    2,
    'a fresh board has two tiles'
  )
  const board = [
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    result = slideTypeFusion(board, 'left')
  assert.deepEqual(result.board[0], [2, 0, 0, 0])
  assert.equal(result.gained, 4, 'merging two Normals scores the 4-value tile')
  assert.equal(result.moved, true)
  assert.equal(slideTypeFusion(board, 'up').moved, false, 'nothing to slide up')
  assert.equal(typeFusionLabel(1), 'Normal')
  assert.equal(
    typeFusionCanMove([
      [1, 2, 1, 2],
      [3, 4, 3, 4],
      [1, 2, 1, 2],
      [3, 4, 3, 4],
    ]),
    false,
    'a packed board with no equal neighbours cannot move'
  )
  assert.ok(typeFusionPrize(6000).money > typeFusionPrize(0).money)
  assert.equal(TYPE_FUSION_SIZE, 4)
  assert.ok(TYPE_FUSION_MOVES >= 60, 'a run is long enough to reach the top prize tiers')
})

test('picross clues, matching and scoring behave', () => {
  assert.deepEqual(picrossClues([1, 1, 0, 1, 1]), [2, 2])
  assert.deepEqual(picrossClues([0, 0, 0, 0, 0]), [0])
  const puzzle = createPicrossPuzzle()
  assert.equal(puzzle.rowClues.length, puzzle.solution.length)
  assert.equal(puzzle.colClues.length, puzzle.solution.length)
  assert.equal(picrossMatches(puzzle.solution, puzzle.solution), true)
  assert.equal(
    picrossMatches(
      puzzle.solution.map((row) => row.map(() => 0)),
      puzzle.solution
    ),
    false
  )
  assert.equal(picrossWrongFills(puzzle.solution, puzzle.solution), 0)
  const empty = puzzle.solution.map((row) => row.map(() => 0))
  assert.equal(picrossWrongFills(empty, puzzle.solution), 0)
  assert.ok(picrossScore(0, 0) > picrossScore(3, 30000))
  assert.ok(picrossPrize(90).money > picrossPrize(0).money)
})

test('pokeshot framing scores centred, rare and shiny shots higher', () => {
  assert.equal(pokeshotShotScore(0), 3)
  assert.equal(pokeshotShotScore(POKESHOT_FRAME * 0.3), 3)
  assert.equal(pokeshotShotScore(POKESHOT_FRAME * 0.8), 2)
  assert.equal(pokeshotShotScore(1), 0)
  assert.equal(pokeshotShotPoints(0, 1, false), 3)
  assert.equal(pokeshotShotPoints(0, 3, false), 9)
  assert.equal(pokeshotShotPoints(0, 3, true), 36, 'shinies are worth quadruple')
  const target = rollPokeshotTarget()
  assert.ok(target.speciesKey && target.stars >= 1 && target.stars <= 3)
  assert.ok(pokeshotPrize(120).money > pokeshotPrize(0).money)
})

test('tera raid bosses, HP inflation and payouts scale with stars', () => {
  const info = teraRaidBoss(50)
  assert.ok(info.speciesKey && info.name, 'a boss has a species')
  assert.ok(info.stars >= 1 && info.stars <= 5)
  assert.ok(TERA_TYPES.includes(info.teraType), `${info.teraType} is a real type`)
  assert.ok(teraRaidHpMultiplier(5) > teraRaidHpMultiplier(1))
  assert.equal(teraRaidScore(5, true), 5)
  assert.equal(teraRaidScore(5, false), 4)
  const prize = teraRaidPrize(5, true, info.speciesKey, info.level)
  assert.equal(prize.pokemon.speciesKey, info.speciesKey)
  assert.equal(teraRaidPrize(3, false).pokemon, null, 'a failed raid catches nothing')
  const boss = createTeraRaidBoss({ speciesKey: 'magikarp', level: 50, stars: 5 }),
    plain = createOpponent('magikarp', 50)
  assert.ok(boss.maxHp > plain.maxHp, 'raid bosses have inflated HP')
})

test('tera raid bosses can be any encounterable Pokemon, tiered by base stats', () => {
  assert.ok(TERA_RAID_POOL.length > 500, 'the pool covers the national dex')
  assert.ok(TERA_RAID_POOL.includes('magikarp'), 'weak route finds are raid bosses')
  assert.ok(TERA_RAID_POOL.includes('mewtwo'), 'legendaries are still in the pool')
  assert.ok(TERA_RAID_POOL.includes('garchomp'), 'ordinary final evolutions are too')
  assert.equal(teraRaidStars('magikarp'), 1, 'a 200-BST fish is a one-star raid')
  assert.equal(teraRaidStars('pikachu'), 1)
  assert.equal(teraRaidStars('charizard'), 2)
  assert.equal(teraRaidStars('garchomp'), 5, 'a 600-BST ace is five-star')
  assert.equal(teraRaidStars('mewtwo'), 5)
})

test('simulateTeraRaid resolves a whole party against one boss', () => {
  const winBoss = createOpponent('magikarp', 5),
    win = simulateTeraRaid([createOpponent('mewtwo', 100)], winBoss)
  assert.equal(win.won, true, 'a maxed squad breaks a weak crystal')
  const loseBoss = createOpponent('mewtwo', 100),
    lose = simulateTeraRaid([createOpponent('magikarp', 5)], loseBoss)
  assert.equal(lose.won, false, 'a lone weakling cannot')
})

test('pokeword scrambles a name and checks the spelling', () => {
  const letters = scrambleLetters('Pikachu')
  assert.equal(letters.length, 7)
  assert.deepEqual([...letters].sort(), ['A', 'C', 'H', 'I', 'K', 'P', 'U'])
  assert.notEqual(letters.join(''), 'PIKACHU', 'the letters are actually scrambled')
  const challenge = rollPokewordChallenge()
  assert.equal(challenge.letters.length, challenge.name.replace(/[^A-Za-z]/g, '').length)
  assert.equal(pokewordMatches('pikachu', 'Pikachu'), true)
  assert.equal(pokewordMatches('pikachuu', 'Pikachu'), false)
  assert.ok(pokewordPrize(POKEWORD_ROUNDS).money > pokewordPrize(0).money)
})

test('berry blender sweet spot sweeps and scores by time in the zone', () => {
  assert.equal(blenderSweetSpot(0).center, 0.5)
  assert.ok(blenderInZone(0.5, blenderSweetSpot(0)))
  assert.ok(!blenderInZone(0, blenderSweetSpot(0)))
  assert.equal(blenderScore(0.5), 50)
  assert.equal(blenderScore(2), 100)
  assert.equal(blenderScore(-1), 0)
  assert.ok(blenderPrize(90).money > blenderPrize(0).money)
  assert.ok(BERRY_BLENDER_MS > 0)
  assert.ok(
    BERRY_BLENDER_TAP * 6 > BERRY_BLENDER_DECAY * (1000 / BERRY_BLENDER_TICK_MS),
    'a comfortable six-tap-a-second rhythm out-paces the drain'
  )
})

test('mantine surf zones stay on the face and narrow with the waves', () => {
  for (let wave = 0; wave < MANTINE_SURF_WAVES; wave++) {
    const zone = surfWaveZone(wave)
    assert.ok(zone.center - zone.halfWidth >= 0, 'swell stays on the face')
    assert.ok(zone.center + zone.halfWidth <= 1, 'swell stays on the face')
    if (wave > 0) assert.ok(zone.halfWidth < surfWaveZone(wave - 1).halfWidth, 'narrows each wave')
  }
  assert.equal(surfWaveScore(0.5, { center: 0.5, halfWidth: 0.2 }), 3)
  assert.equal(surfWaveScore(0.65, { center: 0.5, halfWidth: 0.2 }), 2)
  assert.equal(surfWaveScore(0.95, { center: 0.5, halfWidth: 0.2 }), 0)
  assert.ok(surfMarkerPosition(0) === 0)
  assert.ok(surfMarkerPosition(MANTINE_SURF_WAVES * 1000) >= 0)
  assert.ok(surfMarkerPosition(MANTINE_SURF_WAVES * 1000) <= 1)
  assert.equal(mantineSurfPrize(MANTINE_SURF_MAX_SCORE).money > mantineSurfPrize(0).money, true)
})

test('rotom rally scores distance, time and stalls, and pays out', () => {
  assert.ok(rotomRallyScore(ROTOM_RALLY_DISTANCE, 0, 0) > rotomRallyScore(ROTOM_RALLY_DISTANCE, 15000, 0))
  assert.ok(rotomRallyScore(ROTOM_RALLY_DISTANCE, 0, 0) > rotomRallyScore(ROTOM_RALLY_DISTANCE, 0, 2))
  assert.equal(rotomRallyScore(0, 999999, 0), 0)
  assert.ok(rotomRallyPrize(130).money > rotomRallyPrize(0).money)
})

test('ogre oustin drops are real and speed up over the round', () => {
  const kinds = new Set()
  for (let roll = 0; roll < 200; roll++) kinds.add(rollOgreDrop().kind)
  for (const kind of kinds) assert.ok(OGRE_OUSTIN_LANES > 0 && ['berry', 'gold', 'rock'].includes(kind))
  assert.ok(ogreFallMs(0) > ogreFallMs(999999), 'drops fall faster late')
  assert.ok(ogreSpawnMs(0) > ogreSpawnMs(999999), 'drops spawn faster late')
  assert.ok(ogreOustinPrize(30).money > ogreOustinPrize(0).money)
})
