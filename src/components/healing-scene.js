// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'

export function HealingScene() {
  const { state, dispatch } = useGame(),
    healingState = state.healingState,
    videoRef = React.useRef(/** @type {HTMLVideoElement | null} */ (null))
  if (
    (React.useEffect(() => {
      if (!healingState) return
      const speed = state.speed || 1
      const healTimeout = setTimeout(() => {
          dispatch({
            type: 'HEALING_STEP',
            payload: {
              step: 'healing',
            },
          })
        }, 250 / speed),
        doneTimeout = setTimeout(() => {
          dispatch({
            type: 'HEALING_STEP',
            payload: {
              step: 'done',
            },
          })
        }, 3e3 / speed),
        completeTimeout = setTimeout(() => {
          dispatch({
            type: 'COMPLETE_HEALING',
          })
        }, 3750 / speed)
      return () => {
        ;(clearTimeout(healTimeout), clearTimeout(doneTimeout), clearTimeout(completeTimeout))
      }
    }, [dispatch, state.speed]),
    React.useEffect(() => {
      if (!healingState) return
      const video = videoRef.current
      if (!video) return
      const handleCanPlay = () => {
        ;((video.currentTime = 0), (video.playbackRate = 2.5), video.play().catch(() => {}))
      }
      if (video.readyState >= 3) handleCanPlay()
      else
        return (
          video.addEventListener('canplay', handleCanPlay, {
            once: !0,
          }),
          () => video.removeEventListener('canplay', handleCanPlay)
        )
    }, [healingState]),
    !healingState)
  )
    return null
  const message =
    healingState.step === 'done'
      ? 'Your Pokemon are fully healed!'
      : 'Healing your Pokemon...'
  return jsxs('div', {
    className: 'heal-scene',
    children: [
      jsx('video', {
        ref: videoRef,
        className: 'heal-video',
        src: '/heal-animation-web.mp4',
        muted: !0,
        playsInline: !0,
        preload: 'auto',
      }),
      healingState.step === 'healing' &&
        jsx('div', {
          className: 'heal-flash-overlay',
        }),
      healingState.step === 'done' &&
        jsx('div', {
          className: 'heal-done-flash',
        }),
      jsx('div', {
        className: 'heal-text',
        children: jsx('p', {
          children: message,
        }),
      }),
    ],
  })
}
