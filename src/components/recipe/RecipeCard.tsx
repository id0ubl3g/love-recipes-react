import { Heart } from 'lucide-react'
import { motion } from 'motion/react'
import { DIFFICULTY_LABEL } from '../../data/categories'
import { useCategories } from '../../hooks/useCategories'
import { recipeHref } from '../../hooks/useHashRoute'
import { formatDuration, totalMinutes } from '../../lib/time'
import type { Recipe } from '../../types/recipe'
import { Skeleton } from '../ui/Skeleton'
import { RecipeImage } from './RecipeImage'

interface RecipeCardProps {
  recipe: Recipe
  onToggleFavorite: (recipe: Recipe) => void
}

export function RecipeCard({ recipe, onToggleFavorite }: RecipeCardProps) {
  const { getCategory } = useCategories()
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-blush-50">
        <RecipeImage
          recipe={recipe}
          className="size-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={() => onToggleFavorite(recipe)}
        aria-pressed={recipe.favorite}
        aria-label={recipe.favorite ? `Remover ${recipe.title} dos favoritos` : `Favoritar ${recipe.title}`}
        className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white"
      >
        <Heart
          className={`size-[18px] transition-colors ${
            recipe.favorite ? 'fill-blush-500 text-blush-500' : 'text-cocoa-muted'
          }`}
          strokeWidth={1.75}
        />
      </motion.button>

      <div className="pt-3">
        <p className="text-[11px] font-medium tracking-wide text-blush-500 uppercase">
          {getCategory(recipe.category).label}
        </p>
        <h3 className="mt-1 line-clamp-1 font-semibold text-cocoa">
          <a href={recipeHref(recipe.id)} className="after:absolute after:inset-0 after:content-['']">
            {recipe.title}
          </a>
        </h3>
        <p className="mt-1 text-xs text-cocoa-muted">
          {formatDuration(totalMinutes(recipe.times))} · {DIFFICULTY_LABEL[recipe.difficulty]} · {recipe.servings}{' '}
          {recipe.servings === 1 ? 'porção' : 'porções'}
        </p>
      </div>
    </motion.article>
  )
}

export function RecipeCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] rounded-2xl" />
      <div className="space-y-2 pt-3">
        <Skeleton className="h-2.5 w-16 rounded-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
