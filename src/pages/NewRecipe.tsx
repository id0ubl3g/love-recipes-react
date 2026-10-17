import { toast } from 'sonner'
import { RecipeForm } from '../components/recipe/RecipeForm'
import { recipeHref } from '../hooks/useHashRoute'
import { useRecipes } from '../hooks/useRecipes'
import type { RecipeInput } from '../types/recipe'

function leave() {
  if (window.history.length > 1) window.history.back()
  else window.location.hash = '/receitas'
}

export function NewRecipe() {
  const { addRecipe } = useRecipes()

  async function handleSubmit(input: RecipeInput) {
    const recipe = await addRecipe(input).catch((error: unknown) => {
      console.error(error)
      // 23514: o banco recusou por passar de algum limite (ver src/lib/limits.ts).
      if ((error as { code?: string } | null)?.code === '23514') {
        throw new Error('A receita passou de algum limite de tamanho. Revise os ingredientes e o modo de preparo.')
      }
      throw new Error('Não foi possível salvar a receita. Verifique a conexão e tente de novo.')
    })
    window.location.hash = '/receitas'
    toast.success('Receita adicionada!', {
      description: `${recipe.title} já está na sua coleção.`,
      action: { label: 'Ver receita', onClick: () => (window.location.hash = recipeHref(recipe.id)) },
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-cocoa">Nova receita</h1>
      <p className="mt-1 text-sm text-cocoa-muted">
        Conte para a gente qual é a sua receita. Campos com <span className="text-blush-500">*</span> são obrigatórios.
      </p>
      <div className="mt-8">
        <RecipeForm submitLabel="Salvar receita" onSubmit={handleSubmit} onCancel={leave} />
      </div>
    </div>
  )
}
