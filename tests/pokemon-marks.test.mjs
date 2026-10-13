import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  ALPHA_SIZE,
  MARK_CHANCE,
  MARKS,
  RARE_MARK_CHANCE,
  createPokemon,
  generateIVs,
  markTitle,
  markTooltip,
  nextBoxSortField,
  parseBoxSort,
  resolveMark,
  rollMark,
  sortBoxMembers,
  storedMark,
} = await import('../src/game/pokemon.js')
const { repairSave } = await import('../src/game/save.js')

/** Run `rollMark` against a fixed sequence of rng values. @param {number[]} values */
function rollWith(values) {
  let index = 0
  return rollMark(() => values[index++])
}

test('every mark is a well-formed title', () => {
  for (const [key, mark] of Object.entries(MARKS)) {
    assert.equal(mark.id, key)
    assert.ok(mark.name && mark.title && mark.description && mark.icon, `${key} is complete`)
    assert.ok(mark.title.startsWith('the '), `${key} has a "the ..." title`)
    assert.ok(mark.weight >= 0)
  }
  // The four example titles exist.
  assert.equal(MARKS.sleepy.title, 'the Sleepy')
  assert.equal(MARKS.lunchtime.title, 'the Lunchtime')
  assert.equal(MARKS.alpha.title, 'the Alpha')
  assert.equal(MARKS.shiny.title, 'the Shiny')
})

test('rollMark only marks a small share of individuals', () => {
  assert.equal(MARK_CHANCE, 0.05)
  // No mark: the first roll lands outside the mark window.
  assert.equal(rollWith([0.5]), null)
  assert.equal(rollWith([MARK_CHANCE]), null)
})

test('rollMark can roll the rare mark and the common pool', () => {
  // In the window, then inside the rare share.
  assert.equal(rollWith([0, 0]), 'rare')
  assert.equal(rollWith([0, RARE_MARK_CHANCE - 0.001]), 'rare')
  // In the window, outside the rare share, then the first pool entry.
  assert.equal(rollWith([0, RARE_MARK_CHANCE, 0]), 'sleepy')
  // A roll near the top of the pool picks a valid mark too.
  assert.ok(MARKS[rollWith([0, RARE_MARK_CHANCE, 0.999])])
})

test('a fresh Pokemon rolls a mark, or none at all', () => {
  for (let run = 0; run < 200; run++) {
    const pokemon = createPokemon('bulbasaur', 5, run)
    assert.ok(pokemon.mark === null || Boolean(MARKS[pokemon.mark]), 'mark is null or known')
  }
})

test('resolveMark prefers the rolled mark, then shiny, then alpha', () => {
  assert.equal(resolveMark({ mark: 'sleepy', isShiny: true, size: 255 })?.id, 'sleepy')
  assert.equal(resolveMark({ mark: null, isShiny: true, size: 0 })?.id, 'shiny')
  assert.equal(resolveMark({ isShiny: true, size: ALPHA_SIZE })?.id, 'shiny')
  assert.equal(resolveMark({ isShiny: false, size: ALPHA_SIZE })?.id, 'alpha')
  assert.equal(resolveMark({ isShiny: false, size: 128 }), null)
  assert.equal(resolveMark(null), null)
  assert.equal(storedMark({ mark: 'nonsense' }), null)
})

test('markTitle and markTooltip name the resolved mark', () => {
  assert.equal(markTitle({ mark: 'rare' }), 'the Recluse')
  assert.equal(markTitle({ isShiny: true }), 'the Shiny')
  assert.equal(markTitle({}), '')
  assert.match(markTooltip({ mark: 'sleepy' }), /Sleepy/)
  assert.equal(markTooltip({}), '')
})

test('sortBoxMembers orders marked individuals first', () => {
  const box = [
      { ...createPokemon('pidgey', 5, 'a'), mark: 'sleepy' },
      { ...createPokemon('rattata', 5, 'b'), mark: 'rare' },
      { ...createPokemon('caterpie', 5, 'c'), mark: null },
    ],
    desc = sortBoxMembers(box, 'mark_desc'),
    asc = sortBoxMembers(box, 'mark_asc')
  assert.ok(desc[0].mark, 'descending puts a marked individual first')
  assert.equal(desc[desc.length - 1].mark, null)
  assert.equal(asc[0].mark, null)
  assert.ok(asc[asc.length - 1].mark)
  assert.deepEqual(parseBoxSort('mark'), { field: 'mark', direction: 'desc' })
  assert.equal(nextBoxSortField('newest_desc'), 'mark_desc')
  assert.equal(nextBoxSortField('mark_desc'), 'dex_desc')
})

test('repairSave rolls a mark for a save that predates them', () => {
  const stored = {
      id: '1',
      speciesKey: 'bulbasaur',
      level: 5,
      ivs: generateIVs(),
      size: 120,
      moves: ['tackle'],
      currentHp: 20,
      maxHp: 20,
    },
    repaired = repairSave({
      version: 2,
      playerPokemon: stored,
      party: [stored],
      box: [{ ...stored, id: '2' }],
      nextPokemonId: 3,
      inventory: {},
    })
  // The property is defined (rolled or explicitly null) so it is not re-rolled.
  assert.ok(repaired.party[0].mark === null || Boolean(MARKS[repaired.party[0].mark]))
  assert.ok(repaired.box[0].mark === null || Boolean(MARKS[repaired.box[0].mark]))
  // A save that already has a mark keeps it.
  const keeps = repairSave({
    version: 2,
    playerPokemon: { ...stored, mark: 'rowdy' },
    party: [{ ...stored, mark: 'rowdy' }],
    box: [],
    nextPokemonId: 2,
    inventory: {},
  })
  assert.equal(keeps.party[0].mark, 'rowdy')
})
