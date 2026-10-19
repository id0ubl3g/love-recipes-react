import { toast } from 'sonner'
import { CupcakeIcon } from '../components/brand/Logo'
import { RecipeForm } from '../components/recipe/RecipeForm'
import { Skeleton } from '../components/ui/Skeleton'
import { recipeHref } from '../hooks/useHashRoute'
import { useRecipes } from '../hooks/useRecipes'
import { recipeSaveError } from '../lib/api'
import type { Recipe, RecipeInput } from '../types/recipe'

interface EditRecipeProps {
  id: string
}

/** Volta para onde a pessoa estava (normalmente o popup da receita). Em link direto, abre a receita. */
function leave(id: string) {
  if (window.history.length > 1) window.history.back()
  else window.location.replace(recipeHref(id))
}

function toInput(recipe: Recipe): RecipeInput {
  const { title, description, category, image, times, servings, difficulty, ingredients, steps } = recipe
  return { title, description, category, image, times, servings, difficulty, ingredients, steps }
}

export function EditRecipe({ id }: EditRecipeProps) {
  const { recipes, loading, updateRecipe } = useRecipes()
  const recipe = recipes.find((r) => r.id === id)

  async function handleSubmit(input: RecipeInput) {
    const updated = await updateRecipe(id, input).catch((error: unknown) => {
      throw recipeSaveError(error)
    })
    leave(id)
    toast.success('Receita atualizada!', { description: `As alterações em ${updated.title} foram salvas.` })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-cocoa">Editar receita</h1>
      {loading ? (
        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-11 w-2/3 rounded-xl" />
          </div>
        </div>
      ) : !recipe ? (
        <div className="flex flex-col items-center py-24 text-center">
          <CupcakeIcon className="size-10 text-blush-300" />
          <p className="mt-4 font-semibold text-cocoa">Receita não encontrada</p>
          <p className="mt-1 text-sm text-cocoa-muted">Ela pode ter sido excluída.</p>
          <a href="#/receitas" className="mt-6 text-sm font-medium text-blush-500 hover:text-blush-600">
            Ver todas as receitas
          </a>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-cocoa-muted">
            Ajuste o que quiser, inclusive a foto. Campos com <span className="text-blush-500">*</span> são
            obrigatórios.
          </p>
          <div className="mt-8">
            <RecipeForm
              key={recipe.id}
              initial={toInput(recipe)}
              submitLabel="Salvar alterações"
              onSubmit={handleSubmit}
              onCancel={() => leave(id)}
            />
          </div>
        </>
      )}
    </div>
  )
}
