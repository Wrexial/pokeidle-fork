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

  /** Dismiss a minigame's "how to play" tutorial if it is covering the scene. */
  async dismissTutorial() {
    const dismissed = await this.eval(`(() => {
      const b = document.querySelector('.minigame-tutorial-close')
      if (!b) return false
      b.click()
      return true
    })()`)
    if (dismissed) await sleep(300)
    return dismissed
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
    box: [
      {
        ...pokemon,
        id: '2',
        name: 'Rowlet',
        level: 24,
        totalExp: 11000,
        currentHp: 70,
        maxHp: 70,
      },
    ],
    nextPokemonId: 3,
    pelago: {
      beans: { assigned: [], progress: 0, ready: 0 },
      training: { assigned: ['2'], progress: 12, ready: 2 },
      caves: { assigned: [], progress: 0, ready: 0 },
    },
    currentLocation: 'alola-poke-pelago',
    currentRoute: 'alola-route-1',
    unlockedLocations: ['alola-iki-town', 'alola-poke-pelago', 'alola-route-1', 'alola-hauoli-city', 'alola-melemele-island'],
    unlockedRegions: ['alola'],
    inventory: { pokeball: 20, oranBerry: 5, sitrusBerry: 3, lumBerry: 2, superPotion: 3, greatball: 5 },
    money: 50000,
    pokedexSeen: ['rowlet', 'pikipek'],
    pokedexCaught: ['rowlet'],
    battleLog: ['Screenshot run'],
  }
}

/** A minimal Kanto save standing on a fishing route. */
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
    battleLog: ['Screenshot run'],
  }
}

/**
 * A Kanto save whose party holds a Gigantamax-able Charizard, with or without
 * the Max Mushroom factor. Used to check the stats-panel G-MAX indicator.
 * @param {boolean} withFactor
 */
function gmaxStatsSave(withFactor, withMegaStone = false) {
  const charizard = {
    id: '1',
    speciesKey: 'charizard',
    name: 'Charizard',
    types: ['Fire', 'Flying'],
    level: 50,
    totalExp: 0,
    moves: ['flamethrower', 'dragonClaw'],
    currentHp: 170,
    maxHp: 170,
    attack: 100,
    defense: 90,
    spAttack: 120,
    spDefense: 95,
    speed: 115,
    ivs: { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
    nature: 'modest',
    friendship: 70,
    ability: 'blaze',
    heldItem: withMegaStone ? 'megaStone' : null,
    isShiny: false,
    gmax: withFactor,
  }
  return {
    version: 2,
    savedAt: Date.now(),
    startRegion: 'kanto',
    playerPokemon: charizard,
    party: [charizard],
    box: [],
    nextPokemonId: 2,
    currentLocation: 'route21',
    currentRoute: 'route21',
    unlockedLocations: ['palletTown', 'route1', 'route21'],
    unlockedRegions: ['kanto'],
    inventory: {},
    money: 50000,
    pokedexSeen: ['charizard'],
    pokedexCaught: ['charizard'],
    battleLog: ['Screenshot run'],
  }
}

/** A minimal save stood at a fixed minigame location, for scene smoke tests. */
function minigameSave(region, location, route, unlocked) {
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
    startRegion: region,
    playerPokemon: pokemon,
    party: [pokemon],
    box: [],
    nextPokemonId: 2,
    currentLocation: location,
    currentRoute: route,
    unlockedLocations: unlocked,
    unlockedRegions: [region],
    inventory: { pokeball: 30, greatball: 10, ultraball: 5 },
    money: 50000,
    pokedexSeen: ['charmander'],
    pokedexCaught: ['charmander'],
    battleLog: ['Screenshot run'],
  }
}

/** A Kanto save with a Mega Stone holder, to watch Mega Evolution fire. */
function megaSave() {
  const pokemon = {
    id: '1',
    speciesKey: 'charizard',
    name: 'Charizard',
    types: ['Fire', 'Flying'],
    level: 50,
    totalExp: 0,
    moves: ['flamethrower', 'dragonClaw'],
    currentHp: 200,
    maxHp: 200,
    attack: 120,
    defense: 100,
    spAttack: 140,
    spDefense: 110,
    speed: 130,
    ivs: { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
    nature: 'modest',
    friendship: 70,
    ability: 'blaze',
    heldItem: 'megaStone',
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
    inventory: {},
    money: 50000,
    pokedexSeen: ['charizard'],
    pokedexCaught: ['charizard'],
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
    // Dismiss the first-run patch notes so they don't cover the capture. It
    // mounts a beat after boot, so give it a moment before looking.
    await cdp
      .waitFor('!!document.querySelector(".patch-notes-dismiss-btn")', 6000, 'patch notes')
      .catch(() => {})
    await cdp.eval(
      `(() => { document.querySelectorAll('.patch-notes-dismiss-btn').forEach((b) => b.click()); return true })()`
    )
    await sleep(600)
    console.log(
      'layout metrics:',
      await cdp.eval('({ w: window.innerWidth, h: window.innerHeight })')
    )
    await cdp.screenshot(path.join(OUT, '01-main.png'))

    // #60: clicking an area (zone hub) opens its zoomed-in map.
    const expanded = await cdp.eval(
      `(() => { const b = document.querySelector('.map-node.zone.clickable') || document.querySelector('.map-node.zone'); if (!b) return false; b.click(); return true })()`
    )
    if (expanded) {
      await sleep(500)
      await cdp.screenshot(path.join(OUT, '01b-area-map.png'))
      console.log('Area map view ok')
    } else {
      console.log('WARNING: no zone expand button captured')
    }

    // Poké Pelago modal (opened from the location panel card).
    await cdp.click('.location-minigame-start')
    await sleep(400)
    // A minigame's first-run "how to play" tutorial covers the scene. Capture
    // it once, then dismiss it so the Pelago captures below are not blocked.
    if (await cdp.eval(`!!document.querySelector('.minigame-tutorial-close')`))
      await cdp.screenshot(path.join(OUT, '02a-minigame-tutorial.png'))
    await cdp.dismissTutorial()
    await cdp.screenshot(path.join(OUT, '02-pelago-companion.png'))
    await cdp.eval(
      `(() => { const t = [...document.querySelectorAll('.pelago-tab')].find((el) => /Islands/.test(el.textContent)); t && t.click(); return !!t })()`
    )
    await sleep(300)
    await cdp.screenshot(path.join(OUT, '03-pelago-islands.png'))
    await cdp.eval(
      `(() => { const cards = [...document.querySelectorAll('.pelago-island')]; const training = cards.find((c) => /Training Isle/.test(c.textContent)); const b = training && training.querySelector('.pelago-collect-btn'); if (b && !b.disabled) { b.click(); return true } return false })()`
    )
    await sleep(400)
    await cdp.screenshot(path.join(OUT, '03b-pelago-collect.png'))
    await cdp.eval(
      `(() => { const b = document.querySelector('.pelago-collect .move-panel-btn.confirm'); if (b) b.click(); return true })()`
    )
    await sleep(200)
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

    // Route-activity encounter: verify the manual catch option appears.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(kantoSave())
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'kanto data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await sleep(600)
    await cdp.click('.location-minigame-start')
    await sleep(400)
    // The first start opens the "how to play" tutorial; dismiss it.
    await cdp.eval(
      `(() => { const b = document.querySelector('.minigame-tutorial-close'); if (b) b.click(); return true })()`
    )
    let gotEncounter = false
    for (let attempt = 0; attempt < 8 && !gotEncounter; attempt++) {
      await cdp.click('.move-panel-btn.confirm')
      await sleep(200)
      gotEncounter = await cdp.eval('!!document.querySelector(".activity-encounter")')
    }
    if (gotEncounter) {
      await cdp.screenshot(path.join(OUT, '08-activity-encounter.png'))
      await cdp.click('.move-panel-btn.confirm') // BATTLE
      await sleep(700)
      const catchBtn = await cdp.eval(
        `(() => { const b = document.querySelector('.activity-catch-btn'); if (!b) return null; const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), top: Math.round(r.top), right: Math.round(r.right) } })()`
      )
      console.log('activity catch button:', JSON.stringify(catchBtn))
      await cdp.screenshot(path.join(OUT, '09-activity-battle.png'))
    } else {
      console.log('WARNING: no activity encounter captured')
    }

    // Headbutt: three trees and the hold-to-charge sweet-spot bar.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(
          minigameSave('kanto', 'viridianForest', 'viridianForest', [
            'palletTown',
            'route1',
            'viridianForest',
          ])
        )
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'headbutt data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await sleep(600)
    const startedHeadbutt = await cdp.eval(
      `(() => {
        const card = [...document.querySelectorAll('.location-minigame-card')].find((el) => /Headbutt/.test(el.textContent))
        if (!card) return false
        card.querySelector('.location-minigame-start').click()
        return true
      })()`
    )
    if (startedHeadbutt) {
      await sleep(300)
      await cdp.eval(
        `(() => { const b = document.querySelector('.minigame-tutorial-close'); if (b) b.click(); return true })()`
      )
      await cdp.waitFor(`!!document.querySelector('.activity-trees')`, 5000, 'headbutt scene')
      await cdp.screenshot(path.join(OUT, '25-headbutt.png'))
      console.log('Headbutt scene ok')
    } else {
      console.log('WARNING: no Headbutt activity card found')
    }

    // The other route activities: Bug Catching, Rock Smash, Rock Climbing,
    // Prospecting, Campfire, Overcharge, S\u00e9ance and Summit Roost, each with
    // its own interaction.
    const regionEntries = { kanto: 'palletTown', johto: 'johto-new-bark-town' }

    // A route activity's "how to play" tutorial opens on first start. Capture
    // the Campfire's (which also shows its night-favoured condition tag).
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(minigameSave('kanto', 'pokemonMansion', 'pokemonMansion', ['palletTown', 'pokemonMansion']))
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'tutorial data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await sleep(500)
    const startedTutorial = await cdp.eval(
      `(() => {
        const card = [...document.querySelectorAll('.location-minigame-card')].find((el) => /Campfire/.test(el.textContent))
        if (!card) return false
        card.querySelector('.location-minigame-start').click()
        return true
      })()`
    )
    if (startedTutorial) {
      await cdp.waitFor(`!!document.querySelector('.minigame-tutorial')`, 5000, 'activity tutorial')
      await cdp.screenshot(path.join(OUT, '26a-activity-tutorial.png'))
      await cdp.eval(
        `(() => { const b = document.querySelector('.minigame-tutorial-close'); if (b) b.click(); return true })()`
      )
      console.log('Activity tutorial ok')
    } else {
      console.log('WARNING: no Campfire card for the tutorial')
    }
    const routeScenes = [
      ['Bug Catching', 'kanto', 'viridianForest', 'viridianForest', '26-bugCatch.png', '.activity-bugfield'],
      ['Rock Smash', 'kanto', 'mtMoon', 'mtMoon', '26b-rockSmash.png', '.activity-boulder'],
      ['Rock Climbing', 'kanto', 'mtMoon', 'mtMoon', '27-climb.png', '.activity-wall'],
      ['Prospecting', 'kanto', 'mtMoon', 'mtMoon', '28-prospecting.png', '.activity-dig'],
      ['Campfire', 'kanto', 'pokemonMansion', 'pokemonMansion', '28b-kindle.png', '.activity-stoke'],
      ['Overcharge', 'kanto', 'rockTunnel', 'rockTunnel', '28c-overcharge.png', '.activity-coil'],
      ['S\u00e9ance', 'kanto', 'ceruleanCave', 'ceruleanCave', '28d-seance.png', '.activity-rune-grid'],
      ["Summit Roost", 'johto', 'johto-dragons-den', 'johto-dragons-den', '28e-summit.png', '.activity-sky'],
      ["Champions' Gauntlet", 'kanto', 'indigoPlat', 'indigoPlat', '29-gauntlet.png', '.gauntlet-bracket'],
    ]
    for (const [title, region, location, route, file, selector] of routeScenes) {
      await cdp.eval(
        `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
          JSON.stringify(
            minigameSave(region, location, route, [regionEntries[region], location])
          )
        )}); 'ok'`
      )
      await cdp.send('Page.navigate', { url: APP_URL })
      await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, `${title} data`)
      await cdp.eval(
        `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
      )
      await sleep(500)
      const started = await cdp.eval(
        `(() => {
          const card = [...document.querySelectorAll('.location-minigame-card')].find((el) => new RegExp(${JSON.stringify(title)}).test(el.textContent))
          if (!card) return false
          card.querySelector('.location-minigame-start').click()
          return true
        })()`
      )
      if (started) {
        // The first start opens the "how to play" tutorial; dismiss it.
        await sleep(300)
        await cdp.eval(
          `(() => { const b = document.querySelector('.minigame-tutorial-close'); if (b) b.click(); return true })()`
        )
        await cdp.waitFor(`!!document.querySelector('${selector}')`, 5000, file)
        await cdp.screenshot(path.join(OUT, file))
        console.log(`${title} scene ok`)
      } else {
        console.log(`WARNING: no ${title} activity card found`)
      }
    }

    // Field Jobs: assign a Pokemon to a route activity from its card.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(
          minigameSave('kanto', 'viridianForest', 'viridianForest', ['palletTown', 'viridianForest'])
        )
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'jobs data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await sleep(600)
    const assignedJob = await cdp.eval(
      `(() => { const b = document.querySelector('.job-btn.assign'); if (!b) return false; b.click(); return true })()`
    )
    if (assignedJob) {
      await sleep(500)
      const jobInfo = await cdp.eval(
        `(() => { const el = document.querySelector('.job-controls.active'); if (el) el.scrollIntoView({ block: 'center' }); const w = document.querySelector('.job-controls.active .job-worker'); return w ? w.textContent.trim() : null })()`
      )
      console.log('job worker:', JSON.stringify(jobInfo))
      await sleep(300)
      await cdp.screenshot(path.join(OUT, '30-jobs.png'))
      // Open the Field Jobs summary modal from the location panel button.
      const openedJobs = await cdp.eval(
        `(() => { const b = document.querySelector('.location-jobs-btn'); if (!b) return false; b.click(); return true })()`
      )
      if (openedJobs) {
        await cdp.waitFor(`!!document.querySelector('.field-jobs-modal')`, 5000, 'field jobs modal')
        await sleep(200)
        await cdp.screenshot(path.join(OUT, '30b-jobs-modal.png'))
        console.log('Field jobs modal ok')
      }
      console.log('Field jobs ok')
    } else {
      console.log('WARNING: no assign-a-job button found')
    }

    // Field research: the Pokedex detail panel's research block + shop.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify({
          ...minigameSave('kanto', 'palletTown', 'route1', ['palletTown']),
          pokedexCaught: ['bulbasaur'],
          pokedexSeen: ['bulbasaur'],
          researchDefeated: { bulbasaur: 4 },
          researchClaimed: { bulbasaur: 3 },
          researchPoints: 5,
        })
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'research data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await sleep(600)
    const openedDex = await cdp.eval(
      `(() => { const b = [...document.querySelectorAll('.backpack-tab-bar .tab-btn')].find((el) => /dex/i.test(el.textContent)); if (!b) return false; b.click(); return true })()`
    )
    if (openedDex) {
      await cdp.waitFor(`!!document.querySelector('.pokedex-tile')`, 5000, 'pokedex tiles')
      await cdp.eval(`(() => { document.querySelector('.pokedex-tile').click(); return true })()`)
      await cdp.waitFor(`!!document.querySelector('.research-panel')`, 5000, 'research panel')
      await sleep(200)
      await cdp.screenshot(path.join(OUT, '31-research.png'))
      const openedShop = await cdp.eval(
        `(() => { const b = [...document.querySelectorAll('.research-head .job-btn')].find((el) => /SHOP/.test(el.textContent)); if (!b) return false; b.click(); return true })()`
      )
      if (openedShop) {
        await cdp.waitFor(`!!document.querySelector('.research-shop-modal')`, 5000, 'research shop')
        await cdp.screenshot(path.join(OUT, '31b-research-shop.png'))
      }
      console.log('Field research ok')
    } else {
      console.log('WARNING: no Dex tab for research')
    }

    // Click FIGHT in the Gauntlet to exercise the run loop (the fresh save's
    // Charmander will lose, which still shows the result + reward screens).
    if (await cdp.eval(`!!document.querySelector('.gauntlet-bracket')`)) {
      await cdp.eval(
        `(() => { const b = document.querySelector('.move-panel-btn.confirm'); if (b) b.click(); return true })()`
      )
      await sleep(600)
      await cdp.screenshot(path.join(OUT, '29b-gauntlet-result.png'))
      console.log('Gauntlet fight ok')
    }

    // Stats-panel form chips: G-MAX lights up with the mushroom factor, MEGA
    // with the held Mega Stone, both greyed without their item.
    for (const [withFactor, withMegaStone, fileName] of [
      [false, false, '33-gmax-locked.png'],
      [true, false, '34-gmax-active.png'],
      [false, true, '35-mega-active.png'],
    ]) {
      await cdp.eval(
        `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
          JSON.stringify(gmaxStatsSave(withFactor, withMegaStone))
        )}); 'ok'`
      )
      await cdp.send('Page.navigate', { url: APP_URL })
      await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'gmax data')
      await cdp.eval(
        `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
      )
      await sleep(500)
      const opened = await cdp.eval(
        `(() => { const slot = document.querySelector('.party-slot'); if (!slot) return false; slot.click(); return true })()`
      )
      if (opened) {
        await cdp.waitFor(`!!document.querySelector('.stats-panel')`, 5000, fileName)
        await cdp.screenshot(path.join(OUT, fileName))
        const indicator = await cdp.eval(
          `(() => {
            const g = document.querySelector('.stats-panel-gmax'), m = document.querySelector('.stats-panel-mega')
            return {
              gmax: g ? { text: g.textContent.trim(), locked: g.classList.contains('locked') } : null,
              mega: m ? { text: m.textContent.trim(), locked: m.classList.contains('locked') } : null,
            }
          })()`
        )
        console.log(`form chips (factor=${withFactor}, stone=${withMegaStone}):`, JSON.stringify(indicator))
      } else {
        console.log('WARNING: no party slot to open for the form chips')
      }
    }

    // Fixed minigames: Voltorb Flip (Unova) and the Auction House (Kalos).
    const fixedScenes = [
      [
        'Voltorb Flip',
        'unova',
        'unova-nimbasa-city',
        'unova-route-4',
        ['unova-nuvema-town', 'unova-route-4', 'unova-nimbasa-city'],
        '.voltorb-board',
        '10-voltorb-flip.png',
      ],
      [
        'Auction House',
        'kalos',
        'kalos-lumiose-city',
        'kalos-route-4',
        ['kalos-vaniville-town', 'kalos-route-4', 'kalos-lumiose-city'],
        '.auction-podium',
        '11-auction-house.png',
      ],
      [
        'Contest',
        'hoenn',
        'hoenn-lilycove-city',
        'hoenn-route-121',
        ['hoenn-littleroot-town', 'hoenn-route-121', 'hoenn-lilycove-city'],
        '.contest-moves',
        '12-contest.png',
      ],
      [
        'Pokeathlon',
        'johto',
        'johto-ecruteak-city',
        'johto-route-42',
        ['johto-new-bark-town', 'johto-route-42', 'johto-ecruteak-city'],
        '.athlon-event',
        '13-pokeathlon.png',
      ],
      [
        'Poke Radar',
        'sinnoh',
        'sinnoh-sandgem-town',
        'sinnoh-route-202',
        ['sinnoh-twinleaf-town', 'sinnoh-route-202', 'sinnoh-sandgem-town'],
        '.radar-grid',
        '14-poke-radar.png',
      ],
      [
        'Battle Royal',
        'alola',
        'alola-heahea-city',
        'alola-route-1',
        ['alola-iki-town', 'alola-route-1', 'alola-heahea-city'],
        '.royal-arena',
        '15-battle-royal.png',
        '.move-panel-btn.confirm',
      ],
      [
        'Dynamax Adventures',
        'galar',
        'galar-hammerlocke',
        'galar-route-1',
        ['galar-postwick', 'galar-route-1', 'galar-hammerlocke'],
        '.dynamax-paths',
        '16-dynamax.png',
        '.dynamax-path',
      ],
      [
        'Lights Out',
        'hoenn',
        'hoenn-mauville-city',
        'hoenn-route-110',
        ['hoenn-littleroot-town', 'hoenn-route-110', 'hoenn-mauville-city'],
        '.lights-grid',
        '19-lights-out.png',
      ],
      [
        'Curry Cooking',
        'galar',
        'galar-motostoke',
        'galar-route-3',
        ['galar-postwick', 'galar-route-3', 'galar-motostoke'],
        '.curry-ingredients',
        '20-curry.png',
        '.curry-ingredient',
      ],
      [
        'Pokestar Studios',
        'unova',
        'unova-virbank-city',
        'unova-route-4',
        ['unova-nuvema-town', 'unova-route-4', 'unova-virbank-city'],
        '.pokestar-takes',
        '21-pokestar.png',
      ],
      [
        'Puzzle League',
        'johto',
        'johto-goldenrod-city',
        'johto-route-34',
        ['johto-new-bark-town', 'johto-route-34', 'johto-goldenrod-city'],
        '.match3-grid',
        '22-puzzle-league.png',
      ],
      [
        'Memory',
        'hoenn',
        'hoenn-slateport-city',
        'hoenn-route-110',
        ['hoenn-littleroot-town', 'hoenn-route-110', 'hoenn-slateport-city'],
        '.memory-grid',
        '23-memory.png',
      ],
      [
        'Type Fusion',
        'unova',
        'unova-nacrene-city',
        'unova-route-3',
        ['unova-nuvema-town', 'unova-route-3', 'unova-nacrene-city'],
        '.fusion-grid',
        '33-type-fusion.png',
        '.fusion-pad .move-panel-btn',
      ],
      [
        'Whack',
        'kanto',
        'vermilionCity',
        'route6',
        ['palletTown', 'route1', 'vermilionCity', 'route6'],
        '.whack-grid',
        '24-whack.png',
      ],
      [
        'Musical',
        'unova',
        'unova-castelia-city',
        'unova-route-4',
        ['unova-nuvema-town', 'unova-route-4', 'unova-castelia-city'],
        '.musical-track',
        '26-musical.png',
      ],
      [
        'Picnic',
        'paldea',
        'paldea-cortondo',
        'paldea-south-province-area-one',
        ['paldea-los-platos', 'paldea-south-province-area-one', 'paldea-cortondo'],
        '.picnic-choose',
        '27-picnic.png',
      ],
      [
        'Poke Ball Factory',
        'kalos',
        'kalos-laverre-city',
        'kalos-route-14',
        ['kalos-vaniville-town', 'kalos-route-14', 'kalos-laverre-city'],
        '.factory-grid',
        '28-pokeball-factory.png',
      ],
      [
        'Ruins of Alph',
        'johto',
        'johto-violet-city',
        'johto-route-36',
        ['johto-new-bark-town', 'johto-route-36', 'johto-violet-city'],
        '.ruins-grid',
        '30-ruins-puzzle.png',
        '.ruins-tile.slidable',
      ],
      [
        'Snowpoint Temple',
        'sinnoh',
        'sinnoh-snowpoint-city',
        'sinnoh-route-217',
        ['sinnoh-twinleaf-town', 'sinnoh-route-217', 'sinnoh-snowpoint-city'],
        '.ice-grid',
        '31-ice-slide.png',
        '.ice-arrow-e',
      ],
      [
        'Safari Zone',
        'kanto',
        'safariZone',
        'safariZone',
        ['palletTown', 'route1', 'fuchsiaCity', 'safariZone'],
        '.safari-area-grid',
        '32-safari-areas.png',
        '.safari-area-card-east',
      ],
      [
        'Ultra Warp',
        'alola',
        'alola-ultra-space',
        'alola-ultra-space',
        ['alola-iki-town', 'alola-route-1', 'alola-poni-island', 'alola-raid', 'alola-ultra-space'],
        '.ultra-warp-field',
        '34-ultra-warp.png',
      ],
    ]
    for (const [name, region, location, route, unlocked, selector, file, action] of fixedScenes) {
      await cdp.eval(
        `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
          JSON.stringify(minigameSave(region, location, route, unlocked))
        )}); 'ok'`
      )
      await cdp.send('Page.navigate', { url: APP_URL })
      await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, `${name} data`)
      await cdp.eval(
        `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
      )
      await sleep(600)
      await cdp.click('.location-minigame-start')
      await cdp.dismissTutorial()
      await cdp.waitFor(`!!document.querySelector(${JSON.stringify(selector)})`, 5000, name)
      await cdp.screenshot(path.join(OUT, file))
      if (action) {
        await cdp.click(action)
        await sleep(500)
        await cdp.screenshot(path.join(OUT, file.replace('.png', '-act.png')))
      }
      console.log(`${name} scene ok`)
    }

    // Picnic: pick three fillings, build, drop near the centre and capture the
    // spawned Pokemon preview.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(
          minigameSave('paldea', 'paldea-cortondo', 'paldea-south-province-area-one', [
            'paldea-los-platos',
            'paldea-south-province-area-one',
            'paldea-cortondo',
          ])
        )
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'picnic flow data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await sleep(600)
    await cdp.click('.location-minigame-start')
    await cdp.dismissTutorial()
    await cdp.waitFor(`!!document.querySelector('.picnic-choose')`, 5000, 'picnic choose')
    await cdp.eval(
      `(() => { [...document.querySelectorAll('.picnic-ingredient')].slice(0, 3).forEach((b) => b.click()); return true })()`
    )
    await sleep(200)
    await cdp.click('.move-panel-btn.confirm')
    await cdp.waitFor(`!!document.querySelector('.picnic-board')`, 5000, 'picnic stack')
    for (let attempt = 0; attempt < 3; attempt++) {
      await cdp.waitFor(
        `(() => { const el = document.querySelector('.picnic-piece'); if (!el) return false; const left = parseFloat(el.style.left); return left > 35 && left < 65 })()`,
        4000,
        'picnic centre'
      )
      await cdp.click('.picnic-drop-btn')
      await sleep(120)
    }
    await cdp.waitFor(`!!document.querySelector('.picnic-spawn')`, 4000, 'picnic spawn')
    await cdp.screenshot(path.join(OUT, '27-picnic-spawn.png'))
    console.log('Picnic full flow ok')

    // Mega Evolution auto-triggers on the first battling turn.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(megaSave())
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'mega data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await cdp.waitFor(
      `(() => { const el = document.querySelector('.player-info-anchor .info-pokemon-name'); return !!el && /mega/i.test(el.textContent) })()`,
      15000,
      'mega evolution'
    )
    await cdp.screenshot(path.join(OUT, '17-mega-evolution.png'))
    console.log('Mega Evolution scene ok')

    // NPC gifts panel at Pallet Town.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(minigameSave('kanto', 'palletTown', 'route1', ['palletTown', 'route1']))
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'gift data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await cdp.waitFor(`!!document.querySelector('.location-gift-card')`, 8000, 'gift card')
    await cdp.screenshot(path.join(OUT, '18-gifts.png'))
    console.log('Gift panel scene ok')

    // A finished region (all Kanto locations open, Champion unbeaten) should
    // show the region goal instead of a locked region's unlocks.
    const kantoIds = Object.keys(
      JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'map-data', 'kanto.json'), 'utf8')
      )
    )
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(minigameSave('kanto', 'saffronCity', 'route6', kantoIds))
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'region goal data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await cdp.waitFor(`!!document.querySelector('.location-region-goal')`, 8000, 'region goal')
    await cdp.screenshot(path.join(OUT, '29-region-goal.png'))
    console.log('Region goal card ok')

    // Battle Frontier panel (#66): the three rule-variant facilities next to
    // Hoenn's Battle Tower.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(
          minigameSave('hoenn', 'hoenn-battle-frontier', 'hoenn-battle-frontier', [
            'hoenn-littleroot-town',
            'hoenn-route-101',
            'hoenn-route-111',
            'hoenn-battle-frontier',
          ])
        )
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'frontier data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await cdp.waitFor(`!!document.querySelector('.location-frontier')`, 8000, 'battle frontier')
    await cdp.screenshot(path.join(OUT, '35-battle-frontier.png'))
    console.log('Battle Frontier panel ok')

    // Focus hunt (#61): the bar in the location panel and the picker modal.
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify(
          minigameSave('kanto', 'route1', 'route1', ['palletTown', 'route1'])
        )
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'hunt data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await cdp.waitFor(`!!document.querySelector('.hunt-bar')`, 8000, 'hunt bar')
    await cdp.click('.hunt-bar')
    await cdp.waitFor(`!!document.querySelector('.hunt-modal')`, 5000, 'hunt modal')
    await cdp.screenshot(path.join(OUT, '36-focus-hunt.png'))
    console.log('Focus hunt panel ok')

    // Run Summary (#97): the milestone timeline modal, backfilled from an
    // older save's notable progress.
    const summaryBase = minigameSave('kanto', 'route1', 'route1', ['palletTown', 'route1']),
      summaryPokemon = {
        ...summaryBase.party[0],
        id: '100',
        speciesKey: 'pikachu',
        name: 'Pikachu',
        level: 100,
      }
    await cdp.eval(
      `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
        JSON.stringify({
          ...summaryBase,
          party: [summaryPokemon],
          playerPokemon: summaryPokemon,
          pokedexSeen: ['charmander', 'pikachu', 'mewtwo'],
          pokedexCaught: ['charmander', 'pikachu', 'mewtwo'],
          shinyCaught: ['pikachu'],
          defeatedGyms: ['brock', 'misty'],
        })
      )}); 'ok'`
    )
    await cdp.send('Page.navigate', { url: APP_URL })
    await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'summary data')
    await cdp.eval(
      `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
    )
    await cdp.waitFor(`!!document.querySelector('.run-summary-btn')`, 8000, 'summary button')
    await cdp.click('.run-summary-btn')
    await cdp.waitFor(`!!document.querySelector('.run-summary-modal')`, 5000, 'summary modal')
    await cdp.screenshot(path.join(OUT, '37-run-summary.png'))
    console.log('Run summary modal ok')

    // Region-map overviews: seed each region fully open and capture its map, so
    // road/layout problems are easy to eyeball.
    const regionDefs = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'regions.json'), 'utf8')
    )
    for (const region of regionDefs) {
      const map = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '..', 'public', 'data', 'map-data', `${region.id}.json`),
          'utf8'
        )
      )
      const ids = Object.keys(map),
        location = region.entry ?? ids[0],
        route = map[location]?.routeKey ?? 'route1'
      await cdp.eval(
        `localStorage.setItem('pokemon-idle-save-v2', ${JSON.stringify(
          JSON.stringify(minigameSave(region.id, location, route, ids))
        )}); 'ok'`
      )
      await cdp.send('Page.navigate', { url: APP_URL })
      await cdp.waitFor('window.gameDataDebug.status().loaded === true', 20000, 'region map data')
      await cdp.eval(
        `(() => { const b = document.querySelector('.patch-notes-dismiss-btn'); if (b) b.click(); return true })()`
      )
      await sleep(400)
      // Fit the whole region so the full road network is in frame.
      await cdp.eval(
        `(() => { const b = [...document.querySelectorAll('.map-zoom-btn')].find((el) => el.title === 'Fit whole region'); if (b) b.click(); return !!b })()`
      )
      await sleep(500)
      await cdp.screenshot(path.join(OUT, `region-${region.id}.png`))
      console.log(`region map ok: ${region.id}`)
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
