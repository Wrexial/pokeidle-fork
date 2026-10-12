/**
 * Download the item sprites the shops / auction house reference.
 *
 * The game shows an icon next to each shop item (see src/components/item-icon.js
 * and the `itemIcons` manifest in public/data/item-icons.json). The sprites come
 * from Serebii's itemdex, which covers every item the game models — including
 * the Galar / Hisui / Paldea evolution items, mints and key items that PokeAPI
 * and PokemonDB do not ship art for.
 *
 * Every sprite is saved as public/sprites/items/<itemId>.png and written into
 * public/data/item-icons.json as `{ itemId: '<itemId>.png' }`. Items are read
 * from the live data tables (mart stock, the Reward Shop and the Auction House
 * lots), so a new item is picked up automatically; add an entry to SEREBII_NAMES
 * if its Serebii filename differs from the lowercased item id.
 *
 * Idempotent: existing files are skipped, so it is safe to re-run.
 *
 * Usage:
 *   node tools/download-item-sprites.cjs [--force]
 */

const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const ROOT = path.join(__dirname, '..')
const SPRITE_DIR = path.join(ROOT, 'public', 'sprites', 'items')
const MANIFEST_PATH = path.join(ROOT, 'public', 'data', 'item-icons.json')
const SEREBII = 'https://www.serebii.net/itemdex/sprites'

const FORCE = process.argv.includes('--force')

/**
 * The few items whose Serebii filename isn't just the lowercased item id, plus
 * the items Serebii has no art for at all and a close stand-in.
 * @type {Record<string, string>}
 */
const SEREBII_NAMES = {
  linkCable: 'linkingcord',
  expShare: 'exp.share',
  expCandyS: 'exp.candys',
  expCandyM: 'exp.candym',
  expCandyL: 'exp.candyl',
  expCandyXL: 'exp.candyxl',
  nLunarizer: 'n-lunarizer',
  nSolarizer: 'n-solarizer',
  natureMint: 'seriousmint',
  megaStone: 'keystone',
  // Max Soup is made from Max Mushrooms; Serebii has no soup sprite.
  maxMushroom: 'maxmushrooms',
  // No generic sprite exists for these minigame foods, so use a close item.
  curry: 'packagedcurry',
  pokebean: 'tinofbeans',
  poffin: 'sweetheart',
  // Serebii names the Apricorns colour-first.
  apricornRed: 'redapricorn',
  apricornBlue: 'blueapricorn',
  apricornYellow: 'yellowapricorn',
  apricornGreen: 'greenapricorn',
  apricornPink: 'pinkapricorn',
  apricornWhite: 'whiteapricorn',
  apricornBlack: 'blackapricorn',
  // The Ancient Relic quest item borrows the Relic Crown art.
  ancientRelic: 'reliccrown',
}

/** Every item id that can appear in the bag, a shop or an auction lot. */
function collectItemIds() {
  const ids = new Set(),
    addTable = (/** @type {Record<string, any>} */ table) => {
      for (const item of Object.values(table)) if (item?.id) ids.add(item.id)
    },
    addEntries = (/** @type {{ itemId: string }[]} */ entries) => {
      for (const entry of entries) if (entry?.itemId) ids.add(entry.itemId)
    }
  return Promise.all([
    import(pathToFileURL(path.join(ROOT, 'src', 'data', 'items.js')).href),
    import(pathToFileURL(path.join(ROOT, 'src', 'game', 'minigames', 'auction-house.js')).href),
  ]).then(([items, auction]) => {
    addTable(items.activeItems)
    addTable(items.consumableItems)
    addTable(items.heldItems)
    addTable(items.evolutionItems)
    addTable(items.fossilItems)
    addEntries(items.valuableDropTable)
    addEntries(items.coreMartItems)
    for (const stock of Object.values(items.regionalMartItems)) addEntries(stock)
    addEntries(items.tokenShopItems)
    for (const lot of auction.AUCTION_LOTS) addEntries(lot.items)
    // Balls already render the shared PokeballIcon, so they don't need art.
    for (const ballId of Object.keys(items.pokeBalls)) ids.delete(ballId)
    return [...ids].sort()
  })
}

/** Streams `url` to `filepath`; resolves true on 200, false on 404. */
function downloadFile(url, filepath) {
  return fetch(url, { headers: { 'User-Agent': 'pokemon-idle-sprite-fetcher' } }).then(
    async (response) => {
      if (response.status === 404) return false
      if (!response.ok) throw new Error(`Status ${response.status} for ${url}`)
      fs.mkdirSync(path.dirname(filepath), { recursive: true })
      fs.writeFileSync(filepath, Buffer.from(await response.arrayBuffer()))
      return true
    }
  )
}

async function main() {
  const itemIds = await collectItemIds(),
    manifest = /** @type {Record<string, string>} */ ({}),
    missing = []
  for (const itemId of itemIds) {
    const slug = SEREBII_NAMES[itemId] ?? itemId.toLowerCase(),
      filename = `${itemId}.png`,
      filepath = path.join(SPRITE_DIR, filename)
    if (fs.existsSync(filepath) && !FORCE) {
      manifest[itemId] = filename
      continue
    }
    const ok = await downloadFile(`${SEREBII}/${slug}.png`, filepath)
    if (ok) manifest[itemId] = filename
    else missing.push(`${itemId} (${slug})`)
  }
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true })
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`item sprites: ${itemIds.length} items, ${Object.keys(manifest).length} icons`)
  if (missing.length) console.log(`missing (add to SEREBII_NAMES): ${missing.join(', ')}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
