// Decorative battle-scene weather. Pure CSS particle layers (one element per
// weather family, no per-particle DOM), painted behind the combatants. Hidden
// entirely when reduced motion is on, so the badge is the only cue then.
import { jsx } from 'react/jsx-runtime'

/** @param {{ weather?: string | null }} props */
export function BattleWeatherOverlay({ weather }) {
  return weather
    ? jsx('div', {
        className: `battle-weather-overlay weather-${weather}`,
      })
    : null
}
