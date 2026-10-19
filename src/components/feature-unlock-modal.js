// "Congratulations" popup for a system that just opened. It watches the run's
// progress, queues each newly unlocked system (several can land on the same
// milestone, e.g. the Bank, team presets and Field Jobs on a Champion win) and
// explains what the system does and where to find it. The toast that used to
// announce these still fires, so a hidden tab picks it up too.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { Icon } from './icon.js'
import { useGame } from '../game/context.js'
import {
  FEATURE_UNLOCKS,
  nextLockedFeatureId,
  unlockedFeatureIds,
} from '../game/feature-unlocks.js'

export function FeatureUnlockModal() {
  const { state, dispatch } = useGame(),
    [queue, setQueue] = React.useState(
      /** @type {import('../game/feature-unlocks.js').FeatureUnlockId[]} */ ([])
    ),
    // The set of open systems seen last render. It starts null on mount so an
    // existing save's features never replay their popups.
    knownRef = React.useRef(/** @type {Set<string> | null} */ (null))
  React.useEffect(() => {
    const current = new Set(unlockedFeatureIds(state)),
      previous = knownRef.current
    knownRef.current = current
    if (!previous) return
    const newlyUnlocked = /** @type {import('../game/feature-unlocks.js').FeatureUnlockId[]} */ (
      [...current].filter((featureId) => !previous.has(featureId))
    )
    if (newlyUnlocked.length === 0) return
    dispatch({
      type: 'PUSH_NOTIFICATION',
      payload: {
        message: `Unlocked: ${newlyUnlocked
          .map((featureId) => FEATURE_UNLOCKS[featureId].label)
          .join(', ')}`,
        icon: '\u{1f513}',
        dedupeKey: `feature-unlock:${newlyUnlocked.join(',')}`,
      },
    })
    setQueue((pending) => [
      ...pending,
      ...newlyUnlocked.filter((featureId) => !pending.includes(featureId)),
    ])
  }, [state, dispatch])
  const featureId = queue[0]
  if (!featureId) return null
  const feature = FEATURE_UNLOCKS[featureId],
    dismiss = () => setQueue((pending) => pending.slice(1)),
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
          children: queue.length > 1 ? `Continue (${queue.length - 1} more)` : 'Continue',
        }),
      ],
    }),
  })
}
