import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { elite4Data, gymLeaderData, mapData, regions } = await import('../src/data/gameData.js')
const { computeUnlockedLocations } = await import('../src/game/progression.js')

/** @param {string} regionId */
const region = (regionId) => /** @type {any} */ (regions.find((entry) => entry.id === regionId))

test('every region describes its own league track', () => {
  for (const entry of regions) {
    // DLC expansions have no gym/league track; their endgame is the raid island.
    if (entry.isDlc) continue
    assert.ok(entry.league, `${entry.id} has a league block`)
    assert.ok(['ordered', 'free'].includes(entry.league.badgeOrder), `${entry.id} badgeOrder is valid`)
    for (const field of ['badgeTrack', 'badgeName', 'eliteTrack']) {
      assert.equal(typeof entry.league[field], 'string', `${entry.id}.league.${field} is a string`)
      assert.ok(entry.league[field].length > 0, `${entry.id}.league.${field} is not empty`)
    }
  }
})

test('Alola re-labels its gyms as island trials and awards Z-Crystals', () => {
  const alola = region('alola')
  assert.equal(alola.league.badgeTrack, 'Island Trials')
  assert.equal(alola.league.badgeName, 'Z-Crystal')

  const alolaGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === 'alola')
  assert.ok(alolaGyms.length >= 8, 'Alola still has its full trial track')
  for (const gym of alolaGyms) assert.match(gym.title, /Trial Captain|Island Kahuna/)
  assert.ok(
    alolaGyms.some((gym) => gym.title.endsWith('Island Kahuna')),
    'at least one grand trial (island kahuna) is in the track'
  )
  for (const gym of alolaGyms) assert.match(gym.badgeName, /ium Z$/)
})

test('Alola runs the full 7 trials + 4 grand trials', () => {
  const alolaGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === 'alola')
  assert.equal(alolaGyms.length, 11)
  assert.equal(alolaGyms.filter((gym) => gym.title.endsWith('Island Kahuna')).length, 4)
  assert.equal(alolaGyms.filter((gym) => gym.title.endsWith('Trial Captain')).length, 7)
  // Every trial forces its badge index, so the island order can't be skipped.
  alolaGyms.forEach((gym, index) =>
    assert.equal(gym.badgesRequired ?? 0, index, `${gym.id} badge gate`)
  )
  // Mina and Hapu hold the Poni Island hub, and the league wants all 11.
  assert.equal(alolaGyms.at(-2)?.locationKey, 'alola-poni-island')
  assert.equal(alolaGyms.at(-1)?.locationKey, 'alola-poni-island')
  const league = Object.values(mapData).find((location) => location.id === 'alola-league')
  assert.deepEqual(league.unlock.gymsRequired, alolaGyms.map((gym) => gym.id))
})

test('Galar treats its endgame as the Champion Cup', () => {
  const galar = region('galar')
  assert.equal(galar.league.eliteTrack, 'Champion Cup')
  assert.equal(galar.league.badgeTrack, 'Gym Leaders')
  for (const member of elite4Data.filter((entry) => (entry.region ?? 'kanto') === 'galar'))
    assert.equal(member.title, 'Galar Champion Cup')
})

test('Paldea gyms run in Victory Road order and the league wants every badge', () => {
  const paldea = region('paldea')
  assert.equal(paldea.league.badgeOrder, 'ordered')

  const paldeaGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === 'paldea')
  const league = mapData[paldea.leagueLocationKey]
  assert.ok(league, 'the Paldea league location exists')
  assert.equal(league.unlock.badgesRequired, paldeaGyms.length)

  // Each gym town waits on the previous badge, so the open-world gyms are
  // fought in order (see tools/apply-paldea-progression.cjs).
  paldeaGyms.forEach((gym, index) => {
    const town = mapData[gym.locationKey]
    assert.ok(town, `${gym.id} has a town`)
    if (index === 0) {
      assert.equal(town.unlock?.gymsRequired, undefined, `${gym.id} needs no previous badge`)
      return
    }
    assert.deepEqual(
      town.unlock?.gymsRequired,
      [paldeaGyms[index - 1].id],
      `${gym.id} waits on ${paldeaGyms[index - 1].id}`
    )
  })

  // The league still opens on a badge count, so the count of defeated gyms is
  // what matters once they are all earned.
  /** @param {string[]} defeatedGyms */
  const state = (defeatedGyms) => ({
    unlockedLocations: ['paldea-east-province-area-two'],
    defeatedGyms,
    pokedexCaught: [],
    party: [],
    battlesWonByLocation: { 'paldea-east-province-area-two': 20 },
    startRegion: 'paldea',
    unlockedRegions: ['paldea'],
    defeatedChampions: [],
  })

  assert.ok(
    !computeUnlockedLocations(state([])).includes(league.id),
    'the league stays locked without badges'
  )
  assert.ok(
    computeUnlockedLocations(state(paldeaGyms.map((gym) => gym.id))).includes(league.id),
    'the league opens once every Paldea badge is earned'
  )
})
