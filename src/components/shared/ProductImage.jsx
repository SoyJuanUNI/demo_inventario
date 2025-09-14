import React, { useState } from 'react'

export default function ProductImage({ 
  src, 
  alt, 
  size = '40px', 
  style = {},
  fallbackSrc = '/images/products/default-food.svg',
  showPlaceholder = true 
}) {
  const [imageError, setImageError] = useState(false)
  const [fallbackError, setFallbackError] = useState(false)

  if (!src) return null

  const handleImageError = (e) => {
    if (!imageError && fallbackSrc && src !== fallbackSrc) {
      setImageError(true)
      e.target.src = fallbackSrc
    } else if (!fallbackError && src === fallbackSrc) {
      setFallbackError(true)
      if (showPlaceholder) {
        // Mostrar placeholder en lugar de ocultar la imagen
        e.target.style.background = 'var(--background-secondary, #f5f5f5)'
        e.target.style.display = 'flex'
        e.target.style.alignItems = 'center'
        e.target.style.justifyContent = 'center'
        e.target.style.fontSize = '12px'
        e.target.style.color = 'var(--text-muted, #999)'
        e.target.alt = '🖼️'
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMyAxM0gyN1YyN0gxM1YxM1oiIGZpbGw9IiNEREREREQiLz4KPGNpcmNsZSBjeD0iMTgiIGN5PSIxOCIgcj0iMiIgZmlsbD0iI0JCQkJCQiIvPgo8cGF0aCBkPSJNMjMgMjNMMjAgMjBMMTcgMjNIMjNaIiBmaWxsPSIjQkJCQkJCIi8+Cjwvc3ZnPgo='
      } else {
        e.target.style.display = 'none'
      }
    } else {
      // Si todo falla, ocultar la imagen
      e.target.style.display = 'none'
    }
  }

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
      onError={handleImageError}
    />
  )
}