// Cross-cutting UI hooks (typewriter, mobile layout, daily refresh, audio,
// notifications). The game loop lives in game/use-game-loop.js.

import React from 'react'
import { MOBILE_BREAKPOINT, MOBILE_HEIGHT_BREAKPOINT } from './data/ui.js'
import { mapData } from './data/gameData.js'
import { useGame } from './game/context.js'
import { playSfx, startMusic, stopMusic, unlockAudio } from './game/audio.js'
import { awaySummary } from './game/progression.js'
import { dayPhaseAt, msUntilPhaseChange } from './game/day-night.js'
import { seasonAt, msUntilSeasonChange } from './game/seasons.js'
import { effectiveWeatherAt, msUntilWeatherChange } from './game/weather.js'
import { isOnline, subscribeOnline } from './game/network.js'

/**
 * The current day/night phase, re-rendering only when the phase changes.
 * @returns {ReturnType<typeof dayPhaseAt>}
 */
export function useDayPhase() {
  const [phase, setPhase] = React.useState(() => dayPhaseAt())
  React.useEffect(() => {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer
    const schedule = () => {
      const next = dayPhaseAt()
      // Only re-render when the phase actually changes.
      setPhase((current) => (current.id === next.id ? current : next))
      // A small guard so the timer never fires just before the boundary.
      timer = setTimeout(schedule, msUntilPhaseChange() + 50)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])
  return phase
}

/**
 * The current season, re-rendering only when the season changes. One season is
 * four in-game days (four real hours) — see src/game/seasons.js.
 * @returns {ReturnType<typeof seasonAt>}
 */
export function useSeason() {
  const [season, setSeason] = React.useState(() => seasonAt())
  React.useEffect(() => {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer
    const schedule = () => {
      const next = seasonAt()
      // Only re-render when the season actually changes.
      setSeason((current) => (current.id === next.id ? current : next))
      timer = setTimeout(schedule, msUntilSeasonChange() + 50)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])
  return season
}

/**
 * The world weather at the player's current location, re-rendering only when it
 * changes (every 15 real minutes). Null means clear.
 * @returns {{ type: string | null }}
 */
export function useWorldWeather() {
  const { state } = useGame(),
    location = mapData[state.currentLocation],
    [weather, setWeather] = React.useState(() =>
      effectiveWeatherAt(location, state.lingeringWeather)
    )
  React.useEffect(() => {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer
    const schedule = () => {
      const current = mapData[state.currentLocation],
        next = effectiveWeatherAt(current, state.lingeringWeather)
      setWeather((previous) => (previous === next ? previous : next))
      timer = setTimeout(schedule, msUntilWeatherChange() + 500)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [state.currentLocation, state.lingeringWeather])
  return { type: weather }
}

/**
 * Whether the browser currently has a network connection. Offline play uses the
 * static sprites, so this re-renders the app when the connection changes.
 * @returns {boolean}
 */
export function useOnlineStatus() {
  const [online, setOnline] = React.useState(isOnline())
  return (
    React.useEffect(
      () => subscribeOnline(() => setOnline(isOnline())),
      []
    ),
    online
  )
}

/**
 * @param {string} text
 * @param {number} [speed]
 * @returns {{ displayed: string, isComplete: boolean }}
 */
export function useTypewriter(text, speed = 30) {
  const [displayed, setDisplayed] = React.useState(''),
    [isComplete, setIsComplete] = React.useState(!1),
    indexRef = React.useRef(0)
  return (
    React.useEffect(() => {
      if ((setDisplayed(''), setIsComplete(!1), (indexRef.current = 0), !text)) {
        setIsComplete(!0)
        return
      }
      const intervalId = setInterval(() => {
        ;(indexRef.current++,
          indexRef.current >= text.length
            ? (setDisplayed(text), setIsComplete(!0), clearInterval(intervalId))
            : setDisplayed(text.slice(0, indexRef.current)))
      }, speed)
      return () => clearInterval(intervalId)
    }, [text, speed]),
    {
      displayed,
      isComplete,
    }
  )
}


export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
      () =>
        window.innerWidth < MOBILE_BREAKPOINT ||
        window.innerHeight < MOBILE_HEIGHT_BREAKPOINT
    )
  return (
    React.useEffect(() => {
      const mediaQuery = window.matchMedia(
          `(max-width: ${MOBILE_BREAKPOINT - 1}px), (max-height: ${MOBILE_HEIGHT_BREAKPOINT - 1}px)`
        ),
        handleChange = /** @param {MediaQueryListEvent} event */ (event) => setIsMobile(event.matches)
      return (
        mediaQuery.addEventListener('change', handleChange),
        () => mediaQuery.removeEventListener('change', handleChange)
      )
    }, []),
    isMobile
  )
}

// Classic Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

/**
 * Debug cheat: calls `onUnlock` when the Konami code is typed. Keys are matched
 * case-insensitively and any wrong key restarts the sequence (a stray repeat of
 * the first key just keeps the attempt alive).
 * @param {() => void} onUnlock
 */
export function useKonamiCode(onUnlock) {
  const progressRef = React.useRef(0),
    onUnlockRef = React.useRef(onUnlock)
  React.useEffect(() => {
    onUnlockRef.current = onUnlock
  })
  return React.useEffect(() => {
    const handleKeyDown = /** @param {KeyboardEvent} event */ (event) => {
      const target = /** @type {HTMLElement | null} */ (event.target)
      if (
        event.repeat ||
        (target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable))
      )
        return
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      if (key === KONAMI_CODE[progressRef.current]) {
        progressRef.current += 1
        if (progressRef.current === KONAMI_CODE.length) {
          progressRef.current = 0
          onUnlockRef.current()
        }
        return
      }
      progressRef.current = key === KONAMI_CODE[0] ? 1 : 0
    }
    return (
      window.addEventListener('keydown', handleKeyDown),
      () => window.removeEventListener('keydown', handleKeyDown)
    )
  }, [])
}

/**
 * Keep the daily event in sync with the real calendar day: rolls today's event
 * on mount and checks again every minute (so it refreshes at local midnight,
 * even if the tab stays open).
 */
export function useDailyEvent() {
  const { dispatch } = useGame()
  return React.useEffect(() => {
    const refresh = () => dispatch({ type: 'REFRESH_DAILY_EVENT' })
    refresh()
    const intervalId = setInterval(refresh, 60_000)
    return () => clearInterval(intervalId)
  }, [dispatch])
}

/**
 * Mirror important in-game toasts to a browser notification while the tab is
 * hidden (opt-in from Settings). Info-only toasts are skipped so the alerts
 * stay meaningful; the first observed toast just sets the baseline.
 */
export function useBrowserNotifications() {
  const { state } = useGame(),
    lastSeenRef = React.useRef(/** @type {number | null} */ (null))
  return React.useEffect(() => {
    const lastNotification = state.notifications[state.notifications.length - 1]
    if (!lastNotification) return
    const previousId = lastSeenRef.current
    lastSeenRef.current = lastNotification.id
    if (!state.browserNotifications || previousId === null) return
    if (!document.hidden) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    /** @param {string | null | undefined} kind */
    const kindEnabled = (kind) =>
      kind === 'shiny'
        ? state.notifyShiny
        : kind === 'rare'
          ? state.notifyRare
          : kind === 'egg'
            ? state.notifyEgg
            : true
    const fresh = state.notifications
      .filter(
        (notification) =>
          notification.id > previousId &&
          notification.tone !== 'info' &&
          kindEnabled(notification.kind)
      )
      .slice(-3)
    for (const notification of fresh)
      new Notification('Pokemon Idle', {
        body: `${notification.icon ? `${notification.icon} ` : ''}${notification.message}`,
        tag: notification.dedupeKey ?? `pokemon-idle:${notification.id}`,
      })
  }, [state.notifications, state.browserNotifications, state.notifyShiny, state.notifyRare, state.notifyEgg])
}

/**
 * Show a "while you were away" summary toast when the player returns after the
 * tab has been hidden for a while. The idle loop keeps running in a background
 * tab (throttled), so the summary reflects real progress.
 */
export function useAwayAlert() {
  const { state, dispatch } = useGame(),
    stateRef = React.useRef(state)
  React.useEffect(() => {
    stateRef.current = state
  }, [state])
  return React.useEffect(() => {
    const AWAY_THRESHOLD_MS = 30_000
    let hiddenAt = 0,
      snapshot = /** @type {GameState | null} */ (null)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        snapshot = stateRef.current
        return
      }
      const awayMs = hiddenAt ? Date.now() - hiddenAt : 0
      hiddenAt = 0
      if (!snapshot || awayMs < AWAY_THRESHOLD_MS) {
        snapshot = null
        return
      }
      const summary = awaySummary(snapshot, stateRef.current)
      snapshot = null
      summary &&
        dispatch({
          type: 'PUSH_NOTIFICATION',
          payload: {
            message: summary,
            tone: 'info',
            icon: '🌙',
            dedupeKey: `away:${Date.now()}`,
          },
        })
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [dispatch])
}

/**
 * Reflect the accessibility display preferences onto the document root so the
 * stylesheet can react (reduced motion, colourblind-friendly move labels).
 */
export function useAccessibilitySettings() {
  const { state } = useGame()
  return React.useEffect(() => {
    const root = document.documentElement
    root.dataset.reducedMotion = state.reducedMotion ? 'true' : 'false'
    root.dataset.colourblindTypes = state.colourblindTypes ? 'true' : 'false'
    root.dataset.largeText = state.largeText ? 'true' : 'false'
  }, [state.reducedMotion, state.colourblindTypes, state.largeText])
}

/**
 * Play the synthesized region theme and event sound effects when the matching
 * setting is on. Music switches as the player travels; effects are driven by
 * toasts, phase changes and level-ups. Silent (and free) while audio is off.
 */
export function useGameAudio() {
  const { state } = useGame(),
    lastNotificationRef = React.useRef(/** @type {number | null} */ (null)),
    lastPhaseRef = React.useRef(state.phase),
    lastLevelUpRef = React.useRef(state.levelUpNotification)
  return (
    React.useEffect(() => {
      // Browsers only allow audio after a user gesture; resume on the first one.
      if (!state.musicEnabled && !state.sfxEnabled) return
      const unlock = () => unlockAudio()
      window.addEventListener('pointerdown', unlock, { once: true })
      window.addEventListener('keydown', unlock, { once: true })
      return () => {
        window.removeEventListener('pointerdown', unlock)
        window.removeEventListener('keydown', unlock)
      }
    }, [state.musicEnabled, state.sfxEnabled]),
    React.useEffect(() => {
      if (!state.musicEnabled) {
        stopMusic()
        return
      }
      startMusic(mapData[state.currentLocation]?.region ?? state.startRegion ?? 'kanto')
    }, [state.musicEnabled, state.currentLocation, state.startRegion]),
    React.useEffect(() => () => stopMusic(), []),
    React.useEffect(() => {
      const latest = state.notifications[state.notifications.length - 1]
      if (!latest) return
      const previous = lastNotificationRef.current
      lastNotificationRef.current = latest.id
      if (!state.sfxEnabled || previous === null) return
      for (const notification of state.notifications.filter((entry) => entry.id > previous)) {
        if (notification.tone === 'shiny') playSfx('shiny')
        else if (notification.tone === 'success') playSfx('notify')
      }
    }, [state.notifications, state.sfxEnabled]),
    React.useEffect(() => {
      const previous = lastPhaseRef.current
      lastPhaseRef.current = state.phase
      if (!state.sfxEnabled || previous === state.phase) return
      if (state.phase === 'evolving') playSfx('evolution')
      else if (state.phase === 'healing') playSfx('heal')
      else if (state.phase === 'catching') playSfx('catch')
      else if (state.phase === 'dexComplete') playSfx('dexComplete')
    }, [state.phase, state.sfxEnabled]),
    React.useEffect(() => {
      const current = state.levelUpNotification,
        previous = lastLevelUpRef.current
      lastLevelUpRef.current = current
      if (state.sfxEnabled && current && current !== previous) playSfx('levelUp')
    }, [state.levelUpNotification, state.sfxEnabled])
  )
}

/**
 * Roll today's daily quests on mount and refresh them at local midnight (the
 * reducer only re-rolls when the calendar day changes).
 */
export function useQuests() {
  const { dispatch } = useGame()
  return React.useEffect(() => {
    const refresh = () => dispatch({ type: 'REFRESH_QUESTS' })
    refresh()
    const intervalId = setInterval(refresh, 60_000)
    return () => clearInterval(intervalId)
  }, [dispatch])
}

/**
 * Keep the screen awake while the game is open (the Screen Wake Lock API), so a
 * phone or tablet doesn't dim and sleep mid-battle. Browsers drop the lock
 * whenever the tab is hidden and may refuse it entirely (unsupported browser,
 * insecure origin, battery saver), so it is re-requested on `visibilitychange`
 * and every failure is ignored.
 */
export function useScreenWakeLock() {
  React.useEffect(() => {
    const wakeLock = /** @type {any} */ (navigator).wakeLock
    if (!wakeLock?.request) return
    /** @type {any} */
    let sentinel = null
    let cancelled = false
    const request = async () => {
      if (cancelled || document.visibilityState !== 'visible') return
      // The browser already released the previous lock (or none was taken yet).
      if (sentinel && !sentinel.released) return
      try {
        sentinel = await wakeLock.request('screen')
        if (cancelled) sentinel.release().catch(() => {})
      } catch {
        // Refused (backgrounded, low battery, permission): try again the next
        // time the tab becomes visible.
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') request()
    }
    request()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (sentinel && !sentinel.released) sentinel.release().catch(() => {})
    }
  }, [])
}
