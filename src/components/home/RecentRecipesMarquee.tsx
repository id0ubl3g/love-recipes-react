import { recipeHref } from '../../hooks/useHashRoute'
import { formatDuration, totalMinutes } from '../../lib/time'
import type { Recipe } from '../../types/recipe'
import { RecipeImage } from '../recipe/RecipeImage'

interface RecentRecipesMarqueeProps {
  recipes: Recipe[]
}

/** Faixa contínua com as últimas receitas. Pausa ao passar o mouse ou focar um card. */
export function RecentRecipesMarquee({ recipes }: RecentRecipesMarqueeProps) {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-x-auto">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] has-[:focus-visible]:[animation-play-state:paused]">
        {/* Duas cópias da lista; a segunda é só visual. */}
        {[false, true].map((duplicate) => (
          <ul key={String(duplicate)} aria-hidden={duplicate || undefined} className="flex gap-5 pr-5">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="w-36 shrink-0 sm:w-44">
                <a href={recipeHref(recipe.id)} tabIndex={duplicate ? -1 : undefined} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-blush-50">
                    <RecipeImage
                      recipe={recipe}
                      className="size-full transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-semibold text-cocoa">{recipe.title}</p>
                  <p className="mt-0.5 text-xs text-cocoa-muted">{formatDuration(totalMinutes(recipe.times))}</p>
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
