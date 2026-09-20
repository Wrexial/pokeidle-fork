// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { legendaryPoolFor, mapAreas, mapData, regions } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { createRoads } from '../game/progression.js'
import { MapNode } from './map-node.js'

export function TownMap() {
  const { state, dispatch } = useGame(),
    { currentLocation, unlockedLocations } = state,
    currentLocationData = mapData[currentLocation],
    currentRegion = currentLocationData?.region ?? 'kanto',
    [activeRegion, setActiveRegion] = React.useState(currentRegion)

  // follow the player when they travel between regions
  React.useEffect(() => {
    setActiveRegion(currentRegion)
  }, [currentRegion])

  /** @param {string} location */
  function travelTo(location) {
    const locationData = mapData[location]
    if (locationData?.type === 'raid') {
      if (state.raidCooldownEnd && Date.now() < state.raidCooldownEnd) return
      const pool = legendaryPoolFor(locationData.region ?? 'kanto')
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
    ],
  })
}
