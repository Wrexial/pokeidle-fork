#!/usr/bin/env node
/**
 * Print the top-level declaration dependency graph of assets/index.js:
 * for each top-level binding, the other top-level bindings it references.
 *
 * Usage: node tools/decompile/deps.mjs [--json]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default ?? traverseModule
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.resolve(__dirname, '../../assets/index.js')
const JSON_OUT = process.argv.includes('--json')

const src = fs.readFileSync(FILE, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })

let programPath
traverse(ast, {
  Program(p) {
    programPath = p
    p.stop()
  },
})

const names = new Set(Object.keys(programPath.scope.bindings))
/** @type {Map<string, Set<string>>} */
const deps = new Map()
for (const name of names) deps.set(name, new Set())

for (const [name, binding] of Object.entries(programPath.scope.bindings)) {
  const refs = new Set()
  const collect = (p) => {
    const n = p.node.name
    if (n === name) return
    // only top-level references
    if (p.scope.getBinding(n) === programPath.scope.getBinding(n)) refs.add(n)
  }
  // declarations that are functions/values: scan their nodes
  binding.path.traverse({
    Identifier(p) {
      if (p.isReferencedIdentifier()) collect(p)
    },
  })
  deps.set(name, refs)
}

if (JSON_OUT) {
  const obj = {}
  for (const [k, v] of deps) obj[k] = [...v].sort()
  console.log(JSON.stringify(obj, null, 2))
} else {
  // print only "leaf-ish" groups and cycles hints
  for (const [name, refs] of deps) {
    console.log(`${name.padEnd(28)} -> ${[...refs].sort().join(', ')}`)
  }
  // detect cycles
  const cycles = []
  const visit = (n, stack) => {
    if (stack.includes(n)) {
      cycles.push([...stack.slice(stack.indexOf(n)), n].join(' -> '))
      return
    }
    for (const d of deps.get(n) || []) visit(d, [...stack, n])
  }
  for (const n of names) visit(n, [])
  console.log('\n# cycles (may repeat):')
  console.log([...new Set(cycles)].join('\n') || '(none)')
}
