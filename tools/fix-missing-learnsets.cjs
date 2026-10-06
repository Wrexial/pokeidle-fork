#!/usr/bin/env node
/**
 * Fill in the learnsets missing from possible-learnsets.json.
 *
 * The Serebii-derived file covers 999 of the 1194 species: every alternate form
 * is absent, plus six base species the scraper missed. A Pokemon with no
 * learnset enters battle with no moves, so it can neither attack nor defend
 * usefully (combat silently skips an undefined move).
 *
 * Each missing species borrows the learnset of the closest related species:
 *   1. its base species after stripping a form affix (a-/g-/h-/p-/m-/gx-),
 *   2. its pre-evolution,
 *   3. one of its evolutions.
 *
 * Idempotent; writes public/data/possible-learnsets.json. Re-run if the file is
 * ever regenerated from a source that omits alternate forms.
 *
 * Usage: node tools/fix-missing-learnsets.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const species = JSON.parse(fs.readFileSync(path.join(DATA, 'pokemon-species.json'), 'utf8'))
const learnsets = JSON.parse(fs.readFileSync(path.join(DATA, 'possible-learnsets.json'), 'utf8'))
const evolutionData = JSON.parse(fs.readFileSync(path.join(DATA, 'evolution-data.json'), 'utf8'))

const sources = { ...learnsets }

const norm = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
const byNorm = {}
for (const key of Object.keys(sources)) byNorm[norm(key)] ??= key

const preEvolutionMap = {}
const childrenMap = {}
for (const [from, evolutions] of Object.entries(evolutionData))
  for (const evolution of evolutions) {
    preEvolutionMap[evolution.into] ??= from
    ;(childrenMap[from] ??= []).push(evolution.into)
  }

const stripForm = (key) =>
  key
    .replace(/^(a|g|h|p|m|gx)-/, '')
    .replace(/ (x|y)$/, '')
    .replace(/-(f|h|a|b|w|sss|rss|z)$/, '')

/** @param {string} key @param {Set<string>} visited @returns {string | null} */
function findDonor(key, visited) {
  if (sources[key]) return key
  if (visited.has(key)) return null
  visited.add(key)
  const base = byNorm[norm(stripForm(key))]
  if (base && base !== key) {
    const donor = findDonor(base, visited)
    if (donor) return donor
  }
  if (preEvolutionMap[key]) {
    const donor = findDonor(preEvolutionMap[key], visited)
    if (donor) return donor
  }
  for (const child of childrenMap[key] ?? []) {
    const donor = findDonor(child, visited)
    if (donor) return donor
  }
  return null
}

// Species with no relatives to borrow from get a hand-written learnset.
const SPECIAL_LEARNSETS = {
  missingno: [
    [1, 'waterGun'],
    [1, 'skyAttack'],
    [1, 'tackle'],
  ],
}
let filled = 0
const unresolved = []
for (const key of Object.keys(species)) {
  if (learnsets[key]) continue
  if (!species[key].id && !SPECIAL_LEARNSETS[key]) continue
  const donor = findDonor(key, new Set())
  if (donor) {
    learnsets[key] = sources[donor]
    filled++
  } else if (SPECIAL_LEARNSETS[key]) {
    learnsets[key] = SPECIAL_LEARNSETS[key]
    filled++
  } else unresolved.push(key)
}

fs.writeFileSync(path.join(DATA, 'possible-learnsets.json'), JSON.stringify(learnsets, null, 2))
console.log(`filled ${filled} learnsets${unresolved.length ? ` (unresolved: ${unresolved.join(', ')})` : ''}`)
