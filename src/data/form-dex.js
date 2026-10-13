// Living form-dex: every collectible form, regional variant and visual gender
// difference grouped into its species family, plus the completion maths the
// Pokédex view and the reward reducer share.
//
// The base/form relationship already lives in `pokemon-forms.js` and
// `gameData.js` (`formsByBase`, `labelForKey`). This module layers the
// collection targets on top: a family is its national-dex base plus every
// alternate form, and the base species gains a male and a female target when it
// has a visual gender difference (the ids in `gendered-sprites.json`).
//
// A family / regional set / generation reward is paid once, tracked by the
// `rewarded*` arrays on the save. Nothing here touches React or the reducer; it
// is pure over the species table so the headless tests can exercise it.

/**
 * The canonical regional variant groups, matched against a form's display
 * label ("Alolan", "Galarian", ...) so hand-curated labels like "Galarian Zen"
 * still land in the right set.
 */
export const REGIONAL_FORM_SETS = [
  { id: 'alolan', label: 'Alolan Forms', adjective: 'Alolan' },
  { id: 'galarian', label: 'Galarian Forms', adjective: 'Galarian' },
  { id: 'hisuian', label: 'Hisuian Forms', adjective: 'Hisuian' },
  { id: 'paldean', label: 'Paldean Forms', adjective: 'Paldean' },
]

/** The two visual gender variants a gendered species can register. @type {('male' | 'female')[]} */
const GENDER_VARIANTS = ['male', 'female']

/**
 * @typedef {{ speciesKey: string, gender: 'male' | 'female' | null, base?: string }} FormDexTarget
 * @typedef {{ base: string, name: string, dexId: number, generation: number, targets: FormDexTarget[] }} FormDexFamily
 * @typedef {{ id: string, label: string, targets: FormDexTarget[] }} FormDexRegionalSet
 * @typedef {{ families: FormDexFamily[], regionalSets: FormDexRegionalSet[], generationTargets: FormDexTarget[][] }} FormDexModel
 */

/**
 * The stable string id for one collection target, for the collected-with set.
 * @param {FormDexTarget} target
 * @returns {string}
 */
export function formDexTargetKey(target) {
  return target.gender ? `${target.speciesKey}:${target.gender}` : target.speciesKey
}

/**
 * Build the living form-dex model from the species table.
 * @param {Record<string, Species>} pokemonSpecies
 * @param {Record<string, string[]>} formsByBase
 * @param {Record<string, string>} labelForKey
 * @param {Set<number>} genderedIds Species ids with a female sprite.
 * @param {number[][]} generationRanges
 * @returns {FormDexModel}
 */
export function buildFormDexModel(
  pokemonSpecies,
  formsByBase,
  labelForKey,
  genderedIds,
  generationRanges
) {
  /** @type {FormDexFamily[]} */
  const families = []
  for (const [base, species] of Object.entries(pokemonSpecies)) {
    if (!(species.id > 0 && species.id <= 1025)) continue
    const generation = generationRanges.findIndex(
        ([lowId, highId]) => species.id >= lowId && species.id <= highId
      ),
      keys = [base, ...(formsByBase[base] ?? [])],
      /** @type {FormDexTarget[]} */
      targets = []
    for (const speciesKey of keys) {
      // Gender variants are only tracked for the base species: an alternate
      // form reuses the same art (Mega Venusaur is not a separate male/female
      // collection), so gating it would double the grind for no real gain.
      const gendered = speciesKey === base && genderedIds.has(species.id)
      if (gendered)
        for (const gender of GENDER_VARIANTS)
          targets.push({ speciesKey, gender, base })
      else targets.push({ speciesKey, gender: null, base })
    }
    families.push({ base, name: species.name, dexId: species.id, generation, targets })
  }
  families.sort((left, right) => left.dexId - right.dexId)

  /** @type {FormDexRegionalSet[]} */
  const regionalSets = []
  for (const set of REGIONAL_FORM_SETS) {
    /** @type {FormDexTarget[]} */
    const targets = []
    for (const family of families)
      for (const target of family.targets)
        if (labelForKey[target.speciesKey]?.startsWith(set.adjective)) targets.push(target)
    if (targets.length > 0) regionalSets.push({ id: set.id, label: set.label, targets })
  }

  const generationTargets = generationRanges.map((_, generation) =>
    families.filter((family) => family.generation === generation).flatMap((family) => family.targets)
  )

  return { families, regionalSets, generationTargets }
}

/**
 * Whether one target has been collected: its species/form must be caught, and a
 * gender-gated target also needs that gender recorded.
 * @param {FormDexTarget} target
 * @param {Set<string>} caughtSet
 * @param {Record<string, string[]>} genders
 * @returns {boolean}
 */
export function isFormDexTargetCollected(target, caughtSet, genders) {
  if (!caughtSet.has(target.speciesKey)) return false
  if (!target.gender) return true
  return (genders[target.speciesKey] ?? []).includes(target.gender)
}

/**
 * Collected / total / complete for a list of targets.
 * @param {FormDexTarget[]} targets
 * @param {Set<string>} caughtSet
 * @param {Record<string, string[]>} genders
 * @returns {{ collected: number, total: number, complete: boolean }}
 */
export function formDexCompletion(targets, caughtSet, genders) {
  let collected = 0
  for (const target of targets)
    if (isFormDexTargetCollected(target, caughtSet, genders)) collected++
  return { collected, total: targets.length, complete: targets.length > 0 && collected === targets.length }
}

/**
 * The families / regional sets / generations that are complete but whose reward
 * hasn't been paid yet. `rewarded` holds Sets so a save's arrays are only read
 * once.
 * @param {FormDexModel} model
 * @param {Set<string>} caughtSet
 * @param {Record<string, string[]>} genders
 * @param {{ families: Set<string>, regionalSets: Set<string>, generations: Set<number> }} rewarded
 * @returns {{ families: string[], regionalSets: string[], generations: number[] }}
 */
export function newlyCompletedFormDex(model, caughtSet, genders, rewarded) {
  /** @type {string[]} */
  const families = []
  for (const family of model.families) {
    if (rewarded.families.has(family.base)) continue
    if (formDexCompletion(family.targets, caughtSet, genders).complete) families.push(family.base)
  }
  /** @type {string[]} */
  const regionalSets = []
  for (const set of model.regionalSets) {
    if (rewarded.regionalSets.has(set.id)) continue
    if (formDexCompletion(set.targets, caughtSet, genders).complete) regionalSets.push(set.id)
  }
  /** @type {number[]} */
  const generations = []
  model.generationTargets.forEach((targets, generation) => {
    if (rewarded.generations.has(generation)) return
    if (formDexCompletion(targets, caughtSet, genders).complete) generations.push(generation)
  })
  return { families, regionalSets, generations }
}

/**
 * The display label for one target, e.g. "Base ♀" / "Alolan" / "Mega X".
 * @param {FormDexTarget} target
 * @param {Record<string, string>} labelForKey
 * @returns {string}
 */
export function formDexTargetLabel(target, labelForKey) {
  const base = labelForKey[target.speciesKey] ?? 'Base'
  if (!target.gender) return base
  return `${base} ${target.gender === 'female' ? '\u2640' : '\u2642'}`
}

/**
 * A new gender record with `gender` added to `speciesKey`'s list (same
 * reference when nothing changed, so it is cheap to call from the reducer).
 * @param {Record<string, string[]>} genders
 * @param {string} speciesKey
 * @param {string} gender
 * @returns {Record<string, string[]>}
 */
export function recordFormDexGender(genders, speciesKey, gender) {
  if (gender !== 'male' && gender !== 'female') return genders
  const current = genders[speciesKey]
  if (current && current.includes(gender)) return genders
  return { ...genders, [speciesKey]: [...(current ?? []), gender] }
}
