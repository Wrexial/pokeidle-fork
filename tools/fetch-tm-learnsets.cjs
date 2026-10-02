#!/usr/bin/env node
/**
 * Build per-species TM (machine) learnsets from PokeAPI.
 *
 * `possible-learnsets.json` only holds level-up moves, so the Move Tutor has
 * nothing to offer. This reads each species' cached `/pokemon/{id}` response and
 * keeps the machine moves from its newest available game (Gen 9 TMs where
 * possible), writing the game keys to public/data/tm-learnsets.json.
 *
 * The `/pokemon/{id}` responses are already cached by fetch-abilities.cjs, so
 * this normally needs no network. Re-run after adding species/form ids.
 *
 * Usage: node tools/fetch-tm-learnsets.cjs
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

/** Newest machine move sets to prefer, in order. */
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

/** @param {number} id @returns {string[] | null} */
function machineMovesForId(id) {
  const file = path.join(CACHE, `pokeapi-pokemon-${id}.json`)
  if (!fs.existsSync(file)) return null
  const pokemon = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const group of PREFERRED_GROUPS) {
    const moves = new Set()
    for (const entry of pokemon.moves ?? []) {
      const byMachine = (entry.version_group_details ?? []).some(
        (/** @type {any} */ detail) =>
          detail.move_learn_method?.name === 'machine' &&
          detail.version_group?.name === group
      )
      if (!byMachine) continue
      const key =
        moveKeyByNormalized[normalize(entry.move.name)] ?? toCamel(entry.move.name)
      if (knownMoves.has(key)) moves.add(key)
    }
    if (moves.size > 0) return [...moves]
  }
  return []
}

/** @type {Record<string, string[]>} */
const byKey = {}
let missingCache = 0
// Ids with no PokeAPI pokemon entry (the Unown letters) keep their hand-written
// rows (see add-unown-forms.cjs) instead of being dropped.
const tmPath = path.join(DATA, 'tm-learnsets.json')
const previous = fs.existsSync(tmPath) ? JSON.parse(fs.readFileSync(tmPath, 'utf8')) : {}
for (const [key, entry] of Object.entries(species)) {
  if (!entry.id) continue
  const moves = machineMovesForId(entry.id)
  if (moves === null) {
    missingCache++
    if (previous[key]) byKey[key] = previous[key]
    continue
  }
  if (moves.length > 0) byKey[key] = moves.sort()
}

fs.writeFileSync(tmPath, JSON.stringify(byKey, null, 1) + '\n')
console.log(
  `wrote TM learnsets for ${Object.keys(byKey).length} species` +
    (missingCache ? ` (${missingCache} ids had no cached /pokemon response)` : '')
)
