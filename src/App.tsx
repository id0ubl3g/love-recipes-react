import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Toaster } from 'sonner'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { Splash } from './components/layout/Splash'
import { RecipeModal } from './components/recipe/RecipeModal'
import { AuthProvider } from './context/AuthContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { RecipesProvider } from './context/RecipesContext'
import { useAuth } from './hooks/useAuth'
import { recipeIdFromRoute, useHashRoute, type Route } from './hooks/useHashRoute'
import { AuthPage } from './pages/AuthPage'
import { Home } from './pages/Home'
import { NewRecipe } from './pages/NewRecipe'
import { Recipes } from './pages/Recipes'
import { ResetPassword } from './pages/ResetPassword'

type Page = '/' | '/receitas' | '/nova'

export default function App() {
  return (
    <AuthProvider>
      <Gate />
      {/* Canto inferior direito, longe do menu; no mobile, acima da barra de navegação. */}
      <Toaster
        position="bottom-right"
        mobileOffset={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        swipeDirections={['right', 'left']}
        closeButton
        toastOptions={{
          classNames: {
            toast: '!rounded-2xl !border-line !font-sans !text-cocoa !shadow-soft',
            closeButton: '!border-line !bg-white !text-cocoa-muted hover:!text-cocoa',
          },
        }}
      />
    </AuthProvider>
  )
}

/** Decide o que mostrar: carregando, login, nova senha ou o app. */
function Gate() {
  const { user, ready, recovering } = useAuth()
  if (!ready) return <Splash />
  if (recovering) return <ResetPassword />
  if (!user) return <AuthPage />
  // A key recria os dados ao trocar de conta, sem sobras do usuário anterior.
  return (
    <CategoriesProvider key={user.id}>
      <RecipesProvider>
        <AppShell />
      </RecipesProvider>
    </CategoriesProvider>
  )
}

function AppShell() {
  const route = useHashRoute()
  const recipeId = recipeIdFromRoute(route)

  // Com o popup aberto, a página de onde ele saiu continua por trás.
  // Num link direto para a receita, o fundo é a tela de Receitas.
  const [backgroundPage, setBackgroundPage] = useState<Page>('/receitas')
  const page: Page = recipeId !== null ? backgroundPage : (route as Page)
  useEffect(() => {
    if (recipeId === null) setBackgroundPage(route as Page)
  }, [route, recipeId])

  // Se o popup foi aberto de dentro do app, fechar = voltar no histórico (a página mantém a rolagem).
  // Se veio de um link direto, não há para onde voltar: troca a URL pela página de fundo.
  const openedInApp = useRef(false)
  const previousRoute = useRef<Route | null>(null)
  useEffect(() => {
    if (recipeId === null) openedInApp.current = false
    else if (previousRoute.current !== null && recipeIdFromRoute(previousRoute.current) === null)
      openedInApp.current = true
    previousRoute.current = route
  }, [route, recipeId])

  const pageRef = useRef(page)
  pageRef.current = page
  const closeRecipe = useCallback(() => {
    if (openedInApp.current) window.history.back()
    else window.location.replace(`#${pageRef.current}`)
  }, [])

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <Header route={page} />
        <main className="flex-1 pb-16">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {page === '/' && <Home />}
              {page === '/receitas' && <Recipes />}
              {page === '/nova' && <NewRecipe />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {/* Fora do bloco de altura mínima da tela: só aparece ao rolar. */}
      <Footer />

      <AnimatePresence>
        {recipeId !== null && <RecipeModal key={recipeId} id={recipeId} onClose={closeRecipe} />}
      </AnimatePresence>
    </>
  )
}
