/**
 * One-off data pass (#76): add Hisui to Sinnoh as a post-game `type: 'zone'`
 * hub gated on the Sinnoh Champion, with its five areas as hidden sub-areas
 * (each with its own wild table). Mirrors the generator's zone shape so the
 * focused Town Map view and the unlock plumbing just work.
 *
 * Idempotent: no-op once the `hisui` hub exists. Re-run
 * `tools/apply-zone-layout.cjs` and `tools/generate-encounter-index.cjs` after.
 *
 * Usage: node tools/add-hisui-zone.cjs [--dry]
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MAP_PATH = path.join(ROOT, 'public', 'data', 'map-data', 'sinnoh.json')
const ENCOUNTER_PATH = path.join(ROOT, 'public', 'data', 'encounter-data', 'sinnoh.json')
const SPECIES_PATH = path.join(ROOT, 'public', 'data', 'pokemon-species.json')

const DRY = process.argv.includes('--dry')

const HUB_ID = 'hisui'
const LEVEL_MIN = 68
const LEVEL_MAX = 72

/** Hisui's five areas, in unlock order. */
const AREAS = [
  {
    id: 'hisui-obsidian-fieldlands',
    name: 'Obsidian Fieldlands',
    biome: 'grassland',
    background: '/backgrounds/grassland.webp',
    position: { x: 85, y: 9 },
    description: 'Wide grasslands and a lake, the first area of Hisui.',
    land: ['starly', 'bidoof', 'shinx', 'kricketot', 'budew', 'h-growlithe', 'wurmple', 'ponyta', 'eevee', 'zubat', 'mimeJR', 'h-voltorb', 'combee', 'drifloon', 'buneary'],
  },
  {
    id: 'hisui-crimson-mirelands',
    name: 'Crimson Mirelands',
    biome: 'swamp',
    background: '/backgrounds/swamp.webp',
    position: { x: 92, y: 6 },
    description: 'A marshy lowland of bogs and old ruins.',
    land: ['bidoof', 'budew', 'psyduck', 'h-qwilfish', 'croagunk', 'carnivine', 'skorupi', 'tangela', 'yanma', 'paras', 'h-sneasel', 'ralts', 'shellos', 'wooper', 'hippopotas'],
  },
  {
    id: 'hisui-cobalt-coastlands',
    name: 'Cobalt Coastlands',
    biome: 'coast',
    background: '/backgrounds/beach.webp',
    position: { x: 99, y: 13 },
    description: 'Windy beaches and a chain of islands.',
    land: ['spheal', 'shellos', 'buizel', 'remoraid', 'mantyke', 'finneon', 'tentacool', 'qwilfish', 'chatot', 'wailmer', 'piplup', 'magikarp', 'gastly', 'swinub', 'sealeo'],
  },
  {
    id: 'hisui-coronet-highlands',
    name: 'Coronet Highlands',
    biome: 'mountain',
    background: '/backgrounds/mountain.webp',
    position: { x: 97, y: 22 },
    description: 'The rugged slopes around Mount Coronet.',
    land: ['machop', 'geodude', 'bronzor', 'riolu', 'h-sneasel', 'nosepass', 'meditite', 'chingling', 'h-braviary', 'onix', 'h-sliggoo', 'gible', 'absol', 'duskull'],
  },
  {
    id: 'hisui-alabaster-icelands',
    name: 'Alabaster Icelands',
    biome: 'tundra',
    background: '/backgrounds/tundra.webp',
    position: { x: 87, y: 22 },
    description: 'A frozen expanse of snowfields and ice caves.',
    land: ['snorunt', 'snover', 'swinub', 'bergmite', 'h-avalugg', 'h-zoroark', 'gabite', 'vulpix', 'sneasel', 'glalie', 'froslass', 'h-decidueye', 'zubat', 'h-samurott'],
  },
]

/** @param {string[]} table */
function toEncounters(table) {
  // A flat weight so every listed species has an equal chance.
  return table.map((speciesKey) => ({
    speciesKey,
    weight: 10,
    minLevel: LEVEL_MIN,
    maxLevel: LEVEL_MAX,
  }))
}

function main() {
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))
  if (map[HUB_ID]) {
    console.log('hisui zone already present — nothing to do')
    return
  }
  const species = JSON.parse(fs.readFileSync(SPECIES_PATH, 'utf8'))
  const encounters = JSON.parse(fs.readFileSync(ENCOUNTER_PATH, 'utf8'))

  // Validate every species key before writing anything.
  const missing = AREAS.flatMap((area) => area.land.filter((key) => !species[key]))
  if (missing.length) throw new Error(`unknown species: ${[...new Set(missing)].join(', ')}`)

  const link = 'sinnoh-league'
  if (!map[link]) throw new Error(`missing connection target ${link}`)

  map[HUB_ID] = {
    id: HUB_ID,
    name: 'Hisui',
    type: 'zone',
    region: 'sinnoh',
    description: 'Ancient Sinnoh, reached through a rift in time once the Sinnoh Champion is beaten.',
    routeKey: AREAS[0].id,
    background: '/backgrounds/grassland.webp',
    biome: 'grassland',
    connections: [link, ...AREAS.map((area) => area.id)],
    unlock: { championDefeated: 'sinnoh' },
    unlockOrder: 900100,
    position: { x: 93, y: 15 },
    subAreas: AREAS.map((area) => ({ id: area.id, name: area.name })),
  }
  if (!map[link].connections.includes(HUB_ID)) map[link].connections.push(HUB_ID)

  AREAS.forEach((area, index) => {
    map[area.id] = {
      id: area.id,
      name: area.name,
      type: 'route',
      region: 'sinnoh',
      description: area.description,
      routeKey: area.id,
      background: area.background,
      biome: area.biome,
      connections: [HUB_ID],
      unlock: { requires: index === 0 ? [HUB_ID] : [HUB_ID, AREAS[index - 1].id] },
      unlockOrder: 900101 + index,
      position: area.position,
      hidden: true,
      zone: HUB_ID,
    }
    encounters[area.id] = {
      name: area.name,
      encounters: toEncounters(area.land),
    }
  })

  if (DRY) {
    console.log(`[dry] would add the Hisui hub + ${AREAS.length} areas`)
    return
  }
  // The data files use a one-space indent; match it so the diff stays scoped.
  fs.writeFileSync(MAP_PATH, `${JSON.stringify(map, null, 1)}\n`)
  fs.writeFileSync(ENCOUNTER_PATH, `${JSON.stringify(encounters, null, 1)}\n`)
  console.log(`added the Hisui zone with ${AREAS.length} areas`)
}

main()
