// Kalos's Grand Auction House, played as a full-stage scene while the reducer
// is in the `auctionHouse` phase. Bid against hidden rival budgets; win the
// hammer and the lot is yours at your last bid.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { ItemIcon } from './item-icon.js'
import {
  auctionAppraisal,
  canAuctionBid,
  createAuction,
  placeAuctionBid,
  rewardItemName,
  rollAuctionLot,
} from '../game/minigames.js'

export function AuctionHouseScene() {
  const { state, dispatch } = useGame(),
    [auction, setAuction] = React.useState(() => createAuction(rollAuctionLot())),
    [result, setResult] = React.useState(
      /** @type {'won' | 'lost' | null} */ (null)
    )

  const appraisal = auctionAppraisal(auction.lot),
    canBid = result === null && canAuctionBid(auction, state.money),
    highBidder =
      auction.highest === 'player'
        ? 'You'
        : auction.highest ??
          'No bids yet'

  function bid() {
    if (result !== null || !canAuctionBid(auction, state.money)) return
    const next = placeAuctionBid(auction)
    setAuction(next)
    if (next.won) {
      dispatch({
        type: 'CLAIM_MINIGAME_REWARD',
        payload: { money: -next.price, items: next.lot.items },
      })
      setResult('won')
    }
  }

  function nextLot() {
    setAuction(createAuction(rollAuctionLot()))
    setResult(null)
  }

  return jsxs('div', {
    className: 'minigame-scene auction-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', {
            className: 'minigame-scene-title',
            children: 'Grand Auction House',
          }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: `$${state.money.toLocaleString()}`,
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsxs('div', {
            className: 'auction-podium',
            children: [
              jsx('div', {
                className: 'auction-lot-name',
                children: auction.lot.name,
              }),
              jsx('div', {
                className: 'auction-lot-blurb',
                children: auction.lot.blurb,
              }),
              jsx('div', {
                className: 'auction-lot-items',
                children: auction.lot.items.map((item) =>
                  jsxs(
                    'span',
                    {
                      className: 'auction-lot-item',
                      children: [
                        jsx(ItemIcon, {
                          itemId: item.itemId,
                          size: 10,
                        }),
                        `${rewardItemName(item.itemId)}${
                          item.quantity > 1 ? ` \u00d7${item.quantity}` : ''
                        }`,
                      ],
                    },
                    item.itemId
                  )
                ),
              }),
              jsxs('div', {
                className: 'auction-appraisal',
                children: [
                  jsx('span', { children: 'Appraisal' }),
                  jsx('strong', {
                    children: `$${appraisal.low.toLocaleString()} \u2013 $${appraisal.high.toLocaleString()}`,
                  }),
                ],
              }),
            ],
          }),
          jsxs('div', {
            className: 'auction-current',
            children: [
              jsxs('span', {
                className: 'auction-price',
                children: `$${auction.price.toLocaleString()}`,
              }),
              jsx('span', {
                className: 'auction-high-bidder',
                children: result === 'won' ? 'Sold to you!' : `High bid: ${highBidder}`,
              }),
            ],
          }),
          jsx('div', {
            className: 'auction-bidders',
            children: auction.bidders.map((bidder) =>
              jsxs(
                'span',
                {
                  className: `auction-bidder${
                    bidder.active ? '' : ' out'
                  }${auction.highest === bidder.name ? ' leading' : ''}`,
                  children: bidder.name,
                },
                bidder.name
              )
            ),
          }),
          jsx('div', {
            className: 'minigame-scene-log',
            children:
              result === 'won'
                ? `Sold! You pay $${auction.price.toLocaleString()} for the lot.`
                : result === 'lost'
                  ? auction.highest
                    ? `Sold to ${highBidder} for $${auction.price.toLocaleString()}.`
                    : 'The lot was passed in \u2014 nobody bid.'
                  : canBid
                    ? 'Raise the bid or pass. The rivals will only go so far.'
                    : `You cannot cover the next raise ($${(
                        auction.price + auction.raise
                      ).toLocaleString()}).`,
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          jsx('button', {
            className: 'move-panel-btn cancel',
            onClick: () => dispatch({ type: 'END_MINIGAME' }),
            children: 'LEAVE',
          }),
          result === null
            ? jsxs('div', {
                className: 'auction-actions',
                children: [
                  jsx('button', {
                    className: 'move-panel-btn cancel',
                    onClick: () => setResult('lost'),
                    children: 'PASS',
                  }),
                  jsx('button', {
                    className: 'move-panel-btn confirm',
                    disabled: !canBid,
                    onClick: bid,
                    children: `BID $${(auction.price + auction.raise).toLocaleString()}`,
                  }),
                ],
              })
            : jsx('button', {
                className: 'move-panel-btn confirm',
                onClick: nextLot,
                children: 'NEXT LOT',
              }),
        ],
      }),
    ],
  })
}
