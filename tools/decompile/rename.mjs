#!/usr/bin/env node
/**
 * Safely rename top-level minified identifiers in assets/index.js.
 *
 * Strategy: parse with Babel, resolve every top-level binding, then replace the
 * exact source spans of that binding and its references. This is scope-aware, so
 * shadowing locals and identical text inside strings/comments/property names are
 * left untouched, and the original formatting is preserved (no codegen).
 *
 * Usage:  node tools/decompile/rename.mjs [--write]
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

/** old -> new (only top-level bindings) */
const RENAMES = {
  // stat / exp helpers
  jf: 'evValue',
  Kh: 'calculateHpStat',
  Ul: 'calculateOtherStat',
  Dh: 'calculateExpYield',
  df: 'getLevelUpResults',
  jh: 'getPreEvolutionChain',
  Mh: 'getFamilyLearnset',
  // constants
  Wa: 'legendaryPool',
  _h: 'RAID_COOLDOWN_MS',
  Bh: 'defaultCatchSettings',
  // battle state helpers
  ql: 'createVolatileState',
  Ra: 'getCatchRule',
  // item tables
  Yn: 'activeItems',
  Ka: 'pokeBalls',
  Fo: 'ballOrder',
  ds: 'bagCategories',
  Oh: 'getItemCategory',
  Vl: 'isActiveEffectItem',
  Gn: 'evolutionItems',
  zh: 'tokenShopItems',
  Xo: 'getItemInfo',
  // game state
  Hh: 'initialGameState',
  pf: 'createPokemon',
  Yl: 'computeUnlockedLocations',
  _f: 'getActivePartyIndex',
  Hn: 'syncActivePokemonIntoParty',
  Gl: 'loadActivePokemonFromParty',
  Uh: 'createIdleBattleState',
  Kt: 'prepareNextBattle',
  Yo: 'tickBattleCounters',
  Yh: 'gameReducer',
  ff: 'SAVE_KEY',
  Bf: 'GameContext',
  Gh: 'GameProvider',
  Re: 'useGame',
  Qh: 'starterSpecies',
  // components
  Ih: 'StarterSelect',
  Jo: 'HpBar',
  Of: 'ExpBar',
  Fh: 'PlayerInfoBox',
  Jh: 'EnemyInfoBox',
  Wh: 'useTypewriter',
  $h: 'BattleTextBox',
  eg: 'SPEED_OPTIONS',
  tg: 'SpeedControls',
  mf: 'moveCategoryIcons',
  ag: 'MoveManagerPanel',
  ng: 'EvolutionScene',
  lg: 'HealingScene',
  ig: 'SAVE_KEY_ALT',
  sg: 'SettingsModal',
  ug: 'trainerClassPayouts',
  vf: 'BattleScene',
  fg: 'BATTLE_LOG_MIN_HEIGHT',
  mg: 'BattleLog',
  bf: 'LevelUpNotification',
  // type / damage math
  hg: 'getTypeEffectiveness',
  zf: 'getTypeMultiplier',
  ms: 'statStageMultiplier',
  gg: 'calculateDamage',
  vg: 'estimateMoveDamage',
  xf: 'chooseBestMove',
  bg: 'chooseRandomMove',
  Sf: 'getStatStage',
  xg: 'clampStatStage',
  Sg: 'resolveBattleTurn',
  kg: 'getStatLabel',
  // catching
  Hf: 'getCatchRate',
  Eg: 'calculateCatchChance',
  Lg: 'attemptCatch',
  Uf: 'selectBestBall',
  Ag: 'shouldAutoCatch',
  Tg: 'selectAutoCatchBall',
  Go: 'awardExperience',
  Ng: 'useGameLoop',
  // layout / responsive
  kf: 'MOBILE_BREAKPOINT',
  Yf: 'useIsMobile',
  wf: 'DESIGN_WIDTH',
  Ef: 'BattleScreen',
  // panels
  Cg: 'categoryIcons',
  Rg: 'statBarColors',
  Gf: 'StatsPanel',
  qf: 'PartyPanel',
  Pf: 'PokedexTile',
  Kg: 'statBarColorsPokedex',
  Dg: 'STAT_DISPLAY_MAX',
  jg: 'PokedexModal',
  qo: 'BOX_PAGE_SIZE',
  Xf: 'BoxPanel',
  ps: 'initialDragState',
  Mg: 'PartyBoxPanel',
  Og: 'EncounterDetailPanel',
  zg: 'pokeballColors',
  Wo: 'PokeballIcon',
  Tf: 'getRarityFromRate',
  Nf: 'RouteEncounterGrid',
  Hg: 'ShopPanel',
  Ug: 'BallShopRow',
  Yg: 'ItemShopRow',
  Vf: 'LocationPanel',
  Gg: 'CATCH_MODE_OPTIONS',
  Qf: 'CatchSettingsModal',
  If: 'BagPanel',
  Po: 'buildTrainerTeam',
  Zf: 'GymPanel',
  Ff: 'RewardShopModal',
  qg: 'SIDE_PANEL_TABS',
  Pg: 'RightPanel',
  Xg: 'formatCooldown',
  Vg: 'MapNode',
  Jf: 'TownMap',
  Ig: 'MOBILE_TABS',
  Zg: 'MobileTabs',
  Fg: 'GameLayout',
  // misc
  Rf: 'GAME_VERSION',
  Kf: 'LAST_SEEN_VERSION_KEY',
  Vo: 'CHANGELOG',
  Jg: 'PatchNotesModal',
  Wg: 'PatchNotesPage',
  $g: 'AppContent',
  e0: 'App',
}

const src = fs.readFileSync(FILE, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })

const programBindings = new Map()
traverse(ast, {
  Program(p) {
    for (const [name, binding] of Object.entries(p.scope.bindings)) {
      programBindings.set(name, binding)
    }
  },
})

const problems = []
const seenTargets = new Set()
for (const [old, neu] of Object.entries(RENAMES)) {
  if (!programBindings.has(old)) problems.push(`missing top-level binding: ${old}`)
  if (seenTargets.has(neu)) problems.push(`duplicate target name: ${neu}`)
  seenTargets.add(neu)
  if (programBindings.has(neu) && neu !== old)
    problems.push(`target already exists: ${neu}`)
}
if (problems.length) {
  console.error('Refusing to rename:\n' + problems.join('\n'))
  process.exit(1)
}

// Collect every identifier node that resolves to one of the top-level bindings.
/** @type {{start:number,end:number,newName:string,oldName:string}[]} */
const edits = []
const stats = []
for (const [old, neu] of Object.entries(RENAMES)) {
  const binding = programBindings.get(old)
  const nodes = [binding.identifier, ...binding.referencePaths.map((p) => p.node)]
  const byStart = new Map()
  for (const n of nodes) {
    if (!n || typeof n.start !== 'number') continue
    byStart.set(n.start, n)
  }
  for (const n of byStart.values()) {
    edits.push({ start: n.start, end: n.end, newName: neu, oldName: old })
  }
  stats.push([old, neu, byStart.size])
}

// Apply from the end of the file backwards so earlier offsets stay valid.
edits.sort((a, b) => b.start - a.start)
let lastStart = Infinity
for (const e of edits) {
  if (e.end > lastStart) {
    console.error(`Overlapping edit near offset ${e.start} (${e.oldName})`)
    process.exit(1)
  }
  lastStart = e.start
}

let out = src
for (const e of edits) {
  out = out.slice(0, e.start) + e.newName + out.slice(e.end)
}

console.log(`Verified ${stats.length} bindings, ${edits.length} identifier edits.`)
if (WRITE) {
  fs.writeFileSync(FILE, out)
  console.log(`Wrote ${path.relative(process.cwd(), FILE)}`)
} else {
  console.log('Dry run only. Re-run with --write to apply.')
}
