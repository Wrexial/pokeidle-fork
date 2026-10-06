#!/usr/bin/env node
/**
 * Give Gigantamax forms an acquisition path.
 *
 * The original data already models Mega forms as level-100 evolutions
 * (`charizard -> m-charizard x/y`), but Gigantamax forms were the one group of
 * alternate forms with no evolution entry and no wild/raid table, so they could
 * never be obtained. Mirror the Mega pattern by adding `base -> gx-base` at
 * level 100 for every `gx-*` species.
 *
 * Idempotent: re-running adds nothing. Writes public/data/evolution-data.json.
 *
 * Usage: node tools/add-gmax-evolutions.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const species = JSON.parse(fs.readFileSync(path.join(DATA, 'pokemon-species.json'), 'utf8'))
const evoPath = path.join(DATA, 'evolution-data.json')
const evolutionData = JSON.parse(fs.readFileSync(evoPath, 'utf8'))

let added = 0
for (const key of Object.keys(species).filter((candidate) => candidate.startsWith('gx-'))) {
  const baseKey = key.slice(3)
  if (!species[baseKey]) continue
  const evolutions = evolutionData[baseKey] ?? (evolutionData[baseKey] = [])
  const existing = evolutions.find((evolution) => evolution.into === key)
  if (existing) {
    if (!existing.form) (existing.form = true), added++
    continue
  }
  // `form: true` keeps `isFinalEvolution` in generate-regions.cjs from treating
  // a Gigantamax form as a real evolution (which would drop the base species
  // from tournament teams).
  evolutions.push({ into: key, level: 100, form: true })
  added++
}

// Preserve the file's existing formatting (2-space indent, no trailing newline).
fs.writeFileSync(evoPath, JSON.stringify(evolutionData, null, 2))
console.log(`added ${added} Gigantamax evolutions`)
