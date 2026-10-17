import { useState } from 'react'
import { useCategories } from '../../hooks/useCategories'
import type { Recipe } from '../../types/recipe'

interface RecipeImageProps {
  recipe: Pick<Recipe, 'image' | 'title' | 'category'>
  className?: string
}

/** Foto da receita, com um placeholder discreto quando não há imagem (ou ela falha). */
export function RecipeImage({ recipe, className = '' }: RecipeImageProps) {
  const [failed, setFailed] = useState(false)
  const { getCategory } = useCategories()

  if (!recipe.image || failed) {
    const Icon = getCategory(recipe.category).icon
    return (
      <div className={`grid place-items-center bg-blush-50 ${className}`} role="img" aria-label={recipe.title}>
        <Icon className="size-10 text-blush-300" strokeWidth={1.25} />
      </div>
    )
  }

  return (
    <img
      src={recipe.image}
      alt={recipe.title}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}
