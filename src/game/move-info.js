// Human-readable move descriptions, shared by the in-game hover tooltips and
// the generated Battle Reference page (tools/generate-reference.cjs requires
// this module). `describeMove` mirrors the engine's effect handling and reads
// the enriched move table (src/data/move-effects.js applied), so a tooltip
// matches what the move actually does.

/** @type {Record<string, string>} */
const STAT_LABELS = {
  attack: 'Attack',
  defense: 'Defense',
  spAttack: 'Sp. Atk',
  spDefense: 'Sp. Def',
  speed: 'Speed',
  accuracy: 'accuracy',
  evasion: 'evasiveness',
}

/** @type {Record<string, string>} */
const STATUS_LABELS = {
  poison: 'poison',
  toxic: 'badly poison',
  burn: 'burn',
  freeze: 'freeze',
  sleep: 'sleep',
  paralysis: 'paralyze',
  flinching: 'flinch',
}

/**
 * @param {string} key
 * @returns {string}
 */
function normalizeStatKey(key) {
  return (
    /** @type {Record<string, string>} */ ({
      'special-attack': 'spAttack',
      'special-defense': 'spDefense',
      'sp-atk': 'spAttack',
      'sp-def': 'spDefense',
      evasiveness: 'evasion',
    })[key] ?? key
  )
}

/**
 * Turn a `statChange` effect's changes into readable text.
 * @param {{ changes?: Record<string, number>, target?: string, chance?: number }} effect
 */
function describeStatChange(effect) {
  const parts = Object.entries(effect.changes ?? {}).map(([key, delta]) => {
    const label = STAT_LABELS[normalizeStatKey(key)] ?? normalizeStatKey(key)
    const magnitude =
      Math.abs(delta) === 1 ? '' : Math.abs(delta) === 2 ? ' sharply' : ` by ${Math.abs(delta)}`
    return `${label} ${delta > 0 ? 'up' : 'down'}${magnitude}`
  })
  const subject = effect.target === 'self' ? 'the user' : 'the target'
  const prefix =
    effect.chance && effect.chance < 100 ? `${effect.chance}% chance to change ` : 'Changes '
  return `${prefix}${subject}\u2019s stats: ${parts.join(', ')}.`
}

/**
 * Description of each `effect.type` the turn resolver acts on. Move entries
 * reference these; `{...}` placeholders are filled from the move data.
 * @type {Record<string, string>}
 */
/** @type {Record<string, string>} */
const moveEffectText = {
  heal: 'Heals the user{status}.',
  recoil: 'The user takes recoil damage.',
  drain: 'Heals the user for {percentage}% of the damage dealt.',
  status: 'May {status} the target.',
  statusPool: 'May inflict one of several status conditions on the target.',
  cureStatus: 'Cures the target\u2019s matching status condition.',
  statChange: 'Changes stats ({changes}).',
  statReset: 'Resets the target\u2019s stat stages.',
  selfDestruct: 'The user faints.',
  recharge: 'The user must recharge next turn.',
  crashOnMiss: 'The user takes crash damage if the move misses.',
  multiTurnLock: 'Locks the user in for several turns, then confuses it.',
  confusion: 'Confuses the target.',
  leechSeed: 'Seeds the target, draining 1/8 max HP into the user each turn.',
  taunt: 'The target cannot use status moves for a few turns.',
  substitute: 'The user spends HP to make a substitute that soaks damage.',
  infatuation: 'Infatuates the target if the two are compatible genders.',
  curse: 'A Ghost-type Curse; otherwise raises Attack and Speed and slowly drains HP.',
  focusEnergy: 'Raises the user\u2019s critical-hit stage for the rest of the battle.',
  aquaRing: 'Heals the user 1/16 max HP each turn.',
  wish: 'Heals the user\u2019s side at the end of the next turn.',
  yawn: 'Puts the target to sleep at the end of the next turn.',
  statInvert: 'Inverts the target\u2019s stat stages.',
  painSplit: 'Averages the user\u2019s and target\u2019s HP.',
  safeguard: 'Protects the user\u2019s side from status for a few turns.',
  mist: 'Protects the user\u2019s side from stat drops for a few turns.',
  encore: 'Locks the target into its last move for a few turns.',
  disable: 'Disables the target\u2019s last move for a few turns.',
  perishSong: 'Gives both sides a three-turn countdown to faint.',
  tailwind: 'Doubles the user\u2019s side Speed for a few turns.',
  trickRoom: 'Reverses the speed order (goes last when used).',
  destinyBond: 'Drags down whoever KOs the user.',
  ingrain: 'Heals the user 1/16 max HP each turn.',
  laserFocus: 'The user\u2019s next hit is a guaranteed critical hit.',
  lockOn: 'The user\u2019s next hit cannot miss.',
  gastroAcid: 'Suppresses the target\u2019s ability.',
  worrySeed: 'Changes the target\u2019s ability to Insomnia.',
  simpleBeam: 'Changes the target\u2019s ability to Simple.',
  rolePlay: 'Copies the target\u2019s ability.',
  entrainment: 'Shares the user\u2019s ability with the target.',
  skillSwap: 'Swaps abilities with the target.',
  typeChange: 'Changes the target\u2019s type.',
  reflectType: 'Copies the target\u2019s type onto the user.',
  typeAdd: 'Adds a type to the target.',
  statSwap: 'Swaps stat stages with the target.',
  statSplit: 'Averages the listed stats with the target.',
  randomBoost: 'Raises a random stat by two stages.',
  powerTrick: 'Swaps the user\u2019s Attack and Defense stats.',
  psychUp: 'Copies the target\u2019s stat changes onto the user.',
  selfCureStatus: 'Cures the user\u2019s status condition.',
  conversion2: 'Changes the user\u2019s type to resist the target\u2019s last move.',
  courtChange: 'Swaps the entry hazards on both sides of the field.',
  foresight: 'Identifies the target: its evasion is ignored and Normal / Fighting moves can hit it.',
  luckyChant: 'Prevents critical hits against the user\u2019s side for five turns.',
  powerShift: 'Swaps the user\u2019s Attack and Sp. Atk stats.',
  stockpile: 'Stores power (up to three) for Spit Up or Swallow.',
  swallow: 'Heals the user based on its Stockpile count.',
  transform: 'Copies the target\u2019s types and stats.',
  nightmare: 'Gives a sleeping target a nightmare that hurts it each turn.',
  doodle: 'Copies the user\u2019s ability onto the target.',
  screen: 'Sets up a barrier that halves damage for five turns.',
  removeScreens: 'Blows away the foe\u2019s screens.',
  torment: 'Torments the target so it cannot repeat a move.',
  magnetRise: 'Levitates the user, granting immunity to Ground moves for five turns.',
  conversion: 'Changes the user\u2019s type to that of its first move.',
  camouflage: 'Changes the user\u2019s type to match the terrain.',
  enduring: 'Endures any hit this turn, surviving with at least 1 HP.',
  tidyUp: 'Raises the user\u2019s Attack and Speed and clears every entry hazard.',
  psychoShift: 'Passes the user\u2019s status condition to the target.',
  purify: 'Cures the target\u2019s status and restores the user\u2019s HP.',
  recycle: 'Restores the user\u2019s consumed held item.',
  healingWish: 'The next Pokemon sent out is fully healed and cured of status.',
  itemSwap: 'Swaps held items with the target.',
  bestow: 'Gives the target the user\u2019s held item.',
  corrosiveGas: 'Destroys the target\u2019s held item.',
  stealItem: 'Steals the target\u2019s held item when the user has none.',
  knockOff: 'Knocks off the target\u2019s held item for the rest of the battle.',
  incinerate: 'Burns away the target\u2019s held Berry so it cannot be eaten.',
  eatBerry: 'Eats the target\u2019s held Berry to heal the user.',
  healBlock: 'Prevents the target from healing for five turns.',
  speedSwap: 'Swaps raw Speed with the target.',
  hazard: 'Sets an entry hazard on the foe\u2019s side of the field.',
  weather: 'Changes the weather.',
  terrain: 'Changes the terrain.',
}

/**
 * Moves whose base power is computed from the battlers at use time (see
 * src/game/combat/variable-power.js).
 * @type {Record<string, string>}
 */
export const variablePowerNotes = {
  heatCrash: 'Stronger the heavier the user is relative to the target (40\u2013120 power).',
  heavySlam: 'Stronger the heavier the user is relative to the target (40\u2013120 power).',
  lowKick: 'Stronger the heavier the target is (20\u2013120 power).',
  grassKnot: 'Stronger the heavier the target is (20\u2013120 power).',
  electroBall: 'Stronger the faster the user is relative to the target (40\u2013150 power).',
  gyroBall: 'Stronger the slower the user is relative to the target (up to 150 power).',
  flail: 'Stronger the lower the user\u2019s HP (40\u2013200 power).',
  reversal: 'Stronger the lower the user\u2019s HP (40\u2013200 power).',
  eruption: 'Power scales with the user\u2019s remaining HP (up to 150).',
  waterSpout: 'Power scales with the user\u2019s remaining HP (up to 150).',
  dragonEnergy: 'Power scales with the user\u2019s remaining HP (up to 150).',
  crushGrip: 'Power scales with the target\u2019s remaining HP (up to 120).',
  wringOut: 'Power scales with the target\u2019s remaining HP (up to 120).',
  return: 'Stronger the higher the user\u2019s friendship (up to 102 power).',
  frustration: 'Stronger the lower the user\u2019s friendship (up to 102 power).',
  storedPower: '20 power, plus 20 for each of the user\u2019s raised stats.',
  powerTrip: '20 power, plus 20 for each of the user\u2019s raised stats.',
  punishment: '60 power, plus 20 for each of the target\u2019s raised stats (max 200).',
  facade: 'Double power (140) when the user has a status condition.',
  hex: 'Double power (130) when the target has a status condition.',
  venoshock: 'Double power (130) when the target is poisoned.',
  brine: 'Double power (130) when the target is at or below half HP.',
  wakeUpSlap: 'Double power (140) against a sleeping target, which it wakes.',
  smellingSalts: 'Double power (140) against a paralyzed target, which it cures.',
  retaliate: 'Double power (140) when a party member has fainted.',
  echoedVoice: 'Grows each turn it is used in a row (40 up to 200 power).',
  round: 'Double power (120) when the user used it on the previous turn.',
  mistyExplosion: '150 power on Misty Terrain, otherwise 100 (and the user faints).',
  expandingForce: '120 power on Psychic Terrain, otherwise 80.',
  risingVoltage: '140 power on Electric Terrain, otherwise 70.',
  boltBeak: 'Double power (170) when the user moves first.',
  fishiousRend: 'Double power (170) when the user moves first.',
  payback: 'Double power (100) if the target has already moved this turn.',
  avalanche: 'Double power (120) if the user moves after the target.',
  revenge: 'Double power (120) if the user moves after the target.',
}

/**
 * Two-turn charge moves (see src/game/combat/charge-moves.js).
 * @type {Record<string, string>}
 */
export const chargeMoveNotes = {
  solarBeam: 'Charges on the first turn, then attacks on the next.',
  solarBlade: 'Charges on the first turn, then attacks on the next.',
  razorWind: 'Charges on the first turn, then attacks on the next.',
  skyAttack: 'Charges on the first turn, then attacks on the next.',
  skullBash: 'Charges on the first turn, then attacks on the next.',
  freezeShock: 'Charges on the first turn, then attacks on the next.',
  iceBurn: 'Charges on the first turn, then attacks on the next.',
  geomancy: 'Charges on the first turn, then takes effect on the next.',
  meteorBeam: 'Charges on the first turn, then attacks on the next.',
  electroShot: 'Charges on the first turn, then attacks on the next.',
  fly: 'Flies up on the first turn (semi-invulnerable), then attacks on the next.',
  bounce: 'Bounces up on the first turn (semi-invulnerable), then attacks on the next.',
  dig: 'Burrows on the first turn (semi-invulnerable), then attacks on the next.',
  dive: 'Dives on the first turn (semi-invulnerable), then attacks on the next.',
  phantomForce: 'Vanishes on the first turn (semi-invulnerable), then attacks on the next.',
  shadowForce: 'Vanishes on the first turn (semi-invulnerable), then attacks on the next.',
}

/**
 * Moves that call another move (Metronome, Copycat, Mirror Move, Nature Power,
 * Sleep Talk). The engine resolves them specially in `resolveCalledMove` /
 * `resolveBattleTurn` rather than through an `effect`.
 * @type {Record<string, string>}
 */
export const callingMoveNotes = {
  metronome: 'Uses a random move.',
  copycat: 'Uses the last move the opponent used.',
  mirrorMove: 'Uses the last move the opponent used.',
  naturePower: 'Becomes a move that depends on the terrain.',
  sleepTalk: 'Usable only while asleep; uses a random move from the user\u2019s moveset.',
  assist: 'Uses a random move known by another party member.',
  meFirst: 'Borrows the foe\u2019s chosen damaging move at 1.5x power, if the user moves first.',
}

/**
 * Notes for moves the engine handles by conversion (Max / G-Max / Z-Moves)
 * rather than through a plain `effect`.
 * @type {Record<string, string>}
 */
export const specialMoveNotes = {
  breakneckBlitz: 'Z-Move: a devastating Normal-type attack.',
  infernoOverdrive: 'Z-Move: a devastating Fire-type attack.',
  hydroVortex: 'Z-Move: a devastating Water-type attack.',
  gigavoltHavoc: 'Z-Move: a devastating Electric-type attack.',
  bloomDoom: 'Z-Move: a devastating Grass-type attack.',
  subzeroSlammer: 'Z-Move: a devastating Ice-type attack.',
  allOutPummeling: 'Z-Move: a devastating Fighting-type attack.',
  acidDownpour: 'Z-Move: a devastating Poison-type attack.',
  tectonicRage: 'Z-Move: a devastating Ground-type attack.',
  supersonicSkystrike: 'Z-Move: a devastating Flying-type attack.',
  shatteredPsyche: 'Z-Move: a devastating Psychic-type attack.',
  savageSpinOut: 'Z-Move: a devastating Bug-type attack.',
  continentalCrush: 'Z-Move: a devastating Rock-type attack.',
  neverEndingNightmare: 'Z-Move: a devastating Ghost-type attack.',
  devastatingDrake: 'Z-Move: a devastating Dragon-type attack.',
  blackHoleEclipse: 'Z-Move: a devastating Dark-type attack.',
  corkscrewCrash: 'Z-Move: a devastating Steel-type attack.',
  twinkleTackle: 'Z-Move: a devastating Fairy-type attack.',
  gMaxDepletion: 'G-Max Move: hits hard and drains the foe\u2019s PP.',
  gMaxGravitas: 'G-Max Move: intensifies gravity for five turns.',
  gMaxReplenish: 'G-Max Move: may restore a held Berry.',
  gMaxTerror: 'G-Max Move: prevents the foe from switching out.',
}

/**
 * Extra explanation for moves whose effect needs more than the generic line.
 * @type {Record<string, string>}
 */
const moveNotes = {
  curse:
    'A Ghost-type user pays HP for the curse; other types raise Attack/Speed and are drained each turn.',
  wish: 'Heals the user\u2019s side by up to 50% max HP when the timer ends.',
  yawn: 'The target falls asleep at the end of the next turn unless it switches out.',
  trickRoom: 'Moves last when used, then reverses the turn order for its duration.',
  perishSong:
    'A three-turn countdown; when it ends the Pokemon faints (ignores abilities).',
  painSplit: 'Averages both Pokemon\u2019s current HP.',
}

/** The `effect.type`s with a hand-written description above. */
export const handledMoveEffectTypes = new Set(Object.keys(moveEffectText))

/**
 * A one-line description of a move's implemented effect, or null when the
 * engine does not act on it.
 * @param {Move & { key?: string }} move
 * @returns {string | null}
 */
function describeMoveBase(move) {
  const callingNote = callingMoveNotes[move.key ?? '']
  if (callingNote) return callingNote
  const variableNote = variablePowerNotes[move.key ?? '']
  if (variableNote) return variableNote
  const specialNote = specialMoveNotes[move.key ?? '']
  if (specialNote) return specialNote
  const chargeNote = chargeMoveNotes[move.key ?? '']
  if (chargeNote && !move.effect) return chargeNote
  // Memento keeps its stat drop but also faints the user.
  if (move.selfDestruct) {
    const base = describeMoveBase({ ...move, selfDestruct: false })
    return base ? `${base} The user faints.` : 'The user faints.'
  }
  const notes = moveNotes[move.key ?? '']
  const effect = move.effect

  if (move.protect) return 'Blocks most moves for the turn (priority +4).'
  if (move.screen === 'both') return 'Halves physical and special damage for five turns.'
  if (move.screen === 'reflect') return 'Halves physical damage for five turns.'
  if (move.screen === 'lightScreen') return 'Halves special damage for five turns.'
  if (move.multiHit) {
    const [min, max] = move.multiHit
    return min === max ? `Hits ${min} times.` : `Hits ${min}\u2013${max} times.`
  }
  if (move.critStage) return 'High critical-hit ratio.'
  if (!effect) return null

  switch (effect.type) {
    case 'heal': {
      let text = `Heals the user ${effect.percentage}% of its max HP`
      if (effect.status === 'sleep') text += ' and puts it to sleep'
      if (effect.statusCure) text += ' and cures its status'
      return `${text}.${notes ? ' ' + notes : ''}`
    }
    case 'recoil':
      return `The user takes recoil (${Math.round(effect.fraction * 100)}% of the damage dealt).`
    case 'drain':
      return `Heals the user for ${effect.percentage ?? 50}% of the damage dealt.`
    case 'status': {
      const label = STATUS_LABELS[effect.status] ?? effect.status
      return effect.chance && effect.chance < 100
        ? `${effect.chance}% chance to ${label} the target.`
        : `Inflicts ${label} on the target.`
    }
    case 'statusPool': {
      const labels = (effect.statuses ?? [])
        .map(/** @param {string} status */ (status) => STATUS_LABELS[status] ?? status)
        .join(', ')
      return effect.chance && effect.chance < 100
        ? `${effect.chance}% chance to inflict one of ${labels} on the target.`
        : `Inflicts one of ${labels} on the target.`
    }
    case 'cureStatus': {
      const labels = (effect.statuses ?? [])
        .map(/** @param {string} status */ (status) => STATUS_LABELS[status] ?? status)
        .join(', ')
      return `Cures the target of ${labels}.`
    }
    case 'statChange':
      return describeStatChange(effect)
    case 'confusion':
      return 'Confuses the target.'
    case 'infatuation':
      return 'Infatuates the target (needs opposite genders).'
    case 'statReset':
      return effect.target === 'all'
        ? 'Resets all stat stages on the field.'
        : 'Resets the target\u2019s stat stages.'
    case 'hazard': {
      /** @type {Record<string, string>} */
      const labels = {
        stealthRock: 'Stealth Rock',
        spikes: 'Spikes',
        toxicSpikes: 'Toxic Spikes',
        stickyWeb: 'Sticky Web',
      }
      return `Sets ${labels[effect.hazard] ?? 'an entry hazard'} on the foe\u2019s side.`
    }
    case 'weather': {
      /** @type {Record<string, string>} */
      const labels = {
        rain: 'rain',
        sun: 'harsh sunlight',
        sandstorm: 'a sandstorm',
        snow: 'snow',
        hail: 'hail',
      }
      return `Summons ${labels[effect.weather] ?? 'weather'} for five turns.`
    }
    case 'terrain': {
      /** @type {Record<string, string>} */
      const labels = {
        electric: 'Electric',
        grassy: 'Grassy',
        misty: 'Misty',
        psychic: 'Psychic',
      }
      return `Sets ${labels[effect.terrain] ?? ''} Terrain for five turns.`
    }
    case 'typeChange':
      return `Changes the target\u2019s type to ${effect.types.join('/')}.`
    case 'typeAdd':
      return `Adds the ${effect.typeName} type to the target.`
    case 'statSwap':
      return `Swaps ${effect.stats.map(/** @param {string} stat */ (stat) => STAT_LABELS[stat] ?? stat).join(', ')} with the target.`
    case 'statSplit':
      return `Averages the user\u2019s and target\u2019s ${effect.stats
        .map(/** @param {string} stat */ (stat) => STAT_LABELS[stat] ?? stat)
        .join(' and ')}.`
  }
  if (moveEffectText[effect.type]) {
    // A hand-written note is more precise than the generic line, so prefer it.
    if (notes) return notes
    let text = moveEffectText[effect.type]
    if (text.includes('{percentage}')) text = text.replace('{percentage}', effect.percentage ?? 50)
    if (text.includes('{status}'))
      text = text.replace('{status}', STATUS_LABELS[effect.status] ?? effect.status ?? '')
    if (text.includes('{changes}')) text = text.replace('{changes}', '')
    return `${text}${notes ? ' ' + notes : ''}`
  }
  return null
}

/**
 * Describe a damaging move's extra `secondary` effect, which rides alongside
 * its primary effect (Flare Blitz recoils and can burn, ...).
 * @param {any} secondary
 * @returns {string | null}
 */
function describeSecondaryEffect(secondary) {
  if (!secondary) return null
  if (secondary.statuses) {
    const labels = secondary.statuses
      .map(/** @param {string} status */ (status) => STATUS_LABELS[status] ?? status)
      .join(', ')
    return secondary.chance && secondary.chance < 100
      ? `${secondary.chance}% chance to inflict one of ${labels} on the target.`
      : `Inflicts one of ${labels} on the target.`
  }
  if (secondary.status) {
    const label = STATUS_LABELS[secondary.status] ?? secondary.status
    return secondary.chance && secondary.chance < 100
      ? `${secondary.chance}% chance to ${label} the target.`
      : `Inflicts ${label} on the target.`
  }
  if (secondary.changes) return describeStatChange(secondary)
  return null
}

/**
 * A one-line description of a move's implemented effects, including any
 * `secondary` that rides alongside its primary effect.
 * @param {Move & { key?: string }} move
 * @returns {string | null}
 */
export function describeMove(move) {
  const parts = [describeMoveBase(move), describeSecondaryEffect(move.secondary)].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : null
}

/**
 * Full hover-tooltip text for a move: its type / category / power / accuracy,
 * then a plain-English description of the effect (when the engine acts on it).
 * @param {string} moveId
 * @param {Move} move
 * @returns {string}
 */
export function moveTooltip(moveId, move) {
  const kind =
      move.category === 'physical'
        ? 'Physical'
        : move.category === 'special'
          ? 'Special'
          : 'Status',
    accuracy = move.accuracy > 100 ? 'never misses' : `${move.accuracy}% accuracy`,
    statLine =
      move.power > 0
        ? `${move.type} \u00b7 ${kind} \u00b7 ${move.power} power \u00b7 ${accuracy}`
        : variablePowerNotes[moveId]
          ? `${move.type} \u00b7 ${kind} \u00b7 variable power \u00b7 ${accuracy}`
          : `${move.type} \u00b7 ${kind} \u00b7 ${accuracy}`,
    effect = describeMove({ key: moveId, ...move })
  return effect ? `${statLine}\n${effect}` : statLine
}
