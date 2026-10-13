// One-off NPC gifts and static overworld encounters. Gifts hand over items,
// money or a Pokemon; statics start a normal wild battle with a fixed
// species/level. Both are claimed once per save (`state.claimedGifts`), and a
// static only counts as claimed when it is actually caught. Requirements are
// simple region-local gates (badges / champion / Pokedex size).

import { gymLeaderData, mapData, pokemonSpecies, regions } from '../data/gameData.js'
import { regionalStarters } from '../data/config.js'
import { rewardItemName } from './minigames/mining.js'

/**
 * @typedef {{
 *   id: string, location: string, name: string, description: string,
 *   items?: Record<string, number>, money?: number,
 *   pokemon?: { speciesKey: string, level: number },
 *   egg?: { speciesKey: string },
 *   randomStarter?: string,
 *   requires?: { badges?: number, champion?: string, caught?: number },
 * }} GiftEntry
 */

/** @type {GiftEntry[]} */
export const GIFTS = [
  {
    id: 'gift-pallet-parcel',
    location: 'palletTown',
    name: "Oak's Aide",
    description: 'A welcome pack for a brand-new trainer.',
    items: { pokeball: 10, potion: 5 },
  },
  {
    id: 'gift-celadon-eevee',
    location: 'celadonCity',
    name: 'Celadon Condominiums',
    description: 'A trainer on the top floor is offering an Eevee.',
    pokemon: { speciesKey: 'eevee', level: 25 },
    requires: { badges: 4 },
  },
  {
    id: 'gift-johto-starter',
    location: 'johto-new-bark-town',
    name: "Professor Elm's Lab",
    description: 'Elm has a spare Johto starter to give away.',
    randomStarter: 'johto',
  },
  {
    id: 'gift-johto-togepi-egg',
    location: 'johto-route-30',
    name: "Mr. Pok\u00e9mon's House",
    description: 'Mr. Pok\u00e9mon entrusts you with a strange Egg to carry.',
    egg: { speciesKey: 'togepi' },
    requires: { badges: 1 },
  },
  {
    id: 'gift-hoenn-castform',
    location: 'hoenn-route-119',
    name: 'Weather Institute',
    description: 'The researchers give you the Castform they study.',
    pokemon: { speciesKey: 'castform', level: 25 },
    requires: { badges: 4 },
  },
  {
    id: 'gift-hoenn-beldum',
    location: 'hoenn-mossdeep-city',
    name: "Steven's House",
    description: 'The Hoenn Champion leaves a Beldum in his home for a rising trainer.',
    pokemon: { speciesKey: 'beldum', level: 5 },
    requires: { champion: 'hoenn' },
  },
  {
    id: 'gift-sinnoh-eevee',
    location: 'sinnoh-hearthome-city',
    name: "Bebe's House",
    description: 'The PC developer has an Eevee looking for a home.',
    pokemon: { speciesKey: 'eevee', level: 25 },
    requires: { badges: 4 },
  },
  {
    id: 'gift-unova-larvesta',
    location: 'unova-nacrene-city',
    name: 'Nacrene Museum',
    description: 'A curator gifts an ancient Larvesta.',
    pokemon: { speciesKey: 'larvesta', level: 1 },
    requires: { badges: 2 },
  },
  {
    id: 'gift-alola-starter',
    location: 'alola-iki-town',
    name: 'Iki Town Festival',
    description: 'A trial-goer shares one of the Alola starters.',
    randomStarter: 'alola',
  },
  {
    id: 'gift-paldea-starter',
    location: 'paldea-mesagoza',
    name: 'Naranja Academy',
    description: 'The academy spares one of the Paldea starters.',
    randomStarter: 'paldea',
  },
  // Fossil gifts: the item is revived at Cinnabar Island (#50). Mining is the
  // repeatable source; these one-off gifts give each region its fossils.
  {
    id: 'gift-kanto-fossils',
    location: 'mtMoon',
    name: 'Mt. Moon Fossils',
    description: 'Ancient fossils are embedded in the cave wall.',
    items: { helixFossil: 1, domeFossil: 1, oldAmber: 1 },
  },
  {
    id: 'gift-hoenn-fossils',
    location: 'hoenn-route-111',
    name: 'Desert Fossils',
    description: 'Fossils are baked into the desert sand.',
    items: { rootFossil: 1, clawFossil: 1 },
  },
  {
    id: 'gift-sinnoh-fossils',
    location: 'sinnoh-sea-route-230',
    name: 'Underground Fossils',
    description: 'Fossils dug up from the Sinnoh Underground.',
    items: { skullFossil: 1, armorFossil: 1 },
  },
  {
    id: 'gift-unova-fossils',
    location: 'unova-route-23',
    name: 'Relic Fossils',
    description: 'Fossils unearthed near the Relic Castle.',
    items: { coverFossil: 1, plumeFossil: 1 },
  },
  {
    id: 'gift-kalos-fossils',
    location: 'kalos-route-22',
    name: 'Glittering Fossils',
    description: 'Fossils found in the Glittering Cave.',
    items: { jawFossil: 1, sailFossil: 1 },
  },
  {
    id: 'gift-galar-fossils',
    location: 'galar-route-10',
    name: 'Digging Duo Fossils',
    description: 'The Digging Duo unearth a set of Galar fossils.',
    items: {
      fossilizedBird: 1,
      fossilizedDino: 1,
      fossilizedFish: 1,
      fossilizedDrake: 1,
    },
  },
]

/**
 * @typedef {{
 *   id: string, location: string, speciesKey: string, level: number,
 *   name: string, note: string,
 *   shiny?: boolean,
 *   requires?: { badges?: number, champion?: string, caught?: number },
 * }} StaticEncounter
 */

/** @type {StaticEncounter[]} */
const BASE_STATIC_ENCOUNTERS = [
  {
    id: 'static-route12-snorlax',
    location: 'route12',
    speciesKey: 'snorlax',
    level: 30,
    name: 'Sleeping Snorlax',
    note: 'A huge Snorlax is blocking the road.',
    requires: { badges: 3 },
  },
  {
    id: 'static-route16-snorlax',
    location: 'route16',
    speciesKey: 'snorlax',
    level: 30,
    name: 'Another Snorlax',
    note: 'A second Snorlax snoozes on the Cycling Road.',
    requires: { badges: 5 },
  },
  {
    id: 'static-johto-sudowoodo',
    location: 'johto-route-36',
    speciesKey: 'sudowoodo',
    level: 20,
    name: 'Wiggling Tree',
    note: 'That is no ordinary tree.',
  },
  {
    id: 'static-johto-red-gyarados',
    location: 'johto-route-43',
    speciesKey: 'gyarados',
    level: 55,
    name: 'Red Gyarados',
    note: 'A furious red Gyarados is raging in the lake ahead.',
    shiny: !0,
    requires: { badges: 7 },
  },
  {
    id: 'static-hoenn-kecleon',
    location: 'hoenn-route-120',
    speciesKey: 'kecleon',
    level: 25,
    name: 'Invisible Pokemon',
    note: 'Something unseen rustles in the tall grass.',
  },
  {
    id: 'static-kalos-snorlax',
    location: 'kalos-route-7',
    speciesKey: 'snorlax',
    level: 30,
    name: 'Flute Snorlax',
    note: 'A Snorlax is asleep across the bridge.',
  },
  // Hisui's five noble Pokemon, fought as statics in the post-game zone.
  {
    id: 'static-hisui-kleavor',
    location: 'hisui-obsidian-fieldlands',
    speciesKey: 'kleavor',
    level: 72,
    name: 'Noble Kleavor',
    note: 'The frenzied noble of the Obsidian Fieldlands.',
    requires: { champion: 'sinnoh' },
  },
  {
    id: 'static-hisui-lilligant',
    location: 'hisui-crimson-mirelands',
    speciesKey: 'h-lilligant',
    level: 73,
    name: 'Noble Lilligant',
    note: 'The frenzied noble of the Crimson Mirelands.',
    requires: { champion: 'sinnoh' },
  },
  {
    id: 'static-hisui-arcanine',
    location: 'hisui-cobalt-coastlands',
    speciesKey: 'h-arcanine',
    level: 74,
    name: 'Noble Arcanine',
    note: 'The frenzied noble of the Cobalt Coastlands.',
    requires: { champion: 'sinnoh' },
  },
  {
    id: 'static-hisui-electrode',
    location: 'hisui-coronet-highlands',
    speciesKey: 'h-electrode',
    level: 75,
    name: 'Noble Electrode',
    note: 'The frenzied noble of the Coronet Highlands.',
    requires: { champion: 'sinnoh' },
  },
  {
    id: 'static-hisui-avalugg',
    location: 'hisui-alabaster-icelands',
    speciesKey: 'h-avalugg',
    level: 76,
    name: 'Noble Avalugg',
    note: 'The frenzied noble of the Alabaster Icelands.',
    requires: { champion: 'sinnoh' },
  },
  // The ride Pokemon, found in the wild in Hisui and offered as statics so a
  // rider can be picked up without evolving for one.
  {
    id: 'static-hisui-wyrdeer',
    location: 'hisui-obsidian-fieldlands',
    speciesKey: 'wyrdeer',
    level: 70,
    name: 'Ride Wyrdeer',
    note: 'A Wyrdeer watches from the ridge, ready to carry a rider.',
    requires: { champion: 'sinnoh' },
  },
  {
    id: 'static-hisui-ursaluna',
    location: 'hisui-crimson-mirelands',
    speciesKey: 'ursaluna',
    level: 71,
    name: 'Ride Ursaluna',
    note: 'An Ursaluna snuffles for treasure in the bog.',
    requires: { champion: 'sinnoh' },
  },
  {
    id: 'static-hisui-basculegion',
    location: 'hisui-cobalt-coastlands',
    speciesKey: 'basculegion',
    level: 71,
    name: 'Ride Basculegion',
    note: 'A Basculegion rides the surf just off the shore.',
    requires: { champion: 'sinnoh' },
  },
  {
    id: 'static-hisui-sneasler',
    location: 'hisui-coronet-highlands',
    speciesKey: 'sneasler',
    level: 72,
    name: 'Ride Sneasler',
    note: 'A Sneasler scales the cliffs with ease.',
    requires: { champion: 'sinnoh' },
  },
  {
    id: 'static-hisui-braviary',
    location: 'hisui-alabaster-icelands',
    speciesKey: 'h-braviary',
    level: 72,
    name: 'Ride Braviary',
    note: 'A Hisuian Braviary circles overhead.',
    requires: { champion: 'sinnoh' },
  },
]

/** @type {StaticEncounter[]} */
export const STATIC_ENCOUNTERS = [...BASE_STATIC_ENCOUNTERS]

/**
 * @param {{ location: string }} entry
 * @returns {string}
 */
function entryRegion(entry) {
  return mapData[entry.location]?.region ?? 'kanto'
}

/**
 * Whether an entry's requirements are met, with a readable checklist.
 * @param {GameState} state
 * @param {{ location: string, requires?: { badges?: number, champion?: string, caught?: number } }} entry
 * @returns {{ met: boolean, requirements: { label: string, current: number, required: number, met: boolean }[] }}
 */
export function entryRequirementStatus(state, entry) {
  const requires = entry.requires ?? {},
    regionId = entryRegion(entry),
    requirements = []
  if (requires.badges) {
    const current = gymLeaderData.filter(
      (gym) => (gym.region ?? 'kanto') === regionId && state.defeatedGyms.includes(gym.id)
    ).length
    requirements.push({
      label: 'Badges',
      current,
      required: requires.badges,
      met: current >= requires.badges,
    })
  }
  if (requires.champion) {
    const regionName =
      regions.find((candidate) => candidate.id === requires.champion)?.name ?? requires.champion
    requirements.push({
      label: `${regionName} Champion`,
      current: (state.defeatedChampions ?? []).includes(requires.champion) ? 1 : 0,
      required: 1,
      met: (state.defeatedChampions ?? []).includes(requires.champion),
    })
  }
  if (requires.caught) {
    requirements.push({
      label: 'Pokemon caught',
      current: state.pokedexCaught.length,
      required: requires.caught,
      met: state.pokedexCaught.length >= requires.caught,
    })
  }
  return { met: requirements.every((requirement) => requirement.met), requirements }
}

/** @param {string} giftId @returns {GiftEntry | null} */
export function findGift(giftId) {
  return GIFTS.find((gift) => gift.id === giftId) ?? null
}

/** @param {string} staticId @returns {StaticEncounter | null} */
export function findStatic(staticId) {
  return STATIC_ENCOUNTERS.find((entry) => entry.id === staticId) ?? null
}

/**
 * The gift and static entries at a location, annotated with claimed / requirement
 * state.
 * @param {GameState} state
 * @param {string} locationId
 * @returns {{
 *   gifts: (GiftEntry & { claimed: boolean, met: boolean, requirements: { label: string, current: number, required: number, met: boolean }[] })[],
 *   statics: (StaticEncounter & { claimed: boolean, met: boolean, requirements: { label: string, current: number, required: number, met: boolean }[] })[],
 * }}
 */
export function locationEntries(state, locationId) {
  const claimed = new Set(state.claimedGifts ?? [])
  return {
    gifts: GIFTS.filter((gift) => gift.location === locationId).map((gift) => ({
      ...gift,
      claimed: claimed.has(gift.id),
      ...entryRequirementStatus(state, gift),
    })),
    statics: STATIC_ENCOUNTERS.filter((entry) => entry.location === locationId).map((entry) => ({
      ...entry,
      claimed: claimed.has(entry.id),
      ...entryRequirementStatus(state, entry),
    })),
  }
}

/**
 * The starter a `randomStarter` gift hands over: a random member of the
 * region's starter trio. In the region the player started in, the starter they
 * picked pre-game is left out so the gift is never a duplicate.
 * @param {GameState} state
 * @param {{ randomStarter?: string }} gift
 * @param {() => number} [rng]
 * @returns {string | null}
 */
export function resolveGiftStarter(state, gift, rng = Math.random) {
  const regionId = gift.randomStarter
  if (!regionId) return null
  const starters = (regionalStarters[regionId] ?? []).filter((key) => pokemonSpecies[key])
  if (starters.length === 0) return null
  let pool = starters
  if (regionId === state.startRegion && state.starterSpeciesKey)
    pool = starters.filter((key) => key !== state.starterSpeciesKey)
  if (pool.length === 0) pool = starters
  return pool[Math.floor(rng() * pool.length)] ?? pool[0]
}

/**
 * A short human label for what a gift hands over.
 * @param {{
 *   pokemon?: { speciesKey: string },
 *   egg?: { speciesKey: string },
 *   randomStarter?: string,
 *   money?: number,
 *   items?: Record<string, number>,
 * }} gift
 * @returns {string}
 */
export function giftRewardLabel(gift) {
  const parts = []
  if (gift.pokemon)
    parts.push(pokemonSpecies[gift.pokemon.speciesKey]?.name ?? gift.pokemon.speciesKey)
  if (gift.egg)
    parts.push(`${pokemonSpecies[gift.egg.speciesKey]?.name ?? gift.egg.speciesKey} Egg`)
  if (gift.randomStarter) {
    const regionName =
      regions.find((region) => region.id === gift.randomStarter)?.name ?? gift.randomStarter
    parts.push(`a random ${regionName} starter`)
  }
  if (gift.money) parts.push(`$${gift.money.toLocaleString()}`)
  for (const [itemId, quantity] of Object.entries(gift.items ?? {}))
    parts.push(`${rewardItemName(itemId)} x${quantity}`)
  return parts.join(' + ')
}

// --- Mystery Gifts (rotating Wonder Card distributions) ---------------------
//
// Rotating, battle-gated Mythical distributions in the Wonder Card style. Each
// rotation gift opens once the player has won enough total battles (one card per
// MYSTERY_GIFT_BATTLE_STEP) and stays claimable once its threshold is reached,
// so an idle player unlocks the next card by playing, not by waiting for the
// calendar. Offline "codes" are matched against the same table; there is no
// backend, so a code is just a shared string (a signed variant could be added
// later without changing the panel).

/**
 * @typedef {{
 *   id: string, name: string, distribution: string, description: string,
 *   ot: string, pokemon?: { speciesKey: string, level: number },
 *   items?: Record<string, number>, money?: number,
 *   code?: string, requires?: { caught?: number },
 * }} MysteryGiftEntry
 */

/** @type {MysteryGiftEntry[]} */
export const MYSTERY_GIFTS = [
  {
    id: 'mg-mew',
    name: 'Mew',
    distribution: 'A Mythical Discovery',
    description: 'A Mythical Pokemon said to carry the DNA of every Pokemon.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'mew', level: 5 },
  },
  {
    id: 'mg-celebi',
    name: 'Celebi',
    distribution: 'Voice of the Forest',
    description: 'A gentle forest guardian that drifts through time itself.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'celebi', level: 10 },
  },
  {
    id: 'mg-jirachi',
    name: 'Jirachi',
    distribution: 'Wish Maker',
    description: 'It awakens once every thousand years to grant a wish.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'jirachi', level: 10 },
  },
  {
    id: 'mg-deoxys',
    name: 'Deoxys',
    distribution: 'Space Virus',
    description: 'A Pokemon born from a virus that fell to earth on a meteor.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'deoxys', level: 30 },
  },
  {
    id: 'mg-phione',
    name: 'Phione',
    distribution: 'Prince of the Sea',
    description: 'It drifts the warm seas, always chasing its parent Manaphy.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'phione', level: 20 },
  },
  {
    id: 'mg-manaphy',
    name: 'Manaphy',
    distribution: 'Prince of the Sea',
    description: 'It can bond with any Pokemon and guide it home across oceans.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'manaphy', level: 10 },
  },
  {
    id: 'mg-darkrai',
    name: 'Darkrai',
    distribution: 'Newmoon Nightmare',
    description: 'It lulls people and Pokemon into restless sleep to protect itself.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'darkrai', level: 50 },
  },
  {
    id: 'mg-shaymin',
    name: 'Shaymin',
    distribution: 'Gratitude Pokemon',
    description: 'Where it walks, the air clears and flowers bloom in an instant.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'shaymin', level: 30 },
  },
  {
    id: 'mg-arceus',
    name: 'Arceus',
    distribution: 'The Mythical Creator',
    description: 'Said to have shaped the universe from a single egg.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'arceus', level: 60 },
  },
  {
    id: 'mg-victini',
    name: 'Victini',
    distribution: 'Victory Star',
    description: 'It brings victory to whoever it bonds with.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'victini', level: 15 },
  },
  {
    id: 'mg-keldeo',
    name: 'Keldeo',
    distribution: 'Colt of Justice',
    description: 'It crosses the world by running the surface of the sea.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'keldeo', level: 40 },
  },
  {
    id: 'mg-meloetta',
    name: 'Meloetta',
    distribution: 'Melody of Mankind',
    description: 'Its song has the power to command the hearts of all who hear it.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'meloetta', level: 30 },
  },
  {
    id: 'mg-genesect',
    name: 'Genesect',
    distribution: 'Paleozoic Pokemon',
    description: 'An ancient hunter restored and outfitted by Team Plasma.',
    ot: 'PLASMA',
    pokemon: { speciesKey: 'genesect', level: 40 },
  },
  {
    id: 'mg-diancie',
    name: 'Diancie',
    distribution: 'Jewel Princess',
    description: 'A sudden transformation of Carbink, its pink crystal is legendary.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'diancie', level: 40 },
  },
  {
    id: 'mg-hoopa',
    name: 'Hoopa',
    distribution: 'Mischief Djinn',
    description: 'It gathers up things into its ring and warps them through space.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'hoopa', level: 40 },
  },
  {
    id: 'mg-volcanion',
    name: 'Volcanion',
    distribution: 'Steam Pokemon',
    description: 'It erupts water from its arms, hot enough to melt anything.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'volcanion', level: 40 },
  },
  {
    id: 'mg-magearna',
    name: 'Magearna',
    distribution: 'Artificial Pokemon',
    description: 'A clockwork marvel built five hundred years ago.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'magearna', level: 40 },
  },
  {
    id: 'mg-marshadow',
    name: 'Marshadow',
    distribution: 'Gloomdweller',
    description: 'It lurks in the shadows and copies the moves of anyone it sees.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'marshadow', level: 40 },
  },
  {
    id: 'mg-zeraora',
    name: 'Zeraora',
    distribution: 'Thunderclap Pokemon',
    description: 'It stores lightning in its fur to move faster than the eye can follow.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'zeraora', level: 40 },
  },
  {
    id: 'mg-meltan',
    name: 'Meltan',
    distribution: 'Hex Nut Pokemon',
    description: 'It feeds on metal and can pull its body apart and back together.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'meltan', level: 15 },
  },
  {
    id: 'mg-melmetal',
    name: 'Melmetal',
    distribution: 'Hex Nut Pokemon',
    description: 'A massive body of hardened steel, forged from many Meltan.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'melmetal', level: 50 },
  },
  {
    id: 'mg-zarude',
    name: 'Zarude',
    distribution: 'Rogue Monkey',
    description: 'It swings through the treetops of dense forests with its vines.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'zarude', level: 40 },
  },
  {
    id: 'mg-pecharunt',
    name: 'Pecharunt',
    distribution: 'Subjugation Pokemon',
    description: 'It controls those who eat the poisoned mochi it makes.',
    ot: 'MYSTERY',
    pokemon: { speciesKey: 'pecharunt', level: 45 },
  },
  // Offline redeem codes (matched against the table, no backend). These are not
  // part of the date rotation and only appear once they have been redeemed.
  {
    id: 'mg-code-wonder-bundle',
    name: 'Wonder Card Bundle',
    distribution: 'Redeem Code',
    description: 'A thank-you gift from the Pokemon Idle team.',
    ot: 'MYSTERY',
    code: 'WONDERCARD',
    items: { masterball: 1, rareCandy: 5 },
  },
  {
    id: 'mg-code-gold-rush',
    name: 'Gold Rush Bundle',
    distribution: 'Redeem Code',
    description: 'A stash of treasures for a returning trainer.',
    ot: 'MYSTERY',
    code: 'GOLDRUSH',
    items: { bigNugget: 3, goldBottleCap: 1 },
  },
]

/** How many total battles open each successive Wonder Card. */
export const MYSTERY_GIFT_BATTLE_STEP = 250

/** The rotation gifts, in schedule order (code gifts are excluded). */
export const MYSTERY_GIFT_ROTATION = MYSTERY_GIFTS.filter((gift) => !gift.code)

/**
 * The player's total battles won (wild + trainer), the pace of the rotation.
 * @param {GameState} [state]
 * @returns {number}
 */
export function mysteryGiftBattleCount(state) {
  return (state?.wildBattlesWon ?? 0) + (state?.trainerBattlesWon ?? 0)
}

/**
 * How many rotation cards the player has opened. Each `MYSTERY_GIFT_BATTLE_STEP`
 * total battles opens one more; the first card opens at the first step.
 * @param {GameState} [state]
 * @returns {number}
 */
export function mysteryGiftProgress(state) {
  return Math.floor(mysteryGiftBattleCount(state) / MYSTERY_GIFT_BATTLE_STEP)
}

/**
 * The total battles a rotation gift opens at, or null for a code gift.
 * @param {MysteryGiftEntry} gift
 * @returns {number | null}
 */
export function mysteryGiftUnlockBattles(gift) {
  const index = MYSTERY_GIFT_ROTATION.indexOf(gift)
  if (index < 0) return null
  return (index + 1) * MYSTERY_GIFT_BATTLE_STEP
}

/**
 * Whether a gift's distribution has opened. Codes are always open.
 * @param {MysteryGiftEntry} gift
 * @param {GameState} [state]
 * @returns {boolean}
 */
export function mysteryGiftUnlocked(gift, state) {
  if (gift.code) return true
  const index = MYSTERY_GIFT_ROTATION.indexOf(gift)
  return index >= 0 && mysteryGiftProgress(state) > index
}

/**
 * The gift featured now (the newest to open), or null before the first step.
 * @param {GameState} [state]
 * @returns {MysteryGiftEntry | null}
 */
export function featuredMysteryGift(state) {
  const progress = mysteryGiftProgress(state)
  if (progress <= 0) return null
  return MYSTERY_GIFT_ROTATION[Math.min(progress - 1, MYSTERY_GIFT_ROTATION.length - 1)] ?? null
}

/**
 * The next rotation gift that has not opened yet, with its battle threshold.
 * @param {GameState} [state]
 * @returns {{ gift: MysteryGiftEntry, battles: number } | null}
 */
export function nextMysteryGift(state) {
  const index = mysteryGiftProgress(state),
    gift = MYSTERY_GIFT_ROTATION[index]
  if (!gift) return null
  return { gift, battles: (index + 1) * MYSTERY_GIFT_BATTLE_STEP }
}

/** @param {string} giftId @returns {MysteryGiftEntry | null} */
export function findMysteryGift(giftId) {
  return MYSTERY_GIFTS.find((gift) => gift.id === giftId) ?? null
}

/**
 * Resolve an offline redeem code (case-insensitive, trimmed).
 * @param {string} code
 * @returns {MysteryGiftEntry | null}
 */
export function findMysteryGiftByCode(code) {
  const normalized = String(code ?? '').trim().toUpperCase()
  if (!normalized) return null
  return MYSTERY_GIFTS.find((gift) => gift.code === normalized) ?? null
}

/**
 * The panel status for one Mystery Gift card.
 * @param {GameState} state
 * @param {MysteryGiftEntry} gift
 */
export function mysteryGiftStatus(state, gift) {
  const claimed = (state.claimedGifts ?? []).includes(gift.id),
    unlocked = mysteryGiftUnlocked(gift, state),
    requirement = entryRequirementStatus(state, { ...gift, location: '' })
  return {
    claimed,
    unlocked,
    met: requirement.met,
    requirements: requirement.requirements,
    claimable: unlocked && !claimed && requirement.met,
    featured: gift.code ? false : featuredMysteryGift(state)?.id === gift.id,
    unlockBattles: gift.code ? null : mysteryGiftUnlockBattles(gift),
  }
}

/**
 * Every rotation gift the player could claim right now. Code gifts are left
 * out (they only surface once redeemed, so they never light the badge).
 * @param {GameState} state
 * @returns {MysteryGiftEntry[]}
 */
export function claimableMysteryGifts(state) {
  return MYSTERY_GIFT_ROTATION.filter((gift) => mysteryGiftStatus(state, gift).claimable)
}
