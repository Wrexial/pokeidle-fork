// The 25 natures. Each raises one non-HP stat by 10% and lowers another by 10%;
// the five neutral natures raise and lower the same stat, so they have no
// effect. Stat keys match `StatBlock` / `calculatePokemonStats`.
//
// Natures are rolled when a Pokemon is created (`createPokemon`) and can be
// re-rolled with a Nature Mint (see `USE_ITEM_ON_POKEMON`).

/**
 * @type {{ key: string, name: string, increased: string, decreased: string }[]}
 */
export const NATURES = [
  { key: 'hardy', name: 'Hardy', increased: 'attack', decreased: 'attack' },
  { key: 'lonely', name: 'Lonely', increased: 'attack', decreased: 'defense' },
  { key: 'brave', name: 'Brave', increased: 'attack', decreased: 'speed' },
  { key: 'adamant', name: 'Adamant', increased: 'attack', decreased: 'spAttack' },
  { key: 'naughty', name: 'Naughty', increased: 'attack', decreased: 'spDefense' },
  { key: 'bold', name: 'Bold', increased: 'defense', decreased: 'attack' },
  { key: 'docile', name: 'Docile', increased: 'defense', decreased: 'defense' },
  { key: 'relaxed', name: 'Relaxed', increased: 'defense', decreased: 'speed' },
  { key: 'impish', name: 'Impish', increased: 'defense', decreased: 'spAttack' },
  { key: 'lax', name: 'Lax', increased: 'defense', decreased: 'spDefense' },
  { key: 'timid', name: 'Timid', increased: 'speed', decreased: 'attack' },
  { key: 'hasty', name: 'Hasty', increased: 'speed', decreased: 'defense' },
  { key: 'serious', name: 'Serious', increased: 'speed', decreased: 'speed' },
  { key: 'jolly', name: 'Jolly', increased: 'speed', decreased: 'spAttack' },
  { key: 'naive', name: 'Naive', increased: 'speed', decreased: 'spDefense' },
  { key: 'modest', name: 'Modest', increased: 'spAttack', decreased: 'attack' },
  { key: 'mild', name: 'Mild', increased: 'spAttack', decreased: 'defense' },
  { key: 'quiet', name: 'Quiet', increased: 'spAttack', decreased: 'speed' },
  { key: 'bashful', name: 'Bashful', increased: 'spAttack', decreased: 'spAttack' },
  { key: 'rash', name: 'Rash', increased: 'spAttack', decreased: 'spDefense' },
  { key: 'calm', name: 'Calm', increased: 'spDefense', decreased: 'attack' },
  { key: 'gentle', name: 'Gentle', increased: 'spDefense', decreased: 'defense' },
  { key: 'sassy', name: 'Sassy', increased: 'spDefense', decreased: 'speed' },
  { key: 'careful', name: 'Careful', increased: 'spDefense', decreased: 'spAttack' },
  { key: 'quirky', name: 'Quirky', increased: 'spDefense', decreased: 'spDefense' },
]

/** @type {Record<string, { key: string, name: string, increased: string, decreased: string }>} */
export const natureByKey = Object.fromEntries(NATURES.map((nature) => [nature.key, nature]))

/** @returns {string} A random nature key. */
export function randomNature() {
  return NATURES[Math.floor(Math.random() * NATURES.length)].key
}

/**
 * Display name for a nature key, falling back to the raw key.
 * @param {string | undefined} nature
 * @returns {string}
 */
export function natureName(nature) {
  return natureByKey[nature ?? '']?.name ?? nature ?? ''
}

/**
 * Stat multipliers for a nature: `{ [statKey]: 1.1 | 0.9 }`. Neutral natures
 * (and unknown keys) return an empty object.
 * @param {string | undefined} nature
 * @returns {Record<string, number>}
 */
export function natureStatModifiers(nature) {
  const entry = natureByKey[nature ?? '']
  if (!entry || !entry.increased || !entry.decreased || entry.increased === entry.decreased)
    return {}
  return {
    [entry.increased]: 1.1,
    [entry.decreased]: 0.9,
  }
}
