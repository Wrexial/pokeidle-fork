// In-battle Mega Evolution and Primal Reversion. Mega forms exist in
// `evolutionData` as level-100 `m-` evolutions and Primal Groudon/Kyogre as
// level-100 `p-` evolutions; this module maps a base species to its battle
// form(s) and decides which one a Pokemon takes. The transformation is
// battle-only: it lives on `playerVolatile.formKey`, so it reverts when the
// battle ends and never touches the saved Pokemon.

import { abilityData, evolutionData, mapData, pokemonSpecies } from './gameData.js'

/** The zone where Legends: Z-A's upgraded "Z" Mega forms can be triggered. */
export const ZA_MEGA_ZONE = 'lumiose-wild-zones'

/** The held item that enables a Mega Evolution (or Primal Reversion) in battle. */
export const MEGA_STONE_ITEM = 'megaStone'

/**
 * The Primal Reversions. They use the same held Mega Stone as Megas, and their
 * `p-` prefix collides with the Paldean regional forms (`p-tauros`, ...), so
 * they are listed explicitly rather than matched by prefix.
 * @type {Set<string>}
 */
const PRIMAL_FORM_KEYS = new Set(['p-groudon', 'p-kyogre'])

/**
 * The battle-only forms a held Mega Stone can trigger for a species.
 * @param {Evolution} evolution
 * @returns {boolean}
 */
function isMegaEvolution(evolution) {
  return (
    evolution?.level === 100 &&
    typeof evolution.into === 'string' &&
    (evolution.into.startsWith('m-') || PRIMAL_FORM_KEYS.has(evolution.into)) &&
    !!pokemonSpecies[evolution.into]
  )
}

/**
 * Base species key -> its Mega / Primal form keys, in evolution-table order.
 * @type {Record<string, string[]>}
 */
export const MEGA_FORMS = (() => {
  /** @type {Record<string, string[]>} */
  const forms = {}
  for (const [speciesKey, evolutions] of Object.entries(evolutionData)) {
    if (!Array.isArray(evolutions)) continue
    const megaForms = evolutions.filter(isMegaEvolution).map((evolution) => evolution.into)
    if (megaForms.length > 0) forms[speciesKey] = megaForms
  }
  return forms
})()

/**
 * Every real Mega form key. Checked as a set rather than by the `m-` prefix,
 * which also starts keys like `m-rotom` (Mow Rotom).
 * @type {Set<string>}
 */
const MEGA_FORM_KEYS = new Set(Object.values(MEGA_FORMS).flat())

/**
 * @param {string | null | undefined} speciesKey
 * @returns {string[]}
 */
export function megaFormsFor(speciesKey) {
  return (speciesKey && MEGA_FORMS[speciesKey]) || []
}

/** @param {string | null | undefined} formKey */
export function isMegaForm(formKey) {
  return typeof formKey === 'string' && MEGA_FORM_KEYS.has(formKey)
}

/**
 * Whether `formKey` is a Primal Reversion (battle-only, like a Mega).
 * @param {string | null | undefined} formKey
 */
export function isPrimalForm(formKey) {
  return typeof formKey === 'string' && PRIMAL_FORM_KEYS.has(formKey)
}

/**
 * Whether `formKey` is a held-stone battle form (Mega or Primal).
 * @param {string | null | undefined} formKey
 */
export function isMegaOrPrimalForm(formKey) {
  return isMegaForm(formKey) || isPrimalForm(formKey)
}

/**
 * Every Gigantamax form key: the `gx-` targets of a `form: true` evolution.
 * @type {Set<string>}
 */
export const GMAX_FORM_KEYS = new Set(
  Object.values(evolutionData)
    .flat()
    .filter((evolution) => evolution?.form === true)
    .map((evolution) => evolution.into)
)

/** Whether `speciesKey` is a Gigantamax (Dynamax) form. @param {string | null | undefined} speciesKey */
export function isGmaxForm(speciesKey) {
  return typeof speciesKey === 'string' && GMAX_FORM_KEYS.has(speciesKey)
}

/**
 * Whether a species is a temporary / terminal battle form (Mega, Primal or
 * Gigantamax). These never evolve and are reverted to their base on save load.
 * @param {string | null | undefined} speciesKey
 */
export function isTerminalForm(speciesKey) {
  return isMegaOrPrimalForm(speciesKey) || isGmaxForm(speciesKey)
}

/**
 * Base species key -> its Gigantamax form key, for the species that have one.
 * @type {Record<string, string>}
 */
export const GMAX_FORMS = (() => {
  const forms = /** @type {Record<string, string>} */ ({})
  for (const [speciesKey, evolutions] of Object.entries(evolutionData)) {
    if (!Array.isArray(evolutions)) continue
    const gmax = evolutions.find((evolution) => evolution?.form === true)?.into
    if (gmax && pokemonSpecies[gmax]) forms[speciesKey] = gmax
  }
  return forms
})()

/**
 * The Gigantamax form of a species, or null when it cannot Gigantamax.
 * @param {string | null | undefined} speciesKey
 * @returns {string | null}
 */
export function gmaxFormFor(speciesKey) {
  return (speciesKey && GMAX_FORMS[speciesKey]) || null
}

/** Whether a species can receive the Gigantamax Factor. @param {string | null | undefined} speciesKey */
export function canGigantamax(speciesKey) {
  return !!gmaxFormFor(speciesKey)
}

/**
 * Whether the active Pokemon has the Gigantamax Factor and can still transform
 * this battle. Mirrors `megaEvolveReady`. Used by the idle loop (to auto-trigger)
 * and the reducer (to validate).
 * @param {{ playerPokemon?: any, playerVolatile?: any } | null | undefined} state
 * @returns {boolean}
 */
export function gmaxEvolveReady(state) {
  const pokemon = state?.playerPokemon
  if (!pokemon?.gmax) return false
  if (isTerminalForm(state?.playerVolatile?.formKey)) return false
  return canGigantamax(pokemon.speciesKey)
}

/**
 * The Mega form a Pokemon would take. Species with two Megas (Charizard, Mewtwo)
 * use the physical X forme when their Attack is higher, the special Y otherwise.
 * Legends: Z-A's upgraded "Z" variants (Mega Absol Z, Mega Garchomp Z, Mega
 * Lucario Z) are an area perk: they only appear inside the Lumiose Wild Zones,
 * so pass `allowZVariants` when the battle is happening there.
 * @param {string} speciesKey
 * @param {{ attack?: number, spAttack?: number } | null | undefined} pokemon
 * @param {boolean} [allowZVariants]
 * @returns {string | null}
 */
export function chooseMegaForm(speciesKey, pokemon, allowZVariants = false) {
  const forms = megaFormsFor(speciesKey)
  if (forms.length === 0) return null
  if (forms.length === 1) return forms[0]
  if (allowZVariants) {
    const zForm = forms.find((form) => /\sz$/.test(form))
    if (zForm) return zForm
  }
  // Otherwise fall back to the original Mega(s), picking X/Y by stat lean.
  const originals = forms.filter((form) => !/\sz$/.test(form)),
    pool = originals.length > 0 ? originals : forms,
    special = (pokemon?.spAttack ?? 0) > (pokemon?.attack ?? 0),
    yForm = pool.find((form) => /\sy$/.test(form)),
    xForm = pool.find((form) => /\sx$/.test(form))
  return (special ? yForm : xForm) ?? pool[0]
}

/**
 * Whether a location is inside the Lumiose Wild Zones, where the Legends: Z-A
 * "Z" Mega forms can be triggered.
 * @param {string | null | undefined} locationId
 * @returns {boolean}
 */
export function inZAMegaZone(locationId) {
  return !!locationId && mapData[locationId]?.zone === ZA_MEGA_ZONE
}

/**
 * The ability a Mega form fights with, from `ability-data.json`.
 * @param {string} formKey
 * @returns {string | null}
 */
export function megaAbility(formKey) {
  const data = abilityData[formKey]
  return data?.abilities?.[0] ?? data?.hidden ?? null
}

/**
 * Whether a Pokemon is holding a Mega Stone and can still Mega Evolve this
 * battle. Used by the idle loop (to auto-trigger) and the reducer (to validate).
 * @param {{ playerPokemon?: any, playerVolatile?: any } | null | undefined} state
 * @returns {boolean}
 */
export function megaEvolveReady(state) {
  const pokemon = state?.playerPokemon
  if (!pokemon || pokemon.heldItem !== MEGA_STONE_ITEM) return false
  if (isMegaOrPrimalForm(state?.playerVolatile?.formKey)) return false
  return megaFormsFor(pokemon.speciesKey).length > 0
}
