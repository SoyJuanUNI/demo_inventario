import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useProducts } from '../hooks/useProducts.js'
import { useCategories } from '../hooks/useCategories.js'
import { useReports } from '../hooks/useReports.js'
import { useUI } from '../hooks/useUI.js'
import { currency, genId, nowIso } from '../utils/format.js'
import Modal from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'

export default function AdminPanel() {
  const { state, dispatch } = useApp()
  const { products, categories, orders, currentUser } = state
  const { addProduct, updateProduct, deleteProduct, restockProduct, bulkUpdateProducts } = useProducts()
  const { addCategory, updateCategory, deleteCategory } = useCategories()
  const { generateInventoryReport, generateSalesReport, generateUserReport } = useReports()
  const { toggleTheme } = useUI()

  const [activeTab, setActiveTab] = useState('products')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [showLowStockModal, setShowLowStockModal] = useState(false)
  const [lowStockAlertDismissed, setLowStockAlertDismissed] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    lowStock: '',
    category: '',
    image: '/images/products/default-food.svg'
  })
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [stockUpdates, setStockUpdates] = useState({})
  const [reportType, setReportType] = useState('sales')
  const [reportData, setReportData] = useState(null)
  const fileInputRef = useRef(null)

  // Funciones de productos
  const handleAddProduct = () => {
    setModalType('addProduct')
    setEditingItem(null)
    setNewProduct({
      name: '',
      price: '',
      stock: '',
      lowStock: '',
      category: '',
      image: '/images/products/default-food.svg'
    })
    setShowModal(true)
  }

  const handleEditProduct = (product) => {
    setModalType('editProduct')
    setEditingItem(product)
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      lowStock: product.lowStock.toString(),
      category: product.category,
      image: product.image
    })
    setShowModal(true)
  }

  const handleSaveProduct = () => {
    // Validación de campos obligatorios
    if (!newProduct.name.trim()) {
      dispatch({ type: 'addNotification', payload: { type: 'error', message: 'El nombre del producto es obligatorio' } })
      return
    }
    
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      dispatch({ type: 'addNotification', payload: { type: 'error', message: 'El precio debe ser mayor a 0' } })
      return
    }
    
    if (!newProduct.stock || parseInt(newProduct.stock) < 0) {
      dispatch({ type: 'addNotification', payload: { type: 'error', message: 'El stock debe ser 0 o mayor' } })
      return
    }
    
    if (!newProduct.lowStock || parseInt(newProduct.lowStock) < 0) {
      dispatch({ type: 'addNotification', payload: { type: 'error', message: 'El stock mínimo debe ser 0 o mayor' } })
      return
    }

    const productData = {
      name: newProduct.name.trim(),
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      lowStock: parseInt(newProduct.lowStock),
      category: newProduct.category || '',
      image: newProduct.image || '/images/products/default-food.svg'
    }

    try {
      if (editingItem) {
        dispatch({ type: 'updateProduct', payload: { id: editingItem.id, patch: productData } })
        dispatch({ type: 'addNotification', payload: { type: 'success', message: 'Producto actualizado correctamente' } })
      } else {
        dispatch({ type: 'addProduct', payload: { product: productData } })
        dispatch({ type: 'addNotification', payload: { type: 'success', message: 'Producto agregado correctamente' } })
      }
      
      // Resetear formulario
      setNewProduct({
        name: '',
        price: '',
        stock: '',
        lowStock: '',
        category: '',
        image: '/images/products/default-food.svg'
      })
      setShowModal(false)
    } catch (error) {
      dispatch({ type: 'addNotification', payload: { type: 'error', message: 'Error al guardar el producto' } })
    }
  }

  const handleDeleteProduct = (productId) => {
    if (confirm('¿Seguro que quieres eliminar este producto?')) {
      try {
        dispatch({ type: 'deleteProduct', payload: { id: productId } })
        dispatch({ type: 'addNotification', payload: { type: 'success', message: 'Producto eliminado correctamente' } })
      } catch (error) {
        dispatch({ type: 'addNotification', payload: { type: 'error', message: 'Error al eliminar el producto' } })
      }
    }
  }

  // Funciones de categorías
  const handleAddCategory = () => {
    setModalType('addCategory')
    setEditingItem(null)
    setNewCategory({ name: '', description: '' })
    setShowModal(true)
  }

  const handleEditCategory = (category) => {
    setModalType('editCategory')
    setEditingItem(category)
    setNewCategory({ name: category.name, description: category.description })
    setShowModal(true)
  }

  const handleSaveCategory = () => {
    try {
      // Validación de campos obligatorios
      if (!newCategory.name.trim()) {
        dispatch({ type: 'addNotification', payload: { type: 'error', message: 'El nombre de la categoría es obligatorio' } })
        return
      }

      const categoryData = {
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || ''
      }

      if (editingItem) {
        // Actualizar categoría existente
        dispatch({ type: 'updateCategory', payload: { id: editingItem.id, patch: categoryData } })
        dispatch({ type: 'addNotification', payload: { type: 'success', message: 'Categoría actualizada correctamente' } })
      } else {
        // Agregar nueva categoría
        dispatch({ type: 'addCategory', payload: { category: categoryData } })
        dispatch({ type: 'addNotification', payload: { type: 'success', message: 'Categoría agregada correctamente' } })
      }
      
      // Resetear formulario
      setNewCategory({ name: '', description: '' })
      setShowModal(false)
    } catch (error) {
      dispatch({ type: 'addNotification', payload: { type: 'error', message: 'Error al guardar la categoría' } })
    }
  }

  const handleDeleteCategory = (categoryId) => {
    const hasProducts = products.some(p => p.category === categoryId)
    if (hasProducts) {
      dispatch({ type: 'addNotification', payload: { type: 'error', message: 'No se puede eliminar una categoría que tiene productos asignados' } })
      return
    }
    
    if (confirm('¿Seguro que quieres eliminar esta categoría?')) {
      try {
        dispatch({ type: 'deleteCategory', payload: { id: categoryId } })
        dispatch({ type: 'addNotification', payload: { type: 'success', message: 'Categoría eliminada correctamente' } })
      } catch (error) {
        dispatch({ type: 'addNotification', payload: { type: 'error', message: 'Error al eliminar la categoría' } })
      }
    }
  }

  // Funciones de stock
  const handleStockUpdate = (productId, newStock) => {
    setStockUpdates(prev => ({ ...prev, [productId]: newStock }))
  }

  const handleSaveStockUpdates = () => {
    try {
      Object.entries(stockUpdates).forEach(([productId, newStock]) => {
        // Validar que el nuevo stock sea un número válido
        const stockValue = parseInt(newStock)
        if (isNaN(stockValue) || stockValue < 0) {
          throw new Error(`Stock inválido para el producto ${productId}`)
        }
        
        // Actualizar directamente usando dispatch para evitar validaciones complejas
        dispatch({ 
          type: 'updateProduct', 
          payload: { 
            id: productId, 
            patch: { stock: stockValue } 
          } 
        })
      })
      
      setStockUpdates({})
      dispatch({ 
        type: 'addNotification', 
        payload: { 
          type: 'success', 
          message: `Stock actualizado correctamente para ${Object.keys(stockUpdates).length} productos` 
        } 
      })
    } catch (error) {
      dispatch({ 
        type: 'addNotification', 
        payload: { 
          type: 'error', 
          message: error.message || 'Error al actualizar el stock' 
        } 
      })
    }
  }

  const handleShowLowStockAlert = () => {
    setShowLowStockModal(true)
  }

  const handleQuickRestock = (productId, quantity = 10) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) {
        throw new Error('Producto no encontrado')
      }
      
      const newStock = product.stock + quantity
      dispatch({ 
        type: 'updateProduct', 
        payload: { 
          id: productId, 
          patch: { stock: newStock } 
        } 
      })
      
      dispatch({ 
        type: 'addNotification', 
        payload: { 
          type: 'success', 
          message: `${product.name}: +${quantity} unidades. Stock actual: ${newStock}` 
        } 
      })
    } catch (error) {
      dispatch({ 
        type: 'addNotification', 
        payload: { 
          type: 'error', 
          message: error.message || 'Error al reabastecer el producto' 
        } 
      })
    }
  }

  // Funciones de reportes
  const handleGenerateReport = () => {
    let data
    switch (reportType) {
      case 'sales':
        data = generateSalesReport()
        break
      case 'inventory':
        data = generateInventoryReport()
        break
      case 'users':
        data = generateUserReport()
        break
      default:
        data = null
    }
    setReportData(data)
  }

  const handleExportReport = () => {
    if (!reportData) return
    
    const csv = convertToCSV(reportData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ''
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value}"` : value
      }).join(',')
    )
    return [csvHeaders, ...csvRows].join('\n')
  }

  // Funciones de archivo
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Formato de imagen no válido. Use JPG, PNG, GIF o WebP')
      return
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Tamaño máximo: 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setNewProduct(prev => ({ ...prev, image: e.target.result }))
    }
    reader.onerror = () => {
      alert('Error al cargar la imagen')
    }
    reader.readAsDataURL(file)
  }

  // Estadísticas
  const totalProducts = products.length
  const lowStockProducts = products.filter(p => p.stock <= p.lowStock)
  const outOfStockProducts = products.filter(p => p.stock === 0)
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  const openOrders = orders.filter(o => o.status === 'open')
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.timestamp).toDateString()
    const today = new Date().toDateString()
    return orderDate === today
  })

  // Auto-mostrar modal de stock bajo
  useEffect(() => {
    if (lowStockProducts.length > 0 && !lowStockAlertDismissed && !showModal) {
      const timer = setTimeout(() => {
        setShowLowStockModal(true)
      }, 2000) // Esperar 2 segundos después de cargar la página
      
      return () => clearTimeout(timer)
    }
  }, [lowStockProducts.length, lowStockAlertDismissed, showModal])

  // Reset del estado cuando cambie el stock
  useEffect(() => {
    if (lowStockProducts.length === 0) {
      setLowStockAlertDismissed(false)
      setShowLowStockModal(false)
    }
  }, [lowStockProducts.length])

  const getStockStatus = (product) => {
    if (product.stock === 0) return { status: 'out', color: '#e74c3c', text: 'Agotado' }
    if (product.stock <= product.lowStock) return { status: 'low', color: '#f39c12', text: 'Bajo' }
    return { status: 'good', color: '#27ae60', text: 'Bien' }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return '#e67e22'
      case 'ready': return '#27ae60' 
      case 'closed': return '#95a5a6'
      case 'cancelled': return '#e74c3c'
      default: return '#3498db'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'open': return 'Abierta'
      case 'ready': return 'Lista'
      case 'closed': return 'Entregada'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  const renderProductsTab = () => (
    <div className="products-management">
      <div className="section-header">
        <h2>📦 Gestión de Productos</h2>
        <button className="btn btn-primary" onClick={handleAddProduct}>
          ➕ Agregar Producto
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-number">{totalProducts}</div>
            <div className="stat-label">Total Productos</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Stock Mínimo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const category = categories.find(c => c.id === product.category)
              const stockInfo = getStockStatus(product)
              
              return (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="product-thumbnail"
                      onError={(e) => {
                        e.target.src = '/images/products/default-food.svg'
                      }}
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{category?.name || 'Sin categoría'}</td>
                  <td className="price">{currency(product.price)}</td>
                  <td className="stock-current">{product.stock}</td>
                  <td className="stock-min">{product.lowStock}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: stockInfo.color }}
                    >
                      {stockInfo.text}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderCategoriesTab = () => (
    <div className="categories-management">
      <div className="section-header">
        <h2>🏷️ Gestión de Categorías</h2>
        <button className="btn btn-primary" onClick={handleAddCategory}>
          ➕ Agregar Categoría
        </button>
      </div>

      <div className="categories-grid">
        {categories.map(category => {
          const categoryProducts = products.filter(p => p.category === category.id)
          
          return (
            <div key={category.id} className="category-section">
              <div className={`category-card ${categoryProducts.length === 0 ? 'empty-category' : ''}`}>
                <div className="category-header">
                  <h3>{category.name}</h3>
                  <span className="category-count">{categoryProducts.length} productos</span>
                </div>
                <p className="category-description">{category.description}</p>
                <div className="category-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>

              {/* Productos de esta categoría */}
              {categoryProducts.length > 0 && (
                <div className="category-products">
                  <h4>Productos en {category.name}</h4>
                  <div className="products-grid">
                    {categoryProducts.map(product => {
                      const stockInfo = getStockStatus(product)
                      
                      return (
                        <div key={product.id} className="product-card">
                          <div className="product-image">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="product-thumbnail"
                              onError={(e) => {
                                e.target.src = '/images/products/default-food.svg'
                              }}
                            />
                          </div>
                          <div className="product-info">
                            <h5 className="product-name">{product.name}</h5>
                            <div className="product-details">
                              <div className="product-price">{currency(product.price)}</div>
                              <div className="product-stock">
                                <span>Stock: {product.stock}</span>
                                <span 
                                  className="status-badge-sm"
                                  style={{ backgroundColor: stockInfo.color }}
                                >
                                  {stockInfo.text}
                                </span>
                              </div>
                            </div>
                            <div className="product-actions">
                              <button
                                className="btn btn-secondary btn-xs"
                                onClick={() => handleEditProduct(product)}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                className="btn btn-danger btn-xs"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay productos */}
              {categoryProducts.length === 0 && (
                <div className="empty-products">
                  <p>No hay productos en esta categoría</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddProduct}
                  >
                    ➕ Agregar Primer Producto
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Productos sin categoría */}
      {(() => {
        const uncategorizedProducts = products.filter(p => !p.category || p.category === '')
        if (uncategorizedProducts.length > 0) {
          return (
            <div className="category-section">
              <div className="category-card uncategorized">
                <div className="category-header">
                  <h3>📋 Sin Categoría</h3>
                  <span className="category-count">{uncategorizedProducts.length} productos</span>
                </div>
                <p className="category-description">Productos que no han sido asignados a ninguna categoría</p>
              </div>

              <div className="category-products">
                <h4>Productos sin categoría</h4>
                <div className="products-grid">
                  {uncategorizedProducts.map(product => {
                    const stockInfo = getStockStatus(product)
                    
                    return (
                      <div key={product.id} className="product-card">
                        <div className="product-image">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="product-thumbnail"
                            onError={(e) => {
                              e.target.src = '/images/products/default-food.svg'
                            }}
                          />
                        </div>
                        <div className="product-info">
                          <h5 className="product-name">{product.name}</h5>
                          <div className="product-details">
                            <div className="product-price">{currency(product.price)}</div>
                            <div className="product-stock">
                              <span>Stock: {product.stock}</span>
                              <span 
                                className="status-badge-sm"
                                style={{ backgroundColor: stockInfo.color }}
                              >
                                {stockInfo.text}
                              </span>
                            </div>
                          </div>
                          <div className="product-actions">
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleEditProduct(product)}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        }
        return null
      })()}
    </div>
  )

  const renderInventoryTab = () => (
    <div className="inventory-management">
      <div className="section-header">
        <h2>📊 Gestión de Inventario</h2>
        {Object.keys(stockUpdates).length > 0 && (
          <button className="btn btn-success" onClick={handleSaveStockUpdates}>
            💾 Guardar Cambios ({Object.keys(stockUpdates).length})
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-number">{totalProducts}</div>
            <div className="stat-label">Total Productos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number">{lowStockProducts.length}</div>
            <div className="stat-label">Stock Bajo</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚫</div>
          <div className="stat-content">
            <div className="stat-number">{outOfStockProducts.length}</div>
            <div className="stat-label">Agotados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-number">{currency(totalValue)}</div>
            <div className="stat-label">Valor Total</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Nuevo Stock</th>
              <th>Estado</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const category = categories.find(c => c.id === product.category)
              const stockInfo = getStockStatus(product)
              const pendingUpdate = stockUpdates[product.id]
              
              return (
                <tr key={product.id}>
                  <td>
                    <div className="product-info">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="product-thumbnail"
                        onError={(e) => {
                          e.target.src = '/images/products/default-food.svg'
                        }}
                      />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{category?.name || 'Sin categoría'}</td>
                  <td className="stock-current">{product.stock}</td>
                  <td className="stock-min">{product.lowStock}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={pendingUpdate !== undefined ? pendingUpdate : product.stock}
                      onChange={(e) => handleStockUpdate(product.id, e.target.value)}
                      className="stock-input"
                    />
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: stockInfo.color }}
                    >
                      {stockInfo.text}
                    </span>
                  </td>
                  <td className="price">{currency(product.price * product.stock)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderOrdersTab = () => {
    const sortedOrders = [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    return (
      <div className="orders-management">
        <div className="section-header">
          <h2>📋 Gestión de Órdenes</h2>
          <div className="stats">
            <span className="stat">
              Total: {orders.length}
            </span>
            <span className="stat">
              Abiertas: {openOrders.length}
            </span>
            <span className="stat">
              Hoy: {todayOrders.length}
            </span>
          </div>
        </div>

        <div className="orders-list">
          {sortedOrders.map(order => {
            // Calcular total de la orden
            const orderTotal = order.items?.reduce((sum, item) => sum + (item.price * item.qty), 0) || 0
            
            return (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>#{order.id.slice(-6)} - {order.tableNumber || order.name}</h3>
                    <div className="order-meta">
                      <span className="order-date">
                        {new Date(order.timestamp || order.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                  <div className="order-total">
                    <span className="total-label">Total:</span>
                    <span className="total-amount">{currency(orderTotal)}</span>
                  </div>
                </div>

                {/* Items de la orden */}
                <div className="order-items-detailed">
                  <h4>Productos en esta orden:</h4>
                  <div className="items-list">
                    {order.items?.map(item => {
                      const product = products.find(p => p.id === item.productId)
                      const itemTotal = item.price * item.qty
                      
                      return (
                        <div key={item.id} className="order-item-detail">
                          <div className="item-image">
                            <img 
                              src={product?.image || '/images/products/default-food.svg'} 
                              alt={product?.name || 'Producto'}
                              className="item-thumbnail"
                              onError={(e) => {
                                e.target.src = '/images/products/default-food.svg'
                              }}
                            />
                          </div>
                          <div className="item-info">
                            <div className="item-name">{product?.name || 'Producto no encontrado'}</div>
                            <div className="item-details">
                              <span className="item-quantity">Cantidad: {item.qty}</span>
                              <span className="item-price">Precio unitario: {currency(item.price)}</span>
                              <span className="item-total">Subtotal: {currency(itemTotal)}</span>
                            </div>
                            {item.notes && (
                              <div className="item-notes">
                                <strong>Notas:</strong> {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Solo visualización para admin - Sin acciones */}
                {/* Los empleados manejan el estado de las órdenes */}

                {/* Notas de la orden */}
                {order.notes && (
                  <div className="order-notes">
                    <strong>Notas de la orden:</strong> {order.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {sortedOrders.length === 0 && (
          <div className="empty-state">
            <p>No hay órdenes registradas</p>
          </div>
        )}
      </div>
    )
  }

  const renderUsersTab = () => (
    <div className="users-management">
      <div className="section-header">
        <h2>👥 Gestión de Usuarios</h2>
      </div>

      <div className="user-info">
        <h3>Usuario Actual</h3>
        <div className="current-user-card">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <div className="user-name">{currentUser?.username}</div>
            <div className="user-role">
              {currentUser?.role === 'adminBar' ? 'Administrador' : 'Empleado'}
            </div>
          </div>
        </div>
      </div>

      <div className="system-actions">
        <h3>Acciones del Sistema</h3>
        <div className="action-grid">
          <button 
            className="btn btn-secondary"
            onClick={toggleTheme}
          >
            🌓 Cambiar Tema
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => {
              if (confirm('¿Seguro que quieres reiniciar los datos de demo?')) {
                dispatch({ type: 'resetDemo' })
              }
            }}
          >
            🔄 Reiniciar Demo
          </button>
        </div>
      </div>
    </div>
  )

  const renderReportsTab = () => (
    <div className="reports-management">
      <div className="section-header">
        <h2>📈 Reportes y Análisis</h2>
      </div>

      <div className="report-controls">
        <div className="report-type-selector">
          <label>Tipo de Reporte:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="select"
          >
            <option value="sales">Reporte de Ventas</option>
            <option value="inventory">Reporte de Inventario</option>
            <option value="users">Reporte de Usuarios</option>
          </select>
        </div>
        <div className="report-actions">
          <button className="btn btn-primary" onClick={handleGenerateReport}>
            📊 Generar Reporte
          </button>
          {reportData && (
            <button className="btn btn-secondary" onClick={handleExportReport}>
              📄 Exportar CSV
            </button>
          )}
        </div>
      </div>

      {reportData && (
        <div className="report-results">
          <h3>Resultados del Reporte</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {Object.keys(reportData[0] || {}).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr key={index}>
                    {Object.entries(row).map(([key, value], i) => (
                      <td key={i}>
                        {typeof value === 'number' && (key.includes('precio') || key.includes('total')) ? 
                          currency(value) : value
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderSystemTab = () => (
    <div className="system-management">
      <div className="section-header">
        <h2>⚙️ Administración del Sistema</h2>
      </div>

      <div className="system-info">
        <h3>Información del Sistema</h3>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-label">Versión:</div>
            <div className="info-value">1.0.0</div>
          </div>
          <div className="info-card">
            <div className="info-label">Productos:</div>
            <div className="info-value">{totalProducts}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Categorías:</div>
            <div className="info-value">{categories.length}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Órdenes Total:</div>
            <div className="info-value">{orders.length}</div>
          </div>
        </div>
      </div>

      <div className="system-settings">
        <h3>Configuraciones</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Tema:</label>
            <button className="btn btn-secondary" onClick={toggleTheme}>
              🌓 Cambiar Tema
            </button>
          </div>
          <div className="setting-item">
            <label>Datos de Demo:</label>
            <button 
              className="btn btn-warning"
              onClick={() => {
                if (confirm('¿Seguro que quieres reiniciar todos los datos?')) {
                  dispatch({ type: 'resetDemo' })
                }
              }}
            >
              🔄 Reiniciar Todo
            </button>
          </div>
        </div>
      </div>

      <div className="system-backup">
        <h3>Respaldo y Restauración</h3>
        <div className="backup-actions">
          <button 
            className="btn btn-success"
            onClick={() => {
              const data = JSON.stringify(state, null, 2)
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `backup_${nowIso().split('T')[0]}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            💾 Descargar Respaldo
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 Restaurar Respaldo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                  try {
                    const data = JSON.parse(e.target.result)
                    dispatch({ type: 'restoreBackup', payload: data })
                    alert('Respaldo restaurado correctamente')
                  } catch (error) {
                    alert('Error al restaurar el respaldo')
                  }
                }
                reader.readAsText(file)
              }
            }}
          />
        </div>
      </div>
    </div>
  )

  const renderLowStockModal = () => {
    if (!showLowStockModal) return null

    return (
      <Modal
        open={showLowStockModal}
        title="⚠️ Alerta de Stock Bajo"
        onClose={() => {
          setShowLowStockModal(false)
          setLowStockAlertDismissed(true)
        }}
      >
        <div className="low-stock-modal">
          <div className="modal-header">
            <div className="alert-banner">
              <span className="alert-icon">🚨</span>
              <div className="alert-content">
                <strong>¡Atención!</strong> Tienes {lowStockProducts.length} producto{lowStockProducts.length !== 1 ? 's' : ''} con stock por debajo del mínimo configurado.
              </div>
            </div>
          </div>
          
          <div className="low-stock-list">
            {lowStockProducts.map(product => {
              const category = categories.find(c => c.id === product.category)
              const stockInfo = getStockStatus(product)
              
              return (
                <div key={product.id} className="low-stock-item">
                  <div className="product-info">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="product-thumbnail"
                      onError={(e) => {
                        e.target.src = '/images/products/default-food.svg'
                      }}
                    />
                    <div className="product-details">
                      <div className="product-name">{product.name}</div>
                      <div className="product-meta">
                        <span className="category">{category?.name || 'Sin categoría'}</span>
                        <span className="price">{currency(product.price)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="stock-info">
                    <div className="stock-numbers">
                      <span className="current-stock">
                        Actual: <strong style={{ color: stockInfo.color }}>{product.stock}</strong>
                      </span>
                      <span className="min-stock">
                        Mínimo: <strong>{product.lowStock}</strong>
                      </span>
                    </div>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: stockInfo.color }}
                    >
                      {stockInfo.text}
                    </span>
                  </div>
                  
                  <div className="stock-actions">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleQuickRestock(product.id, 10)}
                      title="Reabastecer 10 unidades"
                    >
                      +10
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleQuickRestock(product.id, 20)}
                      title="Reabastecer 20 unidades"
                    >
                      +20
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        handleEditProduct(product)
                        setShowLowStockModal(false)
                        setLowStockAlertDismissed(true)
                      }}
                      title="Editar producto"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          
          {lowStockProducts.length === 0 && (
            <div className="no-low-stock">
              <div className="success-icon">✅</div>
              <p>¡Excelente! No hay productos con stock bajo.</p>
            </div>
          )}
          
          <div className="modal-actions">
            <button 
              className="btn btn-ghost"
              onClick={() => {
                setShowLowStockModal(false)
                setLowStockAlertDismissed(true)
              }}
            >
              No mostrar hasta la próxima sesión
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowLowStockModal(false)}
            >
              Recordar más tarde
            </button>
            {lowStockProducts.length > 0 && (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab('inventory')
                  setShowLowStockModal(false)
                  setLowStockAlertDismissed(true)
                }}
              >
                📊 Ir a Inventario
              </button>
            )}
          </div>
        </div>
      </Modal>
    )
  }

  const renderModal = () => {
    if (!showModal) return null

    const isProductModal = modalType.includes('Product')
    const isCategoryModal = modalType.includes('Category')

    return (
      <Modal
        open={showModal}
        title={
          modalType === 'addProduct' ? 'Agregar Producto' :
          modalType === 'editProduct' ? 'Editar Producto' :
          modalType === 'addCategory' ? 'Agregar Categoría' :
          modalType === 'editCategory' ? 'Editar Categoría' : ''
        }
        onClose={() => setShowModal(false)}
      >
        {isProductModal && (
          <div className="modal-form">
            <div className="form-section">
              <h4>Información Básica</h4>
              
              <div className="input-group">
                <label htmlFor="product-name">
                  <span className="required">*</span> Nombre del Producto:
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Hamburguesa Clásica"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="product-category">Categoría:</label>
                <select
                  id="product-category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <small style={{ color: 'var(--warning)' }}>
                    No hay categorías. <button type="button" onClick={handleAddCategory} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'var(--primary)' }}>Crear una aquí</button>
                  </small>
                )}
              </div>
            </div>

            <div className="form-section">
              <h4>Precio e Inventario</h4>
              
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="product-price">
                    <span className="required">*</span> Precio ($):
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="product-stock">
                    <span className="required">*</span> Stock Inicial:
                  </label>
                  <input
                    id="product-stock"
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="product-low-stock">
                  <span className="required">*</span> Stock Mínimo:
                </label>
                <input
                  id="product-low-stock"
                  type="number"
                  min="0"
                  value={newProduct.lowStock}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, lowStock: e.target.value }))}
                  placeholder="0"
                  required
                />
                <small style={{ color: 'var(--muted)' }}>
                  Te avisaremos cuando el stock esté por debajo de este número
                </small>
              </div>
            </div>

            <div className="form-section">
              <h4>Imagen del Producto</h4>
              
              <div className="input-group">
                <label>Foto del producto:</label>
                <div className="image-upload-container">
                  <div className="image-preview">
                    <img 
                      src={newProduct.image} 
                      alt="Vista previa"
                      className="product-image-preview"
                      onError={(e) => {
                        e.target.src = '/images/products/default-food.svg'
                      }}
                    />
                  </div>
                  <div className="upload-controls">
                    <input
                      type="file"
                      id="product-image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="product-image-upload" className="btn btn-secondary upload-btn">
                      📷 Seleccionar Imagen
                    </label>
                    <small style={{ color: 'var(--muted)' }}>
                      Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowModal(false)}
              >
                ❌ Cancelar
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={handleSaveProduct}
                disabled={!newProduct.name || !newProduct.price || !newProduct.stock || !newProduct.lowStock}
              >
                {editingItem ? '✏️ Actualizar Producto' : '➕ Agregar Producto'}
              </button>
            </div>
            
            {(!newProduct.name || !newProduct.price || !newProduct.stock || !newProduct.lowStock) && (
              <div className="form-validation">
                <small style={{ color: 'var(--warning)' }}>
                  <span className="required">*</span> Campos obligatorios
                </small>
              </div>
            )}
          </div>
        )}

        {isCategoryModal && (
          <div className="modal-form">
            <div className="input-group">
              <label>Nombre de la Categoría:</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de la categoría"
              />
            </div>

            <div className="input-group">
              <label>Descripción:</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción de la categoría"
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveCategory}
                disabled={!newCategory.name}
              >
                {editingItem ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    )
  }

  const tabs = [
    { id: 'products', label: '📦 Productos', render: renderProductsTab },
    { id: 'categories', label: '🏷️ Categorías', render: renderCategoriesTab },
    { id: 'inventory', label: '📊 Inventario', render: renderInventoryTab },
    { id: 'orders', label: '📋 Órdenes', render: renderOrdersTab },
    { id: 'users', label: '👥 Usuarios', render: renderUsersTab },
    { id: 'reports', label: '📈 Reportes', render: renderReportsTab },
    { id: 'system', label: '⚙️ Sistema', render: renderSystemTab }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="admin-panel">
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTabData && activeTabData.render()}
      </div>

      {renderModal()}
      {renderLowStockModal()}
    </div>
  )
}