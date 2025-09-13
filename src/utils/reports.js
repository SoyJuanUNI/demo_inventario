// Utilidades para reportes y fechas
export const dateUtils = {
  // Formatear fecha para input datetime-local
  toInputFormat: (date = new Date()) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  },

  // Verificar si una fecha está en el rango
  isInRange: (date, startDate, endDate) => {
    const d = new Date(date)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return d >= start && d <= end
  },

  // Obtener inicio y fin del día actual
  getTodayRange: () => {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  },

  // Obtener rango de la semana actual
  getWeekRange: () => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  },

  // Obtener rango del mes actual
  getMonthRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }
}

// Utilidades de exportación
export const exportUtils = {
  // Convertir array de objetos a CSV
  toCSV: (data, filename = 'export.csv') => {
    if (!data || data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escapar comillas y envolver en comillas si contiene coma
          const escaped = String(value || '').replace(/"/g, '""')
          return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
            ? `"${escaped}"` 
            : escaped
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // Exportar como JSON
  toJSON: (data, filename = 'export.json') => {
    if (!data) return
    
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Utilidades de reportes
export const reportUtils = {
  // Calcular ventas por rango de fechas
  getSalesByDateRange: (orders, startDate, endDate) => {
    return orders
      .filter(o => o.status === 'closed')
      .filter(o => dateUtils.isInRange(o.closedAt, startDate, endDate))
  },

  // Calcular top productos por rango
  getTopProductsByDateRange: (orders, products, startDate, endDate, limit = 10) => {
    const salesInRange = reportUtils.getSalesByDateRange(orders, startDate, endDate)
    const productStats = {}
    
    salesInRange.forEach(order => {
      order.items.forEach(item => {
        if (!productStats[item.productId]) {
          const product = products.find(p => p.id === item.productId)
          productStats[item.productId] = {
            id: item.productId,
            name: product?.name || item.productId,
            category: product?.categoryId,
            totalQty: 0,
            totalRevenue: 0,
            orders: 0
          }
        }
        
        productStats[item.productId].totalQty += item.qty
        productStats[item.productId].totalRevenue += item.price * item.qty
        productStats[item.productId].orders += 1
      })
    })
    
    return Object.values(productStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
  },

  // Calcular consumo por categoría
  getConsumptionByCategory: (orders, products, categories, startDate, endDate) => {
    const salesInRange = reportUtils.getSalesByDateRange(orders, startDate, endDate)
    const categoryStats = {}
    
    categories.forEach(cat => {
      categoryStats[cat.id] = {
        id: cat.id,
        name: cat.name,
        totalQty: 0,
        totalRevenue: 0,
        uniqueProducts: new Set()
      }
    })
    
    salesInRange.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId)
        if (product && categoryStats[product.categoryId]) {
          categoryStats[product.categoryId].totalQty += item.qty
          categoryStats[product.categoryId].totalRevenue += item.price * item.qty
          categoryStats[product.categoryId].uniqueProducts.add(item.productId)
        }
      })
    })
    
    return Object.values(categoryStats).map(stat => ({
      ...stat,
      uniqueProducts: stat.uniqueProducts.size
    })).sort((a, b) => b.totalRevenue - a.totalRevenue)
  }
}