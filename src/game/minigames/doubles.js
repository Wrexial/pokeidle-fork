// Battle Maison double battles: a self-contained 2v2 minigame that reuses the
// singles combat engine one action at a time. Each round every surviving
// battler picks a target and a move, the actions resolve in speed order, and
// the end-of-turn residual pass runs once for the whole round. Spread moves
// hit both foes; the engine stays singles-only.

import { moveData, pokemonSpecies } from '../../data/gameData.js'
import { AI_SKILL, chooseMoveForBattle } from '../combat/ai.js'
import { applyEndOfTurn } from '../combat/end-of-turn.js'
import { chance, getTypeMultiplier } from '../combat/damage.js'
import { resolveBattleTurn } from '../combat/turn.js'

/** Money spent to enter the Maison. */
export const DOUBLES_COST = 600

/** Hard cap so a stall war can never hang the scene. */
export const DOUBLES_MAX_ROUNDS = 60

/** Opponents are drawn from the strongest non-legendary species. */
export const DOUBLES_POOL = Object.entries(pokemonSpecies)
  .filter(
    ([, species]) =>
      species.id > 0 &&
      species.id <= 1025 &&
      !species.legendary &&
      Object.values(species.baseStats ?? {}).reduce((sum, value) => sum + value, 0) >= 480
  )
  .map(([speciesKey]) => speciesKey)

/**
 * Moves that hit every foe in a double battle. Kept to the common ones; the
 * engine has no spread flag in the extracted data.
 * @type {Set<string>}
 */
export const SPREAD_MOVES = new Set([
  'earthquake',
  'magnitude',
  'bulldoze',
  'surf',
  'muddyWater',
  'discharge',
  'heatWave',
  'blizzard',
  'icyWind',
  'rockSlide',
  'dazzlingGleam',
  'hyperVoice',
  'boomburst',
  'snarl',
  'struggleBug',
  'sludgeWave',
  'eruption',
  'waterSpout',
  'dragonEnergy',
  'explosion',
  'selfDestruct',
  'mistyExplosion',
  'lavaPlume',
  'sparklingAria',
])

/** @param {any} pokemon */
function alive(pokemon) {
  return !!pokemon && pokemon.currentHp > 0
}

/**
 * Whether `pokemon` has a live ally on `side` with `ability` (Friend Guard,
 * Battery, Power Spot, ...).
 * @param {any} pokemon
 * @param {any[]} side
 * @param {string} ability
 */
function hasAllyAbility(pokemon, side, ability) {
  return side.some((other) => other !== pokemon && alive(other) && other.ability === ability)
}

/** The strongest non-legendary opponent species key (falls back to Magikarp). */
function poolPick() {
  const pool = DOUBLES_POOL.length > 0 ? DOUBLES_POOL : ['magikarp']
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * A pair of opponents for a Maison bout, scaled above the player's level.
 * @param {number} baseLevel
 * @param {number} [wave]
 * @returns {{ speciesKey: string, level: number, name: string }[]}
 */
export function doublesOpponents(baseLevel, wave = 1) {
  const level = Math.max(5, Math.min(100, Math.round(baseLevel + wave * 2)))
  return [poolPick(), poolPick()].map((speciesKey) => ({
    speciesKey,
    level,
    name: pokemonSpecies[speciesKey]?.name ?? speciesKey,
  }))
}

/**
 * A battler's chosen action: which move and which target. A heal move targets
 * the most wounded ally; otherwise the attacker picks the foe its best move
 * hurts the most. A spread move still names a primary target so the log reads
 * sensibly.
 * @param {any} attacker
 * @param {any[]} allies
 * @param {any[]} foes
 * @returns {{ attacker: any, moveId: string, target: any, priority: number, speed: number, heal?: boolean } | null}
 */
function chooseAction(attacker, allies, foes) {
  // A wounded battler prefers a heal, aimed at the weakest ally (itself or its
  // partner).
  const hpRatio = attacker.maxHp > 0 ? attacker.currentHp / attacker.maxHp : 1,
    healMove = attacker.moves.find((/** @type {string} */ id) => moveData[id]?.effect?.type === 'heal')
  if (healMove && hpRatio < 0.5) {
    const wounded = allies
      .filter(alive)
      .sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp)[0]
    return {
      attacker,
      moveId: healMove,
      target: wounded ?? attacker,
      priority: moveData[healMove]?.priority ?? 0,
      speed: attacker.speed,
      heal: !0,
    }
  }
  const availableTargets = foes.filter(alive)
  if (availableTargets.length === 0) return null
  let best = null
  for (const foe of availableTargets) {
    const { moveId } = chooseMoveForBattle(attacker, foe, null, AI_SKILL.smartest),
      move = moveData[moveId]
    if (!move) continue
    const power = (move.power ?? 0) * getTypeMultiplier(move.type, foe.types ?? []),
      score = move.category === 'status' ? 1 : power
    if (!best || score > best.score) best = { score, moveId, target: foe }
  }
  if (!best) return null
  return {
    attacker,
    moveId: best.moveId,
    target: best.target,
    priority: moveData[best.moveId]?.priority ?? 0,
    speed: attacker.speed,
  }
}

/**
 * One double-battle round: every alive battler acts once, in priority then
 * speed order. Spread moves hit both foes; a fainted battler is skipped.
 * Mutates the four battlers and returns the events plus a display log.
 * @param {any[]} allies
 * @param {any[]} foes
 * @param {{ weather?: any, terrain?: any, deterministic?: boolean }} [options]
 * @returns {{ events: any[], log: string[] }}
 */
export function runDoublesRound(allies, foes, options = {}) {
  const deterministic = options.deterministic ?? !1,
    weather = options.weather ?? null,
    terrain = options.terrain ?? null,
    events = /** @type {any[]} */ ([]),
    log = /** @type {string[]} */ ([]),
    actions = [
      ...allies.filter(alive).map((attacker) => ({ attacker, allies: !0, action: chooseAction(attacker, allies, foes) })),
      ...foes.filter(alive).map((attacker) => ({ attacker, allies: !1, action: chooseAction(attacker, foes, allies) })),
    ]
      .filter((entry) => entry.action)
      .sort(
        (a, b) =>
          (b.action?.priority ?? 0) - (a.action?.priority ?? 0) ||
          (b.action?.speed ?? 0) - (a.action?.speed ?? 0)
      )

  // Healer can cure an ally's status each round (30%).
  for (const battler of [...allies, ...foes]) {
    if (!alive(battler) || battler.ability !== 'healer') continue
    if (!chance(0.3, deterministic)) continue
    const patient = [...allies, ...foes].find(
      (other) => other !== battler && alive(other) && other.status
    )
    if (patient) {
      patient.status = null
      patient.statusTurns = 0
      log.push(`${battler.name}'s Healer cured ${patient.name}!`)
    }
  }

  for (const { attacker, allies: isAlly, action } of actions) {
    if (!action || !alive(attacker)) continue
    const moveId = action.moveId,
      move = moveData[moveId]
    if (!move) continue
    // An ally heal restores the chosen partner directly rather than going
    // through the (singles) resolver, which would heal the user.
    if (action.heal) {
      const target = action.target
      log.push(`${attacker.name} used ${move.name}!`)
      if (target && alive(target) && target.currentHp < target.maxHp) {
        const percentage = move.effect?.percentage ?? 50,
          healed = Math.min(
            target.maxHp,
            target.currentHp + Math.max(1, Math.floor((target.maxHp * percentage) / 100))
          )
        target.currentHp = healed
        if (move.effect?.statusCure) {
          target.status = null
          target.statusTurns = 0
        }
        events.push({
          type: 'heal',
          message: `${target.name} recovered!`,
          data: { target: isAlly ? 'player' : 'enemy', hpAfter: healed, hpMax: target.maxHp },
        })
        log.push(`${target.name} recovered HP.`)
      }
      continue
    }
    const targets =
      SPREAD_MOVES.has(moveId) && move.category !== 'status' ? action.target && alive(action.target)
        ? [action.target, ...((isAlly ? foes : allies).filter((foe) => foe !== action.target && alive(foe)))]
        : (isAlly ? foes : allies).filter(alive)
      : [action.target].filter(alive)
    log.push(`${attacker.name} used ${move.name}!`)
    for (const target of targets) {
      if (!alive(attacker) || !alive(target)) continue
      // Ally abilities: Battery / Power Spot power up the attacker, Friend
      // Guard shields the target. Applied by parking the boost on the raw
      // stats for the single-action resolver, then restoring them.
      const attackerSide = isAlly ? allies : foes,
        targetSide = isAlly ? foes : allies,
        attackBoost =
          hasAllyAbility(attacker, attackerSide, 'battery') ||
          hasAllyAbility(attacker, attackerSide, 'powerSpot')
            ? 1.3
            : 1,
        guard = hasAllyAbility(target, targetSide, 'friendGuard') ? 4 / 3 : 1,
        saved = {
          attack: attacker.attack,
          spAttack: attacker.spAttack,
          defense: target.defense,
          spDefense: target.spDefense,
        }
      if (attackBoost !== 1) {
        attacker.attack = Math.floor(attacker.attack * attackBoost)
        attacker.spAttack = Math.floor(attacker.spAttack * attackBoost)
      }
      if (guard !== 1) {
        target.defense = Math.floor(target.defense * guard)
        target.spDefense = Math.floor(target.spDefense * guard)
      }
      const turnEvents = isAlly
        ? resolveBattleTurn(
            attacker,
            target,
            false,
            false,
            weather,
            null,
            deterministic,
            terrain,
            AI_SKILL.smart,
            AI_SKILL.smart,
            false,
            moveId,
            true,
            true
          )
        : (() => {
            // The engine picks the foe's move from `lockedMove`, so pin it for
            // this single action and clear it again.
            attacker.lockedMove = moveId
            const result = resolveBattleTurn(
              target,
              attacker,
              false,
              false,
              weather,
              null,
              deterministic,
              terrain,
              AI_SKILL.smart,
              AI_SKILL.smart,
              true,
              null,
              false,
              true
            )
            attacker.lockedMove = null
            return result
          })()
      attacker.attack = saved.attack
      attacker.spAttack = saved.spAttack
      target.defense = saved.defense
      target.spDefense = saved.spDefense
      events.push(...turnEvents)
      for (const event of turnEvents) if (event.message && event.type === 'damage') log.push(event.message)
    }
  }
  // Residual damage (status, Leftovers, Leech Seed, screens) once per round.
  for (const [ally, foe] of [[allies[0], foes[0]], [allies[1], foes[1]]])
    applyEndOfTurn(ally, foe, events, weather, terrain, deterministic)
  return { events, log }
}

/**
 * Resolve a whole double battle. Mutates the battlers; the caller tags in
 * replacements between bouts if it wants to.
 * @param {any[]} allies
 * @param {any[]} foes
 * @param {{ maxRounds?: number, weather?: any, terrain?: any, deterministic?: boolean, onRound?: (round: number, result: { events: any[], log: string[] }) => void }} [options]
 * @returns {{ won: boolean, rounds: number, log: string[] }}
 */
export function simulateDoubles(allies, foes, options = {}) {
  const maxRounds = options.maxRounds ?? DOUBLES_MAX_ROUNDS,
    log = /** @type {string[]} */ ([])
  let rounds = 0
  while (rounds < maxRounds && allies.some(alive) && foes.some(alive)) {
    rounds++
    const result = runDoublesRound(allies, foes, options)
    log.push(...result.log)
    options.onRound?.(rounds, result)
  }
  return { won: foes.every((foe) => !alive(foe)) && allies.some(alive), rounds, log }
}

/**
 * Prize for the number of bouts won.
 * @param {number} wins
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function doublesPrize(wins) {
  if (wins >= 10)
    return { money: 16000, items: [{ itemId: 'natureMint', quantity: 1 }, { itemId: 'bottleCap', quantity: 1 }], label: 'Maison legend!' }
  if (wins >= 7)
    return { money: 10000, items: [{ itemId: 'rareCandy', quantity: 2 }], label: 'Maison champion' }
  if (wins >= 4)
    return { money: 5000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Doubles star' }
  if (wins >= 2)
    return { money: 2000, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Found your rhythm' }
  if (wins >= 1)
    return { money: 800, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'First bout won' }
  return { money: 200, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Knocked out early' }
}
