import { authReducer } from './authReducer.js'
import { notificationReducer } from './notificationReducer.js'
import { productsReducer } from './productsReducer.js'
import { categoriesReducer } from './categoriesReducer.js'
import { ordersReducer } from './ordersReducer.js'
import { uiReducer } from './uiReducer.js'

// Reducer principal que combina todos los reducers especializados
export function appReducer(state, action) {
  // Manejar actualización de logs de auditoría
  if (action.type === '@@AUDIT_UPDATE') {
    return {
      ...state,
      auditLogs: action.payload.auditLogs
    }
  }

  // Manejar reset completo al seed
  if (action.type === 'RESET_TO_SEED') {
    return {
      ...action.payload,
      // Mantener algunas configuraciones del usuario
      theme: state.theme,
      ui: {
        ...action.payload.ui,
        rememberSession: state.ui?.rememberSession || false,
        persistentStorage: state.ui?.persistentStorage || false
      }
    }
  }

  // Manejar restauración desde snapshot
  if (action.type === 'RESTORE_FROM_SNAPSHOT') {
    return {
      ...action.payload,
      // Mantener configuraciones actuales de persistencia
      ui: {
        ...action.payload.ui,
        rememberSession: state.ui?.rememberSession || false,
        persistentStorage: state.ui?.persistentStorage || false
      }
    }
  }

  // Crear orden de prueba
  if (action.type === 'CREATE_TEST_ORDER') {
    return {
      ...state,
      orders: [...state.orders, action.payload]
    }
  }

  // Limpiar datos de prueba
  if (action.type === 'CLEAR_TEST_DATA') {
    return {
      ...state,
      orders: state.orders.filter(order => !order.id.startsWith('test_order_'))
    }
  }

  // Probar cada reducer hasta encontrar uno que maneje la acción
  let newState = state

  // Auth actions
  newState = authReducer(newState, action)
  if (newState !== state) return newState

  // Notification actions
  newState = notificationReducer(newState, action)
  if (newState !== state) return newState

  // Products actions
  newState = productsReducer(newState, action)
  if (newState !== state) return newState

  // Categories actions
  newState = categoriesReducer(newState, action)
  if (newState !== state) return newState

  // Orders actions
  newState = ordersReducer(newState, action)
  if (newState !== state) return newState

  // UI actions
  newState = uiReducer(newState, action)
  if (newState !== state) return newState

  // Si ningún reducer manejó la acción, devolver el estado original
  return state
}