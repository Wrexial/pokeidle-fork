#!/usr/bin/env node
/**
 * Build playable region content (gens 2-9) from the scraped real maps
 * (tools/region-maps.json, produced by scrape-region-maps.cjs).
 *
 * Uses the real route/town names, connections and layout, then adds:
 *  - wild encounters per route (that generation's species)
 *  - marts + trainers in towns
 *  - a per-region gym/Elite Four/Champion league
 *  - a per-region Raid Island with that generation's uncatchable Pokemon
 *
 * Idempotent: regenerates only the non-Kanto content. Run scrape-region-maps
 * first (or keep tools/region-maps.json committed).
 *
 * Usage: node tools/generate-regions.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 1) + '\n')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')

const GEN_RANGES = [
  [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
  [650, 721], [722, 809], [810, 905], [906, 1025],
]
const REGIONS = [
  { id: 'johto', name: 'Johto', gen: 2, entry: 'new-bark-town' },
  { id: 'hoenn', name: 'Hoenn', gen: 3, entry: 'littleroot-town' },
  { id: 'sinnoh', name: 'Sinnoh', gen: 4, entry: 'twinleaf-town' },
  { id: 'unova', name: 'Unova', gen: 5, entry: 'nuvema-town' },
  { id: 'kalos', name: 'Kalos', gen: 6, entry: 'vaniville-town' },
  { id: 'alola', name: 'Alola', gen: 7, entry: 'iki-town' },
  { id: 'galar', name: 'Galar', gen: 8, entry: 'postwick' },
  { id: 'paldea', name: 'Paldea', gen: 9, entry: 'los-platos' },
]
const GEN_BASE_LEVEL = { 2: 28, 3: 37, 4: 46, 5: 55, 6: 64, 7: 73, 8: 82, 9: 91 }
// The regions form a linear level ramp: each region's band runs from its start
// level up to just below the next region's start, so wild Pokemon scale with
// your progress and regions don't overlap.
const REGION_ORDER = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea']
const REGION_START_LEVEL = { kanto: 5, johto: 28, hoenn: 37, sinnoh: 46, unova: 55, kalos: 64, alola: 73, galar: 82, paldea: 91 }
const regionBand = (regionId) => {
  const index = REGION_ORDER.indexOf(regionId)
  const start = REGION_START_LEVEL[regionId] ?? 5
  const end =
    index + 1 < REGION_ORDER.length ? REGION_START_LEVEL[REGION_ORDER[index + 1]] - 1 : 100
  return { start, end }
}
const TRAINER_CLASSES = ['youngster', 'lass', 'bugCatcher', 'hiker', 'camper', 'beauty', 'coolTrainer', 'psychic', 'scientist', 'ace', 'blackbelt', 'swimmer']
const LEADER_SPRITES = ['acetrainer', 'hiker', 'beauty', 'blackbelt', 'psychic', 'scientist', 'camper', 'swimmer', 'gentleman', 'juggler']
const BADGE_COLORS = ['#a0a0a0', '#4878b0', '#c8a030', '#48a048', '#b83028', '#a060c0', '#e08040', '#40c0c0']
const GEN_STARTERS = {
  2: ['chikorita', 'cyndaquil', 'totodile'], 3: ['treecko', 'torchic', 'mudkip'],
  4: ['turtwig', 'chimchar', 'piplup'], 5: ['snivy', 'tepig', 'oshawott'],
  6: ['chespin', 'fennekin', 'froakie'], 7: ['rowlet', 'litten', 'popplio'],
  8: ['grookey', 'scorbunny', 'sobble'], 9: ['sprigatito', 'fuecoco', 'quaxly'],
}
const GYM_LEADERS = {
  johto: ['Falkner', 'Bugsy', 'Whitney', 'Morty', 'Chuck', 'Jasmine', 'Pryce', 'Clair'],
  hoenn: ['Roxanne', 'Brawly', 'Wattson', 'Flannery', 'Norman', 'Winona', 'Tate', 'Juan'],
  sinnoh: ['Roark', 'Gardenia', 'Maylene', 'Crasher Wake', 'Fantina', 'Byron', 'Candice', 'Volkner'],
  unova: ['Cilan', 'Lenora', 'Burgh', 'Elesa', 'Clay', 'Skyla', 'Brycen', 'Drayden'],
  kalos: ['Viola', 'Grant', 'Korrina', 'Ramos', 'Clemont', 'Valerie', 'Olympia', 'Wulfric'],
  alola: ['Ilima', 'Lana', 'Kiawe', 'Mallow', 'Sophocles', 'Acerola', 'Mina', 'Hapu'],
  galar: ['Milo', 'Nessa', 'Kabu', 'Bea', 'Opal', 'Gordie', 'Piers', 'Raihan'],
  paldea: ['Katy', 'Brassius', 'Iono', 'Kofu', 'Larry', 'Ryme', 'Tulip', 'Grusha'],
}
const ELITE_FOUR = {
  johto: ['Will', 'Koga', 'Bruno', 'Karen'], hoenn: ['Sidney', 'Phoebe', 'Glacia', 'Drake'],
  sinnoh: ['Aaron', 'Bertha', 'Flint', 'Lucian'], unova: ['Shauntal', 'Grimsley', 'Caitlin', 'Marshal'],
  kalos: ['Malva', 'Siebold', 'Wikstrom', 'Drasna'], alola: ['Hala', 'Olivia', 'Molayne', 'Kahili'],
  galar: ['Marnie', 'Hop', 'Bede', 'Raihan'], paldea: ['Rika', 'Poppy', 'Hassel', 'Clavell'],
}
const CHAMPIONS = { johto: 'Lance', hoenn: 'Steven', sinnoh: 'Cynthia', unova: 'Alder', kalos: 'Diantha', alola: 'Kukui', galar: 'Leon', paldea: 'Geeta' }
const KANTO_LEGENDARIES = [
  { speciesKey: 'articuno', level: 70 }, { speciesKey: 'zapdos', level: 70 },
  { speciesKey: 'moltres', level: 70 }, { speciesKey: 'mewtwo', level: 80 }, { speciesKey: 'mew', level: 60 },
]

const regionMaps = JSON.parse(fs.readFileSync(path.join(__dirname, 'region-maps.json'), 'utf8'))
const realEncounters = fs.existsSync(path.join(__dirname, 'route-encounters.json'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, 'route-encounters.json'), 'utf8'))
  : {}
const species = read('pokemon-species.json')
const evolutionData = read('evolution-data.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))
const trainerData = read('trainer-data.json')

// --- clean previous generated content ---------------------------------------
const genRegionIds = new Set(REGIONS.map((r) => r.id))
const isGenerated = (id) => genRegionIds.has(String(id).split('-')[0])
for (const key of Object.keys(mapData)) if (isGenerated(key)) delete mapData[key]
for (const key of Object.keys(encounterData)) if (isGenerated(key)) delete encounterData[key]
for (const key of Object.keys(trainerData)) if (isGenerated(key)) delete trainerData[key]
for (const loc of Object.values(mapData)) if (!loc.region) loc.region = 'kanto'

const gymData = read('gym-leader-data.json').filter((g) => !isGenerated(g.id))
const e4Data = read('elite-4-data.json').filter((e) => !isGenerated(e.id))
const champRaw = read('champion-data.json')
const champData = (Array.isArray(champRaw) ? champRaw : [champRaw]).filter((c) => !isGenerated(c.id))
for (const g of gymData) g.region ||= 'kanto'
for (const e of e4Data) e.region ||= 'kanto'
for (const c of champData) c.region ||= 'kanto'

// --- helpers -----------------------------------------------------------------
const clampLevel = (n) => Math.max(2, Math.min(100, n))
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '')
const locId = (regionId, node) => (node.startsWith(regionId + '-') ? node : `${regionId}-${node}`)
const isRouteNode = (node) => /route/.test(node) || node.startsWith('auto-') || /province-area/.test(node)
const isTownNode = (node) => !isRouteNode(node)

const byId = Object.entries(species)
  .filter(([, s]) => typeof s.id === 'number' && s.id > 0)
  .map(([key, s]) => ({ key, ...s }))
const speciesForGen = (gen) => {
  const [a, b] = GEN_RANGES[gen - 1]
  return byId.filter((s) => s.id >= a && s.id <= b).sort((x, y) => x.id - y.id)
}
const encounterWeight = (s, idx) => (idx < 3 ? 20 : idx < 8 ? 12 : 6)
const makeTeam = (list, offset, size, baseLevel, step = 1) =>
  Array.from({ length: size }, (_, i) => ({
    speciesKey: list[(offset + i) % list.length].key,
    level: clampLevel(baseLevel + i * step),
  }))

/**
 * Dynamic per-zone levelling: spread a region's routes across its level band,
 * following the order of the routes' real difficulty (median level). Each zone
 * gets a tight level window instead of one huge aggregate range.
 *
 * @param {string} regionId
 * @param {Record<string, { minLevel: number, maxLevel: number }[]>} entriesByKey
 */
function levelRoutes(regionId, entriesByKey) {
  const { start, end } = regionBand(regionId)
  const span = end - start
  const keys = Object.keys(entriesByKey).filter((key) => entriesByKey[key]?.length)
  const centerOf = (key) => {
    const mins = entriesByKey[key].map((entry) => entry.minLevel).sort((a, b) => a - b)
    return mins[Math.floor(mins.length / 2)] ?? start
  }
  const ranked = [...keys].sort((a, b) => centerOf(a) - centerOf(b))
  const rank = new Map(ranked.map((key, i) => [key, i]))
  for (const key of keys) {
    const t = keys.length <= 1 ? 0 : rank.get(key) / (keys.length - 1)
    const zoneLevel = Math.max(2, Math.min(100, Math.round(start + t * span)))
    for (const entry of entriesByKey[key]) {
      entry.minLevel = zoneLevel
      entry.maxLevel = Math.max(zoneLevel, Math.min(100, zoneLevel + 2))
    }
  }
}

// --- generate ----------------------------------------------------------------
const regions = [{ id: 'kanto', name: 'Kanto', generation: 1, order: 1, entry: 'palletTown', startLevel: 5, raidPool: KANTO_LEGENDARIES }]
let unlockOrder = 100

for (const region of REGIONS) {
  const { id: regionId, name, gen, entry } = region
  const map = regionMaps[regionId]
  if (!map) {
    console.warn(`no scraped map for ${regionId}, skipping`)
    continue
  }
  const nodes = [...map.nodes]
  const display = map.display
  const positions = map.positions
  const adjacency = {}
  for (const n of nodes) adjacency[n] = new Set()
  for (const e of map.edges) {
    if (!adjacency[e.from] || !adjacency[e.to]) continue
    adjacency[e.from].add(e.to)
    adjacency[e.to].add(e.from)
  }

  // BFS from entry; attach any isolated nodes to their nearest reachable node
  const depth = {}
  const parent = {}
  const entryNode = nodes.includes(entry) ? entry : nodes[0]
  const queue = [entryNode]
  depth[entryNode] = 0
  while (queue.length) {
    const cur = queue.shift()
    for (const nb of adjacency[cur]) {
      if (depth[nb] === undefined) {
        depth[nb] = depth[cur] + 1
        parent[nb] = cur
        queue.push(nb)
      }
    }
  }
  for (const n of nodes) {
    if (depth[n] !== undefined) continue
    let best = null, bestD = Infinity
    for (const m of nodes) {
      if (depth[m] === undefined) continue
      const dx = (positions[n]?.x ?? 0) - (positions[m]?.x ?? 0)
      const dy = (positions[n]?.y ?? 0) - (positions[m]?.y ?? 0)
      const d = dx * dx + dy * dy
      if (d < bestD) { bestD = d; best = m }
    }
    if (best) {
      depth[n] = depth[best] + 1
      parent[n] = best
      adjacency[best].add(n)
      adjacency[n].add(best)
    } else {
      depth[n] = 0
    }
  }

  const order = nodes.slice().sort((a, b) => depth[a] - depth[b])
  const routeNodes = order.filter(isRouteNode)
  const townNodes = order.filter(isTownNode)
  const usedPos = []
  const placeAt = (x0, y0) => {
    let x = x0
    let y = y0
    let guard = 0
    while (guard++ < 200) {
      let ok = true
      for (const p of usedPos)
        if (Math.hypot(x - p.x, y - p.y) < 6) {
          ok = false
          break
        }
      if (ok) break
      x = x + 5 > 96 ? 4 : x + 5
      y = y + 4 > 96 ? 4 : y + 4
    }
    usedPos.push({ x, y })
    return { x, y }
  }
  const place = (node) => placeAt(positions[node]?.x ?? 50, positions[node]?.y ?? 50)
  const base = GEN_BASE_LEVEL[gen]
  const band = regionBand(regionId)
  const starters = GEN_STARTERS[gen]
  const all = speciesForGen(gen)
  const wild = all.filter((s) => s.catchRate > 3 && !starters.includes(s.key))

  const regionObj = {
    id: regionId,
    name,
    generation: gen,
    order: gen,
    entry: locId(regionId, entryNode),
    startLevel: base,
  }
  regions.push(regionObj)

  // encounters: real per-route species when available, else a generation slice.
  // Levels here are placeholders; levelRoutes() re-bands them per zone below.
  const perRoute = 8
  const routeEncounter = {}
  routeNodes.forEach((node, i) => {
    const placeholder = clampLevel(base + Math.max(0, depth[node] - 1) * 2),
      real = realEncounters[regionId]?.[node]
    let encounters
    if (real && real.length) {
      encounters = real.map((e) => ({ ...e }))
    } else if (wild.length) {
      const start =
        routeNodes.length <= 1
          ? 0
          : Math.round((i * Math.max(0, wild.length - perRoute)) / (routeNodes.length - 1))
      encounters = wild
        .slice(start, start + perRoute)
        .map((s, idx) => ({
          speciesKey: s.key,
          weight: encounterWeight(s, idx),
          minLevel: placeholder,
          maxLevel: placeholder,
        }))
    } else {
      encounters = []
    }
    routeEncounter[node] = { name: display[node] ?? node, encounters }
  })

  // dynamic per-zone levelling across this region's routes
  const routeEntries = {}
  for (const node of routeNodes) routeEntries[locId(regionId, node)] = routeEncounter[node].encounters
  levelRoutes(regionId, routeEntries)

  // starters are a rare find on the first route (added after levelling so they
  // don't skew the difficulty ranking)
  const firstBucket = routeNodes.length ? routeEncounter[routeNodes[0]].encounters : null
  if (firstBucket) {
    const zoneLevel = firstBucket[0]?.minLevel ?? base
    for (const key of starters)
      if (species[key] && !firstBucket.some((e) => e.speciesKey === key))
        firstBucket.push({
          speciesKey: key,
          weight: 1,
          minLevel: zoneLevel,
          maxLevel: clampLevel(zoneLevel + 2),
        })
  }

  // Raid pool = this generation's species that can't be obtained in the region
  // (not found in the wild and not reachable by evolving a wild Pokemon).
  const obtainable = new Set()
  for (const bucket of Object.values(routeEncounter))
    for (const enc of bucket.encounters) obtainable.add(enc.speciesKey)
  let expanded = true
  while (expanded) {
    expanded = false
    for (const key of [...obtainable])
      for (const evo of evolutionData[key] || [])
        if (!obtainable.has(evo.into)) (obtainable.add(evo.into), (expanded = true))
  }
  regionObj.raidPool = all
    .filter((s) => !obtainable.has(s.key))
    .map((s) => ({ speciesKey: s.key, level: clampLevel(base + (s.catchRate <= 3 ? 35 : 25)) }))

  // map/town/route locations
  const prevRegionId = gen === 2 ? 'kanto' : REGIONS[gen - 3].id
  for (const node of order) {
    const id = locId(regionId, node)
    const isRoute = isRouteNode(node)
    const unlock =
      node === entryNode
        ? { entry: true, previous: prevRegionId }
        : depth[node] === 1
          ? { requires: [locId(regionId, entryNode)] }
          : parent[node]
            ? {
                battlesAtLocation: [
                  { locationId: locId(regionId, parent[node]), count: 15 },
                ],
              }
            : {}
    if (isRoute) {
      encounterData[id] = routeEncounter[node]
      mapData[id] = {
        id,
        name: routeEncounter[node]?.name ?? node,
        type: 'route',
        region: regionId,
        description: `A route in the ${name} region.`,
        routeKey: id,
        connections: [...adjacency[node]].map((n) => locId(regionId, n)),
        unlock,
        unlockOrder: unlockOrder++,
        position: place(node),
      }
    } else {
      mapData[id] = {
        id,
        name: display[node] ?? node,
        type: 'town',
        region: regionId,
        description: `A town in the ${name} region.`,
        connections: [...adjacency[node]].map((n) => locId(regionId, n)),
        unlock,
        unlockOrder: unlockOrder++,
        position: place(node),
        mart: {
          name: `${name} Mart`,
          items: [
            { itemId: 'pokeball' }, { itemId: 'greatball' }, { itemId: 'ultraball' },
            { itemId: 'repel' }, { itemId: 'honey' },
          ],
        },
      }
      const pool = all.length ? all : wild
      if (pool.length)
        trainerData[id] = [0, 1, 2].map((i) => ({
          id: `${id}_t${i + 1}`,
          name: `${name} Trainer ${i + 1}`,
          trainerClass: TRAINER_CLASSES[(gen * 3 + i) % TRAINER_CLASSES.length],
          team: makeTeam(pool, i * 2, 2, clampLevel(band.start + 1 + i), 1),
        }))
    }
  }

  // raid island
  const lastRoute = routeNodes[routeNodes.length - 1]
  if (lastRoute) {
    const raidId = `${regionId}-raid`
    const raidNodeName = `${name} Raid Island`
    encounterData[raidId] = {
      name: raidNodeName,
      encounters: regionObj.raidPool.map((entry) => ({
        speciesKey: entry.speciesKey,
        weight: 1,
        minLevel: entry.level,
        maxLevel: entry.level,
      })),
    }
    mapData[raidId] = {
      id: raidId,
      name: raidNodeName,
      type: 'raid',
      region: regionId,
      description: `A mysterious island where ${name}'s rarest Pokemon dwell.`,
      routeKey: raidId,
      connections: [locId(regionId, lastRoute)],
      unlock: {
        battlesAtLocation: [{ locationId: locId(regionId, lastRoute), count: 20 }],
      },
      unlockOrder: unlockOrder++,
      position: placeAt(
        Math.min(94, (positions[lastRoute]?.x ?? 50) + 8),
        Math.max(6, (positions[lastRoute]?.y ?? 50) - 10)
      ),
    }
  }

  // league: gyms spread across towns, then Elite Four + Champion
  const gymTowns = townNodes.length ? townNodes : [entryNode]
  const roster = wild.length ? wild : all
  ;(GYM_LEADERS[regionId] ?? []).forEach((leaderName, i) => {
    gymData.push({
      id: `${regionId}-gym-${i + 1}`,
      name: leaderName,
      title: `${name} Gym Leader`,
      region: regionId,
      locationKey: locId(regionId, gymTowns[i % gymTowns.length]),
      badgeName: `${name} Badge ${i + 1}`,
      badgeColor: BADGE_COLORS[i % BADGE_COLORS.length],
      spriteKey: LEADER_SPRITES[(gen + i) % LEADER_SPRITES.length],
      team: makeTeam(roster, i * 3, 3, clampLevel(band.start + 1 + i), 1),
    })
  })
  ;(ELITE_FOUR[regionId] ?? []).forEach((memberName, i) => {
    e4Data.push({
      id: `${regionId}-e4-${i + 1}`,
      name: memberName,
      title: `${name} Elite Four`,
      region: regionId,
      spriteKey: 'acetrainer',
      team: makeTeam(roster, 24 + i * 4, 5, clampLevel(band.end - 3 + i), 1),
    })
  })
  champData.push({
    id: `${regionId}-champion`,
    name: CHAMPIONS[regionId],
    title: `${name} Champion`,
    region: regionId,
    spriteKey: 'acetrainer',
    team: makeTeam(roster, 44, 6, clampLevel(band.end), 1),
  })
}

// refresh Kanto wild encounters from the real data too (keeping the curated
// location names, and re-adding the Kanto starters as rare Safari Zone finds)
if (realEncounters.kanto) {
  let refreshed = 0
  for (const loc of Object.values(mapData)) {
    if ((loc.region ?? 'kanto') !== 'kanto' || !loc.routeKey) continue
    const real = realEncounters.kanto[loc.routeKey]
    if (real && real.length && encounterData[loc.routeKey]) {
      encounterData[loc.routeKey] = {
        name: encounterData[loc.routeKey].name,
        encounters: real.map((e) => ({ ...e })),
      }
      refreshed++
    }
  }
  // Kanto gets the same dynamic per-zone levelling as the other regions
  const kantoEntries = {}
  for (const loc of Object.values(mapData)) {
    if ((loc.region ?? 'kanto') !== 'kanto' || !loc.routeKey) continue
    if (encounterData[loc.routeKey]) kantoEntries[loc.routeKey] = encounterData[loc.routeKey].encounters
  }
  levelRoutes('kanto', kantoEntries)
  // re-add the Kanto starters as rare Safari Zone finds, at that zone's level
  const safariAfter = encounterData.safariZone
  if (safariAfter) {
    const zoneLevel = safariAfter.encounters[0]?.minLevel ?? 20
    for (const key of ['bulbasaur', 'charmander', 'squirtle'])
      if (species[key] && !safariAfter.encounters.some((e) => e.speciesKey === key))
        safariAfter.encounters.push({
          speciesKey: key,
          weight: 1,
          minLevel: zoneLevel,
          maxLevel: clampLevel(zoneLevel + 2),
        })
  }
  console.log('kanto buckets refreshed:', refreshed)
}

// tidy the graph: make every connection mutual, and hang any isolated location
// (e.g. Kanto's Raid Island) off its nearest neighbour so it isn't floating
// on the map with no road.
for (const loc of Object.values(mapData)) {
  for (const id of [...loc.connections]) {
    const other = mapData[id]
    if (other && !other.connections.includes(loc.id)) other.connections.push(loc.id)
  }
}
for (const loc of Object.values(mapData)) {
  if (loc.connections.length) continue
  let best = null,
    bestD = Infinity
  for (const other of Object.values(mapData)) {
    if (other.id === loc.id || (other.region ?? 'kanto') !== (loc.region ?? 'kanto')) continue
    const dx = other.position.x - loc.position.x,
      dy = other.position.y - loc.position.y
    if (dx * dx + dy * dy < bestD) ((bestD = dx * dx + dy * dy), (best = other))
  }
  if (best) {
    loc.connections.push(best.id)
    best.connections.push(loc.id)
  }
}

// Region entry points are gated on the player's starting region: a start region
// is open immediately, and every other region opens by beating the previous
// region's Champion (cycling Kanto <- Paldea so nothing is unreachable).
if (mapData.palletTown) mapData.palletTown.unlock = { entry: true, previous: 'paldea' }
if (mapData.route1) mapData.route1.unlock = { requires: ['palletTown'] }

write('regions.json', regions)
writeRegionDir(path.join(DATA, 'map-data'), mapData)
writeRegionDir(
  path.join(DATA, 'encounter-data'),
  encounterData,
  (key) => mapData[key]?.region ?? 'kanto'
)
write('trainer-data.json', trainerData)
write('gym-leader-data.json', gymData)
write('elite-4-data.json', e4Data)
write('champion-data.json', champData)

console.log('regions:', regions.length)
console.log('locations:', Object.keys(mapData).length)
console.log('encounter buckets:', Object.keys(encounterData).length)
console.log('gyms:', gymData.length, '| elite4:', e4Data.length, '| champions:', champData.length)
