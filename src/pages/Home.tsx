import { ArrowRight, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { RecentRecipesMarquee } from '../components/home/RecentRecipesMarquee'
import { useCategories } from '../hooks/useCategories'
import { useRecipes } from '../hooks/useRecipes'

const RECENT_LIMIT = 10

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.4, ease: 'easeOut' },
} as const

export function Home() {
  const { recipes, loading } = useRecipes()
  const { categories } = useCategories()

  const recent = useMemo(
    () => [...recipes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, RECENT_LIMIT),
    [recipes],
  )
  const favorites = recipes.filter((r) => r.favorite).length

  return (
    <div>
      {/* Ocupa a altura da tela (menos header e o respiro inferior do <main>),
          para que a apresentação e a faixa de receitas apareçam juntas, sem rolar. */}
      <div className="flex min-h-[calc(100dvh-10rem)] flex-col md:min-h-[calc(100dvh-8rem)]">
        <section className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-4 py-6 text-center sm:px-6">
          <motion.div {...fadeUp}>
            <p className="text-xs font-medium tracking-[0.2em] text-blush-500 uppercase">Seu livro de receitas</p>
            <h1 className="mt-3 font-display text-3xl leading-tight font-semibold text-cocoa sm:text-4xl">
              Suas receitas favoritas, organizadas com carinho.
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm text-cocoa-muted sm:text-base">
              Guarde, encontre e cozinhe sem bagunça. Suas receitas ficam na sua conta, em qualquer aparelho.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#/receitas"
                className="inline-flex items-center gap-2 rounded-full bg-blush-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blush-600"
              >
                Ver minhas receitas <ArrowRight className="size-4" />
              </a>
              <a
                href="#/nova"
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2 text-sm font-semibold text-cocoa transition-colors hover:border-blush-100 hover:bg-blush-50"
              >
                <Plus className="size-4" /> Adicionar receita
              </a>
            </div>

            {!loading && (
              <dl className="mx-auto mt-6 flex max-w-sm justify-center divide-x divide-line [@media(max-height:720px)]:hidden">
                <Stat value={recipes.length} label={recipes.length === 1 ? 'receita' : 'receitas'} />
                <Stat value={favorites} label={favorites === 1 ? 'favorita' : 'favoritas'} />
                <Stat value={categories.length} label="categorias" />
              </dl>
            )}
          </motion.div>
        </section>

        {/* Últimas receitas: só depois de carregar e se houver alguma — sem "piscar" a cada refresh. */}
        {!loading && recent.length > 0 && (
          <motion.section
            aria-labelledby="ultimas-titulo"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="pb-5"
          >
            <div className="mx-auto mb-3 flex max-w-6xl items-baseline justify-between px-4 sm:px-6">
              <h2 id="ultimas-titulo" className="font-display text-lg font-semibold text-cocoa">
                Suas últimas receitas
              </h2>
              <a href="#/receitas" className="text-sm font-medium text-blush-500 hover:text-blush-600">
                Ver todas
              </a>
            </div>
            <div className="mx-auto max-w-6xl sm:px-6">
              <RecentRecipesMarquee recipes={recent} />
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col-reverse px-4">
      <dt className="text-xs text-cocoa-muted">{label}</dt>
      <dd className="font-display text-xl font-semibold text-cocoa">{value}</dd>
    </div>
  )
}
