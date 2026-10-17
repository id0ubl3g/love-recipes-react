import { LoaderCircle, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Category } from '../../data/categories'
import { useCategories } from '../../hooks/useCategories'
import { useRecipes } from '../../hooks/useRecipes'
import { LIMITS } from '../../lib/limits'
import { normalize } from '../../lib/text'
import { Dialog } from '../ui/Dialog'
import { CategoryEditor, iconKeyOf } from './CategoryEditor'

interface CategoryManagerProps {
  onClose: () => void
}

/** Valor do seletor "mover receitas para" que mantém as receitas sem categoria. */
const KEEP_UNCATEGORIZED = ''

/** Criar, renomear, trocar ícone e excluir categorias. As padrão aparecem bloqueadas. */
export function CategoryManager({ onClose }: CategoryManagerProps) {
  const { categories, canCreate, addCategory, updateCategory } = useCategories()
  const { recipes } = useRecipes()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const result = new Map<string, number>()
    for (const recipe of recipes) result.set(recipe.category, (result.get(recipe.category) ?? 0) + 1)
    return result
  }, [recipes])

  const customCount = categories.filter((c) => c.custom).length

  function create(label: string, icon: Parameters<typeof addCategory>[1]) {
    if (categories.some((c) => normalize(c.label) === normalize(label.trim()))) {
      throw new Error('Já existe uma categoria com esse nome.')
    }
    const { category } = addCategory(label, icon)
    toast.success(`Categoria “${category.label}” criada`)
    setCreating(false)
  }

  return (
    <Dialog title="Suas categorias" onClose={onClose} widthClass="max-w-xl">
      <div className="px-5 pt-5 pb-8 sm:px-8">
        <p className="text-sm text-cocoa-muted">
          Crie categorias do seu jeito. As padrão vêm com o app e não podem ser alteradas.
        </p>

        {!creating && (
          <button
            type="button"
            onClick={() => {
              setCreating(true)
              setEditingId(null)
              setDeletingId(null)
            }}
            disabled={!canCreate}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-blush-300 py-3 text-sm font-medium text-blush-500 transition-colors hover:bg-blush-50 disabled:cursor-not-allowed disabled:border-line disabled:text-cocoa-muted/60 disabled:hover:bg-transparent"
          >
            {canCreate ? (
              <>
                <Plus className="size-4" /> Nova categoria
              </>
            ) : (
              `Limite de ${LIMITS.categoriesPerUser} categorias atingido`
            )}
          </button>
        )}
        <AnimatePresence initial={false}>
          {creating && (
            <CategoryEditor
              title="Nome da nova categoria"
              submitLabel="Criar categoria"
              onSubmit={create}
              onCancel={() => setCreating(false)}
            />
          )}
        </AnimatePresence>

        <ul className="mt-6 divide-y divide-line">
          {categories.map((category) => (
            <li key={category.id} className="py-1">
              {editingId === category.id ? (
                <CategoryEditor
                  initial={{ label: category.label, icon: iconKeyOf(category.icon) }}
                  title="Editar categoria"
                  submitLabel="Salvar"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (label, icon) => {
                    await updateCategory(category.id, label, icon)
                    toast.success('Categoria atualizada')
                    setEditingId(null)
                  }}
                />
              ) : (
                <CategoryRow
                  category={category}
                  count={counts.get(category.id) ?? 0}
                  onEdit={() => {
                    setEditingId(category.id)
                    setDeletingId(null)
                    setCreating(false)
                  }}
                  onDelete={() => {
                    setDeletingId(category.id)
                    setEditingId(null)
                    setCreating(false)
                  }}
                />
              )}
              <AnimatePresence initial={false}>
                {deletingId === category.id && (
                  <DeleteConfirm
                    category={category}
                    count={counts.get(category.id) ?? 0}
                    onCancel={() => setDeletingId(null)}
                    onDone={() => setDeletingId(null)}
                  />
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-right text-xs text-cocoa-muted">
          {customCount}/{LIMITS.categoriesPerUser} categorias criadas
        </p>

        {customCount === 0 && (
          <p className="mt-4 text-center text-xs text-cocoa-muted">Você ainda não criou nenhuma categoria.</p>
        )}
      </div>
    </Dialog>
  )
}

interface CategoryRowProps {
  category: Category
  count: number
  onEdit: () => void
  onDelete: () => void
}

function CategoryRow({ category, count, onEdit, onDelete }: CategoryRowProps) {
  const Icon = category.icon
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blush-50 text-blush-500">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-cocoa">{category.label}</p>
        <p className="text-xs text-cocoa-muted">
          {count} {count === 1 ? 'receita' : 'receitas'}
        </p>
      </div>
      {category.custom ? (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar ${category.label}`}
            title="Editar"
            className="grid size-9 place-items-center rounded-full text-cocoa-muted transition-colors hover:bg-blush-50 hover:text-cocoa"
          >
            <Pencil className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Excluir ${category.label}`}
            title="Excluir"
            className="grid size-9 place-items-center rounded-full text-cocoa-muted transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-cocoa-muted/70" title="Categoria padrão">
          <Lock className="size-3" /> Padrão
        </span>
      )}
    </div>
  )
}

interface DeleteConfirmProps {
  category: Category
  count: number
  onCancel: () => void
  onDone: () => void
}

/** Confirmação de exclusão: se houver receitas na categoria, escolhe para onde elas vão. */
function DeleteConfirm({ category, count, onCancel, onDone }: DeleteConfirmProps) {
  const { categories, removeCategory } = useCategories()
  const { moveCategory } = useRecipes()
  const targets = categories.filter((c) => c.id !== category.id)
  const [target, setTarget] = useState(targets[0]?.id ?? KEEP_UNCATEGORIZED)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      if (count > 0 && target !== KEEP_UNCATEGORIZED) await moveCategory(category.id, target)
      await removeCategory(category.id)
      toast.success(`Categoria “${category.label}” excluída`)
      onDone()
    } catch {
      toast.error('Não foi possível excluir a categoria. Tente de novo.')
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mb-2 rounded-2xl border border-red-100 bg-red-50/60 p-4">
        <p className="text-sm font-semibold text-cocoa">Excluir “{category.label}”?</p>
        {count > 0 ? (
          <>
            <p className="mt-1 text-sm text-cocoa-muted">
              {count === 1 ? '1 receita usa' : `${count} receitas usam`} esta categoria. Para onde ela
              {count === 1 ? ' vai' : 's vão'}?
            </p>
            <label htmlFor={`mover-${category.id}`} className="sr-only">
              Mover receitas para
            </label>
            <select
              id={`mover-${category.id}`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-3 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-cocoa focus:border-blush-300 focus:ring-2 focus:ring-blush-100 focus:outline-none"
            >
              {targets.map((c) => (
                <option key={c.id} value={c.id}>
                  Mover para {c.label}
                </option>
              ))}
              <option value={KEEP_UNCATEGORIZED}>Deixar sem categoria</option>
            </select>
          </>
        ) : (
          <p className="mt-1 text-sm text-cocoa-muted">Nenhuma receita usa esta categoria.</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-cocoa-muted hover:text-cocoa"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy}
            className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
          >
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            Excluir categoria
          </button>
        </div>
      </div>
    </motion.div>
  )
}
