#!/usr/bin/env node
/**
 * Add the Legends: Z-A Mega Evolutions PokeAPI has but the extracted bundle
 * predates (pokemon ids 10278-10326). They were missing from
 * pokemon-species.json, so the Mega Stone could never reach them.
 *
 * Adds to pokemon-species.json (stats/types/weight), ability-data.json,
 * evolution-data.json (`base -> m-key` at level 100, which is how the game
 * discovers Megas) and possible-learnsets.json (borrowed from the base form,
 * since a Mega uses its base's movepool).
 *
 * A few Z-A Megas belong to forms the game doesn't model separately (female
 * Meowstic, droopy/stretchy Tatsugiri, Original Magearna); they are attached to
 * the form the game does have so they stay obtainable.
 *
 * Idempotent: species already present are skipped. PokeAPI responses are cached
 * under tools/cache/ (gitignored), so re-running is offline.
 *
 * Usage: node tools/add-mega-forms.cjs
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

/** `[PokeAPI id, game key, base species key, display name]`. */
const MEGAS = [
  [10278, 'm-clefable', 'clefable', 'Mega Clefable'],
  [10279, 'm-victreebel', 'victreebel', 'Mega Victreebel'],
  [10280, 'm-starmie', 'starmie', 'Mega Starmie'],
  [10282, 'm-meganium', 'meganium', 'Mega Meganium'],
  [10284, 'm-skarmory', 'skarmory', 'Mega Skarmory'],
  [10285, 'm-froslass', 'froslass', 'Mega Froslass'],
  [10286, 'm-emboar', 'emboar', 'Mega Emboar'],
  [10287, 'm-excadrill', 'excadrill', 'Mega Excadrill'],
  [10288, 'm-scolipede', 'scolipede', 'Mega Scolipede'],
  [10289, 'm-scrafty', 'scrafty', 'Mega Scrafty'],
  [10290, 'm-eelektross', 'eelektross', 'Mega Eelektross'],
  [10291, 'm-chandelure', 'chandelure', 'Mega Chandelure'],
  [10292, 'm-chesnaught', 'chesnaught', 'Mega Chesnaught'],
  [10293, 'm-delphox', 'delphox', 'Mega Delphox'],
  [10294, 'm-greninja', 'greninja', 'Mega Greninja'],
  [10295, 'm-pyroar', 'pyroar', 'Mega Pyroar'],
  [10296, 'm-floette', 'floette', 'Mega Floette'],
  [10297, 'm-malamar', 'malamar', 'Mega Malamar'],
  [10298, 'm-barbaracle', 'barbaracle', 'Mega Barbaracle'],
  [10299, 'm-dragalge', 'dragalge', 'Mega Dragalge'],
  [10300, 'm-hawlucha', 'hawlucha', 'Mega Hawlucha'],
  [10301, 'm-zygarde', 'zygarde', 'Mega Zygarde'],
  [10302, 'm-drampa', 'drampa', 'Mega Drampa'],
  [10303, 'm-falinks', 'falinks', 'Mega Falinks'],
  [10304, 'm-raichu x', 'raichu', 'Mega Raichu X'],
  [10305, 'm-raichu y', 'raichu', 'Mega Raichu Y'],
  [10306, 'm-chimecho', 'chimecho', 'Mega Chimecho'],
  [10307, 'm-absol z', 'absol', 'Mega Absol Z'],
  [10308, 'm-staraptor', 'staraptor', 'Mega Staraptor'],
  [10309, 'm-garchomp z', 'garchomp', 'Mega Garchomp Z'],
  [10310, 'm-lucario z', 'lucario', 'Mega Lucario Z'],
  [10311, 'm-heatran', 'heatran', 'Mega Heatran'],
  [10312, 'm-darkrai', 'darkrai', 'Mega Darkrai'],
  [10313, 'm-golurk', 'golurk', 'Mega Golurk'],
  [10314, 'm-meowstic', 'meowstic', 'Mega Meowstic'],
  [10315, 'm-crabominable', 'crabominable', 'Mega Crabominable'],
  [10316, 'm-golisopod', 'golisopod', 'Mega Golisopod'],
  [10317, 'm-magearna', 'magearna', 'Mega Magearna'],
  [10318, 'm-magearna-o', 'magearna', 'Mega Magearna (Original)'],
  [10319, 'm-zeraora', 'zeraora', 'Mega Zeraora'],
  [10320, 'm-scovillain', 'scovillain', 'Mega Scovillain'],
  [10321, 'm-glimmora', 'glimmora', 'Mega Glimmora'],
  [10322, 'm-tatsugiri', 'tatsugiri', 'Mega Tatsugiri'],
  [10323, 'm-tatsugiri-droopy', 'tatsugiri', 'Mega Tatsugiri (Droopy)'],
  [10324, 'm-tatsugiri-stretchy', 'tatsugiri', 'Mega Tatsugiri (Stretchy)'],
  [10325, 'm-baxcalibur', 'baxcalibur', 'Mega Baxcalibur'],
  [10326, 'm-meowstic-f', 'meowstic', 'Mega Meowstic (Female)'],
]

const toCamel = (/** @type {string} */ name) =>
  name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase())

/** @param {string} url @param {string} file */
async function cached(url, file) {
  const cachePath = path.join(CACHE, file)
  if (fs.existsSync(cachePath)) return JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  const response = await fetch(url, { headers: { 'User-Agent': 'pokemon-idle-data' } })
  if (!response.ok) throw new Error(`${response.status} for ${url}`)
  const json = await response.json()
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(json))
  return json
}

async function main() {
  const species = JSON.parse(fs.readFileSync(SPECIES_PATH, 'utf8')),
    abilities = JSON.parse(fs.readFileSync(ABILITY_PATH, 'utf8')),
    evolutions = JSON.parse(fs.readFileSync(EVOLUTIONS_PATH, 'utf8')),
    learnsets = JSON.parse(fs.readFileSync(LEARNSETS_PATH, 'utf8'))

  let added = 0
  for (const [id, key, base, name] of MEGAS) {
    if (species[key]) continue
    const baseSpecies = species[base]
    if (!baseSpecies) {
      console.warn(`skipping ${key}: base ${base} is missing`)
      continue
    }
    const pokemon = await cached(
      `https://pokeapi.co/api/v2/pokemon/${id}/`,
      `pokeapi-pokemon-${id}.json`
    )
    if (pokemon.name && !species[key]) {
      const baseStats = {}
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
          .map((/** @type {any} */ entry) =>
            entry.type.name.charAt(0).toUpperCase() + entry.type.name.slice(1)
          ),
        baseStats,
        baseExpYield: pokemon.base_experience ?? baseSpecies.baseExpYield ?? 100,
        growthRate: baseSpecies.growthRate ?? 'mediumFast',
        catchRate: baseSpecies.catchRate ?? 45,
        weight: pokemon.weight ? +(pokemon.weight / 10).toFixed(1) : baseSpecies.weight,
      }
      const abilityList = pokemon.abilities
          .filter((/** @type {any} */ entry) => !entry.is_hidden)
          .sort((/** @type {any} */ left, /** @type {any} */ right) => left.slot - right.slot)
          .map((/** @type {any} */ entry) => toCamel(entry.ability.name)),
        hidden = pokemon.abilities.find((/** @type {any} */ entry) => entry.is_hidden),
        // A few new legendary Megas have no ability in PokeAPI yet; keep the
        // base form's rather than leaving them with none.
        baseAbilities = abilities[base] ?? { abilities: [], hidden: null }
      abilities[key] = {
        abilities: abilityList.length > 0 ? abilityList : [...(baseAbilities.abilities ?? [])],
        hidden: hidden ? toCamel(hidden.ability.name) : (baseAbilities.hidden ?? null),
      }
      const list = evolutions[base] ?? (evolutions[base] = [])
      if (!list.some((/** @type {any} */ entry) => entry.into === key))
        list.push({ into: key, level: 100 })
      if (learnsets[base] && !learnsets[key]) learnsets[key] = learnsets[base]
      added++
    }
  }

  // Repair any already-added Mega whose ability is still empty.
  for (const [, key, base] of MEGAS) {
    const entry = abilities[key]
    if (entry && (entry.abilities?.length ?? 0) === 0) {
      const baseAbilities = abilities[base]
      if (baseAbilities)
        abilities[key] = {
          abilities: [...(baseAbilities.abilities ?? [])],
          hidden: baseAbilities.hidden ?? null,
        }
    }
  }

  fs.writeFileSync(SPECIES_PATH, JSON.stringify(species, null, 2) + '\n')
  fs.writeFileSync(ABILITY_PATH, JSON.stringify(abilities, null, 2) + '\n')
  fs.writeFileSync(EVOLUTIONS_PATH, JSON.stringify(evolutions, null, 2) + '\n')
  fs.writeFileSync(LEARNSETS_PATH, JSON.stringify(learnsets, null, 2) + '\n')
  console.log(`added ${added} Mega forms (of ${MEGAS.length})`)
  console.log('next: node tools/download_pokemon_sprites.cjs')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
