// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { calculateRequiredExperience } from '../game/pokemon.js'

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
