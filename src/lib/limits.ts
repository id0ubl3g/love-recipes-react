/*
 * Limites de conteúdo. Os mesmos números são garantidos no banco
 * (supabase/migrations/20261017120000_init.sql e 20261017150000_content_limits.sql) — mude os dois juntos.
 */
export const LIMITS = {
  title: 80,
  description: 160,
  categoryLabel: 24,
  categoriesPerUser: 20,
  ingredients: { maxItems: 50, maxLength: 150 },
  steps: { maxItems: 30, maxLength: 600 },
} as const
