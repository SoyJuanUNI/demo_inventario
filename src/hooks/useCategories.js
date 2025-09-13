import { useApp } from '../context/AppContext.jsx'

export const useCategories = () => {
  const { state, dispatch } = useApp()

  const addCategory = (name) => {
    dispatch({ type: 'addCategory', payload: { name } })
  }

  const deleteCategory = (id) => {
    dispatch({ type: 'deleteCategory', payload: { id } })
  }

  const getCategory = (id) => state.categories.find(c => c.id === id)

  return {
    categories: state.categories,
    addCategory,
    deleteCategory,
    getCategory
  }
}