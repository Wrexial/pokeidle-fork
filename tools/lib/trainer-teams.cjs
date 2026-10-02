// Shared route-trainer team builder for `generate-regions.cjs` and
// `apply-trainer-variety.cjs`.
//
// The generator's older `buildTeam` filters hard on a trainer class's type
// theme, so a region's route trainers repeat the same handful of species and
// the Pokedex "seen" log lags far behind the dex. This builder walks a
// per-region cursor over the region's own-generation species, so every
// level-appropriate native is fielded before any repeats, while the class's
// type theme is kept as a bias and non-natives fill the gaps.

const { stageForLevel } = require('./evolution-levels.cjs')

/** How far ahead the cursor looks for an on-theme native before taking the next. */
const THEME_WINDOW = 10

/**
 * Whether a species has outgrown the form it would be fielded as: a Lv. 5
 * Caterpie is fine, a Lv. 40 Caterpie is not (it should be a Butterfree).
 * @param {string} form
 * @param {number} level
 * @param {Record<string, number>} evolvesAt
 */
function outgrown(form, level, evolvesAt) {
  return (evolvesAt[form] ?? Infinity) <= level
}

/**
 * The form a candidate would be fielded as at `level`, or null when it is not
 * allowed (too advanced, already on this team, or outgrown).
 * @param {{ key: string, minLevel: number }} candidate
 * @param {number} level
 * @param {Set<string>} usedInTeam
 * @param {{ minLevel: Record<string, number>, preEvolutionOf: Record<string, string> }} evolutionLevels
 * @param {Record<string, number>} evolvesAt
 */
function fieldableForm(candidate, level, usedInTeam, evolutionLevels, evolvesAt) {
  if (candidate.minLevel > level) return null
  const form = stageForLevel(candidate.key, level, evolutionLevels)
  if (usedInTeam.has(form) || outgrown(form, level, evolvesAt)) return null
  return form
}

/**
 * Build one trainer's team. Native species are drawn from a shared cursor so
 * the region's dex is revealed in order; the type theme biases which native is
 * taken and which non-native fills the last slots.
 * @param {{
 *   natives: { key: string, types: string[], minLevel: number }[],
 *   others: { key: string, types: string[], minLevel: number }[],
 *   theme: string[] | undefined,
 *   levels: number[],
 *   state: { cursor: number },
 *   evolutionLevels: { minLevel: Record<string, number>, preEvolutionOf: Record<string, string> },
 *   evolvesAt: Record<string, number>,
 * }} options
 * @returns {{ speciesKey: string, level: number }[]}
 */
function buildVariedTeam({
  natives,
  others,
  theme,
  levels,
  state,
  evolutionLevels,
  evolvesAt,
}) {
  const team = [],
    usedInTeam = new Set(),
    themed = (candidate) =>
      !!theme?.length && (candidate.types ?? []).some((type) => theme.includes(type))
  for (const level of levels) {
    let chosen = null
    // 1. The next level-appropriate native, preferring an on-theme one within a
    //    short look-ahead so the class still reads thematically.
    const window = []
    for (let i = 0; i < natives.length && window.length < THEME_WINDOW; i++) {
      const index = (state.cursor + i) % natives.length,
        candidate = natives[index],
        form = fieldableForm(candidate, level, usedInTeam, evolutionLevels, evolvesAt)
      if (form) window.push({ index, form, themed: themed(candidate) })
    }
    if (window.length > 0) {
      const pick = window.find((entry) => entry.themed) ?? window[0]
      chosen = pick.form
      state.cursor = pick.index + 1
    }
    // 2. A themed non-native.
    if (!chosen) {
      for (const candidate of others) {
        if (!themed(candidate)) continue
        const form = fieldableForm(candidate, level, usedInTeam, evolutionLevels, evolvesAt)
        if (form) {
          chosen = form
          break
        }
      }
    }
    // 3. Any non-native.
    if (!chosen) {
      for (const candidate of others) {
        const form = fieldableForm(candidate, level, usedInTeam, evolutionLevels, evolvesAt)
        if (form) {
          chosen = form
          break
        }
      }
    }
    if (!chosen) break
    team.push({ speciesKey: chosen, level })
    usedInTeam.add(chosen)
  }
  return team
}

module.exports = { buildVariedTeam }
