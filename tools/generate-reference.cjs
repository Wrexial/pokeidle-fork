#!/usr/bin/env node
/**
 * Generate public/reference.html — a self-contained, offline breakdown of the
 * battle engine: every move, ability and held item, marked with what it does
 * and whether the engine actually implements it.
 *
 * It reads the live move data (with src/data/move-effects.js applied), the
 * ability table, the held items and the curated registry in
 * tools/reference-data.cjs, then inlines a compact payload into
 * tools/reference-template.html and writes the static page.
 *
 * Re-run after changing moves, abilities or held items:
 *   node tools/generate-reference.cjs
 */
const fs = require('fs')
const path = require('path')
const { ABILITY_META, MOVE_EFFECT_TEXT, MOVE_NOTES } = require('./reference-data.cjs')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const TEMPLATE = path.join(__dirname, 'reference-template.html')
const OUT = path.join(ROOT, 'public', 'reference.html')

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

const STAT_LABELS = {
  attack: 'Attack',
  defense: 'Defense',
  spAttack: 'Sp. Atk',
  spDefense: 'Sp. Def',
  speed: 'Speed',
  accuracy: 'accuracy',
  evasion: 'evasiveness',
}

const STATUS_LABELS = {
  poison: 'poison',
  toxic: 'badly poison',
  burn: 'burn',
  freeze: 'freeze',
  sleep: 'sleep',
  paralysis: 'paralyze',
  flinching: 'flinch',
}

function normalizeStatKey(key) {
  return (
    {
      'special-attack': 'spAttack',
      'special-defense': 'spDefense',
      'sp-atk': 'spAttack',
      'sp-def': 'spDefense',
      evasiveness: 'evasion',
    }[key] ?? key
  )
}

function titleCase(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}

/** Turn a `statChange` effect's changes into readable text. */
function describeStatChange(effect) {
  const parts = Object.entries(effect.changes ?? {}).map(([key, delta]) => {
    const label = STAT_LABELS[normalizeStatKey(key)] ?? normalizeStatKey(key)
    const magnitude =
      Math.abs(delta) === 1 ? '' : Math.abs(delta) === 2 ? ' sharply' : ` by ${Math.abs(delta)}`
    return `${label} ${delta > 0 ? 'up' : 'down'}${magnitude}`
  })
  const subject = effect.target === 'self' ? 'the user' : 'the target'
  const prefix = effect.chance && effect.chance < 100 ? `${effect.chance}% chance to change ` : 'Changes '
  return `${prefix}${subject}\u2019s stats: ${parts.join(', ')}.`
}

/** A one-line description of a move's implemented effect, or null if inert. */
function describeMove(move) {
  const notes = MOVE_NOTES[move.key]
  const effect = move.effect

  if (move.protect) return 'Blocks most moves for the turn (priority +4).'
  if (move.screen === 'both') return 'Halves physical and special damage for five turns.'
  if (move.screen === 'reflect') return 'Halves physical damage for five turns.'
  if (move.screen === 'lightScreen') return 'Halves special damage for five turns.'
  if (move.multiHit) {
    const [min, max] = move.multiHit
    return min === max ? `Hits ${min} times.` : `Hits ${min}\u2013${max} times.`
  }
  if (move.critStage) return 'High critical-hit ratio.'
  if (!effect) return null

  switch (effect.type) {
    case 'heal': {
      let text = `Heals the user ${effect.percentage}% of its max HP`
      if (effect.status === 'sleep') text += ' and puts it to sleep'
      if (effect.statusCure) text += ' and cures its status'
      return `${text}.${notes ? ' ' + notes : ''}`
    }
    case 'recoil':
      return `The user takes recoil (${Math.round(effect.fraction * 100)}% of the damage dealt).`
    case 'drain':
      return `Heals the user for ${effect.percentage ?? 50}% of the damage dealt.`
    case 'status': {
      const label = STATUS_LABELS[effect.status] ?? effect.status
      return effect.chance && effect.chance < 100
        ? `${effect.chance}% chance to ${label} the target.`
        : `Inflicts ${label} on the target.`
    }
    case 'statChange':
      return describeStatChange(effect)
    case 'confusion':
      return 'Confuses the target.'
    case 'infatuation':
      return 'Infatuates the target (needs opposite genders).'
    case 'statReset':
      return effect.target === 'all'
        ? 'Resets all stat stages on the field.'
        : 'Resets the target\u2019s stat stages.'
    case 'hazard': {
      const labels = {
        stealthRock: 'Stealth Rock',
        spikes: 'Spikes',
        toxicSpikes: 'Toxic Spikes',
        stickyWeb: 'Sticky Web',
      }
      return `Sets ${labels[effect.hazard] ?? 'an entry hazard'} on the foe\u2019s side.`
    }
    case 'weather': {
      const labels = {
        rain: 'rain',
        sun: 'harsh sunlight',
        sandstorm: 'a sandstorm',
        snow: 'snow',
        hail: 'hail',
      }
      return `Summons ${labels[effect.weather] ?? 'weather'} for five turns.`
    }
    case 'terrain': {
      const labels = {
        electric: 'Electric',
        grassy: 'Grassy',
        misty: 'Misty',
        psychic: 'Psychic',
      }
      return `Sets ${labels[effect.terrain] ?? ''} Terrain for five turns.`
    }
    case 'typeChange':
      return `Changes the target\u2019s type to ${effect.types.join('/')}.`
    case 'typeAdd':
      return `Adds the ${effect.typeName} type to the target.`
    case 'statSwap':
      return `Swaps ${effect.stats.map((s) => STAT_LABELS[s] ?? s).join(', ')} with the target.`
  }
  if (MOVE_EFFECT_TEXT[effect.type]) {
    // A hand-written note is more precise than the generic line, so prefer it.
    if (notes) return notes
    let text = MOVE_EFFECT_TEXT[effect.type]
    if (text.includes('{percentage}')) text = text.replace('{percentage}', effect.percentage ?? 50)
    if (text.includes('{status}')) text = text.replace('{status}', STATUS_LABELS[effect.status] ?? effect.status ?? '')
    if (text.includes('{changes}')) text = text.replace('{changes}', '')
    return `${text}${notes ? ' ' + notes : ''}`
  }
  return null
}

async function main() {
  // `possible-moves.json` is enriched at runtime by applyMoveOverrides, so the
  // page describes the same table the engine sees.
  const rawMoves = read(path.join(DATA, 'possible-moves.json'))
  const { applyMoveOverrides } = await import('../src/data/move-effects.js')
  const moveData = applyMoveOverrides(rawMoves)
  const abilityData = read(path.join(DATA, 'ability-data.json'))
  const { heldItems } = await import('../src/data/items.js')

  const HANDLED_EFFECTS = new Set(Object.keys(MOVE_EFFECT_TEXT))

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
    const meta = ABILITY_META[key]
    return { key, name: titleCase(key), group: meta?.group ?? 'inert', text: meta?.text ?? null, implemented: !!meta }
  })

  // Warn (but don't fail) when the registry and the live engine disagree, so a
  // new ability is noticed the next time this page is regenerated.
  const metaNotUsed = Object.keys(ABILITY_META).filter((key) => !abilityKeys.has(key))
  if (metaNotUsed.length) console.warn('warning: ABILITY_META has keys not in ability-data.json:', metaNotUsed.join(', '))

  // Cross-check the curated registry against the engine source: a newly wired
  // ability missing from ABILITY_META would otherwise be listed as inert.
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
  const missingMeta = [...scanned].filter((key) => !ABILITY_META[key])
  const extraMeta = Object.keys(ABILITY_META).filter((key) => abilityKeys.has(key) && !scanned.has(key))
  if (missingMeta.length) console.warn('warning: implemented in the engine but missing from reference-data.cjs:', missingMeta.join(', '))
  if (extraMeta.length) console.warn('warning: listed in reference-data.cjs but not found in the engine:', extraMeta.join(', '))

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
