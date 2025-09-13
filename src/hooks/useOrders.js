import { useApp } from '../context/AppContext.jsx'
import { validateTableName, validateOrderItem } from '../utils/validation.js'
import { useNotifications } from './useNotifications.js'

export const useOrders = () => {
  const { state, dispatch } = useApp()
  const { showToast } = useNotifications()

  // Configuración para nombres duplicados de mesa
  const allowDuplicateTableNames = state.ui?.allowDuplicateTableNames ?? true

  const createOrder = (name) => {
    const existingTableNames = state.orders.map(order => order.name)
    const validation = validateTableName(name, existingTableNames, allowDuplicateTableNames)
    
    if (!validation.isValid) {
      validation.errors.forEach(error => showToast(error, 'error'))
      return { success: false, errors: validation.errors }
    }
    
    // Mostrar warnings si los hay (para nombres duplicados cuando están permitidos)
    validation.warnings.forEach(warning => showToast(warning, 'warn'))
    
    dispatch({ type: 'createOrder', payload: { name: validation.tableName } })
    return { success: true, warnings: validation.warnings }
  }

  const addItemToOrder = (orderId, productId, options = {}) => {
    const product = state.products.find(p => p.id === productId)
    if (!product) {
      showToast('Producto no encontrado', 'error')
      return { success: false, errors: ['Producto no encontrado'] }
    }
    
    // Validar item con quantity y price del producto
    const itemToValidate = {
      qty: options.qty || 1,
      price: product.price,
      productId
    }
    
    const validation = validateOrderItem(itemToValidate)
    
    if (!validation.isValid) {
      validation.errors.forEach(error => showToast(error, 'error'))
      return { success: false, errors: validation.errors }
    }
    
    // Mostrar warnings si los hay
    validation.warnings.forEach(warning => showToast(warning, 'warn'))
    
    dispatch({ 
      type: 'addItem', 
      payload: { 
        orderId, 
        productId, 
        qty: validation.item.qty,
        ...options 
      } 
    })
    return { success: true, warnings: validation.warnings }
  }

  const removeItemFromOrder = (orderId, itemId) => {
    dispatch({ type: 'removeItem', payload: { orderId, itemId } })
  }

  const finalizeOrder = (orderId) => {
    dispatch({ type: 'finalizeOrder', payload: { orderId } })
  }

  const cancelOrder = (orderId) => {
    dispatch({ type: 'cancelOrder', payload: { orderId } })
  }

  const reopenOrder = (orderId) => {
    dispatch({ type: 'reopenOrder', payload: { orderId } })
  }

  const updateOrderNotes = (orderId, notes) => {
    dispatch({ type: 'updateOrderNotes', payload: { orderId, notes } })
  }

  const updateItemNotes = (orderId, itemId, notes) => {
    dispatch({ type: 'updateItemNotes', payload: { orderId, itemId, notes } })
  }

  const transferOrder = (fromOrderId, toOrderId) => {
    dispatch({ type: 'transferOrder', payload: { fromOrderId, toOrderId } })
  }

  const transferItems = (fromOrderId, toOrderId, items) => {
    dispatch({ type: 'transferItems', payload: { fromOrderId, toOrderId, items } })
  }

  const splitOrder = (orderId, items, newOrderName) => {
    dispatch({ type: 'splitOrder', payload: { orderId, items, newOrderName } })
  }

  const getOpenOrders = () => state.orders.filter(o => o.status === 'open')
  
  const getOrdersByStatus = (status) => state.orders.filter(o => o.status === status)
  
  const getOrdersByUser = (userId) => state.orders.filter(o => o.createdBy === userId)
  
  const getOrderTotal = (order) => 
    order.items.reduce((sum, item) => sum + (item.qty * item.price), 0)

  return {
    orders: state.orders,
    createOrder,
    addItemToOrder,
    removeItemFromOrder,
    finalizeOrder,
    cancelOrder,
    reopenOrder,
    updateOrderNotes,
    updateItemNotes,
    transferOrder,
    transferItems,
    splitOrder,
    getOpenOrders,
    getOrdersByStatus,
    getOrdersByUser,
    getOrderTotal
  }
}