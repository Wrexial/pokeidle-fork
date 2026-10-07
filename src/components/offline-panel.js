// Offline play controls: download every art/data file into the browser cache
// so the game keeps working with no network. The heavy lifting lives in
// src/game/offline.js and public/sw.js.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import {
  clearOfflineAssets,
  collectOfflineAssets,
  downloadOfflineAssets,
  estimateOfflineBytes,
  getOfflineSummary,
  offlineAvailable,
  offlineSupported,
} from '../game/offline.js'

/** @param {number} bytes */
function formatBytes(bytes) {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

export function OfflinePanel() {
  const supported = offlineSupported()
  const available = offlineAvailable()
  const [summary, setSummary] = React.useState(
    /** @type {{ count: number, bytes: number, quota: number, controlled: boolean }} */ ({
      count: 0,
      bytes: 0,
      quota: 0,
      controlled: false,
    })
  )
  const [phase, setPhase] = React.useState('idle')
  const [progress, setProgress] = React.useState(
    /** @type {{ total: number, done: number, downloaded: number, skipped: number, failed: number, bytes: number } | null} */ (
      null
    )
  )
  const [error, setError] = React.useState('')
  /** @type {React.MutableRefObject<AbortController | null>} */
  const abortRef = React.useRef(null)
  const assets = React.useMemo(
    () => (available ? collectOfflineAssets() : []),
    [available]
  )
  const plannedFiles = assets.length
  const plannedBytes = React.useMemo(
    () => (available ? estimateOfflineBytes(assets) : 0),
    [available, assets]
  )

  async function refresh() {
    if (!supported) return
    try {
      const next = await getOfflineSummary()
      setSummary({
        count: next.count,
        bytes: next.bytes,
        quota: next.quota,
        controlled: next.controlled,
      })
    } catch {
      // Storage may be unavailable (private mode); leave the summary empty.
    }
  }

  React.useEffect(() => {
    refresh()
  }, [])

  async function startDownload() {
    setPhase('running')
    setError('')
    setProgress(null)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await downloadOfflineAssets((next) => setProgress(next), {
        signal: controller.signal,
      })
      await refresh()
      setPhase('done')
    } catch (downloadError) {
      if (controller.signal.aborted) {
        setPhase('idle')
        await refresh()
        return
      }
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Could not download the offline files.'
      )
      setPhase('error')
    } finally {
      abortRef.current = null
    }
  }

  function cancelDownload() {
    abortRef.current?.abort()
  }

  async function clearCache() {
    await clearOfflineAssets()
    setProgress(null)
    setError('')
    setPhase('idle')
    await refresh()
  }

  if (!supported) {
    return jsxs('div', {
      className: 'settings-section',
      children: [
        jsx('div', { className: 'settings-section-title', children: 'Offline Play' }),
        jsx('p', {
          className: 'settings-hint',
          children: 'This browser cannot store the game files for offline play.',
        }),
      ],
    })
  }

  if (!available) {
    return jsxs('div', {
      className: 'settings-section',
      children: [
        jsx('div', { className: 'settings-section-title', children: 'Offline Play' }),
        jsx('p', {
          className: 'settings-hint',
          children:
            'Offline play is available in the built game. Run npm run build and npm run preview to try it.',
        }),
      ],
    })
  }

  const percent =
    progress && progress.total
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : 0
  const downloadedAll = plannedFiles > 0 && summary.count >= plannedFiles

  return jsxs('div', {
    className: 'settings-section',
    children: [
      jsx('div', { className: 'settings-section-title', children: 'Offline Play' }),
      jsx('p', {
        className: 'settings-hint',
        children: `Download the static sprite for every Pokemon, plus every battle backdrop, item icon and data file (about ${formatBytes(
          plannedBytes
        )}). While offline the game uses the static sprites.`,
      }),
      phase === 'running'
        ? jsxs('div', {
            className: 'offline-progress',
            children: [
              jsx('div', {
                className: 'offline-progress-bar',
                children: jsx('div', {
                  className: 'offline-progress-fill',
                  style: { width: `${percent}%` },
                }),
              }),
              jsx('div', {
                className: 'offline-progress-label',
                children: `${progress ? progress.done.toLocaleString() : 0} / ${
                  progress ? progress.total.toLocaleString() : plannedFiles.toLocaleString()
                } files · ${percent}%${
                  progress && progress.failed
                    ? ` · ${progress.failed.toLocaleString()} failed`
                    : ''
                }`,
              }),
              jsx('button', {
                className: 'settings-toggle-btn',
                onClick: cancelDownload,
                children: 'Cancel Download',
              }),
            ],
          })
        : jsxs('div', {
            className: 'settings-save-row',
            children: [
              jsx('button', {
                className: 'settings-save-btn',
                onClick: startDownload,
                children: downloadedAll
                  ? '↻ Re-check / Update Files'
                  : `⬇ Download ${plannedFiles.toLocaleString()} Files (≈${formatBytes(
                      plannedBytes
                    )})`,
              }),
              summary.count > 0
                ? jsx('button', {
                    className: 'settings-save-btn danger',
                    onClick: clearCache,
                    children: 'Clear Offline Files',
                  })
                : null,
            ],
          }),
      phase === 'done'
        ? jsx('p', {
            className: 'offline-status ok',
            children: 'Ready! You can now play offline (turn off Wi-Fi and reload).',
          })
        : null,
      phase === 'error' && error
        ? jsx('p', { className: 'settings-save-error', children: error })
        : null,
      summary.count > 0
        ? jsx('p', {
            className: 'offline-status',
            children: `Cached ${summary.count.toLocaleString()} files (${formatBytes(
              summary.bytes
            )})${
              downloadedAll ? '' : ` of ${plannedFiles.toLocaleString()} (≈${formatBytes(plannedBytes)})`
            }.`,
          })
        : null,
    ],
  })
}
