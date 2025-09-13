import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'

export default function Navbar({ user, lowStockCount, openOrdersCount, onLogout }) {
  const { state, dispatch } = useApp()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const isLight = state.theme === 'light'
  const toggleTheme = () => dispatch({ type: 'setTheme', payload: isLight ? 'dark' : 'light' })
  
  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }
    }
    
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])
  
  const handleMobileAction = (action) => {
    action()
    setIsMobileMenuOpen(false)
  }
  
  return (
    <div className="navbar">
      <div className="brand">🍻 Inventario Bar</div>
      
      <div className="links desktop-nav">
        <button className="ghost" onClick={toggleTheme} title={isLight ? 'Cambiar a oscuro' : 'Cambiar a claro'}>
          {isLight ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
        {user && (
          <>
            <span className="navbar-text">
              👤 <strong>{user.name}</strong> ({user.role === 'adminBar' ? '🛡️ Admin' : '👷 Empleado'})
            </span>
            <span className={`badge ${lowStockCount ? 'warn' : 'ok'}`}>
              📦 Stock: {lowStockCount}
            </span>
            <span className="badge ok">
              📋 Órdenes: {openOrdersCount}
            </span>
            <button className="ghost" onClick={onLogout} title="Cerrar sesión">
              🚪 Salir
            </button>
          </>
        )}
      </div>

      <div className="mobile-nav" ref={menuRef}>
        <button 
          className="ghost mobile-menu-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menú"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        
        {isMobileMenuOpen && (
          <>
            <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="mobile-menu">
              <div className="mobile-menu-header">
                <div className="mobile-user-info">
                  <div className="mobile-username">👤 {user?.name || 'Usuario'}</div>
                  <div className="mobile-role">({user?.role === 'adminBar' ? '🛡️ Admin' : '👷 Empleado'})</div>
                </div>
              </div>
              
              <div className="mobile-menu-stats">
                <span className={`badge mobile-badge ${lowStockCount ? 'warn' : 'ok'}`}>
                  📦 {lowStockCount}
                </span>
                <span className="badge mobile-badge ok">
                  📋 {openOrdersCount}
                </span>
              </div>
              
              <div className="mobile-menu-actions">
                <button className="ghost mobile-menu-item" onClick={() => handleMobileAction(toggleTheme)}>
                  {isLight ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
                </button>
                <button className="ghost mobile-menu-item logout-btn" onClick={() => handleMobileAction(onLogout)}>
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
