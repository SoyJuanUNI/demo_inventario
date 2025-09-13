import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { appReducer } from './reducers/index.js'
import { loadState, saveState } from '../utils/context/storage.js'
import { saveStateToLocalStorage, loadStateFromLocalStorage } from '../utils/persistence.js'
import { selectors } from '../utils/context/selectors.js'
import { currency } from '../utils/format.js'
import { auditMiddleware } from '../utils/context/audit.js'

export const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Wrapper del dispatch para incluir auditoría
const createAuditedDispatch = (originalDispatch, getCurrentState, getCurrentUserId) => {
  return (action) => {
    const currentState = getCurrentState()
    const currentUserId = getCurrentUserId()
    
    // Ejecutar la acción original
    originalDispatch(action)
    
    // Después de la acción, crear el log de auditoría
    const newState = getCurrentState()
    const auditedState = auditMiddleware(newState, action, currentUserId)
    
    // Solo actualizar si hay cambios en los logs
    if (auditedState.auditLogs !== newState.auditLogs) {
      originalDispatch({ 
        type: '@@AUDIT_UPDATE', 
        payload: { auditLogs: auditedState.auditLogs } 
      })
    }
  }
}

export function AppProvider({ children }) {
  // Cargar estado inicial con persistencia opcional
  const loadInitialState = () => {
    console.log('🔄 Loading initial state...')
    
    // Primero intentar cargar desde sessionStorage (estado normal)
    let sessionState = loadState()
    console.log('📦 Session state:', sessionState ? 'found' : 'not found')
    
    // Si no hay estado en sessionStorage, intentar localStorage si está configurado
    if (!sessionState) {
      const persistentState = loadStateFromLocalStorage()
      console.log('💾 Persistent state:', persistentState ? 'found' : 'not found')
      if (persistentState && persistentState.ui?.rememberSession) {
        return persistentState
      }
    }
    
    console.log('🌱 Returning session state or fallback')
    return sessionState
  }
  
  const [state, originalDispatch] = useReducer(appReducer, undefined, loadInitialState)

  // Crear dispatch con auditoría
  const getCurrentState = () => state
  const getCurrentUserId = () => state.currentUser?.id || 'system'
  const dispatch = useMemo(
    () => createAuditedDispatch(originalDispatch, getCurrentState, getCurrentUserId),
    [state.currentUser?.id]
  )

  // Auto-save state to sessionStorage (always)
  useEffect(() => {
    saveState(state)
  }, [state])

  // Auto-save to localStorage if persistence is enabled
  useEffect(() => {
    if (state.ui?.rememberSession && state.ui?.persistentStorage) {
      saveStateToLocalStorage(state)
    }
  }, [state, state.ui?.rememberSession, state.ui?.persistentStorage])

  // Apply theme to document element
  useEffect(() => {
    const el = document.documentElement
    if (state.theme === 'light') {
      el.setAttribute('data-theme', 'light')
    } else {
      el.removeAttribute('data-theme')
    }
  }, [state.theme])

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    selectors,
    currency
  }), [state, dispatch])

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}
