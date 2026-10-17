import { Flame, Hourglass, ImagePlus, LoaderCircle, Plus, Snowflake, Timer, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { DIFFICULTY_LABEL } from '../../data/categories'
import { useCategories } from '../../hooks/useCategories'
import { compressImage } from '../../lib/image'
import { LIMITS } from '../../lib/limits'
import { formatDuration, totalMinutes } from '../../lib/time'
import type { CategoryId, Difficulty, RecipeInput, RecipeTimes } from '../../types/recipe'
import { CategoryEditor } from '../category/CategoryEditor'

interface RecipeFormProps {
  initial?: RecipeInput
  submitLabel: string
  /** Pode ser assíncrono; se lançar erro, a mensagem aparece e o formulário continua preenchido. */
  onSubmit: (input: RecipeInput) => Promise<void>
  onCancel: () => void
}

interface Row {
  id: string
  value: string
}

type Errors = Partial<Record<'title' | 'category' | 'prep' | 'ingredients' | 'steps', string>>

const DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil']

const TIME_FIELDS: { key: keyof RecipeTimes; label: string; hint: string; icon: typeof Timer }[] = [
  { key: 'prep', label: 'Preparo', hint: 'Mão na massa', icon: Timer },
  { key: 'oven', label: 'Forno', hint: 'Assando', icon: Flame },
  { key: 'fridge', label: 'Geladeira', hint: 'Gelando', icon: Snowflake },
  { key: 'rest', label: 'Descanso', hint: 'Crescer ou esfriar', icon: Hourglass },
]

const MAX_UPLOAD_MB = 15

const toRows = (values: string[], minimum: number): Row[] => {
  const rows = values.map((value) => ({ id: crypto.randomUUID(), value }))
  while (rows.length < minimum) rows.push({ id: crypto.randomUUID(), value: '' })
  return rows
}

const inputClass = (invalid = false) =>
  `h-11 w-full rounded-xl border bg-white px-4 text-sm text-cocoa transition-colors placeholder:text-cocoa-muted/60 focus:ring-2 focus:outline-none ${
    invalid ? 'border-red-300 focus:ring-red-100' : 'border-line focus:border-blush-300 focus:ring-blush-100'
  }`

export function RecipeForm({ initial, submitLabel, onSubmit, onCancel }: RecipeFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<CategoryId | null>(initial?.category ?? null)
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'facil')
  const [servings, setServings] = useState(initial?.servings ?? 4)
  const [times, setTimes] = useState<RecipeTimes>(initial?.times ?? { prep: 0, oven: 0, fridge: 0, rest: 0 })
  const [image, setImage] = useState<string | undefined>(initial?.image)
  const [ingredients, setIngredients] = useState<Row[]>(() => toRows(initial?.ingredients ?? [], 3))
  const [steps, setSteps] = useState<Row[]>(() => toRows(initial?.steps ?? [], 2))
  const [errors, setErrors] = useState<Errors>({})
  const [processingImage, setProcessingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { categories, canCreate, addCategory } = useCategories()
  const [creatingCategory, setCreatingCategory] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Escolha um arquivo de imagem (JPG, PNG ou WEBP).')
      return
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`A imagem pode ter no máximo ${MAX_UPLOAD_MB} MB.`)
      return
    }
    setProcessingImage(true)
    try {
      setImage(await compressImage(file))
    } catch {
      toast.error('Não foi possível ler essa imagem. Tente outra.')
    } finally {
      setProcessingImage(false)
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    void handleFile(event.dataTransfer.files[0])
  }

  function setTime(key: keyof RecipeTimes, value: string) {
    const minutes = Math.max(0, Math.min(9999, Math.floor(Number(value) || 0)))
    setTimes((prev) => ({ ...prev, [key]: minutes }))
    if (key === 'prep') setErrors((prev) => ({ ...prev, prep: undefined }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    const cleanIngredients = ingredients.map((r) => r.value.trim()).filter(Boolean)
    const cleanSteps = steps.map((r) => r.value.trim()).filter(Boolean)

    const nextErrors: Errors = {}
    if (!title.trim()) nextErrors.title = 'Dê um nome para a receita.'
    if (!category) nextErrors.category = 'Escolha uma categoria.'
    if (times.prep <= 0) nextErrors.prep = 'Informe o tempo de preparo.'
    if (cleanIngredients.length === 0) nextErrors.ingredients = 'Adicione pelo menos um ingrediente.'
    if (cleanSteps.length === 0) nextErrors.steps = 'Descreva pelo menos um passo.'
    setErrors(nextErrors)

    const firstError = Object.keys(nextErrors)[0]
    if (firstError || !category) {
      document.getElementById(`campo-${firstError}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        image,
        difficulty,
        servings: Math.max(1, servings),
        times,
        ingredients: cleanIngredients,
        steps: cleanSteps,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a receita.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-10">
      {/* Foto + informações básicas */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div>
          <span className="mb-2 block text-sm font-medium text-cocoa">Foto da receita</span>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
              dragging
                ? 'border-blush-500 bg-blush-50'
                : image
                  ? 'border-transparent'
                  : 'border-blush-100 bg-blush-50/50'
            }`}
          >
            {image ? (
              <>
                <img src={image} alt="Prévia da foto" className="size-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-cocoa backdrop-blur hover:bg-white"
                  >
                    Trocar
                  </button>
                  <button
                    type="button"
                    onClick={() => setImage(undefined)}
                    aria-label="Remover foto"
                    className="grid size-7 place-items-center rounded-full bg-white/90 text-cocoa-muted backdrop-blur hover:bg-white hover:text-cocoa"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center"
              >
                {processingImage ? (
                  <LoaderCircle className="size-7 animate-spin text-blush-500" />
                ) : (
                  <ImagePlus className="size-7 text-blush-500" strokeWidth={1.5} />
                )}
                <span className="text-sm font-medium text-cocoa">
                  {processingImage ? 'Preparando a foto...' : 'Clique ou arraste uma imagem'}
                </span>
                <span className="text-xs text-cocoa-muted">JPG, PNG ou WEBP · opcional</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>

        <div className="space-y-5">
          <Field id="title" label="Nome da receita" required error={errors.title}>
            <input
              id="campo-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setErrors((prev) => ({ ...prev, title: undefined }))
              }}
              placeholder="Ex: Bolo de cenoura com chocolate"
              maxLength={LIMITS.title}
              className={inputClass(!!errors.title)}
            />
          </Field>

          <Field id="description" label="Descrição curta">
            <textarea
              id="campo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Uma frase que dê água na boca."
              maxLength={LIMITS.description}
              rows={2}
              className={`${inputClass()} h-auto resize-none py-3`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field id="servings" label="Rende (porções)">
              <input
                id="campo-servings"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={servings || ''}
                onChange={(e) => setServings(Math.min(999, Math.floor(Number(e.target.value) || 0)))}
                className={inputClass()}
              />
            </Field>
            <div>
              <span className="mb-2 block text-sm font-medium text-cocoa">Dificuldade</span>
              <div role="radiogroup" aria-label="Dificuldade" className="flex h-11 rounded-xl bg-blush-50 p-1">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={difficulty === d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 rounded-lg text-xs font-medium transition-colors ${
                      difficulty === d ? 'bg-white text-blush-500 shadow-soft' : 'text-cocoa-muted hover:text-cocoa'
                    }`}
                  >
                    {DIFFICULTY_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categoria */}
      <Field id="category" label="Categoria" required error={errors.category}>
        <div id="campo-category" role="radiogroup" aria-label="Categoria" className="flex flex-wrap gap-2">
          {categories.map(({ id, label, icon: Icon }) => {
            const active = category === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setCategory(id)
                  setErrors((prev) => ({ ...prev, category: undefined }))
                }}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'border-blush-500 bg-blush-50 font-medium text-blush-500'
                    : 'border-line text-cocoa-muted hover:border-blush-100 hover:text-cocoa'
                }`}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {label}
              </button>
            )
          })}
          {!creatingCategory && canCreate && (
            <button
              type="button"
              onClick={() => setCreatingCategory(true)}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-blush-300 px-4 py-2 text-sm font-medium text-blush-500 transition-colors hover:bg-blush-50"
            >
              <Plus className="size-4" /> Nova categoria
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {creatingCategory && (
            <CategoryEditor
              title="Nome da nova categoria"
              submitLabel="Criar categoria"
              onCancel={() => setCreatingCategory(false)}
              onSubmit={(label, icon) => {
                const { category: created, created: isNew } = addCategory(label, icon)
                setCategory(created.id)
                setErrors((prev) => ({ ...prev, category: undefined }))
                setCreatingCategory(false)
                if (isNew) toast.success(`Categoria “${created.label}” criada`)
                else toast(`“${created.label}” já existia — selecionamos para você`)
              }}
            />
          )}
        </AnimatePresence>
      </Field>

      {/* Tempos */}
      <fieldset id="campo-prep">
        <div className="flex items-baseline justify-between gap-4">
          <legend className="text-sm font-medium text-cocoa">Tempo por etapa</legend>
          <p className="text-sm text-cocoa-muted">
            Pronto em{' '}
            <span className="font-semibold text-blush-500">
              {totalMinutes(times) > 0 ? formatDuration(totalMinutes(times)) : '—'}
            </span>
          </p>
        </div>
        <p className="mt-1 text-xs text-cocoa-muted">Em minutos. Deixe 0 nas etapas que não existem.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TIME_FIELDS.map(({ key, label, hint, icon: Icon }) => {
            const invalid = key === 'prep' && !!errors.prep
            return (
              <label
                key={key}
                className={`rounded-xl border px-3 py-3 transition-colors focus-within:border-blush-300 ${
                  invalid ? 'border-red-300' : times[key] > 0 ? 'border-blush-100 bg-blush-50/60' : 'border-line'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-cocoa">
                  <Icon className="size-3.5 text-blush-500" strokeWidth={2} />
                  {label}
                  {key === 'prep' && <span className="text-blush-500">*</span>}
                </span>
                <span className="mt-2 flex items-baseline gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={9999}
                    value={times[key] || ''}
                    placeholder="0"
                    onChange={(e) => setTime(key, e.target.value)}
                    className="w-full min-w-0 bg-transparent text-lg font-semibold text-cocoa placeholder:text-cocoa-muted/40 focus:outline-none"
                  />
                  <span className="text-xs text-cocoa-muted">min</span>
                </span>
                <span className="mt-0.5 block text-[11px] text-cocoa-muted">
                  {times[key] >= 60 ? formatDuration(times[key]) : hint}
                </span>
              </label>
            )
          })}
        </div>
        {errors.prep && <p className="mt-2 text-xs text-red-500">{errors.prep}</p>}
      </fieldset>

      {/* Ingredientes */}
      <EditableList
        id="ingredients"
        label="Ingredientes"
        rows={ingredients}
        onChange={(rows) => {
          setIngredients(rows)
          setErrors((prev) => ({ ...prev, ingredients: undefined }))
        }}
        error={errors.ingredients}
        addLabel="Adicionar ingrediente"
        placeholder="Ex: 2 xícaras de farinha de trigo"
        hint={`Um ingrediente por linha (até ${LIMITS.ingredients.maxLength} caracteres). Enter cria a próxima.`}
        maxItems={LIMITS.ingredients.maxItems}
        maxLength={LIMITS.ingredients.maxLength}
      />

      {/* Modo de preparo */}
      <EditableList
        id="steps"
        label="Modo de preparo"
        rows={steps}
        onChange={(rows) => {
          setSteps(rows)
          setErrors((prev) => ({ ...prev, steps: undefined }))
        }}
        error={errors.steps}
        addLabel="Adicionar passo"
        placeholder="Descreva este passo..."
        hint={`Um passo de cada vez, na ordem em que acontecem (até ${LIMITS.steps.maxLength} caracteres cada).`}
        multiline
        maxItems={LIMITS.steps.maxItems}
        maxLength={LIMITS.steps.maxLength}
      />

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-cocoa transition-colors hover:bg-blush-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={processingImage || submitting}
          className="rounded-full bg-blush-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blush-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" /> Salvando...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}

interface FieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}

function Field({ id, label, required = false, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={`campo-${id}`} className="mb-2 block text-sm font-medium text-cocoa">
        {label} {required && <span className="text-blush-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface EditableListProps {
  id: string
  label: string
  rows: Row[]
  onChange: (rows: Row[]) => void
  error?: string
  addLabel: string
  placeholder: string
  hint: string
  multiline?: boolean
  /** Quantidade máxima de linhas e de caracteres por linha (iguais aos do banco). */
  maxItems: number
  maxLength: number
}

/** Lista de campos de texto: adicionar, editar e remover linhas. */
function EditableList({
  id,
  label,
  rows,
  onChange,
  error,
  addLabel,
  placeholder,
  hint,
  multiline = false,
  maxItems,
  maxLength,
}: EditableListProps) {
  const listRef = useRef<HTMLOListElement>(null)
  const full = rows.length >= maxItems

  function focusRow(rowId: string) {
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-row="${rowId}"]`)?.focus())
  }

  function insertAfter(index: number, values: string[] = ['']) {
    if (full) {
      toast(`Limite de ${maxItems} itens em “${label}”.`)
      return
    }
    const added = values.map((value) => ({ id: crypto.randomUUID(), value }))
    onChange([...rows.slice(0, index + 1), ...added, ...rows.slice(index + 1)])
    focusRow(added[added.length - 1].id)
  }

  function update(index: number, value: string) {
    onChange(rows.map((row, i) => (i === index ? { ...row, value } : row)))
  }

  function remove(index: number) {
    const next = rows.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [{ id: crypto.randomUUID(), value: '' }])
  }

  return (
    <fieldset id={`campo-${id}`}>
      <legend className="text-sm font-medium text-cocoa">
        {label} <span className="text-blush-500">*</span>
      </legend>
      <p className="mt-1 text-xs text-cocoa-muted">{hint}</p>

      <ol ref={listRef} className="mt-3 space-y-2">
        <AnimatePresence initial={false}>
          {rows.map((row, index) => (
            <motion.li
              key={row.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-start gap-2"
            >
              <span className="mt-3 w-5 shrink-0 text-right text-xs font-semibold text-blush-500">{index + 1}</span>
              {multiline ? (
                <textarea
                  data-row={row.id}
                  value={row.value}
                  onChange={(e) => update(index, e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  maxLength={maxLength}
                  aria-label={`${label}: item ${index + 1}`}
                  className={`${inputClass(!!error && index === 0)} h-auto resize-y py-3`}
                />
              ) : (
                <input
                  data-row={row.id}
                  value={row.value}
                  onChange={(e) => update(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      insertAfter(index)
                    } else if (e.key === 'Backspace' && row.value === '' && rows.length > 1) {
                      e.preventDefault()
                      remove(index)
                      focusRow(rows[Math.max(0, index - 1)].id)
                    }
                  }}
                  onPaste={(e) => {
                    // Colar uma lista inteira (uma linha por item) cria uma linha para cada.
                    const lines = e.clipboardData
                      .getData('text')
                      .split(/\r?\n/)
                      .map((l) => l.trim())
                      .filter(Boolean)
                    if (lines.length < 2) return
                    e.preventDefault()
                    const [first, ...others] = lines.map((l) => l.slice(0, maxLength))
                    // Respeita o limite de itens: o que passar dele fica de fora, com aviso.
                    const room = Math.max(0, maxItems - rows.length)
                    const kept = others.slice(0, room)
                    if (kept.length < others.length)
                      toast(`Só cabem ${maxItems} itens em “${label}”; ${others.length - kept.length} ficaram de fora.`)
                    const next = rows.map((r, i) =>
                      i === index ? { ...r, value: (r.value + first).slice(0, maxLength) } : r,
                    )
                    const added = kept.map((value) => ({ id: crypto.randomUUID(), value }))
                    onChange([...next.slice(0, index + 1), ...added, ...next.slice(index + 1)])
                  }}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  aria-label={`${label}: item ${index + 1}`}
                  className={inputClass(!!error && index === 0)}
                />
              )}
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remover item ${index + 1}`}
                className="mt-1.5 grid size-8 shrink-0 place-items-center rounded-full text-cocoa-muted/60 transition-colors hover:bg-blush-50 hover:text-cocoa"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {error && <p className="mt-2 ml-7 text-xs text-red-500">{error}</p>}

      <div className="mt-3 ml-7 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => insertAfter(rows.length - 1)}
          disabled={full}
          className="flex items-center gap-1.5 text-sm font-medium text-blush-500 hover:text-blush-600 disabled:cursor-not-allowed disabled:text-cocoa-muted/50"
        >
          <Plus className="size-4" /> {full ? `Limite de ${maxItems} atingido` : addLabel}
        </button>
        <span className={`text-xs ${full ? 'text-blush-500' : 'text-cocoa-muted'}`}>
          {rows.length}/{maxItems}
        </span>
      </div>
    </fieldset>
  )
}
