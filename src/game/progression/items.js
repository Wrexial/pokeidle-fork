// // Item economy and effects: bag metadata, sell prices, drop rolls and reward formatting. Split from game/progression.js.

import { activeItems, consumableItems, evolutionItems, heldItems, pokeBalls, valuableDropTable } from '../../data/items.js'

/**
 * @param {string} itemId
 * @returns {string}
 */
export function getItemCategory(itemId) {
  if (itemId in pokeBalls) return 'pokeballs'
  if (itemId in heldItems) return 'held'
  return consumableItems[itemId]?.category ?? 'items'
}

/** @param {string} itemId */
export function isHeldItem(itemId) {
  return itemId in heldItems
}

/**
 * Sell price for an item, or null when a mart won't buy it. Only the
 * `valuables` bag category (treasure such as Nuggets and Pearls) can be sold
 * back; Poke Balls, medicine, candy, evolution items and held items cannot.
 * @param {string} itemId
 * @returns {number | null}
 */
export function getItemSellPrice(itemId) {
  const item = consumableItems[itemId]
  return item?.category === 'valuables' ? item.sellPrice ?? null : null
}

/**
 * Whether a consumable can be used on a Pokemon (medicine/candy, not treasure).
 * @param {string} itemId
 * @returns {boolean}
 */
export function isUsableConsumable(itemId) {
  const item = consumableItems[itemId]
  return !!item && item.category !== 'valuables'
}

/**
 * Roll a treasure drop, biased toward the rarer entries at higher levels.
 * @param {number} [level]
 * @returns {string}
 */
export function rollValuableDrop(level = 1) {
  const bias = 1 + Math.max(0, level - 5) / 40
  let total = 0
  const weighted = valuableDropTable.map((entry, index) => {
    total += entry.weight * (index >= 3 ? bias : 1)
    return {
      itemId: entry.itemId,
      cumulative: total,
    }
  })
  const roll = Math.random() * total
  return (
    weighted.find((entry) => roll < entry.cumulative) ?? weighted[weighted.length - 1]
  ).itemId
}

/**
 * Roll an Exp. Candy tier for the given level. The player rolls separately for
 * the much rarer Rare Candy.
 * @param {number} [level]
 * @returns {string}
 */
export function rollCandyDrop(level = 1) {
  if (level >= 60) return Math.random() < 0.5 ? 'expCandyXL' : 'expCandyL'
  if (level >= 40) return Math.random() < 0.5 ? 'expCandyL' : 'expCandyM'
  if (level >= 20) return Math.random() < 0.5 ? 'expCandyM' : 'expCandyS'
  return 'expCandyS'
}

/**
 * @param {string} itemId
 * @returns {boolean}
 */
export function isActiveEffectItem(itemId) {
  return itemId in activeItems
}

/**
 * @param {string} itemId
 * @returns {{ name: string, description: string }}
 */
export function getItemInfo(itemId) {
  if (itemId in pokeBalls) {
    const item = pokeBalls[itemId]
    return {
      name: item.name,
      description: item.description,
    }
  }
  if (itemId in evolutionItems) {
    const item = evolutionItems[itemId]
    return {
      name: item.name,
      description: item.description,
    }
  }
  if (itemId in activeItems) {
    const item = activeItems[itemId]
    return {
      name: item.name,
      description: item.description,
    }
  }
  if (itemId in consumableItems) {
    const item = consumableItems[itemId]
    return {
      name: item.name,
      description: item.description,
    }
  }
  if (itemId in heldItems) {
    const item = heldItems[itemId]
    return {
      name: item.name,
      description: item.description,
    }
  }
  return {
    name: itemId,
    description: '',
  }
}

/**
 * Hover-tooltip text for an item: its name, then its effect description.
 * Mirrors `moveTooltip` / `abilityTooltip` so held items read the same way on
 * hover as moves and abilities.
 * @param {string} itemId
 * @returns {string}
 */
export function itemTooltip(itemId) {
  const { name, description } = getItemInfo(itemId)
  return description ? `${name}\n${description}` : name
}

/**
 * Human-readable summary of an achievement reward, e.g.
 * "2 Victory Tokens \u00b7 $1,000 \u00b7 Master Ball \u00d71".
 * @param {{ money?: number, victoryTokens?: number, items?: Record<string, number> }} reward
 * @returns {string}
 */
export function formatReward(reward) {
  const parts = []
  if (reward.victoryTokens)
    parts.push(`${reward.victoryTokens} Victory Token${reward.victoryTokens > 1 ? 's' : ''}`)
  if (reward.money) parts.push(`$${reward.money.toLocaleString()}`)
  for (const [itemId, quantity] of Object.entries(reward.items ?? {}))
    parts.push(`${getItemInfo(itemId).name} \u00d7${quantity}`)
  return parts.join(' \u00b7 ')
}

/** Exp. Candy granted when releasing a Pokemon, by its level tier. */
const RELEASE_CANDY_TIERS = [
  { minLevel: 75, itemId: 'expCandyXL' },
  { minLevel: 50, itemId: 'expCandyL' },
  { minLevel: 25, itemId: 'expCandyM' },
  { minLevel: 0, itemId: 'expCandyS' },
]

/**
 * What releasing a Pokemon pays out: money scaled by level, plus an Exp. Candy
 * for its level tier (an extra one, and more money, for a shiny). Deterministic
 * so the release confirmation can preview it.
 * @param {Pokemon} pokemon
 * @returns {{ money: number, items: Record<string, number> }}
 */
export function releaseReward(pokemon) {
  const level = pokemon.level ?? 1,
    tier = RELEASE_CANDY_TIERS.find((candidate) => level >= candidate.minLevel),
    quantity = (tier ? 1 : 0) + (pokemon.isShiny ? 1 : 0)
  return {
    money: Math.floor(level * (pokemon.isShiny ? 40 : 15)),
    items: tier && quantity > 0 ? { [tier.itemId]: quantity } : {},
  }
}
