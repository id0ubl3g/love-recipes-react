import { LoaderCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useState } from 'react'
import { CATEGORY_ICON_LABEL, CATEGORY_ICONS, DEFAULT_CATEGORY_ICON, type CategoryIconKey } from '../../data/categories'
import { LIMITS } from '../../lib/limits'

interface CategoryEditorProps {
  /** Valores iniciais ao editar; vazio ao criar. */
  initial?: { label: string; icon: CategoryIconKey }
  title: string
  submitLabel: string
  /** Pode ser assíncrono; se lançar erro, a mensagem aparece no formulário. */
  onSubmit: (label: string, icon: CategoryIconKey) => void | Promise<void>
  onCancel: () => void
}

/** Formulário compacto de categoria: nome + ícone. Usado para criar e para editar. */
export function CategoryEditor({ initial, title, submitLabel, onSubmit, onCancel }: CategoryEditorProps) {
  const inputId = useId()
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icon, setIcon] = useState<CategoryIconKey>(initial?.icon ?? DEFAULT_CATEGORY_ICON)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!label.trim()) {
      setError('Dê um nome para a categoria.')
      return
    }
    setBusy(true)
    try {
      await onSubmit(label, icon)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a categoria.')
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
      <div className="mt-3 rounded-2xl border border-blush-100 bg-blush-50/50 p-4">
        <label htmlFor={inputId} className="text-sm font-medium text-cocoa">
          {title}
        </label>
        <input
          id={inputId}
          autoFocus
          value={label}
          maxLength={LIMITS.categoryLabel}
          onChange={(e) => {
            setLabel(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            // Enter salva a categoria em vez de enviar o formulário em volta (ex.: a receita inteira).
            if (e.key === 'Enter') {
              e.preventDefault()
              void submit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              onCancel()
            }
          }}
          placeholder="Ex: Petiscos, Natal, Veganas..."
          className={`mt-2 h-11 w-full rounded-xl border bg-white px-4 text-sm text-cocoa transition-colors placeholder:text-cocoa-muted/60 focus:ring-2 focus:outline-none ${
            error ? 'border-red-300 focus:ring-red-100' : 'border-line focus:border-blush-300 focus:ring-blush-100'
          }`}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

        <p className="mt-4 text-sm font-medium text-cocoa">Ícone</p>
        <div role="radiogroup" aria-label="Ícone da categoria" className="mt-2 flex flex-wrap gap-2">
          {(Object.entries(CATEGORY_ICONS) as [CategoryIconKey, (typeof CATEGORY_ICONS)[CategoryIconKey]][]).map(
            ([key, Icon]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={icon === key}
                aria-label={CATEGORY_ICON_LABEL[key]}
                title={CATEGORY_ICON_LABEL[key]}
                onClick={() => setIcon(key)}
                className={`grid size-10 place-items-center rounded-xl border transition-colors ${
                  icon === key
                    ? 'border-blush-500 bg-white text-blush-500'
                    : 'border-transparent text-cocoa-muted hover:bg-white hover:text-cocoa'
                }`}
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </button>
            ),
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-cocoa-muted hover:text-cocoa"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="flex items-center gap-2 rounded-full bg-blush-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blush-600 disabled:opacity-60"
          >
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/** Descobre a chave salva no banco a partir do componente de ícone de uma categoria. */
export function iconKeyOf(icon: unknown): CategoryIconKey {
  const entry = (Object.entries(CATEGORY_ICONS) as [CategoryIconKey, unknown][]).find(
    ([, component]) => component === icon,
  )
  return entry?.[0] ?? DEFAULT_CATEGORY_ICON
}
