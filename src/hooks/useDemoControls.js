import { useApp } from '../context/AppContext.jsx'
import { useNotifications } from './useNotifications.js'
import { seed } from '../data/seed.js'
import { 
  createSnapshot, 
  restoreSnapshot, 
  listSnapshots, 
  deleteSnapshot,
  clearLocalStorage 
} from '../utils/persistence.js'

export const useDemoControls = () => {
  const { state, dispatch } = useApp()
  const { showToast } = useNotifications()

  // Restablecer a estado inicial (seed)
  const resetToInitialState = () => {
    try {
      // Crear snapshot del estado actual antes de resetear
      const snapshotResult = createSnapshot(state, 'before_reset')
      
      if (snapshotResult.success) {
        showToast('Se creó un respaldo del estado actual', 'success')
      }

      // Despachar acción para resetear al seed
      dispatch({ type: 'RESET_TO_SEED', payload: seed })
      
      showToast('Demo restablecida al estado inicial', 'success')
      return { success: true }
    } catch (error) {
      console.error('Error al restablecer demo:', error)
      showToast('Error al restablecer demo', 'error')
      return { success: false, error }
    }
  }

  // Crear snapshot manual
  const createManualSnapshot = (name = null) => {
    const snapshotName = name || `manual_${Date.now()}`
    const result = createSnapshot(state, snapshotName)
    
    if (result.success) {
      showToast(`Snapshot "${snapshotName}" creado exitosamente`, 'success')
      return { success: true, snapshot: result.snapshot }
    } else {
      showToast('Error al crear snapshot', 'error')
      return { success: false, error: result.error }
    }
  }

  // Restaurar desde snapshot
  const restoreFromSnapshot = (name) => {
    const result = restoreSnapshot(name)
    
    if (result.success) {
      dispatch({ type: 'RESTORE_FROM_SNAPSHOT', payload: result.state })
      showToast(`Estado restaurado desde "${name}"`, 'success')
      return { success: true }
    } else {
      showToast(`Error: ${result.error}`, 'error')
      return { success: false, error: result.error }
    }
  }

  // Obtener lista de snapshots
  const getSnapshots = () => {
    return listSnapshots()
  }

  // Eliminar snapshot
  const removeSnapshot = (name) => {
    const success = deleteSnapshot(name)
    
    if (success) {
      showToast(`Snapshot "${name}" eliminado`, 'success')
      return { success: true }
    } else {
      showToast('Error al eliminar snapshot', 'error')
      return { success: false }
    }
  }

  // Limpiar todos los datos persistentes
  const clearAllStorageData = () => {
    const success = clearLocalStorage()
    
    if (success) {
      showToast('Todos los datos persistentes han sido eliminados', 'success')
      return { success: true }
    } else {
      showToast('Error al limpiar datos persistentes', 'error')
      return { success: false }
    }
  }

  // Generar datos de prueba adicionales
  const generateTestData = () => {
    const testOrders = []
    const tableNames = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Barra', 'Terraza A', 'VIP 1']
    const productIds = state.products.map(p => p.id)
    
    // Crear órdenes de prueba
    for (let i = 0; i < 6; i++) {
      const orderId = `test_order_${i + 1}`
      const order = {
        id: orderId,
        name: tableNames[i],
        items: [],
        status: Math.random() > 0.3 ? 'open' : 'closed',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: i % 3 === 0 ? 'Orden de prueba generada' : ''
      }

      // Agregar items aleatorios
      const numItems = Math.floor(Math.random() * 4) + 1
      for (let j = 0; j < numItems; j++) {
        const productId = productIds[Math.floor(Math.random() * productIds.length)]
        const product = state.products.find(p => p.id === productId)
        
        if (product) {
          order.items.push({
            id: `${orderId}_item_${j + 1}`,
            productId,
            qty: Math.floor(Math.random() * 3) + 1,
            price: product.price,
            notes: j === 0 && Math.random() > 0.7 ? 'Sin cebolla' : ''
          })
        }
      }

      testOrders.push(order)
    }

    // Agregar órdenes de prueba al estado
    testOrders.forEach(order => {
      dispatch({ type: 'CREATE_TEST_ORDER', payload: order })
    })

    showToast(`Se generaron ${testOrders.length} órdenes de prueba`, 'success')
    return { success: true, ordersCreated: testOrders.length }
  }

  // Limpiar datos de prueba
  const clearTestData = () => {
    dispatch({ type: 'CLEAR_TEST_DATA' })
    showToast('Datos de prueba eliminados', 'success')
    return { success: true }
  }

  return {
    resetToInitialState,
    createManualSnapshot,
    restoreFromSnapshot,
    getSnapshots,
    removeSnapshot,
    clearAllStorageData,
    generateTestData,
    clearTestData
  }
}