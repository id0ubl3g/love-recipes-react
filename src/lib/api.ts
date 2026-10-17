import type { RecipeRow } from '../types/database'
import type { CustomCategory, Difficulty, Recipe, RecipeInput } from '../types/recipe'
import { clearLegacyData, readLegacyData } from './storage'
import { IMAGES_BUCKET, supabase } from './supabase'

// ─── Conversão banco ⇄ app ───────────────────────────────────────────────────

function fromRow(row: RecipeRow, image: string | undefined): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    image,
    times: { prep: row.prep_minutes, oven: row.oven_minutes, fridge: row.fridge_minutes, rest: row.rest_minutes },
    servings: row.servings,
    // No banco é texto com CHECK ('facil' | 'medio' | 'dificil'); o tipo gerado só sabe que é string.
    difficulty: row.difficulty as Difficulty,
    ingredients: row.ingredients,
    steps: row.steps,
    favorite: row.favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(input: RecipeInput) {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    image_url: input.image ?? null,
    prep_minutes: input.times.prep,
    oven_minutes: input.times.oven,
    fridge_minutes: input.times.fridge,
    rest_minutes: input.times.rest,
    servings: input.servings,
    difficulty: input.difficulty,
    ingredients: input.ingredients,
    steps: input.steps,
  }
}

// ─── Fotos ───────────────────────────────────────────────────────────────────

/** URLs assinadas das fotos valem por um dia; ao recarregar as receitas, saem novas. */
const SIGNED_URL_SECONDS = 60 * 60 * 24

const STORAGE_URL = new RegExp(`/storage/v1/object/(?:sign|public)/${IMAGES_BUCKET}/([^?]+)`)

/** Fotos novas chegam do formulário como data URL e sobem para o Storage. No banco fica só o caminho no bucket. */
async function persistImage(userId: string, image: string | undefined) {
  if (!image?.startsWith('data:')) return storagePath(image) ?? undefined
  const blob = await (await fetch(image)).blob()
  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return path
}

/** Caminho no bucket a partir da URL da foto (assinada, ou pública da época em que o bucket era aberto). */
function storagePath(image: string | undefined) {
  if (!image || image.startsWith('data:')) return null
  const match = image.match(STORAGE_URL)
  if (match) return decodeURIComponent(match[1])
  // Sem "://" já é o caminho: a foto não pôde ser assinada e ficou como estava no banco.
  return image.includes('://') ? null : image
}

/** O bucket é privado: troca o caminho de cada foto por uma URL assinada antes de entregar ao app. */
async function fromRows(rows: RecipeRow[]) {
  const paths = rows.flatMap((row) => (row.image_url ? [row.image_url] : []))
  const urls = new Map<string, string>()
  if (paths.length > 0) {
    const { data } = await supabase.storage.from(IMAGES_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)
    // Se a assinatura falhar, as receitas aparecem com o placeholder no lugar da foto.
    for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
  }
  return rows.map((row) => fromRow(row, row.image_url ? (urls.get(row.image_url) ?? row.image_url) : undefined))
}

// ─── Receitas ────────────────────────────────────────────────────────────────

export async function fetchRecipes() {
  const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return fromRows(data)
}

export async function createRecipe(userId: string, input: RecipeInput) {
  const image = await persistImage(userId, input.image)
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...toRow({ ...input, image }) })
    .select()
    .single()
  if (error) throw error
  const [recipe] = await fromRows([data])
  return recipe
}

export async function updateRecipe(userId: string, id: string, input: RecipeInput) {
  const image = await persistImage(userId, input.image)
  const { data, error } = await supabase
    .from('recipes')
    .update(toRow({ ...input, image }))
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  const [recipe] = await fromRows([data])
  return recipe
}

export async function deleteRecipe(recipe: Recipe) {
  const { error } = await supabase.from('recipes').delete().eq('id', recipe.id)
  if (error) throw error
  const path = storagePath(recipe.image)
  // Limpeza da foto é "melhor esforço": se falhar, a receita já foi excluída.
  if (path) await supabase.storage.from(IMAGES_BUCKET).remove([path])
}

export async function setFavorite(id: string, favorite: boolean) {
  const { error } = await supabase.from('recipes').update({ favorite }).eq('id', id)
  if (error) throw error
}

// ─── Categorias do usuário ───────────────────────────────────────────────────

export async function fetchCategories(): Promise<CustomCategory[]> {
  const { data, error } = await supabase.from('categories').select('id, label, icon').order('created_at')
  if (error) throw error
  return data
}

export async function createCategory(category: CustomCategory) {
  const { error } = await supabase.from('categories').insert(category)
  if (error) throw error
}

export async function updateCategory(id: string, changes: Pick<CustomCategory, 'label' | 'icon'>) {
  const { error } = await supabase.from('categories').update(changes).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

/** Move todas as receitas de uma categoria para outra (usado antes de excluir uma categoria). */
export async function moveRecipesToCategory(from: string, to: string) {
  const { error } = await supabase.from('recipes').update({ category: to }).eq('category', from)
  if (error) throw error
}

// ─── Primeiro acesso ─────────────────────────────────────────────────────────

const preparing = new Map<string, Promise<void>>()

/**
 * Prepara a conta no primeiro login, uma única vez por usuário: importa as receitas e categorias
 * que a pessoa criou na versão antiga (LocalStorage deste navegador). Contas novas começam vazias.
 * Memoizado para que os contexts de receitas e de categorias esperem pelo mesmo trabalho.
 */
export function ensureUserData(userId: string) {
  let promise = preparing.get(userId)
  if (!promise) {
    promise = prepare(userId).catch((error: unknown) => {
      preparing.delete(userId)
      throw error
    })
    preparing.set(userId, promise)
  }
  return promise
}

async function prepare(userId: string) {
  // O perfil funciona como trava: só quem consegue criá-lo faz a importação.
  const { error } = await supabase.from('profiles').insert({ user_id: userId })
  if (error?.code === '23505') return // já preparado antes
  if (error) throw error

  const legacy = readLegacyData()
  if (!legacy) return

  if (legacy.recipes.length > 0) {
    const rows = await Promise.all(
      legacy.recipes.map(async (recipe) => ({
        ...toRow({ ...recipe, image: await persistImage(userId, recipe.image) }),
        favorite: recipe.favorite,
        created_at: recipe.createdAt,
      })),
    )
    const { error: recipesError } = await supabase.from('recipes').insert(rows)
    if (recipesError) throw recipesError
  }
  if (legacy.categories.length > 0) {
    const { error: categoriesError } = await supabase.from('categories').insert(legacy.categories)
    if (categoriesError) throw categoriesError
  }
  clearLegacyData()
}
