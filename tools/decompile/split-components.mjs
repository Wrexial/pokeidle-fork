#!/usr/bin/env node
/**
 * Split each src/components/<group>.js into one file per top-level component,
 * and rewrite every importer (main.js + sibling components).
 *
 * Usage:
 *   node tools/decompile/split-components.mjs          # dry run
 *   node tools/decompile/split-components.mjs --write  # apply
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default ?? traverseModule
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const COMPONENTS = path.join(ROOT, 'src/components')
const WRITE = process.argv.includes('--write')

const LIB = new Set(['React', 'createPortal', 'createRoot', 'Fragment', 'jsx', 'jsxs'])

const kebab = (s) =>
  s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').toLowerCase()

const groupFiles = fs
  .readdirSync(COMPONENTS)
  .filter((f) => f.endsWith('.js'))
  .map((f) => path.join(COMPONENTS, f))

/** file -> { programPath, bindings: Map(name->binding), imports: Map(name->source) } */
const fileInfo = new Map()
const nameToNewFile = new Map()

for (const file of groupFiles) {
  const src = fs.readFileSync(file, 'utf8')
  const ast = parse(src, { sourceType: 'module' })
  let programPath
  traverse(ast, {
    Program(p) {
      programPath = p
      p.stop()
    },
  })
  const bindings = new Map()
  const imports = new Map()
  for (const [name, b] of Object.entries(programPath.scope.bindings)) {
    if (b.path.isImportSpecifier() || b.path.isImportDefaultSpecifier()) {
      const decl = b.path.findParent((p) => p.isImportDeclaration())
      imports.set(name, decl.node.source.value)
    } else {
      bindings.set(name, b)
    }
  }
  fileInfo.set(file, { src, programPath, bindings, imports })
  for (const name of bindings.keys()) {
    const nf = path.join(COMPONENTS, kebab(name) + '.js')
    if (nameToNewFile.has(name)) throw new Error(`duplicate component name: ${name}`)
    nameToNewFile.set(name, nf)
  }
}

const rel = (fromFile, toFile) => {
  let r = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/')
  if (!r.startsWith('.')) r = './' + r
  return r
}

/** referenced program-level names of a declaration within its file */
function refsOf(file, name) {
  const { src, programPath, bindings } = fileInfo.get(file)
  const node = bindings.get(name).path.node
  const refs = new Set()
  programPath.traverse({
    Identifier(p) {
      if (p.node.start < node.start || p.node.end > node.end) return
      if (!p.isReferencedIdentifier()) return
      const n = p.node.name
      if (n === name) return
      const b = programPath.scope.getBinding(n)
      if (!b || b !== programPath.scope.bindings[n]) return
      refs.add(n)
    },
  })
  return refs
}

function declText(file, name) {
  const { src, bindings } = fileInfo.get(file)
  const p = bindings.get(name).path
  if (p.isFunctionDeclaration()) return src.slice(p.node.start, p.node.end)
  if (p.isVariableDeclarator()) {
    const kind = p.parentPath.node.kind
    const init = p.node.init ? src.slice(p.node.init.start, p.node.init.end) : ''
    return `${kind} ${name}${init ? ' = ' + init : ''}`
  }
  throw new Error(`unsupported declaration: ${name}`)
}

// build new files
const newFiles = new Map()
for (const file of groupFiles) {
  const { bindings, imports } = fileInfo.get(file)
  for (const name of bindings.keys()) {
    const usedLib = new Set()
    const external = new Map() // source -> Set(names)
    const local = new Set()
    for (const d of refsOf(file, name)) {
      if (LIB.has(d)) usedLib.add(d)
      else if (nameToNewFile.has(d)) local.add(d)
      else if (imports.has(d)) {
        const s = imports.get(d)
        if (!external.has(s)) external.set(s, new Set())
        external.get(s).add(d)
      } else throw new Error(`${file}#${name}: unresolved ref ${d}`)
    }
    const lines = []
    if (usedLib.has('React')) lines.push("import React from 'react'")
    if (usedLib.has('createPortal')) lines.push("import { createPortal } from 'react-dom'")
    const rt = ['Fragment', 'jsx', 'jsxs'].filter((x) => usedLib.has(x))
    if (rt.length) lines.push(`import { ${rt.join(', ')} } from 'react/jsx-runtime'`)
    for (const [s, ns] of [...external].sort())
      lines.push(`import { ${[...ns].sort().join(', ')} } from '${s}'`)
    const byTarget = new Map()
    for (const d of local) {
      const t = nameToNewFile.get(d)
      if (!byTarget.has(t)) byTarget.set(t, [])
      byTarget.get(t).push(d)
    }
    for (const [t, ns] of [...byTarget].sort())
      lines.push(`import { ${ns.sort().join(', ')} } from '${rel(nameToNewFile.get(name), t)}'`)
    newFiles.set(nameToNewFile.get(name), {
      name,
      lines,
      body: 'export ' + declText(file, name),
    })
  }
}

// rewrite importers across src/
const importerEdits = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else if (e.name.endsWith('.js') && !groupFiles.includes(full)) {
      const text = fs.readFileSync(full, 'utf8')
      const src = fs.readFileSync(full, 'utf8')
      const ast = parse(src, { sourceType: 'module' })
      let programPath
      traverse(ast, {
        Program(p) {
          programPath = p
          p.stop()
        },
      })
      programPath.traverse({
        ImportDeclaration(p) {
          const abs = path.resolve(path.dirname(full), p.node.source.value)
          if (!groupFiles.includes(abs)) return
          const names = p.node.specifiers
            .filter((s) => s.type === 'ImportSpecifier')
            .map((s) => s.imported.name)
          if (names.length !== p.node.specifiers.length)
            throw new Error(`default import from ${abs} in ${full}`)
          const byTarget = new Map()
          for (const n of names) {
            const t = nameToNewFile.get(n)
            if (!t) throw new Error(`${full}: unknown ${n} from ${abs}`)
            if (!byTarget.has(t)) byTarget.set(t, [])
            byTarget.get(t).push(n)
          }
          const rep = [...byTarget]
            .sort()
            .map(([t, ns]) => `import { ${ns.sort().join(', ')} } from '${rel(full, t)}'`)
            .join('\n')
          importerEdits.push({ file: full, old: src.slice(p.node.start, p.node.end), neu: rep })
        },
      })
    }
  }
}
walk(path.join(ROOT, 'src'))

if (!WRITE) {
  console.log(`Would create ${newFiles.size} component files:`)
  for (const [f, { name, lines }] of newFiles)
    console.log(`  ${path.relative(ROOT, f)}  (${name})  [${lines.length} imports]`)
  console.log(`\nWould rewrite ${importerEdits.length} imports in:`)
  for (const e of new Set(importerEdits.map((x) => path.relative(ROOT, x.file))))
    console.log(`  ${e}`)
  process.exit(0)
}

for (const [f, { lines, body }] of newFiles) {
  fs.writeFileSync(
    f,
    '// Split from a grouped component file — see tools/decompile/split-components.mjs\n\n' +
      (lines.length ? lines.join('\n') + '\n\n' : '') +
      body +
      '\n'
  )
}
// group edits by file and apply
const byFile = new Map()
for (const e of importerEdits) {
  if (!byFile.has(e.file)) byFile.set(e.file, [])
  byFile.get(e.file).push(e)
}
for (const [file, edits] of byFile) {
  let text = fs.readFileSync(file, 'utf8')
  for (const e of edits) text = text.replace(e.old, e.neu)
  fs.writeFileSync(file, text)
}
for (const f of groupFiles) fs.unlinkSync(f)
console.log(`created ${newFiles.size} component files, rewrote ${importerEdits.length} imports, removed ${groupFiles.length} group files`)
