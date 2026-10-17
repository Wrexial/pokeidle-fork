// Browser-backed HTTP fetcher for scraper tools.
//
// Bulbapedia sits behind a Cloudflare "Just a moment..." managed challenge that
// rejects plain HTTP clients *and* headless Chrome (it fingerprints the
// headless build). A real, visible Chrome clears the challenge in well under a
// second; this module launches one, waits for the challenge to pass, then
// proxies the scraper's requests through the page's own fetch(). The
// cf_clearance cookie rides along in the request, and same-origin requests
// avoid CORS entirely.
//
// The browser profile is kept under tools/cache/browser-profile (gitignored) so
// the clearance cookie is reused across runs; only the first run in a while
// actually has to solve the challenge.
//
// Usage:
//   const { browserText, browserJson, closeBrowserFetcher } =
//     require('./lib/browser-fetch.cjs')
//   const raw = await browserText(
//     'https://bulbapedia.bulbagarden.net/w/index.php?title=X&action=raw'
//   )
//   ...
//   await closeBrowserFetcher()
//
// Env:
//   CHROME_PATH         override the browser binary
//   PI_BROWSER_HEADLESS=1  try headless (Cloudflare currently blocks it)
//   PI_BROWSER_TIMEOUT  per-request timeout in ms (default 60000)
//
// No npm dependencies: Node's built-in fetch + WebSocket drive Chrome's
// DevTools Protocol, exactly like tools/screenshot.cjs.

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const ORIGIN = 'https://bulbapedia.bulbagarden.net/'
const PROFILE = path.join(__dirname, '..', 'cache', 'browser-profile')
const REQUEST_TIMEOUT = Number(process.env.PI_BROWSER_TIMEOUT || 60000)
const CHALLENGE_TIMEOUT = 60000

/** @param {number} ms */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Locate a Chromium-based browser, or fall back to a PATH command. */
function resolveChromium() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const candidates =
    process.platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
          'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
          'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : []
  for (const candidate of candidates) if (candidate && fs.existsSync(candidate)) return candidate
  // Linux distros put the binary on PATH; let the spawn fail loudly if not.
  return 'google-chrome'
}

/** True when a response body is the Cloudflare interstitial rather than content. */
function isChallenge(body) {
  return (
    /<title>\s*Just a moment/i.test(body) ||
    /cf-chl-|challenge-platform/i.test(body.slice(0, 4000))
  )
}

class Cdp {
  /** @param {any} ws */
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
    if (result.exceptionDetails) {
      const description =
        result.exceptionDetails.exception?.description || result.exceptionDetails.text
      throw new Error(description)
    }
    return result.result.value
  }
}

class BrowserFetcher {
  /**
   * @param {import('child_process').ChildProcess} child
   * @param {Cdp} cdp
   * @param {string} profile
   */
  constructor(child, cdp, profile) {
    this.child = child
    this.cdp = cdp
    this.profile = profile
    this.closed = false
  }

  /**
   * Launch Chrome and wait for the Cloudflare challenge to clear.
   * @param {{ origin?: string, headless?: boolean, profile?: string }} [options]
   */
  static async launch(options = {}) {
    const origin = options.origin ?? ORIGIN
    const profile = options.profile ?? PROFILE
    const headless = options.headless ?? process.env.PI_BROWSER_HEADLESS === '1'
    fs.mkdirSync(profile, { recursive: true })
    const portFile = path.join(profile, 'DevToolsActivePort')
    // A stale port file from a crashed run would point at nothing.
    try {
      fs.rmSync(portFile)
    } catch {
      /* fine if absent */
    }
    const args = [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--window-size=1024,768',
    ]
    if (headless) args.push('--headless=new')
    args.push('about:blank')
    const child = spawn(resolveChromium(), args, { stdio: 'ignore' })
    // Capture (don't throw) spawn failures so the polling loop can report them.
    child.spawnError = null
    child.on('error', (error) => {
      child.spawnError = error
    })
    try {
      const port = await waitForPort(portFile, child)
      const cdp = await connect(port)
      const fetcher = new BrowserFetcher(child, cdp, profile)
      await fetcher.clearChallenge(origin)
      return fetcher
    } catch (error) {
      child.kill()
      throw error
    }
  }

  /** Navigate to `origin` and wait until Cloudflare stops challenging us. */
  async clearChallenge(origin) {
    await this.cdp.send('Page.enable')
    await this.cdp.send('Runtime.enable')
    await this.cdp.send('Page.navigate', { url: origin })
    const deadline = Date.now() + CHALLENGE_TIMEOUT
    let title = ''
    while (Date.now() < deadline) {
      try {
        title = await this.cdp.eval('document.title')
      } catch {
        title = ''
      }
      if (title && !/just a moment|attention required|checking your browser/i.test(title)) return
      await sleep(400)
    }
    throw new Error(
      `Cloudflare challenge at ${origin} did not clear after ${CHALLENGE_TIMEOUT}ms ` +
        `(title: ${JSON.stringify(title)}). A visible Chrome window is required; ` +
        'do not set PI_BROWSER_HEADLESS.'
    )
  }

  /**
   * Fetch a URL through the page. Returns the response body text.
   * @param {string} url
   */
  async text(url) {
    const result = await this.cdp.eval(`(async () => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), ${REQUEST_TIMEOUT})
      try {
        const response = await fetch(${JSON.stringify(url)}, {
          credentials: 'include',
          signal: controller.signal,
        })
        return { status: response.status, body: await response.text() }
      } finally {
        clearTimeout(timer)
      }
    })()`)
    if (isChallenge(result.body))
      throw new Error(`Cloudflare challenge returned for ${url} (HTTP ${result.status})`)
    return result.body
  }

  /**
   * Fetch a URL through the page and parse it as JSON. Only same-origin
   * (bulbapedia.bulbagarden.net) URLs work: the page's CSP blocks cross-origin
   * fetch, and other hosts aren't Cloudflare-challenged anyway.
   * @param {string} url
   */
  async json(url) {
    return JSON.parse(await this.text(url))
  }

  /** Close the browser (safe to call more than once). */
  async close() {
    if (this.closed) return
    this.closed = true
    try {
      this.ws?.close()
    } catch {
      /* ignore */
    }
    kill(this.child)
    // Give Chrome a moment to release the profile lock for the next run.
    await sleep(200)
  }

  /** Synchronous kill for process-exit cleanup. */
  kill() {
    this.closed = true
    kill(this.child)
  }
}

/** @param {import('child_process').ChildProcess} child */
function kill(child) {
  try {
    if (process.platform === 'win32' && child.pid)
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    else child.kill()
  } catch {
    /* already gone */
  }
}

/** Poll Chrome's DevToolsActivePort file, then verify the port answers. */
async function waitForPort(portFile, child) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.spawnError) throw child.spawnError
    if (child.exitCode !== null)
      throw new Error(
        `Chrome exited early (code ${child.exitCode}); is another instance using ${PROFILE}?`
      )
    try {
      const raw = fs.readFileSync(portFile, 'utf8').split('\n')
      const port = Number(raw[0])
      if (port) {
        const response = await fetch(`http://127.0.0.1:${port}/json/version`)
        if (response.ok) return port
      }
    } catch {
      /* not ready yet */
    }
    await sleep(150)
  }
  throw new Error(`Chrome did not open a debugging port (expected ${portFile})`)
}

/** @param {number} port */
async function connect(port) {
  let targets = []
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`)
      targets = await response.json()
      if (targets.some((target) => target.type === 'page')) break
    } catch {
      /* not ready */
    }
    await sleep(150)
  }
  const page = targets.find((target) => target.type === 'page')
  if (!page) throw new Error('Chrome opened no page target')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve)
    ws.addEventListener('error', reject)
  })
  return new Cdp(ws)
}

// --- shared singleton --------------------------------------------------------
/** @type {BrowserFetcher | null} */
let shared = null
/** @type {Promise<BrowserFetcher> | null} */
let sharedPromise = null

/** Lazily launch (or reuse) the shared browser. */
function getBrowserFetcher(options = {}) {
  if (!sharedPromise) {
    sharedPromise = BrowserFetcher.launch(options).then((fetcher) => {
      shared = fetcher
      return fetcher
    })
  }
  return sharedPromise
}

/** Close the shared browser if it was started. */
async function closeBrowserFetcher() {
  if (shared) await shared.close()
  shared = null
  sharedPromise = null
}

process.on('exit', () => {
  if (shared) shared.kill()
})

/**
 * Fetch text through the shared browser.
 * @param {string} url
 */
async function browserText(url) {
  return (await getBrowserFetcher()).text(url)
}

/**
 * Fetch and parse JSON through the shared browser.
 * @param {string} url
 */
async function browserJson(url) {
  return (await getBrowserFetcher()).json(url)
}

module.exports = {
  BrowserFetcher,
  getBrowserFetcher,
  closeBrowserFetcher,
  browserText,
  browserJson,
}
