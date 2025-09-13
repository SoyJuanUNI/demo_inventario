import { seed as seedData } from '../../data/seed.js'

const STORAGE_KEY = 'inventario_bar_demo_v1'

export const initialState = {
  users: [],
  categories: [],
  products: [],
  orders: [],
  currentUser: null,
  notifications: [],
  theme: 'dark', // 'dark' | 'light'
  ui: { employeeTargetOrderId: '' },
}

export const loadState = () => {
  try {
    // Primero intentar sessionStorage (pestaña actual)
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY)
    if (sessionRaw) {
      console.log('📦 Found existing session state')
      return JSON.parse(sessionRaw)
    }

    // Si no hay sesión, intentar localStorage (compartido entre pestañas)
    const localRaw = localStorage.getItem(STORAGE_KEY)
    if (localRaw) {
      console.log('💾 Found existing local state, copying to session')
      const localState = JSON.parse(localRaw)
      // Copiar a sessionStorage para uso actual
      sessionStorage.setItem(STORAGE_KEY, localRaw)
      return localState
    }
  } catch (error) {
    console.warn('Error loading state from storage:', error)
  }
  
  console.log('🌱 Loading seed data as initial state')
  const initialStateWithSeed = { ...initialState, ...seedData }
  console.log('📋 Orders in seed:', initialStateWithSeed.orders?.length || 0)
  return initialStateWithSeed
}

export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state)
    
    // Guardar en sessionStorage (pestaña actual)
    sessionStorage.setItem(STORAGE_KEY, serializedState)
    
    // También guardar en localStorage (compartido entre pestañas) para QR
    localStorage.setItem(STORAGE_KEY, serializedState)
    
    console.log('💾 State saved to both session and local storage')
  } catch (error) {
    console.warn('Error saving state to storage:', error)
  }
}