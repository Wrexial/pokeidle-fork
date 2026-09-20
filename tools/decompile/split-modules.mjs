#!/usr/bin/env node
/**
 * Split the monolithic assets/index.js into ES modules under src/.
 *
 * - Parses the file, resolves every top-level binding, and slices each
 *   declaration's source text (formatting preserved).
 * - Assigns each binding to a module (MODULES below); standalone top-level
 *   statements (e.g. the pokedexData loop) are attached to the module of the
 *   first binding they reference.
 * - Auto-generates library + cross-module imports from the dependency graph,
 *   and `export`s any binding referenced by another module.
 *
 * Usage:
 *   node tools/decompile/split-modules.mjs          # dry run: print plan
 *   node tools/decompile/split-modules.mjs --write  # write src/ files
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default ?? traverseModule
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const FILE = path.join(ROOT, 'assets/index.js')
const WRITE = process.argv.includes('--write')

const LIB = {
  React: { default: 'react' },
  createPortal: { named: 'createPortal', from: 'react-dom' },
  createRoot: { named: 'createRoot', from: 'react-dom/client' },
  Fragment: { named: 'Fragment', from: 'react/jsx-runtime' },
  jsx: { named: 'jsx', from: 'react/jsx-runtime' },
  jsxs: { named: 'jsxs', from: 'react/jsx-runtime' },
}

const MODULES = [
  {
    file: 'src/data/constants.js',
    names: [
      'evValue', 'legendaryPool', 'RAID_COOLDOWN_MS', 'defaultCatchSettings',
      'activeItems', 'pokeBalls', 'ballOrder', 'bagCategories', 'evolutionItems',
      'tokenShopItems', 'SAVE_KEY', 'SAVE_KEY_ALT', 'shinyFullOddsChance',
      'shinyWithCharmChance', 'starterSpecies', 'SPEED_OPTIONS',
      'moveCategoryIcons', 'moveIcons', 'locationImages', 'trainerClassPayouts',
      'BATTLE_LOG_MIN_HEIGHT', 'typechart', 'categoryIcons', 'statBarColors',
      'statBarColorsPokedex', 'STAT_DISPLAY_MAX', 'BOX_PAGE_SIZE',
      'initialDragState', 'pokeballColors', 'rarities', 'statColours',
      'martShopItems', 'MOBILE_BREAKPOINT', 'DESIGN_WIDTH', 'CATCH_MODE_OPTIONS',
      'SIDE_PANEL_TABS', 'MOBILE_TABS', 'GAME_VERSION', 'LAST_SEEN_VERSION_KEY',
      'CHANGELOG',
    ],
  },
  {
    file: 'src/data/gameData.js',
    names: [
      'startApp', 'loadedGameData', 'pokemonSpecies', 'evolutionData',
      'moveLearnsets', 'mapData', 'encounterData', 'moveData', 'trainerClasses',
      'trainerData', 'gymLeaderData', 'elite4Data', 'championData',
      'preEvolutionMap', 'pokedexData', 'pokedexIndexes', 'mapAreas',
    ],
  },
  {
    file: 'src/game/logic.js',
    names: [
      'calculateHpStat', 'calculateOtherStat', 'calculatePokemonStats',
      'generateIVs', 'getPerfectIVs', 'calculateRequiredExperience',
      'calculateExpYield', 'getLevelUpResults', 'getPreEvolutionChain',
      'getFamilyLearnset', 'resolvePokemonMoves', 'getPokemonSpriteUrl',
      'getPokemonSpriteFallbackUrl', 'getTrainerSpriteUrl',
      'getBossTrainerSpriteUrl', 'checkShinyOdds', 'createVolatileState',
      'getCatchRule', 'getItemCategory', 'isActiveEffectItem', 'getItemInfo',
      'createPokemon', 'computeUnlockedLocations', 'getActivePartyIndex',
      'syncActivePokemonIntoParty', 'loadActivePokemonFromParty',
      'createIdleBattleState', 'prepareNextBattle', 'tickBattleCounters',
      'getCatchRate', 'calculateCatchChance', 'attemptCatch', 'selectBestBall',
      'shouldAutoCatch', 'selectAutoCatchBall', 'getTypeEffectiveness',
      'getTypeMultiplier', 'statStageMultiplier', 'calculateDamage',
      'estimateMoveDamage', 'chooseBestMove', 'chooseRandomMove', 'getStatStage',
      'clampStatStage', 'resolveBattleTurn', 'getStatLabel', 'getRarityFromRate',
      'formatCooldown', 'createRoads', 'resolveActiveModifiers',
      'resolvePokemonEncounter', 'awardExperience', 'buildTrainerTeam',
    ],
  },
  { file: 'src/game/reducer.js', names: ['initialGameState', 'gameReducer'] },
  { file: 'src/game/context.js', names: ['GameContext', 'GameProvider', 'useGame'] },
  { file: 'src/hooks.js', names: ['useTypewriter', 'useIsMobile', 'useGameLoop'] },
  {
    file: 'src/components/common.js',
    names: ['HpBar', 'ExpBar', 'PlayerInfoBox', 'EnemyInfoBox', 'PokeballIcon'],
  },
  {
    file: 'src/components/battle.js',
    names: [
      'BattleScene', 'BattleScreen', 'BattleLog', 'LevelUpNotification',
      'BattleTextBox', 'SpeedControls', 'MoveManagerPanel', 'EvolutionScene',
      'HealingScene',
    ],
  },
  {
    file: 'src/components/pokedex.js',
    names: ['PokedexTile', 'PokedexModal', 'RouteEncounterGrid', 'EncounterDetailPanel'],
  },
  {
    file: 'src/components/party.js',
    names: ['StatsPanel', 'PartyPanel', 'BoxPanel', 'PartyBoxPanel'],
  },
  {
    file: 'src/components/shop.js',
    names: ['ShopPanel', 'BallShopRow', 'ItemShopRow', 'BagPanel', 'RewardShopModal'],
  },
  {
    file: 'src/components/location.js',
    names: ['LocationPanel', 'MapNode', 'TownMap', 'GymPanel'],
  },
  {
    file: 'src/components/settings.js',
    names: ['SettingsModal', 'CatchSettingsModal', 'PatchNotesModal', 'PatchNotesPage'],
  },
  {
    file: 'src/components/layout.js',
    names: ['StarterSelect', 'RightPanel', 'MobileTabs', 'GameLayout'],
  },
  { file: 'src/main.js', names: ['AppContent', 'App'], entry: true },
]

// ---------------------------------------------------------------------------

const src = fs.readFileSync(FILE, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })
let programPath
traverse(ast, {
  Program(p) {
    programPath = p
    p.stop()
  },
})

const bindingByName = programPath.scope.bindings
const topNames = new Set(Object.keys(bindingByName))

const depsOf = (node) => {
  const refs = new Set()
  programPath.traverse({
    Identifier(p) {
      if (p.node.start < node.start || p.node.end > node.end) return
      if (!p.isReferencedIdentifier()) return
      const n = p.node.name
      if (LIB[n] || topNames.has(n)) refs.add(n)
    },
  })
  return refs
}

// module lookup
const assigned = new Map()
for (const mod of MODULES) {
  for (const name of mod.names) {
    if (assigned.has(name)) throw new Error(`duplicate assignment: ${name}`)
    if (!topNames.has(name)) throw new Error(`${mod.file}: unknown binding ${name}`)
    assigned.set(name, mod.file)
  }
}
for (const name of topNames) {
  if (LIB[name]) continue
  if (!assigned.has(name)) throw new Error(`unassigned binding: ${name}`)
}

function declarationText(name) {
  const p = bindingByName[name].path
  if (p.isFunctionDeclaration() || p.isClassDeclaration())
    return src.slice(p.node.start, p.node.end)
  if (p.isVariableDeclarator()) {
    const kind = p.parentPath.node.kind
    const init = p.node.init ? src.slice(p.node.init.start, p.node.init.end) : ''
    return `${kind} ${name}${init ? ' = ' + init : ''}`
  }
  throw new Error(`unsupported declaration for ${name}: ${p.node.type}`)
}

// build items = binding declarations + standalone top-level statements
const items = []
for (const name of topNames) {
  if (LIB[name]) continue
  const binding = bindingByName[name]
  const node = binding.path.node
  items.push({
    kind: 'binding',
    name,
    start: node.start,
    end: node.end,
    text: declarationText(name),
    deps: depsOf(node),
  })
}
const isDecl = (s) =>
  s.type === 'FunctionDeclaration' ||
  s.type === 'ClassDeclaration' ||
  s.type === 'VariableDeclaration' ||
  s.type === 'ImportDeclaration'
for (const stmt of programPath.node.body) {
  if (isDecl(stmt)) continue
  const text = src.slice(stmt.start, stmt.end)
  if (/createRoot\([\s\S]*\.render\(/.test(text)) continue // replaced by entry footer
  const deps = depsOf(stmt)
  const target = [...deps].find((d) => assigned.has(d))
  if (!target) throw new Error(`cannot place top-level statement at ${stmt.start}:\n${text.slice(0, 120)}`)
  items.push({ kind: 'stmt', name: null, start: stmt.start, end: stmt.end, text, deps, module: assigned.get(target) })
}

// group items per module
const moduleItems = new Map(MODULES.map((m) => [m.file, []]))
for (const it of items) {
  const file = it.kind === 'binding' ? assigned.get(it.name) : it.module
  moduleItems.get(file).push(it)
}

const relFrom = (fromFile, toFile) => {
  let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/')
  if (!rel.startsWith('.')) rel = './' + rel
  return rel
}

const plan = []
for (const mod of MODULES) {
  const own = new Set(mod.names)
  const myItems = moduleItems.get(mod.file).sort((a, b) => a.start - b.start)

  const external = new Set()
  const usedLib = new Set()
  for (const it of myItems)
    for (const d of it.deps) {
      if (LIB[d]) usedLib.add(d)
      else if (topNames.has(d) && !own.has(d)) external.add(d)
    }

  const exported = new Set()
  for (const other of MODULES) {
    if (other === mod) continue
    for (const it of moduleItems.get(other.file))
      for (const d of it.deps) if (own.has(d)) exported.add(d)
  }

  if (mod.entry) {
    usedLib.add('React')
    usedLib.add('jsx')
    mod._createRoot = true
  }

  const libLines = []
  if (usedLib.has('React')) libLines.push("import React from 'react'")
  if (usedLib.has('createPortal')) libLines.push("import { createPortal } from 'react-dom'")
  if (mod._createRoot || usedLib.has('createRoot'))
    libLines.push("import { createRoot } from 'react-dom/client'")
  const rt = ['Fragment', 'jsx', 'jsxs'].filter((x) => usedLib.has(x))
  if (rt.length) libLines.push(`import { ${rt.join(', ')} } from 'react/jsx-runtime'`)

  const byTarget = new Map()
  for (const d of external) {
    const t = assigned.get(d)
    if (!byTarget.has(t)) byTarget.set(t, [])
    byTarget.get(t).push(d)
  }
  const importLines = []
  for (const [t, names] of [...byTarget].sort())
    importLines.push(`import { ${names.sort().join(', ')} } from '${relFrom(mod.file, t)}'`)

  const body = myItems
    .map((it) => (it.kind === 'binding' && exported.has(it.name) ? 'export ' + it.text : it.text))
    .join('\n\n')

  plan.push({ mod, libLines, importLines, body, exported })
}

if (!WRITE) {
  for (const { mod, libLines, importLines, body, exported } of plan) {
    console.log(`\n===== ${mod.file} =====`)
    if (libLines.length) console.log(libLines.join('\n'))
    if (importLines.length) console.log(importLines.join('\n'))
    console.log(`  [${body.split('\n').length} lines, exports: ${[...exported].join(', ') || '-'}]`)
  }
  console.log('\nDry run. Re-run with --write.')
  process.exit(0)
}

const entryFooter = [
  '',
  "createRoot(document.getElementById('root')).render(",
  '  jsx(React.StrictMode, {',
  '    children: jsx(App, {}),',
  '  })',
  ')',
  '',
].join('\n')

for (const { mod, libLines, importLines, body } of plan) {
  const filePath = path.join(ROOT, mod.file)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const imports = [...libLines, ...importLines]
  const content =
    '// Split from the former assets/index.js — see tools/decompile/split-modules.mjs\n\n' +
    (imports.length ? imports.join('\n') + '\n\n' : '') +
    body +
    '\n' +
    (mod.entry ? entryFooter : '')
  fs.writeFileSync(filePath, content)
  console.log(`wrote ${mod.file}`)
}
