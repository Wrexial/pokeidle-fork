/**
 * Evolution-level sanity helpers.
 *
 * The game compresses every region onto a Lv. 5-75 curve, which can pull an
 * evolved species below the level it could actually evolve at (a Lv. 3
 * Chesnaught, a Lv. 7 Machamp). These helpers work out the floor level for each
 * species and step a too-advanced species back to the form that is valid at a
 * given level.
 *
 * `minLevel` is a fixpoint over the evolution graph: a level-gated evolution
 * (`{ into, level }`) raises the target to at least the gate (and its own
 * pre-evolution's floor); item / friendship evolutions have no level gate, so
 * they only inherit their pre-evolution's floor. Form changes and Megas are
 * included, so an alternate form never sits below its base.
 *
 * Usage:
 *   const { buildEvolutionLevels, stageForLevel } = require('./lib/evolution-levels.cjs')
 *   const levels = buildEvolutionLevels(evolutionData, pokemonSpecies)
 *   stageForLevel('chesnaught', 3, levels) // -> 'chespin'
 */

/**
 * @param {Record<string, any[]>} evolutionData
 * @param {Record<string, any>} pokemonSpecies
 * @returns {{ minLevel: Record<string, number>, preEvolutionOf: Record<string, string> }}
 */
function buildEvolutionLevels(evolutionData, pokemonSpecies) {
  const idOf = (/** @type {string} */ key) => Number(pokemonSpecies[key]?.id ?? 0),
    // A reversible form transform (dialga <-> dialga-o, rotom <-> h-rotom) is
    // not a real evolution: the reversion edge must not become the base's
    // pre-evolution, or a normal Dialga would "step back" to Dialga-Origin.
    isFormRevert = (/** @type {string} */ from, /** @type {string} */ into) =>
      idOf(from) > 1025 &&
      (evolutionData[into] ?? []).some(
        (/** @type {any} */ back) => back?.into === from
      )

  /** @type {Record<string, number>} */
  const minLevel = {}
  for (const key of Object.keys(pokemonSpecies)) minLevel[key] = 1

  // Relax the graph until every species sits at least as high as its
  // pre-evolution / level gate. A handful of passes cover even form cycles.
  for (let pass = 0; pass < 25; pass++) {
    let changed = false
    for (const [from, evolutions] of Object.entries(evolutionData)) {
      if (!Array.isArray(evolutions)) continue
      for (const evolution of evolutions) {
        const into = evolution?.into
        if (!into || minLevel[into] === undefined) continue
        if (isFormRevert(from, into)) continue
        const base = minLevel[from] ?? 1,
          gate = evolution.level && !evolution.form ? evolution.level : null,
          next = gate ? Math.max(base, gate) : base
        if (next > minLevel[into]) {
          minLevel[into] = next
          changed = true
        }
      }
    }
    if (!changed) break
  }

  // Step back along the pre-evolution that sits lowest (so a form-cycle's base
  // form is preferred over its alternate form), which keeps `stageForLevel`
  // monotonic and terminating.
  /** @type {Record<string, string>} */
  const preEvolutionOf = {}
  for (const [from, evolutions] of Object.entries(evolutionData)) {
    if (!Array.isArray(evolutions)) continue
    for (const evolution of evolutions) {
      if (evolution?.form) continue
      const into = evolution?.into
      if (!into || isFormRevert(from, into)) continue
      const existing = preEvolutionOf[into]
      if (existing === undefined || (minLevel[from] ?? 1) < (minLevel[existing] ?? 1))
        preEvolutionOf[into] = from
    }
  }

  return { minLevel, preEvolutionOf }
}

/**
 * The most-evolved form of `speciesKey` that could actually exist at `level`.
 * Returns the species itself when its floor is already met.
 * @param {string} speciesKey
 * @param {number} level
 * @param {{ minLevel: Record<string, number>, preEvolutionOf: Record<string, string> }} levels
 * @returns {string}
 */
function stageForLevel(speciesKey, level, levels) {
  let current = speciesKey
  const seen = new Set([speciesKey])
  while ((levels.minLevel[current] ?? 1) > level) {
    const pre = levels.preEvolutionOf[current]
    if (!pre || seen.has(pre)) break
    seen.add(pre)
    current = pre
  }
  return current
}

module.exports = { buildEvolutionLevels, stageForLevel }
