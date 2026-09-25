// Two-turn moves: the user spends one turn charging (sometimes turning
// semi-invulnerable), then strikes on the next. Keyed by move id.

/**
 * @type {Record<string, { message: (name: string) => string, invulnerable?: string }>}
 */
export const CHARGE_MOVES = {
  solarBeam: { message: (name) => `${name} absorbed light!` },
  solarBlade: { message: (name) => `${name} absorbed light!` },
  razorWind: { message: (name) => `${name} whipped up a whirlwind!` },
  skyAttack: { message: (name) => `${name} is glowing!` },
  skullBash: { message: (name) => `${name} tucked in its head!` },
  freezeShock: { message: (name) => `${name} is charging!` },
  iceBurn: { message: (name) => `${name} is charging!` },
  geomancy: { message: (name) => `${name} is gathering power!` },
  meteorBeam: { message: (name) => `${name} is charging!` },
  electroShot: { message: (name) => `${name} is charging!` },
  // Semi-invulnerable charge turns.
  fly: { message: (name) => `${name} flew up high!`, invulnerable: 'air' },
  bounce: { message: (name) => `${name} bounced up high!`, invulnerable: 'air' },
  dig: { message: (name) => `${name} burrowed underground!`, invulnerable: 'ground' },
  dive: { message: (name) => `${name} dove underwater!`, invulnerable: 'water' },
  phantomForce: { message: (name) => `${name} vanished!`, invulnerable: 'vanish' },
  shadowForce: { message: (name) => `${name} vanished!`, invulnerable: 'vanish' },
}

/**
 * Moves that can still connect with each kind of semi-invulnerable target.
 * @type {Record<string, Set<string>>}
 */
const HITS_INVULNERABLE = {
  air: new Set([
    'gust',
    'twister',
    'thunder',
    'hurricane',
    'skyUppercut',
    'smackDown',
    'thousandArrows',
  ]),
  ground: new Set(['earthquake', 'magnitude', 'fissure']),
  water: new Set(['surf', 'whirlpool']),
  vanish: new Set(),
}

/**
 * Whether `moveId` can hit a defender that is semi-invulnerable in `state`.
 * @param {string} moveId
 * @param {string | null | undefined} state
 * @returns {boolean}
 */
export function hitsSemiInvulnerable(moveId, state) {
  return !!state && (HITS_INVULNERABLE[state]?.has(moveId) ?? false)
}
