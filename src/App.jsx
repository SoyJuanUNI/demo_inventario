import React, { useEffect, useState } from 'react'
import { useApp } from './context/AppContext.jsx'
import Login from './components/Login.jsx'
import Navbar from './components/Navbar.jsx'
import Toast from './components/Toast.jsx'
import EmployeePanel from './pages/EmployeePanel.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import CustomerOrderView from './pages/CustomerOrderView.jsx'

export default function App() {
  const { state, dispatch } = useApp()
  const [route, setRoute] = useState({ path: '/', params: {} })

  // Simple hash-based routing
  useEffect(() => {
    const parseRoute = () => {
      const hash = window.location.hash.slice(1) || '/'
      console.log('🌐 Parsing route, hash:', hash)
      
      if (hash.startsWith('/customer/')) {
        const orderId = hash.split('/customer/')[1]
        console.log('👤 Customer route detected, orderId:', orderId)
        setRoute({ path: '/customer', params: { orderId } })
      } else {
        setRoute({ path: hash, params: {} })
      }
    }

    parseRoute()
    window.addEventListener('hashchange', parseRoute)
    return () => window.removeEventListener('hashchange', parseRoute)
  }, [])

  const lowStockCount = state.products.filter(p => p.stock <= p.lowStock).length
  const openOrdersCount = state.orders.filter(o => o.status === 'open').length

  // Customer view route
  if (route.path === '/customer') {
    return <CustomerOrderView orderId={route.params.orderId} />
  }

  // Regular app views
  return (
    <div className="app-container">
      <Navbar
        user={state.currentUser}
        lowStockCount={lowStockCount}
        openOrdersCount={openOrdersCount}
        onLogout={() => dispatch({ type: 'logout' })}
      />

      {!state.currentUser && (
        <div className="card">
          <Login />
          <p className="small">Credenciales demo: admin/admin ó empleado/1234</p>
        </div>
      )}

      {state.currentUser?.role === 'empleadoBar' && <EmployeePanel />}
      {state.currentUser?.role === 'adminBar' && <AdminPanel />}

      <div className="toast-container">
        {state.notifications.slice(-5).map(n => (
          <Toast key={n.id} data={n} onClose={() => dispatch({ type: 'dismissNotification', payload: n.id })} />
        ))}
      </div>
    </div>
  )
}
