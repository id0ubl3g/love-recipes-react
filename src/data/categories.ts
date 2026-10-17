import {
  Apple,
  Cake,
  Candy,
  Carrot,
  Cookie,
  CookingPot,
  Croissant,
  CupSoda,
  Drumstick,
  EggFried,
  Fish,
  IceCreamCone,
  Leaf,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryId, Difficulty } from '../types/recipe'

export interface Category {
  id: CategoryId
  label: string
  icon: LucideIcon
  /** Criada pelo usuário (as padrão vêm com o app). */
  custom: boolean
}

/** Ícones que o usuário pode escolher ao criar uma categoria. A chave é o que fica salvo. */
export const CATEGORY_ICONS = {
  utensils: Utensils,
  pizza: Pizza,
  sandwich: Sandwich,
  fish: Fish,
  drumstick: Drumstick,
  carrot: Carrot,
  apple: Apple,
  cookie: Cookie,
  'ice-cream': IceCreamCone,
  soup: Soup,
  wine: Wine,
  leaf: Leaf,
} satisfies Record<string, LucideIcon>

export type CategoryIconKey = keyof typeof CATEGORY_ICONS

export const CATEGORY_ICON_LABEL: Record<CategoryIconKey, string> = {
  utensils: 'Talheres',
  pizza: 'Pizza',
  sandwich: 'Sanduíche',
  fish: 'Peixe',
  drumstick: 'Frango',
  carrot: 'Cenoura',
  apple: 'Maçã',
  cookie: 'Biscoito',
  'ice-cream': 'Sorvete',
  soup: 'Sopa',
  wine: 'Vinho',
  leaf: 'Folha',
}

export const DEFAULT_CATEGORY_ICON: CategoryIconKey = 'utensils'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'doces', label: 'Doces', icon: Candy, custom: false },
  { id: 'bolos', label: 'Bolos', icon: Cake, custom: false },
  { id: 'salgados', label: 'Salgados', icon: Croissant, custom: false },
  { id: 'massas', label: 'Massas', icon: CookingPot, custom: false },
  { id: 'saudaveis', label: 'Saudáveis', icon: Salad, custom: false },
  { id: 'cafe-da-manha', label: 'Café da manhã', icon: EggFried, custom: false },
  { id: 'bebidas', label: 'Bebidas', icon: CupSoda, custom: false },
]

/** Valor do filtro "Sem categoria" na tela de Receitas (não é uma categoria de verdade). */
export const UNCATEGORIZED_FILTER = '__sem-categoria__'

/** Usada quando uma receita aponta para uma categoria que não existe mais. */
export const UNKNOWN_CATEGORY: Category = { id: '', label: 'Sem categoria', icon: Utensils, custom: false }

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
}
