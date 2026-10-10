// Route-attached minigames (fishing, foraging, rock smash, headbutt, diving,
// bug catching, climbing, prospecting): a full-stage interaction in the
// `routeActivity` phase. Every activity has its own mechanic so no two play
// alike. Encounter activities preview what was found (with its hit-quality
// bonuses) before the battle; loot activities pay items and money.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { completedGenerations, mapData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { createBattlePokemon } from '../game/combat.js'
import {
  ACTIVITY_ATTEMPTS,
  ACTIVITY_BUG_FLEE_MS,
  ACTIVITY_BUG_SPOTS,
  ACTIVITY_CHARGE_MS,
  ACTIVITY_DIG_SIZE,
  ACTIVITY_DIG_TRIES,
  ACTIVITY_GRIP_BAND,
  ACTIVITY_GRIP_CENTER,
  ACTIVITY_GRIP_MS,
  ACTIVITY_HIT_ZONE,
  ACTIVITY_MASH_MS,
  ACTIVITY_MASH_TAPS,
  ACTIVITY_PERFECT_ZONE,
  ACTIVITY_SWEEP_MS,
  ACTIVITY_ULTRA_ZONE,
  ROUTE_ACTIVITIES,
  activityBiteChance,
  activityBugQuality,
  activityDigQuality,
  activityGripQuality,
  activityLevelBonus,
  activityMashQuality,
  activityQualityForDistance,
  activityRewardName,
  activityShinyMultiplier,
  bestRodId,
  rodForId,
  rollActivityEncounter,
  rollActivityEncounters,
  rollActivityHeldItem,
  rollActivityLoot,
  rollForageBerry,
  rollDiveTreasure,
  rollSmashBonus,
  rollProspectLoot,
  rollProspectBonus,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { checkShinyOdds, shinyOddsForSpecies } from '../game/progression.js'

/** @typedef {'hit' | 'perfect' | 'ultra'} ActivityQuality */

/** Displays where the player stops a sweeping marker on the sweet spot. */
const SWEEP_DISPLAYS = new Set(['bar', 'rings', 'depth'])

/** Bush positions (as `%` offsets) a bug can dart out of in a sweep. */
const BUG_SPOT_POSITIONS = [
  { left: '18%', top: '30%' },
  { left: '50%', top: '16%' },
  { left: '82%', top: '32%' },
  { left: '30%', top: '68%' },
  { left: '70%', top: '64%' },
]

/** Gravity pulling the climber down and the grip pulling it back up (per s). */
const GRIP_GRAVITY = 0.4
const GRIP_PULL = 0.72

/** @param {number} value */
const clamp01 = (value) => Math.max(0, Math.min(1, value))

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
    [combo, setCombo] = React.useState(0),
    [pendings, setPendings] = React.useState(
      /** @type {{ enemy: any, speciesKey: string, level: number, isShiny: boolean, quality: ActivityQuality, heldItem: string | null, levelBonus: number, shinyMultiplier: number }[]} */ (
        []
      )
    ),
    [selectedPending, setSelectedPending] = React.useState(0),
    // Rock smash: taps counted inside the open mash window.
    [mashTaps, setMashTaps] = React.useState(0),
    [mashRunning, setMashRunning] = React.useState(false),
    // Bug catching: which bush the bug is in and how long it has been out.
    [bugSpot, setBugSpot] = React.useState(0),
    // Rock climbing: the climber's height, whether the grip is held, and how
    // much of the climb is done.
    [grip, setGrip] = React.useState(ACTIVITY_GRIP_CENTER),
    [gripHeld, setGripHeld] = React.useState(false),
    [gripProgress, setGripProgress] = React.useState(0),
    // Prospecting: the grid's dug cells and how many holes have been dug.
    [digCells, setDigCells] = React.useState(() =>
      Array(ACTIVITY_DIG_SIZE * ACTIVITY_DIG_SIZE).fill(0)
    ),
    [digTries, setDigTries] = React.useState(0),
    // Bumped on every new attempt so timed CSS animations restart.
    [attemptNonce, setAttemptNonce] = React.useState(0),
    chargingTreeRef = React.useRef(/** @type {number | null} */ (null)),
    chargeRef = React.useRef(0),
    mashTapsRef = React.useRef(0),
    mashDeadlineRef = React.useRef(0),
    gripRef = React.useRef(ACTIVITY_GRIP_CENTER),
    gripHeldRef = React.useRef(false),
    gripStatsRef = React.useRef({ elapsed: 0, inBand: 0 }),
    bugShownAtRef = React.useRef(0),
    digTreasureRef = React.useRef(0),
    // Set once an attempt is resolved so a timer and a tap can't both score it.
    resolvedRef = React.useRef(false),
    // Every render refreshes this so timer-driven loops resolve against the
    // latest attempt/game state instead of a stale closure.
    finishRef = React.useRef(
      /** @type {(quality: ActivityQuality | null) => void} */ (() => {})
    )

  // A new attempt resets every mechanic's transient state and seeds the hidden
  // ones (the bug's bush, the treasure cell).
  React.useEffect(() => {
    if (stage !== 'aiming') return
    setPosition(0.5)
    setCharge(0)
    setChargingTree(null)
    chargingTreeRef.current = null
    setReel(null)
    setMashTaps(0)
    mashTapsRef.current = 0
    setMashRunning(false)
    mashDeadlineRef.current = 0
    gripRef.current = ACTIVITY_GRIP_CENTER
    gripHeldRef.current = false
    setGripHeld(false)
    gripStatsRef.current = { elapsed: 0, inBand: 0 }
    setGrip(ACTIVITY_GRIP_CENTER)
    setGripProgress(0)
    setDigCells(Array(ACTIVITY_DIG_SIZE * ACTIVITY_DIG_SIZE).fill(0))
    setDigTries(0)
    digTreasureRef.current = Math.floor(
      Math.random() * ACTIVITY_DIG_SIZE * ACTIVITY_DIG_SIZE
    )
    bugShownAtRef.current = performance.now()
    setBugSpot(Math.floor(Math.random() * ACTIVITY_BUG_SPOTS))
    resolvedRef.current = false
    setAttemptNonce((value) => value + 1)
  }, [stage])

  // Sweep the marker back and forth for the stop-timing displays. Headbutt and
  // the other mechanics drive their own interaction instead.
  React.useEffect(() => {
    if (
      (stage !== 'aiming' && stage !== 'reel') ||
      !activity?.display ||
      !SWEEP_DISPLAYS.has(activity.display)
    )
      return
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
  }, [chargingTree])

  // Rock smash: watch for the mash window to close, then grade the taps.
  React.useEffect(() => {
    if (stage !== 'aiming' || activity?.display !== 'mash') return
    let frame = 0,
      done = false
    const loop = /** @param {number} now */ (now) => {
      if (done) return
      if (mashDeadlineRef.current && now >= mashDeadlineRef.current) {
        done = true
        setMashRunning(false)
        finishRef.current(activityMashQuality(mashTapsRef.current))
        return
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [stage, activity?.display])

  // Bug catching: the bug flits away if the net doesn't meet it in time.
  React.useEffect(() => {
    if (stage !== 'aiming' || activity?.display !== 'net') return
    let frame = 0,
      done = false
    const loop = () => {
      if (done) return
      if (performance.now() - bugShownAtRef.current >= ACTIVITY_BUG_FLEE_MS) {
        done = true
        finishRef.current(null)
        return
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [stage, activity?.display])

  // Rock climbing: gravity fights the grip; the player holds to pull up and
  // releases to drop, keeping the climber on the ledge band while the meter
  // fills. The quality is how much of the climb was spent on the band.
  React.useEffect(() => {
    if (stage !== 'aiming' || activity?.display !== 'grip') return
    let frame = 0,
      done = false,
      last = performance.now()
    const loop = /** @param {number} now */ (now) => {
      const delta = Math.min(50, now - last)
      last = now
      gripRef.current = clamp01(
        gripRef.current + (gripHeldRef.current ? -GRIP_PULL : GRIP_GRAVITY) * (delta / 1000)
      )
      gripStatsRef.current.elapsed += delta
      const distance = Math.abs(gripRef.current - ACTIVITY_GRIP_CENTER)
      if (distance <= ACTIVITY_GRIP_BAND / 2) gripStatsRef.current.inBand += delta
      setGrip(gripRef.current)
      setGripProgress(Math.min(1, gripStatsRef.current.elapsed / ACTIVITY_GRIP_MS))
      if (gripStatsRef.current.elapsed >= ACTIVITY_GRIP_MS && !done) {
        done = true
        finishRef.current(
          activityGripQuality(gripStatsRef.current.inBand / gripStatsRef.current.elapsed)
        )
        return
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [stage, activity?.display])

  // Releasing the climb grip anywhere on the page counts.
  React.useEffect(() => {
    if (!gripHeld) return
    const release = () => gripUp()
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [gripHeld])

  // Keep the auto-resolving loops pointed at the current finish function.
  React.useEffect(() => {
    finishRef.current = finishAttempt
  })

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

  /**
   * Grant any side-find a clean hit rolls up: sunken treasure on a dive, a gem
   * (or rarely a fossil) from a smashed boulder.
   * @param {ActivityQuality} quality
   */
  function grantActivityBonus(quality) {
    const bonusItem =
      activity?.id === 'diving'
        ? rollDiveTreasure(quality)
        : activity?.id === 'rockSmash'
          ? rollSmashBonus(quality)
          : null
    if (!bonusItem) return
    setFound((current) => [...current, { itemId: bonusItem, quantity: 1 }])
    setMessage(`You also found ${activityRewardName(bonusItem)}!`)
    dispatch({
      type: 'CLAIM_MINIGAME_REWARD',
      payload: { money: 0, items: [{ itemId: bonusItem, quantity: 1 }] },
    })
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
   * Resolve an attempt at `quality` (`null` is a miss). All the outcome logic
   * lives here so every mechanic only has to grade its own interaction.
   * @param {ActivityQuality | null} quality
   */
  function finishAttempt(quality) {
    if (!activity || resolvedRef.current) return
    resolvedRef.current = true
    const nextAttempts = attemptsLeft - 1
    setAttemptsLeft(nextAttempts)
    if (!quality) {
      if (state.sfxEnabled) playSfx('miss')
      setCombo(0)
      setMessage(
        activity.mode === 'encounter' ? 'The Pokemon got away...' : 'You found nothing.'
      )
      setStage(nextAttempts <= 0 ? 'done' : 'result')
      return
    }
    if (state.sfxEnabled) playSfx(quality === 'hit' ? 'good' : 'great')
    const perfect = quality !== 'hit'
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
      const encounters = rollActivityEncounters(
        activity.id,
        routeKey,
        perfect,
        rod.id,
        state.challengeMonotype
      )
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
      grantActivityBonus(quality)
      previewEncounter(encounters, quality)
      return
    }
    // Prospecting pays out buried relics (valuables, evolution stones) rather
    // than berries; a clean dig can also turn up a bonus relic or a fossil.
    if (activity.id === 'prospecting') {
      const reward = rollProspectLoot(perfect),
        bonusItem = rollProspectBonus(quality),
        money = perfect
          ? 260 + Math.floor(Math.random() * 241)
          : 100 + Math.floor(Math.random() * 141),
        items = [{ itemId: reward.itemId, quantity: reward.quantity }]
      if (bonusItem) items.push({ itemId: bonusItem, quantity: 1 })
      setFound((current) => [...current, ...items])
      setMessage(
        `${perfect ? 'A rich vein! ' : ''}You dug up ${activityRewardName(reward.itemId)} x${reward.quantity}.${
          bonusItem ? ` Also found ${activityRewardName(bonusItem)}!` : ''
        }`
      )
      dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: { money, items } })
      setStage(nextAttempts <= 0 ? 'done' : 'result')
      return
    }
    // Foraging can flush out a hidden Grass-type before it pays out loot.
    if (activity.encounterChance) {
      const chance = perfect
        ? (activity.perfectEncounterChance ?? activity.encounterChance)
        : activity.encounterChance
      if (Math.random() < chance) {
        const hidden = rollActivityEncounter(
          activity.id,
          routeKey,
          perfect,
          undefined,
          state.challengeMonotype
        )
        if (hidden) {
          setCombo(perfect ? combo + 1 : 0)
          previewEncounter([hidden], quality)
          return
        }
      }
    }
    // A perfect search fills the basket: the berry haul grows with the combo of
    // consecutive clean searches. A plain search just gathers general supplies.
    const reward = perfect ? rollForageBerry(combo) : rollActivityLoot(!1),
      money = perfect ? 200 + Math.floor(Math.random() * 201) : 80 + Math.floor(Math.random() * 121),
      comboText = perfect ? ` Berry combo x${combo + 1}!` : ''
    setCombo(perfect ? combo + 1 : 0)
    setFound((current) => [...current, reward])
    setMessage(
      `${perfect ? 'A great find! ' : ''}You gathered ${activityRewardName(reward.itemId)} x${reward.quantity}.${comboText}`
    )
    dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: { money, items: [reward] } })
    setStage(nextAttempts <= 0 ? 'done' : 'result')
  }

  /**
   * Resolve a stop-timing attempt at `aimPosition` (0..1, sweet spot at 0.5).
   * @param {number} aimPosition
   */
  function resolveAt(aimPosition) {
    if (stage !== 'aiming') return
    finishAttempt(activityQualityForDistance(Math.abs(aimPosition - 0.5)))
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

  // Rock smash: the first tap arms the window, later taps build the power.
  function mashTap() {
    if (stage !== 'aiming') return
    if (!mashDeadlineRef.current) {
      mashDeadlineRef.current = performance.now() + ACTIVITY_MASH_MS
      setMashRunning(true)
    }
    mashTapsRef.current += 1
    setMashTaps(mashTapsRef.current)
  }

  // Bug catching: grade how quickly the net met the bug.
  function catchBug() {
    if (stage !== 'aiming') return
    finishAttempt(activityBugQuality(performance.now() - bugShownAtRef.current))
  }

  function gripDown() {
    gripHeldRef.current = true
    setGripHeld(true)
  }

  function gripUp() {
    gripHeldRef.current = false
    setGripHeld(false)
  }

  /** @param {number} index */
  function digAt(index) {
    if (stage !== 'aiming' || activity?.display !== 'dig' || digCells[index] !== 0) return
    const tries = digTries + 1
    setDigTries(tries)
    if (index === digTreasureRef.current) {
      setDigCells((cells) => cells.map((value, cell) => (cell === index ? 2 : value)))
      finishAttempt(activityDigQuality(tries))
      return
    }
    setDigCells((cells) => cells.map((value, cell) => (cell === index ? 1 : value)))
    if (tries >= ACTIVITY_DIG_TRIES) {
      finishAttempt(null)
      return
    }
    const column = index % ACTIVITY_DIG_SIZE,
      row = Math.floor(index / ACTIVITY_DIG_SIZE),
      treasureColumn = digTreasureRef.current % ACTIVITY_DIG_SIZE,
      treasureRow = Math.floor(digTreasureRef.current / ACTIVITY_DIG_SIZE),
      distance =
        Math.abs(column - treasureColumn) + Math.abs(row - treasureRow)
    setMessage(
      distance <= 1
        ? 'The next hole is warmer!'
        : distance <= 2
          ? 'Warm\u2026 getting closer.'
          : 'Cold\u2026 try another spot.'
    )
  }

  const liveZone =
      Math.abs((activity.display === 'charge' ? charge : position) - 0.5) <= ACTIVITY_ULTRA_ZONE
        ? 'ultra'
        : Math.abs((activity.display === 'charge' ? charge : position) - 0.5) <=
            ACTIVITY_PERFECT_ZONE
          ? 'perfect'
          : Math.abs((activity.display === 'charge' ? charge : position) - 0.5) <=
              ACTIVITY_HIT_ZONE
            ? 'hit'
            : '',
    ringBand = /** @param {number} value */ (value) => `${Math.round(value * 100)}%`,
    // A bullseye whose bands are the hit / perfect / ultra annuli, so the
    // expanding ring has a clear target to meet.
    ringStyle = {
      background: `radial-gradient(circle at center, transparent 0 ${ringBand(0.5 - ACTIVITY_HIT_ZONE)}, #6ab04c ${ringBand(0.5 - ACTIVITY_HIT_ZONE)} ${ringBand(0.5 - ACTIVITY_PERFECT_ZONE)}, #f0c850 ${ringBand(0.5 - ACTIVITY_PERFECT_ZONE)} ${ringBand(0.5 - ACTIVITY_ULTRA_ZONE)}, #54e0ff ${ringBand(0.5 - ACTIVITY_ULTRA_ZONE)} ${ringBand(0.5 + ACTIVITY_ULTRA_ZONE)}, #f0c850 ${ringBand(0.5 + ACTIVITY_ULTRA_ZONE)} ${ringBand(0.5 + ACTIVITY_PERFECT_ZONE)}, #6ab04c ${ringBand(0.5 + ACTIVITY_PERFECT_ZONE)} ${ringBand(0.5 + ACTIVITY_HIT_ZONE)}, transparent ${ringBand(0.5 + ACTIVITY_HIT_ZONE)})`,
    }

  /**
   * The three nested hit bands, laid out on either a horizontal or vertical
   * track (the shared target for the sweep interactions).
   * @param {'x' | 'y'} axis
   */
  function renderZoneBands(axis) {
    return ['hit', 'perfect', 'ultra'].map((zone) => {
      const size =
        (zone === 'hit'
          ? ACTIVITY_HIT_ZONE
          : zone === 'perfect'
            ? ACTIVITY_PERFECT_ZONE
            : ACTIVITY_ULTRA_ZONE) * 200
      return jsx(
        'div',
        {
          className: `activity-zone activity-zone-${zone}`,
          style:
            axis === 'y'
              ? { top: `${50 - size / 2}%`, height: `${size}%` }
              : { left: `${50 - size / 2}%`, width: `${size}%` },
        },
        zone
      )
    })
  }

  function renderMechanic() {
    if (!activity) return null
    switch (activity.display) {
      case 'bar':
      case 'depth':
        return renderSweep(activity.display === 'depth' ? 'y' : 'x')
      case 'rings':
        return renderRings()
      case 'charge':
        return renderCharge()
      case 'mash':
        return renderMash()
      case 'net':
        return renderNet()
      case 'grip':
        return renderGrip()
      case 'dig':
        return renderDig()
      default:
        return null
    }
  }

  /** @param {'x' | 'y'} axis */
  function renderSweep(axis) {
    const locked = stage !== 'aiming' && stage !== 'reel'
    if (axis === 'y')
      return jsxs('div', {
        className: `activity-gauge activity-gauge-depth activity-gauge-${activity?.id}${locked ? ' locked' : ''}`,
        children: [
          renderZoneBands('y'),
          jsx('div', {
            className: `activity-gauge-marker${liveZone ? ` ${liveZone}` : ''}`,
            style: { top: `${position * 100}%` },
            children: activity?.icon,
          }),
        ],
      })
    return jsxs('div', {
      className: `activity-bar${locked ? ' locked' : ''}`,
      children: [
        renderZoneBands('x'),
        jsx('div', { className: 'activity-marker', style: { left: `${position * 100}%` } }),
      ],
    })
  }

  function renderRings() {
    const locked = stage !== 'aiming'
    return jsxs('div', {
      className: `activity-rings${locked ? ' locked' : ''}`,
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
  }

  function renderCharge() {
    // The charge bar shares the horizontal bands, but is driven by the hold.
    const chargeLive =
        Math.abs(charge - 0.5) <= ACTIVITY_ULTRA_ZONE
          ? 'ultra'
          : Math.abs(charge - 0.5) <= ACTIVITY_PERFECT_ZONE
            ? 'perfect'
            : Math.abs(charge - 0.5) <= ACTIVITY_HIT_ZONE
              ? 'hit'
              : ''
    return jsxs('div', {
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
                onContextMenu: (/** @type {React.MouseEvent} */ event) =>
                  event.preventDefault(),
                'aria-label': `${activity?.action} ${index + 1}`,
                children: activity?.propIcon ?? '\u{1f333}',
              },
              index
            )
          ),
        }),
        jsxs('div', {
          className: 'activity-bar activity-charge-bar',
          children: [
            renderZoneBands('x'),
            jsx('div', {
              className: 'activity-charge-fill',
              style: { width: `${charge * 100}%` },
            }),
            jsx('div', {
              className: `activity-marker${chargeLive ? ` ${chargeLive}` : ''}`,
              style: { left: `${charge * 100}%` },
            }),
          ],
        }),
      ],
    })
  }

  function renderMash() {
    const power = Math.min(100, (mashTaps / ACTIVITY_MASH_TAPS.ultra) * 100)
    return jsxs('div', {
      className: `activity-mash${stage === 'aiming' ? '' : ' locked'}`,
      children: [
        jsx('div', {
          className: 'activity-mash-timer',
          children: jsx('div', {
            className: `activity-mash-timer-fill${mashRunning ? ' running' : ''}`,
            key: attemptNonce,
            style: { animationDuration: `${ACTIVITY_MASH_MS}ms` },
          }),
        }),
        jsx('button', {
          className: `activity-boulder${mashRunning ? ' active' : ''}`,
          disabled: stage !== 'aiming',
          onPointerDown: (/** @type {React.PointerEvent<HTMLButtonElement>} */ event) => {
            event.preventDefault()
            mashTap()
          },
          onContextMenu: (/** @type {React.MouseEvent} */ event) => event.preventDefault(),
          'aria-label': activity?.action,
          children: '\u{1faa8}',
        }),
        jsx('div', {
          className: 'activity-mash-power',
          children: jsx('div', {
            className: 'activity-mash-power-fill',
            style: { width: `${power}%` },
          }),
        }),
        jsx('div', {
          className: 'activity-mash-count',
          children: mashRunning
            ? `SMASH! ${mashTaps} hit${mashTaps === 1 ? '' : 's'}`
            : 'Tap the boulder to start smashing',
        }),
      ],
    })
  }

  function renderNet() {
    const spot = BUG_SPOT_POSITIONS[bugSpot] ?? BUG_SPOT_POSITIONS[0],
      locked = stage !== 'aiming'
    return jsxs('div', {
      className: `activity-bugfield${locked ? ' locked' : ''}`,
      children: [
        ...BUG_SPOT_POSITIONS.map((positionStyle, index) =>
          jsx(
            'span',
            { className: 'activity-bug-bush', style: positionStyle, children: '\u{1f33f}' },
            index
          )
        ),
        jsx('button', {
          className: 'activity-bug',
          style: spot,
          disabled: locked,
          onClick: catchBug,
          'aria-label': 'Sweep the net over the bug',
          children: activity?.propIcon ?? '\u{1f41b}',
        }),
        jsx('div', {
          className: 'activity-bug-timer',
          children: jsx('div', {
            className: 'activity-bug-timer-fill',
            key: attemptNonce,
            style: { animationDuration: `${ACTIVITY_BUG_FLEE_MS}ms` },
          }),
        }),
      ],
    })
  }

  function renderGrip() {
    const bandTop = (ACTIVITY_GRIP_CENTER - ACTIVITY_GRIP_BAND / 2) * 100,
      bandHeight = ACTIVITY_GRIP_BAND * 100
    return jsxs('div', {
      className: `activity-grip${stage === 'aiming' ? '' : ' locked'}`,
      children: [
        jsxs('div', {
          className: 'activity-wall',
          children: [
            jsx('div', {
              className: 'activity-wall-band',
              style: { top: `${bandTop}%`, height: `${bandHeight}%` },
            }),
            jsx('div', {
              className: 'activity-climber',
              style: { top: `${grip * 100}%` },
              children: activity?.icon,
            }),
          ],
        }),
        jsx('div', {
          className: 'activity-grip-progress',
          children: jsx('div', {
            className: 'activity-grip-progress-fill',
            style: { transform: `scaleX(${gripProgress})` },
          }),
        }),
        jsx('button', {
          className: `activity-hold${gripHeld ? ' holding' : ''}`,
          disabled: stage !== 'aiming',
          onPointerDown: (/** @type {React.PointerEvent<HTMLButtonElement>} */ event) => {
            event.preventDefault()
            gripDown()
          },
          onPointerUp: gripUp,
          onPointerLeave: gripUp,
          onPointerCancel: gripUp,
          onContextMenu: (/** @type {React.MouseEvent} */ event) => event.preventDefault(),
          children: gripHeld ? 'HOLDING ON' : 'HOLD TO CLIMB',
        }),
      ],
    })
  }

  function renderDig() {
    const cellCount = ACTIVITY_DIG_SIZE * ACTIVITY_DIG_SIZE,
      locked = stage !== 'aiming'
    return jsxs('div', {
      className: `activity-dig${locked ? ' locked' : ''}`,
      children: [
        jsxs('div', {
          className: 'activity-dig-grid',
          children: Array.from({ length: cellCount }, (_, index) =>
            jsx(
              'button',
              {
                className: `activity-dig-cell${
                  digCells[index] === 1 ? ' dug' : digCells[index] === 2 ? ' treasure' : ''
                }`,
                disabled: locked || digCells[index] !== 0,
                onClick: () => digAt(index),
                'aria-label': `Dig hole ${index + 1}`,
                children:
                  digCells[index] === 2
                    ? '\u{1f4b0}'
                    : digCells[index] === 1
                      ? '\u{1faa8}'
                      : '\u26cf\ufe0f',
              },
              index
            )
          ),
        }),
        jsx('div', {
          className: 'activity-dig-tries',
          children: `Holes dug: ${digTries} / ${ACTIVITY_DIG_TRIES}`,
        }),
      ],
    })
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
            : renderMechanic(),
          message && jsx('div', { className: 'activity-message', children: message }),
          activity.id === 'forage' &&
            combo > 0 &&
            jsx('div', { className: 'activity-combo', children: `Berry combo x${combo}` }),
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
          stage === 'aiming' && SWEEP_DISPLAYS.has(activity.display)
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
            : stage === 'aiming' || stage === 'reel'
              ? jsx('div', {
                  className: 'activity-actions',
                  children: [
                    stage === 'reel' &&
                      jsx('button', {
                        className: 'move-panel-btn confirm',
                        onClick: reelStop,
                        children: 'REEL IN',
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
