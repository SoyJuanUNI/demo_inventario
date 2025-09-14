import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useQRGenerator } from '../hooks/useQRGenerator.js'
import { currency } from '../utils/format.js'
import ProductImage from '../components/shared/ProductImage.jsx'

export default function CustomerOrderView({ orderId }) {
  console.log('🚀 CustomerOrderView rendered with orderId:', orderId)
  
  const { state } = useApp()
  const { getCustomerOrderSummary } = useQRGenerator()
  const [orderSummary, setOrderSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    console.log('📡 CustomerOrderView useEffect called with orderId:', orderId)
    if (orderId) {
      const summary = getCustomerOrderSummary(orderId)
      console.log('📊 Summary received:', summary)
      setOrderSummary(summary)
      setLoading(false)
    }
  }, [orderId, getCustomerOrderSummary, refreshCount, state.orders, state.products])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setRefreshCount(prev => prev + 1)
    }, 500) // Simular carga para mejor UX
  }

  if (loading) {
    return (
      <div className="customer-view">
        <div className="customer-card">
          <div className="loading-animation">
            <div className="spinner"></div>
            <p>Cargando tu orden...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!orderSummary) {
    return (
      <div className="customer-view">
        <div className="customer-card">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h2>Orden no encontrada</h2>
            <p>No se pudo encontrar la orden solicitada.</p>
            <p className="small">ID: {orderId}</p>
            <button className="refresh-btn" onClick={handleRefresh}>
              🔄 Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    )
  }

  const statusEmoji = {
    'open': '🔄',
    'closed': '✅',
    'cancelled': '❌'
  }

  const statusText = {
    'open': 'En preparación',
    'closed': 'Lista',
    'cancelled': 'Cancelada'
  }

  const statusColor = {
    'open': '#f59e0b',
    'closed': '#10b981',
    'cancelled': '#ef4444'
  }

  return (
    <div className="customer-view">
      <div className="customer-card">
        {/* Header */}
        <div className="order-header">
          <div className="restaurant-info">
            <h1>🍻 Bar & Restaurante</h1>
            <div className="order-title">
              <h2>{orderSummary.tableName}</h2>
              <div 
                className="status-badge"
                style={{ 
                  backgroundColor: statusColor[orderSummary.status] + '20',
                  color: statusColor[orderSummary.status],
                  border: `1px solid ${statusColor[orderSummary.status]}40`
                }}
              >
                {statusEmoji[orderSummary.status]} {statusText[orderSummary.status]}
              </div>
            </div>
          </div>
          
          <div className="order-meta">
            <div className="order-id">
              <span className="label">ID Orden:</span>
              <span className="value">{orderSummary.orderId.slice(-8).toUpperCase()}</span>
            </div>
            <div className="order-time">
              <span className="label">Hora:</span>
              <span className="value">
                {new Date(orderSummary.timestamp).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="order-items">
          <h3>📋 Tu orden ({orderSummary.itemCount} items)</h3>
          
          {orderSummary.items.map(item => (
            <div key={item.id} className="order-item">
              <div className="item-info">
                {item.productImage && (
                  <div className="item-image">
                    <ProductImage
                      src={item.productImage} 
                      alt={item.productName}
                      size="40px"
                      useImports={true}
                    />
                  </div>
                )}
                <div className="item-details">
                  <div className="item-name">{item.productName}</div>
                  {item.notes && (
                    <div className="item-notes">📝 {item.notes}</div>
                  )}
                  <div className="item-price">
                    {currency(item.price)} × {item.qty}
                  </div>
                </div>
              </div>
              <div className="item-total">
                {currency(item.subtotal)}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {orderSummary.notes && (
          <div className="order-notes">
            <h4>📋 Notas especiales</h4>
            <p>{orderSummary.notes}</p>
          </div>
        )}

        {/* Total */}
        <div className="order-total">
          <div className="total-row">
            <span className="total-label">Total a pagar:</span>
            <span className="total-amount">{currency(orderSummary.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="order-footer">
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 Actualizar estado
          </button>
          
          <div className="footer-info">
            <p className="small">
              Esta orden se actualiza automáticamente. 
              {orderSummary.status === 'open' && ' Te avisaremos cuando esté lista.'}
              {orderSummary.status === 'closed' && ' ¡Tu orden está lista para recoger!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente independiente para rutas públicas
export function CustomerOrderPage() {
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    // Extraer orderId de la URL
    const path = window.location.pathname
    const matches = path.match(/\/customer\/(.+)$/)
    if (matches) {
      setOrderId(matches[1])
    }
  }, [])

  if (!orderId) {
    return (
      <div className="customer-view">
        <div className="customer-card">
          <div className="error-state">
            <div className="error-icon">❓</div>
            <h2>Orden no especificada</h2>
            <p>No se proporcionó un ID de orden válido.</p>
          </div>
        </div>
      </div>
    )
  }

  return <CustomerOrderView orderId={orderId} />
}