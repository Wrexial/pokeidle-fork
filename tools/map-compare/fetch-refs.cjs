#!/usr/bin/env node
/**
 * Download reference region-map images from Bulbapedia for visual comparison
 * against the game's generated layouts (see render-region-maps.py).
 *
 * Not part of the build. Reference images land in tools/map-compare/refs/
 * (gitignored) so they never bloat the repo.
 *
 * Usage: node tools/map-compare/fetch-refs.cjs
 */
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, 'refs')
const UA = 'PokemonIdle-map-research/1.0'
const API = 'https://bulbapedia.bulbagarden.net/w/api.php'

// Preferred in-game town map first, then a fallback from the region article.
const CANDIDATES = {
  kanto: ['File:Kanto Town Map RGBY.png', 'File:PE Kanto Map.png', 'File:KantoTownMap.png'],
  johto: ['File:Johto Town Map GSC.png', 'File:JohtoMap.png'],
  hoenn: ['File:Hoenn RSE Map.png', 'File:Hoenn ORAS Map.png'],
  sinnoh: ['File:Sinnoh Town Map DPPt.png', 'File:Sinnoh BDSP artwork.png'],
  unova: ['File:Unova Town Map BW.png', 'File:Unova Map.png', 'File:Unova B2W2 alt.png'],
  kalos: ['File:Kalos Town Map.png', 'File:Kalos alt.png'],
  alola: ['File:Alola Town Map.png', 'File:Alola USUM artwork.png'],
  galar: ['File:Galar Town Map.png', 'File:Galar artwork.png'],
  paldea: ['File:Paldea Map.png', 'File:Paldea artwork.png'],
}

async function imageUrls(titles) {
  const url =
    `${API}?action=query&titles=${encodeURIComponent(titles.join('|'))}` +
    '&prop=imageinfo&iiprop=url&format=json'
  const response = await fetch(url, { headers: { 'User-Agent': UA } })
  const json = await response.json()
  const out = {}
  for (const page of Object.values(json.query.pages)) {
    const url = page.imageinfo?.[0]?.url
    if (url) out[page.title] = url
  }
  return out
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  for (const [region, titles] of Object.entries(CANDIDATES)) {
    const urls = await imageUrls(titles)
    const title = titles.find((t) => urls[t])
    if (!title) {
      console.warn(`${region}: no reference found`)
      continue
    }
    const response = await fetch(urls[title], { headers: { 'User-Agent': UA } })
    const buffer = Buffer.from(await response.arrayBuffer())
    const dest = path.join(OUT, `${region}.png`)
    fs.writeFileSync(dest, buffer)
    console.log(`${region.padEnd(7)} ${title} (${(buffer.length / 1024).toFixed(0)} KB)`)
  }
})().catch((error) => {
  console.error('ERR', error.stack || error.message)
  process.exit(1)
})
