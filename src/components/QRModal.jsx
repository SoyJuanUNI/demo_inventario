import React, { useState, useEffect } from 'react'
import Modal from './Modal.jsx'
import { useQRGenerator } from '../hooks/useQRGenerator.js'
import { useOrders } from '../hooks/useOrders.js'
import { EnhancedButton, ActionButton, LoadingButton } from './EnhancedButton.jsx'

export default function QRModal({ open, onClose, orderData = null, tableName = '' }) {
  const { generateOrderQR, downloadOrderQR, shareOrderQR, generatingQR } = useQRGenerator()
  const { orders, getOrderTotal } = useOrders()
  const [qrCode, setQrCode] = useState(null)
  const [error, setError] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const generateQR = async () => {
    if (!orderData?.id) return
    
    try {
      setError(null)
      const result = await generateOrderQR(orderData.id)
      if (result.success) {
        setQrCode(result.qrData)
      } else {
        setError(result.error || 'Error al generar código QR')
      }
    } catch (err) {
      setError('Error al generar código QR: ' + err.message)
      console.error('QR Generation error:', err)
    }
  }

  // Generar QR cuando se abre el modal
  useEffect(() => {
    if (open && orderData?.id) {
      generateQR()
    } else if (!open) {
      // Limpiar estado cuando se cierra
      setQrCode(null)
      setError(null)
      setSharing(false)
      setDownloading(false)
    }
  }, [open, orderData?.id]) // Más específico con orderData?.id

  const handleShare = async () => {
    if (!orderData?.id) return
    
    try {
      setSharing(true)
      const result = await shareOrderQR(orderData.id)
      if (!result.success) {
        setError(result.error || 'Error al compartir')
      }
    } catch (err) {
      setError('Error al compartir: ' + err.message)
    } finally {
      setSharing(false)
    }
  }

  const handleDownload = async () => {
    if (!orderData?.id) return
    
    try {
      setDownloading(true)
      const result = await downloadOrderQR(orderData.id)
      if (!result.success) {
        setError(result.error || 'Error al descargar')
      }
    } catch (err) {
      setError('Error al descargar: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyUrl = () => {
    if (!qrCode?.url) return
    
    navigator.clipboard.writeText(qrCode.url)
      .then(() => {
        // Mostrar feedback visual temporal
        const originalText = 'Copiar URL'
        const button = document.querySelector('[data-copy-btn]')
        if (button) {
          button.textContent = '✅ Copiado'
          setTimeout(() => {
            button.textContent = originalText
          }, 2000)
        }
      })
      .catch(err => {
        setError('Error al copiar URL: ' + err.message)
      })
  }

  const orderTotal = orderData ? getOrderTotal(orderData) : 0
  const itemCount = orderData ? orderData.items.reduce((sum, item) => sum + item.qty, 0) : 0

  return (
    <Modal
      open={open}
      title={`📱 Código QR - ${tableName || 'Mesa'}`}
      onClose={onClose}
      className="qr-modal"
      actions={(
        <div className="qr-modal-actions">
          <ActionButton 
            className="ghost" 
            onClick={onClose}
          >
            Cerrar
          </ActionButton>
          
          {qrCode && (
            <>
              <LoadingButton
                className="success"
                onClick={handleDownload}
                loading={downloading}
                loadingText="Descargando..."
              >
                📥 Descargar
              </LoadingButton>
              
              <LoadingButton
                className="primary"
                onClick={handleShare}
                loading={sharing}
                loadingText="Compartiendo..."
              >
                📤 Compartir
              </LoadingButton>
            </>
          )}
        </div>
      )}
    >
      <div className="qr-modal-content">
        {/* Información de la orden */}
        {orderData && (
          <div className="order-info">
            <div className="order-summary">
              <h4>📋 Resumen de Orden</h4>
              <div className="summary-row">
                <span>Mesa:</span>
                <strong>{tableName}</strong>
              </div>
              <div className="summary-row">
                <span>Items:</span>
                <strong>{itemCount}</strong>
              </div>
              <div className="summary-row">
                <span>Total:</span>
                <strong>${orderTotal.toLocaleString('es-CO')}</strong>
              </div>
              <div className="summary-row">
                <span>Estado:</span>
                <span className={`status-badge ${orderData.status}`}>
                  {orderData.status === 'open' ? 'Abierta' : 
                   orderData.status === 'closed' ? 'Cerrada' : 'Cancelada'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Estado de carga */}
        {generatingQR && (
          <div className="qr-loading">
            <div className="loading-spinner"></div>
            <p>Generando código QR...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="qr-error">
            <p>❌ {error}</p>
            <ActionButton
              className="ghost small"
              onClick={generateQR}
            >
              🔄 Reintentar
            </ActionButton>
          </div>
        )}

        {/* Código QR generado */}
        {qrCode && !generatingQR && (
          <div className="qr-display">
            <div className="qr-image-container">
              <img 
                src={qrCode.qrImageUrl} 
                alt="Código QR para ver orden"
                className="qr-image"
              />
              <div className="qr-instructions">
                <p>📱 Los clientes pueden escanear este código para ver su orden</p>
              </div>
            </div>

            {/* Controles adicionales */}
            <div className="qr-controls">
              <ActionButton
                className="ghost small"
                onClick={handleCopyUrl}
                data-copy-btn
              >
                🔗 Copiar URL
              </ActionButton>
              
              <ActionButton
                className="ghost small"
                onClick={generateQR}
              >
                🔄 Regenerar QR
              </ActionButton>
            </div>

            {/* URL para referencia */}
            {qrCode.url && (
              <div className="qr-url">
                <label className="small">URL del cliente:</label>
                <div className="url-display">
                  <code>{qrCode.url}</code>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información adicional */}
        <div className="qr-info">
          <div className="info-item">
            <strong>💡 Consejo:</strong> Los códigos QR son únicos por orden y se actualizan automáticamente.
          </div>
          <div className="info-item">
            <strong>📱 Uso:</strong> Los clientes verán el estado actual de su orden sin necesidad de app.
          </div>
        </div>
      </div>
    </Modal>
  )
}