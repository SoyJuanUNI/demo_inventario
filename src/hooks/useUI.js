import { useApp } from '../context/AppContext.jsx'
import { 
  saveStateToLocalStorage, 
  loadStateFromLocalStorage, 
  clearLocalStorage,
  saveSettings,
  loadSettings,
  isLocalStorageAvailable,
  getStorageSize,
  formatStorageSize
} from '../utils/persistence.js'

export const useUI = () => {
  const { state, dispatch } = useApp()

  const setTheme = (theme) => {
    dispatch({ type: 'setTheme', payload: theme })
  }

  const toggleTheme = () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const setEmployeeTargetOrderId = (orderId) => {
    dispatch({ type: 'setEmployeeTargetOrderId', payload: { orderId } })
  }

  const setTableDensity = (density) => {
    dispatch({ type: 'setTableDensity', payload: { density } })
  }

  const toggleTableDensity = () => {
    const newDensity = state.ui.tableDensity === 'comfortable' ? 'compact' : 'comfortable'
    setTableDensity(newDensity)
  }

  const setAllowDuplicateTableNames = (allow) => {
    dispatch({ type: 'setAllowDuplicateTableNames', payload: { allow } })
  }

  const setRememberSession = (remember) => {
    dispatch({ type: 'setRememberSession', payload: { remember } })
    
    if (remember) {
      // Activar persistencia inmediatamente
      setPersistentStorage(true)
      saveStateToLocalStorage(state)
    } else {
      // Desactivar persistencia y limpiar
      setPersistentStorage(false)
      clearLocalStorage()
    }
  }

  const setPersistentStorage = (persistent) => {
    dispatch({ type: 'setPersistentStorage', payload: { persistent } })
  }

  // Información sobre el almacenamiento
  const getStorageInfo = () => {
    if (!isLocalStorageAvailable()) {
      return {
        available: false,
        size: 0,
        formattedSize: '0 Bytes',
        persistent: false
      }
    }

    const size = getStorageSize()
    return {
      available: true,
      size,
      formattedSize: formatStorageSize(size),
      persistent: state.ui?.persistentStorage || false
    }
  }

  return {
    theme: state.theme,
    ui: state.ui,
    setTheme,
    toggleTheme,
    setEmployeeTargetOrderId,
    setTableDensity,
    toggleTableDensity,
    setAllowDuplicateTableNames,
    setRememberSession,
    setPersistentStorage,
    getStorageInfo
  }
}