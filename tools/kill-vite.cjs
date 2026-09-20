#!/usr/bin/env node
/**
 * Kill orphaned Vite dev servers.
 *
 * Backgrounding `npm run dev` and stopping it with `pkill -f vite` doesn't work
 * on Windows (`node.exe` isn't matched), so dev servers pile up across ports
 * and the browser can end up talking to a stale one — which shows up as errors
 * like `does not provide an export named 'X'`.
 *
 * This scans the Vite port range for LISTENING sockets and terminates them
 * (`taskkill` on Windows, `kill` elsewhere).
 *
 * Usage: node tools/kill-vite.cjs [--from 5173] [--to 5190] [--dry]
 */
const { execSync } = require('node:child_process')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? Number(process.argv[i + 1]) : fallback
}
const from = arg('--from', 5173)
const to = arg('--to', 5190)
const dry = process.argv.includes('--dry')

/** @returns {{ pid: string, port: number }[]} */
function listeners() {
  const found = []
  if (process.platform === 'win32') {
    let out = ''
    try {
      out = execSync('netstat -ano', { encoding: 'utf8' })
    } catch {
      return found
    }
    for (const line of out.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line)) continue
      const cols = line.trim().split(/\s+/)
      const local = cols[1] ?? ''
      const pid = cols[cols.length - 1]
      const port = Number(local.slice(local.lastIndexOf(':') + 1))
      if (port >= from && port <= to && /^\d+$/.test(pid)) found.push({ pid, port })
    }
  } else {
    for (let port = from; port <= to; port++) {
      try {
        const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim()
        for (const pid of out.split(/\s+/).filter(Boolean)) found.push({ pid, port })
      } catch {
        /* nothing listening on this port */
      }
    }
  }
  // de-dupe by pid (a process can listen on both IPv4 and IPv6)
  const seen = new Set()
  return found.filter((f) => (seen.has(f.pid) ? false : (seen.add(f.pid), true)))
}

const found = listeners()
if (found.length === 0) {
  console.log(`No dev servers found on ports ${from}-${to}.`)
  process.exit(0)
}

for (const { pid, port } of found) {
  if (dry) {
    console.log(`would kill pid ${pid} (port ${port})`)
    continue
  }
  try {
    if (process.platform === 'win32') execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
    else process.kill(Number(pid), 'SIGKILL')
    console.log(`killed pid ${pid} (port ${port})`)
  } catch {
    console.log(`could not kill pid ${pid} (port ${port})`)
  }
}
console.log(dry ? 'Dry run only.' : `Done — stopped ${found.length} process(es).`)
