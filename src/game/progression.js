// Split from src/game/logic.js — see tools/decompile/split-logic.mjs

import { shinyCharmMinOddsChance, shinyFullOddsChance, shinyWithCharmChance, roamerEncounterChance, pokerusChance, pokerusDurationBattles, offlineCapMs, offlineMinMs, offlineMoneyPerHourPerLevel } from '../data/config.js'
import { activeItems, consumableItems, evolutionItems, pokeBalls, valuableDropTable } from '../data/items.js'
import { GENERATION_DEX_RANGES, encounterData, evolutionData, gymLeaderData, isSpeciesCharmed, mapData, moveData, pokemonSpecies, regions } from '../data/gameData.js'
import { calculateExpYield, calculatePokemonStats, getLevelUpResults, getPerfectIVs, isBattleReady, resolvePokemonMoves, rollAbility } from './pokemon.js'

/** Gym ids grouped by region, so `badgesRequired` gates count that region only. */
/** @type {Record<string, string[]>} */
const gymIdsByRegion = {}
for (const gym of gymLeaderData) {
  const regionId = gym.region ?? 'kanto'
  ;(gymIdsByRegion[regionId] ??= []).push(gym.id)
}

/**
 * @param {GameState} state
 * @param {string} routeKey
 * @param {string} speciesKey
 * @returns {CatchRule}
 */
export function getCatchRule(state, routeKey, speciesKey) {
  return state.catchSettings[routeKey]?.[speciesKey] ?? state.globalCatchDefaults
}

/**
 * @param {string} itemId
 * @returns {string}
 */
export function getItemCategory(itemId) {
  if (itemId in pokeBalls) return 'pokeballs'
  return consumableItems[itemId]?.category ?? 'items'
}

/**
 * Sell price for an item, or null when it can't be sold.
 * @param {string} itemId
 * @returns {number | null}
 */
export function getItemSellPrice(itemId) {
  return consumableItems[itemId]?.sellPrice ?? null
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
  return {
    name: itemId,
    description: '',
  }
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

/**
 * Summarise what happened while the tab was hidden, or null when nothing worth
 * reporting changed. Used by the "welcome back" away alert.
 * @param {{ wildBattlesWon: number, trainerBattlesWon: number, money: number, pokedexCaught: string[], shinyCaught: string[] }} before
 * @param {{ wildBattlesWon: number, trainerBattlesWon: number, money: number, pokedexCaught: string[], shinyCaught: string[] }} after
 * @returns {string | null}
 */
export function awaySummary(before, after) {
  const battles =
      after.wildBattlesWon + after.trainerBattlesWon - (before.wildBattlesWon + before.trainerBattlesWon),
    caught = after.pokedexCaught.length - before.pokedexCaught.length,
    shinies = after.shinyCaught.length - before.shinyCaught.length,
    money = after.money - before.money,
    parts = []
  if (battles > 0) parts.push(`${battles.toLocaleString()} battle${battles === 1 ? '' : 's'}`)
  if (caught > 0) parts.push(`${caught} new species`)
  if (shinies > 0) parts.push(`${shinies} shin${shinies === 1 ? 'y' : 'ies'}`)
  if (money !== 0) parts.push(`${money > 0 ? '+' : '-'}$${Math.abs(money).toLocaleString()}`)
  return parts.length > 0 ? `While you were away: ${parts.join(', ')}.` : null
}

/**
 * Advance the Pokerus over one won wild battle: infect very rarely when
 * healthy, count down while infected, and cure at zero. Kept pure (apart from
 * the rarity roll) so the reducer and the tests can share it.
 * @param {{ battlesRemaining: number } | null | undefined} pokerus
 * @returns {{ pokerus: { battlesRemaining: number } | null, infected: boolean, cured: boolean }}
 */
export function tickPokerus(pokerus) {
  if (pokerus) {
    const battlesRemaining = pokerus.battlesRemaining - 1
    return battlesRemaining > 0
      ? { pokerus: { battlesRemaining }, infected: false, cured: false }
      : { pokerus: null, infected: false, cured: true }
  }
  return Math.random() < pokerusChance
    ? { pokerus: { battlesRemaining: pokerusDurationBattles }, infected: true, cured: false }
    : { pokerus: null, infected: false, cured: false }
}

/** EXP multiplier while the party has Pokerus (2x), otherwise 1x. */
/** @param {{ battlesRemaining: number } | null | undefined} pokerus */
export function pokerusExpMultiplier(pokerus) {
  return pokerus ? 2 : 1
}

/**
 * Reward for time spent away from the game (offline). Scales with the highest
 * party level so it stays relevant, and pays Exp. Candy alongside money.
 * @param {GameState} state
 * @param {number} awayMs
 * @returns {{ awayMs: number, money: number, items: Record<string, number> } | null}
 */
export function computeOfflineReward(state, awayMs) {
  const capped = Math.min(Math.max(0, awayMs), offlineCapMs)
  if (capped < offlineMinMs) return null
  const hours = capped / 3_600_000,
    highestLevel = (state.party ?? []).reduce((max, member) => Math.max(max, member.level), 5),
    money = Math.floor(hours * highestLevel * offlineMoneyPerHourPerLevel),
    candyId =
      highestLevel >= 75
        ? 'expCandyXL'
        : highestLevel >= 50
          ? 'expCandyL'
          : highestLevel >= 25
            ? 'expCandyM'
            : 'expCandyS',
    candyCount = Math.max(1, Math.floor(hours))
  return { awayMs: capped, money, items: { [candyId]: candyCount } }
}

/**
 * Human duration like "2h 15m" or "45m".
 * @param {number} ms
 * @returns {string}
 */
export function formatAwayDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000)),
    hours = Math.floor(totalMinutes / 60),
    minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

/**
 * Advance the eggs in a party by one won wild battle. Only eggs carried in the
 * party progress, and at most one hatches per battle.
 * @param {Pokemon[]} party
 * @returns {{ party: Pokemon[], hatched: Pokemon | null }}
 */
/**
 * Advance every egg in a party by one won wild battle. Only eggs carried in the
 * party progress; all of them tick together and any that reach zero hatch.
 * @param {Pokemon[]} party
 * @returns {{ party: Pokemon[], hatched: Pokemon[] }}
 */
export function tickPartyEggs(party) {
  let /** @type {Pokemon[]} */ hatched = [],
    changed = false
  const nextParty = party.map((member) => {
    if (!member.isEgg) return member
    changed = true
    const remaining = (member.eggStepsRemaining ?? 1) - 1
    if (remaining > 0) return { ...member, eggStepsRemaining: remaining }
    const hatchedMember = {
      ...member,
      isEgg: false,
      eggStepsRemaining: 0,
      moves: resolvePokemonMoves(member.speciesKey, member.level || 1),
    }
    hatched.push(hatchedMember)
    return hatchedMember
  })
  return { party: changed ? nextParty : party, hatched }
}

/**
 * @param {GameState} state
 * @returns {string[]}
 */
export function computeUnlockedLocations(state) {
  const unlocked = new Set(state.unlockedLocations),
    defeatedGyms = new Set(state.defeatedGyms),
    caughtSpecies = new Set(state.pokedexCaught),
    caughtCount = state.pokedexCaught.length,
    highestPartyLevel = state.party.reduce((max, member) => Math.max(max, member.level), 0)
  let changed = true
  while (changed) {
    changed = false
    for (const [locationId, location] of Object.entries(mapData)) {
      if (unlocked.has(locationId)) continue
      const unlockRule = location.unlock,
        locationRegion = location.region ?? 'kanto',
        // `badgesRequired` counts only this region's badges, so prestiging a
        // region re-locks its badge gates even when other regions are complete.
        badgeCount = (gymIdsByRegion[locationRegion] ?? []).filter(
          /** @param {string} gymId */ (gymId) => defeatedGyms.has(gymId)
        ).length
      const blocked =
        (unlockRule.battlesAtLocation &&
          unlockRule.battlesAtLocation.some(
            (requiredBattles) => (state.battlesWonByLocation[requiredBattles.locationId] ?? 0) < requiredBattles.count
          )) ||
        (unlockRule.caughtCount && caughtCount < unlockRule.caughtCount) ||
        (unlockRule.caughtOnRoute &&
          unlockRule.caughtOnRoute.species.filter((speciesKey) => caughtSpecies.has(speciesKey)).length <
            unlockRule.caughtOnRoute.count) ||
        (unlockRule.partyLevel && highestPartyLevel < unlockRule.partyLevel) ||
        (unlockRule.badgesRequired && badgeCount < unlockRule.badgesRequired) ||
        (unlockRule.gymsRequired &&
          unlockRule.gymsRequired.some((gymId) => !defeatedGyms.has(gymId))) ||
        (unlockRule.championDefeated &&
          !state.defeatedChampions.includes(
            unlockRule.championDefeated === true ? 'kanto' : unlockRule.championDefeated
          )) ||
        (unlockRule.requires && unlockRule.requires.some((id) => !unlocked.has(id))) ||
        (unlockRule.entry &&
          !(
            state.startRegion === (location.region ?? 'kanto') ||
            state.unlockedRegions.includes(location.region ?? 'kanto')
          ))
      if (!blocked) {
        unlocked.add(locationId)
        changed = true
      }
    }
  }
  return Array.from(unlocked)
}

/**
 * Region Unlock Tokens available to spend: one per region Champion beaten,
 * minus the regions already opened beyond the starting one. Once every region
 * is open there is nothing left to spend them on; the leftover is converted to
 * Victory Tokens (see `settleUnlockTokens` in the reducer) and the Town Map
 * hides the banner.
 * @param {GameState} state
 * @returns {number}
 */
export function getRegionUnlockTokens(state) {
  const openedRegions = Math.max(0, (state.unlockedRegions ?? []).length - 1)
  return Math.max(0, state.defeatedChampions.length - openedRegions)
}

/**
 * @param {GameState} state
 * @returns {number}
 */
export function getActivePartyIndex(state) {
  return state.activePlayerPokemonIndex
}

/**
 * @param {GameState} state
 * @returns {GameState}
 */
export function syncActivePokemonIntoParty(state) {
  if (!state.playerPokemon || state.party.length === 0) return state
  const activeIndex = getActivePartyIndex(state),
    activePokemon = state.playerPokemon,
    party = [...state.party]
  if (activeIndex >= 0 && activeIndex < party.length && party[activeIndex].id === activePokemon.id)
    return (
      (party[activeIndex] = activePokemon),
      {
        ...state,
        party,
      }
    )
  const existingIndex = party.findIndex((member) => member.id === activePokemon.id)
  return existingIndex >= 0
    ? ((party[existingIndex] = activePokemon),
      {
        ...state,
        party,
        activePlayerPokemonIndex: existingIndex,
      })
    : state
}

/**
 * @param {GameState} state
 * @returns {GameState}
 */
export function loadActivePokemonFromParty(state) {
  if (state.party.length === 0) return state
  const activeIndex = getActivePartyIndex(state)
  return activeIndex >= 0 && activeIndex < state.party.length
    ? {
        ...state,
        playerPokemon: state.party[activeIndex],
      }
    : {
        ...state,
        playerPokemon: state.party[0],
        activePlayerPokemonIndex: 0,
      }
}

/** @returns {Partial<GameState>} */
export function createIdleBattleState() {
  return {
    phase: 'idle',
    enemyPokemon: null,
    battleEvents: [],
    pendingEvents: [],
    currentEventIndex: 0,
    battleTurn: 0,
    trainerBattle: null,
    bossBattle: null,
    bossQueue: [],
    activePlayerPokemonIndex: 0,
    playerVolatile: null,
  }
}

/**
 * @param {GameState} state
 * @returns {GameState}
 */
export function prepareNextBattle(state) {
  const synced = syncActivePokemonIntoParty(state),
    firstAliveIndex = synced.party.findIndex((member) => isBattleReady(member)),
    nextIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0
  return {
    ...synced,
    ...createIdleBattleState(),
    activePlayerPokemonIndex: nextIndex,
    playerPokemon: synced.party[nextIndex] || synced.playerPokemon,
  }
}

/**
 * @param {ActiveEffect[]} effects
 * @returns {ActiveEffect[]}
 */
export function tickBattleCounters(effects) {
  return effects
    .map((effect) => ({
      ...effect,
      battlesRemaining: effect.battlesRemaining - 1,
    }))
    .filter((effect) => effect.battlesRemaining > 0)
}

/**
 * @param {number} [odds]
 * @returns {boolean}
 */
export function checkShinyOdds(odds = shinyFullOddsChance) {
  return Math.floor(Math.random() * odds) === 0
}

/**
 * Shiny odds once `completedGenerationCount` generations are complete. The
 * first completed generation gives the 2x charm rate, and each further one
 * keeps improving it until every generation is done.
 * @param {number} completedGenerationCount
 * @param {number} totalGenerations
 * @returns {number}
 */
export function shinyOddsForCompletedGenerations(completedGenerationCount, totalGenerations) {
  if (completedGenerationCount <= 0) return shinyFullOddsChance
  const progress = totalGenerations > 1 ? (completedGenerationCount - 1) / (totalGenerations - 1) : 1,
    ratio = Math.pow(shinyCharmMinOddsChance / shinyWithCharmChance, progress)
  return Math.max(shinyCharmMinOddsChance, Math.round(shinyWithCharmChance * ratio))
}

/**
 * Shiny odds for `speciesKey`: full odds unless its own generation's dex is
 * complete, otherwise the rate scaled by how many generations are done.
 * @param {string} speciesKey
 * @param {Set<number>} completedGenerationSet
 * @returns {number}
 */
export function shinyOddsForSpecies(speciesKey, completedGenerationSet) {
  return isSpeciesCharmed(speciesKey, completedGenerationSet)
    ? shinyOddsForCompletedGenerations(completedGenerationSet.size, GENERATION_DEX_RANGES.length)
    : shinyFullOddsChance
}

/** Chain length at which Honey locks a hunt and Repel suppresses the route. */
export const HONEY_CHAIN_THRESHOLD = 4

/** Weight multiplier Honey applies once a hunt is locked in. */
const HONEY_LOCK_MULTIPLIER = 25

/** Weight kept for every other species while a chain is protected by Repel. */
const SUPPRESSED_WEIGHT = 0.02

/**
 * Apply Honey/Repel modifiers to a route's encounter table. While a Repel is
 * suppressing a locked-in hunt, every species except the hunted one (and any
 * Honey-boosted species) is weighted down to almost nothing, so the chain
 * can't be broken by a random encounter. Shared with the route UI so the
 * displayed odds match the real roll.
 * @param {EncounterEntry[]} encounters
 * @param {{ speciesKey: string, multiplier: number, kind?: string, suppressOthers?: boolean }[] | undefined} modifiers
 * @param {{ speciesKey: string | null, count: number } | undefined | null} [shinyChain]
 * @returns {EncounterEntry[]}
 */
export function applyEncounterModifiers(encounters, modifiers, shinyChain) {
  const suppressOthers = !!modifiers?.some((modifier) => modifier.suppressOthers),
    protectedSpecies = new Set(
      (modifiers ?? [])
        .filter((modifier) => modifier.kind === 'honey')
        .map((modifier) => modifier.speciesKey)
    )
  if (shinyChain?.speciesKey) protectedSpecies.add(shinyChain.speciesKey)
  return encounters.map((encounter) => {
    const modifier = modifiers?.find((candidate) => candidate.speciesKey === encounter.speciesKey)
    let weight = encounter.weight
    if (suppressOthers && !protectedSpecies.has(encounter.speciesKey)) weight *= SUPPRESSED_WEIGHT
    if (modifier) weight *= modifier.multiplier
    return weight === encounter.weight ? encounter : { ...encounter, weight }
  })
}

/**
 * @param {ActiveEffect[]} activeEffects
 * @param {string} routeKey
 * @param {{ speciesKey: string | null, count: number } | undefined | null} [shinyChain]
 * @returns {{ speciesKey: string, multiplier: number, kind: 'honey' | 'repel', suppressOthers?: boolean }[]}
 */
export function resolveActiveModifiers(activeEffects, routeKey, shinyChain) {
  /** @type {{ speciesKey: string, multiplier: number, kind: 'honey' | 'repel', suppressOthers?: boolean }[]} */
  const modifiers = []
  // Once a hunt is locked in (4+ of the same species in a row), Honey and
  // Repel stop being little nudges and actually protect the chain.
  const locking = !!shinyChain && shinyChain.count >= HONEY_CHAIN_THRESHOLD
  for (const effect of activeEffects) {
    if (effect.routeKey !== routeKey || !effect.speciesKey) continue
    if (effect.type === 'repel')
      modifiers.push(
        locking
          ? { speciesKey: effect.speciesKey, multiplier: 1, kind: 'repel', suppressOthers: true }
          : { speciesKey: effect.speciesKey, multiplier: 0.5, kind: 'repel' }
      )
    else if (effect.type === 'honey')
      modifiers.push({
        speciesKey: effect.speciesKey,
        multiplier:
          locking && shinyChain?.speciesKey === effect.speciesKey ? HONEY_LOCK_MULTIPLIER : 2,
        kind: 'honey',
      })
  }
  return modifiers
}

/** How many same-species encounters double the shiny odds. */
const SHINY_CHAIN_STEP = 40

/**
 * Shiny-odds divisor from a DexNav-style chain: 1x at no chain, up to 4x at
 * 120+ consecutive encounters of the same species.
 * @param {string} speciesKey
 * @param {{ speciesKey: string | null, count: number } | undefined | null} chain
 * @returns {number}
 */
export function shinyChainMultiplier(speciesKey, chain) {
  if (!chain || chain.speciesKey !== speciesKey) return 1
  return Math.min(4, 1 + chain.count / SHINY_CHAIN_STEP)
}

/**
 * Pick a raid legendary from a region's pool, preferring species the player has
 * not seen yet, then ones they have not caught, and finally the whole pool — so
 * a seen/caught species is never impossible to raid again (shiny hunting).
 * @param {{ speciesKey: string, level: number }[]} pool
 * @param {string[]} pokedexSeen
 * @param {string[]} pokedexCaught
 * @returns {{ speciesKey: string, level: number } | null}
 */
export function pickRaidLegendary(pool, pokedexSeen, pokedexCaught) {
  if (pool.length === 0) return null
  const seen = new Set(pokedexSeen),
    caught = new Set(pokedexCaught),
    unseen = pool.filter((entry) => !seen.has(entry.speciesKey)),
    uncaught = pool.filter((entry) => !caught.has(entry.speciesKey)),
    candidates = unseen.length > 0 ? unseen : uncaught.length > 0 ? uncaught : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * Roll a region's roaming legendary: one of its uncaught Raid Island
 * legendaries. Returns null most of the time (or when they are all caught).
 * @param {string} regionId
 * @param {string[]} pokedexSeen
 * @param {string[]} pokedexCaught
 * @param {Set<number>} completedGenerationSet
 * @param {number} [shinyBonus] Multiplier on shiny odds from a daily event.
 * @returns {{ species: Species, speciesKey: string, level: number, isShiny: boolean, isRoamer: boolean } | null}
 */
export function resolveRoamer(regionId, pokedexSeen, pokedexCaught, completedGenerationSet, shinyBonus = 1) {
  const region = regions.find((candidate) => candidate.id === regionId),
    candidates = (region?.raidPool ?? []).filter(
      (entry) => pokemonSpecies[entry.speciesKey]?.legendary && !pokedexCaught.includes(entry.speciesKey)
    )
  if (candidates.length === 0 || Math.random() >= roamerEncounterChance) return null
  const entry = pickRaidLegendary(candidates, pokedexSeen, pokedexCaught)
  if (!entry) return null
  return {
    species: pokemonSpecies[entry.speciesKey],
    speciesKey: entry.speciesKey,
    level: entry.level,
    isShiny: checkShinyOdds(
      Math.max(
        1,
        Math.round(shinyOddsForSpecies(entry.speciesKey, completedGenerationSet) / shinyBonus)
      )
    ),
    isRoamer: !0,
  }
}

/** Species eligible for Randomizer encounters (national dex, no legendaries). */
const RANDOMIZER_SPECIES = Object.keys(pokemonSpecies).filter((key) => {
  const species = pokemonSpecies[key]
  return species.id > 0 && species.id <= 1025 && !species.legendary
})

/**
 * A Randomizer wild encounter: any eligible species at the route's level band.
 * @param {EncounterData} encounterData
 * @param {Set<number>} completedGenerationSet
 * @param {number} shinyBonus
 * @param {number} levelOverride
 */
function resolveRandomEncounter(encounterData, completedGenerationSet, shinyBonus, levelOverride) {
  const speciesKey =
      RANDOMIZER_SPECIES[Math.floor(Math.random() * RANDOMIZER_SPECIES.length)] ??
      encounterData.encounters[0].speciesKey,
    minLevel = Math.min(...encounterData.encounters.map((encounter) => encounter.minLevel)),
    maxLevel = Math.max(...encounterData.encounters.map((encounter) => encounter.maxLevel)),
    level = levelOverride || minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1))
  return {
    species: pokemonSpecies[speciesKey],
    speciesKey,
    level,
    isShiny: checkShinyOdds(
      Math.max(1, Math.round(shinyOddsForSpecies(speciesKey, completedGenerationSet) / shinyBonus))
    ),
  }
}

/**
 * @param {EncounterData} encounterData
 * @param {{ speciesKey: string, multiplier: number }[]} modifiers
 * @param {Set<number>} completedGenerationSet
 * @param {{ speciesKey: string | null, count: number } | undefined} [shinyChain]
 * @param {number} [shinyBonus] Multiplier on shiny odds from a daily event.
 * @param {boolean} [randomize] Randomizer challenge: pick any species.
 * @param {number} [levelOverride] Level-scaling challenge: force this level.
 * @returns {{ species: Species, speciesKey: string, level: number, isShiny: boolean, isRoamer?: boolean }}
 */
export function resolvePokemonEncounter(encounterData, modifiers, completedGenerationSet, shinyChain, shinyBonus = 1, randomize = !1, levelOverride = 0) {
  if (randomize)
    return resolveRandomEncounter(encounterData, completedGenerationSet, shinyBonus, levelOverride)
  const weightedEncounters = applyEncounterModifiers(
      encounterData.encounters,
      modifiers,
      shinyChain
    ),
    totalWeight = weightedEncounters.reduce((accumulator, encounter) => accumulator + encounter.weight, 0)
  let roll = Math.random() * totalWeight
  for (const encounter of weightedEncounters)
    if (((roll -= encounter.weight), roll <= 0)) {
      const level =
        levelOverride ||
        encounter.minLevel + Math.floor(Math.random() * (encounter.maxLevel - encounter.minLevel + 1))
      const chainMultiplier = shinyChainMultiplier(encounter.speciesKey, shinyChain)
      return {
        species: pokemonSpecies[encounter.speciesKey],
        speciesKey: encounter.speciesKey,
        level,
        isShiny: checkShinyOdds(
          Math.max(
            1,
            Math.round(
              shinyOddsForSpecies(encounter.speciesKey, completedGenerationSet) /
                (chainMultiplier * shinyBonus)
            )
          )
        ),
      }
    }
  const fallback = weightedEncounters[weightedEncounters.length - 1]
  return {
    species: pokemonSpecies[fallback.speciesKey],
    speciesKey: fallback.speciesKey,
    level: levelOverride || fallback.minLevel,
    isShiny: checkShinyOdds(
      Math.max(
        1,
        Math.round(
          shinyOddsForSpecies(fallback.speciesKey, completedGenerationSet) /
            (shinyChainMultiplier(fallback.speciesKey, shinyChain) * shinyBonus)
        )
      )
    ),
  }
}

/**
 * @param {(action: GameAction) => void} dispatch
 * @param {Pokemon} playerPokemon
 * @param {BattlePokemon} enemyPokemon
 * @param {number} multiplier
 * @param {boolean} [hasExpShare]
 * @param {Pokemon[]} [party]
 * @param {number} [activeIndex]
 * @param {number} [bonusMultiplier] Extra EXP multiplier (e.g. a daily event).
 * @returns {void}
 */
export function awardExperience(dispatch, playerPokemon, enemyPokemon, multiplier, hasExpShare = !1, party = [], activeIndex = 0, bonusMultiplier = 1) {
  const enemySpecies = pokemonSpecies[enemyPokemon.speciesKey],
    baseExp = calculateExpYield(enemySpecies, enemyPokemon.level),
    gainedExp = Math.floor(baseExp * multiplier * bonusMultiplier),
    finalExp = hasExpShare ? Math.floor(gainedExp * 0.5) : gainedExp,
    playerSpecies = pokemonSpecies[playerPokemon.speciesKey],
    newTotalExp = playerPokemon.totalExp + finalExp,
    levelUps = getLevelUpResults(playerPokemon.speciesKey, playerSpecies.growthRate, playerPokemon.level, newTotalExp)
  if (levelUps.length > 0) {
    const lastLevelUp = levelUps[levelUps.length - 1],
      newStats = calculatePokemonStats(playerSpecies, lastLevelUp.newLevel, playerPokemon.ivs, playerPokemon.nature),
      newMoves = levelUps.flatMap((moveId) => moveId.newMoves)
    ;(newMoves.forEach((moveId) => {
      const moveDef = moveData[moveId]
      moveDef &&
        dispatch({
          type: 'ADD_LOG',
          payload: {
            message: `${playerPokemon.name} learned ${moveDef.name}!`,
          },
        })
    }),
      dispatch({
        type: 'APPLY_EXP',
        payload: {
          expGained: finalExp,
          newLevel: lastLevelUp.newLevel,
          newMoves,
          newStats: {
            maxHp: newStats.hp,
            attack: newStats.attack,
            defense: newStats.defense,
            spAttack: newStats.spAttack,
            spDefense: newStats.spDefense,
            speed: newStats.speed,
          },
        },
      }))
  } else
    dispatch({
      type: 'APPLY_EXP',
      payload: {
        expGained: finalExp,
      },
    })
  if (hasExpShare && party.length > 1) {
    const sharedExp = Math.floor(gainedExp * 0.05)
    if (sharedExp > 0) {
      const sharedResults = []
      for (let memberIndex = 0; memberIndex < party.length; memberIndex++) {
        if (memberIndex === activeIndex) continue
        const member = party[memberIndex]
        if (!isBattleReady(member)) continue
        const memberSpecies = pokemonSpecies[member.speciesKey],
          memberTotalExp = member.totalExp + sharedExp,
          memberLevelUps = getLevelUpResults(member.speciesKey, memberSpecies.growthRate, member.level, memberTotalExp)
        if (memberLevelUps.length > 0) {
          const lastLevelUp = memberLevelUps[memberLevelUps.length - 1],
            memberStats = calculatePokemonStats(memberSpecies, lastLevelUp.newLevel, member.ivs, member.nature),
            memberNewMoves = memberLevelUps.flatMap((moveId) => moveId.newMoves)
          ;(memberNewMoves.forEach((moveId) => {
            const moveDef = moveData[moveId]
            moveDef &&
              dispatch({
                type: 'ADD_LOG',
                payload: {
                  message: `${member.name} learned ${moveDef.name}!`,
                },
              })
          }),
            sharedResults.push({
              partyIndex: memberIndex,
              expGained: sharedExp,
              newLevel: lastLevelUp.newLevel,
              newMoves: memberNewMoves,
              newStats: {
                maxHp: memberStats.hp,
                attack: memberStats.attack,
                defense: memberStats.defense,
                spAttack: memberStats.spAttack,
                spDefense: memberStats.spDefense,
                speed: memberStats.speed,
              },
            }))
        } else
          sharedResults.push({
            partyIndex: memberIndex,
            expGained: sharedExp,
          })
      }
      sharedResults.length > 0 &&
        dispatch({
          type: 'APPLY_SHARED_EXP',
          payload: {
            partyExp: sharedResults,
          },
        })
    }
  }
}

/**
 * @param {any[]} team
 * @returns {BattlePokemon[]}
 */
export function buildTrainerTeam(team) {
  return team.map((member) => {
    const species = pokemonSpecies[member.speciesKey],
      stats = calculatePokemonStats(species, member.level, getPerfectIVs()),
      moves = resolvePokemonMoves(member.speciesKey, member.level),
      // Battle Tower uses this to keep scaling past the level 100 cap.
      multiplier = member.statMultiplier ?? 1,
      scale = (/** @type {number} */ value) => Math.max(1, Math.floor(value * multiplier))
    return {
      speciesKey: member.speciesKey,
      name: species.name,
      types: species.types,
      level: member.level,
      currentHp: scale(stats.hp),
      maxHp: scale(stats.hp),
      attack: scale(stats.attack),
      defense: scale(stats.defense),
      spAttack: scale(stats.spAttack),
      spDefense: scale(stats.spDefense),
      speed: scale(stats.speed),
      moves,
      ability: rollAbility(member.speciesKey),
      isPlayer: !1,
      isShiny: checkShinyOdds(),
    }
  })
}

/** Battle Tower floors start at this level and climb three per floor. */
const TOWER_BASE_LEVEL = 55

/** Every floor past this one multiplies the team's stats, so scaling is endless. */
const TOWER_MULTIPLIER_FLOOR = 15

/** Floors at or past this one may field legendary Pokemon. */
const TOWER_LEGENDARY_FLOOR = 40

/** @param {Species} species */
function totalBaseStats(species) {
  return Object.values(species.baseStats).reduce((sum, value) => sum + value, 0)
}

/**
 * Evolution targets that are ordinary growth stages (ignoring Megas/Gigantamax
 * alternate forms and ids above the national dex).
 * @param {string} key
 * @returns {any[]}
 */
function realEvolutions(key) {
  return (evolutionData[key] || []).filter(
    (evolution) =>
      !evolution.form && pokemonSpecies[evolution.into] && pokemonSpecies[evolution.into].id <= 1025
  )
}

/**
 * Whether `target` can evolve (directly or through a chain) into `from`.
 * @param {string} from
 * @param {string} target
 * @param {Set<string>} [seen]
 * @returns {boolean}
 */
function canReachByEvolution(from, target, seen = new Set()) {
  if (from === target) return true
  if (seen.has(from)) return false
  seen.add(from)
  return realEvolutions(from).some((evolution) =>
    canReachByEvolution(evolution.into, target, seen)
  )
}

/**
 * A species counts as a final stage when none of its ordinary evolutions can
 * lead back to it (ignoring Megas/Gigantamax, which are alternate battle
 * forms). Mirrors the stricter check `tools/generate-regions.cjs` uses for
 * raid pools.
 * @param {string} speciesKey
 * @returns {boolean}
 */
function isFinalEvolution(speciesKey) {
  return !realEvolutions(speciesKey).some(
    (evolution) => !canReachByEvolution(evolution.into, speciesKey)
  )
}

/**
 * Build a Battle Tower trainer's roster for a floor. Every floor fields six
 * fully evolved Pokemon, at least one of them genuinely strong. Deeper floors
 * scale faster, begin multiplying stats at floor 15 and allow legendaries from
 * floor 40, so the tower stays a real climb rather than a walk.
 * @param {number} floor
 * @returns {{ speciesKey: string, level: number, statMultiplier: number }[]}
 */
export function buildTowerTeam(floor) {
  const level = Math.min(100, TOWER_BASE_LEVEL + floor * 3),
    statMultiplier = 1 + Math.max(0, floor - TOWER_MULTIPLIER_FLOOR) * 0.05,
    includeLegendaries = floor >= TOWER_LEGENDARY_FLOOR
  /** @param {string} key @returns {boolean} */
  function isEligible(key) {
    const species = pokemonSpecies[key]
    return (
      species.id > 0 &&
      species.id <= 1025 &&
      isFinalEvolution(key) &&
      (species.legendary ? includeLegendaries : (species.catchRate ?? 0) > 3)
    )
  }
  const pool = Object.keys(pokemonSpecies).filter(isEligible),
    strongPool = pool.filter(
      (key) => pokemonSpecies[key].legendary || totalBaseStats(pokemonSpecies[key]) >= 520
    )
  if (pool.length === 0) return []
  const used = new Set()
  /** @param {string[]} candidates @returns {string} */
  function pick(candidates) {
    const options = candidates.filter((key) => !used.has(key)),
      list = options.length > 0 ? options : candidates,
      key = list[Math.floor(Math.random() * list.length)]
    used.add(key)
    return key
  }
  const picks = [pick(strongPool.length > 0 ? strongPool : pool)]
  while (picks.length < 6 && picks.length < pool.length) picks.push(pick(pool))
  return picks.map((speciesKey, index) => ({
    speciesKey,
    level: Math.min(100, level + index),
    statMultiplier,
  }))
}

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatCooldown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1e3)),
    minutes = Math.floor(totalSeconds / 60),
    seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * @param {string} fromId
 * @param {string} toId
 * @returns {{ x1: number, y1: number, x2: number, y2: number }[]}
 */
export function createRoads(fromId, toId) {
  const fromLocation = mapData[fromId],
    toLocation = mapData[toId],
    deltaX = Math.abs(toLocation.position.x - fromLocation.position.x),
    deltaY = Math.abs(toLocation.position.y - fromLocation.position.y)
  return deltaX >= deltaY
    ? [
        {
          x1: fromLocation.position.x,
          y1: fromLocation.position.y,
          x2: toLocation.position.x,
          y2: fromLocation.position.y,
        },
        {
          x1: toLocation.position.x,
          y1: fromLocation.position.y,
          x2: toLocation.position.x,
          y2: toLocation.position.y,
        },
      ]
    : [
        {
          x1: fromLocation.position.x,
          y1: fromLocation.position.y,
          x2: fromLocation.position.x,
          y2: toLocation.position.y,
        },
        {
          x1: fromLocation.position.x,
          y1: toLocation.position.y,
          x2: toLocation.position.x,
          y2: toLocation.position.y,
        },
      ]
}
