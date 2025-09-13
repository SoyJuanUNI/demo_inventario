import React from 'react'

export function EnhancedButton({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false, 
  tooltip = null, 
  className = '', 
  type = 'button',
  ...props 
}) {
  const buttonClassName = `${className} ${loading ? 'btn-loading' : ''}`.trim()
  
  const button = (
    <button
      type={type}
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '' : children}
    </button>
  )

  // Si hay tooltip y el botón está deshabilitado, envolver en tooltip
  if (tooltip && disabled && !loading) {
    return (
      <div className="tooltip-wrapper" data-tooltip={tooltip}>
        {button}
      </div>
    )
  }

  return button
}

export function LoadingButton({ 
  children, 
  onClick, 
  loading = false, 
  loadingText = 'Cargando...', 
  className = '', 
  ...props 
}) {
  return (
    <EnhancedButton
      onClick={onClick}
      loading={loading}
      className={className}
      {...props}
    >
      {loading ? loadingText : children}
    </EnhancedButton>
  )
}

export function ActionButton({ 
  children, 
  onClick, 
  confirm = false, 
  confirmMessage = '¿Estás seguro?',
  disabled = false,
  disabledReason = null,
  loading = false,
  className = '',
  ...props 
}) {
  const handleClick = (e) => {
    if (confirm && !window.confirm(confirmMessage)) {
      return
    }
    onClick(e)
  }

  const tooltip = disabled && disabledReason ? disabledReason : null

  return (
    <EnhancedButton
      onClick={handleClick}
      disabled={disabled}
      loading={loading}
      tooltip={tooltip}
      className={className}
      {...props}
    >
      {children}
    </EnhancedButton>
  )
}