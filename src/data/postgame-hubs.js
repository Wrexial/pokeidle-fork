// The base camps at the centre of each post-game zone. Hisui's Jubilife Village
// and the Lumiose Wild Zones' plaza are hub locations: a themed scene with a
// shop, a party heal and a launch pad into the zone's areas. They reuse the
// zone's own sub-area list, so a hub never invents new map nodes.

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   subtitle: string,
 *   icon: string,
 *   background: string,
 *   greeting: string,
 *   description: string,
 *   shop: { name: string, items: { itemId: string }[] },
 * }} PostgameHub
 */

/** @type {Record<string, PostgameHub>} */
export const POSTGAME_HUBS = {
  hisui: {
    id: 'hisui',
    name: 'Jubilife Village',
    subtitle: 'The village at the heart of Hisui',
    icon: '\u{1f3d8}\ufe0f',
    background: '/backgrounds/town.webp',
    greeting: 'The gates of Jubilife Village swing open. The Galaxy Team is glad to see you back.',
    description:
      'The last settled place in Hisui, ringed by a wooden palisade. Rest here, restock at the craftworks, then set out into the wilds beyond.',
    shop: {
      name: 'Jubilife Craftworks',
      items: [
        { itemId: 'pokeball' },
        { itemId: 'greatball' },
        { itemId: 'ultraball' },
        { itemId: 'potion' },
        { itemId: 'superPotion' },
        { itemId: 'revive' },
      ],
    },
  },
  'lumiose-wild-zones': {
    id: 'lumiose-wild-zones',
    name: 'Lumiose Plaza',
    subtitle: 'The heart of the Wild City',
    icon: '\u{1f3d9}\ufe0f',
    background: '/backgrounds/town.webp',
    greeting: 'Neon and old stone meet at the plaza. The Wild Zones hum just past the boulevards.',
    description:
      'The central plaza ties Lumiose City together. Stock up at the boutique or rest at the fountain before stepping into one of the Wild Zones.',
    shop: {
      name: 'Lumiose Boutique',
      items: [
        { itemId: 'pokeball' },
        { itemId: 'greatball' },
        { itemId: 'ultraball' },
        { itemId: 'hyperPotion' },
        { itemId: 'revive' },
        { itemId: 'maxPotion' },
      ],
    },
  },
}

/**
 * The hub for a zone location id, or null when the location isn't a hub.
 * @param {string | null | undefined} locationId
 * @returns {PostgameHub | null}
 */
export function postgameHubFor(locationId) {
  return (locationId && POSTGAME_HUBS[locationId]) || null
}
