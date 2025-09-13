import React from 'react'

export function EmptyState({ 
  icon = '📋', 
  title = 'Sin datos', 
  description = 'No hay información para mostrar en este momento.',
  action = null 
}) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <div style={{ marginTop: '16px' }}>
          {action}
        </div>
      )}
    </div>
  )
}

export function TableEmptyState({ message = 'No hay datos para mostrar' }) {
  return (
    <tr>
      <td colSpan="100%" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
        {message}
      </td>
    </tr>
  )
}