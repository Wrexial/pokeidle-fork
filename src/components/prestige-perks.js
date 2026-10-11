// The persistent Prestige Perk tree, shown in the League panel's prestige
// section. Points come from prestiging a region; perks survive every reset.

import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { PRESTIGE_PERKS, perkCost, perkRank, totalPrestigeInvested } from '../game/prestige.js'

export function PrestigePerks() {
  const { state, dispatch } = useGame(),
    points = state.prestigePoints ?? 0,
    invested = totalPrestigeInvested(state)
  return jsxs('div', {
    className: 'prestige-perks',
    children: [
      jsxs('div', {
        className: 'prestige-header',
        children: [
          jsxs('div', {
            className: 'gym-section-title',
            children: ['Prestige Perks', ` \u00b7 ${points} PP`],
          }),
          invested > 0 &&
            jsx('button', {
              className: 'prestige-respec-btn',
              title: `Refund all ${invested} spent Prestige Points and clear every perk`,
              onClick: () => {
                if (
                  window.confirm(
                    `Reset every prestige perk and refund ${invested} Prestige Point${invested === 1 ? '' : 's'}?`
                  )
                )
                  dispatch({ type: 'RESET_PRESTIGE_PERKS' })
              },
              children: `Reset (refund ${invested} PP)`,
            }),
        ],
      }),
      jsx('p', {
        className: 'prestige-hint',
        children:
          'Spend Prestige Points on permanent bonuses that survive every region reset.',
      }),
      PRESTIGE_PERKS.map((perk) => {
        const rank = perkRank(state, perk.id),
          cost = perkCost(perk.id, rank),
          maxed = cost == null,
          affordable = !maxed && points >= cost
        return jsxs(
          'div',
          {
            className: 'prestige-perk-row',
            children: [
              jsxs('div', {
                className: 'prestige-perk-info',
                children: [
                  jsxs('span', {
                    className: 'prestige-perk-name',
                    children: [
                      perk.name,
                      ' ',
                      jsx('span', {
                        className: 'prestige-perk-rank',
                        children: `Rank ${rank}/${perk.maxRank}`,
                      }),
                    ],
                  }),
                  jsx('span', {
                    className: 'prestige-perk-desc',
                    children: perk.description,
                  }),
                ],
              }),
              jsx('button', {
                className: 'gym-fight-btn',
                disabled: !affordable,
                onClick: () => dispatch({ type: 'BUY_PRESTIGE_PERK', payload: { perkId: perk.id } }),
                children: maxed ? 'MAX' : `${cost} PP`,
              }),
            ],
          },
          perk.id
        )
      }),
    ],
  })
}
