// The horde battle scene: a wild pack of 3-5 of one species, resolved by the
// idle loop through the doubles round engine. The scene is presentational —
// the loop runs a round per tick — so it just shows the pack, the player and
// the rolling log while the fight plays out.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

/**
 * @param {{ pokemon: any, side: 'player' | 'foe' }} props
 */
function HordeFighter({ pokemon, side }) {
  if (!pokemon) return null
  const id = pokemonSpecies[pokemon.speciesKey]?.id ?? 0,
    ratio =
      pokemon.maxHp > 0 ? Math.max(0, Math.min(1, (pokemon.currentHp ?? 0) / pokemon.maxHp)) : 0,
    down = (pokemon.currentHp ?? 0) <= 0
  return jsxs('div', {
    className: `doubles-fighter horde-fighter ${side}${down ? ' down' : ''}`,
    children: [
      jsx('img', {
        className: 'doubles-sprite',
        src: getPokemonSpriteUrl(id, side === 'player', pokemon.isShiny),
        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
          (event.target.src = getPokemonSpriteFallbackUrl(id, side === 'player', pokemon.isShiny)),
        alt: pokemon.name,
      }),
      jsx('span', { className: 'doubles-name', children: pokemon.name }),
      jsx('span', { className: 'doubles-level', children: `Lv.${pokemon.level}` }),
      jsxs('div', {
        className: 'doubles-hp',
        children: [
          jsx('span', {
            className: 'doubles-hp-fill',
            style: { width: `${ratio * 100}%` },
          }),
          jsx('span', {
            className: 'doubles-hp-text',
            children: `${Math.max(0, pokemon.currentHp ?? 0)}/${pokemon.maxHp}`,
          }),
        ],
      }),
    ],
  })
}

export function HordeScene() {
  const { state } = useGame(),
    player = state.hordePlayer,
    pack = state.hordePack ?? [],
    log = state.hordeLog ?? []
  if (!player && pack.length === 0) return null
  const remaining = pack.filter((/** @type {any} */ member) => (member.currentHp ?? 0) > 0).length
  return jsxs('div', {
    className: 'minigame-scene horde-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Horde Battle' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: `${remaining} of ${pack.length} left`,
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsxs('div', {
            className: 'horde-pack',
            children: pack.map((/** @type {any} */ member, /** @type {number} */ index) =>
              jsx(HordeFighter, { pokemon: member, side: 'foe' }, `${member.speciesKey}-${index}`)
            ),
          }),
          player &&
            jsx('div', {
              className: 'horde-player',
              children: jsx(HordeFighter, { pokemon: player, side: 'player' }),
            }),
          jsxs('div', {
            className: 'doubles-round-log',
            children: log.slice(-6).map((/** @type {string} */ message, /** @type {number} */ index) =>
              jsx('div', { className: 'doubles-round-line', children: message }, index)
            ),
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-footer',
        children: jsx('span', {
          className: 'horde-hint',
          children:
            'A pack of one species — spread moves hit them all, single-target moves pick one.',
        }),
      }),
    ],
  })
}
