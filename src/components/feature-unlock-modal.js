// "Congratulations" popup for a system that just opened, plus the Region
// Unlock Token a Champion win pays out. It watches the run's progress, queues
// each newly unlocked system (several can land on the same milestone, e.g. the
// Bank, team presets and Field Jobs on a Champion win) and explains what the
// system does and where to find it. The toast that used to announce these still
// fires, so a hidden tab picks it up too.
//
// The token card is queued per token earned (the count only rises on a Champion
// win and drops when a region is opened) so the player learns the Town Map is
// where they can open the next region, and gets a button that goes there.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { regions } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { regionTokenStatus } from '../game/progression.js'
import {
  FEATURE_UNLOCKS,
  nextLockedFeatureId,
  unlockedFeatureIds,
} from '../game/feature-unlocks.js'
import { useUi } from '../game/ui-context.js'
import { Icon } from './icon.js'

/**
 * One card in the congratulations queue: a system that just opened, or a
 * Region Unlock Token that can be spent on the Town Map.
 * @typedef {{ kind: 'feature', id: import('../game/feature-unlocks.js').FeatureUnlockId }
 *   | { kind: 'token', tokens: number, regionId: string | null }} UnlockCard
 */

export function FeatureUnlockModal() {
  const { state, dispatch } = useGame(),
    { requestMap } = useUi(),
    [queue, setQueue] = React.useState(/** @type {UnlockCard[]} */ ([])),
    // The set of open systems and the token count seen last render. They start
    // null on mount so an existing save never replays its popups.
    knownRef = React.useRef(/** @type {Set<string> | null} */ (null)),
    tokensRef = React.useRef(/** @type {number | null} */ (null))
  React.useEffect(() => {
    const current = new Set(unlockedFeatureIds(state)),
      previous = knownRef.current,
      tokenStatus = regionTokenStatus(state),
      previousTokens = tokensRef.current
    knownRef.current = current
    tokensRef.current = tokenStatus.tokens
    if (!previous || previousTokens == null) return
    /** @type {UnlockCard[]} */
    const cards = [...current]
      .filter((featureId) => !previous.has(featureId))
      .map((featureId) => ({
        kind: 'feature',
        id: /** @type {import('../game/feature-unlocks.js').FeatureUnlockId} */ (featureId),
      }))
    // The token leads the queue: after a Champion win, "you can open another
    // region now" is the headline, and the system cards follow it.
    if (tokenStatus.tokens > previousTokens)
      cards.unshift({ kind: 'token', tokens: tokenStatus.tokens, regionId: tokenStatus.regionId })
    if (cards.length === 0) return
    dispatch({
      type: 'PUSH_NOTIFICATION',
      payload: {
        message: `Unlocked: ${cards
          .map((card) =>
            card.kind === 'feature' ? FEATURE_UNLOCKS[card.id].label : 'Region Unlock Token'
          )
          .join(', ')}`,
        icon: '\u{1f513}',
        dedupeKey: `feature-unlock:${cards
          .map((card) => (card.kind === 'feature' ? card.id : `token:${card.tokens}`))
          .join(',')}`,
      },
    })
    setQueue((pending) => [
      ...pending,
      ...cards.filter(
        (card) =>
          !pending.some((queued) =>
            card.kind === 'feature'
              ? queued.kind === 'feature' && queued.id === card.id
              : queued.kind === 'token'
          )
      ),
    ])
  }, [state, dispatch])
  const card = queue[0]
  if (!card) return null
  const dismiss = () => setQueue((pending) => pending.slice(1)),
    remaining = queue.length - 1
  if (card.kind === 'token') {
    const regionName = regions.find((region) => region.id === card.regionId)?.name ?? 'region',
      nextFeatureId = nextLockedFeatureId(state),
      nextFeature = nextFeatureId ? FEATURE_UNLOCKS[nextFeatureId] : null,
      tokenWord = card.tokens > 1 ? `${card.tokens} Unlock Tokens` : 'an Unlock Token'
    return jsx('div', {
      className: 'modal-overlay feature-unlock-overlay',
      onClick: dismiss,
      children: jsxs('div', {
        className: 'feature-unlock',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Region Unlock Token earned',
        onClick: /** @param {React.MouseEvent} mouseEvent */ (mouseEvent) =>
          mouseEvent.stopPropagation(),
        children: [
          jsx('div', {
            className: 'feature-unlock-kicker',
            children: 'Champion Beaten',
          }),
          jsx('div', {
            className: 'feature-unlock-icon',
            children: '\u{1f5fa}\u{fe0f}',
          }),
          jsx('h2', {
            className: 'feature-unlock-title',
            children: 'Region Unlock Token',
          }),
          jsx('p', {
            className: 'feature-unlock-description',
            children: `Beating the ${regionName} Champion earned you ${tokenWord}. Open the Town Map and pick any locked region to open it \u2014 your party, items, money and Pokedex all come with you.`,
          }),
          jsxs('span', {
            className: 'feature-unlock-requirement',
            children: [jsx(Icon, { name: 'star' }), `Earned from the ${regionName} Champion.`],
          }),
          nextFeature
            ? jsxs('span', {
                className: 'feature-unlock-next',
                children: [
                  'Next up: ',
                  jsx('strong', { children: nextFeature.label }),
                  `\u2014 unlocks after ${nextFeature.requirement}.`,
                ],
              })
            : null,
          jsxs('div', {
            className: 'feature-unlock-actions',
            children: [
              jsx('button', {
                className: 'feature-unlock-btn secondary',
                onClick: dismiss,
                children: 'LATER',
              }),
              jsx('button', {
                className: 'feature-unlock-btn',
                onClick: () => {
                  dismiss()
                  requestMap()
                },
                children: 'OPEN TOWN MAP',
              }),
            ],
          }),
        ],
      }),
    })
  }
  const feature = FEATURE_UNLOCKS[card.id],
    nextFeatureId = nextLockedFeatureId(state, feature.requirement),
    nextFeature = nextFeatureId ? FEATURE_UNLOCKS[nextFeatureId] : null
  return jsx('div', {
    className: 'modal-overlay feature-unlock-overlay',
    onClick: dismiss,
    children: jsxs('div', {
      className: 'feature-unlock',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': `${feature.label} unlocked`,
      onClick: /** @param {React.MouseEvent} mouseEvent */ (mouseEvent) =>
        mouseEvent.stopPropagation(),
      children: [
        jsx('div', {
          className: 'feature-unlock-kicker',
          children: 'New System Unlocked',
        }),
        jsx('div', {
          className: 'feature-unlock-icon',
          children: feature.icon,
        }),
        jsx('h2', {
          className: 'feature-unlock-title',
          children: feature.label,
        }),
        jsx('p', {
          className: 'feature-unlock-description',
          children: feature.description,
        }),
        jsxs('span', {
          className: 'feature-unlock-requirement',
          children: [jsx(Icon, { name: 'star' }), `Earned with ${feature.requirement}.`],
        }),
        nextFeature
          ? jsxs('span', {
              className: 'feature-unlock-next',
              children: [
                'Next up: ',
                jsx('strong', { children: nextFeature.label }),
                `\u2014 unlocks after ${nextFeature.requirement}.`,
              ],
            })
          : null,
        jsx('button', {
          className: 'feature-unlock-btn',
          onClick: dismiss,
          children: remaining > 0 ? `Continue (${remaining} more)` : 'Continue',
        }),
      ],
    }),
  })
}
