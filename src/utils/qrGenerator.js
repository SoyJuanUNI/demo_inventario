// Utilidad para generar códigos QR usando QR Server API
// Alternativa sin dependencias que usa servicios externos

// Configuración del generador QR
export const QR_CONFIG = {
  size: 200, // Tamaño en píxeles
  errorCorrection: 'M', // L, M, Q, H
  margin: 1,
  format: 'png'
}

// Generar URL del QR usando QR Server API
export function generateQRUrl(data, options = {}) {
  const config = { ...QR_CONFIG, ...options }
  
  // Usar qr-server.com (gratuito)
  const baseUrl = 'https://api.qrserver.com/v1/create-qr-code/'
  const params = new URLSearchParams({
    size: `${config.size}x${config.size}`,
    data: encodeURIComponent(data),
    ecc: config.errorCorrection,
    margin: config.margin,
    format: config.format
  })
  
  return `${baseUrl}?${params.toString()}`
}

// Generar QR como Data URL (para funcionar offline usando canvas)
export function generateQRDataUrl(text, size = 200) {
  // Implementación simple de QR Code usando canvas
  // Esta es una versión simplificada para demo
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = size
    canvas.height = size
    
    // Fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    
    // Generar patrón QR simplificado (solo para demo visual)
    const gridSize = 25 // 25x25 grid
    const cellSize = size / gridSize
    
    // Seed basado en el texto para consistencia
    let seed = 0
    for (let i = 0; i < text.length; i++) {
      seed = ((seed << 5) - seed + text.charCodeAt(i)) & 0xfffffff
    }
    
    // Función pseudo-random seeded
    function seededRandom() {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    
    ctx.fillStyle = '#000000'
    
    // Marcos de posición (esquinas)
    drawPositionMarker(ctx, 0, 0, cellSize)
    drawPositionMarker(ctx, gridSize - 7, 0, cellSize)
    drawPositionMarker(ctx, 0, gridSize - 7, cellSize)
    
    // Patrón aleatorio basado en el texto
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Evitar marcos de posición
        if (isPositionMarker(row, col, gridSize)) continue
        
        if (seededRandom() > 0.5) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }
    
    resolve(canvas.toDataURL())
  })
}

// Dibujar marcos de posición del QR
function drawPositionMarker(ctx, startRow, startCol, cellSize) {
  const size = 7
  
  // Marco exterior (7x7)
  ctx.fillRect(startCol * cellSize, startRow * cellSize, size * cellSize, size * cellSize)
  
  // Interior blanco (5x5)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect((startCol + 1) * cellSize, (startRow + 1) * cellSize, 5 * cellSize, 5 * cellSize)
  
  // Centro negro (3x3)
  ctx.fillStyle = '#000000'
  ctx.fillRect((startCol + 2) * cellSize, (startRow + 2) * cellSize, 3 * cellSize, 3 * cellSize)
}

// Verificar si está en área de marco de posición
function isPositionMarker(row, col, gridSize) {
  // Esquina superior izquierda
  if (row < 9 && col < 9) return true
  // Esquina superior derecha
  if (row < 9 && col >= gridSize - 9) return true
  // Esquina inferior izquierda
  if (row >= gridSize - 9 && col < 9) return true
  return false
}

// Generar URL para vista de cliente
export function generateCustomerViewUrl(orderId, baseUrl = window.location.origin) {
  // Usar hash routing para que funcione con el routing actual
  return `${baseUrl}${window.location.pathname}#/customer/${orderId}`
}

// Generar datos del QR para una orden
export function generateOrderQRData(order) {
  const customerUrl = generateCustomerViewUrl(order.id)
  console.log('🔗 Generated QR URL for order:', order.id, 'URL:', customerUrl)
  
  const qrData = {
    url: customerUrl,
    orderId: order.id,
    tableName: order.name,
    timestamp: new Date().toISOString(),
    qrImageUrl: generateQRUrl(customerUrl)
  }
  
  console.log('📱 Complete QR data:', qrData)
  return qrData
}

// Crear y descargar imagen QR
export function downloadQRImage(qrData, filename) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Tamaño del canvas con margen para texto
      canvas.width = 300
      canvas.height = 350
      
      // Fondo blanco
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Dibujar QR centrado
      const qrSize = 200
      const qrX = (canvas.width - qrSize) / 2
      const qrY = 20
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize)
      
      // Texto informativo
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      
      const centerX = canvas.width / 2
      ctx.fillText(qrData.tableName, centerX, qrY + qrSize + 30)
      
      ctx.font = '14px Arial'
      ctx.fillText('Escanea para ver tu orden', centerX, qrY + qrSize + 50)
      
      ctx.font = '12px Arial'
      ctx.fillStyle = '#666666'
      ctx.fillText(`ID: ${qrData.orderId}`, centerX, qrY + qrSize + 70)
      
      // Descargar
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename || `qr-${qrData.tableName.replace(/\s+/g, '-')}.png`
        a.click()
        URL.revokeObjectURL(url)
        resolve(true)
      }, 'image/png')
    }
    
    img.onerror = () => reject(new Error('Error loading QR image'))
    img.src = qrData.qrImageUrl
  })
}