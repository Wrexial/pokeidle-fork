// Battle-only alternate forms that have no entry in `pokemon-species.json`.
//
// Some form-changing abilities (Shields Down, Forecast, Hunger Switch, Ice
// Face) swap to a form the extracted species table never carried. These entries
// describe just enough for the battle engine: an id (so the existing sprite
// lookup works - the sprites are present in public/sprites/pokemon/), a display
// name, types and base stats taken from PokeAPI.
//
// They are deliberately kept out of `pokemonSpecies` so they don't leak into
// the Pokedex, generation dex sets, breeding or encounter tables. Use
// `battleSpecies` (see src/game/combat/setup.js) to resolve a form key.

/** @type {Record<string, Partial<Species>>} */
export const FORM_SPECIES = {
  'castform-sunny': {
    id: 10013,
    name: 'Castform (Sunny)',
    types: ['Fire'],
    baseStats: { hp: 70, attack: 70, defense: 70, spAttack: 70, spDefense: 70, speed: 70 },
  },
  'castform-rainy': {
    id: 10014,
    name: 'Castform (Rainy)',
    types: ['Water'],
    baseStats: { hp: 70, attack: 70, defense: 70, spAttack: 70, spDefense: 70, speed: 70 },
  },
  'castform-snowy': {
    id: 10015,
    name: 'Castform (Snowy)',
    types: ['Ice'],
    baseStats: { hp: 70, attack: 70, defense: 70, spAttack: 70, spDefense: 70, speed: 70 },
  },
  'morpeko-hangry': {
    id: 10187,
    name: 'Morpeko (Hangry)',
    types: ['Electric', 'Dark'],
    baseStats: { hp: 58, attack: 95, defense: 58, spAttack: 70, spDefense: 58, speed: 97 },
  },
  'cramorant-gulping': {
    id: 10182,
    name: 'Cramorant (Gulping)',
    types: ['Flying', 'Water'],
    baseStats: { hp: 70, attack: 85, defense: 55, spAttack: 85, spDefense: 95, speed: 85 },
  },
  'cramorant-gorging': {
    id: 10183,
    name: 'Cramorant (Gorging)',
    types: ['Flying', 'Water'],
    baseStats: { hp: 70, attack: 85, defense: 55, spAttack: 85, spDefense: 95, speed: 85 },
  },
  'minior-meteor': {
    id: 774,
    name: 'Minior (Meteor)',
    types: ['Rock', 'Flying'],
    baseStats: { hp: 60, attack: 60, defense: 100, spAttack: 60, spDefense: 100, speed: 60 },
  },
  'minior-core': {
    id: 10136,
    name: 'Minior (Core)',
    types: ['Rock', 'Flying'],
    baseStats: { hp: 60, attack: 100, defense: 60, spAttack: 100, spDefense: 60, speed: 120 },
  },
  'eiscue-noice': {
    id: 10185,
    name: 'Eiscue (Noice)',
    types: ['Ice'],
    baseStats: { hp: 75, attack: 80, defense: 70, spAttack: 65, spDefense: 50, speed: 130 },
  },
}
