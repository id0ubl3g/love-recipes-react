import { useContext } from 'react'
import { RecipesContext } from '../context/RecipesContext'

export function useRecipes() {
  const ctx = useContext(RecipesContext)
  if (!ctx) throw new Error('useRecipes precisa estar dentro de <RecipesProvider>')
  return ctx
}
