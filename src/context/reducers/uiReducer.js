export const uiReducer = (state, action) => {
  switch (action.type) {
    case 'setTheme': {
      const theme = action.payload === 'light' ? 'light' : 'dark'
      return { ...state, theme }
    }

    case 'setEmployeeTargetOrderId': {
      const { orderId } = action.payload
      return { 
        ...state, 
        ui: { ...state.ui, employeeTargetOrderId: orderId || '' } 
      }
    }

    case 'setTableDensity': {
      const { density } = action.payload
      return { 
        ...state, 
        ui: { ...state.ui, tableDensity: density } 
      }
    }

    case 'setAllowDuplicateTableNames': {
      const { allow } = action.payload
      return {
        ...state,
        ui: { ...state.ui, allowDuplicateTableNames: allow }
      }
    }

    case 'setRememberSession': {
      const { remember } = action.payload
      return {
        ...state,
        ui: { ...state.ui, rememberSession: remember }
      }
    }

    case 'setPersistentStorage': {
      const { persistent } = action.payload
      return {
        ...state,
        ui: { ...state.ui, persistentStorage: persistent }
      }
    }

    default:
      return state
  }
}