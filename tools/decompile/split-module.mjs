#!/usr/bin/env node
/**
 * Generic module splitter: split one source module into several files and
 * rewrite every importer, generating imports/exports from the dependency graph.
 *
 * Configure SOURCE + MODULES below (or copy this file and edit them).
 *
 * Usage:
 *   node tools/decompile/split-module.mjs          # dry run
 *   node tools/decompile/split-module.mjs --write  # apply
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default ?? traverseModule
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const WRITE = process.argv.includes('--write')

// ---- config -----------------------------------------------------------------
const SOURCE = 'src/data/constants.js'
const MODULES = {
  'src/data/items.js': [
    'activeItems', 'pokeBalls', 'ballOrder', 'bagCategories', 'evolutionItems',
    'tokenShopItems', 'martShopItems',
  ],
  'src/data/config.js': [
    'evValue', 'RAID_COOLDOWN_MS', 'shinyFullOddsChance', 'shinyWithCharmChance',
    'defaultCatchSettings', 'starterSpecies', 'legendaryPool',
    'trainerClassPayouts', 'SAVE_KEY', 'SAVE_KEY_ALT',
  ],
  'src/data/moves.js': ['typechart', 'moveIcons', 'moveCategoryIcons', 'categoryIcons'],
  'src/data/ui.js': [
    'SPEED_OPTIONS', 'statBarColors', 'statBarColorsPokedex', 'statColours',
    'STAT_DISPLAY_MAX', 'BOX_PAGE_SIZE', 'pokeballColors', 'rarities',
    'CATCH_MODE_OPTIONS', 'SIDE_PANEL_TABS', 'MOBILE_TABS',
    'BATTLE_LOG_MIN_HEIGHT', 'MOBILE_BREAKPOINT', 'DESIGN_WIDTH',
    'initialDragState', 'locationImages',
  ],
  'src/data/changelog.js': ['GAME_VERSION', 'LAST_SEEN_VERSION_KEY', 'CHANGELOG'],
}
// -----------------------------------------------------------------------------

const OLD = path.join(ROOT, SOURCE)
const nameToFile = new Map()
for (const [file, names] of Object.entries(MODULES))
  for (const n of names) nameToFile.set(n, path.join(ROOT, file))

const src = fs.readFileSync(OLD, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })
let programPath
traverse(ast, {
  Program(p) {
    programPath = p
    p.stop()
  },
})

const bindings = programPath.scope.bindings
const ownNames = new Set(Object.keys(MODULES).flatMap((f) => MODULES[f]))
const importSource = new Map()
for (const [name, b] of Object.entries(bindings)) {
  if (b.path.isImportSpecifier() || b.path.isImportDefaultSpecifier()) {
    const decl = b.path.findParent((p) => p.isImportDeclaration())
    importSource.set(name, decl.node.source.value)
  }
}
for (const n of ownNames) if (!bindings[n]) throw new Error(`missing binding: ${n}`)
for (const n of Object.keys(bindings))
  if (!importSource.has(n) && !ownNames.has(n)) throw new Error(`unassigned: ${n}`)

const depsOf = (node) => {
  const refs = new Set()
  programPath.traverse({
    Identifier(p) {
      if (p.node.start < node.start || p.node.end > node.end) return
      if (!p.isReferencedIdentifier()) return
      const n = p.node.name
      const b = programPath.scope.getBinding(n)
      if (!b || b !== bindings[n]) return
      refs.add(n)
    },
  })
  return refs
}
const declText = (name) => {
  const p = bindings[name].path
  if (p.isFunctionDeclaration() || p.isClassDeclaration())
    return src.slice(p.node.start, p.node.end)
  if (p.isVariableDeclarator()) {
    const kind = p.parentPath.node.kind
    const init = p.node.init ? src.slice(p.node.init.start, p.node.init.end) : ''
    return `${kind} ${name}${init ? ' = ' + init : ''}`
  }
  throw new Error(`unsupported: ${name}`)
}
const rel = (from, to) => {
  let r = path.relative(path.dirname(from), to).replace(/\\/g, '/')
  if (!r.startsWith('.')) r = './' + r
  return r
}

// build new files (all in the same dir as SOURCE, so external import paths are unchanged)
const newFiles = new Map()
for (const [file, names] of Object.entries(MODULES)) {
  const ordered = [...names].sort(
    (a, b) => bindings[a].path.node.start - bindings[b].path.node.start
  )
  const external = new Map()
  const local = new Set()
  for (const n of ordered)
    for (const d of depsOf(bindings[n].path.node)) {
      if (names.includes(d)) continue
      if (importSource.has(d)) {
        const s = importSource.get(d)
        if (!external.has(s)) external.set(s, new Set())
        external.get(s).add(d)
      } else if (nameToFile.has(d)) local.add(d)
      else throw new Error(`${file}: unresolved ${d}`)
    }
  const lines = []
  for (const [s, ns] of [...external].sort())
    lines.push(`import { ${[...ns].sort().join(', ')} } from '${s}'`)
  const byTarget = new Map()
  for (const d of local) {
    const t = nameToFile.get(d)
    if (!byTarget.has(t)) byTarget.set(t, [])
    byTarget.get(t).push(d)
  }
  for (const [t, ns] of [...byTarget].sort())
    lines.push(`import { ${ns.sort().join(', ')} } from '${rel(path.join(ROOT, file), t)}'`)
  newFiles.set(file, {
    lines,
    body: ordered.map((n) => 'export ' + declText(n)).join('\n\n'),
  })
}

// rewrite importers
const edits = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else if (e.name.endsWith('.js') && full !== OLD) {
      const text = fs.readFileSync(full, 'utf8')
      const a = parse(text, { sourceType: 'module' })
      let pp
      traverse(a, {
        Program(p) {
          pp = p
          p.stop()
        },
      })
      pp.traverse({
        ImportDeclaration(p) {
          if (path.resolve(path.dirname(full), p.node.source.value) !== OLD) return
          if (p.node.specifiers.some((s) => s.type !== 'ImportSpecifier'))
            throw new Error(`default import from ${SOURCE} in ${full}`)
          const byTarget = new Map()
          for (const s of p.node.specifiers) {
            const t = nameToFile.get(s.imported.name)
            if (!t) throw new Error(`${full}: unknown ${s.imported.name}`)
            if (!byTarget.has(t)) byTarget.set(t, [])
            byTarget.get(t).push(s.imported.name)
          }
          const rep = [...byTarget]
            .sort()
            .map(([t, ns]) => `import { ${ns.sort().join(', ')} } from '${rel(full, t)}'`)
            .join('\n')
          edits.push({ file: full, old: text.slice(p.node.start, p.node.end), neu: rep })
        },
      })
    }
  }
}
walk(path.join(ROOT, 'src'))

if (!WRITE) {
  for (const [f, { lines, body }] of newFiles)
    console.log(`${f}\n  ${lines.join('\n  ') || '(no imports)'}\n  [${body.split('\n').length} lines]`)
  console.log(`\nrewrite ${edits.length} imports in ${new Set(edits.map((e) => e.file)).size} files`)
  process.exit(0)
}

for (const [file, { lines, body }] of newFiles) {
  fs.writeFileSync(
    path.join(ROOT, file),
    `// Split from ${SOURCE} — see tools/decompile/split-module.mjs\n\n` +
      (lines.length ? lines.join('\n') + '\n\n' : '') +
      body +
      '\n'
  )
}
const byFile = new Map()
for (const e of edits) {
  if (!byFile.has(e.file)) byFile.set(e.file, [])
  byFile.get(e.file).push(e)
}
for (const [file, list] of byFile) {
  let text = fs.readFileSync(file, 'utf8')
  for (const e of list) text = text.replace(e.old, e.neu)
  fs.writeFileSync(file, text)
}
fs.unlinkSync(OLD)
console.log(`wrote ${newFiles.size} files, rewrote ${edits.length} imports, removed ${SOURCE}`)
