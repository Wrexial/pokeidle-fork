#!/usr/bin/env node
/**
 * One-shot repair: rewrite imports that still point at the deleted component
 * *group* files (battle.js, common.js, layout.js, location.js, party.js,
 * pokedex.js, settings.js, shop.js) to the per-component files produced by
 * split-components.mjs.
 *
 * Usage: node tools/decompile/fix-group-imports.mjs [--write]
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

const GROUPS = new Set([
  'battle.js', 'common.js', 'layout.js', 'location.js',
  'party.js', 'pokedex.js', 'settings.js', 'shop.js',
])

const kebab = (s) =>
  s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').toLowerCase()

const rel = (fromFile, toFile) => {
  let r = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/')
  if (!r.startsWith('.')) r = './' + r
  return r
}

const edits = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else if (e.name.endsWith('.js')) {
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
          const base = path.basename(p.node.source.value)
          if (!GROUPS.has(base)) return
          const names = p.node.specifiers.map((s) => s.imported.name)
          const byTarget = new Map()
          for (const n of names) {
            const target = path.join(ROOT, 'src/components', kebab(n) + '.js')
            if (!fs.existsSync(target))
              throw new Error(`${full}: no file for ${n} (${kebab(n)}.js)`)
            if (!byTarget.has(target)) byTarget.set(target, [])
            byTarget.get(target).push(n)
          }
          const rep = [...byTarget]
            .sort()
            .map(([t, ns]) => `import { ${ns.sort().join(', ')} } from '${rel(full, t)}'`)
            .join('\n')
          edits.push({ file: full, old: src.slice(p.node.start, p.node.end), neu: rep })
        },
      })
    }
  }
}
walk(path.join(ROOT, 'src'))

if (!WRITE) {
  for (const e of edits)
    console.log(`${path.relative(ROOT, e.file)}\n  - ${e.old}\n  + ${e.neu.split('\n').join('\n    ')}`)
  console.log(`\n${edits.length} imports to rewrite. Re-run with --write.`)
  process.exit(0)
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
  console.log(`fixed ${path.relative(ROOT, file)}`)
}
