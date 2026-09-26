import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { SFX, playSfx } = await import('../src/game/audio.js')

test('every playSfx call names a real sound effect', () => {
  /** @type {string[]} */
  const files = []
  /** @param {string} dir */
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.js')) files.push(full)
    }
  }
  walk(join(root, 'src'))

  const missing = new Set()
  for (const file of files)
    for (const match of readFileSync(file, 'utf8').matchAll(/playSfx\(\s*'([^']+)'/g))
      if (!SFX[match[1]]) missing.add(`${match[1]} (${file.slice(root.length + 1)})`)
  assert.equal(missing.size, 0, `unknown SFX: ${[...missing].join(', ')}`)
})

test('the sound-effect table is well formed', () => {
  for (const [name, notes] of Object.entries(SFX)) {
    assert.ok(Array.isArray(notes) && notes.length > 0, `${name} has notes`)
    for (const note of notes) {
      assert.equal(note.length, 3, `${name} note is [frequency, offset, duration]`)
      assert.ok(note[0] > 0 && note[1] >= 0 && note[2] > 0, `${name} note values are positive`)
    }
  }
  assert.doesNotThrow(() => playSfx('not-a-real-sound'))
})
