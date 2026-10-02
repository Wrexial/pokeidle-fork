import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

import { installGameData } from './helpers/game-data.mjs'

const require = createRequire(import.meta.url)
const { buildEvolutionLevels } = require('../tools/lib/evolution-levels.cjs')

const gameData = installGameData()
const { evolutionData, mapData, pokemonSpecies, regions } = gameData
const { minLevel } = buildEvolutionLevels(evolutionData, pokemonSpecies)

const { readFileSync } = await import('node:fs')
const { fileURLToPath } = await import('node:url')
const { dirname, join } = await import('node:path')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const trainers = JSON.parse(readFileSync(join(root, 'public/data/trainer-data.json'), 'utf8'))

const GEN_RANGES = [
  [1, 151],
  [152, 251],
  [252, 386],
  [387, 493],
  [494, 649],
  [650, 721],
  [722, 809],
  [810, 905],
  [906, 1025],
]

// Every starter line is kept off route trainers.
const ALL_STARTERS = (() => {
  const lines = new Set()
  const addLine = (key) => {
    if (lines.has(key)) return
    lines.add(key)
    for (const evolution of evolutionData[key] ?? []) addLine(evolution.into)
  }
  for (const key of [
    'bulbasaur',
    'charmander',
    'squirtle',
    'chikorita',
    'cyndaquil',
    'totodile',
    'treecko',
    'torchic',
    'mudkip',
    'turtwig',
    'chimchar',
    'piplup',
    'snivy',
    'tepig',
    'oshawott',
    'chespin',
    'fennekin',
    'froakie',
    'rowlet',
    'litten',
    'popplio',
    'grookey',
    'scorbunny',
    'sobble',
    'sprigatito',
    'fuecoco',
    'quaxly',
  ])
    addLine(key)
  return lines
})()

/** Route-trainer teams for one region. */
function teamsFor(regionId) {
  const teams = []
  for (const [locationId, list] of Object.entries(trainers)) {
    if ((mapData[locationId]?.region ?? 'kanto') !== regionId) continue
    for (const trainer of list) if (trainer.team?.length) teams.push(trainer.team)
  }
  return teams
}

test('route trainers only field level-appropriate, non-legendary, non-starter Pokemon', () => {
  for (const [locationId, list] of Object.entries(trainers)) {
    // Kanto's trainers are hand-curated and may field starter lines.
    const isKanto = (mapData[locationId]?.region ?? 'kanto') === 'kanto'
    for (const trainer of list)
      for (const member of trainer.team ?? []) {
        const species = pokemonSpecies[member.speciesKey]
        assert.ok(species, `${trainer.id} fields unknown ${member.speciesKey}`)
        assert.ok(
          (minLevel[member.speciesKey] ?? 1) <= member.level,
          `${trainer.id} fields ${member.speciesKey} at Lv.${member.level} (floor Lv.${minLevel[member.speciesKey]})`
        )
        assert.ok(!species.legendary, `${trainer.id} fields legendary ${member.speciesKey}`)
        if (!isKanto)
          assert.ok(
            !ALL_STARTERS.has(member.speciesKey),
            `${trainer.id} fields starter ${member.speciesKey}`
          )
      }
  }
})

test('route trainers reveal a large share of each generated region dex', () => {
  for (const region of regions) {
    // Kanto's trainers are hand-curated; the generated regions are the pass.
    if (region.id === 'kanto') continue
    const [minId, maxId] = GEN_RANGES[region.generation - 1],
      nativePool = Object.entries(pokemonSpecies).filter(
        ([, species]) =>
          species.id >= minId &&
          species.id <= maxId &&
          species.catchRate > 3 &&
          !species.legendary
      ),
      used = new Set(teamsFor(region.id).flat().map((member) => member.speciesKey)),
      covered = nativePool.filter(([key]) => used.has(key)).length,
      ratio = covered / nativePool.length
    assert.ok(
      ratio >= 0.3,
      `${region.id} trainers cover only ${Math.round(ratio * 100)}% of their dex`
    )
  }
})
