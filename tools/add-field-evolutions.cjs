#!/usr/bin/env node
/**
 * Attach the location/biome/weather evolution gates to the species that evolve
 * somewhere rather than by level or item:
 *
 *   Eevee   -> Leafeon    Moss Rock    (forest biome)
 *   Eevee   -> Glaceon    Ice Rock     (tundra biome)
 *   Magneton-> Magnezone  Magnetic Field (cave biome, kept at Lv. 45)
 *   Nosepass-> Probopass  Magnetic Field (cave biome, kept at Lv. 35)
 *   Sliggoo -> Goodra     rain
 *   H-Sliggoo -> H-Goodra rain
 *
 * The gate is read by `fieldEvolutionMet` / `getEvolutionOptions` in the party
 * and box panels. Eevee's Leafeon/Glaceon entries drop their Leaf/Ice Stone
 * item so the field method is the one shown (the stones still evolve their
 * other species). Idempotent; safe to re-run after add-evolution-items.cjs.
 *
 * Writes public/data/evolution-data.json.
 *
 * Usage: node tools/add-field-evolutions.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DRY = process.argv.includes('--dry')
const DATA = path.join(__dirname, '../public/data')
const species = JSON.parse(fs.readFileSync(path.join(DATA, 'pokemon-species.json'), 'utf8'))
const evoPath = path.join(DATA, 'evolution-data.json')
const evolutionData = JSON.parse(fs.readFileSync(evoPath, 'utf8'))

/**
 * @type {{ from: string, into: string, gate: { location?: string, biome?: string, weather?: string, hint: string }, removeItem?: boolean }[]}
 */
const FIELD_EVOLUTIONS = [
  {
    from: 'eevee',
    into: 'leafeon',
    gate: { biome: 'forest', hint: 'Level up near a Moss Rock (forest)' },
    removeItem: true,
  },
  {
    from: 'eevee',
    into: 'glaceon',
    gate: { biome: 'tundra', hint: 'Level up near an Ice Rock (tundra)' },
    removeItem: true,
  },
  {
    from: 'magneton',
    into: 'magnezone',
    gate: { biome: 'cave', hint: 'Level up in a cave (Magnetic Field)' },
  },
  {
    from: 'nosepass',
    into: 'probopass',
    gate: { biome: 'cave', hint: 'Level up in a cave (Magnetic Field)' },
  },
  {
    from: 'sliggoo',
    into: 'goodra',
    gate: { weather: 'rain', hint: 'Level up while it is raining' },
  },
  {
    from: 'h-sliggoo',
    into: 'h-goodra',
    gate: { weather: 'rain', hint: 'Level up while it is raining' },
  },
]

let changed = 0

for (const { from, into, gate, removeItem } of FIELD_EVOLUTIONS) {
  if (!species[from] || !species[into]) {
    console.warn(`unknown species ${from} -> ${into}`)
    continue
  }
  const evolutions = evolutionData[from] ?? (evolutionData[from] = [])
  let evolution = evolutions.find((entry) => entry.into === into)
  if (!evolution) {
    evolution = { into }
    evolutions.push(evolution)
  }
  for (const [key, value] of Object.entries(gate)) {
    if (evolution[key] !== value) {
      evolution[key] = value
      changed++
    }
  }
  if (removeItem && evolution.item) {
    delete evolution.item
    changed++
  }
}

const output = JSON.stringify(evolutionData, null, 2) + '\n',
  current = fs.readFileSync(evoPath, 'utf8')
if (DRY) {
  console.log(`would write ${changed} field-evolution change(s)`)
  process.exit(0)
}
if (output !== current) fs.writeFileSync(evoPath, output)
console.log(`field evolutions: ${changed} change(s) ${changed ? 'applied' : 'already current'}`)
