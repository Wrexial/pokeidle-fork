#!/usr/bin/env node
/**
 * Add the Gen 9 DLC species PokeAPI has but the extracted bundle predates:
 * ids 1009-1025 (Walking Wake through Pecharunt). They were entirely absent
 * from pokemon-species.json, which blocked the Paldea DLC (Kitakami/Terarium).
 *
 * Adds to pokemon-species.json (stats/types/growth/catch), possible-learnsets
 * (level-up moves) and evolution-data (the Applin/Duraludon/Poltchageist
 * family edges). Abilities, breeding data and TM learnsets are filled in
 * afterwards by the existing fetch-abilities / fetch-breeding-data /
 * fetch-tm-learnsets tools, which read this file; sprites come from
 * download_pokemon_sprites.cjs.
 *
 * Item evolutions use a level gate because the DLC items (Syrupy Apple,
 * Metal Alloy, the teacups) are not modelled as game items.
 *
 * Idempotent: species already present are skipped. PokeAPI responses are cached
 * under tools/cache/ (gitignored), so re-running is offline.
 *
 * Usage: node tools/add-gen9-dlc-species.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const CACHE = path.join(__dirname, 'cache')
const SPECIES_PATH = path.join(DATA, 'pokemon-species.json')
const LEARNSETS_PATH = path.join(DATA, 'possible-learnsets.json')
const EVOLUTIONS_PATH = path.join(DATA, 'evolution-data.json')
const MOVES_PATH = path.join(DATA, 'possible-moves.json')

const IDS = Array.from({ length: 17 }, (_, index) => 1009 + index)

const species = JSON.parse(fs.readFileSync(SPECIES_PATH, 'utf8'))
const learnsets = JSON.parse(fs.readFileSync(LEARNSETS_PATH, 'utf8'))
const evolutions = JSON.parse(fs.readFileSync(EVOLUTIONS_PATH, 'utf8'))
const moveData = JSON.parse(fs.readFileSync(MOVES_PATH, 'utf8'))

const toCamel = (name) => name.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
const capitalize = (name) => name.charAt(0).toUpperCase() + name.slice(1)
const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
const knownMoves = new Set(Object.keys(moveData))
/** @type {Record<string, string>} */
const moveKeyByNormalized = {}
for (const [key, move] of Object.entries(moveData))
  moveKeyByNormalized[normalize(/** @type {any} */ (move).name)] = key

const GROWTH_RATES = {
  slow: 'slow',
  medium: 'mediumFast',
  fast: 'fast',
  'medium-slow': 'mediumSlow',
  'slow-then-very-fast': 'mediumSlow',
  'fast-then-very-slow': 'mediumFast',
}
const STAT_KEYS = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'spAttack',
  'special-defense': 'spDefense',
  speed: 'speed',
}
const PREFERRED_GROUPS = [
  'scarlet-violet',
  'sword-shield',
  'ultra-sun-ultra-moon',
  'omega-ruby-alpha-sapphire',
  'black-2-white-2',
  'black-white',
  'heartgold-soulsilver',
  'platinum',
  'diamond-pearl',
  'emerald',
  'firered-leafgreen',
  'ruby-sapphire',
  'crystal',
  'gold-silver',
  'yellow',
  'red-blue',
]
// Level gates for evolutions whose canonical item isn't a game item.
const NEW_EVOLUTIONS = {
  applin: [{ into: 'dipplin', level: 40 }],
  dipplin: [{ into: 'hydrapple', level: 55 }],
  duraludon: [{ into: 'archaludon', level: 60 }],
  poltchageist: [{ into: 'sinistcha', level: 40 }],
}

/** @param {string} url @param {string} file */
async function cached(url, file) {
  const cachePath = path.join(CACHE, file)
  if (fs.existsSync(cachePath)) return JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  const response = await fetch(url, { headers: { 'User-Agent': 'pokemon-idle-data' } })
  if (!response.ok) throw new Error(`${response.status} for ${url}`)
  const json = await response.json()
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(json))
  return json
}

/** @param {any} pokemon */
function levelUpMoves(pokemon) {
  for (const group of PREFERRED_GROUPS) {
    /** @type {Map<string, number>} */
    const byMove = new Map()
    for (const entry of pokemon.moves ?? []) {
      for (const detail of entry.version_group_details ?? []) {
        if (detail.move_learn_method?.name !== 'level-up' || detail.version_group?.name !== group)
          continue
        const key = moveKeyByNormalized[normalize(entry.move.name)] ?? toCamel(entry.move.name)
        if (!knownMoves.has(key)) continue
        const level = detail.level_learned_at ?? 1
        const previous = byMove.get(key)
        if (previous === undefined || level < previous) byMove.set(key, level)
      }
    }
    if (byMove.size > 0)
      return [...byMove.entries()]
        .map(([key, level]) => [level, key])
        .sort((left, right) => left[0] - right[0] || left[1].localeCompare(right[1]))
  }
  return []
}

async function main() {
  let added = 0
  for (const id of IDS) {
    const pokemon = await cached(
      `https://pokeapi.co/api/v2/pokemon/${id}/`,
      `pokeapi-pokemon-${id}.json`
    )
    const info = await cached(
      `https://pokeapi.co/api/v2/pokemon-species/${id}/`,
      `pokeapi-species-${id}.json`
    )
    const key = toCamel(info.name)
    if (species[key]) continue
    const baseStats = {}
    for (const stat of pokemon.stats) {
      const statKey = STAT_KEYS[stat.stat.name]
      if (statKey) baseStats[statKey] = stat.base_stat
    }
    species[key] = {
      id,
      name: info.name.split('-').map(capitalize).join(' '),
      types: pokemon.types
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => capitalize(entry.type.name)),
      baseStats,
      baseExpYield: pokemon.base_experience ?? 100,
      growthRate: GROWTH_RATES[info.growth_rate?.name] ?? 'mediumFast',
      catchRate: info.capture_rate ?? 45,
      ...(info.is_legendary || info.is_mythical ? { legendary: true } : {}),
    }
    const moves = levelUpMoves(pokemon)
    if (moves.length) learnsets[key] = moves
    added++
  }
  for (const [from, edges] of Object.entries(NEW_EVOLUTIONS)) {
    const list = evolutions[from] ?? (evolutions[from] = [])
    for (const edge of edges) if (!list.some((entry) => entry.into === edge.into)) list.push(edge)
  }
  fs.writeFileSync(SPECIES_PATH, JSON.stringify(species, null, 2) + '\n')
  fs.writeFileSync(LEARNSETS_PATH, JSON.stringify(learnsets, null, 2) + '\n')
  fs.writeFileSync(EVOLUTIONS_PATH, JSON.stringify(evolutions, null, 2) + '\n')
  console.log(`added ${added} species (of ${IDS.length})`)
  console.log('next: fetch-abilities, fetch-breeding-data, fetch-tm-learnsets, download_pokemon_sprites')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
