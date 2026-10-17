import type { CustomCategory, Recipe } from '../types/recipe'

/*
 * Dados da versão antiga, que guardava tudo no LocalStorage.
 * Só são lidos uma vez — no primeiro login — para importar para o Supabase, e depois apagados.
 */

const RECIPES_KEY = 'love-recipes:v1'
const SEED_VERSION_KEY = 'love-recipes:seed-version'
const CATEGORIES_KEY = 'love-recipes:categories:v1'

/** Formato antigo, com um único tempo, antes da divisão por etapas. */
type LegacyRecipe = Omit<Recipe, 'times'> & { times?: Recipe['times']; prepTimeMinutes?: number }

function migrate(recipe: LegacyRecipe): Recipe {
  if (recipe.times) return recipe as Recipe
  const { prepTimeMinutes = 0, ...rest } = recipe
  return { ...rest, times: { prep: prepTimeMinutes, oven: 0, fridge: 0, rest: 0 } }
}

function readArray<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : null
  } catch {
    return null
  }
}

/** Ids das receitas de exemplo da versão antiga — não são importadas. */
const isExample = (recipe: { id: string }) => recipe.id.startsWith('seed-')

/** Receitas e categorias que a pessoa criou na versão antiga, ou null se não houver nada. */
export function readLegacyData(): { recipes: Recipe[]; categories: CustomCategory[] } | null {
  const recipes = (readArray<LegacyRecipe>(RECIPES_KEY) ?? []).filter((r) => !isExample(r)).map(migrate)
  const categories = readArray<CustomCategory>(CATEGORIES_KEY) ?? []
  if (recipes.length === 0 && categories.length === 0) {
    clearLegacyData()
    return null
  }
  return { recipes, categories }
}

export function clearLegacyData() {
  try {
    for (const key of [RECIPES_KEY, SEED_VERSION_KEY, CATEGORIES_KEY]) localStorage.removeItem(key)
  } catch {
    // Sem acesso ao LocalStorage: nada a limpar.
  }
}
