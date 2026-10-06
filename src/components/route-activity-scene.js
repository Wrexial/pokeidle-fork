// Route-attached minigames (fishing, foraging, rock smash, headbutt, diving):
// a full-stage timing game in the `routeActivity` phase. Encounter activities
// preview what was found (with its hit-quality bonuses) before the battle;
// loot activities pay items and money.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { completedGenerations, mapData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { createBattlePokemon } from '../game/combat.js'
import {
  ACTIVITY_ATTEMPTS,
  ACTIVITY_CHARGE_MS,
  ACTIVITY_HIT_ZONE,
  ACTIVITY_PERFECT_ZONE,
  ACTIVITY_SWEEP_MS,
  ACTIVITY_ULTRA_ZONE,
  ROUTE_ACTIVITIES,
  activityLevelBonus,
  activityBiteChance,
  activityRewardName,
  activityShinyMultiplier,
  bestRodId,
  rodForId,
  rollActivityEncounter,
  rollActivityEncounters,
  rollActivityHeldItem,
  rollActivityLoot,
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
    [charge, setCharge] = React.useState(0),
    [chargingTree, setChargingTree] = React.useState(/** @type {number | null} */ (null)),
    [stage, setStage] = React.useState(
      /** @type {'aiming' | 'reel' | 'encounter' | 'result' | 'done'} */ ('aiming')
    ),
    [message, setMessage] = React.useState(''),
    [reel, setReel] = React.useState(
      /** @type {{ encounters: any[], quality: ActivityQuality } | null} */ (null)
    ),
    [found, setFound] = React.useState(/** @type {{ itemId: string, quantity: number }[]} */ ([])),
    [pendings, setPendings] = React.useState(
      /** @type {{ enemy: any, speciesKey: string, level: number, isShiny: boolean, quality: ActivityQuality, heldItem: string | null, levelBonus: number, shinyMultiplier: number }[]} */ (
        []
      )
    ),
    [selectedPending, setSelectedPending] = React.useState(0),
    chargingTreeRef = React.useRef(/** @type {number | null} */ (null)),
    chargeRef = React.useRef(0)

  // Sweep the marker back and forth while the player is aiming. Headbutt drives
  // its own charge bar from the held tree instead.
  React.useEffect(() => {
    if ((stage !== 'aiming' && stage !== 'reel') || activity?.display === 'charge') return
    let frame = 0
    const start = performance.now()
    const loop = /** @param {number} now */ (now) => {
      const progress = ((now - start) % ACTIVITY_SWEEP_MS) / ACTIVITY_SWEEP_MS
      setPosition((Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [stage, activity?.display])

  // Headbutt: hold a tree to charge the bar. It fills and falls back so the
  // player can time a release at the sweet spot.
  React.useEffect(() => {
    if (chargingTree === null) return
    let frame = 0
    const start = performance.now()
    const loop = /** @param {number} now */ (now) => {
      const cycle = (now - start) % (ACTIVITY_CHARGE_MS * 2),
        value =
          cycle <= ACTIVITY_CHARGE_MS
            ? cycle / ACTIVITY_CHARGE_MS
            : 2 - cycle / ACTIVITY_CHARGE_MS
      chargeRef.current = value
      setCharge(value)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [chargingTree])

  // A held charge releases wherever the pointer is lifted.
  React.useEffect(() => {
    if (chargingTree === null) return
    const release = () => releaseCharge()
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargingTree])

  if (!activity) return null

  // Fishing uses the best rod the player owns; other activities ignore it.
  const rod = rodForId(bestRodId(state.rods)),
    pending = pendings[selectedPending] ?? null

  function leave() {
    dispatch({ type: 'END_ROUTE_ACTIVITY' })
  }

  /**
   * Build an encounter with its hit-quality bonuses so the player can see what
   * they found (and choose to skip it).
   * @param {{ speciesKey: string, level: number }} encounter
   * @param {ActivityQuality} quality
   */
  function buildPending(encounter, quality) {
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
      bonusItem = rollActivityHeldItem(quality, pokemonSpecies[encounter.speciesKey]?.types)
    // Flags this as a minigame find so the battle offers a manual catch.
    enemy.fromActivity = true
    if (bonusItem) enemy.heldItem = bonusItem
    return {
      enemy,
      speciesKey: encounter.speciesKey,
      level,
      isShiny,
      quality,
      heldItem: enemy.heldItem ?? null,
      levelBonus,
      shinyMultiplier,
    }
  }

  /**
   * @param {{ speciesKey: string, level: number }[]} encounters
   * @param {ActivityQuality} quality
   */
  function previewEncounter(encounters, quality) {
    setPendings(encounters.map((encounter) => buildPending(encounter, quality)))
    setSelectedPending(0)
    setStage('encounter')
  }

  function fight() {
    if (!pending) return
    const other = pendings.find((_, index) => index !== selectedPending)
    if (other)
      dispatch({
        type: 'ADD_LOG',
        payload: {
          message: `The other ${
            pokemonSpecies[other.speciesKey]?.name ?? other.speciesKey
          } fled\u2026 awwh!`,
        },
      })
    dispatch({ type: 'MARK_SEEN', payload: { speciesKey: pending.speciesKey } })
    dispatch({ type: 'START_ENCOUNTER', payload: { enemy: pending.enemy } })
    setPendings([])
  }

  function letGo() {
    if (!pending) return
    setMessage(
      `You left the ${pokemonSpecies[pending.speciesKey]?.name ?? 'Pokemon'} alone.${
        pendings.length > 1 ? ' The other slipped away\u2026 awwh!' : ''
      }`
    )
    setPendings([])
    setStage(attemptsLeft <= 0 ? 'done' : 'result')
  }

  /**
   * Resolve a timing attempt at `aimPosition` (0..1, sweet spot at 0.5).
   * @param {number} aimPosition
   */
  function resolveAt(aimPosition) {
    if (!activity || stage !== 'aiming') return
    const distance = Math.abs(aimPosition - 0.5),
      perfect = distance <= ACTIVITY_PERFECT_ZONE,
      ultra = distance <= ACTIVITY_ULTRA_ZONE,
      hit = distance <= ACTIVITY_HIT_ZONE,
      quality = /** @type {ActivityQuality} */ (ultra ? 'ultra' : perfect ? 'perfect' : 'hit'),
      nextAttempts = attemptsLeft - 1
    setAttemptsLeft(nextAttempts)
    if (!hit) {
      if (state.sfxEnabled) playSfx('miss')
      setMessage(
        activity.mode === 'encounter' ? 'The Pokemon got away...' : 'You found nothing.'
      )
      setStage(nextAttempts <= 0 ? 'done' : 'result')
      return
    }
    if (state.sfxEnabled) playSfx(ultra || perfect ? 'great' : 'good')
    if (activity.mode === 'encounter') {
      // Fishing can whiff the bite entirely; Suction Cups / Sticky Hold steady
      // the line. A perfect cast always gets a bite.
      if (
        activity.id === 'fishing' &&
        !perfect &&
        Math.random() >= activityBiteChance(state.playerPokemon?.ability)
      ) {
        setMessage('Nothing is biting...')
        setStage(nextAttempts <= 0 ? 'done' : 'result')
        return
      }
      // A headbutted tree sometimes shakes out a second Pokemon that slips away
      // while you deal with the first.
      const encounters = rollActivityEncounters(activity.id, routeKey, perfect, rod.id, state.challengeMonotype)
      if (encounters.length === 0) {
        setMessage('Nothing is biting here.')
        setStage(nextAttempts <= 0 ? 'done' : 'result')
        return
      }
      // A rare multi-catch fish needs a second, perfect reel before it is
      // actually hooked.
      if (activity.id === 'fishing' && encounters[0]?.multi) {
        setReel({ encounters, quality })
        setMessage('It\u2019s a big one \u2014 reel it in perfectly again!')
        setStage('reel')
        return
      }
      previewEncounter(encounters, quality)
      return
    }
    // Foraging can flush out a hidden Grass-type before it pays out loot.
    if (activity.encounterChance) {
      const chance = perfect
        ? (activity.perfectEncounterChance ?? activity.encounterChance)
        : activity.encounterChance
      if (Math.random() < chance) {
        const hidden = rollActivityEncounter(activity.id, routeKey, perfect, undefined, state.challengeMonotype)
        if (hidden) {
          previewEncounter([hidden], quality)
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

  function stop() {
    resolveAt(position)
  }

  /**
   * The second reel for a multi-catch fish: only a perfect timing lands it.
   * @param {number} aimPosition
   */
  function resolveReel(aimPosition) {
    if (!reel || stage !== 'reel') return
    const distance = Math.abs(aimPosition - 0.5),
      perfect = distance <= ACTIVITY_PERFECT_ZONE
    if (!perfect) {
      if (state.sfxEnabled) playSfx('miss')
      setMessage(
        `The ${
          pokemonSpecies[reel.encounters[0].speciesKey]?.name ?? 'fish'
        } thrashed free \u2014 it needed a second perfect reel!`
      )
      setReel(null)
      setStage(attemptsLeft <= 0 ? 'done' : 'result')
      return
    }
    if (state.sfxEnabled) playSfx('great')
    const { encounters, quality } = reel
    setReel(null)
    previewEncounter(encounters, quality)
  }

  function reelStop() {
    resolveReel(position)
  }

  /** @param {number} index */
  function startCharge(index) {
    if (stage !== 'aiming' || chargingTreeRef.current !== null) return
    chargingTreeRef.current = index
    chargeRef.current = 0
    setChargingTree(index)
    setCharge(0)
  }

  function releaseCharge() {
    if (chargingTreeRef.current === null) return
    chargingTreeRef.current = null
    setChargingTree(null)
    resolveAt(chargeRef.current)
  }

  const hitWidth = ACTIVITY_HIT_ZONE * 200,
    perfectWidth = ACTIVITY_PERFECT_ZONE * 200,
    ultraWidth = ACTIVITY_ULTRA_ZONE * 200,
    aimValue = activity.display === 'charge' ? charge : position,
    liveDistance = Math.abs(aimValue - 0.5),
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
    }

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
          stage === 'encounter' && pendings.length > 0
            ? jsx('div', {
                className: 'activity-encounters',
                children: pendings.map((choice, index) => {
                  const choiceSpecies = pokemonSpecies[choice.speciesKey]
                  return jsxs(
                    'div',
                    {
                      className: `activity-encounter${choice.isShiny ? ' shiny' : ''}${
                        index === selectedPending ? ' selected' : ''
                      }`,
                      onClick: () => setSelectedPending(index),
                      children: [
                        jsx('img', {
                          className: 'activity-encounter-sprite',
                          src: getPokemonSpriteUrl(choiceSpecies?.id ?? 0),
                          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                            (event.target.src = getPokemonSpriteFallbackUrl(choiceSpecies?.id ?? 0)),
                          alt: choiceSpecies?.name ?? choice.speciesKey,
                        }),
                        jsxs('span', {
                          className: 'activity-encounter-name',
                          children: [
                            choice.isShiny ? '\u2605 ' : '',
                            choiceSpecies?.name ?? choice.speciesKey,
                          ],
                        }),
                        jsx('span', {
                          className: 'activity-encounter-level',
                          children: `Lv.${choice.level}`,
                        }),
                        jsx('div', {
                          className: 'activity-encounter-types',
                          children: (choiceSpecies?.types ?? []).map((type) =>
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
                            choice.quality === 'ultra'
                              ? 'PERFECT! '
                              : choice.quality === 'perfect'
                                ? 'Great hit! '
                                : '',
                            `Lv +${choice.levelBonus}`,
                            ' \u00b7 ',
                            `Shiny odds x${choice.shinyMultiplier}`,
                            choice.heldItem
                              ? ` \u00b7 Holding ${activityRewardName(choice.heldItem)}`
                              : '',
                          ],
                        }),
                      ],
                    },
                    `${choice.speciesKey}-${index}`
                  )
                }),
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
                : activity.display === 'charge'
                  ? jsxs('div', {
                      className: `activity-charge${stage === 'aiming' ? '' : ' locked'}`,
                      children: [
                        jsxs('div', {
                          className: 'activity-trees',
                          children: [0, 1, 2].map((index) =>
                            jsx(
                              'button',
                              {
                                className: `activity-tree${chargingTree === index ? ' charging' : ''}`,
                                disabled: stage !== 'aiming',
                                onPointerDown: (
                                  /** @type {React.PointerEvent<HTMLButtonElement>} */ event
                                ) => {
                                  event.preventDefault()
                                  startCharge(index)
                                },
                                onContextMenu: (
                                  /** @type {React.MouseEvent} */ event
                                ) => event.preventDefault(),
                                'aria-label': `Headbutt tree ${index + 1}`,
                                children: '\u{1f333}',
                              },
                              index
                            )
                          ),
                        }),
                        jsxs('div', {
                          className: 'activity-bar activity-charge-bar',
                          children: [
                            jsx('div', {
                              className: 'activity-zone activity-zone-hit',
                              style: { left: `${50 - hitWidth / 2}%`, width: `${hitWidth}%` },
                            }),
                            jsx('div', {
                              className: 'activity-zone activity-zone-perfect',
                              style: {
                                left: `${50 - perfectWidth / 2}%`,
                                width: `${perfectWidth}%`,
                              },
                            }),
                            jsx('div', {
                              className: 'activity-zone activity-zone-ultra',
                              style: { left: `${50 - ultraWidth / 2}%`, width: `${ultraWidth}%` },
                            }),
                            jsx('div', {
                              className: 'activity-charge-fill',
                              style: { width: `${charge * 100}%` },
                            }),
                            jsx('div', {
                              className: `activity-marker${liveZone ? ` ${liveZone}` : ''}`,
                              style: { left: `${charge * 100}%` },
                            }),
                          ],
                        }),
                      ],
                    })
                  : activity.display === 'depth'
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
                      className: `activity-bar${stage === 'aiming' || stage === 'reel' ? '' : ' locked'}`,
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
          stage === 'aiming' || stage === 'reel'
            ? jsxs('div', {
                className: 'activity-actions',
                children: [
                  activity.display !== 'charge' &&
                    jsx('button', {
                      className: 'move-panel-btn confirm',
                      onClick: stage === 'reel' ? reelStop : stop,
                      children: stage === 'reel' ? 'REEL IN' : activity.action,
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
