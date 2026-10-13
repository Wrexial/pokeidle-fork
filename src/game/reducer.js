// The game state machine: initial state plus a thin action dispatcher. The
// per-action handlers live in game/reducer/*.js.

import { defaultCatchSettings } from '../data/config.js'
import { DEFAULT_AUTO_BATTLE_POLICY } from './auto-battle-policy.js'
import { emptyBattleHazards } from './hazards.js'
import { createCompanionCare } from './companion.js'
import { createGarden } from './garden.js'
import { createPelago } from './pelago.js'
import { createSecretBase } from './secret-base.js'
import { createJobs } from './jobs.js'
import { createPokewalker } from './pokewalker.js'
import { DEFAULT_ROD } from './minigames.js'
import { applyExp, applySharedExp, attemptActivityCatch, bossBattleEnd, choosePlayerMove, completeMasterBall, consumeEvent, debugMaxLevel, endHorde, executeTurn, fleeBattle, gmaxEvolve, hordeRound, megaEvolve, startBossBattle, startEncounter, startHorde, startRaid, startTower, startTrainerBattle, switchPlayerPokemon, throwMasterBall, trainerBattleEnd, trainerSendNextPokemon, updateVolatile, useEffectItem, usePokeball } from './reducer/battle.js'
import { claimAchievementRewards, claimDailyGift, claimDexRewards, claimFormDexRewards, claimQuest, claimStoryChapter, clearOfflineReport, completeDexCelebration, markCaught, markSeen, markShinyCaught, markShinySeen, refreshDailyEvent, refreshQuests, startDexCelebration, updateShinyChain, advanceSosChain, resetSosChain } from './reducer/collection.js'
import { buyCafeItem, buyItem, buyMarketItem, buyRewardItem, clearHeldItem, collectKurtBalls, craftApricornBall, reviveFossil, sellItem, sellMarketItem, setAlwaysCatchShinies, setCatchRule, setDefaultCatchRule, toggleAutoCatch, toggleRouteCatchAll, useItemOnPokemon } from './reducer/items.js'
import { blendBerries, careCompanion, harvestBerry, plantBerry, setCompanion } from './reducer/care.js'
import { assignPelago, collectPelago, dismissPelagoCollect, unassignPelago } from './reducer/pelago.js'
import { buyDecoration, collectSecretBaseYield, dismissSecretBaseCollect, endSecretBase, placeDecoration, removeDecoration, setupSecretBase, startSecretBase } from './reducer/secret-base.js'
import { assignJob, collectJob, takeJobEncounter, unassignJob, accrueJobFinds } from './reducer/jobs.js'
import { claimGift, claimMysteryGift, startStaticEncounter } from './reducer/gifts.js'
import { buyResearchItem } from './reducer/research.js'
import { recordRouteMastery } from './reducer/mastery.js'
import { clearHunt, setHunt } from './reducer/hunt.js'
import { addBreedingProject, removeBreedingProject } from './reducer/breeding.js'
import { createBreedingTracker } from './breeding-projects.js'
import { claimMinigameReward, collectMining, endBugContest, endDowsing, endHideAndSeek, endMinigame, endRouteActivity, endSafari, findDowsing, payMinigameFee, recordGameCornerWin, startDowsing, startHideAndSeek, startAcademyQuiz, startAuctionHouse, startBattleRoyal, startChampionGauntlet, startBugContest, startContest, startCurry, startDoubles, startDynamaxAdventures, startGameCorner, startIceSlide, startLightsOut, startMemory, startMining, startMusical, startPelago, startPicnic, startPokeathlon, startPokeRadar, startPokeballFactory, startPokestar, startPuzzleLeague, startRouteActivity, startRuinsPuzzle, startSafari, startVoltorbFlip, startWhack, startMantineSurf, startRotomRally, startOgreOustin, startTypeFusion, startUnownPicross, startPokeshot, startTeraRaid, startPokeword, startBerryBlender, startUltraWarp, startTriples, startRotation, startFreeForAll } from './reducer/minigames.js'
import { applyTeamPreset, bankDeposit, bankWithdraw, boxToParty, catchPokemon, clearHatchResult, completeEvolution, completeWonderTrade, deleteTeamPreset, depositDaycare, evolutionStep, hatchDaycareEgg, partyToBox, releaseDuplicates, releaseFainted, releaseFiltered, releaseHatchling, releasePokemon, reorderBox, reorderParty, saveTeamPreset, setBoxSort, setMoves, setNickname, startEvolution, swapPartyBox, toggleFavourite, withdrawDaycare, wonderTrade } from './reducer/pokemon.js'
import { completeHealing, healingStep, nuzlockeGameOver, startHealing } from './reducer/recovery.js'
import { addLog, clearLevelUp, dismissNotification, markCatchRoute, markTutorialSeen, pushNotification, setAutoBattlePolicy, setBattleMode, setBattleStyle, setChallengeMonotype, setSpeed, toggleAutoHeal, toggleAutoProceed, toggleBrowserNotifications, toggleChallengeLevelScale, toggleChallengeNuzlocke, toggleChallengeRandomizer, toggleChallengeRestrictCatches, toggleColourblindTypes, toggleDamageNumbers, toggleHordes, toggleLargeText, toggleMartCollapsed, toggleMoveAnimations, toggleMusic, toggleNotifyEgg, toggleNotifyRare, toggleNotifyShiny, togglePause, toggleReducedMotion, toggleSfx, toggleShinySparkles, toggleSpriteStyle } from './reducer/settings.js'
import { buyOutfit, updateTrainerProfile } from './reducer/profile.js'
import { createTrainerProfile } from './trainer-profile.js'
import { buyPrestigePerk, phaseIdle, prestigeRegion, resetEliteFour, resetPrestigePerks, selectStarter, travel, unlockRegion } from './reducer/world.js'
import { startFrontier } from './reducer/frontier.js'
import { accruePokewalker, spendPokewalker } from './reducer/pokewalker.js'

/** @type {GameState} */
export const initialGameState = {
  phase: 'starterSelect',
  startRegion: 'kanto',
  /** The starter picked at SELECT_STARTER, so a first-region starter gift can avoid duplicating it. */
  starterSpeciesKey: null,
  playerPokemon: null,
  enemyPokemon: null,
  currentRoute: 'route1',
  battleEvents: [],
  pendingEvents: [],
  currentEventIndex: 0,
  /** Turns the current battle has lasted (see CatchContext). */
  battleTurn: 0,
  /** Active field weather for the current battle, or null. */
  weather: null,
  /** Active field terrain for the current battle, or null. */
  terrain: null,
  /** Entry hazards for the current battle, one bucket per side. */
  battleHazards: emptyBattleHazards(),
  speed: 1,
  paused: !1,
  /** Mainline Set / Switch battle style: Switch lets the auto-battler pick a better matchup, Set never switches on its own. Training keeps the lead in to level it, pulling it out only when it is in danger. */
  battleStyle: 'switch',
  /** The auto-battler's rules: move bias, low-HP switch and item thresholds (see game/auto-battle-policy.js). */
  autoBattlePolicy: { ...DEFAULT_AUTO_BATTLE_POLICY },
  /** Auto battles run by themselves; manual waits for the player to pick a move. */
  battleMode: 'auto',
  battleLog: [],
  levelUpNotification: null,
  /** Transient toast queue (see NotificationStack). */
  notifications: [],
  /** Monotonic id source for toast keys. */
  nextNotificationId: 1,
  wildBattlesWon: 0,
  trainerBattlesWon: 0,
  battlesWonByLocation: {},
  party: [],
  box: [],
  /** Chosen box sort (see BOX_SORT_FIELDS / BOX_SORT_DIRECTIONS). */
  boxSort: 'dex_asc',
  /** Saved party presets, most recent last (see game/reducer/pokemon/team-presets.js). */
  teamPresets: [],
  /** The player's Trainer Card profile (see game/trainer-profile.js). */
  trainerProfile: createTrainerProfile(),
  /** Newly hatched Pokemon shown in the hatch popup (null when dismissed). */
  hatchResult: null,
  autoCatch: !0,
  /** Automatically heal the party at the Pokemon Center whenever it is damaged and the map is idle. */
  autoHeal: !1,
  nextPokemonId: 1,
  currentLocation: 'palletTown',
  unlockedLocations: ['palletTown', 'route1'],
  unlockedRegions: [],
  evolutionState: null,
  /** A pending Wonder Trade swap shown in the `wonderTrade` phase. */
  wonderTradeState: null,
  /** The route activity playing in the `routeActivity` phase, or null. */
  routeActivity: null,
  catchSettings: {},
  globalCatchDefaults: defaultCatchSettings,
  money: 3e3,
  inventory: {
    pokeball: 20,
  },
  /** Fishing rods the player has found (see game/minigames/rods.js). */
  rods: [DEFAULT_ROD],
  /** The pinned companion and its care stats (see game/companion.js). */
  companion: createCompanionCare(null, 0),
  /** Winning slot lines banked toward the Game Corner prize track. */
  gameCornerProgress: 0,
  /** The Berry Garden plots (see game/garden.js). */
  garden: createGarden(),
  /** Apricorns Kurt is carving (see game/kurt.js). */
  kurtCrafts: [],
  /** The Poké Pelago passive islands (see game/pelago.js). */
  pelago: createPelago(),
  /** The Secret Base on a chosen route (see game/secret-base.js). */
  secretBase: createSecretBase(),
  /** The last Secret Base yield collection, shown once. */
  secretBaseCollect: null,
  /** Field Jobs: Pokemon posted to auto-run route activities (see game/jobs.js). */
  jobs: createJobs(),
  /** Pokewalker steps banked while away, spent on walk rewards (see game/pokewalker.js). */
  pokewalker: createPokewalker(),
  /** Focus hunt: a species or type whose encounter rate is boosted (see game/hunt.js). */
  hunt: null,
  /** A battle-introduced weather still lingering on its route (see game/weather.js). */
  lingeringWeather: null,
  /** Field research: wild defeats per species (see game/research.js). */
  researchDefeated: {},
  /** Field research: berries fed to a species, for non-wild species. */
  researchFed: {},
  /** Field research: moves used by a species, for non-wild species. */
  researchMoves: {},
  /** Field research: large specimens obtained per species. */
  researchLarge: {},
  /** Field research: super-effective hits landed on or by a species. */
  researchSuperEffective: {},
  /** Field research: move ids each species has been seen using. */
  researchMoveIds: {},
  /** Research points already credited per species (so a balance is spendable). */
  researchClaimed: {},
  /** Species whose one-time research completion reward has been granted. */
  researchRewarded: {},
  /** Unspent Research Points. */
  researchPoints: 0,
  /** Ancient Relics recovered per region, for the legendary quests. */
  relics: {},
  /** The last Pelago collection, shown in a result card until dismissed. */
  pelagoCollect: null,
  trainerBattle: null,
  bossBattle: null,
  bossQueue: [],
  activePlayerPokemonIndex: 0,
  healingState: null,
  pendingBossBattle: null,
  alwaysCatchShinies: !0,
  pokedexSeen: [],
  pokedexCaught: [],
  shinyCaught: [],
  /** Active swarm: a route temporarily overrun by one species. */
  swarm: null,
  /** Pokerus: a rare, party-wide 2x EXP boost with a battle countdown. */
  pokerus: null,
  /** Today's daily quests, or null before they are rolled. */
  quests: null,
  /** Professor's Story: the chapter ids whose reward has been claimed. */
  professorStory: { claimed: [] },
  /** A pending region-dex-completion celebration (phase `dexComplete`). */
  dexCelebration: null,
  /** A one-off offline-progress report shown on return (never saved). */
  offlineReport: null,
  /** Today's rotating event + whether its gift was claimed (see src/data/daily-events.js). */
  dailyEvent: null,
  /** Daycare: up to two deposited parents breeding eggs. */
  daycare: { parents: [], progress: 0 },
  /** Breeding tracker (eggs / shinies) and the project queue (see game/breeding-projects.js). */
  breeding: createBreedingTracker(),
  /** Consecutive encounters of one species, boosting shiny odds (DexNav). */
  shinyChain: { speciesKey: null, count: 0, radar: 0, target: 5 },
  /** SOS chain: consecutive wild wins on the current route (see game/sos-chain.js). */
  sosChain: { routeKey: null, count: 0 },
  /** Best SOS chain reached per route, for the location-panel chip. */
  sosBestChains: {},
  shinySeen: [],
  defeatedGyms: [],
  defeatedEliteFour: [],
  defeatedChampions: [],
  /** Rival battles won per region (see game/rival.js). */
  rivals: {},
  /** Villain-arc stages beaten per region (see game/villain-teams.js). */
  villainProgress: {},
  /** Generation indices (0-based) whose dex-completion reward has been paid. */
  rewardedGenerations: [],
  /** Base species keys whose living form-dex family reward has been paid. */
  rewardedFamilies: [],
  /** Regional form set ids whose living form-dex reward has been paid. */
  rewardedRegionalSets: [],
  /** Generation indices (0-based) whose living form-dex reward has been paid. */
  rewardedFormGenerations: [],
  /** Species key -> the visual genders caught (for gender-difference forms). */
  formDexGenders: {},
  /** Achievement ids whose one-off reward has been paid. */
  rewardedAchievements: [],
  /** NPC gift / static-encounter ids already claimed this save. */
  claimedGifts: [],
  regionPrestige: {},
  /** Prestige Points earned from region prestiges, spent on perks. */
  prestigePoints: 0,
  /** Owned prestige perk ranks (see game/prestige.js). */
  prestigePerks: {},
  /** Best result per minigame, used by `unlock.minigame` route gates. */
  minigameRecords: {},
  /** Route key -> the date (YYYY-MM-DD) its Dowsing Machine was last swept. */
  dowsingSearches: {},
  /** Route key -> the date (YYYY-MM-DD) its hide-and-seek spot was last found. */
  hideAndSeekSearches: {},
  /** Cleared rotating Gigantamax raid events, keyed by event id. */
  raidEventRecords: {},
  /** Best activity hit quality per route, for route mastery (see game/route-mastery.js). */
  routeMastery: {},
  /** Route ids whose activity mastery bonus has been paid. */
  masteredRoutes: [],
  /** Next Battle Tower floor to attempt (0 = not in a run). Hoenn only. */
  towerFloor: 0,
  /** Best Tower floor cleared per region (only Hoenn is used). */
  towerBest: {},
  /** Next Battle Frontier floor to attempt, keyed by facility id (Hoenn only). */
  frontierFloor: {},
  /** Best Battle Frontier floor cleared, keyed by facility id. */
  frontierBest: {},
  /** The real party, set aside while a Battle Factory rental is in play. */
  frontierRental: null,
  victoryTokens: 0,
  autoProceed: !1,
  /** Whether key events raise a browser notification while the tab is hidden. */
  browserNotifications: !1,
  /** Which browser-notification events are allowed through (shiny, raid/legendary, egg). */
  notifyShiny: !0,
  notifyRare: !0,
  notifyEgg: !0,
  /** Force reduced-motion animations off, regardless of the OS setting. */
  reducedMotion: !1,
  /** Add type labels to moves so type is not conveyed by colour alone. */
  colourblindTypes: !1,
  /** Uniformly scale the UI up for readability. */
  largeText: !1,
  /** Sprite style: 'animated' gifs (default) or 'static' pngs. */
  spriteStyle: 'animated',
  /** Float the damage dealt over the sprite during battle. */
  showDamageNumbers: !0,
  /** Flash a move's impact over the sprite it hit in battle. */
  showMoveAnimations: !0,
  /** Sparkle the shiny Pokemon's sprite in battle. */
  showShinySparkles: !0,
  /** Whether the town Poke Mart starts collapsed (persisted UI preference). */
  martCollapsed: !1,
  /** Minigame ids whose "how to play" tutorial has been shown (persisted UI preference). */
  seenTutorials: [],
  /** Background music (off by default; the AudioContext starts on first use). */
  musicEnabled: !1,
  /** Sound effects for notable events (on by default). */
  sfxEnabled: !0,
  /** Challenge: wild encounters roll a random species. */
  challengeRandomizer: !1,
  /** Challenge: wild encounter levels match your active Pokemon. */
  challengeLevelScale: !1,
  /** Challenge: a fainted party Pokemon is released permanently. */
  challengeNuzlocke: !1,
  /** Challenge: only the first wild Pokemon on each route can be caught. */
  challengeRestrictCatches: !1,
  /** Routes whose first wild encounter has already been used up. */
  challengeCatchRoutes: [],
  /** Challenge: wild encounters are limited to this type (null = off). */
  challengeMonotype: null,
  /** Challenge: the Nuzlocke run has ended (last party Pokemon fainted). */
  nuzlockeGameOver: !1,
  raidCooldownEnd: null,
  raidLegendary: null,
  raidRegion: null,
  inRaid: !1,
  raidLevel: 0,
  preRaidLocation: null,
  playerVolatile: null,
  activeEffects: [],
  /** Pokemon ids that have taken part in the current battle (EXP shares). */
  battleParticipants: [],
  /** The player switched or used an item this turn, so only the foe acts. */
  playerTurnSpent: !1,
  /** The foe spent its turn switching (Champion swap), so only the player acts. */
  enemyTurnSpent: !1,
  /** The move the player picked for the next manual turn (null when none). */
  pendingPlayerMove: null,
  /** Rare pack battles of one wild species (see game/horde.js). */
  hordeEncounters: !0,
  /** The live pack during the `horde` phase, or null. */
  hordePack: null,
  /** The player's battle Pokemon during the `horde` phase, or null. */
  hordePlayer: null,
  /** The rolling horde battle log. */
  hordeLog: [],
}

/**
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function gameReducer(state, action) {
  switch (action.type) {
    case 'BATCH': {
      // Fold the actions a single idle tick dispatched into one state update
      // (see the buffering in `useGameLoop`). Applying them in order keeps the
      // exact same semantics as dispatching them one at a time.
      const batchedActions = action.payload?.actions ?? []
      if (batchedActions.length === 0) return state
      const reduced = batchedActions.reduce(
        /** @param {GameState} currentState @param {GameAction} batchedAction */
        (currentState, batchedAction) => gameReducer(currentState, batchedAction),
        state
      )
      // A batch whose actions all turned out to be no-ops still has to wake the
      // idle loop: React bails out of rendering (and skips the effect that
      // clears `waitingForCommitRef`) when a reducer returns the identical
      // state, which would freeze the loop after a single ignored action. A
      // fresh, shallow reference forces the commit without changing any slice.
      return reduced === state ? { ...state } : reduced
    }
    case 'SELECT_STARTER':
      return selectStarter(state, action)
    case 'UNLOCK_REGION':
      return unlockRegion(state, action)
    case 'START_ENCOUNTER':
      return startEncounter(state, action)
    case 'EXECUTE_TURN':
      return executeTurn(state, action)
    case 'FLEE':
      return fleeBattle(state)
    case 'CHOOSE_PLAYER_MOVE':
      return choosePlayerMove(state, action)
    case 'CONSUME_EVENT':
      return consumeEvent(state, action)
    case 'APPLY_EXP':
      return applyExp(state, action)
    case 'DEBUG_MAX_LEVEL':
      return debugMaxLevel(state, action)
    case 'SET_SPEED':
      return setSpeed(state, action)
    case 'SET_BATTLE_STYLE':
      return setBattleStyle(state, action)
    case 'SET_AUTO_BATTLE_POLICY':
      return setAutoBattlePolicy(state, action)
    case 'SET_BATTLE_MODE':
      return setBattleMode(state, action)
    case 'TOGGLE_PAUSE':
      return togglePause(state, action)
    case 'CLEAR_LEVEL_UP':
      return clearLevelUp(state, action)
    case 'PUSH_NOTIFICATION':
      return pushNotification(state, action)
    case 'DISMISS_NOTIFICATION':
      return dismissNotification(state, action)
    case 'CLEAR_HATCH_RESULT':
      return clearHatchResult(state, action)
    case 'RELEASE_DUPLICATES':
      return releaseDuplicates(state, action)
    case 'RELEASE_FILTERED':
      return releaseFiltered(state, action)
    case 'RELEASE_HATCHLING':
      return releaseHatchling(state, action)
    case 'PHASE_IDLE':
      return phaseIdle(state, action)
    case 'ADD_LOG':
      return addLog(state, action)
    case 'SET_MOVES':
      return setMoves(state, action)
    case 'TOGGLE_FAVOURITE':
      return toggleFavourite(state, action)
    case 'SET_NICKNAME':
      return setNickname(state, action)
    case 'CATCH_POKEMON':
      return catchPokemon(state, action)
    case 'THROW_MASTER_BALL':
      return throwMasterBall(state, action)
    case 'ATTEMPT_CATCH':
      return attemptActivityCatch(state, action)
    case 'MEGA_EVOLVE':
      return megaEvolve(state, action)
    case 'GMAX_EVOLVE':
      return gmaxEvolve(state, action)
    case 'COMPLETE_MASTER_BALL':
      return completeMasterBall(state, action)
    case 'TOGGLE_AUTO_CATCH':
      return toggleAutoCatch(state, action)
    case 'SET_DEFAULT_CATCH_RULE':
      return setDefaultCatchRule(state, action)
    case 'CRAFT_APRICORN_BALL':
      return craftApricornBall(state, action)
    case 'COLLECT_KURT_BALLS':
      return collectKurtBalls(state)
    case 'REORDER_PARTY':
      return reorderParty(state, action)
    case 'PARTY_TO_BOX':
      return partyToBox(state, action)
    case 'BANK_DEPOSIT':
      return bankDeposit(state, action)
    case 'BANK_WITHDRAW':
      return bankWithdraw(state, action)
    case 'BOX_TO_PARTY':
      return boxToParty(state, action)
    case 'SWAP_PARTY_BOX':
      return swapPartyBox(state, action)
    case 'TRAVEL':
      return travel(state, action)
    case 'START_EVOLUTION':
      return startEvolution(state, action)
    case 'EVOLUTION_STEP':
      return evolutionStep(state, action)
    case 'COMPLETE_EVOLUTION':
      return completeEvolution(state, action)
    case 'SET_CATCH_RULE':
      return setCatchRule(state, action)
    case 'TOGGLE_ROUTE_CATCH_ALL':
      return toggleRouteCatchAll(state, action)
    case 'START_TRAINER_BATTLE':
      return startTrainerBattle(state, action)
    case 'START_BOSS_BATTLE':
      return startBossBattle(state, action)
    case 'SWITCH_PLAYER_POKEMON':
      return switchPlayerPokemon(state, action)
    case 'TRAINER_SEND_NEXT_POKEMON':
      return trainerSendNextPokemon(state, action)
    case 'TRAINER_BATTLE_END':
      return trainerBattleEnd(state, action)
    case 'BOSS_BATTLE_END':
      return bossBattleEnd(state, action)
    case 'BUY_ITEM':
      return buyItem(state, action)
    case 'BUY_CAFE_ITEM':
      return buyCafeItem(state, action)
    case 'SELL_ITEM':
      return sellItem(state, action)
    case 'BUY_MARKET_ITEM':
      return buyMarketItem(state, action)
    case 'SELL_MARKET_ITEM':
      return sellMarketItem(state, action)
    case 'CLEAR_HELD_ITEM':
      return clearHeldItem(state, action)
    case 'USE_ITEM_ON_POKEMON':
      return useItemOnPokemon(state, action)
    case 'REVIVE_FOSSIL':
      return reviveFossil(state, action)
    case 'USE_POKEBALL':
      return usePokeball(state, action)
    case 'MARK_SEEN':
      return markSeen(state, action)
    case 'MARK_CAUGHT':
      return markCaught(state, action)
    case 'MARK_SHINY_CAUGHT':
      return markShinyCaught(state, action)
    case 'CLAIM_DEX_REWARDS':
      return claimDexRewards(state, action)
    case 'CLAIM_FORM_DEX_REWARDS':
      return claimFormDexRewards(state, action)
    case 'CLAIM_ACHIEVEMENT_REWARDS':
      return claimAchievementRewards(state, action)
    case 'REFRESH_QUESTS':
      return refreshQuests(state, action)
    case 'CLAIM_QUEST':
      return claimQuest(state, action)
    case 'CLAIM_STORY_CHAPTER':
      return claimStoryChapter(state, action)
    case 'START_DEX_CELEBRATION':
      return startDexCelebration(state, action)
    case 'COMPLETE_DEX_CELEBRATION':
      return completeDexCelebration(state, action)
    case 'CLEAR_OFFLINE_REPORT':
      return clearOfflineReport(state, action)
    case 'REFRESH_DAILY_EVENT':
      return refreshDailyEvent(state, action)
    case 'CLAIM_DAILY_GIFT':
      return claimDailyGift(state, action)
    case 'UPDATE_SHINY_CHAIN':
      return updateShinyChain(state, action)
    case 'ADVANCE_SOS_CHAIN':
      return advanceSosChain(state, action)
    case 'RESET_SOS_CHAIN':
      return resetSosChain(state)
    case 'MARK_SHINY_SEEN':
      return markShinySeen(state, action)
    case 'START_HEALING':
      return startHealing(state, action)
    case 'START_FRONTIER':
      return startFrontier(state, action)
    case 'START_TOWER':
      return startTower(state, action)
    case 'HEALING_STEP':
      return healingStep(state, action)
    case 'COMPLETE_HEALING':
      return completeHealing(state, action)
    case 'REORDER_BOX':
      return reorderBox(state, action)
    case 'SET_BOX_SORT':
      return setBoxSort(state, action)
    case 'SAVE_TEAM_PRESET':
      return saveTeamPreset(state, action)
    case 'DELETE_TEAM_PRESET':
      return deleteTeamPreset(state, action)
    case 'APPLY_TEAM_PRESET':
      return applyTeamPreset(state, action)
    case 'RELEASE_POKEMON':
      return releasePokemon(state, action)
    case 'RELEASE_FAINTED':
      return releaseFainted(state)
    case 'NUZLOCKE_GAME_OVER':
      return nuzlockeGameOver(state)
    case 'WONDER_TRADE':
      return wonderTrade(state, action)
    case 'COMPLETE_WONDER_TRADE':
      return completeWonderTrade(state, action)
    case 'DEPOSIT_DAYCARE':
      return depositDaycare(state, action)
    case 'WITHDRAW_DAYCARE':
      return withdrawDaycare(state, action)
    case 'HATCH_DAYCARE_EGG':
      return hatchDaycareEgg(state, action)
    case 'SET_ALWAYS_CATCH_SHINIES':
      return setAlwaysCatchShinies(state, action)
    case 'RESET_ELITE_FOUR':
      return resetEliteFour(state, action)
    case 'PRESTIGE_REGION':
      return prestigeRegion(state, action)
    case 'BUY_PRESTIGE_PERK':
      return buyPrestigePerk(state, action)
    case 'RESET_PRESTIGE_PERKS':
      return resetPrestigePerks(state, action)
    case 'TOGGLE_AUTO_PROCEED':
      return toggleAutoProceed(state, action)
    case 'TOGGLE_AUTO_HEAL':
      return toggleAutoHeal(state)
    case 'TOGGLE_HORDES':
      return toggleHordes(state)
    case 'TOGGLE_BROWSER_NOTIFICATIONS':
      return toggleBrowserNotifications(state, action)
    case 'TOGGLE_NOTIFY_SHINY':
      return toggleNotifyShiny(state)
    case 'TOGGLE_NOTIFY_RARE':
      return toggleNotifyRare(state)
    case 'TOGGLE_NOTIFY_EGG':
      return toggleNotifyEgg(state)
    case 'TOGGLE_REDUCED_MOTION':
      return toggleReducedMotion(state, action)
    case 'TOGGLE_COLOURBLIND_TYPES':
      return toggleColourblindTypes(state, action)
    case 'TOGGLE_LARGE_TEXT':
      return toggleLargeText(state, action)
    case 'TOGGLE_SPRITE_STYLE':
      return toggleSpriteStyle(state, action)
    case 'TOGGLE_DAMAGE_NUMBERS':
      return toggleDamageNumbers(state)
    case 'TOGGLE_MOVE_ANIMATIONS':
      return toggleMoveAnimations(state)
    case 'TOGGLE_SHINY_SPARKLES':
      return toggleShinySparkles(state)
    case 'TOGGLE_MART_COLLAPSED':
      return toggleMartCollapsed(state, action)
    case 'MARK_TUTORIAL_SEEN':
      return markTutorialSeen(state, action)
    case 'TOGGLE_MUSIC':
      return toggleMusic(state, action)
    case 'TOGGLE_SFX':
      return toggleSfx(state, action)
    case 'UPDATE_TRAINER_PROFILE':
      return updateTrainerProfile(state, action)
    case 'BUY_OUTFIT':
      return buyOutfit(state, action)
    case 'TOGGLE_CHALLENGE_RANDOMIZER':
      return toggleChallengeRandomizer(state, action)
    case 'TOGGLE_CHALLENGE_LEVEL_SCALE':
      return toggleChallengeLevelScale(state, action)
    case 'TOGGLE_CHALLENGE_NUZLOCKE':
      return toggleChallengeNuzlocke(state, action)
    case 'TOGGLE_CHALLENGE_RESTRICT_CATCHES':
      return toggleChallengeRestrictCatches(state, action)
    case 'MARK_CATCH_ROUTE':
      return markCatchRoute(state, action)
    case 'SET_CHALLENGE_MONOTYPE':
      return setChallengeMonotype(state, action)
    case 'START_BUG_CONTEST':
      return startBugContest(state, action)
    case 'END_BUG_CONTEST':
      return endBugContest(state, action)
    case 'START_SAFARI':
      return startSafari(state, action)
    case 'END_SAFARI':
      return endSafari(state, action)
    case 'START_ACADEMY_QUIZ':
      return startAcademyQuiz(state, action)
    case 'START_VOLTORB_FLIP':
      return startVoltorbFlip(state, action)
    case 'START_AUCTION_HOUSE':
      return startAuctionHouse(state, action)
    case 'START_CONTEST':
      return startContest(state, action)
    case 'START_POKEATHLON':
      return startPokeathlon(state, action)
    case 'START_POKE_RADAR':
      return startPokeRadar(state, action)
    case 'START_BATTLE_ROYAL':
      return startBattleRoyal(state, action)
    case 'START_CHAMPION_GAUNTLET':
      return startChampionGauntlet(state, action)
    case 'START_DOUBLES':
      return startDoubles(state, action)
    case 'START_TRIPLES':
      return startTriples(state, action)
    case 'START_ROTATION':
      return startRotation(state, action)
    case 'START_FREE_FOR_ALL':
      return startFreeForAll(state, action)
    case 'START_DYNAMAX_ADVENTURES':
      return startDynamaxAdventures(state, action)
    case 'START_LIGHTS_OUT':
      return startLightsOut(state, action)
    case 'START_CURRY':
      return startCurry(state, action)
    case 'START_POKESTAR':
      return startPokestar(state, action)
    case 'START_PUZZLE_LEAGUE':
      return startPuzzleLeague(state, action)
    case 'START_MEMORY':
      return startMemory(state, action)
    case 'START_WHACK':
      return startWhack(state, action)
    case 'START_MUSICAL':
      return startMusical(state, action)
    case 'START_PICNIC':
      return startPicnic(state, action)
    case 'START_POKEBALL_FACTORY':
      return startPokeballFactory(state, action)
    case 'START_RUINS_PUZZLE':
      return startRuinsPuzzle(state, action)
    case 'START_ICE_SLIDE':
      return startIceSlide(state, action)
    case 'START_PELAGO':
      return startPelago(state, action)
    case 'START_MANTINE_SURF':
      return startMantineSurf(state, action)
    case 'START_ROTOM_RALLY':
      return startRotomRally(state, action)
    case 'START_OGRE_OUSTIN':
      return startOgreOustin(state, action)
    case 'START_TYPE_FUSION':
      return startTypeFusion(state, action)
    case 'START_UNOWN_PICROSS':
      return startUnownPicross(state, action)
    case 'START_POKESHOT':
      return startPokeshot(state, action)
    case 'START_TERA_RAID':
      return startTeraRaid(state, action)
    case 'START_POKEWORD':
      return startPokeword(state, action)
    case 'START_BERRY_BLENDER':
      return startBerryBlender(state, action)
    case 'START_ULTRA_WARP':
      return startUltraWarp(state, action)
    case 'START_MINING':
      return startMining(state, action)
    case 'START_GAME_CORNER':
      return startGameCorner(state, action)
    case 'RECORD_GAME_CORNER_WIN':
      return recordGameCornerWin(state, action)
    case 'END_MINIGAME':
      return endMinigame(state, action)
    case 'START_ROUTE_ACTIVITY':
      return startRouteActivity(state, action)
    case 'END_ROUTE_ACTIVITY':
      return endRouteActivity(state, action)
    case 'START_DOWSING':
      return startDowsing(state, action)
    case 'FIND_DOWSING':
      return findDowsing(state, action)
    case 'END_DOWSING':
      return endDowsing(state, action)
    case 'START_HIDE_AND_SEEK':
      return startHideAndSeek(state, action)
    case 'END_HIDE_AND_SEEK':
      return endHideAndSeek(state, action)
    case 'SET_HUNT':
      return setHunt(state, action)
    case 'CLEAR_HUNT':
      return clearHunt(state)
    case 'RECORD_ROUTE_MASTERY':
      return recordRouteMastery(state, action)
    case 'ADD_BREEDING_PROJECT':
      return addBreedingProject(state, action)
    case 'REMOVE_BREEDING_PROJECT':
      return removeBreedingProject(state, action)
    case 'PAY_MINIGAME_FEE':
      return payMinigameFee(state, action)
    case 'CLAIM_MINIGAME_REWARD':
      return claimMinigameReward(state, action)
    case 'CLAIM_GIFT':
      return claimGift(state, action)
    case 'CLAIM_MYSTERY_GIFT':
      return claimMysteryGift(state, action)
    case 'START_STATIC_ENCOUNTER':
      return startStaticEncounter(state, action)
    case 'SET_COMPANION':
      return setCompanion(state, action)
    case 'CARE_COMPANION':
      return careCompanion(state, action)
    case 'PLANT_BERRY':
      return plantBerry(state, action)
    case 'HARVEST_BERRY':
      return harvestBerry(state, action)
    case 'BLEND_BERRIES':
      return blendBerries(state, action)
    case 'ASSIGN_PELAGO':
      return assignPelago(state, action)
    case 'UNASSIGN_PELAGO':
      return unassignPelago(state, action)
    case 'COLLECT_PELAGO':
      return collectPelago(state, action)
    case 'DISMISS_PELAGO_COLLECT':
      return dismissPelagoCollect(state, action)
    case 'START_SECRET_BASE':
      return startSecretBase(state)
    case 'END_SECRET_BASE':
      return endSecretBase(state)
    case 'SETUP_SECRET_BASE':
      return setupSecretBase(state, action)
    case 'BUY_DECORATION':
      return buyDecoration(state, action)
    case 'PLACE_DECORATION':
      return placeDecoration(state, action)
    case 'REMOVE_DECORATION':
      return removeDecoration(state, action)
    case 'COLLECT_SECRET_BASE_YIELD':
      return collectSecretBaseYield(state)
    case 'DISMISS_SECRET_BASE_COLLECT':
      return dismissSecretBaseCollect(state)
    case 'ASSIGN_JOB':
      return assignJob(state, action)
    case 'UNASSIGN_JOB':
      return unassignJob(state, action)
    case 'COLLECT_JOB':
      return collectJob(state, action)
    case 'TAKE_JOB_ENCOUNTER':
      return takeJobEncounter(state, action)
    case 'ACCRUE_POKEWALKER':
      return accruePokewalker(state, action)
    case 'SPEND_POKEWALKER':
      return spendPokewalker(state, action)
    case 'ACCRUE_JOBS':
      return accrueJobFinds(state, action)
    case 'BUY_RESEARCH_ITEM':
      return buyResearchItem(state, action)
    case 'COLLECT_MINING':
      return collectMining(state, action)
    case 'BUY_REWARD_ITEM':
      return buyRewardItem(state, action)
    case 'START_RAID':
      return startRaid(state, action)
    case 'START_HORDE':
      return startHorde(state, action)
    case 'HORDE_ROUND':
      return hordeRound(state, action)
    case 'END_HORDE':
      return endHorde(state, action)
    case 'UPDATE_VOLATILE':
      return updateVolatile(state, action)
    case 'USE_EFFECT_ITEM':
      return useEffectItem(state, action)
    case 'APPLY_SHARED_EXP':
      return applySharedExp(state, action)
    default:
      return state
  }
}
