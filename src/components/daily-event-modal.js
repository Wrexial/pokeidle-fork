// Split from a grouped component file.

import { jsx, jsxs } from 'react/jsx-runtime'
import { dailyEventByKey } from '../data/daily-events.js'
import { useGame } from '../game/context.js'
import { getItemInfo } from '../game/progression.js'

/** @param {{ onClose: () => void }} props */
export function DailyEventModal({ onClose }) {
  const { state, dispatch } = useGame(),
    dailyEvent = state.dailyEvent
  if (!dailyEvent) return null
  const event = dailyEventByKey[dailyEvent.kind]
  if (!event) return null
  const giftItems = Object.entries(event.gift.items).map(([itemId, quantity]) => ({
      itemId,
      quantity,
      ...getItemInfo(itemId),
    })),
    claimable = !dailyEvent.claimed
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal daily-event-modal',
      onClick: /** @param {React.MouseEvent} mouseEvent */ (mouseEvent) => mouseEvent.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Daily Event',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content daily-event-content',
          children: [
            jsx('span', {
              className: 'daily-event-icon',
              children: event.icon,
            }),
            jsx('span', {
              className: 'daily-event-name',
              children: event.name,
            }),
            jsx('p', {
              className: 'daily-event-description',
              children: event.description,
            }),
            jsx('div', {
              className: 'daily-event-divider',
            }),
            jsx('span', {
              className: 'daily-event-gift-title',
              children: claimable ? 'Daily gift' : 'Gift already claimed',
            }),
            jsxs('div', {
              className: 'daily-event-gift-list',
              children: [
                jsxs('span', {
                  className: 'daily-event-gift-item',
                  children: ['₽', event.gift.money.toLocaleString()],
                }),
                ...giftItems.map((giftItem) =>
                  jsxs(
                    'span',
                    {
                      className: 'daily-event-gift-item',
                      children: [giftItem.name, ' ×', giftItem.quantity],
                    },
                    giftItem.itemId
                  )
                ),
              ],
            }),
            claimable
              ? jsx('button', {
                  className: 'daily-event-claim-btn',
                  onClick: () => dispatch({ type: 'CLAIM_DAILY_GIFT' }),
                  children: 'Claim Daily Gift',
                })
              : jsx('p', {
                  className: 'daily-event-claimed',
                  children: 'Come back tomorrow for a new event and gift!',
                }),
          ],
        }),
      ],
    }),
  })
}
