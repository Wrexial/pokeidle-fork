// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { SAVE_KEY } from '../data/config.js'

/**
 * Catches render errors anywhere below it (e.g. an old save that references
 * removed content) so the game shows a recovery screen instead of blanking out.
 *
 * @typedef {{ children?: any }} ErrorBoundaryProps
 * @typedef {{ error: any }} ErrorBoundaryState
 * @extends {React.Component<ErrorBoundaryProps, ErrorBoundaryState>}
 */
export class ErrorBoundary extends React.Component {
  /** @type {ErrorBoundaryState} */
  state = { error: null }

  /** @param {any} error */
  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return jsxs('div', {
      className: 'game-window',
      style: { padding: '32px 16px', textAlign: 'center', gap: '12px' },
      children: [
        jsx('h2', { children: 'Something went wrong' }),
        jsx('p', {
          style: { fontSize: '9px', margin: '12px 0', opacity: 0.75, wordBreak: 'break-word' },
          children: String(
            this.state.error?.message ?? this.state.error ?? 'Unknown error'
          ),
        }),
        jsxs('div', {
          style: { display: 'flex', gap: '8px', justifyContent: 'center' },
          children: [
            jsx('button', {
              className: 'choose-btn',
              onClick: () => window.location.reload(),
              children: 'Reload',
            }),
            jsx('button', {
              className: 'choose-btn',
              onClick: () => {
                try {
                  localStorage.removeItem(SAVE_KEY)
                } catch {
                  /* ignore */
                }
                window.location.reload()
              },
              children: 'Reset save & reload',
            }),
          ],
        }),
      ],
    })
  }
}
