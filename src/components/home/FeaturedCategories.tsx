import { CircleDashed, LayoutGrid, Settings2 } from 'lucide-react'
import { UNCATEGORIZED_FILTER } from '../../data/categories'
import { useCategories } from '../../hooks/useCategories'
import type { CategoryId } from '../../types/recipe'
import { Skeleton } from '../ui/Skeleton'

interface FeaturedCategoriesProps {
  loading: boolean
  selected: CategoryId | null
  onSelect: (category: CategoryId | null) => void
  /** Abre o gerenciamento de categorias (criar, editar, excluir). */
  onManage: () => void
  /** Mostra o filtro "Sem categoria" — só quando há receitas nessa situação. */
  showUncategorized: boolean
}

export function FeaturedCategories({
  loading,
  selected,
  onSelect,
  onManage,
  showUncategorized,
}: FeaturedCategoriesProps) {
  const { categories } = useCategories()
  const options = [
    { id: null, label: 'Todas', icon: LayoutGrid },
    ...categories,
    ...(showUncategorized ? [{ id: UNCATEGORIZED_FILTER, label: 'Sem categoria', icon: CircleDashed }] : []),
  ]

  return (
    <nav aria-label="Categorias">
      {/* Uma linha só; rola para o lado quando há mais categorias do que cabem. */}
      <ul className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {options.map((option) => {
          if (loading) {
            return (
              <li key={option.id ?? 'todas'} className="flex w-20 shrink-0 flex-col items-center gap-2 py-3">
                <Skeleton className="size-6 rounded-md" />
                <Skeleton className="h-2.5 w-12 rounded-full" />
              </li>
            )
          }
          const active = selected === option.id
          const Icon = option.icon
          return (
            <li key={option.id ?? 'todas'} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(option.id)}
                aria-pressed={active}
                className={`group flex w-20 flex-col items-center gap-2 rounded-xl py-3 transition-colors sm:w-24 ${
                  active ? 'text-blush-500' : 'text-cocoa-muted hover:text-cocoa'
                }`}
              >
                <Icon className="size-6" strokeWidth={1.5} />
                <span className="text-xs font-medium whitespace-nowrap">{option.label}</span>
                <span
                  aria-hidden="true"
                  className={`h-0.5 w-6 rounded-full transition-colors ${
                    active ? 'bg-blush-500' : 'bg-transparent group-hover:bg-line'
                  }`}
                />
              </button>
            </li>
          )
        })}
        {!loading && (
          <li className="shrink-0">
            <button
              type="button"
              onClick={onManage}
              className="group flex w-20 flex-col items-center gap-2 rounded-xl py-3 text-cocoa-muted/70 transition-colors hover:text-blush-500 sm:w-24"
            >
              <Settings2 className="size-6" strokeWidth={1.5} />
              <span className="text-xs font-medium whitespace-nowrap">Gerenciar</span>
              <span aria-hidden="true" className="h-0.5 w-6" />
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
