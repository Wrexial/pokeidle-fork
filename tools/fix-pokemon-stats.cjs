#!/usr/bin/env node
/**
 * Reconcile pokemon-species.json base stats and types with the modern games.
 *
 * The extracted data predates the mid-generation stat buffs (Gen 6/7) and the
 * Gen 9 nerfs, so several species carried old numbers (Arbok 85 Atk, Shedinja
 * 70 HP, Lycanroc's Midday/Midnight forms swapped, ...). This rewrites every
 * `baseStats` block and fixes type sets.
 *
 * Sources:
 *  - Base species (id <= 1025): Pokemon Showdown's pokedex (current Gen 9).
 *  - Alternate forms (id > 1025): PokeAPI `/pokemon/<id>` (cached under
 *    tools/cache/, gitignored — fetched on first run).
 *
 * Idempotent: safe to re-run after re-extracting species data.
 *
 * Usage: node tools/fix-pokemon-stats.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')
const https = require('https')

const DATA = path.join(__dirname, '../public/data')
const CACHE = path.join(__dirname, 'cache')
const SPECIES_PATH = path.join(DATA, 'pokemon-species.json')
const SHOWDOWN_PATH = path.join(CACHE, 'showdown-pokedex.json')

const DRY = process.argv.includes('--dry')

const GAME_STATS = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed']
const SHOWDOWN_STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
const POKEAPI_STATS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

// Names that don't reduce to a Showdown key (game-specific labels).
const SHOWDOWN_KEY_OVERRIDES = {
  'urshifu-sss': 'urshifu',
  basculegion: 'basculegion',
  oinkologne: 'oinkologne',
  palafin: 'palafin',
}

const get = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'pokemon-idle-stats-fixer' } }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location)
          return resolve(get(new URL(response.headers.location, url).toString()))
        if (response.statusCode !== 200) {
          response.resume()
          return reject(new Error(`Status ${response.statusCode} for ${url}`))
        }
        let body = ''
        response.on('data', (chunk) => (body += chunk))
        response.on('end', () => resolve(body))
      })
      .on('error', reject)
  })

const capitalizeType = (name) =>
  name.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

const showdownKey = (key, species) =>
  SHOWDOWN_KEY_OVERRIDES[key] ?? species.name.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Loads the Showdown dex, fetching + caching it the first time. */
async function loadShowdown() {
  if (fs.existsSync(SHOWDOWN_PATH) && fs.statSync(SHOWDOWN_PATH).size > 0)
    return JSON.parse(fs.readFileSync(SHOWDOWN_PATH, 'utf8'))
  console.log('Fetching Pokemon Showdown pokedex...')
  const body = await get('https://play.pokemonshowdown.com/data/pokedex.json')
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(SHOWDOWN_PATH, body)
  return JSON.parse(body)
}

/** Loads PokeAPI `/pokemon/<id>` from cache, fetching it if needed. */
async function loadPokeapi(id) {
  const file = path.join(CACHE, `pokeapi-pokemon-${id}.json`)
  if (fs.existsSync(file) && fs.statSync(file).size > 0)
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  const entry = JSON.parse(await get(`https://pokeapi.co/api/v2/pokemon/${id}`))
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(file, JSON.stringify(entry))
  return entry
}

/** Authoritative stats/types for a species, or null if no source matched. */
async function expectedFor(key, species, showdown) {
  if (species.id > 1025) {
    const entry = await loadPokeapi(species.id)
    return {
      stats: Object.fromEntries(entry.stats.map((stat) => [stat.stat.name, stat.base_stat])),
      statKeys: POKEAPI_STATS,
      types: entry.types.map((type) => capitalizeType(type.type.name)),
    }
  }
  const entry = showdown[showdownKey(key, species)]
  if (!entry) return null
  return { stats: entry.baseStats, statKeys: SHOWDOWN_STATS, types: entry.types }
}

/** Keep the existing type order when the set is unchanged, else adopt the API order. */
const sameTypeSet = (existing, next) =>
  existing.length === next.length && [...existing].sort().join() === [...next].sort().join()

async function main() {
  const species = JSON.parse(fs.readFileSync(SPECIES_PATH, 'utf8'))
  const newline = fs.readFileSync(SPECIES_PATH, 'utf8').includes('\r\n') ? '\r\n' : '\n'
  const showdown = await loadShowdown()

  const statChanges = []
  const typeChanges = []
  const unmatched = []

  for (const [key, entry] of Object.entries(species)) {
    if (!entry.id || entry.id <= 0) continue
    const expected = await expectedFor(key, entry, showdown)
    if (!expected) {
      unmatched.push(key)
      continue
    }
    for (const statKey of GAME_STATS) {
      const next = expected.stats[expected.statKeys[GAME_STATS.indexOf(statKey)]]
      if (typeof next === 'number' && entry.baseStats[statKey] !== next) {
        statChanges.push(`${key}.${statKey}: ${entry.baseStats[statKey]} -> ${next}`)
        entry.baseStats[statKey] = next
      }
    }
    if (expected.types?.length && !sameTypeSet(entry.types ?? [], expected.types)) {
      typeChanges.push(`${key}: ${(entry.types ?? []).join(',')} -> ${expected.types.join(',')}`)
      entry.types = expected.types
    }
  }

  console.log(`stat fixes: ${statChanges.length}`)
  statChanges.forEach((change) => console.log('  ' + change))
  console.log(`type fixes: ${typeChanges.length}`)
  typeChanges.forEach((change) => console.log('  ' + change))
  if (unmatched.length) console.log(`unmatched (left untouched): ${unmatched.join(', ')}`)

  if (DRY) {
    console.log('--dry: not writing pokemon-species.json')
    return
  }
  if (statChanges.length || typeChanges.length) {
    const json = JSON.stringify(species, null, 2).split('\n').join(newline) + newline
    fs.writeFileSync(SPECIES_PATH, json)
    console.log(`Wrote ${path.relative(process.cwd(), SPECIES_PATH)}.`)
  } else {
    console.log('pokemon-species.json already matches; no changes.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
