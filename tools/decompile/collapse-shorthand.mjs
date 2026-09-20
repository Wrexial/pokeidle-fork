#!/usr/bin/env node
/**
 * Collapse `{ key: key }` and `{ key: key = default }` object properties to
 * shorthand (`{ key }` / `{ key = default }`). Only real ObjectProperty nodes
 * are touched, so ternaries and `foo: foo.bar` are never affected.
 *
 * Usage: node tools/decompile/collapse-shorthand.mjs [--write]
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

const src = fs.readFileSync(FILE, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })

const edits = []
traverse(ast, {
  ObjectProperty(p) {
    const n = p.node
    if (n.shorthand || n.computed) return
    if (n.key.type !== 'Identifier') return
    const name = n.key.name
    let valueEnd = null
    if (n.value.type === 'Identifier' && n.value.name === name) valueEnd = n.value.end
    else if (
      n.value.type === 'AssignmentPattern' &&
      n.value.left.type === 'Identifier' &&
      n.value.left.name === name
    )
      valueEnd = n.value.left.end
    if (valueEnd == null) return
    edits.push({ start: n.key.start, end: valueEnd, newName: name })
  },
})

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

console.log(`${edits.length} properties collapsed to shorthand.`)
if (WRITE) {
  fs.writeFileSync(FILE, out)
  console.log(`Wrote ${path.relative(process.cwd(), FILE)}`)
} else {
  console.log('Dry run only. Re-run with --write to apply.')
}
