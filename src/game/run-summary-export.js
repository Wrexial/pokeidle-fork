// Renders a Run Summary (see game/milestones.js) to a PNG and downloads it so
// the player can share a run's highlights. Kept out of the React component so
// the drawing maths is testable and the modal stays presentational.

import { MILESTONE_KINDS, formatMilestoneAge } from './milestones.js'

const WIDTH = 720
const HEADER_HEIGHT = 164
const STATS_HEIGHT = 92
const FOOTER_HEIGHT = 54
const ROW_HEIGHT = 30
const MAX_TIMELINE_ROWS = 8

/**
 * Draw a rounded rectangle path.
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

/**
 * Trim text to fit a width, adding an ellipsis when clipped.
 * @param {CanvasRenderingContext2D} context
 * @param {string} text
 * @param {number} maxWidth
 */
function fitText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text
  let clipped = text
  while (clipped.length > 1 && context.measureText(`${clipped}\u2026`).width > maxWidth)
    clipped = clipped.slice(0, -1)
  return `${clipped}\u2026`
}

/**
 * Paint the header (title, trainer identity, region).
 * @param {CanvasRenderingContext2D} context
 * @param {ReturnType<typeof import('./milestones.js').summarizeRun>} summary
 */
function drawHeader(context, summary) {
  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.fillStyle = '#ffe9a8'
  context.font = '12px "Press Start 2P", monospace'
  context.fillText('RUN SUMMARY', 40, 44)

  context.fillStyle = '#ffffff'
  context.font = 'bold 28px "Press Start 2P", monospace'
  context.fillText(fitText(context, summary.trainerName, 400), 40, 90)

  context.font = '14px "Press Start 2P", monospace'
  context.fillStyle = '#ffe9a8'
  context.fillText(fitText(context, summary.title ?? 'No title', 400), 42, 118)

  context.fillStyle = '#ffffffcc'
  context.font = '13px "Press Start 2P", monospace'
  const regionLine = summary.starterName
    ? `${summary.regionName} \u00b7 Starter ${summary.starterName}`
    : summary.regionName
  context.fillText(fitText(context, regionLine, 460), 42, 144)

  // A small Poké Ball roundel on the right.
  context.fillStyle = '#e24b4b'
  context.beginPath()
  context.arc(WIDTH - 90, 92, 40, Math.PI, 0)
  context.fill()
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(WIDTH - 90, 92, 40, 0, Math.PI)
  context.fill()
  context.strokeStyle = '#2a1c12'
  context.lineWidth = 5
  context.beginPath()
  context.arc(WIDTH - 90, 92, 40, 0, Math.PI * 2)
  context.stroke()
  context.beginPath()
  context.moveTo(WIDTH - 130, 92)
  context.lineTo(WIDTH - 50, 92)
  context.stroke()
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(WIDTH - 90, 92, 13, 0, Math.PI * 2)
  context.fill()
  context.stroke()
}

/**
 * Paint the four headline stat tiles and the secondary meta line.
 * @param {CanvasRenderingContext2D} context
 * @param {ReturnType<typeof import('./milestones.js').summarizeRun>} summary
 */
function drawStats(context, summary) {
  const tiles = /** @type {[string, string | number][]} */ ([
    ['Dex', summary.stats.caught],
    ['Shinies', summary.stats.shinies],
    ['Badges', summary.stats.badges],
    ['Lv.100', summary.stats.level100],
  ])
  const margin = 40,
    gap = 12,
    tileWidth = (WIDTH - margin * 2 - gap * 3) / 4,
    tileHeight = 64,
    top = HEADER_HEIGHT + 12
  tiles.forEach(([label, value], index) => {
    const x = margin + index * (tileWidth + gap)
    context.fillStyle = '#ffffff1f'
    roundedRect(context, x, top, tileWidth, tileHeight, 10)
    context.fill()
    context.strokeStyle = '#ffe9a855'
    context.lineWidth = 2
    roundedRect(context, x, top, tileWidth, tileHeight, 10)
    context.stroke()
    context.textAlign = 'center'
    context.fillStyle = '#ffffff'
    context.font = 'bold 20px "Press Start 2P", monospace'
    context.fillText(String(value), x + tileWidth / 2, top + 34)
    context.fillStyle = '#ffe9a8'
    context.font = '11px "Press Start 2P", monospace'
    context.fillText(label, x + tileWidth / 2, top + 54)
  })
  context.textAlign = 'left'
  context.fillStyle = '#ffffffcc'
  context.font = '13px "Press Start 2P", monospace'
  context.fillText(
    `Battles ${summary.stats.battles.toLocaleString()}  \u00b7  Regions ${summary.stats.regions}  \u00b7  Champions ${summary.stats.champions}`,
    margin + 2,
    top + tileHeight + 24
  )
}

/**
 * Paint the most recent milestones, newest first, with their age.
 * @param {CanvasRenderingContext2D} context
 * @param {ReturnType<typeof import('./milestones.js').summarizeRun>} summary
 * @param {number} top
 */
function drawTimeline(context, summary, top) {
  context.textAlign = 'left'
  context.fillStyle = '#ffe9a8'
  context.font = '12px "Press Start 2P", monospace'
  context.fillText('HIGHLIGHTS', 40, top)
  const rows = (summary.milestones ?? []).slice(-MAX_TIMELINE_ROWS).reverse()
  rows.forEach((milestone, index) => {
    const y = top + 24 + index * ROW_HEIGHT,
      info = MILESTONE_KINDS[milestone.kind]
    context.font = '18px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'
    context.fillStyle = '#ffffff'
    context.fillText(info?.icon ?? '\u2022', 42, y + 4)
    context.font = '14px "Press Start 2P", monospace'
    context.fillStyle = '#ffffff'
    context.fillText(fitText(context, `${milestone.name}`, 400), 76, y)
    context.fillStyle = '#ffffffaa'
    context.font = '11px "Press Start 2P", monospace'
    context.fillText(info?.label ?? 'Milestone', 76, y + 15)
    context.textAlign = 'right'
    context.fillText(formatMilestoneAge(milestone), WIDTH - 40, y)
    context.textAlign = 'left'
  })
}

/**
 * Render `summary` to a PNG and trigger a download. Resolves true when the file
 * was written, false when the browser refused to encode the canvas.
 * @param {ReturnType<typeof import('./milestones.js').summarizeRun>} summary
 * @param {string} [filename]
 * @returns {Promise<boolean>}
 */
export function exportRunSummaryPng(summary, filename) {
  if (!summary || typeof document === 'undefined') return Promise.resolve(false)
  const rowCount = Math.min(MAX_TIMELINE_ROWS, (summary.milestones ?? []).length),
    height = HEADER_HEIGHT + STATS_HEIGHT + 34 + rowCount * ROW_HEIGHT + FOOTER_HEIGHT,
    canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(false)

  const gradient = context.createLinearGradient(0, 0, WIDTH, height)
  gradient.addColorStop(0, '#1d2b4a')
  gradient.addColorStop(1, '#3a2148')
  context.fillStyle = gradient
  context.fillRect(0, 0, WIDTH, height)

  drawHeader(context, summary)
  drawStats(context, summary)
  drawTimeline(context, summary, HEADER_HEIGHT + STATS_HEIGHT + 12)

  context.fillStyle = '#ffffff77'
  context.font = '10px "Press Start 2P", monospace'
  context.textAlign = 'center'
  context.fillText('Pok\u00e9mon Idle', WIDTH / 2, height - 22)
  context.textAlign = 'left'

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      if (!blob) {
        resolve(false)
        return
      }
      const url = URL.createObjectURL(blob),
        link = document.createElement('a')
      link.href = url
      link.download = filename ?? `pokemon-idle-run-summary-${Date.now()}.png`
      link.click()
      URL.revokeObjectURL(url)
      resolve(true)
    }, 'image/png')
  })
}
