// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { encounterData, raidPoolFor, mapAreas, mapData, pokemonSpecies, regions } from '../data/gameData.js'
import { biomeForLocation } from '../data/ui.js'
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

/**
 * Colours for the generated terrain layer: oceans, a sandy shore and one shade
 * per land biome. Deliberately saturated so land and water read apart even when
 * the map is zoomed out.
 * @type {Record<string, string>}
 */
const TERRAIN_COLORS = {
  water: '#2f6fae',
  waterDeep: '#1b4a80',
  shore: '#ecd9a2',
  grassland: '#6cb04e',
  forest: '#3f8a3a',
  autumn: '#b9772f',
  desert: '#dcc07a',
  swamp: '#5b8a4f',
  volcanic: '#8a4530',
  tundra: '#d8e8f2',
  cave: '#8a7864',
  ruins: '#9a9380',
  mountain: '#a07a4e',
  // Beaches, ports and islands are land, so they get a grassy tone rather than
  // the pale blue that made coastal towns look like open water. The sandy
  // coastline comes from the shore rim drawn under every land blob.
  coast: '#a9c46e',
  town: '#c8a45c',
  // A region's Pokemon League reads as a distinct pale-stone plateau, so the
  // central Alolan league stands out from the islands around it.
  league: '#d8d3c2',
}

// Aquatic names that should read as water even when the wild table isn't
// Water-majority (a lake full of Magikarp and Psyduck is still a lake).
const WATER_NAME_PATTERN =
  /sea|ocean|lake|river|bay|strait|channel|underwater|abyss|deep|waterway|seafloor|trench|rapids/i

/**
 * The terrain for a location: water routes (or routes whose wild table is
 * mostly Water-types) are blue, everything else takes its biome shade. The
 * `water` flag lets the renderer draw water and land as separate layers with a
 * defined coastline between them.
 * @param {MapLocation} location
 * @param {any} bucket
 * @returns {{ color: string, water: boolean }}
 */
function terrainFor(location, bucket) {
  if (location.type !== 'zone') {
    const encounters = bucket?.encounters
    if (encounters?.length) {
      const total = encounters.reduce((/** @type {number} */ sum, /** @type {any} */ entry) => sum + entry.weight, 0),
        water = encounters.reduce(
          (/** @type {number} */ sum, /** @type {any} */ entry) =>
            sum + (pokemonSpecies[entry.speciesKey]?.types?.includes('Water') ? entry.weight : 0),
          0
        )
      if (total > 0 && water / total >= 0.5) return { color: TERRAIN_COLORS.waterDeep, water: true }
    }
    if (WATER_NAME_PATTERN.test(location.name ?? ''))
      return { color: TERRAIN_COLORS.waterDeep, water: true }
  }
  if (location.id.endsWith('-league')) return { color: TERRAIN_COLORS.league, water: false }
  return {
    color: TERRAIN_COLORS[biomeForLocation(location)] ?? TERRAIN_COLORS.grassland,
    water: false,
  }
}

/** @typedef {{ x: number, y: number, scale: number }} MapView */

export function TownMap() {
  const { state, dispatch } = useGame(),
    { currentLocation, unlockedLocations } = state,
    currentLocationData = mapData[currentLocation],
    currentRegion = currentLocationData?.region ?? 'kanto',
    [activeRegion, setActiveRegion] = React.useState(currentRegion),
    [pendingUnlock, setPendingUnlock] = React.useState(/** @type {string | null} */ (null)),
    [searchQuery, setSearchQuery] = React.useState(''),
    [focusNonce, setFocusNonce] = React.useState(0),
    focusRef = React.useRef(/** @type {string | null} */ (null)),
    unlockTokens = getRegionUnlockTokens(state),
    allRegionsUnlocked =
      regions.length > 0 && (state.unlockedRegions ?? []).length >= regions.length,
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
        if (mapData[id].hidden) continue
        const region = mapData[id].region ?? 'kanto'
        ;(map[region] || (map[region] = [])).push(id)
      }
      return map
    }, []),
    activeLocationIds = locationsByRegion[activeRegion] ?? [],
    activeLocationSet = new Set(activeLocationIds)

  // Terrain blobs, one per visible location, split into water and land so the
  // renderer can lay down oceans, a coastline and land as separate blurred
  // passes. Water is the base, so only deeper water and land show as blobs.
  const terrain = React.useMemo(() => {
    /** @type {{ id: string, x: number, y: number, radius: number, color: string }[]} */
    const waterBlobs = [],
      /** @type {{ id: string, x: number, y: number, radius: number, color: string }[]} */
      landBlobs = []
    for (const locationId of activeLocationIds) {
      const location = mapData[locationId],
        { color, water } = terrainFor(
          location,
          location.routeKey ? encounterData[location.routeKey] : null
        ),
        blob = {
          id: locationId,
          x: location.position.x,
          y: location.position.y,
          // Zone hubs are the big island landmasses; the league is a small
          // central plateau; towns and routes are normal patches.
          radius:
            location.type === 'zone'
              ? 14
              : locationId.endsWith('-league')
                ? 7
                : location.type === 'town'
                  ? 9
                  : 7,
          color,
        }
      ;(water ? waterBlobs : landBlobs).push(blob)
    }
    return { waterBlobs, landBlobs }
  }, [activeLocationIds])

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
  // paint), or on a location chosen from the search box. Kept out of the resize
  // path so panning isn't reset by a resize.
  React.useEffect(() => {
    const rect = canvasRect()
    if (!rect) return
    const fitScale = Math.min(rect.width, rect.height) / WORLD_SIZE
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.max(1, fitScale)))
    const requested = focusRef.current
    focusRef.current = null
    const focusId =
      requested && mapData[requested]?.region === activeRegion
        ? requested
        : activeLocationSet.has(currentLocation)
          ? currentLocation
          : null
    const focus = focusId
      ? mapData[focusId].position
      : { x: (regionCentre.x / WORLD_SIZE) * 100, y: (regionCentre.y / WORLD_SIZE) * 100 }
    centreOn((focus.x / 100) * WORLD_SIZE, (focus.y / 100) * WORLD_SIZE, scale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegion, focusNonce])

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

  /**
   * Find a location's region name for the search list.
   * @param {string} locationId
   */
  function regionNameFor(locationId) {
    const regionId = mapData[locationId]?.region ?? 'kanto'
    return regions.find((candidate) => candidate.id === regionId)?.name ?? 'Kanto'
  }

  /**
   * Jump to a location from the search box: switch to its region, centre the
   * map on it, and travel there when it is an ordinary (non-raid) location.
   * @param {string} locationId
   */
  function jumpTo(locationId) {
    const location = mapData[locationId]
    if (!location) return
    setSearchQuery('')
    focusRef.current = locationId
    setActiveRegion(location.region ?? 'kanto')
    setFocusNonce((nonce) => nonce + 1)
    if (location.type !== 'raid' && locationId !== currentLocation)
      dispatch({ type: 'TRAVEL', payload: { locationId } })
  }

  const searchResults = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []
    return unlockedLocations
      .filter(
        (locationId) =>
          !mapData[locationId]?.hidden && mapData[locationId]?.name.toLowerCase().includes(query)
      )
      .sort((left, right) => mapData[left].name.localeCompare(mapData[right].name))
      .slice(0, 8)
  }, [searchQuery, unlockedLocations])

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
      jsxs('div', {
        className: 'map-search',
        onPointerDown: stopDrag,
        children: [
          jsx('input', {
            className: 'map-search-input',
            type: 'text',
            placeholder: 'Search locations\u2026',
            value: searchQuery,
            onChange: /** @param {React.ChangeEvent<HTMLInputElement>} event */ (event) =>
              setSearchQuery(event.target.value),
          }),
          searchQuery.trim()
            ? jsx('div', {
                className: 'map-search-results',
                children:
                  searchResults.length > 0
                    ? searchResults.map((locationId) =>
                        jsxs(
                          'button',
                          {
                            className: `map-search-result${locationId === currentLocation ? ' current' : ''}`,
                            onClick: () => jumpTo(locationId),
                            children: [
                              jsx('span', {
                                className: 'map-search-name',
                                children: mapData[locationId].name,
                              }),
                              jsx('span', {
                                className: 'map-search-region',
                                children: regionNameFor(locationId),
                              }),
                            ],
                          },
                          locationId
                        )
                      )
                    : jsx('div', {
                        className: 'map-search-empty',
                        children: 'No matching locations.',
                      }),
              })
            : null,
        ],
      }),
      unlockTokens > 0 &&
        !allRegionsUnlocked &&
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
              jsx('svg', {
                className: 'town-map-terrain',
                viewBox: '0 0 100 100',
                preserveAspectRatio: 'none',
                children: [
                  jsx('defs', {
                    children: [
                      jsx('filter', {
                        id: 'town-terrain-water',
                        x: '-25%',
                        y: '-25%',
                        width: '150%',
                        height: '150%',
                        children: jsx('feGaussianBlur', { stdDeviation: 7 }),
                      }),
                      jsx('filter', {
                        id: 'town-terrain-shore',
                        x: '-25%',
                        y: '-25%',
                        width: '150%',
                        height: '150%',
                        children: jsx('feGaussianBlur', { stdDeviation: 4 }),
                      }),
                      jsx('filter', {
                        id: 'town-terrain-land',
                        x: '-25%',
                        y: '-25%',
                        width: '150%',
                        height: '150%',
                        children: jsx('feGaussianBlur', { stdDeviation: 3 }),
                      }),
                    ],
                  }),
                  jsx('rect', { x: 0, y: 0, width: 100, height: 100, fill: TERRAIN_COLORS.water }),
                  // Deep water first, then a blurred sand rim underneath the
                  // land so every landmass gets a beach before its biome fill.
                  jsx('g', {
                    filter: 'url(#town-terrain-water)',
                    children: terrain.waterBlobs.map((blob) =>
                      jsx('circle', { cx: blob.x, cy: blob.y, r: blob.radius, fill: blob.color }, blob.id)
                    ),
                  }),
                  jsx('g', {
                    filter: 'url(#town-terrain-shore)',
                    children: terrain.landBlobs.map((blob) =>
                      jsx(
                        'circle',
                        {
                          cx: blob.x,
                          cy: blob.y,
                          r: blob.radius + 2.4,
                          fill: TERRAIN_COLORS.shore,
                        },
                        blob.id
                      )
                    ),
                  }),
                  jsx('g', {
                    filter: 'url(#town-terrain-land)',
                    children: terrain.landBlobs.map((blob) =>
                      jsx('circle', { cx: blob.x, cy: blob.y, r: blob.radius, fill: blob.color }, blob.id)
                    ),
                  }),
                ],
              }),
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
                    swarmLabel:
                      state.swarm?.routeKey === locationId
                        ? `${pokemonSpecies[state.swarm.speciesKey]?.name ?? state.swarm.speciesKey} \u00b7 ${state.swarm.battlesRemaining} battle${state.swarm.battlesRemaining === 1 ? '' : 's'} left`
                        : null,
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
