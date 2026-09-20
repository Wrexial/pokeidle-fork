#!/usr/bin/env node
/**
 * Dump top-level declarations and their function-scope bindings (params +
 * let/const/var declared directly in the function body), so local variables can
 * be renamed with accurate, per-function names.
 *
 * Usage: node tools/decompile/dump-scopes.mjs [FunctionName ...]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default ?? traverseModule
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.resolve(__dirname, '../../assets/index.js')
const only = new Set(process.argv.slice(2))

const src = fs.readFileSync(FILE, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })

/** Resolve the Function node for a top-level binding, if it is one. */
export function functionPathFor(binding) {
  const p = binding.path
  if (p.isFunctionDeclaration()) return p
  if (p.isVariableDeclarator()) {
    const init = p.get('init')
    if (init.isFunctionExpression() || init.isArrowFunctionExpression()) return init
    if (init.isCallExpression()) {
      for (const arg of init.get('arguments')) {
        if (arg.isFunctionExpression() || arg.isArrowFunctionExpression())
          return arg
      }
    }
  }
  return null
}

const results = []
traverse(ast, {
  Program(programPath) {
    for (const [name, binding] of Object.entries(programPath.scope.bindings)) {
      if (only.size && !only.has(name)) continue
      const fnPath = functionPathFor(binding)
      const params = fnPath
        ? fnPath.node.params.map((n) => {
            if (n.type === 'Identifier') return n.name
            if (n.type === 'ObjectPattern')
              return `{${n.properties
                .map((pr) =>
                  pr.type === 'ObjectProperty'
                    ? `${pr.key.name}:${pr.value.name}`
                    : pr.argument?.name
                )
                .join(', ')}}`
            return `<${n.type}>`
          })
        : []
      const scopeNames = fnPath
        ? Object.keys(fnPath.scope.bindings).filter((n) => n !== name)
        : []
      results.push({ name, params, scopeNames })
    }
  },
})

for (const r of results) {
  if (!r.params.length && !r.scopeNames.length) continue
  console.log(`\n### ${r.name}`)
  if (r.params.length) console.log(`  params: ${r.params.join(', ')}`)
  if (r.scopeNames.length) console.log(`  scope : ${r.scopeNames.join(', ')}`)
}
