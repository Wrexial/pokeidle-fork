#!/usr/bin/env node
/**
 * Expand Alola's badge track to the real 7 island trials + 4 grand trials
 * (11 Z-Crystals) on the committed data (#40).
 *
 * The committed data isn't idempotent with `generate-regions.cjs`, so this is a
 * data-only follow-up (like the other apply-*.cjs scripts). It reorders the
 * Alola gyms, interleaving the grand-trial kahunas, moves Mina/Hapu to Poni
 * Island, forces the canonical order with `badgesRequired`, and points the
 * league at all 11. The generator's LEAGUES/GYM_LEADERS/GYM_TOWNS/BADGE_NAMES
 * tables are updated to match (see generate-regions.cjs).
 *
 * Idempotent. Usage: node tools/apply-alola-trials.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')
const { buildEvolutionLevels, stageForLevel } = require('./lib/evolution-levels.cjs')

const DATA = path.join(__dirname, '../public/data')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))
const write = (file, indent, data) =>
  fs.writeFileSync(path.join(DATA, file), JSON.stringify(data, null, indent) + '\n')

const TYPE_COLORS = {
  Normal: '#a8a878',
  Fire: '#f08030',
  Water: '#6890f0',
  Electric: '#f8d030',
  Grass: '#78c850',
  Ice: '#98d8d8',
  Fighting: '#c03028',
  Poison: '#a040a0',
  Ground: '#e0c068',
  Flying: '#a890f0',
  Psychic: '#f85888',
  Bug: '#a8b820',
  Rock: '#b8a038',
  Ghost: '#705898',
  Dragon: '#7038f8',
  Dark: '#705848',
  Steel: '#b8b8d0',
  Fairy: '#ee99ac',
}

// The real Alola track, in play order: each island's trial(s) then its grand
// trial. Towns match the scraped map (Poni's a zone hub).
const TRACK = [
  { id: 'alola-gym-1', name: 'Ilima', type: 'Normal', title: 'Trial Captain', badge: 'Normalium Z', location: 'alola-hauoli-city', level: 12 },
  { id: 'alola-grand-hala', name: 'Hala', type: 'Fighting', title: 'Island Kahuna', badge: 'Fightinium Z', location: 'alola-iki-town', level: 17, generated: true },
  { id: 'alola-gym-2', name: 'Lana', type: 'Water', title: 'Trial Captain', badge: 'Waterium Z', location: 'alola-konikoni-city', level: 22 },
  { id: 'alola-gym-3', name: 'Kiawe', type: 'Fire', title: 'Trial Captain', badge: 'Firium Z', location: 'alola-paniola-town', level: 27 },
  { id: 'alola-gym-4', name: 'Mallow', type: 'Grass', title: 'Trial Captain', badge: 'Grassium Z', location: 'alola-heahea-city', level: 33 },
  { id: 'alola-grand-olivia', name: 'Olivia', type: 'Rock', title: 'Island Kahuna', badge: 'Rockium Z', location: 'alola-konikoni-city', level: 38, generated: true },
  { id: 'alola-gym-5', name: 'Sophocles', type: 'Electric', title: 'Trial Captain', badge: 'Electrium Z', location: 'alola-malie-city', level: 43 },
  { id: 'alola-gym-6', name: 'Acerola', type: 'Ghost', title: 'Trial Captain', badge: 'Ghostium Z', location: 'alola-po-town', level: 48 },
  { id: 'alola-grand-nanu', name: 'Nanu', type: 'Dark', title: 'Island Kahuna', badge: 'Darkinium Z', location: 'alola-po-town', level: 53, generated: true },
  { id: 'alola-gym-7', name: 'Mina', type: 'Fairy', title: 'Trial Captain', badge: 'Fairium Z', location: 'alola-poni-island', level: 59 },
  { id: 'alola-gym-8', name: 'Hapu', type: 'Ground', title: 'Island Kahuna', badge: 'Groundium Z', location: 'alola-poni-island', level: 64 },
]

const dry = process.argv.includes('--dry')
const species = read('pokemon-species.json')
const evolutionData = read('evolution-data.json')
const levels = buildEvolutionLevels(evolutionData, species)
const gyms = read('gym-leader-data.json')

/** @param {string} type @param {number} size @param {number} target @param {number} maxId */
function buildTeam(type, size, target, maxId) {
  const candidates = Object.entries(species)
    .filter(
      ([, entry]) =>
        entry.id > 0 &&
        entry.id <= maxId &&
        !entry.legendary &&
        (entry.catchRate ?? 255) > 3 &&
        (entry.types ?? []).includes(type)
    )
    .map(([key, entry]) => ({
      key,
      total: Object.values(entry.baseStats ?? {}).reduce((sum, value) => sum + value, 0),
    }))
    .sort((a, b) => b.total - a.total)
  const picked = []
  // Prefer a staged (level-appropriate) form that is still on-theme.
  for (const candidate of candidates) {
    const staged = stageForLevel(candidate.key, target, levels)
    if ((species[staged]?.types ?? []).includes(type) && !picked.includes(staged)) picked.push(staged)
    if (picked.length >= size) break
  }
  // Fall back to off-theme pre-evolutions (but never empty a sparse type).
  for (const candidate of candidates) {
    if (picked.length >= size) break
    const staged = stageForLevel(candidate.key, target, levels)
    if (!picked.includes(staged)) picked.push(staged)
  }
  const start = target - Math.floor((size - 1) / 2)
  return picked.slice(0, size).map((key, index) => ({ speciesKey: key, level: start + index }))
}

/** Rescale a team's levels around a target, keeping its species. */
function levelTeam(team, target) {
  const start = target - Math.floor((team.length - 1) / 2)
  return team.map((member, index) => ({ speciesKey: member.speciesKey, level: start + index }))
}

const existingById = Object.fromEntries(gyms.map((gym) => [gym.id, gym]))
let added = 0
const alolaTrack = TRACK.map((entry, index) => {
  const previous = existingById[entry.id]
  if (!previous) added++
  const team = !entry.generated && previous?.team?.length
      ? levelTeam(previous.team, entry.level)
      : buildTeam(entry.type, Math.min(5, 3 + Math.floor(index / 3)), entry.level, 809),
    rematchTeam = !entry.generated && previous?.rematchTeam?.length
      ? previous.rematchTeam
      : buildTeam(entry.type, 6, 80, 1025)
  return {
    id: entry.id,
    name: entry.name,
    title: `Alola ${entry.title}`,
    region: 'alola',
    locationKey: entry.location,
    badgeName: entry.badge,
    badgeColor: TYPE_COLORS[entry.type] ?? '#a0a0a0',
    spriteKey: previous?.spriteKey ?? entry.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    ...(index > 0 ? { badgesRequired: index } : {}),
    team,
    rematchTeam,
  }
})

// Replace the Alola block in place so every other region's order is untouched.
const firstAlola = gyms.findIndex((gym) => (gym.region ?? 'kanto') === 'alola')
const withoutAlola = gyms.filter((gym) => (gym.region ?? 'kanto') !== 'alola')
const nextGyms = [
  ...withoutAlola.slice(0, firstAlola < 0 ? withoutAlola.length : firstAlola),
  ...alolaTrack,
  ...withoutAlola.slice(firstAlola < 0 ? withoutAlola.length : firstAlola),
]

// Point the league at all 11 Z-Crystals.
const mapFile = path.join(DATA, 'map-data', 'alola.json')
const alolaMap = JSON.parse(fs.readFileSync(mapFile, 'utf8'))
const league = alolaMap['alola-league']
if (!league) throw new Error('alola-league location not found')
league.unlock.gymsRequired = alolaTrack.map((gym) => gym.id)

if (dry) {
  console.log(`would write ${alolaTrack.length} Alola gyms (${added} new)`)
} else {
  write('gym-leader-data.json', 1, nextGyms)
  fs.writeFileSync(mapFile, JSON.stringify(alolaMap, null, 1) + '\n')
  console.log(`wrote ${alolaTrack.length} Alola gyms (${added} new)`)
}
