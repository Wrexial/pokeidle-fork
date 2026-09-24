#!/usr/bin/env node
/**
 * Generate public/reference.html — a self-contained, offline breakdown of the
 * battle engine: every move, ability and held item, marked with what it does
 * and whether the engine actually implements it.
 *
 * It reads the live move data (with src/data/move-effects.js applied), the held
 * items, the curated ability descriptions (src/data/ability-info.js) and the
 * shared move descriptions (src/game/move-info.js), then inlines a compact
 * payload into tools/reference-template.html and writes the static page.
 *
 * Re-run after changing moves, abilities or held items:
 *   node tools/generate-reference.cjs
 */
const fs = require('fs')
const path = require('path')
const { abilityInfo } = require('../src/data/ability-info.js')
const { describeMove, handledMoveEffectTypes } = require('../src/game/move-info.js')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const TEMPLATE = path.join(__dirname, 'reference-template.html')
const OUT = path.join(ROOT, 'public', 'reference.html')

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

function titleCase(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

async function main() {
  // `possible-moves.json` is enriched at runtime by applyMoveOverrides, so the
  // page describes the same table the engine sees.
  const rawMoves = read(path.join(DATA, 'possible-moves.json'))
  const { applyMoveOverrides } = await import('../src/data/move-effects.js')
  const moveData = applyMoveOverrides(rawMoves)
  const abilityData = read(path.join(DATA, 'ability-data.json'))
  const { heldItems } = await import('../src/data/items.js')

  const HANDLED_EFFECTS = handledMoveEffectTypes

  // ── Moves ────────────────────────────────────────────────────────────────
  const moves = []
  const unknownEffects = new Set()
  for (const key of Object.keys(moveData).sort()) {
    const move = moveData[key]
    const effect = move.effect
    const hasField = !!(move.protect || move.screen || move.multiHit || move.critStage)
    let status
    let text = null
    if (effect && !HANDLED_EFFECTS.has(effect.type) && !['heal', 'recoil', 'drain', 'status', 'statChange', 'statReset', 'confusion', 'infatuation', 'hazard', 'weather', 'terrain', 'typeChange', 'typeAdd', 'statSwap'].includes(effect.type)) {
      unknownEffects.add(effect.type)
      status = 'inert'
    } else if (effect || hasField) {
      status = 'implemented'
      text = describeMove({ key, ...move })
      if (!text) status = 'inert'
    } else if (move.category === 'status' && !move.power) {
      status = 'inert'
    } else {
      status = 'attack'
    }
    moves.push({
      key,
      name: move.name,
      type: move.type,
      category: move.category,
      power: move.power ?? 0,
      accuracy: move.accuracy ?? 0,
      status,
      text,
      special: !!(move.protect || move.screen || move.multiHit),
    })
  }

  // ── Abilities ────────────────────────────────────────────────────────────
  const abilityKeys = new Set()
  for (const speciesKey of Object.keys(abilityData)) {
    const entry = abilityData[speciesKey]
    ;(entry.abilities || []).forEach((a) => abilityKeys.add(a))
    if (entry.hidden) abilityKeys.add(entry.hidden)
  }
  const abilities = [...abilityKeys].sort().map((key) => {
    const meta = abilityInfo[key]
    return { key, name: titleCase(key), group: meta?.group ?? 'inert', text: meta?.text ?? null, implemented: !!meta }
  })

  // Warn (but don't fail) when the registry and the live engine disagree, so a
  // new ability is noticed the next time this page is regenerated.
  const metaNotUsed = Object.keys(abilityInfo).filter((key) => !abilityKeys.has(key))
  if (metaNotUsed.length) console.warn('warning: ability-info.js has keys not in ability-data.json:', metaNotUsed.join(', '))

  // Cross-check the curated registry against the engine source: a newly wired
  // ability missing from ability-info.js would otherwise be listed as inert.
  const ENGINE_FILES = [
    'src/game/abilities.js',
    'src/game/held-items.js',
    'src/game/hazards.js',
    'src/game/weather.js',
    'src/game/terrain.js',
    'src/game/combat/turn.js',
    'src/game/combat/end-of-turn.js',
    'src/game/combat/status.js',
    'src/game/combat/volatile.js',
    'src/game/combat/damage.js',
    'src/game/combat/setup.js',
    'src/game/reducer/battle/events.js',
    'src/game/reducer/battle/trainer.js',
    'src/game/pokemon/creation.js',
    'src/game/use-game-loop.js',
  ]
  const engineText = ENGINE_FILES.map((file) => fs.readFileSync(path.join(ROOT, file), 'utf8')).join('\n')
  const scanned = new Set([...abilityKeys].filter((key) => new RegExp('\\b' + key + '\\b').test(engineText)))
  const missingMeta = [...scanned].filter((key) => !abilityInfo[key])
  const extraMeta = Object.keys(abilityInfo).filter((key) => abilityKeys.has(key) && !scanned.has(key))
  if (missingMeta.length) console.warn('warning: implemented in the engine but missing from src/data/ability-info.js:', missingMeta.join(', '))
  if (extraMeta.length) console.warn('warning: listed in src/data/ability-info.js but not found in the engine:', extraMeta.join(', '))

  // ── Held items ───────────────────────────────────────────────────────────
  const items = Object.keys(heldItems).map((key) => {
    const item = heldItems[key]
    return { key, name: item.name, description: item.description, effectType: item.effect?.type ?? null }
  })

  const counts = {
    moves: moves.length,
    implementedMoves: moves.filter((m) => m.status === 'implemented').length,
    attackMoves: moves.filter((m) => m.status === 'attack').length,
    inertMoves: moves.filter((m) => m.status === 'inert').length,
    abilities: abilities.length,
    implementedAbilities: abilities.filter((a) => a.implemented).length,
    items: items.length,
  }

  const groupLabels = [
    ['entry', 'Entry & field'],
    ['absorb', 'Type immunity & absorption'],
    ['weather', 'Weather & terrain'],
    ['offense', 'Offensive boosts'],
    ['defense', 'Defensive & damage reduction'],
    ['speed', 'Speed'],
    ['status', 'Status & condition control'],
    ['contact', 'Contact reactions'],
    ['onhit', 'On-hit reactions'],
    ['onko', 'On-KO rewards'],
    ['stats', 'Stat changes & protection'],
    ['form', 'Form changes'],
    ['item', 'Items & berries'],
    ['misc', 'Other'],
    ['inert', 'Not implemented'],
  ]

  const payload = {
    generatedAt: new Date().toISOString(),
    counts,
    groupLabels,
    abilities,
    items,
    moves,
  }

  if (unknownEffects.size) console.warn('note: move effects with no description:', [...unknownEffects].join(', '))

  const template = fs.readFileSync(TEMPLATE, 'utf8')
  const html = template
    .replace('__GENERATED_AT__', payload.generatedAt)
    .replace('__REFERENCE_DATA_JSON__', JSON.stringify(payload).replace(/</g, '\\u003c'))
  fs.writeFileSync(OUT, html)
  console.log(
    `wrote ${path.relative(ROOT, OUT)} — ${counts.moves} moves (${counts.implementedMoves} with an effect, ` +
      `${counts.attackMoves} plain attacks, ${counts.inertMoves} inert), ` +
      `${counts.implementedAbilities}/${counts.abilities} abilities, ${counts.items} held items`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
