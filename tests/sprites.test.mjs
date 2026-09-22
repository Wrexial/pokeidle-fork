import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const data = installGameData()

const { getPokemonSpriteUrl, getPokemonSpriteFallbackUrl } = await import('../src/game/pokemon.js')
const { isFemalePokemon, rollGender } = await import('../src/game/breeding.js')

// Pikachu has a female variant (heart-shaped tail); Charmander does not.
const PIKACHU = data.pokemonSpecies.pikachu.id
const CHARMANDER = data.pokemonSpecies.charmander.id
const ANIMATED = '/sprites/pokemon/versions/generation-v/black-white/animated'

test('the default sprite is the shared artwork', () => {
  assert.equal(getPokemonSpriteUrl(PIKACHU, false, false, false), `${ANIMATED}/${PIKACHU}.gif`)
  assert.equal(getPokemonSpriteFallbackUrl(PIKACHU, false, false, false), `/sprites/pokemon/${PIKACHU}.png`)
})

test('a gender-differing species uses the female folder in every animated variant', () => {
  assert.equal(getPokemonSpriteUrl(PIKACHU, false, false, true), `${ANIMATED}/female/${PIKACHU}.gif`)
  assert.equal(getPokemonSpriteUrl(PIKACHU, true, false, true), `${ANIMATED}/back/female/${PIKACHU}.gif`)
  assert.equal(getPokemonSpriteUrl(PIKACHU, false, true, true), `${ANIMATED}/shiny/female/${PIKACHU}.gif`)
  assert.equal(
    getPokemonSpriteUrl(PIKACHU, true, true, true),
    `${ANIMATED}/back/shiny/female/${PIKACHU}.gif`
  )
})

test('static fallbacks build the female path too', () => {
  assert.equal(
    getPokemonSpriteFallbackUrl(PIKACHU, false, false, true),
    `/sprites/pokemon/female/${PIKACHU}.png`
  )
  assert.equal(
    getPokemonSpriteFallbackUrl(PIKACHU, true, false, true),
    `/sprites/pokemon/back/female/${PIKACHU}.png`
  )
  assert.equal(
    getPokemonSpriteFallbackUrl(PIKACHU, false, true, true),
    `/sprites/pokemon/shiny/female/${PIKACHU}.png`
  )
  assert.equal(
    getPokemonSpriteFallbackUrl(PIKACHU, true, true, true),
    `/sprites/pokemon/back/shiny/female/${PIKACHU}.png`
  )
})

test('a female species with no female animation falls back to its static female sprite', () => {
  const PYROAR = data.pokemonSpecies.pyroar.id // 668, a Gen 6 species with no Gen V animation
  assert.equal(
    getPokemonSpriteUrl(PYROAR, false, false, true),
    `/sprites/pokemon/female/${PYROAR}.png`,
    'the right gender beats the (male) animation'
  )
})

test('a species without a female variant keeps the shared artwork', () => {
  assert.equal(getPokemonSpriteUrl(CHARMANDER, false, false, true), `${ANIMATED}/${CHARMANDER}.gif`)
  assert.equal(
    getPokemonSpriteFallbackUrl(CHARMANDER, false, false, true),
    `/sprites/pokemon/${CHARMANDER}.png`
  )
})

test('isFemalePokemon reads the stored gender and never returns true for genderless', () => {
  assert.equal(isFemalePokemon({ speciesKey: 'pikachu', id: '1', gender: 'female' }), true)
  assert.equal(isFemalePokemon({ speciesKey: 'pikachu', id: '1', gender: 'male' }), false)
  assert.equal(isFemalePokemon({ speciesKey: 'mewtwo', id: '150' }), false)
})

test('rollGender respects fixed genders and genderless species', () => {
  assert.equal(rollGender('mewtwo'), 'genderless')
  assert.equal(rollGender('basculegion-f'), 'female')
  assert.equal(rollGender('indeedee'), 'male')
  assert.ok(['male', 'female'].includes(rollGender('pikachu')))
})
