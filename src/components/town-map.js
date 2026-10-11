// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { baseRegions, encounterData, raidLegendaryPoolFor, mapAreas, mapData, pokemonSpecies, regions } from '../data/gameData.js'
import { biomeForLocation } from '../data/ui.js'
import { useGame } from '../game/context.js'
import { createRoadPaths, getRegionUnlockTokens, pickRaidLegendary, raidProgressFor } from '../game/progression.js'
import { servicePoiKinds } from '../game/services.js'
import { MapNode } from './map-node.js'
import { DayPhaseChip } from './day-phase-chip.js'
import { WeatherChip } from './weather-chip.js'

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
 * A DLC subregion is drawn on its parent region's map and has no tab of its
 * own, so map/labels resolve a subregion id to its parent.
 * @param {string} regionId
 * @returns {string}
 */
function displayRegionFor(regionId) {
  const region = regions.find((candidate) => candidate.id === regionId)
  return region?.isDlc && region.parentRegion ? region.parentRegion : regionId
}

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
    currentRegion = displayRegionFor(currentLocationData?.region ?? 'kanto'),
    [activeRegion, setActiveRegion] = React.useState(currentRegion),
    // A zone/area the map is zoomed into (#60). When set, the canvas draws
    // just that hub and its sub-areas (hidden routes included) with a back bar.
    [focusZone, setFocusZone] = React.useState(/** @type {string | null} */ (null)),
    [pendingUnlock, setPendingUnlock] = React.useState(/** @type {string | null} */ (null)),
    [searchQuery, setSearchQuery] = React.useState(''),
    [searchOpen, setSearchOpen] = React.useState(!1),
    [legendOpen, setLegendOpen] = React.useState(!1),
    [focusNonce, setFocusNonce] = React.useState(0),
    focusRef = React.useRef(/** @type {string | null} */ (null)),
    unlockTokens = getRegionUnlockTokens(state),
    allRegionsUnlocked =
      baseRegions.length > 0 && (state.unlockedRegions ?? []).length >= baseRegions.length,
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
      /** @type {Map<number, { x: number, y: number }>} */
      pointers: new Map(),
      pinchDist: 0,
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
      const pool = raidLegendaryPoolFor(locationData.region ?? 'kanto'),
        legendary = pickRaidLegendary(
          pool,
          state.pokedexSeen,
          state.pokedexCaught,
          raidProgressFor(state, locationData.region ?? 'kanto')
        )
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

  const regionOrder = React.useMemo(
      () => [...baseRegions].sort((a, b) => a.order - b.order),
      []
    ),
    locationsByRegion = React.useMemo(() => {
      /** @type {Record<string, string[]>} */
      const map = {}
      for (const id of mapAreas) {
        if (mapData[id].hidden) continue
        // DLC subregions share their parent's map, so they get no tab but do
        // render (and are travelable) from the parent.
        const region = displayRegionFor(mapData[id].region ?? 'kanto')
        ;(map[region] || (map[region] = [])).push(id)
      }
      return map
    }, []),
    focusedHub = focusZone ? mapData[focusZone] : null,
    activeLocationIds = /** @type {string[]} */ (
      focusedHub
        ? [focusZone, ...(focusedHub.subAreas ?? []).map((subArea) => subArea.id)].filter(
            (id) => typeof id === 'string' && Boolean(mapData[id])
          )
        : (locationsByRegion[activeRegion] ?? [])
    ),
    activeLocationSet = new Set(activeLocationIds),
    // Routes whose entire wild table is registered in the Pokedex. The Town Map
    // tints these so a finished route is obvious at a glance.
    completedRoutes = React.useMemo(() => {
      const completed = new Set()
      if (!state.pokedexCaught?.length) return completed
      const caught = new Set(state.pokedexCaught)
      for (const locationId of activeLocationIds) {
        const location = mapData[locationId],
          encounters = location?.routeKey ? encounterData[location.routeKey]?.encounters : null
        if (location?.type !== 'route' || !encounters?.length) continue
        if (encounters.every((entry) => caught.has(entry.speciesKey))) completed.add(locationId)
      }
      return completed
    }, [activeLocationIds, state.pokedexCaught])

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

  // Roads are laid out with the least-overlapping elbow per edge, in a stable
  // order so the map draws the same way every tick.
  const roadPaths = React.useMemo(
    () => createRoadPaths(activeLocationIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeLocationIds.join('|')]
  )

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
    // Focused area view: fit the hub and all its sub-areas (hidden included).
    if (focusZone) {
      const ids = activeLocationIds.filter((id) => mapData[id])
      if (ids.length) {
        const xs = ids.map((id) => mapData[id].position.x),
          ys = ids.map((id) => mapData[id].position.y),
          cx = (Math.min(...xs) + Math.max(...xs)) / 2,
          cy = (Math.min(...ys) + Math.max(...ys)) / 2,
          span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1),
          boxPx = Math.max((span / 100) * WORLD_SIZE, 1),
          // Fit the area's bounding box into ~85% of the smaller canvas side.
          scale = Math.min(
            MAX_SCALE,
            Math.max(MIN_SCALE, (Math.min(rect.width, rect.height) * 0.85) / boxPx)
          )
        centreOn((cx / 100) * WORLD_SIZE, (cy / 100) * WORLD_SIZE, scale)
      }
      return
    }
    const requested = focusRef.current
    focusRef.current = null
    // A hidden sub-area (Alola's islands, Paldea's provinces) is not drawn on
    // the map, so fall back to its zone hub. Focusing on the region centre
    // instead used to land between nodes and leave the map looking blank.
    const hiddenZone = mapData[currentLocation]?.zone,
      focusId =
        requested && displayRegionFor(mapData[requested]?.region ?? 'kanto') === activeRegion
          ? requested
          : activeLocationSet.has(currentLocation)
            ? currentLocation
            : hiddenZone && activeLocationSet.has(hiddenZone)
              ? hiddenZone
              : null,
      // Zoomed in on a real node, but fit the whole region when there is nothing
      // to focus (an empty map, or a sub-area whose hub isn't visible).
      scale = focusId
        ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.max(1, fitScale)))
        : Math.min(MAX_SCALE, Math.max(MIN_SCALE, fitScale)),
      focus = focusId
        ? mapData[focusId].position
        : { x: (regionCentre.x / WORLD_SIZE) * 100, y: (regionCentre.y / WORLD_SIZE) * 100 }
    centreOn((focus.x / 100) * WORLD_SIZE, (focus.y / 100) * WORLD_SIZE, scale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegion, focusNonce, focusZone])

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
    if (!drag.pointers.has(event.pointerId)) return
    drag.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    // Two fingers pinch-zoom around their midpoint. Each move applies the
    // incremental scale so the point under the fingers stays put.
    if (drag.pointers.size >= 2) {
      const points = [...drag.pointers.values()],
        dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
      if (drag.pinchDist > 0 && dist > 0) {
        const midX = (points[0].x + points[1].x) / 2,
          midY = (points[0].y + points[1].y) / 2
        zoomAt(midX, midY, dist / drag.pinchDist)
      }
      drag.pinchDist = dist
      drag.moved = true
      return
    }
    if (!drag.active || event.pointerId !== drag.pointerId) return
    const dx = event.clientX - drag.startX,
      dy = event.clientY - drag.startY
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true
    setView((previous) => ({ ...previous, x: drag.originX + dx, y: drag.originY + dy }))
  }

  /** @param {PointerEvent} event */
  function endDrag(event) {
    const drag = dragRef.current
    drag.pointers.delete(event.pointerId)
    if (drag.pointers.size < 2) drag.pinchDist = 0
    // Keep going while any finger is down; a lifted finger never resumes the
    // pan (a fresh touch will), so the origin can't go stale.
    if (drag.pointers.size > 0) return
    drag.active = false
    window.removeEventListener('pointermove', moveDrag)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
  }

  /** @param {React.PointerEvent<HTMLDivElement>} event */
  function handlePointerDown(event) {
    if (event.button !== 0) return
    const drag = dragRef.current
    drag.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    drag.moved = false
    if (drag.pointers.size === 1) {
      ;(drag.active = true),
        (drag.pointerId = event.pointerId),
        (drag.startX = event.clientX),
        (drag.startY = event.clientY),
        (drag.originX = view.x),
        (drag.originY = view.y)
    } else {
      // A second pointer starts a pinch: stop panning and record the gap.
      drag.active = false
      const points = [...drag.pointers.values()]
      drag.pinchDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
    }
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

  // The marker labels are `pointer-events: none` so they never swallow a click
  // meant for a marker behind them. That also means a click on a label falls
  // through to the canvas, so recover it: when the click did not land on any
  // marker (its dot), and a visible label sits under the pointer, treat it as a
  // click on that marker. A dot under a label still wins, because then the
  // click target is the dot and this is skipped.
  /** @param {React.MouseEvent<HTMLDivElement>} event */
  function handleCanvasClick(event) {
    const target = event.target
    if (!(target instanceof Element) || target.closest('.map-node, button, input, select, textarea, .map-legend, .map-search'))
      return
    const canvas = canvasRef.current
    if (!canvas) return
    const x = event.clientX,
      y = event.clientY
    /** @type {HTMLElement | null} */
    let matchedLabel = null
    for (const node of canvas.querySelectorAll('.map-node')) {
      const label = node.querySelector('.map-node-label')
      if (!(label instanceof HTMLElement)) continue
      const rect = label.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
        // Later nodes are painted on top, so the last hit wins.
        matchedLabel = label
    }
    matchedLabel?.click()
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
    setFocusZone(null)
    setActiveRegion(displayRegionFor(location.region ?? 'kanto'))
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
          jsx(DayPhaseChip, {}),
          jsx(WeatherChip, {}),
          jsx('button', {
            type: 'button',
            className: `map-search-toggle${searchOpen ? ' active' : ''}`,
            title: 'Search locations',
            onClick: () => {
              // Collapsing clears the query so the map isn't left filtered.
              if (searchOpen) setSearchQuery('')
              setSearchOpen(!searchOpen)
            },
            children: '\u{1f50d}',
          }),
          jsx('button', {
            type: 'button',
            className: `map-legend-toggle${legendOpen ? ' active' : ''}`,
            title: 'Map legend',
            onClick: () => setLegendOpen(!legendOpen),
            children: '\u2139',
          }),
        ],
      }),
      searchOpen &&
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
        !focusZone &&
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
      !focusZone &&
        jsx('div', {
          className: 'map-region-tabs',
        children: regionOrder.map((region) => {
          const ids = locationsByRegion[region.id] ?? [],
            available = ids.some((id) => unlockedLocations.includes(id)),
            // DLC expansions are opened by beating their parent region's
            // Champion, never with an Unlock Token.
            unlockable = !available && unlockTokens > 0 && !region.isDlc,
            parentName =
              region.isDlc && region.parentRegion
                ? (regions.find((candidate) => candidate.id === region.parentRegion)?.name ??
                  region.parentRegion)
                : null,
            pending = pendingUnlock === region.id
          return jsx(
            'button',
            {
              className: `map-region-tab${activeRegion === region.id ? ' active' : ''}${available ? '' : ' locked'}${pending ? ' unlocking' : ''}${unlockable ? ' unlockable' : ''}`,
              onClick: available
                ? () => {
                    setActiveRegion(region.id)
                    setPendingUnlock(null)
                    setFocusZone(null)
                  }
                : unlockable
                  ? () => setPendingUnlock(pending ? null : region.id)
                  : void 0,
              disabled: !available && !unlockable,
              title: available
                ? region.name
                : region.isDlc
                  ? `Locked — beat the ${parentName} Champion to open`
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
        !focusZone &&
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
      focusZone &&
        jsxs('div', {
          className: 'map-focus-bar',
          children: [
            jsx('button', {
              type: 'button',
              className: 'map-focus-back',
              onClick: () => {
                setFocusZone(null)
                setFocusNonce((nonce) => nonce + 1)
              },
              children: '\u2190 Region map',
            }),
            jsx('span', {
              className: 'map-focus-title',
              children: focusedHub?.name ?? 'Area',
            }),
            jsx('span', {
              className: 'map-focus-hint',
              children: `${Math.max(0, activeLocationIds.length - 1)} areas`,
            }),
          ],
        }),
      jsxs('div', {
        className: 'town-map-canvas',
        ref: canvasRef,
        onPointerDown: handlePointerDown,
        onClickCapture: handleClickCapture,
        onClick: handleCanvasClick,
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
                className: 'town-map-terrain',
                viewBox: '0 0 100 100',
                preserveAspectRatio: 'none',
                children: [
                  jsxs('defs', {
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
                viewBox: '0 0 100 100',
                preserveAspectRatio: 'none',
                children: [
                  roadPaths.map(({ from: fromId, to: toId, key, d }) => {
                    const roadClass = `map-road-border${unlockedLocations.includes(fromId) && unlockedLocations.includes(toId) ? ' unlocked' : ' locked'}`
                    return jsx('path', { d, className: roadClass }, `border-${key}`)
                  }),
                  roadPaths.map(({ from: fromId, to: toId, key, d }) => {
                    const roadClass = `map-road-fill${unlockedLocations.includes(fromId) && unlockedLocations.includes(toId) ? ' unlocked' : ' locked'}`
                    return jsx('path', { d, className: roadClass }, `fill-${key}`)
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
                  // A zone/DLC hub is clickable even while you stand on it, since
                  // clicking opens its focused area map rather than travelling.
                  isClickable =
                    isUnlocked && (!isCurrent || location.type === 'zone') && !onCooldown
                return jsx(
                  MapNode,
                  {
                    location,
                    isCurrent,
                    isUnlocked,
                    isClickable,
                    onClick: () => {
                      // Clicking an area opens its zoomed-in map (#60); inside
                      // that map the hub itself travels to the hub panel.
                      if (location.type === 'zone' && locationId !== focusZone) {
                        setFocusZone(locationId)
                        return
                      }
                      travelTo(locationId)
                    },
                    cooldownEnd: location.type === 'raid' ? state.raidCooldownEnd : void 0,
                    allCaught: completedRoutes.has(locationId),
                    forceLabel: Boolean(focusZone),
                    // Deliberately omits the species: the Town Map should only
                    // say a swarm is active here, not spoil which Pokemon.
                    swarmLabel:
                      state.swarm?.routeKey === locationId
                        ? `${state.swarm.battlesRemaining} battle${state.swarm.battlesRemaining === 1 ? '' : 's'} left`
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
          legendOpen &&
            jsxs('div', {
              className: 'map-legend',
              onPointerDown: stopDrag,
              children: [
                jsx('div', {
                  className: 'map-legend-title',
                  children: 'Legend',
                }),
                jsxs('div', {
                  className: 'map-legend-items',
                  children: [
                    ['legend-town', 'Town'],
                    ['legend-route', 'Route'],
                    ['legend-complete', 'All Pokemon caught'],
                    ['legend-zone', 'Area / zone hub'],
                    ['legend-raid', 'Raid Island'],
                    ['legend-current', 'You are here'],
                    ['legend-poi', 'Minigame / service'],
                  ].map(([swatch, label]) =>
                    jsxs(
                      'div',
                      {
                        className: 'map-legend-item',
                        children: [
                          jsx('span', {
                            className: `map-legend-swatch ${swatch}`,
                          }),
                          label,
                        ],
                      },
                      swatch
                    )
                  ),
                }),
                servicePoiKinds().length > 0 &&
                  jsxs('div', {
                    className: 'map-legend-items',
                    children: [
                      jsx('div', {
                        className: 'map-legend-title',
                        children: 'Services',
                      }),
                      ...servicePoiKinds().map((poi) =>
                        jsxs(
                          'div',
                          {
                            className: 'map-legend-item',
                            children: [
                              jsx('span', { className: 'map-legend-icon', children: poi.icon }),
                              poi.label,
                            ],
                          },
                          poi.kind
                        )
                      ),
                    ],
                  }),
              ],
            }),
          jsx('div', {
            className: 'map-pan-hint',
            children: 'Drag to pan · pinch or +/\u2212 to zoom',
          }),
        ],
      }),
    ],
  })
}
