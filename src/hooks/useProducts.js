import { useApp } from '../context/AppContext.jsx'
import { validateProduct, validateOrderItem, LIMITS } from '../utils/validation.js'
import { useNotifications } from './useNotifications.js'

export const useProducts = () => {
  const { state, dispatch } = useApp()
  const { notifyError, notifyWarning, notifySuccess } = useNotifications()

  const addProduct = (product) => {
    const validation = validateProduct(product, state.products)
    
    if (!validation.isValid) {
      validation.errors.forEach(error => notifyError(error))
      return { success: false, errors: validation.errors }
    }
    
    // Mostrar warnings si los hay
    validation.warnings.forEach(warning => notifyWarning(warning))
    
    dispatch({ type: 'addProduct', payload: { product: validation.product } })
    notifySuccess('Producto agregado correctamente')
    return { success: true, product: validation.product, warnings: validation.warnings }
  }

  const updateProduct = (id, patch) => {
    const existingProduct = state.products.find(p => p.id === id)
    if (!existingProduct) {
      notifyError('Producto no encontrado')
      return { success: false, errors: ['Producto no encontrado'] }
    }
    
    const updatedProduct = { ...existingProduct, ...patch }
    const validation = validateProduct(updatedProduct, state.products)
    
    if (!validation.isValid) {
      validation.errors.forEach(error => notifyError(error))
      return { success: false, errors: validation.errors }
    }
    
    // Mostrar warnings si los hay
    validation.warnings.forEach(warning => notifyWarning(warning))
    
    dispatch({ type: 'updateProduct', payload: { id, patch: validation.product } })
    return { success: true, product: validation.product, warnings: validation.warnings }
  }

  const deleteProduct = (id) => {
    dispatch({ type: 'deleteProduct', payload: { id } })
  }

  const restockLowProducts = () => {
    dispatch({ type: 'restockLow' })
  }

  const applyHappyHour = (categoryId, discount) => {
    dispatch({ type: 'applyHappyHour', payload: { categoryId, discount } })
  }

  const removeHappyHour = (categoryId) => {
    dispatch({ type: 'removeHappyHour', payload: { categoryId } })
  }

  const restockProduct = (id, quantity) => {
    dispatch({ type: 'restockProduct', payload: { id, quantity } })
  }

  const bulkUpdateProducts = (productIds, updates) => {
    dispatch({ type: 'bulkUpdateProducts', payload: { productIds, updates } })
  }

  const getProduct = (id) => state.products.find(p => p.id === id)
  
  const getLowStockProducts = () => state.products.filter(p => p.stock <= p.lowStock)
  
  const getProductsByCategory = (categoryId) => 
    state.products.filter(p => p.categoryId === categoryId)

  // Calcular stock comprometido (en órdenes abiertas)
  const getCommittedStock = (productId) => {
    const openOrders = state.orders.filter(o => o.status === 'open')
    let committed = 0
    
    for (const order of openOrders) {
      for (const item of order.items) {
        if (item.productId === productId) {
          committed += item.qty
        }
      }
    }
    
    return committed
  }

  // Calcular stock disponible real (stock - comprometido)
  const getAvailableStock = (productId) => {
    const product = getProduct(productId)
    if (!product) return 0
    
    const committed = getCommittedStock(productId)
    return Math.max(0, product.stock - committed)
  }

  // Obtener resumen completo de stock para un producto
  const getStockSummary = (productId) => {
    const product = getProduct(productId)
    if (!product) return null
    
    const committed = getCommittedStock(productId)
    const available = getAvailableStock(productId)
    
    return {
      total: product.stock,
      committed,
      available,
      lowStock: product.lowStock,
      isLow: available <= product.lowStock
    }
  }

  const isHappyHour = (product) => {
    if (!product.happyHourDiscount || product.happyHourDiscount <= 0) return false
    const now = new Date()
    const hours = now.getHours()
    return hours >= (product.happyHourStart || 17) && hours < (product.happyHourEnd || 19)
  }

  const getProductPrice = (product, discount = 0) => {
    let finalPrice = product.price
    
    // Aplicar descuento manual
    if (discount > 0) {
      finalPrice = finalPrice * (1 - discount / 100)
    }
    
    // Aplicar descuento de happy hour si está activo
    if (isHappyHour(product)) {
      finalPrice = finalPrice * (1 - product.happyHourDiscount / 100)
    }
    
    return finalPrice
  }

  return {
    products: state.products,
    addProduct,
    updateProduct,
    deleteProduct,
    restockLow: restockLowProducts,
    restockProduct,
    bulkUpdateProducts,
    applyHappyHour,
    removeHappyHour,
    getProduct,
    getLowStockProducts,
    getProductsByCategory,
    getCommittedStock,
    getAvailableStock,
    getStockSummary,
    isHappyHour,
    getProductPrice
  }
}