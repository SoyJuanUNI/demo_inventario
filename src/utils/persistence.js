// Utilidades para manejo de persistencia de estado

const STORAGE_KEY = 'inventario_bar_state'
const SETTINGS_KEY = 'inventario_bar_settings'

// Guardar estado completo en localStorage
export function saveStateToLocalStorage(state) {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, serializedState)
    return true
  } catch (error) {
    console.error('Error al guardar estado en localStorage:', error)
    return false
  }
}

// Cargar estado desde localStorage
export function loadStateFromLocalStorage() {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY)
    if (serializedState === null) {
      return null
    }
    return JSON.parse(serializedState)
  } catch (error) {
    console.error('Error al cargar estado desde localStorage:', error)
    return null
  }
}

// Limpiar localStorage
export function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SETTINGS_KEY)
    return true
  } catch (error) {
    console.error('Error al limpiar localStorage:', error)
    return false
  }
}

// Guardar configuraciones específicas
export function saveSettings(settings) {
  try {
    const serializedSettings = JSON.stringify(settings)
    localStorage.setItem(SETTINGS_KEY, serializedSettings)
    return true
  } catch (error) {
    console.error('Error al guardar configuraciones:', error)
    return false
  }
}

// Cargar configuraciones
export function loadSettings() {
  try {
    const serializedSettings = localStorage.getItem(SETTINGS_KEY)
    if (serializedSettings === null) {
      return {}
    }
    return JSON.parse(serializedSettings)
  } catch (error) {
    console.error('Error al cargar configuraciones:', error)
    return {}
  }
}

// Verificar si localStorage está disponible
export function isLocalStorageAvailable() {
  try {
    const test = 'test'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (error) {
    return false
  }
}

// Obtener tamaño aproximado del localStorage usado
export function getStorageSize() {
  if (!isLocalStorageAvailable()) return 0
  
  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  
  return total
}

// Formatear tamaño en bytes a string legible
export function formatStorageSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Crear snapshot del estado para restauración
export function createSnapshot(state, name = 'snapshot') {
  const snapshot = {
    name,
    timestamp: new Date().toISOString(),
    state: JSON.parse(JSON.stringify(state)) // Deep copy
  }
  
  try {
    const snapshotKey = `${STORAGE_KEY}_snapshot_${name}`
    localStorage.setItem(snapshotKey, JSON.stringify(snapshot))
    return { success: true, snapshot }
  } catch (error) {
    console.error('Error al crear snapshot:', error)
    return { success: false, error }
  }
}

// Restaurar snapshot
export function restoreSnapshot(name = 'snapshot') {
  try {
    const snapshotKey = `${STORAGE_KEY}_snapshot_${name}`
    const serializedSnapshot = localStorage.getItem(snapshotKey)
    
    if (!serializedSnapshot) {
      return { success: false, error: 'Snapshot no encontrado' }
    }
    
    const snapshot = JSON.parse(serializedSnapshot)
    return { success: true, state: snapshot.state, timestamp: snapshot.timestamp }
  } catch (error) {
    console.error('Error al restaurar snapshot:', error)
    return { success: false, error }
  }
}

// Listar snapshots disponibles
export function listSnapshots() {
  const snapshots = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(`${STORAGE_KEY}_snapshot_`)) {
      try {
        const snapshot = JSON.parse(localStorage.getItem(key))
        snapshots.push({
          name: snapshot.name,
          timestamp: snapshot.timestamp,
          key
        })
      } catch (error) {
        console.error('Error al parsear snapshot:', error)
      }
    }
  }
  
  return snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

// Eliminar snapshot
export function deleteSnapshot(name) {
  try {
    const snapshotKey = `${STORAGE_KEY}_snapshot_${name}`
    localStorage.removeItem(snapshotKey)
    return true
  } catch (error) {
    console.error('Error al eliminar snapshot:', error)
    return false
  }
}