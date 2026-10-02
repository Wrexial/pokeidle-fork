// Shared route-trainer team builder for `generate-regions.cjs` and
// `apply-trainer-variety.cjs`.
//
// The generator's older `buildTeam` filters hard on a trainer class's type
// theme, so a region's route trainers repeat the same handful of species and
// the Pokedex "seen" log lags far behind the dex. This builder guarantees at
// least one member of every evolution line (drawn from a per-region cursor over
// the region's own-generation species), keeps the class type as a bias, and
// fills the rest with level-appropriate forms and themed non-natives.

/** How far ahead the cursor looks for an on-theme entry before taking the next. */
const THEME_WINDOW = 20

/**
 * Whether a species has outgrown the form it would be fielded as: a Lv. 5
 * Caterpie is fine, a Lv. 40 Caterpie is not (it should be a Butterfree).
 */
function outgrown(form, level, evolvesAt) {
  return (evolvesAt[form] ?? Infinity) <= level
}

/** The line's representative form at `level` (Pikipek early, Toucannon late). */
function stageFromLine(line, level, evolutionLevels, evolvesAt) {
  return stageForm(line.final, level, evolutionLevels, evolvesAt)
}

/**
 * The form a species should actually be fielded as at `level`: step back along
 * the pre-evolution chain while the pre-evolution would not yet have evolved
 * (this catches item / friendship evolutions, which have no level gate but get
 * a nominal one via `evolvesAt`).
 */
function stageForm(key, level, evolutionLevels, evolvesAt) {
  let current = key
  const seen = new Set([key])
  for (;;) {
    const preEvolution = evolutionLevels.preEvolutionOf[current]
    if (!preEvolution || seen.has(preEvolution)) break
    if ((evolvesAt[preEvolution] ?? Infinity) <= level) break
    current = preEvolution
    seen.add(current)
  }
  return current
}

/**
 * The form a candidate would be fielded as at `level`, or null when it is not
 * allowed (already on this team, or outgrown).
 */
function fieldableForm(candidate, level, usedInTeam, evolutionLevels, evolvesAt) {
  const form = stageForm(candidate.key, level, evolutionLevels, evolvesAt)
  if (usedInTeam.has(form) || outgrown(form, level, evolvesAt)) return null
  return form
}

/**
 * Group a region's native species into evolution lines, one entry per chain
 * root. `final` is the line's strongest member, so the representative form at a
 * level is its level-appropriate stage (Pikipek early, Toucannon late).
 * @param {{ key: string, types: string[] }[]} natives
 * @param {{
 *   preEvolutionOf: Record<string, string>,
 *   evolutionData: Record<string, any[]>,
 *   speciesBst: Record<string, number>,
 *   speciesTypes: Record<string, string[]>,
 *   isStarter: (key: string) => boolean,
 * }} context
 * @returns {{ root: string, final: string, types: string[] }[]}
 */
function buildEvolutionLines(natives, context) {
  const chainRoot = (key) => {
    const seen = new Set([key])
    let current = key
    for (let next = context.preEvolutionOf[current]; next && !seen.has(next); next = context.preEvolutionOf[current]) {
      current = next
      seen.add(current)
    }
    return current
  }
  // The strongest form reachable from the root anywhere in the game, so a line
  // whose final isn't native (Smoochum -> Jynx) is still shown at high levels
  // rather than staged to the baby forever.
  const finalOf = (root) => {
    let best = root
    const seen = new Set([root]),
      queue = [root]
    while (queue.length > 0) {
      const key = queue.shift()
      if ((context.speciesBst[key] ?? 0) > (context.speciesBst[best] ?? 0)) best = key
      for (const evolution of context.evolutionData[key] ?? []) {
        if (evolution?.form || !evolution?.into || seen.has(evolution.into)) continue
        seen.add(evolution.into)
        queue.push(evolution.into)
      }
    }
    return best
  }
  const byRoot = new Map()
  for (const species of natives) {
    if (context.isStarter(species.key)) continue
    const root = chainRoot(species.key)
    if (context.isStarter(root)) continue
    if (!byRoot.has(root)) byRoot.set(root, [])
    byRoot.get(root).push(species.key)
  }
  return [...byRoot.entries()].map(([root]) => {
    const final = finalOf(root)
    return { root, final, types: context.speciesTypes[final] ?? [] }
  })
}

/**
 * Build one trainer's team. Every evolution line is shown once before any
 * repeats (a shared per-region cursor), then the remaining slots add variety
 * from the native pool and themed non-natives.
 * @param {{
 *   natives: { key: string, types: string[], minLevel: number }[],
 *   others: { key: string, types: string[], minLevel: number }[],
 *   lines: { root: string, final: string, types: string[] }[],
 *   theme: string[] | undefined,
 *   levels: number[],
 *   state: { cursor: number, lineCursor: number, shownLines: Set<string> },
 *   evolutionLevels: { minLevel: Record<string, number>, preEvolutionOf: Record<string, string> },
 *   evolvesAt: Record<string, number>,
 *   speciesTypes: Record<string, string[]>,
 * }} options
 * @returns {{ speciesKey: string, level: number }[]}
 */
function buildVariedTeam({
  natives,
  others,
  lines,
  theme,
  levels,
  state,
  evolutionLevels,
  evolvesAt,
  speciesTypes,
}) {
  const team = [],
    usedInTeam = new Set(),
    themed = (types) => !!theme?.length && (types ?? []).some((type) => theme.includes(type))
  // The unshown lines, kept in order: a themed pick is removed from the middle
  // without dropping the lines it skipped past.
  if (!state.lineQueue) state.lineQueue = [...lines]
  for (const level of levels) {
    let chosen = null
    // 1. Show the next evolution line that has not been shown, preferring an
    //    on-theme one within a short look-ahead.
    if (state.lineQueue.length > 0) {
      let pickIndex = -1,
        pickForm = null
      for (let i = 0; i < state.lineQueue.length && i < THEME_WINDOW; i++) {
        const form = stageFromLine(state.lineQueue[i], level, evolutionLevels, evolvesAt)
        if (usedInTeam.has(form) || outgrown(form, level, evolvesAt)) continue
        if (pickIndex === -1) (pickIndex = i), (pickForm = form)
        if (themed(speciesTypes[form] ?? state.lineQueue[i].types)) {
          ;(pickIndex = i), (pickForm = form)
          break
        }
      }
      if (pickIndex !== -1) {
        chosen = pickForm
        state.lineQueue.splice(pickIndex, 1)
      }
    }
    // 2. An extra level-appropriate native (an evolved form or a repeat),
    //    again preferring an on-theme one within the look-ahead.
    if (!chosen) {
      const window = []
      for (let i = 0; i < natives.length && window.length < THEME_WINDOW; i++) {
        const index = (state.cursor + i) % natives.length,
          form = fieldableForm(natives[index], level, usedInTeam, evolutionLevels, evolvesAt)
        if (form) window.push({ index, form, themed: themed(natives[index].types) })
      }
      if (window.length > 0) {
        const pick = window.find((entry) => entry.themed) ?? window[0]
        chosen = pick.form
        state.cursor = pick.index + 1
      }
    }
    // 3. A themed non-native, then 4. any non-native.
    if (!chosen) {
      for (const candidate of others) {
        if (!themed(candidate.types)) continue
        const form = fieldableForm(candidate, level, usedInTeam, evolutionLevels, evolvesAt)
        if (form) {
          chosen = form
          break
        }
      }
    }
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

module.exports = { buildVariedTeam, buildEvolutionLines }
