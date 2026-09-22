#!/usr/bin/env node
/**
 * Data integrity checks for the generated game content.
 *
 * There is no test suite; this is the closest thing. It reads the committed
 * JSON under public/data/ and fails (non-zero exit) on anything that would
 * manifest as a broken Pokedex, encounter, team or map.
 *
 * Usage: node tools/validate-data.cjs   (or `npm run validate`)
 */
const fs = require('fs')
const path = require('path')
const { readRegionDir } = require('./lib/region-data.cjs')

const DATA = path.join(__dirname, '../public/data')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))

const species = read('pokemon-species.json')
const learnsets = read('possible-learnsets.json')
const moveData = read('possible-moves.json')
const evolutionData = read('evolution-data.json')
const breedingData = read('breeding-data.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))
const regions = read('regions.json')
const trainerData = read('trainer-data.json')
const gyms = read('gym-leader-data.json')
const elite4 = read('elite-4-data.json')
const champions = read('champion-data.json')

const problems = []
const fail = (message) => problems.push(message)
const speciesKeys = new Set(Object.keys(species))
const realSpecies = Object.keys(species).filter((key) => species[key].id > 0)

// --- species, moves and evolutions -------------------------------------------
for (const key of realSpecies) {
  const entry = species[key]
  if (!entry.types?.length) fail(`species ${key} has no types`)
  if (!Object.values(entry.baseStats ?? {}).some((stat) => stat > 0))
    fail(`species ${key} has no base stats`)
  if (!entry.growthRate) fail(`species ${key} has no growth rate`)
}
for (const [key, moves] of Object.entries(learnsets)) {
  if (!speciesKeys.has(key)) fail(`learnset for unknown species ${key}`)
  for (const [, moveId] of moves) if (!moveData[moveId]) fail(`learnset ${key} uses unknown move ${moveId}`)
}
for (const key of realSpecies) if (!learnsets[key]) fail(`species ${key} has no learnset (no moves in battle)`)
for (const [from, evolutions] of Object.entries(evolutionData)) {
  if (!speciesKeys.has(from)) fail(`evolution from unknown species ${from}`)
  for (const evolution of evolutions) {
    if (!speciesKeys.has(evolution.into)) fail(`evolution ${from} -> unknown ${evolution.into}`)
    if (evolution.level == null && !evolution.item && evolution.friendship == null)
      fail(`evolution ${from} -> ${evolution.into} has no trigger`)
  }
}

// --- obtainability -----------------------------------------------------------
// The generator seeds every region's first route with its starters, so the
// encounter tables already contain them. Breeding a breedable species yields the
// root of its evolution chain, so a species can also be obtained by breeding an
// obtainable final form (this is why Raid Islands only hand out final stages).
const isFormRevert = (from, into) =>
  Number(species[from]?.id) > 1025 &&
  (evolutionData[into] ?? []).some((evolution) => evolution.into === from)
const preEvolutionMap = Object.fromEntries(
  Object.entries(evolutionData).flatMap(([from, evolutions]) =>
    evolutions
      .filter((evolution) => !isFormRevert(from, evolution.into))
      .map((evolution) => [evolution.into, from])
  )
)
// Reattach form <-> form transforms whose both directions were dropped above.
for (let changed = true; changed; ) {
  changed = false
  for (const [from, evolutions] of Object.entries(evolutionData)) {
    if (!species[from] || species[from].id <= 1025) continue
    for (const evolution of evolutions) {
      const into = evolution.into
      if (!species[into] || species[into].id <= 1025) continue
      if (!(evolutionData[into] ?? []).some((back) => back.into === from)) continue
      if (preEvolutionMap[from] === undefined && preEvolutionMap[into] !== undefined)
        (preEvolutionMap[from] = into), (changed = true)
      else if (preEvolutionMap[into] === undefined && preEvolutionMap[from] !== undefined)
        (preEvolutionMap[into] = from), (changed = true)
    }
  }
}
const chainRoot = (speciesKey) => {
  const seen = new Set([speciesKey])
  let current = speciesKey
  for (let next = preEvolutionMap[current]; next && !seen.has(next); next = preEvolutionMap[current]) {
    current = next
    seen.add(current)
  }
  return current
}
const obtainable = new Set()
for (const bucket of Object.values(encounterData))
  for (const encounter of bucket.encounters ?? []) {
    if (!speciesKeys.has(encounter.speciesKey)) fail(`encounter uses unknown species ${encounter.speciesKey}`)
    obtainable.add(encounter.speciesKey)
  }
// Every Bug-type (legendaries included) turns up in the Bug Catching Contest,
// so those species are obtainable without a Raid Island (as is anything they
// evolve into). Mirrors the pool in src/game/minigames.js.
for (const [key, entry] of Object.entries(species))
  if (entry.id > 0 && entry.id <= 1025 && (entry.types ?? []).includes('Bug'))
    obtainable.add(key)
let expanded = true
while (expanded) {
  expanded = false
  for (const key of [...obtainable]) {
    const breedData = breedingData[key]
    if (breedData && !breedData.undiscovered) {
      const root = chainRoot(key)
      if (!obtainable.has(root)) (obtainable.add(root), (expanded = true))
    }
    for (const evolution of evolutionData[key] ?? [])
      if (!obtainable.has(evolution.into)) (obtainable.add(evolution.into), (expanded = true))
  }
}
for (const key of realSpecies) if (!obtainable.has(key)) fail(`species ${key} cannot be obtained`)

// --- encounters and map ------------------------------------------------------
const raidPools = new Map()
for (const region of regions) {
  const pool = region.raidPool ?? []
  const seen = new Set()
  for (const entry of pool) {
    if (!speciesKeys.has(entry.speciesKey)) fail(`raid pool ${region.id} has unknown species ${entry.speciesKey}`)
    if (seen.has(entry.speciesKey)) fail(`raid pool ${region.id} lists ${entry.speciesKey} twice`)
    seen.add(entry.speciesKey)
  }
  raidPools.set(region.id, seen)
}
for (const [locationId, location] of Object.entries(mapData)) {
  if (location.background && !fs.existsSync(path.join(__dirname, '../public', location.background)))
    fail(`location ${locationId} uses missing background ${location.background}`)
  for (const connection of location.connections)
    if (!mapData[connection]) fail(`location ${locationId} connects to unknown ${connection}`)
    else if (!mapData[connection].connections.includes(locationId))
      fail(`connection ${locationId} <-> ${connection} is not mutual`)
  for (const requirement of location.unlock?.battlesAtLocation ?? [])
    if (!mapData[requirement.locationId]) fail(`location ${locationId} gates on unknown ${requirement.locationId}`)
  if (location.type === 'route' && (!location.routeKey || !encounterData[location.routeKey]))
    fail(`route ${locationId} has no encounter bucket`)
  const caughtOnRoute = location.unlock?.caughtOnRoute
  if (caughtOnRoute) {
    const bucket = new Set(
      (encounterData[caughtOnRoute.routeKey]?.encounters ?? []).map((entry) => entry.speciesKey)
    )
    for (const key of caughtOnRoute.species)
      if (!bucket.has(key)) fail(`${locationId} caughtOnRoute lists ${key}, not on ${caughtOnRoute.routeKey}`)
    if (caughtOnRoute.count !== caughtOnRoute.species.length)
      fail(`${locationId} caughtOnRoute count does not match its species list`)
  }
}
for (const [bucketKey, bucket] of Object.entries(encounterData)) {
  if (!mapData[bucketKey]) fail(`encounter bucket ${bucketKey} has no location`)
  if (!bucket.encounters?.length) fail(`encounter bucket ${bucketKey} is empty`)
  for (const encounter of bucket.encounters)
    if (
      encounter.maxLevel < encounter.minLevel ||
      encounter.weight == null ||
      encounter.weight <= 0 ||
      encounter.minLevel == null
    )
      fail(`encounter ${bucketKey}/${encounter.speciesKey} has invalid weight/levels`)
}

// --- trainers and league -----------------------------------------------------
const teamLists = [
  ...Object.entries(trainerData).map(([id, list]) => [id, list]),
  ...gyms.map((gym) => [gym.name, [gym]]),
  ...elite4.map((member) => [member.name, [member]]),
  ...champions.map((champion) => [champion.id, [champion]]),
]
for (const [owner, list] of teamLists)
  for (const trainer of list)
    for (const key of ['team', 'rematchTeam'])
      for (const member of trainer[key] ?? []) {
        if (!speciesKeys.has(member.speciesKey)) fail(`${owner} team uses unknown species ${member.speciesKey}`)
        if (!(member.level >= 1 && member.level <= 100)) fail(`${owner} has an invalid level ${member.level}`)
        if (species[member.speciesKey]?.legendary) fail(`${owner} team uses legendary ${member.speciesKey}`)
      }

// --- report ------------------------------------------------------------------
if (problems.length) {
  console.error(`validate-data: ${problems.length} problem(s)`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}
console.log(
  `validate-data: ok (${realSpecies.length} species, ${Object.keys(encounterData).length} encounter buckets, ${gyms.length} gyms)`
)
