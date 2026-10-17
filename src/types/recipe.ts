/** Id de uma categoria padrão ('doces', 'bolos'...) ou criada pelo usuário. */
export type CategoryId = string

/** Categoria criada pelo usuário, como fica salva no banco. */
export interface CustomCategory {
  id: CategoryId
  label: string
  /** Chave de CATEGORY_ICONS */
  icon: string
}

export type Difficulty = 'facil' | 'medio' | 'dificil'

/** Tempos de cada etapa, em minutos. 0 = etapa não se aplica. */
export interface RecipeTimes {
  /** Mão na massa: cortar, misturar, cozinhar no fogão */
  prep: number
  oven: number
  fridge: number
  /** Esperar crescer, esfriar ou descansar */
  rest: number
}

export interface Recipe {
  id: string
  title: string
  description: string
  category: CategoryId
  /** URL pública ou data URL (base64) enviada pelo usuário */
  image?: string
  times: RecipeTimes
  servings: number
  difficulty: Difficulty
  ingredients: string[]
  steps: string[]
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export type RecipeInput = Omit<Recipe, 'id' | 'favorite' | 'createdAt' | 'updatedAt'>
