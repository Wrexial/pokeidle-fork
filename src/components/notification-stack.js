// Toast notifications — see PUSH_NOTIFICATION / withNotification in the reducer.
// Rendered from GameLayout so toasts appear on every screen.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'

/** How long a toast stays on screen before it fades out. */
const TOAST_DURATION_MS = 4500

/** @param {{ notification: GameNotification, dismiss: (id: number) => void }} props */
function NotificationToast({ notification, dismiss }) {
  return (
    React.useEffect(() => {
      const timeoutId = setTimeout(() => dismiss(notification.id), TOAST_DURATION_MS)
      return () => clearTimeout(timeoutId)
    }, [notification.id, dismiss]),
    jsxs('div', {
      className: `notification-toast notification-${notification.tone}`,
      role: 'status',
      onClick: () => dismiss(notification.id),
      children: [
        notification.icon &&
          jsx('span', {
            className: 'notification-icon',
            children: notification.icon,
          }),
        jsx('span', {
          className: 'notification-message',
          children: notification.message,
        }),
      ],
    })
  )
}

export function NotificationStack() {
  const { state, dispatch } = useGame(),
    dismiss = React.useCallback(
      /** @param {number} id */ (id) =>
        dispatch({
          type: 'DISMISS_NOTIFICATION',
          payload: {
            id,
          },
        }),
      [dispatch]
    ),
    notifications = state.notifications ?? []
  return notifications.length === 0
    ? null
    : jsx('div', {
        className: 'notification-stack',
        children: notifications.map((notification) =>
          jsx(
            NotificationToast,
            {
              notification,
              dismiss,
            },
            notification.id
          )
        ),
      })
}
