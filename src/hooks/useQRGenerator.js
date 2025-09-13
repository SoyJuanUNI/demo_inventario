import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useNotifications } from './useNotifications.js'
import { 
  generateOrderQRData, 
  generateQRDataUrl, 
  downloadQRImage,
  generateCustomerViewUrl 
} from '../utils/qrGenerator.js'

export const useQRGenerator = () => {
  const { state } = useApp()
  const { notifySuccess, notifyError } = useNotifications()
  const [generatingQR, setGeneratingQR] = useState(false)
  const [qrCache, setQrCache] = useState({}) // Cache de QR generados

  // Limpiar cache cuando cambian órdenes o productos
  useEffect(() => {
    setQrCache({}) // Limpiar cache para forzar regeneración con datos actuales
  }, [state.orders, state.products])

  // Generar QR para una orden específica
  const generateOrderQR = async (orderId) => {
    console.log('🎯 generateOrderQR called with orderId:', orderId)
    setGeneratingQR(true)
    
    try {
      const order = state.orders.find(o => o.id === orderId)
      console.log('📋 Found order for QR generation:', order)
      console.log('🗂️ All orders:', state.orders.map(o => ({ id: o.id, name: o.name })))
      
      if (!order) {
        console.error('❌ Order not found for ID:', orderId)
        notifyError('Orden no encontrada')
        return { success: false, error: 'Orden no encontrada' }
      }

      // Verificar si ya está en cache
      if (qrCache[orderId]) {
        setGeneratingQR(false)
        return { success: true, qrData: qrCache[orderId] }
      }

      // Generar datos del QR
      const qrData = generateOrderQRData(order)
      
      // Generar QR offline como fallback
      const offlineQR = await generateQRDataUrl(qrData.url, 200)
      qrData.offlineQR = offlineQR

      // Cachear el resultado
      setQrCache(prev => ({
        ...prev,
        [orderId]: qrData
      }))

      notifySuccess(`QR generado para ${order.name}`)
      setGeneratingQR(false)
      return { success: true, qrData }

    } catch (error) {
      console.error('Error generando QR:', error)
      notifyError('Error al generar código QR')
      setGeneratingQR(false)
      return { success: false, error: error.message }
    }
  }

  // Descargar imagen QR
  const downloadOrderQR = async (orderId) => {
    try {
      const result = await generateOrderQR(orderId)
      if (!result.success) return result

      const order = state.orders.find(o => o.id === orderId)
      const filename = `qr-${order.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`
      
      await downloadQRImage(result.qrData, filename)
      notifySuccess('QR descargado exitosamente')
      return { success: true }

    } catch (error) {
      console.error('Error descargando QR:', error)
      notifyError('Error al descargar QR')
      return { success: false, error: error.message }
    }
  }

  // Compartir QR (Web Share API si está disponible)
  const shareOrderQR = async (orderId) => {
    try {
      const order = state.orders.find(o => o.id === orderId)
      if (!order) {
        notifyError('Orden no encontrada')
        return { success: false }
      }

      const customerUrl = generateCustomerViewUrl(orderId)

      if (navigator.share) {
        await navigator.share({
          title: `Orden - ${order.name}`,
          text: `Ve tu orden de ${order.name}`,
          url: customerUrl
        })
        notifySuccess('Enlace compartido')
        return { success: true }
      } else {
        // Fallback: copiar al clipboard
        await navigator.clipboard.writeText(customerUrl)
        notifySuccess('Enlace copiado al portapapeles')
        return { success: true }
      }

    } catch (error) {
      console.error('Error compartiendo:', error)
      notifyError('Error al compartir')
      return { success: false, error: error.message }
    }
  }

  // Obtener resumen de orden para vista cliente
  const getCustomerOrderSummary = (orderId) => {
    console.log('🔍 getCustomerOrderSummary called with orderId:', orderId)
    console.log('📋 Available orders in state:', state.orders.map(o => ({ id: o.id, name: o.name })))
    console.log('�️ Available products:', state.products.map(p => ({ id: p.id, name: p.name })))
    
    const order = state.orders.find(o => o.id === orderId)
    console.log('🎯 Found order:', order)
    
    if (!order) {
      console.log('❌ Order not found! Available IDs:', state.orders.map(o => o.id))
      console.log('🔍 Searching for:', orderId)
      return null
    }

    console.log('📦 Order items:', order.items)

    const items = order.items.map(item => {
      console.log('🔍 Looking for product with ID:', item.productId)
      const product = state.products.find(p => p.id === item.productId)
      console.log('🎯 Found product:', product)
      
      const itemData = {
        ...item,
        productName: product?.name || 'Producto no encontrado',
        productImage: product?.image,
        subtotal: item.qty * item.price
      }
      
      console.log('📋 Processed item:', itemData)
      return itemData
    })

    const total = items.reduce((sum, item) => sum + item.subtotal, 0)
    
    const summary = {
      orderId: order.id,
      tableName: order.name,
      status: order.status,
      timestamp: order.timestamp,
      notes: order.notes,
      items,
      total,
      itemCount: items.reduce((sum, item) => sum + item.qty, 0)
    }
    
    console.log('✅ Final summary:', summary)
    return summary
  }

  // Limpiar cache de QR
  const clearQRCache = () => {
    setQrCache({})
    notifySuccess('Cache de QR limpiado')
  }

  // Obtener estadísticas de QR
  const getQRStats = () => {
    const totalQRGenerated = Object.keys(qrCache).length
    const activeOrders = state.orders.filter(o => o.status === 'open').length
    const qrCoverage = activeOrders > 0 ? (totalQRGenerated / activeOrders * 100).toFixed(1) : 0

    return {
      totalGenerated: totalQRGenerated,
      activeOrders,
      coverage: qrCoverage,
      cacheSize: JSON.stringify(qrCache).length
    }
  }

  return {
    generateOrderQR,
    downloadOrderQR,
    shareOrderQR,
    getCustomerOrderSummary,
    clearQRCache,
    getQRStats,
    generatingQR,
    qrCache
  }
}