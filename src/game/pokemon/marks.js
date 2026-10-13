// Per-individual Pokemon marks, a Sword/Shield-style flourish. A freshly
// obtained individual may roll a personality mark ("the Sleepy", "the Rowdy",
// ...), shown with its title on the stats panel and in the Box. The rare mark
// is far harder to roll, and shinies / alphas earn a derived title even when
// they did not roll one.

import { isAlphaPokemon } from './sizes.js'

/** The chance a rolled Pokemon gets any mark at all (5%). */
export const MARK_CHANCE = 0.05

/** Of those, the share that roll the rare Recluse mark (1/1000 overall). */
export const RARE_MARK_CHANCE = 0.02

/**
 * Every mark, keyed by id. `title` is the suffix shown after the name
 * ("Pikachu the Sleepy"); `icon` is a short emoji; `weight` is its share of
 * the roll (0 for the derived Shiny / Alpha marks, which are never rolled).
 * @type {Record<string, { id: string, name: string, title: string, description: string, icon: string, weight: number }>}
 */
export const MARKS = {
  sleepy: {
    id: 'sleepy',
    name: 'Sleepy Mark',
    title: 'the Sleepy',
    description: 'It always looks half asleep.',
    icon: '\u{1f634}',
    weight: 1,
  },
  lunchtime: {
    id: 'lunchtime',
    name: 'Lunchtime Mark',
    title: 'the Lunchtime',
    description: 'It has a knack for turning up at mealtimes.',
    icon: '\u{1f37d}',
    weight: 1,
  },
  rowdy: {
    id: 'rowdy',
    name: 'Rowdy Mark',
    title: 'the Rowdy',
    description: 'It is always spoiling for a scrap.',
    icon: '\u{1f624}',
    weight: 1,
  },
  absentMinded: {
    id: 'absentMinded',
    name: 'Absent-Minded Mark',
    title: 'the Spacey',
    description: 'It is often off in its own little world.',
    icon: '\u{1f914}',
    weight: 1,
  },
  jittery: {
    id: 'jittery',
    name: 'Jittery Mark',
    title: 'the Anxious',
    description: 'It startles at the slightest thing.',
    icon: '\u{1f630}',
    weight: 1,
  },
  excited: {
    id: 'excited',
    name: 'Excited Mark',
    title: 'the Excited',
    description: 'It can barely contain its energy.',
    icon: '\u{1f929}',
    weight: 1,
  },
  charismatic: {
    id: 'charismatic',
    name: 'Charismatic Mark',
    title: 'the Charismatic',
    description: 'It has a way of winning a crowd over.',
    icon: '\u{1f60e}',
    weight: 1,
  },
  calm: {
    id: 'calm',
    name: 'Calmness Mark',
    title: 'the Calm',
    description: 'It stays serene no matter the odds.',
    icon: '\u{1f60c}',
    weight: 1,
  },
  intense: {
    id: 'intense',
    name: 'Intense Mark',
    title: 'the Intense',
    description: 'It never does anything by halves.',
    icon: '\u{1f620}',
    weight: 1,
  },
  zonedOut: {
    id: 'zonedOut',
    name: 'Zoned-Out Mark',
    title: 'the Zoned-Out',
    description: 'It drifts off at the oddest moments.',
    icon: '\u{1f635}',
    weight: 1,
  },
  joyful: {
    id: 'joyful',
    name: 'Joyful Mark',
    title: 'the Joyful',
    description: 'It finds something to celebrate in everything.',
    icon: '\u{1f60a}',
    weight: 1,
  },
  angry: {
    id: 'angry',
    name: 'Angry Mark',
    title: 'the Angry',
    description: 'Its temper is always close to the surface.',
    icon: '\u{1f621}',
    weight: 1,
  },
  smiley: {
    id: 'smiley',
    name: 'Smiley Mark',
    title: 'the Smiley',
    description: 'It greets every day with a grin.',
    icon: '\u{1f642}',
    weight: 1,
  },
  teary: {
    id: 'teary',
    name: 'Teary Mark',
    title: 'the Teary',
    description: 'It feels everything deeply.',
    icon: '\u{1f622}',
    weight: 1,
  },
  upbeat: {
    id: 'upbeat',
    name: 'Upbeat Mark',
    title: 'the Upbeat',
    description: 'It keeps the whole team\u2019s spirits high.',
    icon: '\u{1f604}',
    weight: 1,
  },
  peeved: {
    id: 'peeved',
    name: 'Peeved Mark',
    title: 'the Peeved',
    description: 'It huffs at the smallest inconvenience.',
    icon: '\u{1f612}',
    weight: 1,
  },
  scowling: {
    id: 'scowling',
    name: 'Scowling Mark',
    title: 'the Scowling',
    description: 'It wears a permanent scowl.',
    icon: '\u{1f641}',
    weight: 1,
  },
  uncommon: {
    id: 'uncommon',
    name: 'Uncommon Mark',
    title: 'the Sociable',
    description: 'A friendly sort that is a little hard to find.',
    icon: '\u{1f91d}',
    weight: 0.5,
  },
  rare: {
    id: 'rare',
    name: 'Rare Mark',
    title: 'the Recluse',
    description: 'A truly elusive individual.',
    icon: '\u{1f48e}',
    weight: 0,
  },
  shiny: {
    id: 'shiny',
    name: 'Shiny Mark',
    title: 'the Shiny',
    description: 'A rare shiny individual.',
    icon: '\u2728',
    weight: 0,
  },
  alpha: {
    id: 'alpha',
    name: 'Alpha Mark',
    title: 'the Alpha',
    description: 'A huge specimen that earns extra EXP.',
    icon: '\u2605',
    weight: 0,
  },
}

/** The marks a fresh roll can pick, weighted by `weight`. */
const ROLLABLE_MARKS = Object.values(MARKS).filter((mark) => mark.weight > 0)

const ROLLABLE_WEIGHT = ROLLABLE_MARKS.reduce((sum, mark) => sum + mark.weight, 0)

/**
 * Roll a mark id for a freshly obtained Pokemon, or null for the common
 * unmarked case. The rare mark is a standalone 1/1000 roll; every other mark
 * shares a flat pool.
 * @param {() => number} [rng]
 * @returns {string | null}
 */
export function rollMark(rng = Math.random) {
  if (rng() >= MARK_CHANCE) return null
  if (rng() < RARE_MARK_CHANCE) return 'rare'
  let roll = rng() * ROLLABLE_WEIGHT
  for (const mark of ROLLABLE_MARKS) {
    roll -= mark.weight
    if (roll < 0) return mark.id
  }
  return ROLLABLE_MARKS[ROLLABLE_MARKS.length - 1].id
}

/**
 * The mark this individual stores from its creation roll, if any.
 * @param {{ mark?: string | null } | null | undefined} pokemon
 * @returns {{ id: string, name: string, title: string, description: string, icon: string, weight: number } | null}
 */
export function storedMark(pokemon) {
  return pokemon?.mark ? MARKS[pokemon.mark] ?? null : null
}

/**
 * The mark that titles this individual: its rolled mark if it has one, else a
 * derived Shiny or Alpha mark. Null for an ordinary unmarked Pokemon.
 * @param {{ mark?: string | null, isShiny?: boolean, size?: number } | null | undefined} pokemon
 * @returns {{ id: string, name: string, title: string, description: string, icon: string, weight: number } | null}
 */
export function resolveMark(pokemon) {
  if (!pokemon) return null
  const rolled = storedMark(pokemon)
  if (rolled) return rolled
  if (pokemon.isShiny) return MARKS.shiny
  return isAlphaPokemon(pokemon) ? MARKS.alpha : null
}

/**
 * The title to show for an individual, e.g. "the Sleepy". Empty when it has no
 * mark.
 * @param {{ mark?: string | null, isShiny?: boolean, size?: number } | null | undefined} pokemon
 * @returns {string}
 */
export function markTitle(pokemon) {
  return resolveMark(pokemon)?.title ?? ''
}

/**
 * The hover tooltip for a mark chip, naming the mark and what it means.
 * @param {{ mark?: string | null, isShiny?: boolean, size?: number } | null | undefined} pokemon
 * @returns {string}
 */
export function markTooltip(pokemon) {
  const mark = resolveMark(pokemon)
  return mark ? `${mark.name} \u2014 ${mark.description}` : ''
}
