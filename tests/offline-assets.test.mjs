import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { installGameData } from './helpers/game-data.mjs'

installGameData()
// Emulate the browser injector exposing the data URLs it loaded.
// @ts-ignore -- the Node helper's window stub does not declare `paths`.
window.gameDataInjector.paths = ['/data/pokemon-species.json', '/data/regions.json']

const { OFFLINE_CACHE, collectAppShellAssets, collectOfflineAssets, offlineAvailable } =
  await import('../src/game/offline.js')
const { pokemonSpecies } = await import('../src/data/gameData.js')

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicPath = (/** @type {string} */ url) => join(ROOT, 'public', url)

test('offline cache name matches the service worker constant', () => {
  // Keep in sync with public/sw.js; a mismatch would silently split the cache.
  assert.equal(OFFLINE_CACHE, 'pokemon-idle-offline-v1')
  const worker = readFileSync(join(ROOT, 'public', 'sw.js'), 'utf8')
  assert.match(worker, new RegExp(`OFFLINE_CACHE = '${OFFLINE_CACHE}'`))
})

test('offline play is unavailable under the Node test environment', () => {
  assert.equal(offlineAvailable(), false)
})

test('the app shell includes the injected data URLs and shared pages', () => {
  const shell = collectAppShellAssets()
  assert.ok(shell.includes('/index.html'))
  assert.ok(shell.includes('/data/pokemon-species.json'))
  assert.ok(shell.includes('/data/regions.json'))
  assert.ok(shell.includes('/guide.html'))
})

test('the full manifest covers every sprite variant the game can request', () => {
  const assets = collectOfflineAssets()
  assert.ok(assets.length > 5000, `expected a large manifest, got ${assets.length}`)
  for (const url of [
    '/sprites/pokemon/25.png',
    '/sprites/pokemon/back/25.png',
    '/sprites/pokemon/shiny/25.png',
    '/sprites/pokemon/back/shiny/25.png',
    '/sprites/pokemon/egg.png',
    '/sprites/pokemon/versions/generation-v/black-white/animated/25.gif',
  ]) {
    assert.ok(assets.includes(url), `manifest is missing ${url}`)
  }
  assert.equal(new Set(assets).size, assets.length, 'manifest has duplicate URLs')
})

test('static sprites are complete per species, or absent for the whole id', () => {
  // A handful of ids legitimately have no art at all (e.g. Mega Zygarde), and
  // the game falls back to a placeholder for those. A *partial* set, though,
  // means a form was added without regenerating all of its variants.
  const partial = []
  for (const species of Object.values(pokemonSpecies)) {
    if (!species || typeof species.id !== 'number') continue
    const files = [
      `/sprites/pokemon/${species.id}.png`,
      `/sprites/pokemon/back/${species.id}.png`,
      `/sprites/pokemon/shiny/${species.id}.png`,
      `/sprites/pokemon/back/shiny/${species.id}.png`,
    ]
    const present = files.map((url) => existsSync(publicPath(url)))
    if (present.some(Boolean) && !present.every(Boolean)) partial.push(species.id)
  }
  assert.deepEqual(partial, [], 'some species have a partial static sprite set')
})

test('every enumerated item, trainer and backdrop file exists on disk', () => {
  const missing = collectOfflineAssets()
    .filter(
      (url) =>
        url.startsWith('/sprites/items/') ||
        url.startsWith('/sprites/trainers/') ||
        url.startsWith('/backgrounds/')
    )
    .filter((url) => !existsSync(publicPath(url)))
  assert.deepEqual(missing, [], 'manifest points at missing files')
})
