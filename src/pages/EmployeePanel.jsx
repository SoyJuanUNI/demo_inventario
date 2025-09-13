import React, { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useOrders } from '../hooks/useOrders.js'
import { useProducts } from '../hooks/useProducts.js'
import { useCategories } from '../hooks/useCategories.js'
import { useNotifications } from '../hooks/useNotifications.js'
import { useAuth } from '../hooks/useAuth.js'
import { useUI } from '../hooks/useUI.js'
import { currency } from '../utils/format.js'
import Modal from '../components/Modal.jsx'
import QRModal from '../components/QRModal.jsx'
import { ActionButton, LoadingButton } from '../components/EnhancedButton.jsx'

function InventoryList({ onAdd, onAddWithOptions, filterText, categoryId, availability }) {
  const { products } = useProducts()
  const { categories } = useCategories()
  const { isHappyHour } = useProducts()
  
  const filtered = useMemo(() => products
    .filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()))
    .filter(p => categoryId === 'all' || p.category === categoryId)
    .filter(p => availability === 'all' ? true : availability === 'available' ? p.stock > 0 : p.stock <= 0)
    .sort((a,b) => a.name.localeCompare(b.name)), [products, filterText, categoryId, availability])
  const cats = useMemo(() => categories
    .filter(c => filtered.some(p => p.category === c.id))
    .sort((a,b) => a.name.localeCompare(b.name)), [categories, filtered])

  const [sel, setSel] = useState(0)
  useEffect(() => { setSel(0) }, [filterText, categoryId, availability])
  useEffect(() => {
    const onKey = (e) => {
      if (!filtered.length) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter') { const pid = filtered[sel]?.id; if (pid) onAdd(pid) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, sel, onAdd])

  const rowClass = (pid) => filtered[sel]?.id === pid ? 'selected' : ''

  return (
    <div className="inventory-container">
      <h3>Inventario</h3>
      {cats.length === 0 && <div className="small">No hay productos para mostrar.</div>}
      {cats.map(cat => (
        <div key={cat.id} className="inventory-category">
          <h4>{cat.name}</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.filter(p => p.category === cat.id).map(p => {
                const happyHour = isHappyHour(p)
                const finalPrice = happyHour ? p.price * (1 - p.happyHourDiscount / 100) : p.price
                return (
                  <tr key={p.id} className={rowClass(p.id)} onMouseEnter={() => setSel(filtered.findIndex(fp => fp.id === p.id))}>
                    <td>
                      {p.image && (
                        <img 
                          src={p.image} 
                          alt={p.name}
                          className="product-table-image"
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            objectFit: p.name.toLowerCase().includes('agua') ? 'contain' : 'cover', 
                            borderRadius: '4px',
                            border: '1px solid var(--border-color, #ddd)',
                            backgroundColor: p.name.toLowerCase().includes('agua') ? '#f8f9fa' : 'transparent'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
                    </td>
                    <td>
                      {p.name} 
                      <span className={`badge ${p.stock <= p.lowStock ? 'low' : 'ok'}`}>
                        {p.stock <= p.lowStock ? 'Bajo' : 'OK'}
                      </span>
                      {happyHour && <span className="badge happy-hour">Happy Hour -{p.happyHourDiscount}%</span>}
                    </td>
                    <td>
                      {happyHour ? (
                        <span>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                            ${p.price.toLocaleString('es-CO')}
                          </span>
                          {' '}
                          <strong>${finalPrice.toLocaleString('es-CO')}</strong>
                        </span>
                      ) : (
                        `$${p.price.toLocaleString('es-CO')}`
                      )}
                    </td>
                    <td>{p.stock}</td>
                    <td>
                      <div className="inventory-actions">
                        <button 
                          className="primary" 
                          disabled={p.stock <= 0} 
                          onClick={() => onAdd(p.id)}
                        >
                          {p.stock <= 0 ? 'Sin stock' : '+ Añadir'}
                        </button>
                        {p.stock > 0 && (
                          <button 
                            className="secondary" 
                            onClick={() => onAddWithOptions(p.id)}
                          >
                            Con opciones
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function OrderEditor({ orderId }) {
  const { orders, getOrderTotal, updateOrderNotes, updateItemNotes, transferOrder, transferItems, splitOrder, finalizeOrder, cancelOrder, addItemToOrder, removeItemFromOrder } = useOrders()
  const { products, getProduct } = useProducts()
  const order = orders.find(o => o.id === orderId)
  const items = order?.items || []
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [itemNotesModal, setItemNotesModal] = useState(null)
  const [orderNotes, setOrderNotes] = useState(order?.notes || '')
  const [itemNotes, setItemNotes] = useState('')
  const [transferModal, setTransferModal] = useState(false)
  const [splitModal, setSplitModal] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [qrModal, setQrModal] = useState(false)

  useEffect(() => {
    setOrderNotes(order?.notes || '')
  }, [order?.notes])

  if (!order) return <div className="card">Seleccione o cree una orden.</div>

  const getName = (pid) => getProduct(pid)?.name || pid
  const openOrders = orders.filter(o => o.status === 'open' && o.id !== orderId)

  const handleSaveOrderNotes = () => {
    updateOrderNotes(orderId, orderNotes)
    setNotesModalOpen(false)
  }

  const handleSaveItemNotes = () => {
    if (itemNotesModal) {
      updateItemNotes(orderId, itemNotesModal.id, itemNotes)
      setItemNotesModal(null)
      setItemNotes('')
    }
  }

  const handleTransferOrder = (toOrderId) => {
    transferOrder(orderId, toOrderId)
    setTransferModal(false)
  }

  const handleTransferItems = (toOrderId) => {
    if (selectedItems.length > 0) {
      const itemsToTransfer = items.filter(item => selectedItems.includes(item.id))
      transferItems(orderId, toOrderId, itemsToTransfer)
      setSelectedItems([])
    }
  }

  const handleSplitOrder = (newOrderName) => {
    if (selectedItems.length > 0) {
      const itemsToSplit = items.filter(item => selectedItems.includes(item.id))
      splitOrder(orderId, itemsToSplit, newOrderName)
      setSelectedItems([])
      setSplitModal(false)
    }
  }

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  return (
    <>
      <div className="order-card">
        <div className="order-header">
          <div>
            <h3>Orden: {order.name} <span className="badge ok">Abierta</span></h3>
            {order.notes && <div className="small" style={{ color: 'var(--text-muted)' }}>📝 {order.notes}</div>}
          </div>
          <div className="input-row">
            <ActionButton 
              className="primary small"
              onClick={() => setQrModal(true)}
              title="Generar código QR para que el cliente vea su orden"
            >
              📱 QR
            </ActionButton>
            <button className="ghost" onClick={() => setNotesModalOpen(true)}>📝 Notas</button>
            <button className="ghost" onClick={() => setTransferModal(true)} disabled={openOrders.length === 0}>
              🔄 Transferir
            </button>
            <button className="ghost" onClick={() => setSplitModal(true)} disabled={items.length === 0}>
              ✂️ Dividir
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={selectedItems.length === items.length && items.length > 0}
                    onChange={(e) => setSelectedItems(e.target.checked ? items.map(i => i.id) : [])}
                  />
                </th>
                <th>Item</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan="7" className="small">Sin items. Agregue productos desde el inventario.</td></tr>
              )}
              {items.map(it => (
                <tr key={it.id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(it.id)}
                      onChange={() => toggleItemSelection(it.id)}
                    />
                  </td>
                  <td>
                    {getName(it.productId)}
                    {it.discount > 0 && <span className="badge" style={{ background: 'var(--success)' }}>-{it.discount}%</span>}
                    {it.originalPrice !== it.price && <span className="badge happy-hour">Happy Hour</span>}
                  </td>
                  <td>{it.qty}</td>
                  <td>
                    {it.originalPrice !== it.price ? (
                      <span>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                          {currency(it.originalPrice)}
                        </span>
                        {' '}
                        <strong>{currency(it.price)}</strong>
                      </span>
                    ) : (
                      currency(it.price)
                    )}
                  </td>
                  <td>{currency(it.price * it.qty)}</td>
                  <td>
                    <button 
                      className="ghost small" 
                      onClick={() => {
                        setItemNotesModal(it)
                        setItemNotes(it.notes || '')
                      }}
                    >
                      {it.notes ? '📝' : '➕'}
                    </button>
                  </td>
                  <td>
                    <div className="input-row">
                      <button className="ghost qty-btn" onClick={() => addItemToOrder(orderId, it.productId, { notes: it.notes, discount: it.discount })}>+1</button>
                      <button className="ghost qty-btn" onClick={() => removeItemFromOrder(orderId, it.id)}>-1</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="order-footer">
          <div>Total: <strong>{currency(getOrderTotal(order))}</strong></div>
          <div className="input-row">
            <button className="danger" onClick={() => setConfirmOpen(true)}>Cancelar</button>
            <button className="success" onClick={() => finalizeOrder(orderId)}>Finalizar</button>
          </div>
        </div>

        {/* Modal de confirmación de cancelación */}
        <Modal
          open={confirmOpen}
          title={`Cancelar ${order.name}`}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => { cancelOrder(orderId); setConfirmOpen(false) }}
          actions={(
            <>
              <button className="ghost" onClick={() => setConfirmOpen(false)}>No, volver</button>
              <button className="danger" onClick={() => { cancelOrder(orderId); setConfirmOpen(false) }}>Sí, cancelar</button>
            </>
          )}
        >
          <div className="small">Esta acción devolverá el stock de los items de la orden.</div>
        </Modal>

        {/* Modal de notas de orden */}
        <Modal
          open={notesModalOpen}
          title={`Notas para ${order.name}`}
          onClose={() => setNotesModalOpen(false)}
          actions={(
            <>
              <button className="ghost" onClick={() => setNotesModalOpen(false)}>Cancelar</button>
              <button className="primary" onClick={handleSaveOrderNotes}>Guardar</button>
            </>
          )}
        >
          <textarea
            placeholder="Ingrese notas para esta orden..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            rows={4}
            style={{ width: '100%', marginBottom: 12 }}
          />
        </Modal>

        {/* Modal de notas de item */}
        <Modal
          open={!!itemNotesModal}
          title={`Notas para ${getName(itemNotesModal?.productId)}`}
          onClose={() => { setItemNotesModal(null); setItemNotes('') }}
          actions={(
            <>
              <button className="ghost" onClick={() => { setItemNotesModal(null); setItemNotes('') }}>Cancelar</button>
              <button className="primary" onClick={handleSaveItemNotes}>Guardar</button>
            </>
          )}
        >
          <textarea
            placeholder="Ej: sin hielo, poco picante, extra salsa..."
            value={itemNotes}
            onChange={(e) => setItemNotes(e.target.value)}
            rows={3}
            style={{ width: '100%', marginBottom: 12 }}
          />
        </Modal>

        {/* Modal de transferencia */}
        <Modal
          open={transferModal}
          title="Transferir orden"
          onClose={() => setTransferModal(false)}
          actions={(
            <>
              <button className="ghost" onClick={() => setTransferModal(false)}>Cancelar</button>
            </>
          )}
        >
          <div style={{ marginBottom: 16 }}>
            <p>¿Qué desea transferir?</p>
            <div className="input-row" style={{ marginBottom: 12 }}>
              <button 
                className="primary" 
                onClick={() => {
                  if (openOrders.length === 1) {
                    handleTransferOrder(openOrders[0].id)
                  }
                }}
                disabled={openOrders.length !== 1}
              >
                Toda la orden
              </button>
              <button 
                className="primary" 
                disabled={selectedItems.length === 0}
              >
                Items seleccionados ({selectedItems.length})
              </button>
            </div>
          </div>
          
          <div>
            <p>Destino:</p>
            {openOrders.map(o => (
              <button 
                key={o.id}
                className="ghost" 
                style={{ display: 'block', width: '100%', marginBottom: 8 }}
                onClick={() => {
                  if (selectedItems.length > 0) {
                    handleTransferItems(o.id)
                    setTransferModal(false)
                  } else {
                    handleTransferOrder(o.id)
                  }
                }}
              >
                {o.name}
              </button>
            ))}
            {openOrders.length === 0 && <div className="small">No hay otras órdenes abiertas</div>}
          </div>
        </Modal>

        {/* Modal de división */}
        <Modal
          open={splitModal}
          title="Dividir cuenta"
          onClose={() => setSplitModal(false)}
          actions={(
            <>
              <button className="ghost" onClick={() => setSplitModal(false)}>Cancelar</button>
              <button 
                className="primary" 
                disabled={selectedItems.length === 0}
                onClick={() => {
                  const newName = prompt('Nombre para la nueva orden:', `${order.name} - División`)
                  if (newName) handleSplitOrder(newName)
                }}
              >
                Dividir ({selectedItems.length} items)
              </button>
            </>
          )}
        >
          <p>Seleccione los items que desea trasladar a una nueva orden:</p>
          <div className="small" style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
            {selectedItems.length} items seleccionados para dividir
          </div>
          {selectedItems.length === 0 && (
            <div className="small">Seleccione items usando las casillas de verificación arriba</div>
          )}
        </Modal>
      </div>

      {/* Modal QR */}
      <QRModal
        key={`qr-${order.id}`}
        open={qrModal}
        onClose={() => setQrModal(false)}
        orderData={order}
        tableName={order?.name}
      />
    </>
  )
}

function HappyHourControls() {
  const { categories } = useCategories()
  const { products, applyHappyHour, removeHappyHour } = useProducts()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [discount, setDiscount] = useState(15)

  const applyHappyHourToCategory = () => {
    if (selectedCategory && discount > 0) {
      applyHappyHour(selectedCategory, discount)
      setSelectedCategory('')
      setDiscount(15)
    }
  }

  const removeHappyHourFromCategory = (categoryId) => {
    removeHappyHour(categoryId)
  }

  const activeCategoriesWithHH = categories.filter(cat => 
    products.some(p => p.category === cat.id && p.happyHourActive)
  )

  return (
    <div className="card">
      <h3>🕐 Happy Hour</h3>
      
      {activeCategoriesWithHH.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4>Activo:</h4>
          {activeCategoriesWithHH.map(cat => {
            const productsInCategory = products.filter(p => p.category === cat.id && p.happyHourActive)
            const avgDiscount = productsInCategory.reduce((sum, p) => sum + p.happyHourDiscount, 0) / productsInCategory.length
            return (
              <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span>{cat.name} (-{Math.round(avgDiscount)}%)</span>
                <button className="danger small" onClick={() => removeHappyHourFromCategory(cat.id)}>Remover</button>
              </div>
            )
          })}
        </div>
      )}

      <div className="input-row">
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">Seleccionar categoría</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input 
          type="number" 
          min="1" 
          max="50" 
          value={discount} 
          onChange={(e) => setDiscount(Number(e.target.value))}
          placeholder="% descuento"
          style={{ width: '100px' }}
        />
        <button className="primary" onClick={applyHappyHourToCategory} disabled={!selectedCategory || discount <= 0}>
          Aplicar
        </button>
      </div>
      
      <div className="small" style={{ marginTop: 8, color: 'var(--text-muted)' }}>
        Los descuentos se aplicarán automáticamente según el horario configurado de cada producto
      </div>
    </div>
  )
}

export default function EmployeePanel() {
  const { orders, createOrder, addItemToOrder, reopenOrder } = useOrders()
  const { products, getProduct } = useProducts()
  const { categories } = useCategories()
  const { currentUser } = useAuth()
  const { ui, setEmployeeTargetOrderId } = useUI()
  const [name, setName] = useState('Mesa 1')
  const [filter, setFilter] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [availability, setAvailability] = useState('all') // all | available | out
  const [targetOrderId, setTargetOrderId] = useState('')
  const [addItemModal, setAddItemModal] = useState(null)
  const [itemNotes, setItemNotes] = useState('')
  const [itemDiscount, setItemDiscount] = useState(0)

  const openOrders = orders.filter(o => o.status === 'open')
  const myHistory = orders.filter(o => o.createdBy === currentUser?.id && (o.status === 'closed' || o.status === 'canceled'))

  const createNewOrder = () => {
    if (!name.trim()) return
    createOrder(name.trim())
    setName('Mesa ' + (openOrders.length + 2))
  }

  // Restaurar selección desde UI persistida y mantener target válido
  // Manejar orden objetivo (evitar loop infinito)
  useEffect(() => {
    const stored = ui?.employeeTargetOrderId
    const exists = stored && openOrders.find(o => o.id === stored)
    if (!targetOrderId) {
      setTargetOrderId(exists ? stored : (openOrders[0]?.id || ''))
    } else if (!openOrders.find(o => o.id === targetOrderId)) {
      setTargetOrderId(openOrders[0]?.id || '')
    }
  }, [openOrders, targetOrderId]) // Removido 'ui' para evitar loop

  // Persistir selección en el estado global (sessionStorage) - Solo cuando cambie manualmente
  useEffect(() => {
    if (targetOrderId && targetOrderId !== ui?.employeeTargetOrderId) {
      setEmployeeTargetOrderId(targetOrderId)
    }
  }, [targetOrderId]) // Removido setEmployeeTargetOrderId de dependencias

  const handleAddItemWithOptions = (productId) => {
    const product = getProduct(productId)
    if (!product) return
    
    setAddItemModal({ productId, productName: product.name })
    setItemNotes('')
    setItemDiscount(0)
  }

  const handleQuickAddItem = (productId) => {
    if (targetOrderId) {
      addItemToOrder(targetOrderId, productId, {
        notes: '',
        discount: 0
      })
    }
  }

  const confirmAddItem = () => {
    if (addItemModal && targetOrderId) {
      addItemToOrder(targetOrderId, addItemModal.productId, {
        notes: itemNotes,
        discount: itemDiscount
      })
      setAddItemModal(null)
      setItemNotes('')
      setItemDiscount(0)
    }
  }

  return (
    <div className="row">
      <div className="col" style={{ flex: 1.8, minWidth: '400px' }}>
        <div className="card">
          <h3>Crear nueva mesa/orden</h3>
          <div className="input-row">
            <input placeholder="Mesa o nombre" value={name} onChange={e => setName(e.target.value)} />
            <button className="primary" onClick={createNewOrder}>Crear</button>
          </div>
        </div>

        <HappyHourControls />

        <div className="card" style={{ marginTop: 12 }}>
          <h3>Órdenes abiertas</h3>
          <div className="input-row" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
            {openOrders.map(o => (
              <span key={o.id} className="badge ok" style={{ marginRight: 6 }}>{o.name}</span>
            ))}
            {openOrders.length === 0 && <div className="small">No hay órdenes abiertas.</div>}
          </div>
          <div className="input-row">
            <input placeholder="Buscar producto..." value={filter} onChange={e => setFilter(e.target.value)} />
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={availability} onChange={e => setAvailability(e.target.value)}>
              <option value="all">Todos</option>
              <option value="available">Disponibles</option>
              <option value="out">Sin stock</option>
            </select>
            <select value={targetOrderId} onChange={e => setTargetOrderId(e.target.value)} disabled={openOrders.length === 0}>
              {openOrders.length === 0 ? <option>No hay órdenes</option> : null}
              {openOrders.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <span className="small">Destino de agregado</span>
          </div>
        </div>

        <InventoryList 
          availability={availability} 
          categoryId={categoryId} 
          filterText={filter} 
          onAdd={handleQuickAddItem} 
          onAddWithOptions={handleAddItemWithOptions}
        />

        {/* Modal para agregar item con opciones */}
        <Modal
          open={!!addItemModal}
          title={`Agregar ${addItemModal?.productName}`}
          onClose={() => { setAddItemModal(null); setItemNotes(''); setItemDiscount(0) }}
          actions={(
            <>
              <button className="ghost" onClick={() => { setAddItemModal(null); setItemNotes(''); setItemDiscount(0) }}>Cancelar</button>
              <button className="primary" onClick={confirmAddItem}>Agregar con opciones</button>
            </>
          )}
        >
          <div style={{ marginBottom: 12 }}>
            <label>Notas especiales (opcional):</label>
            <textarea
              placeholder="Ej: sin hielo, poco picante, extra salsa... (opcional)"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', marginTop: 4 }}
            />
            <div className="small" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              Las notas son opcionales. Puedes dejar este campo vacío si no necesitas especificaciones especiales.
            </div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label>Descuento adicional (%) - opcional:</label>
            <input
              type="number"
              min="0"
              max="50"
              value={itemDiscount}
              onChange={(e) => setItemDiscount(Number(e.target.value))}
              placeholder="0"
              style={{ width: '100px', marginTop: 4, marginLeft: 8 }}
            />
            <div className="small" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              Solo aplica descuentos si es necesario. Por defecto no se aplica descuento.
            </div>
          </div>

          <div className="small" style={{ color: 'var(--text-primary)', padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
            💡 <strong>Consejo:</strong> Para agregar productos rápidamente sin opciones, usa el botón "+ Añadir" directamente desde la lista.
          </div>
        </Modal>
      </div>
      
      <div className="col" style={{ flex: 2, minWidth: '650px' }}>
        <div className="orders-container">
          {openOrders.map(o => (
            <OrderEditor key={o.id} orderId={o.id} />
          ))}
        </div>
        
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Historial de la sesión</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {myHistory.length === 0 && <tr><td colSpan="4" className="small">Sin historial aún.</td></tr>}
              {myHistory.map(o => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>
                    {o.status === 'closed' && <span className="badge ok">Cerrada</span>}
                    {o.status === 'canceled' && <span className="badge warn">Cancelada</span>}
                  </td>
                  <td>{new Date(o.closedAt || o.canceledAt).toLocaleString()}</td>
                  <td>
                    {o.status === 'closed' && (
                      <div className="input-row">
                        <button className="ghost" onClick={() => reopenOrder(o.id)}>Reabrir</button>
                      </div>
                    )}
                    {o.status === 'canceled' && <span className="small">Sin acciones</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}