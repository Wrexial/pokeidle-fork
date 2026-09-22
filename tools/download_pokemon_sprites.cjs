/**
 * Download every Pokemon sprite the game references.
 *
 * The save/game code looks up sprites purely by numeric id (see
 * getPokemonSpriteUrl in src/game/pokemon.js), so this walks the ids in
 * public/data/pokemon-species.json and fills in whatever is missing.
 *
 * Animated sprites: PokeAPI only has the official Generation V Black/White
 * animated gifs for Gen 1-5 (ids 1-649). For everything else we fall back to
 * Pokemon Showdown's animated set (sprites/pokemon/other/showdown), which is
 * fanned out across all generations in the same pixel style. Both end up in
 * the game's animated directory so the runtime URL stays a single path; the
 * handful of ids Showdown has no animation for stay static (the existing
 * onError fallback in the components).
 *
 * Static PNGs: front/back normal + shiny, used as the fallback and as the
 * permanent sprite for the ids with no animation at all.
 *
 * Idempotent: existing files are skipped, so it is safe to re-run.
 *
 * Usage:
 *   node tools/download_pokemon_sprites.cjs [--only=static|animated] [--force]
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SPECIES_PATH = path.join(ROOT, 'public', 'data', 'pokemon-species.json')
const STATIC_DIR = path.join(ROOT, 'public', 'sprites', 'pokemon')
const ANIMATED_DIR = path.join(STATIC_DIR, 'versions', 'generation-v', 'black-white', 'animated')

const POKEAPI = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const SHOWDOWN = `${POKEAPI}/other/showdown`
// A few Gen 9 forms exist only in Showdown's own gen5ani folder (not in
// PokeAPI's mirror), so try them by name as a last resort.
const SHOWDOWN_GEN5ANI = {
  992: 'ironhands',
  994: 'ironmoth',
  995: 'ironthorns',
  1006: 'ironvaliant',
  1008: 'miraidon',
}

const onlyArg = process.argv.find((arg) => arg.startsWith('--only='))
const ONLY = onlyArg ? onlyArg.split('=')[1] : null
const FORCE = process.argv.includes('--force')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/** Follows redirects; resolves true on 200, false on 404. */
function downloadFile(url, filepath, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'pokemon-idle-sprite-fetcher' } }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume()
          if (redirectsLeft <= 0) return reject(new Error(`Too many redirects for ${url}`))
          const next = new URL(response.headers.location, url).toString()
          return resolve(downloadFile(next, filepath, redirectsLeft - 1))
        }
        if (response.statusCode === 404) {
          response.resume()
          return resolve(false)
        }
        if (response.statusCode !== 200) {
          response.resume()
          return reject(new Error(`Status ${response.statusCode} for ${url}`))
        }

        ensureDir(path.dirname(filepath))
        const fileStream = fs.createWriteStream(filepath)
        response.pipe(fileStream)
        fileStream.on('finish', () => fileStream.close(() => resolve(true)))
        fileStream.on('error', reject)
      })
      .on('error', reject)
  })
}

/** Static variants: destination path builder + PokeAPI source. */
const STATIC_VARIANTS = [
  { name: 'front', dest: (id) => path.join(STATIC_DIR, `${id}.png`), url: (id) => `${POKEAPI}/${id}.png` },
  { name: 'back', dest: (id) => path.join(STATIC_DIR, 'back', `${id}.png`), url: (id) => `${POKEAPI}/back/${id}.png` },
  { name: 'shiny', dest: (id) => path.join(STATIC_DIR, 'shiny', `${id}.png`), url: (id) => `${POKEAPI}/shiny/${id}.png` },
  {
    name: 'back-shiny',
    dest: (id) => path.join(STATIC_DIR, 'back', 'shiny', `${id}.png`),
    url: (id) => `${POKEAPI}/back/shiny/${id}.png`,
  },
  // Female variants only exist for the ~100 species with a gender difference;
  // the rest 404 and are left out of the manifest below.
  {
    name: 'female-front',
    dest: (id) => path.join(STATIC_DIR, 'female', `${id}.png`),
    url: (id) => `${POKEAPI}/female/${id}.png`,
  },
  {
    name: 'female-back',
    dest: (id) => path.join(STATIC_DIR, 'back', 'female', `${id}.png`),
    url: (id) => `${POKEAPI}/back/female/${id}.png`,
  },
  {
    name: 'female-shiny',
    dest: (id) => path.join(STATIC_DIR, 'shiny', 'female', `${id}.png`),
    url: (id) => `${POKEAPI}/shiny/female/${id}.png`,
  },
  {
    name: 'female-back-shiny',
    dest: (id) => path.join(STATIC_DIR, 'back', 'shiny', 'female', `${id}.png`),
    url: (id) => `${POKEAPI}/back/shiny/female/${id}.png`,
  },
]

/**
 * Animated variants: saved into the game's animated directory, but sourced
 * from the official Gen V set first and Showdown second.
 */
const ANIMATED_VARIANTS = [
  { name: 'front', sub: '', sdSub: '' },
  { name: 'back', sub: 'back', sdSub: 'back' },
  { name: 'shiny', sub: 'shiny', sdSub: 'shiny' },
  { name: 'back-shiny', sub: 'back/shiny', sdSub: 'back/shiny' },
  // Female animated sprites only exist in PokeAPI's Gen V set (ids 1-649);
  // Showdown has no clean female-animated set, so those simply stay static.
  { name: 'female-front', sub: 'female', female: true },
  { name: 'female-back', sub: 'back/female', female: true },
  { name: 'female-shiny', sub: 'shiny/female', female: true },
  { name: 'female-back-shiny', sub: 'back/shiny/female', female: true },
].map((variant) => ({
  name: `animated-${variant.name}`,
  dest: (id) => path.join(ANIMATED_DIR, variant.sub, `${id}.gif`),
  sources: (id) => {
    if (variant.female)
      return id <= 649
        ? [`${POKEAPI}/versions/generation-v/black-white/animated/${variant.sub}/${id}.gif`]
        : []
    const showdown = `${SHOWDOWN}/${variant.sdSub ? variant.sdSub + '/' : ''}${id}.gif`
    // Gen V animated only exists for the national dex ids 1-649.
    if (id > 649) {
      const sources = [showdown]
      const name = SHOWDOWN_GEN5ANI[id]
      if (name && (variant.sdSub === '' || variant.sdSub === 'shiny'))
        sources.push(
          `https://play.pokemonshowdown.com/sprites/gen5ani${
            variant.sdSub === 'shiny' ? '-shiny' : ''
          }/${name}.gif`
        )
      return sources
    }
    return [
      `${POKEAPI}/versions/generation-v/black-white/animated/${variant.sub ? variant.sub + '/' : ''}${id}.gif`,
      showdown,
    ]
  },
}))

const stats = { downloaded: 0, skipped: 0, missing: 0, failed: 0 }
const missingLog = []

async function fetchVariant(task, id) {
  const dest = task.dest(id)
  if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    stats.skipped++
    return
  }

  const sources = task.sources ? task.sources(id) : [task.url(id)]
  for (const url of sources) {
    try {
      if (await downloadFile(url, dest)) {
        stats.downloaded++
        return
      }
    } catch (error) {
      stats.failed++
      console.error(`\n  Error ${task.name} #${id}: ${error.message}`)
      return
    }
  }

  stats.missing++
  missingLog.push(`${task.name} #${id}`)
}

/** Runs the tasks with a small concurrency pool so GitHub isn't hammered. */
async function runPool(tasks, ids, concurrency = 8) {
  let next = 0
  let lastLog = 0
  async function worker() {
    while (next < ids.length) {
      const index = next++
      for (const task of tasks) await fetchVariant(task, ids[index])
      if (index - lastLog >= 100) {
        lastLog = index
        console.log(`  ...${index}/${ids.length} ids`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker))
}

async function main() {
  const species = JSON.parse(fs.readFileSync(SPECIES_PATH, 'utf8'))
  const ids = [...new Set(Object.values(species).map((entry) => entry.id))].filter((id) => id > 0).sort((a, b) => a - b)
  console.log(`Filling sprites for ${ids.length} species ids (ids > 0).\n`)

  if (!ONLY || ONLY === 'static') {
    console.log('Static sprites (front / back / shiny / back-shiny)...')
    await runPool(STATIC_VARIANTS, ids)
  }
  if (!ONLY || ONLY === 'animated') {
    console.log('Animated sprites (Gen V official, Showdown fallback)...')
    await runPool(ANIMATED_VARIANTS, ids)
  }

  // Record which animated variants are still missing so the game can use the
  // static png straight away instead of requesting a 404 gif first.
  const missingAnimated = { front: [], back: [], shiny: [], backShiny: [] }
  const animatedSubdirs = { front: '', back: 'back', shiny: 'shiny', backShiny: 'back/shiny' }
  for (const [category, sub] of Object.entries(animatedSubdirs))
    missingAnimated[category] = ids.filter(
      (id) => !fs.existsSync(path.join(ANIMATED_DIR, sub, `${id}.gif`))
    )
  fs.writeFileSync(
    path.join(ROOT, 'public', 'data', 'animated-sprites.json'),
    JSON.stringify(missingAnimated, null, 1) + '\n'
  )
  console.log('Wrote animated-sprites.json (missing animated variants).')

  // Record which ids actually have a female sprite per variant, so the game can
  // pick the female path without ever requesting a 404.
  const genderedSprites = {
    front: [],
    back: [],
    shiny: [],
    backShiny: [],
    animatedFront: [],
    animatedBack: [],
    animatedShiny: [],
    animatedBackShiny: [],
  }
  const staticFemaleDirs = {
    front: 'female',
    back: path.join('back', 'female'),
    shiny: path.join('shiny', 'female'),
    backShiny: path.join('back', 'shiny', 'female'),
  }
  for (const [category, sub] of Object.entries(staticFemaleDirs))
    genderedSprites[category] = ids.filter((id) =>
      fs.existsSync(path.join(STATIC_DIR, sub, `${id}.png`))
    )
  const animatedFemaleDirs = {
    animatedFront: 'female',
    animatedBack: path.join('back', 'female'),
    animatedShiny: path.join('shiny', 'female'),
    animatedBackShiny: path.join('back', 'shiny', 'female'),
  }
  for (const [category, sub] of Object.entries(animatedFemaleDirs))
    genderedSprites[category] = ids.filter((id) =>
      fs.existsSync(path.join(ANIMATED_DIR, sub, `${id}.gif`))
    )
  fs.writeFileSync(
    path.join(ROOT, 'public', 'data', 'gendered-sprites.json'),
    JSON.stringify(genderedSprites, null, 1) + '\n'
  )
  console.log('Wrote gendered-sprites.json (ids with a female sprite per variant).')

  console.log('\nSummary:')
  console.log(`  downloaded: ${stats.downloaded}`)
  console.log(`  skipped:    ${stats.skipped}`)
  console.log(`  missing:    ${stats.missing}`)
  console.log(`  failed:     ${stats.failed}`)
  if (missingLog.length) {
    console.log('\nNo source found for:')
    for (const entry of missingLog) console.log(`  ${entry}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
