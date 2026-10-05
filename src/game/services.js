// Service points of interest overlaid on existing map locations. Unlike a
// minigame POI (which lives in `minigames/registry.js`), a service is a
// flavour / utility stop that already exists in the game world and just needs
// to be findable on the Town Map: the Day-Care today, a Move Tutor / café /
// berry patch later. Keeping this as a plain location -> markers table means a
// new POI is one entry here plus (optionally) a panel card at the location.

import { BATTLE_TOWER_LOCATION, DAYCARE_LOCATIONS } from '../data/config.js'
import { mapData } from '../data/gameData.js'

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

// The Berry Garden lives inside the Poke Pelago hub.
if (mapData['alola-poke-pelago'])
  addServicePoi('alola-poke-pelago', {
    kind: 'berryGarden',
    icon: '\u{1fab0}',
    label: 'Berry Garden',
    hint: 'Plant and harvest berries from the Poke Pelago garden.',
  })

// The Battle Tower is a facility on Hoenn Route 111.
if (BATTLE_TOWER_LOCATION && mapData[BATTLE_TOWER_LOCATION])
  addServicePoi(BATTLE_TOWER_LOCATION, {
    kind: 'battleTower',
    icon: '\u{1f3db}\ufe0f',
    label: 'Battle Tower',
    hint: 'Climb the tower for Victory Tokens and a tower record.',
  })

/**
 * The distinct service marker kinds, for the Town Map legend.
 * @returns {{ kind: string, icon: string, label: string }[]}
 */
export function servicePoiKinds() {
  /** @type {Map<string, { kind: string, icon: string, label: string }>} */
  const kinds = new Map()
  for (const list of Object.values(SERVICE_POIS))
    for (const poi of list)
      if (!kinds.has(poi.kind))
        kinds.set(poi.kind, { kind: poi.kind, icon: poi.icon, label: poi.label })
  return [...kinds.values()]
}

/**
 * The service markers at a location (empty for the vast majority).
 * @param {string | undefined} locationId
 * @returns {ServicePoi[]}
 */
export function servicePoisFor(locationId) {
  return (locationId && SERVICE_POIS[locationId]) || []
}
