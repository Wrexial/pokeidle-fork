// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { tokenShopItems } from '../data/items.js'
import { useGame } from '../game/context.js'
import { getItemInfo } from '../game/progression.js'

/** @param {{ onClose: () => void }} props */
export function RewardShopModal({ onClose }) {
  const { state, dispatch } = useGame()
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Reward Shop',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content',
          children: [
            jsxs('div', {
              className: 'reward-shop-token-display',
              children: [
                'Victory Tokens: ',
                jsx('strong', {
                  children: state.victoryTokens,
                }),
              ],
            }),
            jsx('div', {
              className: 'reward-shop-list',
              children: tokenShopItems.map((rewardItem) => {
                const item = getItemInfo(rewardItem.itemId),
                  owned = state.inventory[rewardItem.itemId] ?? 0,
                  canAfford = state.victoryTokens >= rewardItem.tokenCost
                return jsxs(
                  'div',
                  {
                    className: 'reward-shop-row',
                    children: [
                      jsxs('div', {
                        className: 'reward-shop-item-info',
                        children: [
                          jsx('span', {
                            className: 'reward-shop-item-name',
                            children: item.name,
                          }),
                          jsx('span', {
                            className: 'reward-shop-item-desc',
                            children: item.description,
                          }),
                        ],
                      }),
                      jsxs('div', {
                        className: 'reward-shop-item-right',
                        children: [
                          jsxs('span', {
                            className: 'reward-shop-item-owned',
                            children: ['Owned: ', owned],
                          }),
                          jsxs('button', {
                            className: `reward-shop-buy-btn${canAfford ? '' : ' disabled'}`,
                            disabled: !canAfford,
                            onClick: () =>
                              dispatch({
                                type: 'BUY_REWARD_ITEM',
                                payload: {
                                  itemId: rewardItem.itemId,
                                  cost: rewardItem.tokenCost,
                                },
                              }),
                            children: [
                              jsx('span', {
                                className: 'reward-shop-buy-label',
                                children: 'Buy',
                              }),
                              jsxs('span', {
                                className: 'reward-shop-buy-cost',
                                children: [
                                  rewardItem.tokenCost,
                                  ' Token',
                                  rewardItem.tokenCost > 1 ? 's' : '',
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  },
                  rewardItem.itemId
                )
              }),
            }),
          ],
        }),
      ],
    }),
  })
}
