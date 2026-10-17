import { motion } from 'motion/react'
import { CupcakeIcon } from '../brand/Logo'

/** Carregamento de página inteira enquanto a sessão é verificada. */
export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-white" role="status" aria-live="polite">
      <div className="flex flex-col items-center">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
          <CupcakeIcon className="size-12 text-blush-500" />
        </motion.div>
        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-blush-300"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-cocoa-muted">Carregando receitas deliciosas...</p>
      </div>
    </div>
  )
}
