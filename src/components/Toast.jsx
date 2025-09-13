import React, { useEffect } from 'react'

export default function Toast({ data, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`toast ${data.type === 'warn' ? 'warn' : data.type === 'error' ? 'error' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>{data.message}</div>
        <button className="ghost" onClick={onClose}>&times;</button>
      </div>
    </div>
  )
}
