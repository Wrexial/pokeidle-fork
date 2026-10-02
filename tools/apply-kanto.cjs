#!/usr/bin/env node
/**
 * Bring Kanto onto the generated pipeline for its encounters, gym/league teams
 * and leader sprites.
 *
 * Kanto's map, location/gym ids, badges and route-unlock graph stay hand-curated
 * (renaming them would break saves and dozens of code references), so this is a
 * data-only pass that:
 *   1. rebuilds the Kanto encounter tables from tools/route-encounters.json
 *      (re-levelled across the 5-75 curve and stepped back to plausible forms),
 *      then re-adds the Safari Zone starters;
 *   2. rebuilds the gym / Elite Four / Champion initial teams with the same
 *      `lib/team-builder.cjs` used for the generated regions, keeping every id,
 *      name, badge and level;
 *   3. swaps the leader gen3 sprites for current-gen art (Lorelei / Agatha keep
 *      their gen3 art, the only art Showdown has for them).
 *
 * Idempotent. Usage: node tools/apply-kanto.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')
const { buildEvolutionLevels, stageForLevel } = require('./lib/evolution-levels.cjs')
const { createTeamBuilder } = require('./lib/team-builder.cjs')
const {
  buildWildPool,
  collectProtectedSpecies,
  enrichEncounters,
} = require('./lib/route-variety.cjs')

const STARTER_BASES = [
  'bulbasaur',
  'charmander',
  'squirtle',
  'chikorita',
  'cyndaquil',
  'totodile',
  'treecko',
  'torchic',
  'mudkip',
  'turtwig',
  'chimchar',
  'piplup',
  'snivy',
  'tepig',
  'oshawott',
  'chespin',
  'fennekin',
  'froakie',
  'rowlet',
  'litten',
  'popplio',
  'grookey',
  'scorbunny',
  'sobble',
  'sprigatito',
  'fuecoco',
  'quaxly',
]

const DATA = path.join(__dirname, '../public/data')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))
const write = (file, data) =>
  fs.writeFileSync(path.join(DATA, file), JSON.stringify(data, null, 1) + '\n')

const LEVEL_MIN = 5
const LEVEL_MAX = 75
const WILD_LEVEL_MAX = LEVEL_MAX - 2
const ITEM_EVOLUTION_LEVEL = 45
const clampLevel = (n) => Math.max(2, Math.min(100, n))

const KANTO_GYM_TYPES = {
  Brock: ['Rock'],
  Misty: ['Water'],
  'Lt. Surge': ['Electric'],
  Erika: ['Grass'],
  Koga: ['Poison'],
  Sabrina: ['Psychic'],
  Blaine: ['Fire'],
  Giovanni: ['Ground'],
}
const KANTO_E4_TYPES = {
  Lorelei: ['Ice'],
  Bruno: ['Fighting'],
  Agatha: ['Ghost'],
  Lance: ['Dragon'],
}
// Current-gen trainer art. Lorelei and Agatha only exist as gen3/lgpe art, so
// they keep the gen3 key (like Hoenn's Phoebe/Drake in the generator).
const SPRITE_KEYS = {
  brock: 'brock',
  misty: 'misty',
  'lt. surge': 'ltsurge',
  erika: 'erika',
  koga: 'koga',
  sabrina: 'sabrina',
  blaine: 'blaine',
  giovanni: 'giovanni',
  lorelei: 'lorelei-gen3',
  bruno: 'bruno',
  agatha: 'agatha-gen3',
  lance: 'lance',
  blue: 'blue',
}

const species = read('pokemon-species.json')
const evolutionData = read('evolution-data.json')
const evolutionLevels = buildEvolutionLevels(evolutionData, species)
const map = read('map-data/kanto.json')
const encounters = read('encounter-data/kanto.json')
const realEncounters = require('./route-encounters.json').kanto
const gyms = read('gym-leader-data.json')
const elite4 = read('elite-4-data.json')
const champions = read('champion-data.json')

const dry = process.argv.includes('--dry')

// ---------------------------------------------------------------------------
// 1. encounters
// ---------------------------------------------------------------------------
function levelRoutes(orderedKeys, entriesByKey) {
  const keys = orderedKeys.filter((key) => entriesByKey[key]?.length),
    span = WILD_LEVEL_MAX - LEVEL_MIN
  keys.forEach((key, index) => {
    const t = keys.length <= 1 ? 0 : index / (keys.length - 1),
      zoneLevel = Math.max(2, Math.min(WILD_LEVEL_MAX, Math.round(LEVEL_MIN + t * span)))
    for (const entry of entriesByKey[key]) {
      entry.minLevel = zoneLevel
      entry.maxLevel = Math.max(zoneLevel, Math.min(LEVEL_MAX, zoneLevel + 2))
    }
  })
}

/** @param {{ speciesKey: string, weight: number, minLevel: number, maxLevel: number }[]} entries */
function plausibleEncounters(entries) {
  const merged = new Map()
  for (const entry of entries) {
    const next = stageForLevel(entry.speciesKey, entry.minLevel, evolutionLevels),
      existing = merged.get(next)
    if (existing) {
      existing.weight += entry.weight
      existing.minLevel = Math.min(existing.minLevel, entry.minLevel)
      existing.maxLevel = Math.max(existing.maxLevel, entry.maxLevel)
    } else merged.set(next, { ...entry, speciesKey: next })
  }
  return [...merged.values()]
}

for (const location of Object.values(map)) {
  if ((location.region ?? 'kanto') !== 'kanto' || !location.routeKey || location.type === 'raid')
    continue
  const real = realEncounters[location.routeKey]
  if (real?.length && encounters[location.routeKey])
    encounters[location.routeKey] = {
      name: encounters[location.routeKey].name,
      encounters: real.map((entry) => ({ ...entry })),
    }
}
const orderedKeys = Object.values(map)
  .filter(
    (location) =>
      (location.region ?? 'kanto') === 'kanto' && location.routeKey && location.type !== 'raid'
  )
  .sort((a, b) => (a.unlockOrder ?? 0) - (b.unlockOrder ?? 0))
  .map((location) => location.routeKey)
const entriesByKey = {}
for (const key of orderedKeys) if (encounters[key]) entriesByKey[key] = encounters[key].encounters
levelRoutes(orderedKeys, entriesByKey)
// A gentler Lv.3-5 opening route, matching the generator.
if (orderedKeys.length > 0)
  for (const entry of entriesByKey[orderedKeys[0]] ?? []) {
    entry.minLevel = 3
    entry.maxLevel = 5
  }
for (const entries of Object.values(entriesByKey))
  entries.splice(0, entries.length, ...plausibleEncounters(entries))
// The starters are only findable in the Safari Zone, at that zone's level.
const safari = encounters.safariZone
if (safari) {
  const zoneLevel = safari.encounters[0]?.minLevel ?? 20
  for (const key of ['bulbasaur', 'charmander', 'squirtle'])
    if (species[key] && !safari.encounters.some((entry) => entry.speciesKey === key))
      safari.encounters.push({
        speciesKey: key,
        weight: 1,
        minLevel: zoneLevel,
        maxLevel: clampLevel(zoneLevel + 2),
      })
}
// Jynx's only Kanto source (Seafoam Islands), matching the generator's
// RAID_FINAL_HABITATS pass. Smoochum then hatches from it by breeding.
for (const [locationId, speciesKeys] of Object.entries({ seafoamIslands: ['jynx'] })) {
  const bucket = encounters[locationId]
  if (!bucket) continue
  const level = bucket.encounters[0]?.minLevel ?? 5,
    maxLevel = bucket.encounters[0]?.maxLevel ?? clampLevel(level + 2)
  for (const key of speciesKeys)
    if (species[key] && !bucket.encounters.some((entry) => entry.speciesKey === key))
      bucket.encounters.push({ speciesKey: key, weight: 12, minLevel: level, maxLevel })
}
// Top the routes up with the region's other wild species (lib/route-variety),
// so a rebuilt Kanto matches the generated regions' variety.
const protectedSpecies = collectProtectedSpecies(evolutionData, STARTER_BASES, map),
  regionBuckets = {}
for (const [key, bucket] of Object.entries(encounters))
  if ((map[key]?.region ?? 'kanto') === 'kanto') regionBuckets[key] = bucket
const wildPool = buildWildPool(regionBuckets, map, protectedSpecies)
for (const [key, bucket] of Object.entries(regionBuckets)) {
  if (map[key]?.type !== 'route') continue
  const result = enrichEncounters(bucket.encounters, wildPool, species, evolutionLevels)
  if (result.added.length) bucket.encounters = result.encounters
}

// ---------------------------------------------------------------------------
// 2. gym / Elite Four / Champion initial teams
// ---------------------------------------------------------------------------
const ALL_STARTERS = (() => {
  const lines = new Set()
  const addLine = (key) => {
    if (lines.has(key)) return
    lines.add(key)
    for (const evolution of evolutionData[key] ?? []) addLine(evolution.into)
  }
  for (const key of STARTER_BASES) addLine(key)
  return lines
})()
const byId = Object.entries(species)
  .filter(([, entry]) => entry.id > 0)
  .map(([key, entry]) => ({ key, ...entry }))
// teamPoolForGen(1): the Kanto generation slice the generator would use.
const kantoPool = byId.filter(
  (entry) =>
    entry.id <= 151 &&
    entry.catchRate > 3 &&
    !entry.legendary &&
    !ALL_STARTERS.has(entry.key)
)
const { buildTeam } = createTeamBuilder({
  evolutionData,
  evolutionLevels,
  itemEvolutionLevel: ITEM_EVOLUTION_LEVEL,
})

/** Rebuild a team's species, then restore its canonical levels. */
const rebuildTeam = (record, types, offset) => {
  const levels = record.team.map((member) => member.level).sort((a, b) => a - b)
  record.team = buildTeam(kantoPool, types, levels.length, levels[0], 1, offset).map(
    (member, index) => ({ ...member, level: levels[index] ?? levels[levels.length - 1] })
  )
}
let gymIndex = 0
for (const gym of gyms) {
  if ((gym.region ?? 'kanto') !== 'kanto') continue
  rebuildTeam(gym, KANTO_GYM_TYPES[gym.name], gymIndex * 3)
  gymIndex++
}
let e4Index = 0
for (const member of elite4) {
  if ((member.region ?? 'kanto') !== 'kanto') continue
  rebuildTeam(member, KANTO_E4_TYPES[member.name], e4Index * 2)
  e4Index++
}
for (const champion of champions) {
  if ((champion.region ?? 'kanto') !== 'kanto') continue
  rebuildTeam(champion, [], 1)
}

// ---------------------------------------------------------------------------
// 3. leader sprites
// ---------------------------------------------------------------------------
for (const record of [...gyms, ...elite4, ...champions]) {
  if ((record.region ?? 'kanto') !== 'kanto') continue
  const spriteKey = SPRITE_KEYS[record.name.toLowerCase()]
  if (spriteKey) record.spriteKey = spriteKey
}

if (dry) {
  console.log('would rebuild Kanto encounters, gym/E4/Champion teams and sprites')
} else {
  write('encounter-data/kanto.json', encounters)
  write('gym-leader-data.json', gyms)
  write('elite-4-data.json', elite4)
  write('champion-data.json', champions)
  console.log('rebuilt Kanto encounters, gym/E4/Champion teams and sprites')
}
