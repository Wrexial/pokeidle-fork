// Semantic move data the extracted `possible-moves.json` doesn't carry: healing,
// multi-hit counts, high critical-hit rates, Protect-style blocking, plus a few
// straight data corrections (Calm Mind's stat keys, the G-Max categories and
// wrong priority values). `applyMoveOverrides` merges these onto `moveData` at
// load (see src/data/gameData.js), so the engine and UI read one enriched table.

/** @type {Record<string, Partial<Move>>} */
export const MOVE_OVERRIDES = {
  // --- Healing (percentage of max HP) ---
  recover: { effect: { type: 'heal', percentage: 50 } },
  roost: { effect: { type: 'heal', percentage: 50 } },
  softBoiled: { effect: { type: 'heal', percentage: 50 } },
  milkDrink: { effect: { type: 'heal', percentage: 50 } },
  slackOff: { effect: { type: 'heal', percentage: 50 } },
  healOrder: { effect: { type: 'heal', percentage: 50 } },
  synthesis: { effect: { type: 'heal', percentage: 50 } },
  morningSun: { effect: { type: 'heal', percentage: 50 } },
  moonlight: { effect: { type: 'heal', percentage: 50 } },
  shoreUp: { effect: { type: 'heal', percentage: 50 } },
  // Rest cures its user by putting them to sleep for a couple of turns.
  rest: { effect: { type: 'heal', percentage: 100, status: 'sleep' } },

  // --- Protect-style blocking (all get +4 priority below) ---
  protect: { protect: true, priority: 4 },
  detect: { protect: true, priority: 4 },
  kingsShield: { protect: true, priority: 4 },
  banefulBunker: { protect: true, priority: 4 },
  spikyShield: { protect: true, priority: 4 },
  silkTrap: { protect: true, priority: 4 },
  obstruct: { protect: true, priority: 4 },

  // --- Multi-hit (2-5 hits, or a fixed count) ---
  bulletSeed: { multiHit: [2, 5] },
  icicleSpear: { multiHit: [2, 5] },
  rockBlast: { multiHit: [2, 5] },
  pinMissile: { multiHit: [2, 5] },
  scaleShot: { multiHit: [2, 5] },
  tailSlap: { multiHit: [2, 5] },
  spikeCannon: { multiHit: [2, 5] },
  barrage: { multiHit: [2, 5] },
  cometPunch: { multiHit: [2, 5] },
  doubleSlap: { multiHit: [2, 5] },
  furyAttack: { multiHit: [2, 5] },
  furySwipes: { multiHit: [2, 5] },
  boneRush: { multiHit: [2, 5] },
  armThrust: { multiHit: [2, 5] },
  waterShuriken: { multiHit: [2, 5], priority: 1 },
  doubleKick: { multiHit: [2, 2] },
  twineedle: { multiHit: [2, 2] },
  dualChop: { multiHit: [2, 2] },
  dualWingbeat: { multiHit: [2, 2] },
  gearGrind: { multiHit: [2, 2] },
  tripleKick: { multiHit: [3, 3] },
  tripleAxel: { multiHit: [3, 3] },

  // --- High critical-hit ratio (+1 stage) ---
  slash: { critStage: 1 },
  razorLeaf: { critStage: 1 },
  nightSlash: { critStage: 1 },
  psychoCut: { critStage: 1 },
  crossChop: { critStage: 1 },
  stoneEdge: { critStage: 1 },
  leafBlade: { critStage: 1 },
  shadowClaw: { critStage: 1 },
  crossPoison: { critStage: 1 },
  airCutter: { critStage: 1 },
  attackOrder: { critStage: 1 },
  blazeKick: { critStage: 1 },
  crabhammer: { critStage: 1 },
  drillRun: { critStage: 1 },
  karateChop: { critStage: 1 },
  razorShell: { critStage: 1 },
  snipeShot: { critStage: 1 },
  spacialRend: { critStage: 1 },
  aeroblast: { critStage: 1 },
  sacredSword: { critStage: 1 },
  stormThrow: { critStage: 1 },
  flowerTrick: { critStage: 1 },
  // These always land a critical hit.
  wickedBlow: { critStage: 3 },
  surgingStrikes: { critStage: 3, multiHit: [3, 3] },

  // --- Utility ---
  leechSeed: { effect: { type: 'leechSeed' } },
  taunt: { effect: { type: 'taunt' } },
  substitute: { effect: { type: 'substitute' } },
  attract: { effect: { type: 'infatuation' } },
  curse: { effect: { type: 'curse' } },
  // --- Entry hazards ---
  stealthRock: { effect: { type: 'hazard', hazard: 'stealthRock' } },
  spikes: { effect: { type: 'hazard', hazard: 'spikes' } },
  toxicSpikes: { effect: { type: 'hazard', hazard: 'toxicSpikes' } },
  stickyWeb: { effect: { type: 'hazard', hazard: 'stickyWeb' } },
  // --- Weather ---
  rainDance: { effect: { type: 'weather', weather: 'rain' } },
  sunnyDay: { effect: { type: 'weather', weather: 'sun' } },
  sandstorm: { effect: { type: 'weather', weather: 'sandstorm' } },
  snowscape: { effect: { type: 'weather', weather: 'snow' } },
  hail: { effect: { type: 'weather', weather: 'hail' } },
  chillyReception: { effect: { type: 'weather', weather: 'snow' } },
  // --- Terrain ---
  electricTerrain: { effect: { type: 'terrain', terrain: 'electric' } },
  grassyTerrain: { effect: { type: 'terrain', terrain: 'grassy' } },
  mistyTerrain: { effect: { type: 'terrain', terrain: 'misty' } },
  psychicTerrain: { effect: { type: 'terrain', terrain: 'psychic' } },

  // --- Screens (halve physical/special damage for 5 turns) ---
  reflect: { screen: 'reflect' },
  lightScreen: { screen: 'lightScreen' },
  auroraVeil: { screen: 'both' },

  // --- Status infliction ---
  thunderWave: { effect: { type: 'status', status: 'paralysis' } },
  glare: { effect: { type: 'status', status: 'paralysis' } },
  stunSpore: { effect: { type: 'status', status: 'paralysis' } },
  toxic: { effect: { type: 'status', status: 'toxic' } },
  poisonPowder: { effect: { type: 'status', status: 'poison' } },
  willOWisp: { effect: { type: 'status', status: 'burn' } },
  sing: { effect: { type: 'status', status: 'sleep' } },
  sleepPowder: { effect: { type: 'status', status: 'sleep' } },
  spore: { effect: { type: 'status', status: 'sleep' } },
  hypnosis: { effect: { type: 'status', status: 'sleep' } },
  lovelyKiss: { effect: { type: 'status', status: 'sleep' } },
  darkVoid: { effect: { type: 'status', status: 'sleep' } },
  confuseRay: { effect: { type: 'confusion' } },
  supersonic: { effect: { type: 'confusion' } },
  sweetKiss: { effect: { type: 'confusion' } },
  teeterDance: { effect: { type: 'confusion' } },
  // Damaging moves that can paralyse.
  nuzzle: { effect: { type: 'status', status: 'paralysis', chance: 100 } },
  zapCannon: { effect: { type: 'status', status: 'paralysis', chance: 100 } },
  bodySlam: { effect: { type: 'status', status: 'paralysis', chance: 30 } },
  thunderShock: { effect: { type: 'status', status: 'paralysis', chance: 10 } },
  thunderbolt: { effect: { type: 'status', status: 'paralysis', chance: 10 } },
  discharge: { effect: { type: 'status', status: 'paralysis', chance: 30 } },
  lick: { effect: { type: 'status', status: 'paralysis', chance: 30 } },

  // --- Data corrections ---
  // Calm Mind raised attack/defense because of Showdown's stat-key names.
  calmMind: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { spAttack: 1, spDefense: 1 },
      chance: 100,
    },
  },
  // The G-Max moves were stored as status moves with 160 power.
  gMaxDrumSolo: { category: 'physical' },
  gMaxFireball: { category: 'physical' },
  gMaxHydrosnipe: { category: 'special' },
  // Priority values the extraction missed.
  extremeSpeed: { priority: 2 },
  fakeOut: { priority: 3 },
  feint: { priority: 2 },
}

/**
 * Merge {@link MOVE_OVERRIDES} onto a `moveData` table in place, so the engine
 * (and the move manager UI) sees healing/multi-hit/crit/priority data.
 * @param {Record<string, Move>} moveData
 * @returns {Record<string, Move>}
 */
export function applyMoveOverrides(moveData) {
  for (const [moveId, override] of Object.entries(MOVE_OVERRIDES))
    if (moveData[moveId]) moveData[moveId] = { ...moveData[moveId], ...override }
  return moveData
}
