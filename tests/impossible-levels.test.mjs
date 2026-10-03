import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

import { installGameData } from './helpers/game-data.mjs'

const require = createRequire(import.meta.url)
const { buildEvolutionLevels } = require('../tools/lib/evolution-levels.cjs')

const gameData = installGameData()
const {
  mapEncounterData: encounterData,
  evolutionData,
  mapData,
  pokemonSpecies,
} = gameData
const levels = buildEvolutionLevels(evolutionData, pokemonSpecies)

// Trainer/league data is read straight from disk (it is not part of gameData).
const { readFileSync } = await import('node:fs')
const { fileURLToPath } = await import('node:url')
const { dirname, join } = await import('node:path')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readJSON = (file) => JSON.parse(readFileSync(join(root, 'public/data', file), 'utf8'))
const trainerRecords = Object.values(readJSON('trainer-data.json')).flat()

/** Every team member across trainers, gyms, Elite Four and Champions. */
function allTeamMembers() {
  const members = []
  const walk = (/** @type {any} */ record) => {
    for (const key of ['team', 'rematchTeam'])
      for (const member of record[key] ?? []) members.push(member)
  }
  for (const record of trainerRecords) walk(record)
  for (const file of ['gym-leader-data.json', 'elite-4-data.json', 'champion-data.json'])
    for (const record of readJSON(file)) walk(record)
  return members
}

test('no wild encounter sits below its species evolution level', () => {
  for (const [routeKey, bucket] of Object.entries(encounterData)) {
    for (const encounter of bucket.encounters ?? []) {
      const floor = levels.minLevel[encounter.speciesKey] ?? 1
      assert.ok(
        encounter.minLevel >= floor,
        `${routeKey} spawns ${encounter.speciesKey} at Lv.${encounter.minLevel} (floor Lv.${floor})`
      )
    }
  }
})

test('no trainer fields a Pokemon below its species evolution level', () => {
  for (const member of allTeamMembers()) {
    const floor = levels.minLevel[member.speciesKey] ?? 1
    assert.ok(
      member.level >= floor,
      `${member.speciesKey} is fielded at Lv.${member.level} (floor Lv.${floor})`
    )
  }
})

test('the Akala Island gate asks for a Pokemon that spawns on Route 3', () => {
  const gate = mapData['alola-akala-island']?.unlock?.caughtOnRoute
  assert.ok(gate, 'the Akala Island gate exists')
  const onRoute = new Set((encounterData[gate.routeKey]?.encounters ?? []).map((e) => e.speciesKey))
  for (const speciesKey of gate.species)
    assert.ok(onRoute.has(speciesKey), `${speciesKey} spawns on ${gate.routeKey}`)
  assert.deepEqual(gate.species, ['a-sandshrew', 'a-vulpix'])
  assert.equal(gate.count, 1, 'either Alolan form satisfies the gate')
})

test('the Alola Route 3 gate lists every Route 1 exclusive but only asks for 3', () => {
  const gate = mapData['alola-route-3']?.unlock?.caughtOnRoute
  assert.ok(gate, 'the Route 3 gate exists')
  assert.equal(gate.count, 3)
  // Every species exclusive to Route 1 (ignoring raid buckets) is offered.
  const routesBySpecies = {}
  for (const [routeKey, bucket] of Object.entries(encounterData)) {
    if (mapData[routeKey]?.type === 'raid') continue
    for (const encounter of bucket.encounters) (routesBySpecies[encounter.speciesKey] ??= new Set()).add(routeKey)
  }
  const exclusives = Object.keys(routesBySpecies).filter((key) => {
    const routes = routesBySpecies[key]
    return routes.size === 1 && routes.has('alola-route-1')
  })
  assert.ok(exclusives.length > 3, 'Route 1 has more than three exclusives to choose from')
  // The gate was built from the exclusives at generation time. A later area
  // pass can give one of them a home elsewhere (Inlet Grotto's Zorua, Eterna
  // Forest's Buneary), so only require the gate to cover today's exclusives.
  for (const key of exclusives)
    assert.ok(gate.species.includes(key), `${key} is offered by the Route 3 gate`)
})
