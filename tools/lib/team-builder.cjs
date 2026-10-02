// Shared league-team builder for `generate-regions.cjs` and
// `apply-kanto.cjs`: type-themed, level-appropriate teams with a deterministic
// species offset so neighbouring leaders don't field clones.

/** @param {any} species */
const totalBaseStats = (species) =>
  Object.values(species.baseStats ?? {}).reduce((sum, stat) => sum + stat, 0)

/** @param {number} n */
const clampLevel = (n) => Math.max(2, Math.min(100, n))

/**
 * Build a team builder bound to a game dataset.
 * @param {{
 *   evolutionData: Record<string, any[]>,
 *   evolutionLevels: { minLevel: Record<string, number>, preEvolutionOf: Record<string, string> },
 *   itemEvolutionLevel?: number,
 * }} options
 * @returns {{ buildTeam: (list: any[], types: string[] | undefined, size: number, baseLevel: number, step?: number, offset?: number) => { speciesKey: string, level: number }[] }}
 */
function createTeamBuilder({ evolutionData, evolutionLevels, itemEvolutionLevel = 45 }) {
  // A species that only "evolves" into an alternate/battle form is still a final.
  const isFinalEvolution = (speciesKey) =>
    !(evolutionData[speciesKey] || []).some((evolution) => !evolution.form)

  const buildTeam = (list, types, size, baseLevel, step = 1, offset = 0) => {
    if (list.length === 0) return []
    const minimum = Math.min(size, 3)
    // Prefer levelled-appropriate, non-weak species, but never shrink a pool
    // below `minimum` (so a sparse type keeps its members).
    const refined = (pool) => {
      const mature = pool.filter((species) => {
        // Item and friendship evolutions have no level gate, so give them a
        // nominal one for team building (a Lv.60 trainer shouldn't still field a
        // Vulpix or a Pichu).
        const levels = (evolutionData[species.key] || [])
          .map(
            (evolution) =>
              evolution.level ??
              (evolution.item || evolution.friendship ? itemEvolutionLevel : null)
          )
          .filter(Boolean)
        return levels.length === 0 || Math.min(...levels) > baseLevel
      })
      let result = mature.length >= minimum ? mature : pool
      // Drop species that are too advanced for this level (a Lv. 7 Machamp), as
      // long as enough plausible species remain to keep the type theme.
      const plausible = result.filter(
        (species) => (evolutionLevels.minLevel[species.key] ?? 1) <= baseLevel
      )
      if (plausible.length >= minimum) result = plausible
      if (baseLevel >= 55) {
        const strong = result.filter((species) => totalBaseStats(species) >= 380)
        if (strong.length >= minimum) result = strong
      }
      return result
    }
    const preferFinal = baseLevel >= 65,
      finalsOf = (pool) => (preferFinal ? pool.filter((species) => isFinalEvolution(species.key)) : pool)
    // The full pool (strongest first) is the fallback when a themed pool runs
    // out of distinct species (Kanto's Ice Elite has only four), so a team
    // fills with a strong off-theme ace rather than repeating a Pokemon.
    const fallbackPool = refined(list)
        .slice()
        .sort((a, b) => totalBaseStats(b) - totalBaseStats(a)),
      fallbackTop = fallbackPool.slice(0, Math.max(minimum, 8))
    let pool
    if (types?.length) {
      const typed = list.filter((species) =>
        species.types?.some((type) => types.includes(type))
      )
      if (typed.length >= minimum) {
        const typedFinals = finalsOf(typed)
        pool = refined(typedFinals.length >= minimum ? typedFinals : typed)
      } else pool = refined(list)
    } else {
      // Mixed trainers: the strongest Pokemon of each primary type, so an Ace
      // Trainer or Champion fields a varied, fully-evolved team.
      const candidates = refined(list),
        strong = finalsOf(candidates)
          .slice()
          .sort((a, b) => totalBaseStats(b) - totalBaseStats(a)),
        distinct = [],
        seenTypes = new Set()
      for (const species of strong) {
        const primaryType = species.types?.[0]
        if (primaryType && !seenTypes.has(primaryType)) {
          seenTypes.add(primaryType)
          distinct.push(species)
        }
      }
      pool = distinct.length >= size ? distinct : strong.length >= minimum ? strong : candidates
    }
    const team = [],
      used = new Set()
    for (let i = 0; i < size; i++) {
      let entry = pool[(offset + i) % pool.length]
      if (used.has(entry.key)) {
        entry = pool.find((candidate) => !used.has(candidate.key))
        if (!entry) {
          // Vary the off-theme filler by the team's offset too.
          const start = fallbackTop.length ? (offset + i) % fallbackTop.length : 0
          for (let step = 0; step < fallbackTop.length; step++) {
            const candidate = fallbackTop[(start + step) % fallbackTop.length]
            if (!used.has(candidate.key)) {
              entry = candidate
              break
            }
          }
        }
        entry ??= pool[(offset + i) % pool.length]
      }
      used.add(entry.key)
      team.push({ speciesKey: entry.key, level: clampLevel(baseLevel + i * step) })
    }
    return team
  }

  return { buildTeam }
}

module.exports = { createTeamBuilder, totalBaseStats, clampLevel }
