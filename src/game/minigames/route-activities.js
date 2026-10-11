// Route-attached minigames. Unlike the fixed minigames in registry.js (one
// unique POI each), these are available wherever the terrain fits: fishing on a
// curated set of water-rich routes, foraging on land routes. Both resolve
// through the route's own encounter table so they stay consistent with normal
// wild battles.

import { encounterData, pokemonSpecies } from '../../data/gameData.js'
import { doubleSpawnChance } from '../../data/config.js'
import { consumableItems, evolutionItems, fossilItems, heldItems, valuableDropTable } from '../../data/items.js'
import { isCaveLocation, isWaterLocation } from '../catching.js'
import { HUNT_ENCOUNTER_MULTIPLIER, huntMatchesSpecies } from '../hunt.js'
import { rollWildHeldItem } from '../held-items.js'
import { monotypeSpeciesPool, speciesHasType } from '../pokemon.js'
import { DEFAULT_ROD, rodForId } from './rods.js'
import { FISHING_LOCATIONS, routeHasWaterSpecies } from './fishing.js'

/** How many attempts (casts/searches) a visit gives. */
export const ACTIVITY_ATTEMPTS = 3

/** How long one there-and-back sweep of the timing marker takes, in ms. */
export const ACTIVITY_SWEEP_MS = 1600

/** How long a held charge takes to fill from empty to full, in ms. */
export const ACTIVITY_CHARGE_MS = 900

/** Distance from the centre (in 0..1 units) that still lands a hit. */
export const ACTIVITY_HIT_ZONE = 0.28

/** Distance from the centre that lands a perfect hit. */
export const ACTIVITY_PERFECT_ZONE = 0.14

/** Distance from the centre that lands a bullseye (the best shiny/level bonus). */
export const ACTIVITY_ULTRA_ZONE = 0.055

/**
 * Weight kept for the common half of a route's matching species on a perfect
 * activity hit. A perfect hit should *bias* toward the rare half, not exclude
 * the common one: a route with only two matching species would otherwise
 * always give the same one, and an AUTO field job would bank that species
 * forever.
 */
export const ACTIVITY_PERFECT_COMMON_WEIGHT = 0.2

/**
 * Route activities. `mode` picks the outcome: `encounter` starts a normal wild
 * battle from the route's table, `loot` pays out items and money. `display`
 * picks the interaction, and every activity has its own so none of them look
 * or play alike: `bar` (sweep and stop), `rings` (closing ring), `mash`
 * (rapid taps), `charge` (hold and release), `depth` (vertical sweep), `net`
 * (reaction tap), `grip` (balanced hold) and `dig` (hidden grid).
 * @type {Record<string, {
 *   id: string, title: string, action: string, icon: string, hint: string,
 *   mode: 'encounter' | 'loot',
 *   display: 'bar' | 'rings' | 'mash' | 'charge' | 'depth' | 'net' | 'grip' | 'dig' |
 *     'stoke' | 'circuit' | 'runes' | 'soar',
 *   condition?: { time?: 'day' | 'night', weather?: string[] },
 *   preferTypes?: string[], encounterChance?: number, perfectEncounterChance?: number,
 *   deepWater?: boolean, propIcon?: string,
 * }>}
 */
export const ROUTE_ACTIVITIES = {
  fishing: {
    id: 'fishing',
    title: 'Fishing',
    action: 'CAST LINE',
    icon: '\u{1f3a3}',
    hint: 'Cast into the water and reel in on the sweet spot to hook a Water Pokemon. A perfect cast in the tiny centre boosts the shiny odds and level.',
    mode: 'encounter',
    display: 'bar',
    condition: { weather: ['rain', 'heavyRain'] },
    preferTypes: ['Water'],
  },
  forage: {
    id: 'forage',
    title: 'Berry Foraging',
    action: 'SEARCH',
    icon: '\u{1fab0}',
    hint: 'Time the ring as it closes on the centre to find berries and supplies. A perfect search fills the basket, and a berry combo grows the longer you keep landing them; now and then a Grass, Poison or Fairy Pokemon is hiding in the bush.',
    mode: 'loot',
    display: 'rings',
    condition: { time: 'day' },
    preferTypes: ['Grass', 'Poison', 'Fairy'],
    // A successful search can flush out a hidden Grass-type instead of loot.
    encounterChance: 0.3,
    perfectEncounterChance: 0.6,
  },
  rockSmash: {
    id: 'rockSmash',
    title: 'Rock Smash',
    action: 'SMASH',
    icon: '\u{1faa8}',
    hint: 'Mash the cracked boulder to shatter it open \u2014 the harder you smash, the better the Pokemon shaken loose, and a clean break can crack out a gem, or rarely a fossil.',
    mode: 'encounter',
    display: 'mash',
    preferTypes: ['Rock', 'Ground', 'Steel', 'Ice', 'Fighting'],
  },
  headbutt: {
    id: 'headbutt',
    title: 'Headbutt',
    action: 'HEADBUTT',
    icon: '\u{1f333}',
    hint: 'Hold one of the three trees to charge your headbutt, then let go in the sweet spot to shake loose the Normal and Flying Pokemon roosting in it.',
    mode: 'encounter',
    display: 'charge',
    condition: { time: 'day' },
    preferTypes: ['Normal', 'Flying'],
  },
  diving: {
    id: 'diving',
    title: 'Diving',
    action: 'DIVE',
    icon: '\u{1f93f}',
    hint: 'Dive under the surface to reach the deeper Water and Ice Pokemon that fishing cannot \u2014 a perfect dive can uncover sunken treasure.',
    mode: 'encounter',
    display: 'depth',
    preferTypes: ['Water', 'Ice'],
    // Diving skips the fishing-rod gate and reaches the rarer, deeper species.
    deepWater: true,
  },
  bugCatch: {
    id: 'bugCatch',
    title: 'Bug Catching',
    action: 'SWEEP NET',
    icon: '\u{1f98b}',
    hint: 'A Bug darts out of the undergrowth \u2014 sweep your net over it before it flits away. A quicker catch turns up a rarer bug, or one carrying an item.',
    mode: 'encounter',
    display: 'net',
    condition: { time: 'day' },
    preferTypes: ['Bug'],
    propIcon: '\u{1f41b}',
  },
  climb: {
    id: 'climb',
    title: 'Rock Climbing',
    action: 'CLIMB',
    icon: '\u{1f9d7}',
    hint: 'Hold to haul yourself up the cliff and release to steady \u2014 keep the climber on the ledge band as the grip meter fills to reach the Rock, Ground, Flying and Fighting Pokemon nesting overhead.',
    mode: 'encounter',
    display: 'grip',
    preferTypes: ['Rock', 'Ground', 'Flying', 'Fighting'],
    propIcon: '\u26f0\ufe0f',
  },
  prospecting: {
    id: 'prospecting',
    title: 'Prospecting',
    action: 'DIG',
    icon: '\u26cf\ufe0f',
    hint: 'Dig the relics out of the buried grid \u2014 the fewer holes it takes to strike treasure, the richer the haul, and a clean dig can unearth an ancient fossil.',
    mode: 'loot',
    display: 'dig',
  },
  kindle: {
    id: 'kindle',
    title: 'Campfire',
    action: 'STOKE',
    icon: '\u{1f525}',
    hint: 'Add a log to raise the blaze \u2014 the higher it burns, the better the Fire Pokemon it draws, but every log risks a flare-over. Bank the fire before it flares to keep what you have built.',
    mode: 'encounter',
    display: 'stoke',
    condition: { time: 'night' },
    preferTypes: ['Fire'],
  },
  overcharge: {
    id: 'overcharge',
    title: 'Overcharge',
    action: 'DISCHARGE',
    icon: '\u26a1',
    hint: 'Time your discharge for the moment the spark crosses the contact \u2014 clean hits pull the Electric Pokemon out of the wiring.',
    mode: 'encounter',
    display: 'circuit',
    condition: { weather: ['rain', 'heavyRain'] },
    preferTypes: ['Electric'],
  },
  seance: {
    id: 'seance',
    title: 'S\u00e9ance',
    action: 'ATTUNE',
    icon: '\u{1f52e}',
    hint: 'Watch the runes light in order, then repeat the pattern \u2014 a clean reading draws out the Psychic, Ghost and Dark Pokemon lingering nearby.',
    mode: 'encounter',
    display: 'runes',
    condition: { time: 'night' },
    preferTypes: ['Psychic', 'Ghost', 'Dark'],
  },
  summit: {
    id: 'summit',
    title: 'Summit Roost',
    action: 'SOAR',
    icon: '\u{1f409}',
    hint: 'Tap to flap up the cliff, spending your stamina, and reach the Dragon roost at the top before the thermal dies \u2014 the more stamina you have left, the better the Pokemon waiting there.',
    mode: 'encounter',
    display: 'soar',
    condition: { time: 'day' },
    preferTypes: ['Dragon'],
  },
}

/**
 * Short "how to play" steps for each route activity, shown the first time it
 * is started (and reopenable from its location card). Keyed by activity id.
 * @type {Record<string, string[]>}
 */
export const ROUTE_ACTIVITY_TUTORIALS = {
  fishing: [
    'Tap CAST LINE to sweep the marker, then tap again to stop it on the sweet spot.',
    'The tiny centre is a bullseye: a better hit means a higher level and better shiny odds.',
    'A rare fish needs a second, perfect reel before it is yours.',
  ],
  forage: [
    'Tap SEARCH to close the ring, then tap when it meets the target ring.',
    'A perfect search fills the basket with berries and grows a berry combo.',
    'A miss resets the combo, and now and then a Pokemon is hiding in the bush.',
  ],
  rockSmash: [
    'Tap the boulder to start the timer, then mash it as fast as you can.',
    'More taps before the timer drains means a better hit.',
    'A clean break can crack out a gem, or rarely a fossil.',
  ],
  headbutt: [
    'Press and hold a tree to charge the headbutt.',
    'Let go in the sweet spot to shake a Pokemon loose.',
    'Sometimes two fall out at once, and you choose one.',
  ],
  diving: [
    'Tap DIVE to sweep the marker down the gauge.',
    'Stop it on the sweet spot to reach the deeper Pokemon.',
    'A clean dive can also uncover sunken treasure.',
  ],
  bugCatch: [
    'A bug darts out of one of the bushes.',
    'Tap it before it flits away.',
    'The quicker the catch, the better the reward.',
  ],
  climb: [
    'Press and hold to pull the climber up, release to let it drop.',
    'Keep it on the green ledge band as the grip meter fills.',
    'A steadier climb reaches stronger Pokemon.',
  ],
  prospecting: [
    'Tap a hole to dig for buried relics.',
    'The fewer holes it takes to strike treasure, the richer the haul.',
    `You have three holes before the dig is a miss, and a clean dig can find a fossil.`,
  ],
  kindle: [
    'Tap ADD A LOG to stoke the fire higher.',
    'Every log raises the blaze but also the chance it flares over, which costs you the last log.',
    'Tap BANK to keep your blaze, or push on to the max for the best find.',
  ],
  overcharge: [
    'A spark orbits the coil.',
    'Tap DISCHARGE the instant it crosses the contact at the top.',
    'Three well-timed sparks make a clean round.',
  ],
  seance: [
    'Watch the runes light in order.',
    'When they stop, tap the same runes back in the same order.',
    'A clean reading draws out rarer Pokemon.',
  ],
  summit: [
    'Tap FLAP to beat your wings and rise; gravity pulls you back down.',
    'Every flap spends stamina, so time your taps instead of mashing.',
    'Reach the roost at the top before the stamina or the thermal runs out \u2014 the more stamina left, the better the find.',
  ],
}

/**
 * Whether a route's table holds at least one species of one of `types`.
 * @param {string} routeKey
 * @param {string[]} types
 * @returns {boolean}
 */
function routeHasType(routeKey, types) {
  return (encounterData[routeKey]?.encounters ?? []).some((entry) =>
    types.some((type) => pokemonSpecies[entry.speciesKey]?.types?.includes(type))
  )
}

/** Biomes that are overgrown enough to forage for berries and supplies. */
const FORAGE_BIOMES = new Set(['grassland', 'forest', 'autumn', 'swamp'])

/**
 * Whether a location is overgrown enough to forage.
 * @param {MapLocation | undefined} location
 * @returns {boolean}
 */
function isForageLocation(location) {
  if (!location || isWaterLocation(location) || isCaveLocation(location)) return false
  if (location.biome && FORAGE_BIOMES.has(location.biome)) return true
  const name = location.name ?? ''
  return (
    location.background === '/backgrounds/grassland.webp' ||
    /forest|woods|grove|park|meadow|garden|tangle|jungle|safari|plain|prairie|field/i.test(name)
  )
}

/** Biomes with cliffs worth climbing. */
const CLIMB_BIOMES = new Set(['mountain', 'volcanic'])

/**
 * Whether a location has cliff faces to climb.
 * @param {MapLocation | undefined} location
 * @returns {boolean}
 */
function isClimbLocation(location) {
  if (!location || isWaterLocation(location)) return false
  if (location.biome && CLIMB_BIOMES.has(location.biome)) return true
  return /\bmt\b|mt\.|mount|peak|summit|highland|ridge|cliff|gorge|canyon|volcan|crater/i.test(
    location.name ?? ''
  )
}

/** Biomes worth digging for buried relics. */
const PROSPECT_BIOMES = new Set([
  'cave',
  'ruins',
  'desert',
  'volcanic',
  'mountain',
  'tundra',
])

/**
 * Whether a location has ground worth prospecting (digging) in.
 * @param {MapLocation | undefined} location
 * @returns {boolean}
 */
function isProspectLocation(location) {
  if (!location || isWaterLocation(location)) return false
  if (location.biome && PROSPECT_BIOMES.has(location.biome)) return true
  return /cave|cavern|tunnel|mine|grotto|ruins|tower|temple|shrine|catacomb|desert|sand|dune|wasteland|\bmt\b|mt\.|mount|peak|summit|volcan|glacier|icefall/i.test(
    location.name ?? ''
  )
}

/** Biomes dry or hot enough to light a campfire in. */
const KINDLE_BIOMES = new Set(['volcanic', 'desert', 'cave', 'ruins', 'mountain'])

/**
 * Whether a location is dry enough to light a campfire.
 * @param {MapLocation | undefined} location
 * @returns {boolean}
 */
function isKindleLocation(location) {
  if (!location || isWaterLocation(location)) return false
  if (location.biome && KINDLE_BIOMES.has(location.biome)) return true
  return /volcan|crater|ember|cinder|ash|magma|caldera|desert|sand|dune|furnace|forge|kiln|pyre|blaze|hot spring/i.test(
    location.name ?? ''
  )
}

/** Biomes where wiring or machinery can be overcharged. */
const OVERCHARGE_BIOMES = new Set(['cave', 'ruins', 'desert', 'mountain'])

/**
 * Whether a location has wiring or machinery to overcharge.
 * @param {MapLocation | undefined} location
 * @returns {boolean}
 */
function isOverchargeLocation(location) {
  if (!location || isWaterLocation(location)) return false
  if (location.biome && OVERCHARGE_BIOMES.has(location.biome)) return true
  return /power|plant|factory|generator|substation|reactor|lab|tower|magnet|circuit|grid|works|mill|spark|electr/i.test(
    location.name ?? ''
  )
}

/** Biomes where the veil is thin enough for a s\u00e9ance. */
const SEANCE_BIOMES = new Set(['ruins', 'cave', 'forest', 'autumn', 'swamp'])

/**
 * Whether a location is eerie enough for a s\u00e9ance.
 * @param {MapLocation | undefined} location
 * @returns {boolean}
 */
function isSeanceLocation(location) {
  if (!location || isWaterLocation(location)) return false
  if (location.biome && SEANCE_BIOMES.has(location.biome)) return true
  return /ruin|temple|shrine|tower|catacomb|grave|cemetery|spirit|haunt|shadow|forest|wood|grove|tangle|marsh|bog/i.test(
    location.name ?? ''
  )
}

/** Biomes high or steep enough to ride a thermal. */
const SUMMIT_BIOMES = new Set(['mountain', 'volcanic', 'ruins', 'cave'])

/**
 * Whether a location has a high roost to soar to.
 * @param {MapLocation | undefined} location
 * @returns {boolean}
 */
function isSummitLocation(location) {
  if (!location || isWaterLocation(location)) return false
  if (location.biome && SUMMIT_BIOMES.has(location.biome)) return true
  return /\bmt\b|mt\.|mount|peak|summit|highland|ridge|canyon|gorge|dragon|den|spire|tower|crater|sky/i.test(
    location.name ?? ''
  )
}

/**
 * The route activities available at a location.
 * @param {MapLocation | undefined} location
 * @returns {string[]}
 */
export function routeActivityIds(location) {
  if (!location || !encounterData[location.routeKey ?? '']) return []
  const routeKey = location.routeKey ?? ''
  /** @type {string[]} */
  const ids = []
  // Water
  if (FISHING_LOCATIONS.has(location.id) && routeHasWaterSpecies(routeKey)) ids.push('fishing')
  if (isWaterLocation(location) && routeHasType(routeKey, ['Water', 'Ice'])) ids.push('diving')
  // Overgrown land
  if (isForageLocation(location)) ids.push('forage')
  if (isForageLocation(location) && routeHasType(routeKey, ['Bug'])) ids.push('bugCatch')
  if (isForageLocation(location) && routeHasType(routeKey, ['Normal', 'Flying']))
    ids.push('headbutt')
  // Rock and underground
  if (isCaveLocation(location) && routeHasType(routeKey, ['Rock', 'Ground', 'Steel', 'Ice', 'Fighting']))
    ids.push('rockSmash')
  if (isClimbLocation(location) && routeHasType(routeKey, ['Rock', 'Ground', 'Flying', 'Fighting']))
    ids.push('climb')
  if (isProspectLocation(location)) ids.push('prospecting')
  // Elemental and psychic landmarks
  if (isKindleLocation(location) && routeHasType(routeKey, ['Fire'])) ids.push('kindle')
  if (isOverchargeLocation(location) && routeHasType(routeKey, ['Electric']))
    ids.push('overcharge')
  if (isSeanceLocation(location) && routeHasType(routeKey, ['Psychic', 'Ghost', 'Dark']))
    ids.push('seance')
  if (isSummitLocation(location) && routeHasType(routeKey, ['Dragon'])) ids.push('summit')
  return ids
}

/** Level bonus an activity encounter gets, by hit quality. */
export const ACTIVITY_LEVEL_BONUS = { hit: 2, perfect: 4, ultra: 6 }

/** Shiny-odds multiplier an activity encounter gets, by hit quality. */
export const ACTIVITY_SHINY_MULTIPLIER = { hit: 2, perfect: 3, ultra: 4 }

/** Chance a hit / perfect / ultra encounter is holding an item. */
const ACTIVITY_HELD_ITEM_CHANCE = { hit: 0.25, perfect: 0.6, ultra: 1 }

/** Base chance a fishing cast gets a bite. */
export const ACTIVITY_BITE_CHANCE = 0.6

/**
 * The chance a fishing cast gets a bite. Suction Cups and Sticky Hold keep the
 * line steady and add 25%.
 * @param {string | null | undefined} ability
 * @returns {number}
 */
export function activityBiteChance(ability) {
  const bonus = ability === 'suctionCups' || ability === 'stickyHold' ? 0.25 : 0
  return Math.min(1, ACTIVITY_BITE_CHANCE + bonus)
}

/**
 * @param {'hit' | 'perfect' | 'ultra'} quality
 * @returns {number}
 */
export function activityLevelBonus(quality) {
  return ACTIVITY_LEVEL_BONUS[quality] ?? ACTIVITY_LEVEL_BONUS.hit
}

/**
 * @param {'hit' | 'perfect' | 'ultra'} quality
 * @returns {number}
 */
export function activityShinyMultiplier(quality) {
  return ACTIVITY_SHINY_MULTIPLIER[quality] ?? 1
}

/**
 * Grade a distance from the sweet spot shared by the sweep interactions
 * (fishing's bar, foraging's ring, diving's depth gauge). A bullseye is the
 * tightest centre, then a perfect hit, then the wider hit zone; anything
 * outside that is a miss (`null`).
 * @param {number} distance Distance from the 0.5 sweet spot.
 * @returns {'hit' | 'perfect' | 'ultra' | null}
 */
export function activityQualityForDistance(distance) {
  if (distance <= ACTIVITY_ULTRA_ZONE) return 'ultra'
  if (distance <= ACTIVITY_PERFECT_ZONE) return 'perfect'
  if (distance <= ACTIVITY_HIT_ZONE) return 'hit'
  return null
}

/** How long a rock-smash mash window stays open, in ms. */
export const ACTIVITY_MASH_MS = 1600

/** Taps needed inside the mash window for each hit quality. */
export const ACTIVITY_MASH_TAPS = { hit: 3, perfect: 6, ultra: 10 }

/**
 * Grade how hard a boulder was mashed.
 * @param {number} taps
 * @returns {'hit' | 'perfect' | 'ultra' | null}
 */
export function activityMashQuality(taps) {
  if (taps >= ACTIVITY_MASH_TAPS.ultra) return 'ultra'
  if (taps >= ACTIVITY_MASH_TAPS.perfect) return 'perfect'
  if (taps >= ACTIVITY_MASH_TAPS.hit) return 'hit'
  return null
}

/** How long a bug stays out before it flits away, in ms. */
export const ACTIVITY_BUG_FLEE_MS = 1800

/** How many bushes a bug can dart out of in a sweep. */
export const ACTIVITY_BUG_SPOTS = 5

/** Reaction time (ms) that still lands each hit quality. */
export const ACTIVITY_BUG_REACTION = { ultra: 380, perfect: 750, hit: 1300 }

/**
 * Grade how quickly the net met the bug.
 * @param {number} elapsedMs Time between the bug appearing and the sweep.
 * @returns {'hit' | 'perfect' | 'ultra' | null}
 */
export function activityBugQuality(elapsedMs) {
  if (elapsedMs <= ACTIVITY_BUG_REACTION.ultra) return 'ultra'
  if (elapsedMs <= ACTIVITY_BUG_REACTION.perfect) return 'perfect'
  if (elapsedMs <= ACTIVITY_BUG_REACTION.hit) return 'hit'
  return null
}

/** How long the climber must hang on before the attempt resolves, in ms. */
export const ACTIVITY_GRIP_MS = 2200

/** Where the ledge band sits on the cliff (0 = top, 1 = bottom). */
export const ACTIVITY_GRIP_CENTER = 0.5

/** How wide the ledge band is, in 0..1 cliff units. */
export const ACTIVITY_GRIP_BAND = 0.24

/**
 * Grade how steadily the climber held the ledge band.
 * @param {number} ratio Fraction of the climb spent inside the band.
 * @returns {'hit' | 'perfect' | 'ultra' | null}
 */
export function activityGripQuality(ratio) {
  if (ratio >= 0.45) return 'ultra'
  if (ratio >= 0.28) return 'perfect'
  if (ratio >= 0.1) return 'hit'
  return null
}

/** The prospecting grid is this many cells square. */
export const ACTIVITY_DIG_SIZE = 3

/** Holes that can be dug before a prospecting attempt misses. */
export const ACTIVITY_DIG_TRIES = 3

/**
 * Grade a prospecting dig by how few holes it took to strike treasure.
 * @param {number} tries
 * @returns {'hit' | 'perfect' | 'ultra'}
 */
export function activityDigQuality(tries) {
  if (tries <= 1) return 'ultra'
  if (tries === 2) return 'perfect'
  return 'hit'
}

/** Blaze a log adds, the flare-over risk it carries, and the max blaze. */
export const ACTIVITY_STOKE = { step: 1, flareRisk: 0.1, max: 8 }

/**
 * Grade a campfire attempt: the blaze you banked, or one log less if it flared
 * over before you could bank it.
 * @param {number} blaze
 * @param {boolean} [flared]
 * @returns {'hit' | 'perfect' | 'ultra' | null}
 */
export function activityStokeQuality(blaze, flared = false) {
  const level = flared ? blaze - ACTIVITY_STOKE.step : blaze
  if (level >= ACTIVITY_STOKE.max) return 'ultra'
  if (level >= 6) return 'perfect'
  if (level >= 3) return 'hit'
  return null
}

/** Sparks that make up one overcharge round. */
export const ACTIVITY_CIRCUIT_SPARKS = 3

/** How long one spark takes to orbit the coil, in ms. */
export const ACTIVITY_CIRCUIT_MS = 1080

/**
 * Grade an overcharge round by the average score of its timed sparks, where
 * each spark scores 3 (bullseye), 2 (perfect), 1 (hit) or 0 (miss).
 * @param {number} average
 * @returns {'hit' | 'perfect' | 'ultra' | null}
 */
export function activityCircuitQuality(average) {
  if (average >= 2.4) return 'ultra'
  if (average >= 1.4) return 'perfect'
  if (average >= 0.6) return 'hit'
  return null
}

/** Runes that make up a s\u00e9ance sequence. */
export const ACTIVITY_RUNE_LENGTH = 4

/** How long each rune lights for while the sequence is shown, in ms. */
export const ACTIVITY_RUNE_SHOW_MS = 620

/**
 * Grade a s\u00e9ance reading by how many of the shown runes were repeated in
 * the right place.
 * @param {number} correct
 * @returns {'hit' | 'perfect' | 'ultra' | null}
 */
export function activityRuneQuality(correct) {
  if (correct >= ACTIVITY_RUNE_LENGTH) return 'ultra'
  if (correct >= ACTIVITY_RUNE_LENGTH - 1) return 'perfect'
  if (correct >= ACTIVITY_RUNE_LENGTH - 2) return 'hit'
  return null
}

/** How long the summit climb lasts before the thermal dies, in ms. */
export const ACTIVITY_SOAR_MS = 7000

/**
 * Summit Roost physics: each flap adds upward velocity at the cost of stamina,
 * gravity pulls the flier back down, and the run ends at the roost, when the
 * stamina runs out, or when the thermal dies.
 */
export const ACTIVITY_SOAR = { flap: 1, gravity: 2.2, maxStamina: 100, flapCost: 10 }

/**
 * Grade a summit climb: reaching the roost scores by how much stamina is left,
 * and a high peak without quite reaching it still finds something.
 * @param {boolean} reached
 * @param {number} peakAltitude 0..1
 * @param {number} staminaLeft 0..100
 * @returns {'hit' | 'perfect' | 'ultra' | null}
 */
export function activitySoarQuality(reached, peakAltitude, staminaLeft) {
  if (reached) return staminaLeft >= 40 ? 'ultra' : staminaLeft >= 15 ? 'perfect' : 'hit'
  return peakAltitude >= 0.65 ? 'hit' : null
}

/**
 * Whether an activity's favoured condition is active. Activities without a
 * condition never qualify.
 * @param {{ condition?: { time?: 'day' | 'night', weather?: string[] } } | null | undefined} activity
 * @param {{ time?: 'day' | 'night', weather?: string | null }} [context]
 * @returns {boolean}
 */
export function activityConditionMatches(activity, context = {}) {
  const condition = activity?.condition
  if (!condition) return false
  if (condition.time && context.time !== condition.time) return false
  if (condition.weather && !condition.weather.includes(context.weather ?? '')) return false
  return true
}

/**
 * A short human label for an activity's favoured condition, or null.
 * @param {{ condition?: { time?: 'day' | 'night', weather?: string[] } } | null | undefined} activity
 * @returns {string | null}
 */
export function activityConditionLabel(activity) {
  const condition = activity?.condition
  if (!condition) return null
  if (condition.time === 'night') return 'at night'
  if (condition.time === 'day') return 'during the day'
  if (condition.weather?.some((weather) => /rain/i.test(weather))) return 'in the rain'
  if (condition.weather?.length) return `in ${condition.weather[0]}`
  return null
}

/**
 * Bump a landed hit one tier when an activity's condition is favoured; a miss
 * stays a miss.
 * @param {'hit' | 'perfect' | 'ultra' | null} quality
 * @returns {'hit' | 'perfect' | 'ultra' | null}
 */
export function bumpActivityQuality(quality) {
  if (quality === 'hit') return 'perfect'
  if (quality === 'perfect') return 'ultra'
  return quality
}

/**
 * Roll a held item for an activity encounter, or null when it carries none.
 * Uses the same type-appropriate wild pool as ordinary wild battles (a berry
 * or a booster of one of the Pokemon's own types), just with a better chance
 * the cleaner the hit — no trainer-only competitive items.
 * @param {'hit' | 'perfect' | 'ultra'} quality
 * @param {string[] | null | undefined} types
 * @returns {string | null}
 */
export function rollActivityHeldItem(quality, types) {
  const chance = ACTIVITY_HELD_ITEM_CHANCE[quality] ?? 0
  return chance > 0 ? rollWildHeldItem(types, chance) : null
}

/**
 * Roll a wild encounter for an `encounter` activity, drawn from the route's
 * table and narrowed to the activity's preferred types when it has any. The
 * rod's rarity gate keeps shallow casts to the common species, and a perfect
 * result biases toward the rarer (lower-weight) half of what is reachable.
 * @param {string} activityId
 * @param {string} routeKey
 * @param {boolean} perfect
 * @param {string} [rodId]
 * @param {string | null} [monotype] Monotype challenge: only this type may appear.
 * @param {Hunt | null} [focus] Focus hunt: its target is much more likely.
 * @returns {{ speciesKey: string, level: number, isWater: boolean, multi: boolean } | null}
 */
export function rollActivityEncounter(activityId, routeKey, perfect, rodId = DEFAULT_ROD, monotype = null, focus = null) {
  const activity = ROUTE_ACTIVITIES[activityId],
    rod = rodForId(rodId),
    table = encounterData[routeKey]?.encounters ?? []
  if (!activity) return null
  // A Monotype run overrides the activity's usual type preference, so fishing
  // can still hook the chosen type even on a route that has none of it.
  if (monotype) {
    const pool = monotypeSpeciesPool(monotype)
    if (pool.length === 0) return null
    const speciesKey = pool[Math.floor(Math.random() * pool.length)],
      levels = table.length > 0 ? table : [{ minLevel: 5, maxLevel: 7 }],
      min = Math.min(...levels.map((entry) => entry.minLevel)),
      max = Math.max(...levels.map((entry) => entry.maxLevel))
    return {
      speciesKey,
      level:
        min +
        Math.floor(Math.random() * (max - min + 1)) +
        (perfect ? 1 : 0) +
        (activity.id === 'fishing' ? rod.levelBonus : 0),
      isWater: speciesHasType(speciesKey, 'Water'),
      multi: false,
    }
  }
  if (table.length === 0) return null
  // Strict type filter: fishing only ever hooks Water Pokemon, so a route with
  // none has nothing to catch rather than falling back to its land species.
  const typePool = activity.preferTypes
    ? table.filter((entry) =>
        activity.preferTypes?.some((type) =>
          pokemonSpecies[entry.speciesKey]?.types?.includes(type)
        )
      )
    : table
  if (typePool.length === 0) return null
  // A rod only reaches part of the water for fishing; foraging sees the whole
  // type pool instead of the shallow end of it.
  // Only the fishing cast is limited by which rod the player owns.
  const rodGated = activity.id === 'fishing',
    reachable = rodGated
      ? [...typePool]
          .sort((left, right) => right.weight - left.weight)
          .slice(0, Math.max(1, Math.ceil(typePool.length * rod.rarity)))
      : typePool,
    sorted = [...reachable].sort((left, right) => left.weight - right.weight),
    // The rarest third of the reachable fish are "multi-catch": a first perfect
    // hook is not enough, the reel must be timed perfectly a second time.
    multiCutoff =
      sorted.length >= 3 ? sorted[Math.max(0, Math.floor((sorted.length - 1) / 3))].weight : -1,
    rareHalf = Math.max(1, Math.ceil(sorted.length / 2)),
    // Diving reaches only the deeper half; a perfect hit down-weights the
    // common half but leaves it reachable, so the roll keeps its variety.
    candidates = activity.deepWater ? sorted.slice(0, rareHalf) : reachable,
    candidateWeight = (/** @type {EncounterEntry} */ entry) =>
      (perfect && !activity.deepWater && sorted.indexOf(entry) >= rareHalf
        ? entry.weight * ACTIVITY_PERFECT_COMMON_WEIGHT
        : entry.weight) *
      (focus && huntMatchesSpecies(focus, entry.speciesKey) ? HUNT_ENCOUNTER_MULTIPLIER : 1),
    levelBonus = rodGated ? rod.levelBonus : 0,
    totalWeight = candidates.reduce((sum, entry) => sum + candidateWeight(entry), 0)
  let roll = Math.random() * totalWeight
  for (const entry of candidates) {
    roll -= candidateWeight(entry)
    if (roll <= 0)
      return {
        speciesKey: entry.speciesKey,
        level:
          entry.minLevel +
          Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1)) +
          (perfect ? 1 : 0) +
          levelBonus,
        isWater: (pokemonSpecies[entry.speciesKey]?.types ?? []).includes('Water'),
        multi: rodGated && entry.weight <= multiCutoff,
      }
  }
  const fallback = candidates[candidates.length - 1]
  return {
    speciesKey: fallback.speciesKey,
    level: fallback.minLevel + levelBonus,
    isWater: false,
    multi: false,
  }
}

/**
 * Roll the encounters for an activity. A headbutted tree occasionally shakes out
 * a second Pokemon as well; the player can only engage one, so the other slips
 * away.
 * @param {string} activityId
 * @param {string} routeKey
 * @param {boolean} perfect
 * @param {string} [rodId]
 * @param {string | null} [monotype] Monotype challenge: only this type may appear.
 * @param {Hunt | null} [focus] Focus hunt: its target is much more likely.
 * @returns {{ speciesKey: string, level: number, isWater: boolean, multi: boolean }[]}
 */
export function rollActivityEncounters(activityId, routeKey, perfect, rodId = DEFAULT_ROD, monotype = null, focus = null) {
  const first = rollActivityEncounter(activityId, routeKey, perfect, rodId, monotype, focus)
  if (!first) return []
  if (activityId !== 'headbutt' || Math.random() >= doubleSpawnChance) return [first]
  let second = rollActivityEncounter(activityId, routeKey, perfect, rodId, monotype, focus)
  // Prefer a different species so the choice actually matters.
  for (let attempt = 0; attempt < 3 && second && second.speciesKey === first.speciesKey; attempt++)
    second = rollActivityEncounter(activityId, routeKey, perfect, rodId, monotype, focus)
  return second ? [first, second] : [first]
}

/**
 * Weighted loot table for the `forage` activity.
 * @type {{ itemId: string, weight: number, min: number, max: number }[]}
 */
const FORAGE_TABLE = [
  { itemId: 'expCandyS', weight: 20, min: 1, max: 2 },
  { itemId: 'potion', weight: 18, min: 1, max: 2 },
  { itemId: 'superPotion', weight: 12, min: 1, max: 1 },
  { itemId: 'hyperPotion', weight: 8, min: 1, max: 1 },
  { itemId: 'expCandyM', weight: 10, min: 1, max: 1 },
  { itemId: 'sitrusBerry', weight: 5, min: 1, max: 1 },
  { itemId: 'lumBerry', weight: 3, min: 1, max: 1 },
  { itemId: 'rareCandy', weight: 1, min: 1, max: 1 },
]

const FORAGE_TOTAL_WEIGHT = FORAGE_TABLE.reduce((sum, entry) => sum + entry.weight, 0)

/**
 * Roll one forage find.
 * @param {boolean} perfect
 * @returns {{ itemId: string, quantity: number }}
 */
export function rollActivityLoot(perfect) {
  // A perfect search only rolls the better (lower-weight) half of the table.
  const sorted = [...FORAGE_TABLE].sort((left, right) => left.weight - right.weight),
    candidates = perfect ? sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2))) : FORAGE_TABLE,
    totalWeight =
      candidates === FORAGE_TABLE
        ? FORAGE_TOTAL_WEIGHT
        : candidates.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * totalWeight
  for (const entry of candidates) {
    roll -= entry.weight
    if (roll <= 0)
      return {
        itemId: entry.itemId,
        quantity: entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1)),
      }
  }
  const fallback = candidates[0]
  return { itemId: fallback.itemId, quantity: fallback.min }
}

/** Display name for any activity reward item id. @param {string} itemId */
export function activityRewardName(itemId) {
  return (
    consumableItems[itemId]?.name ?? evolutionItems[itemId]?.name ?? heldItems[itemId]?.name ?? itemId
  )
}

/**
 * Weighted pick from a `{ itemId, weight }` table.
 * @param {{ itemId: string, weight: number }[]} table
 * @returns {{ itemId: string, weight: number } | null}
 */
function weightedItemPick(table) {
  const total = table.reduce((sum, entry) => sum + entry.weight, 0)
  if (total <= 0) return null
  let roll = Math.random() * total
  for (const entry of table) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return table[table.length - 1] ?? null
}

/** Berries the berry hunt turns up, commonest first. */
const FORAGE_BERRIES = [
  { itemId: 'oranBerry', weight: 60 },
  { itemId: 'sitrusBerry', weight: 25 },
  { itemId: 'lumBerry', weight: 15 },
]

/**
 * Roll the berry haul for a perfect forage. A longer combo picks more berries
 * and leans toward the rarer ones.
 * @param {number} [combo] Consecutive perfect searches so far.
 * @returns {{ itemId: string, quantity: number }}
 */
export function rollForageBerry(combo = 0) {
  const bonus = Math.min(3, Math.floor(Math.max(0, combo) / 2)),
    // The combo shifts weight toward the rarer berries at the end of the table.
    table = FORAGE_BERRIES.map((entry, index) => ({
      ...entry,
      weight: entry.weight + bonus * (index + 1) * 12,
    }))
  return {
    itemId: weightedItemPick(table)?.itemId ?? 'oranBerry',
    quantity: 1 + bonus,
  }
}

/** Chance a dive uncovers treasure, by hit quality. */
const DIVE_TREASURE_CHANCE = { perfect: 0.4, ultra: 0.8 }

/**
 * Roll the sunken treasure a dive can turn up, or null. A perfect dive finds
 * common valuables; a bullseye can reach the rarer ones too.
 * @param {'hit' | 'perfect' | 'ultra'} quality
 * @returns {string | null}
 */
export function rollDiveTreasure(quality) {
  const chance = DIVE_TREASURE_CHANCE[/** @type {'perfect'|'ultra'} */ (quality)] ?? 0
  if (chance <= 0 || Math.random() >= chance) return null
  const table = quality === 'ultra' ? valuableDropTable : valuableDropTable.filter((entry) => entry.weight >= 10)
  return weightedItemPick(table)?.itemId ?? null
}

/** Chance a rock smash cracks open a bonus, by hit quality. */
const SMASH_BONUS_CHANCE = { perfect: 0.35, ultra: 0.7 }

/**
 * Roll the gem a rock smash cracks out — occasionally a fossil instead on a
 * bullseye — or null.
 * @param {'hit' | 'perfect' | 'ultra'} quality
 * @returns {string | null}
 */
export function rollSmashBonus(quality) {
  if (quality === 'ultra' && Math.random() < 0.06) {
    const fossils = Object.keys(fossilItems)
    if (fossils.length > 0) return fossils[Math.floor(Math.random() * fossils.length)]
  }
  const chance = SMASH_BONUS_CHANCE[/** @type {'perfect'|'ultra'} */ (quality)] ?? 0
  if (chance <= 0 || Math.random() >= chance) return null
  return weightedItemPick(valuableDropTable)?.itemId ?? null
}

/**
 * Weighted relic table for the `prospecting` activity. Common finds are
 * sellable valuables; the rarer end holds the evolution stones (which are
 * otherwise shop-only).
 * @type {{ itemId: string, weight: number, min: number, max: number }[]}
 */
const PROSPECT_TABLE = [
  { itemId: 'stardust', weight: 22, min: 1, max: 2 },
  { itemId: 'pearl', weight: 16, min: 1, max: 1 },
  { itemId: 'hardStone', weight: 12, min: 1, max: 1 },
  { itemId: 'nugget', weight: 12, min: 1, max: 1 },
  { itemId: 'fireStone', weight: 5, min: 1, max: 1 },
  { itemId: 'waterStone', weight: 5, min: 1, max: 1 },
  { itemId: 'thunderStone', weight: 5, min: 1, max: 1 },
  { itemId: 'leafStone', weight: 5, min: 1, max: 1 },
  { itemId: 'bigPearl', weight: 6, min: 1, max: 1 },
  { itemId: 'moonStone', weight: 3, min: 1, max: 1 },
  { itemId: 'starPiece', weight: 3, min: 1, max: 1 },
  { itemId: 'sunStone', weight: 2, min: 1, max: 1 },
  { itemId: 'duskStone', weight: 2, min: 1, max: 1 },
  { itemId: 'shinyStone', weight: 2, min: 1, max: 1 },
  { itemId: 'dawnStone', weight: 2, min: 1, max: 1 },
  { itemId: 'iceStone', weight: 2, min: 1, max: 1 },
  { itemId: 'rareCandy', weight: 2, min: 1, max: 1 },
  { itemId: 'bigNugget', weight: 1, min: 1, max: 1 },
]

/**
 * Roll one prospecting find. A perfect dig only rolls the better (rarer, lower
 * weight) half of the table.
 * @param {boolean} perfect
 * @returns {{ itemId: string, quantity: number }}
 */
export function rollProspectLoot(perfect) {
  const sorted = [...PROSPECT_TABLE].sort((left, right) => left.weight - right.weight),
    candidates = perfect
      ? sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)))
      : PROSPECT_TABLE,
    totalWeight = candidates.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * totalWeight
  for (const entry of candidates) {
    roll -= entry.weight
    if (roll <= 0)
      return {
        itemId: entry.itemId,
        quantity: entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1)),
      }
  }
  const fallback = candidates[candidates.length - 1]
  return { itemId: fallback.itemId, quantity: fallback.min }
}

/** Chance a clean dig turns up a bonus relic, by hit quality. */
const PROSPECT_BONUS_CHANCE = { perfect: 0.35, ultra: 0.7 }

/**
 * Roll a bonus relic a clean dig turns up — occasionally a fossil — or null.
 * @param {'hit' | 'perfect' | 'ultra'} quality
 * @returns {string | null}
 */
export function rollProspectBonus(quality) {
  const chance = PROSPECT_BONUS_CHANCE[/** @type {'perfect'|'ultra'} */ (quality)] ?? 0
  if (chance <= 0 || Math.random() >= chance) return null
  // Digging can turn up a fossil; a bullseye is likelier to.
  if (Math.random() < (quality === 'ultra' ? 0.15 : 0.05)) {
    const fossils = Object.keys(fossilItems)
    if (fossils.length > 0) return fossils[Math.floor(Math.random() * fossils.length)]
  }
  return (
    weightedItemPick(valuableDropTable.filter((entry) => entry.weight <= 10))?.itemId ?? null
  )
}
