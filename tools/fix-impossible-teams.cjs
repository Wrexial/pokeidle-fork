#!/usr/bin/env node
/**
 * One-time sync: step trainer, gym, Elite Four and Champion Pokemon back to a
 * form that could exist at their level.
 *
 * The compressed Lv. 5-75 curve can hand a low-level trainer a final evolution
 * (a Lv. 7 Machamp, a Lv. 9 Tyranitar). This walks each team member to the most
 * evolved form valid at its level (see lib/evolution-levels.cjs).
 *
 * Idempotent: re-running changes nothing. Once the data is regenerated from
 * scratch this is obsolete (generate-regions.cjs filters at team-build time).
 *
 * Usage:
 *   node tools/fix-impossible-teams.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')
const { buildEvolutionLevels, stageForLevel } = require('./lib/evolution-levels.cjs')

const DATA = path.join(__dirname, '..', 'public', 'data')
const DRY = process.argv.includes('--dry')
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const levels = buildEvolutionLevels(read(path.join(DATA, 'evolution-data.json')), read(path.join(DATA, 'pokemon-species.json')))

/** @param {{ team?: any[], rematchTeam?: any[] }} record */
function fixRecord(record) {
  let changes = 0
  for (const key of ['team', 'rematchTeam'])
    for (const member of record[key] ?? []) {
      if (!member?.speciesKey) continue
      const next = stageForLevel(member.speciesKey, member.level, levels)
      if (next !== member.speciesKey) {
        member.speciesKey = next
        changes++
      }
    }
  return changes
}

/** @type {[string, (data: any) => any[]][]} */
const FILES = [
  // trainer-data.json is keyed by location, each holding an array of trainers.
  ['trainer-data.json', (data) => Object.values(data).flat()],
  ['gym-leader-data.json', (data) => data],
  ['elite-4-data.json', (data) => data],
  ['champion-data.json', (data) => data],
]

let changed = 0
for (const [file, recordsOf] of FILES) {
  const filePath = path.join(DATA, file),
    data = read(filePath)
  let fileChanges = 0
  for (const record of recordsOf(data)) fileChanges += fixRecord(record)
  if (!fileChanges) continue
  changed += fileChanges
  console.log(`${file.replace(/\.json$/, '')}: ${fileChanges} change(s)`)
  if (!DRY) fs.writeFileSync(filePath, JSON.stringify(data, null, 1) + '\n')
}
console.log(`${DRY ? 'would change' : 'changed'} ${changed} member(s)`)
