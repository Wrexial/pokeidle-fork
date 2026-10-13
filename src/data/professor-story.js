// The Professor's Story: a region-by-region questline that runs alongside the
// per-species field research. Each chapter belongs to a region and its
// professor, and its steps are derived from progress the player already makes
// (dex, research, badges, relics, the Champion, the quest legendary). Completing
// a chapter pays a step reward and unlocks the next; the final capstone is the
// professor's finished thesis.

/**
 * @typedef {'dex' | 'research' | 'badges' | 'champion' | 'legendary' | 'relics' | 'wildBattles' | 'chapters' | 'dexNational' | 'totalBadges' | 'legendaries'} ProfessorStepKind
 */

/**
 * @typedef {Object} ProfessorStep
 * @property {string} id
 * @property {ProfessorStepKind} kind
 * @property {number} need
 * @property {string} label
 */

/**
 * @typedef {Object} ProfessorChapter
 * @property {string} id
 * @property {string | null} region
 * @property {string} professor
 * @property {string} title
 * @property {string} intro
 * @property {ProfessorStep[]} steps
 * @property {{ money?: number, victoryTokens?: number, items?: Record<string, number>, catchBonus?: number, charm?: string, ribbon?: string }} reward
 */

/** @type {ProfessorChapter[]} */
export const PROFESSOR_STORY = [
  {
    id: 'kanto',
    region: 'kanto',
    professor: 'Professor Oak',
    title: 'The First Field Notes',
    intro:
      'A regional professor is compiling a research thesis on how trainers across the world grow with their Pokemon. The first pages are blank \u2014 they are yours to fill.',
    steps: [
      { id: 'kanto-dex', kind: 'dex', need: 20, label: 'Register 20 Kanto Pokemon' },
      { id: 'kanto-battles', kind: 'wildBattles', need: 100, label: 'Win 100 wild battles' },
      { id: 'kanto-badges', kind: 'badges', need: 4, label: 'Earn 4 Kanto badges' },
    ],
    reward: { money: 4000, items: { greatball: 10 } },
  },
  {
    id: 'johto',
    region: 'johto',
    professor: 'Professor Elm',
    title: 'A New Life',
    intro:
      'Elm believes the smallest hatchling can rewrite everything we know. He asks you to record the Pokemon of Johto, and to keep the daycare busy.',
    steps: [
      { id: 'johto-dex', kind: 'dex', need: 25, label: 'Register 25 Johto Pokemon' },
      { id: 'johto-research', kind: 'research', need: 5, label: 'Complete 5 Johto research tasks' },
      { id: 'johto-badges', kind: 'badges', need: 5, label: 'Earn 5 Johto badges' },
    ],
    reward: { money: 6000, items: { rareCandy: 3 } },
  },
  {
    id: 'hoenn',
    region: 'hoenn',
    professor: 'Professor Birch',
    title: 'The Living Sea',
    intro:
      'Birch studies Pokemon in the wild, not on a lab bench. He wants a proper survey of Hoenn\u2019s routes \u2014 and he is not shy about asking you to do the fieldwork.',
    steps: [
      { id: 'hoenn-dex', kind: 'dex', need: 30, label: 'Register 30 Hoenn Pokemon' },
      { id: 'hoenn-battles', kind: 'wildBattles', need: 300, label: 'Win 300 wild battles' },
      { id: 'hoenn-badges', kind: 'badges', need: 6, label: 'Earn 6 Hoenn badges' },
    ],
    reward: { money: 8000, items: { ultraball: 5, expCandyL: 2 } },
  },
  {
    id: 'sinnoh',
    region: 'sinnoh',
    professor: 'Professor Rowan',
    title: 'Time, Space, and the Lake',
    intro:
      'Rowan\u2019s lifetime of work comes down to one question: why do trainers and Pokemon grow together? The relics of Sinnoh may hold part of the answer.',
    steps: [
      { id: 'sinnoh-research', kind: 'research', need: 15, label: 'Complete 15 research tasks' },
      { id: 'sinnoh-relics', kind: 'relics', need: 10, label: 'Recover 10 Ancient Relics in Sinnoh' },
      { id: 'sinnoh-champion', kind: 'champion', need: 1, label: 'Defeat the Sinnoh Champion' },
    ],
    reward: { money: 12000, items: { abilityCapsule: 1, bottleCap: 1 } },
  },
  {
    id: 'unova',
    region: 'unova',
    professor: 'Professor Juniper',
    title: 'The Bonds We Keep',
    intro:
      'Juniper studies the link between a trainer and their team. She has a theory that a well-travelled bond can be caught in a charm \u2014 and she has built one to test it.',
    steps: [
      { id: 'unova-dex', kind: 'dex', need: 40, label: 'Register 40 Unova Pokemon' },
      { id: 'unova-research', kind: 'research', need: 25, label: 'Complete 25 research tasks' },
      { id: 'unova-champion', kind: 'champion', need: 1, label: 'Defeat the Unova Champion' },
    ],
    reward: { money: 15000, catchBonus: 0.15, charm: 'Catching Charm' },
  },
  {
    id: 'kalos',
    region: 'kalos',
    professor: 'Professor Sycamore',
    title: 'The Mega Awakening',
    intro:
      'Sycamore has chased Mega Evolution his whole career. He needs a trainer who has stood before the legends themselves.',
    steps: [
      { id: 'kalos-dex', kind: 'dex', need: 50, label: 'Register 50 Kalos Pokemon' },
      { id: 'kalos-champion', kind: 'champion', need: 1, label: 'Defeat the Kalos Champion' },
      { id: 'kalos-legendary', kind: 'legendary', need: 1, label: 'Catch the Kalos quest legendary' },
    ],
    reward: { money: 20000, items: { rareCandy: 5 } },
  },
  {
    id: 'alola',
    region: 'alola',
    professor: 'Professor Kukui',
    title: 'Island Guardians',
    intro:
      'Kukui left the lab for the beach, and his research followed. Alola\u2019s island guardians do not grade on a curve.',
    steps: [
      { id: 'alola-dex', kind: 'dex', need: 60, label: 'Register 60 Alola Pokemon' },
      { id: 'alola-relics', kind: 'relics', need: 25, label: 'Recover 25 Ancient Relics in Alola' },
      { id: 'alola-champion', kind: 'champion', need: 1, label: 'Defeat the Alola Champion' },
    ],
    reward: { money: 30000, items: { bottleCap: 3, expCandyXL: 3 } },
  },
  {
    id: 'galar',
    region: 'galar',
    professor: 'Professor Magnolia',
    title: 'The Dynamax Phenomenon',
    intro:
      'Magnolia\u2019s final project is the Dynamax energy flowing beneath Galar. To finish it she needs the region\u2019s Champion beaten and its legend secured.',
    steps: [
      { id: 'galar-dex', kind: 'dex', need: 70, label: 'Register 70 Galar Pokemon' },
      { id: 'galar-legendary', kind: 'legendary', need: 1, label: 'Catch the Galar quest legendary' },
      { id: 'galar-champion', kind: 'champion', need: 1, label: 'Defeat the Galar Champion' },
    ],
    reward: { money: 40000, items: { masterball: 1 } },
  },
  {
    id: 'paldea',
    region: 'paldea',
    professor: 'Professor Sada',
    title: 'The Great Crater',
    intro:
      'Sada\u2019s research reaches back a million years, to the Pokemon that walked the crater before us. She asks only for the truth, however it arrives.',
    steps: [
      { id: 'paldea-dex', kind: 'dex', need: 80, label: 'Register 80 Paldea Pokemon' },
      { id: 'paldea-legendary', kind: 'legendary', need: 1, label: 'Catch the Paldea quest legendary' },
      { id: 'paldea-champion', kind: 'champion', need: 1, label: 'Defeat the Paldea Champion' },
    ],
    reward: { money: 50000, victoryTokens: 5 },
  },
  {
    id: 'thesis',
    region: null,
    professor: 'The Regional Professors',
    title: 'The Professor\u2019s Thesis',
    intro:
      'Every region\u2019s notes are in. One last demonstration: a Pokedex that spans the world, every legend accounted for, and a trainer who has done it all.',
    steps: [
      { id: 'thesis-chapters', kind: 'chapters', need: 9, label: 'Complete every regional chapter' },
      { id: 'thesis-dex', kind: 'dexNational', need: 600, label: 'Register 600 Pokemon in the Pokedex' },
      { id: 'thesis-legendaries', kind: 'legendaries', need: 9, label: 'Catch every region\u2019s quest legendary' },
      { id: 'thesis-badges', kind: 'totalBadges', need: 72, label: 'Earn 72 badges across every region' },
    ],
    reward: {
      money: 100000,
      victoryTokens: 20,
      items: { masterball: 3 },
      ribbon: 'professor',
    },
  },
]

/** Every chapter id, for validating a save. @type {Set<string>} */
export const PROFESSOR_CHAPTER_IDS = new Set(PROFESSOR_STORY.map((chapter) => chapter.id))
