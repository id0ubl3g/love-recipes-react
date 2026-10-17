import type { User } from '@supabase/supabase-js'
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

export interface AuthContextValue {
  user: User | null
  /** A sessão salva já foi lida (antes disso não dá para saber se há alguém logado). */
  ready: boolean
  /** A pessoa abriu o link de "esqueci minha senha" e precisa definir uma nova. */
  recovering: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** Devolve true quando o projeto exige confirmar o e-mail antes do primeiro acesso. */
  signUp: (name: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signInWithGoogle: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function appUrl() {
  return `${window.location.origin}${window.location.pathname}`
}

/** Traduz as mensagens mais comuns do Supabase Auth. */
export function authErrorMessage(error: { message: string; code?: string }) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos.'
    case 'email_not_confirmed':
      return 'Confirme seu e-mail antes de entrar — o link está na sua caixa de entrada.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Já existe uma conta com esse e-mail. Tente entrar.'
    case 'weak_password':
      return 'Senha fraca. Use pelo menos 6 caracteres.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
    case 'same_password':
      return 'A nova senha precisa ser diferente da anterior.'
    default:
      return error.message
  }
}

/** Mostra o erro que o OAuth devolve na URL (?error_description=...) e limpa a URL. */
function reportOAuthError() {
  const params = new URLSearchParams(window.location.search)
  if (!params.get('error')) return
  toast.error(`Não foi possível entrar: ${params.get('error_description') ?? params.get('error')}`)
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    reportOAuthError()
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'INITIAL_SESSION') setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(authErrorMessage(error))
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: appUrl() },
    })
    if (error) throw new Error(authErrorMessage(error))
    // Com "Confirm email" ligado, o Supabase não devolve sessão até o link ser clicado.
    // E-mail já cadastrado também volta sem sessão (e sem identidades), para não revelar quem tem conta.
    return { needsConfirmation: !data.session }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appUrl() } })
    if (error) throw new Error(authErrorMessage(error))
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl() })
    if (error) throw new Error(authErrorMessage(error))
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(authErrorMessage(error))
    setRecovering(false)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setRecovering(false)
    window.location.hash = '/'
  }, [])

  const value = useMemo(
    () => ({ user, ready, recovering, signIn, signUp, signInWithGoogle, sendPasswordReset, updatePassword, signOut }),
    [user, ready, recovering, signIn, signUp, signInWithGoogle, sendPasswordReset, updatePassword, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
