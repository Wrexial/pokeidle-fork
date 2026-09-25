// Emoji icons for bag / shop items.
//
// A per-item emoji is used rather than a downloaded sprite because the public
// sprite sets (PokeAPI, PokemonDB) have no art for many of the newer items the
// game models (the Galar/Hisui/Paldea evolution items, mints, ...), and the UI
// already leans on emoji glyphs elsewhere (the Town Map, the location panel,
// notifications). Emoji also need no per-item asset and can never 404.

/**
 * Specific icon per item id. Covers every item sold in a mart, the Reward Shop
 * or the Auction House.
 * @type {Record<string, string>}
 */
export const ITEM_ICONS = {
  // Active-effect items
  expShare: '\u{1F4C8}', // 📈
  repel: '\u{1F9F4}', // 🧴
  honey: '\u{1F36F}', // 🍯

  // Medicine and candy
  potion: '\u{1F9EA}', // 🧪
  superPotion: '\u{1F9EA}',
  hyperPotion: '\u{1F9EA}',
  maxPotion: '\u{1F9EA}',
  revive: '\u{1F497}', // 💗
  maxRevive: '\u{1F496}', // 💖
  natureMint: '\u{1F33F}', // 🌿

  // Berries
  oranBerry: '\u{1FAD0}', // 🫐
  sitrusBerry: '\u{1F34A}', // 🍊
  lumBerry: '\u{1F352}', // 🍒

  // Evolution stones
  fireStone: '\u{1F525}', // 🔥
  waterStone: '\u{1F4A7}', // 💧
  thunderStone: '\u{26A1}', // ⚡
  leafStone: '\u{1F343}', // 🍃
  moonStone: '\u{1F319}', // 🌙
  sunStone: '\u{2600}\u{FE0F}', // ☀️
  duskStone: '\u{1F311}', // 🌑
  shinyStone: '\u{2728}', // ✨
  dawnStone: '\u{1F305}', // 🌅
  iceStone: '\u{2744}\u{FE0F}', // ❄️
  ovalStone: '\u{1F95A}', // 🥚

  // Trade / item evolutions
  kingsRock: '\u{1F451}', // 👑
  metalCoat: '\u{1F9FC}', // 🫧 (nearest to a coat)
  dragonScale: '\u{1F409}', // 🐉
  upgrade: '\u{2B06}\u{FE0F}', // ⬆️
  dubiousDisc: '\u{1F4BF}', // 💿
  protector: '\u{1F6E1}\u{FE0F}', // 🛡️
  electirizer: '\u{1F50C}', // 🔌
  magmarizer: '\u{1F525}', // 🔥
  reaperCloth: '\u{1F9F5}', // 🧵
  razorClaw: '\u{1F5E1}\u{FE0F}', // 🗡️
  razorFang: '\u{1F9B7}', // 🦷
  deepSeaTooth: '\u{1F9B7}', // 🦷
  deepSeaScale: '\u{2696}\u{FE0F}', // ⚖️
  sachet: '\u{1F381}', // 🎁
  whippedDream: '\u{1F366}', // 🍦
  sweetApple: '\u{1F34E}', // 🍎
  tartApple: '\u{1F34F}', // 🍏
  crackedPot: '\u{1F3FA}', // 🏺
  galaricaCuff: '\u{1F300}', // 🌀
  galaricaWreath: '\u{1F33F}', // 🌿
  auspiciousArmor: '\u{1F534}', // 🔴
  maliciousArmor: '\u{1F535}', // 🔵
  strawberrySweet: '\u{1F353}', // 🍓
  linkCable: '\u{1F517}', // 🔗

  // Form-change items
  dnaSplicers: '\u{1F9EC}', // 🧬
  nLunarizer: '\u{1F319}', // 🌙
  nSolarizer: '\u{2600}\u{FE0F}', // ☀️
  meteorite: '\u{2604}\u{FE0F}', // ☄️
  griseousOrb: '\u{1F7E1}', // 🟡
  gracidea: '\u{1F338}', // 🌸
  revealGlass: '\u{1F50D}', // 🔍
  prisonBottle: '\u{1F37E}', // 🍾
  rotomCatalog: '\u{1F4D6}', // 📖
  rustedSword: '\u{2694}\u{FE0F}', // ⚔️
  rustedShield: '\u{1F6E1}\u{FE0F}', // 🛡️
  reinsOfUnity: '\u{1F40E}', // 🐴
  zygardeCube: '\u{1F9CA}', // 🧊
  ultranecroziumZ: '\u{1F48E}', // 💎
  megaStone: '\u{1F48E}', // 💎
  megaRing: '\u{1F48D}', // 💍

  // Held items
  charcoal: '\u{1F525}',
  mysticWater: '\u{1F4A7}',
  miracleSeed: '\u{1F331}', // 🌱
  magnet: '\u{1F9F2}', // 🧲
  neverMeltIce: '\u{2744}\u{FE0F}',
  blackBelt: '\u{1F94B}', // 🥋
  blackGlasses: '\u{1F576}\u{FE0F}', // 🕶️
  sharpBeak: '\u{1F426}', // 🐦
  poisonBarb: '\u{2620}\u{FE0F}', // ☠️
  spellTag: '\u{1F47B}', // 👻
  twistedSpoon: '\u{1F944}', // 🥄
  silverPowder: '\u{2728}',
  hardStone: '\u{1FAA8}', // 🪨
  softSand: '\u{231B}', // ⌛
  silkScarf: '\u{1F9E3}', // 🧣
  dragonFang: '\u{1F9B7}',
  pixiePlate: '\u{1F9DA}', // 🧚
  ironPlate: '\u{2699}\u{FE0F}', // ⚙️
  lifeOrb: '\u{1F52E}', // 🔮
  leftovers: '\u{1F34E}', // 🍎
  eviolite: '\u{1F6E1}\u{FE0F}',
  focusSash: '\u{1F3BD}', // 🎽
  choiceBand: '\u{1F380}', // 🎀
  choiceScarf: '\u{1F9E3}',
  choiceSpecs: '\u{1F576}\u{FE0F}',
  assaultVest: '\u{1F9BA}', // 🦺
}

/** Icon for an item the table does not name specifically. */
export const DEFAULT_ITEM_ICON = '\u{1F392}' // 🎒

/**
 * The emoji icon for an item.
 * @param {string} itemId
 * @returns {string}
 */
export function itemIcon(itemId) {
  return ITEM_ICONS[itemId] ?? DEFAULT_ITEM_ICON
}
