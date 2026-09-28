// Guard for the #48 colour-accessibility sweep: every type chip (the move
// cells' `.type-bg-*` and the `.type-*` badges) must keep its text at WCAG AA
// (4.5:1) against its own background. Reads the CSS directly so a palette tweak
// that reintroduces white-on-light-type text fails here.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../assets/style.css', import.meta.url), 'utf8')

const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark',
  'steel', 'fairy',
]

/** @param {string} selector @returns {string | null} */
function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Anchor to the start of a line so a prefixed variant such as
  // `[data-colourblind-types=true] .type-bg-normal { ... }` doesn't match first.
  const match = css.match(new RegExp(`(?:^|\\n)[ \\t]*${escaped}\\s*\\{([^}]*)\\}`))
  return match ? match[1] : null
}

/** @param {string} body @param {string} name @returns {string | null} */
function prop(body, name) {
  const match = body.match(new RegExp(`${name}\\s*:\\s*([^;]+)`))
  return match ? match[1].trim() : null
}

// Resolve `var(--token)` references from the :root block.
const tokens = {}
const rootBody = ruleBody(':root') ?? ''
for (const match of rootBody.matchAll(/--([\w-]+)\s*:\s*([^;]+)/g))
  tokens[`--${match[1]}`] = match[2].trim()
const resolve = (/** @type {string} */ value) => {
  const match = value.match(/var\((--[\w-]+)\)/)
  return match ? tokens[match[1]] ?? value : value
}

/** @param {string} hex @returns {number} */
function luminance(hex) {
  const rgb = [0, 2, 4]
    .map((index) => parseInt(hex.replace('#', '').substr(index, 2), 16) / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    )
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

/** @param {string} a @param {string} b @returns {number} */
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

for (const type of TYPES) {
  for (const [selector, label] of [
    [`.type-${type}`, 'badge'],
    [`.type-bg-${type}`, 'move cell'],
  ]) {
    test(`${type} ${label} text meets WCAG AA`, () => {
      const body = ruleBody(selector)
      assert.ok(body, `${selector} is defined`)
      const background = prop(body, 'background')
      assert.ok(background, `${selector} sets a background`)
      // The badge base class defaults to white; light types override it.
      const declared = prop(body, 'color')
      const text = declared ? resolve(declared) : '#ffffff'
      const ratio = contrast(text, resolve(background))
      assert.ok(
        ratio >= 4.5,
        `${selector} text ${text} on ${background} is ${ratio.toFixed(2)}:1 (needs 4.5:1)`
      )
    })
  }
}
