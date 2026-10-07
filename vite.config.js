import { defineConfig } from 'vite'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Minify the game data JSON in the build output.
 *
 * The committed `public/data/*.json` stay pretty-printed so their diffs are
 * readable, but the served copies do not need the whitespace: every byte here
 * also lands in the offline cache (Cache Storage keeps the decompressed body),
 * and minifying cuts the data set by about a third.
 */
function minifyGameData() {
  return {
    name: 'pokemon-idle-minify-game-data',
    apply: 'build',
    closeBundle() {
      const dataDir = join(process.cwd(), 'dist', 'data')
      let count = 0
      let before = 0
      let after = 0
      /** @param {string} dir */
      const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const path = join(dir, entry.name)
          if (entry.isDirectory()) {
            walk(path)
          } else if (entry.name.endsWith('.json')) {
            const minified = JSON.stringify(JSON.parse(readFileSync(path, 'utf8')))
            before += readFileSync(path).length
            after += Buffer.byteLength(minified)
            writeFileSync(path, minified)
            count++
          }
        }
      }
      walk(dataDir)
      const saved = ((before - after) / 1048576).toFixed(2)
      console.log(`  minified ${count} data files (−${saved} MB)`)
    },
  }
}

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: 'index.html'
    }
  },
  plugins: [minifyGameData()],
})
