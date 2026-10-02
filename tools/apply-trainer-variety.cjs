#!/usr/bin/env node
/**
 * Rebuild the generated route-trainer teams so they reveal more of each
 * region's dex (#68).
 *
 * The committed `trainer-data.json` isn't idempotent with
 * `generate-regions.cjs`, so this is a data-only follow-up. It walks each
 * non-Kanto region's trainers in order and rebuilds every team with
 * `lib/trainer-teams.cjs`: level-appropriate, the class's type theme as a bias,
 * and a strong preference for species the region has not fielded yet. Team
 * sizes and levels are kept. Kanto's hand-curated trainers are left alone.
 *
 * Idempotent (the levels determine the teams). Usage: node
 * tools/apply-trainer-variety.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')
const { buildEvolutionLevels } = require('./lib/evolution-levels.cjs')
const { buildVariedTeam } = require('./lib/trainer-teams.cjs')
const TRAINER_CLASS_TYPES = require('./lib/trainer-class-types.cjs')

const DATA = path.join(__dirname, '../public/data')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))
const readRegionDir = (dir) =>
  fs.readdirSync(path.join(DATA, dir)).reduce((acc, file) => {
    Object.assign(acc, JSON.parse(fs.readFileSync(path.join(DATA, dir, file), 'utf8')))
    return acc
  }, /** @type {Record<string, any>} */ ({}))

const GEN_RANGES = [
  [1, 151],
  [152, 251],
  [252, 386],
  [387, 493],
  [494, 649],
  [650, 721],
  [722, 809],
  [810, 905],
  [906, 1025],
]
const GEN_STARTERS = {
  2: ['chikorita', 'cyndaquil', 'totodile'],
  3: ['treecko', 'torchic', 'mudkip'],
  4: ['turtwig', 'chimchar', 'piplup'],
  5: ['snivy', 'tepig', 'oshawott'],
  6: ['chespin', 'fennekin', 'froakie'],
  7: ['rowlet', 'litten', 'popplio'],
  8: ['grookey', 'scorbunny', 'sobble'],
  9: ['sprigatito', 'fuecoco', 'quaxly'],
}

const species = read('pokemon-species.json')
const evolutionData = read('evolution-data.json')
const regions = read('regions.json')
const mapData = readRegionDir('map-data')
const trainers = read('trainer-data.json')

const evolutionLevels = buildEvolutionLevels(evolutionData, species)

// A starter line never appears on a route trainer, matching the generator.
const ALL_STARTERS = (() => {
  const lines = new Set()
  const addLine = (key) => {
    if (lines.has(key)) return
    lines.add(key)
    for (const evolution of evolutionData[key] ?? []) addLine(evolution.into)
  }
  for (const key of [
    ...Object.values(GEN_STARTERS).flat(),
    'bulbasaur',
    'charmander',
    'squirtle',
  ])
    addLine(key)
  return lines
})()

const byId = Object.entries(species)
  .filter(([, entry]) => entry.id > 0)
  .map(([key, entry]) => ({ key, ...entry }))

/** @param {number} gen */
const poolForGen = (gen) => {
  const [minId, maxId] = GEN_RANGES[gen - 1]
  return byId
    .filter(
      (entry) =>
        entry.id <= maxId &&
        entry.catchRate > 3 &&
        !entry.legendary &&
        !ALL_STARTERS.has(entry.key)
    )
    .map((entry) => ({
      key: entry.key,
      types: entry.types ?? [],
      minLevel: evolutionLevels.minLevel[entry.key] ?? 1,
      // Species from the region's own generation are the ones its dex tracks.
      native: entry.id >= minId,
    }))
}

// The level at which a species would normally have evolved away from this form
// (item / friendship evolutions get a nominal gate, as in the generator).
const ITEM_EVOLUTION_LEVEL = 45
const evolvesAt = (() => {
  const map = {}
  for (const [key, evolutions] of Object.entries(evolutionData)) {
    if (!Array.isArray(evolutions)) continue
    for (const evolution of evolutions) {
      if (evolution?.form || !evolution?.into) continue
      const gate =
        evolution.level ?? (evolution.item || evolution.friendship ? ITEM_EVOLUTION_LEVEL : null)
      if (gate && (map[key] === undefined || gate < map[key])) map[key] = gate
    }
  }
  return map
})()

/** Deterministic shuffle so the native order isn't alphabetical. */
function shuffle(list, random) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** @param {string} text */
function makeRng(text) {
  let state = 2166136261
  for (let index = 0; index < text.length; index++) {
    state ^= text.charCodeAt(index)
    state = Math.imul(state, 16777619)
  }
  state >>>= 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const dry = process.argv.includes('--dry')
let changed = 0,
  trainersTouched = 0
for (const region of regions) {
  // Kanto's route trainers are hand-curated; leave them alone.
  if (region.id === 'kanto') continue
  const pool = poolForGen(region.generation),
    natives = shuffle(
      pool.filter((candidate) => candidate.native),
      makeRng(`${region.id}:natives`)
    ),
    others = pool.filter((candidate) => !candidate.native),
    state = { cursor: 0 }
  for (const [locationId, list] of Object.entries(trainers)) {
    if ((mapData[locationId]?.region ?? 'kanto') !== region.id) continue
    for (const trainer of list) {
      if (!trainer.team?.length) continue
      const levels = trainer.team.map((member) => member.level),
        before = trainer.team.map((member) => member.speciesKey).join(','),
        team = buildVariedTeam({
          natives,
          others,
          theme: TRAINER_CLASS_TYPES[trainer.trainerClass],
          levels,
          state,
          evolutionLevels,
          evolvesAt,
        }),
        after = team.map((member) => member.speciesKey).join(',')
      if (before !== after) changed++
      trainer.team = team
      trainersTouched++
    }
  }
}

if (dry) {
  console.log(`would rewrite ${changed}/${trainersTouched} trainer teams`)
} else {
  fs.writeFileSync(
    path.join(DATA, 'trainer-data.json'),
    JSON.stringify(trainers, null, 1) + '\n'
  )
  console.log(`rewrote ${changed}/${trainersTouched} trainer teams`)
}
