// Utilidades de validación y sanitización de datos

// Límites de seguridad para números
export const LIMITS = {
  PRICE_MAX: 999999, // $999,999 máximo
  STOCK_MAX: 99999,  // 99,999 unidades máximo
  QUANTITY_MAX: 999, // 999 unidades por orden máximo
  LOW_STOCK_MAX: 999,
  DECIMAL_PLACES: 0  // Sin decimales para simplificar
}

// Sanitizar y validar números
export function sanitizeNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER, decimalPlaces = 0) {
  let num = Number(value)
  
  // Si no es un número válido, retornar el mínimo
  if (isNaN(num) || !isFinite(num)) {
    return min
  }
  
  // Clamp entre min y max
  num = Math.max(min, Math.min(max, num))
  
  // Redondear a decimales especificados
  return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
}

// Validaciones específicas para productos
export function validateProduct(product, existingProducts = []) {
  const errors = []
  const warnings = []
  
  // Sanitizar números
  const sanitizedProduct = {
    ...product,
    price: sanitizeNumber(product.price, 0, LIMITS.PRICE_MAX),
    stock: sanitizeNumber(product.stock, 0, LIMITS.STOCK_MAX),
    lowStock: sanitizeNumber(product.lowStock, 0, LIMITS.LOW_STOCK_MAX)
  }
  
  // Validar nombre
  if (!sanitizedProduct.name || sanitizedProduct.name.trim().length === 0) {
    errors.push('El nombre del producto es obligatorio')
  }
  
  if (sanitizedProduct.name && sanitizedProduct.name.trim().length > 100) {
    errors.push('El nombre del producto no puede exceder 100 caracteres')
  }
  
  // Validar que lowStock <= stock
  if (sanitizedProduct.lowStock > sanitizedProduct.stock) {
    errors.push(`El stock mínimo (${sanitizedProduct.lowStock}) no puede ser mayor al stock actual (${sanitizedProduct.stock})`)
    // Auto-corrección: ajustar lowStock al stock actual
    sanitizedProduct.lowStock = sanitizedProduct.stock
    warnings.push('Se ajustó automáticamente el stock mínimo al stock actual')
  }
  
  // Validar precio positivo
  if (sanitizedProduct.price <= 0) {
    errors.push('El precio debe ser mayor a cero')
  }
  
  // Verificar si los valores fueron limitados
  if (product.price !== sanitizedProduct.price && product.price > LIMITS.PRICE_MAX) {
    warnings.push(`El precio se limitó al máximo permitido: $${LIMITS.PRICE_MAX.toLocaleString('es-CO')}`)
  }
  
  if (product.stock !== sanitizedProduct.stock && product.stock > LIMITS.STOCK_MAX) {
    warnings.push(`El stock se limitó al máximo permitido: ${LIMITS.STOCK_MAX.toLocaleString('es-CO')}`)
  }
  
  // Validar duplicados de nombre (opcional)
  const duplicateProduct = existingProducts.find(p => 
    p.id !== product.id && 
    p.name.toLowerCase().trim() === sanitizedProduct.name.toLowerCase().trim()
  )
  
  if (duplicateProduct) {
    warnings.push(`Ya existe un producto con el nombre "${sanitizedProduct.name}"`)
  }
  
  return {
    product: sanitizedProduct,
    errors,
    warnings,
    isValid: errors.length === 0
  }
}

// Validaciones para órdenes
export function validateOrderItem(item) {
  const errors = []
  const warnings = []
  
  const sanitizedItem = {
    ...item,
    qty: sanitizeNumber(item.qty, 1, LIMITS.QUANTITY_MAX),
    price: sanitizeNumber(item.price, 0, LIMITS.PRICE_MAX)
  }
  
  if (item.qty !== sanitizedItem.qty && item.qty > LIMITS.QUANTITY_MAX) {
    warnings.push(`La cantidad se limitó al máximo permitido: ${LIMITS.QUANTITY_MAX}`)
  }
  
  if (sanitizedItem.qty <= 0) {
    errors.push('La cantidad debe ser mayor a cero')
  }
  
  return {
    item: sanitizedItem,
    errors,
    warnings,
    isValid: errors.length === 0
  }
}

// Validar nombres de mesa
export function validateTableName(tableName, existingTables = [], allowDuplicates = false) {
  const errors = []
  const warnings = []
  
  const sanitizedName = tableName.trim()
  
  if (!sanitizedName) {
    errors.push('El nombre de la mesa es obligatorio')
  }
  
  if (sanitizedName.length > 50) {
    errors.push('El nombre de la mesa no puede exceder 50 caracteres')
  }
  
  // Verificar duplicados
  if (!allowDuplicates && existingTables.some(table => 
    table.toLowerCase() === sanitizedName.toLowerCase()
  )) {
    if (allowDuplicates) {
      warnings.push(`Ya existe una mesa con el nombre "${sanitizedName}"`)
    } else {
      errors.push(`Ya existe una mesa con el nombre "${sanitizedName}"`)
    }
  }
  
  return {
    tableName: sanitizedName,
    errors,
    warnings,
    isValid: errors.length === 0
  }
}

// Formatear números para mostrar
export function formatNumber(value, options = {}) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    locale = 'es-CO'
  } = options
  
  if (isNaN(value) || !isFinite(value)) return '0'
  
  return Number(value).toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  })
}

// Validador genérico para formularios
export function validateForm(data, validators) {
  const results = {}
  const allErrors = []
  const allWarnings = []
  
  for (const [field, validator] of Object.entries(validators)) {
    if (typeof validator === 'function') {
      const result = validator(data[field], data)
      results[field] = result
      
      if (result.errors) allErrors.push(...result.errors)
      if (result.warnings) allWarnings.push(...result.warnings)
    }
  }
  
  return {
    results,
    errors: allErrors,
    warnings: allWarnings,
    isValid: allErrors.length === 0
  }
}