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
  kalos: 6, alola: 7, galar: 8, paldea: 9,
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
// regions whose PokéAPI slugs don't use the -city/-town convention
const EXTRA_TOWNS = {
  galar: ['postwick', 'wedgehurst', 'motostoke', 'turffield', 'hulbury', 'hammerlocke', 'ballonlea', 'circhester', 'spikemuth', 'stow-on-side', 'wyndon'],
  paldea: ['mesagoza', 'cortondo', 'artazon', 'levincia', 'cascarrafa', 'medali', 'montenevera', 'alfornada', 'porto-marinada', 'zapapico', 'los-platos'],
}
// regions where unmatched connection names should become nodes (e.g. Paldea provinces)
const ALLOW_UNKNOWN = new Set(['paldea'])
const shortRouteName = (slug) => {
  const num = slug.match(/(\d+)/)
  return `Route ${num ? num[1] : ''}`.trim()
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
  const nodes = slugs.filter((s) => isRoute(s) || isTown(s) || extra.includes(s))
  // some regions (e.g. Paldea) aren't in PokéAPI's location list at all
  for (const town of extra) if (!nodes.includes(town)) nodes.push(town)

  const display = {}
  for (const slug of nodes) display[slug] = isRoute(slug) ? shortRouteName(slug) : titleCase(slug)
  // lookup by short name, slug, title-cased slug, and the region-prefixed page title
  const lookup = {}
  for (const slug of nodes) {
    lookup[norm(display[slug])] = slug
    lookup[norm(slug)] = slug
    lookup[norm(titleCase(slug))] = slug
    if (isRoute(slug)) lookup[norm(pageTitle(regionName, slug))] = slug
  }

  const edges = []
  let parsed = 0
  for (const slug of nodes) {
    const raw = await fetchRaw(pageTitle(regionName, slug))
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

function layout(nodes, edges, iterations = 400) {
  const pos = {}
  nodes.forEach((n, i) => (pos[n] = { x: (i % 10) - 5, y: Math.floor(i / 10) - 5 }))
  for (let it = 0; it < iterations; it++) {
    const acc = {}
    const cnt = {}
    for (const n of nodes) acc[n] = { x: 0, y: 0 }, (cnt[n] = 0)
    // node positions pull toward constraints, plus a weak centering force
    for (const n of nodes) {
      acc[n].x += pos[n].x * 0.15
      acc[n].y += pos[n].y * 0.15
      cnt[n] += 0.15
    }
    for (const e of edges) {
      const [dx, dy] = OFFSET[e.dir] || [0, 0]
      // e.to should be e.from + offset  =>  from = to - offset
      acc[e.to].x += pos[e.from].x + dx
      acc[e.to].y += pos[e.from].y + dy
      cnt[e.to] += 1
      acc[e.from].x += pos[e.to].x - dx
      acc[e.from].y += pos[e.to].y - dy
      cnt[e.from] += 1
    }
    for (const n of nodes) {
      if (!cnt[n]) continue
      pos[n] = { x: acc[n].x / cnt[n], y: acc[n].y / cnt[n] }
    }
  }
  // normalise to 6..94
  const xs = nodes.map((n) => pos[n].x), ys = nodes.map((n) => pos[n].y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  for (const n of nodes) {
    pos[n] = {
      x: Math.round(6 + ((pos[n].x - minX) / (maxX - minX || 1)) * 88),
      y: Math.round(6 + ((pos[n].y - minY) / (maxY - minY || 1)) * 88),
    }
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
