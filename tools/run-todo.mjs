#!/usr/bin/env node
// tools/run-todo.mjs
//
// Drive TODO.md to completion: hand each work section to its own `pi` run, one
// at a time, until every item is gone from the file. Nothing here touches game
// code directly — it just launches the agent, so the usual AGENTS.md conventions
// (typecheck, tests, changelog, commit) apply to each run.
//
// Two kinds of section are queued:
//   * numbered items, e.g. `## 78. Seasons` (id `78`, session `todo-78`)
//   * named follow-ups, e.g. `## Kurt's Apricorn queue (follow-up)` (id is the
//     slugified title, session `todo-kurts-apricorn-queue`)
// A small list of structural/reference headings (the priority table, the useful
// references footer, ...) is skipped — see STRUCTURAL_SECTIONS.
//
// Completion contract: an item is done when its `## ...` section is no longer in
// TODO.md. Per AGENTS.md, finished work moves to the changelog and leaves
// TODO.md, so the final step of each run is removing the section. Retries
// continue the same per-item session (`todo-<id>`), so a large item can be
// finished across several runs.
//
// Usage:
//   node tools/run-todo.mjs --dry                 # list the queue, run nothing
//   node tools/run-todo.mjs                       # work every queued section
//   node tools/run-todo.mjs --only=78,98          # numbered ids
//   node tools/run-todo.mjs --only=sos-chain-should-break-on-a-new-species
//   node tools/run-todo.mjs --from=85 --to=90     # numbered ids only
//   node tools/run-todo.mjs --attempts=3 --max=30
//   node tools/run-todo.mjs --model=sonnet:high --thinking=high
//   node tools/run-todo.mjs --fresh               # a new session per attempt
//   node tools/run-todo.mjs --fail-fast           # stop at the first failure
//
// Flags:
//   --dry            print the parsed queue and exit
//   --only=...       only these ids (numbers or slugs), comma-separated
//   --from=N/--to=N  clamp the numbered id range (named sections are skipped)
//   --attempts=N     per-item attempt cap before moving on (default 5)
//   --max=N          total `pi` runs cap (default unlimited)
//   --model=...      passed through to `pi --model`
//   --thinking=...   passed through to `pi --thinking`
//   --pi=<path>      `pi` executable (default $PI_BIN or "pi")
//   --no-approve     omit `--approve` (project trust) from each run
//   --fresh          use `--no-session` instead of a per-item session
//   --fail-fast      stop the whole batch when an item exhausts its attempts
//   --sleep=MS       pause between runs (default 2000)
//   --help           this text
//
// Logs: every run's stdout/stderr is echoed live and appended to
// tools/todo-logs/<id>-<timestamp>.log (gitignored).

import { spawn, execFileSync } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const todoPath = join(repoRoot, 'TODO.md')
const logDir = join(here, 'todo-logs')
const NUMBERED_RE = /^##\s+(\d+)\.\s+(.+?)\s*$/
const NAMED_RE = /^##\s+(.+?)\s*$/
const SENTINEL_RE = /TODO_ITEM_COMPLETE\s+#?([A-Za-z0-9-]+)/

// H2 headings that are scaffolding rather than work items. Add to this list (or
// drop a heading below) when TODO.md grows a new meta section.
const STRUCTURAL_SECTIONS = new Set([
  'Priority order (effort vs. gain)',
  'Feature ideas (0.25.0 brainstorm)',
  'Feature ideas',
  'UI polish batch',
  'Map cleanup reference maps',
  'Useful references when picking these up',
])

/** @param {string} argv */
function parseArgs(argv) {
  /** @type {Record<string, any>} */
  const opts = {
    dry: false,
    only: null,
    from: null,
    to: null,
    attempts: 5,
    max: Infinity,
    model: null,
    thinking: null,
    piBin: process.env.PI_BIN || 'pi',
    approve: true,
    fresh: false,
    failFast: false,
    sleep: 2000,
    help: false,
  }
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      opts.help = true
      continue
    }
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/)
    if (!match) {
      throw new Error(`Unknown argument: ${arg}`)
    }
    const [, key, value] = match
    switch (key) {
      case 'dry':
        opts.dry = true
        break
      case 'only':
        opts.only = String(value || '')
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
        break
      case 'from':
        opts.from = Number(value)
        break
      case 'to':
        opts.to = Number(value)
        break
      case 'attempts':
        opts.attempts = Number(value)
        break
      case 'max':
        opts.max = Number(value)
        break
      case 'model':
        opts.model = value
        break
      case 'thinking':
        opts.thinking = value
        break
      case 'pi':
        opts.piBin = value || opts.piBin
        break
      case 'no-approve':
        opts.approve = false
        break
      case 'fresh':
        opts.fresh = true
        break
      case 'fail-fast':
        opts.failFast = true
        break
      case 'sleep':
        opts.sleep = Number(value)
        break
      default:
        throw new Error(`Unknown flag: --${key}`)
    }
  }
  return opts
}

/** @param {string} title */
function slugify(title) {
  return title
    .replace(/['\u2019]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * @param {string} text
 * @returns {{ id: string, number: number | null, slug: string | null, title: string, body: string }[]}
 */
function parseItems(text) {
  const lines = text.split(/\r?\n/)
  /** @type {{ number: number | null, title: string, bodyLines: string[] }[]} */
  const raw = []
  let current = null
  for (const line of lines) {
    const numbered = line.match(NUMBERED_RE)
    const named = numbered ? null : line.match(NAMED_RE)
    if (numbered || named) {
      if (current) raw.push(current)
      current = numbered
        ? { number: Number(numbered[1]), title: numbered[2].trim(), bodyLines: [] }
        : { number: null, title: named[1].trim(), bodyLines: [] }
    } else if (current) {
      current.bodyLines.push(line)
    }
  }
  if (current) raw.push(current)

  return raw
    .filter((item) => item.number != null || !STRUCTURAL_SECTIONS.has(item.title))
    .map((item) => {
      const body = item.bodyLines.join('\n').trim()
      if (item.number != null) {
        return { id: String(item.number), number: item.number, slug: null, title: item.title, body }
      }
      const slug = slugify(item.title)
      return { id: slug, number: null, slug, title: item.title, body }
    })
}

/** @param {string} body */
function progressOf(body) {
  const open = (body.match(/^\s*-\s*\[ \]/gm) || []).length
  const done = (body.match(/^\s*-\s*\[[xX]\]/gm) || []).length
  return { open, done }
}

function readTodo() {
  return readFileSync(todoPath, 'utf8')
}

/** @param {{ id: string, number: number | null, slug: string | null, title: string }} item */
function itemTag(item) {
  return `#${item.number != null ? item.number : item.slug}`
}

/** @param {Record<string, any>} opts */
function queueFilter(opts) {
  return (/** @type {{ id: string, number: number | null }} */ item) => {
    if (opts.only && !opts.only.includes(item.id)) return false
    if (opts.from != null && Number.isFinite(opts.from)) {
      if (item.number == null || item.number < opts.from) return false
    }
    if (opts.to != null && Number.isFinite(opts.to)) {
      if (item.number == null || item.number > opts.to) return false
    }
    return true
  }
}

function gitDirty() {
  try {
    return execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function sleep(ms) {
  return new Promise((done) => setTimeout(done, ms))
}

/**
 * @param {string} prompt
 * @param {Record<string, any>} opts
 * @param {string} sessionId
 * @param {string} logPath
 */
function runPi(prompt, opts, sessionId, logPath) {
  const args = ['--print']
  if (opts.approve) args.push('--approve')
  if (opts.fresh) args.push('--no-session')
  else args.push('--session-id', `todo-${sessionId}`)
  if (opts.model) args.push('--model', opts.model)
  if (opts.thinking) args.push('--thinking', opts.thinking)

  return new Promise((/** @type {(value: any) => void} */ done) => {
    const log = createWriteStream(logPath, { flags: 'a' })
    const child = spawn(opts.piBin, args, {
      cwd: repoRoot,
      shell: process.platform === 'win32',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let out = ''
    let err = ''
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      out += text
      process.stdout.write(text)
      log.write(text)
    })
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      err += text
      process.stderr.write(text)
      log.write(text)
    })
    const settle = (/** @type {number} */ code) => {
      log.end()
      done({ code, out, err })
    }
    child.on('error', (error) => {
      log.write(`\n[run-todo] failed to spawn ${opts.piBin}: ${error.message}\n`)
      err += String(error.message)
      settle(-1)
    })
    child.on('close', (code) => settle(code ?? -1))
    child.stdin.write(prompt)
    child.stdin.end()
  })
}

/**
 * @param {{ id: string, number: number | null, slug: string | null, title: string, body: string }} item
 * @param {number} attempt
 * @param {number} maxAttempts
 */
function buildPrompt(item, attempt, maxAttempts) {
  const retry =
    attempt > 1
      ? `\nThis is attempt ${attempt} of ${maxAttempts} for this item. The section is still in TODO.md, so the previous run either made partial progress or did not finish. Continue the work; do not start over. Check \`git log\` and the working tree for what was already done.\n`
      : ''
  const label =
    item.number != null ? `#${item.number} (${item.title})` : `"${item.title}"`
  const deleteHeading =
    item.number != null ? `## ${item.number}. ${item.title}` : `## ${item.title}`
  const sentinel = item.number != null ? `#${item.number}` : item.slug
  return `You are implementing exactly one item from TODO.md in the PokemonIdle repository. Work autonomously; do not ask the user questions.${retry}
TODO item ${label}

--- BEGIN TODO ITEM ---
${item.body}
--- END TODO ITEM ---

Repository rules (from AGENTS.md):
- Match the existing style: no semicolons, single quotes, 2-space indent, ES5 trailing commas, React 19 \`jsx()\` calls (no JSX syntax). Keep the diff scoped to this item; do not touch unrelated TODO sections.
- Keep \`npm run typecheck\` and \`npm test\` clean. Run \`npm run validate\` after any data change and \`node tools/quickplay.mjs\` after progression/gate changes.
- Record user-facing changes by adding items under the correct canonical heading in the TOP entry of \`src/data/changelog.js\`. Do NOT bump \`GAME_VERSION\` and do NOT add a new version entry.
- When the item is fully implemented, verified, and committed, DELETE its \`${deleteHeading}\` section from TODO.md. That removal is the completion signal the runner watches for.
- Commit each logical change with an imperative subject line and a body; NEVER \`git push\`.

If the item is too large to finish in one run, make solid, committed progress and leave the TODO section in place so a later run can continue.

When the item is completely done, end your final message with a line exactly like:
TODO_ITEM_COMPLETE ${sentinel}
`
}

function helpText() {
  const lines = readFileSync(join(here, 'run-todo.mjs'), 'utf8').split('\n')
  const out = []
  for (let index = 1; index < lines.length; index++) {
    if (lines[index].startsWith('//')) out.push(lines[index].replace(/^\/\/ ?/, ''))
    else if (out.length) break
  }
  return out.join('\n')
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    console.log(helpText())
    return
  }
  if (!existsSync(todoPath)) throw new Error(`No TODO.md at ${todoPath}`)

  const filter = queueFilter(opts)
  const queue = parseItems(readTodo()).filter(filter)

  if (opts.dry) {
    console.log(`${queue.length} item(s) in the queue:`)
    for (const item of queue) {
      const { open, done } = progressOf(item.body)
      const steps = done + open ? `  [${done}/${done + open} steps checked]` : ''
      console.log(`  ${itemTag(item)}  ${item.title}${steps}`)
    }
    return
  }
  if (!queue.length) {
    console.log('Nothing to do: no matching open items in TODO.md.')
    return
  }

  if (gitDirty()) {
    console.log('[run-todo] warning: the working tree is not clean; each run will see uncommitted changes.')
  }

  mkdirSync(logDir, { recursive: true })
  const completed = []
  /** @type {Set<string>} */
  const failed = new Set()
  let runs = 0

  while (true) {
    const remaining = parseItems(readTodo())
      .filter(filter)
      .filter((item) => !failed.has(item.id))
    if (!remaining.length) break
    if (runs >= opts.max) {
      console.log(`[run-todo] hit the --max cap of ${opts.max} runs; stopping.`)
      break
    }

    const item = remaining[0]
    const { open, done } = progressOf(item.body)
    const steps = done + open ? ` (${done}/${done + open} steps checked)` : ''
    console.log(`\n[run-todo] === ${itemTag(item)} ${item.title}${steps} ===`)

    let complete = false
    for (let attempt = 1; attempt <= opts.attempts && runs < opts.max; attempt++) {
      runs++
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const logPath = join(logDir, `${item.id}-${stamp}.log`)
      console.log(`[run-todo] run ${runs}: ${itemTag(item)}, attempt ${attempt}/${opts.attempts} -> ${logPath}`)
      const result = await runPi(buildPrompt(item, attempt, opts.attempts), opts, item.id, logPath)

      const present = parseItems(readTodo()).some((entry) => entry.id === item.id)
      const sentinel = result.out.match(SENTINEL_RE)
      if (!present) {
        complete = true
        console.log(`[run-todo] ${itemTag(item)} is done (section removed).`)
        break
      }
      if (sentinel && sentinel[1] === item.id) {
        console.log(`[run-todo] ${itemTag(item)} reported complete but the TODO section is still present; retrying.`)
      } else if (result.code !== 0) {
        console.log(`[run-todo] ${itemTag(item)} run exited with code ${result.code}.`)
      } else {
        console.log(`[run-todo] ${itemTag(item)} made progress but is not finished yet.`)
      }
      if (opts.sleep > 0 && attempt < opts.attempts) await sleep(opts.sleep)
    }

    if (complete) {
      completed.push(item.id)
    } else {
      failed.add(item.id)
      console.log(`[run-todo] ${itemTag(item)} exhausted its attempts; moving on.`)
      if (opts.failFast) break
    }
  }

  const stillOpen = parseItems(readTodo()).filter(filter)
  console.log('\n[run-todo] summary')
  console.log(`  completed: ${completed.length ? completed.join(', ') : '(none)'}`)
  console.log(`  failed:    ${failed.size ? [...failed].join(', ') : '(none)'}`)
  console.log(`  remaining: ${stillOpen.length ? stillOpen.map((i) => itemTag(i)).join(', ') : '(none)'}`)
  console.log(`  runs:      ${runs}`)
  if (failed.size) process.exitCode = 1
}

main().catch((error) => {
  console.error(`[run-todo] ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
