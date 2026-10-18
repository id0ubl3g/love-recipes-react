import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Logo } from '../brand/Logo'
import { RecipePreview } from './RecipePreview'

interface AuthLayoutProps {
  children: ReactNode
}

/** Tela dividida: prévia do app à esquerda (desktop) e formulário à direita. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-2">
      <aside className="relative hidden flex-col overflow-hidden bg-blush-50 p-12 lg:flex">
        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center py-10">
          <RecipePreview />
        </div>

        <div className="absolute -right-24 -bottom-24 size-72 rounded-full bg-blush-100/60" aria-hidden="true" />
        <div className="absolute -top-16 -left-16 size-48 rounded-full bg-blush-100/40" aria-hidden="true" />
      </aside>

      <main className="flex flex-col px-6 py-10 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10"
        >
          {children}
        </motion.div>
        <footer className="text-center text-xs text-cocoa-muted">
          © 2026 Love Recipes. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  )
}
