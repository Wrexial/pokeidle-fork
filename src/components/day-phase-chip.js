// A small header chip showing the current day/night phase. The cycle is fixed
// (one full day every 60 real minutes) — see src/game/day-night.js.

import { jsxs } from 'react/jsx-runtime'
import { useDayPhase } from '../hooks.js'

export function DayPhaseChip() {
  const phase = useDayPhase()
  return jsxs('span', {
    className: 'day-phase-chip',
    title: 'The game\u2019s day/night cycle \u2014 one full day every 60 real minutes',
    children: [phase.icon, ' ', phase.label],
  })
}
