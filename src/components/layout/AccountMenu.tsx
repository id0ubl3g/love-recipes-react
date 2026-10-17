import { LogOut } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { CupcakeAvatar } from '../brand/CupcakeAvatar'

/** Avatar de cupcake no header, com nome, e-mail e "Sair". */
export function AccountMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) return null
  const metadata = user.user_metadata as { full_name?: string; name?: string }
  const name = metadata.full_name ?? metadata.name ?? user.email?.split('@')[0] ?? 'Você'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Sua conta"
        aria-expanded={open}
        className="size-9 overflow-hidden rounded-full ring-offset-2 transition-all hover:scale-105 hover:ring-2 hover:ring-blush-100"
      >
        <CupcakeAvatar seed={user.id} className="size-full" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 right-0 z-40 w-64 rounded-2xl border border-line bg-white p-2 shadow-lg"
          >
            <div className="flex items-center gap-3 px-3 py-2">
              <CupcakeAvatar seed={user.id} className="size-11 shrink-0 rounded-full" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-cocoa">{name}</p>
                <p className="truncate text-xs text-cocoa-muted">{user.email}</p>
              </div>
            </div>
            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-cocoa-muted transition-colors hover:bg-blush-50 hover:text-cocoa"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
