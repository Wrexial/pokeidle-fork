#!/usr/bin/env node
/**
 * Quickplay: headlessly "play" a region from scratch to prove its unlock graph
 * is completable, and point at any gate that can never be satisfied.
 *
 * Usage:
 *   node tools/quickplay.mjs             # every region (DLC gets its parent Champion)
 *   node tools/quickplay.mjs --region=alola
 *
 * Exits non-zero when a region has a stuck location, so it can gate a build.
 */
import { mapData, quickplayAll } from './lib/quickplay.mjs'

const only = process.argv.slice(2).find((arg) => arg.startsWith('--region='))?.split('=')[1]
const results = quickplayAll(only)

let problems = 0
for (const result of results) {
  const regionOf = (/** @type {string} */ id) => mapData[id]?.region ?? 'kanto'
  const total = Object.keys(mapData).filter((id) => regionOf(id) === result.regionId).length
  const opened = result.unlocked.filter((id) => regionOf(id) === result.regionId).length
  const status = result.loop ? 'LOOP' : result.stuck.length === 0 ? 'OK' : `${result.stuck.length} STUCK`
  console.log(
    `${result.regionId.padEnd(14)} ${String(opened).padStart(3)}/${total} open  pool=${result.pool.length}  ${status}`
  )
  for (const { id, reasons } of result.stuck) {
    problems++
    console.log(`    - ${id}: ${reasons.join('; ') || 'unknown'}`)
  }
  if (result.loop) problems++
}
console.log(problems ? `\n${problems} problem(s) found` : '\nquickplay: every region completable')
process.exit(problems ? 1 : 0)
