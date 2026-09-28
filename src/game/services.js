// Service points of interest overlaid on existing map locations. Unlike a
// minigame POI (which lives in `minigames/registry.js`), a service is a
// flavour / utility stop that already exists in the game world and just needs
// to be findable on the Town Map: the Day-Care today, a Move Tutor / café /
// berry patch later. Keeping this as a plain location -> markers table means a
// new POI is one entry here plus (optionally) a panel card at the location.

import { DAYCARE_LOCATIONS } from '../data/config.js'

/**
 * @typedef {{ kind: string, icon: string, label: string, hint?: string }} ServicePoi
 */

/** @type {Record<string, ServicePoi[]>} */
export const SERVICE_POIS = {}

/**
 * Add a marker under a location (creating the list on first use).
 * @param {string} locationId
 * @param {ServicePoi} poi
 */
export function addServicePoi(locationId, poi) {
  const list = (SERVICE_POIS[locationId] ??= [])
  if (!list.some((existing) => existing.kind === poi.kind)) list.push(poi)
}

// The Day-Care is hosted on one route in every region; mark it so the Town Map
// tells the player where to breed instead of leaving them to find it.
for (const locationId of Object.values(DAYCARE_LOCATIONS))
  addServicePoi(locationId, {
    kind: 'daycare',
    icon: '\u{1f95a}',
    label: 'Day-Care',
    hint: 'Leave two compatible Pokemon here to breed Eggs.',
  })

/**
 * The service markers at a location (empty for the vast majority).
 * @param {string | undefined} locationId
 * @returns {ServicePoi[]}
 */
export function servicePoisFor(locationId) {
  return (locationId && SERVICE_POIS[locationId]) || []
}
