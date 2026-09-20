#!/usr/bin/env node
/**
 * Generate playable content for Pokémon generations 2-9 from the existing
 * species data, and merge it into the JSON the game loads at runtime.
 *
 * For each generation it creates a region: a hub town (mart + trainers), three
 * wild routes (with that generation's species plus its starters as rare finds),
 * a raid island (that generation's legendaries), and a gym/Elite Four/Champion
 * league.
 *
 * Idempotent: regenerates only the non-Kanto content (Kanto is left as-is, but
 * tagged with region "kanto").
 *
 * Usage: node tools/generate-regions.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 1) + '\n')

const GEN_RANGES = [
  [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
  [650, 721], [722, 809], [810, 905], [906, 1025],
]
const REGIONS = [
  { id: 'kanto', name: 'Kanto' },
  { id: 'johto', name: 'Johto', town: 'New Bark Town' },
  { id: 'hoenn', name: 'Hoenn', town: 'Littleroot Town' },
  { id: 'sinnoh', name: 'Sinnoh', town: 'Twinleaf Town' },
  { id: 'unova', name: 'Unova', town: 'Nuvema Town' },
  { id: 'kalos', name: 'Kalos', town: 'Vaniville Town' },
  { id: 'alola', name: 'Alola', town: 'Iki Town' },
  { id: 'galar', name: 'Galar', town: 'Postwick' },
  { id: 'paldea', name: 'Paldea', town: 'Cabo Poco' },
]
// gentle level ramp across generations (Kanto tops out ~65 in-game)
const GEN_BASE_LEVEL = [0, 28, 37, 46, 55, 64, 73, 82, 91]
const TRAINER_CLASSES = [
  'youngster', 'lass', 'bugCatcher', 'hiker', 'camper', 'beauty',
  'coolTrainer', 'psychic', 'scientist', 'ace', 'blackbelt', 'swimmer',
]
const LEADER_SPRITES = [
  'acetrainer', 'hiker', 'beauty', 'blackbelt', 'psychic', 'scientist',
  'camper', 'swimmer', 'gentleman', 'juggler',
]
const BADGE_COLORS = [
  '#a0a0a0', '#4878b0', '#c8a030', '#48a048', '#b83028', '#a060c0',
  '#e08040', '#40c0c0',
]

const GEN_STARTERS = {
  1: ['bulbasaur', 'charmander', 'squirtle'],
  2: ['chikorita', 'cyndaquil', 'totodile'],
  3: ['treecko', 'torchic', 'mudkip'],
  4: ['turtwig', 'chimchar', 'piplup'],
  5: ['snivy', 'tepig', 'oshawott'],
  6: ['chespin', 'fennekin', 'froakie'],
  7: ['rowlet', 'litten', 'popplio'],
  8: ['grookey', 'scorbunny', 'sobble'],
  9: ['sprigatito', 'fuecoco', 'quaxly'],
}
const GYM_LEADERS = {
  johto: ['Falkner', 'Bugsy', 'Whitney', 'Morty', 'Chuck', 'Jasmine', 'Pryce', 'Clair'],
  hoenn: ['Roxanne', 'Brawly', 'Wattson', 'Flannery', 'Norman', 'Winona', 'Tate', 'Juan'],
  sinnoh: ['Roark', 'Gardenia', 'Maylene', 'Crasher Wake', 'Fantina', 'Byron', 'Candice', 'Volkner'],
  unova: ['Cilan', 'Lenora', 'Burgh', 'Elesa', 'Clay', 'Skyla', 'Brycen', 'Drayden'],
  kalos: ['Viola', 'Grant', 'Korrina', 'Ramos', 'Clemont', 'Valerie', 'Olympia', 'Wulfric'],
  alola: ['Ilima', 'Lana', 'Kiawe', 'Mallow', 'Sophocles', 'Acerola', 'Mina', 'Hapu'],
  galar: ['Milo', 'Nessa', 'Kabu', 'Bea', 'Opal', 'Gordie', 'Piers', 'Raihan'],
  paldea: ['Katy', 'Brassius', 'Iono', 'Kofu', 'Larry', 'Ryme', 'Tulip', 'Grusha'],
}
const ELITE_FOUR = {
  johto: ['Will', 'Koga', 'Bruno', 'Karen'],
  hoenn: ['Sidney', 'Phoebe', 'Glacia', 'Drake'],
  sinnoh: ['Aaron', 'Bertha', 'Flint', 'Lucian'],
  unova: ['Shauntal', 'Grimsley', 'Caitlin', 'Marshal'],
  kalos: ['Malva', 'Siebold', 'Wikstrom', 'Drasna'],
  alola: ['Hala', 'Olivia', 'Molayne', 'Kahili'],
  galar: ['Marnie', 'Hop', 'Bede', 'Raihan'],
  paldea: ['Rika', 'Poppy', 'Hassel', 'Clavell'],
}
const CHAMPIONS = {
  johto: 'Lance', hoenn: 'Steven', sinnoh: 'Cynthia', unova: 'Alder',
  kalos: 'Diantha', alola: 'Kukui', galar: 'Leon', paldea: 'Geeta',
}
// the Kanto raid legendaries (previously hardcoded in config.js)
const KANTO_LEGENDARIES = [
  { speciesKey: 'articuno', level: 70 },
  { speciesKey: 'zapdos', level: 70 },
  { speciesKey: 'moltres', level: 70 },
  { speciesKey: 'mewtwo', level: 80 },
  { speciesKey: 'mew', level: 60 },
]

const species = read('pokemon-species.json')
const mapData = read('map-data.json')
const encounterData = read('encounter-data.json')
const trainerData = read('trainer-data.json')

// --- clean previous generated content ---------------------------------------
const genRegionIds = new Set(REGIONS.slice(1).map((r) => r.id))
const isGenerated = (id) => genRegionIds.has(String(id).split('-')[0])
for (const key of Object.keys(mapData)) if (isGenerated(key)) delete mapData[key]
for (const key of Object.keys(encounterData)) if (isGenerated(key)) delete encounterData[key]
for (const key of Object.keys(trainerData)) if (isGenerated(key)) delete trainerData[key]
// tag Kanto
for (const loc of Object.values(mapData)) if (!loc.region) loc.region = 'kanto'

const gymData = read('gym-leader-data.json').filter((g) => !isGenerated(g.id))
const e4Data = read('elite-4-data.json').filter((e) => !isGenerated(e.id))
const champRaw = read('champion-data.json')
const champData = (Array.isArray(champRaw) ? champRaw : [champRaw]).filter((c) => !isGenerated(c.id))
for (const g of gymData) g.region ||= 'kanto'
for (const e of e4Data) e.region ||= 'kanto'
for (const c of champData) c.region ||= 'kanto'

// --- helpers -----------------------------------------------------------------
const byId = Object.entries(species)
  .filter(([, s]) => typeof s.id === 'number' && s.id > 0)
  .map(([key, s]) => ({ key, ...s }))

const speciesForGen = (gen) => {
  const [a, b] = GEN_RANGES[gen - 1]
  return byId.filter((s) => s.id >= a && s.id <= b).sort((x, y) => x.id - y.id)
}
const encounterWeight = (s, idx) => (s.catchRate <= 3 ? 1 : idx < 3 ? 20 : idx < 8 ? 12 : 6)
const clampLevel = (n) => Math.max(2, Math.min(100, n))
const chunk = (list, parts) => {
  const per = Math.ceil(list.length / parts)
  return Array.from({ length: parts }, (_, i) => list.slice(i * per, (i + 1) * per))
}
const makeTeam = (list, offset, size, baseLevel, step = 1) =>
  Array.from({ length: size }, (_, i) => ({
    speciesKey: list[(offset + i) % list.length].key,
    level: clampLevel(baseLevel + i * step),
  }))

// --- generate ----------------------------------------------------------------
const regions = [
  { id: 'kanto', name: 'Kanto', generation: 1, order: 1, legendaries: KANTO_LEGENDARIES },
]
let unlockOrder = 100

for (let gen = 2; gen <= 9; gen++) {
  const region = REGIONS[gen - 1],
    regionId = region.id,
    townId = `${regionId}-town`,
    raidId = `${regionId}-raid`,
    routeIds = [1, 2, 3].map((n) => `${regionId}-route-${n}`),
    base = GEN_BASE_LEVEL[gen - 1],
    all = speciesForGen(gen),
    starters = GEN_STARTERS[gen],
    legendaries = all.filter((s) => s.catchRate <= 3),
    wild = all.filter((s) => s.catchRate > 3 && !starters.includes(s.key)),
    chunks = chunk(wild, 3),
    prevRoute = `${REGIONS[gen - 2].id}-route-3`

  regions.push({
    id: regionId,
    name: region.name,
    generation: gen,
    order: gen,
    legendaries: legendaries.map((s) => ({ speciesKey: s.key, level: clampLevel(base + 35) })),
  })

  const positions = {
    [townId]: { x: 15, y: 55 },
    [routeIds[0]]: { x: 38, y: 35 },
    [routeIds[1]]: { x: 60, y: 60 },
    [routeIds[2]]: { x: 82, y: 38 },
    [raidId]: { x: 88, y: 14 },
  }
  const connections = {
    [townId]: [routeIds[0], raidId],
    [routeIds[0]]: [townId, routeIds[1]],
    [routeIds[1]]: [routeIds[0], routeIds[2]],
    [routeIds[2]]: [routeIds[1]],
    [raidId]: [townId],
  }

  // hub town
  mapData[townId] = {
    id: townId,
    name: region.town,
    type: 'town',
    region: regionId,
    description: `A quiet town in the ${region.name} region.`,
    connections: connections[townId],
    unlock: gen === 2 ? { championDefeated: true } : { battlesAtLocation: [{ locationId: prevRoute, count: 30 }] },
    unlockOrder: unlockOrder++,
    position: positions[townId],
    mart: {
      name: `${region.name} Mart`,
      items: [
        { itemId: 'pokeball' }, { itemId: 'greatball' }, { itemId: 'ultraball' },
        { itemId: 'repel' }, { itemId: 'honey' },
      ],
    },
    trainerCount: 3,
  }

  // wild routes (starters are rare finds on route 1)
  routeIds.forEach((routeId, routeIndex) => {
    const minLevel = clampLevel(base + routeIndex * 6),
      maxLevel = clampLevel(minLevel + 8),
      entries = chunks[routeIndex].map((s, idx) => ({
        speciesKey: s.key,
        weight: encounterWeight(s, idx),
        minLevel,
        maxLevel,
      }))
    if (routeIndex === 0)
      for (const key of starters)
        if (species[key]) entries.push({ speciesKey: key, weight: 1, minLevel, maxLevel })
    encounterData[routeId] = { name: `${region.name} Route ${routeIndex + 1}`, encounters: entries }
    mapData[routeId] = {
      id: routeId,
      name: `${region.name} Route ${routeIndex + 1}`,
      type: 'route',
      region: regionId,
      description: `A wild path in the ${region.name} region.`,
      routeKey: routeId,
      connections: connections[routeId],
      unlock: { requires: [routeIndex === 0 ? townId : routeIds[routeIndex - 1]] },
      unlockOrder: unlockOrder++,
      position: positions[routeId],
    }
  })

  // raid island (region legendaries)
  mapData[raidId] = {
    id: raidId,
    name: `${region.name} Raid Island`,
    type: 'raid',
    region: regionId,
    description: `A mysterious island where ${region.name}'s legendary Pokemon dwell.`,
    connections: connections[raidId],
    unlock: { requires: [routeIds[2]] },
    unlockOrder: unlockOrder++,
    position: positions[raidId],
  }

  // trainers
  const pool = all.slice(0, 12)
  trainerData[townId] = [0, 1, 2].map((i) => ({
    id: `${regionId}_${i + 1}`,
    name: `${region.name} Trainer ${i + 1}`,
    trainerClass: TRAINER_CLASSES[(gen * 3 + i) % TRAINER_CLASSES.length],
    team: makeTeam(pool, i * 2, 2, base + i * 2, 1),
  }))

  // gym leaders (region order gates them)
  const leaders = GYM_LEADERS[regionId],
    roster = wild.length ? wild : all
  leaders.forEach((name, i) => {
    gymData.push({
      id: `${regionId}-gym-${i + 1}`,
      name,
      title: `${region.name} Gym Leader`,
      region: regionId,
      locationKey: townId,
      badgeName: `${region.name} Badge ${i + 1}`,
      badgeColor: BADGE_COLORS[i % BADGE_COLORS.length],
      spriteKey: LEADER_SPRITES[(gen + i) % LEADER_SPRITES.length],
      team: makeTeam(roster, i * 3, 3, base + i * 3, 1),
    })
  })

  // elite four + champion
  ELITE_FOUR[regionId].forEach((name, i) => {
    e4Data.push({
      id: `${regionId}-e4-${i + 1}`,
      name,
      title: `${region.name} Elite Four`,
      region: regionId,
      spriteKey: 'acetrainer',
      team: makeTeam(roster, 24 + i * 4, 5, clampLevel(base + 28 + i * 2), 1),
    })
  })
  champData.push({
    id: `${regionId}-champion`,
    name: CHAMPIONS[regionId],
    title: `${region.name} Champion`,
    region: regionId,
    spriteKey: 'acetrainer',
    team: makeTeam(roster, 44, 6, clampLevel(base + 38), 1),
  })
}

write('regions.json', regions)
write('map-data.json', mapData)
write('encounter-data.json', encounterData)
write('trainer-data.json', trainerData)
write('gym-leader-data.json', gymData)
write('elite-4-data.json', e4Data)
write('champion-data.json', champData)

console.log(`regions: ${regions.length}`)
console.log(`locations: ${Object.keys(mapData).length}`)
console.log(`encounter buckets: ${Object.keys(encounterData).length}`)
console.log(`gyms: ${gymData.length} | elite4: ${e4Data.length} | champions: ${champData.length}`)
