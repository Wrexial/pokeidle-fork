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

// Every Raid Island is a den where a legendary can be challenged.
for (const [locationId, location] of Object.entries(mapData))
  if (location.type === 'raid')
    addServicePoi(locationId, {
      kind: 'raidDen',
      icon: '\u{1f573}\ufe0f',
      label: 'Raid Den',
      hint: 'Start a raid here for a chance at the region\u2019s legendaries.',
    })

// The Ruins of Alph and the Tanoby Ruins are legendary shrines.
for (const locationId of ['johto-ruins-of-alph', 'sevii-islands-tanoby-ruins'])
  if (mapData[locationId])
    addServicePoi(locationId, {
      kind: 'shrine',
      icon: '\u26e9\ufe0f',
      label: 'Legendary Shrine',
      hint: 'An ancient ruin said to be tied to legendary Pokemon.',
    })

/**
 * Café menus, keyed by the location that hosts them. A café sells drinks that
 * raise friendship (a Poffin) or top up HP (a Poke Bean).
 * @type {Record<string, { name: string, items: { itemId: string, price: number }[] }>}
 */
export const CAFE_MENUS = {
  'celadonCity': { name: 'Celadon Cafe', items: [{ itemId: 'poffin', price: 800 }, { itemId: 'pokebean', price: 200 }] },
  'johto-goldenrod-city': { name: 'Goldenrod Cafe', items: [{ itemId: 'poffin', price: 800 }, { itemId: 'pokebean', price: 200 }] },
  'hoenn-slateport-city': { name: 'Harbor Cafe', items: [{ itemId: 'poffin', price: 800 }, { itemId: 'pokebean', price: 200 }] },
  'sinnoh-jubilife-city': { name: 'Jubilife Cafe', items: [{ itemId: 'poffin', price: 800 }, { itemId: 'pokebean', price: 200 }] },
  'unova-castelia-city': { name: 'Cafe Sonata', items: [{ itemId: 'poffin', price: 800 }, { itemId: 'pokebean', price: 200 }] },
  'kalos-lumiose-city': { name: 'Cafe Soleil', items: [{ itemId: 'poffin', price: 800 }, { itemId: 'pokebean', price: 200 }] },
  'alola-hauoli-city': { name: 'Malasada Shop', items: [{ itemId: 'poffin', price: 800 }, { itemId: 'pokebean', price: 200 }] },
  'galar-motostoke': { name: 'Motostoke Cafe', items: [{ itemId: 'poffin', price: 800 }, { itemId: 'pokebean', price: 200 }] },
  'paldea-mesagoza': { name: 'Mesagoza Cafe', items: [{ itemId: 'poffin', price: 800 }, { itemId: 'pokebean', price: 200 }] },
}

for (const [locationId] of Object.entries(CAFE_MENUS))
  if (mapData[locationId])
    addServicePoi(locationId, {
      kind: 'cafe',
      icon: '\u2615',
      label: 'Cafe',
      hint: 'Sit down for a drink \u2014 a Poffin raises friendship and a Poke Bean heals.',
    })

/**
 * The café menu at a location, or null.
 * @param {string | undefined} locationId
 */
export function cafeFor(locationId) {
  return (locationId && CAFE_MENUS[locationId]) || null
}

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
