#!/usr/bin/env node
/**
 * Split src/game/logic.js into smaller game modules and rewrite every importer.
 *
 * Usage:
 *   node tools/decompile/split-logic.mjs          # dry run (print plan)
 *   node tools/decompile/split-logic.mjs --write  # apply
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default ?? traverseModule
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const OLD = path.join(ROOT, 'src/game/logic.js')
const WRITE = process.argv.includes('--write')

const MODULES = {
  'src/game/pokemon.js': [
    'calculateHpStat', 'calculateOtherStat', 'calculatePokemonStats', 'generateIVs',
    'getPerfectIVs', 'calculateRequiredExperience', 'calculateExpYield',
    'getLevelUpResults', 'getPreEvolutionChain', 'getFamilyLearnset',
    'resolvePokemonMoves', 'getPokemonSpriteUrl', 'getPokemonSpriteFallbackUrl',
    'getTrainerSpriteUrl', 'getBossTrainerSpriteUrl', 'createPokemon',
  ],
  'src/game/combat.js': [
    'createVolatileState', 'getTypeEffectiveness', 'getTypeMultiplier',
    'statStageMultiplier', 'calculateDamage', 'estimateMoveDamage',
    'chooseBestMove', 'chooseRandomMove', 'getStatStage', 'clampStatStage',
    'resolveBattleTurn', 'getStatLabel',
  ],
  'src/game/progression.js': [
    'checkShinyOdds', 'getCatchRule', 'getItemCategory', 'isActiveEffectItem',
    'getItemInfo', 'computeUnlockedLocations', 'getActivePartyIndex',
    'syncActivePokemonIntoParty', 'loadActivePokemonFromParty',
    'createIdleBattleState', 'prepareNextBattle', 'tickBattleCounters',
    'resolveActiveModifiers', 'resolvePokemonEncounter', 'awardExperience',
    'buildTrainerTeam', 'formatCooldown', 'createRoads',
  ],
  'src/game/catching.js': [
    'getCatchRate', 'calculateCatchChance', 'attemptCatch', 'selectBestBall',
    'shouldAutoCatch', 'selectAutoCatchBall', 'getRarityFromRate',
  ],
}

const nameToFile = new Map()
for (const [file, names] of Object.entries(MODULES))
  for (const n of names) nameToFile.set(n, file)

// ---------------------------------------------------------------------------

const src = fs.readFileSync(OLD, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })
let programPath
traverse(ast, {
  Program(p) {
    programPath = p
    p.stop()
  },
})

const allBindings = programPath.scope.bindings
const ownNames = new Set(Object.keys(MODULES).flatMap((f) => MODULES[f]))
const importInfo = new Map() // imported name -> source module
for (const [name, b] of Object.entries(allBindings)) {
  const p = b.path
  if (p.isImportSpecifier() || p.isImportDefaultSpecifier()) {
    const decl = p.findParent((pp) => pp.isImportDeclaration())
    importInfo.set(name, decl.node.source.value)
  }
}

// validate every own name exists
for (const n of ownNames) if (!allBindings[n]) throw new Error(`missing export: ${n}`)
const logicNames = new Set(
  Object.keys(allBindings).filter((n) => !importInfo.has(n))
)
for (const n of logicNames) if (!ownNames.has(n)) throw new Error(`unassigned: ${n}`)

// deps per declaration (references to other program bindings)
const depsOf = (node) => {
  const refs = new Set()
  programPath.traverse({
    Identifier(p) {
      if (p.node.start < node.start || p.node.end > node.end) return
      if (!p.isReferencedIdentifier()) return
      const n = p.node.name
      if (allBindings[n]) refs.add(n)
    },
  })
  return refs
}

const declText = (name) => {
  const p = allBindings[name].path
  if (p.isFunctionDeclaration()) return src.slice(p.node.start, p.node.end)
  if (p.isVariableDeclarator()) {
    const kind = p.parentPath.node.kind
    const init = p.node.init ? src.slice(p.node.init.start, p.node.init.end) : ''
    return `${kind} ${name}${init ? ' = ' + init : ''}`
  }
  throw new Error(`unsupported: ${name}`)
}

const rel = (fromFile, toFile) => {
  let r = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/')
  if (!r.startsWith('.')) r = './' + r
  return r
}

// build new files
const newFiles = new Map()
for (const [file, names] of Object.entries(MODULES)) {
  const ordered = [...names].sort(
    (a, b) => allBindings[a].path.node.start - allBindings[b].path.node.start
  )
  const dataImports = { constants: new Set(), gameData: new Set() }
  const localImports = new Map() // file -> names
  for (const n of ordered) {
    for (const d of depsOf(allBindings[n].path.node)) {
      if (importInfo.has(d)) {
        const s = importInfo.get(d)
        if (s.includes('constants')) dataImports.constants.add(d)
        else if (s.includes('gameData')) dataImports.gameData.add(d)
        else throw new Error(`unexpected import source: ${d} <- ${s}`)
      } else if (!names.includes(d)) {
        const target = nameToFile.get(d)
        if (!target) throw new Error(`dep not assigned: ${d}`)
        if (!localImports.has(target)) localImports.set(target, [])
        localImports.get(target).push(d)
      }
    }
  }
  const importLines = []
  if (dataImports.constants.size)
    importLines.push(
      `import { ${[...dataImports.constants].sort().join(', ')} } from '../data/constants.js'`
    )
  if (dataImports.gameData.size)
    importLines.push(
      `import { ${[...dataImports.gameData].sort().join(', ')} } from '../data/gameData.js'`
    )
  for (const [target, names2] of [...localImports].sort())
    importLines.push(`import { ${[...new Set(names2)].sort().join(', ')} } from '${rel(file, target)}'`)
  const body = ordered.map((n) => 'export ' + declText(n)).join('\n\n')
  newFiles.set(file, { importLines, body })
}

// rewrite importers
const importerEdits = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else if (e.name.endsWith('.js')) {
      if (full === OLD) continue
      const text = fs.readFileSync(full, 'utf8')
      const m = text.match(/^import \{([^}]*)\} from '([^']*logic\.js)'$/m)
      if (!m) continue
      const names = m[1].split(',').map((s) => s.trim()).filter(Boolean)
      const byTarget = new Map()
      for (const n of names) {
        const t = nameToFile.get(n)
        if (!t) throw new Error(`${full}: unknown import ${n}`)
        if (!byTarget.has(t)) byTarget.set(t, [])
        byTarget.get(t).push(n)
      }
      const lines = [...byTarget]
        .sort()
        .map(([t, ns]) => `import { ${ns.sort().join(', ')} } from '${rel(full, t)}'`)
        .join('\n')
      importerEdits.push({ file: full, old: m[0], neu: lines })
    }
  }
}
walk(path.join(ROOT, 'src'))

if (!WRITE) {
  for (const [file, { importLines, body }] of newFiles) {
    console.log(`\n===== ${file} =====`)
    console.log(importLines.join('\n'))
    console.log(`  [${body.split('\n').length} lines]`)
  }
  console.log('\n===== importers rewritten =====')
  for (const e of importerEdits)
    console.log(`\n${path.relative(ROOT, e.file)}\n--- old ---\n${e.old}\n--- new ---\n${e.neu}`)
  console.log(`\nDry run. ${newFiles.size} new files, ${importerEdits.length} importers. Re-run with --write.`)
  process.exit(0)
}

for (const [file, { importLines, body }] of newFiles) {
  const content =
    '// Split from src/game/logic.js — see tools/decompile/split-logic.mjs\n\n' +
    (importLines.length ? importLines.join('\n') + '\n\n' : '') +
    body +
    '\n'
  fs.writeFileSync(path.join(ROOT, file), content)
  console.log(`wrote ${file}`)
}
for (const e of importerEdits) {
  let text = fs.readFileSync(e.file, 'utf8')
  text = text.replace(e.old, e.neu)
  fs.writeFileSync(e.file, text)
  console.log(`updated ${path.relative(ROOT, e.file)}`)
}
fs.unlinkSync(OLD)
console.log('removed src/game/logic.js')
