// Reducer handlers for horde battles. A horde is a pack of 3-5 of one wild
// species, resolved with the doubles round engine by the idle loop. The loop
// awards the extra EXP; these handlers set the pack up and pay the rest of the
// clear reward (capped drops plus a single wild-win tick).

import { daycareEggBattles } from '../../../data/config.js'
import { consumableItems } from '../../../data/items.js'
import { createVolatileState } from '../../combat.js'
import { tickCompanion } from '../../companion.js'
import { tickGarden } from '../../garden.js'
import { hordeAlive, hordeDropRolls } from '../../horde.js'
import { tickKurtCrafts } from '../../kurt.js'
import { tickPelago } from '../../pelago.js'
import { tickSecretBase } from '../../secret-base.js'
import { gainFriendship, isBattleReady } from '../../pokemon.js'
import { releaseFaintedParty, syncActivePokemonIntoParty, tickBattleCounters, tickPartyEggs, tickPokerus, rollCandyDrop, rollValuableDrop } from '../../progression.js'
import { advanceQuests } from '../../quests.js'
import { recordSeenPokemon, withNotification } from '../../reducer-helpers.js'
import { advanceSosChain, resetSosChain } from '../collection.js'
import { nuzlockeGameOver, startHealing } from '../recovery.js'

/**
 * Handle the `START_HORDE` action: a wild pack of one species appeared.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startHorde(state, action) {
  const pack = Array.isArray(action.payload?.enemies) ? action.payload.enemies : []
  if (state.phase !== 'idle' || pack.length === 0) return state
  const firstAliveIndex = state.party.findIndex((member) => isBattleReady(member)),
    activeIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0,
    active = state.party[activeIndex] || state.playerPokemon
  if (!active) return state
  return recordSeenPokemon(
    {
      ...state,
      phase: 'horde',
      hordePack: pack,
      hordePlayer: {
        speciesKey: active.speciesKey,
        name: active.name,
        types: active.types,
        level: active.level,
        currentHp: Math.max(0, Math.min(active.currentHp ?? 0, active.maxHp)),
        maxHp: active.maxHp,
        attack: active.attack,
        defense: active.defense,
        spAttack: active.spAttack,
        spDefense: active.spDefense,
        speed: active.speed,
        moves: active.moves,
        ability: active.ability,
        heldItem: active.heldItem ?? null,
        ivs: active.ivs,
        nature: active.nature,
        isShiny: active.isShiny ?? false,
        isPlayer: !0,
        statStages: {},
      },
      hordeLog: [`A horde of ${pack.length} wild ${pack[0]?.name ?? 'Pokemon'} appeared!`],
      playerPokemon: active,
      activePlayerPokemonIndex: activeIndex,
      battleParticipants: active?.id ? [active.id] : [],
      playerVolatile: createVolatileState(),
      battleEvents: [],
      pendingEvents: [],
      battleTurn: 0,
    },
    pack[0]
  )
}

/**
 * Handle the `HORDE_ROUND` action: apply one doubles round's result, keeping the
 * pack and the player's battle state in sync.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function hordeRound(state, action) {
  if (state.phase !== 'horde') return state
  const player = action.payload?.player,
    pack = action.payload?.pack,
    log = Array.isArray(action.payload?.log) ? action.payload.log : []
  if (!player || !Array.isArray(pack)) return state
  const activeIndex = state.activePlayerPokemonIndex,
    playerHp = Math.max(0, Math.min(player.currentHp ?? 0, player.maxHp ?? 0)),
    party = state.party.map((member, index) =>
      index === activeIndex ? { ...member, currentHp: playerHp } : member
    )
  return {
    ...state,
    hordePlayer: player,
    hordePack: pack,
    hordeLog: [...state.hordeLog, ...log].slice(-40),
    playerPokemon: state.playerPokemon
      ? { ...state.playerPokemon, currentHp: playerHp }
      : state.playerPokemon,
    party,
    battleLog: [...state.battleLog, ...log].slice(-50),
  }
}

/**
 * Handle the `END_HORDE` action: the pack was cleared (or the player fainted).
 * The extra EXP is dispatched by the idle loop before this; here we pay the
 * capped drops, tick the per-win systems once, and hand control back.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endHorde(state, action) {
  if (state.phase !== 'horde') return state
  const won = !!action.payload?.won,
    size = Math.max(1, Math.floor(action.payload?.size ?? state.hordePack?.length ?? 1)),
    activeIndex = state.activePlayerPokemonIndex,
    base = /** @type {GameState} */ ({
      ...state,
      phase: 'idle',
      hordePack: null,
      hordePlayer: null,
      hordeLog: [],
      enemyPokemon: null,
      playerVolatile: null,
    })
  if (!won) {
    // The active fainted: bring in the next battle-ready member, heal at the
    // Center, or end a Nuzlocke run — the same fate as a normal wild loss.
    return recoverAfterHorde(resetSosChain(base), activeIndex)
  }
  // Clearing the pack pays a capped set of extra drops, but only counts as a
  // single wild win so the per-win systems can't be farmed by a pack.
  const level = state.hordePack?.[0]?.level ?? state.playerPokemon?.level ?? 1
  let inventory = state.inventory,
    found = /** @type {string[]} */ ([])
  for (let roll = 0; roll < hordeDropRolls(size); roll++) {
    const candy = Math.random() < 0.5,
      itemId = candy ? rollCandyDrop(level) : rollValuableDrop(level)
    inventory = { ...inventory, [itemId]: (inventory[itemId] ?? 0) + 1 }
    found.push(itemId)
  }
  const wildBattlesWon = state.wildBattlesWon + 1,
    locationWins = state.battlesWonByLocation[state.currentLocation] ?? 0,
    activeEffects = tickBattleCounters(state.activeEffects),
    quests = advanceQuests(state.quests, { kind: 'wild', locationId: state.currentLocation }),
    pokerusResult = tickPokerus(state.pokerus),
    eggTick = tickPartyEggs(state.party),
    pelago = tickPelago(state.pelago),
    garden = tickGarden(state.garden),
    secretBase = tickSecretBase(state.secretBase) ?? state.secretBase,
    kurtCrafts = tickKurtCrafts(state.kurtCrafts),
    companionId = state.companion?.id,
    companion = tickCompanion(
      state.companion,
      !!companionId && (state.battleParticipants ?? []).includes(companionId),
      wildBattlesWon
    ),
    daycare =
      state.daycare.parents.length === 2 && state.daycare.progress < daycareEggBattles
        ? { ...state.daycare, progress: state.daycare.progress + 1 }
        : state.daycare
  let pokedexSeen = state.pokedexSeen,
    pokedexCaught = state.pokedexCaught,
    battleLog = [...state.battleLog]
  const party = eggTick.party
  for (const hatched of eggTick.hatched) {
    const key = hatched.speciesKey
    if (!pokedexSeen.includes(key)) pokedexSeen = [...pokedexSeen, key]
    if (!pokedexCaught.includes(key)) pokedexCaught = [...pokedexCaught, key]
    battleLog = [...battleLog, `Your Egg hatched into ${hatched.name}!`].slice(-50)
  }
  const playerPokemon = state.playerPokemon
    ? { ...state.playerPokemon, friendship: gainFriendship(state.playerPokemon, 2) }
    : state.playerPokemon
  const dropNames = found.map((itemId) => consumableItems[itemId]?.name ?? itemId)
  let next = withNotification(
    {
      ...base,
      wildBattlesWon,
      battlesWonByLocation: {
        ...state.battlesWonByLocation,
        [state.currentLocation]: locationWins + 1,
      },
      activeEffects,
      quests,
      pokerus: pokerusResult.pokerus,
      party,
      pelago,
      garden,
      secretBase,
      kurtCrafts,
      companion,
      daycare,
      pokedexSeen,
      pokedexCaught,
      inventory,
      playerPokemon,
      battleLog: [
        ...battleLog,
        `The horde was cleared! Found ${dropNames.join(', ')}.`,
      ].slice(-50),
    },
    {
      message: `Horde cleared! +${dropNames.length} item${dropNames.length === 1 ? '' : 's'} and bonus EXP.`,
      tone: 'success',
      icon: '💥',
      dedupeKey: `horde:${state.currentLocation}:${wildBattlesWon}`,
    }
  )
  if (pokerusResult.infected)
    next = withNotification(next, {
      message: 'Your Pokemon caught Pokerus! EXP gain is doubled for a while.',
      tone: 'shiny',
      icon: '🦠',
      dedupeKey: 'pokerus:infected',
    })
  // Clearing a pack counts as one wild win, so it extends the SOS chain.
  next = advanceSosChain(next, {
    type: 'ADVANCE_SOS_CHAIN',
    payload: { routeKey: state.currentRoute },
  })
  // A double knockout still pays the clear reward, but the fainted active has
  // to be replaced or the party healed exactly like a loss.
  if (!hordeAlive(state.hordePlayer)) return recoverAfterHorde(next, activeIndex)
  return syncActivePokemonIntoParty(next)
}

/**
 * Resolve a horde where the active Pokemon fainted: switch in the next
 * battle-ready member, start a heal, or end a Nuzlocke run. Shared by a loss
 * and by a double knockout on the winning round.
 * @param {GameState} state
 * @param {number} activeIndex
 * @returns {GameState}
 */
function recoverAfterHorde(state, activeIndex) {
  const party = state.party.map((member, index) =>
      index === activeIndex ? { ...member, currentHp: 0 } : member
    ),
    fainted = {
      ...state,
      phase: 'idle',
      party,
      playerPokemon: state.playerPokemon
        ? { ...state.playerPokemon, currentHp: 0 }
        : state.playerPokemon,
    },
    survivorIndex = party.findIndex(
      (member, index) => index !== activeIndex && isBattleReady(member)
    )
  if (survivorIndex >= 0) {
    const survivor = party[survivorIndex]
    let switched = /** @type {GameState} */ ({
      ...fainted,
      playerPokemon: survivor,
      activePlayerPokemonIndex: survivorIndex,
      battleLog: [
        ...state.battleLog,
        `Your Pokemon fainted to the horde! Go, ${survivor.name}!`,
      ].slice(-50),
    })
    if (switched.challengeNuzlocke) switched = releaseFaintedParty(switched)
    return switched
  }
  if (fainted.challengeNuzlocke) return nuzlockeGameOver(fainted)
  return startHealing(fainted, {
    type: 'START_HEALING',
    payload: {},
  })
}
