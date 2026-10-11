import { test } from 'node:test'
import assert from 'node:assert/strict'

// `SegmentedControl` is a plain function (no hooks), so it can be called
// directly and its element tree inspected without a React renderer.
const { SegmentedControl } = await import('../src/components/ui-controls.js')

test('SegmentedControl marks the active option and reports clicks', () => {
  let picked = null
  const element = SegmentedControl({
      options: [
        { value: 1, label: '1x' },
        { value: 2, label: '2x' },
        { value: 5, label: '5x' },
      ],
      value: 2,
      onChange: (/** @type {number} */ value) => {
        picked = value
      },
      compact: true,
      'aria-label': 'Battle speed',
    }),
    buttons = element.props.children
  assert.equal(element.props.className, 'ui-segmented compact')
  assert.equal(element.props['aria-label'], 'Battle speed')
  assert.equal(buttons.length, 3)
  assert.match(buttons[1].props.className, /active/, 'the current value is active')
  assert.doesNotMatch(buttons[0].props.className, /active/)
  assert.equal(buttons[0].props.children, '1x')
  // Clicking an inactive segment reports its value.
  buttons[2].props.onClick()
  assert.equal(picked, 5)
})
