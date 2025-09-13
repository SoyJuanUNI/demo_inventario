import { useApp } from '../context/AppContext.jsx'
import { dateUtils, exportUtils, reportUtils } from '../utils/reports.js'
import { currency } from '../utils/format.js'

export const useReports = () => {
  const { state } = useApp()

  const generateSalesReport = (startDate, endDate) => {
    const salesInRange = reportUtils.getSalesByDateRange(state.orders, startDate, endDate)
    const totalRevenue = salesInRange.reduce((sum, order) => {
      return sum + order.items.reduce((orderSum, item) => orderSum + (item.price * item.qty), 0)
    }, 0)
    
    const totalOrders = salesInRange.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const totalItems = salesInRange.reduce((sum, order) => {
      return sum + order.items.reduce((orderSum, item) => orderSum + item.qty, 0)
    }, 0)
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalItems,
      orders: salesInRange,
      period: { startDate, endDate }
    }
  }

  const generateTopProductsReport = (startDate, endDate, limit = 10) => {
    return reportUtils.getTopProductsByDateRange(state.orders, state.products, startDate, endDate, limit)
  }

  const generateCategoryReport = (startDate, endDate) => {
    return reportUtils.getConsumptionByCategory(state.orders, state.products, state.categories, startDate, endDate)
  }

  const generateTurnReport = (startDate, endDate) => {
    const salesInRange = reportUtils.getSalesByDateRange(state.orders, startDate, endDate)
    const cancelledInRange = state.orders
      .filter(o => o.status === 'canceled')
      .filter(o => dateUtils.isInRange(o.canceledAt, startDate, endDate))
    
    const totalSales = salesInRange.reduce((sum, order) => {
      return sum + order.items.reduce((orderSum, item) => orderSum + (item.price * item.qty), 0)
    }, 0)
    
    // Medios de pago simulados (random para demo)
    const paymentMethods = {
      efectivo: Math.floor(totalSales * (0.4 + Math.random() * 0.2)),
      tarjeta: Math.floor(totalSales * (0.3 + Math.random() * 0.2)),
      transferencia: 0
    }
    paymentMethods.transferencia = totalSales - paymentMethods.efectivo - paymentMethods.tarjeta
    
    return {
      period: { startDate, endDate },
      sales: {
        count: salesInRange.length,
        total: totalSales,
        average: salesInRange.length > 0 ? totalSales / salesInRange.length : 0
      },
      cancellations: {
        count: cancelledInRange.length,
        percentage: salesInRange.length > 0 ? (cancelledInRange.length / (salesInRange.length + cancelledInRange.length)) * 100 : 0
      },
      paymentMethods,
      topProducts: reportUtils.getTopProductsByDateRange(state.orders, state.products, startDate, endDate, 5)
    }
  }

  const exportOrdersCSV = (startDate, endDate) => {
    const salesInRange = reportUtils.getSalesByDateRange(state.orders, startDate, endDate)
    const exportData = salesInRange.map(order => ({
      id: order.id,
      nombre: order.name,
      fecha_creacion: new Date(order.createdAt).toLocaleString('es-CO'),
      fecha_cierre: new Date(order.closedAt).toLocaleString('es-CO'),
      items: order.items.length,
      total_items: order.items.reduce((sum, item) => sum + item.qty, 0),
      total_pesos: order.items.reduce((sum, item) => sum + (item.price * item.qty), 0),
      creado_por: order.createdBy,
      notas: order.notes || ''
    }))
    
    const filename = `ordenes_${startDate.split('T')[0]}_${endDate.split('T')[0]}.csv`
    exportUtils.toCSV(exportData, filename)
  }

  const exportProductsCSV = () => {
    const exportData = state.products.map(product => ({
      id: product.id,
      nombre: product.name,
      categoria: state.categories.find(c => c.id === product.categoryId)?.name || '',
      precio: product.price,
      stock_total: product.stock,
      stock_minimo: product.lowStock,
      happy_hour_descuento: product.happyHourDiscount || 0,
      imagen: product.image || ''
    }))
    
    const filename = `productos_${new Date().toISOString().split('T')[0]}.csv`
    exportUtils.toCSV(exportData, filename)
  }

  const exportReportJSON = (reportData, reportType) => {
    const filename = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.json`
    exportUtils.toJSON(reportData, filename)
  }

  return {
    generateSalesReport,
    generateTopProductsReport,
    generateCategoryReport,
    generateTurnReport,
    exportOrdersCSV,
    exportProductsCSV,
    exportReportJSON,
    dateUtils
  }
}