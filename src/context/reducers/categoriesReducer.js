import { genId } from '../../utils/format.js'

export const categoriesReducer = (state, action) => {
  switch (action.type) {
    case 'addCategory': {
      const { category } = action.payload
      return {
        ...state,
        categories: [...state.categories, { 
          id: genId('c'), 
          name: category.name, 
          description: category.description || '' 
        }]
      }
    }

    case 'updateCategory': {
      const { id, patch } = action.payload
      const categories = state.categories.map(c => 
        c.id === id ? { ...c, ...patch } : c
      )
      return { ...state, categories }
    }

    case 'deleteCategory': {
      const { id } = action.payload
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== id),
        products: state.products.filter(p => p.category !== id)
      }
    }

    default:
      return state
  }
}