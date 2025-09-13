import React from 'react'

export default function ProductImage({ src, alt, size = '40px', style = {} }) {
  if (!src) return null

  return (
    <img 
      src={src} 
      alt={alt}
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'cover', 
        borderRadius: '4px',
        border: '1px solid var(--border-color, #ddd)',
        ...style
      }}
      onError={(e) => {
        e.target.style.display = 'none'
      }}
    />
  )
}