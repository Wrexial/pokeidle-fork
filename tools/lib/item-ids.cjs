// Every item id that can appear in the bag, a shop or an auction lot.
//
// Shared by the sprite downloader (tools/download-item-sprites.cjs) and the data
// validator (tools/validate-data.mjs), so the set of items that need art cannot
// drift between the tool that fetches it and the check that it exists.

const path = require('path')
const { pathToFileURL } = require('url')

const ROOT = path.join(__dirname, '..', '..')

/** @returns {Promise<string[]>} the sorted item ids, minus the balls (which
 * render the shared PokeballIcon instead of a downloaded sprite). */
function collectItemIds() {
  /** @type {Set<string>} */
  const ids = new Set(),
    /** @param {Record<string, any>} table */
    addTable = (table) => {
      for (const item of Object.values(table)) if (item?.id) ids.add(item.id)
    },
    /** @param {{ itemId?: string }[]} entries */
    addEntries = (entries) => {
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

module.exports = { collectItemIds }
