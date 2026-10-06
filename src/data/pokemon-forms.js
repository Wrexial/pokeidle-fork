// Pokemon form relationships — the single source of truth for "which national
// dex entry does this species key belong to".
//
// The species table carries one entry per form (Megas, Gigantamax, regional
// variants, Deoxys formes, ...). Their ids are the 10000+ PokeAPI *form* ids,
// which used to make them render as separate Pokédex entries after the national
// dex. Instead the Pokédex groups every form under its base species' national
// dex number: `buildFormModel` maps each form key to its base key, so the UI can
// show one slot per species with a form switcher.
//
// The base is found from the key itself (form prefixes like `a-`/`g-`/`h-`/`m-`/
// `gx-`/`p-`, or trailing forme affixes) after normalising punctuation, with a
// small override table for the cases the convention can't express (Primal vs
// Paldean `p-`, Rotom's appliance prefixes, Urshifu's two styles, ...).

/**
 * Form keys whose base can't be derived from the key alone.
 * @type {Record<string, string>}
 */
export const FORM_BASE_OVERRIDES = {
  'urshifu-rss': 'urshifu-sss',
}

/**
 * Display labels for forms the prefix rules can't name (formes with a suffix
 * affix, appliance Rotoms, the gender/breed variants, ...).
 * @type {Record<string, string>}
 */
export const FORM_LABELS = {
  'deoxys-a': 'Attack',
  'deoxys-d': 'Defense',
  'deoxys-s': 'Speed',
  'dialga-o': 'Origin',
  'palkia-o': 'Origin',
  'giratina-o': 'Origin',
  'shaymin-s': 'Sky',
  'basculin-w': 'White Striped',
  'darmanitan-z': 'Zen',
  'tornadus-t': 'Therian',
  'thundurus-t': 'Therian',
  'landorus-t': 'Therian',
  'enamorus-t': 'Therian',
  'b-kyurem': 'Black',
  'w-kyurem': 'White',
  'keldeo-r': 'Resolute',
  'meloetta-p': 'Pirouette',
  'ash-greninja': 'Ash',
  'aegislash-b': 'Blade',
  'zygarde-10': '10%',
  'zygarde-c': 'Complete',
  'hoopa-u': 'Unbound',
  'lycanroc-m': 'Midnight',
  'lycanroc-d': 'Dusk',
  'wishiwashi-s': 'School',
  'necrozma-s': 'Dusk Mane',
  'necrozma-l': 'Dawn Wings',
  'u-necrozma': 'Ultra',
  'indeedee-f': 'Female',
  'zacian-cs': 'Crowned',
  'zamazenta-cs': 'Crowned',
  'urshifu-sss': 'Single Strike',
  'urshifu-rss': 'Rapid Strike',
  'calyrex-ir': 'Ice Rider',
  'calyrex-sr': 'Shadow Rider',
  'basculegion-f': 'Female',
  'oinkologne-f': 'Female',
  'palafin-h': 'Hero',
  'ursaluna-b': 'Bloodmoon',
  'ogerpon-w': 'Wellspring',
  'ogerpon-h': 'Hearthflame',
  'ogerpon-c': 'Cornerstone',
  'terapagos-t': 'Terastal',
  'terapagos-s': 'Stellar',
  'h-rotom': 'Heat',
  'w-rotom': 'Wash',
  'f-rotom': 'Frost',
  'fan-rotom': 'Fan',
  'm-rotom': 'Mow',
  'g-darmanitan-z': 'Galarian Zen',
  'p-kyogre': 'Primal',
  'p-groudon': 'Primal',
  'p-tauros': 'Paldean Combat',
  'p-tauros-b': 'Paldean Blaze',
  'p-tauros-a': 'Paldean Aqua',
  'm-magearna-o': 'Mega Original',
  'm-tatsugiri-droopy': 'Mega Droopy',
  'm-tatsugiri-stretchy': 'Mega Stretchy',
  'm-meowstic-f': 'Mega Female',
}

/** Prefixes that name a form, longest first so `gx-` wins over `g-`. */
const FORM_PREFIXES = ['gx', 'm', 'ash', 'fan', 'a', 'g', 'h', 'p', 'b', 'w', 'u', 'f']

/** @param {string} value */
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

/** @param {string} key */
const isNationalDexKey = (/** @type {Map<string, Species>} */ byKey, key) => {
  const species = byKey.get(key)
  return !!species && species.id > 0 && species.id <= 1025
}

/**
 * Resolve a form key to its national-dex base key. Bases map to themselves.
 * @param {Map<string, Species>} byKey
 * @param {Map<string, string>} baseByNorm
 * @param {string} key
 * @param {Set<string>} [seen]
 * @returns {string | null}
 */
function resolveBase(byKey, baseByNorm, key, seen = new Set()) {
  if (isNationalDexKey(byKey, key)) return key
  if (seen.has(key)) return null
  seen.add(key)

  const override = FORM_BASE_OVERRIDES[key]
  if (override) return resolveBase(byKey, baseByNorm, override, seen)

  const lower = key.toLowerCase()
  for (const prefix of FORM_PREFIXES) {
    if (!lower.startsWith(`${prefix}-`)) continue
    const candidate = key.slice(prefix.length + 1)
    const hit = baseByNorm.get(normalize(candidate))
    if (hit) return hit
    const resolved = resolveBase(byKey, baseByNorm, candidate, seen)
    if (resolved) return resolved
  }

  // A trailing single-letter variant ("Charizard X") or a dash affix ("-a").
  const spaced = key.match(/^(.*) [a-z]$/)
  if (spaced) {
    const hit = baseByNorm.get(normalize(spaced[1]))
    if (hit) return hit
    const resolved = resolveBase(byKey, baseByNorm, spaced[1], seen)
    if (resolved) return resolved
  }
  const dashed = key.match(/^(.*)-[a-z0-9]+$/i)
  if (dashed) {
    const hit = baseByNorm.get(normalize(dashed[1]))
    if (hit) return hit
    const resolved = resolveBase(byKey, baseByNorm, dashed[1], seen)
    if (resolved) return resolved
  }
  return null
}

/**
 * The label shown on a form button (e.g. "Alolan", "Mega X", "Gigantamax",
 * "Origin"). Falls back to the species' own name.
 * @param {string} key
 * @param {string} baseKey
 * @param {Record<string, Species>} pokemonSpecies
 * @returns {string}
 */
function formLabel(key, baseKey, pokemonSpecies) {
  const override = FORM_LABELS[key]
  if (override) return override

  if (baseKey === 'unown') {
    const mark = key.slice('unown-'.length)
    if (mark === 'exclamation') return '!'
    if (mark === 'question') return '?'
    return mark.toUpperCase()
  }

  const lower = key.toLowerCase()
  const variant = (/** @type {string} */ text) => {
    const spaced = key.match(/ ([a-z])$/)
    return spaced ? `${text} ${spaced[1].toUpperCase()}` : text
  }
  if (lower.startsWith('a-')) return 'Alolan'
  if (lower.startsWith('gx-')) return 'Gigantamax'
  if (lower.startsWith('m-')) return variant('Mega')
  if (lower.startsWith('g-')) return variant('Galarian')
  if (lower.startsWith('h-')) return variant('Hisuian')
  if (lower.startsWith('p-')) return variant('Paldean')
  if (lower.startsWith('b-')) return 'Black'
  if (lower.startsWith('w-')) return 'White'
  if (lower.startsWith('u-')) return 'Ultra'
  if (lower.startsWith('ash-')) return 'Ash'
  if (lower.startsWith('fan-')) return 'Fan'
  if (lower.startsWith('f-')) return 'Frost'
  return pokemonSpecies[key]?.name ?? key
}

/**
 * @typedef {object} FormModel
 * @property {Record<string, string>} baseForKey every species key -> its base key
 * @property {Record<string, string[]>} formsByBase base key -> its form keys (base excluded)
 * @property {Record<string, string>} labelForKey form key -> its display label
 */

/**
 * Build the form relationship model from the species table.
 * @param {Record<string, Species>} pokemonSpecies
 * @returns {FormModel}
 */
export function buildFormModel(pokemonSpecies) {
  const byKey = new Map(Object.entries(pokemonSpecies))
  /** @type {Map<string, string>} */
  const baseByNorm = new Map()
  for (const [key, species] of byKey)
    if (species.id > 0 && species.id <= 1025) baseByNorm.set(normalize(key), key)

  /** @type {Record<string, string>} */
  const baseForKey = {}
  /** @type {Record<string, string[]>} */
  const formsByBase = {}

  for (const key of byKey.keys()) {
    const base = resolveBase(byKey, baseByNorm, key) ?? key
    baseForKey[key] = base
    if (base !== key) (formsByBase[base] ??= []).push(key)
    else formsByBase[key] ??= []
  }

  // Any form that resolved to a base which is itself a form (none today) would
  // be flattened one level so every chain ends on a real national-dex base.
  for (const forms of Object.values(formsByBase))
    forms.sort((left, right) => (byKey.get(left)?.id ?? 0) - (byKey.get(right)?.id ?? 0))

  /** @type {Record<string, string>} */
  const labelForKey = {}
  for (const [key, base] of Object.entries(baseForKey))
    if (base !== key) labelForKey[key] = formLabel(key, base, pokemonSpecies)

  return { baseForKey, formsByBase, labelForKey }
}
