import { genId, nowIso } from '../../utils/format.js'

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'login': {
      const { username, password } = action.payload
      const user = state.users.find(u => u.username === username && u.password === password)
      if (!user) {
        return {
          ...state,
          notifications: [
            ...state.notifications,
            { id: genId('ntf'), type: 'error', message: 'Credenciales inválidas', ts: nowIso() }
          ]
        }
      }
      return {
        ...state,
        currentUser: user,
        notifications: [
          ...state.notifications,
          { id: genId('ntf'), type: 'ok', message: `Bienvenido, ${user.name}`, ts: nowIso() }
        ]
      }
    }

    case 'logout': {
      return { ...state, currentUser: null }
    }

    default:
      return state
  }
}