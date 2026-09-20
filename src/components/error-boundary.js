// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { SAVE_KEY } from '../data/config.js'

/**
 * Catches render errors anywhere below it (e.g. an old save that references
 * removed content) so the game never blanks out. It offers an immediate reset
 * and, if the player can't interact (no console, broken UI), clears the save
 * and reloads on its own after a short delay.
 *
 * @typedef {{ children?: any }} ErrorBoundaryProps
 * @typedef {{ error: any }} ErrorBoundaryState
 * @extends {React.Component<ErrorBoundaryProps, ErrorBoundaryState>}
 */
export class ErrorBoundary extends React.Component {
  /** @type {ErrorBoundaryState} */
  state = { error: null }
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  resetTimer = undefined

  /** @param {any} error */
  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch() {
    // auto-recover even if the player can't reach the buttons
    this.resetTimer = setTimeout(() => this.reset(), 8000)
  }

  componentWillUnmount() {
    if (this.resetTimer) clearTimeout(this.resetTimer)
  }

  reset() {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      /* ignore */
    }
    window.location.reload()
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
        jsx('p', {
          style: { fontSize: '8px', margin: '0 0 12px', opacity: 0.6 },
          children: 'Your save will be reset automatically in a few seconds.',
        }),
        jsxs('div', {
          style: { display: 'flex', gap: '8px', justifyContent: 'center' },
          children: [
            jsx('button', {
              className: 'choose-btn',
              onClick: () => this.reset(),
              children: 'Reset save & reload',
            }),
            jsx('button', {
              className: 'choose-btn',
              onClick: () => window.location.reload(),
              children: 'Reload',
            }),
          ],
        }),
      ],
    })
  }
}
