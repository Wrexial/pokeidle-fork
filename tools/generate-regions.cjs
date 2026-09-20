#!/usr/bin/env node
/**
 * Generate playable content for Pokémon generations 2-9 from the existing
 * species data, and merge it into the JSON the game loads at runtime.
 *
 * For each generation it creates a region: a hub town (with a mart and a few
 * trainers) plus three wild routes whose encounters are drawn from that
 * generation's species, chained by unlock rules.
 *
 * Idempotent: regenerates only the non-Kanto content (Kanto is left as-is, but
 * tagged with region "kanto").
 *
 * Usage: node tools/generate-regions.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 1) + '\n')

const GEN_RANGES = [
  [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
  [650, 721], [722, 809], [810, 905], [906, 1025],
]
const REGIONS = [
  { id: 'kanto', name: 'Kanto' },
  { id: 'johto', name: 'Johto', town: 'New Bark Town' },
  { id: 'hoenn', name: 'Hoenn', town: 'Littleroot Town' },
  { id: 'sinnoh', name: 'Sinnoh', town: 'Twinleaf Town' },
  { id: 'unova', name: 'Unova', town: 'Nuvema Town' },
  { id: 'kalos', name: 'Kalos', town: 'Vaniville Town' },
  { id: 'alola', name: 'Alola', town: 'Iki Town' },
  { id: 'galar', name: 'Galar', town: 'Postwick' },
  { id: 'paldea', name: 'Paldea', town: 'Cabo Poco' },
]
// gentle level ramp across generations (Kanto tops out ~65 in-game)
const GEN_BASE_LEVEL = [0, 28, 37, 46, 55, 64, 73, 82, 91]
const TRAINER_CLASSES = [
  'youngster', 'lass', 'bugCatcher', 'hiker', 'camper', 'beauty',
  'coolTrainer', 'psychic', 'scientist', 'ace', 'blackbelt', 'swimmer',
]

const species = read('pokemon-species.json')
const mapData = read('map-data.json')
const encounterData = read('encounter-data.json')
const trainerData = read('trainer-data.json')

// --- clean previous generated content ---------------------------------------
const genRegionIds = new Set(REGIONS.slice(1).map((r) => r.id))
for (const key of Object.keys(mapData))
  if (genRegionIds.has(mapData[key].region)) delete mapData[key]
for (const key of Object.keys(encounterData))
  if (genRegionIds.has(key.split('-')[0])) delete encounterData[key]
for (const key of Object.keys(trainerData))
  if (genRegionIds.has(key.split('-')[0])) delete trainerData[key]
// tag Kanto
for (const loc of Object.values(mapData)) if (!loc.region) loc.region = 'kanto'

// --- helpers -----------------------------------------------------------------
const byId = Object.entries(species)
  .filter(([, s]) => typeof s.id === 'number' && s.id > 0)
  .map(([key, s]) => ({ key, ...s }))

const speciesForGen = (gen) => {
  const [a, b] = GEN_RANGES[gen - 1]
  return byId.filter((s) => s.id >= a && s.id <= b).sort((x, y) => x.id - y.id)
}

const encounterWeight = (s, idx) =>
  s.catchRate <= 3 ? 1 : idx < 3 ? 20 : idx < 8 ? 12 : 6

const clampLevel = (n) => Math.max(2, Math.min(100, n))

/** Split a generation's species into `parts` contiguous chunks (by dex id). */
function chunk(list, parts) {
  const per = Math.ceil(list.length / parts)
  return Array.from({ length: parts }, (_, i) => list.slice(i * per, (i + 1) * per))
}

// --- generate ----------------------------------------------------------------
const regions = [{ id: 'kanto', name: 'Kanto', generation: 1, order: 1 }]
let unlockOrder = 100

for (let gen = 2; gen <= 9; gen++) {
  const region = REGIONS[gen - 1]
  const regionId = region.id
  const townId = `${regionId}-town`
  const routeIds = [1, 2, 3].map((n) => `${regionId}-route-${n}`)
  const base = GEN_BASE_LEVEL[gen - 1]
  const list = speciesForGen(gen)
  const chunks = chunk(list, 3)
  const prevRoute =
    gen === 2 ? null : `${REGIONS[gen - 2].id}-route-3`

  regions.push({ id: regionId, name: region.name, generation: gen, order: gen })

  // positions laid out left-to-right across the region canvas
  const positions = {
    [townId]: { x: 15, y: 55 },
    [routeIds[0]]: { x: 38, y: 35 },
    [routeIds[1]]: { x: 60, y: 60 },
    [routeIds[2]]: { x: 82, y: 38 },
  }
  const connections = {
    [townId]: [routeIds[0]],
    [routeIds[0]]: [townId, routeIds[1]],
    [routeIds[1]]: [routeIds[0], routeIds[2]],
    [routeIds[2]]: [routeIds[1]],
  }

  // town (region entry point)
  mapData[townId] = {
    id: townId,
    name: region.town,
    type: 'town',
    region: regionId,
    description: `A quiet town in the ${region.name} region.`,
    connections: connections[townId],
    unlock: gen === 2 ? { championDefeated: true } : { battlesAtLocation: [{ locationId: prevRoute, count: 30 }] },
    unlockOrder: unlockOrder++,
    position: positions[townId],
    mart: {
      name: `${region.name} Mart`,
      items: [
        { itemId: 'pokeball' },
        { itemId: 'greatball' },
        { itemId: 'ultraball' },
        { itemId: 'repel' },
        { itemId: 'honey' },
      ],
    },
    trainerCount: 3,
  }

  // wild routes
  routeIds.forEach((routeId, routeIndex) => {
    const entries = chunks[routeIndex]
    const minLevel = clampLevel(base + routeIndex * 6)
    const maxLevel = clampLevel(minLevel + 8)
    encounterData[routeId] = {
      name: `${region.name} Route ${routeIndex + 1}`,
      encounters: entries.map((s, idx) => ({
        speciesKey: s.key,
        weight: encounterWeight(s, idx),
        minLevel,
        maxLevel,
      })),
    }
    mapData[routeId] = {
      id: routeId,
      name: `${region.name} Route ${routeIndex + 1}`,
      type: 'route',
      region: regionId,
      description: `A wild path in the ${region.name} region.`,
      routeKey: routeId,
      connections: connections[routeId],
      unlock: { requires: [routeIndex === 0 ? townId : routeIds[routeIndex - 1]] },
      unlockOrder: unlockOrder++,
      position: positions[routeId],
    }
  })

  // a few trainers in the town, using that generation's species
  const pool = list.slice(0, 12)
  trainerData[townId] = [0, 1, 2].map((i) => {
    const team = [pool[(i * 2) % pool.length], pool[(i * 2 + 1) % pool.length]]
      .filter(Boolean)
      .map((s) => ({ speciesKey: s.key, level: clampLevel(base + i * 2) }))
    return {
      id: `${regionId}_${i + 1}`,
      name: `${region.name} Trainer ${i + 1}`,
      trainerClass: TRAINER_CLASSES[(gen * 3 + i) % TRAINER_CLASSES.length],
      team,
    }
  })
}

write('regions.json', regions)
write('map-data.json', mapData)
write('encounter-data.json', encounterData)
write('trainer-data.json', trainerData)

const newLocations = Object.values(mapData).filter((l) => l.region !== 'kanto').length
console.log(`regions: ${regions.length}`)
console.log(`new locations: ${newLocations}`)
console.log(`encounter buckets: ${Object.keys(encounterData).length}`)
console.log(`trainer pools: ${Object.keys(trainerData).length}`)
