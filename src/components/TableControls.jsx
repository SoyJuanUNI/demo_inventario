import React from 'react'
import { useUI } from '../hooks/useUI'

export function TableControls({ title, children }) {
  const { ui, toggleTableDensity } = useUI()
  
  return (
    <div className="table-controls">
      <div>
        {title && <h4 style={{ margin: 0 }}>{title}</h4>}
        {children}
      </div>
      <div className="density-toggle">
        <button
          className={ui.tableDensity === 'comfortable' ? 'active' : ''}
          onClick={() => toggleTableDensity()}
          title="Vista cómoda"
        >
          📏 Cómoda
        </button>
        <button
          className={ui.tableDensity === 'compact' ? 'active' : ''}
          onClick={() => toggleTableDensity()}
          title="Vista compacta"
        >
          📐 Compacta
        </button>
      </div>
    </div>
  )
}

export function EnhancedTable({ 
  children, 
  className = '', 
  emptyMessage = 'No hay datos para mostrar',
  loading = false,
  skeletonRows = 3,
  skeletonColumns = 4
}) {
  const { ui } = useUI()
  
  if (loading) {
    return (
      <div className="skeleton-table">
        <table className={`table ${ui.tableDensity} ${className}`}>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: skeletonColumns }).map((_, colIndex) => (
                  <td key={colIndex}>
                    <div className="skeleton skeleton-text" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  return (
    <table className={`table ${ui.tableDensity} ${className}`}>
      {children}
    </table>
  )
}