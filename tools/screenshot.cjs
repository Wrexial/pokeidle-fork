// Dev-only headless-Chrome screenshot harness. Drives the running Vite server
// over the DevTools Protocol (no extra npm deps: Node's built-in fetch +
// WebSocket). Usage:
//   npm run dev            # in another terminal
//   node tools/screenshot.cjs
//
// Writes PNGs to screenshots/ (gitignored).

const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const CHROME =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9222
const APP_URL = process.env.APP_URL || 'http://localhost:5173/'
const OUT = path.join(__dirname, '..', 'screenshots')

/** @param {number} ms */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** @returns {Promise<any[]>} */
async function getTargets() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json`)
  return res.json()
}

class Cdp {
  constructor(ws) {
    this.ws = ws
    this.nextId = 0
    this.pending = new Map()
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(JSON.stringify(message.error)))
        else resolve(message.result)
      }
    })
  }

  /**
   * @param {string} method
   * @param {Record<string, any>} [params]
   */
  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  /** @param {string} expression */
  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (result.exceptionDetails)
      throw new Error(
        `${result.exceptionDetails.text} ${result.exceptionDetails.exception?.description ?? ''}`
      )
    return result.result.value
  }

  /** @param {number} timeout @param {string} expression */
  async waitFor(expression, timeout = 15000, label = expression) {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      try {
        if (await this.eval(expression)) return
      } catch {
        /* keep waiting */
      }
      await sleep(150)
    }
    throw new Error(`timed out waiting for ${label}`)
  }

  /** @param {string} file */
  async screenshot(file) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(file, Buffer.from(data, 'base64'))
    console.log(`saved ${path.relative(process.cwd(), file)}`)
  }

  /** @param {string} selector */
  async click(selector) {
    const clicked = await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (!el) return false
      el.click()
      return true
    })()`)
    if (!clicked) throw new Error(`no element for ${selector}`)
    await sleep(250)
  }
}

async function connect() {
  const targets = await getTargets()
  const page = targets.find((target) => target.type === 'page')
  if (!page) throw new Error('no page target')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve)
    ws.addEventListener('error', reject)
  })
  const cdp = new Cdp(ws)
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  return cdp
}

/** A minimal Alola save standing at Poké Pelago. */
function alolaSave() {
  const pokemon = {
    id: '1',
    speciesKey: 'rowlet',
    name: 'Rowlet',
    types: ['Grass', 'Flying'],
    level: 25,
    totalExp: 0,
    moves: ['tackle', 'leafage'],
    currentHp: 70,
    maxHp: 70,
    attack: 35,
    defense: 32,
    spAttack: 32,
    spDefense: 32,
    speed: 33,
    ivs: { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
    nature: 'adamant',
    friendship: 70,
    ability: 'overgrow',
    heldItem: null,
    isShiny: false,
  }
  return {
    version: 2,
    savedAt: Date.now(),
    startRegion: 'alola',
    playerPokemon: pokemon,
    party: [pokemon],
    box: [],
    nextPokemonId: 2,
    currentLocation: 'alola-poke-pelago',
    currentRoute: 'alola-route-1',
    unlockedLocations: ['alola-iki-town', 'alola-poke-pelago', 'alola-route-1', 'alola-hauoli-city'],
    unlockedRegions: ['alola'],
    inventory: { pokeball: 20, oranBerry: 5, sitrusBerry: 3, lumBerry: 2, superPotion: 3, greatball: 5 },
    money: 50000,
    pokedexSeen: ['rowlet', 'pikipek'],
    pokedexCaught: ['rowlet'],
    battleLog: ['Screenshot run'],
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-chrome-'))
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--window-size=1280,1100',
      'about:blank',
    ],
    { stdio: 'ignore' }
  )
  try {
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        await getTargets()
        break
      } catch {
        await sleep(200)
      }
    }
    const cdp = await connect()
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('typeof window.gameDataDebug === "object"', 20000, 'game data')
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'data loaded')
    // Seed the Alola save and reload into the game.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(alolaSave())
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'reload data')
    // Dismiss the first-run patch notes so they don't cover the capture.
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) { b.click(); return true } return false })()`
    )
    await sleep(800)
    console.log(
      'layout metrics:',
      await cdp.eval('({ w: window.innerWidth, h: window.innerHeight })')
    )
    await cdp.screenshot(path.join(OUT, '01-main.png'))

    // Poké Pelago modal (opened from the location panel card).
    await cdp.click('.location-minigame-start')
    await sleep(400)
    await cdp.screenshot(path.join(OUT, '02-pelago-companion.png'))
    await cdp.eval(
      `(() => { const t = [...document.querySelectorAll('.pelago-tab')].find((el) => /Islands/.test(el.textContent)); t && t.click(); return !!t })()`
    )
    await sleep(300)
    await cdp.screenshot(path.join(OUT, '03-pelago-islands.png'))
    await cdp.eval(
      `(() => { const t = [...document.querySelectorAll('.pelago-tab')].find((el) => /Berry/.test(el.textContent)); t && t.click(); return !!t })()`
    )
    await sleep(300)
    await cdp.screenshot(path.join(OUT, '04-pelago-garden.png'))
    // Close Pelago.
    await cdp.click('.battle-info-close')

    // Settings modal (last top-bar button).
    await cdp.eval(
      `(() => { const b = [...document.querySelectorAll('.battle-info-btn')].at(-1); b.click(); return true })()`
    )
    await sleep(400)
    console.log(
      'settings modal box:',
      JSON.stringify(
        await cdp.eval(`(() => {
          const m = document.querySelector('.battle-info-modal')
          const r = m.getBoundingClientRect()
          return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), scrollHeight: m.scrollHeight, clientHeight: m.clientHeight, maxHeight: getComputedStyle(m).maxHeight, overflowY: getComputedStyle(m).overflowY, innerHeight: window.innerHeight }
        })()`)
      )
    )
    await cdp.screenshot(path.join(OUT, '05-settings.png'))
    {
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 690, width: 1262, height: 114, scale: 1 },
      })
      fs.writeFileSync(path.join(OUT, '06-settings-bottom.png'), Buffer.from(data, 'base64'))
      console.log('saved screenshots\\06-settings-bottom.png')
    }
    await cdp.eval(
      `(() => { document.querySelectorAll('.battle-info-close').forEach((b) => b.click()); return true })()`
    )
    await sleep(400)
    console.log(
      'battle rects:',
      JSON.stringify(
        await cdp.eval(`(() => {
          const rect = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), bottom: Math.round(r.bottom), right: Math.round(r.right) } }
          return { bottomPanel: rect('.bottom-panel'), movePanel: rect('.bottom-right-panel'), moveGrid: rect('.move-grid'), moveBtn: rect('.move-swap-btn'), textBox: rect('.battle-text-box') }
        })()`)
      )
    )
    {
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 351, y: 260, width: 560, height: 220, scale: 1 },
      })
      fs.writeFileSync(path.join(OUT, '07-battle-bottom.png'), Buffer.from(data, 'base64'))
      console.log('saved screenshots\\07-battle-bottom.png')
    }
    console.log('done')
  } finally {
    chrome.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
