// Pokewalker: the idle step currency panel. Steps bank while away (see
// save.js) and slowly while the game is open (see use-game-loop.js), and are
// spent here on walk rewards.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokewalkerDailyCap, pokewalkerStepsPerHour } from '../data/config.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { POKEWALKER_OPTIONS, rarestRouteSpecies } from '../game/pokewalker.js'

export function PokewalkerPanel() {
  const { state, dispatch } = useGame(),
    pokewalker = state.pokewalker ?? { steps: 0, dailySteps: 0, dailyDate: '', totalSteps: 0 },
    steps = pokewalker.steps ?? 0,
    dailySteps = pokewalker.dailySteps ?? 0,
    dailyPercent = Math.min(100, Math.round((dailySteps / pokewalkerDailyCap) * 100)),
    revealSpecies = rarestRouteSpecies(state.currentRoute),
    revealName = revealSpecies ? pokemonSpecies[revealSpecies]?.name ?? revealSpecies : null,
    activeReveal = (state.activeEffects ?? []).find(
      (effect) => effect.type === 'reveal' && effect.routeKey === state.currentRoute
    ),
    activeRevealName =
      activeReveal?.speciesKey
        ? pokemonSpecies[activeReveal.speciesKey]?.name ?? activeReveal.speciesKey
        : null,
    stepRate = Math.round(pokewalkerStepsPerHour / 60)
  return jsxs('div', {
    className: 'pokewalker-panel',
    children: [
      jsxs('div', {
        className: 'pokewalker-balance',
        children: [
          jsx('span', { className: 'pokewalker-balance-icon', children: '\u{1f462}' }),
          jsxs('span', {
            className: 'pokewalker-balance-value',
            children: [steps.toLocaleString(), jsx('small', { children: ' steps' })],
          }),
        ],
      }),
      jsx('p', {
        className: 'pokewalker-hint',
        children: `Your Pokemon walk about ${stepRate} steps a minute while away (up to ${pokewalkerDailyCap.toLocaleString()} a day). Spend steps on the walk rewards below.`,
      }),
      jsxs('div', {
        className: 'pokewalker-daily',
        children: [
          jsx('span', {
            className: 'pokewalker-daily-label',
            children: `Today ${dailySteps.toLocaleString()} / ${pokewalkerDailyCap.toLocaleString()}`,
          }),
          jsx('div', {
            className: 'pokewalker-daily-bar',
            children: jsx('div', {
              className: 'pokewalker-daily-fill',
              style: { width: `${dailyPercent}%` },
            }),
          }),
        ],
      }),
      jsx('div', {
        className: 'pokewalker-options',
        children: POKEWALKER_OPTIONS.map((option) => {
          const affordable = steps >= option.cost,
            // The Rare Radar needs a wild route with at least one species to target.
            available = option.id !== 'reveal' || !!revealSpecies,
            detail =
              option.id === 'reveal' && activeRevealName && activeReveal
                ? `${activeRevealName} is out of hiding (${activeReveal.battlesRemaining} battles left). Spending again extends it.`
                : option.id === 'reveal' && revealName
                  ? `Current route target: ${revealName}.`
                  : option.description
          return jsxs(
            'button',
            {
              className: `pokewalker-option${affordable && available ? '' : ' disabled'}`,
              onClick: () =>
                affordable && available && dispatch({ type: 'SPEND_POKEWALKER', payload: { optionId: option.id } }),
              disabled: !affordable || !available,
              children: [
                jsx('span', { className: 'pokewalker-option-icon', children: option.icon }),
                jsxs('span', {
                  className: 'pokewalker-option-body',
                  children: [
                    jsx('span', { className: 'pokewalker-option-name', children: option.label }),
                    jsx('span', { className: 'pokewalker-option-desc', children: detail }),
                  ],
                }),
                jsx('span', {
                  className: 'pokewalker-option-cost',
                  children: `${option.cost.toLocaleString()} steps`,
                }),
              ],
            },
            option.id
          )
        }),
      }),
      jsx('p', {
        className: 'pokewalker-total',
        children: `Lifetime steps: ${(pokewalker.totalSteps ?? 0).toLocaleString()}`,
      }),
    ],
  })
}
