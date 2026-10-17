import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  CATEGORY_ICONS,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_ICON,
  UNKNOWN_CATEGORY,
  type Category,
  type CategoryIconKey,
} from '../data/categories'
import { useAuth } from '../hooks/useAuth'
import * as api from '../lib/api'
import { LIMITS } from '../lib/limits'
import { normalize } from '../lib/text'
import type { CategoryId, CustomCategory } from '../types/recipe'

export interface CategoriesContextValue {
  /** Padrão + criadas pelo usuário, nessa ordem. */
  categories: Category[]
  /** As categorias do usuário ainda estão vindo do banco. */
  loading: boolean
  /** Ainda dá para criar categorias (limite de LIMITS.categoriesPerUser por pessoa). */
  canCreate: boolean
  /** Nunca falha: id desconhecido vira "Sem categoria". */
  getCategory: (id: CategoryId) => Category
  /** Cria a categoria — ou devolve a existente, se já houver uma com o mesmo nome. */
  addCategory: (label: string, icon: CategoryIconKey) => { category: Category; created: boolean }
  /** Renomeia/troca o ícone de uma categoria criada pelo usuário. Lança erro se o nome já existir. */
  updateCategory: (id: CategoryId, label: string, icon: CategoryIconKey) => Promise<void>
  /** Exclui uma categoria criada pelo usuário (as receitas devem ser movidas antes). */
  removeCategory: (id: CategoryId) => Promise<void>
}

export const CategoriesContext = createContext<CategoriesContextValue | null>(null)

function toCategory(custom: CustomCategory): Category {
  const icon = CATEGORY_ICONS[custom.icon as CategoryIconKey] ?? CATEGORY_ICONS[DEFAULT_CATEGORY_ICON]
  return { id: custom.id, label: custom.label, icon, custom: true }
}

function slugify(label: string) {
  return normalize(label)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const [custom, setCustom] = useState<CustomCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setCustom([])
    setLoading(true)
    api
      .ensureUserData(userId)
      .then(api.fetchCategories)
      .then((data) => {
        if (!cancelled) setCustom(data)
      })
      .catch((error: unknown) => console.error(error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const categories = useMemo(() => [...DEFAULT_CATEGORIES, ...custom.map(toCategory)], [custom])

  const getCategory = useCallback(
    (id: CategoryId) => categories.find((c) => c.id === id) ?? UNKNOWN_CATEGORY,
    [categories],
  )

  const addCategory = useCallback(
    (label: string, icon: CategoryIconKey) => {
      const name = label.trim()
      const existing = categories.find((c) => normalize(c.label) === normalize(name))
      if (existing) return { category: existing, created: false }
      if (custom.length >= LIMITS.categoriesPerUser) {
        throw new Error(`Você chegou ao limite de ${LIMITS.categoriesPerUser} categorias. Exclua uma para criar outra.`)
      }

      const entry: CustomCategory = {
        id: `${slugify(name) || 'categoria'}-${crypto.randomUUID().slice(0, 6)}`,
        label: name,
        icon,
      }
      // Aparece na hora; se o banco recusar, desfaz e avisa.
      setCustom((prev) => [...prev, entry])
      api.createCategory(entry).catch((error: { code?: string; message?: string }) => {
        setCustom((prev) => prev.filter((c) => c.id !== entry.id))
        // 23514: o banco recusou por limite (ex.: categoria criada em outro aparelho ao mesmo tempo).
        toast.error(
          error.code === '23514' && error.message ? error.message : `Não foi possível salvar a categoria “${name}”.`,
        )
      })
      return { category: toCategory(entry), created: true }
    },
    [categories, custom.length],
  )

  const updateCategory = useCallback(
    async (id: CategoryId, label: string, icon: CategoryIconKey) => {
      const name = label.trim()
      const clash = categories.find((c) => c.id !== id && normalize(c.label) === normalize(name))
      if (clash) throw new Error(`Já existe uma categoria chamada “${clash.label}”.`)
      await api.updateCategory(id, { label: name, icon })
      setCustom((prev) => prev.map((c) => (c.id === id ? { ...c, label: name, icon } : c)))
    },
    [categories],
  )

  const removeCategory = useCallback(async (id: CategoryId) => {
    await api.deleteCategory(id)
    setCustom((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      categories,
      loading,
      canCreate: custom.length < LIMITS.categoriesPerUser,
      getCategory,
      addCategory,
      updateCategory,
      removeCategory,
    }),
    [categories, loading, custom.length, getCategory, addCategory, updateCategory, removeCategory],
  )

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
}
