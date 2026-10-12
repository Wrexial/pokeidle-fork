// A small header chip showing the current season. The cycle is fixed (one
// season every four in-game days, four real hours) — see src/game/seasons.js.

import { jsxs } from 'react/jsx-runtime'
import { useSeason } from '../hooks.js'

export function SeasonChip() {
  const season = useSeason()
  return jsxs('span', {
    className: `season-chip season-${season.id}`,
    title: 'The game\u2019s seasonal cycle \u2014 each season lasts four in-game days (four real hours)',
    children: [season.icon, ' ', season.label],
  })
}
