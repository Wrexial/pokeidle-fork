// Pokemon Bank: a slot-independent localStorage stash for moving individuals
// between saves. The bank is deliberately not part of any save blob, so a
// deposited Pokemon is moved out of its slot rather than copied, and each
// deposit/withdraw runs the individual through `repairSave` so a stale blob can
// never be carried across builds.

import { BANK_CAPACITY, BANK_KEY, BANK_VERSION, SAVE_SLOT_COUNT, getActiveSlot, saveSlotKey } from '../data/config.js'
import { gameReducer } from './reducer.js'
import { persistSave, repairSave } from './save.js'

/**
 * Repair a single Pokemon through the full save pipeline (moves, stats, IVs,
 * natures, terminal forms) by wrapping it in a minimal one-Pokemon save.
 * Returns null when the individual is not salvageable.
 * @param {any} pokemon
 * @returns {Pokemon | null}
 */
export function repairBankPokemon(pokemon) {
  if (!pokemon || typeof pokemon !== 'object' || !pokemon.speciesKey) return null
  let repaired = null
  try {
    repaired = repairSave({ playerPokemon: pokemon, party: [pokemon], box: [] })
  } catch {
    repaired = null
  }
  const member =
    repaired?.party?.find((entry) => entry.id === pokemon.id) ?? repaired?.party?.[0]
  return member ?? null
}

/**
 * A fresh bank identity, guaranteed not to collide with a stored one.
 * @param {BankState} bank
 * @returns {string}
 */
function newBankTag(bank) {
  /** @type {string} */
  let tag
  do {
    tag = `bank-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  } while (
    bank.entries.some((entry) => entry.tag === tag) ||
    slotsWithBankTag(tag).length > 0
  )
  return tag
}

/**
 * The party and box Pokemon stored in a slot, read straight from storage so
 * this never triggers offline progress or a full repair. A legacy slot-1 key
 * predates the bank, so it can never carry a tag and is not consulted.
 * @param {number} slot
 * @returns {any[]}
 */
function rawSlotPokemon(slot) {
  try {
    const json = localStorage.getItem(saveSlotKey(slot))
    if (!json) return []
    const saved = JSON.parse(json)
    return [
      ...(Array.isArray(saved?.party) ? saved.party : []),
      ...(Array.isArray(saved?.box) ? saved.box : []),
    ]
  } catch {
    return []
  }
}

/**
 * Every save slot whose party or box currently holds a Pokemon tagged `tag`.
 * This is the clone guard: a banked individual must exist in at most one save.
 * @param {string} tag
 * @returns {number[]}
 */
export function slotsWithBankTag(tag) {
  if (!tag) return []
  const slots = []
  for (let slot = 1; slot <= SAVE_SLOT_COUNT; slot++)
    if (rawSlotPokemon(slot).some((pokemon) => pokemon?.bankTag === tag)) slots.push(slot)
  return slots
}

/**
 * Read and validate the bank blob. Malformed entries and unknown species are
 * dropped rather than crashing the panel.
 * @returns {BankState}
 */
export function readBank() {
  try {
    const raw = JSON.parse(localStorage.getItem(BANK_KEY) ?? 'null')
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.entries))
      return { version: BANK_VERSION, entries: [] }
    /** @type {BankEntry[]} */
    const entries = []
    for (const rawEntry of raw.entries) {
      if (!rawEntry || typeof rawEntry !== 'object') continue
      const tag = typeof rawEntry.tag === 'string' && rawEntry.tag ? rawEntry.tag : null
      if (!tag) continue
      const pokemon = repairBankPokemon(rawEntry.pokemon)
      if (!pokemon) continue
      entries.push({
        tag,
        pokemon: { ...pokemon, bankTag: tag },
        sourceSlot: Number.isInteger(rawEntry.sourceSlot) ? rawEntry.sourceSlot : 0,
        depositedAt: Number.isFinite(rawEntry.depositedAt) ? rawEntry.depositedAt : 0,
      })
      if (entries.length >= BANK_CAPACITY) break
    }
    return { version: BANK_VERSION, entries }
  } catch {
    return { version: BANK_VERSION, entries: [] }
  }
}

/**
 * Persist the bank blob. Returns false when storage rejects the write.
 * @param {BankState} bank
 * @returns {boolean}
 */
export function writeBank(bank) {
  try {
    localStorage.setItem(
      BANK_KEY,
      JSON.stringify({ version: BANK_VERSION, entries: bank.entries.slice(0, BANK_CAPACITY) })
    )
    return true
  } catch {
    return false
  }
}

/**
 * Whether an in-memory save already owns a Pokemon tagged `tag`.
 * @param {GameState} state
 * @param {string} tag
 * @param {any} [except]
 * @returns {boolean}
 */
function stateHasBankTag(state, tag, except) {
  return [...state.party, ...state.box].some(
    (member) => member !== except && member?.bankTag === tag
  )
}

/**
 * Move a Pokemon out of the active save and into the bank.
 *
 * The save is written first and the bank second, so an interrupted write can
 * lose the individual but never leave a copy in two places; if the bank write
 * fails the save is restored. Returns the next state + bank on success.
 * @param {GameState} state
 * @param {string} pokemonId
 * @param {'party' | 'box'} source
 * @param {number} [slot]
 * @returns {{ state: GameState, bank: BankState, entry: BankEntry } | { error: string }}
 */
export function depositToBank(state, pokemonId, source, slot = getActiveSlot() || 1) {
  const bank = readBank()
  if (bank.entries.length >= BANK_CAPACITY) return { error: 'The Pokemon Bank is full.' }
  const original =
    source === 'party'
      ? state.party.find((member) => member.id === pokemonId)
      : state.box.find((member) => member.id === pokemonId)
  if (!original) return { error: 'That Pokemon is not in this save.' }
  const repaired = repairBankPokemon(original)
  if (!repaired) return { error: 'That Pokemon cannot be banked.' }
  const existingTag = typeof original.bankTag === 'string' && original.bankTag ? original.bankTag : null
  const tag = existingTag ?? newBankTag(bank)
  if (bank.entries.some((entry) => entry.tag === tag))
    return { error: 'That Pokemon is already in the Pokemon Bank.' }
  if (
    stateHasBankTag(state, tag, original) ||
    slotsWithBankTag(tag).some((otherSlot) => otherSlot !== slot)
  )
    return { error: 'That Pokemon already exists in another save.' }
  const nextState = gameReducer(state, { type: 'BANK_DEPOSIT', payload: { pokemonId, source } })
  if (nextState === state) return { error: 'That Pokemon cannot be moved right now.' }
  const entry = {
    tag,
    pokemon: { ...repaired, bankTag: tag },
    sourceSlot: slot,
    depositedAt: Date.now(),
  }
  const nextBank = { version: BANK_VERSION, entries: [...bank.entries, entry] }
  if (!persistSave(nextState, slot)) return { error: 'Could not write the save.' }
  if (!writeBank(nextBank)) {
    persistSave(state, slot)
    return { error: 'Could not update the Pokemon Bank.' }
  }
  return { state: nextState, bank: nextBank, entry }
}

/**
 * Move a banked Pokemon into the active save.
 *
 * The bank is written first and the save second, so an interrupted write can
 * lose the individual but never clone it; if the save write fails the bank
 * entry is restored. The individual keeps its bank tag but is re-keyed to the
 * destination save's id sequence.
 * @param {GameState} state
 * @param {string} tag
 * @param {number} [slot]
 * @returns {{ state: GameState, bank: BankState, pokemon: Pokemon } | { error: string }}
 */
export function withdrawFromBank(state, tag, slot = getActiveSlot() || 1) {
  const bank = readBank()
  const entry = bank.entries.find((candidate) => candidate.tag === tag)
  if (!entry) return { error: 'That Pokemon is no longer in the Pokemon Bank.' }
  const repaired = repairBankPokemon(entry.pokemon)
  if (!repaired) return { error: 'That Pokemon cannot be withdrawn.' }
  if (slotsWithBankTag(tag).length > 0 || stateHasBankTag(state, tag))
    return { error: 'That Pokemon already exists in a save.' }
  const pokemon = { ...repaired, bankTag: tag }
  const nextState = gameReducer(state, { type: 'BANK_WITHDRAW', payload: { pokemon } })
  if (nextState === state) return { error: 'Could not add that Pokemon to this save.' }
  const nextBank = {
    version: BANK_VERSION,
    entries: bank.entries.filter((candidate) => candidate.tag !== tag),
  }
  if (!writeBank(nextBank)) return { error: 'Could not update the Pokemon Bank.' }
  if (!persistSave(nextState, slot)) {
    writeBank(bank)
    return { error: 'Could not write the save.' }
  }
  return { state: nextState, bank: nextBank, pokemon }
}
