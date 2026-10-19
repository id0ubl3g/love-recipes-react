import { useEffect, useRef, useState } from 'react'

export type Route = '/' | '/receitas' | '/nova' | `/receita/${string}` | `/receita/${string}/editar`

const STATIC_ROUTES: Route[] = ['/', '/receitas', '/nova']

function readRoute(): Route {
  const path = window.location.hash.replace(/^#/, '') || '/'
  if (/^\/receita\/[^/]+(\/editar)?$/.test(path)) return path as Route
  return STATIC_ROUTES.includes(path as Route) ? (path as Route) : '/'
}

/** Id da receita quando a rota é o popup de detalhe. */
export function recipeIdFromRoute(route: Route) {
  const match = route.match(/^\/receita\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Id da receita quando a rota é a tela de edição. */
export function editIdFromRoute(route: Route) {
  const match = route.match(/^\/receita\/([^/]+)\/editar$/)
  return match ? decodeURIComponent(match[1]) : null
}

export function recipeHref(id: string) {
  return `#/receita/${encodeURIComponent(id)}`
}

export function editRecipeHref(id: string) {
  return `${recipeHref(id)}/editar`
}

/** Roteamento mínimo por hash — suficiente até decidirmos por um router de verdade. */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(readRoute)
  const current = useRef(route)

  useEffect(() => {
    const onChange = () => {
      const previous = current.current
      const next = readRoute()
      current.current = next
      // Abrir/fechar o popup de receita não deve mexer na rolagem da página de fundo.
      // A edição é uma página própria e sempre começa do topo.
      const involvesPopup = recipeIdFromRoute(previous) !== null || recipeIdFromRoute(next) !== null
      if (!involvesPopup || editIdFromRoute(next) !== null) window.scrollTo({ top: 0 })
      setRoute(next)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
