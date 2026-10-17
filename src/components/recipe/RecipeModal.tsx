import {
  Check,
  ChefHat,
  Clock,
  Flame,
  Heart,
  Hourglass,
  Maximize2,
  Minimize2,
  Snowflake,
  Timer,
  Users,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DIFFICULTY_LABEL } from '../../data/categories'
import { useCategories } from '../../hooks/useCategories'
import { useRecipes } from '../../hooks/useRecipes'
import { formatDuration, totalMinutes } from '../../lib/time'
import type { Recipe, RecipeTimes } from '../../types/recipe'
import { CupcakeIcon } from '../brand/Logo'
import { Skeleton } from '../ui/Skeleton'
import { RecipeImage } from './RecipeImage'

interface RecipeModalProps {
  id: string
  onClose: () => void
}

const TIME_STEPS: { key: keyof RecipeTimes; label: string; icon: typeof Timer }[] = [
  { key: 'prep', label: 'Preparo', icon: Timer },
  { key: 'oven', label: 'Forno', icon: Flame },
  { key: 'fridge', label: 'Geladeira', icon: Snowflake },
  { key: 'rest', label: 'Descanso', icon: Hourglass },
]

/** Receita completa em tela cheia, por cima do Início. */
export function RecipeModal({ id, onClose }: RecipeModalProps) {
  const { recipes, loading, toggleFavorite } = useRecipes()
  const recipe = recipes.find((r) => r.id === id)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${fullscreen ? '' : 'items-end sm:items-center sm:p-6'}`}
    >
      {/* Fundo: o Início continua visível, borrado. Clicar fora fecha. */}
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-cocoa/25 backdrop-blur-sm"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={recipe?.title ?? 'Receita'}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        layout
        style={{ borderRadius: fullscreen ? 0 : 24 }}
        className={`relative w-full overflow-y-auto overscroll-contain bg-white shadow-2xl ${
          fullscreen ? 'h-dvh' : 'max-h-[92dvh] max-w-4xl sm:max-h-[88dvh]'
        }`}
      >
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-line bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <p className="truncate text-sm font-medium text-cocoa-muted">{recipe?.title}</p>
          <div className="-mr-2 flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setFullscreen((value) => !value)}
              aria-label={fullscreen ? 'Sair da tela cheia' : 'Ver em tela cheia'}
              aria-pressed={fullscreen}
              title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              className="grid size-10 place-items-center rounded-full text-cocoa-muted transition-colors hover:bg-blush-50 hover:text-cocoa"
            >
              {fullscreen ? <Minimize2 className="size-[18px]" /> : <Maximize2 className="size-[18px]" />}
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar receita"
              title="Fechar"
              className="grid size-10 place-items-center rounded-full text-cocoa-muted transition-colors hover:bg-blush-50 hover:text-cocoa"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className={`px-5 pt-2 pb-10 sm:px-8 ${fullscreen ? 'mx-auto max-w-5xl' : ''}`}>
          {loading ? (
            <DetailSkeleton />
          ) : !recipe ? (
            <div className="flex flex-col items-center py-24 text-center">
              <CupcakeIcon className="size-10 text-blush-300" />
              <p className="mt-4 font-semibold text-cocoa">Receita não encontrada</p>
              <p className="mt-1 text-sm text-cocoa-muted">Ela pode ter sido excluída.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 text-sm font-medium text-blush-500 hover:text-blush-600"
              >
                Ver todas as receitas
              </button>
            </div>
          ) : (
            <RecipeContent
              recipe={recipe}
              onToggleFavorite={() => {
                toggleFavorite(recipe.id)
                if (recipe.favorite) toast(`${recipe.title} saiu dos favoritos`)
                else toast.success(`${recipe.title} foi para os favoritos`)
              }}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}

interface RecipeContentProps {
  recipe: Recipe
  onToggleFavorite: () => void
}

function RecipeContent({ recipe, onToggleFavorite }: RecipeContentProps) {
  const { getCategory } = useCategories()
  const [checked, setChecked] = useState<Set<number>>(new Set())

  function toggleIngredient(index: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <article>
      <div className="mt-4 grid gap-8 md:grid-cols-2 lg:gap-12">
        <div className="aspect-[4/3] self-start overflow-hidden rounded-2xl bg-blush-50">
          <RecipeImage recipe={recipe} className="size-full" />
        </div>

        <div className="flex flex-col">
          <p className="text-xs font-medium tracking-wide text-blush-500 uppercase">
            {getCategory(recipe.category).label}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold text-cocoa sm:text-4xl">
            {recipe.title}
          </h1>
          <p className="mt-3 text-cocoa-muted">{recipe.description}</p>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onToggleFavorite}
            aria-pressed={recipe.favorite}
            className={`mt-5 flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              recipe.favorite
                ? 'border-blush-100 bg-blush-50 text-blush-500'
                : 'border-line text-cocoa-muted hover:border-blush-100 hover:text-cocoa'
            }`}
          >
            <Heart className={`size-4 ${recipe.favorite ? 'fill-blush-500' : ''}`} strokeWidth={1.75} />
            {recipe.favorite ? 'Nos favoritos' : 'Favoritar'}
          </motion.button>

          <dl className="mt-8 grid grid-cols-3 border-y border-line py-5">
            <Stat icon={Clock} label="Pronto em" value={formatDuration(totalMinutes(recipe.times))} highlight />
            <Stat
              icon={Users}
              label="Rende"
              value={`${recipe.servings} ${recipe.servings === 1 ? 'porção' : 'porções'}`}
            />
            <Stat icon={ChefHat} label="Dificuldade" value={DIFFICULTY_LABEL[recipe.difficulty]} />
          </dl>

          <section aria-labelledby="tempos-titulo" className="mt-6">
            <h2 id="tempos-titulo" className="text-xs font-medium tracking-wide text-cocoa-muted uppercase">
              Tempo por etapa
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TIME_STEPS.map(({ key, label, icon: Icon }) => {
                const minutes = recipe.times[key]
                const applies = minutes > 0
                return (
                  <li
                    key={key}
                    className={`rounded-xl px-3 py-3 ${applies ? 'bg-blush-50' : 'border border-dashed border-line'}`}
                  >
                    <Icon
                      className={`size-4 ${applies ? 'text-blush-500' : 'text-cocoa-muted/40'}`}
                      strokeWidth={1.75}
                    />
                    <p className={`mt-2 text-[11px] ${applies ? 'text-cocoa-muted' : 'text-cocoa-muted/60'}`}>{label}</p>
                    <p className={`text-sm font-semibold ${applies ? 'text-cocoa' : 'text-cocoa-muted/40'}`}>
                      {applies ? formatDuration(minutes) : '—'}
                    </p>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="ingredientes-titulo">
          <div className="flex items-baseline justify-between">
            <h2 id="ingredientes-titulo" className="font-display text-2xl font-semibold text-cocoa">
              Ingredientes
            </h2>
            <span className="text-xs text-cocoa-muted">
              {checked.size}/{recipe.ingredients.length}
            </span>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {recipe.ingredients.map((ingredient, index) => {
              const done = checked.has(index)
              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => toggleIngredient(index)}
                    aria-pressed={done}
                    className="flex w-full items-start gap-3 py-3 text-left"
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
                        done ? 'border-blush-500 bg-blush-500 text-white' : 'border-blush-100'
                      }`}
                    >
                      {done && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span
                      className={`text-sm transition-colors ${done ? 'text-cocoa-muted/60 line-through' : 'text-cocoa'}`}
                    >
                      {ingredient}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="preparo-titulo">
          <h2 id="preparo-titulo" className="font-display text-2xl font-semibold text-cocoa">
            Modo de preparo
          </h2>
          <ol className="mt-4 space-y-5">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blush-50 text-xs font-semibold text-blush-500">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-relaxed text-cocoa">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  )
}

interface StatProps {
  icon: typeof Clock
  label: string
  value: string
  highlight?: boolean
}

function Stat({ icon: Icon, label, value, highlight = false }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 text-center not-first:border-l not-first:border-line">
      <Icon className={`size-5 ${highlight ? 'text-blush-500' : 'text-cocoa-muted'}`} strokeWidth={1.75} />
      <dt className="text-[11px] text-cocoa-muted">{label}</dt>
      <dd className={`text-sm font-semibold ${highlight ? 'text-blush-500' : 'text-cocoa'}`}>{value}</dd>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mt-4 grid gap-8 md:grid-cols-2 lg:gap-12">
      <Skeleton className="aspect-[4/3] self-start rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="mt-6 h-20 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
