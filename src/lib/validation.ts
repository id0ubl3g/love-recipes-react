/*
 * Regras dos formulários de conta. Servem para orientar a pessoa antes de enviar;
 * a validação que vale de verdade acontece no Supabase Auth.
 */

export const NAME_MIN = 2
export const NAME_MAX = 50
export const EMAIL_MAX = 254
export const PASSWORD_MIN = 8
/** Abaixo do limite do Supabase Auth (72 bytes, bcrypt), com folga para acentos. */
export const PASSWORD_MAX = 64

/** Letras (com acento), espaços, apóstrofo, hífen e ponto — "Ana Luíza", "D'Ávila", "Jr.". */
const NAME_PATTERN = /^[\p{L}\p{M}' .-]+$/u

/** Formato de e-mail prático: parte local, @, domínio com pelo menos um ponto e TLD de 2+ letras. */
const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function validateName(name: string): string | null {
  const value = normalizeName(name)
  if (!value) return 'Conte como podemos te chamar.'
  if (value.length < NAME_MIN) return `O nome precisa ter pelo menos ${NAME_MIN} letras.`
  if (value.length > NAME_MAX) return `O nome pode ter no máximo ${NAME_MAX} caracteres.`
  if (!NAME_PATTERN.test(value)) return 'Use só letras no nome (sem números ou símbolos).'
  return null
}

export function validateEmail(email: string): string | null {
  const value = normalizeEmail(email)
  if (!value) return 'Digite seu e-mail.'
  if (value.length > EMAIL_MAX) return 'Esse e-mail é longo demais.'
  if (!EMAIL_PATTERN.test(value) || value.includes('..')) return 'Digite um e-mail válido, como voce@email.com.'
  return null
}

export interface PasswordRule {
  label: string
  test: (password: string) => boolean
}

/**
 * Regras de senha forte — exibidas como checklist ao vivo no cadastro e na redefinição.
 * Espelham a opção "Lowercase, uppercase letters, digits and symbols" do Supabase Auth,
 * que só conta a-z / A-Z e esta lista de símbolos; assim o app nunca aprova o que o servidor recusa.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    label: `De ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres`,
    test: (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX,
  },
  { label: 'Uma letra minúscula (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Uma letra maiúscula (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Um número', test: (p) => /[0-9]/.test(p) },
  { label: 'Um símbolo, como ! @ # $ %', test: (p) => /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/.test(p) },
]

/** Regras para senha nova (cadastro e redefinição). No login só exigimos que não esteja vazia. */
export function validateNewPassword(password: string): string | null {
  return PASSWORD_RULES.every((rule) => rule.test(password))
    ? null
    : 'A senha ainda não cumpre todos os requisitos abaixo.'
}
