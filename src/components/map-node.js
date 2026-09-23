// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { formatCooldown } from '../game/progression.js'

/** @param {{ location: MapLocation, isCurrent: boolean, isUnlocked: boolean, isClickable: boolean, onClick: () => void, cooldownEnd?: number, swarmLabel?: string | null }} props */
export
function MapNode({
  location,
  isCurrent,
  isUnlocked,
  isClickable,
  onClick,
  cooldownEnd,
  swarmLabel,
}) {
  const [hovering, setHovering] = React.useState(!1),
    [, tick] = React.useState(0),
    isTown = location.type === 'town',
    isRaid = location.type === 'raid',
    isZone = location.type === 'zone',
    locationName = isUnlocked ? location.name : '???',
    timeNow = Date.now(),
    raidOnCooldown = isRaid && cooldownEnd != null && timeNow < cooldownEnd
  React.useEffect(() => {
    if (!raidOnCooldown) return
    const intervalId = setInterval(() => tick((tickCount) => tickCount + 1), 1e3)
    return () => clearInterval(intervalId)
  }, [raidOnCooldown])
  const showLabel = isCurrent || hovering
  let className = 'map-node'
  return (
    isRaid ? (className += ' raid') : isTown ? (className += ' town') : isZone ? (className += ' zone') : (className += ' route'),
    raidOnCooldown && (className += ' cooldown'),
    swarmLabel && (className += ' swarm'),
    isCurrent
      ? (className += ' current')
      : isClickable
        ? (className += ' clickable')
        : isUnlocked || (className += ' locked'),
    jsxs('div', {
      className,
      style: {
        left: `${location.position.x}%`,
        top: `${location.position.y}%`,
      },
      onClick: isClickable ? onClick : void 0,
      title: isUnlocked
        ? swarmLabel
          ? `${location.description} \u2014 Swarm: ${swarmLabel}`
          : location.description
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
