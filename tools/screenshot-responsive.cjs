// Dev-only responsive audit harness. Drives the running Vite server and
// captures the main game layout at a matrix of viewport sizes, logging
// overflow/layout metrics alongside each screenshot. Usage:
//   npm run dev            # in another terminal
//   node tools/screenshot-responsive.cjs [outDir]

const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const CHROME =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9223
const APP_URL = process.env.APP_URL || 'http://localhost:5173/'
const OUT = path.join(__dirname, '..', 'screenshots', process.argv[2] || 'responsive')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
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
  async screenshot(file) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(file, Buffer.from(data, 'base64'))
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

function kantoSave() {
  const pokemon = {
    id: '1',
    speciesKey: 'charmander',
    name: 'Charmander',
    types: ['Fire'],
    level: 30,
    totalExp: 0,
    moves: ['tackle', 'ember'],
    currentHp: 80,
    maxHp: 80,
    attack: 45,
    defense: 40,
    spAttack: 42,
    spDefense: 40,
    speed: 48,
    ivs: { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
    nature: 'adamant',
    friendship: 70,
    ability: 'blaze',
    heldItem: null,
    isShiny: false,
  }
  return {
    version: 2,
    savedAt: Date.now(),
    startRegion: 'kanto',
    playerPokemon: pokemon,
    party: [pokemon],
    box: [],
    nextPokemonId: 2,
    currentLocation: 'route21',
    currentRoute: 'route21',
    unlockedLocations: ['palletTown', 'route1', 'route21'],
    unlockedRegions: ['kanto'],
    inventory: { pokeball: 30, greatball: 10, ultraball: 5 },
    money: 50000,
    pokedexSeen: ['charmander'],
    pokedexCaught: ['charmander'],
    battleLog: ['Responsive audit'],
  }
}

// [label, width, height]
const SIZES = [
  ['1920x1080', 1920, 1080],
  ['2560x1080-ultrawide', 2560, 1080],
  ['3440x1440-ultrawide', 3440, 1440],
  ['1366x768', 1366, 768],
  ['1280x800', 1280, 800],
  ['1024x768-4x3', 1024, 768],
  ['1280x1024-5x4', 1280, 1024],
  ['2560x1440', 2560, 1440],
  ['1080x1920-portrait', 1080, 1920],
  ['800x1280-tablet', 800, 1280],
  ['768x1024-tablet', 768, 1024],
  ['390x844-phone', 390, 844],
  ['360x640-phone', 360, 640],
  ['844x390-landscape', 844, 390],
  ['667x375-landscape', 667, 375],
  ['1024x600-nettop', 1024, 600],
  ['1600x900', 1600, 900],
]

const METRICS = `(() => {
  const rect = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom), right: Math.round(r.right) }
  }
  const de = document.documentElement
  const overflowing = [...document.querySelectorAll('*')].filter((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && (r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1 || r.left < -1 || r.top < -1)
  }).slice(0, 12).map((el) => (el.className && typeof el.className === 'string' ? el.className : el.tagName) + ' [' + Math.round(el.getBoundingClientRect().left) + ',' + Math.round(el.getBoundingClientRect().top) + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height) + ']')
  return {
    vw: window.innerWidth,
    vh: window.innerHeight,
    scrollW: de.scrollWidth,
    scrollH: de.scrollHeight,
    bodyOverflow: getComputedStyle(document.body).overflow,
    layout: rect('.game-layout'),
    gameWindow: rect('.game-window'),
    leftPanel: rect('.left-panel'),
    centerColumn: rect('.center-column'),
    rightPanel: rect('.right-panel'),
    battleScene: rect('.battle-scene'),
    battleScreen: rect('.battle-screen'),
    townMap: rect('.town-map'),
    bottomPanel: rect('.bottom-panel'),
    mobile: !!document.querySelector('.game-layout.mobile'),
    overflowing,
  }
})()`

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-chrome-r-'))
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
      '--window-size=1600,900',
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
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(kantoSave())
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'reload data')
    await cdp
      .waitFor('!!document.querySelector(".patch-notes-dismiss-btn")', 6000, 'patch notes')
      .catch(() => {})
    await cdp.eval(
      `(() => { document.querySelectorAll('.patch-notes-dismiss-btn').forEach((b) => b.click()); return true })()`
    )
    await sleep(500)

    for (const [label, width, height] of SIZES.filter(
      (entry) => !process.env.ONLY || process.env.ONLY.split(',').includes(entry[0])
    )) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      })
      await sleep(350)
      const metrics = await cdp.eval(METRICS)
      console.log(
        `\n=== ${label} (${width}x${height}) ===\n` + JSON.stringify(metrics, null, 1)
      )
      await cdp.screenshot(path.join(OUT, `${label}.png`))
      if (process.env.OPEN_SETTINGS) {
        await cdp.eval(
          `(() => { const btns = [...document.querySelectorAll('.battle-info-btn')]; const b = btns[btns.length - 1]; if (b) b.click(); return !!b })()`
        )
        await sleep(350)
        await cdp.screenshot(path.join(OUT, `${label}-settings.png`))
        await cdp.eval(
          `(() => { document.querySelectorAll('.battle-info-close').forEach((b) => b.click()); return true })()`
        )
        await sleep(200)
      }
      if (process.env.CLICK_TABS && metrics.mobile) {
        const tabCount = await cdp.eval(
          `document.querySelectorAll('.mobile-tab-bar .tab-btn').length`
        )
        for (let tabIndex = 0; tabIndex < tabCount; tabIndex++) {
          const name = await cdp.eval(`(() => {
            const b = document.querySelectorAll('.mobile-tab-bar .tab-btn')[${tabIndex}]
            if (!b) return null
            b.click()
            return b.textContent.trim()
          })()`)
          if (!name) continue
          await sleep(300)
          await cdp.screenshot(path.join(OUT, `${label}-tab-${tabIndex}-${name}.png`))
        }
      }
    }
    console.log(`\nwrote screenshots to ${path.relative(process.cwd(), OUT)}`)
  } finally {
    chrome.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
