// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokeballColors } from '../data/constants.js'
import { pokemonSpecies } from '../data/gameData.js'
import { calculateRequiredExperience } from '../game/pokemon.js'

export function HpBar({ current, max }) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100)),
    barColor = percent > 50 ? '#30c855' : percent > 20 ? '#e8c030' : '#e04038'
  return jsxs('div', {
    className: 'hp-bar',
    children: [
      jsx('span', {
        className: 'hp-label',
        children: 'HP',
      }),
      jsx('div', {
        className: 'hp-track',
        children: jsx('div', {
          className: 'hp-fill',
          style: {
            width: `${percent}%`,
            backgroundColor: barColor,
            transition: 'width 0.5s ease, background-color 0.5s ease',
          },
        }),
      }),
    ],
  })
}

export function ExpBar({ speciesKey, level, totalExp }) {
  const species = pokemonSpecies[speciesKey]
  if (!species) return null
  const currentLevelExp = calculateRequiredExperience(level, species.growthRate),
    nextLevelExp = calculateRequiredExperience(level + 1, species.growthRate),
    expIntoLevel = totalExp - currentLevelExp,
    expForLevel = nextLevelExp - currentLevelExp,
    percent = expForLevel > 0 ? Math.min(100, (expIntoLevel / expForLevel) * 100) : 100
  return jsxs('div', {
    className: 'exp-bar',
    children: [
      jsx('span', {
        className: 'exp-label',
        children: 'EXP',
      }),
      jsx('div', {
        className: 'exp-track',
        children: jsx('div', {
          className: 'exp-fill',
          style: {
            width: `${percent}%`,
            transition: 'width 0.5s ease',
          },
        }),
      }),
    ],
  })
}

export function PlayerInfoBox({ pokemon }) {
  return jsxs('div', {
    className: 'info-box',
    children: [
      jsxs('div', {
        className: 'info-name-row',
        children: [
          pokemon.isShiny &&
            jsx('span', {
              className: 'shiny-star',
              children: '★',
            }),
          jsx('span', {
            className: 'info-pokemon-name',
            children: pokemon.name.toUpperCase(),
          }),
          jsxs('span', {
            className: 'info-pokemon-level',
            children: ['Lv.', pokemon.level],
          }),
        ],
      }),
      jsx(HpBar, {
        current: pokemon.currentHp,
        max: pokemon.maxHp,
      }),
      jsxs('div', {
        className: 'info-hp-numbers',
        children: [pokemon.currentHp, '/ ', pokemon.maxHp],
      }),
      jsx(ExpBar, {
        speciesKey: pokemon.speciesKey,
        level: pokemon.level,
        totalExp: pokemon.totalExp,
      }),
    ],
  })
}

export function EnemyInfoBox({ pokemon }) {
  return jsxs('div', {
    className: 'info-box',
    children: [
      jsxs('div', {
        className: 'info-name-row',
        children: [
          pokemon.isShiny &&
            jsx('span', {
              className: 'shiny-star',
              children: '★',
            }),
          jsx('span', {
            className: 'info-pokemon-name',
            children: pokemon.name.toUpperCase(),
          }),
          jsxs('span', {
            className: 'info-pokemon-level',
            children: ['Lv.', pokemon.level],
          }),
        ],
      }),
      jsx(HpBar, {
        current: pokemon.currentHp,
        max: pokemon.maxHp,
      }),
      jsxs('div', {
        className: 'info-hp-numbers',
        children: [pokemon.currentHp, '/ ', pokemon.maxHp],
      }),
    ],
  })
}

export function PokeballIcon({ ballId, size = 10, disabled }) {
  const clipId = React.useId(),
    colors = pokeballColors[ballId]
  return jsxs('svg', {
    className: disabled ? 'pokeball-disabled' : void 0,
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    children: [
      jsx('defs', {
        children: jsx('clipPath', {
          id: clipId,
          children: jsx('circle', {
            cx: '12',
            cy: '12',
            r: '11',
          }),
        }),
      }),
      jsx('circle', {
        cx: '12',
        cy: '12',
        r: '11',
        fill: colors.top,
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('rect', {
        x: '0',
        y: '12',
        width: '24',
        height: '12',
        fill: colors.bottom,
        clipPath: `url(#${clipId})`,
      }),
      jsx('circle', {
        cx: '12',
        cy: '12',
        r: '11',
        fill: 'none',
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('line', {
        x1: '1',
        y1: '12',
        x2: '8',
        y2: '12',
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('line', {
        x1: '16',
        y1: '12',
        x2: '23',
        y2: '12',
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('circle', {
        cx: '12',
        cy: '12',
        r: '4',
        fill: colors.ring,
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('circle', {
        cx: '12',
        cy: '12',
        r: '2',
        fill: colors.dot,
      }),
    ],
  })
}
