import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import * as api from '../lib/api'
import type { Recipe, RecipeInput } from '../types/recipe'

export interface RecipesContextValue {
  recipes: Recipe[]
  loading: boolean
  addRecipe: (input: RecipeInput) => Promise<Recipe>
  updateRecipe: (id: string, input: RecipeInput) => Promise<Recipe>
  removeRecipe: (id: string) => Promise<void>
  toggleFavorite: (id: string) => void
  /** Move as receitas de uma categoria para outra (ao excluir uma categoria). */
  moveCategory: (from: string, to: string) => Promise<void>
}

export const RecipesContext = createContext<RecipesContextValue | null>(null)

export function RecipesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    api
      .ensureUserData(userId)
      .then(api.fetchRecipes)
      .then((data) => {
        if (!cancelled) setRecipes(data)
      })
      .catch((error: unknown) => {
        console.error(error)
        if (cancelled) return
        // PGRST205: a tabela não existe — o SQL de supabase/migrations ainda não foi aplicado no projeto.
        if ((error as { code?: string } | null)?.code === 'PGRST205') {
          toast.error('O banco de dados ainda não foi configurado.', {
            description: 'Rode o SQL de supabase/migrations no SQL Editor do Supabase (veja SUPABASE_SETUP.md).',
            duration: Infinity,
          })
        } else {
          toast.error('Não foi possível carregar suas receitas. Verifique a conexão e recarregue.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const addRecipe = useCallback(
    async (input: RecipeInput) => {
      if (!userId) throw new Error('Sem sessão')
      const recipe = await api.createRecipe(userId, input)
      setRecipes((prev) => [recipe, ...prev])
      return recipe
    },
    [userId],
  )

  const updateRecipe = useCallback(
    async (id: string, input: RecipeInput) => {
      if (!userId) throw new Error('Sem sessão')
      const previous = recipes.find((r) => r.id === id)
      if (!previous) throw new Error('Receita não encontrada')
      const recipe = await api.updateRecipe(userId, previous, input)
      setRecipes((prev) => prev.map((r) => (r.id === id ? recipe : r)))
      return recipe
    },
    [userId, recipes],
  )

  const removeRecipe = useCallback(
    async (id: string) => {
      const recipe = recipes.find((r) => r.id === id)
      if (!recipe) return
      setRecipes((prev) => prev.filter((r) => r.id !== id))
      try {
        await api.deleteRecipe(recipe)
      } catch (error) {
        setRecipes((prev) => [recipe, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
        throw error
      }
    },
    [recipes],
  )

  const toggleFavorite = useCallback(
    (id: string) => {
      const recipe = recipes.find((r) => r.id === id)
      if (!recipe) return
      const favorite = !recipe.favorite
      const apply = (value: boolean) =>
        setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, favorite: value } : r)))
      apply(favorite)
      api.setFavorite(id, favorite).catch(() => {
        apply(!favorite)
        toast.error('Não foi possível atualizar o favorito. Tente de novo.')
      })
    },
    [recipes],
  )

  const moveCategory = useCallback(async (from: string, to: string) => {
    await api.moveRecipesToCategory(from, to)
    setRecipes((prev) => prev.map((r) => (r.category === from ? { ...r, category: to } : r)))
  }, [])

  const value = useMemo(
    () => ({ recipes, loading, addRecipe, updateRecipe, removeRecipe, toggleFavorite, moveCategory }),
    [recipes, loading, addRecipe, updateRecipe, removeRecipe, toggleFavorite, moveCategory],
  )

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>
}
