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
  let parsed = 0
  for (const slug of nodes) {
    const title = provinceName(slug) || pageTitle(regionName, slug)
    const raw = await fetchRaw(title)
    const compass = parseCompass(raw)
    let any = false
    for (const [dir, value] of Object.entries(compass)) {
      const cleaned = cleanValue(value)
      let target = lookup[norm(cleaned)]
      if (!target && ALLOW_UNKNOWN.has(regionName) && cleaned && !/^route \d+$/i.test(cleaned)) {
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
      }
    }
    if (any) parsed++
  }
  return { regionName, nodes, display, edges, parsed }
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

// --- main --------------------------------------------------------------------
;(async () => {
  const regions = ONLY ? [ONLY] : Object.keys(REGION_IDS).slice(1)
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
  for (const regionName of regions) {
    const graph = await regionGraph(regionName)
    graph.positions = layout(graph.nodes, graph.edges)
    out[regionName] = graph
    console.log(
      `${regionName.padEnd(7)} nodes ${String(graph.nodes.length).padStart(3)} | edges ${String(graph.edges.length).padStart(3)} | with-connections ${graph.parsed}`
    )
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1))
  console.log('wrote', path.relative(path.join(__dirname, '..'), OUT))
})().catch((e) => {
  console.error('ERR', e.stack || e.message)
  process.exit(1)
})
