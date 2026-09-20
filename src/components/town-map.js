// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { legendaryPool } from '../data/config.js'
import { mapAreas, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { createRoads } from '../game/progression.js'
import { MapNode } from './map-node.js'

export function TownMap() {
  const { state, dispatch } = useGame(),
    { currentLocation, unlockedLocations } = state,
    currentLocationData = mapData[currentLocation]
  /** @param {string} location */
  function travelTo(location) {
    if (location === 'raidIsland') {
      if (state.raidCooldownEnd && Date.now() < state.raidCooldownEnd) return
      const legendary = legendaryPool[Math.floor(Math.random() * legendaryPool.length)]
      dispatch({
        type: 'START_RAID',
        payload: {
          legendary: legendary.speciesKey,
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
  const roads = [],
    roadSet = new Set()
  for (const location of Object.values(mapData))
    for (const connectionId of location.connections) {
      const roadKey = [location.id, connectionId].sort().join('-')
      roadSet.has(roadKey) ||
        (roadSet.add(roadKey),
        roads.push({
          from: location.id,
          to: connectionId,
        }))
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
          mapAreas.map((locationId) => {
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
