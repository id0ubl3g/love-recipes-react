import {
  Cake,
  Check,
  ChefHat,
  Clock,
  CookingPot,
  CupSoda,
  Flame,
  Heart,
  Hourglass,
  Snowflake,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

interface PreviewRecipe {
  category: string
  categoryIcon: LucideIcon
  title: string
  ready: string
  servings: string
  difficulty: string
  times: { icon: LucideIcon; label: string; value: string }[]
  ingredients: string[]
  steps: string[]
}

/** Conteúdo ilustrativo da tela de login — não é salvo em lugar nenhum. */
const PREVIEWS: PreviewRecipe[] = [
  {
    category: 'Bolos',
    categoryIcon: Cake,
    title: 'Bolo de cenoura com chocolate',
    ready: '1h 15min',
    servings: '12 porções',
    difficulty: 'Fácil',
    times: [
      { icon: Timer, label: 'Preparo', value: '20 min' },
      { icon: Flame, label: 'Forno', value: '40 min' },
      { icon: Hourglass, label: 'Descanso', value: '15 min' },
    ],
    ingredients: ['3 cenouras médias', '3 ovos', '1 xícara de óleo', '2 xícaras de açúcar', '2 xícaras de farinha'],
    steps: [
      'Bata as cenouras, os ovos e o óleo no liquidificador.',
      'Misture o açúcar e a farinha e junte o creme batido.',
      'Asse a 180 °C por 40 minutos e cubra com a calda.',
    ],
  },
  {
    category: 'Massas',
    categoryIcon: CookingPot,
    title: 'Lasanha à bolonhesa',
    ready: '1h 35min',
    servings: '8 porções',
    difficulty: 'Médio',
    times: [
      { icon: Timer, label: 'Preparo', value: '50 min' },
      { icon: Flame, label: 'Forno', value: '35 min' },
      { icon: Hourglass, label: 'Descanso', value: '10 min' },
    ],
    ingredients: ['500 g de massa', '500 g de carne moída', '500 ml de molho', '300 g de presunto', '400 g de muçarela'],
    steps: [
      'Refogue a carne e junte o molho de tomate.',
      'Intercale massa, molho, presunto e queijo.',
      'Cubra com queijo e asse a 200 °C por 35 minutos.',
    ],
  },
  {
    category: 'Bebidas',
    categoryIcon: CupSoda,
    title: 'Limonada rosa',
    ready: '40 min',
    servings: '4 porções',
    difficulty: 'Fácil',
    times: [
      { icon: Timer, label: 'Preparo', value: '10 min' },
      { icon: Snowflake, label: 'Geladeira', value: '30 min' },
    ],
    ingredients: ['4 limões', '1 xícara de morangos', '1 litro de água', 'Açúcar a gosto', 'Folhas de hortelã'],
    steps: [
      'Bata os morangos com a água e o suco dos limões.',
      'Coe, adoce e leve à geladeira por 30 minutos.',
      'Sirva com gelo e folhas de hortelã.',
    ],
  },
]

const CHECK_EVERY_MS = 900
/** Pausa com o checklist completo antes de passar para a próxima receita. */
const HOLD_MS = 1800

/**
 * Marca os ingredientes um a um e, ao completar, passa para a próxima receita.
 * Com "reduzir movimento" no sistema, fica parado na primeira receita.
 */
function usePreviewCycle(total: number) {
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(0)
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduceMotion) return
    const ingredients = PREVIEWS[index].ingredients.length
    const timer =
      checked < ingredients
        ? setTimeout(() => setChecked((c) => c + 1), CHECK_EVERY_MS)
        : setTimeout(() => {
            setIndex((i) => (i + 1) % total)
            setChecked(0)
          }, HOLD_MS)
    return () => clearTimeout(timer)
  }, [checked, index, total, reduceMotion])

  function goTo(next: number) {
    setIndex(next)
    setChecked(0)
  }

  return { index, checked: reduceMotion ? 2 : checked, goTo }
}

export function RecipePreview() {
  const { index, checked, goTo } = usePreviewCycle(PREVIEWS.length)
  const recipe = PREVIEWS[index]

  return (
    <div className="w-full max-w-md">
      <div className="relative" aria-hidden="true">
        {/* Card de trás, inclinado: dá a ideia de uma coleção */}
        <div className="absolute inset-x-6 -top-5 bottom-6 rotate-3 rounded-3xl bg-white/70 shadow-soft" />

        <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-6"
            >
              <PreviewCard recipe={recipe} checked={checked} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {PREVIEWS.map((preview, i) => (
          <button
            key={preview.title}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ver exemplo: ${preview.title}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-blush-500' : 'w-1.5 bg-blush-300/60 hover:bg-blush-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function PreviewCard({ recipe, checked }: { recipe: PreviewRecipe; checked: number }) {
  const CategoryIcon = recipe.categoryIcon
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-blush-500 uppercase">
            <CategoryIcon className="size-3.5" /> {recipe.category}
          </p>
          <p className="mt-1 font-display text-2xl leading-tight font-semibold text-cocoa">{recipe.title}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush-50">
          <Heart className="size-4 fill-blush-500 text-blush-500" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 border-y border-line py-3 text-center">
        <Stat icon={Clock} label="Pronto em" value={recipe.ready} highlight />
        <Stat icon={Users} label="Rende" value={recipe.servings} />
        <Stat icon={ChefHat} label="Dificuldade" value={recipe.difficulty} />
      </div>

      <div className="mt-3 flex gap-2">
        {recipe.times.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex-1 rounded-xl bg-blush-50 px-2.5 py-2">
            <Icon className="size-3.5 text-blush-500" strokeWidth={2} />
            <p className="mt-1 text-[10px] text-cocoa-muted">{label}</p>
            <p className="text-xs font-semibold text-cocoa">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[1fr_1.2fr] gap-5">
        <div>
          <p className="flex items-baseline justify-between text-sm font-semibold text-cocoa">
            Ingredientes
            <span className="text-[10px] font-normal text-cocoa-muted">
              {checked}/{recipe.ingredients.length}
            </span>
          </p>
          <ul className="mt-2 space-y-1.5">
            {recipe.ingredients.map((item, index) => {
              const done = index < checked
              return (
                <li key={item} className="flex items-start gap-2">
                  <span
                    className={`mt-px grid size-3.5 shrink-0 place-items-center rounded border transition-colors duration-300 ${
                      done ? 'border-blush-500 bg-blush-500 text-white' : 'border-blush-100'
                    }`}
                  >
                    {done && <Check className="size-2.5" strokeWidth={3.5} />}
                  </span>
                  <span
                    className={`text-[11px] leading-tight transition-colors duration-300 ${
                      done ? 'text-cocoa-muted/60 line-through' : 'text-cocoa'
                    }`}
                  >
                    {item}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-cocoa">Modo de preparo</p>
          <ol className="mt-2 space-y-2">
            {recipe.steps.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="grid size-4 shrink-0 place-items-center rounded-full bg-blush-50 text-[9px] font-semibold text-blush-500">
                  {index + 1}
                </span>
                <span className="text-[11px] leading-snug text-cocoa">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  )
}

interface StatProps {
  icon: LucideIcon
  label: string
  value: string
  highlight?: boolean
}

function Stat({ icon: Icon, label, value, highlight = false }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1 not-first:border-l not-first:border-line">
      <Icon className={`size-4 ${highlight ? 'text-blush-500' : 'text-cocoa-muted'}`} strokeWidth={1.75} />
      <p className="text-[10px] text-cocoa-muted">{label}</p>
      <p className={`text-xs font-semibold ${highlight ? 'text-blush-500' : 'text-cocoa'}`}>{value}</p>
    </div>
  )
}
