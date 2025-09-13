import { genId, nowIso } from '../../utils/format.js'

// Función auxiliar para calcular precio con descuentos
const calculateItemPrice = (product, discount = 0) => {
  let finalPrice = product.price
  
  // Aplicar descuento manual
  if (discount > 0) {
    finalPrice = finalPrice * (1 - discount / 100)
  }
  
  // Aplicar descuento de happy hour si está activo
  if (product.happyHourDiscount > 0) {
    const now = new Date()
    const hours = now.getHours()
    if (hours >= (product.happyHourStart || 17) && hours < (product.happyHourEnd || 19)) {
      finalPrice = finalPrice * (1 - product.happyHourDiscount / 100)
    }
  }
  
  return finalPrice
}

export const ordersReducer = (state, action) => {
  switch (action.type) {
    case 'createOrder': {
      const { name } = action.payload
      const order = {
        id: genId('ord'),
        name,
        items: [],
        notes: '',
        status: 'open',
        createdAt: nowIso(),
        closedAt: null,
        canceledAt: null,
        createdBy: state.currentUser?.id || null,
      }
      return { ...state, orders: [order, ...state.orders] }
    }

    case 'addItem': {
      const { orderId, productId, notes = '', discount = 0 } = action.payload
      const order = state.orders.find(o => o.id === orderId)
      if (!order || order.status !== 'open') return state
      
      const prod = state.products.find(p => p.id === productId)
      if (!prod) return state
      
      if (prod.stock <= 0) {
        return {
          ...state,
          notifications: [
            ...state.notifications,
            { id: genId('ntf'), type: 'warn', message: `Sin stock para ${prod.name}`, ts: nowIso() }
          ]
        }
      }
      
      const finalPrice = calculateItemPrice(prod, discount)
      
      const items = [...order.items]
      const idx = items.findIndex(i => i.productId === productId)
      
      if (idx >= 0) {
        items[idx] = { ...items[idx], qty: items[idx].qty + 1, notes: notes || items[idx].notes }
      } else {
        items.push({ 
          id: genId('item'),
          productId, 
          qty: 1, 
          price: finalPrice,
          originalPrice: prod.price,
          notes,
          discount
        })
      }
      
      const orders = state.orders.map(o => o.id === orderId ? { ...o, items } : o)
      const products = state.products.map(p => 
        p.id === productId ? { ...p, stock: Math.max(0, p.stock - 1) } : p
      )
      
      return { ...state, orders, products }
    }

    case 'removeItem': {
      const { orderId, itemId } = action.payload
      const order = state.orders.find(o => o.id === orderId)
      if (!order || order.status !== 'open') return state
      
      const existing = order.items.find(i => i.id === itemId)
      if (!existing) return state
      
      const items = order.items.map(i => 
        i.id === itemId ? { ...i, qty: i.qty - 1 } : i
      ).filter(i => i.qty > 0)
      
      const orders = state.orders.map(o => o.id === orderId ? { ...o, items } : o)
      const products = state.products.map(p => 
        p.id === existing.productId ? { ...p, stock: p.stock + 1 } : p
      )
      
      return { ...state, orders, products }
    }

    case 'finalizeOrder': {
      const { orderId } = action.payload
      const order = state.orders.find(o => o.id === orderId)
      if (!order || order.status !== 'open') return state
      
      const orders = state.orders.map(o => 
        o.id === orderId ? { ...o, status: 'closed', closedAt: nowIso() } : o
      )
      
      const low = state.products.filter(p => p.stock <= p.lowStock)
      const notifications = [...state.notifications]
      notifications.push({ 
        id: genId('ntf'), 
        type: 'ok', 
        message: `Orden cerrada: ${order.name}`, 
        ts: nowIso() 
      })
      
      if (low.length) {
        notifications.push({ 
          id: genId('ntf'), 
          type: 'warn', 
          message: `${low.length} producto(s) con stock bajo`, 
          ts: nowIso() 
        })
      }
      
      return { ...state, orders, notifications }
    }

    case 'cancelOrder': {
      const { orderId } = action.payload
      const order = state.orders.find(o => o.id === orderId)
      if (!order) return state
      
      // Devolver stock si la orden estaba abierta o cerrada
      const products = (order.status === 'open' || order.status === 'closed')
        ? state.products.map(p => {
            const item = order.items.find(i => i.productId === p.id)
            return item ? { ...p, stock: p.stock + item.qty } : p
          })
        : state.products
      
      const orders = state.orders.map(o => 
        o.id === orderId ? { ...o, status: 'canceled', canceledAt: nowIso() } : o
      )
      
      return {
        ...state,
        products,
        orders,
        notifications: [
          ...state.notifications,
          { id: genId('ntf'), type: 'warn', message: 'Orden cancelada', ts: nowIso() }
        ]
      }
    }

    case 'reopenOrder': {
      const { orderId } = action.payload
      const order = state.orders.find(o => o.id === orderId)
      if (!order || order.status !== 'closed') return state
      
      const orders = state.orders.map(o => 
        o.id === orderId ? { ...o, status: 'open', closedAt: null } : o
      )
      
      return {
        ...state,
        orders,
        notifications: [
          ...state.notifications,
          { id: genId('ntf'), type: 'ok', message: 'Orden reabierta para edición', ts: nowIso() }
        ]
      }
    }

    case 'updateOrderNotes': {
      const { orderId, notes } = action.payload
      const orders = state.orders.map(o => o.id === orderId ? { ...o, notes } : o)
      return { ...state, orders }
    }

    case 'updateItemNotes': {
      const { orderId, itemId, notes } = action.payload
      const orders = state.orders.map(o => {
        if (o.id === orderId) {
          const items = o.items.map(i => i.id === itemId ? { ...i, notes } : i)
          return { ...o, items }
        }
        return o
      })
      return { ...state, orders }
    }

    case 'transferOrder': {
      const { fromOrderId, toOrderId } = action.payload
      const fromOrder = state.orders.find(o => o.id === fromOrderId)
      const toOrder = state.orders.find(o => o.id === toOrderId)
      
      if (!fromOrder || !toOrder || fromOrder.status !== 'open' || toOrder.status !== 'open') {
        return state
      }
      
      const orders = state.orders.map(o => {
        if (o.id === toOrderId) {
          // Combinar items
          const combinedItems = [...o.items]
          fromOrder.items.forEach(item => {
            const existingIdx = combinedItems.findIndex(i => 
              i.productId === item.productId && i.price === item.price
            )
            if (existingIdx >= 0) {
              combinedItems[existingIdx] = { 
                ...combinedItems[existingIdx], 
                qty: combinedItems[existingIdx].qty + item.qty 
              }
            } else {
              combinedItems.push({ ...item, id: genId('item') })
            }
          })
          return { ...o, items: combinedItems }
        }
        if (o.id === fromOrderId) {
          return { ...o, items: [], status: 'closed', closedAt: nowIso() }
        }
        return o
      })
      
      return {
        ...state,
        orders,
        notifications: [
          ...state.notifications,
          { 
            id: genId('ntf'), 
            type: 'ok', 
            message: `Orden transferida de ${fromOrder.name} a ${toOrder.name}`, 
            ts: nowIso() 
          }
        ]
      }
    }

    case 'transferItems': {
      const { fromOrderId, toOrderId, items } = action.payload
      const fromOrder = state.orders.find(o => o.id === fromOrderId)
      const toOrder = state.orders.find(o => o.id === toOrderId)
      
      if (!fromOrder || !toOrder || fromOrder.status !== 'open' || toOrder.status !== 'open') {
        return state
      }
      
      const orders = state.orders.map(o => {
        if (o.id === fromOrderId) {
          // Remover items transferidos
          const remainingItems = o.items.filter(item => !items.find(i => i.id === item.id))
          return { ...o, items: remainingItems }
        }
        if (o.id === toOrderId) {
          // Agregar items transferidos
          const newItems = items.map(item => ({ ...item, id: genId('item') }))
          return { ...o, items: [...o.items, ...newItems] }
        }
        return o
      })
      
      return {
        ...state,
        orders,
        notifications: [
          ...state.notifications,
          { 
            id: genId('ntf'), 
            type: 'ok', 
            message: `${items.length} ítem(s) transferido(s)`, 
            ts: nowIso() 
          }
        ]
      }
    }

    case 'splitOrder': {
      const { orderId, items, newOrderName } = action.payload
      const order = state.orders.find(o => o.id === orderId)
      if (!order || order.status !== 'open') return state
      
      // Crear nueva orden con items seleccionados
      const newOrder = {
        id: genId('ord'),
        name: newOrderName,
        items: items.map(item => ({ ...item, id: genId('item') })),
        status: 'open',
        createdAt: nowIso(),
        closedAt: null,
        canceledAt: null,
        createdBy: state.currentUser?.id || null,
        notes: `Dividida de: ${order.name}`
      }
      
      // Actualizar orden original removiendo items transferidos
      const orders = state.orders.map(o => {
        if (o.id === orderId) {
          const remainingItems = o.items.filter(item => !items.find(i => i.id === item.id))
          return { ...o, items: remainingItems }
        }
        return o
      })
      orders.unshift(newOrder)
      
      return {
        ...state,
        orders,
        notifications: [
          ...state.notifications,
          { 
            id: genId('ntf'), 
            type: 'ok', 
            message: `Cuenta dividida: ${newOrderName}`, 
            ts: nowIso() 
          }
        ]
      }
    }

    default:
      return state
  }
}