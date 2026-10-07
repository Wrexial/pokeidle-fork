#!/usr/bin/env node
/**
 * Rebalance Paldea into one linear, level-smooth progression.
 *
 * Paldea is open-world, so `generate-regions.cjs` fell back to BFS depth for
 * its route order and laid no ordered badge gates (`badgeOrder: 'free'`). The
 * committed data ended up with:
 *
 * - the province zones opening out of order (North Province sat behind the
 *   seventh badge while North Province Area One is a Lv. 34 route),
 * - the gym towns gated on whichever nearby route they happened to touch, so
 *   Montenevera's Gym 6 and Zapapico's Gym 8 opened while the player was still
 *   in the Lv. 15-25 stretch,
 * - the ordinary areas `apply-ordinary-areas.cjs` inserted left at the Lv. 5
 *   fallback band (Alfornada Cavern, Glaseado Mountain, ...), dropping the
 *   curve back down after a high-level route.
 *
 * This pass mirrors the Victory Road gym order onto Paldea's geography: every
 * location gets a canonical `unlockOrder`, the zone hubs / gym towns / ordinary
 * areas are gated behind the previous badge plus a party level, and the
 * ordinary areas' wild levels are set to their place in the curve. The result
 * is a route that ramps 3 -> 75 with each gym fought in order.
 *
 * Idempotent. Run after `apply-ordinary-areas.cjs` (it patches those areas)
 * and before `generate-encounter-index.cjs`.
 *
 * Usage: node tools/apply-paldea-progression.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')

const DRY = process.argv.includes('--dry')

/**
 * The canonical route, in order. Towns, zone hubs, wild areas and the ordinary
 * landmarks are interleaved the way the player should meet them: the gym towns
 * follow the Victory Road order (Katy, Brassius, Iono, Kofu, Larry, Ryme,
 * Tulip, Grusha) and each wild area sits at the level it already carries.
 */
const ORDER = [
  'paldea-los-platos',
  'paldea-cabo-poco',
  'paldea-south-province',
  'paldea-south-province-area-one',
  'paldea-inlet-grotto',
  'paldea-south-province-area-three',
  'paldea-cortondo',
  'paldea-mesagoza',
  'paldea-south-province-area-two',
  'paldea-artazon',
  'paldea-west-province',
  'paldea-west-province-area-three',
  'paldea-west-province-area-one',
  'paldea-socarrat-trail',
  'paldea-porto-marinada',
  'paldea-east-province',
  'paldea-east-province-area-one',
  'paldea-levincia',
  'paldea-casseroya-lake',
  'paldea-cascarrafa',
  'paldea-north-province',
  'paldea-north-province-area-one',
  'paldea-south-province-area-four',
  'paldea-medali',
  'paldea-east-province-area-three',
  'paldea-south-province-area-six',
  'paldea-montenevera',
  'paldea-west-province-area-two',
  'paldea-alfornada-cavern',
  'paldea-gracia-stones',
  'paldea-alfornada',
  'paldea-north-province-area-two',
  'paldea-glaseado-mountain',
  'paldea-south-province-area-five',
  'paldea-dalizapa-passage',
  'paldea-north-province-area-three',
  'paldea-zapapico',
  'paldea-east-province-area-two',
  'paldea-raid',
  'paldea-league',
  'paldea-mossui-town',
  'paldea-kitakami',
  'paldea-kitakami-revelers-road',
  'paldea-kitakami-apple-hills',
  'paldea-kitakami-oni-mountain',
  'kitakami-wistful-fields',
  'kitakami-fellhorn-gorge',
  'kitakami-crystal-pool',
  'kitakami-timeless-woods',
  'kitakami-paradise-barrens',
  'kitakami-infernal-pass',
  'paldea-area-zero',
  'paldea-area-zero-gate',
  'paldea-area-zero-station-two',
  'paldea-area-zero-station-four',
  'paldea-area-zero-depths',
  'paldea-area-zero-station-one',
  'paldea-area-zero-station-three',
  'paldea-terarium',
  'paldea-terarium-savanna-biome',
  'paldea-terarium-coastal-biome',
  'paldea-terarium-polar-biome',
  'terarium-canyon-biome',
  'terarium-chargestone-cavern',
  'terarium-torchlit-labyrinth',
  'terarium-central-plaza',
]

/**
 * Province hubs: West and East have to be open by the second badge, North by
 * the fourth, so the sub-areas behind them line up with the gym levels.
 */
const HUB_GATES = {
  'paldea-west-province': { gymsRequired: ['paldea-gym-2'] },
  'paldea-east-province': { gymsRequired: ['paldea-gym-2'] },
  'paldea-north-province': { gymsRequired: ['paldea-gym-4'] },
}

/**
 * Gym towns and the other settlements. Each waits on the previous badge (so
 * the gyms are fought in order) and on the area the road runs through, with a
 * party level matching the gym's own band.
 */
const TOWN_GATES = {
  'paldea-cabo-poco': { requires: ['paldea-los-platos'] },
  'paldea-mesagoza': {
    requires: ['paldea-south-province-area-one'],
    battlesAtLocation: [{ locationId: 'paldea-south-province-area-one', count: 5 }],
    partyLevel: 5,
  },
  'paldea-cortondo': { requires: ['paldea-south-province-area-three'], partyLevel: 10 },
  'paldea-artazon': {
    requires: ['paldea-south-province-area-two'],
    gymsRequired: ['paldea-gym-1'],
    partyLevel: 15,
  },
  'paldea-levincia': {
    requires: ['paldea-east-province-area-one'],
    gymsRequired: ['paldea-gym-2'],
    partyLevel: 24,
  },
  'paldea-cascarrafa': {
    requires: ['paldea-socarrat-trail'],
    gymsRequired: ['paldea-gym-3'],
    partyLevel: 31,
  },
  'paldea-porto-marinada': { requires: ['paldea-west-province-area-one'], partyLevel: 25 },
  'paldea-medali': {
    requires: ['paldea-casseroya-lake'],
    gymsRequired: ['paldea-gym-4'],
    partyLevel: 39,
  },
  'paldea-montenevera': {
    requires: ['paldea-north-province-area-one'],
    gymsRequired: ['paldea-gym-5'],
    partyLevel: 46,
  },
  'paldea-alfornada': {
    requires: ['paldea-gracia-stones'],
    gymsRequired: ['paldea-gym-6'],
    partyLevel: 54,
  },
  'paldea-zapapico': {
    requires: ['paldea-dalizapa-passage'],
    gymsRequired: ['paldea-gym-7'],
    partyLevel: 61,
  },
}

/**
 * Ordinary landmarks the map scraper drops (`apply-ordinary-areas.cjs`). Each
 * waits on the area before it in the route and enters the curve at its own
 * level, instead of the Lv. 5 fallback band it was inserted with.
 */
const LANDMARK_GATES = {
  'paldea-inlet-grotto': {
    requires: ['paldea-south-province-area-one'],
    battlesAtLocation: [{ locationId: 'paldea-south-province-area-one', count: 3 }],
  },
  'paldea-socarrat-trail': { requires: ['paldea-west-province-area-one'], partyLevel: 25 },
  'paldea-casseroya-lake': { requires: ['paldea-cascarrafa'], partyLevel: 32 },
  'paldea-alfornada-cavern': { requires: ['paldea-south-province-area-four'], partyLevel: 53 },
  'paldea-gracia-stones': { requires: ['paldea-alfornada-cavern'], partyLevel: 55 },
  'paldea-glaseado-mountain': { requires: ['paldea-montenevera'], partyLevel: 58 },
  'paldea-dalizapa-passage': { requires: ['paldea-glaseado-mountain'], partyLevel: 63 },
}

/** The wild level band each ordinary area belongs at (min, max). */
const LANDMARK_LEVELS = {
  'paldea-inlet-grotto': [4, 6],
  'paldea-socarrat-trail': [27, 29],
  'paldea-casseroya-lake': [32, 34],
  'paldea-alfornada-cavern': [55, 57],
  'paldea-gracia-stones': [56, 58],
  'paldea-glaseado-mountain': [60, 62],
  'paldea-dalizapa-passage': [65, 67],
}

/**
 * Wild-area gate fixes. Most province sub-areas already ramp correctly inside
 * their zone; these three reference an area from much later in the game (the
 * last badge's town, or Alfornada's town) as their battle gate, which let the
 * high-level route open while the player was still low. They keep the zone
 * chain and gate on a party level from their own band instead. Everything else
 * is left as the generator wrote it.
 */
const WILD_GATE_FIXES = {
  'paldea-east-province-area-three': {
    requires: ['paldea-east-province', 'paldea-east-province-area-one'],
    partyLevel: 42,
  },
  'paldea-south-province-area-six': {
    requires: ['paldea-south-province', 'paldea-south-province-area-four'],
    partyLevel: 46,
  },
  'paldea-north-province-area-one': {
    requires: ['paldea-north-province'],
    partyLevel: 32,
  },
}

/** The league and Raid Island cap the region; Mossui starts the DLC. */
const ENDGAME_GATES = {
  'paldea-raid': {
    requires: ['paldea-east-province-area-two'],
    gymsRequired: ['paldea-gym-8'],
    partyLevel: 65,
  },
  'paldea-league': {
    requires: ['paldea-east-province-area-two'],
    badgesRequired: 8,
  },
  'paldea-mossui-town': {
    requires: ['paldea-north-province-area-three'],
    partyLevel: 66,
  },
}

const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))

const missing = ORDER.filter((id) => !mapData[id])
if (missing.length) {
  console.error(`Unknown Paldea locations: ${missing.join(', ')}`)
  process.exit(1)
}

let changed = 0

// --- canonical order --------------------------------------------------------
const ORDER_BASE = 910000
ORDER.forEach((id, index) => {
  const next = id === 'paldea-los-platos' ? 899999 : ORDER_BASE + index
  if (mapData[id].unlockOrder !== next) {
    mapData[id].unlockOrder = next
    changed++
  }
})

/**
 * Replace a location's unlock rule wholesale, keeping the entry flag where the
 * region relies on it.
 * @param {string} id
 * @param {Record<string, unknown>} rule
 */
function setUnlock(id, rule) {
  const location = mapData[id]
  if (!location) return
  const before = JSON.stringify(location.unlock ?? null),
    next = id === 'paldea-los-platos' ? { entry: true } : rule
  if (JSON.stringify(next) !== before) {
    location.unlock = next
    changed++
  }
}

for (const [id, rule] of Object.entries(HUB_GATES)) setUnlock(id, rule)
for (const [id, rule] of Object.entries(TOWN_GATES)) setUnlock(id, rule)
for (const [id, rule] of Object.entries(LANDMARK_GATES)) setUnlock(id, rule)
for (const [id, rule] of Object.entries(ENDGAME_GATES)) setUnlock(id, rule)
for (const [id, rule] of Object.entries(WILD_GATE_FIXES)) setUnlock(id, rule)

// --- ordinary area levels ---------------------------------------------------
for (const [id, [minLevel, maxLevel]] of Object.entries(LANDMARK_LEVELS)) {
  const bucket = encounterData[mapData[id]?.routeKey ?? id]
  if (!bucket?.encounters) {
    console.warn(`no encounter bucket for ${id}`)
    continue
  }
  for (const encounter of bucket.encounters) {
    if (encounter.minLevel !== minLevel || encounter.maxLevel !== maxLevel) {
      encounter.minLevel = minLevel
      encounter.maxLevel = maxLevel
      changed++
    }
  }
}

if (changed === 0) {
  console.log('Paldea progression already applied; nothing to do.')
  process.exit(0)
}
if (DRY) {
  console.log(`Would update ${changed} Paldea field(s).`)
  process.exit(0)
}

writeRegionDir(path.join(DATA, 'map-data'), mapData)
writeRegionDir(
  path.join(DATA, 'encounter-data'),
  encounterData,
  (key) => mapData[key]?.region ?? 'kanto'
)
console.log(`Paldea progression applied (${changed} field(s) updated).`)
