#!/usr/bin/env node
/**
 * Build per-species egg moves from PokeAPI.
 *
 * The game can already pass a parent's family moves down to an egg, but true
 * egg moves (moves a species can only get by breeding) have no data. This reads
 * each species' cached `/pokemon/{id}` response and keeps the moves marked with
 * the `egg` learn method, writing the game keys to
 * public/data/egg-moves.json.
 *
 * The `/pokemon/{id}` responses are already cached by fetch-abilities.cjs, so
 * this normally needs no network. Re-run after adding species/form ids.
 *
 * Usage: node tools/fetch-egg-moves.cjs
 */
const fs = require('fs')
const path = require('path')

const CACHE = path.join(__dirname, 'cache')
const DATA = path.join(__dirname, '../public/data')
const species = JSON.parse(fs.readFileSync(path.join(DATA, 'pokemon-species.json'), 'utf8'))
const moveData = JSON.parse(fs.readFileSync(path.join(DATA, 'possible-moves.json'), 'utf8'))

const normalize = (/** @type {string} */ name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
const toCamel = (/** @type {string} */ name) => name.replace(/-([a-z])/g, (_, char) => char.toUpperCase())

const knownMoves = new Set(Object.keys(moveData))
/** @type {Record<string, string>} */
const moveKeyByNormalized = {}
for (const [key, move] of Object.entries(moveData))
  moveKeyByNormalized[normalize(/** @type {any} */ (move).name)] = key

/** @param {number} id @returns {string[] | null} */
function eggMovesForId(id) {
  const file = path.join(CACHE, `pokeapi-pokemon-${id}.json`)
  if (!fs.existsSync(file)) return null
  const pokemon = JSON.parse(fs.readFileSync(file, 'utf8'))
  const moves = new Set()
  for (const entry of pokemon.moves ?? []) {
    const isEgg = (entry.version_group_details ?? []).some(
      (/** @type {any} */ detail) => detail.move_learn_method?.name === 'egg'
    )
    if (!isEgg) continue
    const key = moveKeyByNormalized[normalize(entry.move.name)] ?? toCamel(entry.move.name)
    if (knownMoves.has(key)) moves.add(key)
  }
  return [...moves]
}

/** @type {Record<string, string[]>} */
const byKey = {}
let missingCache = 0,
  withEggMoves = 0
// Ids with no PokeAPI pokemon entry keep their hand-written rows instead of
// being dropped.
const eggPath = path.join(DATA, 'egg-moves.json')
const previous = fs.existsSync(eggPath) ? JSON.parse(fs.readFileSync(eggPath, 'utf8')) : {}
for (const [key, entry] of Object.entries(species)) {
  if (!entry.id) continue
  const moves = eggMovesForId(entry.id)
  if (moves === null) {
    missingCache++
    if (previous[key]) byKey[key] = previous[key]
    continue
  }
  if (moves.length > 0) {
    byKey[key] = moves.sort()
    withEggMoves++
  }
}

fs.writeFileSync(eggPath, JSON.stringify(byKey, null, 1) + '\n')
console.log(
  `wrote egg moves for ${withEggMoves} species` +
    (missingCache ? ` (${missingCache} ids had no cached /pokemon response)` : '')
)
