#!/usr/bin/env node
/**
 * Route field weather + day/night-gated wild spawns (#10).
 *
 * - A few thematically weather-struck routes carry a permanent `weather` field
 *   (Hoenn Route 119 rains, the deserts sandstorm, the snow routes snow), which
 *   `fieldWeatherFor` applies at the start of every battle there.
 * - Clearly nocturnal / diurnal species are tagged `time: "night"` / `"day"` on
 *   every route, so the day/night cycle changes what you find (the resolver
 *   falls back to the full table when a phase would be empty).
 *
 * Idempotent. Usage: node tools/apply-weather-time.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')

/** Permanent field weather per location. */
const WEATHER_LOCATIONS = {
  'hoenn-route-119': 'rain', // the rain-soaked route by the Weather Institute
  'hoenn-route-111': 'sandstorm', // the desert above Mauville
  'sinnoh-route-216': 'snow',
  'sinnoh-route-217': 'snow', // the blizzard route to Snowpoint
  'unova-route-4': 'sandstorm', // the desert outside Nimbasa
  'galar-route-10': 'snow', // the snowy climb to Wyndon
  'kalos-route-17': 'snow', // Mamoswine Road
}

/** Outdoor species that only show at night. */
const NOCTURNAL = new Set([
  'rattata', 'raticate', 'oddish', 'gloom', 'hoothoot', 'noctowl', 'spinarak', 'ariados',
  'murkrow', 'honchkrow', 'misdreavus', 'mismagius', 'houndour', 'houndoom', 'drifloon',
  'drifblim', 'duskull', 'dusclops', 'dusknoir', 'shuppet', 'banette', 'poochyena',
  'mightyena', 'shinx', 'luxio', 'purrloin', 'liepard', 'woobat', 'swoobat', 'venipede',
  'whirlipede', 'stunky', 'skuntank', 'noibat', 'noivern', 'pumpkaboo', 'gourgeist',
  'phantump', 'trevenant',
])

/** Outdoor species that only show by day. */
const DIURNAL = new Set([
  'pidgey', 'pidgeotto', 'pidgeot', 'spearow', 'fearow', 'caterpie', 'metapod', 'butterfree',
  'weedle', 'kakuna', 'beedrill', 'pikachu', 'pichu', 'sentret', 'furret', 'ledyba', 'ledian',
  'hoppip', 'skiploom', 'jumpluff', 'sunkern', 'sunflora', 'doduo', 'dodrio', 'buneary',
  'lopunny', 'bunnelby', 'diggersby', 'fletchling', 'fletchinder', 'talonflame',
])

const dry = process.argv.includes('--dry')
const mapDir = path.join(DATA, 'map-data')
const encounterDir = path.join(DATA, 'encounter-data')

let weatherCount = 0
for (const file of fs.readdirSync(mapDir)) {
  const map = JSON.parse(fs.readFileSync(path.join(mapDir, file), 'utf8'))
  let changed = false
  for (const [locationId, weather] of Object.entries(WEATHER_LOCATIONS)) {
    if (!map[locationId] || map[locationId].weather === weather) continue
    map[locationId].weather = weather
    changed = true
    weatherCount++
  }
  if (changed && !dry) fs.writeFileSync(path.join(mapDir, file), JSON.stringify(map, null, 1) + '\n')
}

let timeCount = 0
for (const file of fs.readdirSync(encounterDir)) {
  const buckets = JSON.parse(fs.readFileSync(path.join(encounterDir, file), 'utf8'))
  let changed = false
  for (const bucket of Object.values(buckets))
    for (const entry of bucket.encounters ?? []) {
      const time = NOCTURNAL.has(entry.speciesKey)
        ? 'night'
        : DIURNAL.has(entry.speciesKey)
          ? 'day'
          : null
      if (time && entry.time !== time) {
        entry.time = time
        changed = true
        timeCount++
      }
    }
  if (changed && !dry)
    fs.writeFileSync(path.join(encounterDir, file), JSON.stringify(buckets, null, 1) + '\n')
}

console.log(
  `${dry ? '(dry run) ' : ''}weather: ${weatherCount} locations, day/night: ${timeCount} entries`
)
