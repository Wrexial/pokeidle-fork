#!/usr/bin/env node
/**
 * Add the alternate formes PokeAPI has but the extracted bundle predates:
 * Ursaluna-Bloodmoon and the Ogerpon / Terapagos formes (pokemon ids
 * 10272-10277). They were the last species missing an ability row, which is
 * why Mind's Eye, Tera Shell and Teraform Zero never showed up.
 *
 * Adds to pokemon-species.json (stats/types/weight), ability-data.json and
 * possible-learnsets.json (borrowed from the base form), and gives each a
 * form-change edge in evolution-data.json so it stays obtainable:
 *   ogerpon      <-> ogerpon-w / ogerpon-h / ogerpon-c  (the three masks)
 *   terapagos    <-> terapagos-t                         (Tera Orb)
 *   terapagos-t  <-> terapagos-s                         (Tera Orb)
 *   ursaluna     <-> ursaluna-b                          (Peat Block)
 *
 * Idempotent: species already present are skipped. PokeAPI responses are
 * cached under tools/cache/ (gitignored), so re-running is offline.
 *
 * Usage: node tools/add-missing-forms.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const CACHE = path.join(__dirname, 'cache')
const SPECIES_PATH = path.join(DATA, 'pokemon-species.json')
const ABILITY_PATH = path.join(DATA, 'ability-data.json')
const EVOLUTIONS_PATH = path.join(DATA, 'evolution-data.json')
const LEARNSETS_PATH = path.join(DATA, 'possible-learnsets.json')

const STAT_KEYS = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'spAttack',
  'special-defense': 'spDefense',
  speed: 'speed',
}

/** `[PokeAPI id, game key, base species key, display name, form item]`. */
const FORMS = [
  [10272, 'ursaluna-b', 'ursaluna', 'Ursaluna (Bloodmoon)', 'peatBlock'],
  [10273, 'ogerpon-w', 'ogerpon', 'Ogerpon (Wellspring)', 'wellspringMask'],
  [10274, 'ogerpon-h', 'ogerpon', 'Ogerpon (Hearthflame)', 'hearthflameMask'],
  [10275, 'ogerpon-c', 'ogerpon', 'Ogerpon (Cornerstone)', 'cornerstoneMask'],
  [10276, 'terapagos-t', 'terapagos', 'Terapagos (Terastal)', 'teraOrb'],
  [10277, 'terapagos-s', 'terapagos-t', 'Terapagos (Stellar)', 'teraOrb'],
]

/** Extra transform edges beyond `base -> form`. */
const EXTRA_EDGES = /** @type {{ from: string, to: string, item: string }[]} */ ([])

const toCamel = (/** @type {string} */ name) =>
  name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())

/** @param {number} id */
function readPokemon(id) {
  const cachePath = path.join(CACHE, `pokeapi-pokemon-${id}.json`)
  if (!fs.existsSync(cachePath)) throw new Error(`missing cache for ${id}`)
  return JSON.parse(fs.readFileSync(cachePath, 'utf8'))
}

function main() {
  const species = JSON.parse(fs.readFileSync(SPECIES_PATH, 'utf8')),
    abilities = JSON.parse(fs.readFileSync(ABILITY_PATH, 'utf8')),
    evolutions = JSON.parse(fs.readFileSync(EVOLUTIONS_PATH, 'utf8')),
    learnsets = JSON.parse(fs.readFileSync(LEARNSETS_PATH, 'utf8'))

  let added = 0
  for (const [id, key, base, name, item] of FORMS) {
    const baseSpecies = species[base]
    if (!baseSpecies) {
      console.warn(`skipping ${key}: base ${base} is missing`)
      continue
    }
    if (!species[key]) {
      const pokemon = readPokemon(id),
        baseStats = {}
      for (const stat of pokemon.stats) {
        const statKey = STAT_KEYS[stat.stat.name]
        if (statKey) baseStats[statKey] = stat.base_stat
      }
      species[key] = {
        id,
        name,
        types: pokemon.types
          .slice()
          .sort((/** @type {any} */ left, /** @type {any} */ right) => left.slot - right.slot)
          .map(
            (/** @type {any} */ entry) =>
              entry.type.name.charAt(0).toUpperCase() + entry.type.name.slice(1)
          ),
        baseStats,
        baseExpYield: pokemon.base_experience ?? baseSpecies.baseExpYield ?? 100,
        growthRate: baseSpecies.growthRate ?? 'mediumFast',
        catchRate: baseSpecies.catchRate ?? 45,
        weight: pokemon.weight ? +(pokemon.weight / 10).toFixed(1) : baseSpecies.weight,
      }
      if (baseSpecies.legendary) species[key].legendary = true
    }
    if (!abilities[key]) {
      const pokemon = readPokemon(id),
        abilityList = pokemon.abilities
          .filter((/** @type {any} */ entry) => !entry.is_hidden)
          .sort((/** @type {any} */ left, /** @type {any} */ right) => left.slot - right.slot)
          .map((/** @type {any} */ entry) => toCamel(entry.ability.name)),
        hidden = pokemon.abilities.find((/** @type {any} */ entry) => entry.is_hidden)
      abilities[key] = {
        abilities: abilityList,
        hidden: hidden ? toCamel(hidden.ability.name) : null,
      }
    }
    if (learnsets[base] && !learnsets[key]) learnsets[key] = learnsets[base]
    const list = evolutions[base] ?? (evolutions[base] = [])
    if (!list.some((/** @type {any} */ entry) => entry.into === key))
      list.push({ into: key, item })
    added++
  }

  for (const edge of EXTRA_EDGES) {
    const list = evolutions[edge.from] ?? (evolutions[edge.from] = [])
    if (!list.some((/** @type {any} */ entry) => entry.into === edge.to))
      list.push({ into: edge.to, item: edge.item })
  }

  fs.writeFileSync(SPECIES_PATH, JSON.stringify(species, null, 2) + '\n')
  fs.writeFileSync(ABILITY_PATH, JSON.stringify(abilities, null, 2) + '\n')
  fs.writeFileSync(EVOLUTIONS_PATH, JSON.stringify(evolutions, null, 2) + '\n')
  fs.writeFileSync(LEARNSETS_PATH, JSON.stringify(learnsets, null, 2) + '\n')
  console.log(`added ${added} formes (of ${FORMS.length})`)
  console.log('next: node tools/download_pokemon_sprites.cjs')
}

main()
