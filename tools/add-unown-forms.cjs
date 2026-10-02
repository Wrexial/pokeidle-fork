#!/usr/bin/env node
/**
 * Add the 28 Unown forms (A–Z, !, ?).
 *
 * PokeAPI models the Unown letters as *forms* of pokemon 201, not as separate
 * pokemon, so they have no PokeAPI pokemon id. The base `unown` entry is the A
 * form (id 201), and the other 27 forms get bespoke ids above the form range
 * (20101+) — `download_pokemon_sprites.cjs` maps those ids to PokeAPI's
 * `201-<form>` sprites. Their kit is trivial (Levitate + Hidden Power), so the
 * ability / learnset / breeding tables are written by hand rather than fetched.
 *
 * Idempotent: re-running rewrites the same entries. Writes the live public/data
 * files (the extractor is a legacy one-off, so patches go straight to them).
 *
 * Usage: node tools/add-unown-forms.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))
// Match each data file's existing indentation so a re-run only adds the new
// keys instead of reformatting the whole file.
const write = (file, indent, data) =>
  fs.writeFileSync(path.join(DATA, file), JSON.stringify(data, null, indent) + '\n')

// B..Z (25 letters) then the two punctuation forms.
const LETTERS = 'bcdefghijklmnopqrstuvwxyz'.split('')
const FORMS = [
  ...LETTERS.map((letter, index) => ({
    key: `unown-${letter}`,
    name: `Unown-${letter.toUpperCase()}`,
    id: 20101 + index,
  })),
  { key: 'unown-exclamation', name: 'Unown-!', id: 20126 },
  { key: 'unown-question', name: 'Unown-?', id: 20127 },
]

const BASE_STATS = { hp: 48, attack: 72, defense: 48, spAttack: 72, spDefense: 48, speed: 48 }

const species = read('pokemon-species.json')
const abilities = read('ability-data.json')
const learnsets = read('possible-learnsets.json')
const tmLearnsets = read('tm-learnsets.json')
const breeding = read('breeding-data.json')

let added = 0
for (const form of FORMS) {
  if (!species[form.key]) added++
  species[form.key] = {
    id: form.id,
    name: form.name,
    types: ['Psychic'],
    baseStats: { ...BASE_STATS },
    baseExpYield: 118,
    growthRate: 'mediumFast',
    catchRate: 225,
    weight: 5,
  }
  abilities[form.key] = { abilities: ['levitate'], hidden: null }
  learnsets[form.key] = [[1, 'hiddenPower']]
  tmLearnsets[form.key] = ['hiddenPower']
  breeding[form.key] = { genderRate: -1, eggGroups: ['no-eggs'], undiscovered: true }
}

write('pokemon-species.json', 2, species)
write('ability-data.json', 2, abilities)
write('possible-learnsets.json', 2, learnsets)
write('tm-learnsets.json', 1, tmLearnsets)
write('breeding-data.json', 1, breeding)
console.log(`added ${added} Unown forms (${FORMS.length} total in the set)`)
