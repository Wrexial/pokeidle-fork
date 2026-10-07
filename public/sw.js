/*
 * Pokémon Idle offline service worker.
 *
 * The game is a purely client-side app: all of its content is static JSON and
 * image files under /data, /sprites, /backgrounds and /assets. Caching those
 * is all it takes to play with no network at all.
 *
 * Strategy:
 *   - HTML navigations and /data JSON are network-first, falling back to the
 *     cache, so a new deployment (or regenerated data) is picked up while
 *     online but the game still boots offline.
 *   - Everything else (sprites, backgrounds, fonts, hashed JS/CSS) is
 *     cache-first, because those files are effectively immutable. The animated
 *     gif set is the exception: it is never persisted (see below).
 *
 * The page owns the cache during a "Download for offline play" run: it sends
 * requests tagged with `x-offline-prefetch: 1`, which this worker passes
 * straight to the network so the page can store the response itself.
 *
 * The animated sprite set (~440 MB) is not part of the offline download, and
 * offline play falls back to the static art, so it is served network-only and
 * never written to the cache.
 *
 * Keep OFFLINE_CACHE in sync with src/game/offline.js.
 */

const OFFLINE_CACHE = 'pokemon-idle-offline-v2'
const CACHE_PREFIX = 'pokemon-idle-offline-'
const PREFETCH_HEADER = 'x-offline-prefetch'
const ANIMATED_SPRITE_PREFIX =
  '/sprites/pokemon/versions/generation-v/black-white/animated'

/**
 * The animated gifs are large and only used online (offline play is static), so
 * they bypass the cache entirely.
 * @param {URL} url
 */
function isAnimatedSprite(url) {
  return url.pathname.startsWith(ANIMATED_SPRITE_PREFIX)
}

/** Is this a same-origin GET worth caching? @param {Request} request */
function isCacheableRequest(request) {
  if (request.method !== 'GET') return false
  const url = new URL(request.url)
  return url.origin === self.location.origin
}

/**
 * Small, volatile resources that should prefer the network while online so a
 * reload always gets the latest build and the latest game data.
 * @param {URL} url
 */
function isNetworkFirst(url) {
  if (url.pathname.startsWith('/data/')) return true
  if (url.pathname.endsWith('.html')) return true
  if (url.pathname === '/') return true
  return false
}

self.addEventListener('install', () => {
  // Take over as soon as the page lets us instead of waiting for every tab.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== OFFLINE_CACHE)
          .map((name) => caches.delete(name))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (!isCacheableRequest(request)) return

  const url = new URL(request.url)

  // Page-driven download: always hit the network, the page stores the result.
  if (request.headers.get(PREFETCH_HEADER) === '1') {
    event.respondWith(
      fetch(request).catch(
        () => new Response('', { status: 503, statusText: 'Offline' })
      )
    )
    return
  }

  // Navigations: network first (fresh build), cached shell as the fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          if (fresh && fresh.ok) {
            // Caching is best effort: a write failure (e.g. a full cache) must
            // never change the response the page gets.
            const cache = await caches.open(OFFLINE_CACHE).catch(() => null)
            if (cache) {
              cache.put(request, fresh.clone()).catch(() => {})
              if (url.pathname === '/' || url.pathname === '/index.html') {
                cache.put('/index.html', fresh.clone()).catch(() => {})
              }
            }
          }
          return fresh
        } catch {
          const cache = await caches.open(OFFLINE_CACHE).catch(() => null)
          return (
            (cache && (await cache.match(request).catch(() => null))) ||
            (cache && (await cache.match('/index.html').catch(() => null))) ||
            (cache && (await cache.match('/').catch(() => null))) ||
            new Response('Offline', { status: 503, statusText: 'Offline' })
          )
        }
      })()
    )
    return
  }

  // Game data and HTML pages: network first, cache fallback.
  if (isNetworkFirst(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(OFFLINE_CACHE).catch(() => null)
        const cached = cache ? await cache.match(request).catch(() => null) : null
        try {
          const fresh = await fetch(request)
          if (fresh && fresh.ok && cache) cache.put(request, fresh.clone()).catch(() => {})
          return fresh
        } catch {
          return (
            cached ||
            (cache && (await cache.match(request, { ignoreSearch: true }).catch(() => null))) ||
            new Response('Offline', { status: 503, statusText: 'Offline' })
          )
        }
      })()
    )
    return
  }

  // Static assets: cache first, then network (storing what we fetch).
  event.respondWith(
    (async () => {
      // Animated sprites are served straight from the network / HTTP cache and
      // never stored; offline play uses the static art instead.
      if (isAnimatedSprite(url)) return fetch(request)
      const cache = await caches.open(OFFLINE_CACHE).catch(() => null)
      const cached = cache ? await cache.match(request).catch(() => null) : null
      if (cached) return cached
      // Range requests (media seeking) cannot be stored; pass them through.
      if (request.headers.has('range')) return fetch(request)
      try {
        const fresh = await fetch(request)
        if (fresh && fresh.ok && fresh.type === 'basic' && cache) {
          cache.put(request, fresh.clone()).catch(() => {})
        }
        return fresh
      } catch {
        return new Response('Offline', { status: 503, statusText: 'Offline' })
      }
    })()
  )
})
