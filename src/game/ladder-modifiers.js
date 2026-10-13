// Battle Tower ladder modifiers (#93): a weekly rotating rule set layered on
// top of the Tower and the Battle Frontier. The pick is derived from the date,
// so every player climbs the same ladder in the same week and a reload keeps
// it (no save field needed). Pure helpers here; the battle loop reads the flags
// through use-game-loop.js and the combat engine.

import { dayNumberForDateKey, todayKey } from '../data/daily-events.js'

/** @type {LadderModifier[]} */
export const LADDER_MODIFIERS = [
  {
    id: 'inverse',
    name: 'Inverse',
    icon: '\u{1f504}',
    tagline: 'Inverse type chart',
    hint: 'Resistances become weaknesses and immunities become 2\u00d7 hits for both sides.',
  },
  {
    id: 'noItems',
    name: 'No Items',
    icon: '\u{1f6ab}',
    tagline: 'Held items ignored',
    hint: 'Every held item is ignored for both sides \u2014 only stats, moves and abilities decide it.',
  },
  {
    id: 'weather',
    name: 'Weather Lock',
    icon: '\u{1f327}\ufe0f',
    tagline: 'Locked weather',
    hint: 'Every floor starts under heavy rain that no move or ability can change for the whole battle.',
    weather: 'rain',
  },
  {
    id: 'noHealing',
    name: 'No Healing',
    icon: '\u{1f494}',
    tagline: 'Healing disabled',
    hint: 'Healing moves, held-item heals, healing abilities and medicine are all suppressed \u2014 win without recovery.',
  },
]

/**
 * The modifier with an id, or null.
 * @param {string} id
 * @returns {LadderModifier | null}
 */
export function ladderModifier(id) {
  return LADDER_MODIFIERS.find((modifier) => modifier.id === id) ?? null
}

/**
 * The weekly rule sets, cycled by week number. A standard week is kept in the
 * rotation so the ladder isn't always punishing.
 * @type {{ key: string, name: string, icon: string, modifierIds: string[], hint: string }[]}
 */
export const LADDER_ROTATION = [
  {
    key: 'standard',
    name: 'Standard Ladder',
    icon: '\u{1f4cb}',
    modifierIds: [],
    hint: 'A clean week: the ordinary Tower and Frontier rules, nothing extra.',
  },
  {
    key: 'inverse',
    name: 'Inverse Ladder',
    icon: '\u{1f504}',
    modifierIds: ['inverse'],
    hint: 'The type chart is flipped for both sides.',
  },
  {
    key: 'barehanded',
    name: 'Bare-Hands Ladder',
    icon: '\u{1f6ab}',
    modifierIds: ['noItems'],
    hint: 'Held items are ignored for both sides.',
  },
  {
    key: 'storm',
    name: 'Storm Ladder',
    icon: '\u{1f327}\ufe0f',
    modifierIds: ['weather'],
    hint: 'Every floor is locked under heavy rain.',
  },
  {
    key: 'attrition',
    name: 'Attrition Ladder',
    icon: '\u{1f494}',
    modifierIds: ['noHealing'],
    hint: 'No healing of any kind for either side.',
  },
]

/**
 * The weekly rule set for a date. Deterministic, so the same week is the same
 * ladder for everyone and a reload keeps it.
 * @param {string} [dateKey]
 * @returns {LadderRuleSet}
 */
export function activeLadderRuleSet(dateKey = todayKey()) {
  const dayNumber = dayNumberForDateKey(dateKey),
    week = Math.floor(dayNumber / 7),
    index =
      ((week % LADDER_ROTATION.length) + LADDER_ROTATION.length) % LADDER_ROTATION.length,
    entry = LADDER_ROTATION[index],
    modifiers = /** @type {LadderModifier[]} */ (
      entry.modifierIds.map(ladderModifier).filter((modifier) => modifier !== null)
    ),
    weather = modifiers.find((modifier) => modifier.weather)?.weather ?? null
  return {
    key: entry.key,
    name: entry.name,
    icon: entry.icon,
    hint: entry.hint,
    modifierIds: [...entry.modifierIds],
    modifiers,
    weather,
    week,
    date: dateKey,
  }
}

/**
 * The battle-payload fields a ladder run carries, spread into the
 * `pendingBossBattle` (see game/battle-frontier.js and the Tower panel).
 * @param {LadderRuleSet} ladder
 * @returns {{ modifiers: string[], ladderKey: string, ladderName: string, weatherLock: string | null }}
 */
export function ladderBattleFields(ladder) {
  return {
    modifiers: ladder.modifierIds,
    ladderKey: ladder.key,
    ladderName: ladder.name,
    weatherLock: ladder.weather,
  }
}

/**
 * The modifier ids in effect for a battle: the weekly ladder set plus the
 * facility's own fixed rule. `rental` is handled by the reducer (it swaps the
 * party) and is not a battle modifier.
 * @param {LadderBattle | null | undefined} bossBattle
 * @returns {Set<string>}
 */
export function battleModifierSet(bossBattle) {
  const ids = new Set(bossBattle?.modifiers ?? [])
  if (bossBattle?.rule === 'inverse' || bossBattle?.rule === 'noItems') ids.add(bossBattle.rule)
  return ids
}

/**
 * Whether a battle runs a given modifier.
 * @param {LadderBattle | null | undefined} bossBattle
 * @param {string} id
 * @returns {boolean}
 */
export function hasBattleModifier(bossBattle, id) {
  return battleModifierSet(bossBattle).has(id)
}

/**
 * The weather a ladder battle is locked to, or null.
 * @param {LadderBattle | null | undefined} bossBattle
 * @returns {string | null}
 */
export function battleWeatherLock(bossBattle) {
  return bossBattle?.weatherLock ?? null
}
