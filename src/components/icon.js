// One inline-SVG icon set for the UI. Every icon draws with `currentColor` so it
// re-tints with the active theme, and sizes off the surrounding font size (the
// `.ui-icon` rule in assets/style.css) unless an explicit `size` is passed.
//
// This replaces the hand-picked unicode glyphs (check marks, crosses, arrows,
// stars, the Battle sword, ...) that used to be sprinkled through the
// components, which rendered differently per platform and could not follow the
// theme tokens.

import { jsx } from 'react/jsx-runtime'

/** @type {Record<string, string>} */
const ICON_PATHS = {
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  circle:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16z',
  times:
    'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  play: 'M8 5v14l11-7z',
  'chevron-up': 'M12 7 5.5 15.5h13z',
  'chevron-down': 'M12 17 18.5 8.5h-13z',
  'arrow-left': 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z',
  'arrow-right': 'M4 13h12.17l-5.59 5.59L12 20l8-8-8-8-1.41 1.41L16.17 11H4z',
  star: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  sparkle: 'M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z',
  gear: 'M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.62l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.86a.5.5 0 0 0 .12.62l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.62l1.92 3.32c.12.22.38.3.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.48 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.62zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z',
  refresh: 'M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z',
  undo: 'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62A7.98 7.98 0 0 1 20 13.5h2.5A10.48 10.48 0 0 0 12.5 8z',
  download: 'M12 3v10.55l3.5-3.5 1.42 1.41L12 16.38l-4.92-4.92 1.42-1.41 3.5 3.5V3zM5 18h14v2H5z',
  upload: 'M12 3.62l4.92 4.92-1.42 1.41-3.5-3.5V21h-2V6.45l-3.5 3.5-1.42-1.41zM5 3h14v2H5z',
  trash: 'M9 3h6l1 2h4v2H4V5h4l1-2zM6 8h12l-1 13H7L6 8z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
  lock: 'M12 2a5 5 0 0 0-5 5v3H4v12h16V10h-3V7a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v3H9V7a3 3 0 0 1 3-3zm0 9a2 2 0 0 1 1 3.73V19h-2v-2.27A2 2 0 0 1 12 13z',
}

/**
 * A themed UI icon. `name` selects the glyph; `label` promotes it to an
 * accessible image (otherwise it is hidden from assistive tech). `size` sets a
 * pixel width/height, overriding the font-size-based default.
 * @param {{ name: string, size?: number, className?: string, label?: string }} props
 */
export function Icon({ name, size, className, label }) {
  const path = ICON_PATHS[name]
  if (!path) return null
  return jsx('svg', {
    className: `ui-icon${className ? ` ${className}` : ''}`,
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'currentColor',
    fillRule: 'evenodd',
    focusable: 'false',
    'aria-hidden': label ? void 0 : 'true',
    role: label ? 'img' : void 0,
    'aria-label': label,
    children: jsx('path', { d: path }),
  })
}
