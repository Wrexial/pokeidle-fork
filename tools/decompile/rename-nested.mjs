#!/usr/bin/env node
/**
 * Line-anchored renamer for nested (block-scoped / callback) bindings.
 *
 * Because short names are reused with different roles in sibling scopes (e.g.
 * every `gameReducer` case declares its own `d`/`o`), we target a binding by the
 * line on which it is declared:
 *
 *   NESTED_RENAMES = {
 *     gameReducer: {
 *       538: { d: 'starterPokemon', o: 'starterSpeciesKey' },
 *       ...
 *     },
 *   }
 *
 * Safety: refuses a rename if the target name is already bound in the binding's
 * own scope or any ancestor scope (which would silently change resolution).
 *
 * Usage:
 *   node tools/decompile/rename-nested.mjs            # dry run + report
 *   node tools/decompile/rename-nested.mjs --write
 *   node tools/decompile/rename-nested.mjs --fn gameReducer
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

/** @type {Record<string, Record<string|number, Record<string,string>>>} */
const NESTED_RENAMES = {
  getLevelUpResults: {
    118: { g: 'requiredExp' },
    121: { h: 'learnedMoves' },
    122: { p: 'learnLevel' },
    123: { p: 'moveId' },
  },
  getFamilyLearnset: {
    143: { f: 'chainSpeciesKey' },
    144: { g: 'learnset' },
    145: { x: 'learnLevel', h: 'moveId' },
  },
  resolvePokemonMoves: { 159: { y: 'learnLevel' }, 160: { y: 'moveId' } },
  getItemInfo: { 347: { u: 'item' }, 354: { u: 'item' }, 361: { u: 'item' } },
  computeUnlockedLocations: {
    450: { o: 'locationId', y: 'location' },
    452: { f: 'unlockRule' },
    455: { g: 'requiredBattles' },
  },
  syncActivePokemonIntoParty: { 478: { y: 'member' } },
  prepareNextBattle: { 518: { y: 'member' } },
  tickBattleCounters: { 529: { u: 'effect' }, 533: { u: 'effect' } },
  gameReducer: {
    538: { d: 'starterPokemon' },
    539: { o: 'speciesKey' },
    556: { d: 'firstAliveIndex', y: 'member' },
    557: { o: 'activeIndex' },
    584: { d: 'event', o: 'remainingEvents' },
    585: { y: 'battleLog' },
    586: { f: 'newPhase' },
    593: { g: 'playerPokemon' },
    594: { x: 'enemyPokemon' },
    595: { h: 'wildBattlesWon' },
    596: { p: 'battlesWonByLocation' },
    610: { w: 'activeEffects' },
    618: { A: 'locationWins' },
    625: { k: 'syncedState' },
    641: { A: 'unlocked' },
    642: { v: 'newlyUnlocked', S: 'locationId' },
    643: { _: 'log' },
    644: { S: 'locationId' },
    645: { D: 'location' },
    658: { d: 'newTotalExp' },
    659: { o: 'updatedPokemon' },
    663: { y: 'battleLog' },
    665: { f: 'hpGain' },
    683: { f: 'newMoves' },
    684: { g: 'moveId' },
    732: { d: 'nextState' },
    747: { d: 'moves' },
    760: { d: 'speciesKey' },
    761: { o: 'level' },
    762: { y: 'pokeballUsed' },
    763: { f: 'isShiny' },
    765: { g: 'catchLevel' },
    766: { x: 'newPokemon' },
    767: { h: 'species' },
    768: { p: 'inventory' },
    770: { w: 'ownedCount' },
    804: { d: 'pokemonId', o: 'toIndex' },
    806: { y: 'fromIndex', w: 'member' },
    808: { f: 'baseState' },
    809: { g: 'activeId' },
    810: { x: 'party' },
    811: { h: 'moved' },
    813: { p: 'newActiveIndex', w: 'member' },
    821: { d: 'indexA', o: 'indexB' },
    823: { y: 'baseState' },
    824: { f: 'activeId' },
    825: { g: 'party' },
    827: { x: 'newActiveIndex', h: 'member' },
    836: { d: 'partyIndex' },
    838: { o: 'baseState' },
    839: { y: 'removed' },
    840: { f: 'newParty', h: 'member', p: 'index' },
    841: { g: 'activeId' },
    842: { x: 'newActiveIndex', h: 'member' },
    852: { d: 'boxIndex' },
    854: { o: 'pokemon' },
    855: { y: 'newBox', f: 'member', g: 'index' },
    863: { d: 'partyIndex', o: 'boxIndex' },
    865: { y: 'baseState' },
    866: { f: 'party' },
    867: { g: 'box' },
    869: { x: 'activeId' },
    870: { h: 'newActiveIndex', p: 'member' },
    879: { d: 'locationId' },
    881: { o: 'location' },
    882: { y: 'routeKey' },
    883: { f: 'unlocked' },
    898: { d: 'pokemonId' },
    899: { o: 'fromSpeciesKey' },
    900: { y: 'toSpeciesKey' },
    901: { f: 'consumeItem' },
    903: { g: 'fromSpecies' },
    904: { x: 'evolvingPokemon', p: 'member' },
    905: { h: 'inventory' },
    907: { p: 'ownedItemCount' },
    946: { d: 'pokemonId' },
    947: { o: 'fromSpeciesKey' },
    948: { y: 'toSpeciesKey' },
    950: { f: 'toSpecies' },
    951: { g: 'fromSpecies' },
    952: { x: 'evolveMember', v: 'member' },
    954: { _: 'newStats' },
    955: { S: 'hpGain' },
    956: { z: 'newMoveIds' },
    957: { G: 'moveId' },
    958: { G: 'moveId' },
    959: { G: 'moveId' },
    960: { V: 'moves' },
    961: { G: 'moveId' },
    977: { h: 'party' },
    978: { p: 'box' },
    979: { w: 'playerPokemon' },
    980: { k: 'pokedexSeen' },
    981: { A: 'pokedexCaught' },
    1000: { d: 'routeKey', o: 'speciesKey', y: 'rule' },
    1001: { f: 'routeSettings' },
    1020: { d: 'routeKey', o: 'enabled' },
    1021: { y: 'routeEncounters' },
    1023: { f: 'settings' },
    1026: { g: 'encounter' },
    1027: { x: 'baseRule' },
    1043: { d: 'trainerId' },
    1044: { o: 'trainerName' },
    1045: { y: 'trainerClass' },
    1046: { f: 'trainerTeam' },
    1048: { g: 'firstPokemon' },
    1078: { d: 'bossId' },
    1079: { o: 'bossType' },
    1080: { y: 'trainerName' },
    1081: { f: 'trainerClass' },
    1082: { g: 'trainerTeam' },
    1083: { x: 'bossQueue' },
    1084: { h: 'spriteKey' },
    1086: { p: 'firstPokemon' },
    1118: { d: 'newIndex' },
    1119: { o: 'party' },
    1120: { y: 'oldIndex' },
    1127: { f: 'nextPokemon' },
    1148: { d: 'newIndex' },
    1149: { o: 'battle' },
    1151: { y: 'nextPokemon' },
    1153: { f: 'team' },
    1154: { g: 'oldIndex' },
    1160: { x: 'updatedBattle' },
    1186: { d: 'won', o: 'moneyDelta' },
    1187: { y: 'newMoney' },
    1188: { f: 'eventType' },
    1189: { g: 'message' },
    1190: { x: 'trainerBattlesWon' },
    1191: { h: 'locationWins' },
    1192: { p: 'battlesWonByLocation' },
    1198: { w: 'activeEffects' },
    1199: { k: 'nextState' },
    1218: { d: 'won', o: 'moneyDelta' },
    1219: { y: 'newMoney' },
    1220: { f: 'eventType' },
    1221: { g: 'message' },
    1222: { x: 'trainerBattlesWon' },
    1223: { h: 'locationWins' },
    1224: { p: 'battlesWonByLocation' },
    1230: { w: 'activeEffects' },
    1231: { k: 'defeatedGyms' },
    1232: { A: 'defeatedEliteFour' },
    1233: { v: 'championDefeated' },
    1234: { _: 'victoryTokens' },
    1235: { S: 'notifications' },
    1237: { z: 'bossType', V: 'bossId' },
    1246: { z: 'nextBoss', V: 'remainingQueue' },
    1247: { G: 'firstPokemon' },
    1248: { Z: 'stateWithNextBoss' },
    1266: { F: 'notification' },
    1296: { D: 'finalState' },
    1311: { z: 'notification' },
    1323: { d: 'healedParty', y: 'member' },
    1327: { o: 'playerPokemon' },
    1336: { d: 'itemId', o: 'quantity' },
    1337: { y: 'ball' },
    1339: { f: 'cost' },
    1341: { g: 'owned' },
    1353: { f: 'item' },
    1355: { g: 'cost' },
    1357: { x: 'owned' },
    1371: { d: 'pokeballId' },
    1372: { o: 'owned' },
    1384: { d: 'speciesKey' },
    1393: { d: 'speciesKey' },
    1394: { o: 'pokedexSeen' },
    1395: { y: 'pokedexCaught' },
    1407: { d: 'speciesKey' },
    1416: { d: 'speciesKey' },
    1445: { d: 'healedParty', y: 'member' },
    1449: { o: 'playerPokemon' },
    1451: { y: 'bossBattle' },
    1452: { f: 'firstPokemon' },
    1488: { y: 'returnLocation' },
    1489: { f: 'routeKey' },
    1490: { g: 'locationName' },
    1524: { d: 'pokemonId', o: 'toIndex' },
    1525: { y: 'fromIndex', h: 'member' },
    1527: { f: 'clampedIndex' },
    1528: { g: 'box' },
    1529: { x: 'moved' },
    1539: { d: 'sortedBox', o: 'a', y: 'b' },
    1540: { f: 'aId' },
    1541: { g: 'bId' },
    1558: { d: 'pokemonId', o: 'source' },
    1562: { h: 'member' },
    1565: { y: 'baseState' },
    1566: { f: 'newParty', h: 'member' },
    1567: { g: 'activeId' },
    1568: { x: 'newActiveIndex', h: 'member' },
    1594: { d: 'itemId', o: 'cost' },
    1596: { y: 'owned' },
    1607: { d: 'healedParty', g: 'member' },
    1611: { o: 'playerPokemon' },
    1612: { f: 'raidLevel', g: 'legendary' },
    1640: { d: 'playerVolatile', o: 'enemyVolatile' },
    1641: { y: 'enemyPokemon' },
    1659: { d: 'itemId', o: 'routeKey', y: 'speciesKey' },
    1660: { f: 'owned' },
    1662: { g: 'item' },
    1664: { x: 'existingIndex' },
    1665: { p: 'existingEffect' },
    1667: { h: 'activeEffects' },
    1675: { p: 'newEffect' },
    1694: { d: 'partyExp' },
    1696: { o: 'party' },
    1697: { y: 'battleLog' },
    1698: { x: 'entry' },
    1700: { h: 'member' },
    1708: { p: 'hpGain' },
    1723: { p: 'moves' },
    1724: { w: 'moveId' },
    1734: { f: 'activeIndex' },
    1735: { g: 'playerPokemon' },
  },
  GameProvider: {
    1755: { o: 'initialState' },
    1757: { y: 'savedJson' },
    1759: { f: 'saved' },
    1761: { g: 'nextId' },
    1762: { x: 'playerPokemon' },
    1767: { h: 'party' },
    1785: { p: 'box' },
    1786: { S: 'pokemon' },
    1787: { D: 'normalized' },
    1802: { S: 'pokemon' },
    1810: { S: 'pokemon' },
    1818: { w: 'catchSettings' },
    1819: { S: 'speciesKey' },
    1820: { D: 'ballId' },
    1821: { z: 'rule' },
    1826: { k: 'seen' },
    1827: { A: 'caught' },
    1829: { S: 'speciesSet' },
    1830: { D: 'pokemon' },
    1833: { v: 'caughtSet' },
    1834: { S: 'speciesKey' },
    1835: { D: 'preEvolution' },
    1838: { _: 'seenSet' },
    1910: { o: 'saveData' },
  },
  resolveActiveModifiers: { 1990: { o: 'effect' } },
  resolvePokemonEncounter: {
    2006: { x: 'encounter' },
    2007: { h: 'modifier', p: 'candidate' },
    2015: { x: 'accumulator', h: 'encounter' },
    2017: { x: 'encounter' },
    2019: { h: 'level' },
  },
  StarterSelect: {
    2048: { u: 'speciesKey' },
    2049: { d: 'species' },
    2050: { o: 'stats' },
    2073: { e: 'event' },
    2082: { y: 'type' },
  },
  useTypewriter: { 2262: { x: 'intervalId' } },
  SpeedControls: { 2311: { d: 'speedOption' } },
  MoveManagerPanel: {
    2348: { k: 'moveId' },
    2350: { A: 'existingMoveId' },
    2371: { k: 'event' },
    2392: { k: 'slotIndex' },
    2393: { A: 'moveId' },
    2394: { v: 'moveDef' },
    2430: { k: 'moveId', A: 'learnLevel' },
    2431: { v: 'moveDef' },
    2433: { _: 'isSelected' },
  },
  EvolutionScene: {
    2491: { p: 'speed' },
    2492: { h: 'swapTimeout' },
    2500: { f: 'doneTimeout' },
    2508: { w: 'completeTimeout' },
    2544: { e: 'event' },
  },
  HealingScene: {
    2564: { p: 'speed' },
    2565: { f: 'healTimeout' },
    2573: { g: 'doneTimeout' },
    2581: { x: 'completeTimeout' },
    2592: { f: 'video' },
    2594: { g: 'handleCanPlay' },
  },
  SettingsModal: { 2652: { y: 'event' } },
  BattleScene: {
    2790: { P: 'event' },
    2791: { P: 'event' },
    2795: { P: 'event' },
    2796: { P: 'event' },
    2856: { P: 'event' },
    2948: { P: 'member', ae: 'index' },
    2961: { P: 'member', ae: 'index' },
    2997: { e: 'event' },
    3014: { e: 'event' },
    3054: { P: 'moveId' },
    3055: { ae: 'moveDef' },
  },
  BattleLog: {
    3135: { g: 'containerEl' },
    3137: { x: 'resizeObserver', h: 'entries' },
    3138: { p: 'entry' },
    3163: { g: 'effect', x: 'index' },
    3164: { h: 'label' },
    3183: { g: 'entry', x: 'index' },
  },
  LevelUpNotification: { 3207: { d: 'timeoutId' } },
  getTypeEffectiveness: { 3384: { o: 'defenderType' } },
  chooseBestMove: {
    3444: { A: 'moveId' },
    3445: { v: 'moveDef' },
    3447: { _: 'effectiveAttack' },
    3448: { S: 'effectiveDefense' },
    3449: { D: 'attackStatKey' },
    3450: { z: 'defenseStatKey' },
    3451: { V: 'attackStage' },
    3452: { G: 'defenseStage' },
    3453: { X: 'damage' },
  },
  chooseRandomMove: { 3480: { y: 'moveId' }, 3481: { f: 'moveDef' } },
  resolveBattleTurn: {
    3507: { v: 'bestMove' },
    3525: { v: 'bestMove' },
    3603: { v: 'attack' },
    3612: { S: 'moveDef' },
    3629: { q: 'statTarget' },
    3630: { le: 'side' },
    3632: { ve: 'statKey', Ne: 'delta' },
    3633: { Q: 'key' },
    3634: { J: 'currentStage' },
    3635: { _e: 'newStage' },
    3637: { je: 'verb' },
    3638: { W: 'sharply' },
    3650: { D: 'attackStat' },
    3652: { z: 'defenseStat' },
    3653: { V: 'attackStatKey' },
    3654: { G: 'defenseStatKey' },
    3655: { X: 'attackerStage' },
    3656: { Z: 'defenderStage' },
    3657: { F: 'damageResult' },
    3675: { q: 'crashDamage' },
    3728: { q: 'recoilDamage' },
    3782: { q: 'selfDamage' },
  },
  selectBestBall: { 3850: { f: 'ballId' }, 3853: { f: 'ballId' } },
  awardExperience: {
    3885: { _: 'lastLevelUp' },
    3886: { S: 'newStats' },
    3887: { D: 'newMoves', z: 'moveId' },
    3888: { z: 'moveId' },
    3889: { V: 'moveDef' },
    3922: { _: 'sharedExp' },
    3924: { S: 'sharedResults' },
    3925: { D: 'memberIndex' },
    3927: { z: 'member' },
    3929: { V: 'memberSpecies' },
    3930: { G: 'memberTotalExp' },
    3931: { X: 'memberLevelUps' },
    3933: { Z: 'lastLevelUp' },
    3934: { F: 'memberStats' },
    3935: { q: 'memberNewMoves', le: 'moveId' },
    3936: { le: 'moveId' },
    3937: { ve: 'moveDef' },
  },
  useGameLoop: {
    3985: { p: 'speed' },
    4004: { G: 'trainerList' },
    4006: { X: 'trainer' },
    4007: { Z: 'trainerTeam', F: 'teamMember' },
    4008: { q: 'species' },
    4009: { le: 'stats' },
    4010: { ve: 'moves' },
    4044: { G: 'legendary' },
    4045: { Ne: 'candidate' },
    4048: { X: 'species' },
    4050: { Z: 'raidLevel' },
    4051: { F: 'ivs' },
    4052: { q: 'stats' },
    4053: { le: 'moves' },
    4054: { ve: 'enemyPokemon' },
    4164: { A: 'playerVolatile' },
    4165: { v: 'playerBattlePokemon' },
    4188: { _: 'enemyBattlePokemon' },
    4191: { S: 'isTrainerBattle' },
    4194: { D: 'turnEvents' },
    4201: { z: 'playerVolatileUpdate' },
    4207: { V: 'enemyVolatileUpdate' },
    4232: { A: 'hasExpShare' },
    4233: { z: 'effect' },
    4236: { z: 'switchIndex' },
    4237: { V: 'member', G: 'index' },
    4266: { v: 'trainerBattle' },
    4278: { z: 'nextIndex' },
    4287: { V: 'maxLevel', X: 'member' },
    4288: { G: 'payout' },
    4307: { _: 'enemyPokemon' },
    4317: { S: 'forceCatch' },
    4328: { z: 'ballId' },
    4384: { A: 'activeIndex' },
    4385: { v: 'switchIndex' },
    4386: { _: 'member', S: 'index' },
    4397: { S: 'penalty' },
    4399: { D: 'member' },
    4454: { p: 'previousUnlocked' },
    4456: { w: 'newLocations', A: 'locationId' },
    4459: { A: 'locationId' },
    4460: { A: 'locationId' },
    4462: { A: 'locA', v: 'locB' },
    4467: { p: 'pendingLocation' },
  },
  useIsMobile: { 4484: { d: 'mediaQuery' }, 4485: { o: 'handleChange', y: 'event' } },
  BattleScreen: {
    4505: { p: 'containerWidth' },
    4507: { w: 'battleScene' },
    4508: { k: 'scrollHeight' },
    4509: { A: 'marginBottom' },
    4516: { p: 'resizeObserver' },
    4521: { p: 'battleScene' },
    4522: { w: 'scrollHeight' },
    4523: { k: 'marginBottom' },
    4531: { p: 'scaledHeight' },
  },
  StatsPanel: {
    4639: { S: 'evolutionEntry', D: 'entryIndex' },
    4667: { e: 'event' },
    4690: { S: 'type' },
    4707: { S: 'statRow' },
    4708: { D: 'statIndex' },
    4750: { S: 'moveId' },
    4751: { D: 'moveDef' },
  },
  PartyPanel: {
    4822: { Q: 'memberId' },
    4824: { Q: 'memberId' },
    4827: { Q: 'partyIndex' },
    4843: { Q: 'boxIndex', J: 'member' },
    4852: { Q: 'boxIndex', J: 'member' },
    4886: { Q: 'evolutionChain' },
    4889: { J: 'evolution' },
    4890: { _e: 'targetSpecies' },
    4891: { je: 'levelMet' },
    4892: { W: 'itemOwned' },
    4893: { N: 'canEvolve' },
    4894: { Y: 'requirementParts' },
    4896: { P: 'evolutionEntry' },
    4910: { Q: 'evolutionEntry' },
    4912: { J: 'evolution' },
    4928: { Q: 'memberId' },
    4941: { Q: 'member' },
    4947: { Q: 'member' },
    4957: { Q: 'member' },
    4968: { Q: 'member', J: 'index' },
    4969: { _e: 'species' },
    4970: { je: 'isFirst' },
    4971: { W: 'isInspected' },
    4972: { N: 'isDraggingIndex' },
    4973: { Y: 'showDropAbove' },
    4979: { P: 'showDropBelow' },
    4985: { ae: 'isBoxDropTarget' },
    4998: { me: 'event' },
    4999: { me: 'event' },
    5006: { e: 'event' },
  },
  PokedexTile: { 5140: { e: 'event' } },
  PokedexModal: {
    5176: { k: 'speciesKey' },
    5226: { k: 'event' },
    5250: { k: 'speciesKey' },
    5251: { A: 'status' },
    5259: { v: 'next' },
    5278: { e: 'event' },
    5300: { k: 'type' },
    5324: { k: 'statRow' },
    5344: { k: 'statRow' },
    5345: { A: 'statIndex' },
  },
  BoxPanel: {
    5403: { ve: 'index' },
    5466: { ve: 'index', Ne: 'slotIndex' },
    5467: { Q: 'boxIndex' },
    5468: { J: 'pokemon' },
    5470: { _e: 'species' },
    5471: { je: 'isInspected' },
    5472: { W: 'isDraggingIndex' },
    5473: { N: 'isDropTarget' },
    5474: { Y: 'isDraggable' },
    5482: { P: 'event' },
    5483: { P: 'event' },
    5488: { e: 'event' },
    5504: { _e: 'event' },
  },
  PartyBoxPanel: {
    5565: { W: 'event', N: 'fromIndex', Y: 'pokemonId' },
    5577: { W: 'event', N: 'fromIndex', Y: 'pokemonId' },
    5589: { W: 'event', N: 'targetIndex' },
    5591: { Y: 'rect' },
    5592: { P: 'midpoint' },
    5593: { ae: 'position' },
    5603: { W: 'event', N: 'targetIndex' },
    5615: { W: 'event' },
    5620: { W: 'source' },
    5621: { N: 'fromIndex' },
    5622: { Y: 'pokemonId' },
    5623: { P: 'target' },
    5624: { ae: 'targetIndex' },
    5625: { me: 'position' },
    5626: { L: 'droppedOnBoxContainer' },
    5637: { B: 'toIndex' },
    5667: { B: 'boxIndex', I: 'member' },
    5687: { W: 'event' },
    5696: { W: 'event' },
  },
  EncounterDetailPanel: {
    5951: { G: 'effect' },
    5954: { G: 'effect' },
    6030: { e: 'event' },
    6053: { G: 'type' },
    6103: { G: 'statRow' },
    6104: { X: 'percent' },
  },
  RouteEncounterGrid: {
    6261: { Z: 'entry' },
    6261: { F: 'encounter' },
    6262: { Z: 'a' },
    6262: { F: 'b' },
    6264: { Z: 'effectMap' },
    6265: { F: 'effect' },
    6278: { Z: 'speciesKey' },
    6287: { Z: 'encounter' },
    6290: { q: 'weightedRate' },
    6303: { F: 'weightedRate' },
    6310: { Z: 'entry' },
    6329: { Z: 'encounter' },
    6338: { Z: 'encounter' },
    6364: { Z: 'encounter' },
    6365: { F: 'weightedRate' },
    6366: { q: 'tier' },
  },
  ShopPanel: {
    6412: { f: 'qtyOption' },
    6428: { f: 'shopItem' },
    6435: { x: 'item' },
    6453: { g: 'ball' },
  },
  LocationPanel: {
    6592: { h: 'candidateLocation' },
    6594: { p: 'unlockRule' },
    6601: { h: 'a', p: 'b' },
    6607: { h: 'locationId' },
    6655: { p: 'legendary' },
    6734: { h: 'unlockRule' },
    6735: { p: 'requirements' },
    6737: { w: 'requirement' },
    6738: { k: 'locationName' },
    6739: { A: 'wonCount' },
    6775: { w: 'requirement' },
    6775: { k: 'index' },
  },
  CatchSettingsModal: {
    6831: { D: 'newMode' },
    6832: { z: 'encounter' },
    6833: { V: 'rule' },
    6850: { D: 'event' },
    6851: { z: 'newLevelThreshold' },
    6852: { V: 'encounter' },
    6853: { G: 'rule' },
    6870: { D: 'ballId' },
    6871: { z: 'encounter' },
    6872: { V: 'rule' },
    6873: { G: 'currentBalls' },
    6874: { X: 'nextBalls' },
    6875: { Z: 'otherBallId' },
    6892: { D: 'speciesKey' },
    6893: { z: 'rule' },
    6931: { D: 'event' },
    6965: { D: 'encounter' },
    6965: { z: 'species' },
    6989: { V: 'event' },
    7003: { D: 'event' },
    7052: { D: 'encounter' },
    7053: { z: 'species' },
    7055: { V: 'rule' },
    7065: { e: 'event' },
  },
  BagPanel: {
    7091: { S: 'itemId' },
    7091: { D: 'quantity' },
    7098: { S: 'itemId' },
    7099: { D: 'quantity' },
    7101: { S: 'itemId' },
    7113: { S: 'itemId' },
    7149: { S: 'itemId' },
    7149: { D: 'quantity' },
    7150: { z: 'item' },
    7151: { V: 'isActive' },
    7151: { G: 'effect' },
    7191: { S: 'effect' },
    7191: { D: 'index' },
  },
  buildTrainerTeam: {
    7212: { u: 'member' },
    7213: { d: 'species' },
    7214: { o: 'stats' },
    7215: { y: 'moves' },
  },
  GymPanel: {
    7236: { w: 'member' },
    7239: { w: 'member', k: 'badgeId', A: 'index', v: 'badge' },
    7272: { w: 'leader' },
    7273: { v: 'team' },
    7290: { k: 'leader' },
    7290: { A: 'index' },
    7310: { w: 'gymLeader' },
    7311: { k: 'unlocked' },
    7334: { w: 'leader', k: 'leaderIndex' },
    7335: { A: 'unlocked' },
    7336: { v: 'defeated' },
    7337: { _: 'unlockedByOrder' },
    7338: { S: 'canStart' },
    7403: { w: 'member' },
    7404: { k: 'defeated' },
    7405: { A: 'isActive' },
  },
  RewardShopModal: {
    7503: { o: 'event' },
    7533: { o: 'rewardItem' },
    7534: { y: 'item' },
    7535: { f: 'owned' },
    7536: { g: 'canAfford' },
  },
  RightPanel: {
    7625: { z: 'encounter' },
    7639: { z: 'tabDef' },
  },
  MapNode: { 7703: { D: 'intervalId', z: 'n' } },
  TownMap: {
    7793: { p: 'legendary' },
    7811: { h: 'location' },
    7812: { p: 'connectionId' },
    7813: { w: 'roadKey' },
    7847: { h: 'fromId' },
    7847: { p: 'toId' },
    7848: { k: 'roadClass' },
    7849: { A: 'segment' },
    7849: { v: 'segmentIndex' },
    7863: { h: 'fromId' },
    7863: { p: 'toId' },
    7864: { k: 'roadClass' },
    7865: { A: 'segment' },
    7865: { v: 'segmentIndex' },
    7881: { h: 'locationId' },
    7882: { p: 'location' },
    7883: { w: 'isUnlocked' },
    7885: { k: 'isCurrent' },
    7886: { A: 'onCooldown' },
    7890: { v: 'isClickable' },
  },
  MobileTabs: {
    7941: { W: 'encounter' },
    7950: { W: 'memberId' },
    7953: { W: 'boxIndex', N: 'member' },
    7966: { W: 'evolutionChain' },
    7969: { N: 'evolution' },
    7970: { Y: 'targetSpecies' },
    7971: { P: 'levelMet' },
    7972: { ae: 'itemOwned' },
    7973: { me: 'canEvolve' },
    7974: { L: 'requirementParts' },
    7976: { B: 'evolutionEntry' },
    7990: { W: 'evolutionEntry' },
    7992: { N: 'evolution' },
    8022: { W: 'locationId' },
    8028: { W: 'tabDef' },
  },
  PatchNotesModal: {
    8364: { y: 'event' },
    8391: { y: 'section', f: 'sectionIndex' },
    8403: { g: 'item', x: 'itemIndex' },
  },
  PatchNotesPage: {
    8468: { s: 'entry', u: 'entryIndex' },
    8487: { d: 'section', o: 'sectionIndex' },
    8499: { y: 'item', f: 'itemIndex' },
  },
  App: { 8551: { d: 'handleHashChange' } },
}

/**
 * Second pass: fixes leftovers from duplicate-key mistakes in the first pass
 * (JS silently keeps only the last of duplicate literal keys) and a few bindings
 * that were previously missed. Keys/names here reflect the state *after* pass 1.
 */
const NESTED_RENAMES_PASS2 = {
  gameReducer: {
    1539: { a: 'left', b: 'right' },
    1540: { aId: 'leftId' },
    1541: { bId: 'rightId' },
  },
  GameProvider: { 1770: { S: 'pokemon' }, 1771: { D: 'normalized' } },
  resolveBattleTurn: { 3767: { q: 'lockTurns' } },
  useGameLoop: { 4458: { k: 'targetLocation' } },
  PokedexModal: { 5324: { A: 'percent' } },
  RouteEncounterGrid: { 6261: { Z: 'accumulator' }, 6262: { Z: 'left', b: 'right' } },
  LocationPanel: { 6775: { w: 'requirement' }, 6601: { a: 'left', b: 'right' } },
  CatchSettingsModal: { 6965: { D: 'encounter' } },
  BagPanel: {
    7091: { S: 'itemId' },
    7149: { S: 'itemId' },
    7151: { V: 'isActive' },
    7191: { S: 'effect' },
  },
  GymPanel: { 7290: { k: 'defeatedElite', index: 'isActive' } },
  MapNode: { 7703: { n: 'tickCount' } },
  TownMap: {
    7847: { h: 'fromId' },
    7849: { A: 'segment' },
    7863: { h: 'fromId' },
    7865: { A: 'segment' },
  },
}

function functionPathFor(binding) {
  const p = binding.path
  if (p.isFunctionDeclaration()) return p
  if (p.isVariableDeclarator()) {
    const init = p.get('init')
    if (init.isFunctionExpression() || init.isArrowFunctionExpression()) return init
    if (init.isCallExpression())
      for (const a of init.get('arguments'))
        if (a.isFunctionExpression() || a.isArrowFunctionExpression()) return a
  }
  return null
}

const src = fs.readFileSync(FILE, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })

let programPath
traverse(ast, {
  Program(p) {
    programPath = p
    p.stop()
  },
})

const edits = []
const problems = []
let applied = 0

const ONLY_PASS2 = process.argv.includes('--pass2')
for (const [fnName, byLine] of ONLY_PASS2
  ? Object.entries(NESTED_RENAMES_PASS2)
  : [
      ...Object.entries(NESTED_RENAMES),
      ...Object.entries(NESTED_RENAMES_PASS2),
    ]) {
  if (ONLY_FN && fnName !== ONLY_FN) continue
  const topBinding = programPath.scope.getOwnBinding(fnName)
  if (!topBinding) {
    problems.push(`${fnName}: no top-level binding`)
    continue
  }
  const fnPath = functionPathFor(topBinding)
  if (!fnPath) {
    problems.push(`${fnName}: not a function`)
    continue
  }

  for (const [lineKey, map] of Object.entries(byLine)) {
    const line = Number(lineKey)
    for (const [oldName, newName] of Object.entries(map)) {
      // find the binding(s) declared on this line with this name, within fnPath
      const matches = []
      fnPath.traverse({
        enter(p) {
          if (typeof p.isScope === 'function' && p.isScope()) {
            const b = p.scope.getOwnBinding(oldName)
            if (b && b.identifier.loc.start.line === line) matches.push(b)
          }
        },
      })
      if (matches.length === 0) {
        problems.push(`${fnName} L${line}.${oldName}: no binding found`)
        continue
      }
      for (const binding of matches) {
        const scope = binding.scope
        if (scope.getOwnBinding(newName)) {
          problems.push(`${fnName} L${line}.${oldName} -> ${newName}: target bound in own scope`)
          continue
        }
        if (scope.parent && scope.parent.getBinding(newName)) {
          problems.push(`${fnName} L${line}.${oldName} -> ${newName}: target bound in outer scope`)
          continue
        }
        const candidates = []
        const ownerPath = scope.path
        ownerPath.traverse({
          Identifier(p) {
            if (p.node.name === oldName && p.scope.getBinding(oldName) === binding)
              candidates.push(p.node)
          },
        })
        if (!candidates.includes(binding.identifier)) candidates.push(binding.identifier)
        scope.rename(oldName, newName)
        for (const node of candidates)
          if (node.name !== oldName) {
            edits.push({ start: node.start, end: node.end, newName })
            applied++
          }
      }
    }
  }
}

if (problems.length) console.warn('Problems:\n  ' + problems.join('\n  '))

edits.sort((a, b) => b.start - a.start)
let out = src
let lastStart = Infinity
for (const e of edits) {
  if (e.end > lastStart) {
    console.error(`Overlapping edit at ${e.start}`)
    process.exit(1)
  }
  lastStart = e.start
  out = out.slice(0, e.start) + e.newName + out.slice(e.end)
}

console.log(`\n${applied} identifier edits applied.`)
if (WRITE) {
  fs.writeFileSync(FILE, out)
  console.log(`Wrote ${path.relative(process.cwd(), FILE)}`)
} else {
  console.log('Dry run only. Re-run with --write to apply.')
}
