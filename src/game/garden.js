// The Berry Garden: plant a berry in one of a few plots, it ripens over wild
// wins, then harvest a small crop. No real-time timers — everything advances
// with battles so it keeps working while the game idles.

/** Number of plots in the garden. */
export const GARDEN_PLOTS = 4

/** Berries a single blend consumes, and the item it produces. */
export const BLEND_BERRY_COST = 3
export const BLEND_RESULT_ITEM = 'poffin'

/**
 * Plantable berries: how many wild wins they take and how many they yield.
 * @type {Record<string, { growBattles: number, minYield: number, maxYield: number }>}
 */
export const GARDEN_BERRIES = {
  oranBerry: { growBattles: 20, minYield: 3, maxYield: 4 },
  sitrusBerry: { growBattles: 40, minYield: 2, maxYield: 3 },
  lumBerry: { growBattles: 50, minYield: 2, maxYield: 2 },
}

/** A fresh, empty garden. */
export function createGarden() {
  return {
    /** @type {(null | { berryId: string, battlesRemaining: number })[]} */
    plots: Array.from({ length: GARDEN_PLOTS }, () => null),
  }
}

/** Whether a plot is planted and ripe. @param {GardenPlot} plot */
export function isPlotReady(plot) {
  return !!plot && plot.battlesRemaining <= 0
}

/** Whether a berry can be planted. @param {string} berryId */
export function isPlantableBerry(berryId) {
  return Object.prototype.hasOwnProperty.call(GARDEN_BERRIES, berryId)
}

/** Advance every growing plot by one wild win. @param {Garden} garden @returns {Garden} */
export function tickGarden(garden) {
  if (!garden?.plots?.some((plot) => plot && plot.battlesRemaining > 0)) return garden
  return {
    ...garden,
    plots: garden.plots.map((plot) =>
      plot && plot.battlesRemaining > 0
        ? { ...plot, battlesRemaining: plot.battlesRemaining - 1 }
        : plot
    ),
  }
}

/** How many berries a ripe plot yields. @param {string} berryId */
export function rollHarvest(berryId) {
  const definition = GARDEN_BERRIES[berryId]
  if (!definition) return 0
  return (
    definition.minYield +
    Math.floor(Math.random() * (definition.maxYield - definition.minYield + 1))
  )
}
