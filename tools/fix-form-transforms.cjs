#!/usr/bin/env node
/**
 * Normalize alternate-form transformations in evolution-data.json.
 *
 * Many alternate forms are temporary transformations (Deoxys' four formes, the
 * Rotom appliances, the Therian formes, Kyurem's Black/White, Necrozma's
 * fusions, Calyrex's riders, ...) but were recorded as one-way level evolutions,
 * so once a Pokemon transformed it could never change back or across. This tool
 * makes each group reversible — star-shaped (base <-> each form) or fully
 * all-to-all where every form should reach every other — fixes a couple of bad
 * edges, and is idempotent (safe to re-run after re-extracting the data).
 *
 * Usage: node tools/fix-form-transforms.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const EVOLUTION_PATH = path.join(DATA, 'evolution-data.json')
const SPECIES_PATH = path.join(DATA, 'pokemon-species.json')

const evolutionData = JSON.parse(fs.readFileSync(EVOLUTION_PATH, 'utf8'))
const species = JSON.parse(fs.readFileSync(SPECIES_PATH, 'utf8'))

/**
 * Form-change groups. `star` links the base to each form (and back); `allToAll`
 * links every member to every other. The level gates the transform in both
 * directions (it is only a progress gate — these are not level-up evolutions).
 * @type {{ base: string, forms: string[], level: number, allToAll?: boolean }[]}
 */
const FORM_GROUPS = [
  { base: 'deoxys', forms: ['deoxys-a', 'deoxys-d', 'deoxys-s'], level: 30, allToAll: true },
  { base: 'rotom', forms: ['h-rotom', 'w-rotom', 'f-rotom', 'fan-rotom', 'm-rotom'], level: 5 },
  { base: 'tornadus', forms: ['tornadus-t'], level: 50 },
  { base: 'thundurus', forms: ['thundurus-t'], level: 50 },
  { base: 'landorus', forms: ['landorus-t'], level: 50 },
  { base: 'kyurem', forms: ['b-kyurem', 'w-kyurem'], level: 100 },
  { base: 'keldeo', forms: ['keldeo-r'], level: 15 },
  { base: 'greninja', forms: ['ash-greninja'], level: 100 },
  { base: 'zygarde', forms: ['zygarde-10', 'zygarde-c'], level: 10, allToAll: true },
  { base: 'necrozma', forms: ['necrozma-s', 'necrozma-l', 'u-necrozma'], level: 100, allToAll: true },
  { base: 'calyrex', forms: ['calyrex-ir', 'calyrex-sr'], level: 100, allToAll: true },
]

/**
 * Edges that are simply wrong and should be dropped. Armarouge and Ceruledge
 * were recorded as evolving into each other (they are version counterparts, not
 * a line — Charcadet evolves into them).
 * @type {[string, string][]}
 */
const REMOVE_EDGES = [
  ['armarouge', 'ceruledge'],
  ['ceruledge', 'armarouge'],
]

/**
 * Gender variants are not transformable forms: the variant follows the
 * Pokemon's gender. Basculegion and Oinkologne pick male/female when they
 * evolve, so tag the evolution with the required `gender` (the UI only offers
 * the matching one).
 * @type {{ from: string, level: number, male: string, female: string }[]}
 */
const GENDER_FORM_EVOLUTIONS = [
  { from: 'basculin-w', level: 50, male: 'basculegion', female: 'basculegion-f' },
  { from: 'lechonk', level: 18, male: 'oinkologne', female: 'oinkologne-f' },
]

/** Manual male<->female transform edges to drop (they are gender variants). */
const GENDER_FORM_PAIRS = [
  ['basculegion', 'basculegion-f'],
  ['basculegion-f', 'basculegion'],
  ['indeedee', 'indeedee-f'],
  ['indeedee-f', 'indeedee'],
  ['oinkologne', 'oinkologne-f'],
  ['oinkologne-f', 'oinkologne'],
]

const isFormKey = (key) => Number(species[key]?.id) > 1025

/** Drop every evolution from `from` into `into`. Returns true if one existed. */
const removeEdge = (from, into) => {
  const list = evolutionData[from]
  if (!Array.isArray(list)) return false
  const kept = list.filter((evolution) => evolution.into !== into)
  if (kept.length === list.length) return false
  evolutionData[from] = kept
  return true
}

/** Ensure exactly one `from -> into` edge at `level` (no duplicate, no item). */
const setEdge = (from, into, level, gender) => {
  const list = evolutionData[from] ?? []
  const existing = list.find((evolution) => evolution.into === into)
  if (existing) {
    existing.level = level
    delete existing.item
    delete existing.form
    if (gender) existing.gender = gender
    else delete existing.gender
    return
  }
  const entry = { into, level }
  if (gender) entry.gender = gender
  list.push(entry)
  evolutionData[from] = list
}

const before = JSON.stringify(evolutionData)

for (const [from, into] of REMOVE_EDGES)
  if (removeEdge(from, into)) console.log(`removed ${from} -> ${into}`)

for (const { base, forms, level, allToAll } of FORM_GROUPS) {
  const members = [base, ...forms]
  // Normalize: first drop every edge *inside* the group, then rebuild it.
  for (const from of members)
    evolutionData[from] = (evolutionData[from] ?? []).filter(
      (evolution) => !members.includes(evolution.into)
    )
  if (allToAll) {
    for (const from of members)
      for (const to of members) if (from !== to) setEdge(from, to, level)
  } else {
    for (const form of forms) {
      setEdge(base, form, level)
      setEdge(form, base, level)
    }
  }
}

for (const [from, into] of GENDER_FORM_PAIRS)
  if (removeEdge(from, into)) console.log(`removed gender-form edge ${from} -> ${into}`)

for (const { from, level, male, female } of GENDER_FORM_EVOLUTIONS) {
  // Drop any old/untagged edges to the two variants, then set the tagged pair.
  evolutionData[from] = (evolutionData[from] ?? []).filter(
    (evolution) => evolution.into !== male && evolution.into !== female
  )
  setEdge(from, male, level, 'male')
  setEdge(from, female, level, 'female')
}

if (JSON.stringify(evolutionData) === before) {
  console.log('evolution-data.json already normalized; no changes.')
} else {
  fs.writeFileSync(EVOLUTION_PATH, JSON.stringify(evolutionData, null, 2) + '\n')
  console.log(`Wrote ${path.relative(process.cwd(), EVOLUTION_PATH)}.`)
  console.log(
    `Form groups: ${FORM_GROUPS.length}; removed edges: ${REMOVE_EDGES.length}; gender evolutions: ${GENDER_FORM_EVOLUTIONS.length}.`
  )
}
