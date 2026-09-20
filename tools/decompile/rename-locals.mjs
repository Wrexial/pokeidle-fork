#!/usr/bin/env node
/**
 * Scope-aware local variable renamer for assets/index.js.
 *
 * For each entry it resolves a top-level function (or a React.memo/Qf-style
 * component wrapping a function), then renames a local binding *within that
 * function's own scope* using Babel's `scope.rename`. That correctly renames the
 * declaration plus every reference and reassignment, and leaves shadowing
 * bindings in nested scopes alone.
 *
 * Output is produced by minimal textual edits (no codegen), so formatting is
 * preserved.
 *
 * Usage:
 *   node tools/decompile/rename-locals.mjs            # dry run + report
 *   node tools/decompile/rename-locals.mjs --write    # apply
 *   node tools/decompile/rename-locals.mjs --fn BattleScene   # one function
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default ?? traverseModule
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.resolve(__dirname, '../../assets/index.js')
const WRITE = process.argv.includes('--write')
const onlyFnArg = process.argv.indexOf('--fn')
const ONLY_FN = onlyFnArg > -1 ? process.argv[onlyFnArg + 1] : null

/** function name -> { oldLocal: newName } (function-scope bindings only) */
const LOCAL_RENAMES = {
  getPokemonSpriteUrl: { s: 'spriteId', u: 'isBack', d: 'isShiny', o: 'baseUrl' },
  getPokemonSpriteFallbackUrl: { s: 'spriteId', u: 'isBack', d: 'isShiny', o: 'baseUrl' },
  calculateHpStat: { s: 'baseStat', u: 'level', d: 'iv' },
  calculateOtherStat: { s: 'baseStat', u: 'level', d: 'iv' },
  calculatePokemonStats: { s: 'species', u: 'level', d: 'ivs' },
  calculateRequiredExperience: { d: 'level' },
  calculateExpYield: { s: 'species', u: 'level' },
  getLevelUpResults: { s: 'speciesKey', u: 'growthRate', d: 'currentLevel', o: 'totalExp', y: 'levelUps', f: 'level' },
  getPreEvolutionChain: { s: 'speciesKey', u: 'chain', d: 'current' },
  getFamilyLearnset: { s: 'speciesKey', u: 'level', d: 'chain', o: 'seen', y: 'moves' },
  resolvePokemonMoves: { s: 'speciesKey', u: 'level' },
  getCatchRule: { s: 'state', u: 'routeKey', d: 'speciesKey' },
  getItemCategory: { s: 'itemId' },
  isActiveEffectItem: { s: 'itemId' },
  getItemInfo: { s: 'itemId' },
  createPokemon: { s: 'speciesKey', u: 'level', d: 'id', o: 'isShiny', y: 'species', f: 'ivs', g: 'stats', x: 'moves' },
  computeUnlockedLocations: { s: 'state', u: 'unlocked', d: 'badgeCount' },
  getActivePartyIndex: { s: 'state' },
  syncActivePokemonIntoParty: { s: 'state', u: 'activeIndex', d: 'party', o: 'existingIndex' },
  loadActivePokemonFromParty: { s: 'state', u: 'activeIndex' },
  prepareNextBattle: { s: 'state', u: 'synced', d: 'firstAliveIndex', o: 'nextIndex' },
  tickBattleCounters: { s: 'effects' },
  gameReducer: { s: 'state', u: 'action' },
  GameProvider: { s: 'children', u: 'state', d: 'dispatch' },
  useGame: { s: 'context' },
  resolveActiveModifiers: { s: 'activeEffects', u: 'routeKey', d: 'modifiers' },
  resolvePokemonEncounter: { s: 'encounterData', u: 'modifiers', d: 'isDexComplete', o: 'weightedEncounters', y: 'totalWeight', f: 'roll', g: 'fallback' },
  StarterSelect: { s: 'dispatch' },
  HpBar: { s: 'current', u: 'max', d: 'percent', o: 'barColor' },
  ExpBar: { s: 'speciesKey', u: 'level', d: 'totalExp', o: 'species', y: 'currentLevelExp', f: 'nextLevelExp', g: 'expIntoLevel', x: 'expForLevel', h: 'percent' },
  PlayerInfoBox: { s: 'pokemon' },
  EnemyInfoBox: { s: 'pokemon' },
  useTypewriter: { s: 'text', u: 'speed', d: 'displayed', o: 'setDisplayed', y: 'isComplete', f: 'setIsComplete', g: 'indexRef' },
  BattleTextBox: { s: 'event', u: 'speed', d: 'isAtTown', o: 'charDelay', y: 'defaultMessage', f: 'message', g: 'displayed' },
  SpeedControls: { s: 'state', u: 'dispatch' },
  MoveManagerPanel: { s: 'onClose', u: 'state', d: 'dispatch', o: 'pokemon', y: 'pokemonId', f: 'moves', g: 'setMoves', x: 'availableMoves', h: 'species', p: 'toggleMove', w: 'confirmMoves' },
  EvolutionScene: { s: 'state', u: 'dispatch', d: 'evolutionState', o: 'fromSpecies', y: 'toSpecies', f: 'showNewSprite', g: 'spriteClass', x: 'message' },
  HealingScene: { s: 'state', u: 'dispatch', d: 'healingState', o: 'videoRef', y: 'message' },
  SettingsModal: { s: 'onClose', u: 'confirming', d: 'setConfirming', o: 'resetSave' },
  getCatchRate: { s: 'speciesKey' },
  getTrainerSpriteUrl: { s: 'trainerClass' },
  getBossTrainerSpriteUrl: { s: 'spriteKey' },
  calculateCatchChance: { s: 'speciesKey', u: 'ballId', d: 'catchRate', o: 'ball' },
  attemptCatch: { s: 'speciesKey', u: 'ballId', d: 'chance' },
  selectBestBall: { s: 'speciesKey', u: 'enabledBalls', d: 'inventory', o: 'usableBalls', y: 'catchRate' },
  shouldAutoCatch: { s: 'state', u: 'routeKey', d: 'speciesKey', o: 'level', y: 'isShiny', f: 'rule' },
  selectAutoCatchBall: { s: 'state', u: 'routeKey', d: 'speciesKey', o: 'rule' },
  getTypeEffectiveness: { s: 'attackType', u: 'defenderTypes', d: 'multiplier' },
  getTypeMultiplier: { s: 'attackType', u: 'defenderTypes' },
  statStageMultiplier: { s: 'stage' },
  calculateDamage: { s: 'attackerLevel', u: 'attack', d: 'defense', o: 'move', y: 'attackerTypes', f: 'defenderTypes', g: 'attackerStage', x: 'defenderStage', p: 'effectiveAttack', w: 'effectiveDefense', k: 'baseDamage', A: 'isCrit', v: 'critMultiplier', _: 'stabMultiplier', S: 'effectiveness', D: 'randomFactor', z: 'damage', V: 'effectivenessLabel' },
  estimateMoveDamage: { s: 'attackerLevel', u: 'attack', d: 'defense', o: 'move', y: 'attackerTypes', f: 'defenderTypes', g: 'attackerStage', x: 'defenderStage', h: 'effectiveAttack', p: 'effectiveDefense', w: 'baseDamage', k: 'stabMultiplier', A: 'effectiveness' },
  chooseBestMove: { s: 'moves', u: 'attackerLevel', d: 'attack', o: 'spAttack', y: 'attackerTypes', f: 'defenderTypes', g: 'defenderDefense', x: 'defenderSpDefense', h: 'attackerStages', p: 'defenderStages', w: 'bestMoveId', k: 'bestDamage' },
  chooseRandomMove: { s: 'moves', u: 'damagingMoves', d: 'pool', o: 'picked' },
  getStatStage: { s: 'volatile', u: 'statKey' },
  clampStatStage: { s: 'stage' },
  resolveBattleTurn: { s: 'player', u: 'enemy', d: 'isTrainerBattle', o: 'events', y: 'playerMustRecharge', f: 'enemyMustRecharge', g: 'playerMoveId', x: 'playerMove', h: 'enemyMoveId', p: 'enemyMove', w: 'attackOrder', k: 'playerPriority', A: 'enemyPriority' },
  getStatLabel: { s: 'statKey' },
  awardExperience: { s: 'dispatch', u: 'playerPokemon', d: 'enemyPokemon', o: 'multiplier', y: 'hasExpShare', f: 'party', g: 'activeIndex', x: 'enemySpecies', h: 'baseExp', p: 'gainedExp', w: 'finalExp', k: 'playerSpecies', A: 'newTotalExp', v: 'levelUps' },
  useGameLoop: { s: 'state', u: 'dispatch', d: 'intervalRef', o: 'phaseRef', y: 'stateRef', f: 'getTickDelay', g: 'tick', x: 'unlockedRef', h: 'pendingTravelRef' },
  useIsMobile: { s: 'isMobile', u: 'setIsMobile' },
  BattleScreen: { s: 'state', u: 'isMobile', d: 'containerRef', o: 'contentRef', y: 'scale', f: 'setScale', g: 'contentHeight', x: 'setContentHeight', h: 'recalcSize' },
  BattleLog: { s: 'state', u: 'containerRef', d: 'endRef', o: 'isCollapsed', y: 'setIsCollapsed', f: 'activeEffects' },
  LevelUpNotification: { s: 'state', u: 'dispatch' },
  StatsPanel: { s: 'pokemon', u: 'source', d: 'partyLength', o: 'onAction', y: 'onClose', f: 'evolutionInfo', g: 'onEvolve', x: 'onRelease', h: 'canRelease', p: 'species', w: 'statRows', k: 'statMax', v: 'canMove', _: 'actionLabel' },
  PartyPanel: { s: 'inspected', u: 'setInspected', d: 'releaseConfirm', o: 'setReleaseConfirm', y: 'dragSource', f: 'dragFromIndex', g: 'dropTargetIndex', x: 'dropPosition', h: 'onDragStart', p: 'onDragOver', w: 'onDrop', k: 'onDragEnd', A: 'state', v: 'dispatch', _: 'inspectedPokemon', S: 'inspectedIndex', D: 'inspectedSource', z: 'handleSelect', V: 'handleMoveToOther', G: 'canReleaseNow', X: 'requestRelease', Z: 'confirmRelease', F: 'cancelRelease', q: 'evolutionInfo', le: 'handleEvolve', ve: 'releaseTarget', Ne: 'isDraggable' },
  PokedexTile: { u: 'speciesKey', d: 'status', o: 'rarity', y: 'isSelected', f: 'onClick', g: 'isShinyCaught', x: 'activeEffect', h: 'selectorMode', p: 'species' },
  PokedexModal: { s: 'onClose', u: 'state', d: 'selected', o: 'setSelected', y: 'getStatus', f: 'caughtCount', g: 'seenCount', x: 'totalEntries', h: 'selectedSpecies', p: 'selectedStatus', w: 'statRows' },
  BoxPanel: { s: 'inspected', u: 'setInspected', d: 'setReleaseConfirm', x: 'onBoxDragStart', h: 'onBoxSlotDragOver', p: 'onBoxDragOver', w: 'onBoxDrop', k: 'onBoxDragLeave', A: 'onDrop', v: 'onDragEnd', o: 'dragSource', y: 'boxDragOver', f: 'boxDragFromIndex', g: 'boxDropTargetIndex', _: 'state', S: 'dispatch', D: 'page', z: 'setPage', V: 'showPokedex', G: 'setShowPokedex', X: 'totalPages', Z: 'currentPage', F: 'toggleInspected', q: 'prevPage', le: 'nextPage' },
  PartyBoxPanel: { s: 'state', u: 'dispatch', d: 'inspected', o: 'setInspected', y: 'releaseConfirm', f: 'setReleaseConfirm', g: 'partyDragIndex', x: 'setPartyDragIndex', h: 'dragSource', p: 'setDragSource', w: 'dropTargetIndex', k: 'setDropTargetIndex', A: 'dropPosition', v: 'setDropPosition', _: 'boxDragOver', S: 'setBoxDragOver', D: 'boxDragIndex', z: 'setBoxDragIndex', V: 'boxDropTargetIndex', G: 'setBoxDropTargetIndex', X: 'dragRef', Z: 'resetDrag', F: 'handlePartyDragStart', q: 'handleBoxDragStart', le: 'handlePartyDragOver', ve: 'handleBoxSlotDragOver', Ne: 'preventDefault', Q: 'handleDrop', J: 'handleBoxDragOver', _e: 'handleBoxDrop', je: 'handleBoxDragLeave' },
  EncounterDetailPanel: { u: 'speciesKey', d: 'encounter', o: 'rarity', y: 'rate', f: 'status', g: 'onClose', x: 'routeKey', h: 'state', p: 'dispatch', w: 'species', k: 'repelCount', A: 'honeyCount', v: 'activeRepel', _: 'activeHoney', S: 'applyRepel', D: 'applyHoney', z: 'statRows', V: 'statMax' },
  PokeballIcon: { s: 'ballId', u: 'size', d: 'disabled', o: 'clipId', y: 'colors' },
  getRarityFromRate: { s: 'rate' },
  RouteEncounterGrid: { s: 'routeKey', u: 'encounters', d: 'onOpenCatchSettings', o: 'forceRarity', y: 'state', f: 'dispatch', g: 'selected', x: 'setSelected', h: 'applyingItem', p: 'setApplyingItem', w: 'repelCount', k: 'honeyCount', A: 'totalWeight', v: 'sortedEncounters', _: 'activeEffectMap', S: 'getStatus', D: 'handleTileClick', z: 'closeDetail', V: 'selectedEncounter', G: 'rate', X: 'rarity' },
  ShopPanel: { s: 'shopDef', u: 'state', d: 'dispatch', o: 'qtyMode', y: 'setQtyMode' },
  BallShopRow: { s: 'itemId', u: 'ballId', d: 'name', o: 'description', y: 'price', f: 'owned', g: 'money', x: 'qtyMode', h: 'dispatch', p: 'quantity', w: 'totalCost', k: 'canAfford', A: 'buy' },
  ItemShopRow: { s: 'itemId', u: 'name', d: 'description', o: 'price', y: 'owned', f: 'money', g: 'qtyMode', x: 'dispatch', h: 'quantity', p: 'totalCost', w: 'canAfford', k: 'buy' },
  LocationPanel: { s: 'onOpenCatchSettings', u: 'state', d: 'dispatch', o: 'location', y: 'nextLockedLocation', f: 'badgeCount', g: 'routeKey', x: 'routeEncounters' },
  CatchSettingsModal: { u: 'routeKey', d: 'encounters', o: 'onClose', y: 'state', f: 'dispatch', g: 'baseRule', x: 'mode', h: 'enabledBalls', p: 'levelThreshold', w: 'setMode', k: 'setLevelThreshold', A: 'toggleBall', v: 'toggleSpecies', _: 'enableAll', S: 'disableAll' },
  BagPanel: { s: 'state', u: 'dispatch', d: 'tabIndex', o: 'setTabIndex', y: 'selectedItem', f: 'setSelectedItem', g: 'tab', x: 'items', h: 'prevTab', p: 'nextTab', w: 'toggleItem', k: 'useItem', A: 'itemInfo', v: 'canUse', _: 'activeEffects' },
  buildTrainerTeam: { s: 'team' },
  GymPanel: { s: 'onOpenShop', u: 'state', d: 'dispatch', o: 'canFight', y: 'isBusy', f: 'fightable', g: 'startGymBattle', x: 'startEliteChallenge', h: 'indigoUnlocked', p: 'inGauntlet' },
  RewardShopModal: { s: 'onClose', u: 'state', d: 'dispatch' },
  RightPanel: { s: 'state', u: 'tab', d: 'setTab', o: 'showCatchSettings', y: 'setShowCatchSettings', f: 'showRewardShop', g: 'setShowRewardShop', x: 'openCatchSettings', h: 'closeCatchSettings', p: 'openRewardShop', w: 'closeRewardShop', k: 'location', A: 'isRaid', v: 'routeKey', _: 'raidEncounters', S: 'routeEncounters', D: 'encounters' },
  formatCooldown: { s: 'ms', u: 'totalSeconds', d: 'minutes', o: 'seconds' },
  MapNode: { g: 'hovering', x: 'setHovering', h: 'tick', _: 'showLabel', S: 'className' },
  createRoads: { s: 'fromId', u: 'toId' },
  TownMap: { s: 'state', u: 'dispatch', d: 'currentLocation', o: 'unlockedLocations', y: 'currentLocationData', f: 'travelTo', g: 'roads', x: 'roadSet' },
  MobileTabs: { s: 'state', u: 'dispatch', d: 'tab', o: 'setTab', y: 'inspected', f: 'setInspected', g: 'releaseConfirm', x: 'setReleaseConfirm', h: 'boxInspected', p: 'setBoxInspected', w: 'boxReleaseConfirm', k: 'setBoxReleaseConfirm', A: 'locationTab', v: 'setLocationTab', _: 'showCatchSettings', S: 'setShowCatchSettings', D: 'showRewardShop', z: 'setShowRewardShop', V: 'location', G: 'isRaid', X: 'routeKey', Z: 'raidEncounters', F: 'routeEncounters', q: 'encounters', le: 'boxPokemon', ve: 'moveBoxToParty', Ne: 'evolutionInfo', Q: 'handleEvolve', J: 'requestRelease', _e: 'confirmRelease', je: 'releaseTarget' },
  PatchNotesModal: { s: 'show', u: 'setShow', d: 'dismiss', o: 'latest' },
  AppContent: { s: 'state' },
  App: { s: 'hash', u: 'setHash' },
  BattleScene: { s: 'showMoveManager', u: 'setShowMoveManager', d: 'showInfo', o: 'setShowInfo', y: 'showSettings', f: 'setShowSettings', g: 'state', x: 'dispatch', h: 'playerPokemon', p: 'enemyPokemon', w: 'battleEvents', k: 'catchableCount', A: 'isDexComplete', v: 'currentEvent', _: 'playerSpecies', S: 'activeTrainerBattle', D: 'lastDamageEvent', z: 'lastFaintEvent', V: 'pendingTrainerAppear', G: 'hasTrainerAppeared', X: 'showTrainerIntro', Z: 'trainerIntroSlideOut', F: 'isTrainerSendOut', q: 'isPlayerSwitch', le: 'hideEnemySprite', ve: 'isLatestDamage', Ne: 'playerWasHit', Q: 'enemyWasHit', J: 'enemyFainted', _e: 'playerFainted', je: 'isTown', N: 'townBackground', Y: 'battleBackground' },
}

/** Resolve the Function node for a top-level binding, if it is one. */
function functionPathFor(binding) {
  const p = binding.path
  if (p.isFunctionDeclaration()) return p
  if (p.isVariableDeclarator()) {
    const init = p.get('init')
    if (init.isFunctionExpression() || init.isArrowFunctionExpression()) return init
    if (init.isCallExpression()) {
      for (const arg of init.get('arguments')) {
        if (arg.isFunctionExpression() || arg.isArrowFunctionExpression()) return arg
      }
    }
  }
  return null
}

const src = fs.readFileSync(FILE, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })

const programPath = (() => {
  let found
  traverse(ast, {
    Program(p) {
      found = p
      p.stop()
    },
  })
  return found
})()

const edits = []
const missing = []
const collisions = []
let renamed = 0

for (const [fnName, map] of Object.entries(LOCAL_RENAMES)) {
  if (ONLY_FN && fnName !== ONLY_FN) continue
  const binding = programPath.scope.getOwnBinding(fnName)
  if (!binding) {
    missing.push(`${fnName}: no top-level binding`)
    continue
  }
  const fnPath = functionPathFor(binding)
  if (!fnPath) {
    missing.push(`${fnName}: not a function`)
    continue
  }
  const scope = fnPath.scope
  for (const [oldName, newName] of Object.entries(map)) {
    const local = scope.getOwnBinding(oldName)
    if (!local) {
      missing.push(`${fnName}.${oldName}: no such local binding`)
      continue
    }
    if (scope.getOwnBinding(newName)) {
      collisions.push(`${fnName}.${oldName} -> ${newName}: target already bound`)
      continue
    }
    // Collect candidate identifier nodes before renaming, then keep the ones
    // Babel actually renamed (node objects are mutated in place).
    const candidates = []
    fnPath.traverse({
      Identifier(p) {
        if (p.node.name === oldName) candidates.push(p.node)
      },
    })
    // also the declaration node itself (params/labels may not be visited above)
    if (local.identifier && !candidates.includes(local.identifier))
      candidates.push(local.identifier)

    scope.rename(oldName, newName)

    for (const node of candidates) {
      if (node.name !== oldName) {
        edits.push({ start: node.start, end: node.end, newName, fnName, oldName })
        renamed++
      }
    }
  }
}

if (missing.length) console.warn('Skipped (not found):\n  ' + missing.join('\n  '))
if (collisions.length)
  console.warn('Skipped (collision):\n  ' + collisions.join('\n  '))

edits.sort((a, b) => b.start - a.start)
let out = src
let lastStart = Infinity
for (const e of edits) {
  if (e.end > lastStart) {
    console.error(`Overlapping edit at ${e.start} (${e.fnName}.${e.oldName})`)
    process.exit(1)
  }
  lastStart = e.start
  out = out.slice(0, e.start) + e.newName + out.slice(e.end)
}

console.log(`\n${renamed} identifier edits across ${new Set(edits.map((e) => e.fnName)).size} functions.`)
if (WRITE) {
  fs.writeFileSync(FILE, out)
  console.log(`Wrote ${path.relative(process.cwd(), FILE)}`)
} else {
  console.log('Dry run only. Re-run with --write to apply.')
}
