// Renders a Trainer Card to a PNG and downloads it, so the player can share
// their card. Kept out of the React component so the drawing maths is testable
// and one export path serves both the live card and (if ever needed) a slot.
//
// The static sprite art is used rather than the animated gif: canvas draws a
// gif's first frame, but the static png is smaller and always available.

import { getPokemonSpriteFallbackUrl } from './pokemon.js'

const CARD_WIDTH = 720
const CARD_HEIGHT = 420

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
 * Paint the card's background and the parts that don't depend on an async
 * sprite load. The sprite is drawn afterwards by the caller.
 * @param {CanvasRenderingContext2D} context
 * @param {TrainerCardData} card
 */
function drawCardBase(context, card) {
  const gradient = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
  gradient.addColorStop(0, card.outfit.bg[0])
  gradient.addColorStop(1, card.outfit.bg[1])
  context.fillStyle = gradient
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  // Framed chrome around the card face.
  context.strokeStyle = '#ffffff33'
  context.lineWidth = 4
  roundedRect(context, 18, 18, CARD_WIDTH - 36, CARD_HEIGHT - 36, 18)
  context.stroke()

  // Avatar: a body circle, a head circle and the outfit emblem.
  const avatarX = 96
  const avatarY = 132
  context.fillStyle = card.outfit.shirt
  context.beginPath()
  context.arc(avatarX, avatarY, 54, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = card.outfit.skin
  context.beginPath()
  context.arc(avatarX, avatarY - 18, 30, 0, Math.PI * 2)
  context.fill()
  context.font = '44px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(card.outfit.emblem, avatarX, avatarY + 6)

  // Identity: name, title and region.
  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.fillStyle = '#ffffff'
  context.font = 'bold 34px "Press Start 2P", monospace'
  context.fillText(card.name.slice(0, 16), 176, 128)
  context.font = '18px "Press Start 2P", monospace'
  context.fillStyle = '#ffe9a8'
  context.fillText(card.title ?? 'No title', 178, 166)
  context.fillStyle = '#ffffffcc'
  context.font = '16px "Press Start 2P", monospace'
  context.fillText(`${card.regionName} \u00b7 Lv.${card.level}`, 178, 202)

  // Stats block.
  context.fillStyle = '#ffffff'
  context.font = '16px "Press Start 2P", monospace'
  context.fillText(`Dex caught: ${card.dex}`, 60, 292)
  context.fillText(`Badges earned: ${card.totalBadges}`, 60, 326)

  // Badge case along the bottom-right.
  if (card.badges.length > 0) {
    const startX = 372
    card.badges.forEach((badge, index) => {
      const x = startX + index * 34
      context.fillStyle = badge.color
      roundedRect(context, x, 348, 26, 26, 6)
      context.fill()
      context.strokeStyle = '#ffffff88'
      context.lineWidth = 2
      roundedRect(context, x, 348, 26, 26, 6)
      context.stroke()
    })
  }
}

/**
 * Draw a loaded favourite sprite on the card, framed on the right.
 * @param {CanvasRenderingContext2D} context
 * @param {TrainerCardData} card
 * @param {HTMLImageElement} image
 */
function drawSprite(context, card, image) {
  if (!card.favourite) return
  const size = 128,
    x = CARD_WIDTH - 190,
    y = 72
  context.fillStyle = '#00000040'
  roundedRect(context, x - 12, y - 12, size + 24, size + 24, 14)
  context.fill()
  context.imageSmoothingEnabled = false
  context.drawImage(image, x, y, size, size)
  context.fillStyle = '#ffffff'
  context.font = '16px "Press Start 2P", monospace'
  context.textAlign = 'center'
  context.fillText(card.favourite.name.slice(0, 14), x + size / 2, y + size + 34)
  context.fillStyle = '#ffffffcc'
  context.fillText(`Lv.${card.favourite.level}`, x + size / 2, y + size + 60)
  context.textAlign = 'left'
}

/**
 * Render `card` to a PNG and trigger a download. Resolves true when the file
 * was written, false when the browser refused to encode the canvas.
 * @param {TrainerCardData} card
 * @param {string} [filename]
 * @returns {Promise<boolean>}
 */
export function exportTrainerCardPng(card, filename) {
  if (!card || typeof document === 'undefined') return Promise.resolve(false)
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(false)
  drawCardBase(context, card)

  const favourite = card.favourite
  const spriteLoaded =
    favourite && favourite.spriteId != null
      ? new Promise(
          /** @param {(value: boolean) => void} resolve */ (resolve) => {
            const image = new Image()
            image.onload = () => {
              drawSprite(context, card, image)
              resolve(true)
            }
            image.onerror = () => resolve(false)
            image.src = getPokemonSpriteFallbackUrl(
              favourite.spriteId ?? 0,
              false,
              favourite.isShiny
            )
          }
        )
      : Promise.resolve(false)

  return spriteLoaded.then(
    () =>
      new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(false)
            return
          }
          const url = URL.createObjectURL(blob),
            link = document.createElement('a')
          link.href = url
          link.download = filename ?? `pokemon-idle-trainer-card-${Date.now()}.png`
          link.click()
          URL.revokeObjectURL(url)
          resolve(true)
        }, 'image/png')
      })
  )
}
