import { useApp } from '../context/AppContext.jsx'

export const useAuth = () => {
  const { state, dispatch } = useApp()

  const login = (username, password) => {
    dispatch({ type: 'login', payload: { username, password } })
  }

  const logout = () => {
    dispatch({ type: 'logout' })
  }

  const isAdmin = () => state.currentUser?.role === 'adminBar'
  
  const isEmployee = () => state.currentUser?.role === 'empleadoBar'

  return {
    currentUser: state.currentUser,
    users: state.users,
    login,
    logout,
    isAdmin,
    isEmployee
  }
}