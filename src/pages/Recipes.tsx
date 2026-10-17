import { ChevronDown, Heart, Plus, SearchX } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CupcakeIcon } from '../components/brand/Logo'
import { CategoryManager } from '../components/category/CategoryManager'
import { FeaturedCategories } from '../components/home/FeaturedCategories'
import { RecipeCard, RecipeCardSkeleton } from '../components/recipe/RecipeCard'
import { RecipeCarousel } from '../components/recipe/RecipeCarousel'
import { UNCATEGORIZED_FILTER } from '../data/categories'
import { useCategories } from '../hooks/useCategories'
import { useRecipes } from '../hooks/useRecipes'
import type { CategoryId, Recipe } from '../types/recipe'

/** Quantas receitas aparecem por vez em "Todas as receitas". */
const PAGE_SIZE = 8

export function Recipes() {
  const { recipes, loading, toggleFavorite } = useRecipes()
  const { categories, loading: categoriesLoading, getCategory } = useCategories()
  const [selected, setCategory] = useState<CategoryId | null>(null)

  // Receitas cuja categoria não existe mais (ex.: excluída com "deixar sem categoria").
  const uncategorized = useMemo(() => {
    const known = new Set(categories.map((c) => c.id))
    return recipes.filter((r) => !known.has(r.category))
  }, [recipes, categories])
  // Espera as categorias do usuário chegarem, senão as receitas delas pareceriam "sem categoria".
  const showUncategorized = !categoriesLoading && uncategorized.length > 0

  // Se o filtro escolhido deixar de existir (categoria excluída, nada mais sem categoria), volta para "Todas".
  const category =
    selected === UNCATEGORIZED_FILTER
      ? showUncategorized
        ? selected
        : null
      : selected !== null && categories.some((c) => c.id === selected)
        ? selected
        : null
  const [managing, setManaging] = useState(false)
  const closeManager = useCallback(() => setManaging(false), [])

  const filtered = useMemo(
    () =>
      category === UNCATEGORIZED_FILTER
        ? uncategorized
        : category
          ? recipes.filter((r) => r.category === category)
          : recipes,
    [recipes, category, uncategorized],
  )

  function handleToggleFavorite(recipe: Recipe) {
    toggleFavorite(recipe.id)
    if (recipe.favorite) toast(`${recipe.title} saiu dos favoritos`)
    else toast.success(`${recipe.title} foi para os favoritos`)
  }

  const favorites = recipes.filter((r) => r.favorite)

  // Volta a mostrar só a primeira página sempre que a categoria muda.
  const filterKey = String(category)
  const [limit, setLimit] = useState({ key: filterKey, count: PAGE_SIZE })
  const visibleCount = limit.key === filterKey ? limit.count : PAGE_SIZE
  const visible = filtered.slice(0, visibleCount)
  const remaining = filtered.length - visible.length
  const title =
    category === UNCATEGORIZED_FILTER ? 'Sem categoria' : category ? getCategory(category).label : 'Todas as receitas'

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <h1 className="sr-only">Receitas</h1>
      <div className="border-b border-line py-4">
        <FeaturedCategories
          loading={loading}
          selected={category}
          onSelect={setCategory}
          onManage={() => setManaging(true)}
          showUncategorized={showUncategorized}
        />
      </div>

      {/* Favoritas no topo; some ao filtrar por categoria para não repetir cards. */}
      {!loading && category === null && favorites.length > 0 && (
        <section aria-labelledby="favoritas-titulo" className="border-b border-line pt-8 pb-8">
          <RecipeCarousel
            recipes={favorites}
            onToggleFavorite={handleToggleFavorite}
            header={
              <div className="flex items-baseline gap-3">
                <h2
                  id="favoritas-titulo"
                  className="flex items-center gap-2 font-display text-2xl font-semibold text-cocoa"
                >
                  <Heart className="size-5 fill-blush-500 text-blush-500" aria-hidden="true" />
                  Favoritas
                </h2>
                <span className="text-xs text-cocoa-muted">
                  {favorites.length} {favorites.length === 1 ? 'receita' : 'receitas'}
                </span>
              </div>
            }
          />
        </section>
      )}

      <section aria-labelledby="receitas-titulo" className="pt-8">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 id="receitas-titulo" className="font-display text-2xl font-semibold text-cocoa">
            {title}
          </h2>
          {!loading && (
            <span className="shrink-0 text-xs text-cocoa-muted">
              {filtered.length} {filtered.length === 1 ? 'receita' : 'receitas'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <EmptyState
            icon={<CupcakeIcon className="size-10 text-blush-300" />}
            title="Seu livro de receitas está vazio"
            text="Que tal começar pela receita que mais tem a sua cara?"
            action={
              <a
                href="#/nova"
                className="inline-flex items-center gap-1.5 rounded-full bg-blush-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blush-600"
              >
                <Plus className="size-4" /> Adicionar receita
              </a>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-10 text-blush-300" strokeWidth={1.5} />}
            title="Nenhuma receita nesta categoria"
            text="Que tal adicionar a primeira?"
            action={
              <button
                type="button"
                onClick={() => setCategory(null)}
                className="text-sm font-medium text-blush-500 hover:text-blush-600"
              >
                Ver todas as categorias
              </button>
            }
          />
        ) : (
          <>
            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {visible.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} onToggleFavorite={handleToggleFavorite} />
                ))}
              </AnimatePresence>
            </div>
            {remaining > 0 && (
              <div className="mt-10 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLimit({ key: filterKey, count: visibleCount + PAGE_SIZE })}
                  className="flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:border-blush-100 hover:bg-blush-50"
                >
                  Ver mais <ChevronDown className="size-4" />
                </button>
                <p className="text-xs text-cocoa-muted">
                  Mostrando {visible.length} de {filtered.length}
                </p>
              </div>
            )}
          </>
        )}
      </section>
      <AnimatePresence>{managing && <CategoryManager onClose={closeManager} />}</AnimatePresence>
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  text: string
  action?: React.ReactNode
}

function EmptyState({ icon, title, text, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      {icon}
      <p className="mt-4 font-semibold text-cocoa">{title}</p>
      <p className="mt-1 text-sm text-cocoa-muted">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
