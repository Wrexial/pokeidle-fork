// The Mystery Gift panel: rotating, date-gated Wonder Card distributions plus
// offline redeem codes. Opened from the top-bar ticket button.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import {
  MYSTERY_GIFTS,
  claimableMysteryGifts,
  featuredMysteryGift,
  findMysteryGiftByCode,
  giftRewardLabel,
  mysteryGiftStatus,
  nextMysteryGift,
} from '../game/gifts.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { ItemIcon } from './item-icon.js'

/** @param {{ speciesKey: string, alt: string, className?: string }} props */
function GiftSprite({ speciesKey, alt, className }) {
  const id = pokemonSpecies[speciesKey]?.id ?? 0
  return jsx('img', {
    className: className ?? 'mystery-gift-sprite',
    src: getPokemonSpriteUrl(id),
    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
      (event.target.src = getPokemonSpriteFallbackUrl(id)),
    alt,
  })
}

/** @param {{ gift: import('../game/gifts.js').MysteryGiftEntry }} props */
function GiftIcon({ gift }) {
  if (gift.pokemon)
    return jsx(GiftSprite, {
      speciesKey: gift.pokemon.speciesKey,
      alt: pokemonSpecies[gift.pokemon.speciesKey]?.name ?? gift.pokemon.speciesKey,
    })
  return jsx('div', {
    className: 'mystery-gift-items',
    children: Object.keys(gift.items ?? {}).map((itemId) =>
      jsx(ItemIcon, { itemId, size: 28 }, itemId)
    ),
  })
}

/**
 * @param {{
 *   gift: import('../game/gifts.js').MysteryGiftEntry,
 *   status: ReturnType<typeof mysteryGiftStatus>,
 *   compact?: boolean,
 *   onClaim: (giftId: string) => void,
 * }} props
 */
function WonderCard({ gift, status, compact, onClaim }) {
  return jsxs(
    'div',
    {
      className: `mystery-card${compact ? ' compact' : ''}${status.claimed ? ' claimed' : ''}${
        status.featured ? ' featured' : ''
      }${!status.unlocked ? ' locked' : ''}`,
      children: [
        jsx(GiftIcon, { gift }),
        jsxs('div', {
          className: 'mystery-card-body',
          children: [
            jsx('div', { className: 'mystery-card-name', children: gift.name }),
            jsx('div', {
              className: 'mystery-card-sub',
              children: status.claimed
                ? `Received \u00b7 OT ${gift.ot}`
                : !status.unlocked
                  ? `Opens ${status.unlockDate}`
                  : `${gift.distribution} \u00b7 OT ${gift.ot}`,
            }),
            !compact && jsx('div', { className: 'mystery-card-desc', children: gift.description }),
            jsxs('div', {
              className: 'mystery-card-reward',
              children: ['Gift: ', giftRewardLabel(gift)],
            }),
            status.claimed
              ? jsx('div', { className: 'mystery-card-badge claimed', children: '\u2713 Received' })
              : status.claimable
                ? jsx('button', {
                    className: 'mystery-claim-btn',
                    onClick: () => onClaim(gift.id),
                    children: status.featured ? 'CLAIM NOW' : 'CLAIM',
                  })
                : jsx('div', {
                    className: 'mystery-card-badge locked',
                    children: status.unlocked ? 'LOCKED' : `OPENS ${status.unlockDate}`,
                  }),
          ],
        }),
      ],
    },
    gift.id
  )
}

/** @param {{ onClose: () => void }} props */
export function MysteryGiftModal({ onClose }) {
  const { state, dispatch } = useGame(),
    [codeInput, setCodeInput] = React.useState(''),
    [message, setMessage] = React.useState(
      /** @type {{ tone: string, text: string } | null} */ (null)
    ),
    featured = featuredMysteryGift(),
    upcoming = nextMysteryGift(),
    claimable = claimableMysteryGifts(state),
    claimed = new Set(state.claimedGifts ?? []),
    // A claimed code gift joins the archive; unredeemed codes stay hidden.
    cards = MYSTERY_GIFTS.filter((gift) => !gift.code || claimed.has(gift.id)),
    headline = featured && !claimed.has(featured.id) ? featured : (claimable[0] ?? featured),
    headlineStatus = headline ? mysteryGiftStatus(state, headline) : null
  const claim = /** @param {string} giftId */ (giftId) =>
    dispatch({ type: 'CLAIM_MYSTERY_GIFT', payload: { giftId } })
  const redeem = () => {
    const gift = findMysteryGiftByCode(codeInput)
    if (!gift) {
      setMessage({ tone: 'error', text: 'That code was not recognised.' })
      return
    }
    if (mysteryGiftStatus(state, gift).claimed) {
      setMessage({ tone: 'error', text: `${gift.name} has already been redeemed.` })
      return
    }
    dispatch({ type: 'CLAIM_MYSTERY_GIFT', payload: { giftId: gift.id } })
    setMessage({ tone: 'success', text: `${gift.name} received!` })
    setCodeInput('')
  }
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal mystery-gift-modal',
      onClick: /** @param {React.MouseEvent} mouseEvent */ (mouseEvent) =>
        mouseEvent.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', { className: 'battle-info-title', children: 'Mystery Gift' }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content mystery-gift-content',
          children: [
            headline && headlineStatus
              ? jsxs('div', {
                  className: 'mystery-gift-featured',
                  children: [
                    jsx('div', {
                      className: 'mystery-gift-section-title',
                      children: headlineStatus.featured
                        ? 'This Week\u2019s Wonder Card'
                        : 'Wonder Card',
                    }),
                    jsx(WonderCard, { gift: headline, status: headlineStatus, onClaim: claim }),
                    claimable.length > 1
                      ? jsx('div', {
                          className: 'mystery-gift-more',
                          children: `${claimable.length} distributions waiting to be claimed`,
                        })
                      : null,
                  ],
                })
              : jsx('p', {
                  className: 'mystery-gift-empty',
                  children: upcoming
                    ? `The next distribution opens ${upcoming.date}.`
                    : 'No Mystery Gift is available right now.',
                }),
            jsxs('div', {
              className: 'mystery-code-row',
              children: [
                jsx('input', {
                  className: 'mystery-code-input',
                  type: 'text',
                  value: codeInput,
                  placeholder: 'Enter a code',
                  onChange: /** @param {{ target: HTMLInputElement }} event */ (event) =>
                    setCodeInput(event.target.value),
                  onKeyDown: /** @param {React.KeyboardEvent} event */ (event) => {
                    if (event.key === 'Enter') redeem()
                  },
                }),
                jsx('button', {
                  className: 'mystery-code-btn',
                  disabled: !codeInput.trim(),
                  onClick: redeem,
                  children: 'REDEEM',
                }),
              ],
            }),
            message &&
              jsx('div', {
                className: `mystery-code-message ${message.tone}`,
                children: message.text,
              }),
            upcoming &&
              jsx('div', {
                className: 'mystery-gift-next',
                children: `Next distribution: ${upcoming.gift.name} on ${upcoming.date}`,
              }),
            jsx('div', { className: 'mystery-gift-section-title', children: 'Wonder Card Album' }),
            jsx('div', {
              className: 'mystery-gift-grid',
              children: cards.map((gift) =>
                jsx(
                  WonderCard,
                  { gift, status: mysteryGiftStatus(state, gift), compact: true, onClaim: claim },
                  gift.id
                )
              ),
            }),
          ],
        }),
      ],
    }),
  })
}
