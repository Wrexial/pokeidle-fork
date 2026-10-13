#!/usr/bin/env node
/**
 * Data-only pass: soften the post-game Elite Four / Champion rematches.
 *
 * `generate-regions.cjs` now ramps a league rematch to an ace over its six-deep
 * roster — Elite Four Lv. 75-85 (ace 85), Champion Lv. 85-95 (ace 95) — but the
 * committed `public/data` still carries the old flat Lv. 90-95 / 92-97 bands,
 * and a full regeneration would churn unrelated content (random trainer teams,
 * raid pools, Kanto's encounters). This rewrites just the `rematchTeam` levels;
 * the species are left untouched.
 *
 * Idempotent: re-running only touches rosters still off their band. Obsolete
 * once `public/data` is regenerated from scratch.
 *
 * Usage:
 *   node tools/apply-elite-rematch-levels.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '..', 'public', 'data')
const DRY = process.argv.includes('--dry')

/**
 * A roster's levels, evenly spread from its first member to its ace. For the
 * six-deep rosters this is E4 [75,77,79,81,83,85] / Champion
 * [85,87,89,91,93,95].
 * @param {number} count
 * @param {number} firstLevel
 * @param {number} aceLevel
 */
function targetLevels(count, firstLevel, aceLevel) {
  if (count <= 1) return [aceLevel]
  return Array.from({ length: count }, (_, index) =>
    Math.round(firstLevel + (index / (count - 1)) * (aceLevel - firstLevel))
  )
}

const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))
const write = (file, value) =>
  fs.writeFileSync(path.join(DATA, file), JSON.stringify(value, null, 1) + '\n')

/** file, first level, ace level */
const BANDS = [
  ['elite-4-data.json', 75, 85],
  ['champion-data.json', 85, 95],
]

let changed = 0
for (const [file, firstLevel, aceLevel] of BANDS) {
  const data = read(file)
  let fileChanged = 0
  for (const trainer of data) {
    const team = trainer.rematchTeam
    if (!team?.length) continue
    const targets = targetLevels(team.length, firstLevel, aceLevel)
    team.forEach((member, index) => {
      if (member.level !== targets[index]) {
        member.level = targets[index]
        fileChanged++
      }
    })
  }
  if (fileChanged) {
    changed += fileChanged
    console.log(`${file}  ${fileChanged} level(s) retuned to Lv. ${firstLevel}-${aceLevel}`)
    if (!DRY) write(file, data)
  }
}
console.log(`${DRY ? 'would retune' : 'retuned'} ${changed} rematch level(s)`)
