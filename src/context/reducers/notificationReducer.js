import { genId, nowIso } from '../../utils/format.js'

export const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'notify': {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { id: genId('ntf'), ...action.payload, ts: nowIso() }
        ]
      }
    }

    case 'dismissNotification': {
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    }

    default:
      return state
  }
}