// Selectores para órdenes
export const orderSelectors = {
  getOrderTotal: (order) => 
    order.items.reduce((sum, item) => sum + (item.qty * item.price), 0),
    
  getOrdersByStatus: (orders, status) => 
    orders.filter(o => o.status === status),
    
  getOrdersByUser: (orders, userId) => 
    orders.filter(o => o.createdBy === userId),
    
  getOpenOrders: (orders) => 
    orders.filter(o => o.status === 'open'),
    
  getClosedOrders: (orders) => 
    orders.filter(o => o.status === 'closed'),
    
  getCanceledOrders: (orders) => 
    orders.filter(o => o.status === 'canceled'),
}

// Selectores para productos
export const productSelectors = {
  getProduct: (products, id) => 
    products.find(p => p.id === id),
    
  getLowStockProducts: (products) => 
    products.filter(p => p.stock <= p.lowStock),
    
  getProductsByCategory: (products, categoryId) => 
    products.filter(p => p.categoryId === categoryId),
    
  getAvailableProducts: (products) => 
    products.filter(p => p.stock > 0),
    
  getProductsWithHappyHour: (products) => 
    products.filter(p => p.happyHourDiscount > 0),
}

// Selectores para categorías
export const categorySelectors = {
  getCategory: (categories, id) => 
    categories.find(c => c.id === id),
    
  getCategoriesWithProducts: (categories, products) => 
    categories.filter(cat => products.some(p => p.categoryId === cat.id)),
}

// Selectores para notificaciones
export const notificationSelectors = {
  getRecentNotifications: (notifications, limit = 10) => 
    notifications.slice(-limit),
    
  getNotificationsByType: (notifications, type) => 
    notifications.filter(n => n.type === type),
}

// Selector principal que combina todos
export const selectors = {
  ...orderSelectors,
  ...productSelectors,
  ...categorySelectors,
  ...notificationSelectors,
}