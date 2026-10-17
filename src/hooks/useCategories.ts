import { useContext } from 'react'
import { CategoriesContext } from '../context/CategoriesContext'

export function useCategories() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories precisa estar dentro de <CategoriesProvider>')
  return ctx
}
