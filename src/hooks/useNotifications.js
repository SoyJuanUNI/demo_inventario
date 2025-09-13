import { useApp } from '../context/AppContext.jsx'

export const useNotifications = () => {
  const { state, dispatch } = useApp()

  const notify = (type, message) => {
    dispatch({ type: 'notify', payload: { type, message } })
  }

  const notifySuccess = (message) => notify('ok', message)
  
  const notifyError = (message) => notify('error', message)
  
  const notifyWarning = (message) => notify('warn', message)

  const dismissNotification = (id) => {
    dispatch({ type: 'dismissNotification', payload: id })
  }

  return {
    notifications: state.notifications,
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    dismissNotification
  }
}