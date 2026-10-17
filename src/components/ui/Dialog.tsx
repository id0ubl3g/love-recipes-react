import { X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface DialogProps {
  /** Texto da barra do topo; também nomeia a janela para leitores de tela. */
  title: string
  onClose: () => void
  children: ReactNode
  /** Largura máxima do painel (classe do Tailwind). */
  widthClass?: string
}

/**
 * Janela por cima da página, com o fundo borrado. Fecha pelo X, pela tecla Esc ou clicando fora.
 * No celular sobe de baixo como uma gaveta. Use dentro de <AnimatePresence> para animar a saída.
 */
export function Dialog({ title, onClose, children, widthClass = 'max-w-3xl' }: DialogProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-cocoa/25 backdrop-blur-sm"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-3xl ${widthClass}`}
      >
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-line bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <p id={titleId} className="truncate text-sm font-medium text-cocoa-muted">
            {title}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-cocoa-muted transition-colors hover:bg-blush-50 hover:text-cocoa"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
