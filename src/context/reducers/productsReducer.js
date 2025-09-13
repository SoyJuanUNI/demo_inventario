import { genId, nowIso } from '../../utils/format.js'

export const productsReducer = (state, action) => {
  switch (action.type) {
    case 'updateProduct': {
      const { id, patch } = action.payload
      const sanitize = (obj) => ({
        ...obj,
        price: Math.max(0, Number(obj.price ?? 0) || 0),
        stock: Math.max(0, Math.floor(Number(obj.stock ?? 0) || 0)),
        lowStock: Math.max(0, Math.floor(Number(obj.lowStock ?? 0) || 0)),
      })
      const products = state.products.map(p => p.id === id ? { ...p, ...sanitize(patch) } : p)
      return { ...state, products }
    }

    case 'addProduct': {
      const { product } = action.payload
      const sanitize = (obj) => ({
        ...obj,
        price: Math.max(0, Number(obj.price ?? 0) || 0),
        stock: Math.max(0, Math.floor(Number(obj.stock ?? 0) || 0)),
        lowStock: Math.max(0, Math.floor(Number(obj.lowStock ?? 0) || 0)),
      })
      return {
        ...state,
        products: [{ ...sanitize(product), id: genId('p') }, ...state.products]
      }
    }

    case 'deleteProduct': {
      const { id } = action.payload
      return { ...state, products: state.products.filter(p => p.id !== id) }
    }

    case 'restockLow': {
      const products = state.products.map(p => 
        p.stock <= p.lowStock ? { ...p, stock: p.stock + (p.lowStock * 2) } : p
      )
      return {
        ...state,
        products,
        notifications: [
          ...state.notifications,
          { id: genId('ntf'), type: 'ok', message: 'Reabastecimiento simulado', ts: nowIso() }
        ]
      }
    }

    case 'applyHappyHour': {
      const { categoryId, discount } = action.payload
      const products = state.products.map(p => 
        p.categoryId === categoryId 
          ? { ...p, happyHourDiscount: discount, happyHourActive: true } 
          : p
      )
      return {
        ...state,
        products,
        notifications: [
          ...state.notifications,
          { id: genId('ntf'), type: 'ok', message: `Happy Hour aplicado: ${discount}% descuento`, ts: nowIso() }
        ]
      }
    }

    case 'removeHappyHour': {
      const { categoryId } = action.payload
      const products = state.products.map(p => 
        p.categoryId === categoryId 
          ? { ...p, happyHourDiscount: 0, happyHourActive: false } 
          : p
      )
      return {
        ...state,
        products,
        notifications: [
          ...state.notifications,
          { id: genId('ntf'), type: 'ok', message: 'Happy Hour removido', ts: nowIso() }
        ]
      }
    }

    case 'restockProduct': {
      const { id, quantity } = action.payload
      const products = state.products.map(p => 
        p.id === id ? { ...p, stock: p.stock + Math.max(0, Math.floor(Number(quantity) || 0)) } : p
      )
      const product = state.products.find(p => p.id === id)
      return {
        ...state,
        products,
        notifications: [
          ...state.notifications,
          { id: genId('ntf'), type: 'ok', message: `${product?.name}: +${quantity} unidades`, ts: nowIso() }
        ]
      }
    }

    case 'bulkUpdateProducts': {
      const { productIds, updates } = action.payload
      const sanitize = (obj) => ({
        ...obj,
        ...(obj.price !== undefined && { price: Math.max(0, Number(obj.price) || 0) }),
        ...(obj.stock !== undefined && { stock: Math.max(0, Math.floor(Number(obj.stock) || 0)) }),
        ...(obj.lowStock !== undefined && { lowStock: Math.max(0, Math.floor(Number(obj.lowStock) || 0)) }),
      })
      
      const products = state.products.map(p => 
        productIds.includes(p.id) ? { ...p, ...sanitize(updates) } : p
      )
      
      return {
        ...state,
        products,
        notifications: [
          ...state.notifications,
          { id: genId('ntf'), type: 'ok', message: `${productIds.length} productos actualizados en lote`, ts: nowIso() }
        ]
      }
    }

    default:
      return state
  }
}