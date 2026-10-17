import { CircleHelp, House, Plus, PlusCircle, Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import type { Route } from '../../hooks/useHashRoute'
import { CupcakeIcon, Logo } from '../brand/Logo'
import { AccountMenu } from './AccountMenu'
import { HelpModal } from '../help/HelpModal'
import { SearchOverlay } from '../search/SearchOverlay'

interface HeaderProps {
  route: Route
}

const NAV_LINKS: { route: Route; label: string }[] = [
  { route: '/', label: 'Início' },
  { route: '/receitas', label: 'Receitas' },
]

export function Header({ route }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const closeHelp = useCallback(() => setHelpOpen(false), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  // Navegar para outra página fecha a busca.
  useEffect(() => setSearchOpen(false), [route])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          <nav className="hidden h-full items-center gap-8 md:flex" aria-label="Principal">
            {NAV_LINKS.map((link) => {
              const active = route === link.route
              return (
                <a
                  key={link.route}
                  href={`#${link.route}`}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex h-full items-center text-sm font-medium transition-colors duration-300 ${
                    active ? 'text-blush-500' : 'text-cocoa-muted hover:text-cocoa'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blush-500"
                    />
                  )}
                </a>
              )
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Como usar o Love Recipes"
              title="Ajuda"
              className="grid size-10 place-items-center rounded-full text-cocoa-muted transition-colors hover:bg-blush-50 hover:text-cocoa"
            >
              <CircleHelp className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? 'Fechar busca' : 'Buscar receitas'}
              aria-expanded={searchOpen}
              aria-controls="search-panel"
              className="grid size-10 place-items-center rounded-full text-cocoa-muted transition-colors hover:bg-blush-50 hover:text-cocoa"
            >
              {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </button>
            <a
              href="#/nova"
              className="ml-2 hidden items-center gap-1.5 rounded-full bg-blush-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blush-600 md:flex"
            >
              <Plus className="size-4" />
              Nova receita
            </a>
            <div className="ml-2">
              <AccountMenu />
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>{searchOpen && <SearchOverlay onClose={closeSearch} />}</AnimatePresence>
      <AnimatePresence>{helpOpen && <HelpModal onClose={closeHelp} />}</AnimatePresence>

      {/* Navegação inferior no mobile — alcance do polegar */}
      <nav
        aria-label="Principal (mobile)"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid grid-cols-3">
          <MobileLink href="#/" label="Início" active={route === '/'} icon={<House className="size-5" />} />
          <MobileLink
            href="#/receitas"
            label="Receitas"
            active={route === '/receitas'}
            icon={<CupcakeIcon className="size-5" />}
          />
          <MobileLink
            href="#/nova"
            label="Adicionar"
            active={route === '/nova'}
            icon={<PlusCircle className="size-5" />}
          />
        </ul>
      </nav>
    </>
  )
}

interface MobileLinkProps {
  href: string
  label: string
  active: boolean
  icon: React.ReactNode
}

function MobileLink({ href, label, active, icon }: MobileLinkProps) {
  return (
    <li>
      <a
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-300 ${
          active ? 'text-blush-500' : 'text-cocoa-muted'
        }`}
      >
        {active && (
          <motion.span
            layoutId="mobile-nav-indicator"
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className="absolute inset-x-6 -top-px h-0.5 rounded-full bg-blush-500"
          />
        )}
        {icon}
        {label}
      </a>
    </li>
  )
}
