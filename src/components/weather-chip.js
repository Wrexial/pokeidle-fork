// A small header chip showing the world weather at the current location. The
// cycle is deterministic (15 real minutes per period, seeded by region/biome)
// — see src/game/weather.js.

import { jsxs } from 'react/jsx-runtime'
import { useWorldWeather } from '../hooks.js'
import { WEATHER_ICONS, WORLD_WEATHER_LABELS } from '../game/weather.js'

/** The chip icon for clear weather (sun behind a small cloud). */
const CLEAR_ICON = '\u{1F324}'

export function WeatherChip() {
  const { type } = useWorldWeather(),
    icon = type ? (WEATHER_ICONS[type] ?? '\u2601') : CLEAR_ICON,
    label = type ? (WORLD_WEATHER_LABELS[type] ?? type) : 'Clear'
  return jsxs('span', {
    className: `weather-chip${type ? ' active' : ''}`,
    title: type
      ? `The weather here is ${label.toLowerCase()}. It changes every 15 minutes.`
      : 'The weather here is clear.',
    children: [icon, ' ', label],
  })
}
