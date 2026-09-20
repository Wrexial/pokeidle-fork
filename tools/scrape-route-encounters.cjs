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
  kanto: ['firered', 'leafgreen', 'red', 'blue', 'yellow'],
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

// Paldea is not in PokéAPI's encounter data, so its province areas are parsed
// from Bulbapedia's {{Catch/entry9}} tables instead.
const PROVINCE = /^paldea-(north|south|east|west)-province-area-(one|two|three|four|five|six)$/
const PROVINCE_NUM = { one: 'One', two: 'Two', three: 'Three', four: 'Four', five: 'Five', six: 'Six' }
const provincePageTitle = (slug) => {
  const m = slug.match(PROVINCE)
  return m ? `${m[1][0].toUpperCase()}${m[1].slice(1)} Province (Area ${PROVINCE_NUM[m[2]]})` : null
}

async function fetchBulbaRaw(title) {
  const file = 'bp-' + title.replace(/[^A-Za-z0-9]+/g, '_') + '.txt'
  const p = path.join(CACHE, file)
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8')
  const res = await fetch(
    `https://bulbapedia.bulbagarden.net/w/index.php?title=${encodeURIComponent(title)}&action=raw`,
    { headers: { 'User-Agent': UA } }
  )
  const text = await res.text()
  fs.writeFileSync(p, text)
  await sleep(300)
  return text
}

/** Parse {{Catch/entry9|...}} templates from a Bulbapedia area page. */
async function paldeaAreaEncounters(slug) {
  const title = provincePageTitle(slug)
  if (!title) return null
  let raw
  try {
    raw = await fetchBulbaRaw(title)
  } catch {
    return null
  }
  /** @type {Map<string, {chance:number,min:number,max:number}>} */
  const found = new Map()
  for (const m of raw.matchAll(/\{\{Catch\/entry9\|([^\n}]*)\}\}/g)) {
    const parts = m[1].split('|')
    const name = parts[1]
    const key = keyByNorm[norm(name)]
    if (!key) continue
    const kv = {}
    const positional = []
    for (const token of parts.slice(2)) {
      const eq = token.match(/^([a-z0-9]+)=(.*)$/i)
      if (eq) kv[eq[1]] = eq[2]
      else positional.push(token)
    }
    const nums = positional.filter((x) => /^\d+(-\d+)?$/.test(x))
    if (!nums.length) continue
    const levelToken = nums[0]
    const [minL, maxL] = levelToken.split('-').map(Number)
    const chance = Number(kv.all ?? nums[1] ?? 0)
    const min = Math.max(2, Math.min(100, minL))
    const max = Math.max(min, Math.min(100, maxL || minL))
    const existing = found.get(key)
    if (existing) {
      existing.chance = Math.max(existing.chance, chance)
      existing.min = Math.min(existing.min, min)
      existing.max = Math.max(existing.max, max)
    } else {
      found.set(key, { chance, min, max })
    }
  }
  if (found.size === 0) return null
  return [...found.entries()]
    .map(([speciesKey, d]) => ({
      speciesKey,
      weight: Math.max(1, Math.round(d.chance / 2)),
      minLevel: d.min,
      maxLevel: d.max,
    }))
    .sort((a, b) => b.weight - a.weight)
}
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

  const areas = []
  for (const areaRef of location.areas) {
    try {
      areas.push(
        await cacheGet(
          `https://pokeapi.co/api/v2/location-area/${areaRef.name}/`,
          `pokeapi-area-${areaRef.name}.json`
        )
      )
    } catch {
      /* ignore */
    }
  }
  const preferred = PREFERRED[regionId] ?? []
  // Only species that appear in this region's preferred game versions are kept,
  // so we don't pull in cross-generation oddities (e.g. Let's Go rares).
  const collect = (allowFallback) => {
    /** @type {Map<string, {chance:number,min:number,max:number}>} */
    const found = new Map()
    for (const area of areas) {
      for (const enc of area.pokemon_encounters) {
        const key = keyByNorm[norm(enc.pokemon.name)]
        if (!key) continue
        let detail = null
        for (const version of preferred) {
          detail = enc.version_details.find((d) => d.version.name === version)
          if (detail) break
        }
        if (!detail && allowFallback) detail = enc.version_details[0]
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
    return found
  }
  let found = collect(false)
  if (found.size === 0) found = collect(true)
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
    const routes = map.nodes.filter((n) => isRouteNode(n) || PROVINCE.test(n))
    let hit = 0
    for (const slug of routes) {
      const enc =
        regionId === 'paldea' ? await paldeaAreaEncounters(slug) : await routeEncounters(regionId, slug)
      if (enc) {
        out[regionId][slug] = enc
        hit++
      }
    }
    console.log(`${regionId.padEnd(7)} routes ${String(routes.length).padStart(3)} | with real encounters ${hit}`)
  }

  // Kanto locations come from the game's own map-data (already accurate), so map
  // each route/landmark id to its PokéAPI slug and refresh those buckets too.
  if (!ONLY || ONLY === 'kanto') {
    const mapData = JSON.parse(fs.readFileSync(path.join(DATA, 'map-data.json'), 'utf8'))
    const kanto = await cacheGet('https://pokeapi.co/api/v2/region/1/', 'pokeapi-region-kanto.json')
    const slugs = kanto.locations.map((l) => l.name)
    const stripped = (s) => norm(s.replace(/^kanto-/, ''))
    const findSlug = (name) => {
      const n = norm(name)
      for (const s of slugs) if (stripped(s) === n) return s
      for (const s of slugs) if (stripped(s).startsWith(n)) return s
      return null
    }
    out.kanto = {}
    let hit = 0
    for (const loc of Object.values(mapData)) {
      if ((loc.region ?? 'kanto') !== 'kanto' || !loc.routeKey) continue
      const num = /route/i.test(loc.name) ? loc.name.match(/\d+/)?.[0] : null
      const slug = num
        ? ['19', '20', '21'].includes(num)
          ? `kanto-sea-route-${num}`
          : `kanto-route-${num}`
        : findSlug(loc.name)
      if (!slug) continue
      const enc = await routeEncounters('kanto', slug)
      if (enc) {
        out.kanto[loc.routeKey] = enc
        hit++
      }
    }
    console.log(`kanto   buckets ${Object.values(mapData).filter((l) => (l.region ?? 'kanto') === 'kanto' && l.routeKey).length} | with real encounters ${hit}`)
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 1))
  console.log('wrote', path.relative(path.join(__dirname, '..'), OUT))
})().catch((e) => {
  console.error('ERR', e.stack || e.message)
  process.exit(1)
})
