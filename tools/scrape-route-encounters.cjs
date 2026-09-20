#!/usr/bin/env node
/**
 * Scrape real per-route wild encounters from PokéAPI and turn them into the
 * game's encounter format.
 *
 * For every generated region route (gens 2-9) it reads the route's PokéAPI
 * location-area(s), picks the region's preferred game version, and maps each
 * species to the game's species key (by normalised name).
 *
 * Caches HTTP responses under tools/cache/. Output: tools/route-encounters.json
 *
 * Usage: node tools/scrape-route-encounters.cjs [--region=johto]
 */
const fs = require('fs')
const path = require('path')

const CACHE = path.join(__dirname, 'cache')
const OUT = path.join(__dirname, 'route-encounters.json')
const MAPS = path.join(__dirname, 'region-maps.json')
const DATA = path.join(__dirname, '../public/data')
const UA = 'PokemonIdle-encounter-research/1.0'
const onlyArg = process.argv.find((a) => a.startsWith('--region='))
const ONLY = onlyArg ? onlyArg.split('=')[1] : null

// region -> preferred game versions (first match wins per species)
const PREFERRED = {
  johto: ['heartgold', 'soulsilver', 'gold', 'silver', 'crystal'],
  hoenn: ['omega-ruby', 'alpha-sapphire', 'emerald', 'ruby', 'sapphire'],
  sinnoh: ['platinum', 'diamond', 'pearl'],
  unova: ['black-2', 'white-2', 'black', 'white'],
  kalos: ['x', 'y'],
  alola: ['ultra-sun', 'ultra-moon', 'sun', 'moon'],
  galar: ['sword', 'shield'],
  paldea: ['scarlet', 'violet'],
}

fs.mkdirSync(CACHE, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function cacheGet(url, file) {
  const p = path.join(CACHE, file)
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const json = await res.json()
  fs.writeFileSync(p, JSON.stringify(json))
  await sleep(300)
  return json
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
const species = JSON.parse(fs.readFileSync(path.join(DATA, 'pokemon-species.json'), 'utf8'))
const keyByNorm = {}
for (const key of Object.keys(species)) keyByNorm[norm(key)] = key
// also index by display name (e.g. "Type: Null", "Sirfetch'd")
for (const [key, s] of Object.entries(species)) if (s.name) keyByNorm[norm(s.name)] = key

const isRouteNode = (node) => /route/.test(node) || node.startsWith('auto-')
// gift/static interactions are not wild encounters
const isWildMethod = (name) => !/gift|only-one|interact|ranger|roaming|wailmer|devon-scope/i.test(name)

async function routeEncounters(regionId, routeSlug) {
  let location
  try {
    location = await cacheGet(
      `https://pokeapi.co/api/v2/location/${routeSlug}/`,
      `pokeapi-loc-${routeSlug}.json`
    )
  } catch {
    return null
  }
  if (!location.areas || location.areas.length === 0) return null

  /** @type {Map<string, {chance:number,min:number,max:number}>} */
  const found = new Map()
  for (const areaRef of location.areas) {
    let area
    try {
      area = await cacheGet(
        `https://pokeapi.co/api/v2/location-area/${areaRef.name}/`,
        `pokeapi-area-${areaRef.name}.json`
      )
    } catch {
      continue
    }
    for (const enc of area.pokemon_encounters) {
      const key = keyByNorm[norm(enc.pokemon.name)]
      if (!key) continue
      // pick the best preferred version available for this species
      let detail = null
      for (const version of PREFERRED[regionId] ?? []) {
        detail = enc.version_details.find((d) => d.version.name === version)
        if (detail) break
      }
      if (!detail) detail = enc.version_details[0]
      if (!detail || !detail.encounter_details?.length) continue
      const wild = detail.encounter_details.filter((d) => isWildMethod(d.method.name))
      if (!wild.length) continue
      const levels = wild.map((d) => [d.min_level, d.max_level])
      const min = Math.min(...levels.map((l) => l[0]))
      const max = Math.max(...levels.map((l) => l[1]))
      const chance = wild.reduce((a, d) => a + d.chance, 0) || detail.max_chance
      const existing = found.get(key)
      if (existing) {
        existing.chance = Math.max(existing.chance, chance)
        existing.min = Math.min(existing.min, min)
        existing.max = Math.max(existing.max, max)
      } else {
        found.set(key, { chance, min, max })
      }
    }
  }
  if (found.size === 0) return null
  return [...found.entries()]
    .map(([speciesKey, d]) => ({
      speciesKey,
      weight: Math.max(1, Math.round(d.chance / 4)),
      minLevel: Math.max(2, Math.min(100, d.min)),
      maxLevel: Math.max(2, Math.min(100, d.max)),
    }))
    .sort((a, b) => b.weight - a.weight)
}

;(async () => {
  const maps = JSON.parse(fs.readFileSync(MAPS, 'utf8'))
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
  for (const [regionId, map] of Object.entries(maps)) {
    if (ONLY && regionId !== ONLY) continue
    out[regionId] = {}
    const routes = map.nodes.filter(isRouteNode)
    let hit = 0
    for (const slug of routes) {
      const enc = await routeEncounters(regionId, slug)
      if (enc) {
        out[regionId][slug] = enc
        hit++
      }
    }
    console.log(`${regionId.padEnd(7)} routes ${String(routes.length).padStart(3)} | with real encounters ${hit}`)
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1))
  console.log('wrote', path.relative(path.join(__dirname, '..'), OUT))
})().catch((e) => {
  console.error('ERR', e.stack || e.message)
  process.exit(1)
})
