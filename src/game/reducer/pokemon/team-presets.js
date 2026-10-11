// Saved party presets: capture the current party and restore it in one tap.

import { MAX_TEAM_PRESETS } from '../../../data/config.js'
import { loadActivePokemonFromParty } from '../../progression.js'

/** The phases a preset can be applied in (only the map, never mid-battle). */
const APPLYABLE_PHASES = new Set(['idle'])

/**
 * Handle the `SAVE_TEAM_PRESET` action: remember the current party (by Pokemon
 * id, in order) under a name. The oldest preset falls off past the cap.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function saveTeamPreset(state, action) {
  const members = (state.party ?? []).map((member) => member.id)
  if (members.length === 0) return state
  const presets = state.teamPresets ?? [],
    requestedName = String(action.payload?.name ?? '').trim(),
    preset = {
      id: `team-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: requestedName.slice(0, 24) || `Team ${presets.length + 1}`,
      members,
    }
  return {
    ...state,
    teamPresets: [...presets, preset].slice(-MAX_TEAM_PRESETS),
  }
}

/**
 * Handle the `DELETE_TEAM_PRESET` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function deleteTeamPreset(state, action) {
  const presetId = action.payload?.presetId
  if (!presetId) return state
  return {
    ...state,
    teamPresets: (state.teamPresets ?? []).filter((preset) => preset.id !== presetId),
  }
}

/**
 * Handle the `APPLY_TEAM_PRESET` action: put the preset's Pokemon into the
 * party first, in order, then keep whatever other party members fit. A member
 * that no longer exists is skipped, and anything bumped out moves to the box.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function applyTeamPreset(state, action) {
  const preset = (state.teamPresets ?? []).find(
    (candidate) => candidate.id === action.payload?.presetId
  )
  if (!preset || !APPLYABLE_PHASES.has(state.phase)) return state
  const byId = new Map(
      [...(state.party ?? []), ...(state.box ?? [])].map((member) => [member.id, member])
    ),
    nextParty = [],
    usedIds = new Set()
  for (const memberId of preset.members ?? []) {
    const member = byId.get(memberId)
    if (!member || usedIds.has(memberId) || nextParty.length >= 6) continue
    nextParty.push(member)
    usedIds.add(memberId)
  }
  // Fill the rest of the party with the members already there, in order.
  for (const member of state.party ?? []) {
    if (nextParty.length >= 6) break
    if (usedIds.has(member.id)) continue
    nextParty.push(member)
    usedIds.add(member.id)
  }
  // Promoted members leave the box, and whatever left the party joins it.
  const box = [
    ...(state.box ?? []).filter((member) => !usedIds.has(member.id)),
    ...(state.party ?? []).filter((member) => !usedIds.has(member.id)),
  ]
  return loadActivePokemonFromParty({
    ...state,
    party: nextParty,
    box,
    activePlayerPokemonIndex: 0,
  })
}
