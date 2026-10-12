#!/usr/bin/env node
/**
 * Season-gated wild spawns (#78).
 *
 * Flags the clearly seasonal species on every route so the season changes what
 * you find: spring brings the flowering/plant Pokemon, summer the sun-baked
 * fire types, autumn the fungi and fallen-leaf crowd and winter the ice types.
 * `encountersForPhase` keeps the season-matching entries and falls back to the
 * phase's table when a season would leave a route empty, so a snow route never
 * goes silent in summer.
 *
 * Mirrors tools/apply-weather-time.cjs, which tags the day/night phase. The
 * species lists are duplicated there because this is a one-off data pass.
 * Idempotent. Usage: node tools/apply-seasons.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')

/** The species that only show in each season. */
const SEASONAL_SPECIES = {
  spring: [
    'cherubi', 'cherrim', 'budew', 'roselia', 'hoppip', 'skiploom', 'jumpluff',
    'sunkern', 'sunflora', 'combee', 'petilil', 'cottonee', 'flabebe', 'floette',
  ],
  summer: [
    'vulpix', 'growlithe', 'ponyta', 'rapidash', 'numel', 'camerupt', 'torkoal',
    'tropius', 'exeggcute', 'castform', 'solrock', 'helioptile',
  ],
  autumn: [
    'foongus', 'amoonguss', 'shroomish', 'morelull', 'shiinotic', 'pumpkaboo',
    'phantump', 'trevenant', 'paras', 'parasect', 'seedot',
  ],
  winter: [
    'snover', 'abomasnow', 'swinub', 'piloswine', 'vanillite', 'vanillish',
    'vanilluxe', 'cubchoo', 'beartic', 'cryogonal', 'bergmite', 'snom',
    'sneasel', 'snorunt', 'glalie', 'froslass',
  ],
}

const SEASON_BY_SPECIES = new Map()
for (const [season, species] of Object.entries(SEASONAL_SPECIES))
  for (const key of species) SEASON_BY_SPECIES.set(key, season)

// Species a route-exclusive `caughtOnRoute` gate asks for must never be season-
// locked, or the gate could become impossible outside its season.
const protectedSpecies = new Set()
const mapDir = path.join(DATA, 'map-data')
for (const file of fs.readdirSync(mapDir)) {
  const map = JSON.parse(fs.readFileSync(path.join(mapDir, file), 'utf8'))
  for (const location of Object.values(map))
    for (const key of location.unlock?.caughtOnRoute?.species ?? []) protectedSpecies.add(key)
}

const dry = process.argv.includes('--dry')
const encounterDir = path.join(DATA, 'encounter-data')

let tagged = 0,
  cleared = 0
for (const file of fs.readdirSync(encounterDir)) {
  const buckets = JSON.parse(fs.readFileSync(path.join(encounterDir, file), 'utf8'))
  let changed = false
  for (const bucket of Object.values(buckets))
    for (const entry of bucket.encounters ?? []) {
      const season = protectedSpecies.has(entry.speciesKey)
        ? undefined
        : SEASON_BY_SPECIES.get(entry.speciesKey)
      if (season && entry.season !== season) {
        entry.season = season
        changed = true
        tagged++
      } else if (!season && entry.season) {
        // Keep the pass idempotent when a species is dropped from the lists.
        delete entry.season
        changed = true
        cleared++
      }
    }
  if (changed && !dry)
    fs.writeFileSync(path.join(encounterDir, file), JSON.stringify(buckets, null, 1) + '\n')
}

console.log(
  `${dry ? '(dry run) ' : ''}season: ${tagged} entries tagged${cleared ? `, ${cleared} cleared` : ''}`
)
