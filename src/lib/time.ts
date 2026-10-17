import type { RecipeTimes } from '../types/recipe'

/** Tempo até a receita ficar pronta: soma de todas as etapas. */
export function totalMinutes(times: RecipeTimes) {
  return times.prep + times.oven + times.fridge + times.rest
}

/** 45 → "45 min" · 90 → "1h 30min" · 240 → "4h" */
export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`
}
