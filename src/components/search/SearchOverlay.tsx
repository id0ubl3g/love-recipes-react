import { Heart, Search, SearchX } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { recipeHref } from '../../hooks/useHashRoute'
import { useRecipes } from '../../hooks/useRecipes'
import { normalize } from '../../lib/text'
import { formatDuration, totalMinutes } from '../../lib/time'
import { RecipeImage } from '../recipe/RecipeImage'

interface SearchOverlayProps {
  onClose: () => void
}

/**
 * Busca por cima da página: o conteúdo fica borrado e as receitas aparecem em lista.
 * Começa abaixo do header para que o X da lupa continue visível e clicável.
 */
export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const { recipes } = useRecipes()
  const { getCategory } = useCategories()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    const q = normalize(query.trim())
    const sorted = [...recipes].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    if (!q) return sorted
    return sorted.filter((r) =>
      [r.title, r.description, getCategory(r.category).label, ...r.ingredients].some((field) =>
        normalize(field).includes(q),
      ),
    )
  }, [recipes, query, getCategory])

  useEffect(() => {
    inputRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  function open(id: string) {
    onClose()
    window.location.hash = recipeHref(id)
  }

  function moveActive(next: number) {
    const clamped = Math.max(0, Math.min(results.length - 1, next))
    setActive(clamped)
    listRef.current?.querySelector(`[data-index="${clamped}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-40 flex justify-center px-4 pt-4 sm:pt-6">
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-cocoa/20 backdrop-blur-sm"
      />

      <motion.div
        id="search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar receitas"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative flex max-h-[calc(100%-1.5rem)] w-full max-w-3xl flex-col self-start overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="border-b border-line p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-full bg-blush-50 px-4 focus-within:ring-2 focus-within:ring-blush-300">
            <Search className="size-4 shrink-0 text-cocoa-muted" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  moveActive(active + 1)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  moveActive(active - 1)
                } else if (e.key === 'Enter' && results[active]) {
                  e.preventDefault()
                  open(results[active].id)
                }
              }}
              placeholder="Buscar por nome, ingrediente ou categoria..."
              aria-label="Buscar receitas"
              aria-controls="search-results"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm placeholder:text-cocoa-muted/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          <p className="mt-3 px-1 text-xs text-cocoa-muted">
            {query.trim()
              ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`
              : `Todas as ${results.length} receitas`}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <SearchX className="size-9 text-blush-300" strokeWidth={1.5} />
            <p className="mt-3 font-semibold text-cocoa">Nenhuma receita encontrada</p>
            <p className="mt-1 text-sm text-cocoa-muted">Tente outro nome ou ingrediente.</p>
          </div>
        ) : (
          <ul
            ref={listRef}
            id="search-results"
            className="grid gap-3 overflow-y-auto overscroll-contain p-4 sm:grid-cols-2 sm:p-5"
          >
            {results.map((recipe, index) => (
              <li key={recipe.id} data-index={index}>
                <button
                  type="button"
                  onClick={() => open(recipe.id)}
                  onMouseEnter={() => setActive(index)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors ${
                    index === active ? 'border-blush-300 bg-blush-50' : 'border-line hover:border-blush-100'
                  }`}
                >
                  <div className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-blush-50">
                    <RecipeImage recipe={recipe} className="size-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium tracking-wide text-blush-500 uppercase">
                      {getCategory(recipe.category).label}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-cocoa">{recipe.title}</p>
                    <p className="mt-0.5 text-xs text-cocoa-muted">{formatDuration(totalMinutes(recipe.times))}</p>
                  </div>
                  {recipe.favorite && (
                    <Heart className="mr-1 size-4 shrink-0 fill-blush-500 text-blush-500" aria-label="Favorita" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}
