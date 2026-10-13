// Trainer card outfits: the look shown on the player's Trainer Card. There is
// no avatar art, so an outfit is a small palette plus an emblem emoji that the
// card paints into its own avatar badge. An outfit is unlocked for free, by an
// achievement, or bought with money from the Trainer Card panel.

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   description: string,
 *   emblem: string,
 *   skin: string,
 *   shirt: string,
 *   bg: [string, string],
 *   unlock: { free?: boolean, achievement?: string, cost?: number },
 * }} Outfit
 */

/**
 * @type {Outfit[]}
 */
export const OUTFITS = [
  {
    id: 'trainer',
    name: 'Youngster',
    description: 'The classic cap and jacket every journey starts in.',
    emblem: '\u{1f9e2}',
    skin: '#f2c9a0',
    shirt: '#e0574f',
    bg: ['#2f6d4f', '#123528'],
    unlock: { free: true },
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'A tidy coat for the trainer who has to catch them all.',
    emblem: '\u{1f3a9}',
    skin: '#e8b98c',
    shirt: '#4a6fa5',
    bg: ['#2b4c7e', '#101f38'],
    unlock: { achievement: 'catch100' },
  },
  {
    id: 'shinyHunter',
    name: 'Shiny Hunter',
    description: 'Glitter on the collar for a trainer with a sparkling team.',
    emblem: '\u2728',
    skin: '#f2c9a0',
    shirt: '#7b4fa5',
    bg: ['#5a2d7a', '#1e0f2e'],
    unlock: { achievement: 'shiny10' },
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'A regal cape worthy of a region-conquering champion.',
    emblem: '\u{1f451}',
    skin: '#f2c9a0',
    shirt: '#c9a227',
    bg: ['#8a6d1f', '#2e2408'],
    unlock: { achievement: 'championFirst' },
  },
  {
    id: 'towerMaster',
    name: 'Tower Master',
    description: 'Armour won by clearing the Battle Tower\u2019s upper floors.',
    emblem: '\u{1f5fc}',
    skin: '#d9a06a',
    shirt: '#8a8f98',
    bg: ['#4b5563', '#1b1f26'],
    unlock: { achievement: 'tower50' },
  },
  {
    id: 'timeTraveller',
    name: 'Time Traveller',
    description: 'A well-worn coat from lives lived across many timelines.',
    emblem: '\u231b',
    skin: '#e8b98c',
    shirt: '#2f8f83',
    bg: ['#215e63', '#0a2226'],
    unlock: { achievement: 'prestigeFirst' },
  },
  {
    id: 'tycoon',
    name: 'Tycoon',
    description: 'A gilded suit for the trainer holding a fortune.',
    emblem: '\u{1f4b0}',
    skin: '#f2c9a0',
    shirt: '#1f7a4d',
    bg: ['#1a6b45', '#08281a'],
    unlock: { achievement: 'rich' },
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'A decorated uniform bought from the Trainer Card shop.',
    emblem: '\u{1f396}',
    skin: '#d9a06a',
    shirt: '#6b4a2f',
    bg: ['#5a3d24', '#1d130b'],
    unlock: { cost: 25000 },
  },
  {
    id: 'ace',
    name: 'Ace Trainer',
    description: 'Sharp and quick, bought for a small fortune.',
    emblem: '\u26a1',
    skin: '#f2c9a0',
    shirt: '#d94f3d',
    bg: ['#9c3123', '#2e0d08'],
    unlock: { cost: 100000 },
  },
  {
    id: 'legend',
    name: 'Living Legend',
    description: 'The very best, like no one ever was.',
    emblem: '\u{1f31f}',
    skin: '#f2c9a0',
    shirt: '#3d6fd9',
    bg: ['#2a4fb0', '#0b1438'],
    unlock: { cost: 500000 },
  },
]

/** Look an outfit up by id, falling back to the starter outfit. */
export function outfitById(/** @type {string | null | undefined} */ id) {
  return OUTFITS.find((outfit) => outfit.id === id) ?? OUTFITS[0]
}
