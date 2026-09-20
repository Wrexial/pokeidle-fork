#!/usr/bin/env node
/**
 * Scrape real region maps: locations from PokéAPI, and route/town connections
 * from Bulbapedia's raw wikitext infoboxes (north/south/east/west).
 *
 * Caches every HTTP response under tools/cache/ so re-runs are cheap.
 *
 * Usage:
 *   node tools/scrape-region-maps.cjs                 # all regions
 *   node tools/scrape-region-maps.cjs --region=johto  # one region
 */
const fs = require('fs')
const path = require('path')

const CACHE = path.join(__dirname, 'cache')
const OUT = path.join(__dirname, 'region-maps.json')
const UA = 'PokemonIdle-map-research/1.0'
const REGION_IDS = {
  kanto: 1, johto: 2, hoenn: 3, sinnoh: 4, unova: 5,
  kalos: 6, alola: 7, galar: 8, paldea: 10,
}
const SLUG = Object.fromEntries(Object.entries(REGION_IDS).map(([n, i]) => [i, n]))
const onlyArg = process.argv.find((a) => a.startsWith('--region='))
const ONLY = onlyArg ? onlyArg.split('=')[1] : null

fs.mkdirSync(CACHE, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const cachedFetch = async (url, file) => {
  const p = path.join(CACHE, file)
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8')
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const text = await res.text()
  fs.writeFileSync(p, text)
  await sleep(350)
  return text
}

// --- location list -----------------------------------------------------------
async function regionLocations(regionId, regionName) {
  const text = await cachedFetch(
    `https://pokeapi.co/api/v2/region/${regionId}/`,
    `pokeapi-region-${regionName}.json`
  )
  const json = JSON.parse(text)
  return json.locations.map((l) => l.name)
}

// --- bulbapedia --------------------------------------------------------------
const titleCase = (slug) =>
  slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')

const isRoute = (slug) => /route/.test(slug)
const isTown = (slug) => /-(city|town)$/.test(slug)
// Paldea has no numbered routes; its wild areas are "<dir> Province (Area N)"
const PROVINCE = /^paldea-(north|south|east|west)-province-area-(one|two|three|four|five|six)$/
const PROVINCE_NUM = { one: 'One', two: 'Two', three: 'Three', four: 'Four', five: 'Five', six: 'Six' }
const provinceName = (slug) => {
  const m = slug.match(PROVINCE)
  if (!m) return null
  return `${m[1][0].toUpperCase()}${m[1].slice(1)} Province (Area ${PROVINCE_NUM[m[2]]})`
}
const isRouteSlug = (regionName, slug) => isRoute(slug) || (regionName === 'paldea' && PROVINCE.test(slug))
// regions whose PokéAPI slugs don't use the -city/-town convention
const EXTRA_TOWNS = {
  galar: ['postwick', 'wedgehurst', 'motostoke', 'turffield', 'hulbury', 'hammerlocke', 'ballonlea', 'circhester', 'spikemuth', 'stow-on-side', 'wyndon'],
  paldea: ['mesagoza', 'cortondo', 'artazon', 'levincia', 'cascarrafa', 'medali', 'montenevera', 'alfornada', 'porto-marinada', 'zapapico', 'los-platos', 'cabo-poco'],
}
// regions where unmatched connection names should become nodes
const ALLOW_UNKNOWN = new Set()

// Links Bulbapedia's infoboxes omit because the connecting area isn't named on
// either endpoint. Only used when the automatic scrape leaves a region's main
// path fragmented (verified against the region's real geography).
const MANUAL_BRIDGES = {
  galar: [
    ['galar-route-2', 'motostoke', 'north'], // Route 2 -> Wild Area -> Motostoke
    ['motostoke', 'galar-route-6', 'east'], // Motostoke -> Route 6 -> Hammerlocke
    ['hammerlocke', 'galar-route-10', 'north'], // Hammerlocke -> Wild Area -> Wyndon
  ],
}
const shortRouteName = (slug) => {
  const m = slug.match(/route-(\d+)(?:-+([a-z0-9-]+))?$/)
  if (!m) return titleCase(slug)
  return `Route ${m[1]}${m[2] ? ` (${titleCase(m[2])})` : ''}`
}

/** Resolve a PokéAPI location slug to its Bulbapedia article title. */
function pageTitle(regionName, slug) {
  if (isRoute(slug)) {
    const num = slug.match(/(\d+)/)
    return `${titleCase(regionName)} Route ${num ? num[1] : ''}`.trim()
  }
  return titleCase(slug)
}

async function fetchRaw(title) {
  const file = 'bp-' + title.replace(/[^A-Za-z0-9]+/g, '_') + '.txt'
  let text = await cachedFetch(
    `https://bulbapedia.bulbagarden.net/w/index.php?title=${encodeURIComponent(title)}&action=raw`,
    file
  )
  const redir = text.match(/^#REDIRECT\s*\[\[([^\]]+)\]\]/i)
  if (redir) text = await fetchRaw(redir[1].trim())
  return text
}

/** Extract the first infobox's compass params. */
function parseCompass(raw) {
  const box = raw.match(/\{\{(Route|Town|Infobox)[^}]*?\n([\s\S]*?)\n\}\}/i)
  const scope = box ? box[2] : raw.slice(0, 4000)
  const out = {}
  for (const dir of ['north', 'south', 'east', 'west']) {
    const m = scope.match(new RegExp(`\\|\\s*${dir}\\s*=\\s*([^\\n|]+)`, 'i'))
    if (m) out[dir] = m[1].trim()
  }
  return out
}

/** Normalise a wikitext connection value to plain text. */
function cleanValue(v) {
  return v
    .replace(/\{\{rt\|\s*(\d+)\s*\|\s*([^}]*)\}\}/gi, (_, n) => `Route ${n}`)
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/'''?/g, '')
    .split(/<br\s*\/?>|,| and /i)[0]
    .trim()
}

// --- build graph -------------------------------------------------------------
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

async function regionGraph(regionName) {
  const regionId = REGION_IDS[regionName]
  const slugs = await regionLocations(regionId, regionName)
  const extra = EXTRA_TOWNS[regionName] ?? []
  const nodes = slugs.filter((s) => isRouteSlug(regionName, s) || isTown(s) || extra.includes(s))
  // some regions (e.g. Paldea) aren't in PokéAPI's location list at all
  for (const town of extra) if (!nodes.includes(town)) nodes.push(town)

  const display = {}
  for (const slug of nodes) {
    if (isTown(slug) || extra.includes(slug)) display[slug] = titleCase(slug)
    else if (provinceName(slug)) display[slug] = provinceName(slug)
    else display[slug] = shortRouteName(slug)
  }
  // lookup by short name, slug, title-cased slug, and the region-prefixed page title
  const lookup = {}
  for (const slug of nodes) {
    lookup[norm(display[slug])] = slug
    lookup[norm(slug)] = slug
    lookup[norm(titleCase(slug))] = slug
    if (isRouteSlug(regionName, slug)) lookup[norm(pageTitle(regionName, slug))] = slug
  }

  const edges = []
  // Compass targets that are real places but not in the node set (forests,
  // lakes, gates, ...). Routes meeting at one of these are linked by a
  // synthetic hub in addConnectorHubs so the graph doesn't fragment.
  const unresolved = []
  let parsed = 0
  for (const slug of nodes) {
    const title = provinceName(slug) || pageTitle(regionName, slug)
    const raw = await fetchRaw(title)
    const compass = parseCompass(raw)
    let any = false
    for (const [dir, value] of Object.entries(compass)) {
      const cleaned = cleanValue(value)
      const genericRoute = /^route \d+$/i.test(cleaned)
      let target = lookup[norm(cleaned)]
      if (!target && ALLOW_UNKNOWN.has(regionName) && cleaned && !genericRoute) {
        target = 'auto-' + norm(cleaned)
        if (!display[target]) {
          display[target] = cleaned
          nodes.push(target)
          lookup[norm(cleaned)] = target
        }
      }
      if (target && target !== slug) {
        edges.push({ from: slug, to: target, dir })
        any = true
      } else if (!target && cleaned && !genericRoute) {
        unresolved.push({ from: slug, dir, name: cleaned })
      }
    }
    if (any) parsed++
  }
  // Fill in the handful of links Bulbapedia doesn't record (see MANUAL_BRIDGES).
  for (const [from, to, dir] of MANUAL_BRIDGES[regionName] ?? [])
    if (nodes.includes(from) && nodes.includes(to)) edges.push({ from, to, dir })
  // Intermediate areas (forests, gates, bridges, ...) have no compass infobox,
  // but their intro text names the locations they sit between. Use those links
  // to reconnect the components that meet at one of them.
  const connectorNodes = {}
  for (const name of new Set(unresolved.map((ref) => ref.name))) {
    const raw = await fetchRaw(titleCase(name))
    const lead = raw.split(/\n==/)[0]
    const found = new Set()
    for (const match of lead.matchAll(/\{\{rt\|\s*(\d+)\s*\|[^}]*\}\}/gi)) {
      const route = lookup[norm(`Route ${match[1]}`)]
      if (route) found.add(route)
    }
    for (const match of lead.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g)) {
      const slug = lookup[norm(match[1])]
      if (slug) found.add(slug)
    }
    if (found.size) connectorNodes[norm(name)] = [...found]
  }
  return { regionName, nodes, display, edges, unresolved, connectorNodes, parsed }
}

// --- layout ------------------------------------------------------------------
const OFFSET = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }

function layout(nodes, edges, iterations = 900) {
  const pos = {}
  nodes.forEach((n, i) => (pos[n] = { x: (i % 10) * 12, y: Math.floor(i / 10) * 12 }))
  const L = 12 // preferred edge length
  const R = 7 // repulsion radius (< L so neighbours don't fight their spring)
  for (let it = 0; it < iterations; it++) {
    const acc = {}
    const cnt = {}
    for (const n of nodes) ((acc[n] = { x: 0, y: 0 }), (cnt[n] = 0))
    // weak centering
    for (const n of nodes) {
      acc[n].x += pos[n].x * 0.02
      acc[n].y += pos[n].y * 0.02
      cnt[n] += 0.02
    }
    // directional springs
    for (const e of edges) {
      const [dx, dy] = OFFSET[e.dir] || [0, 0]
      acc[e.to].x += pos[e.from].x + dx * L
      acc[e.to].y += pos[e.from].y + dy * L
      cnt[e.to] += 1
      acc[e.from].x += pos[e.to].x - dx * L
      acc[e.from].y += pos[e.to].y - dy * L
      cnt[e.from] += 1
    }
    const next = {}
    for (const n of nodes)
      next[n] = cnt[n] ? { x: acc[n].x / cnt[n], y: acc[n].y / cnt[n] } : pos[n]
    // gentle repulsion for close pairs only
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = next[nodes[i]]
        const b = next[nodes[j]]
        let ddx = b.x - a.x
        let ddy = b.y - a.y
        let d = Math.hypot(ddx, ddy)
        if (d >= R) continue
        if (d < 0.01) ((ddx = 1), (ddy = 0), (d = 1))
        const push = (R - d) * 0.4
        const ux = ddx / d
        const uy = ddy / d
        ;(a.x -= ux * push), (a.y -= uy * push)
        ;(b.x += ux * push), (b.y += uy * push)
      }
    for (const n of nodes) pos[n] = next[n]
  }
  // uniform normalisation (keeps the aspect ratio, so directions are preserved)
  const xs = nodes.map((n) => pos[n].x), ys = nodes.map((n) => pos[n].y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const w = maxX - minX || 1, h = maxY - minY || 1
  const scale = 88 / Math.max(w, h)
  for (const n of nodes)
    pos[n] = {
      x: 6 + (pos[n].x - minX) * scale + (88 - w * scale) / 2,
      y: 6 + (pos[n].y - minY) * scale + (88 - h * scale) / 2,
    }
  // one more gentle canvas-space separation pass, then clamp + round
  const TARGET = 6
  for (let pass = 0; pass < 300; pass++) {
    let moved = false
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = pos[nodes[i]]
        const b = pos[nodes[j]]
        let ddx = b.x - a.x
        let ddy = b.y - a.y
        let d = Math.hypot(ddx, ddy)
        if (d >= TARGET) continue
        if (d < 0.01) ((ddx = 1), (ddy = 0), (d = 1))
        const push = (TARGET - d) * 0.3
        const ux = ddx / d
        const uy = ddy / d
        ;(a.x -= ux * push), (a.y -= uy * push)
        ;(b.x += ux * push), (b.y += uy * push)
        moved = true
      }
    for (const n of nodes) {
      pos[n].x = Math.max(4, Math.min(96, pos[n].x))
      pos[n].y = Math.max(4, Math.min(96, pos[n].y))
    }
    if (!moved) break
  }
  const taken = new Set()
  for (const n of nodes) {
    let x = Math.round(pos[n].x)
    let y = Math.round(pos[n].y)
    let guard = 0
    while (taken.has(x + ',' + y) && guard++ < 40) {
      x = x + 3 > 96 ? 4 : x + 3
      y = y + 2 > 96 ? 4 : y + 2
    }
    taken.add(x + ',' + y)
    pos[n] = { x, y }
  }
  return pos
}

// --- connector bridging ------------------------------------------------------
// Routes in different games meet at map areas that aren't separate locations
// ("Santalune Forest", "Acuity Lakefront", "Mount Coronet", gates, ...).
// Bulbapedia records those as the route's compass neighbour, so the nodes that
// reference one end up disconnected. Add a synthetic hub for each shared
// connector, lay out with it, then contract it back out by chaining its
// neighbours. Positions stay correct because the hub anchored them.

/** @param {ReturnType<typeof regionGraph>} graph */
function addConnectorHubs(graph) {
  const groups = new Map()
  for (const ref of graph.unresolved) {
    const key = norm(ref.name)
    if (!groups.has(key)) groups.set(key, { name: ref.name, refs: [] })
    groups.get(key).refs.push(ref)
  }
  const nodes = [...graph.nodes]
  const edges = [...graph.edges]
  const display = { ...graph.display }
  const hubs = []
  for (const [key, group] of groups) {
    const refNodes = new Set(group.refs.map((ref) => ref.from))
    const linked = graph.connectorNodes[key] ?? []
    const neighbours = [...new Set([...refNodes, ...linked])]
    if (neighbours.length < 2) continue // a dead-end connector joins nothing
    const hub = `hub-${key}`
    if (nodes.includes(hub)) continue
    nodes.push(hub)
    display[hub] = group.name
    for (const ref of group.refs) edges.push({ from: ref.from, to: hub, dir: ref.dir })
    // The intro text gives adjacency but no compass direction, so these edges
    // only pull the hub and its neighbours together.
    for (const node of linked) if (!refNodes.has(node)) edges.push({ from: hub, to: node, dir: 'via' })
    hubs.push({ id: hub, neighbours })
  }
  return { nodes, edges, display, hubs }
}

/** Remove the synthetic hubs, chaining their neighbours so they stay linked. */
function contractHubs(nodes, edges, display, positions, hubs) {
  const hubIds = new Set(hubs.map((hub) => hub.id))
  const keptEdges = edges.filter((edge) => !hubIds.has(edge.from) && !hubIds.has(edge.to))
  for (const hub of hubs) {
    const centre = positions[hub.id]
    // Walk the neighbours in angular order so the chain follows the ring the
    // layout put them on instead of criss-crossing.
    const ordered = [...hub.neighbours].sort(
      (a, b) =>
        Math.atan2(positions[a].y - centre.y, positions[a].x - centre.x) -
        Math.atan2(positions[b].y - centre.y, positions[b].x - centre.x)
    )
    for (let i = 1; i < ordered.length; i++)
      keptEdges.push({ from: ordered[i - 1], to: ordered[i], dir: 'via' })
  }
  const keptNodes = nodes.filter((node) => !hubIds.has(node))
  const keptDisplay = { ...display }
  for (const id of hubIds) delete keptDisplay[id]
  const keptPositions = {}
  for (const node of keptNodes) keptPositions[node] = positions[node]
  return { nodes: keptNodes, edges: keptEdges, display: keptDisplay, positions: keptPositions }
}

// --- main --------------------------------------------------------------------
async function main() {
  const regions = ONLY ? [ONLY] : Object.keys(REGION_IDS).slice(1)
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
  for (const regionName of regions) {
    const graph = await regionGraph(regionName)
    const augmented = addConnectorHubs(graph)
    const positions = layout(augmented.nodes, augmented.edges)
    const contracted = contractHubs(
      augmented.nodes,
      augmented.edges,
      augmented.display,
      positions,
      augmented.hubs
    )
    graph.nodes = contracted.nodes
    graph.edges = contracted.edges
    graph.display = contracted.display
    graph.positions = contracted.positions
    delete graph.unresolved
    delete graph.connectorNodes
    out[regionName] = graph
    console.log(
      `${regionName.padEnd(7)} nodes ${String(graph.nodes.length).padStart(3)} | edges ${String(graph.edges.length).padStart(3)} | bridged ${String(augmented.hubs.length).padStart(2)} connectors | with-connections ${graph.parsed}`
    )
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1))
  console.log('wrote', path.relative(path.join(__dirname, '..'), OUT))
}

if (require.main === module) {
  main().catch((e) => {
    console.error('ERR', e.stack || e.message)
    process.exit(1)
  })
}

module.exports = { regionGraph, layout, addConnectorHubs, contractHubs }
