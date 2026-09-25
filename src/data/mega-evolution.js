// In-battle Mega Evolution and Primal Reversion. Mega forms exist in
// `evolutionData` as level-100 `m-` evolutions and Primal Groudon/Kyogre as
// level-100 `p-` evolutions; this module maps a base species to its battle
// form(s) and decides which one a Pokemon takes. The transformation is
// battle-only: it lives on `playerVolatile.formKey`, so it reverts when the
// battle ends and never touches the saved Pokemon.

import { abilityData, evolutionData, pokemonSpecies } from './gameData.js'

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
 * @param {string | null | undefined} speciesKey
 * @returns {string[]}
 */
export function megaFormsFor(speciesKey) {
  return (speciesKey && MEGA_FORMS[speciesKey]) || []
}

/** @param {string | null | undefined} formKey */
export function isMegaForm(formKey) {
  return typeof formKey === 'string' && formKey.startsWith('m-')
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
 * The Mega form a Pokemon would take. Species with two Megas (Charizard, Mewtwo)
 * use the physical X forme when their Attack is higher, the special Y otherwise.
 * @param {string} speciesKey
 * @param {{ attack?: number, spAttack?: number } | null | undefined} pokemon
 * @returns {string | null}
 */
export function chooseMegaForm(speciesKey, pokemon) {
  const forms = megaFormsFor(speciesKey)
  if (forms.length === 0) return null
  if (forms.length === 1) return forms[0]
  const special = (pokemon?.spAttack ?? 0) > (pokemon?.attack ?? 0),
    yForm = forms.find((form) => /\sy$/.test(form)),
    xForm = forms.find((form) => /\sx$/.test(form))
  return (special ? yForm : xForm) ?? forms[0]
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
