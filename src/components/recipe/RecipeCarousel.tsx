import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Recipe } from '../../types/recipe'
import { RecipeCard } from './RecipeCard'

interface RecipeCarouselProps {
  recipes: Recipe[]
  onToggleFavorite: (recipe: Recipe) => void
  /** Título e contagem, renderizados à esquerda das setas. */
  header: ReactNode
}

/** Distância mínima (px) para um clique virar arraste e não abrir a receita. */
const DRAG_THRESHOLD = 6

/** Fileira horizontal: 4 cards visíveis no desktop, o resto arrastando para o lado. */
export function RecipeCarousel({ recipes, onToggleFavorite, header }: RecipeCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ startX: 0, startScroll: 0, moved: false, active: false })

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    const observer = new ResizeObserver(updateArrows)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateArrows, recipes.length])

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current
    if (el) el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' })
  }

  // Arrastar com o mouse (toque e touchpad já rolam nativamente).
  function onPointerDown(event: React.PointerEvent) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !trackRef.current) return
    drag.current = { startX: event.clientX, startScroll: trackRef.current.scrollLeft, moved: false, active: true }
  }

  function onPointerMove(event: React.PointerEvent) {
    const el = trackRef.current
    if (!drag.current.active || !el) return
    const delta = event.clientX - drag.current.startX
    if (!drag.current.moved && Math.abs(delta) > DRAG_THRESHOLD) {
      drag.current.moved = true
      setDragging(true)
      el.setPointerCapture(event.pointerId)
    }
    if (drag.current.moved) el.scrollLeft = drag.current.startScroll - delta
  }

  function endDrag() {
    drag.current.active = false
    // Mantém "dragging" até depois do click, para o click do fim do arraste ser ignorado.
    requestAnimationFrame(() => setDragging(false))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        {header}
        <div className="flex shrink-0 gap-1">
          <ArrowButton label="Anteriores" disabled={!canPrev} onClick={() => scrollByPage(-1)}>
            <ChevronLeft className="size-4" />
          </ArrowButton>
          <ArrowButton label="Próximas" disabled={!canNext} onClick={() => scrollByPage(1)}>
            <ChevronRight className="size-4" />
          </ArrowButton>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={updateArrows}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.preventDefault()
            e.stopPropagation()
            drag.current.moved = false
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        className={`no-scrollbar -mx-4 flex gap-5 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:px-0 ${
          dragging ? 'cursor-grabbing select-none' : 'snap-x snap-mandatory'
        }`}
      >
        <AnimatePresence mode="popLayout">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="w-[80%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3.75rem)/4)]"
            >
              <RecipeCard recipe={recipe} onToggleFavorite={onToggleFavorite} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface ArrowButtonProps {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}

function ArrowButton({ label, disabled, onClick, children }: ArrowButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full border border-line text-cocoa-muted transition-colors hover:border-blush-100 hover:bg-blush-50 hover:text-cocoa disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}
