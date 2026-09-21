// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { raidPoolFor, mapAreas, mapData, regions } from '../data/gameData.js'
import { regionMapImages } from '../data/ui.js'
import { useGame } from '../game/context.js'
import { createRoads } from '../game/progression.js'
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
      const pool = raidPoolFor(locationData.region ?? 'kanto')
      if (pool.length === 0) return
      const legendary = pool[Math.floor(Math.random() * pool.length)]
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
    activeLocationSet = new Set(activeLocationIds),
    // A region with an illustrated map uses its pixel dimensions as the world,
    // so the location percentages line up with the image.
    activeMapImage = regionMapImages[activeRegion],
    worldWidth = activeMapImage?.width ?? WORLD_SIZE,
    worldHeight = activeMapImage?.height ?? WORLD_SIZE

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
    if (activeLocationIds.length === 0) return { x: worldWidth / 2, y: worldHeight / 2 }
    let x = 0,
      y = 0
    for (const id of activeLocationIds) {
      x += mapData[id].position.x
      y += mapData[id].position.y
    }
    return {
      x: (x / activeLocationIds.length / 100) * worldWidth,
      y: (y / activeLocationIds.length / 100) * worldHeight,
    }
  }, [activeLocationIds, worldWidth, worldHeight])

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
    const fitScale = Math.min(rect.width / worldWidth, rect.height / worldHeight)
    centreOn(regionCentre.x, regionCentre.y, Math.min(MAX_SCALE, Math.max(MIN_SCALE, fitScale)))
  }, [canvasRect, centreOn, regionCentre, worldWidth, worldHeight])

  const centreOnCurrent = React.useCallback(() => {
    const target = mapData[currentLocation]?.position
    if (!target || !activeLocationSet.has(currentLocation)) return fitView()
    const scale = Math.max(view.scale, MIN_SCALE)
    centreOn((target.x / 100) * worldWidth, (target.y / 100) * worldHeight, scale)
  }, [activeLocationSet, centreOn, currentLocation, fitView, view.scale, worldWidth, worldHeight])

  // Focus the map on the player's location when the region changes (or on first
  // paint). Kept out of the resize path so panning isn't reset by a resize.
  React.useEffect(() => {
    const rect = canvasRect()
    if (!rect) return
    const fitScale = Math.min(rect.width / worldWidth, rect.height / worldHeight)
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.max(1, fitScale)))
    const focusId = activeLocationSet.has(currentLocation) ? currentLocation : null
    const focus = focusId
      ? mapData[focusId].position
      : { x: regionCentre.x / worldWidth * 100, y: regionCentre.y / worldHeight * 100 }
    centreOn((focus.x / 100) * worldWidth, (focus.y / 100) * worldHeight, scale)
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
      jsx('div', {
        className: 'map-region-tabs',
        children: regionOrder.map((region) => {
          const ids = locationsByRegion[region.id] ?? [],
            available = ids.some((id) => unlockedLocations.includes(id))
          return jsx(
            'button',
            {
              className: `map-region-tab${activeRegion === region.id ? ' active' : ''}${available ? '' : ' locked'}`,
              onClick: () => available && setActiveRegion(region.id),
              disabled: !available,
              title: available ? region.name : 'Locked',
              children: region.name,
            },
            region.id
          )
        }),
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
              width: `${worldWidth}px`,
              height: `${worldHeight}px`,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            },
            children: [
              activeMapImage &&
                jsx('img', {
                  className: 'town-map-background',
                  src: activeMapImage.src,
                  alt: '',
                  draggable: false,
                }),
              // An illustrated map already draws its own routes, so the generated
              // roads would only clutter it.
              !activeMapImage &&
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
