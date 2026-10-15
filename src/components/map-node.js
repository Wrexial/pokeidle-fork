// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { formatCooldown } from '../game/progression.js'
import { POI_LOCATIONS, minigameNameForLocation } from '../game/minigames.js'
import { servicePoisFor } from '../game/services.js'

/** @param {{ location: MapLocation, isCurrent: boolean, isUnlocked: boolean, isClickable: boolean, onClick: () => void, cooldownEnd?: number, allCaught?: boolean, swarmLabel?: string | null, forceLabel?: boolean, labelsVisible?: boolean, labelAbove?: boolean }} props */
export
function MapNode({
  location,
  isCurrent,
  isUnlocked,
  isClickable,
  onClick,
  cooldownEnd,
  allCaught,
  swarmLabel,
  forceLabel,
  labelsVisible = true,
  labelAbove = false,
}) {
  const [hovering, setHovering] = React.useState(!1),
    [, tick] = React.useState(0),
    isTown = location.type === 'town' || location.type === 'hideout',
    isRaid = location.type === 'raid',
    isZone = location.type === 'zone',
    zoneCount = isZone ? (location.subAreas?.length ?? 0) : 0,
    isPoi = isUnlocked && POI_LOCATIONS.has(location.id),
    minigameName = isUnlocked ? minigameNameForLocation(location.id) : null,
    servicePois = isUnlocked ? servicePoisFor(location.id) : [],
    locationName = isUnlocked ? location.name : '???',
    timeNow = Date.now(),
    raidOnCooldown = isRaid && cooldownEnd != null && timeNow < cooldownEnd
  React.useEffect(() => {
    if (!raidOnCooldown) return
    const intervalId = setInterval(() => tick((tickCount) => tickCount + 1), 1e3)
    return () => clearInterval(intervalId)
  }, [raidOnCooldown])
  // Labels scale with the zoomed world, so below a readable size they're only
  // noise; show them when zoomed in (or on hover, one at a time, or in the
  // focused area view).
  const showLabel =
    forceLabel ||
    hovering ||
    (labelsVisible && (isCurrent || (isUnlocked && (isTown || isZone))))
  let className = 'map-node'
  return (
    isRaid ? (className += ' raid') : isTown ? (className += ' town') : isZone ? (className += ' zone') : (className += ' route'),
    raidOnCooldown && (className += ' cooldown'),
    isUnlocked && allCaught && (className += ' complete'),
    swarmLabel && (className += ' swarm'),
    labelAbove && (className += ' label-above'),
    isCurrent
      ? (className += ' current')
      : isClickable
        ? (className += ' clickable')
        : isUnlocked || (className += ' locked'),
    jsxs('div', {
      className,
      'data-location-id': location.id,
      style: {
        left: `${location.position.x}%`,
        top: `${location.position.y}%`,
      },
      onClick: isClickable ? onClick : void 0,
      title: isUnlocked
        ? [
            location.description,
            allCaught ? 'All wild Pokemon here are caught' : null,
            isZone && zoneCount > 0 ? `Zone hub \u2014 ${zoneCount} areas (click to open the area map)` : null,
            minigameName ? `Minigame: ${minigameName}` : null,
            servicePois.length > 0
              ? `Services: ${servicePois.map((poi) => poi.label).join(', ')}`
              : null,
            swarmLabel ? `Swarm: ${swarmLabel}` : null,
          ]
            .filter(Boolean)
            .join(' \u2014 ')
        : 'Unknown location',
      onMouseEnter: () => setHovering(!0),
      onMouseLeave: () => setHovering(!1),
      children: [
        jsx('div', {
          className: 'map-node-dot',
          children:
            isCurrent &&
            jsx('div', {
              className: 'map-node-blink',
            }),
        }),
        swarmLabel &&
          jsx('span', {
            className: 'map-node-swarm',
            children: '\u{1f41d}',
          }),
        zoneCount > 0 &&
          jsx('span', {
            className: 'map-node-zone-count',
            title: `${zoneCount} areas`,
            children: zoneCount,
          }),
        isPoi || servicePois.length > 0
          ? jsxs('div', {
              className: 'map-node-pois',
              children: [
                isPoi &&
                  jsx('span', {
                    className: 'map-node-poi',
                    title: minigameName ?? 'Minigame',
                    children: '+',
                  }),
                ...servicePois.map((poi) =>
                  jsx(
                    'span',
                    {
                      className: 'map-node-poi service',
                      title: poi.label,
                      children: poi.icon,
                    },
                    poi.kind
                  )
                ),
              ],
            })
          : null,
        showLabel &&
          jsx('span', {
            className: 'map-node-label',
            children: locationName,
          }),
        raidOnCooldown &&
          cooldownEnd &&
          jsx('span', {
            className: 'raid-cooldown-timer',
            children: formatCooldown(cooldownEnd - Date.now()),
          }),
      ],
    })
  )
}
