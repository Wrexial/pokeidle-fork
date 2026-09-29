#!/usr/bin/env node
/**
 * Reconcile `statChange` move effects in possible-moves.json with Pokemon
 * Showdown's move table.
 *
 * `convert_moves.py` builds stat changes by substring-matching the scraped
 * description, which is wrong in several systematic ways:
 *   - "Special Attack" contains "attack" and "Special Defense" contains
 *     "defense", so special moves also got a bogus physical-stat entry
 *     (Nasty Plot raised Special Attack *and* Attack, Calm Mind added
 *     Attack + Defense, ...).
 *   - A description without a "user's"/"target's" keyword defaulted to the
 *     opponent (Howl, Autotomize, Power-Up Punch, Stuff Cheeks, Skull Bash
 *     buffed the foe) and a "-2"/"-3" magnitude was read as -1 (Shell Smash's
 *     drops, Lumina Crash, Tail Glow).
 *
 * Showdown's `moves.json` stores `boosts` (applied to the move's target),
 * `self`/`selfBoost` (applied to the user) and `secondary` (a 100% added
 * effect), so it can tell the two apart — which PokeAPI's `stat_changes`
 * cannot for self-dropping attacks like Overheat. Responses are cached under
 * tools/cache/ (gitignored), so re-running is offline and idempotent.
 *
 * A handful of moves whose boosts Showdown implements in script (Belly Drum,
 * the Max/G-Max moves, Rototiller, ...) are covered by STAT_OVERRIDES.
 *
 * Usage: node tools/fix-stat-changes.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')
const https = require('https')

const DATA = path.join(__dirname, '../public/data')
const CACHE = path.join(__dirname, 'cache')
const MOVES_PATH = path.join(DATA, 'possible-moves.json')
const SHOWDOWN_PATH = path.join(CACHE, 'showdown-moves.json')

const DRY = process.argv.includes('--dry')

// Showdown's short stat keys -> the hyphenated keys the data/engine use.
const STAT_KEY_MAP = {
  atk: 'attack',
  def: 'defense',
  spa: 'special-attack',
  spd: 'special-defense',
  spe: 'speed',
  accuracy: 'accuracy',
  evasion: 'evasiveness',
}

// Showdown targets whose primary boosts land on the user. Ally-targeting buffs
// (Howl, Aromatic Mist, Coaching) are treated as self-buffs because the engine
// only runs single battles — the same convention as Life Dew.
const SELF_TARGETS = new Set(['self', 'allies', 'allySide', 'allyTeam', 'all', 'adjacentAlly'])

// Moves Showdown implements in script rather than as a plain `boosts` block.
// `changes` uses the data's hyphenated keys; `remove` drops the extracted
// effect entirely (the move has no stat change in the real games).
const STAT_OVERRIDES = {
  bellyDrum: { target: 'self', changes: { attack: 6 } },
  fellStinger: { target: 'self', changes: { attack: 3 } },
  flowerShield: { target: 'self', changes: { defense: 1 } },
  gMaxFoamBurst: { target: 'opponent', changes: { speed: -1 } },
  magneticFlux: { target: 'self', changes: { defense: 1, 'special-defense': 1 } },
  maxAirstream: { target: 'self', changes: { speed: 1 } },
  maxDarkness: { target: 'opponent', changes: { 'special-defense': -1 } },
  maxFlutterby: { target: 'opponent', changes: { 'special-attack': -1 } },
  maxPhantasm: { target: 'opponent', changes: { defense: -1 } },
  maxSteelspike: { target: 'self', changes: { defense: 1 } },
  maxStrike: { target: 'opponent', changes: { speed: -1 } },
  maxWyrmwind: { target: 'opponent', changes: { attack: -1 } },
  // Mountain Gale only has a 30% flinch chance; the extracted Speed drop is a
  // PokemonDB wording mix-up, so drop the effect.
  mountainGale: { remove: true },
  octolock: { target: 'opponent', changes: { defense: -1, 'special-defense': -1 } },
  rototiller: { target: 'self', changes: { attack: 1, 'special-attack': 1 } },
  skullBash: { target: 'self', changes: { defense: 1 } },
  stuffCheeks: { target: 'self', changes: { defense: 2 } },
  venomDrench: { target: 'opponent', changes: { 'special-attack': -1, speed: -1 } },
}

const get = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'pokemon-idle-stat-fixer' } }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location)
          return resolve(get(new URL(response.headers.location, url).toString()))
        if (response.statusCode !== 200) {
          response.resume()
          return reject(new Error(`Status ${response.statusCode} for ${url}`))
        }
        let body = ''
        response.on('data', (chunk) => (body += chunk))
        response.on('end', () => resolve(body))
      })
      .on('error', reject)
  })

/** Showdown's id form: lowercase and strip everything non-alphanumeric. */
const toId = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

async function loadShowdownMoves() {
  if (fs.existsSync(SHOWDOWN_PATH) && fs.statSync(SHOWDOWN_PATH).size > 0)
    return JSON.parse(fs.readFileSync(SHOWDOWN_PATH, 'utf8'))
  console.log('Fetching Pokemon Showdown moves.json...')
  const body = await get('https://play.pokemonshowdown.com/data/moves.json')
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(SHOWDOWN_PATH, body)
  return JSON.parse(body)
}

const convertBoosts = (boosts) =>
  Object.fromEntries(Object.entries(boosts).map(([key, value]) => [STAT_KEY_MAP[key] ?? key, value]))

/** The move's guaranteed stat change, or null when Showdown implements it in script. */
function resolveFromShowdown(entry) {
  if (!entry) return null
  const selfBoosts = entry.self?.boosts ?? entry.selfBoost?.boosts
  if (selfBoosts) return { target: 'self', changes: convertBoosts(selfBoosts) }
  const secondaries = entry.secondaries ?? (entry.secondary ? [entry.secondary] : [])
  const guaranteed = secondaries.find((secondary) => (secondary.chance ?? 100) >= 100)
  if (guaranteed) {
    const boosts = guaranteed.self?.boosts ?? guaranteed.boosts
    if (boosts) return { target: guaranteed.self?.boosts ? 'self' : 'opponent', changes: convertBoosts(boosts) }
  }
  if (entry.boosts)
    return {
      target: SELF_TARGETS.has(entry.target) ? 'self' : 'opponent',
      changes: convertBoosts(entry.boosts),
    }
  return null
}

const changesEqual = (a, b) =>
  JSON.stringify(Object.entries(a ?? {}).sort()) === JSON.stringify(Object.entries(b ?? {}).sort())

async function main() {
  const raw = fs.readFileSync(MOVES_PATH, 'utf8')
  const newline = raw.includes('\r\n') ? '\r\n' : '\n'
  const moves = JSON.parse(raw)
  const showdown = await loadShowdownMoves()

  const fixes = []
  const unmatched = []
  const removals = []

  for (const [moveId, move] of Object.entries(moves)) {
    const effect = move.effect
    if (!effect || effect.type !== 'statChange') continue
    const resolved = STAT_OVERRIDES[moveId] ?? resolveFromShowdown(showdown[toId(move.name)])
    if (!resolved) {
      unmatched.push(`${move.name} (${moveId})`)
      continue
    }
    if (resolved.remove) {
      removals.push({ moveId, name: move.name })
      continue
    }
    if (!changesEqual(resolved.changes, effect.changes) || resolved.target !== effect.target)
      fixes.push({
        moveId,
        name: move.name,
        from: `${effect.target}:${JSON.stringify(effect.changes)}`,
        to: `${resolved.target}:${JSON.stringify(resolved.changes)}`,
        target: resolved.target,
        changes: resolved.changes,
      })
  }

  console.log(`stat-change fixes: ${fixes.length}`)
  fixes.forEach((fix) => console.log(`  ${fix.name}: ${fix.from} -> ${fix.to}`))
  console.log(`effect removals: ${removals.length}`)
  removals.forEach((removal) => console.log(`  ${removal.name} (${removal.moveId})`))
  if (unmatched.length) console.log(`unmatched (left untouched): ${unmatched.join(', ')}`)

  if (DRY) {
    console.log('--dry: not writing possible-moves.json')
    return
  }
  if (fixes.length === 0 && removals.length === 0) {
    console.log('possible-moves.json already matches; no changes.')
    return
  }
  for (const fix of fixes) {
    moves[fix.moveId].effect = {
      ...moves[fix.moveId].effect,
      target: fix.target,
      changes: fix.changes,
    }
  }
  for (const removal of removals) {
    delete moves[removal.moveId].effect
  }
  const json = JSON.stringify(moves, null, 4).split('\n').join(newline)
  fs.writeFileSync(MOVES_PATH, json)
  console.log(`Wrote ${path.relative(process.cwd(), MOVES_PATH)}.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
