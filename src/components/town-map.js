// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { raidPoolFor, mapAreas, mapData, regions } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { createRoads, getRegionUnlockTokens, pickRaidLegendary } from '../game/progression.js'
import { MapNode } from './map-node.js'

// Nodes are positioned as percentages, so the layout doesn't change here — this
// only sets the pixel size of the virtual canvas the map is drawn on. It's
// bigger than the visible panel on purpose: the player pans/zooms instead of
// the whole region being squashed into one small box.
const WORLD_SIZE = 1200
const MIN_SCALE = 0.1
const MAX_SCALE = 3
const ZOOM_STEP = 1.35
const DRAG_THRESHOLD = 4

/** @typedef {{ x: number, y: number, scale: number }} MapView */

export function TownMap() {
  const { state, dispatch } = useGame(),
    { currentLocation, unlockedLocations } = state,
    currentLocationData = mapData[currentLocation],
    currentRegion = currentLocationData?.region ?? 'kanto',
    [activeRegion, setActiveRegion] = React.useState(currentRegion),
    [pendingUnlock, setPendingUnlock] = React.useState(/** @type {string | null} */ (null)),
    unlockTokens = getRegionUnlockTokens(state),
    canvasRef = React.useRef(/** @type {HTMLDivElement | null} */ (null)),
    [view, setView] = React.useState(
      /** @type {MapView} */ ({ x: 0, y: 0, scale: 1 })
    ),
    dragRef = React.useRef({
      active: false,
      pointerId: -1,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      moved: false,
    })

  // follow the player when they travel between regions
  React.useEffect(() => {
    setActiveRegion(currentRegion)
  }, [currentRegion])

  /** @param {string} location */
  function travelTo(location) {
    const locationData = mapData[location]
    if (locationData?.type === 'raid') {
      if (state.raidCooldownEnd && Date.now() < state.raidCooldownEnd) return
      const pool = raidPoolFor(locationData.region ?? 'kanto'),
        legendary = pickRaidLegendary(pool, state.pokedexSeen, state.pokedexCaught)
      if (!legendary) return
      dispatch({
        type: 'START_RAID',
        payload: {
          legendary: legendary.speciesKey,
          level: legendary.level,
          region: locationData.region ?? 'kanto',
          location,
        },
      })
      return
    }
    dispatch({
      type: 'TRAVEL',
      payload: {
        locationId: location,
      },
    })
  }

  const regionOrder = React.useMemo(() => [...regions].sort((a, b) => a.order - b.order), []),
    locationsByRegion = React.useMemo(() => {
      /** @type {Record<string, string[]>} */
      const map = {}
      for (const id of mapAreas) {
        const region = mapData[id].region ?? 'kanto'
        ;(map[region] || (map[region] = [])).push(id)
      }
      return map
    }, []),
    activeLocationIds = locationsByRegion[activeRegion] ?? [],
    activeLocationSet = new Set(activeLocationIds)

  const roads = [],
    roadSet = new Set()
  for (const locationId of activeLocationIds) {
    const location = mapData[locationId]
    for (const connectionId of location.connections) {
      if (!activeLocationSet.has(connectionId)) continue
      const roadKey = [location.id, connectionId].sort().join('-')
      roadSet.has(roadKey) ||
        (roadSet.add(roadKey),
        roads.push({
          from: location.id,
          to: connectionId,
        }))
    }
  }

  // Centre of the active region (used when the player isn't in it).
  const regionCentre = React.useMemo(() => {
    if (activeLocationIds.length === 0) return { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 }
    let x = 0,
      y = 0
    for (const id of activeLocationIds) {
      x += mapData[id].position.x
      y += mapData[id].position.y
    }
    return {
      x: (x / activeLocationIds.length / 100) * WORLD_SIZE,
      y: (y / activeLocationIds.length / 100) * WORLD_SIZE,
    }
  }, [activeLocationIds])

  const canvasRect = React.useCallback(() => canvasRef.current?.getBoundingClientRect(), [])

  const centreOn = React.useCallback(
    /** @param {number} worldX @param {number} worldY @param {number} scale */
    (worldX, worldY, scale) => {
      const rect = canvasRect()
      if (!rect) return
      setView({
        scale,
        x: rect.width / 2 - worldX * scale,
        y: rect.height / 2 - worldY * scale,
      })
    },
    [canvasRect]
  )

  const fitView = React.useCallback(() => {
    const rect = canvasRect()
    if (!rect) return
    const fitScale = Math.min(rect.width, rect.height) / WORLD_SIZE
    centreOn(regionCentre.x, regionCentre.y, Math.min(MAX_SCALE, Math.max(MIN_SCALE, fitScale)))
  }, [canvasRect, centreOn, regionCentre])

  const centreOnCurrent = React.useCallback(() => {
    const target = mapData[currentLocation]?.position
    if (!target || !activeLocationSet.has(currentLocation)) return fitView()
    const scale = Math.max(view.scale, MIN_SCALE)
    centreOn((target.x / 100) * WORLD_SIZE, (target.y / 100) * WORLD_SIZE, scale)
  }, [activeLocationSet, centreOn, currentLocation, fitView, view.scale])

  // Focus the map on the player's location when the region changes (or on first
  // paint). Kept out of the resize path so panning isn't reset by a resize.
  React.useEffect(() => {
    const rect = canvasRect()
    if (!rect) return
    const fitScale = Math.min(rect.width, rect.height) / WORLD_SIZE
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.max(1, fitScale)))
    const focusId = activeLocationSet.has(currentLocation) ? currentLocation : null
    const focus = focusId
      ? mapData[focusId].position
      : { x: regionCentre.x / WORLD_SIZE * 100, y: regionCentre.y / WORLD_SIZE * 100 }
    centreOn((focus.x / 100) * WORLD_SIZE, (focus.y / 100) * WORLD_SIZE, scale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegion])

  const zoomAt = React.useCallback(
    /** @param {number} clientX @param {number} clientY @param {number} factor */
    (clientX, clientY, factor) => {
      const rect = canvasRect()
      if (!rect) return
      const px = clientX - rect.left,
        py = clientY - rect.top
      setView((previous) => {
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, previous.scale * factor))
        const ratio = scale / previous.scale
        return {
          scale,
          x: px - (px - previous.x) * ratio,
          y: py - (py - previous.y) * ratio,
        }
      })
    },
    [canvasRect]
  )

  // Wheel must be a non-passive native listener so we can preventDefault.
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    /** @param {WheelEvent} event */
    function handleWheel(event) {
      event.preventDefault()
      zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.0015))
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [zoomAt])

  // Track the drag on window so it keeps working outside the canvas, and
  // don't capture the pointer: capture would retarget the click away from
  // the node, breaking travel.
  /** @param {PointerEvent} event */
  function moveDrag(event) {
    const drag = dragRef.current
    if (!drag.active || event.pointerId !== drag.pointerId) return
    const dx = event.clientX - drag.startX,
      dy = event.clientY - drag.startY
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true
    setView((previous) => ({ ...previous, x: drag.originX + dx, y: drag.originY + dy }))
  }

  function endDrag() {
    const drag = dragRef.current
    if (!drag.active) return
    drag.active = false
    window.removeEventListener('pointermove', moveDrag)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
  }

  /** @param {React.PointerEvent<HTMLDivElement>} event */
  function handlePointerDown(event) {
    if (event.button !== 0) return
    const drag = dragRef.current
    ;(drag.active = true),
      (drag.pointerId = event.pointerId),
      (drag.startX = event.clientX),
      (drag.startY = event.clientY),
      (drag.originX = view.x),
      (drag.originY = view.y),
      (drag.moved = false)
    window.addEventListener('pointermove', moveDrag)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  }

  // A drag shouldn't also travel; swallow the click that follows a pan.
  /** @param {React.MouseEvent<HTMLDivElement>} event */
  function handleClickCapture(event) {
    const wasDragged = dragRef.current.moved
    dragRef.current.moved = false
    if (wasDragged && event.target instanceof Element && event.target.closest('.map-node')) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  /** @param {React.PointerEvent<HTMLButtonElement>} event */
  function stopDrag(event) {
    event.stopPropagation()
  }

  return jsxs('div', {
    className: 'town-map',
    children: [
      jsxs('div', {
        className: 'town-map-header',
        children: [
          jsx('span', {
            className: 'town-map-title',
            children: 'TOWN MAP',
          }),
          jsx('span', {
            className: 'town-map-location-name',
            children: currentLocationData?.name ?? '',
          }),
          jsxs('span', {
            className: 'town-map-battles',
            children: [state.wildBattlesWon, 'W ', state.trainerBattlesWon, 'T'],
          }),
        ],
      }),
      unlockTokens > 0 &&
        jsxs('div', {
          className: 'map-unlock-tokens',
          children: [
            jsx('span', {
              className: 'map-unlock-token-icon',
              children: '🗝️',
            }),
            `${unlockTokens} Region Unlock Token${unlockTokens > 1 ? 's' : ''} — pick a locked region to open it`,
          ],
        }),
      jsx('div', {
        className: 'map-region-tabs',
        children: regionOrder.map((region) => {
          const ids = locationsByRegion[region.id] ?? [],
            available = ids.some((id) => unlockedLocations.includes(id)),
            unlockable = !available && unlockTokens > 0,
            pending = pendingUnlock === region.id
          return jsx(
            'button',
            {
              className: `map-region-tab${activeRegion === region.id ? ' active' : ''}${available ? '' : ' locked'}${pending ? ' unlocking' : ''}${unlockable ? ' unlockable' : ''}`,
              onClick: available
                ? () => {
                    setActiveRegion(region.id)
                    setPendingUnlock(null)
                  }
                : unlockable
                  ? () => setPendingUnlock(pending ? null : region.id)
                  : void 0,
              disabled: !available && !unlockable,
              title: available
                ? region.name
                : unlockable
                  ? `Spend an Unlock Token to open ${region.name}`
                  : 'Locked — beat a region Champion to earn an Unlock Token',
              children: available ? region.name : unlockable ? `${region.name} 🔓` : region.name,
            },
            region.id
          )
        }),
      }),
      pendingUnlock &&
        jsxs('div', {
          className: 'map-unlock-bar',
          children: [
            jsx('span', {
              className: 'map-unlock-text',
              children: `Open ${
                regions.find((candidate) => candidate.id === pendingUnlock)?.name ?? pendingUnlock
              } for 1 Unlock Token?`,
            }),
            jsxs('div', {
              className: 'map-unlock-actions',
              children: [
                jsx('button', {
                  className: 'map-unlock-btn',
                  onClick: () => {
                    dispatch({
                      type: 'UNLOCK_REGION',
                      payload: {
                        regionId: pendingUnlock,
                      },
                    })
                    setPendingUnlock(null)
                  },
                  children: 'Unlock',
                }),
                jsx('button', {
                  className: 'map-unlock-cancel',
                  onClick: () => setPendingUnlock(null),
                  children: 'Cancel',
                }),
              ],
            }),
          ],
        }),
      jsxs('div', {
        className: 'town-map-canvas',
        ref: canvasRef,
        onPointerDown: handlePointerDown,
        onClickCapture: handleClickCapture,
        children: [
          jsxs('div', {
            className: 'town-map-world',
            style: {
              width: `${WORLD_SIZE}px`,
              height: `${WORLD_SIZE}px`,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            },
            children: [
              jsxs('svg', {
                className: 'town-map-svg',
                children: [
                  roads.map(({ from: fromId, to: toId }) => {
                    const roadClass = `map-road-border${unlockedLocations.includes(fromId) && unlockedLocations.includes(toId) ? ' unlocked' : ' locked'}`
                    return createRoads(fromId, toId).map((segment, segmentIndex) =>
                      jsx(
                        'line',
                        {
                          x1: `${segment.x1}%`,
                          y1: `${segment.y1}%`,
                          x2: `${segment.x2}%`,
                          y2: `${segment.y2}%`,
                          className: roadClass,
                        },
                        `border-${fromId}-${toId}-${segmentIndex}`
                      )
                    )
                  }),
                  roads.map(({ from: fromId, to: toId }) => {
                    const roadClass = `map-road-fill${unlockedLocations.includes(fromId) && unlockedLocations.includes(toId) ? ' unlocked' : ' locked'}`
                    return createRoads(fromId, toId).map((segment, segmentIndex) =>
                      jsx(
                        'line',
                        {
                          x1: `${segment.x1}%`,
                          y1: `${segment.y1}%`,
                          x2: `${segment.x2}%`,
                          y2: `${segment.y2}%`,
                          className: roadClass,
                        },
                        `fill-${fromId}-${toId}-${segmentIndex}`
                      )
                    )
                  }),
                ],
              }),
              activeLocationIds.map((locationId) => {
                const location = mapData[locationId],
                  isUnlocked = unlockedLocations.includes(locationId)
                if (location.type === 'raid' && !isUnlocked) return null
                const isCurrent = locationId === currentLocation,
                  onCooldown =
                    location.type === 'raid' &&
                    state.raidCooldownEnd != null &&
                    Date.now() < state.raidCooldownEnd,
                  isClickable = isUnlocked && !isCurrent && !onCooldown
                return jsx(
                  MapNode,
                  {
                    location,
                    isCurrent,
                    isUnlocked,
                    isClickable,
                    onClick: () => travelTo(locationId),
                    cooldownEnd: location.type === 'raid' ? state.raidCooldownEnd : void 0,
                  },
                  locationId
                )
              }),
            ],
          }),
          jsxs('div', {
            className: 'map-zoom-controls',
            onPointerDown: stopDrag,
            children: [
              jsx('button', {
                type: 'button',
                className: 'map-zoom-btn',
                title: 'Zoom in',
                onClick: () => {
                  const rect = canvasRect()
                  if (rect) zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, ZOOM_STEP)
                },
                children: '+',
              }),
              jsx('button', {
                type: 'button',
                className: 'map-zoom-btn',
                title: 'Zoom out',
                onClick: () => {
                  const rect = canvasRect()
                  if (rect) zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / ZOOM_STEP)
                },
                children: '-',
              }),
              jsx('button', {
                type: 'button',
                className: 'map-zoom-btn',
                title: 'Fit whole region',
                onClick: fitView,
                children: 'F',
              }),
              jsx('button', {
                type: 'button',
                className: 'map-zoom-btn',
                title: 'Center on current location',
                onClick: centreOnCurrent,
                children: 'C',
              }),
            ],
          }),
          jsx('div', {
            className: 'map-pan-hint',
            children: 'Drag to pan · scroll to zoom',
          }),
        ],
      }),
    ],
  })
}
