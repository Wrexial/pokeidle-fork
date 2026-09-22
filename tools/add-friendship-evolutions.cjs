#!/usr/bin/env node
/**
 * Turn the canonical friendship evolutions into friendship-gated ones.
 *
 * The extracted data records every friendship evolution as a plain level-up
 * (Golbat -> Crobat at 45, Pichu -> Pikachu at 10, ...). This rewrites those
 * entries to `{ into, friendship }`, dropping the level, so the party/box UI
 * requires the Pokemon's friendship to be high enough (raised by battling and
 * levelling up). Everything else is left untouched. Idempotent.
 *
 * Writes public/data/evolution-data.json.
 *
 * Usage: node tools/add-friendship-evolutions.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const species = JSON.parse(fs.readFileSync(path.join(DATA, 'pokemon-species.json'), 'utf8'))
const evoPath = path.join(DATA, 'evolution-data.json')
const evolutionData = JSON.parse(fs.readFileSync(evoPath, 'utf8'))

/** Friendship a Pokemon needs before these evolutions are offered. */
const FRIENDSHIP = 160

/** @type {Record<string, string[]>} */
const FRIENDSHIP_EVOLUTIONS = {
  golbat: ['crobat'],
  chansey: ['blissey'],
  pichu: ['pikachu'],
  cleffa: ['clefairy'],
  igglybuff: ['jigglypuff'],
  togepi: ['togetic'],
  azurill: ['marill'],
  budew: ['roselia'],
  buneary: ['lopunny'],
  chingling: ['chimecho'],
  munchlax: ['snorlax'],
  riolu: ['lucario'],
  woobat: ['swoobat'],
  swadloon: ['leavanny'],
  snom: ['frosmoth'],
  'type: null': ['silvally'],
  // Eevee's day/night/affection evolutions.
  eevee: ['espeon', 'umbreon', 'sylveon'],
}

let changed = 0

for (const [from, targets] of Object.entries(FRIENDSHIP_EVOLUTIONS)) {
  if (!species[from]) {
    console.warn(`unknown species ${from}`)
    continue
  }
  const evolutions = evolutionData[from] ?? (evolutionData[from] = [])
  for (const into of targets) {
    let evolution = evolutions.find((entry) => entry.into === into)
    if (!evolution) {
      if (!species[into]) {
        console.warn(`unknown target ${into}`)
        continue
      }
      evolution = { into }
      evolutions.push(evolution)
    }
    if (evolution.form) continue
    if (evolution.friendship !== FRIENDSHIP || evolution.level != null || evolution.item) changed++
    evolution.friendship = FRIENDSHIP
    delete evolution.level
    delete evolution.item
  }
}

fs.writeFileSync(evoPath, JSON.stringify(evolutionData, null, 2))
console.log(`friendship evolutions: ${changed} entries set to ${FRIENDSHIP}`)
