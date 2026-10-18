/** Rodapé simples; no mobile, deixa espaço para a barra de navegação fixa. */
export function Footer() {
  return (
    <footer className="border-t border-line bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <p className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-cocoa-muted sm:px-6">
        © 2026 Love Recipes. Todos os direitos reservados.
      </p>
    </footer>
  )
}
