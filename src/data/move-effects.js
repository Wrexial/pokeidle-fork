// Semantic move data the extracted `possible-moves.json` doesn't carry: healing,
// multi-hit counts, high critical-hit rates, Protect-style blocking, plus a few
// straight data corrections (Calm Mind's stat keys, the G-Max categories and
// wrong priority values). `applyMoveOverrides` merges these onto `moveData` at
// load (see src/data/gameData.js), so the engine and UI read one enriched table.

/** @type {Record<string, Partial<Move>>} */
const MOVE_OVERRIDES = {
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

  // --- Recoil moves (fraction of the damage dealt) ---
  doubleEdge: { effect: { type: 'recoil', fraction: 1 / 3 } },
  takeDown: { effect: { type: 'recoil', fraction: 1 / 4 } },
  braveBird: { effect: { type: 'recoil', fraction: 1 / 3 } },
  flareBlitz: {
    effect: { type: 'recoil', fraction: 1 / 3 },
    secondary: { status: 'burn', chance: 10 },
  },
  woodHammer: { effect: { type: 'recoil', fraction: 1 / 3 } },
  wildCharge: { effect: { type: 'recoil', fraction: 1 / 4 } },
  voltTackle: {
    effect: { type: 'recoil', fraction: 1 / 3 },
    secondary: { status: 'paralysis', chance: 10 },
  },
  headSmash: { effect: { type: 'recoil', fraction: 1 / 2 } },
  submission: { effect: { type: 'recoil', fraction: 1 / 4 } },
  headCharge: { effect: { type: 'recoil', fraction: 1 / 4 } },
  lightOfRuin: { effect: { type: 'recoil', fraction: 1 / 2 } },

  // --- Self-destructing moves: the user faints once the hit lands ---
  selfDestruct: { effect: { type: 'selfDestruct' } },
  explosion: { effect: { type: 'selfDestruct' } },
  mistyExplosion: { effect: { type: 'selfDestruct' } },
  // Memento keeps its stat drop and additionally faints the user.
  memento: { selfDestruct: true },
  // Faint-heals: the user faints and the next Pokemon sent out is fully healed
  // (and cured of status).
  healingWish: { selfDestruct: true, effect: { type: 'healingWish' } },
  lunarDance: { selfDestruct: true, effect: { type: 'healingWish' } },

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

  // --- Recharge moves: unusable on the turn after they land ---
  hyperBeam: { effect: { type: 'recharge' } },
  gigaImpact: { effect: { type: 'recharge' } },
  rockWrecker: { effect: { type: 'recharge' } },
  roarOfTime: { effect: { type: 'recharge' } },
  blastBurn: { effect: { type: 'recharge' } },
  hydroCannon: { effect: { type: 'recharge' } },
  frenzyPlant: { effect: { type: 'recharge' } },
  prismaticLaser: { effect: { type: 'recharge' } },
  eternabeam: { effect: { type: 'recharge' } },
  meteorAssault: { effect: { type: 'recharge' } },

  // --- Damaging-move secondaries the extraction missed ---
  // Status secondaries.
  thunder: { effect: { type: 'status', status: 'paralysis', chance: 30 } },
  thunderPunch: { effect: { type: 'status', status: 'paralysis', chance: 10 } },
  // The elemental fangs each carry a status and a separate flinch roll.
  fireFang: {
    effect: { type: 'status', status: 'burn', chance: 10 },
    secondary: { status: 'flinching', chance: 10 },
  },
  iceFang: {
    effect: { type: 'status', status: 'freeze', chance: 10 },
    secondary: { status: 'flinching', chance: 10 },
  },
  thunderFang: {
    effect: { type: 'status', status: 'paralysis', chance: 10 },
    secondary: { status: 'flinching', chance: 10 },
  },
  // Poison Fang badly poisons (the extraction stored a plain poison).
  poisonFang: { effect: { type: 'status', status: 'toxic', chance: 50 } },
  // Fake Out only flinches on the user's first turn on the field.
  fakeOut: {
    effect: { type: 'status', status: 'flinching', chance: 100, firstTurnOnly: true },
    priority: 3,
  },
  // Stat-drop secondaries.
  psychic: { effect: { type: 'statChange', target: 'opponent', changes: { spDefense: -1 }, chance: 10 } },
  crunch: { effect: { type: 'statChange', target: 'opponent', changes: { defense: -1 }, chance: 20 } },
  bugBuzz: { effect: { type: 'statChange', target: 'opponent', changes: { spDefense: -1 }, chance: 10 } },
  focusBlast: { effect: { type: 'statChange', target: 'opponent', changes: { spDefense: -1 }, chance: 10 } },
  earthPower: { effect: { type: 'statChange', target: 'opponent', changes: { spDefense: -1 }, chance: 10 } },
  energyBall: { effect: { type: 'statChange', target: 'opponent', changes: { spDefense: -1 }, chance: 10 } },
  moonblast: { effect: { type: 'statChange', target: 'opponent', changes: { spAttack: -1 }, chance: 30 } },
  playRough: { effect: { type: 'statChange', target: 'opponent', changes: { attack: -1 }, chance: 10 } },
  ironTail: { effect: { type: 'statChange', target: 'opponent', changes: { defense: -1 }, chance: 30 } },
  rockSmash: { effect: { type: 'statChange', target: 'opponent', changes: { defense: -1 }, chance: 50 } },
  liquidation: { effect: { type: 'statChange', target: 'opponent', changes: { defense: -1 }, chance: 20 } },
  auroraBeam: { effect: { type: 'statChange', target: 'opponent', changes: { attack: -1 }, chance: 10 } },
  shadowBall: { effect: { type: 'statChange', target: 'opponent', changes: { spDefense: -1 }, chance: 20 } },
  flashCannon: { effect: { type: 'statChange', target: 'opponent', changes: { spDefense: -1 }, chance: 10 } },
  seedFlare: { effect: { type: 'statChange', target: 'opponent', changes: { spDefense: -2 }, chance: 40 } },
  muddyWater: { effect: { type: 'statChange', target: 'opponent', changes: { accuracy: -1 }, chance: 30 } },
  octazooka: { effect: { type: 'statChange', target: 'opponent', changes: { accuracy: -1 }, chance: 50 } },
  mirrorShot: { effect: { type: 'statChange', target: 'opponent', changes: { accuracy: -1 }, chance: 30 } },
  // Self-buff secondaries.
  metalClaw: { effect: { type: 'statChange', target: 'self', changes: { attack: 1 }, chance: 10 } },
  chargeBeam: { effect: { type: 'statChange', target: 'self', changes: { spAttack: 1 }, chance: 70 } },
  meteorMash: { effect: { type: 'statChange', target: 'self', changes: { attack: 1 }, chance: 20 } },
  fieryDance: { effect: { type: 'statChange', target: 'self', changes: { spAttack: 1 }, chance: 50 } },
  diamondStorm: { effect: { type: 'statChange', target: 'self', changes: { defense: 2 }, chance: 50 } },
  ancientPower: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 },
      chance: 10,
    },
  },
  silverWind: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 },
      chance: 10,
    },
  },
  ominousWind: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 },
      chance: 10,
    },
  },
  // Esper Wing raises the user's Sp. Atk (the extraction copied Speed).
  esperWing: { effect: { type: 'statChange', target: 'self', changes: { spAttack: 1 }, chance: 100 } },
  // Triple Arrows lowers Defense and can flinch: two effects on one hit.
  tripleArrows: {
    effect: { type: 'statChange', target: 'opponent', changes: { defense: -1 }, chance: 50 },
    secondary: { status: 'flinching', chance: 30 },
  },

  // --- Utility ---
  leechSeed: { effect: { type: 'leechSeed' } },
  taunt: { effect: { type: 'taunt' } },
  substitute: { effect: { type: 'substitute' } },
  attract: { effect: { type: 'infatuation' } },
  curse: { effect: { type: 'curse' } },
  haze: { effect: { type: 'statReset', target: 'all' } },
  clearSmog: { effect: { type: 'statReset', target: 'opponent' }, accuracy: 100 },
  ivyCudgel: { accuracy: 100 },
  // Focus Energy raises the user's critical-hit stage for the rest of the
  // battle, and Aqua Ring heals each end of turn.
  focusEnergy: { effect: { type: 'focusEnergy', target: 'self' } },
  aquaRing: { effect: { type: 'aquaRing', target: 'self' } },
  // Wish heals the user's side at the end of the next turn; Yawn puts the
  // target to sleep at the end of the next turn.
  wish: { effect: { type: 'wish', target: 'self' } },
  yawn: { effect: { type: 'yawn' } },
  // Topsy-Turvy flips the target's stat stages; Pain Split averages both HP bars.
  topsyTurvy: { effect: { type: 'statInvert' } },
  painSplit: { effect: { type: 'painSplit' } },
  // Safeguard blocks status and Mist blocks stat drops for the user's side;
  // Encore locks the target into its last move and Disable blocks it; Perish
  // Song gives both sides a three-turn countdown.
  safeguard: { effect: { type: 'safeguard', target: 'self' } },
  mist: { effect: { type: 'mist', target: 'self' } },
  encore: { effect: { type: 'encore' }, accuracy: 100 },
  disable: { effect: { type: 'disable' }, accuracy: 100 },
  perishSong: { effect: { type: 'perishSong' } },
  // Tailwind doubles the user's side Speed; Trick Room reverses the speed
  // order (and goes last); Destiny Bond drags down whoever faints the user.
  tailwind: { effect: { type: 'tailwind', target: 'self' } },
  trickRoom: { effect: { type: 'trickRoom', target: 'self' }, priority: -7 },
  destinyBond: { effect: { type: 'destinyBond', target: 'self' } },
  // Ingrain heals each turn; Laser Focus guarantees the next hit crits; Lock-On
  // and Mind Reader make the next hit land.
  ingrain: { effect: { type: 'ingrain', target: 'self' } },
  laserFocus: { effect: { type: 'laserFocus', target: 'self' } },
  lockOn: { effect: { type: 'lockOn', target: 'self' } },
  mindReader: { effect: { type: 'lockOn', target: 'self' } },
  // Single-target ally heals; in singles they heal the user. Life Dew heals the
  // side, Jungle Healing / Lunar Blessing also cure status.
  lifeDew: { effect: { type: 'heal', percentage: 25 } },
  healPulse: { effect: { type: 'heal', percentage: 50 } },
  floralHealing: { effect: { type: 'heal', percentage: 50 } },
  jungleHealing: { effect: { type: 'heal', percentage: 25, statusCure: true } },
  lunarBlessing: { effect: { type: 'heal', percentage: 25, statusCure: true } },
  // Ability manipulation: Gastro Acid suppresses, Worry Seed / Simple Beam
  // replace, Role Play copies the foe's, Entrainment shares, Skill Swap trades.
  gastroAcid: { effect: { type: 'gastroAcid' }, accuracy: 100 },
  worrySeed: { effect: { type: 'worrySeed' }, accuracy: 100 },
  simpleBeam: { effect: { type: 'simpleBeam' }, accuracy: 100 },
  rolePlay: { effect: { type: 'rolePlay', target: 'self' } },
  entrainment: { effect: { type: 'entrainment' }, accuracy: 100 },
  skillSwap: { effect: { type: 'skillSwap' } },
  // Type changes: Soak / Magic Powder replace the target's types, Reflect Type
  // copies the foe's onto the user, Forest's Curse / Trick-or-Treat add one.
  soak: { effect: { type: 'typeChange', types: ['Water'] }, accuracy: 100 },
  magicPowder: { effect: { type: 'typeChange', types: ['Psychic'] }, accuracy: 100 },
  reflectType: { effect: { type: 'reflectType', target: 'self' } },
  forestsCurse: { effect: { type: 'typeAdd', typeName: 'Grass' }, accuracy: 100 },
  trickOrTreat: { effect: { type: 'typeAdd', typeName: 'Ghost' }, accuracy: 100 },
  // Stat-stage swaps and Recycle.
  powerSwap: { effect: { type: 'statSwap', stats: ['attack', 'spAttack'] } },
  guardSwap: { effect: { type: 'statSwap', stats: ['defense', 'spDefense'] } },
  // Speed Swap trades the raw Speed stats, while Power Split / Guard Split
  // average the raw offensive / defensive stats of both battlers.
  speedSwap: { effect: { type: 'speedSwap' } },
  powerSplit: { effect: { type: 'statSplit', stats: ['attack', 'spAttack'] } },
  guardSplit: { effect: { type: 'statSplit', stats: ['defense', 'spDefense'] } },
  // Heal Block stops the target restoring HP for five turns.
  healBlock: { effect: { type: 'healBlock' } },
  heartSwap: {
    effect: {
      type: 'statSwap',
      stats: ['attack', 'defense', 'spAttack', 'spDefense', 'speed'],
    },
  },
  recycle: { effect: { type: 'recycle', target: 'self' } },
  // Held-item manipulation.
  trick: { effect: { type: 'itemSwap' }, accuracy: 100 },
  switcheroo: { effect: { type: 'itemSwap' }, accuracy: 100 },
  bestow: { effect: { type: 'bestow' }, accuracy: 100 },
  corrosiveGas: { effect: { type: 'corrosiveGas' }, accuracy: 100 },
  // Damaging item moves: Thief / Covet steal, Knock Off removes, Pluck /
  // Bug Bite eat a held Berry, Incinerate burns one away.
  thief: { effect: { type: 'stealItem' } },
  covet: { effect: { type: 'stealItem' } },
  knockOff: { effect: { type: 'knockOff' } },
  pluck: { effect: { type: 'eatBerry' } },
  bugBite: { effect: { type: 'eatBerry' } },
  incinerate: { effect: { type: 'incinerate' } },
  // Moves the extraction left without an effect.
  grassWhistle: { effect: { type: 'status', status: 'sleep' } },
  poisonGas: { effect: { type: 'status', status: 'poison' } },
  noRetreat: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 },
      chance: 100,
    },
  },
  takeHeart: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 },
      chance: 100,
      statusCure: true,
    },
  },
  clangorousSoul: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 },
      chance: 100,
      hpCost: 1 / 3,
    },
  },
  acupressure: { effect: { type: 'randomBoost', target: 'self' } },
  powerTrick: { effect: { type: 'powerTrick', target: 'self' } },
  psychUp: { effect: { type: 'psychUp', target: 'self' } },
  refresh: { effect: { type: 'selfCureStatus', target: 'self' } },
  magnetRise: { effect: { type: 'magnetRise', target: 'self' } },
  conversion: { effect: { type: 'conversion', target: 'self' } },
  camouflage: { effect: { type: 'camouflage', target: 'self' } },
  aromatherapy: { effect: { type: 'selfCureStatus' } },
  healBell: { effect: { type: 'selfCureStatus' } },
  dragonCheer: { effect: { type: 'focusEnergy', target: 'self' } },
  conversion2: { effect: { type: 'conversion2' } },
  courtChange: { effect: { type: 'courtChange' } },
  foresight: { effect: { type: 'foresight' } },
  odorSleuth: { effect: { type: 'foresight' } },
  miracleEye: { effect: { type: 'foresight' } },
  luckyChant: { effect: { type: 'luckyChant', target: 'self' } },
  powerShift: { effect: { type: 'powerShift', target: 'self' } },
  stockpile: { effect: { type: 'stockpile', target: 'self' } },
  swallow: { effect: { type: 'swallow', target: 'self' } },
  torment: { effect: { type: 'torment' } },
  transform: { effect: { type: 'transform' } },
  // Protect-style variants.
  burningBulwark: { protect: true, priority: 4 },
  craftyShield: { protect: true, priority: 4 },
  quickGuard: { protect: true, priority: 4 },
  wideGuard: { protect: true, priority: 4 },
  matBlock: { protect: true, priority: 4 },
  gearUp: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { attack: 1, spAttack: 1 },
      chance: 100,
    },
  },
  coaching: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { attack: 1, defense: 1 },
      chance: 100,
    },
  },
  nightmare: { effect: { type: 'nightmare' } },
  doodle: { effect: { type: 'doodle' } },
  gravity: { effect: { type: 'gravity' } },
  telekinesis: { effect: { type: 'telekinesis' } },
  mudSport: { effect: { type: 'sport', sport: 'mud' } },
  waterSport: { effect: { type: 'sport', sport: 'water' } },
  powder: { effect: { type: 'powder' } },
  embargo: { effect: { type: 'embargo' } },
  wonderRoom: { effect: { type: 'wonderRoom', target: 'self' } },
  ionDeluge: { effect: { type: 'ionDeluge' } },
  // --- Switching ---
  batonPass: { effect: { type: 'selfSwitch', passBoosts: true } },
  teleport: { effect: { type: 'selfSwitch' } },
  shedTail: { effect: { type: 'selfSwitch', substituteCost: 0.5 } },
  uTurn: { effect: { type: 'selfSwitch' } },
  voltSwitch: { effect: { type: 'selfSwitch' } },
  flipTurn: { effect: { type: 'selfSwitch' } },
  partingShot: {
    effect: { type: 'statChange', target: 'opponent', changes: { attack: -1, spAttack: -1 }, chance: 100 },
    selfSwitch: true,
  },
  roar: { effect: { type: 'forceSwitch' }, priority: -6 },
  whirlwind: { effect: { type: 'forceSwitch' }, priority: -6 },
  dragonTail: { effect: { type: 'forceSwitch' } },
  circleThrow: { effect: { type: 'forceSwitch' } },
  block: { effect: { type: 'trap' } },
  meanLook: { effect: { type: 'trap' } },
  spiderWeb: { effect: { type: 'trap' } },
  revivalBlessing: { effect: { type: 'revive' } },
  // Flavour / field moves.
  happyHour: { effect: { type: 'happyHour', target: 'self' } },
  fairyLock: { effect: { type: 'fairyLock' } },
  // Move-copy / item-lock.
  mimic: { effect: { type: 'mimic' } },
  sketch: { effect: { type: 'sketch' } },
  snatch: { effect: { type: 'snatch', target: 'self' }, priority: 4 },
  magicRoom: { effect: { type: 'magicRoom', target: 'self' } },
  // Doubles position / replay moves.
  allySwitch: { effect: { type: 'allySwitch', target: 'self' }, priority: 2 },
  instruct: { effect: { type: 'instruct' } },
  electrify: { effect: { type: 'electrify' } },
  magicCoat: { effect: { type: 'magicCoat', target: 'self' } },
  teatime: { effect: { type: 'teatime' } },
  endure: { effect: { type: 'enduring', target: 'self' }, priority: 4 },
  tidyUp: { effect: { type: 'tidyUp', target: 'self' } },
  psychoShift: { effect: { type: 'psychoShift' } },
  purify: { effect: { type: 'purify' } },

  // --- Max / G-Max move effects (added from Pokemon Showdown) ---
  maxFlare: { effect: { type: 'weather', weather: 'sun' } },
  maxGeyser: { effect: { type: 'weather', weather: 'rain' } },
  maxRockfall: { effect: { type: 'weather', weather: 'sandstorm' } },
  maxHailstorm: { effect: { type: 'weather', weather: 'snow' } },
  maxStarfall: { effect: { type: 'terrain', terrain: 'misty' } },
  maxLightning: { effect: { type: 'terrain', terrain: 'electric' } },
  maxOvergrowth: { effect: { type: 'terrain', terrain: 'grassy' } },
  maxMindstorm: { effect: { type: 'terrain', terrain: 'psychic' } },
  maxKnuckle: { effect: { type: 'statChange', target: 'self', changes: { attack: 1 }, chance: 100 } },
  maxOoze: { effect: { type: 'statChange', target: 'self', changes: { spAttack: 1 }, chance: 100 } },
  maxQuake: { effect: { type: 'statChange', target: 'self', changes: { spDefense: 1 }, chance: 100 } },
  maxGuard: { protect: true, priority: 4 },
  gMaxSteelsurge: { effect: { type: 'hazard', hazard: 'stealthRock' } },
  gMaxStonesurge: { effect: { type: 'hazard', hazard: 'stealthRock' } },
  gMaxResonance: { effect: { type: 'screen', screen: 'both' } },
  gMaxCuddle: { effect: { type: 'infatuation' } },
  gMaxBefuddle: { effect: { type: 'statusPool', statuses: ['poison', 'paralysis', 'sleep'], chance: 100 } },
  gMaxStunShock: { effect: { type: 'statusPool', statuses: ['poison', 'paralysis'], chance: 100 } },
  gMaxMalodor: { effect: { type: 'status', status: 'poison', chance: 100 } },
  gMaxSnooze: { effect: { type: 'status', status: 'sleep', chance: 100 } },
  gMaxVoltCrash: { effect: { type: 'status', status: 'paralysis', chance: 100 } },
  gMaxGoldRush: { effect: { type: 'confusion' } },
  gMaxSmite: { effect: { type: 'confusion' } },
  gMaxFinale: { effect: { type: 'heal', percentage: 16 } },
  gMaxSweetness: { effect: { type: 'selfCureStatus' } },
  gMaxTartness: {
    effect: { type: 'statChange', target: 'opponent', changes: { evasion: -1 }, chance: 100 },
  },
  gMaxMeltdown: { effect: { type: 'torment' } },
  gMaxChiStrike: { effect: { type: 'focusEnergy' } },
  // The trapping G-Max moves leave a residual drain (approximated with Leech Seed).
  gMaxWildfire: { effect: { type: 'leechSeed' } },
  gMaxVineLash: { effect: { type: 'leechSeed' } },
  gMaxVolcalith: { effect: { type: 'leechSeed' } },
  gMaxCentiferno: { effect: { type: 'leechSeed' } },
  gMaxCannonade: { effect: { type: 'leechSeed' } },
  gMaxSandblast: { effect: { type: 'leechSeed' } },
  gMaxWindRage: { effect: { type: 'removeScreens' } },
  extremeEvoboost: {
    effect: {
      type: 'statChange',
      target: 'self',
      changes: { attack: 2, defense: 2, spAttack: 2, spDefense: 2, speed: 2 },
      chance: 100,
    },
  },

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
  // Moves that roll one status out of several (the single `status` slot can't
  // express this).
  triAttack: {
    effect: { type: 'statusPool', statuses: ['burn', 'freeze', 'paralysis'], chance: 20 },
  },
  direClaw: {
    effect: { type: 'statusPool', statuses: ['poison', 'paralysis', 'sleep'], chance: 50 },
  },
  // Damaging moves that cure the condition they punish (the power doubles
  // against it, see variable-power.js).
  wakeUpSlap: { effect: { type: 'cureStatus', statuses: ['sleep'] } },
  smellingSalts: { effect: { type: 'cureStatus', statuses: ['paralysis'] } },
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
  // Snore can flinch, not put the target to sleep (the extraction mislabelled it).
  snore: { effect: { type: 'status', status: 'flinching', chance: 30 } },
  // Priority values the extraction missed.
  extremeSpeed: { priority: 2 },
  feint: { priority: 2 },
}

/**
 * Physical moves that do not make contact, so contact abilities don't trigger.
 * Kept to the common projectile/ground moves; anything else physical is treated
 * as contact.
 */
const NON_CONTACT_MOVES = new Set([
  'Earthquake',
  'Magnitude',
  'Fissure',
  'Bone Club',
  'Bonemerang',
  'Bone Rush',
  'Bulldoze',
  'Drill Run',
  'Rock Throw',
  'Rock Slide',
  'Rock Tomb',
  'Rock Blast',
  'Stone Edge',
  'Rock Wrecker',
  'Smack Down',
  'Accelerock',
  'Diamond Storm',
  'Meteor Beam',
  'Bullet Seed',
  'Seed Bomb',
  'Pin Missile',
  'Spike Cannon',
  'Barrage',
  'Egg Bomb',
  'Gunk Shot',
  'Self-Destruct',
  'Explosion',
  'Present',
])

/**
 * Whether a move makes contact (for Static / Flame Body / Rough Skin, etc.).
 * @param {Move} moveDef
 * @returns {boolean}
 */
export function moveMakesContact(moveDef) {
  return moveDef?.category === 'physical' && !NON_CONTACT_MOVES.has(moveDef.name)
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
