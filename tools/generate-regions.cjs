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
// Every region now runs its own 5-75 curve instead of sharing one linear
// 5-100 ramp: a region's starter begins at 5 and its routes, trainers, gyms and
// league climb to 75. Regions deliberately overlap afterwards, so progress
// within a region comes from route order; reusing a levelled team from an
// earlier region is a known, separate balance issue.
const LEVEL_MIN = 5
const LEVEL_MAX = 75
// The last wild zone sits two levels below the cap so its +2 window ends at 75.
const WILD_LEVEL_MAX = LEVEL_MAX - 2
const GYM_LEVEL_MIN = 12
const GYM_LEVEL_MAX = 64
const E4_LEVEL_MIN = 68
const CHAMPION_LEVEL = LEVEL_MAX - 5
// `unlockOrder` is a stable sort key, not a sequence: it is each location's
// position in its region's route progression (its `rank`), offset by region so
// later regions sort later. Deriving it instead of counting means adding a zone
// never renumbers existing ones (and never touches other regions).
const REGION_PROGRESS_BASE = 100000
// Spread index i of `count` evenly across [min, max] (inclusive).
const spread = (i, count, min, max) =>
  Math.round(min + (count <= 1 ? 0 : (i * (max - min)) / (count - 1)))
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
// The real town each leader sits in, in the same order as GYM_LEADERS (matched
// by display name against the region's scraped town nodes). This is why the
// zone lock is meaningful: e.g. Falkner is in Violet City, not the entry town.
// Alola has island trials rather than gyms (and no Poni town), so it keeps the
// spread-across-towns fallback.
const GYM_TOWNS = {
  johto: ['Violet City', 'Azalea Town', 'Goldenrod City', 'Ecruteak City', 'Cianwood City', 'Olivine City', 'Mahogany Town', 'Blackthorn City'],
  hoenn: ['Rustboro City', 'Dewford Town', 'Mauville City', 'Lavaridge Town', 'Petalburg City', 'Fortree City', 'Mossdeep City', 'Sootopolis City'],
  sinnoh: ['Oreburgh City', 'Eterna City', 'Veilstone City', 'Pastoria City', 'Hearthome City', 'Canalave City', 'Snowpoint City', 'Sunyshore City'],
  unova: ['Striaton City', 'Nacrene City', 'Castelia City', 'Nimbasa City', 'Driftveil City', 'Mistralton City', 'Icirrus City', 'Opelucid City'],
  kalos: ['Santalune City', 'Cyllage City', 'Shalour City', 'Coumarine City', 'Lumiose City', 'Laverre City', 'Anistar City', 'Snowbelle City'],
  galar: ['Turffield', 'Hulbury', 'Motostoke', 'Stow On Side', 'Ballonlea', 'Circhester', 'Spikemuth', 'Hammerlocke'],
  // Grusha's gym is on Glaseado Mountain (not a town); Zapapico is the closest.
  paldea: ['Cortondo', 'Artazon', 'Levincia', 'Cascarrafa', 'Medali', 'Montenevera', 'Alfornada', 'Zapapico'],
}
const ELITE_FOUR = {
  johto: ['Will', 'Koga', 'Bruno', 'Karen'], hoenn: ['Sidney', 'Phoebe', 'Glacia', 'Drake'],
  sinnoh: ['Aaron', 'Bertha', 'Flint', 'Lucian'], unova: ['Shauntal', 'Grimsley', 'Caitlin', 'Marshal'],
  kalos: ['Malva', 'Siebold', 'Wikstrom', 'Drasna'], alola: ['Hala', 'Olivia', 'Molayne', 'Kahili'],
  galar: ['Marnie', 'Hop', 'Bede', 'Raihan'], paldea: ['Rika', 'Poppy', 'Hassel', 'Clavell'],
}
const CHAMPIONS = { johto: 'Lance', hoenn: 'Steven', sinnoh: 'Cynthia', unova: 'Alder', kalos: 'Diantha', alola: 'Kukui', galar: 'Leon', paldea: 'Geeta' }

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
// Real wild areas the scrape drops: PokéAPI files them outside the region's
// town/route set and the compass infobox gives no direction for them. Added
// here so the generated map is complete. `rank` forces their place in the
// route order when adjacency alone would sort them too early (Mt. Silver sits
// off the entry town but is Johto's endgame).
const EXTRA_MAP_AREAS = {
  johto: [
    {
      node: 'bell-tower',
      name: 'Bell Tower',
      x: 56,
      y: 16,
      connect: [['ecruteak-city', 'north']],
      species: ['gastly', 'haunter', 'gengar', 'misdreavus', 'rattata', 'raticate', 'zubat', 'golbat'],
    },
    {
      node: 'whirl-islands',
      name: 'Whirl Islands',
      x: 27,
      y: 58,
      connect: [['johto-sea-route-41', 'south']],
      species: ['krabby', 'kingler', 'horsea', 'seadra', 'tentacool', 'tentacruel', 'seel', 'dewgong'],
    },
    {
      node: 'mt-silver',
      name: 'Mt. Silver',
      x: 84,
      y: 80,
      connect: [['new-bark-town', 'east']],
      rank: 90,
      species: ['larvitar', 'pupitar', 'onix', 'golbat', 'golduck', 'sneasel', 'misdreavus', 'donphan'],
    },
  ],
}
const EXTRA_AREA_NODES = new Set(
  Object.values(EXTRA_MAP_AREAS).flat().map((area) => area.node)
)
// Extra areas carry their own encounter list (the generation slice would drag
// mythicals like Celebi in and change the region's raid pool).
const EXTRA_AREA_SPECIES = Object.fromEntries(
  Object.entries(EXTRA_MAP_AREAS).map(([regionName, areas]) => [
    regionName,
    Object.fromEntries(areas.map((area) => [area.node, area.species])),
  ])
)
const isRouteNode = (node) =>
  /route/.test(node) ||
  node.startsWith('auto-') ||
  /province-area/.test(node) ||
  EXTRA_AREA_NODES.has(node)
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
 * Dynamic per-zone levelling: walk the region's routes in the order they
 * unlock and spread them evenly across the region's 5-75 band. Each zone gets a
 * tight window instead of one huge aggregate range, and because the order is
 * the player's progress order the curve always ramps smoothly (the scraped real
 * levels are too inconsistent between routes/versions to rank by).
 *
 * @param {string[]} orderedKeys route keys in progression order
 * @param {Record<string, { minLevel: number, maxLevel: number }[]>} entriesByKey
 */
function levelRoutes(orderedKeys, entriesByKey) {
  const keys = orderedKeys.filter((key) => entriesByKey[key]?.length)
  const span = WILD_LEVEL_MAX - LEVEL_MIN
  keys.forEach((key, i) => {
    const t = keys.length <= 1 ? 0 : i / (keys.length - 1)
    const zoneLevel = Math.max(2, Math.min(WILD_LEVEL_MAX, Math.round(LEVEL_MIN + t * span)))
    for (const entry of entriesByKey[key]) {
      entry.minLevel = zoneLevel
      entry.maxLevel = Math.max(zoneLevel, Math.min(LEVEL_MAX, zoneLevel + 2))
    }
  })
}

// --- generate ----------------------------------------------------------------
const regions = [{ id: 'kanto', name: 'Kanto', generation: 1, order: 1, entry: 'palletTown', startLevel: 5, raidPool: [], leagueLocationKey: 'indigoPlat' }]
// Raid pools can only be worked out once every region's routes exist (a raid
// species must be absent from *all* routes), so regions queue up here and are
// filled in by the raid scan lower down.
const pendingRaids = [{ regionObj: regions[0], all: speciesForGen(1) }]

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
  for (const area of EXTRA_MAP_AREAS[regionId] ?? []) {
    if (nodes.includes(area.node)) continue
    nodes.push(area.node)
    display[area.node] = area.name
    positions[area.node] = { x: area.x, y: area.y }
    for (const [target, dir] of area.connect) map.edges.push({ from: area.node, to: target, dir })
  }
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

  // --- progression order ----------------------------------------------------
  // BFS depth alone lets far areas open early (Route 46/45 reach Blackthorn
  // before Violet City; Hoenn's eastern sea routes hang off Slateport). Order
  // locations by their real route number instead, treat a town as sitting just
  // after its lowest-numbered route, and unlock each location from the closest
  // earlier-numbered neighbour. Progression then follows the actual route path.
  const routeNumber = (node) => {
    const match = String(display[node] ?? node).match(/route\s*(\d+)/i)
    return match ? Number(match[1]) : null
  }
  const rank = {}
  for (const node of nodes) {
    if (!isRouteNode(node)) continue
    const number = routeNumber(node)
    if (number !== null) rank[node] = number
  }
  for (const node of nodes) {
    if (rank[node] !== undefined) continue
    // No route number (e.g. Paldea's province areas): sort just after the
    // lowest-numbered route it touches, else fall back to BFS depth.
    let lowest = null
    for (const neighbour of adjacency[node]) {
      const neighbourRank = rank[neighbour]
      if (neighbourRank !== undefined && (lowest === null || neighbourRank < lowest))
        lowest = neighbourRank
    }
    rank[node] = lowest !== null ? lowest + 0.5 : 10000 + depth[node]
  }
  for (const area of EXTRA_MAP_AREAS[regionId] ?? [])
    if (area.rank != null) rank[area.node] = area.rank
  rank[entryNode] = -1
  // Stable per-region progress key (see REGION_PROGRESS_BASE).
  const progressKey = (node) => gen * REGION_PROGRESS_BASE + rank[node]
  const maxProgressKey = gen * REGION_PROGRESS_BASE + Math.max(...nodes.map((node) => rank[node]))
  const order = nodes
    .slice()
    .sort(
      (a, b) =>
        rank[a] - rank[b] || depth[a] - depth[b] || String(a).localeCompare(String(b))
    )
  // Build the unlock tree with Dijkstra from the entry: stepping to a
  // higher-numbered location is cheap, going backwards is heavily penalised.
  // The tree then follows the route order without dead-end detours (Route 6
  // hangs off Route 7) or the BFS shortcuts that opened Blackthorn early.
  const BACKWARD_PENALTY = 1e6
  const dist = { [entryNode]: 0 }
  const unlockParent = {}
  const settled = new Set()
  while (settled.size < nodes.length) {
    let current = null
    for (const node of nodes) {
      if (settled.has(node) || dist[node] === undefined) continue
      if (current === null || dist[node] < dist[current]) current = node
    }
    if (current === null) break
    settled.add(current)
    for (const neighbour of adjacency[current]) {
      const forward = rank[neighbour] >= rank[current]
      const next =
        dist[current] +
        Math.abs(rank[neighbour] - rank[current]) +
        (forward ? 0 : BACKWARD_PENALTY)
      if (dist[neighbour] === undefined || next < dist[neighbour]) {
        dist[neighbour] = next
        unlockParent[neighbour] = current
      }
    }
  }
  for (const node of nodes)
    if (node !== entryNode && !unlockParent[node]) unlockParent[node] = parent[node] ?? null

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
  const base = LEVEL_MIN
  const starters = GEN_STARTERS[gen]
  const all = speciesForGen(gen)
  const wild = all.filter((s) => s.catchRate > 3 && !starters.includes(s.key))

  // Resolve each gym to its town up-front so gate placement, the badge/team
  // data below and the league requirement all agree.
  const gymTowns = townNodes.length ? townNodes : [entryNode]
  const gymPlacements = (GYM_LEADERS[regionId] ?? []).map((leaderName, i) => {
    const preferredTown = (GYM_TOWNS[regionId] ?? [])[i],
      preferredNode = preferredTown
        ? townNodes.find((node) => (display[node] ?? node) === preferredTown)
        : null
    return {
      id: `${regionId}-gym-${i + 1}`,
      index: i,
      leaderName,
      townNode: preferredNode ?? gymTowns[i % gymTowns.length],
    }
  })
  // Attach each gym's badge gate to the point in the route order where the
  // badge is actually needed. Gyms sit in their real cities, which are visited
  // in an order that can differ from the canonical gym order (Hoenn's Petalburg
  // holds gym 5 but is reached before Rustboro's gym 1), so a gate on the town
  // itself would arrive far too early and wall off the early game. Instead,
  // walk the gyms in badge order and place each gate after both its own town
  // and the previous gate: gym 5 ends up on the road past Lavaridge and the
  // player backtracks to Petalburg for it, while its canonical level (and the
  // jump that comes with it) is kept. A gym whose town sits too late in the
  // route order gets no gate and is only required at the league.
  //
  // The route order is by route number, not tree order, so a node listed after
  // a town can still be one of its ancestors (Sinnoh's Route 215 gates
  // Veilstone). Gating such a node would lock the town that holds the gym, so
  // skip ancestors while scanning forward.
  const nodePosition = new Map(order.map((node, position) => [node, position]))
  const isAncestorOf = (ancestor, node) => {
    let current = node
    while (current) {
      if (current === ancestor) return true
      if (current === entryNode) return false
      current = unlockParent[current] ?? parent[current] ?? null
    }
    return false
  }
  const gateGymByNode = {}
  let previousGate = -1
  for (const gym of gymPlacements) {
    const start = Math.max(
      previousGate + 1,
      (nodePosition.get(gym.townNode) ?? 0) + 1,
      1
    )
    for (let position = start; position < order.length; position++) {
      const candidate = order[position]
      if (candidate === gym.townNode || isAncestorOf(candidate, gym.townNode)) continue
      gateGymByNode[candidate] = gym.id
      previousGate = position
      break
    }
  }

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
      extraSpecies = EXTRA_AREA_SPECIES[regionId]?.[node],
      real = realEncounters[regionId]?.[node]
    let encounters
    if (extraSpecies) {
      encounters = extraSpecies
        .filter((key) => species[key])
        .map((key, idx) => ({
          speciesKey: key,
          weight: encounterWeight(null, idx),
          minLevel: placeholder,
          maxLevel: placeholder,
        }))
    } else if (real && real.length) {
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

  // dynamic per-zone levelling across this region's routes, in unlock order
  const routeEntries = {}
  for (const node of routeNodes) routeEntries[locId(regionId, node)] = routeEncounter[node].encounters
  levelRoutes(
    routeNodes.map((node) => locId(regionId, node)),
    routeEntries
  )

  // starters are a rare find on the first route (added after levelling so they
  // don't skew the curve)
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

  // The raid pool is filled in after the region loop (see the raid scan).

  // map/town/route locations
  const prevRegionId = gen === 2 ? 'kanto' : REGIONS[gen - 3].id
  for (const node of order) {
    const id = locId(regionId, node)
    const isRoute = isRouteNode(node)
    const parent = node === entryNode ? null : (unlockParent[node] ?? null)
    let unlock
    if (node === entryNode) {
      unlock = { entry: true, previous: prevRegionId }
    } else if (!parent) {
      unlock = {}
    } else {
      unlock =
        parent === entryNode
          ? { requires: [locId(regionId, entryNode)] }
          : { battlesAtLocation: [{ locationId: locId(regionId, parent), count: 15 }] }
    }
    // The badge that gates the road onward, placed where it is needed.
    if (gateGymByNode[node]) unlock.gymsRequired = [gateGymByNode[node]]
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
        unlockOrder: progressKey(node),
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
        unlockOrder: progressKey(node),
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
      // Town trainers follow the same 5-75 curve as the nearby routes.
      const townIndex = order.indexOf(node),
        townT = order.length <= 1 ? 0 : townIndex / (order.length - 1),
        townLevel = clampLevel(Math.round(LEVEL_MIN + townT * (WILD_LEVEL_MAX - LEVEL_MIN)))
      if (pool.length)
        trainerData[id] = [0, 1, 2].map((i) => ({
          id: `${id}_t${i + 1}`,
          name: `${name} Trainer ${i + 1}`,
          trainerClass: TRAINER_CLASSES[(gen * 3 + i) % TRAINER_CLASSES.length],
          team: makeTeam(pool, i * 2, 2, Math.min(townLevel + i, LEVEL_MAX - 1), 1),
        }))
    }
  }

  // raid island
  const lastRoute = routeNodes[routeNodes.length - 1]
  if (lastRoute) {
    const raidId = `${regionId}-raid`
    const raidNodeName = `${name} Raid Island`
    // Bucket + pool are created by the raid scan once all routes are known.
    pendingRaids.push({ regionObj, all, raidId, raidNodeName })
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
      unlockOrder: maxProgressKey + 1,
      position: placeAt(
        Math.min(94, (positions[lastRoute]?.x ?? 50) + 8),
        Math.max(6, (positions[lastRoute]?.y ?? 50) - 10)
      ),
    }
  }

  // Pokémon League: the Elite Four's zone. It hangs off the region's last
  // route so the league challenge is gated behind reaching (and battling in)
  // the region's final area instead of being startable from anywhere.
  const leagueNode = lastRoute ?? entryNode
  const leagueId = `${regionId}-league`
  mapData[leagueId] = {
    id: leagueId,
    name: `${name} Pokémon League`,
    type: 'town',
    region: regionId,
    description: `The ${name} Pokémon League.`,
    connections: [locId(regionId, leagueNode)],
    unlock: {
      battlesAtLocation: [{ locationId: locId(regionId, leagueNode), count: 20 }],
      // Every badge is required for the league, including any gym that got no
      // road gate (see gateGymByNode above).
      gymsRequired: gymPlacements.map((gym) => gym.id),
    },
    unlockOrder: maxProgressKey + 2,
    position: placeAt(
      Math.min(94, (positions[leagueNode]?.x ?? 50) + 10),
      Math.max(6, (positions[leagueNode]?.y ?? 50) - 4)
    ),
  }
  regionObj.leagueLocationKey = leagueId

  // league: gyms spread across towns, then Elite Four + Champion
  const roster = wild.length ? wild : all
  gymPlacements.forEach(({ id: gymId, leaderName, townNode, index }) => {
    gymData.push({
      id: gymId,
      name: leaderName,
      title: `${name} Gym Leader`,
      region: regionId,
      locationKey: locId(regionId, townNode),
      badgeName: `${name} Badge ${index + 1}`,
      badgeColor: BADGE_COLORS[index % BADGE_COLORS.length],
      spriteKey: LEADER_SPRITES[(gen + index) % LEADER_SPRITES.length],
      team: makeTeam(
        roster,
        index * 3,
        3,
        clampLevel(spread(index, gymPlacements.length, GYM_LEVEL_MIN, GYM_LEVEL_MAX)),
        1
      ),
    })
  })
  const eliteFour = ELITE_FOUR[regionId] ?? []
  eliteFour.forEach((memberName, i) => {
    e4Data.push({
      id: `${regionId}-e4-${i + 1}`,
      name: memberName,
      title: `${name} Elite Four`,
      region: regionId,
      spriteKey: 'acetrainer',
      team: makeTeam(roster, 24 + i * 4, 5, clampLevel(E4_LEVEL_MIN + i), 1),
    })
  })
  champData.push({
    id: `${regionId}-champion`,
    name: CHAMPIONS[regionId],
    title: `${name} Champion`,
    region: regionId,
    spriteKey: 'acetrainer',
    team: makeTeam(roster, 44, 6, clampLevel(CHAMPION_LEVEL), 1),
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
  levelRoutes(
    Object.values(mapData)
      .filter((loc) => (loc.region ?? 'kanto') === 'kanto' && loc.routeKey)
      .sort((a, b) => (a.unlockOrder ?? 0) - (b.unlockOrder ?? 0))
      .map((loc) => loc.routeKey),
    kantoEntries
  )
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

// --- raid pools --------------------------------------------------------------
// A species belongs on a Raid Island only if it turns up on no region's wild
// routes and can't be reached by evolving something that does. Scan every
// route once, then give each region its own generation's leftovers.
const routable = new Set()
for (const [bucketKey, bucket] of Object.entries(encounterData)) {
  if (/-raid$/.test(bucketKey)) continue
  for (const encounter of bucket.encounters) routable.add(encounter.speciesKey)
}
let routableExpanded = true
while (routableExpanded) {
  routableExpanded = false
  for (const key of [...routable])
    for (const evolution of evolutionData[key] || [])
      if (!routable.has(evolution.into))
        (routable.add(evolution.into), (routableExpanded = true))
}
// Raids are the region's endgame, so they sit at the top of the 5-75 curve.
const raidLevel = (entry) => clampLevel(entry.catchRate <= 3 ? LEVEL_MAX : LEVEL_MAX - 5)
for (const pending of pendingRaids) {
  const { regionObj, all: regionSpecies, raidId, raidNodeName } = pending
  regionObj.raidPool = regionSpecies
    .filter((entry) => !routable.has(entry.key))
    .map((entry) => ({ speciesKey: entry.key, level: raidLevel(entry) }))
  if (raidId)
    encounterData[raidId] = {
      name: raidNodeName,
      encounters: regionObj.raidPool.map((entry) => ({
        speciesKey: entry.speciesKey,
        weight: 1,
        minLevel: entry.level,
        maxLevel: entry.level,
      })),
    }
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
