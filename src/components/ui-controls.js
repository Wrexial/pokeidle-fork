// Shared input controls for the pixel UI (#77). `SegmentedControl` is the one
// row-of-buttons selector used for speeds, shop mode, filters and other opt-in
// choices, and `NumberControl` is the shared slider / stepper used for numeric
// values (the catch level threshold, the shop quantity). Both share the
// `ui-segmented` / `ui-number` styling so like looks like like.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

/**
 * A row of mutually-exclusive buttons. `options` is `{ value, label, title? }`.
 * @template T
 * @param {{
 *   options: { value: T, label: React.ReactNode, title?: string }[],
 *   value: T,
 *   onChange: (value: T) => void,
 *   className?: string,
 *   compact?: boolean,
 *   disabled?: boolean,
 *   'aria-label'?: string,
 * }} props
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  compact = !1,
  disabled = !1,
  'aria-label': ariaLabel,
}) {
  return jsx('div', {
    className: `ui-segmented${compact ? ' compact' : ''}${className ? ` ${className}` : ''}`,
    role: 'group',
    'aria-label': ariaLabel,
    children: options.map((option) =>
      jsx(
        'button',
        {
          type: 'button',
          className: `ui-segmented-btn${option.value === value ? ' active' : ''}`,
          title: option.title,
          disabled,
          'aria-pressed': option.value === value,
          onClick: () => onChange(option.value),
          children: option.label,
        },
        String(option.value)
      )
    ),
  })
}

/**
 * A shared numeric control: a slider (track + fill + handle) plus stepper
 * buttons, or a bare stepper when `slider` is false. The value is clamped and
 * snapped to `step`. Supports dragging, clicking the track and arrow keys.
 * @param {{
 *   value: number,
 *   min: number,
 *   max: number,
 *   step?: number,
 *   onChange: (value: number) => void,
 *   format?: (value: number) => React.ReactNode,
 *   slider?: boolean,
 *   compact?: boolean,
 *   disabled?: boolean,
 *   className?: string,
 *   'aria-label'?: string,
 * }} props
 */
export function NumberControl({
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (/** @type {number} */ current) => String(current),
  slider = !0,
  compact = !1,
  disabled = !1,
  className,
  'aria-label': ariaLabel,
}) {
  const trackRef = React.useRef(/** @type {HTMLDivElement | null} */ (null)),
    draggingRef = React.useRef(!1),
    safeMin = Math.min(min, max),
    safeMax = Math.max(min, max),
    clamp = React.useCallback(
      /** @param {number} next */ (next) =>
        Math.max(safeMin, Math.min(safeMax, Math.round(next / step) * step)),
      [safeMin, safeMax, step]
    ),
    commit = React.useCallback(
      /** @param {number} next */ (next) => {
        if (disabled) return
        const clamped = clamp(next)
        if (clamped !== value) onChange(clamped)
      },
      [clamp, disabled, onChange, value]
    ),
    valueFromPointer = React.useCallback(
      /** @param {PointerEvent | React.PointerEvent} event */ (event) => {
        const rect = trackRef.current?.getBoundingClientRect()
        if (!rect || rect.width <= 0) return
        const ratio = (event.clientX - rect.left) / rect.width,
          raw = safeMin + ratio * (safeMax - safeMin)
        commit(raw)
      },
      [commit, safeMin, safeMax]
    ),
    fraction = safeMax > safeMin ? (value - safeMin) / (safeMax - safeMin) : 0
  return jsxs('div', {
    className: `ui-number${compact ? ' compact' : ''}${disabled ? ' disabled' : ''}${
      className ? ` ${className}` : ''
    }`,
    children: [
      jsx('button', {
        type: 'button',
        className: 'ui-number-btn',
        disabled: disabled || value <= safeMin,
        'aria-label': 'Decrease',
        onClick: () => commit(value - step),
        children: '\u2212',
      }),
      slider &&
        jsx('div', {
          ref: trackRef,
          className: 'ui-slider',
          role: 'slider',
          tabIndex: disabled ? -1 : 0,
          'aria-label': ariaLabel,
          'aria-valuemin': safeMin,
          'aria-valuemax': safeMax,
          'aria-valuenow': value,
          onPointerDown: /** @param {React.PointerEvent<HTMLDivElement>} event */ (event) => {
            if (disabled) return
            draggingRef.current = !0
            event.currentTarget.setPointerCapture(event.pointerId)
            valueFromPointer(event)
          },
          onPointerMove: /** @param {React.PointerEvent<HTMLDivElement>} event */ (event) => {
            if (draggingRef.current) valueFromPointer(event)
          },
          onPointerUp: /** @param {React.PointerEvent<HTMLDivElement>} event */ (event) => {
            draggingRef.current = !1
            event.currentTarget.releasePointerCapture?.(event.pointerId)
          },
          onKeyDown: /** @param {React.KeyboardEvent<HTMLDivElement>} event */ (event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
              event.preventDefault()
              commit(value - step)
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
              event.preventDefault()
              commit(value + step)
            } else if (event.key === 'Home') {
              event.preventDefault()
              commit(safeMin)
            } else if (event.key === 'End') {
              event.preventDefault()
              commit(safeMax)
            }
          },
          children: jsx('div', {
            className: 'ui-slider-fill',
            style: { width: `${Math.max(0, Math.min(1, fraction)) * 100}%` },
            children: jsx('span', { className: 'ui-slider-handle' }),
          }),
        }),
      jsx('span', { className: 'ui-number-value', children: format(value) }),
      jsx('button', {
        type: 'button',
        className: 'ui-number-btn',
        disabled: disabled || value >= safeMax,
        'aria-label': 'Increase',
        onClick: () => commit(value + step),
        children: '+',
      }),
    ],
  })
}
