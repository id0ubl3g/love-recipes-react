import { Heart, ListChecks, Maximize2, Plus, Search, Shapes, Timer } from 'lucide-react'
import { Dialog } from '../ui/Dialog'

interface HelpModalProps {
  onClose: () => void
}

const STEPS = [
  {
    icon: Plus,
    title: 'Adicione',
    text: 'Cadastre a receita com foto, ingredientes, modo de preparo e o tempo de cada etapa.',
  },
  {
    icon: Shapes,
    title: 'Organize',
    text: 'Cada receita ganha uma categoria — doces, massas, bebidas e mais — para achar rapidinho.',
  },
  {
    icon: Search,
    title: 'Encontre',
    text: 'Toque na lupa do topo e busque pelo nome do prato ou por um ingrediente que tem em casa.',
  },
  {
    icon: Heart,
    title: 'Favorite',
    text: 'Marque com o coração as receitas que você mais faz: elas ficam no topo da tela de Receitas.',
  },
]

const TIPS = [
  {
    icon: Timer,
    title: 'Tempo por etapa',
    text: 'Veja quanto vai ao forno, à geladeira e quanto descansa — e a hora em que tudo fica pronto.',
  },
  {
    icon: ListChecks,
    title: 'Checklist de ingredientes',
    text: 'Marque cada ingrediente conforme separa. Nada fica esquecido no meio do preparo.',
  },
  {
    icon: Maximize2,
    title: 'Tela cheia',
    text: 'Abra a receita em tela cheia para acompanhar o passo a passo com calma na cozinha.',
  },
]

/** Guia rápido de uso da plataforma. */
export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <Dialog title="Como usar o Love Recipes" onClose={onClose}>
      <div className="space-y-10 px-5 pt-6 pb-10 sm:px-8">
        <section aria-labelledby="como-titulo">
          <p className="text-xs font-medium tracking-[0.2em] text-blush-500 uppercase">Como funciona</p>
          <h2 id="como-titulo" className="mt-2 font-display text-2xl font-semibold text-cocoa">
            Quatro passos, nenhum segredo
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-50 text-blush-500">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[11px] font-medium text-cocoa-muted">Passo {index + 1}</p>
                  <h3 className="font-semibold text-cocoa">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-cocoa-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="dicas-titulo" className="rounded-2xl bg-blush-50/60 px-5 py-6 sm:px-6">
          <h2 id="dicas-titulo" className="font-display text-xl font-semibold text-cocoa">
            Na hora de cozinhar
          </h2>
          <p className="mt-1 text-sm text-cocoa-muted">Ao abrir uma receita, você encontra:</p>
          <ul className="mt-5 grid gap-5 sm:grid-cols-3">
            {TIPS.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon className="size-5 text-blush-500" strokeWidth={1.75} />
                <h3 className="mt-2 text-sm font-semibold text-cocoa">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-cocoa-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Dialog>
  )
}
