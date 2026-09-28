#!/usr/bin/env node
/**
 * Data integrity checks for the generated game content.
 *
 * There is no test suite; this is the closest thing. It reads the committed
 * JSON under public/data/ and fails (non-zero exit) on anything that would
 * manifest as a broken Pokedex, encounter, team or map.
 *
 * Usage: node tools/validate-data.cjs   (or `npm run validate`)
 */
const fs = require('fs')
const path = require('path')
const { readRegionDir } = require('./lib/region-data.cjs')
const { buildEvolutionLevels, stageForLevel } = require('./lib/evolution-levels.cjs')

const DATA = path.join(__dirname, '../public/data')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))

const species = read('pokemon-species.json')
const learnsets = read('possible-learnsets.json')
const moveData = read('possible-moves.json')
const evolutionData = read('evolution-data.json')
const breedingData = read('breeding-data.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))
const regions = read('regions.json')
const trainerData = read('trainer-data.json')
const gyms = read('gym-leader-data.json')
const elite4 = read('elite-4-data.json')
const champions = read('champion-data.json')

const problems = []
const fail = (message) => problems.push(message)
const speciesKeys = new Set(Object.keys(species))
const realSpecies = Object.keys(species).filter((key) => species[key].id > 0)

// --- species, moves and evolutions -------------------------------------------
for (const key of realSpecies) {
  const entry = species[key]
  if (!entry.types?.length) fail(`species ${key} has no types`)
  if (!Object.values(entry.baseStats ?? {}).some((stat) => stat > 0))
    fail(`species ${key} has no base stats`)
  if (!entry.growthRate) fail(`species ${key} has no growth rate`)
}
for (const [key, moves] of Object.entries(learnsets)) {
  if (!speciesKeys.has(key)) fail(`learnset for unknown species ${key}`)
  for (const [, moveId] of moves) if (!moveData[moveId]) fail(`learnset ${key} uses unknown move ${moveId}`)
}
for (const key of realSpecies) if (!learnsets[key]) fail(`species ${key} has no learnset (no moves in battle)`)
for (const [from, evolutions] of Object.entries(evolutionData)) {
  if (!speciesKeys.has(from)) fail(`evolution from unknown species ${from}`)
  for (const evolution of evolutions) {
    if (!speciesKeys.has(evolution.into)) fail(`evolution ${from} -> unknown ${evolution.into}`)
    if (evolution.level == null && !evolution.item && evolution.friendship == null)
      fail(`evolution ${from} -> ${evolution.into} has no trigger`)
  }
}

// --- obtainability -----------------------------------------------------------
// The generator seeds every region's first route with its starters, so the
// encounter tables already contain them. Breeding a breedable species yields the
// root of its evolution chain, so a species can also be obtained by breeding an
// obtainable final form (this is why Raid Islands only hand out final stages).
const isFormRevert = (from, into) =>
  Number(species[from]?.id) > 1025 &&
  (evolutionData[into] ?? []).some((evolution) => evolution.into === from)
const preEvolutionMap = Object.fromEntries(
  Object.entries(evolutionData).flatMap(([from, evolutions]) =>
    evolutions
      .filter((evolution) => !isFormRevert(from, evolution.into))
      .map((evolution) => [evolution.into, from])
  )
)
// Reattach form <-> form transforms whose both directions were dropped above.
for (let changed = true; changed; ) {
  changed = false
  for (const [from, evolutions] of Object.entries(evolutionData)) {
    if (!species[from] || species[from].id <= 1025) continue
    for (const evolution of evolutions) {
      const into = evolution.into
      if (!species[into] || species[into].id <= 1025) continue
      if (!(evolutionData[into] ?? []).some((back) => back.into === from)) continue
      if (preEvolutionMap[from] === undefined && preEvolutionMap[into] !== undefined)
        (preEvolutionMap[from] = into), (changed = true)
      else if (preEvolutionMap[into] === undefined && preEvolutionMap[from] !== undefined)
        (preEvolutionMap[into] = from), (changed = true)
    }
  }
}
const chainRoot = (speciesKey) => {
  const seen = new Set([speciesKey])
  let current = speciesKey
  for (let next = preEvolutionMap[current]; next && !seen.has(next); next = preEvolutionMap[current]) {
    current = next
    seen.add(current)
  }
  return current
}
const obtainable = new Set()
for (const bucket of Object.values(encounterData))
  for (const encounter of bucket.encounters ?? []) {
    if (!speciesKeys.has(encounter.speciesKey)) fail(`encounter uses unknown species ${encounter.speciesKey}`)
    obtainable.add(encounter.speciesKey)
  }
// Every Bug-type (legendaries included) turns up in the Bug Catching Contest,
// so those species are obtainable without a Raid Island (as is anything they
// evolve into). Mirrors the pool in src/game/minigames.js.
for (const [key, entry] of Object.entries(species))
  if (entry.id > 0 && entry.id <= 1025 && (entry.types ?? []).includes('Bug'))
    obtainable.add(key)
// The ordinary Raid Island finals are relocated to reachable refuge static
// encounters (RAID_REFUGE_LOCATIONS in src/game/gifts.js), so they stay
// obtainable even though the island's own wild table is legendary-only.
for (const region of regions)
  for (const entry of region.raidOrdinaryPool ?? []) obtainable.add(entry.speciesKey)
let expanded = true
while (expanded) {
  expanded = false
  for (const key of [...obtainable]) {
    const breedData = breedingData[key]
    if (breedData && !breedData.undiscovered) {
      const root = chainRoot(key)
      if (!obtainable.has(root)) (obtainable.add(root), (expanded = true))
    }
    for (const evolution of evolutionData[key] ?? [])
      if (!obtainable.has(evolution.into)) (obtainable.add(evolution.into), (expanded = true))
  }
}
for (const key of realSpecies) if (!obtainable.has(key)) fail(`species ${key} cannot be obtained`)

// --- encounters and map ------------------------------------------------------
const RAID_ORDINARY_CAP = 15
for (const region of regions) {
  const seen = new Set(),
    tiers = [
      ['raidPool', region.raidPool ?? [], true],
      ['raidOrdinaryPool', region.raidOrdinaryPool ?? [], false],
    ]
  for (const [tier, entries, expectLegendary] of tiers) {
    for (const entry of entries) {
      if (!speciesKeys.has(entry.speciesKey)) {
        fail(`${tier} for ${region.id} has unknown species ${entry.speciesKey}`)
        continue
      }
      if (seen.has(entry.speciesKey))
        fail(`${region.id} lists ${entry.speciesKey} in both raid pools`)
      seen.add(entry.speciesKey)
      if (!!species[entry.speciesKey].legendary !== expectLegendary)
        fail(
          `${tier} for ${region.id} has ${expectLegendary ? 'non-' : ''}legendary ${entry.speciesKey}`
        )
    }
  }
  if ((region.raidOrdinaryPool ?? []).length > RAID_ORDINARY_CAP)
    fail(
      `region ${region.id} has ${region.raidOrdinaryPool.length} ordinary raid Pokemon (cap ${RAID_ORDINARY_CAP})`
    )
}

// --- league structure --------------------------------------------------------
// The league shape is per-region data (see LEAGUES in generate-regions.cjs):
// Alola's trials award Z-Crystals, Galar ends in the Champion Cup, and Paldea's
// gyms can be challenged in any order. Check each region describes its track so
// the panel can label it instead of assuming "8 gyms + Elite Four".
for (const region of regions) {
  const league = region.league
  if (!league) {
    fail(`region ${region.id} has no league block`)
  } else {
    if (!['ordered', 'free'].includes(league.badgeOrder))
      fail(`region ${region.id} league has invalid badgeOrder ${league.badgeOrder}`)
    for (const field of ['badgeTrack', 'badgeName', 'eliteTrack'])
      if (typeof league[field] !== 'string' || !league[field])
        fail(`region ${region.id} league is missing ${field}`)
  }
  if (!gyms.some((gym) => (gym.region ?? 'kanto') === region.id))
    fail(`region ${region.id} has no badge-track members`)
  if (!champions.some((champion) => (champion.region ?? 'kanto') === region.id))
    fail(`region ${region.id} has no Champion`)
}

// --- sprite manifests --------------------------------------------------------
// The gendered manifest must match the files on disk, or a female Pokemon would
// request a sprite that does not exist.
const genderedSprites = read('gendered-sprites.json')
const SPRITE_ROOT = path.join(__dirname, '../public/sprites/pokemon')
const ANIMATED_ROOT = path.join(SPRITE_ROOT, 'versions/generation-v/black-white/animated')
const femaleSpriteDirs = {
  front: path.join(SPRITE_ROOT, 'female'),
  back: path.join(SPRITE_ROOT, 'back', 'female'),
  shiny: path.join(SPRITE_ROOT, 'shiny', 'female'),
  backShiny: path.join(SPRITE_ROOT, 'back', 'shiny', 'female'),
  animatedFront: path.join(ANIMATED_ROOT, 'female'),
  animatedBack: path.join(ANIMATED_ROOT, 'back', 'female'),
  animatedShiny: path.join(ANIMATED_ROOT, 'shiny', 'female'),
  animatedBackShiny: path.join(ANIMATED_ROOT, 'back', 'shiny', 'female'),
}
for (const [category, dir] of Object.entries(femaleSpriteDirs)) {
  const extension = category.startsWith('animated') ? 'gif' : 'png'
  for (const id of genderedSprites[category] ?? [])
    if (!fs.existsSync(path.join(dir, `${id}.${extension}`)))
      fail(`gendered-sprite manifest lists ${category} #${id} but the file is missing`)
}

// The shop / auction item sprite manifest must match the files on disk, or a
// row would request an icon that does not exist.
const itemIcons = read('item-icons.json')
const ITEM_SPRITE_ROOT = path.join(__dirname, '../public/sprites/items')
for (const [itemId, file] of Object.entries(itemIcons))
  if (!fs.existsSync(path.join(ITEM_SPRITE_ROOT, file)))
    fail(`item sprite manifest lists ${itemId} but ${file} is missing`)

for (const [locationId, location] of Object.entries(mapData)) {
  if (location.background && !fs.existsSync(path.join(__dirname, '../public', location.background)))
    fail(`location ${locationId} uses missing background ${location.background}`)
  for (const connection of location.connections)
    if (!mapData[connection]) fail(`location ${locationId} connects to unknown ${connection}`)
    else if (!mapData[connection].connections.includes(locationId))
      fail(`connection ${locationId} <-> ${connection} is not mutual`)
  for (const requirement of location.unlock?.battlesAtLocation ?? [])
    if (!mapData[requirement.locationId]) fail(`location ${locationId} gates on unknown ${requirement.locationId}`)
  if (location.type === 'route' && (!location.routeKey || !encounterData[location.routeKey]))
    fail(`route ${locationId} has no encounter bucket`)
  const caughtOnRoute = location.unlock?.caughtOnRoute
  if (caughtOnRoute) {
    const bucket = new Set(
      (encounterData[caughtOnRoute.routeKey]?.encounters ?? []).map((entry) => entry.speciesKey)
    )
    for (const key of caughtOnRoute.species)
      if (!bucket.has(key)) fail(`${locationId} caughtOnRoute lists ${key}, not on ${caughtOnRoute.routeKey}`)
    // `count` may be lower than the list length: the gate then wants any
    // `count` of the listed species (e.g. either Alolan Sandshrew or Vulpix).
    if (
      !Number.isInteger(caughtOnRoute.count) ||
      caughtOnRoute.count < 1 ||
      caughtOnRoute.count > caughtOnRoute.species.length
    )
      fail(`${locationId} caughtOnRoute count is outside its species list`)
    if (new Set(caughtOnRoute.species).size !== caughtOnRoute.species.length)
      fail(`${locationId} caughtOnRoute species list has duplicates`)
  }
}
for (const [bucketKey, bucket] of Object.entries(encounterData)) {
  if (!mapData[bucketKey]) fail(`encounter bucket ${bucketKey} has no location`)
  if (!bucket.encounters?.length) fail(`encounter bucket ${bucketKey} is empty`)
  for (const encounter of bucket.encounters)
    if (
      encounter.maxLevel < encounter.minLevel ||
      encounter.weight == null ||
      encounter.weight <= 0 ||
      encounter.minLevel == null
    )
      fail(`encounter ${bucketKey}/${encounter.speciesKey} has invalid weight/levels`)
}

// A wild species must not sit below the level it could actually evolve at.
const evolutionLevels = buildEvolutionLevels(evolutionData, species)
for (const [bucketKey, bucket] of Object.entries(encounterData))
  for (const encounter of bucket.encounters ?? []) {
    const floor = evolutionLevels.minLevel[encounter.speciesKey] ?? 1
    if (encounter.minLevel < floor)
      fail(
        `encounter ${bucketKey}/${encounter.speciesKey} is Lv.${encounter.minLevel}, below its Lv.${floor} evolution floor`
      )
  }

// --- trainers and league -----------------------------------------------------
const teamLists = [
  ...Object.entries(trainerData).map(([id, list]) => [id, list]),
  ...gyms.map((gym) => [gym.name, [gym]]),
  ...elite4.map((member) => [member.name, [member]]),
  ...champions.map((champion) => [champion.id, [champion]]),
]
for (const [owner, list] of teamLists)
  for (const trainer of list)
    for (const key of ['team', 'rematchTeam'])
      for (const member of trainer[key] ?? []) {
        if (!speciesKeys.has(member.speciesKey)) fail(`${owner} team uses unknown species ${member.speciesKey}`)
        if (!(member.level >= 1 && member.level <= 100)) fail(`${owner} has an invalid level ${member.level}`)
        if (species[member.speciesKey]?.legendary) fail(`${owner} team uses legendary ${member.speciesKey}`)
        const floor = evolutionLevels.minLevel[member.speciesKey] ?? 1
        if (member.level < floor)
          fail(
            `${owner} fields ${member.speciesKey} Lv.${member.level}, below its Lv.${floor} evolution floor`
          )
      }

// --- report ------------------------------------------------------------------
if (problems.length) {
  console.error(`validate-data: ${problems.length} problem(s)`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}
console.log(
  `validate-data: ok (${realSpecies.length} species, ${Object.keys(encounterData).length} encounter buckets, ${gyms.length} gyms)`
)
