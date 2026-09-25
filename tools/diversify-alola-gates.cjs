#!/usr/bin/env node
/**
 * One-time balance pass: give Alola's zone sub-areas varied unlock gates.
 *
 * The generated rules repeated the zone hub's gate on each island's first
 * route (so Route 4 opened exactly with Akala Island) and reused the same
 * fomantis catch rule twice. This sets a distinct gate per sub-area — a mix of
 * battles, Pokedex counts, route-exclusive catches and party levels — while
 * leaving the sequential `requires` chain (hub + previous sub-area) intact.
 *
 * Idempotent: re-running changes nothing. Regenerating the data would undo it,
 * so re-run this after `generate-regions.cjs` if that is ever done.
 *
 * Usage:
 *   node tools/diversify-alola-gates.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const MAP_PATH = path.join(__dirname, '..', 'public', 'data', 'map-data', 'alola.json')
const DRY = process.argv.includes('--dry')
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

const ROUTE_1_EXCLUSIVES = [
  'buneary',
  'zorua',
  'rockruff',
  'snorlax',
  'munchlax',
  'pichu',
  'rowlet',
  'litten',
  'a-rattata',
]

/** route -> its gate (the `requires` chain is preserved separately). */
const GATES = {
  // Melemele
  'alola-route-1': {},
  'alola-route-1--hauoli-outskirts': {
    battlesAtLocation: [{ locationId: 'alola-route-1', count: 4 }],
  },
  'alola-route-2': {
    battlesAtLocation: [{ locationId: 'alola-route-1', count: 8 }],
    partyLevel: 11,
  },
  'alola-route-3': {
    battlesAtLocation: [{ locationId: 'alola-route-1', count: 15 }],
    caughtOnRoute: { routeKey: 'alola-route-1', species: ROUTE_1_EXCLUSIVES, count: 3 },
  },
  // Akala
  'alola-route-4': {},
  'alola-route-5': {
    battlesAtLocation: [{ locationId: 'alola-route-4', count: 8 }],
    gymsRequired: ['alola-gym-1'],
  },
  'alola-route-6': { partyLevel: 27, caughtCount: 16 },
  'alola-route-7': {
    caughtOnRoute: { routeKey: 'alola-route-6', species: ['wishiwashi'], count: 1 },
  },
  'alola-route-8': { battlesAtLocation: [{ locationId: 'alola-route-7', count: 12 }] },
  // Ula'ula
  'alola-route-9': {},
  'alola-route-10': {
    battlesAtLocation: [{ locationId: 'alola-route-9', count: 10 }],
    gymsRequired: ['alola-gym-2'],
  },
  'alola-route-11': {
    caughtOnRoute: { routeKey: 'alola-route-10', species: ['jangmo-o'], count: 1 },
    gymsRequired: ['alola-gym-4'],
  },
  'alola-route-12': { caughtCount: 26, gymsRequired: ['alola-gym-5'] },
  'alola-route-13': {
    battlesAtLocation: [{ locationId: 'alola-route-12', count: 12 }],
    partyLevel: 51,
    gymsRequired: ['alola-gym-6'],
  },
  'alola-route-14': { caughtCount: 32, partyLevel: 55, gymsRequired: ['alola-gym-7'] },
  'alola-route-15': {
    battlesAtLocation: [{ locationId: 'alola-konikoni-city', count: 10 }],
    gymsRequired: ['alola-gym-8'],
  },
  // Poni
  'alola-route-16': {},
  'alola-route-17': {
    battlesAtLocation: [{ locationId: 'alola-route-16', count: 15 }],
    partyLevel: 73,
    gymsRequired: ['alola-gym-8'],
  },
}

const map = read(MAP_PATH)
let changed = 0
for (const [routeId, gate] of Object.entries(GATES)) {
  const location = map[routeId]
  if (!location) {
    console.warn(`missing location ${routeId}`)
    continue
  }
  const requires = location.unlock?.requires ?? [],
    unlock = { ...(requires.length ? { requires } : {}), ...gate }
  if (JSON.stringify(location.unlock) === JSON.stringify(unlock)) continue
  location.unlock = unlock
  changed++
  console.log(`${routeId}: ${JSON.stringify(unlock)}`)
}
if (changed && !DRY) fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 1) + '\n')
console.log(`${DRY ? 'would change' : 'changed'} ${changed} gate(s)`)
