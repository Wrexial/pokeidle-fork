// Max and G-Max moves. When a Pokemon Gigantamaxes (the Max Mushroom factor),
// its damaging moves become Max Moves; the species' own G-Max move replaces the
// matching-type Max Move. Its status moves become Max Guard. Power and effects
// follow Pokemon Showdown's tables.

/** @type {Record<string, string>} Type -> the type-based Max Move (Status is Max Guard). */
export const MAX_MOVE_BY_TYPE = {
  Normal: 'maxStrike',
  Fire: 'maxFlare',
  Water: 'maxGeyser',
  Electric: 'maxLightning',
  Grass: 'maxOvergrowth',
  Ice: 'maxHailstorm',
  Fighting: 'maxKnuckle',
  Poison: 'maxOoze',
  Ground: 'maxQuake',
  Flying: 'maxAirstream',
  Psychic: 'maxMindstorm',
  Bug: 'maxFlutterby',
  Rock: 'maxRockfall',
  Ghost: 'maxPhantasm',
  Dragon: 'maxWyrmwind',
  Dark: 'maxDarkness',
  Steel: 'maxSteelspike',
  Fairy: 'maxStarfall',
  Status: 'maxGuard',
}

/**
 * The Max Move base power from the base move's power and type.
 * @param {number} basePower
 * @param {string} type
 * @returns {number}
 */
export function maxMoveBasePower(basePower, type) {
  if (!basePower) return 100
  if (type === 'Fighting' || type === 'Poison') {
    if (basePower >= 150) return 100
    if (basePower >= 110) return 95
    if (basePower >= 75) return 90
    if (basePower >= 65) return 85
    if (basePower >= 55) return 80
    if (basePower >= 45) return 75
    return 70
  }
  if (basePower >= 150) return 150
  if (basePower >= 110) return 140
  if (basePower >= 75) return 130
  if (basePower >= 65) return 120
  if (basePower >= 55) return 110
  if (basePower >= 45) return 100
  return 90
}

/** @type {Record<string, string>} Base species key -> its signature G-Max move. */
export const GMAX_MOVE_BY_SPECIES = {
  venusaur: 'gMaxVineLash',
  charizard: 'gMaxWildfire',
  blastoise: 'gMaxCannonade',
  pikachu: 'gMaxVoltCrash',
  meowth: 'gMaxGoldRush',
  gengar: 'gMaxTerror',
  eevee: 'gMaxCuddle',
  'urshifu-sss': 'gMaxOneBlow',
  'urshifu-rss': 'gMaxRapidFlow',
  butterfree: 'gMaxBefuddle',
  machamp: 'gMaxChiStrike',
  kingler: 'gMaxFoamBurst',
  lapras: 'gMaxResonance',
  snorlax: 'gMaxReplenish',
  garbodor: 'gMaxMalodor',
  melmetal: 'gMaxMeltdown',
  rillaboom: 'gMaxDrumSolo',
  cinderace: 'gMaxFireball',
  inteleon: 'gMaxHydrosnipe',
  corviknight: 'gMaxWindRage',
  orbeetle: 'gMaxGravitas',
  drednaw: 'gMaxStonesurge',
  coalossal: 'gMaxVolcalith',
  flapple: 'gMaxTartness',
  appletun: 'gMaxSweetness',
  sandaconda: 'gMaxSandblast',
  toxtricity: 'gMaxStunShock',
  centiskorch: 'gMaxCentiferno',
  hatterene: 'gMaxSmite',
  grimmsnarl: 'gMaxSnooze',
  alcremie: 'gMaxFinale',
  copperajah: 'gMaxSteelsurge',
  duraludon: 'gMaxDepletion',
}

/**
 * The G-Max move a Gigantamaxed species uses for a move of `type`, or null.
 * @param {string | null | undefined} speciesKey
 * @param {string} type
 * @returns {string | null}
 */
export function gmaxMoveFor(speciesKey, type) {
  if (!speciesKey?.startsWith('gx-')) return null
  return GMAX_MOVE_BY_SPECIES[speciesKey.slice(3)] ?? null
}
