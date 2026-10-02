#!/usr/bin/env node
/**
 * Attach the `unlock.minigame` gates (#65) to the committed map data.
 *
 * The committed data isn't idempotent with `generate-regions.cjs`, so this is a
 * data-only follow-up (like the other apply-*.cjs scripts) rather than a
 * generator change: it adds the `minigame` / `minScore` fields to chosen route
 * unlocks. Idempotent.
 *
 * Usage: node tools/apply-minigame-gates.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data/map-data')

// Clear (or score at least `minScore` in) the minigame at its home area to open
// the route. Kept off pure chokepoints: each target already has other gates and
// its minigame is reachable before the route.
const GATES = [
  { region: 'kanto', location: 'route11', minigame: 'whack', minScore: 15 },
  { region: 'johto', location: 'johto-route-36', minigame: 'bugContest' },
  {
    region: 'paldea',
    location: 'paldea-south-province-area-three',
    minigame: 'academyQuiz',
    minScore: 4,
  },
]

const dry = process.argv.includes('--dry')
let changed = 0
for (const gate of GATES) {
  const file = path.join(DATA, `${gate.region}.json`)
  if (!fs.existsSync(file)) {
    console.warn(`no map file for ${gate.region}`)
    continue
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8')),
    location = data[gate.location]
  if (!location) {
    console.warn(`no location ${gate.location} in ${gate.region}`)
    continue
  }
  location.unlock ||= {}
  const before = JSON.stringify([location.unlock.minigame, location.unlock.minScore])
  location.unlock.minigame = gate.minigame
  if (gate.minScore) location.unlock.minScore = gate.minScore
  else delete location.unlock.minScore
  const after = JSON.stringify([location.unlock.minigame, location.unlock.minScore])
  if (before !== after) {
    changed++
    console.log(`${gate.location}: ${gate.minigame}${gate.minScore ? ` >= ${gate.minScore}` : ''}`)
  }
  if (!dry) fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n')
}
console.log(`${dry ? 'would change' : 'changed'} ${changed} gate(s).`)
