#!/usr/bin/env node
/**
 * Report every short-named binding that lives in a *nested* scope of a top-level
 * function (i.e. not the function's own scope, which is already renamed).
 *
 * Output: tools/decompile/nested-report.txt
 *   ### FunctionName
 *     L<line>  <name>  <fingerprint from property accesses>
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

const traverse = traverseModule.default ?? traverseModule
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.resolve(__dirname, '../../assets/index.js')
const OUT = path.resolve(__dirname, 'nested-report.txt')

const src = fs.readFileSync(FILE, 'utf8')
const ast = parse(src, { sourceType: 'module', plugins: ['topLevelAwait'] })

const keep = new Set(['id', 'ms', 'iv', 'hp', 'exp', 'of', 'in', 'do', 'if', 'for', 'new'])
const isShort = (n) => /^[A-Za-z_$][\w$]{0,3}$/.test(n) && !keep.has(n)

// top-level function name -> binding
const topFns = []
traverse(ast, {
  Program(programPath) {
    for (const [name, binding] of Object.entries(programPath.scope.bindings)) {
      topFns.push({ name, binding })
    }
  },
})

function functionScopePath(binding) {
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

const byFn = new Map()
for (const { name, binding } of topFns) {
  const fnPath = functionScopePath(binding)
  if (!fnPath) continue
  const fnScope = fnPath.scope
  const rows = []
  // walk every descendant scope, collecting short bindings that are NOT the fn's own scope
  fnPath.traverse({
    enter(p) {
      if (typeof p.isScope === 'function' && p.isScope() && p.scope !== fnScope) {
        for (const [bname, b] of Object.entries(p.scope.bindings)) {
          if (!isShort(bname)) continue
          // fingerprint: property accesses on this binding
          const props = new Set()
          for (const ref of b.referencePaths) {
            const par = ref.parentPath
            if (par && par.isMemberExpression({ object: ref.node }) && !par.node.computed) {
              props.add(par.node.property.name)
            }
          }
          rows.push({
            line: b.identifier.loc.start.line,
            name: bname,
            fp: [...props].slice(0, 6).join('.') || '-',
          })
        }
      }
    },
  })
  if (rows.length) {
    rows.sort((a, b) => a.line - b.line)
    byFn.set(name, rows)
  }
}

const lines = []
for (const [fn, rows] of byFn) {
  lines.push(`### ${fn}`)
  for (const r of rows) lines.push(`  L${r.line}  ${r.name.padEnd(4)} ${r.fp}`)
  lines.push('')
}
fs.writeFileSync(OUT, lines.join('\n'))
console.log(`Wrote ${OUT} — ${byFn.size} functions, ${lines.filter((l) => l.startsWith('  L')).length} nested bindings.`)
