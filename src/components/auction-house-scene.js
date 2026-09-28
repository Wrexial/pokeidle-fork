// Kalos's Grand Auction House, played as a full-stage scene while the reducer
// is in the `auctionHouse` phase. Bid against hidden rival budgets; win the
// hammer and the lot is yours at your last bid. The player can pick their raise
// (a small step keeps the price down, a big jump can scare off a rival in one
// go) and the rivals react as they drop out.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { ItemIcon } from './item-icon.js'
import {
  AUCTION_BID_STEPS,
  auctionAppraisal,
  auctionBidPrice,
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
    ),
    [log, setLog] = React.useState(/** @type {string[]} */ ([]))

  const appraisal = auctionAppraisal(auction.lot),
    highBidder =
      auction.highest === 'player'
        ? 'You'
        : auction.highest ??
          'No bids yet',
    activeRivals = auction.bidders.filter((bidder) => bidder.active).length

  /** @param {number} step */
  function bid(step) {
    if (result !== null || !canAuctionBid(auction, state.money, step)) return
    const next = placeAuctionBid(auction, step)
    setAuction(next)
    setLog((entries) => [`You raise to $${next.price.toLocaleString()}.`, ...entries].slice(0, 4))
    if (state.sfxEnabled) playSfx(next.won ? 'win' : 'tap')
    if (next.won) {
      dispatch({
        type: 'CLAIM_MINIGAME_REWARD',
        payload: { money: -next.price, items: next.lot.items },
      })
      setResult('won')
    } else if (next.message) {
      setLog((entries) => [next.message, ...entries].slice(0, 4))
      if (state.sfxEnabled) playSfx('miss')
    }
  }

  function pass() {
    if (state.sfxEnabled) playSfx('miss')
    setResult('lost')
  }

  function nextLot() {
    if (state.sfxEnabled) playSfx('tap')
    setAuction(createAuction(rollAuctionLot()))
    setResult(null)
    setLog([])
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
                          size: 14,
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
                children: result === 'won'
                  ? 'Sold to you!'
                  : `High bid: ${highBidder} \u00b7 ${activeRivals} rival${
                      activeRivals === 1 ? '' : 's'
                    } left`,
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
          log.length > 0 &&
            jsx('div', {
              className: 'auction-log',
              children: log.map((entry, index) =>
                jsx('div', { className: 'auction-log-line', children: entry }, `${entry}-${index}`)
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
                  : 'Raise the bid or pass. A bigger jump can end it sooner \u2014 but costs more.',
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
                    onClick: pass,
                    children: 'PASS',
                  }),
                  AUCTION_BID_STEPS.map((multiplier, step) => {
                    const price = auctionBidPrice(auction, step),
                      affordable = canAuctionBid(auction, state.money, step)
                    return jsx(
                      'button',
                      {
                        className: 'move-panel-btn confirm',
                        disabled: !affordable,
                        onClick: () => bid(step),
                        children: `${multiplier > 1 ? `RAISE \u00d7${multiplier} ` : 'BID '}$${price.toLocaleString()}`,
                      },
                      step
                    )
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
