/** Minúsculas e sem acentos, para comparar buscas ("Pão" encontra "pao"). */
export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
