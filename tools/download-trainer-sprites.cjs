/**
 * Download the generic trainer-class sprites the generated route trainers use.
 *
 * `src/components/battle-scene.js` shows a trainer's sprite from
 * `public/sprites/trainers/<key>.png`, keyed by the class in
 * public/data/trainer-classes.json. The generic classes come from Pokemon
 * Showdown's trainer sprite set (80x80, the same art the existing classes use),
 * so this script keeps the sprite tree in sync with the class table: add a
 * class to trainer-classes.json, then re-run this to fetch its art.
 *
 * Idempotent: existing files are skipped, so it is safe to re-run.
 *
 * Usage:
 *   node tools/download-trainer-sprites.cjs [--force]
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SPRITE_DIR = path.join(ROOT, 'public', 'sprites', 'trainers')
const CLASSES_PATH = path.join(ROOT, 'public', 'data', 'trainer-classes.json')
const SHOWDOWN = 'https://play.pokemonshowdown.com/sprites/trainers'

const FORCE = process.argv.includes('--force')

/** Streams `url` to `filepath`; resolves true on 200, false on 404. */
function downloadFile(url, filepath) {
  return fetch(url, { headers: { 'User-Agent': 'pokemon-idle-sprite-fetcher' } }).then(
    async (response) => {
      if (response.status === 404) return false
      if (!response.ok) throw new Error(`Status ${response.status} for ${url}`)
      fs.mkdirSync(path.dirname(filepath), { recursive: true })
      fs.writeFileSync(filepath, Buffer.from(await response.arrayBuffer()))
      return true
    }
  )
}

async function main() {
  const classes = /** @type {Record<string, string>} */ (
      JSON.parse(fs.readFileSync(CLASSES_PATH, 'utf8'))
    ),
    spriteKeys = [...new Set(Object.values(classes))].sort(),
    missing = []
  for (const key of spriteKeys) {
    const filepath = path.join(SPRITE_DIR, `${key}.png`)
    if (fs.existsSync(filepath) && !FORCE) continue
    const ok = await downloadFile(`${SHOWDOWN}/${key}.png`, filepath)
    if (ok) console.log(`downloaded ${key}.png`)
    else missing.push(key)
  }
  console.log(`trainer sprites: ${spriteKeys.length} classes, ${missing.length} missing`)
  if (missing.length) console.log(`missing: ${missing.join(', ')}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
