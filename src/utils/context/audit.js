import { genId, nowIso } from '../format.js'

// Sistema de auditoría para registrar todas las acciones
export const auditLogger = {
  // Crear entrada de log
  createLogEntry: (action, userId, details = {}) => ({
    id: genId('log'),
    timestamp: nowIso(),
    userId,
    action: action.type,
    payload: action.payload,
    details,
    userAgent: navigator.userAgent.substring(0, 100) // Limitado para no saturar
  }),

  // Filtrar logs por usuario
  filterByUser: (logs, userId) => logs.filter(log => log.userId === userId),

  // Filtrar logs por acción
  filterByAction: (logs, actionType) => logs.filter(log => log.action === actionType),

  // Filtrar logs por rango de fechas
  filterByDateRange: (logs, startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return logs.filter(log => {
      const logDate = new Date(log.timestamp)
      return logDate >= start && logDate <= end
    })
  },

  // Obtener resumen de actividad por usuario
  getUserActivitySummary: (logs, userId) => {
    const userLogs = auditLogger.filterByUser(logs, userId)
    const actionCounts = {}
    
    userLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })
    
    return {
      userId,
      totalActions: userLogs.length,
      actionBreakdown: actionCounts,
      lastActivity: userLogs[userLogs.length - 1]?.timestamp,
      firstActivity: userLogs[0]?.timestamp
    }
  },

  // Obtener acciones más frecuentes
  getMostFrequentActions: (logs, limit = 10) => {
    const actionCounts = {}
    
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })
    
    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([action, count]) => ({ action, count }))
  }
}

// Middleware para interceptar acciones y crear logs
export const auditMiddleware = (state, action, currentUserId) => {
  // No loggear acciones internas del sistema
  const excludedActions = ['@@INIT', 'persist/REHYDRATE']
  if (excludedActions.includes(action.type)) {
    return state
  }
  
  const logEntry = auditLogger.createLogEntry(action, currentUserId, {
    previousState: {
      productsCount: state.products?.length || 0,
      ordersCount: state.orders?.length || 0,
      categoriesCount: state.categories?.length || 0
    }
  })
  
  // Mantener solo los últimos 1000 logs para no saturar el storage
  const updatedLogs = [...(state.auditLogs || []), logEntry].slice(-1000)
  
  return {
    ...state,
    auditLogs: updatedLogs
  }
}