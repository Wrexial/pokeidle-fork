// Offline play support. The game has no backend, so caching every static file
// it can request is enough to run with no network at all. This module
// enumerates those files from the loaded game data and warms the shared Cache
// Storage bucket that `public/sw.js` serves from.
//
// Keep OFFLINE_CACHE in sync with public/sw.js.

import {
  championData,
  elite4Data,
  genderedSprites,
  gymLeaderData,
  itemIcons,
  pokemonSpecies,
  trainerClasses,
} from '../data/gameData.js'
import { BIOME_SCENE_IMAGES, locationImages } from '../data/ui.js'

/** Shared cache name. Must match public/sw.js. */
export const OFFLINE_CACHE = 'pokemon-idle-offline-v2'

/** Marks a request the page will store itself (the worker must not). */
export const OFFLINE_PREFETCH_HEADER = 'x-offline-prefetch'

const POKEMON_SPRITE_ROOT = '/sprites/pokemon'
const ANIMATED_SPRITE_PREFIX =
  '/sprites/pokemon/versions/generation-v/black-white/animated'

/**
 * The animated gif set is never part of the offline cache (offline play uses
 * the static art), wherever a URL comes from -- the explicit manifest or the
 * files this session happened to load.
 * @param {string} path
 */
function isAnimatedSpritePath(path) {
  return path.startsWith(ANIMATED_SPRITE_PREFIX)
}

/** App pages and shared files every session needs. */
const SHELL_FILES = [
  '/',
  '/index.html',
  '/guide.html',
  '/reference.html',
  '/encounter-index.html',
  '/heal-animation-web.mp4',
  '/sprites/pokemon/egg.png',
]

/** The battle backdrops checked into public/backgrounds. */
const BACKGROUND_FILES = [
  '/backgrounds/autumn.jpeg',
  '/backgrounds/beach.png',
  '/backgrounds/cave.png',
  '/backgrounds/desert.jpeg',
  '/backgrounds/forest.jpeg',
  '/backgrounds/grassland.png',
  '/backgrounds/mountain.png',
  '/backgrounds/ruins.jpeg',
  '/backgrounds/swamp.jpeg',
  '/backgrounds/town.png',
  '/backgrounds/town_port.png',
  '/backgrounds/tundra.jpeg',
  '/backgrounds/volcano.jpeg',
]

// vite replaces import.meta.env at build time; under Node it is undefined.
const IS_DEV = Boolean(import.meta.env && import.meta.env.DEV)

/** Is the Cache Storage + service worker API available? */
export function offlineSupported() {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof caches !== 'undefined'
  )
}

/**
 * Offline play needs a real service worker, which the Vite dev server cannot
 * serve reliably (it streams per-module requests for HMR). The built app is
 * the supported target.
 */
export function offlineAvailable() {
  return offlineSupported() && !IS_DEV
}

/** @type {Promise<ServiceWorkerRegistration | null> | null} */
let registrationPromise = null

/** Throttle update checks so tab switches do not spam the network. */
let lastUpdateCheck = 0

/**
 * Register the offline worker. Resolves to null when unsupported.
 *
 * `updateViaCache: 'none'` plus an explicit `update()` means a changed sw.js is
 * picked up promptly instead of sitting in the HTTP cache for up to a day.
 * When a newer worker replaces the one that loaded the page we remember it, and
 * a backgrounded tab reloads into the new build by itself, so updates land
 * without the player ever refreshing by hand.
 */
export function registerServiceWorker() {
  if (!offlineSupported()) return Promise.resolve(null)
  if (!registrationPromise) {
    const hadController = Boolean(navigator.serviceWorker.controller)
    let updatePending = false

    const checkForUpdate = () => {
      const now = Date.now()
      if (now - lastUpdateCheck < 60_000) return
      lastUpdateCheck = now
      navigator.serviceWorker.ready
        .then((registration) => registration.update())
        .catch(() => {})
    }

    const reloadWhenBackgrounded = () => {
      if (
        updatePending &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        window.location.reload()
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Ignore the very first worker claiming the page; only a *replacement*
      // worker means a newer build is ready.
      if (!hadController) return
      updatePending = true
      reloadWhenBackgrounded()
    })

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
        else reloadWhenBackgrounded()
      })
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', checkForUpdate)
    }

    registrationPromise = navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        registration.update().catch(() => {})
        return registration
      })
      .catch(() => null)
  }
  return registrationPromise
}

/**
 * Register the worker and wait until it is active and ready to serve, asking
 * the browser to keep the cache instead of evicting it.
 */
export async function ensureOfflineCaches() {
  if (!offlineSupported())
    throw new Error('This browser cannot store offline files.')
  const registration = await registerServiceWorker()
  if (!registration)
    throw new Error('Could not start the offline service worker.')
  await navigator.serviceWorker.ready
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Persistence is best-effort; the cache still works without it.
  }
  return registration
}

/** Data JSON URLs the injector loaded (populated by assets/gameDataInjector.js). */
function dataFilePaths() {
  const paths = /** @type {any} */ (globalThis.window)?.gameDataInjector?.paths
  return Array.isArray(paths) ? paths : []
}

/** Same-origin files this session has already fetched (bundled JS/CSS, fonts, ...). */
function collectLoadedAssetPaths() {
  const urls = new Set()
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return urls
  if (typeof location === 'undefined') return urls
  for (const entry of performance.getEntriesByType('resource')) {
    try {
      const url = new URL(entry.name)
      if (url.origin === location.origin && !isAnimatedSpritePath(url.pathname))
        urls.add(url.pathname)
    } catch {
      // Ignore malformed performance entries.
    }
  }
  return urls
}

/** Named trainer sprites (gym leaders, Elite Four, Champions). */
function bossSpriteKeys() {
  const keys = new Set()
  for (const list of [gymLeaderData, elite4Data, championData]) {
    if (!Array.isArray(list)) continue
    for (const entry of list) {
      if (entry && typeof entry.spriteKey === 'string' && entry.spriteKey) {
        keys.add(entry.spriteKey)
      }
    }
  }
  return [...keys]
}

/**
 * Every static sprite variant a species id can resolve to (see
 * `getPokemonSpriteUrl` in src/game/pokemon/sprites.js).
 *
 * The animated gif set (~440 MB) is deliberately left out: offline play uses
 * the static art, so prefetching it would dwarf the rest of the cache.
 * @param {Set<string>} urls
 * @param {number} id
 */
function addPokemonSpriteUrls(urls, id) {
  const key = Number(id)
  if (!Number.isFinite(key)) return
  urls.add(`${POKEMON_SPRITE_ROOT}/${key}.png`)
  urls.add(`${POKEMON_SPRITE_ROOT}/back/${key}.png`)
  urls.add(`${POKEMON_SPRITE_ROOT}/shiny/${key}.png`)
  urls.add(`${POKEMON_SPRITE_ROOT}/back/shiny/${key}.png`)
  if (genderedSprites.front?.includes(key))
    urls.add(`${POKEMON_SPRITE_ROOT}/female/${key}.png`)
  if (genderedSprites.back?.includes(key))
    urls.add(`${POKEMON_SPRITE_ROOT}/back/female/${key}.png`)
  if (genderedSprites.shiny?.includes(key))
    urls.add(`${POKEMON_SPRITE_ROOT}/shiny/female/${key}.png`)
  if (genderedSprites.backShiny?.includes(key))
    urls.add(`${POKEMON_SPRITE_ROOT}/back/shiny/female/${key}.png`)
}

/**
 * The small set needed to boot and start a save offline: the app shell, its
 * data, and whatever this session already loaded.
 * @returns {string[]}
 */
export function collectAppShellAssets() {
  const urls = new Set(SHELL_FILES)
  for (const path of dataFilePaths()) urls.add(path)
  for (const path of collectLoadedAssetPaths()) urls.add(path)
  return [...urls].sort()
}

/**
 * Every static asset the game can request, ready to prefetch for offline play.
 * The animated sprites are excluded on purpose (see `addPokemonSpriteUrls`).
 * @returns {string[]}
 */
export function collectOfflineAssets() {
  const urls = new Set(collectAppShellAssets())
  const speciesIds = new Set()
  for (const species of Object.values(pokemonSpecies)) {
    if (species && typeof species.id === 'number') speciesIds.add(species.id)
  }
  for (const id of speciesIds) addPokemonSpriteUrls(urls, id)
  for (const file of Object.values(itemIcons)) {
    if (file) urls.add(`/sprites/items/${file}`)
  }
  for (const file of Object.values(trainerClasses)) {
    if (file) urls.add(`/sprites/trainers/${file}.png`)
  }
  for (const key of bossSpriteKeys()) urls.add(`/sprites/trainers/${key}.png`)
  for (const file of BACKGROUND_FILES) urls.add(file)
  for (const map of [locationImages, BIOME_SCENE_IMAGES]) {
    for (const file of Object.values(map)) {
      if (file && file.startsWith('/')) urls.add(file)
    }
  }
  return [...urls].sort()
}

/**
 * Rough per-file byte averages by asset group. The offline set is dominated by
 * the animated sprites (~80 KB each) and the painted backdrops (~4 MB each), so
 * a count x average estimate lands within a few percent without probing every
 * file. Regenerate these if the art pipeline changes noticeably.
 * @type {Record<string, number>}
 */
const AVERAGE_BYTES = {
  animated: 80 * 1024,
  pokemon: 2 * 1024,
  items: 2 * 1024,
  trainers: 1 * 1024,
  backgrounds: 1200 * 1024,
  shell: 200 * 1024,
}

/** @param {string} url */
function offlineAssetGroup(url) {
  if (url.startsWith('/sprites/pokemon/versions/')) return 'animated'
  if (url.startsWith('/sprites/pokemon/')) return 'pokemon'
  if (url.startsWith('/sprites/items/')) return 'items'
  if (url.startsWith('/sprites/trainers/')) return 'trainers'
  if (url.startsWith('/backgrounds/')) return 'backgrounds'
  return 'shell'
}

/**
 * A rough size in bytes of the offline cache for a set of asset URLs (defaults
 * to the full manifest). Used to warn how much data a download will use before
 * the player starts it.
 * @param {string[]} [urls]
 */
export function estimateOfflineBytes(urls = collectOfflineAssets()) {
  let total = 0
  for (const url of urls) total += AVERAGE_BYTES[offlineAssetGroup(url)] ?? AVERAGE_BYTES.shell
  return total
}

/**
 * @typedef {Object} OfflineProgress
 * @property {number} total
 * @property {number} done
 * @property {number} downloaded
 * @property {number} skipped
 * @property {number} failed
 * @property {number} bytes
 * @property {string} current
 */

/**
 * Store a list of URLs in the offline cache, skipping anything already there.
 * Fetched with the prefetch header so the service worker hands the response
 * back untouched and this function owns the cache write.
 * @param {string[]} urls
 * @param {(progress: OfflineProgress) => void} [onProgress]
 * @param {{ signal?: AbortSignal }} [options]
 */
async function cacheAssetUrls(urls, onProgress = () => {}, options = {}) {
  const cache = await caches.open(OFFLINE_CACHE)
  const total = urls.length
  let done = 0
  let downloaded = 0
  let skipped = 0
  let failed = 0
  let bytes = 0
  let nextIndex = 0
  const report = (/** @type {string} */ current) =>
    onProgress({ total, done, downloaded, skipped, failed, bytes, current })
  report('')
  const workerCount = Math.max(1, Math.min(8, total))
  async function worker() {
    while (nextIndex < total) {
      if (options.signal?.aborted) return
      const url = urls[nextIndex++]
      try {
        if (await cache.match(url)) {
          skipped += 1
        } else {
          const response = await fetch(url, {
            headers: { [OFFLINE_PREFETCH_HEADER]: '1' },
            signal: options.signal,
          })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          bytes += Number(response.headers.get('content-length')) || 0
          await cache.put(url, response)
          downloaded += 1
        }
      } catch {
        if (options.signal?.aborted) return
        failed += 1
      }
      done += 1
      report(url)
    }
  }
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
  report('')
  return { total, done, downloaded, skipped, failed, bytes }
}

/**
 * Download the whole asset set for offline play, reporting progress as it goes.
 * @param {(progress: OfflineProgress) => void} [onProgress]
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function downloadOfflineAssets(onProgress, options = {}) {
  await ensureOfflineCaches()
  return cacheAssetUrls(collectOfflineAssets(), onProgress, options)
}

/**
 * Quietly warm the boot-essential files in the background so the game still
 * opens offline after a normal visit (before the player uses the full button).
 */
export async function precacheAppShell(options = {}) {
  if (!offlineAvailable()) return null
  await ensureOfflineCaches()
  return cacheAssetUrls(collectAppShellAssets(), () => {}, options)
}

/** Cache usage summary for the settings panel. */
export async function getOfflineSummary() {
  if (typeof caches === 'undefined') {
    return { supported: false, controlled: false, count: 0, bytes: 0, quota: 0 }
  }
  const cache = await caches.open(OFFLINE_CACHE)
  const keys = await cache.keys()
  let bytes = 0
  let quota = 0
  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      bytes = estimate.usage ?? 0
      quota = estimate.quota ?? 0
    }
  } catch {
    // Storage estimates are optional.
  }
  return {
    supported: offlineSupported(),
    controlled: Boolean(navigator.serviceWorker?.controller),
    count: keys.length,
    bytes,
    quota,
  }
}

/** Drop every cached offline file (the save is untouched). */
export async function clearOfflineAssets() {
  if (typeof caches === 'undefined') return false
  return caches.delete(OFFLINE_CACHE)
}
