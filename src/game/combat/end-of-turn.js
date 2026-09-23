// End-of-turn phase for combat/turn.js. Split out to keep the turn resolver
// focused on the attack sequence.

import { roamerFleeChance } from '../../data/config.js'
import { abilityIgnoresIndirectDamage, abilityOf } from '../abilities.js'
import { emptyBattleHazards } from '../hazards.js'
import { heldBerryHeal, heldLeftoversHeal } from '../held-items.js'
import { TERRAIN_NAMES, terrainHeal } from '../terrain.js'
import { WEATHER_NAMES, weatherAbilityHeal, weatherResidualDamage } from '../weather.js'
import { chance } from './damage.js'
import { applyStatus } from './status.js'
import { clampStatStage } from './volatile.js'

/**
 * End-of-turn residual damage (Leech Seed, Curse, poison/toxic/burn) and
 * end-of-turn abilities, held items, weather and terrain effects, for both
 * sides. Mutates the Pokemon and pushes events.
 * @param {BattlePokemon} player
 * @param {BattlePokemon} enemy
 * @param {any[]} events
 * @param {{ type: string, turns: number } | null} activeWeather
 * @param {{ type: string, turns: number } | null} activeTerrain
 * @param {boolean} deterministic
 */
export function applyEndOfTurn(player, enemy, events, activeWeather, activeTerrain, deterministic) {
  // End-of-turn residual damage from poison / toxic / burn.
  /** @type {[BattlePokemon, boolean][]} */
  const residualTargets = [
    [player, !0],
    [enemy, !1],
  ]
  for (const [pokemon, isPlayerSide] of residualTargets) {
    if (pokemon.currentHp <= 0) continue
    // Magic Guard blocks poison/burn/Leach Seed residual damage.
    if (abilityIgnoresIndirectDamage(pokemon)) continue
    // Leech Seed drains into the other side independently of a major status.
    if (pokemon.leechSeeded) {
      const drain = Math.max(1, Math.floor(pokemon.maxHp / 8)),
        other = isPlayerSide ? enemy : player,
        otherBefore = other.currentHp
      pokemon.currentHp = Math.max(0, pokemon.currentHp - drain)
      other.currentHp = Math.min(other.maxHp, otherBefore + drain)
      events.push({
        type: 'damage',
        message: `${pokemon.name}'s health is sapped by Leech Seed! (${drain} damage)`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          damage: drain,
          hpAfter: pokemon.currentHp,
          hpMax: pokemon.maxHp,
        },
      })
      events.push({
        type: 'heal',
        message: `${other.name} drained health! (+${other.currentHp - otherBefore} HP)`,
        data: {
          target: isPlayerSide ? 'enemy' : 'player',
          hpAfter: other.currentHp,
          hpMax: other.maxHp,
        },
      })
      if (pokemon.currentHp <= 0) {
        events.push({
          type: 'faint',
          message: `${pokemon.name} fainted!`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
          },
        })
        continue
      }
    }
    // A Ghost-type Curse drains a quarter of max HP each turn.
    if (pokemon.cursed) {
      const curseDamage = Math.max(1, Math.floor(pokemon.maxHp / 4))
      pokemon.currentHp = Math.max(0, pokemon.currentHp - curseDamage)
      events.push({
        type: 'damage',
        message: `${pokemon.name} is afflicted by the curse! (${curseDamage} damage)`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          damage: curseDamage,
          hpAfter: pokemon.currentHp,
          hpMax: pokemon.maxHp,
        },
      })
      if (pokemon.currentHp <= 0) {
        events.push({
          type: 'faint',
          message: `${pokemon.name} fainted!`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
          },
        })
        continue
      }
    }
    let residual = 0
    if (pokemon.status === 'poison') residual = Math.max(1, Math.floor(pokemon.maxHp / 8))
    else if (pokemon.status === 'burn') residual = Math.max(1, Math.floor(pokemon.maxHp / 16))
    else if (pokemon.status === 'toxic') {
      // Badly poisoned damage escalates: 1/16, 2/16, 3/16, ...
      const counter = Math.max(1, pokemon.statusTurns ?? 1)
      residual = Math.max(1, Math.floor((pokemon.maxHp * counter) / 16))
      pokemon.statusTurns = counter + 1
    } else continue
    pokemon.currentHp = Math.max(0, pokemon.currentHp - residual)
    events.push({
      type: 'damage',
      message: `${pokemon.name} was hurt by its ${pokemon.status}! (${residual} damage)`,
      data: {
        target: isPlayerSide ? 'player' : 'enemy',
        damage: residual,
        hpAfter: pokemon.currentHp,
        hpMax: pokemon.maxHp,
      },
    })
    pokemon.currentHp <= 0 &&
      events.push({
        type: 'faint',
        message: `${pokemon.name} fainted!`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
        },
      })
  }
  // End-of-turn abilities: Speed Boost raises Speed, Shed Skin may cure status.
  for (const [pokemon, isPlayerSide] of residualTargets) {
    if (pokemon.currentHp <= 0) continue
    if ((pokemon.tauntTurns ?? 0) > 0) pokemon.tauntTurns -= 1
    const ability = abilityOf(pokemon)
    if (ability === 'speedBoost') {
      const stages = pokemon.statStages ?? (pokemon.statStages = {}),
        currentStage = stages.speed ?? 0,
        newStage = clampStatStage(currentStage + 1)
      if (newStage !== currentStage) {
        stages.speed = newStage
        events.push({
          type: 'statChange',
          message: `${pokemon.name}'s Speed rose!`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
          },
        })
      }
    } else if (ability === 'shedSkin' && pokemon.status && chance(0.33, deterministic)) {
      pokemon.status = null
      pokemon.statusTurns = 0
      events.push({
        type: 'status',
        message: `${pokemon.name} shed its skin and recovered!`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
        },
      })
    }
    // Held-item end-of-turn effects.
    const leftovers = heldLeftoversHeal(pokemon)
    if (leftovers > 0 && pokemon.currentHp < pokemon.maxHp) {
      pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + leftovers)
      events.push({
        type: 'heal',
        message: `${pokemon.name} restored HP with Leftovers!`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          hpAfter: pokemon.currentHp,
          hpMax: pokemon.maxHp,
        },
      })
    }
    const berryHeal = heldBerryHeal(pokemon)
    if (berryHeal > 0) {
      pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + berryHeal)
      pokemon.heldItemUsed = !0
      events.push({
        type: 'heal',
        message: `${pokemon.name}'s Sitrus Berry restored HP!`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          hpAfter: pokemon.currentHp,
          hpMax: pokemon.maxHp,
        },
      })
    }
    // Weather chip damage and weather-ability healing.
    const weatherDamage = weatherResidualDamage(activeWeather, pokemon)
    if (weatherDamage > 0 && !abilityIgnoresIndirectDamage(pokemon)) {
      pokemon.currentHp = Math.max(0, pokemon.currentHp - weatherDamage)
      events.push({
        type: 'damage',
        message: `${pokemon.name} was buffeted by the weather! (${weatherDamage} damage)`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          damage: weatherDamage,
          hpAfter: pokemon.currentHp,
          hpMax: pokemon.maxHp,
        },
      })
      pokemon.currentHp <= 0 &&
        events.push({
          type: 'faint',
          message: `${pokemon.name} fainted!`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
          },
        })
    }
    const weatherHeal = weatherAbilityHeal(activeWeather, pokemon)
    if (weatherHeal > 0) {
      const healed = Math.min(pokemon.maxHp, pokemon.currentHp + weatherHeal)
      events.push({
        type: 'heal',
        message: `${pokemon.name} absorbed the weather! (+${healed - pokemon.currentHp} HP)`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          hpAfter: healed,
          hpMax: pokemon.maxHp,
        },
      })
      pokemon.currentHp = healed
    } else if (weatherHeal < 0 && !abilityIgnoresIndirectDamage(pokemon)) {
      pokemon.currentHp = Math.max(0, pokemon.currentHp + weatherHeal)
      events.push({
        type: 'damage',
        message: `${pokemon.name} was hurt by the harsh sunlight! (${-weatherHeal} damage)`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          damage: -weatherHeal,
          hpAfter: pokemon.currentHp,
          hpMax: pokemon.maxHp,
        },
      })
    }
    // Grassy Terrain heals grounded Pokemon each turn.
    const terrainHealing = terrainHeal(activeTerrain, pokemon)
    if (terrainHealing > 0 && pokemon.currentHp < pokemon.maxHp) {
      pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + terrainHealing)
      events.push({
        type: 'heal',
        message: `${pokemon.name} absorbed the grassy terrain! (+${terrainHealing} HP)`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          hpAfter: pokemon.currentHp,
          hpMax: pokemon.maxHp,
        },
      })
    }
    // Aqua Ring heals its holder a little each turn.
    if (pokemon.aquaRing && pokemon.currentHp < pokemon.maxHp) {
      const aquaHeal = Math.max(1, Math.floor(pokemon.maxHp / 16))
      pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + aquaHeal)
      events.push({
        type: 'heal',
        message: `${pokemon.name} absorbed water from its Aqua Ring! (+${aquaHeal} HP)`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          hpAfter: pokemon.currentHp,
          hpMax: pokemon.maxHp,
        },
      })
    }
    // A pending Wish heals its side once its timer runs out.
    if ((pokemon.wishTurns ?? 0) > 0) {
      pokemon.wishTurns -= 1
      if (pokemon.wishTurns <= 0) {
        pokemon.wishTurns = 0
        const wishHeal = pokemon.wishHeal || Math.max(1, Math.floor(pokemon.maxHp / 2))
        if (pokemon.currentHp > 0 && pokemon.currentHp < pokemon.maxHp) {
          pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + wishHeal)
          events.push({
            type: 'heal',
            message: `${pokemon.name}'s wish came true!`,
            data: {
              target: isPlayerSide ? 'player' : 'enemy',
              hpAfter: pokemon.currentHp,
              hpMax: pokemon.maxHp,
            },
          })
        }
        pokemon.wishHeal = 0
      }
    }
    // Yawn puts its target to sleep once its timer runs out.
    if ((pokemon.yawnTurns ?? 0) > 0) {
      pokemon.yawnTurns -= 1
      if (pokemon.yawnTurns <= 0) {
        pokemon.yawnTurns = 0
        if (pokemon.currentHp > 0 && !pokemon.status)
          applyStatus(pokemon, 'sleep', events, isPlayerSide, deterministic, activeTerrain, !0)
      }
    }
    // Encore / Disable / Safeguard / Mist wear off after their turns.
    if ((pokemon.encoreTurns ?? 0) > 0) {
      pokemon.encoreTurns -= 1
      if (pokemon.encoreTurns <= 0) pokemon.encoreMove = null
    }
    if ((pokemon.disableTurns ?? 0) > 0) {
      pokemon.disableTurns -= 1
      if (pokemon.disableTurns <= 0) pokemon.disabledMove = null
    }
    if ((pokemon.safeguardTurns ?? 0) > 0) pokemon.safeguardTurns -= 1
    if ((pokemon.mistTurns ?? 0) > 0) pokemon.mistTurns -= 1
    // Perish Song counts both sides down to a faint that ignores abilities.
    if ((pokemon.perishTurns ?? 0) > 0) {
      pokemon.perishTurns -= 1
      if (pokemon.perishTurns <= 0) {
        pokemon.perishTurns = 0
        pokemon.currentHp = 0
        events.push({
          type: 'faint',
          message: `${pokemon.name} fainted from the Perish Song!`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
          },
        })
      }
    }
  }
}

/**
 * Decay the field at the end of the turn (terrain/weather durations, screens)
 * and push the events the reducer uses to store the new field state. A
 * roaming legendary may also flee.
 * @param {BattlePokemon} player
 * @param {BattlePokemon} enemy
 * @param {any[]} events
 * @param {{ type: string, turns: number } | null} activeWeather
 * @param {{ type: string, turns: number } | null} activeTerrain
 * @param {any} activeHazards
 * @param {{ type: string, turns: number } | null} weather
 * @param {{ type: string, turns: number } | null} terrain
 * @param {any} hazards
 */
export function reportFieldEffects(player, enemy, events, activeWeather, activeTerrain, activeHazards, weather, terrain, hazards) {
  // Terrain wears off when its turns run out.
  if (activeTerrain) {
    activeTerrain = { type: activeTerrain.type, turns: activeTerrain.turns - 1 }
    if (activeTerrain.turns <= 0) {
      events.push({
        type: 'terrain',
        message: `The ${TERRAIN_NAMES[activeTerrain.type] ?? activeTerrain.type} faded.`,
      })
      activeTerrain = null
    }
  }
  // Report the terrain so the reducer can store it.
  if (JSON.stringify(activeTerrain) !== JSON.stringify(terrain ?? null))
    events.push({
      type: 'terrain',
      data: { terrain: activeTerrain },
    })
  // Weather wears off when its turns run out.
  if (activeWeather) {
    activeWeather = { type: activeWeather.type, turns: activeWeather.turns - 1 }
    if (activeWeather.turns <= 0) {
      events.push({
        type: 'weather',
        message: `The ${WEATHER_NAMES[activeWeather.type] ?? activeWeather.type} subsided.`,
      })
      activeWeather = null
    }
  }
  // Report the field's weather so the reducer can store it.
  if (JSON.stringify(activeWeather) !== JSON.stringify(weather ?? null))
    events.push({
      type: 'weather',
      data: { weather: activeWeather },
    })
  // Report the field's entry hazards so the reducer can store them.
  if (JSON.stringify(activeHazards) !== JSON.stringify(hazards ?? emptyBattleHazards()))
    events.push({
      type: 'hazards',
      data: { hazards: activeHazards },
    })
  // Screens wear off after five turns.
  for (const pokemon of [player, enemy]) {
    if (!pokemon.screens) continue
    if (pokemon.screens.reflect > 0) pokemon.screens.reflect -= 1
    if (pokemon.screens.lightScreen > 0) pokemon.screens.lightScreen -= 1
  }
  // A roaming legendary may flee at the end of the turn.
  if (enemy.isRoamer && enemy.currentHp > 0 && Math.random() < roamerFleeChance)
    events.push({
      type: 'flee',
      message: `${enemy.name} fled!`,
      data: {},
    })
}
