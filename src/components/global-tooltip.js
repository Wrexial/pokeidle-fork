// A single hover tooltip for the whole app. Any element with a `data-tooltip`
// attribute shows its text in a floating bubble. Using one listener + a portal
// keeps the bubble out of scrolling/clipped panels (the stats panel scrolls, so
// an absolutely-positioned tooltip inside it would be cut off).
import React from 'react'
import { createPortal } from 'react-dom'
import { jsx } from 'react/jsx-runtime'

/**
 * @param {EventTarget | null | undefined} target
 * @returns {Element | null}
 */
function tooltipOwner(target) {
  return target instanceof Element ? target.closest('[data-tooltip]') : null
}

export function GlobalTooltip() {
  const [tip, setTip] = React.useState(
    /** @type {{ text: string, x: number, y: number } | null} */ (null)
  )
  React.useEffect(() => {
    /** @param {Event} event */
    const show = (event) => {
      const owner = tooltipOwner(event.target)
      if (!owner) return
      const text = owner.getAttribute('data-tooltip')
      if (!text) return
      const rect = owner.getBoundingClientRect()
      setTip({ text, x: rect.left + rect.width / 2, y: rect.top })
    }
    /** @param {Event} event */
    const hide = (event) => {
      const from = tooltipOwner(event.target)
      if (!from) return
      // Moving between children of the same tooltipped element must not flicker.
      const to =
        'relatedTarget' in event
          ? tooltipOwner(/** @type {EventTarget | null} */ (event.relatedTarget))
          : null
      if (from !== to) setTip(null)
    }
    document.addEventListener('pointerover', show)
    document.addEventListener('pointerout', hide)
    document.addEventListener('focusin', show)
    document.addEventListener('focusout', hide)
    return () => {
      document.removeEventListener('pointerover', show)
      document.removeEventListener('pointerout', hide)
      document.removeEventListener('focusin', show)
      document.removeEventListener('focusout', hide)
    }
  }, [])
  return tip
    ? createPortal(
        jsx('div', {
          className: 'global-tooltip',
          role: 'tooltip',
          style: { left: `${tip.x}px`, top: `${tip.y}px` },
          children: tip.text,
        }),
        document.body
      )
    : null
}
