// Route-attached minigames (fishing, foraging, rock smash, headbutt, diving):
// a full-stage timing game in the `routeActivity` phase. Encounter activities
// preview what was found (with its hit-quality bonuses) before the battle;
// loot activities pay items and money.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { completedGenerations, mapData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { createBattlePokemon } from '../game/combat.js'
import {
  ACTIVITY_ATTEMPTS,
  ACTIVITY_HIT_ZONE,
  ACTIVITY_PERFECT_ZONE,
  ACTIVITY_SWEEP_MS,
  ACTIVITY_ULTRA_ZONE,
  ROUTE_ACTIVITIES,
  activityLevelBonus,
  activityRewardName,
  activityShinyMultiplier,
  bestRodId,
  rodForId,
  rollActivityEncounter,
  rollActivityHeldItem,
  rollActivityLoot,
  rollFishingExclusive,
} from '../game/minigames.js'
import {
  getPokemonSpriteFallbackUrl,
  getPokemonSpriteUrl,
} from '../game/pokemon.js'
import { checkShinyOdds, shinyOddsForSpecies } from '../game/progression.js'

/** @typedef {'hit' | 'perfect' | 'ultra'} ActivityQuality */

export function RouteActivityScene() {
  const { state, dispatch } = useGame(),
    activityId = state.routeActivity,
    activity = activityId ? ROUTE_ACTIVITIES[activityId] : null,
    routeKey = mapData[state.currentLocation]?.routeKey ?? state.currentRoute,
    [attemptsLeft, setAttemptsLeft] = React.useState(ACTIVITY_ATTEMPTS),
    [position, setPosition] = React.useState(0.5),
    [stage, setStage] = React.useState(
      /** @type {'aiming' | 'encounter' | 'result' | 'done'} */ ('aiming')
    ),
    [message, setMessage] = React.useState(''),
    [found, setFound] = React.useState(/** @type {{ itemId: string, quantity: number }[]} */ ([])),
    [pending, setPending] = React.useState(
      /** @type {{ enemy: any, speciesKey: string, level: number, isShiny: boolean, quality: ActivityQuality, heldItem: string | null, levelBonus: number, shinyMultiplier: number } | null} */ (
        null
      )
    )

  // Sweep the marker back and forth while the player is aiming.
  React.useEffect(() => {
    if (stage !== 'aiming') return
    let frame = 0
    const start = performance.now()
    const loop = /** @param {number} now */ (now) => {
      const progress = ((now - start) % ACTIVITY_SWEEP_MS) / ACTIVITY_SWEEP_MS
      setPosition((Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [stage])

  if (!activity) return null

  // Fishing uses the best rod the player owns; other activities ignore it.
  const rod = rodForId(bestRodId(state.rods))

  function leave() {
    dispatch({ type: 'END_ROUTE_ACTIVITY' })
  }

  /**
   * Build the encounter with its hit-quality bonuses and show it before the
   * battle, so the player can see what they found (and choose to skip it).
   * @param {{ speciesKey: string, level: number }} encounter
   * @param {ActivityQuality} quality
   */
  function previewEncounter(encounter, quality) {
    const completedGenerationSet = completedGenerations(state.pokedexCaught),
      levelBonus = activityLevelBonus(quality),
      level = encounter.level + levelBonus,
      shinyMultiplier = activityShinyMultiplier(quality),
      isShiny = checkShinyOdds(
        Math.max(
          1,
          Math.round(
            shinyOddsForSpecies(encounter.speciesKey, completedGenerationSet) / shinyMultiplier
          )
        )
      ),
      enemy = createBattlePokemon(encounter.speciesKey, level, { isShiny, wild: true }),
      bonusItem = rollActivityHeldItem(quality)
    if (bonusItem) enemy.heldItem = bonusItem
    setPending({
      enemy,
      speciesKey: encounter.speciesKey,
      level,
      isShiny,
      quality,
      heldItem: enemy.heldItem ?? null,
      levelBonus,
      shinyMultiplier,
    })
    setStage('encounter')
  }

  function fight() {
    if (!pending) return
    dispatch({ type: 'MARK_SEEN', payload: { speciesKey: pending.speciesKey } })
    dispatch({ type: 'START_ENCOUNTER', payload: { enemy: pending.enemy } })
    setPending(null)
  }

  function letGo() {
    if (!pending) return
    setMessage(`You left the ${pokemonSpecies[pending.speciesKey]?.name ?? 'Pokemon'} alone.`)
    setPending(null)
    setStage(attemptsLeft <= 0 ? 'done' : 'result')
  }

  function stop() {
    if (!activity || stage !== 'aiming') return
    const distance = Math.abs(position - 0.5),
      perfect = distance <= ACTIVITY_PERFECT_ZONE,
      ultra = distance <= ACTIVITY_ULTRA_ZONE,
      hit = distance <= ACTIVITY_HIT_ZONE,
      quality = /** @type {ActivityQuality} */ (ultra ? 'ultra' : perfect ? 'perfect' : 'hit'),
      nextAttempts = attemptsLeft - 1
    setAttemptsLeft(nextAttempts)
    if (!hit) {
      setMessage(
        activity.mode === 'encounter' ? 'The Pokemon got away...' : 'You found nothing.'
      )
      setStage(nextAttempts <= 0 ? 'done' : 'result')
      return
    }
    if (activity.mode === 'encounter') {
      const exclusive =
          activity.id === 'fishing' && ultra ? rollFishingExclusive(routeKey) : null,
        encounter =
          exclusive ?? rollActivityEncounter(activity.id, routeKey, perfect, rod.id)
      if (!encounter) {
        setMessage('Nothing is biting here.')
        setStage(nextAttempts <= 0 ? 'done' : 'result')
        return
      }
      previewEncounter(encounter, quality)
      return
    }
    // Foraging can flush out a hidden Grass-type before it pays out loot.
    if (activity.encounterChance) {
      const chance = perfect
        ? (activity.perfectEncounterChance ?? activity.encounterChance)
        : activity.encounterChance
      if (Math.random() < chance) {
        const hidden = rollActivityEncounter(activity.id, routeKey, perfect)
        if (hidden) {
          previewEncounter(hidden, quality)
          return
        }
      }
    }
    const reward = rollActivityLoot(perfect),
      money = perfect ? 200 + Math.floor(Math.random() * 201) : 80 + Math.floor(Math.random() * 121)
    setFound((current) => [...current, reward])
    setMessage(
      `${perfect ? 'A great find! ' : ''}You gathered ${activityRewardName(reward.itemId)} x${reward.quantity}.`
    )
    dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: { money, items: [reward] } })
    setStage(nextAttempts <= 0 ? 'done' : 'result')
  }

  const hitWidth = ACTIVITY_HIT_ZONE * 200,
    perfectWidth = ACTIVITY_PERFECT_ZONE * 200,
    ultraWidth = ACTIVITY_ULTRA_ZONE * 200,
    liveDistance = Math.abs(position - 0.5),
    liveZone =
      liveDistance <= ACTIVITY_ULTRA_ZONE
        ? 'ultra'
        : liveDistance <= ACTIVITY_PERFECT_ZONE
          ? 'perfect'
          : liveDistance <= ACTIVITY_HIT_ZONE
            ? 'hit'
            : '',
    ringBand = /** @param {number} value */ (value) => `${Math.round(value * 100)}%`,
    // A bullseye whose bands are the hit / perfect / ultra annuli, so the
    // expanding ring has a clear target to meet.
    ringStyle = {
      background: `radial-gradient(circle at center, transparent 0 ${ringBand(0.5 - ACTIVITY_HIT_ZONE)}, #6ab04c ${ringBand(0.5 - ACTIVITY_HIT_ZONE)} ${ringBand(0.5 - ACTIVITY_PERFECT_ZONE)}, #f0c850 ${ringBand(0.5 - ACTIVITY_PERFECT_ZONE)} ${ringBand(0.5 - ACTIVITY_ULTRA_ZONE)}, #54e0ff ${ringBand(0.5 - ACTIVITY_ULTRA_ZONE)} ${ringBand(0.5 + ACTIVITY_ULTRA_ZONE)}, #f0c850 ${ringBand(0.5 + ACTIVITY_ULTRA_ZONE)} ${ringBand(0.5 + ACTIVITY_PERFECT_ZONE)}, #6ab04c ${ringBand(0.5 + ACTIVITY_PERFECT_ZONE)} ${ringBand(0.5 + ACTIVITY_HIT_ZONE)}, transparent ${ringBand(0.5 + ACTIVITY_HIT_ZONE)})`,
    },
    previewSpecies = pending ? pokemonSpecies[pending.speciesKey] : null

  return jsxs('div', {
    className: `minigame-scene route-activity-scene activity-${activity.id}`,
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsxs('span', {
            className: 'minigame-scene-title',
            children: [`${activity.icon} `, activity.title],
          }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `${attemptsLeft} / ${ACTIVITY_ATTEMPTS} tries`,
              ' \u00b7 ',
              `$${state.money.toLocaleString()}`,
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsx('div', { className: 'activity-hint', children: activity.hint }),
          activity.id === 'fishing' &&
            jsxs('div', {
              className: 'activity-rod',
              children: [`Rod: `, rod.name, ` — `, rod.hint],
            }),
          stage === 'encounter' && pending && previewSpecies
            ? jsxs('div', {
                className: `activity-encounter${pending.isShiny ? ' shiny' : ''}`,
                children: [
                  jsx('img', {
                    className: 'activity-encounter-sprite',
                    src: getPokemonSpriteUrl(previewSpecies.id),
                    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                      (event.target.src = getPokemonSpriteFallbackUrl(previewSpecies.id)),
                    alt: previewSpecies.name,
                  }),
                  jsxs('span', {
                    className: 'activity-encounter-name',
                    children: [pending.isShiny ? '\u2605 ' : '', previewSpecies.name],
                  }),
                  jsx('span', {
                    className: 'activity-encounter-level',
                    children: `Lv.${pending.level}`,
                  }),
                  jsx('div', {
                    className: 'activity-encounter-types',
                    children: previewSpecies.types.map((type) =>
                      jsx(
                        'span',
                        {
                          className: `type-badge type-${type.toLowerCase()}`,
                          children: type,
                        },
                        type
                      )
                    ),
                  }),
                  jsxs('div', {
                    className: 'activity-encounter-bonuses',
                    children: [
                      pending.quality === 'ultra'
                        ? 'PERFECT! '
                        : pending.quality === 'perfect'
                          ? 'Great hit! '
                          : '',
                      `Lv +${pending.levelBonus}`,
                      ' \u00b7 ',
                      `Shiny odds x${pending.shinyMultiplier}`,
                      pending.heldItem
                        ? ` \u00b7 Holding ${activityRewardName(pending.heldItem)}`
                        : '',
                    ],
                  }),
                ],
              })
            : activity.display === 'rings'
              ? jsxs('div', {
                  className: `activity-rings${stage === 'aiming' ? '' : ' locked'}`,
                  style: ringStyle,
                  children: [
                    jsx('div', { className: 'activity-ring-target' }),
                    jsx('div', {
                      className: `activity-ring-marker${liveZone ? ` ${liveZone}` : ''}`,
                      style: {
                        width: `${Math.max(position * 100, 4)}%`,
                        height: `${Math.max(position * 100, 4)}%`,
                      },
                    }),
                  ],
                })
              : activity.display === 'swing'
                ? jsxs('div', {
                    className: `activity-swing${stage === 'aiming' ? '' : ' locked'}`,
                    children: [
                      jsx('div', {
                        className: 'activity-zone activity-zone-hit',
                        style: { left: `${50 - hitWidth / 2}%`, width: `${hitWidth}%` },
                      }),
                      jsx('div', {
                        className: 'activity-zone activity-zone-perfect',
                        style: { left: `${50 - perfectWidth / 2}%`, width: `${perfectWidth}%` },
                      }),
                      jsx('div', {
                        className: 'activity-zone activity-zone-ultra',
                        style: { left: `${50 - ultraWidth / 2}%`, width: `${ultraWidth}%` },
                      }),
                      jsx('div', {
                        className: `activity-swing-marker${liveZone ? ` ${liveZone}` : ''}`,
                        style: { left: `${position * 100}%` },
                        children: '\u26cf\ufe0f',
                      }),
                      jsx('div', { className: 'activity-swing-rock', children: '\u{1faa8}' }),
                    ],
                  })
                : activity.display === 'trunk' || activity.display === 'depth'
                  ? jsxs('div', {
                      className: `activity-gauge activity-gauge-${activity.display}${stage === 'aiming' ? '' : ' locked'}`,
                      children: [
                        jsx('div', {
                          className: 'activity-zone activity-zone-hit',
                          style: { top: `${50 - hitWidth / 2}%`, height: `${hitWidth}%` },
                        }),
                        jsx('div', {
                          className: 'activity-zone activity-zone-perfect',
                          style: { top: `${50 - perfectWidth / 2}%`, height: `${perfectWidth}%` },
                        }),
                        jsx('div', {
                          className: 'activity-zone activity-zone-ultra',
                          style: { top: `${50 - ultraWidth / 2}%`, height: `${ultraWidth}%` },
                        }),
                        jsx('div', {
                          className: `activity-gauge-marker${liveZone ? ` ${liveZone}` : ''}`,
                          style: { top: `${position * 100}%` },
                          children: activity.icon,
                        }),
                      ],
                    })
                  : jsxs('div', {
                      className: `activity-bar${stage === 'aiming' ? '' : ' locked'}`,
                      children: [
                        jsx('div', {
                          className: 'activity-zone activity-zone-hit',
                          style: { left: `${50 - hitWidth / 2}%`, width: `${hitWidth}%` },
                        }),
                        jsx('div', {
                          className: 'activity-zone activity-zone-perfect',
                          style: { left: `${50 - perfectWidth / 2}%`, width: `${perfectWidth}%` },
                        }),
                        jsx('div', {
                          className: 'activity-zone activity-zone-ultra',
                          style: { left: `${50 - ultraWidth / 2}%`, width: `${ultraWidth}%` },
                        }),
                        jsx('div', {
                          className: 'activity-marker',
                          style: { left: `${position * 100}%` },
                        }),
                      ],
                    }),
          message && jsx('div', { className: 'activity-message', children: message }),
          activity.mode === 'loot' &&
            found.length > 0 &&
            jsx('div', {
              className: 'activity-found',
              children: `Found: ${found
                .map((entry) => `${activityRewardName(entry.itemId)} x${entry.quantity}`)
                .join('  \u00b7  ')}`,
            }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-footer',
        children:
          stage === 'aiming'
            ? jsxs('div', {
                className: 'activity-actions',
                children: [
                  jsx('button', {
                    className: 'move-panel-btn confirm',
                    onClick: stop,
                    children: activity.action,
                  }),
                  jsx('button', {
                    className: 'move-panel-btn',
                    onClick: leave,
                    children: 'LEAVE',
                  }),
                ],
              })
            : stage === 'encounter'
              ? jsxs('div', {
                  className: 'activity-actions',
                  children: [
                    jsx('button', {
                      className: 'move-panel-btn confirm',
                      onClick: fight,
                      children: 'BATTLE',
                    }),
                    jsx('button', {
                      className: 'move-panel-btn cancel',
                      onClick: letGo,
                      children: 'LET IT GO',
                    }),
                  ],
                })
              : jsxs('div', {
                  className: 'activity-actions',
                  children: [
                    stage === 'done'
                      ? jsx('button', {
                          className: 'move-panel-btn confirm',
                          onClick: leave,
                          children: 'LEAVE',
                        })
                      : jsx('button', {
                          className: 'move-panel-btn confirm',
                          onClick: () => setStage('aiming'),
                          children: 'TRY AGAIN',
                        }),
                  ],
                }),
      }),
    ],
  })
}
