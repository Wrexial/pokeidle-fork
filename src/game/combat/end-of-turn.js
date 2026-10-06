// End-of-turn phase for combat/turn.js. Split out to keep the turn resolver
// focused on the attack sequence.

import { roamerFleeChance } from '../../data/config.js'
import { abilityBlocksBerries, abilityIgnoresIndirectDamage, abilityOf } from '../abilities.js'
import { emptyBattleHazards } from '../hazards.js'
import { heldBerryHeal, heldLeftoversHeal } from '../held-items.js'
import { TERRAIN_NAMES, terrainHeal } from '../terrain.js'
import { WEATHER_NAMES, weatherAbilityHeal, weatherResidualDamage } from '../weather.js'
import { chance } from './damage.js'
import { changeBattleForm } from './setup.js'
import { applyStatus } from './status.js'
import { clampStatStage, getStatLabel, healBlocked } from './volatile.js'

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
      other.currentHp = healBlocked(other) ? otherBefore : Math.min(other.maxHp, otherBefore + drain)
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
      if (other.currentHp > otherBefore)
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
    const poisonHeal =
      abilityOf(pokemon) === 'poisonHeal' &&
      (pokemon.status === 'poison' || pokemon.status === 'toxic')
    if (poisonHeal) {
      if (!healBlocked(pokemon)) {
        const heal = Math.max(1, Math.floor(pokemon.maxHp / 8))
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal)
        events.push({
          type: 'heal',
          message: `${pokemon.name} restored HP with Poison Heal!`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
            hpAfter: pokemon.currentHp,
            hpMax: pokemon.maxHp,
          },
        })
      }
    } else if (pokemon.status === 'poison') residual = Math.max(1, Math.floor(pokemon.maxHp / 8))
    else if (pokemon.status === 'burn') residual = Math.max(1, Math.floor(pokemon.maxHp / 16))
    else if (pokemon.status === 'sleep' && pokemon.nightmare)
      residual = Math.max(1, Math.floor(pokemon.maxHp / 4))
    else if (pokemon.status === 'toxic') {
      // Badly poisoned damage escalates: 1/16, 2/16, 3/16, ...
      const counter = Math.max(1, pokemon.statusTurns ?? 1)
      residual = Math.max(1, Math.floor((pokemon.maxHp * counter) / 16))
      pokemon.statusTurns = counter + 1
    } else continue
    if (residual <= 0) continue
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
    if (pokemon.status !== 'sleep') pokemon.nightmare = !1
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
    } else if (ability === 'hydration' && activeWeather?.type === 'rain' && pokemon.status) {
      pokemon.status = null
      pokemon.statusTurns = 0
      events.push({
        type: 'status',
        message: `${pokemon.name}'s Hydration cured its status!`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
        },
      })
    } else if (ability === 'moody') {
      // Moody raises one random stat by two and lowers another by one.
      const stats = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'],
        raised = deterministic ? 'attack' : stats[Math.floor(Math.random() * stats.length)],
        lowerOptions = stats.filter((stat) => stat !== raised),
        lowered = deterministic
          ? 'spAttack'
          : lowerOptions[Math.floor(Math.random() * lowerOptions.length)],
        stages = pokemon.statStages ?? (pokemon.statStages = {})
      for (const [stat, delta] of /** @type {[string, number][]} */ ([
        [raised, 2],
        [lowered, -1],
      ])) {
        const current = stages[stat] ?? 0,
          next = clampStatStage(current + delta)
        if (next === current) continue
        stages[stat] = next
        events.push({
          type: 'statChange',
          message: `${pokemon.name}'s ${getStatLabel(stat)} ${delta > 0 ? 'sharply rose' : 'fell'}!`,
          data: { target: isPlayerSide ? 'player' : 'enemy' },
        })
      }
    }
    // Held-item end-of-turn effects.
    const leftovers = heldLeftoversHeal(pokemon)
    if (leftovers > 0 && pokemon.currentHp < pokemon.maxHp && !healBlocked(pokemon)) {
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
    // Cud Chew re-eats the berry from last turn before this turn's berry.
    if ((pokemon.cudChewHeal ?? 0) > 0) {
      const chewHeal = pokemon.cudChewHeal
      pokemon.cudChewHeal = 0
      if (!healBlocked(pokemon)) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + chewHeal)
        events.push({
          type: 'heal',
          message: `${pokemon.name} chewed its cud! (+${chewHeal} HP)`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
            hpAfter: pokemon.currentHp,
            hpMax: pokemon.maxHp,
          },
        })
      }
    }
    // Ripen doubles a berry's healing; an opponent's Unnerve blocks it entirely.
    const berryHeal =
      abilityBlocksBerries(isPlayerSide ? enemy : player)
        ? 0
        : heldBerryHeal(pokemon) * (abilityOf(pokemon) === 'ripen' ? 2 : 1)
    if (berryHeal > 0) {
      // The berry is still consumed under Heal Block, but restores no HP.
      pokemon.heldItemUsed = !0
      if (!healBlocked(pokemon)) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + berryHeal)
        events.push({
          type: 'heal',
          message: `${pokemon.name}'s Sitrus Berry restored HP!`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
            hpAfter: pokemon.currentHp,
            hpMax: pokemon.maxHp,
          },
        })
        // Cheek Pouch heals extra when a berry is eaten.
        if (abilityOf(pokemon) === 'cheekPouch' && pokemon.currentHp < pokemon.maxHp) {
          const pouchHeal = Math.max(1, Math.floor(pokemon.maxHp / 3))
          pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + pouchHeal)
          events.push({
            type: 'heal',
            message: `${pokemon.name}'s Cheek Pouch restored HP!`,
            data: {
              target: isPlayerSide ? 'player' : 'enemy',
              hpAfter: pokemon.currentHp,
              hpMax: pokemon.maxHp,
            },
          })
        }
        // Cud Chew schedules a second helping next turn.
        if (abilityOf(pokemon) === 'cudChew') pokemon.cudChewHeal = berryHeal
      }
    }
    // Harvest restores a consumed berry (always in sun, else 50%).
    if (
      abilityOf(pokemon) === 'harvest' &&
      pokemon.heldItemUsed &&
      (activeWeather?.type === 'sun' || chance(0.5, deterministic))
    ) {
      pokemon.heldItemUsed = !1
      events.push({
        type: 'status',
        message: `${pokemon.name} harvested its held item!`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
        },
      })
    }
    // Ice Face reforms in snow or hail.
    if (pokemon.iceFaceBroken && (activeWeather?.type === 'snow' || activeWeather?.type === 'hail')) {
      pokemon.iceFaceBroken = !1
      changeBattleForm(pokemon, 'eiscue', events, isPlayerSide)
      events.push({
        type: 'status',
        message: `${pokemon.name}'s Ice Face reformed!`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
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
    if (weatherHeal > 0 && !healBlocked(pokemon)) {
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
    if (terrainHealing > 0 && pokemon.currentHp < pokemon.maxHp && !healBlocked(pokemon)) {
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
    if (pokemon.aquaRing && pokemon.currentHp < pokemon.maxHp && !healBlocked(pokemon)) {
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
    // Ingrain heals its holder a little each turn.
    if (pokemon.ingrained && pokemon.currentHp < pokemon.maxHp && !healBlocked(pokemon)) {
      const ingrainHeal = Math.max(1, Math.floor(pokemon.maxHp / 16))
      pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + ingrainHeal)
      events.push({
        type: 'heal',
        message: `${pokemon.name} absorbed nutrients with its roots! (+${ingrainHeal} HP)`,
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
        if (pokemon.currentHp > 0 && pokemon.currentHp < pokemon.maxHp && !healBlocked(pokemon)) {
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
    if ((pokemon.tailwindTurns ?? 0) > 0) pokemon.tailwindTurns -= 1
    if ((pokemon.healBlockTurns ?? 0) > 0) pokemon.healBlockTurns -= 1
    if ((pokemon.magnetRiseTurns ?? 0) > 0) pokemon.magnetRiseTurns -= 1
    if ((pokemon.luckyChantTurns ?? 0) > 0) pokemon.luckyChantTurns -= 1
    if ((pokemon.trickRoomTurns ?? 0) > 0) pokemon.trickRoomTurns -= 1
    if ((pokemon.destinyBondTurns ?? 0) > 0) pokemon.destinyBondTurns -= 1
    if ((pokemon.slowStartTurns ?? 0) > 0) pokemon.slowStartTurns -= 1
    if (abilityOf(pokemon) === 'hungerSwitch') {
      pokemon.hangry = !pokemon.hangry
      changeBattleForm(pokemon, pokemon.hangry ? 'morpeko-hangry' : 'morpeko', events, isPlayerSide)
    }
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
  // Bad Dreams chips away at a sleeping opponent.
  for (const [pokemon, isPlayerSide] of residualTargets) {
    if (pokemon.currentHp <= 0 || abilityOf(pokemon) !== 'badDreams') continue
    const victim = isPlayerSide ? enemy : player
    if (victim.currentHp <= 0 || victim.status !== 'sleep') continue
    const damage = Math.max(1, Math.floor(victim.maxHp / 8))
    victim.currentHp = Math.max(0, victim.currentHp - damage)
    events.push({
      type: 'damage',
      message: `${victim.name} is tormented by Bad Dreams! (${damage} damage)`,
      data: {
        target: isPlayerSide ? 'enemy' : 'player',
        damage,
        hpAfter: victim.currentHp,
        hpMax: victim.maxHp,
      },
    })
    victim.currentHp <= 0 &&
      events.push({
        type: 'faint',
        message: `${victim.name} fainted!`,
        data: {
          target: isPlayerSide ? 'enemy' : 'player',
        },
      })
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
