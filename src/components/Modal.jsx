import React, { useEffect } from 'react'

export default function Modal({ open, title, children, onClose, actions, onConfirm }) {
  useEffect(() => {
    if (!open) return
    
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Enter' && onConfirm) onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, onConfirm])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="ghost" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div style={{ marginTop: 12 }}>
          {children}
        </div>
        {actions && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
